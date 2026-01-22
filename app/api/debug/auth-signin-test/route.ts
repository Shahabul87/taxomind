import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This endpoint tests what happens when NextAuth tries to create a signin URL
    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    // Test 1: Check if we can import the auth configuration
    try {
      const authConfig = await import('@/auth.config');
      const providers = authConfig.default?.providers || [];
      results.providerCount = providers.length;
      results.providerNames = providers.map((p: { id?: string; name?: string }) => p.id || p.name || 'unknown');
    } catch (error) {
      results.authConfigError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test 2: Try to manually construct what NextAuth does for Google signin
    try {
      const Google = (await import('next-auth/providers/google')).default;
      const googleProvider = Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        },
      });

      // Check if the provider has all required fields
      results.googleProvider = {
        id: googleProvider.id,
        name: googleProvider.name,
        type: googleProvider.type,
        hasAuthorization: !!googleProvider.authorization,
        hasToken: !!googleProvider.token,
        hasUserinfo: !!googleProvider.userinfo,
      };

      // Try to get the authorization endpoint
      if (googleProvider.authorization) {
        const authUrl = typeof googleProvider.authorization === 'string'
          ? googleProvider.authorization
          : (googleProvider.authorization as { url?: string })?.url || 'OBJECT_CONFIG';
        results.googleAuthUrl = authUrl;
      }
    } catch (error) {
      results.googleProviderError = error instanceof Error ? error.message : 'Unknown error';
      results.googleProviderStack = error instanceof Error ? error.stack : undefined;
    }

    // Test 3: Check if the full auth.ts can be loaded without errors
    try {
      const { handlers, auth, signIn } = await import('@/auth');
      results.authImport = {
        hasHandlers: !!handlers,
        hasAuth: !!auth,
        hasSignIn: !!signIn,
      };
    } catch (error) {
      results.authImportError = error instanceof Error ? error.message : 'Unknown error';
      results.authImportStack = error instanceof Error ? error.stack : undefined;
    }

    // Test 4: Try to fetch Google's OIDC discovery document
    try {
      const discoveryUrl = 'https://accounts.google.com/.well-known/openid-configuration';
      const response = await fetch(discoveryUrl);
      const data = await response.json();
      results.googleOIDCDiscovery = {
        status: response.status,
        hasAuthorizationEndpoint: !!data.authorization_endpoint,
        hasTokenEndpoint: !!data.token_endpoint,
        issuer: data.issuer,
      };
    } catch (error) {
      results.googleOIDCDiscoveryError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test 5: Check environment variable format
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    const githubClientId = process.env.GITHUB_CLIENT_ID || '';

    results.envVarFormat = {
      googleClientIdValid: googleClientId.length > 0 && googleClientId.endsWith('.apps.googleusercontent.com'),
      googleClientIdLength: googleClientId.length,
      googleClientIdPrefix: googleClientId.substring(0, 10) + '...',
      githubClientIdValid: githubClientId.length > 0 && /^[a-zA-Z0-9]+$/.test(githubClientId),
      githubClientIdLength: githubClientId.length,
    };

    return NextResponse.json({
      status: 'Auth Signin Test',
      ...results,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Auth Signin Test Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
