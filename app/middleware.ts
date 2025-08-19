import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Note: Database migrations are now handled by the init service
  // Middleware cannot run database operations in Edge runtime
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}