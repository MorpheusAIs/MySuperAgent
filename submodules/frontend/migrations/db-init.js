const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function initializeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Create recurring_jobs table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS recurring_jobs (
        id SERIAL PRIMARY KEY,
        user_identifier VARCHAR(255) NOT NULL,
        job_name VARCHAR(255) NOT NULL,
        job_description TEXT,
        message_content TEXT NOT NULL,
        schedule_type VARCHAR(50) NOT NULL, -- 'once', 'daily', 'weekly', 'monthly'
        schedule_time TIMESTAMP WITH TIME ZONE NOT NULL,
        next_run_time TIMESTAMP WITH TIME ZONE NOT NULL,
        interval_days INTEGER DEFAULT NULL, -- for custom intervals
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_run_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        run_count INTEGER DEFAULT 0,
        max_runs INTEGER DEFAULT NULL, -- optional limit on number of runs
        timezone VARCHAR(50) DEFAULT 'UTC'
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ recurring_jobs table created successfully');

    // Create index for efficient querying of scheduled jobs
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_recurring_jobs_next_run 
      ON recurring_jobs (next_run_time, is_active) 
      WHERE is_active = TRUE;
    `;

    await client.query(createIndexQuery);
    console.log('✅ Index created successfully');

    // Create update trigger for updated_at
    const createTriggerQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_recurring_jobs_updated_at ON recurring_jobs;
      CREATE TRIGGER update_recurring_jobs_updated_at
        BEFORE UPDATE ON recurring_jobs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await client.query(createTriggerQuery);
    console.log('✅ Update trigger created successfully');

    console.log('🎉 Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();