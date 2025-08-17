/**
 * Database Connection Pool Manager
 * Phase 3.1: Advanced connection pooling for PostgreSQL
 * Part of Enterprise Code Quality Plan Phase 3
 */

import { PrismaClient } from '@prisma/client';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { logger } from '@/lib/logger';

interface ConnectionPoolConfig {
  // Basic connection settings
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  
  // Pool settings
  min?: number;           // Minimum connections in pool
  max?: number;           // Maximum connections in pool
  acquireTimeoutMillis?: number;  // Time to wait for connection
  createTimeoutMillis?: number;   // Time to wait for new connection creation
  destroyTimeoutMillis?: number;  // Time to wait for connection destruction
  idleTimeoutMillis?: number;     // Time before idle connections are closed
  reapIntervalMillis?: number;    // How often to check for idle connections
  createRetryIntervalMillis?: number; // Retry interval for failed connections
  
  // Advanced settings
  connectionTimeoutMillis?: number;
  statement_timeout?: number;
  query_timeout?: number;
  application_name?: string;
}

interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  poolUtilization: number;
  connectionErrors: number;
  lastError?: string;
}

interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  executionTime: number;
  fromPool: boolean;
}

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool;
  private pool: Pool | null = null;
  private metrics: PoolMetrics;
  private isInitialized = false;
  private queryTimes: number[] = [];
  private readonly maxQueryTimeHistory = 1000;

  private constructor() {
    this.metrics = {
      totalConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      poolUtilization: 0,
      connectionErrors: 0,
    };
  }

  static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool();
    }
    return DatabaseConnectionPool.instance;
  }

  /**
   * Initialize the connection pool
   */
  async initialize(config?: ConnectionPoolConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const poolConfig = this.createPoolConfig(config);
      this.pool = new Pool(poolConfig);

      this.setupEventHandlers();
      this.startMetricsCollection();

      // Test the connection
      await this.testConnection();

      this.isInitialized = true;
      logger.info('Database connection pool initialized successfully');
    } catch (error) {
      logger.error("Failed to initialize database connection pool:", error as Error);
      this.metrics.connectionErrors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Create pool configuration from environment and options
   */
  private createPoolConfig(config?: ConnectionPoolConfig): PoolConfig {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl) {
      // Parse DATABASE_URL
      const url = new URL(databaseUrl);
      
      return {
        host: config?.host || url.hostname,
        port: config?.port || parseInt(url.port) || 5432,
        database: config?.database || url.pathname.slice(1),
        user: config?.user || url.username,
        password: config?.password || url.password,
        
        // Pool configuration
        min: config?.min || 2,
        max: config?.max || this.getOptimalMaxConnections(),
        // acquireTimeoutMillis: config?.acquireTimeoutMillis || 60000, // Not supported by pg Pool
        createTimeoutMillis: config?.createTimeoutMillis || 30000,
        destroyTimeoutMillis: config?.destroyTimeoutMillis || 5000,
        idleTimeoutMillis: config?.idleTimeoutMillis || 300000, // 5 minutes
        reapIntervalMillis: config?.reapIntervalMillis || 10000,  // 10 seconds
        createRetryIntervalMillis: config?.createRetryIntervalMillis || 200,
        
        // Advanced PostgreSQL settings
        connectionTimeoutMillis: config?.connectionTimeoutMillis || 10000,
        statement_timeout: config?.statement_timeout || 60000,
        query_timeout: config?.query_timeout || 30000,
        application_name: config?.application_name || 'taxomind-app',
        
        // SSL settings for production
        ssl: process.env.NODE_ENV === 'production' && !url.searchParams.get('sslmode')?.includes('disable')
          ? { rejectUnauthorized: false }
          : false,
      };
    }

    // Fallback to individual environment variables
    return {
      host: config?.host || process.env.DB_HOST || 'localhost',
      port: config?.port || parseInt(process.env.DB_PORT || '5432'),
      database: config?.database || process.env.DB_NAME || 'taxomind',
      user: config?.user || process.env.DB_USER || 'postgres',
      password: config?.password || process.env.DB_PASSWORD || '',
      
      min: config?.min || 2,
      max: config?.max || this.getOptimalMaxConnections(),
      acquireTimeoutMillis: config?.acquireTimeoutMillis || 60000,
      createTimeoutMillis: config?.createTimeoutMillis || 30000,
      destroyTimeoutMillis: config?.destroyTimeoutMillis || 5000,
      idleTimeoutMillis: config?.idleTimeoutMillis || 300000,
      reapIntervalMillis: config?.reapIntervalMillis || 10000,
      createRetryIntervalMillis: config?.createRetryIntervalMillis || 200,
      
      connectionTimeoutMillis: config?.connectionTimeoutMillis || 10000,
      statement_timeout: config?.statement_timeout || 60000,
      query_timeout: config?.query_timeout || 30000,
      application_name: config?.application_name || 'taxomind-app',
    };
  }

  /**
   * Calculate optimal max connections based on environment
   */
  private getOptimalMaxConnections(): number {
    // Base calculation on available CPU cores and environment
    const cpuCores = require('os').cpus().length;
    
    if (process.env.NODE_ENV === 'production') {
      // Production: More conservative approach
      return Math.max(cpuCores * 2, 10);
    } else {
      // Development: Fewer connections to avoid overwhelming local DB
      return Math.max(cpuCores, 5);
    }
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    if (!this.pool) return;

    this.pool.on('connect', (client) => {
      this.metrics.totalConnections++;
      logger.info('New client connected to pool');
    });

    this.pool.on('acquire', (client) => {
      logger.info('Client acquired from pool');
    });

    this.pool.on('release', (client) => {
      logger.info('Client released back to pool');
    });

    this.pool.on('remove', (client) => {
      this.metrics.totalConnections--;
      logger.info('Client removed from pool');
    });

    this.pool.on('error', (error, client) => {
      this.metrics.connectionErrors++;
      this.metrics.lastError = error.message;
      logger.error("Unexpected error on idle client:", error as Error);
    });
  }

  /**
   * Start collecting pool metrics
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      if (this.pool) {
        this.metrics.totalConnections = this.pool.totalCount;
        this.metrics.idleConnections = this.pool.idleCount;
        this.metrics.waitingClients = this.pool.waitingCount;
        
        // Calculate pool utilization
        const activeConnections = this.metrics.totalConnections - this.metrics.idleConnections;
        this.metrics.poolUtilization = this.metrics.totalConnections > 0 
          ? (activeConnections / this.metrics.totalConnections) * 100 
          : 0;

        // Calculate average query time
        if (this.queryTimes.length > 0) {
          this.metrics.averageQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
        }
      }
    }, 5000); // Collect metrics every 5 seconds
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      logger.info('Database connection test successful');
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query using the connection pool
   */
  async query<T = any>(
    text: string, 
    params?: any[], 
    timeout?: number
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }

    const startTime = Date.now();
    let client: PoolClient | null = null;

    try {
      this.metrics.totalQueries++;

      // Get client from pool
      client = await this.pool.connect();

      // Set query timeout if specified
      if (timeout) {
        await client.query(`SET statement_timeout = ${timeout}`);
      }

      // Execute query
      const result = await client.query(text, params);
      const executionTime = Date.now() - startTime;

      // Track metrics
      this.metrics.successfulQueries++;
      this.trackQueryTime(executionTime);

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        executionTime,
        fromPool: true,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.metrics.failedQueries++;
      this.trackQueryTime(executionTime);

      logger.error("Database query error:", error as Error);
      throw error;

    } finally {
      // Always release the client back to the pool
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Execute a transaction using the connection pool
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    timeout?: number
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      if (timeout) {
        await client.query(`SET statement_timeout = ${timeout}`);
      }

      const result = await callback(client);
      await client.query('COMMIT');
      
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;

    } finally {
      client.release();
    }
  }

  /**
   * Track query execution time
   */
  private trackQueryTime(time: number): void {
    this.queryTimes.push(time);
    
    // Keep only recent query times
    if (this.queryTimes.length > this.maxQueryTimeHistory) {
      this.queryTimes = this.queryTimes.slice(-this.maxQueryTimeHistory);
    }
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  /**
   * Get pool health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  } {
    if (!this.pool) {
      return {
        status: 'unhealthy',
        details: { error: 'Pool not initialized' },
      };
    }

    const metrics = this.getMetrics();
    
    // Determine health based on various factors
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (metrics.connectionErrors > 5) {
      status = 'unhealthy';
    } else if (metrics.poolUtilization > 90 || metrics.waitingClients > 0) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        metrics,
        poolConfig: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        },
      },
    };
  }

  /**
   * Gracefully shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    if (this.pool) {
      logger.info('Shutting down database connection pool...');
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      logger.info('Database connection pool shutdown complete');
    }
  }

  /**
   * Create a Prisma client with connection pooling
   */
  createPrismaClientWithPool(): PrismaClient {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Configure Prisma to work well with connection pooling
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      errorFormat: 'pretty',
    });
  }
}

// Export singleton instance
export const connectionPool = DatabaseConnectionPool.getInstance();

// Helper function to initialize pool with default config
export async function initializeConnectionPool(config?: ConnectionPoolConfig): Promise<void> {
  await connectionPool.initialize(config);
}

// Helper function for direct SQL queries
export async function executeQuery<T = any>(
  sql: string,
  params?: any[],
  timeout?: number
): Promise<QueryResult<T>> {
  return connectionPool.query<T>(sql, params, timeout);
}

// Helper function for transactions
export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  timeout?: number
): Promise<T> {
  return connectionPool.transaction(callback, timeout);
}

export { DatabaseConnectionPool as ConnectionPool };
export type { ConnectionPoolConfig, PoolMetrics, QueryResult };