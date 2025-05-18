import { AppError } from './app-error';

export class UnauthorizedError extends AppError {
  statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
