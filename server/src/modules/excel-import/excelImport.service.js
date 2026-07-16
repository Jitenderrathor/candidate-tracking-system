const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const path = require('node:path');
const { Readable } = require('node:stream');
const AppError = require('../../common/errors/AppError');
const Candidate = require('../candidates/candidate.model');
const CandidateCounter = require('../candidates/candidateCounter.model');
const ImportHistory = require('./importHistory.model');
const {
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
  GENDERS,
} = require('../candidates/candidate.constants');
const activityLogService = require('../activity-logs/activityLog.service');
const { TRANSACTION_OPTIONS } = require('../../config/database');
const { bulkPredictGenders, detectGenderWithCache } = require('../../common/utils/genderPrediction');

const MAX_ROWS = 10000;
const LEGACY_HEADERS = Object.freeze([
  'First Name', 'Last Name', 'Gender', 'Date Of Birth', 'Email', 'Mobile',
  'Address', 'Qualification', 'Experience', 'Current Company', 'Current CTC',
  'Expected CTC', 'Skills', 'Resume URL', 'Source', 'Remarks',
]);
const PROFILE_HEADERS = Object.freeze([
  'Date', 'Name', 'Email', 'Phone', 'Source', 'Gender', 'Resume',
  'Status', 'Feedback', 'LinkedIn', 'Experience',
]);
const HEADERS = PROFILE_HEADERS;
const PROFILE_HEADER_ALIASES = Object.freeze({
  Date: ['date', 'registration date', 'registered date', 'timestamp'],
  Name: ['name', 'full name', 'candidate name'],
  Email: ['email', 'email address'],
  Phone: ['phone', 'mobile', 'mobile number', 'phone number', 'contact number'],
  Source: ['source', 'hear', 'recruitment source', 'how did you hear about us', 'platform'],
  Gender: ['gender', 'sex'],
  Resume: ['resume', 'resume link', 'file url', 'resume url', 'drive url', 'google drive url', 'cv', 'cv link', 'cv url', 'drive link'],
  Status: ['status', 'reference status', 'recruitment status', 'candidate status', '#ref!', '#ref', 'ref'],
  Feedback: ['feedback', 'remarks', 'comments', 'recruiter feedback'],
  LinkedIn: ['linkedin', 'linkedin profile', 'linkedin url', 'linkedin profile url'],
  Experience: ['experience', 'experience years', 'sales experience'],
  Type: ['type', 'application type', 'job type'],
  'Lead ID': ['id', 'lead id'],
  'Created Time': ['created time', 'created at'],
  'Ad Name': ['ad name'],
  'Campaign Name': ['campaign name'],
  'Form Name': ['form name'],
  'Sales Interest': ['are you interested in a sales position?'],
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
  const normalizedLower = source.toLowerCase().replace(/[\s.-]+/g, '');
  if (!source || /^(na|n\/a|notprovided|notapplicable|not|none|null)$/.test(normalizedLower)) return 'NA';
  const platformSources = { ig: 'Instagram', instagram: 'Instagram', fb: 'Facebook', facebook: 'Facebook' };
  if (platformSources[source.toLowerCase()]) return platformSources[source.toLowerCase()];
  
  const existingSource = CANDIDATE_SOURCES.find((candidateSource) => (
    candidateSource.toLowerCase() === source.toLowerCase()
  ));
  if (existingSource) return existingSource;
  
  // Return the raw source capitalized to allow dynamic sources
  return source.charAt(0).toUpperCase() + source.slice(1);
};

const normalizeRecruitmentStatus = (value) => {
  const originalStatus = optionalText(value);
  const status = originalStatus.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  if (!status) return null;
  
  if (/\b(dnp|do not pick|do not proceed)\b/.test(status)) return 'DNP';
  if (/\b(in consideration|under consideration|unc)\b/.test(status)) return 'Under Consideration';
  
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

// Gender prediction is now handled by common/utils/genderPrediction.js

const validateProfileRow = ({ rowNumber, values }, genderCache) => {
  const errors = [];
  const registrationDate = parseDate(values.Date);
  const fullName = text(values.Name);
  const email = text(values.Email).toLowerCase();
  const mobile = text(values.Phone).replace(/^p:/i, '').replace(/[\s()-]/g, '');
  const linkedInProfile = normalizedUrl(values.LinkedIn) || (text(values.LinkedIn) ? 'NA' : '');
  const resumeUrl = normalizedUrl(values.Resume);
  const recruitmentStatus = normalizeRecruitmentStatus(values.Status);
  const { firstName, lastName } = splitName(fullName);
  const explicitGender = optionalText(values.Gender);
  let gender = explicitGender;
  if (!gender || !GENDERS.includes(gender)) {
    gender = detectGenderWithCache(firstName, genderCache);
  }
  if (!GENDERS.includes(gender)) gender = 'Male';
  
  const rawExperience = text(values.Experience);
  let parsedExperienceYears = 0;
  let extractedExperience = '';
  if (rawExperience) {
    if (/\bfresher\b/i.test(rawExperience)) {
      extractedExperience = 'Fresher';
      parsedExperienceYears = 0;
    } else {
      const expMatch = rawExperience.match(/(\d+(?:\s*-\s*\d+)?(?:\.\d+)?\+?(?:\s*(?:months?|years?|yrs?|mos?|yers?))?)/i);
      if (expMatch) {
        extractedExperience = expMatch[1];
        const numStr = extractedExperience.match(/\d+(?:\.\d+)?/g).pop();
        const isMonth = /month|mo/i.test(extractedExperience);
        parsedExperienceYears = parseFloat(numStr);
        if (isMonth) parsedExperienceYears = parsedExperienceYears / 12;
      } else if (!Number.isNaN(Number(rawExperience)) && rawExperience !== '') {
        parsedExperienceYears = Number(rawExperience);
        extractedExperience = `${rawExperience} years`;
      } else {
        extractedExperience = rawExperience;
      }
    }
  }

  const salesInterest = optionalText(values['Sales Interest']);
  const phoneVerifiedText = optionalText(values['Phone Verified']).toLowerCase();
  const generatedFeedback = [
    salesInterest && `Interested in sales: ${salesInterest}`,
    extractedExperience && `Experience: ${extractedExperience}`,
    phoneVerifiedText && `Phone verified: ${phoneVerifiedText}`,
  ].filter(Boolean).join('\n');

  if (!fullName) errors.push('Missing Name');
  if (!email) errors.push('Missing Email');
  if (!mobile) errors.push('Missing Phone');

  return {
    rowNumber,
    errors,
    candidate: {
      registrationDate: registrationDate || parseDate(values['Created Time']),
      applicationType: (optionalText(values.Type) || optionalText(values['Form Name']) || optionalText(values['Ad Name'])).substring(0, 255),
      externalLeadId: optionalText(values['Lead ID']).replace(/^l:/i, '').substring(0, 200),
      campaignName: optionalText(values['Campaign Name']).substring(0, 255),
      adName: optionalText(values['Ad Name']).substring(0, 255),
      formName: optionalText(values['Form Name']).substring(0, 255),
      salesInterest: salesInterest.substring(0, 500),
      salesExperience: extractedExperience.substring(0, 200),
      phoneVerified: phoneVerifiedText ? phoneVerifiedText === 'true' : null,
      fullName: fullName.substring(0, 200),
      firstName: firstName.substring(0, 100),
      lastName: lastName.substring(0, 100),
      email: email.substring(0, 254),
      mobile: mobile,
      linkedInProfile: linkedInProfile === 'NA' ? '' : linkedInProfile,
      source: normalizeSource(values.Source),
      resumeUrl,
      referenceStatus: optionalText(values.Status).substring(0, 200),
      feedback: (optionalText(values.Feedback) || generatedFeedback).substring(0, 2000),
      recruitmentStatus: recruitmentStatus || 'Registered',
      status: CANDIDATE_STATUSES.includes(recruitmentStatus) ? recruitmentStatus : 'Registered',
      gender,
      experienceYears: parsedExperienceYears,
    },
  };
};

const validateLegacyRow = ({ rowNumber, values }, genderCache) => {
  const errors = [];
  
  const firstName = text(values['First Name']);
  const lastName = text(values['Last Name']);
  const email = text(values['Email']).toLowerCase();
  const mobile = text(values['Mobile']);
  
  if (!firstName && !lastName) errors.push('Missing Name');
  else if (!firstName) errors.push('Missing First Name');
  else if (!lastName) errors.push('Missing Last Name');
  if (!email) errors.push('Missing Email');
  if (!mobile) errors.push('Missing Phone');

  const address = text(values['Address']);
  const qualification = text(values['Qualification']);
  let source = text(values['Source']);
  if (!source) source = 'NA';

  const dateOfBirth = parseDate(values['Date Of Birth']);
  const experienceYears = parseNumber(values.Experience, 0);
  const currentCTC = parseNumber(values['Current CTC'], 0);
  const expectedCTC = parseNumber(values['Expected CTC'], 0);
  const skills = text(values.Skills).split(',').map((skill) => skill.trim()).filter(Boolean);
  const resumeUrl = text(values['Resume URL']);

  let gender = text(values.Gender);
  if (!gender || !GENDERS.includes(gender)) gender = detectGenderWithCache(firstName, genderCache);
  if (!GENDERS.includes(gender)) gender = 'Male';

  return {
    rowNumber,
    errors,
    candidate: {
      firstName: firstName.substring(0, 100),
      lastName: lastName.substring(0, 100) || '-',
      gender,
      dateOfBirth,
      email: email.substring(0, 254),
      mobile,
      address: address.substring(0, 500),
      qualification: qualification.substring(0, 200),
      experienceYears: Math.min(Math.max(experienceYears || 0, 0), 80),
      currentCompany: text(values['Current Company']).substring(0, 200),
      currentCTC: Math.max(currentCTC || 0, 0),
      expectedCTC: Math.max(expectedCTC || 0, 0),
      skills: skills.map(s => s.substring(0, 100)),
      resumeUrl,
      source: normalizeSource(source),
      remarks: text(values.Remarks).substring(0, 2000),
      status: 'Registered',
    },
  };
};

const validateRow = (row, genderCache) => (
  row.format === 'profile' || Object.prototype.hasOwnProperty.call(row.values, 'Name')
    ? validateProfileRow(row, genderCache)
    : validateLegacyRow(row, genderCache)
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

  const importCandidates = async ({ buffer, fileName, actor, requestContext, assignedTo }) => {
    await auditService.logExcelImportStarted({
      userId: actor.id,
      fileName,
      occurredAt: new Date(),
      ...requestContext,
    });

    const parsedRows = await workbookParser(buffer, fileName);
    const validationErrors = [];
    const uniqueRows = [];
    const seenCandidates = new Map();
    let duplicateRows = 0;

    // Pre-fetch genders for all unique first names to avoid API rate limits
    const allFirstNames = parsedRows.map((row) => {
      const fullName = row.format === 'profile' || Object.prototype.hasOwnProperty.call(row.values, 'Name')
        ? text(row.values.Name || row.values.Name)
        : text(row.values['First Name']);
      return splitName(fullName).firstName;
    });
    const genderCache = await bulkPredictGenders(allFirstNames);

    parsedRows.forEach((row) => {
      const validated = validateRow(row, genderCache);
      if (validated.errors.length) {
        validationErrors.push({ row: row.rowNumber, errors: validated.errors });
        return;
      }
      const duplicateKey = `${validated.candidate.email}|${validated.candidate.mobile}`;
      if (seenCandidates.has(duplicateKey)) {
        duplicateRows += 1;
        const originalRow = seenCandidates.get(duplicateKey);
        validationErrors.push({ row: row.rowNumber, errors: [`Duplicate of row ${originalRow}`] });
        return;
      }
      seenCandidates.set(duplicateKey, row.rowNumber);
      uniqueRows.push(validated);
    });

    const session = await startSession();
    let transactionResult = {
      imported: 0,
      skipped: parsedRows.length,
      duplicateRows: 0,
      validationErrors: [],
    };
    try {
      await session.withTransaction(async () => {
        const existingCandidates = await findExistingContacts(uniqueRows, session);
        const existingCandidateSet = new Set(existingCandidates.map((c) => `${c.email}|${c.mobile}`));
        const databaseValidationErrors = [];
        let dbDuplicateRows = 0;
        const importableRows = uniqueRows.filter((row) => {
          const duplicateKey = `${row.candidate.email}|${row.candidate.mobile}`;
          if (!existingCandidateSet.has(duplicateKey)) return true;
          
          dbDuplicateRows += 1;
          databaseValidationErrors.push({ row: row.rowNumber, errors: ['Duplicate found in database'] });
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
            assignedTo: assignedTo || null,
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
          duplicateRows: dbDuplicateRows,
          validationErrors: databaseValidationErrors,
        };
      }, TRANSACTION_OPTIONS);
    } finally {
      await session.endSession();
    }

    duplicateRows += transactionResult.duplicateRows;
    validationErrors.push(...transactionResult.validationErrors);
    validationErrors.sort((a, b) => a.row - b.row);

    await ImportHistory.create({
      fileName,
      importedBy: actor.id,
      totalRows: parsedRows.length,
      importedCount: transactionResult.imported,
      skippedCount: transactionResult.skipped,
      duplicateMobiles: duplicateRows,
      validationErrors,
    });

    return {
      totalRows: parsedRows.length,
      imported: transactionResult.imported,
      skipped: transactionResult.skipped,
      duplicateEmails: 0,
      duplicateMobiles: duplicateRows,
      validationErrors,
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
