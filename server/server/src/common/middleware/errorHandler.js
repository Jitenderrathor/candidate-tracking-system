const { failure } = require('../utils/apiResponse');
const env = require('../../config/env');

const normalizeError = (error) => {
  if (error?.isOperational) return error;
  if (error?.code === 11000) {
    return {
      statusCode: 409,
      message: 'A record with that value already exists',
      code: 'DUPLICATE_RESOURCE',
      isOperational: true,
    };
  }
  if (error?.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      message: 'Request body contains invalid JSON',
      code: 'INVALID_JSON',
      isOperational: true,
    };
  }
  if (error?.type === 'entity.too.large') {
    return {
      statusCode: 413,
      message: 'Request body is too large',
      code: 'PAYLOAD_TOO_LARGE',
      isOperational: true,
    };
  }
  if (error?.name === 'ValidationError') {
    return {
      statusCode: 422,
      message: 'Data validation failed',
      code: 'VALIDATION_ERROR',
      details: Object.values(error.errors || {}).map(({ path, message }) => ({ field: path, message })),
      isOperational: true,
    };
  }
  if (error?.name === 'CastError') {
    return {
      statusCode: 400,
      message: `Invalid value for ${error.path}`,
      code: 'INVALID_IDENTIFIER',
      isOperational: true,
    };
  }
  if (error?.name === 'VersionError') {
    return {
      statusCode: 409,
      message: 'The record was modified by another request; retry with fresh data',
      code: 'CONCURRENT_MODIFICATION',
      isOperational: true,
    };
  }
  return error;
};

const errorHandler = (rawError, req, res, _next) => {
  const error = normalizeError(rawError);
  const statusCode = error.statusCode || 500;
  const exposeDetails = error.isOperational || env.nodeEnv !== 'production';

  if (!error.isOperational) {
    console.error('Unhandled request error', {
      method: req.method,
      path: req.originalUrl,
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  return failure(res, {
    statusCode,
    message: exposeDetails ? error.message : 'Internal server error',
    code: error.code,
    details: exposeDetails ? error.details : undefined,
  });
};

module.exports = errorHandler;
module.exports.normalizeError = normalizeError;
