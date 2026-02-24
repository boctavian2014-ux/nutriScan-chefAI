import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/jwt';
import { Unauthorized } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
  requestId: string;
}

/**
 * Middleware to verify JWT token and add user to request
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'No authentication token provided',
      requestId: req.requestId,
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
      requestId: req.requestId,
    });
  }
};

/**
 * Optional auth middleware (doesn't fail if no token, but validates if present)
 */
export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.sub,
        email: decoded.email,
      };
    } catch (error) {
      // Token invalid but not required
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
        requestId: req.requestId,
      });
    }
  }

  next();
};

/**
 * Request ID middleware - add unique request ID to all requests
 */
export const requestIdMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { v4: uuidv4 } = require('uuid');
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};
