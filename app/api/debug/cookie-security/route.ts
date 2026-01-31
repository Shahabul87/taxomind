/**
 * Cookie Security Debug Endpoint
 * 
 * This endpoint provides information about the current cookie security configuration
 * and validates that OAuth flows will work correctly.
 * 
 * Only available in development and staging environments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditCookieSecurity, generateSecurityReport } from '@/lib/security/cookie-test';
import { getSecureCookieConfig } from '@/lib/security/cookie-config';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Only allow in non-production environments for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 404 }
    );
  }

  try {
    const audit = auditCookieSecurity();
    const report = generateSecurityReport();
    const cookieConfig = getSecureCookieConfig();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      audit,
      report,
      cookieConfig,
      endpoints: {
        'OAuth Test': '/api/debug/oauth-test',
        'Session Test': '/api/debug/session-test',
      },
      recommendations: [
        'Test OAuth login flows in staging environment',
        'Verify cookies are set with correct attributes',
        'Check that session timeouts work as expected',
        'Test role-based session durations',
      ],
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Cookie security audit failed:', error);
    return NextResponse.json(
      { error: 'Failed to audit cookie security', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 404 }
    );
  }

  try {
    const { testType } = await request.json();

    switch (testType) {
      case 'oauth-compatibility':
        const { testOAuthCallbackCompatibility } = await import('@/lib/security/cookie-test');
        const oauthTest = testOAuthCallbackCompatibility();
        return NextResponse.json({ test: 'oauth-compatibility', result: oauthTest });

      case 'session-security':
        const { testSessionSecurity } = await import('@/lib/security/cookie-test');
        const sessionTest = testSessionSecurity();
        return NextResponse.json({ test: 'session-security', result: sessionTest });

      case 'role-based-sessions':
        const { testRoleBasedSessions } = await import('@/lib/security/cookie-test');
        const roleTest = testRoleBasedSessions();
        return NextResponse.json({ test: 'role-based-sessions', result: roleTest });

      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use: oauth-compatibility, session-security, or role-based-sessions' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}