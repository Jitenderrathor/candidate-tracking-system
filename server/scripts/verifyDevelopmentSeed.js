const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const authService = require('../src/modules/auth/auth.service');
const dashboardService = require('../src/modules/dashboard/dashboard.service');
const reportService = require('../src/modules/reports/report.service');
const excelImportService = require('../src/modules/excel-import/excelImport.service');
const User = require('../src/modules/auth/user.model');
const Candidate = require('../src/modules/candidates/candidate.model');

const usersFromEnvironment = () => {
  if (!process.env.SEED_USERS_JSON) throw new Error('SEED_USERS_JSON is required');
  return JSON.parse(process.env.SEED_USERS_JSON);
};

const duplicateWorkbook = async (candidate) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Candidates');
  sheet.addRow(excelImportService.HEADERS);
  sheet.addRow([
    candidate.firstName, candidate.lastName, candidate.gender, candidate.dateOfBirth,
    candidate.email, candidate.mobile, candidate.address, candidate.qualification,
    candidate.experienceYears, candidate.currentCompany, candidate.currentCTC,
    candidate.expectedCTC, candidate.skills.join(', '), candidate.resumeUrl,
    candidate.source, candidate.remarks,
  ]);
  return workbook.xlsx.writeBuffer();
};

const verify = async () => {
  await connectDatabase();
  const credentials = usersFromEnvironment();
  const logins = [];
  for (const credential of credentials) {
    const result = await authService.login({ email: credential.email, password: credential.password });
    logins.push({ email: credential.email, authenticated: Boolean(result.token), role: result.user.role });
  }

  const storedUsers = await User.find({ email: { $in: credentials.map(({ email }) => email) } })
    .select('+password').lean();
  const passwordsHashed = storedUsers.length === credentials.length && storedUsers.every((user) => (
    /^\$2[aby]\$/.test(user.password)
    && !credentials.some(({ password }) => password === user.password)
  ));

  const [dashboard, reportSummary, monthlyReport, candidateList] = await Promise.all([
    dashboardService.getSummary(),
    reportService.getSummary(),
    reportService.getMonthlyReport(),
    reportService.getCandidates({ page: 1, limit: 20 }),
  ]);

  const duplicateCandidate = await Candidate.findOne({ email: /@seed\.candidate\.example\.com$/ }).lean();
  const actor = storedUsers.find(({ role }) => role === 'Admin') || storedUsers[0];
  const duplicateResult = await excelImportService.importCandidates({
    buffer: await duplicateWorkbook(duplicateCandidate),
    fileName: 'seed-duplicate-verification.xlsx',
    actor: { id: actor._id },
    requestContext: { ipAddress: '127.0.0.1', userAgent: 'development-seed-verifier' },
  });

  console.info(JSON.stringify({
    connected: mongoose.connection.readyState === 1,
    logins,
    passwordsHashed,
    dashboard: {
      totalCandidates: dashboard.totalCandidates,
      statusSummary: dashboard.statusSummary,
      sourceSummary: dashboard.sourceSummary,
      populatedMonths: dashboard.monthlyTrend.filter(({ registrationCount }) => registrationCount > 0).length,
      recentCandidates: dashboard.recentCandidates.length,
    },
    reports: {
      totalCandidates: reportSummary.totalCandidates,
      monthlyRows: monthlyReport.length,
      averageExperience: reportSummary.averageExperience,
    },
    candidateList: {
      recordsOnFirstPage: candidateList.candidates.length,
      total: candidateList.meta.total,
    },
    excelDuplicateDetection: duplicateResult,
  }, null, 2));
};

verify()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
