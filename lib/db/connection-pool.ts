/**
 * Connection Pool Management
 * Advanced connection pool management with monitoring and optimization
 */

import { PrismaClient } from '@prisma/client';

export interface ConnectionPoolConfig {
  name: string;
  databaseUrl: string;
  minConnections: number;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
  retryAttempts: number;
  retryDelay: number;
  enableMetrics: boolean;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalRequests: number;
  successfulConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  averageQueryTime: number;
  peakConnections: number;
  lastReset: Date;
}

export interface PoolHealth {
  status: 'healthy' | 'warning' | 'critical';
  utilizationPercentage: number;
  connectionQuality: number;
  responseTime: number;
  errorRate: number;
  lastHealthCheck: Date;
}

/**
 * Advanced Connection Pool Manager
 */
export class ConnectionPoolManager {
  private pools: Map<string, PrismaClient> = new Map();
  private configs: Map<string, ConnectionPoolConfig> = new Map();
  private metrics: Map<string, ConnectionMetrics> = new Map();
  private healthStatus: Map<string, PoolHealth> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.startMonitoring();
  }

  /**
   * Create a new connection pool
   */
  createPool(config: ConnectionPoolConfig): void {
    if (this.pools.has(config.name)) {
      throw new Error(`Pool ${config.name} already exists`);
    }

    const client = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
      log: config.enableMetrics ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    this.pools.set(config.name, client);
    this.configs.set(config.name, config);
    this.initializeMetrics(config.name);
    this.initializeHealth(config.name);

    console.log(`[CONNECTION_POOL] Created pool: ${config.name} (${config.minConnections}-${config.maxConnections} connections)`);
  }

  /**
   * Get connection from pool
   */
  async getConnection(poolName: string): Promise<PrismaClient> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    const startTime = Date.now();
    const metrics = this.metrics.get(poolName)!;

    try {
      metrics.totalRequests++;
      metrics.waitingRequests++;

      // Simulate connection acquisition (Prisma handles this internally)
      await this.waitForConnection(poolName);

      metrics.waitingRequests--;
      metrics.activeConnections++;
      metrics.successfulConnections++;
      
      const connectionTime = Date.now() - startTime;
      this.updateAverageConnectionTime(poolName, connectionTime);

      // Update peak connections
      if (metrics.activeConnections > metrics.peakConnections) {
        metrics.peakConnections = metrics.activeConnections;
      }

      return pool;

    } catch (error) {
      metrics.waitingRequests--;
      metrics.failedConnections++;
      console.error(`[CONNECTION_POOL] Failed to get connection from ${poolName}:`, error);
      throw error;
    }
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(poolName: string, queryTime?: number): void {
    const metrics = this.metrics.get(poolName);
    if (metrics) {
      metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
      metrics.idleConnections++;

      if (queryTime) {
        this.updateAverageQueryTime(poolName, queryTime);
      }
    }
  }

  /**
   * Execute query with automatic connection management
   */
  async executeQuery<T>(
    poolName: string,
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getConnection(poolName);
    const queryStart = Date.now();

    try {
      const result = await queryFn(client);
      const queryTime = Date.now() - queryStart;
      this.releaseConnection(poolName, queryTime);
      return result;

    } catch (error) {
      this.releaseConnection(poolName);
      throw error;
    }
  }

  /**
   * Wait for connection availability
   */
  private async waitForConnection(poolName: string): Promise<void> {
    const config = this.configs.get(poolName)!;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const attemptConnection = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed > config.connectionTimeout) {
          reject(new Error(`Connection timeout after ${config.connectionTimeout}ms`));
          return;
        }

        // Simulate connection availability check
        const metrics = this.metrics.get(poolName)!;
        if (metrics.activeConnections < config.maxConnections) {
          resolve();
        } else {
          setTimeout(attemptConnection, 100); // Retry after 100ms
        }
      };

      attemptConnection();
    });
  }

  /**
   * Initialize metrics for pool
   */
  private initializeMetrics(poolName: string): void {
    this.metrics.set(poolName, {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      totalRequests: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageConnectionTime: 0,
      averageQueryTime: 0,
      peakConnections: 0,
      lastReset: new Date(),
    });
  }

  /**
   * Initialize health status for pool
   */
  private initializeHealth(poolName: string): void {
    this.healthStatus.set(poolName, {
      status: 'healthy',
      utilizationPercentage: 0,
      connectionQuality: 100,
      responseTime: 0,
      errorRate: 0,
      lastHealthCheck: new Date(),
    });
  }

  /**
   * Update average connection time
   */
  private updateAverageConnectionTime(poolName: string, connectionTime: number): void {
    const metrics = this.metrics.get(poolName)!;
    const count = metrics.successfulConnections;
    
    if (count === 1) {
      metrics.averageConnectionTime = connectionTime;
    } else {
      metrics.averageConnectionTime = 
        (metrics.averageConnectionTime * (count - 1) + connectionTime) / count;
    }
  }

  /**
   * Update average query time
   */
  private updateAverageQueryTime(poolName: string, queryTime: number): void {
    const metrics = this.metrics.get(poolName)!;
    const totalQueries = metrics.totalRequests - metrics.waitingRequests;
    
    if (totalQueries === 1) {
      metrics.averageQueryTime = queryTime;
    } else if (totalQueries > 1) {
      metrics.averageQueryTime = 
        (metrics.averageQueryTime * (totalQueries - 1) + queryTime) / totalQueries;
    }
  }

  /**
   * Start monitoring and health checks
   */
  private startMonitoring(): void {
    // Health check every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllPoolsHealth();
    }, 30000);

    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performMaintenance();
    }, 300000);

    console.log('[CONNECTION_POOL] Started monitoring and maintenance');
  }

  /**
   * Check health of all pools
   */
  private async checkAllPoolsHealth(): Promise<void> {
    for (const [poolName, pool] of this.pools.entries()) {
      await this.checkPoolHealth(poolName, pool);
    }
  }

  /**
   * Check health of individual pool
   */
  private async checkPoolHealth(poolName: string, pool: PrismaClient): Promise<void> {
    const startTime = Date.now();
    const config = this.configs.get(poolName)!;
    const metrics = this.metrics.get(poolName)!;

    try {
      // Simple health check query
      await pool.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      const utilizationPercentage = (metrics.activeConnections / config.maxConnections) * 100;
      const errorRate = metrics.totalRequests > 0 ? 
        (metrics.failedConnections / metrics.totalRequests) * 100 : 0;

      let status: PoolHealth['status'] = 'healthy';
      let connectionQuality = 100;

      // Determine health status
      if (utilizationPercentage > 90 || errorRate > 10 || responseTime > 5000) {
        status = 'critical';
        connectionQuality = 30;
      } else if (utilizationPercentage > 70 || errorRate > 5 || responseTime > 2000) {
        status = 'warning';
        connectionQuality = 70;
      }

      this.healthStatus.set(poolName, {
        status,
        utilizationPercentage,
        connectionQuality,
        responseTime,
        errorRate,
        lastHealthCheck: new Date(),
      });

      if (status !== 'healthy') {
        console.warn(`[CONNECTION_POOL] Pool ${poolName} health: ${status} (util: ${utilizationPercentage.toFixed(1)}%, errors: ${errorRate.toFixed(1)}%)`);
      }

    } catch (error) {
      console.error(`[CONNECTION_POOL] Health check failed for pool ${poolName}:`, error);
      
      this.healthStatus.set(poolName, {
        status: 'critical',
        utilizationPercentage: 100,
        connectionQuality: 0,
        responseTime: Date.now() - startTime,
        errorRate: 100,
        lastHealthCheck: new Date(),
      });
    }
  }

  /**
   * Perform pool maintenance
   */
  private performMaintenance(): void {
    for (const [poolName, metrics] of this.metrics.entries()) {
      // Cleanup idle connections if they exceed minimum
      if (metrics.idleConnections > this.configs.get(poolName)!.minConnections) {
        const excessIdle = metrics.idleConnections - this.configs.get(poolName)!.minConnections;
        metrics.idleConnections -= Math.min(excessIdle, 5); // Close up to 5 idle connections
        metrics.totalConnections = metrics.activeConnections + metrics.idleConnections;
        
        if (excessIdle > 0) {
          console.log(`[CONNECTION_POOL] Cleaned up ${Math.min(excessIdle, 5)} idle connections from ${poolName}`);
        }
      }
    }
  }

  /**
   * Get pool metrics
   */
  getPoolMetrics(poolName: string): ConnectionMetrics | null {
    return this.metrics.get(poolName) || null;
  }

  /**
   * Get all pool metrics
   */
  getAllMetrics(): Record<string, ConnectionMetrics> {
    return Object.fromEntries(this.metrics.entries());
  }

  /**
   * Get pool health
   */
  getPoolHealth(poolName: string): PoolHealth | null {
    return this.healthStatus.get(poolName) || null;
  }

  /**
   * Get all pool health statuses
   */
  getAllHealthStatus(): Record<string, PoolHealth> {
    return Object.fromEntries(this.healthStatus.entries());
  }

  /**
   * Scale pool connections
   */
  async scalePool(poolName: string, newMaxConnections: number): Promise<void> {
    const config = this.configs.get(poolName);
    if (!config) {
      throw new Error(`Pool ${poolName} not found`);
    }

    const oldMax = config.maxConnections;
    config.maxConnections = newMaxConnections;

    // Update minimum connections proportionally
    const ratio = newMaxConnections / oldMax;
    config.minConnections = Math.max(1, Math.round(config.minConnections * ratio));

    console.log(`[CONNECTION_POOL] Scaled pool ${poolName} from ${oldMax} to ${newMaxConnections} max connections`);
  }

  /**
   * Reset pool metrics
   */
  resetMetrics(poolName: string): void {
    const metrics = this.metrics.get(poolName);
    if (metrics) {
      // Reset counters but keep current connection counts
      const currentActive = metrics.activeConnections;
      const currentIdle = metrics.idleConnections;
      
      this.initializeMetrics(poolName);
      
      const newMetrics = this.metrics.get(poolName)!;
      newMetrics.activeConnections = currentActive;
      newMetrics.idleConnections = currentIdle;
      newMetrics.totalConnections = currentActive + currentIdle;
      
      console.log(`[CONNECTION_POOL] Reset metrics for pool: ${poolName}`);
    }
  }

  /**
   * Get pool statistics summary
   */
  getPoolSummary(): {
    totalPools: number;
    healthyPools: number;
    warningPools: number;
    criticalPools: number;
    totalConnections: number;
    totalRequests: number;
    averageUtilization: number;
  } {
    const healthStatuses = Array.from(this.healthStatus.values());
    const allMetrics = Array.from(this.metrics.values());

    const summary = {
      totalPools: this.pools.size,
      healthyPools: healthStatuses.filter(h => h.status === 'healthy').length,
      warningPools: healthStatuses.filter(h => h.status === 'warning').length,
      criticalPools: healthStatuses.filter(h => h.status === 'critical').length,
      totalConnections: allMetrics.reduce((sum, m) => sum + m.totalConnections, 0),
      totalRequests: allMetrics.reduce((sum, m) => sum + m.totalRequests, 0),
      averageUtilization: healthStatuses.length > 0 ? 
        healthStatuses.reduce((sum, h) => sum + h.utilizationPercentage, 0) / healthStatuses.length : 0,
    };

    return summary;
  }

  /**
   * Warm up pool connections
   */
  async warmupPool(poolName: string): Promise<void> {
    const config = this.configs.get(poolName);
    const pool = this.pools.get(poolName);
    
    if (!config || !pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    console.log(`[CONNECTION_POOL] Warming up pool: ${poolName}`);

    // Create minimum connections by executing simple queries
    const warmupPromises = [];
    for (let i = 0; i < config.minConnections; i++) {
      warmupPromises.push(
        this.executeQuery(poolName, async (client) => {
          await client.$queryRaw`SELECT 1`;
          return true;
        }).catch(error => {
          console.warn(`[CONNECTION_POOL] Warmup query ${i + 1} failed:`, error);
          return false;
        })
      );
    }

    const results = await Promise.all(warmupPromises);
    const successfulConnections = results.filter(Boolean).length;

    console.log(`[CONNECTION_POOL] Warmup completed for ${poolName}: ${successfulConnections}/${config.minConnections} connections`);
  }

  /**
   * Close pool
   */
  async closePool(poolName: string): Promise<void> {
    const pool = this.pools.get(poolName);
    if (pool) {
      await pool.$disconnect();
      this.pools.delete(poolName);
      this.configs.delete(poolName);
      this.metrics.delete(poolName);
      this.healthStatus.delete(poolName);
      
      console.log(`[CONNECTION_POOL] Closed pool: ${poolName}`);
    }
  }

  /**
   * Close all pools
   */
  async closeAllPools(): Promise<void> {
    console.log('[CONNECTION_POOL] Closing all pools...');

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all pools
    const closePromises = Array.from(this.pools.keys()).map(poolName => 
      this.closePool(poolName)
    );

    await Promise.all(closePromises);

    console.log('[CONNECTION_POOL] All pools closed');
  }

  /**
   * Export configuration for backup/restore
   */
  exportConfiguration(): Record<string, ConnectionPoolConfig> {
    return Object.fromEntries(this.configs.entries());
  }

  /**
   * Import configuration
   */
  async importConfiguration(configs: Record<string, ConnectionPoolConfig>): Promise<void> {
    for (const [name, config] of Object.entries(configs)) {
      if (!this.pools.has(name)) {
        this.createPool(config);
        await this.warmupPool(name);
      }
    }
    
    console.log(`[CONNECTION_POOL] Imported ${Object.keys(configs).length} pool configurations`);
  }
}

/**
 * Create default connection pool configurations
 */
export function createDefaultPoolConfigs(): ConnectionPoolConfig[] {
  return [
    {
      name: 'master-pool',
      databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/taxomind_master',
      minConnections: 5,
      maxConnections: 20,
      connectionTimeout: 5000,
      idleTimeout: 300000, // 5 minutes
      maxLifetime: 1800000, // 30 minutes
      retryAttempts: 3,
      retryDelay: 1000,
      enableMetrics: true,
    },
    {
      name: 'replica-pool-1',
      databaseUrl: process.env.DATABASE_READ_REPLICA_1_URL || 'postgresql://localhost:5433/taxomind_replica_1',
      minConnections: 3,
      maxConnections: 15,
      connectionTimeout: 5000,
      idleTimeout: 300000,
      maxLifetime: 1800000,
      retryAttempts: 2,
      retryDelay: 1000,
      enableMetrics: true,
    },
    {
      name: 'replica-pool-2',
      databaseUrl: process.env.DATABASE_READ_REPLICA_2_URL || 'postgresql://localhost:5434/taxomind_replica_2',
      minConnections: 3,
      maxConnections: 15,
      connectionTimeout: 5000,
      idleTimeout: 300000,
      maxLifetime: 1800000,
      retryAttempts: 2,
      retryDelay: 1000,
      enableMetrics: true,
    },
    {
      name: 'analytics-pool',
      databaseUrl: process.env.DATABASE_ANALYTICS_URL || 'postgresql://localhost:5435/taxomind_analytics',
      minConnections: 2,
      maxConnections: 10,
      connectionTimeout: 10000, // Longer timeout for analytics
      idleTimeout: 600000, // 10 minutes
      maxLifetime: 3600000, // 1 hour
      retryAttempts: 2,
      retryDelay: 2000,
      enableMetrics: true,
    },
  ];
}

export default ConnectionPoolManager;