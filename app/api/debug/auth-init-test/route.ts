import { NextResponse } from 'next/server';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

/**
 * Auth Initialization Test
 * Tests each component of the auth system in isolation to find the exact failure point
 */
export async function GET() {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  };

  // Step 1: Check critical environment variables
  results.step1_envVars = {
    AUTH_SECRET: process.env.AUTH_SECRET ? `SET (${process.env.AUTH_SECRET.length} chars)` : 'MISSING ❌',
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || 'NOT SET',
    AUTH_URL: process.env.AUTH_URL || 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING ❌',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING ❌',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING ❌',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING ❌',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'MISSING ❌',
  };

  // Step 2: Test Prisma connection with fresh client
  try {
    const { PrismaClient } = await import('@prisma/client');
    const freshClient = new PrismaClient({ log: ['error'] });
    await freshClient.$connect();
    const count = await freshClient.user.count();
    await freshClient.$disconnect();
    results.step2_prismaConnection = { status: 'SUCCESS', userCount: count };
  } catch (error) {
    results.step2_prismaConnection = {
      status: 'FAILED ❌',
      error: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
    };
  }

  // Step 3: Test getBasePrismaClient specifically
  try {
    const { getBasePrismaClient } = await import('@/lib/db');
    const baseClient = getBasePrismaClient();
    results.step3_getBasePrismaClient = {
      status: 'SUCCESS',
      hasUserModel: typeof baseClient.user === 'object',
      hasAccountModel: typeof baseClient.account === 'object',
    };
  } catch (error) {
    results.step3_getBasePrismaClient = {
      status: 'FAILED ❌',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    };
  }

  // Step 4: Test PrismaAdapter creation
  try {
    const { PrismaAdapter } = await import('@auth/prisma-adapter');
    const { PrismaClient } = await import('@prisma/client');
    const adapterClient = new PrismaClient({ log: ['error'] });
    const adapter = PrismaAdapter(adapterClient);
    await adapterClient.$disconnect();
    results.step4_prismaAdapter = {
      status: 'SUCCESS',
      adapterMethods: Object.keys(adapter).slice(0, 8),
    };
  } catch (error) {
    results.step4_prismaAdapter = {
      status: 'FAILED ❌',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Step 5: Test auth.config.ts import
  try {
    const authConfig = await import('@/auth.config');
    results.step5_authConfig = {
      status: 'SUCCESS',
      providerCount: authConfig.default?.providers?.length || 0,
      hasSecret: !!authConfig.default?.secret,
      trustHost: authConfig.default?.trustHost,
      sessionStrategy: authConfig.default?.session?.strategy,
    };
  } catch (error) {
    results.step5_authConfig = {
      status: 'FAILED ❌',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    };
  }

  // Step 6: THE KEY TEST - Try to import the full auth module
  try {
    const authModule = await import('@/auth');
    results.step6_authModule = {
      status: 'SUCCESS',
      exports: Object.keys(authModule),
      hasHandlers: !!authModule.handlers,
      hasAuth: !!authModule.auth,
      hasSignIn: !!authModule.signIn,
    };
  } catch (error) {
    results.step6_authModule = {
      status: 'FAILED ❌',
      error: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined,
    };
  }

  // Step 7: Check NextAuth version info
  try {
    const pkg = await import('next-auth/package.json');
    results.step7_versions = {
      nextAuth: (pkg as any).version || 'unknown',
    };
  } catch {
    results.step7_versions = { nextAuth: 'Could not determine' };
  }

  // Generate summary
  const failures = Object.entries(results)
    .filter(([key, value]) =>
      key.startsWith('step') &&
      typeof value === 'object' &&
      value !== null &&
      (value as any).status?.includes('FAILED')
    )
    .map(([key]) => key);

  results.summary = {
    totalSteps: 7,
    failures: failures.length,
    failedSteps: failures,
    diagnosis: failures.length === 0
      ? '✅ All components working - issue may be in OAuth callback flow'
      : `❌ Found ${failures.length} failure(s): ${failures.join(', ')}`,
  };

  return NextResponse.json(results, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
