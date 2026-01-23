import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Clear all auth-related cookies to fix v4/v5 cookie conflicts
 * The "Configuration" error on first OAuth login is often caused by
 * old next-auth v4 cookies conflicting with new authjs v5 cookies
 */
export async function GET() {
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

  // Clear each auth cookie
  for (const cookie of authCookies) {
    try {
      // Try to delete with various options to ensure deletion
      cookieStore.delete(cookie.name);
      clearedCookies.push(cookie.name);
    } catch (error) {
      console.error(`Failed to delete cookie ${cookie.name}:`, error);
    }
  }

  // Set response with cookie deletion headers
  const response = NextResponse.json({
    success: true,
    message: 'Auth cookies cleared. Please try logging in again.',
    clearedCookies,
    instruction: 'After seeing this response, go to /auth/login and try Google/GitHub login again',
  });

  // Explicitly delete cookies via response headers for all possible prefixes and names
  const cookiesToClear = [
    // Auth.js v5 cookies
    '__Host-authjs.csrf-token',
    '__Secure-authjs.callback-url',
    '__Secure-authjs.session-token',
    '__Secure-authjs.pkce.code_verifier',
    '__Secure-authjs.state',
    '__Secure-authjs.nonce',
    // Old next-auth v4 cookies
    '__Host-next-auth.csrf-token',
    '__Host-next-auth.callback-url',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.pkce.code_verifier',
    '__Secure-next-auth.state',
    // Non-prefixed versions
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

export async function POST() {
  // Same as GET for convenience
  return GET();
}
