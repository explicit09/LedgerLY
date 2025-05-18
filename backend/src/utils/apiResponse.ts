import { Response } from 'express';

type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

type ErrorResponse = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type ApiResponse<T = undefined> = T extends undefined
  ? { success: true; message?: string } | ErrorResponse
  : SuccessResponse<T> | ErrorResponse;

export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  message?: string
): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(200).json(response);
}

export function sendErrorResponse(
  res: Response,
  statusCode: number,
  message: string,
  errorCode?: string,
  details?: unknown
): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      message,
      code: errorCode,
      details,
    },
  };

  res.status(statusCode).json(response);
}

export function sendSuccess(
  res: Response,
  message?: string
): void {
  const response: { success: true; message?: string } = { success: true };
  
  if (message) {
    response.message = message;
  }
  
  res.status(200).json(response);
}
