/**
 * Production Environment Checker for Authentication
 *
 * This API endpoint helps diagnose authentication issues in production
 * by checking environment variables and database connectivity.
 *
 * Usage: GET /api/debug/check-auth-env
 *
 * SECURITY: Add authentication before deploying to production!
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {},
    errors: [],
    warnings: [],
  };

  // 1. Check Environment Variables
  diagnostics.checks.environmentVariables = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  };

  // Check critical variables
  const criticalVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  for (const varName of criticalVars) {
    if (!process.env[varName]) {
      diagnostics.errors.push(`Critical variable missing: ${varName}`);
    }
  }

  // Check NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL) {
    if (!process.env.NEXTAUTH_URL.startsWith('http')) {
      diagnostics.errors.push('NEXTAUTH_URL must start with http:// or https://');
    }
    if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      diagnostics.warnings.push('NEXTAUTH_URL should use HTTPS in production');
    }
  }

  // Check optional but recommended variables
  if (!process.env.RESEND_API_KEY) {
    diagnostics.warnings.push('RESEND_API_KEY not set - verification emails will fail');
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    diagnostics.warnings.push('Redis not configured - using in-memory rate limiting (not shared across instances)');
  }

  // 2. Check Database Connection
  try {
    await db.$queryRaw`SELECT 1 as test`;
    diagnostics.checks.database = {
      connected: true,
      message: 'Database connection successful',
    };
  } catch (error) {
    diagnostics.checks.database = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
    };
    diagnostics.errors.push('Database connection failed');
  }

  // 3. Check if critical tables exist
  try {
    const tables = [
      { name: 'User', test: async () => await db.user.count() },
      { name: 'VerificationToken', test: async () => await db.verificationToken.count() },
      { name: 'PasswordResetToken', test: async () => await db.passwordResetToken.count() },
      { name: 'TwoFactorToken', test: async () => await db.twoFactorToken.count() },
    ];

    const tableResults: Record<string, any> = {};

    for (const table of tables) {
      try {
        await table.test();
        tableResults[table.name] = { exists: true };
      } catch (error) {
        tableResults[table.name] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown',
        };
        diagnostics.errors.push(`Table missing or inaccessible: ${table.name}`);
      }
    }

    diagnostics.checks.tables = tableResults;
  } catch (error) {
    diagnostics.errors.push('Failed to check tables');
  }

  // 4. Check Prisma Client
  try {
    const userCount = await db.user.count();
    diagnostics.checks.prisma = {
      working: true,
      userCount,
      message: 'Prisma Client operational',
    };
  } catch (error) {
    diagnostics.checks.prisma = {
      working: false,
      error: error instanceof Error ? error.message : 'Unknown',
    };
    diagnostics.errors.push('Prisma Client not working correctly');
  }

  // 5. Check Rate Limiting
  try {
    const { rateLimitAuth } = await import('@/lib/rate-limit');
    const testResult = await rateLimitAuth('register', 'test-check');
    diagnostics.checks.rateLimiting = {
      working: true,
      testResult: {
        success: testResult.success,
        remaining: testResult.remaining,
        limit: testResult.limit,
      },
    };
  } catch (error) {
    diagnostics.checks.rateLimiting = {
      working: false,
      error: error instanceof Error ? error.message : 'Unknown',
    };
    diagnostics.warnings.push('Rate limiting check failed');
  }

  // 6. Check Auth Configuration
  try {
    diagnostics.checks.authConfig = {
      NEXTAUTH_URL_set: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_URL_value: process.env.NEXTAUTH_URL || 'NOT_SET',
      NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
      AUTH_SECRET_set: !!process.env.AUTH_SECRET,
      recommendedFix: process.env.NEXTAUTH_SECRET && process.env.AUTH_SECRET
        ? 'Both secrets set ✓'
        : 'Set both NEXTAUTH_SECRET and AUTH_SECRET to same value',
    };
  } catch (error) {
    diagnostics.warnings.push('Auth config check incomplete');
  }

  // Determine overall status
  const status = diagnostics.errors.length === 0 ? 'HEALTHY' : 'UNHEALTHY';
  const severity =
    diagnostics.errors.length > 0
      ? 'CRITICAL'
      : diagnostics.warnings.length > 0
      ? 'WARNING'
      : 'OK';

  return NextResponse.json(
    {
      status,
      severity,
      summary: {
        errors: diagnostics.errors.length,
        warnings: diagnostics.warnings.length,
        checksComplete: Object.keys(diagnostics.checks).length,
      },
      ...diagnostics,
      recommendations: generateRecommendations(diagnostics),
    },
    { status: diagnostics.errors.length > 0 ? 500 : 200 }
  );
}

function generateRecommendations(diagnostics: Record<string, any>): string[] {
  const recommendations: string[] = [];

  if (diagnostics.errors.length > 0) {
    recommendations.push('⚠️ CRITICAL ISSUES FOUND - Authentication will NOT work');
  }

  if (!diagnostics.checks.environmentVariables?.DATABASE_URL) {
    recommendations.push('1. Set DATABASE_URL in Railway environment variables');
  }

  if (!diagnostics.checks.environmentVariables?.NEXTAUTH_SECRET) {
    recommendations.push('2. Set NEXTAUTH_SECRET in Railway environment variables');
    recommendations.push('   Generate with: openssl rand -base64 32');
  }

  if (!diagnostics.checks.environmentVariables?.AUTH_SECRET) {
    recommendations.push('3. Set AUTH_SECRET (same value as NEXTAUTH_SECRET)');
  }

  if (
    !diagnostics.checks.environmentVariables?.NEXTAUTH_URL ||
    diagnostics.checks.environmentVariables?.NEXTAUTH_URL === 'NOT_SET'
  ) {
    recommendations.push('4. Set NEXTAUTH_URL to your production domain');
    recommendations.push('   Example: https://your-domain.com');
  }

  if (diagnostics.checks.database && !diagnostics.checks.database.connected) {
    recommendations.push('5. Fix database connection');
    recommendations.push('   - Check DATABASE_URL format');
    recommendations.push('   - Ensure database is accessible from Railway');
    recommendations.push('   - Run: railway run npx prisma migrate deploy');
  }

  if (diagnostics.errors.some((e: string) => e.includes('Table missing'))) {
    recommendations.push('6. Run database migrations:');
    recommendations.push('   railway run npx prisma migrate deploy');
  }

  if (!diagnostics.checks.environmentVariables?.RESEND_API_KEY) {
    recommendations.push('7. (Optional) Set RESEND_API_KEY for email verification');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All checks passed! Authentication should work.');
    recommendations.push('If still failing, check Railway logs: railway logs');
  }

  return recommendations;
}

// Also add POST method for testing specific scenarios
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'test-register') {
      // Test registration flow
      const testEmail = `test-${Date.now()}@example.com`;

      try {
        const { register } = await import('@/actions/register');
        const result = await register({
          email: testEmail,
          password: 'Test123!',
          name: 'Test User',
          acceptTermsAndPrivacy: true,
        });

        return NextResponse.json({
          action: 'test-register',
          result,
          cleanup: 'Remember to delete test user',
        });
      } catch (error) {
        return NextResponse.json(
          {
            action: 'test-register',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
          { status: 500 }
        );
      }
    }

    if (action === 'test-db-write') {
      // Test database write capability
      try {
        const testUser = await db.user.create({
          data: {
            name: 'Test User',
            email: `test-${Date.now()}@example.com`,
            password: 'test-hash',
          },
        });

        await db.user.delete({ where: { id: testUser.id } });

        return NextResponse.json({
          action: 'test-db-write',
          success: true,
          message: 'Database write test passed',
        });
      } catch (error) {
        return NextResponse.json(
          {
            action: 'test-db-write',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: test-register or test-db-write' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 400 }
    );
  }
}
