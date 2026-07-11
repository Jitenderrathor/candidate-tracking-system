class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

