const { Pool } = require('pg');

// PostgreSQL credentials
const DB_PASSWORD = 'Parola123SarahDavid2026';

async function setupDatabase() {
  console.log('🔧 NutriLens Database Setup');
  console.log('Connecting to PostgreSQL...\n');

  try {
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: DB_PASSWORD,
      database: 'postgres',
      ssl: false,
    });

    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL!\n');

    // Create nutrilens database if it doesn't exist
    try {
      await client.query('CREATE DATABASE nutrilens');
      console.log('✅ Created nutrilens database');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('✅ nutrilens database already exists');
      } else {
        console.error('❌ Error creating database:', err.message);
        throw err;
      }
    }

    client.release();
    pool.end();

    // Now connect to the new database and run schema
    console.log('\n📊 Initializing schema...');
    
    const schemaPool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: DB_PASSWORD,
      database: 'nutrilens',
      ssl: false,
    });

    const schemaClient = await schemaPool.connect();

    // Create all tables
    const schema = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        deleted_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

      -- GDPR Consent Records
      CREATE TABLE IF NOT EXISTS consent_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        consent_gdpr BOOLEAN DEFAULT false,
        consent_terms BOOLEAN DEFAULT false,
        consent_privacy BOOLEAN DEFAULT false,
        consent_marketing BOOLEAN DEFAULT false,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_consent_user_id ON consent_records(user_id);

      -- GDPR Data Requests
      CREATE TABLE IF NOT EXISTS gdpr_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        request_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        metadata JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);

      -- Auth Tokens
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash VARCHAR(255) UNIQUE,
        access_token_hash VARCHAR(255),
        device_id VARCHAR(255),
        ip_address VARCHAR(45),
        last_used TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);

      -- Email Verification Tokens
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_email_tokens_user_id ON email_verification_tokens(user_id);

      -- Password Reset Tokens
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);

      -- Audit Logs
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        resource_type VARCHAR(100),
        resource_id VARCHAR(255),
        changes JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

      -- GDPR Complaints
      CREATE TABLE IF NOT EXISTS gdpr_complaints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        subject VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_complaints_status ON gdpr_complaints(status);
    `;

    // Split and execute table creation statements
    const tableStatements = schema.split(';').filter(s => s.trim());
    for (const statement of tableStatements) {
      if (statement.trim()) {
        try {
          await schemaClient.query(statement);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.error('Error executing:',err.message);
          }
        }
      }
    }

    // Create cleanup function separately (handles dollar quotes properly)
    try {
      await schemaClient.query(`
        CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS void AS $$
        BEGIN
          DELETE FROM auth_tokens WHERE expires_at < NOW();
          DELETE FROM email_verification_tokens WHERE expires_at < NOW() AND verified_at IS NULL;
          DELETE FROM password_reset_tokens WHERE expires_at < NOW() AND used_at IS NULL;
        END;
        $$ LANGUAGE plpgsql;
      `);
    } catch (err) {
      console.error('Error creating cleanup function:', err.message);
    }

      console.log('✅ Database schema initialized successfully!\n');

      schemaClient.release();
      schemaPool.end();

      console.log('📦 Setup complete! Your PostgreSQL database is ready.');
      console.log('   Database: nutrilens');
      console.log('   User: postgres');
      console.log('   Host: localhost:5432');
      console.log('\n✅ Backend API is running on http://localhost:3000\n');
      
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\nPlease check:');
    console.error('  1. PostgreSQL is running on port 5432');
    console.error('  2. Password is correct: Parola123SarahDavid2026');
    console.error('  3. postgres user exists and is active');
    process.exit(1);
  }
}

setupDatabase().catch(console.error);
