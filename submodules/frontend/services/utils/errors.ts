/**
 * Error handling utilities
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`Database error: ${message}`, 500);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class AgentError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(`Agent error: ${message}`, statusCode);
  }
}

/**
 * Safe error handler that doesn't expose sensitive information
 */
export function createSafeErrorResponse(error: unknown): { error: string; statusCode: number } {
  if (error instanceof AppError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    return {
      error: isDevelopment ? error.message : 'Internal server error',
      statusCode: 500,
    };
  }

  return {
    error: 'Unknown error occurred',
    statusCode: 500,
  };
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error; // Re-throw to be handled by the calling code
    }
  };
}

/**
 * Database query error handler
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  if (error instanceof Error) {
    throw new DatabaseError(`Failed to ${operation}: ${error.message}`, error);
  }
  throw new DatabaseError(`Failed to ${operation}: Unknown error`);
}

/**
 * Validate required fields
 */
export function validateRequired<T>(obj: Partial<T>, requiredFields: (keyof T)[]): void {
  const missing = requiredFields.filter(field => !obj[field]);
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Type guard for checking if error is operational
 */
export function isOperationalError(error: unknown): error is AppError {
  return error instanceof AppError && error.isOperational;
}