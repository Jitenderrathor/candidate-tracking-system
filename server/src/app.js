const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const apiRoutes = require('./routes');
const authRoutes = require('./modules/auth/auth.routes');
const candidateRoutes = require('./modules/candidates/candidate.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const excelImportRoutes = require('./modules/excel-import/excelImport.routes');
const reportRoutes = require('./modules/reports/report.routes');
const userRoutes = require('./modules/users/user.routes');
const emailTemplateRoutes = require('./modules/email-templates/emailTemplate.routes');
const { success } = require('./common/utils/apiResponse');
const notFound = require('./common/middleware/notFound');
const errorHandler = require('./common/middleware/errorHandler');

const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => success(res, {
    message: 'Candidate Tracking System API is healthy',
    data: { environment: env.nodeEnv },
  }));

const settingsRoutes = require('./modules/settings/settings.routes');

  app.use('/api/auth', authRoutes);
  app.use('/api/candidates', candidateRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/excel', excelImportRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/email-templates', emailTemplateRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use(env.apiPrefix, apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
