import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider') || 'google';

    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      provider,
    };

    // Test 1: Import and check auth configuration
    try {
      const authModule = await import('@/auth');
      results.authModuleLoaded = true;
      results.hasHandlers = !!authModule.handlers;
      results.hasSignIn = !!authModule.signIn;
    } catch (error) {
      results.authModuleError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 2: Try to access the signin endpoint internally
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';
      const signinUrl = `${baseUrl}/api/auth/signin/${provider}`;

      const response = await fetch(signinUrl, {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects
        headers: {
          'User-Agent': 'Debug-Test',
        },
      });

      results.signinResponse = {
        status: response.status,
        statusText: response.statusText,
        location: response.headers.get('location'),
        redirectsToError: response.headers.get('location')?.includes('error='),
      };

      // If it's a redirect, check where it goes
      if (response.status === 302 || response.status === 307) {
        const location = response.headers.get('location') || '';
        if (location.includes('error=Configuration')) {
          results.diagnosis = 'NextAuth is returning Configuration error during signin';
        } else if (location.includes('accounts.google.com') || location.includes('github.com')) {
          results.diagnosis = 'OAuth flow is working - redirects to provider';
        } else {
          results.diagnosis = `Redirects to: ${location}`;
        }
      }
    } catch (error) {
      results.signinFetchError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 3: Check if we can access the callback URL structure
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com';
      results.expectedCallbackUrl = `${baseUrl}/api/auth/callback/${provider}`;
      results.configuredBaseUrl = baseUrl;
    } catch (error) {
      results.callbackUrlError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 4: Check @auth/core version (this is what NextAuth v5 uses internally)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const authCorePath = path.join(process.cwd(), 'node_modules/@auth/core/package.json');
      if (fs.existsSync(authCorePath)) {
        const pkg = JSON.parse(fs.readFileSync(authCorePath, 'utf-8'));
        results.authCoreVersion = pkg.version;
      }
    } catch {
      results.authCoreVersion = 'COULD_NOT_DETERMINE';
    }

    // Test 5: Verify provider configuration in auth.config
    try {
      const authConfig = await import('@/auth.config');
      const providers = authConfig.default?.providers || [];

      const targetProvider = providers.find((p: { id?: string }) => p.id === provider);
      if (targetProvider) {
        results.providerConfig = {
          id: targetProvider.id,
          name: targetProvider.name,
          type: targetProvider.type,
          // Check if required options are present
          hasClientId: !!targetProvider.clientId || !!targetProvider.options?.clientId,
          hasClientSecret: !!targetProvider.clientSecret || !!targetProvider.options?.clientSecret,
        };
      } else {
        results.providerConfig = `Provider '${provider}' not found in config`;
      }
    } catch (error) {
      results.providerConfigError = error instanceof Error ? error.message : 'Unknown';
    }

    return NextResponse.json({
      status: 'OAuth Flow Test',
      ...results,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'OAuth Flow Test Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
