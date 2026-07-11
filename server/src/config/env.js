const dotenv = require('dotenv');

dotenv.config();

const parsePort = (value) => {
  const port = Number(value ?? 5000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  return port;
};

const normalizePrefix = (value) => {
  const prefix = value || '/api/v1';
  return `/${prefix}`.replace(/\/+/g, '/').replace(/\/$/, '');
};

module.exports = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT),
  apiPrefix: normalizePrefix(process.env.API_PREFIX),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
});

