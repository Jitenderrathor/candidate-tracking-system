process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const {
  HEADERS,
  LEGACY_HEADERS,
  createExcelImportService,
  parseWorkbook,
  validateRow,
} = require('../src/modules/excel-import/excelImport.service');

const row = (number, overrides = {}) => ({
  rowNumber: number + 1,
  values: {
    'First Name': `Candidate${number}`,
    'Last Name': 'Test',
    Gender: 'Other',
    'Date Of Birth': new Date('1995-01-01'),
    Email: `candidate${number}@example.com`,
    Mobile: `+9190000${String(number).padStart(5, '0')}`,
    Address: 'Pune',
    Qualification: 'B.Tech',
    Experience: 3,
    'Current Company': 'Example Ltd',
    'Current CTC': 500000,
    'Expected CTC': 700000,
    Skills: 'Node.js, MongoDB',
    'Resume URL': 'https://example.com/resume.pdf',
    Source: 'Website',
    Remarks: 'Imported candidate',
    ...overrides,
  },
});

const makeHarness = ({ rows, existing = [], initialSequence = 144 } = {}) => {
  const insertedBatches = [];
  const startedEvents = [];
  const completedEvents = [];
  let sequence = initialSequence;
  const session = {
    async withTransaction(work) { return work(); },
    async endSession() { this.ended = true; },
  };
  const CandidateModel = {
    find() {
      return {
        select() { return this; },
        session(receivedSession) { assert.equal(receivedSession, session); return this; },
        lean() { return Promise.resolve(existing); },
      };
    },
    async insertMany(documents, options) {
      assert.equal(options.session, session);
      insertedBatches.push(documents);
      return documents;
    },
  };
  const CounterModel = {
    async findOneAndUpdate(_filter, update, options) {
      assert.equal(options.session, session);
      sequence += update.$inc.sequence;
      return { sequence };
    },
  };
  const auditService = {
    async logExcelImportStarted(event) { startedEvents.push(event); },
    async logExcelImportCompleted(event, receivedSession) {
      assert.equal(receivedSession, session);
      completedEvents.push(event);
    },
  };
  const service = createExcelImportService({
    CandidateModel,
    CounterModel,
    auditService,
    startSession: async () => session,
    workbookParser: async () => rows,
  });
  const run = () => service.importCandidates({
    buffer: Buffer.from('test'),
    fileName: 'candidates.xlsx',
    actor: { id: 'admin-1' },
    requestContext: { ipAddress: '127.0.0.1', userAgent: 'Test Browser' },
  });
  return { completedEvents, insertedBatches, run, session, startedEvents };
};

test('parseWorkbook reads the supported XLSX columns', async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Candidates');
  worksheet.addRow(LEGACY_HEADERS);
  worksheet.addRow(LEGACY_HEADERS.map((header) => row(1).values[header]));
  const buffer = await workbook.xlsx.writeBuffer();

  const parsed = await parseWorkbook(Buffer.from(buffer));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].rowNumber, 2);
  assert.equal(parsed[0].values.Email, 'candidate1@example.com');
});

test('profile workbook maps every imported candidate profile field', async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Candidates');
  worksheet.addRow(HEADERS);
  worksheet.addRow([
    new Date('2026-06-15'), 'Full Time', 'Asha Sharma', 'asha.profile@example.com',
    '+919876543210', 'https://www.linkedin.com/in/asha-sharma', 'LinkedIn',
    'asha-sharma.pdf', 'application/pdf', 'https://drive.google.com/file/d/example/view',
    'Contacted', 'Good communication', 'Under Consideration',
  ]);
  const buffer = await workbook.xlsx.writeBuffer();
  const [parsed] = await parseWorkbook(Buffer.from(buffer));
  const result = validateRow(parsed);

  assert.deepEqual(result.errors, []);
  assert.equal(result.candidate.registrationDate.toISOString(), '2026-06-15T00:00:00.000Z');
  assert.equal(result.candidate.applicationType, 'Full Time');
  assert.equal(result.candidate.fullName, 'Asha Sharma');
  assert.equal(result.candidate.firstName, 'Asha');
  assert.equal(result.candidate.lastName, 'Sharma');
  assert.equal(result.candidate.linkedInProfile, 'https://www.linkedin.com/in/asha-sharma');
  assert.equal(result.candidate.source, 'LinkedIn');
  assert.equal(result.candidate.resumeFileName, 'asha-sharma.pdf');
  assert.equal(result.candidate.resumeFileType, 'application/pdf');
  assert.equal(result.candidate.resumeUrl, 'https://drive.google.com/file/d/example/view');
  assert.equal(result.candidate.referenceStatus, 'Contacted');
  assert.equal(result.candidate.feedback, 'Good communication');
  assert.equal(result.candidate.recruitmentStatus, 'Under Consideration');
  assert.equal(result.candidate.status, 'Under Consideration');
});

test('profile workbook finds aliased headers after introductory rows', async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Export');
  worksheet.addRow(['Talent Hunt Candidate Export']);
  worksheet.addRow([]);
  worksheet.addRow([
    'Registration Date', 'Application Type', 'Full Name', 'Email Address', 'Mobile Number',
    'LinkedIn URL', 'Source', 'Resume File Name', 'Resume File Type', 'Resume Link',
    'Reference Status', 'Recruiter Feedback', 'Recruitment Status',
  ]);
  worksheet.addRow([
    '2026-07-01', 'Full Time', 'Neha Verma', 'neha.alias@example.com', '+919811112222',
    'https://linkedin.com/in/neha-verma', 'Referral', 'neha.pdf', 'application/pdf',
    'https://drive.google.com/file/d/neha/view', 'Contacted', 'Potential candidate', 'Selected',
  ]);
  const buffer = await workbook.xlsx.writeBuffer();
  const [parsed] = await parseWorkbook(Buffer.from(buffer), 'talent-hunt.xlsx');
  const result = validateRow(parsed);

  assert.equal(parsed.rowNumber, 4);
  assert.deepEqual(result.errors, []);
  assert.equal(result.candidate.fullName, 'Neha Verma');
  assert.equal(result.candidate.recruitmentStatus, 'Selected');
});

test('CSV import accepts common minimal candidate headers', async () => {
  const csv = [
    'Date,Type,Full Name,Email Address,Mobile,Source,Feedback,Recruitment Status',
    '2026-07-02,Contract,"Rohan Mehta",rohan.csv@example.com,+919822223333,Website,"Good communication",To Be Shortlisted',
  ].join('\n');
  const [parsed] = await parseWorkbook(Buffer.from(csv), 'candidates.csv');
  const result = validateRow(parsed);

  assert.deepEqual(result.errors, []);
  assert.equal(result.candidate.fullName, 'Rohan Mehta');
  assert.equal(result.candidate.mobile, '919822223333');
  assert.equal(result.candidate.feedback, 'Good communication');
  assert.equal(result.candidate.recruitmentStatus, 'To Be Shortlisted');
});

test('Meta Ads UTF-16 tab-delimited CSV maps lead fields', async () => {
  const tsv = [
    'id\tcreated_time\tad_name\tcampaign_name\tform_name\tplatform\tare_you_interested_in_a_sales_position?\thow_many_years_of_experience_do_you_have_in_sales\temail\tfull_name\tphone_number\tphone_number_verified',
    'l:123\t2026-07-10T11:05:42+05:30\tNew Leads Ad\tHF Campaign\tHF SALES HUNT\tig\tYes\t7+ year\tmeta@example.com\tMeta Candidate\tp:+917004563203\tfalse',
  ].join('\r\n');
  const buffer = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(tsv, 'utf16le')]);
  const [parsed] = await parseWorkbook(buffer, 'meta-leads.csv');
  const result = validateRow(parsed);

  assert.deepEqual(result.errors, []);
  assert.equal(result.candidate.externalLeadId, '123');
  assert.equal(result.candidate.applicationType, 'HF SALES HUNT');
  assert.equal(result.candidate.campaignName, 'HF Campaign');
  assert.equal(result.candidate.source, 'Instagram');
  assert.equal(result.candidate.mobile, '+917004563203');
  assert.equal(result.candidate.phoneVerified, false);
  assert.match(result.candidate.feedback, /Sales experience: 7\+ year/);
});

test('Meta Ads import preserves detailed sales-interest responses', () => {
  const detailedResponse = 'Yes i am interested in sales position and would like to discuss the role, responsibilities, location, compensation, and growth opportunities.';
  const result = validateRow({
    rowNumber: 285,
    format: 'profile',
    values: {
      'Created Time': '2026-07-10T11:05:42+05:30',
      Name: 'Detailed Candidate', Email: 'detailed@example.com', Phone: 'p:+917004563203',
      Platform: 'ig', 'Sales Interest': detailedResponse, 'Sales Experience': '5 years',
      'Phone Verified': 'true',
    },
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.candidate.salesInterest, detailedResponse);
  assert.match(result.candidate.feedback, /Interested in sales:/);
});

test('profile import maps rejected recruitment status to rejected', () => {
  const result = validateRow({
    rowNumber: 2,
    format: 'profile',
    values: {
      Date: '2026-06-15', Type: 'Contract', Name: 'Ravi Kumar',
      Email: 'ravi.profile@example.com', Phone: '+919812345678',
      'LinkedIn Profile': '', Hear: 'Referral', 'File Name': '', 'File Type': '',
      'File URL': '', Status: 'Closed', Feedback: 'Average communication', '#REF!': 'Rejected',
    },
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.candidate.recruitmentStatus, 'Rejected');
  assert.equal(result.candidate.status, 'Rejected');
});

test('small import reserves continued candidate numbers and uses one bulk insert', async () => {
  const harness = makeHarness({ rows: [row(1), row(2)] });
  const result = await harness.run();

  assert.equal(result.imported, 2);
  assert.equal(result.skipped, 0);
  assert.equal(harness.insertedBatches.length, 1);
  assert.deepEqual(
    harness.insertedBatches[0].map((candidate) => candidate.candidateId),
    ['CRTS000145', 'CRTS000146'],
  );
  assert.ok(harness.insertedBatches[0].every((candidate) => candidate.status === 'Registered'));
  assert.equal(harness.startedEvents.length, 1);
  assert.equal(harness.completedEvents[0].importedCount, 2);
  assert.equal(harness.session.ended, true);
});

test('10,000-row import remains one insertMany operation', async () => {
  const rows = Array.from({ length: 10000 }, (_, index) => row(index + 1));
  const harness = makeHarness({ rows, initialSequence: 0 });
  const result = await harness.run();

  assert.equal(result.totalRows, 10000);
  assert.equal(result.imported, 10000);
  assert.equal(harness.insertedBatches.length, 1);
  assert.equal(harness.insertedBatches[0].length, 10000);
  assert.equal(harness.insertedBatches[0][9999].candidateId, 'CRTS010000');
});

test('duplicates by email or mobile inside the file and database are skipped', async () => {
  const rows = [
    row(1),
    row(2, { Email: 'candidate1@example.com' }),
    row(3, { Mobile: '+919000000001' }),
    row(4),
  ];
  const harness = makeHarness({
    rows,
    existing: [{ email: 'candidate4@example.com', mobile: '+919999999999' }],
  });
  const result = await harness.run();

  assert.equal(result.imported, 1);
  assert.equal(result.skipped, 3);
  assert.equal(result.duplicateEmails, 2);
  assert.equal(result.duplicateMobiles, 1);
  assert.deepEqual(result.validationErrors.map((entry) => entry.row), [3, 4, 5]);
  assert.equal(harness.completedEvents[0].skippedCount, 3);
});

test('invalid rows return detailed errors and do not call insertMany', async () => {
  const harness = makeHarness({
    rows: [row(1, { Email: '', Mobile: 'invalid', Experience: -1 })],
  });
  const result = await harness.run();

  assert.equal(result.imported, 0);
  assert.equal(result.skipped, 1);
  assert.equal(harness.insertedBatches.length, 0);
  assert.equal(result.validationErrors[0].row, 2);
  assert.ok(result.validationErrors[0].errors.includes('Missing Email'));
  assert.ok(result.validationErrors[0].errors.includes('Invalid Mobile'));
  assert.ok(result.validationErrors[0].errors.includes('Invalid Experience'));
});

test('gender is detected from first name when omitted or using profile import', () => {
  // Profile row has no explicit gender column
  const profileResult = validateRow({
    rowNumber: 2,
    format: 'profile',
    values: {
      Date: '2026-06-15', Type: 'Full Time', Name: 'John Smith',
      Email: 'john@example.com', Phone: '+1234567890',
    },
  });
  assert.equal(profileResult.candidate.gender, 'Male');

  const legacyResult = validateRow({
    rowNumber: 3,
    format: 'legacy',
    values: {
      'First Name': 'Sarah', 'Last Name': 'Connor',
      Email: 'sarah@example.com', Mobile: '+1234567891',
      Address: 'NY', Qualification: 'BSc', Experience: 5, Source: 'Website',
      'Date Of Birth': '1990-01-01', Skills: 'Shooting',
    },
  });
  assert.equal(legacyResult.candidate.gender, 'Female');
});
