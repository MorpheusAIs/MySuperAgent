const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addHourlyScheduleType() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // First, drop the existing constraint
    console.log('🔄 Dropping existing schedule_type constraint...');
    await client.query(`
      ALTER TABLE jobs 
      DROP CONSTRAINT IF EXISTS jobs_schedule_type_check;
    `);

    // Then add the new constraint that includes 'hourly'
    console.log('✨ Adding new schedule_type constraint with hourly option...');
    await client.query(`
      ALTER TABLE jobs 
      ADD CONSTRAINT jobs_schedule_type_check 
      CHECK (schedule_type IS NULL OR schedule_type IN ('once', 'hourly', 'daily', 'weekly', 'custom'));
    `);

    console.log('✅ Successfully added hourly schedule type!');

  } catch (error) {
    console.error('❌ Error updating database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addHourlyScheduleType();