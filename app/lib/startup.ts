import { runMigrations } from '@/services/database/migrations';

let initialized = false;

export async function runStartupTasks() {
  if (initialized) return;
  
  try {
    console.log('Running startup migrations...');
    await runMigrations(process.env.DATABASE_URL!);
    console.log('✅ Startup tasks completed');
    initialized = true;
  } catch (error) {
    console.error('❌ Startup tasks failed:', error);
    throw error;
  }
}