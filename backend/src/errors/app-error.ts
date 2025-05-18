/**
 * Base error class for application-specific errors
 */
export abstract class AppError extends Error {
  abstract statusCode: number;
  
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
  
  abstract serializeErrors(): Array<{ message: string; field?: string }>;
}
