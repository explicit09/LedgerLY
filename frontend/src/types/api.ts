import { AxiosError } from 'axios';
import { User } from './auth';

/**
 * Standard API response structure for successful responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
  };
  statusCode: number;
}

/**
 * Type guard to check if an error is an AxiosError with ApiErrorResponse
 */
export function isApiError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError
  );
}

/**
 * Extracts error message from an error object
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.response?.data?.error?.message || error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}

// Auth API Types
export interface LoginResponse extends ApiResponse<{ user: User; token: string }> {}
export interface RegisterResponse extends LoginResponse {}
export interface RefreshTokenResponse extends ApiResponse<{ token: string }> {}

// User API Types
export interface UserProfileResponse extends ApiResponse<User> {}

// Common Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Utility type to extract the data type from an ApiResponse
 */
export type ApiResponseData<T> = T extends ApiResponse<infer D> ? D : never;
