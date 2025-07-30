const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Drop existing tables if they exist to start fresh
    console.log('🗑️  Dropping existing tables if they exist...');
    await client.query('DROP TABLE IF EXISTS recurring_jobs CASCADE;');
    
    // Create users table
    console.log('📋 Creating users table...');
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        wallet_address VARCHAR(42) PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createUsersTable);

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

    // Create jobs table (replaces conversations)
    console.log('💼 Creating jobs table...');
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL DEFAULT 'New Job',
        description TEXT,
        initial_message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        is_scheduled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        has_uploaded_file BOOLEAN DEFAULT FALSE
      );
    `;
    await client.query(createJobsTable);

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
        order_index INTEGER NOT NULL
      );
    `;
    await client.query(createMessagesTable);

    // Create scheduled_jobs table (updated to reference jobs)
    console.log('📅 Creating scheduled_jobs table...');
    const createScheduledJobsTable = `
      CREATE TABLE IF NOT EXISTS scheduled_jobs (
        id SERIAL PRIMARY KEY,
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
        schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly', 'custom')),
        schedule_time TIMESTAMP WITH TIME ZONE NOT NULL,
        next_run_time TIMESTAMP WITH TIME ZONE NOT NULL,
        interval_days INTEGER DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_run_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        run_count INTEGER DEFAULT 0,
        max_runs INTEGER DEFAULT NULL,
        timezone VARCHAR(50) DEFAULT 'UTC'
      );
    `;
    await client.query(createScheduledJobsTable);

    // Create indexes for performance
    console.log('🚀 Creating performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_jobs_wallet_address ON jobs(wallet_address);',
      'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);',
      'CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);',
      'CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(job_id, order_index);',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_wallet ON scheduled_jobs(wallet_address);',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_time, is_active) WHERE is_active = TRUE;',
      'CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_job_id ON scheduled_jobs(job_id);'
    ];

    for (const index of indexes) {
      await client.query(index);
    }

    // Create update triggers
    console.log('⚡ Creating update triggers...');
    const createUpdateTriggers = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Drop existing triggers if they exist
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
      DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
      DROP TRIGGER IF EXISTS update_scheduled_jobs_updated_at ON scheduled_jobs;

      -- Create triggers
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_user_preferences_updated_at
        BEFORE UPDATE ON user_preferences
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_jobs_updated_at
        BEFORE UPDATE ON jobs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_scheduled_jobs_updated_at
        BEFORE UPDATE ON scheduled_jobs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await client.query(createUpdateTriggers);

    // Create a function to auto-create user preferences
    console.log('🔧 Creating user preference auto-creation function...');
    const createUserPreferencesFunction = `
      CREATE OR REPLACE FUNCTION create_default_user_preferences()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO user_preferences (wallet_address)
        VALUES (NEW.wallet_address)
        ON CONFLICT (wallet_address) DO NOTHING;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS create_user_preferences_trigger ON users;
      CREATE TRIGGER create_user_preferences_trigger
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION create_default_user_preferences();
    `;

    await client.query(createUserPreferencesFunction);

    console.log('✅ All tables created successfully');
    console.log('✅ All indexes created successfully');
    console.log('✅ All triggers created successfully');
    console.log('🎉 Wallet-based system migration completed successfully!');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();