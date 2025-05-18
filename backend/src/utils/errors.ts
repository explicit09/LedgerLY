import { Response } from 'express';

export class BadRequestError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
  }
}

export class UnauthorizedError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errorCode?: string,
  details?: any
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode || 'INTERNAL_SERVER_ERROR',
      message,
      details,
    },
  });
};

export const sendSuccessResponse = (res: Response, data: any) => {
  return res.status(200).json({
    success: true,
    data,
  });
};
