import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Validate request using express-validator. Returns 400 if any errors exist.
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}
