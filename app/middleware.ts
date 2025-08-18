import { NextRequest, NextResponse } from 'next/server';
import { runMigrations } from './services/database/migrations';

let migrationRan = false;

export async function middleware(request: NextRequest) {
  // Run migrations once on server startup
  if (!migrationRan && process.env.DATABASE_URL) {
    try {
      console.log('Running database migrations on server startup...');
      await runMigrations(process.env.DATABASE_URL);
      migrationRan = true;
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}