import { NextRequest, NextResponse } from 'next/server';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // Test 1: Try to import auth module and check for errors
  try {
    // Dynamically import to catch any initialization errors
    const authModulePromise = import('@/auth');

    // Set a timeout to catch hanging imports
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth module import timeout after 5s')), 5000);
    });

    const authModule = await Promise.race([authModulePromise, timeoutPromise]) as any;

    results.authModuleLoaded = true;
    results.authExports = Object.keys(authModule);
  } catch (error) {
    results.authModuleError = {
      message: error instanceof Error ? error.message : 'Unknown',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined,
    };
  }

  // Test 2: Check if Prisma can connect to the database
  try {
    const { PrismaClient } = await import('@prisma/client');
    const testClient = new PrismaClient({
      log: ['error'],
    });

    // Try a simple query
    const userCount = await testClient.user.count();
    await testClient.$disconnect();

    results.prismaConnection = 'SUCCESS';
    results.userCount = userCount;
  } catch (error) {
    results.prismaError = {
      message: error instanceof Error ? error.message : 'Unknown',
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code,
    };
  }

  // Test 3: Check PrismaAdapter initialization
  try {
    const { PrismaAdapter } = await import('@auth/prisma-adapter');
    const { PrismaClient } = await import('@prisma/client');

    const adapterClient = new PrismaClient({ log: ['error'] });
    const adapter = PrismaAdapter(adapterClient);
    await adapterClient.$disconnect();

    results.adapterCreated = true;
    results.adapterMethods = Object.keys(adapter);
  } catch (error) {
    results.adapterError = {
      message: error instanceof Error ? error.message : 'Unknown',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    };
  }

  // Test 4: Check environment variables
  results.envVars = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length || 0,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };

  // Test 5: Check auth.config.ts for any issues
  try {
    const authConfig = await import('@/auth.config');
    results.authConfig = {
      hasProviders: !!authConfig.default?.providers,
      providerCount: authConfig.default?.providers?.length || 0,
      hasSecret: !!authConfig.default?.secret,
      hasTrustHost: !!authConfig.default?.trustHost,
      sessionStrategy: authConfig.default?.session?.strategy,
    };
  } catch (error) {
    results.authConfigError = {
      message: error instanceof Error ? error.message : 'Unknown',
    };
  }

  // Test 6: Try to manually construct the signin flow
  try {
    const Google = (await import('next-auth/providers/google')).default;

    const googleProvider = Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    });

    results.googleProvider = {
      id: googleProvider.id,
      type: googleProvider.type,
      name: googleProvider.name,
      hasAuthorization: !!googleProvider.authorization,
    };

    // Check if the provider can fetch its well-known config
    if (googleProvider.issuer) {
      const wellKnown = await fetch(`${googleProvider.issuer}/.well-known/openid-configuration`);
      const config = await wellKnown.json();
      results.oidcDiscovery = {
        status: wellKnown.status,
        issuer: config.issuer,
        hasAuthEndpoint: !!config.authorization_endpoint,
        hasTokenEndpoint: !!config.token_endpoint,
      };
    }
  } catch (error) {
    results.googleProviderError = {
      message: error instanceof Error ? error.message : 'Unknown',
    };
  }

  return NextResponse.json({
    status: 'Auth Error Details',
    ...results,
  });
}
