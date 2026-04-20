'use strict';

/**
 * AppError - Custom error class để throw lỗi có statusCode trong services.
 * Controller/errorHandler middleware sẽ bắt và trả về đúng HTTP status.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
