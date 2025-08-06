const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Drop old tables if they exist
    console.log('🗑️  Dropping old tables if they exist...');
    await client.query('DROP TABLE IF EXISTS recurring_jobs CASCADE;');
    await client.query('DROP TABLE IF EXISTS scheduled_jobs CASCADE;');
    await client.query('DROP TABLE IF EXISTS messages CASCADE;');
    await client.query('DROP TABLE IF EXISTS jobs CASCADE;');
    await client.query('DROP TABLE IF EXISTS user_preferences CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');
    
    // Create users table
    console.log('👤 Creating users table...');
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        wallet_address VARCHAR(42) PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUsersTable);
    console.log('✅ users table created successfully');

    // Create user_preferences table
    console.log('⚙️  Creating user_preferences table...');
    const createUserPreferencesTable = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        wallet_address VARCHAR(42) PRIMARY KEY REFERENCES users(wallet_address) ON DELETE CASCADE,
        auto_schedule_jobs BOOLEAN DEFAULT FALSE,
        default_schedule_type VARCHAR(20) DEFAULT 'daily',
        default_schedule_time TIME DEFAULT '09:00:00',
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUserPreferencesTable);
    console.log('✅ user_preferences table created successfully');

    // Create jobs table with optional scheduling fields
    console.log('💼 Creating jobs table...');
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL DEFAULT 'New Job',
        description TEXT,
        initial_message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        has_uploaded_file BOOLEAN DEFAULT FALSE,
        
        -- Optional scheduling fields
        is_scheduled BOOLEAN DEFAULT FALSE,
        schedule_type VARCHAR(20) DEFAULT NULL CHECK (schedule_type IS NULL OR schedule_type IN ('once', 'hourly', 'daily', 'weekly', 'custom')),
        schedule_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        next_run_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        interval_days INTEGER DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_run_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        run_count INTEGER DEFAULT 0,
        max_runs INTEGER DEFAULT NULL,
        timezone VARCHAR(50) DEFAULT 'UTC'
      );
    `;
    await client.query(createJobsTable);
    console.log('✅ jobs table created successfully');

    // Create messages table
    console.log('💬 Creating messages table...');
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content JSONB NOT NULL,
        response_type VARCHAR(50),
        agent_name VARCHAR(100),
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        requires_action BOOLEAN DEFAULT FALSE,
        action_type VARCHAR(50),
        is_streaming BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        order_index INTEGER NOT NULL DEFAULT 0
      );
    `;
    await client.query(createMessagesTable);
    console.log('✅ messages table created successfully');

    // Create indexes for efficient querying
    console.log('🔍 Creating indexes...');
    const createIndexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_jobs_wallet_address ON jobs (wallet_address);',
      'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);',
      'CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON jobs (is_scheduled, is_active, next_run_time) WHERE is_scheduled = TRUE;',
      'CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages (job_id);',
      'CREATE INDEX IF NOT EXISTS idx_messages_order ON messages (job_id, order_index);'
    ];

    for (const query of createIndexQueries) {
      await client.query(query);
    }
    console.log('✅ Indexes created successfully');

    // Create update trigger for updated_at
    console.log('🔄 Creating update triggers...');
    const createTriggerQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
      CREATE TRIGGER update_user_preferences_updated_at
        BEFORE UPDATE ON user_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
      CREATE TRIGGER update_jobs_updated_at
        BEFORE UPDATE ON jobs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await client.query(createTriggerQuery);
    console.log('✅ Update triggers created successfully');

    console.log('🎉 Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();