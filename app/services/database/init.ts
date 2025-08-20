import { runMigrations } from './migrations';

let migrationPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runMigrations(process.env.DATABASE_URL!);
  }
  return migrationPromise;
}