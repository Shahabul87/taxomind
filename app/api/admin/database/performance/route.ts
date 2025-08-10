import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { QueryPerformanceMonitor } from "@/lib/database/query-optimizer";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'query-stats':
        return NextResponse.json({
          success: true,
          stats: QueryPerformanceMonitor.getAllQueryStats()
        });

      case 'slow-queries':
        const slowQueries = QueryPerformanceMonitor.getAllQueryStats()
          .filter(stat => stat && stat.averageTime > 500)
          .sort((a, b) => (b?.averageTime || 0) - (a?.averageTime || 0));
        
        return NextResponse.json({
          success: true,
          slowQueries
        });

      case 'db-metrics':
        // Get database connection metrics
        const metrics = await getDatabaseMetrics();
        return NextResponse.json({
          success: true,
          metrics
        });

      case 'table-sizes':
        const tableSizes = await getTableSizes();
        return NextResponse.json({
          success: true,
          tableSizes
        });

      default:
        return NextResponse.json({
          success: true,
          available_actions: ['query-stats', 'slow-queries', 'db-metrics', 'table-sizes']
        });
    }

  } catch (error) {
    logger.error("Database performance API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getDatabaseMetrics() {
  try {
    // Get database connection and performance info
    const result = await db.$queryRaw`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
        (SELECT count(*) FROM pg_stat_activity) as total_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
    ` as any;

    const stats = await db.$queryRaw`
      SELECT 
        schemaname,
        relname as table_name,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables 
      ORDER BY n_live_tup DESC
      LIMIT 20
    ` as any;

    return {
      connections: result[0],
      tableStats: stats
    };
  } catch (error) {
    logger.error("Error getting database metrics:", error);
    return { error: "Failed to get database metrics" };
  }
}

async function getTableSizes() {
  try {
    const sizes = await db.$queryRaw`
      SELECT 
        schemaname,
        tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 20
    ` as any;

    return sizes;
  } catch (error) {
    logger.error("Error getting table sizes:", error);
    return { error: "Failed to get table sizes" };
  }
}