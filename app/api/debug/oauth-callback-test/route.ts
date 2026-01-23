import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Callback Flow Debug
 * Tests the specific OAuth callback handling to find where Configuration error occurs
 */
export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // Step 1: Check callback URLs configuration
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  results.callbackUrls = {
    baseUrl,
    google: `${baseUrl}/api/auth/callback/google`,
    github: `${baseUrl}/api/auth/callback/github`,
    note: 'These URLs must EXACTLY match what you configured in Google/GitHub OAuth apps',
  };

  // Step 2: Check for common OAuth callback issues
  results.potentialIssues = [];

  // Check if AUTH_URL is set (preferred in v5)
  if (!process.env.AUTH_URL) {
    (results.potentialIssues as string[]).push(
      '⚠️ AUTH_URL not set - Auth.js v5 prefers AUTH_URL over NEXTAUTH_URL'
    );
  }

  // Check URL consistency
  const authUrl = process.env.AUTH_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (authUrl && nextAuthUrl && authUrl !== nextAuthUrl) {
    (results.potentialIssues as string[]).push(
      `⚠️ URL mismatch: AUTH_URL=${authUrl} vs NEXTAUTH_URL=${nextAuthUrl}`
    );
  }

  // Step 3: Test actual OAuth provider configuration
  try {
    const Google = (await import('next-auth/providers/google')).default;
    const googleProvider = Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    });

    // Try to get authorization URL
    results.googleProvider = {
      id: googleProvider.id,
      name: googleProvider.name,
      type: googleProvider.type,
      authorizationUrl: googleProvider.authorization,
    };

    // Check if client ID looks valid
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    if (!clientId.endsWith('.apps.googleusercontent.com')) {
      (results.potentialIssues as string[]).push(
        '⚠️ GOOGLE_CLIENT_ID doesn\'t end with .apps.googleusercontent.com - may be invalid'
      );
    }
  } catch (error) {
    results.googleProviderError = error instanceof Error ? error.message : String(error);
  }

  // Step 4: Test the auth handlers directly
  try {
    const { handlers, auth } = await import('@/auth');
    results.handlersTest = {
      hasGET: typeof handlers.GET === 'function',
      hasPOST: typeof handlers.POST === 'function',
      hasAuth: typeof auth === 'function',
    };

    // Try to call auth() to check session
    try {
      const session = await auth();
      results.currentSession = session ? 'Has session' : 'No session';
    } catch (sessionError) {
      results.sessionError = sessionError instanceof Error ? sessionError.message : String(sessionError);
    }
  } catch (error) {
    results.handlersError = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    };
  }

  // Step 5: Try to simulate what happens during OAuth callback
  try {
    // Import NextAuth internals to test callback handling
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    // Check for auth-related cookies
    const authCookies = cookieStore.getAll().filter(c =>
      c.name.includes('authjs') ||
      c.name.includes('next-auth') ||
      c.name.includes('csrf')
    );

    results.authCookies = {
      count: authCookies.length,
      names: authCookies.map(c => c.name),
    };
  } catch (error) {
    results.cookieCheckError = error instanceof Error ? error.message : String(error);
  }

  // Step 6: Check if the issue might be CSRF related
  results.csrfCheck = {
    note: 'CSRF token mismatch can cause Configuration error during callback',
    useSecureCookies: process.env.NODE_ENV === 'production',
    expectedCookiePrefix: process.env.NODE_ENV === 'production' ? '__Secure-' : '',
  };

  // Summary
  const issues = results.potentialIssues as string[];
  results.summary = {
    issueCount: issues.length,
    recommendation: issues.length > 0
      ? 'Fix the issues listed above'
      : 'Configuration looks correct - check Google/GitHub OAuth app settings match callback URLs exactly',
  };

  // Add verification checklist
  results.verificationChecklist = {
    googleConsole: {
      url: 'https://console.cloud.google.com/apis/credentials',
      requiredCallbackUrl: `${baseUrl}/api/auth/callback/google`,
      checkItems: [
        '1. Go to your OAuth 2.0 Client ID',
        '2. Under "Authorized redirect URIs", ensure EXACT match',
        '3. No trailing slash differences',
        '4. Correct protocol (https not http)',
      ],
    },
    githubSettings: {
      url: 'https://github.com/settings/developers',
      requiredCallbackUrl: `${baseUrl}/api/auth/callback/github`,
      checkItems: [
        '1. Go to your OAuth App settings',
        '2. Check "Authorization callback URL"',
        '3. Must match EXACTLY',
      ],
    },
  };

  return NextResponse.json(results);
}
