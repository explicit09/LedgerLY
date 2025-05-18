import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Redirect HTTP requests to HTTPS outside of development.
 */
export function requireHttps(req: Request, res: Response, next: NextFunction) {
  if (!req.secure && process.env.NODE_ENV !== 'development') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
}

/**
 * Apply additional security headers beyond helmet defaults.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdn.plaid.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.plaid.com;"
  );
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

/**
 * Rate limiter for authentication endpoints.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
});
