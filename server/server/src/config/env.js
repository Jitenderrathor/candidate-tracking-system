const dotenv = require('dotenv');

dotenv.config({ quiet: true });

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

const parsePositiveInteger = (value, fallback, name) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

const requireUrl = (value, name, protocols) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch (_error) {
    throw new Error(`${name} must be a valid URL`);
  }
  if (!protocols.includes(parsed.protocol)) {
    throw new Error(`${name} must use ${protocols.join(' or ')}`);
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV || 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production');
}
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-this-secret';

if (nodeEnv === 'production' && (!process.env.JWT_SECRET || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
if (!/^\d+(ms|s|m|h|d|w|y)?$/.test(jwtExpiresIn)) {
  throw new Error('JWT_EXPIRES_IN must be a positive duration such as 15m or 1d');
}

const mongoUri = requireUrl(
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/candidate_tracking_system',
  'MONGODB_URI',
  ['mongodb:', 'mongodb+srv:'],
);

module.exports = Object.freeze({
  nodeEnv,
  port: parsePort(process.env.PORT),
  apiPrefix: normalizePrefix(process.env.API_PREFIX),
  clientOrigin: requireUrl(
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    'CLIENT_ORIGIN',
    ['http:', 'https:'],
  ),
  mongoUri,
  mongoMaxPoolSize: parsePositiveInteger(process.env.MONGODB_MAX_POOL_SIZE, 20, 'MONGODB_MAX_POOL_SIZE'),
  mongoServerSelectionTimeoutMs: parsePositiveInteger(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    10000,
    'MONGODB_SERVER_SELECTION_TIMEOUT_MS',
  ),
  mongoQueryMaxTimeMs: parsePositiveInteger(
    process.env.MONGODB_QUERY_MAX_TIME_MS,
    15000,
    'MONGODB_QUERY_MAX_TIME_MS',
  ),
  jwtSecret,
  jwtExpiresIn,
  passwordResetExpiresMinutes: parsePositiveInteger(
    process.env.PASSWORD_RESET_EXPIRES_MINUTES,
    15,
    'PASSWORD_RESET_EXPIRES_MINUTES',
  ),
  shutdownTimeoutMs: parsePositiveInteger(
    process.env.SHUTDOWN_TIMEOUT_MS,
    10000,
    'SHUTDOWN_TIMEOUT_MS',
  ),
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parsePositiveInteger(process.env.SMTP_PORT, 465, 'SMTP_PORT'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Candidate Tracking System <noreply@example.com>',
  },
});
