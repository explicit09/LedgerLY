export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // This is needed to restore the prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Capturing stack trace, excluding constructor call from it
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;
  
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.retryAfter = retryAfter;
  }
}

export class PlaidError extends AppError {
  public readonly errorType: string;
  public readonly errorCode?: string;
  public readonly requestId?: string;
  
  constructor(
    message: string,
    errorType: string,
    errorCode?: string,
    statusCode: number = 400,
    requestId?: string
  ) {
    super(message, statusCode);
    this.errorType = errorType;
    this.errorCode = errorCode;
    this.requestId = requestId;
  }
}

export class PlaidItemError extends PlaidError {
  constructor(
    message: string,
    errorCode?: string,
    requestId?: string
  ) {
    super(
      `Plaid item error: ${message}`,
      'ITEM_ERROR',
      errorCode,
      400,
      requestId
    );
  }
}

export class PlaidInstitutionError extends PlaidError {
  constructor(
    message: string,
    errorCode?: string,
    requestId?: string
  ) {
    super(
      `Financial institution error: ${message}`,
      'INSTITUTION_ERROR',
      errorCode,
      503,
      requestId
    );
  }
}

export class PlaidApiError extends PlaidError {
  constructor(
    message: string = 'An error occurred with the Plaid API',
    errorCode?: string,
    requestId?: string
  ) {
    super(
      message,
      'API_ERROR',
      errorCode,
      500,
      requestId
    );
  }
}

export class PlaidRateLimitError extends RateLimitError {
  constructor(
    message: string = 'Plaid API rate limit exceeded',
    retryAfter?: number,
    public readonly requestId?: string
  ) {
    super(message, retryAfter);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error') {
    super(message, 422);
  }
}
