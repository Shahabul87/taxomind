import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAdminAuth } from '@/lib/api/with-api-auth';
import { safeErrorResponse } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const GET = withAdminAuth(async (request, context) => {
  try {
    // Test basic database connectivity
    const dbTest = await db.$queryRaw`SELECT 1 as test`;

    // Check if tables exist
    const tables = await db.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    ` as Array<{ table_name: string }>;

    // Try to count users
    let userCount = 0;
    let userError = null;
    try {
      userCount = await db.user.count();
    } catch (error) {
      userError = 'Failed to count users';
    }

    // Check if User table exists
    const userTableExists = tables.some(t => t.table_name === 'User');

    // Get current database name
    const currentDb = await db.$queryRaw`
      SELECT current_database() as database
    ` as Array<{ database: string }>;

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        name: currentDb[0]?.database,
        tables: {
          count: tables.length,
          list: tables.map(t => t.table_name),
          userTableExists
        },
        userCount: userError ? `Error: ${userError}` : userCount,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
      }
    });
  } catch (error) {
    logger.error('Database health check failed', error);
    return safeErrorResponse(error, 500, 'HEALTH_DB');
  }
}, { rateLimit: { requests: 20, window: 60000 }, auditLog: true });