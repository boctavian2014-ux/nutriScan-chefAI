export class APIError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export const BadRequest = (message: string, errorCode: string = 'VALIDATION_ERROR', details?: any) => {
  return new APIError(400, errorCode, message, details);
};

export const Unauthorized = (message: string = 'Unauthorized', errorCode: string = 'UNAUTHORIZED') => {
  return new APIError(401, errorCode, message);
};

export const Forbidden = (message: string = 'Access forbidden', errorCode: string = 'FORBIDDEN') => {
  return new APIError(403, errorCode, message);
};

export const NotFound = (message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') => {
  return new APIError(404, errorCode, message);
};

export const Conflict = (message: string = 'Resource already exists', errorCode: string = 'CONFLICT') => {
  return new APIError(409, errorCode, message);
};

export const RateLimited = (message: string = 'Too many requests', errorCode: string = 'RATE_LIMITED') => {
  return new APIError(429, errorCode, message);
};

export const InternalError = (message: string = 'Internal server error', errorCode: string = 'SERVER_ERROR') => {
  return new APIError(500, errorCode, message);
};

/**
 * Format error response
 */
export const formatErrorResponse = (error: APIError | Error, requestId: string) => {
  if (error instanceof APIError) {
    return {
      success: false,
      error: error.errorCode,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  return {
    success: false,
    error: 'SERVER_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId,
  };
};
