import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
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
      userError = error instanceof Error ? error.message : 'Unknown error';
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
    console.error('Database health check failed:', error);

    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Database connection failed',
        type: error instanceof Error ? error.constructor.name : 'Unknown',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
      }
    }, { status: 500 });
  }
}