import { Client } from 'pg';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

interface Migration {
  id: string;
  name: string;
  sql: string;
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = await readdir(migrationsDir);
  
  const migrations: Migration[] = [];
  
  for (const file of files.filter(f => f.endsWith('.sql')).sort()) {
    const filePath = path.join(migrationsDir, file);
    const sql = await readFile(filePath, 'utf8');
    const [id, ...nameParts] = file.replace('.sql', '').split('-');
    const name = nameParts.join('-');
    
    migrations.push({ id, name, sql });
  }
  
  return migrations;
}

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
    
    // Load migrations from files
    const migrations = await loadMigrations();
    
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