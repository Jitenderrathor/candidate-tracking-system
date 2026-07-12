const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const path = require('node:path');
const { Readable } = require('node:stream');
const AppError = require('../../common/errors/AppError');
const Candidate = require('../candidates/candidate.model');
const CandidateCounter = require('../candidates/candidateCounter.model');
const {
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
  GENDERS,
} = require('../candidates/candidate.constants');
const activityLogService = require('../activity-logs/activityLog.service');
const { TRANSACTION_OPTIONS } = require('../../config/database');
const genderDetection = require('gender-detection-from-name');

const MAX_ROWS = 10000;
const LEGACY_HEADERS = Object.freeze([
  'First Name', 'Last Name', 'Gender', 'Date Of Birth', 'Email', 'Mobile',
  'Address', 'Qualification', 'Experience', 'Current Company', 'Current CTC',
  'Expected CTC', 'Skills', 'Resume URL', 'Source', 'Remarks',
]);
const PROFILE_HEADERS = Object.freeze([
  'Date', 'Type', 'Name', 'Email', 'Phone', 'LinkedIn Profile', 'Hear',
  'File Name', 'File Type', 'File URL', 'Status', 'Feedback', '#REF!',
]);
const HEADERS = PROFILE_HEADERS;
const PROFILE_HEADER_ALIASES = Object.freeze({
  Date: ['date', 'registration date', 'registered date', 'timestamp'],
  Type: ['type', 'application type', 'job type'],
  Name: ['name', 'full name', 'candidate name'],
  Email: ['email', 'email address'],
  Phone: ['phone', 'mobile', 'mobile number', 'phone number', 'contact number'],
  'LinkedIn Profile': ['linkedin profile', 'linkedin', 'linkedin url', 'linkedin profile url'],
  Hear: ['hear', 'source', 'recruitment source', 'how did you hear about us'],
  'File Name': ['file name', 'filename', 'resume file name', 'resume name'],
  'File Type': ['file type', 'resume file type', 'mime type'],
  'File URL': ['file url', 'resume url', 'resume link', 'drive url', 'google drive url', 'cv', 'cv link', 'cv url', 'drive link', 'resume'],
  Status: ['status', 'reference status'],
  Feedback: ['feedback', 'remarks', 'comments', 'recruiter feedback'],
  '#REF!': ['#ref!', '#ref', 'ref', 'recruitment status', 'candidate status'],
  'Lead ID': ['id', 'lead id'],
  'Created Time': ['created time', 'created at'],
  'Ad Name': ['ad name'],
  'Campaign Name': ['campaign name'],
  'Form Name': ['form name'],
  Platform: ['platform'],
  'Sales Interest': ['are you interested in a sales position?'],
  'Sales Experience': ['how many years of experience do you have in sales'],
  'Phone Verified': ['phone number verified', 'phone verified'],
});
const REQUIRED_PROFILE_HEADERS = Object.freeze(['Name', 'Email', 'Phone']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\+?[1-9]\d{6,14}$/;
const URL_PATTERN = /^https?:\/\/[^\s]+$/i;

const cellValue = (cell) => {
  const value = cell?.value;
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;
  if (value.result !== undefined) return value.result;
  if (value.hyperlink !== undefined) return value.hyperlink;
  if (value.text !== undefined) return value.text;
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
  return cell.text || '';
};

const text = (value) => String(value ?? '').trim();
const optionalText = (value) => {
  const result = text(value);
  return /^(n\/?a|none|null|-|not available|no resume|nil)$/i.test(result) ? '' : result;
};
const normalizedUrl = (value) => {
  const result = optionalText(value);
  if (URL_PATTERN.test(result)) return result;
  if (/^www\./i.test(result)) return `https://${result}`;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(result)) return `https://${result}`;
  return '';
};
const normalizedHeader = (value) => text(value)
  .replace(/^\uFEFF/, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .toLowerCase();

const profileHeaderLookup = new Map(Object.entries(PROFILE_HEADER_ALIASES).flatMap(
  ([header, aliases]) => aliases.map((alias) => [normalizedHeader(alias), header]),
));

const parseDate = (value) => {
  if (value instanceof Date) return new Date(value);
  if (typeof value === 'number') return new Date(Math.round((value - 25569) * 86400 * 1000));
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseNumber = (value, fallback) => {
  if (text(value) === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseWorkbook = async (buffer, fileName = '') => {
  const workbook = new ExcelJS.Workbook();
  let worksheet;
  try {
    if (path.extname(fileName).toLowerCase() === '.csv') {
      const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
      const isUtf16Le = (sample[0] === 0xff && sample[1] === 0xfe)
        || sample.filter((byte, index) => index % 2 === 1 && byte === 0).length > sample.length / 8;
      const csvBuffer = isUtf16Le
        ? Buffer.from(buffer.toString('utf16le').replace(/^\uFEFF/, ''), 'utf8')
        : buffer;
      const firstLine = csvBuffer.toString('utf8', 0, Math.min(csvBuffer.length, 8192)).split(/\r?\n/, 1)[0];
      const delimiter = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length
        ? '\t'
        : ',';
      worksheet = await workbook.csv.read(Readable.from(csvBuffer), { parserOptions: { delimiter } });
    } else {
      await workbook.xlsx.load(buffer);
      [worksheet] = workbook.worksheets;
    }
  } catch (_error) {
    throw new AppError('The uploaded file is not a valid .xlsx or .csv file', 422, {
      code: 'INVALID_WORKBOOK',
    });
  }

  if (!worksheet) {
    throw new AppError('The spreadsheet must contain at least one worksheet', 422, {
      code: 'EMPTY_WORKBOOK',
    });
  }

  let headerRowNumber = 0;
  let headerIndexes;
  let format;
  for (const candidateWorksheet of workbook.worksheets) {
    const scanLimit = Math.min(Math.max(candidateWorksheet.rowCount, 1), 25);
    for (let rowNumber = 1; rowNumber <= scanLimit; rowNumber += 1) {
      const exactIndexes = new Map();
      const profileIndexes = new Map();
      candidateWorksheet.getRow(rowNumber).eachCell(
        { includeEmpty: false },
        (cell, columnNumber) => {
          const header = text(cellValue(cell));
          exactIndexes.set(header, columnNumber);
          const profileHeader = profileHeaderLookup.get(normalizedHeader(header));
          if (profileHeader && !profileIndexes.has(profileHeader)) {
            profileIndexes.set(profileHeader, columnNumber);
          }
        },
      );
      if (LEGACY_HEADERS.every((header) => exactIndexes.has(header))) {
        headerRowNumber = rowNumber;
        headerIndexes = exactIndexes;
        format = 'legacy';
        break;
      }
      if (REQUIRED_PROFILE_HEADERS.every((header) => profileIndexes.has(header))) {
        headerRowNumber = rowNumber;
        headerIndexes = profileIndexes;
        format = 'profile';
        break;
      }
    }
    if (headerIndexes) {
      worksheet = candidateWorksheet;
      break;
    }
  }

  if (!headerIndexes) {
    throw new AppError('The workbook is missing required columns', 422, {
      code: 'INVALID_EXCEL_HEADERS',
      details: REQUIRED_PROFILE_HEADERS,
    });
  }

  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return;
    const headers = format === 'profile' ? Object.keys(PROFILE_HEADER_ALIASES) : LEGACY_HEADERS;
    const hasData = headers.some((header) => {
      const columnNumber = headerIndexes.get(header);
      return columnNumber && text(cellValue(row.getCell(columnNumber))) !== '';
    });
    if (!hasData) return;
    if (rows.length >= MAX_ROWS) {
      throw new AppError(`Excel import supports a maximum of ${MAX_ROWS} data rows`, 413, {
        code: 'ROW_LIMIT_EXCEEDED',
      });
    }
    const values = {};
    headers.forEach((header) => {
      const columnNumber = headerIndexes.get(header);
      values[header] = columnNumber ? cellValue(row.getCell(columnNumber)) : '';
    });
    rows.push({ rowNumber, values, format });
  });
  return rows;
};

const normalizeSource = (value) => {
  const source = text(value);
  const platformSources = { ig: 'Instagram', instagram: 'Instagram', fb: 'Facebook', facebook: 'Facebook' };
  if (platformSources[source.toLowerCase()]) return platformSources[source.toLowerCase()];
  return CANDIDATE_SOURCES.find((candidateSource) => (
    candidateSource.toLowerCase() === source.toLowerCase()
  )) || 'Other';
};

const normalizeRecruitmentStatus = (value) => {
  const originalStatus = optionalText(value);
  const status = originalStatus.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  if (!status) return null;
  if (status === 'dnp' || status === 'do not proceed') return 'Rejected';
  const statuses = [...CANDIDATE_STATUSES, 'Rejected'];
  return statuses.find((candidateStatus) => candidateStatus.toLowerCase() === status)
    || originalStatus;
};

const splitName = (value) => {
  const parts = text(value).split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' ') || '-',
  };
};

const detectGender = (firstName) => {
  if (!firstName) return 'Prefer not to say';
  const result = genderDetection.getGender(firstName);
  if (result === 'male') return 'Male';
  if (result === 'female') return 'Female';
  return 'Prefer not to say';
};

const validateProfileRow = ({ rowNumber, values }) => {
  const errors = [];
  const registrationDate = parseDate(values.Date);
  const fullName = text(values.Name);
  const email = text(values.Email).toLowerCase();
  const mobile = text(values.Phone).replace(/^p:/i, '').replace(/[\s()-]/g, '');
  const linkedInProfile = normalizedUrl(values['LinkedIn Profile']);
  const resumeUrl = normalizedUrl(values['File URL']);
  const recruitmentStatus = normalizeRecruitmentStatus(values['#REF!'])
    || (!text(values['#REF!']) ? normalizeRecruitmentStatus(values.Status) : null);
  const { firstName, lastName } = splitName(fullName);
  const salesInterest = optionalText(values['Sales Interest']);
  const salesExperience = optionalText(values['Sales Experience']);
  const phoneVerifiedText = optionalText(values['Phone Verified']).toLowerCase();
  const generatedFeedback = [
    salesInterest && `Interested in sales: ${salesInterest}`,
    salesExperience && `Sales experience: ${salesExperience}`,
    phoneVerifiedText && `Phone verified: ${phoneVerifiedText}`,
  ].filter(Boolean).join('\n');

  if (text(values.Date) && !registrationDate) errors.push('Invalid Date');
  if (!fullName) errors.push('Missing Name');
  if (!email) errors.push('Missing Email');
  else if (!EMAIL_PATTERN.test(email)) errors.push('Invalid Email');
  if (!mobile) errors.push('Missing Phone');
  else if (!MOBILE_PATTERN.test(mobile)) errors.push('Invalid Phone');
  if (linkedInProfile && !URL_PATTERN.test(linkedInProfile)) errors.push('Invalid LinkedIn Profile');
  if (resumeUrl && !URL_PATTERN.test(resumeUrl)) errors.push('Invalid File URL');
  if (fullName.length > 200) errors.push('Name exceeds 200 characters');
  if (text(values.Type).length > 100) errors.push('Type exceeds 100 characters');
  if (text(values['File Name']).length > 255) errors.push('File Name exceeds 255 characters');
  if (text(values['File Type']).length > 100) errors.push('File Type exceeds 100 characters');
  if (text(values.Status).length > 200) errors.push('Status exceeds 200 characters');
  if (text(values.Feedback).length > 2000) errors.push('Feedback exceeds 2000 characters');

  return {
    rowNumber,
    errors,
    candidate: {
      registrationDate: registrationDate || parseDate(values['Created Time']),
      applicationType: optionalText(values.Type) || optionalText(values['Form Name'])
        || optionalText(values['Ad Name']),
      externalLeadId: optionalText(values['Lead ID']).replace(/^l:/i, ''),
      campaignName: optionalText(values['Campaign Name']),
      adName: optionalText(values['Ad Name']),
      formName: optionalText(values['Form Name']),
      salesInterest,
      salesExperience,
      phoneVerified: phoneVerifiedText ? phoneVerifiedText === 'true' : null,
      fullName,
      firstName,
      lastName,
      email,
      mobile,
      linkedInProfile,
      source: normalizeSource(values.Hear || values.Platform),
      resumeFileName: optionalText(values['File Name']),
      resumeFileType: optionalText(values['File Type']),
      resumeUrl,
      referenceStatus: optionalText(values.Status),
      feedback: optionalText(values.Feedback) || generatedFeedback,
      recruitmentStatus: recruitmentStatus || 'Registered',
      status: CANDIDATE_STATUSES.includes(recruitmentStatus) ? recruitmentStatus : 'Registered',
      gender: detectGender(firstName),
    },
  };
};

const validateLegacyRow = ({ rowNumber, values }) => {
  const errors = [];
  const requiredText = (header) => {
    const value = text(values[header]);
    if (!value) errors.push(`Missing ${header}`);
    return value;
  };

  const firstName = requiredText('First Name');
  const lastName = requiredText('Last Name');
  const email = requiredText('Email').toLowerCase();
  const mobile = requiredText('Mobile');
  const address = requiredText('Address');
  const qualification = requiredText('Qualification');
  const source = requiredText('Source');
  const dateOfBirth = parseDate(values['Date Of Birth']);
  const experienceYears = parseNumber(values.Experience, null);
  const currentCTC = parseNumber(values['Current CTC'], 0);
  const expectedCTC = parseNumber(values['Expected CTC'], 0);
  const skills = text(values.Skills).split(',').map((skill) => skill.trim()).filter(Boolean);
  const resumeUrl = text(values['Resume URL']);

  let gender = text(values.Gender);
  if (!gender) gender = detectGender(firstName);

  if (!text(values['Date Of Birth'])) errors.push('Missing Date Of Birth');
  else if (!dateOfBirth || dateOfBirth >= new Date()) errors.push('Invalid Date Of Birth');
  if (gender && !GENDERS.includes(gender)) errors.push('Invalid Gender');
  if (firstName.length > 100) errors.push('First Name exceeds 100 characters');
  if (lastName.length > 100) errors.push('Last Name exceeds 100 characters');
  if (email && !EMAIL_PATTERN.test(email)) errors.push('Invalid Email');
  if (email.length > 254) errors.push('Email exceeds 254 characters');
  if (mobile && !MOBILE_PATTERN.test(mobile)) errors.push('Invalid Mobile');
  if (address.length > 500) errors.push('Address exceeds 500 characters');
  if (qualification.length > 200) errors.push('Qualification exceeds 200 characters');
  if (experienceYears === null) errors.push(text(values.Experience) ? 'Invalid Experience' : 'Missing Experience');
  else if (experienceYears < 0 || experienceYears > 80) errors.push('Invalid Experience');
  if (currentCTC === null || currentCTC < 0) errors.push('Invalid Current CTC');
  if (expectedCTC === null || expectedCTC < 0) errors.push('Invalid Expected CTC');
  if (!skills.length) errors.push('Missing Skills');
  if (skills.length > 100) errors.push('Skills exceeds 100 entries');
  if (skills.some((skill) => skill.length > 100)) errors.push('A skill exceeds 100 characters');
  if (resumeUrl && !URL_PATTERN.test(resumeUrl)) errors.push('Invalid Resume URL');
  if (source && !CANDIDATE_SOURCES.includes(source)) errors.push('Invalid Source');
  if (text(values['Current Company']).length > 200) {
    errors.push('Current Company exceeds 200 characters');
  }
  if (text(values.Remarks).length > 2000) errors.push('Remarks exceeds 2000 characters');

  return {
    rowNumber,
    errors,
    candidate: {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      email,
      mobile,
      address,
      qualification,
      experienceYears,
      currentCompany: text(values['Current Company']),
      currentCTC,
      expectedCTC,
      skills,
      resumeUrl,
      source,
      remarks: text(values.Remarks),
      status: 'Registered',
    },
  };
};

const validateRow = (row) => (
  row.format === 'profile' || Object.prototype.hasOwnProperty.call(row.values, 'Name')
    ? validateProfileRow(row)
    : validateLegacyRow(row)
);

const createExcelImportService = ({
  CandidateModel = Candidate,
  CounterModel = CandidateCounter,
  auditService = activityLogService,
  startSession = mongoose.startSession,
  workbookParser = parseWorkbook,
} = {}) => {
  const findExistingContacts = async (rows, session) => {
    if (!rows.length) return [];
    const emails = rows.map(({ candidate }) => candidate.email);
    const mobiles = rows.map(({ candidate }) => candidate.mobile);
    return CandidateModel.find({
      isDeleted: false,
      $or: [{ email: { $in: emails } }, { mobile: { $in: mobiles } }],
    }).select('email mobile').session(session).lean();
  };

  const importCandidates = async ({ buffer, fileName, actor, requestContext }) => {
    await auditService.logExcelImportStarted({
      userId: actor.id,
      fileName,
      occurredAt: new Date(),
      ...requestContext,
    });

    const parsedRows = await workbookParser(buffer, fileName);
    const validationErrors = [];
    const uniqueRows = [];
    const seenEmails = new Set();
    const seenMobiles = new Set();
    let duplicateEmails = 0;
    let duplicateMobiles = 0;

    parsedRows.forEach((row) => {
      const validated = validateRow(row);
      if (validated.errors.length) {
        validationErrors.push({ row: row.rowNumber, errors: validated.errors });
        return;
      }
      const emailDuplicate = seenEmails.has(validated.candidate.email);
      const mobileDuplicate = seenMobiles.has(validated.candidate.mobile);
      if (emailDuplicate || mobileDuplicate) {
        const errors = [];
        if (emailDuplicate) { duplicateEmails += 1; errors.push('Duplicate Email'); }
        if (mobileDuplicate) { duplicateMobiles += 1; errors.push('Duplicate Mobile'); }
        validationErrors.push({ row: row.rowNumber, errors });
        return;
      }
      seenEmails.add(validated.candidate.email);
      seenMobiles.add(validated.candidate.mobile);
      uniqueRows.push(validated);
    });

    const session = await startSession();
    let transactionResult = {
      imported: 0,
      skipped: parsedRows.length,
      duplicateEmails: 0,
      duplicateMobiles: 0,
      validationErrors: [],
    };
    try {
      await session.withTransaction(async () => {
        const existingCandidates = await findExistingContacts(uniqueRows, session);
        const existingEmails = new Set(existingCandidates.map((candidate) => candidate.email));
        const existingMobiles = new Set(existingCandidates.map((candidate) => candidate.mobile));
        const databaseValidationErrors = [];
        let databaseDuplicateEmails = 0;
        let databaseDuplicateMobiles = 0;
        const importableRows = uniqueRows.filter((row) => {
          const emailDuplicate = existingEmails.has(row.candidate.email);
          const mobileDuplicate = existingMobiles.has(row.candidate.mobile);
          if (!emailDuplicate && !mobileDuplicate) return true;
          const errors = [];
          if (emailDuplicate) { databaseDuplicateEmails += 1; errors.push('Duplicate Email'); }
          if (mobileDuplicate) { databaseDuplicateMobiles += 1; errors.push('Duplicate Mobile'); }
          databaseValidationErrors.push({ row: row.rowNumber, errors });
          return false;
        });

        if (importableRows.length) {
          const counter = await CounterModel.findOneAndUpdate(
            { _id: 'candidateId' },
            { $inc: { sequence: importableRows.length } },
            { new: true, upsert: true, setDefaultsOnInsert: true, session },
          );
          const firstSequence = counter.sequence - importableRows.length + 1;
          if (counter.sequence > 999999) {
            throw new AppError('Candidate ID sequence limit has been reached', 409, {
              code: 'CANDIDATE_ID_LIMIT_REACHED',
            });
          }
          const documents = importableRows.map(({ candidate }, index) => ({
            ...candidate,
            candidateId: `CRTS${String(firstSequence + index).padStart(6, '0')}`,
            createdBy: actor.id,
            updatedBy: actor.id,
          }));
          await CandidateModel.insertMany(documents, { session, ordered: true });
        }

        await auditService.logExcelImportCompleted({
          userId: actor.id,
          fileName,
          importedCount: importableRows.length,
          skippedCount: parsedRows.length - importableRows.length,
          occurredAt: new Date(),
          ...requestContext,
        }, session);

        transactionResult = {
          imported: importableRows.length,
          skipped: parsedRows.length - importableRows.length,
          duplicateEmails: databaseDuplicateEmails,
          duplicateMobiles: databaseDuplicateMobiles,
          validationErrors: databaseValidationErrors,
        };
      }, TRANSACTION_OPTIONS);
    } finally {
      await session.endSession();
    }

    duplicateEmails += transactionResult.duplicateEmails;
    duplicateMobiles += transactionResult.duplicateMobiles;
    validationErrors.push(...transactionResult.validationErrors);

    return {
      totalRows: parsedRows.length,
      imported: transactionResult.imported,
      skipped: transactionResult.skipped,
      duplicateEmails,
      duplicateMobiles,
      validationErrors: validationErrors.sort((a, b) => a.row - b.row),
    };
  };

  return { importCandidates };
};

module.exports = Object.assign(createExcelImportService(), {
  HEADERS,
  LEGACY_HEADERS,
  MAX_ROWS,
  PROFILE_HEADERS,
  createExcelImportService,
  parseWorkbook,
  validateProfileRow,
  validateRow,
});
