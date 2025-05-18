import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Creates an ApiError from an AxiosError
   */
  static fromAxiosError(error: AxiosError<ApiErrorResponse>): ApiError {
    const { response } = error;
    
    if (!response) {
      return new ApiError(error.message || 'Network Error', 0, 'NETWORK_ERROR');
    }
    
    const { data, status } = response;
    const { error: errorData } = data || {};
    
    return new ApiError(
      errorData?.message || error.message || 'Unknown error occurred',
      status,
      errorData?.code,
      errorData?.details
    );
  }
}

/**
 * Handles API errors and returns a user-friendly error message
 */
export function handleApiError(error: unknown): string {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Handles form errors from the API and returns them in a format suitable for form validation
 */
export function handleFormErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.details) {
    // Convert the details object to a format that can be used with form validation
    const formErrors: Record<string, string> = {};
    
    Object.entries(error.details).forEach(([field, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        formErrors[field] = messages[0];
      }
    });
    
    return formErrors;
  }
  
  return {};
}

/**
 * Checks if an error is an authentication error (401 Unauthorized)
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 0 || error.code === 'NETWORK_ERROR';
  }
  
  if (error instanceof Error) {
    return error.message.includes('Network Error');
  }
  
  return false;
}
