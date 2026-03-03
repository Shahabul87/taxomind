/**
 * Database Read Replicas - Phase 3 Enterprise Implementation
 * Advanced read replica management with PostgreSQL connection pooling
 * Features: Load balancing, health monitoring, automatic failover, connection pooling
 */

import { PrismaClient } from '@prisma/client';
import { Pool, PoolConfig, PoolClient } from 'pg';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

export interface DatabaseConfig {
  url: string;
  name: string;
  role: 'master' | 'read-replica';
  region?: string;
  priority: number;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  weight?: number; // For load balancing
  tags?: string[];
}

export interface ReplicaHealth {
  name: string;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  connectionCount: number;
  totalQueries: number;
  failureRate: number;
  peakConnections: number;
  avgResponseTime: number;
  lastError?: string;
}

export interface QueryMetrics {
  queryCount: number;
  averageResponseTime: number;
  errorCount: number;
  lastReset: Date;
  throughputPerMinute: number;
  peakThroughput: number;
}

/**
 * Load balancing strategies
 */
export type LoadBalancingStrategy = 
  | 'round-robin'
  | 'weighted-round-robin'
  | 'least-connections'
  | 'priority-based'
  | 'health-weighted'
  | 'geographic';

/**
 * Enterprise Database Replica Manager with advanced features
 */
export class DatabaseReplicaManager {
  private redis: Redis;
  private masterClient: PrismaClient;
  private masterPool: Pool;
  private replicaClients: Map<string, PrismaClient> = new Map();
  private replicaPools: Map<string, Pool> = new Map();
  private replicaConfigs: Map<string, DatabaseConfig> = new Map();
  private healthStatus: Map<string, ReplicaHealth> = new Map();
  private metrics: Map<string, QueryMetrics> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;
  private currentReplicaIndex = 0;
  private loadBalancingStrategy: LoadBalancingStrategy = 'weighted-round-robin';
  private isShuttingDown = false;

  constructor(
    masterConfig: DatabaseConfig, 
    replicaConfigs: DatabaseConfig[] = [],
    redis?: Redis
  ) {
    this.redis = redis || new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Initialize master Prisma connection
    this.masterClient = new PrismaClient({
      datasources: {
        db: {
          url: masterConfig.url,
        },
      },
      log: ['query', 'error', 'warn'],
    });

    // Initialize master connection pool
    this.masterPool = new Pool(this.createPoolConfig(masterConfig));

    // Initialize replica connections
    replicaConfigs.forEach(config => {
      this.addReplica(config);
    });

    // Add master to configs for health monitoring
    this.replicaConfigs.set('master', masterConfig);
    this.initializeMetrics('master');
    this.initializeHealthStatus('master');

    // Set up pool event listeners for master
    this.setupPoolEventListeners(this.masterPool, 'master');

    // Start monitoring
    this.startHealthMonitoring();
    this.startMetricsCollection();

  }

  /**
   * Create PostgreSQL pool configuration
   */
  private createPoolConfig(config: DatabaseConfig): PoolConfig {
    const url = new URL(config.url);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1),
      user: url.username,
      password: url.password,
      max: config.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: config.connectionTimeout,
      statement_timeout: config.queryTimeout,
      query_timeout: config.queryTimeout,
    };
  }

  /**
   * Add a new read replica with connection pool
   */
  addReplica(config: DatabaseConfig): void {
    if (config.role !== 'read-replica') {
      throw new Error('Only read-replica configurations can be added as replicas');
    }

    // Create Prisma client
    const client = new PrismaClient({
      datasources: {
        db: {
          url: config.url,
        },
      },
      log: ['error', 'warn'],
    });

    // Create connection pool
    const pool = new Pool(this.createPoolConfig(config));

    this.replicaClients.set(config.name, client);
    this.replicaPools.set(config.name, pool);
    this.replicaConfigs.set(config.name, {
      ...config,
      weight: config.weight || 1,
    });
    this.initializeMetrics(config.name);
    this.initializeHealthStatus(config.name);

    // Set up pool event listeners
    this.setupPoolEventListeners(pool, config.name);

  }

  /**
   * Remove a read replica
   */
  async removeReplica(replicaName: string): Promise<void> {
    const client = this.replicaClients.get(replicaName);
    const pool = this.replicaPools.get(replicaName);
    
    if (client && pool) {
      await Promise.all([
        client.$disconnect(),
        pool.end(),
      ]);
      
      this.replicaClients.delete(replicaName);
      this.replicaPools.delete(replicaName);
      this.replicaConfigs.delete(replicaName);
      this.healthStatus.delete(replicaName);
      this.metrics.delete(replicaName);

    }
  }

  /**
   * Get master client for write operations
   */
  getMaster(): PrismaClient {
    return this.masterClient;
  }

  /**
   * Get master pool for direct SQL queries
   */
  getMasterPool(): Pool {
    return this.masterPool;
  }

  /**
   * Get optimal read replica client
   */
  getReadReplica(): PrismaClient {
    const healthyReplicas = this.getHealthyReplicas();
    
    if (healthyReplicas.length === 0) {
      logger.warn('[DB_REPLICAS] No healthy replicas available, falling back to master');
      return this.masterClient;
    }

    const selectedReplica = this.selectOptimalReplica(healthyReplicas);
    const client = this.replicaClients.get(selectedReplica.name);
    
    return client || this.masterClient;
  }

  /**
   * Get optimal read replica pool
   */
  getReadReplicaPool(): Pool {
    const healthyReplicas = this.getHealthyReplicas();
    
    if (healthyReplicas.length === 0) {
      logger.warn('[DB_REPLICAS] No healthy replica pools available, falling back to master');
      return this.masterPool;
    }

    const selectedReplica = this.selectOptimalReplica(healthyReplicas);
    const pool = this.replicaPools.get(selectedReplica.name);
    
    return pool || this.masterPool;
  }

  /**
   * Get database connection from pool
   */
  async getConnection(isWrite: boolean = false): Promise<{
    client: PoolClient;
    replicaId: string;
    release: () => void;
  }> {
    const pool = isWrite ? this.masterPool : this.getReadReplicaPool();
    const replicaId = isWrite ? 'master' : this.getPoolName(pool);
    
    try {
      const startTime = Date.now();
      const client = await pool.connect();
      const responseTime = Date.now() - startTime;

      // Update metrics
      this.updateConnectionMetrics(replicaId, responseTime);

      logger.debug(`[DB_REPLICAS] Connected to ${replicaId} (${responseTime}ms)`);

      return {
        client,
        replicaId,
        release: () => {
          client.release();
          this.updateDisconnectionMetrics(replicaId);
        },
      };
    } catch (error: any) {
      logger.error(`[DB_REPLICAS] Failed to get connection from ${replicaId}:`, error);
      
      // If replica failed and this wasn't a write, try master
      if (!isWrite && replicaId !== 'master') {
        return this.getConnection(true);
      }
      
      throw error;
    }
  }

  /**
   * Execute read query with automatic replica selection
   */
  async executeReadQuery<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const client = attempt === 0 ? this.getReadReplica() : this.masterClient;
      const clientName = this.getClientName(client);

      try {
        const result = await queryFn(client);
        this.recordQuerySuccess(clientName, Date.now() - startTime);
        return result;

      } catch (error: any) {
        lastError = error as Error;
        this.recordQueryError(clientName, error as Error);
        
        logger.warn(`[DB_REPLICAS] Query failed on ${clientName}, attempt ${attempt + 1}:`, error);
        
        // Mark replica as unhealthy if it's not the master
        if (clientName !== 'master') {
          this.markReplicaUnhealthy(clientName, error as Error);
        }
        
        // If this was the last attempt or it was already on master, throw the error
        if (attempt === maxRetries - 1 || clientName === 'master') {
          break;
        }
      }
    }

    throw lastError || new Error('All query attempts failed');
  }

  /**
   * Execute write query on master
   */
  async executeWriteQuery<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn(this.masterClient);
      this.recordQuerySuccess('master', Date.now() - startTime);
      return result;
      
    } catch (error: any) {
      this.recordQueryError('master', error as Error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query on read replica
   */
  async executeRawReadQuery<T = any>(
    query: string,
    params?: any[],
    options?: { preferredRegion?: string; timeout?: number }
  ): Promise<T[]> {
    const connection = await this.getConnection(false);
    
    try {
      const startTime = Date.now();
      const result = await connection.client.query(query, params);
      const queryTime = Date.now() - startTime;
      
      this.recordQuerySuccess(connection.replicaId, queryTime);
      logger.debug(`[DB_REPLICAS] Raw read query executed on ${connection.replicaId} (${queryTime}ms)`);
      
      return result.rows;
    } catch (error: any) {
      this.recordQueryError(connection.replicaId, error as Error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Execute raw SQL query on master
   */
  async executeRawWriteQuery<T = any>(
    query: string,
    params?: any[],
    options?: { timeout?: number }
  ): Promise<T[]> {
    const connection = await this.getConnection(true);
    
    try {
      const startTime = Date.now();
      const result = await connection.client.query(query, params);
      const queryTime = Date.now() - startTime;
      
      this.recordQuerySuccess('master', queryTime);
      logger.debug(`[DB_REPLICAS] Raw write query executed on master (${queryTime}ms)`);
      
      return result.rows;
    } catch (error: any) {
      this.recordQueryError('master', error as Error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Execute transaction on master
   */
  async executeTransaction<T>(
    transactionFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.executeWriteQuery(transactionFn);
  }

  /**
   * Execute raw SQL transaction on master
   */
  async executeRawTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options?: { isolationLevel?: string; timeout?: number }
  ): Promise<T> {
    const connection = await this.getConnection(true);
    
    try {
      await connection.client.query('BEGIN');
      
      if (options?.isolationLevel) {
        await connection.client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }
      
      const result = await callback(connection.client);
      await connection.client.query('COMMIT');

      return result;
    } catch (error: any) {
      await connection.client.query('ROLLBACK');
      logger.error('[DB_REPLICAS] Transaction rolled back:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Set load balancing strategy
   */
  setLoadBalancingStrategy(strategy: LoadBalancingStrategy): void {
    this.loadBalancingStrategy = strategy;

  }

  /**
   * Get healthy replicas
   */
  private getHealthyReplicas(): ReplicaHealth[] {
    return Array.from(this.healthStatus.values())
      .filter(health => health.isHealthy && health.name !== 'master')
      .sort((a, b) => a.responseTime - b.responseTime);
  }

  /**
   * Select optimal replica using configured load balancing strategy
   */
  private selectOptimalReplica(healthyReplicas: ReplicaHealth[]): ReplicaHealth {
    if (healthyReplicas.length === 1) {
      return healthyReplicas[0];
    }

    switch (this.loadBalancingStrategy) {
      case 'round-robin':
        return this.selectRoundRobin(healthyReplicas);
      
      case 'weighted-round-robin':
        return this.selectWeightedRoundRobin(healthyReplicas);
      
      case 'least-connections':
        return this.selectLeastConnections(healthyReplicas);
      
      case 'priority-based':
        return this.selectPriorityBased(healthyReplicas);
      
      case 'health-weighted':
        return this.selectHealthWeighted(healthyReplicas);
      
      case 'geographic':
        return this.selectGeographic(healthyReplicas);
      
      default:
        return healthyReplicas[0];
    }
  }

  /**
   * Round-robin selection
   */
  private selectRoundRobin(replicas: ReplicaHealth[]): ReplicaHealth {
    const selected = replicas[this.currentReplicaIndex % replicas.length];
    this.currentReplicaIndex++;
    return selected;
  }

  /**
   * Weighted round-robin selection
   */
  private selectWeightedRoundRobin(replicas: ReplicaHealth[]): ReplicaHealth {
    const weights = replicas.map(replica => {
      const config = this.replicaConfigs.get(replica.name)!;
      return {
        replica,
        weight: config.weight || 1,
      };
    });

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { replica, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return replica;
      }
    }

    return replicas[0];
  }

  /**
   * Least connections selection
   */
  private selectLeastConnections(replicas: ReplicaHealth[]): ReplicaHealth {
    return replicas.reduce((best, current) => 
      current.connectionCount < best.connectionCount ? current : best
    );
  }

  /**
   * Priority-based selection
   */
  private selectPriorityBased(replicas: ReplicaHealth[]): ReplicaHealth {
    return replicas.reduce((best, current) => {
      const bestConfig = this.replicaConfigs.get(best.name)!;
      const currentConfig = this.replicaConfigs.get(current.name)!;
      return currentConfig.priority < bestConfig.priority ? current : best;
    });
  }

  /**
   * Health-weighted selection (faster replicas get higher weight)
   */
  private selectHealthWeighted(replicas: ReplicaHealth[]): ReplicaHealth {
    const weights = replicas.map(replica => ({
      replica,
      weight: 1000 / Math.max(replica.responseTime, 1),
    }));

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { replica, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return replica;
      }
    }

    return replicas[0];
  }

  /**
   * Geographic selection (prefer same region)
   */
  private selectGeographic(replicas: ReplicaHealth[]): ReplicaHealth {
    // For now, just return the first replica
    // In a real implementation, you'd check regions and prefer local ones
    return replicas[0];
  }

  /**
   * Get pool name for metrics
   */
  private getPoolName(pool: Pool): string {
    if (pool === this.masterPool) {
      return 'master';
    }

    for (const [name, replicaPool] of this.replicaPools.entries()) {
      if (pool === replicaPool) {
        return name;
      }
    }

    return 'unknown';
  }

  /**
   * Get client name for logging and metrics
   */
  private getClientName(client: PrismaClient): string {
    if (client === this.masterClient) {
      return 'master';
    }

    for (const [name, replicaClient] of this.replicaClients.entries()) {
      if (client === replicaClient) {
        return name;
      }
    }

    return 'unknown';
  }

  /**
   * Initialize metrics for a database client
   */
  private initializeMetrics(clientName: string): void {
    this.metrics.set(clientName, {
      queryCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      lastReset: new Date(),
      throughputPerMinute: 0,
      peakThroughput: 0,
    });
  }

  /**
   * Initialize health status
   */
  private initializeHealthStatus(clientName: string): void {
    this.healthStatus.set(clientName, {
      name: clientName,
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      connectionCount: 0,
      totalQueries: 0,
      failureRate: 0,
      peakConnections: 0,
      avgResponseTime: 0,
    });
  }

  /**
   * Update connection metrics
   */
  private updateConnectionMetrics(clientName: string, responseTime: number): void {
    const health = this.healthStatus.get(clientName);
    if (health) {
      health.totalQueries++;
      health.avgResponseTime = (health.avgResponseTime + responseTime) / 2;
      health.connectionCount++;
      health.peakConnections = Math.max(health.peakConnections, health.connectionCount);
    }
  }

  /**
   * Update disconnection metrics
   */
  private updateDisconnectionMetrics(clientName: string): void {
    const health = this.healthStatus.get(clientName);
    if (health) {
      health.connectionCount = Math.max(0, health.connectionCount - 1);
    }
  }

  /**
   * Record successful query
   */
  private recordQuerySuccess(clientName: string, responseTime: number): void {
    const metrics = this.metrics.get(clientName);
    if (metrics) {
      metrics.queryCount++;
      metrics.averageResponseTime = 
        (metrics.averageResponseTime * (metrics.queryCount - 1) + responseTime) / metrics.queryCount;
    }

    const health = this.healthStatus.get(clientName);
    if (health) {
      health.responseTime = responseTime;
      health.totalQueries++;
      health.avgResponseTime = (health.avgResponseTime + responseTime) / 2;
      health.failureRate = health.errorCount / health.totalQueries;
    }
  }

  /**
   * Record query error
   */
  private recordQueryError(clientName: string, error: Error): void {
    const metrics = this.metrics.get(clientName);
    if (metrics) {
      metrics.errorCount++;
    }

    const health = this.healthStatus.get(clientName);
    if (health) {
      health.errorCount++;
      health.totalQueries++;
      health.failureRate = health.errorCount / health.totalQueries;
      health.lastError = error.message;
    }
  }

  /**
   * Mark replica as unhealthy
   */
  private markReplicaUnhealthy(replicaName: string, error: Error): void {
    const health = this.healthStatus.get(replicaName);
    if (health) {
      health.isHealthy = false;
      health.errorCount++;
      health.lastCheck = new Date();
      health.lastError = error.message;
      health.failureRate = health.errorCount / Math.max(health.totalQueries, 1);
    }
  }

  /**
   * Setup pool event listeners for monitoring
   */
  private setupPoolEventListeners(pool: Pool, poolName: string): void {
    pool.on('connect', (client) => {

    });

    pool.on('error', (err, client) => {
      logger.error(`[DB_REPLICAS] Pool error for ${poolName}:`, err);
      this.markReplicaUnhealthy(poolName, err);
    });

    pool.on('remove', (client) => {

    });
  }

  /**
   * Start health monitoring for all databases
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      await this.checkAllHealth();
    }, 30000); // Check every 30 seconds

    // Initial health check
    setTimeout(() => this.checkAllHealth(), 1000);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      await this.collectAndPersistMetrics();
    }, 60000); // Every minute
  }

  /**
   * Check health of all database connections
   */
  private async checkAllHealth(): Promise<void> {
    const healthChecks: Promise<void>[] = [];

    // Check master
    healthChecks.push(this.checkDatabaseHealth('master', this.masterClient));

    // Check all replicas
    for (const [name, client] of this.replicaClients.entries()) {
      healthChecks.push(this.checkDatabaseHealth(name, client));
    }

    await Promise.all(healthChecks);
  }

  /**
   * Check health of individual database
   */
  private async checkDatabaseHealth(name: string, client: PrismaClient): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connection
      await client.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      const currentHealth = this.healthStatus.get(name);
      
      const pool = name === 'master' ? this.masterPool : this.replicaPools.get(name);
      
      this.healthStatus.set(name, {
        name,
        isHealthy: true,
        lastCheck: new Date(),
        responseTime,
        errorCount: currentHealth?.errorCount || 0,
        connectionCount: pool ? pool.totalCount : 0,
        totalQueries: currentHealth?.totalQueries || 0,
        failureRate: currentHealth ? currentHealth.errorCount / Math.max(currentHealth.totalQueries, 1) : 0,
        peakConnections: currentHealth?.peakConnections || 0,
        avgResponseTime: currentHealth ? (currentHealth.avgResponseTime + responseTime) / 2 : responseTime,
      });

      if (currentHealth && !currentHealth.isHealthy) {
        logger.info(`[DB_REPLICAS] Database ${name} is back online (${responseTime}ms)`);
      }

    } catch (error: any) {
      const currentHealth = this.healthStatus.get(name);
      const errorCount = (currentHealth?.errorCount || 0) + 1;
      
      this.healthStatus.set(name, {
        name,
        isHealthy: false,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorCount,
        connectionCount: 0,
        totalQueries: currentHealth?.totalQueries || 0,
        failureRate: errorCount / Math.max(currentHealth?.totalQueries || 1, 1),
        peakConnections: currentHealth?.peakConnections || 0,
        avgResponseTime: currentHealth?.avgResponseTime || 0,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error(`[DB_REPLICAS] Health check failed for ${name}:`, error);
    }
  }

  /**
   * Collect and persist metrics
   */
  private async collectAndPersistMetrics(): Promise<void> {
    try {
      const statistics = await this.getComprehensiveStatistics();
      
      // Persist to Redis
      await this.redis.setex(
        'db_replicas:enterprise_metrics',
        300, // 5 minutes TTL
        JSON.stringify({
          ...statistics,
          timestamp: new Date(),
          loadBalancingStrategy: this.loadBalancingStrategy,
        })
      );

    } catch (error: any) {
      logger.error('[DB_REPLICAS] Failed to persist metrics:', error);
    }
  }

  /**
   * Get comprehensive database status
   */
  getDatabaseStatus(): {
    master: ReplicaHealth | null;
    replicas: ReplicaHealth[];
    totalConnections: number;
    healthyReplicas: number;
  } {
    const master = this.healthStatus.get('master') || null;
    const replicas = Array.from(this.healthStatus.values())
      .filter(health => health.name !== 'master');
    
    const totalConnections = Array.from(this.healthStatus.values())
      .reduce((sum, health) => sum + health.connectionCount, 0);
    
    const healthyReplicas = replicas.filter(r => r.isHealthy).length;

    return {
      master,
      replicas,
      totalConnections,
      healthyReplicas,
    };
  }

  /**
   * Get comprehensive statistics
   */
  async getComprehensiveStatistics(): Promise<{
    health: Record<string, ReplicaHealth>;
    metrics: Record<string, QueryMetrics>;
    pools: Record<string, any>;
    summary: {
      totalReplicas: number;
      healthyReplicas: number;
      totalConnections: number;
      totalQueries: number;
      avgResponseTime: number;
      overallErrorRate: number;
      loadBalancingStrategy: string;
    };
  }> {
    const health = Object.fromEntries(this.healthStatus.entries());
    const metrics = Object.fromEntries(this.metrics.entries());
    const pools: Record<string, any> = {};

    // Collect pool statistics
    pools['master'] = {
      totalCount: this.masterPool.totalCount,
      idleCount: this.masterPool.idleCount,
      waitingCount: this.masterPool.waitingCount,
    };

    for (const [name, pool] of this.replicaPools.entries()) {
      pools[name] = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };
    }

    // Calculate summary statistics
    const replicas = Array.from(this.healthStatus.values()).filter(h => h.name !== 'master');
    const healthyReplicas = replicas.filter(r => r.isHealthy).length;
    const totalConnections = Object.values(pools).reduce((sum, pool) => sum + pool.totalCount, 0);
    const totalQueries = Object.values(health).reduce((sum, h) => sum + h.totalQueries, 0);
    const avgResponseTime = Object.values(health).reduce((sum, h) => sum + h.avgResponseTime, 0) / Math.max(Object.keys(health).length, 1);
    const totalErrors = Object.values(health).reduce((sum, h) => sum + h.errorCount, 0);
    const overallErrorRate = totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0;

    return {
      health,
      metrics,
      pools,
      summary: {
        totalReplicas: replicas.length,
        healthyReplicas,
        totalConnections,
        totalQueries,
        avgResponseTime,
        overallErrorRate,
        loadBalancingStrategy: this.loadBalancingStrategy,
      },
    };
  }

  /**
   * Get query metrics
   */
  getQueryMetrics(): Record<string, QueryMetrics> {
    return Object.fromEntries(this.metrics.entries());
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    for (const metrics of this.metrics.values()) {
      metrics.queryCount = 0;
      metrics.averageResponseTime = 0;
      metrics.errorCount = 0;
      metrics.lastReset = new Date();
      metrics.throughputPerMinute = 0;
      metrics.peakThroughput = 0;
    }

  }

  /**
   * Get database configuration
   */
  getDatabaseConfigs(): Record<string, DatabaseConfig> {
    return Object.fromEntries(this.replicaConfigs.entries());
  }

  /**
   * Update replica priority
   */
  updateReplicaPriority(replicaName: string, priority: number): void {
    const config = this.replicaConfigs.get(replicaName);
    if (config) {
      config.priority = priority;

    }
  }

  /**
   * Force failover to master
   */
  forceFailoverToMaster(): void {
    // Mark all replicas as unhealthy to force master usage
    for (const [name, health] of this.healthStatus.entries()) {
      if (name !== 'master') {
        health.isHealthy = false;
      }
    }

  }

  /**
   * Restore replica health
   */
  restoreReplicaHealth(replicaName: string): void {
    const health = this.healthStatus.get(replicaName);
    if (health) {
      health.isHealthy = true;
      health.errorCount = 0;
      health.lastCheck = new Date();
      health.lastError = undefined;

    }
  }

  /**
   * Get load distribution report
   */
  getLoadDistribution(): Record<string, { percentage: number; queryCount: number }> {
    const totalQueries = Array.from(this.healthStatus.values())
      .reduce((sum, health) => sum + health.totalQueries, 0);

    if (totalQueries === 0) {
      return {};
    }

    const distribution: Record<string, { percentage: number; queryCount: number }> = {};

    for (const [name, health] of this.healthStatus.entries()) {
      distribution[name] = {
        percentage: Math.round((health.totalQueries / totalQueries) * 100 * 100) / 100,
        queryCount: health.totalQueries,
      };
    }

    return distribution;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {

    this.isShuttingDown = true;

    try {
      // Stop monitoring intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.metricsCollectionInterval) {
        clearInterval(this.metricsCollectionInterval);
      }

      // Persist final metrics
      await this.collectAndPersistMetrics().catch(err => 
        logger.warn('[DB_REPLICAS] Failed to persist final metrics:', err)
      );

      // Disconnect all clients and close pools
      const shutdownPromises: Promise<void>[] = [];

      // Disconnect master
      shutdownPromises.push(this.masterClient.$disconnect());
      shutdownPromises.push(this.masterPool.end());

      // Disconnect all replicas
      for (const client of this.replicaClients.values()) {
        shutdownPromises.push(client.$disconnect());
      }

      for (const pool of this.replicaPools.values()) {
        shutdownPromises.push(pool.end());
      }

      await Promise.all(shutdownPromises);

      // Clear all maps
      this.replicaClients.clear();
      this.replicaPools.clear();
      this.replicaConfigs.clear();
      this.healthStatus.clear();
      this.metrics.clear();

    } catch (error: any) {
      logger.error('[DB_REPLICAS] Error during shutdown:', error);
      throw error;
    }
  }
}

/**
 * Create default database replica configuration
 */
export function createDefaultReplicaConfig(): {
  master: DatabaseConfig;
  replicas: DatabaseConfig[];
} {
  const master: DatabaseConfig = {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/taxomind_master',
    name: 'master',
    role: 'master',
    region: 'primary',
    priority: 1,
    maxConnections: 50,
    connectionTimeout: 5000,
    queryTimeout: 30000,
    weight: 1,
  };

  const replicas: DatabaseConfig[] = [
    {
      url: process.env.DATABASE_READ_REPLICA_1_URL || 'postgresql://localhost:5433/taxomind_replica_1',
      name: 'replica-1',
      role: 'read-replica',
      region: 'primary',
      priority: 2,
      maxConnections: 30,
      connectionTimeout: 5000,
      queryTimeout: 30000,
      weight: 2,
      tags: ['primary-region', 'high-performance'],
    },
    {
      url: process.env.DATABASE_READ_REPLICA_2_URL || 'postgresql://localhost:5434/taxomind_replica_2',
      name: 'replica-2',
      role: 'read-replica',
      region: 'secondary',
      priority: 3,
      maxConnections: 30,
      connectionTimeout: 5000,
      queryTimeout: 30000,
      weight: 1,
      tags: ['secondary-region', 'backup'],
    },
  ];

  return { master, replicas };
}

/**
 * Create enterprise database replicas instance
 */
export function createEnterpriseReplicas(
  masterConfig: DatabaseConfig,
  replicaConfigs: DatabaseConfig[] = [],
  redis?: Redis
): DatabaseReplicaManager {
  return new DatabaseReplicaManager(masterConfig, replicaConfigs, redis);
}

export default DatabaseReplicaManager;