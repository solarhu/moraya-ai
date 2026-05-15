import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../auth/user-auth';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'moraya-secret-key-change-in-production';

export function createAuthMiddleware(secret?: string) {
  const jwtSecret = secret || JWT_SECRET;

  return function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          error: 'Authorization header is required',
          code: 'MISSING_AUTH_HEADER',
        });
        return;
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
          error: 'Invalid authorization header format. Use: Bearer <token>',
          code: 'INVALID_AUTH_FORMAT',
        });
        return;
      }

      const token = parts[1];
      const payload = jwt.verify(token, jwtSecret) as JwtPayload;

      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({
        error: error instanceof Error ? error.message : 'Authentication failed',
        code: 'AUTH_FAILED',
      });
    }
  };
}

export function createOptionalAuthMiddleware(secret?: string) {
  const jwtSecret = secret || JWT_SECRET;

  return function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      jwt.verify(token, jwtSecret, (err, decoded) => {
        if (!err && decoded) {
          req.user = decoded as JwtPayload;
        }
        next();
      });
    } else {
      next();
    }
  };
}

export const authMiddleware = createAuthMiddleware();
export const optionalAuthMiddleware = createOptionalAuthMiddleware();