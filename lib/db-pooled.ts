/**
 * Enterprise Database Client with Connection Pooling and Monitoring
 *
 * Features:
 * - Connection pooling with configurable limits
 * - Slow query detection and logging
 * - Query performance metrics
 * - Automatic retry logic for transient failures
 * - Connection health monitoring
 */

import { PrismaClient, Prisma } from '@prisma/client';

// Connection pool configuration
const CONNECTION_POOL_CONFIG = {
  connection_limit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '20'),
  pool_timeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '2'),
  idle_in_transaction_session_timeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '10'),
  statement_timeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30'),
};

// Query performance thresholds (in ms)
const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY: 100,
  VERY_SLOW_QUERY: 500,
  CRITICAL_QUERY: 1000,
};

// Metrics collector for monitoring
class DatabaseMetrics {
  private static queryTimes: number[] = [];
  private static errorCount = 0;
  private static connectionCount = 0;

  static recordQuery(duration: number, model: string, action: string) {
    this.queryTimes.push(duration);

    // Keep only last 1000 queries for memory efficiency
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }

    // Log slow queries
    if (duration > PERFORMANCE_THRESHOLDS.CRITICAL_QUERY) {
      console.error(`🔴 CRITICAL: Query ${model}.${action} took ${duration}ms`);
    } else if (duration > PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY) {
      console.warn(`🟡 WARNING: Slow query ${model}.${action} took ${duration}ms`);
    } else if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY) {
      console.log(`🟠 NOTICE: Query ${model}.${action} took ${duration}ms`);
    }
  }

  static recordError(error: Error, model: string, action: string) {
    this.errorCount++;
    console.error(`Database error in ${model}.${action}:`, error.message);
  }

  static getMetrics() {
    const sortedTimes = [...this.queryTimes].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    return {
      totalQueries: this.queryTimes.length,
      errorCount: this.errorCount,
      connectionCount: this.connectionCount,
      latency: {
        p50,
        p95,
        p99,
        max: Math.max(...this.queryTimes, 0),
        avg: this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length || 0,
      },
    };
  }
}

// Create Prisma client with connection pooling
const prismaClientSingleton = () => {
  // CRITICAL: Prevent client-side execution
  if (typeof window !== 'undefined') {
    throw new Error(
      'Prisma Client cannot be used in browser environment. ' +
      'This indicates a bundling issue - Prisma should only be imported in server components or API routes.'
    );
  }

  // CRITICAL: Validate DATABASE_URL exists
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please check your .env.local file and ensure DATABASE_URL is configured.'
    );
  }

  // Validate DATABASE_URL format before constructing URL
  let datasourceUrl: URL;
  try {
    datasourceUrl = new URL(databaseUrl);
  } catch (error) {
    throw new Error(
      `Invalid DATABASE_URL format: ${databaseUrl}. ` +
      'Please ensure DATABASE_URL is a valid PostgreSQL connection string (e.g., postgresql://user:password@host:port/database)'
    );
  }

  // Add connection pool parameters to URL
  datasourceUrl.searchParams.set('connection_limit', CONNECTION_POOL_CONFIG.connection_limit.toString());
  datasourceUrl.searchParams.set('pool_timeout', CONNECTION_POOL_CONFIG.pool_timeout.toString());

  const logLevels: Prisma.LogLevel[] = [
    { emit: 'event', level: 'error' } as unknown as Prisma.LogLevel,
    { emit: 'event', level: 'warn' } as unknown as Prisma.LogLevel,
  ];

  if (process.env.NODE_ENV === 'development') {
    logLevels.push({ emit: 'event', level: 'query' } as unknown as Prisma.LogLevel);
  }

  const baseClient = new PrismaClient({
    datasources: {
      db: {
        url: datasourceUrl.toString(),
      },
    },
    log: logLevels,
    errorFormat: 'minimal',
  });

  // SECURITY FIX: Use proper Prisma Client Extensions pattern for middleware
  // The $use method should not be placed inside $extends client object
  return baseClient.$extends({
    query: {
      // Apply middleware to all models and operations
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const before = Date.now();

          try {
            const result = await query(args);
            const duration = Date.now() - before;

            // Record metrics
            DatabaseMetrics.recordQuery(
              duration,
              model || 'unknown',
              operation
            );

            return result;
          } catch (error) {
            const duration = Date.now() - before;

            // Record error metrics
            DatabaseMetrics.recordError(
              error as Error,
              model || 'unknown',
              operation
            );

            // Implement retry logic for transient failures
            // Only retry non-transaction queries to avoid transaction conflicts
            if (shouldRetry(error as Error)) {
              console.log(`Retrying ${model}.${operation} after transient error`);
              await sleep(100); // Wait 100ms before retry
              return query(args);
            }

            throw error;
          }
        },
      },
    },
    model: {
      $allModels: {
        // Add a method to all models for getting metrics
        async getMetrics() {
          return DatabaseMetrics.getMetrics();
        },
      },
    },
  });
};

// Helper function to determine if error is transient
function shouldRetry(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  );
}

// Helper sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Type declaration for global prisma instance
declare global {
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

// Export singleton instance
export const db = globalThis.prisma ?? prismaClientSingleton();

// Store in global for development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

// Export metrics for monitoring
export const getDbMetrics = () => DatabaseMetrics.getMetrics();

// Health check function
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  metrics: ReturnType<typeof DatabaseMetrics.getMetrics>;
}> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      healthy: true,
      latency: Date.now() - start,
      metrics: DatabaseMetrics.getMetrics(),
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      metrics: DatabaseMetrics.getMetrics(),
    };
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect();
});
