import { query } from './database';

/**
 * Initialize database schema for NutriLens
 * Run this once to setup tables, indexes, and functions
 */
export const initializeDatabase = async () => {
  console.log('🗄️  Initializing database schema...');

  try {
    // 1. Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(500),
        email_verified BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP,
        deletion_scheduled_at TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);
    `);

    // 2. Consent records table
    await query(`
      CREATE TABLE IF NOT EXISTS consent_records (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        consent_type VARCHAR(50) NOT NULL,
        granted BOOLEAN NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        version VARCHAR(10),
        metadata JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_consent_type ON consent_records(consent_type);
      CREATE INDEX IF NOT EXISTS idx_consent_timestamp ON consent_records(timestamp);
    `);

    // 3. GDPR requests table (data access/deletion)
    await query(`
      CREATE TABLE IF NOT EXISTS gdpr_requests (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        expires_at TIMESTAMP,
        metadata JSONB,
        data_deleted JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_gdpr_user ON gdpr_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_gdpr_status ON gdpr_requests(status);
      CREATE INDEX IF NOT EXISTS idx_gdpr_type ON gdpr_requests(request_type);
    `);

    // 4. Auth tokens table (for blacklisting and tracking)
    await query(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_type VARCHAR(20) NOT NULL,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        device_id VARCHAR(100),
        platform VARCHAR(20),
        expires_at TIMESTAMP NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_tokens_user ON auth_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_tokens_expires ON auth_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_tokens_revoked ON auth_tokens(revoked);
    `);

    // 5. Email verification tokens
    await query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_email_verify_user ON email_verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_verify_expires ON email_verification_tokens(expires_at);
    `);

    // 6. Password reset tokens
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens(expires_at);
    `);

    // 7. Audit logs
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(50),
        resource_id VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(20),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    `);

    // 8. GDPR complaints
    await query(`
      CREATE TABLE IF NOT EXISTS gdpr_complaints (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50),
        status VARCHAR(50) DEFAULT 'RECEIVED',
        reference_number VARCHAR(100) UNIQUE,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        metadata JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_complaint_user ON gdpr_complaints(user_id);
      CREATE INDEX IF NOT EXISTS idx_complaint_status ON gdpr_complaints(status);
    `);

    // 9. Create cleanup function for expired records
    await query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS void AS $$
      BEGIN
        DELETE FROM email_verification_tokens WHERE expires_at < NOW();
        DELETE FROM password_reset_tokens WHERE expires_at < NOW();
        DELETE FROM auth_tokens WHERE expires_at < NOW() AND revoked = true;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error);
    throw error;
  }
};

/**
 * Drop all tables (use with caution!)
 */
export const dropAllTables = async () => {
  console.warn('⚠️  Dropping all tables...');

  try {
    await query(`
      DROP TABLE IF EXISTS gdpr_complaints CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS password_reset_tokens CASCADE;
      DROP TABLE IF EXISTS email_verification_tokens CASCADE;
      DROP TABLE IF EXISTS auth_tokens CASCADE;
      DROP TABLE IF EXISTS gdpr_requests CASCADE;
      DROP TABLE IF EXISTS consent_records CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP FUNCTION IF EXISTS cleanup_expired_tokens() CASCADE;
    `);

    console.log('✅ All tables dropped');
  } catch (error) {
    console.error('❌ Failed to drop tables:', error);
    throw error;
  }
};
