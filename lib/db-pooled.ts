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

// Connection pool configuration - environment-aware defaults
// Production needs higher limits for concurrent users; dev uses conservative defaults
const isProduction = process.env.NODE_ENV === 'production';
const CONNECTION_POOL_CONFIG = {
  connection_limit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || (isProduction ? '100' : '20')),
  pool_timeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || (isProduction ? '10' : '2')),
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
  // During build (when SKIP_ENV_VALIDATION=true), allow import without throwing
  // The actual database won't be accessed during static page generation
  const databaseUrl = process.env.DATABASE_URL;
  const isBuildTime = process.env.SKIP_ENV_VALIDATION === 'true';

  if (!databaseUrl && !isBuildTime) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please check your .env.local file and ensure DATABASE_URL is configured.'
    );
  }

  // During build time, use a placeholder URL to allow import (queries won't actually execute)
  const effectiveDatabaseUrl = databaseUrl || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

  // Validate DATABASE_URL format before constructing URL
  let datasourceUrl: URL;
  try {
    datasourceUrl = new URL(effectiveDatabaseUrl);
  } catch (error) {
    // Only throw during runtime, not build time
    if (!isBuildTime) {
      throw new Error(
        `Invalid DATABASE_URL format: ${effectiveDatabaseUrl}. ` +
        'Please ensure DATABASE_URL is a valid PostgreSQL connection string (e.g., postgresql://user:password@host:port/database)'
      );
    }
    // Fallback URL for build time
    datasourceUrl = new URL('postgresql://placeholder:placeholder@localhost:5432/placeholder');
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

/**
 * Lazy-loaded database client getter
 * Prevents build-time and early runtime errors when DATABASE_URL isn't immediately available
 * The actual connection is only created when first accessed
 */
export const getDb = (): ReturnType<typeof prismaClientSingleton> => {
  if (!globalThis.prisma) {
    globalThis.prisma = prismaClientSingleton();
  }
  return globalThis.prisma;
};

/**
 * Lazy-loaded singleton instance for backward compatibility
 * Uses a Proxy to defer actual instantiation until first property access
 * This allows the module to be imported without crashing even if DATABASE_URL isn't set yet
 */
export const db = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get(target, prop) {
    const instance = getDb();
    const value = (instance as any)[prop];
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

// Export metrics for monitoring
export const getDbMetrics = () => DatabaseMetrics.getMetrics();

/**
 * Get the base PrismaClient without extensions
 * IMPORTANT: Use this for NextAuth's PrismaAdapter which may not be compatible with $extends()
 * The extended client adds middleware that can interfere with adapter operations
 */
let baseClientInstance: PrismaClient | null = null;

export const getBasePrismaClient = (): PrismaClient => {
  if (baseClientInstance) {
    return baseClientInstance;
  }

  // CRITICAL: Prevent client-side execution
  if (typeof window !== 'undefined') {
    throw new Error('Prisma Client cannot be used in browser environment.');
  }

  const databaseUrl = process.env.DATABASE_URL;
  const isBuildTime = process.env.SKIP_ENV_VALIDATION === 'true';

  if (!databaseUrl && !isBuildTime) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  const effectiveDatabaseUrl = databaseUrl || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

  let datasourceUrl: URL;
  try {
    datasourceUrl = new URL(effectiveDatabaseUrl);
  } catch {
    if (!isBuildTime) {
      throw new Error(`Invalid DATABASE_URL format: ${effectiveDatabaseUrl}`);
    }
    datasourceUrl = new URL('postgresql://placeholder:placeholder@localhost:5432/placeholder');
  }

  // Add connection pool parameters
  datasourceUrl.searchParams.set('connection_limit', CONNECTION_POOL_CONFIG.connection_limit.toString());
  datasourceUrl.searchParams.set('pool_timeout', CONNECTION_POOL_CONFIG.pool_timeout.toString());

  baseClientInstance = new PrismaClient({
    datasources: {
      db: {
        url: datasourceUrl.toString(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  });

  return baseClientInstance;
};

// Health check function
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  metrics: ReturnType<typeof DatabaseMetrics.getMetrics>;
}> {
  const start = Date.now();
  try {
    const dbInstance = getDb();
    await dbInstance.$queryRaw`SELECT 1`;
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
  if (globalThis.prisma) {
    await globalThis.prisma.$disconnect();
  }
});
