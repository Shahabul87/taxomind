/**
 * Database Read Replicas
 * Configuration and management for read replica database connections
 */

import { PrismaClient } from '@prisma/client';

export interface DatabaseConfig {
  url: string;
  name: string;
  role: 'master' | 'read-replica';
  region?: string;
  priority: number;
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
}

export interface ReplicaHealth {
  name: string;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  connectionCount: number;
}

export interface QueryMetrics {
  queryCount: number;
  averageResponseTime: number;
  errorCount: number;
  lastReset: Date;
}

/**
 * Database Replica Manager
 */
export class DatabaseReplicaManager {
  private masterClient: PrismaClient;
  private replicaClients: Map<string, PrismaClient> = new Map();
  private replicaConfigs: Map<string, DatabaseConfig> = new Map();
  private healthStatus: Map<string, ReplicaHealth> = new Map();
  private metrics: Map<string, QueryMetrics> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private currentReplicaIndex = 0;

  constructor(masterConfig: DatabaseConfig, replicaConfigs: DatabaseConfig[] = []) {
    // Initialize master connection
    this.masterClient = new PrismaClient({
      datasources: {
        db: {
          url: masterConfig.url,
        },
      },
      log: ['query', 'error', 'warn'],
    });

    // Initialize replica connections
    replicaConfigs.forEach(config => {
      this.addReplica(config);
    });

    // Add master to configs for health monitoring
    this.replicaConfigs.set('master', masterConfig);
    this.initializeMetrics('master');

    // Start health monitoring
    this.startHealthMonitoring();

    console.log(`[DB_REPLICAS] Initialized with master and ${replicaConfigs.length} replicas`);
  }

  /**
   * Add a new read replica
   */
  addReplica(config: DatabaseConfig): void {
    if (config.role !== 'read-replica') {
      throw new Error('Only read-replica configurations can be added as replicas');
    }

    const client = new PrismaClient({
      datasources: {
        db: {
          url: config.url,
        },
      },
      log: ['error', 'warn'],
    });

    this.replicaClients.set(config.name, client);
    this.replicaConfigs.set(config.name, config);
    this.initializeMetrics(config.name);

    console.log(`[DB_REPLICAS] Added replica: ${config.name}`);
  }

  /**
   * Remove a read replica
   */
  async removeReplica(replicaName: string): Promise<void> {
    const client = this.replicaClients.get(replicaName);
    if (client) {
      await client.$disconnect();
      this.replicaClients.delete(replicaName);
      this.replicaConfigs.delete(replicaName);
      this.healthStatus.delete(replicaName);
      this.metrics.delete(replicaName);

      console.log(`[DB_REPLICAS] Removed replica: ${replicaName}`);
    }
  }

  /**
   * Get master client for write operations
   */
  getMaster(): PrismaClient {
    return this.masterClient;
  }

  /**
   * Get optimal read replica client
   */
  getReadReplica(): PrismaClient {
    const healthyReplicas = this.getHealthyReplicas();
    
    if (healthyReplicas.length === 0) {
      console.warn('[DB_REPLICAS] No healthy replicas available, falling back to master');
      return this.masterClient;
    }

    // Use round-robin with health-based selection
    const selectedReplica = this.selectOptimalReplica(healthyReplicas);
    const client = this.replicaClients.get(selectedReplica.name);
    
    return client || this.masterClient;
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

      } catch (error) {
        lastError = error as Error;
        this.recordQueryError(clientName);
        
        console.warn(`[DB_REPLICAS] Query failed on ${clientName}, attempt ${attempt + 1}:`, error);
        
        // Mark replica as unhealthy if it's not the master
        if (clientName !== 'master') {
          this.markReplicaUnhealthy(clientName);
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
      
    } catch (error) {
      this.recordQueryError('master');
      throw error;
    }
  }

  /**
   * Execute transaction on master (writes must be on master)
   */
  async executeTransaction<T>(
    transactionFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.executeWriteQuery(transactionFn);
  }

  /**
   * Get healthy replicas
   */
  private getHealthyReplicas(): ReplicaHealth[] {
    return Array.from(this.healthStatus.values())
      .filter(health => health.isHealthy && health.name !== 'master')
      .sort((a, b) => a.responseTime - b.responseTime); // Sort by response time
  }

  /**
   * Select optimal replica using load balancing strategy
   */
  private selectOptimalReplica(healthyReplicas: ReplicaHealth[]): ReplicaHealth {
    if (healthyReplicas.length === 1) {
      return healthyReplicas[0];
    }

    // Weighted round-robin based on response time and priority
    const weights = healthyReplicas.map(replica => {
      const config = this.replicaConfigs.get(replica.name)!;
      const responseTimeFactor = 1000 / (replica.responseTime + 1); // Lower response time = higher weight
      const priorityFactor = config.priority || 1;
      return {
        replica,
        weight: responseTimeFactor * priorityFactor,
      };
    });

    // Select based on weighted probability
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { replica, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return replica;
      }
    }

    // Fallback to first healthy replica
    return healthyReplicas[0];
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
    });
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
  }

  /**
   * Record query error
   */
  private recordQueryError(clientName: string): void {
    const metrics = this.metrics.get(clientName);
    if (metrics) {
      metrics.errorCount++;
    }
  }

  /**
   * Mark replica as unhealthy
   */
  private markReplicaUnhealthy(replicaName: string): void {
    const health = this.healthStatus.get(replicaName);
    if (health) {
      health.isHealthy = false;
      health.errorCount++;
      health.lastCheck = new Date();
    }
  }

  /**
   * Start health monitoring for all databases
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllHealth();
    }, 30000); // Check every 30 seconds

    // Initial health check
    setTimeout(() => this.checkAllHealth(), 1000);
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
      
      this.healthStatus.set(name, {
        name,
        isHealthy: true,
        lastCheck: new Date(),
        responseTime,
        errorCount: currentHealth?.errorCount || 0,
        connectionCount: this.getConnectionCount(name),
      });

      if (currentHealth && !currentHealth.isHealthy) {
        console.log(`[DB_REPLICAS] Database ${name} is back online (${responseTime}ms)`);
      }

    } catch (error) {
      const currentHealth = this.healthStatus.get(name);
      const errorCount = (currentHealth?.errorCount || 0) + 1;
      
      this.healthStatus.set(name, {
        name,
        isHealthy: false,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorCount,
        connectionCount: 0,
      });

      console.error(`[DB_REPLICAS] Health check failed for ${name}:`, error);
    }
  }

  /**
   * Get connection count for database
   */
  private getConnectionCount(name: string): number {
    // In a real implementation, you would query the database for active connections
    // For now, return a mock value
    return Math.floor(Math.random() * 10) + 1;
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
    }
    
    console.log('[DB_REPLICAS] Metrics reset');
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
      console.log(`[DB_REPLICAS] Updated ${replicaName} priority to ${priority}`);
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
    
    console.log('[DB_REPLICAS] Forced failover to master - all replicas marked unhealthy');
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
      
      console.log(`[DB_REPLICAS] Manually restored health for replica: ${replicaName}`);
    }
  }

  /**
   * Get load distribution report
   */
  getLoadDistribution(): Record<string, { percentage: number; queryCount: number }> {
    const totalQueries = Array.from(this.metrics.values())
      .reduce((sum, metrics) => sum + metrics.queryCount, 0);

    if (totalQueries === 0) {
      return {};
    }

    const distribution: Record<string, { percentage: number; queryCount: number }> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      distribution[name] = {
        percentage: Math.round((metrics.queryCount / totalQueries) * 100 * 100) / 100,
        queryCount: metrics.queryCount,
      };
    }

    return distribution;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[DB_REPLICAS] Shutting down...');

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Disconnect all clients
    const disconnectPromises: Promise<void>[] = [];

    // Disconnect master
    disconnectPromises.push(this.masterClient.$disconnect());

    // Disconnect all replicas
    for (const client of this.replicaClients.values()) {
      disconnectPromises.push(client.$disconnect());
    }

    await Promise.all(disconnectPromises);

    // Clear all maps
    this.replicaClients.clear();
    this.replicaConfigs.clear();
    this.healthStatus.clear();
    this.metrics.clear();

    console.log('[DB_REPLICAS] Shutdown completed');
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
    },
    {
      url: process.env.DATABASE_READ_REPLICA_2_URL || 'postgresql://localhost:5434/taxomind_replica_2',
      name: 'replica-2',
      role: 'read-replica',
      region: 'secondary',
      priority: 1,
      maxConnections: 30,
      connectionTimeout: 5000,
      queryTimeout: 30000,
    },
  ];

  return { master, replicas };
}

export default DatabaseReplicaManager;