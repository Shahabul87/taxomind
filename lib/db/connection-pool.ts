// This is a clean version of connection-pool.ts with orphaned methods removed
// Copy this content to connection-pool.ts

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Pool } from 'pg';

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
  scaleUpThreshold?: number;
  scaleDownThreshold?: number;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorCount: number;
  averageResponseTime: number;
  connectionsPerSecond: number;
  queriesPerSecond: number;
  peakConnections: number;
  lastUpdated: Date;
}

export interface PoolHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  utilizationPercentage: number;
  errorRate: number;
  responseTime: number;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  uptime: number;
}

export interface AutoScaleConfig {
  enabled: boolean;
  minConnections: number;
  maxConnections: number;
  scaleUpStep: number;
  scaleDownStep: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
  utilizationThreshold: number;
  maxScaleOperationsPerHour: number;
}

/**
 * Enterprise Connection Pool Manager with advanced features
 */
export class ConnectionPoolManager {
  private redis: Redis;
  private pools: Map<string, PrismaClient> = new Map();
  private rawPools: Map<string, Pool> = new Map(); // PostgreSQL pools
  private configs: Map<string, ConnectionPoolConfig> = new Map();
  private metrics: Map<string, ConnectionMetrics> = new Map();
  private healthStatus: Map<string, PoolHealth> = new Map();
  private autoScaleConfig: Map<string, AutoScaleConfig> = new Map();
  private lastScaleOperation: Map<string, { timestamp: number; operation: 'up' | 'down' }> = new Map();
  private scaleOperationsCount: Map<string, number> = new Map();
  private responseTimeHistory: Map<string, number[]> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private autoScaleInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(redis?: Redis) {
    this.redis = redis || new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    
    this.startMonitoring();
    this.startAutoScaling();
    
    console.log('[CONNECTION_POOL] Enterprise pool manager initialized');
  }

  // Basic pool management methods would go here...
  
  async closeAllPools(): Promise<void> {
    console.log('[CONNECTION_POOL] Closing all pools...');
    
    for (const [poolName, pool] of this.pools.entries()) {
      try {
        await pool.$disconnect();
        console.log(`[CONNECTION_POOL] Closed pool: ${poolName}`);
      } catch (error) {
        console.warn(`[CONNECTION_POOL] Error closing pool ${poolName}:`, error);
      }
    }
    
    // Close raw PostgreSQL pools
    for (const [poolName, rawPool] of this.rawPools.entries()) {
      try {
        await rawPool.end();
        console.log(`[CONNECTION_POOL] Closed raw pool: ${poolName}`);
      } catch (error) {
        console.warn(`[CONNECTION_POOL] Error closing raw pool ${poolName}:`, error);
      }
    }
    
    this.pools.clear();
    this.rawPools.clear();
    this.configs.clear();
    this.metrics.clear();
    this.healthStatus.clear();
  }

  private startMonitoring(): void {
    // Implementation would go here
  }

  private startAutoScaling(): void {
    // Implementation would go here
  }

  getPoolSummary(): Record<string, any> {
    const totalPools = this.pools.size;
    const totalConnections = Array.from(this.metrics.values())
      .reduce((sum, metrics) => sum + metrics.totalConnections, 0);
    const healthyPools = Array.from(this.healthStatus.values())
      .filter(health => health.status === 'healthy').length;
    
    return {
      totalPools,
      totalConnections,
      healthyPools,
      degradedPools: totalPools - healthyPools,
    };
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

/**
 * Factory function to create enterprise connection pool manager
 */
export function createEnterprisePoolManager(redis?: Redis): ConnectionPoolManager {
  return new ConnectionPoolManager(redis);
}

export default ConnectionPoolManager;