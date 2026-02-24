import validator from 'validator';

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

/**
 * Validate name (2-50 chars, letters/spaces/hyphens)
 */
export const validateName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Name must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { valid: true };
};

/**
 * Validate phone number format (optional)
 */
export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone || phone.trim().length === 0) {
    return { valid: true }; // Optional
  }

  if (!validator.isMobilePhone(phone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  return { valid: true };
};

/**
 * Sanitize input
 */
export const sanitizeInput = (input: string): string => {
  return validator.trim(input);
};

/**
 * Validate URL
 */
export const validateURL = (url: string): boolean => {
  return validator.isURL(url);
};

/**
 * Check if email exists pattern
 */
export const emailExists = async (email: string, query: (sql: string, params: any[]) => Promise<any>) => {
  const result = await query(
    'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.toLowerCase()]
  );
  return result.rows.length > 0;
};

/**
 * Validate UUID format
 */
export const isValidUUID = (id: string): boolean => {
  return validator.isUUID(id);
};

/**
 * Validate request body has required fields
 */
export const validateRequired = (
  data: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } => {
  const missing = requiredFields.filter(field => !data[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
};
