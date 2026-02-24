import { Router } from 'express';
import { signup, login, refresh, logout } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /v1/auth/signup
 * Create a new user account
 * Body: {
 *   name: string,
 *   email: string,
 *   password: string,
 *   confirmPassword: string,
 *   acceptTerms: boolean,
 *   acceptPrivacy: boolean,
 *   acceptGDPR: boolean,
 *   consentAnalytics?: boolean,
 *   consentMarketing?: boolean,
 *   platform?: string
 * }
 */
router.post('/signup', signup);

/**
 * POST /v1/auth/login
 * Authenticate user and return tokens
 * Body: {
 *   email: string,
 *   password: string,
 *   deviceId?: string,
 *   platform?: string
 * }
 */
router.post('/login', login);

/**
 * POST /v1/auth/refresh
 * Refresh access token using refresh token
 * Body: {
 *   refreshToken: string
 * }
 */
router.post('/refresh', refresh);

/**
 * POST /v1/auth/logout
 * Logout user and revoke refresh token
 * Auth: Required
 * Body: {
 *   refreshToken?: string
 * }
 */
router.post('/logout', authMiddleware, logout);

export default router;
