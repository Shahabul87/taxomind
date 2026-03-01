import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { currentUser } from '@/lib/auth';

/**
 * Clear all auth-related cookies to fix v4/v5 cookie conflicts.
 * POST-only to prevent CSRF via GET requests.
 */
export async function POST(request: NextRequest) {
  // Validate origin to prevent CSRF
  const origin = request.headers.get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (origin && appUrl) {
    const allowedOrigin = new URL(appUrl).origin;
    if (origin !== allowedOrigin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Require authentication
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Find all auth-related cookies (both old v4 and new v5 prefixes)
  const authCookies = allCookies.filter(c =>
    c.name.includes('authjs') ||
    c.name.includes('next-auth') ||
    c.name.includes('csrf') ||
    c.name.includes('callback') ||
    c.name.includes('session-token') ||
    c.name.includes('pkce')
  );

  const clearedCookies: string[] = [];

  for (const cookie of authCookies) {
    try {
      cookieStore.delete(cookie.name);
      clearedCookies.push(cookie.name);
    } catch (error) {
      console.error(`Failed to delete cookie ${cookie.name}:`, error);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: 'Auth cookies cleared. Please try logging in again.',
    clearedCookies,
  });

  // Explicitly delete cookies via response headers
  const cookiesToClear = [
    '__Host-authjs.csrf-token',
    '__Secure-authjs.callback-url',
    '__Secure-authjs.session-token',
    '__Secure-authjs.pkce.code_verifier',
    '__Secure-authjs.state',
    '__Secure-authjs.nonce',
    '__Host-next-auth.csrf-token',
    '__Host-next-auth.callback-url',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.pkce.code_verifier',
    '__Secure-next-auth.state',
    'authjs.csrf-token',
    'authjs.callback-url',
    'authjs.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    'next-auth.session-token',
  ];

  for (const name of cookiesToClear) {
    response.cookies.set(name, '', {
      maxAge: 0,
      path: '/',
      expires: new Date(0),
    });
  }

  return response;
}
