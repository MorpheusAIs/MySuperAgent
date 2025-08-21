export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Run database migrations on server startup
    const { runMigrations } = await import('@/services/database/migrations');
    
    if (process.env.DATABASE_URL) {
      try {
        console.log('🔄 Running database migrations on server startup...');
        await runMigrations(process.env.DATABASE_URL);
        console.log('✅ Database migrations completed successfully');
      } catch (error) {
        console.error('❌ Database migration failed:', error);
        // Don't crash the server, but log the error
      }
    } else {
      console.warn('⚠️  DATABASE_URL not configured, skipping migrations');
    }
  }
}