import bcrypt from 'bcryptjs';

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (process.env.PASSWORD_REQUIRE_UPPERCASE === 'true') {
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
  }

  if (process.env.PASSWORD_REQUIRE_NUMBER === 'true') {
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }

  if (process.env.PASSWORD_REQUIRE_SPECIAL_CHAR === 'true') {
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
  return bcrypt.hash(password, rounds);
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Validate password is not too common
 */
const commonPasswords = [
  'password123',
  'password', 'password1',
  '123456', '123456789',
  '12345678',
  'qwerty', 'qwerty123',
  'abc123', 'admin',
  'welcome', 'login',
  'letmein', 'dragon',
  'master', 'monkey'
];

export const isCommonPassword = (password: string): boolean => {
  return commonPasswords.some(common =>
    password.toLowerCase().includes(common.toLowerCase())
  );
};
