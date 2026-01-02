// Error codes mapping
export const ERROR_CODES = {
  // Authentication errors (1000-1099)
  INVALID_CREDENTIALS: 1001,
  TOKEN_EXPIRED: 1002,
  TOKEN_INVALID: 1003,
  ACCESS_DENIED: 1004,
  
  // Validation errors (1100-1199)
  VALIDATION_ERROR: 1101,
  REQUIRED_FIELD_MISSING: 1102,
  INVALID_FORMAT: 1103,
  
  // Resource errors (1200-1299)
  RESOURCE_NOT_FOUND: 1201,
  RESOURCE_ALREADY_EXISTS: 1202,
  RESOURCE_CONFLICT: 1203,
  
  // System errors (9000-9999)
  INTERNAL_ERROR: 9001,
  DATABASE_ERROR: 9002,
  EXTERNAL_SERVICE_ERROR: 9003
};

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = new AppError(message, 400, ERROR_CODES.INVALID_FORMAT);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401, ERROR_CODES.TOKEN_INVALID);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401, ERROR_CODES.TOKEN_EXPIRED);
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || ERROR_CODES.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    error: {
      code: Object.keys(ERROR_CODES).find(key => ERROR_CODES[key] === errorCode) || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      ...(error.details && { details: error.details })
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.headers['x-request-id'] || `req_${Date.now()}`
    }
  });
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}; 