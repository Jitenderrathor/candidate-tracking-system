const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const candidateRoutes = require('../modules/candidates/candidate.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const reportRoutes = require('../modules/reports/report.routes');
const excelImportRoutes = require('../modules/excel-import/excelImport.routes');
const statusWorkflowRoutes = require('../modules/status-workflow/statusWorkflow.routes');
const activityLogRoutes = require('../modules/activity-logs/activityLog.routes');
const emailTemplateRoutes = require('../modules/email-templates/emailTemplate.routes');

const settingsRoutes = require('../modules/settings/settings.routes');

const router = express.Router();

const routes = [
  ['/auth', authRoutes],
  ['/users', userRoutes],
  ['/candidates', candidateRoutes],
  ['/dashboard', dashboardRoutes],
  ['/reports', reportRoutes],
  ['/excel-import', excelImportRoutes],
  ['/status-workflow', statusWorkflowRoutes],
  ['/activity-logs', activityLogRoutes],
  ['/email-templates', emailTemplateRoutes],
  ['/settings', settingsRoutes],
];

routes.forEach(([path, moduleRouter]) => router.use(path, moduleRouter));

module.exports = router;

