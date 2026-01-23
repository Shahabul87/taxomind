import { NextResponse } from 'next/server';

/**
 * Auth Debug Endpoint
 *
 * This endpoint helps diagnose OAuth configuration issues in production.
 * It returns sanitized information about the auth configuration without
 * exposing sensitive secrets.
 *
 * Access: Protected by DEBUG_TOKEN or only in development mode
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  // Security: Only allow access with debug token or in development
  const isDev = process.env.NODE_ENV === 'development';
  const hasValidToken = token && token === process.env.AUTH_DEBUG_TOKEN;

  if (!isDev && !hasValidToken) {
    return NextResponse.json(
      { error: 'Unauthorized. Set AUTH_DEBUG_TOKEN env var and pass it as ?token=xxx' },
      { status: 401 }
    );
  }

  // Collect auth configuration status (sanitized - no actual secrets)
  const config = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),

    // Auth.js v5 configuration
    auth: {
      AUTH_SECRET: !!process.env.AUTH_SECRET ? 'SET' : 'MISSING ❌',
      AUTH_URL: process.env.AUTH_URL || 'NOT SET',
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || 'NOT SET ❌',
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    },

    // App URLs
    urls: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET ❌',
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL || 'NOT SET',
    },

    // OAuth providers (check if credentials are set)
    oauth: {
      google: {
        clientId: !!process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING ❌',
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING ❌',
        callbackUrl: `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/google`,
      },
      github: {
        clientId: !!process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING ❌',
        clientSecret: !!process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'MISSING ❌',
        callbackUrl: `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/github`,
      },
    },

    // Recommended fixes
    recommendations: [] as string[],
  };

  // Generate recommendations based on missing/misconfigured values
  if (config.auth.AUTH_TRUST_HOST === 'NOT SET ❌') {
    config.recommendations.push(
      '🔴 CRITICAL: Set AUTH_TRUST_HOST=true in production. Railway/Docker deployments require this.'
    );
  }

  if (config.auth.AUTH_SECRET === 'MISSING ❌') {
    config.recommendations.push(
      '🔴 CRITICAL: Set AUTH_SECRET. Generate with: openssl rand -base64 32'
    );
  }

  if (config.auth.AUTH_URL === 'NOT SET' && config.auth.NEXTAUTH_URL === 'NOT SET') {
    config.recommendations.push(
      '🔴 CRITICAL: Set AUTH_URL or NEXTAUTH_URL to your production domain (e.g., https://yourdomain.com)'
    );
  }

  if (config.urls.NEXT_PUBLIC_APP_URL === 'NOT SET ❌') {
    config.recommendations.push(
      '⚠️ Set NEXT_PUBLIC_APP_URL for consistent URL handling across the app'
    );
  }

  // Check for URL mismatch
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (authUrl && appUrl && !authUrl.includes(new URL(appUrl).host)) {
    config.recommendations.push(
      `⚠️ URL mismatch: AUTH_URL (${authUrl}) and NEXT_PUBLIC_APP_URL (${appUrl}) should use the same domain`
    );
  }

  if (config.recommendations.length === 0) {
    config.recommendations.push('✅ Auth configuration looks correct!');
  }

  return NextResponse.json(config, { status: 200 });
}
