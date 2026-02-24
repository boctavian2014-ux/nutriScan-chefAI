import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/jwt';
import { hashPassword, verifyPassword, validatePasswordStrength, isCommonPassword } from '../utils/password';
import { validateEmail, validateName, validateRequired, sanitizeInput, emailExists } from '../utils/validation';
import { BadRequest, Conflict, InternalError, Unauthorized, NotFound } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * POST /auth/signup
 * Create a new user account
 */
export const signup = async (req: AuthenticatedRequest, res: Response) => {
  const requestId = req.requestId;

  try {
    const { name, email, password, confirmPassword, acceptTerms, acceptPrivacy, acceptGDPR, consentAnalytics, consentMarketing } = req.body;

    // Validate required fields
    const { valid, missing } = validateRequired(req.body, ['name', 'email', 'password', 'confirmPassword']);
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        details: { missing },
        requestId,
      });
    }

    // Validate policy acceptance
    if (!acceptTerms || !acceptPrivacy || !acceptGDPR) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'You must accept all policies to create an account',
        requestId,
      });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        requestId,
      });
    }

    // Check if email already exists
    const userExists = await emailExists(email.toLowerCase(), query);
    if (userExists) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'Email already registered',
        requestId,
      });
    }

    // Validate name
    const nameValidation = validateName(sanitizeInput(name));
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: nameValidation.error,
        requestId,
      });
    }

    // Validate password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Passwords do not match',
        requestId,
      });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Password does not meet requirements',
        details: { errors: passwordValidation.errors },
        requestId,
      });
    }

    if (isCommonPassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Password is too common. Please choose a stronger password.',
        requestId,
      });
    }

    // Create user
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await query(
      `INSERT INTO users (id, email, password_hash, full_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, email.toLowerCase(), passwordHash, sanitizeInput(name), now, now]
    );

    // Save consent preferences
    await query(
      `INSERT INTO consent_records (id, user_id, consent_gdpr, consent_terms, consent_privacy, consent_marketing, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), userId, acceptGDPR || false, acceptTerms || false, acceptPrivacy || false, consentMarketing || false, now, now]
    );

    // Generate tokens
    const accessToken = generateAccessToken(userId, email.toLowerCase());
    const refreshToken = generateRefreshToken(userId);

    // Store refresh token
    const tokenId = uuidv4();
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    await query(
      `INSERT INTO auth_tokens (id, user_id, refresh_token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tokenId, userId, refreshTokenHash, refreshTokenExpiry, now]
    );

    // Log signup event
    const auditLogId = uuidv4();
    await query(
      `INSERT INTO audit_logs (id, user_id, action, status, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [auditLogId, userId, 'USER_SIGNUP', 'SUCCESS', req.ip || 'unknown', now]
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        userId,
        email: email.toLowerCase(),
        name: sanitizeInput(name),
        token: accessToken,
        refreshToken,
        expiresIn: parseInt(process.env.JWT_EXPIRATION || '3600'),
        onboardingRequired: true,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An error occurred during signup',
      requestId,
    });
  }
};

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
export const login = async (req: AuthenticatedRequest, res: Response) => {
  const requestId = req.requestId;

  try {
    const { email, password, deviceId, platform } = req.body;

    // Validate required fields
    const { valid, missing } = validateRequired(req.body, ['email', 'password']);
    if (!valid) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required',
        details: { missing },
        requestId,
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        requestId,
      });
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        requestId,
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        requestId,
      });
    }

    // Update last login
    const now = new Date().toISOString();
    await query(
      'UPDATE users SET last_login = $1 WHERE id = $2',
      [now, user.id]
    );

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const tokenId = uuidv4();
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await query(
      `INSERT INTO auth_tokens (id, user_id, refresh_token_hash, device_id, ip_address, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tokenId, user.id, refreshTokenHash, deviceId || 'unknown', req.ip || 'unknown', refreshTokenExpiry, now]
    );

    // Log login event
    const auditLogId = uuidv4();
    await query(
      `INSERT INTO audit_logs (id, user_id, action, status, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [auditLogId, user.id, 'USER_LOGIN', 'SUCCESS', req.ip || 'unknown', now]
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        token: accessToken,
        refreshToken,
        expiresIn: parseInt(process.env.JWT_EXPIRATION || '3600'),
        lastLogin: now,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An error occurred during login',
      requestId,
    });
  }
};

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
export const refresh = async (req: AuthenticatedRequest, res: Response) => {
  const requestId = req.requestId;

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
        requestId,
      });
    }

    // Import JWT utilities
    const { verifyRefreshToken } = await import('../utils/jwt');
    let decoded;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired refresh token',
        requestId,
      });
    }

    // Verify token exists and is not revoked
    const refreshTokenHash = hashToken(refreshToken);
    const tokenResult = await query(
      'SELECT user_id FROM auth_tokens WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()',
      [refreshTokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Refresh token is invalid or revoked',
        requestId,
      });
    }

    const userId = tokenResult.rows[0].user_id;

    // Get user email
    const userResult = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'User not found',
        requestId,
      });
    }

    const email = userResult.rows[0].email;

    // Generate new access token
    const newAccessToken = generateAccessToken(userId, email);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newAccessToken,
        expiresIn: parseInt(process.env.JWT_EXPIRATION || '3600'),
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An error occurred during token refresh',
      requestId,
    });
  }
};

/**
 * POST /auth/logout
 * Logout user and revoke refresh token
 */
export const logout = async (req: AuthenticatedRequest, res: Response) => {
  const requestId = req.requestId;

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        requestId,
      });
    }

    const { refreshToken } = req.body;

    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken);
      await query(
        'UPDATE auth_tokens SET revoked = true, revoked_at = NOW() WHERE token_hash = $1',
        [refreshTokenHash]
      );
    }

    // Log logout event
    const auditLogId = uuidv4();
    const now = new Date().toISOString();
    await query(
      `INSERT INTO audit_logs (id, user_id, action, status, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [auditLogId, req.user.userId, 'USER_LOGOUT', 'SUCCESS', req.ip || 'unknown', now]
    );

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An error occurred during logout',
      requestId,
    });
  }
};
