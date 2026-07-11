const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const apiRoutes = require('./routes');
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
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req, res) => success(res, {
    message: 'Candidate Tracking System API is healthy',
    data: { environment: env.nodeEnv },
  }));

  app.use(env.apiPrefix, apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;

