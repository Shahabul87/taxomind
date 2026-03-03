import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAdminAuth } from '@/lib/api/with-api-auth';
import { safeErrorResponse } from '@/lib/api/safe-error';

export const GET = withAdminAuth(async (request, context) => {
  try {
    // Check if _prisma_migrations table exists
    const migrationTableExists = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '_prisma_migrations'
      ) as exists
    ` as Array<{ exists: boolean }>;

    if (!migrationTableExists[0]?.exists) {
      return NextResponse.json({
        success: false,
        error: 'Migration table does not exist. Database has not been initialized.',
        needsMigration: true
      }, { status: 500 });
    }

    // Get migration history
    const migrations = await db.$queryRaw`
      SELECT
        id,
        migration_name,
        applied_steps_count,
        finished_at,
        started_at
      FROM _prisma_migrations
      ORDER BY started_at DESC
      LIMIT 10
    ` as Array<{
      id: string;
      migration_name: string;
      applied_steps_count: number;
      finished_at: Date | null;
      started_at: Date;
    }>;

    // Check for pending migrations
    const pendingMigrations = migrations.filter(m => !m.finished_at);

    return NextResponse.json({
      success: true,
      migrations: {
        total: migrations.length,
        pending: pendingMigrations.length,
        latest: migrations[0]?.migration_name || 'None',
        list: migrations.map(m => ({
          name: m.migration_name,
          applied: m.applied_steps_count,
          finished: !!m.finished_at,
          startedAt: m.started_at
        }))
      }
    });
  } catch (error) {
    console.error('Migration check failed:', error);
    return safeErrorResponse(error, 500, 'HEALTH_MIGRATIONS');
  }
}, { rateLimit: { requests: 20, window: 60000 }, auditLog: true });