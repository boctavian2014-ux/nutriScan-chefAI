const { Pool } = require('pg');

const DB_PASSWORD = 'Parola123SarahDavid2026';

async function migrateDatabase() {
  console.log('🔄 Migrating database schema...\n');

  try {
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: DB_PASSWORD,
      database: 'nutrilens',
      ssl: false,
    });

    const client = await pool.connect();

    // Add deleted_at column if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      `);
      console.log('✅ Added deleted_at column to users table');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✅ deleted_at column already exists');
      } else {
        throw err;
      }
    }

    // Update email index to consider soft deletes
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email_active 
        ON users(email) WHERE deleted_at IS NULL;
      `);
      console.log('✅ Created index on active users');
    } catch (err) {
      console.log('✅ Active users index already exists or not needed');
    }

    console.log('\n✅ Database migration completed successfully!\n');

    client.release();
    pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateDatabase().catch(console.error);
