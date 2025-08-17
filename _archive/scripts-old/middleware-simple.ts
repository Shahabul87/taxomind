import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Temporarily simplified middleware for testing CSS
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip all API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/test-') ||
    pathname.startsWith('/css-') ||
    pathname.startsWith('/basic-') ||
    pathname.startsWith('/simple-') ||
    pathname.startsWith('/simple-page')
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/courses',
    '/blog',
    '/about',
  ];

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For now, allow all routes while we test CSS
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};