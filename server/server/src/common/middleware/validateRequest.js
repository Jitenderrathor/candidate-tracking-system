const { validationResult } = require('express-validator');
const AppError = require('../errors/AppError');

const validateRequest = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return next(new AppError('Request validation failed', 422, {
    code: 'VALIDATION_ERROR',
    details: result.array({ onlyFirstError: true }),
  }));
};

module.exports = validateRequest;

