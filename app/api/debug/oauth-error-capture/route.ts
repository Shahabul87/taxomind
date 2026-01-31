import { NextRequest, NextResponse } from 'next/server';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Store to capture errors
let lastOAuthError: any = null;
let lastOAuthAttempt: any = null;

export function captureOAuthError(error: any, context: string) {
  lastOAuthError = {
    message: error?.message || String(error),
    name: error?.name || 'Unknown',
    stack: error?.stack?.split('\n').slice(0, 10),
    context,
    timestamp: new Date().toISOString(),
  };
}

export function captureOAuthAttempt(data: any) {
  lastOAuthAttempt = {
    ...data,
    timestamp: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    lastOAuthError,
    lastOAuthAttempt,
  };

  // Try to get more info by testing the auth flow components
  try {
    // Test 1: Check if NextAuth can be initialized
    const { auth, handlers } = await import('@/auth');
    results.authImported = true;

    // Test 2: Try to get current session
    try {
      const session = await auth();
      results.currentSession = session ? {
        hasUser: !!session.user,
        userId: session.user?.id,
        email: session.user?.email,
      } : null;
    } catch (sessionError) {
      results.sessionError = {
        message: sessionError instanceof Error ? sessionError.message : String(sessionError),
        stack: sessionError instanceof Error ? sessionError.stack?.split('\n').slice(0, 5) : undefined,
      };
    }

    // Test 3: Check Google provider specifically
    try {
      const Google = (await import('next-auth/providers/google')).default;
      const provider = Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      });

      // Check if we can construct authorization URL
      results.googleProvider = {
        id: provider.id,
        type: provider.type,
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
        clientIdPreview: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      };
    } catch (providerError) {
      results.googleProviderError = providerError instanceof Error ? providerError.message : String(providerError);
    }

    // Test 4: Check database connection and user table
    try {
      const { getBasePrismaClient } = await import('@/lib/db');
      const prisma = getBasePrismaClient();

      // Check if Account table exists and has expected structure
      const accountCount = await prisma.account.count();
      const userCount = await prisma.user.count();

      results.database = {
        connected: true,
        accountCount,
        userCount,
      };

      // Check for any recent OAuth accounts
      const recentAccounts = await prisma.account.findMany({
        take: 3,
        orderBy: { id: 'desc' },
        select: {
          provider: true,
          type: true,
          userId: true,
        },
      });
      results.recentAccounts = recentAccounts;

    } catch (dbError) {
      results.databaseError = {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any)?.code,
      };
    }

  } catch (error) {
    results.importError = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 10) : undefined,
    };
  }

  // Environment check
  results.environment = {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET_SET: !!process.env.AUTH_SECRET,
    AUTH_SECRET_LENGTH: process.env.AUTH_SECRET?.length || 0,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    AUTH_URL: process.env.AUTH_URL || 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID_SET: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET_SET: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  return NextResponse.json(results);
}
