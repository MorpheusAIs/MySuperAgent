import { Client } from 'pg';

interface Migration {
  id: string;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    id: '003',
    name: 'add-teams-table',
    sql: `
      CREATE TABLE IF NOT EXISTS teams (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        agents TEXT[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_teams_wallet ON teams(wallet_address);
      
      -- Create trigger for teams updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
      CREATE TRIGGER update_teams_updated_at BEFORE UPDATE
        ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `
  }
];

export async function runMigrations(connectionString: string) {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get already executed migrations
    const { rows } = await client.query('SELECT id FROM migrations');
    const executedMigrations = new Set(rows.map(row => row.id));
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.has(migration.id)) {
        console.log(`Running migration: ${migration.name}`);
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO migrations (id, name) VALUES ($1, $2)',
          [migration.id, migration.name]
        );
        console.log(`✅ Migration ${migration.name} completed`);
      }
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await client.end();
  }
}