import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Provide default password if not set to prevent "password must be a string" error
const password = process.env.DB_PASSWORD || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'nutrilens',
  user: process.env.DB_USER || 'postgres',
  password: password,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export const getDatabaseInfo = async () => {
  const res = await query('SELECT version()');
  return {
    version: res.rows[0].version,
    connected: true,
  };
};

export const closePool = async () => {
  await pool.end();
};

export default pool;
