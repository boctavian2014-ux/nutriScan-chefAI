import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  const expiresIn = parseInt(process.env.JWT_EXPIRATION || '3600');

  return jwt.sign(
    {
      sub: userId,
      email,
      iss: 'nutrilens.app',
      aud: 'nutrilens-app',
    },
    secret,
    {
      expiresIn,
      algorithm: 'HS256',
    }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  const expiresIn = parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800');

  return jwt.sign(
    {
      sub: userId,
      type: 'refresh',
      iss: 'nutrilens.app',
    },
    secret,
    {
      expiresIn,
      algorithm: 'HS256',
    }
  );
};

/**
 * Verify and decode access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'nutrilens.app',
      audience: 'nutrilens-app',
    });

    return decoded as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify and decode refresh token
 */
export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'nutrilens.app',
    }) as any;

    if (decoded.type !== 'refresh') {
      throw new Error('Not a refresh token');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (header?: string): string | null => {
  if (!header) return null;

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Hash a token (for storage)
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a random token
 */
export const generateRandomToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
