import { AxiosError } from 'axios';

/**
 * Shared error handling utilities
 */

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  return defaultMessage;
};

/**
 * Create a standardized error handler for API requests
 */
export const createApiErrorHandler = (context: string) => (error: any): never => {
  console.error(`Error in ${context}:`, error);
  
  const errorMessage = getErrorMessage(error, `Failed to ${context}`);
  throw new Error(errorMessage);
};

/**
 * Handle async operations with error logging
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      throw error;
    }
  }) as T;
};

/**
 * Check if error is an Axios error
 */
export const isAxiosError = (error: any): error is AxiosError => {
  return error?.isAxiosError === true;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  if (isAxiosError(error)) {
    return error.code === 'NETWORK_ERROR' || !error.response;
  }
  return false;
};

/**
 * Get HTTP status code from error
 */
export const getErrorStatus = (error: any): number | null => {
  if (isAxiosError(error)) {
    return error.response?.status || null;
  }
  return null;
};

/**
 * Format error for user display
 */
export const formatUserError = (error: any): string => {
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  const status = getErrorStatus(error);
  if (status) {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please connect your wallet.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found. Please check if the item exists.';
      case 429:
        return 'Rate limit exceeded. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return getErrorMessage(error, 'An unexpected error occurred.');
    }
  }

  return getErrorMessage(error, 'An unexpected error occurred.');
};

/**
 * Retry function with exponential backoff
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context?: string
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (context) {
        console.warn(`Attempt ${attempt}/${maxRetries} failed for ${context}:`, error);
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};