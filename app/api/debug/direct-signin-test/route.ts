import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  try {
    // Test 1: Check @auth/core version being used
    try {
      const fs = await import('fs');
      const path = await import('path');

      // Check the actual @auth/core being used by next-auth
      const nextAuthPath = path.join(process.cwd(), 'node_modules/next-auth/package.json');
      const authCorePath = path.join(process.cwd(), 'node_modules/@auth/core/package.json');

      if (fs.existsSync(nextAuthPath)) {
        const nextAuthPkg = JSON.parse(fs.readFileSync(nextAuthPath, 'utf-8'));
        results.nextAuthVersion = nextAuthPkg.version;
        results.nextAuthDeps = nextAuthPkg.dependencies?.['@auth/core'] || 'NOT_FOUND';
      }

      if (fs.existsSync(authCorePath)) {
        const authCorePkg = JSON.parse(fs.readFileSync(authCorePath, 'utf-8'));
        results.authCoreVersion = authCorePkg.version;
      }

      // Check @auth/prisma-adapter version
      const prismaAdapterPath = path.join(process.cwd(), 'node_modules/@auth/prisma-adapter/package.json');
      if (fs.existsSync(prismaAdapterPath)) {
        const prismaAdapterPkg = JSON.parse(fs.readFileSync(prismaAdapterPath, 'utf-8'));
        results.prismaAdapterVersion = prismaAdapterPkg.version;
        results.prismaAdapterAuthCore = prismaAdapterPkg.dependencies?.['@auth/core'] || prismaAdapterPkg.peerDependencies?.['@auth/core'] || 'NOT_FOUND';
      }
    } catch (error) {
      results.versionCheckError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 2: Try to import auth and check for errors
    try {
      const authModule = await import('@/auth');
      results.authModuleKeys = Object.keys(authModule);

      // Check if signIn exists and its type
      results.signInType = typeof authModule.signIn;
      results.handlersType = typeof authModule.handlers;
    } catch (error) {
      results.authImportError = error instanceof Error ? error.message : 'Unknown';
      results.authImportStack = error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined;
    }

    // Test 3: Try to import auth.config and check providers in detail
    try {
      const authConfig = await import('@/auth.config');
      const config = authConfig.default;

      results.configKeys = Object.keys(config || {});
      results.providersCount = config?.providers?.length || 0;

      // Check each provider
      if (config?.providers) {
        results.providersDetail = config.providers.map((p: any, index: number) => ({
          index,
          id: p.id,
          name: p.name,
          type: p.type,
          hasOptions: !!p.options,
          optionsKeys: p.options ? Object.keys(p.options) : [],
        }));
      }
    } catch (error) {
      results.configImportError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 4: Check if the authorization URL can be constructed for Google
    try {
      const Google = (await import('next-auth/providers/google')).default;

      // Create the provider with actual credentials
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      results.googleCredentials = {
        hasClientId: !!clientId,
        clientIdLength: clientId?.length || 0,
        hasClientSecret: !!clientSecret,
        clientSecretLength: clientSecret?.length || 0,
      };

      // Attempt to create provider
      const provider = Google({
        clientId: clientId!,
        clientSecret: clientSecret!,
      });

      results.googleProviderCreated = !!provider;
      results.googleProviderId = provider.id;
      results.googleProviderType = provider.type;

      // Check if it has the necessary OIDC properties
      results.googleProviderProps = {
        hasIssuer: 'issuer' in provider,
        issuer: (provider as any).issuer,
        hasWellKnown: 'wellKnown' in provider,
      };
    } catch (error) {
      results.googleProviderError = error instanceof Error ? error.message : 'Unknown';
      results.googleProviderStack = error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined;
    }

    // Test 5: Try to fetch Google OIDC config
    try {
      const response = await fetch('https://accounts.google.com/.well-known/openid-configuration');
      const config = await response.json();

      results.googleOIDC = {
        status: response.status,
        issuer: config.issuer,
        authEndpoint: config.authorization_endpoint,
        tokenEndpoint: config.token_endpoint,
      };
    } catch (error) {
      results.googleOIDCError = error instanceof Error ? error.message : 'Unknown';
    }

    return NextResponse.json({
      status: 'Direct Signin Test',
      ...results,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Direct Signin Test Error',
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
