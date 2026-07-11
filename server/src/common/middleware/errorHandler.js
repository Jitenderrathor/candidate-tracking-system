const { failure } = require('../utils/apiResponse');

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const exposeDetails = error.isOperational || process.env.NODE_ENV !== 'production';

  if (!error.isOperational) console.error(error);

  return failure(res, {
    statusCode,
    message: exposeDetails ? error.message : 'Internal server error',
    code: error.code,
    details: exposeDetails ? error.details : undefined,
  });
};

module.exports = errorHandler;

