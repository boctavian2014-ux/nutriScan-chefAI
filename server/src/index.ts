import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseInfo, closePool } from './config/database';
import { initializeDatabase } from './config/schema';
import authRoutes from './routes/auth';
import scansRoutes from './routes/scans';
import { formatErrorResponse, APIError } from './utils/errors';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Type extending Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

// ==================== Middleware ====================

// Add request ID to all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Helmet for security headers
app.use(helmet());

// CORS
const corsOptions = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Strict limit for auth attempts
  skipSuccessfulRequests: false,
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/v1/', limiter);
app.use('/v1/auth/login', authLimiter);
app.use('/v1/auth/signup', authLimiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - RequestID: ${req.requestId}`
    );
  });
  
  next();
});

// ==================== Routes ====================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// Database info
app.get('/health/db', async (req: Request, res: Response) => {
  try {
    const dbInfo = await getDatabaseInfo();
    return res.status(200).json({
      success: true,
      status: 'healthy',
      database: dbInfo,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Database connection failed',
      requestId: req.requestId,
    });
  }
});

// API info
app.get('/v1/info', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    api: 'NutriLens Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// Auth routes
app.use('/v1/auth', authRoutes);

// Scans routes
app.use('/v1/scans', scansRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.requestId,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof APIError) {
    const errorResponse = formatErrorResponse(err, req.requestId);
    return res.status(err.statusCode).json(errorResponse);
  }

  const errorResponse = formatErrorResponse(err, req.requestId);
  return res.status(500).json(errorResponse);
});

// ==================== Server Startup ====================

const startServer = async () => {
  try {
    // Verify database connection (optional)
    let dbConnected = false;
    try {
      console.log('📡 Connecting to database...');
      const dbInfo = await getDatabaseInfo();
      console.log('✅ Database connected:', dbInfo.version);
      dbConnected = true;

      // Initialize database schema
      if (process.env.DB_INIT === 'true') {
        console.log('🔧 Initializing database schema...');
        await initializeDatabase();
      }
    } catch (dbError) {
      console.warn('⚠️  Database not available - running in mock mode');
      console.warn('   To use the API with real data, configure PostgreSQL');
      dbConnected = false;
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`
🚀 NutriLens API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: ${process.env.NODE_ENV || 'development'}
Port: ${PORT}
API URL: http://localhost:${PORT}/v1
Health Check: http://localhost:${PORT}/health
Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Available Endpoints:
GET  /health           - Server health check
GET  /health/db        - Database health check
GET  /v1/info          - API information
POST /v1/auth/signup   - Create user account
POST /v1/auth/login    - User login
POST /v1/auth/refresh  - Refresh access token
POST /v1/auth/logout   - User logout (requires auth)
POST /v1/scans         - Create scan from image
GET  /v1/scans/:id     - Get scan by ID
GET  /v1/scans/user/:userId - Get user's scans

      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📍 SIGTERM signal received: closing HTTP server');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📍 SIGINT signal received: closing HTTP server');
  await closePool();
  process.exit(0);
});

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
