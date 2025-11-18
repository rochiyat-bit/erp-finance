import logger from './logger';

// Custom application error class
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
  field?: string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL',
    field?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.field = field;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error codes
export const ErrorCodes = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_ACCOUNT_LOCKED: 'AUTH_002',
  AUTH_SESSION_EXPIRED: 'AUTH_003',
  AUTH_UNAUTHORIZED: 'AUTH_004',

  // User errors
  USER_NOT_FOUND: 'USER_001',
  USER_EMAIL_EXISTS: 'USER_002',
  USER_INACTIVE: 'USER_003',

  // Permission errors
  PERMISSION_DENIED: 'PERM_001',

  // Company errors
  COMPANY_NOT_FOUND: 'COMPANY_001',
  COMPANY_INACTIVE: 'COMPANY_002',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_001',

  // Rate limit
  RATE_LIMIT: 'RATE_LIMIT',

  // Database errors
  DB_ERROR: 'DB_ERROR',

  // Internal errors
  INTERNAL: 'INTERNAL',
};

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
}

// Format error response
export function formatErrorResponse(error: Error | AppError): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        field: error.field,
        details: error.details,
      },
    };
  }

  // Log unexpected errors
  logger.error('Unexpected error:', error);

  // Return generic error for unknown errors
  return {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL,
      message: 'An unexpected error occurred',
    },
  };
}

// Handle async errors
export function asyncHandler(fn: Function) {
  return async (req: any, res: any, next?: any) => {
    try {
      return await fn(req, res, next);
    } catch (error) {
      if (next) {
        next(error);
      } else {
        const errorResponse = formatErrorResponse(error as Error);
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        return res.status(statusCode).json(errorResponse);
      }
    }
  };
}

// Common error factories
export const createAuthError = (message: string = 'Invalid credentials') =>
  new AppError(message, 401, ErrorCodes.AUTH_INVALID_CREDENTIALS);

export const createNotFoundError = (entity: string = 'Resource') =>
  new AppError(`${entity} not found`, 404, ErrorCodes.USER_NOT_FOUND);

export const createValidationError = (message: string, field?: string, details?: any) =>
  new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, field, details);

export const createPermissionError = (message: string = 'Insufficient permissions') =>
  new AppError(message, 403, ErrorCodes.PERMISSION_DENIED);

export const createRateLimitError = () =>
  new AppError('Too many requests, please try again later', 429, ErrorCodes.RATE_LIMIT);

export const createDatabaseError = (message: string = 'Database operation failed') =>
  new AppError(message, 500, ErrorCodes.DB_ERROR);
