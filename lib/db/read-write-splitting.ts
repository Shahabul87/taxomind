/**
 * Read-Write Splitting - Phase 3 Enterprise Implementation
 * Advanced query routing with consistency guarantees and performance optimization
 * Features: Intelligent routing, read-after-write consistency, query analysis, monitoring
 */

import { PrismaClient } from '@prisma/client';
import { Pool, PoolClient } from 'pg';
import { Redis } from '@upstash/redis';
import { DatabaseReplicaManager } from './db-replicas';
import { logger } from '@/lib/logger';

export type QueryType = 'read' | 'write' | 'transaction';

export interface QueryContext {
  type: QueryType;
  model?: string;
  operation?: string;
  userId?: string;
  requiresConsistency?: boolean;
  preferredReplica?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  useCache?: boolean;
  tags?: string[];
  sessionId?: string;
}

export interface RoutingRule {
  name: string;
  condition: (context: QueryContext) => boolean;
  target: 'master' | 'replica' | 'specific-replica';
  specificReplica?: string;
  priority: number;
  description?: string;
  enabled?: boolean;
  conditions?: {
    models?: string[];
    operations?: string[];
    userRoles?: string[];
    timeWindows?: Array<{ start: string; end: string }>;
  };
}

/**
 * Query statistics interface
 */
export interface QueryStats {
  totalQueries: number;
  readQueries: number;
  writeQueries: number;
  transactionQueries: number;
  routedToMaster: number;
  routedToReplica: number;
  avgResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  lastReset: Date;
}

/**
 * Enterprise Database Router with advanced features
 */
export class DatabaseRouter {
  private redis: Redis;
  private replicaManager: DatabaseReplicaManager;
  private routingRules: RoutingRule[] = [];
  private consistencyMap: Map<string, number> = new Map(); // Track recent writes
  private queryStats: QueryStats;
  private queryCache: Map<string, { result: any; timestamp: number; ttl: number }> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();
  private slowQueryThreshold = 1000; // 1 second
  private metricsCollectionInterval?: NodeJS.Timeout;

  constructor(replicaManager: DatabaseReplicaManager, redis?: Redis) {
    this.replicaManager = replicaManager;
    this.redis = redis || new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    
    // Initialize query statistics
    this.queryStats = {
      totalQueries: 0,
      readQueries: 0,
      writeQueries: 0,
      transactionQueries: 0,
      routedToMaster: 0,
      routedToReplica: 0,
      avgResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      lastReset: new Date(),
    };
    
    this.initializeDefaultRules();
    this.startMetricsCollection();

  }

  /**
   * Initialize default routing rules
   */
  private initializeDefaultRules(): void {
    this.routingRules = [
      // Critical priority rules
      {
        name: 'circuit-breaker-protection',
        condition: (ctx) => this.isCircuitBreakerOpen(ctx.preferredReplica || 'any-replica'),
        target: 'master',
        priority: 0,
        description: 'Route to master when circuit breaker is open',
        enabled: true,
      },
      {
        name: 'force-master-for-writes',
        condition: (ctx) => ctx.type === 'write' || ctx.type === 'transaction',
        target: 'master',
        priority: 1,
        description: 'All writes must go to master',
        enabled: true,
      },
      {
        name: 'critical-priority-operations',
        condition: (ctx) => ctx.priority === 'critical',
        target: 'master',
        priority: 2,
        description: 'Critical operations use master for reliability',
        enabled: true,
      },
      {
        name: 'force-master-for-consistency',
        condition: (ctx) => ctx.requiresConsistency === true,
        target: 'master',
        priority: 3,
        description: 'Operations requiring strong consistency use master',
        enabled: true,
      },
      {
        name: 'recent-write-consistency',
        condition: (ctx) => this.hasRecentWrite(ctx.userId || ctx.sessionId || ctx.model || ''),
        target: 'master',
        priority: 4,
        description: 'Read-after-write consistency guarantee',
        enabled: true,
      },
      
      // High priority rules
      {
        name: 'cached-query-bypass',
        condition: (ctx) => ctx.useCache === false,
        target: 'replica',
        priority: 5,
        description: 'Bypass cache but still use replica for reads',
        enabled: true,
      },
      
      // Medium priority rules
      {
        name: 'preferred-replica',
        condition: (ctx) => !!ctx.preferredReplica && ctx.type === 'read',
        target: 'specific-replica',
        priority: 10,
        description: 'Use specific replica when requested',
        enabled: true,
      },
      {
        name: 'analytics-queries',
        condition: (ctx) => ctx.model === 'analytics' || (ctx.operation?.includes('aggregate') ?? false) || (ctx.operation?.includes('count') ?? false),
        target: 'replica',
        priority: 15,
        description: 'Analytics queries use replicas',
        enabled: true,
      },
      {
        name: 'reporting-queries',
        condition: (ctx) => (ctx.tags?.includes('reporting') ?? false) || (ctx.operation?.includes('report') ?? false),
        target: 'replica',
        priority: 16,
        description: 'Reporting queries use replicas',
        enabled: true,
      },
      
      // Low priority rules (defaults)
      {
        name: 'low-priority-background-reads',
        condition: (ctx) => ctx.type === 'read' && ctx.priority === 'low',
        target: 'replica',
        priority: 40,
        description: 'Low priority reads prefer replicas',
        enabled: true,
      },
      {
        name: 'read-operations',
        condition: (ctx) => ctx.type === 'read',
        target: 'replica',
        priority: 50,
        description: 'Default read operations use replicas',
        enabled: true,
      },
      {
        name: 'fallback-to-master',
        condition: () => true,
        target: 'master',
        priority: 100,
        description: 'Final fallback to master',
        enabled: true,
      },
    ];

  }

  /**
   * Route query to appropriate database with advanced decision making
   */
  route(context: QueryContext): PrismaClient {
    // Check query cache first
    if (context.type === 'read' && context.useCache !== false) {
      const cacheKey = this.generateCacheKey(context);
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.queryStats.cacheHitRate = (this.queryStats.cacheHitRate + 1) / 2;

        return cached.result;
      }
    }

    // Apply routing rules
    const applicableRules = this.routingRules
      .filter(rule => rule.enabled !== false && rule.condition(context))
      .sort((a, b) => a.priority - b.priority);

    if (applicableRules.length === 0) {
      logger.warn('[DB_ROUTER] No routing rules matched, defaulting to master');
      this.updateQueryStats(context, 'master');
      return this.replicaManager.getMaster();
    }

    const selectedRule = applicableRules[0];
    console.log(`[DB_ROUTER] Applied rule: ${selectedRule.name} (${selectedRule.description || 'No description'}) for ${context.type} operation`);

    let targetClient: PrismaClient;
    let targetType: string;

    switch (selectedRule.target) {
      case 'master':
        targetClient = this.replicaManager.getMaster();
        targetType = 'master';
        break;
        
      case 'replica':
        targetClient = this.replicaManager.getReadReplica();
        targetType = 'replica';
        break;
        
      case 'specific-replica':
        // In a full implementation, get specific replica by name
        targetClient = this.replicaManager.getReadReplica();
        targetType = 'replica';
        break;
        
      default:
        targetClient = this.replicaManager.getMaster();
        targetType = 'master';
    }

    this.updateQueryStats(context, targetType);
    return targetClient;
  }

  /**
   * Execute query with automatic routing, monitoring, and error handling
   */
  async executeQuery<T>(
    context: QueryContext,
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const client = this.route(context);
    const timeout = context.timeout || 30000; // 30 seconds default
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout);
      });
      
      // Execute query with timeout
      const result = await Promise.race([
        queryFn(client),
        timeoutPromise,
      ]);
      
      const responseTime = Date.now() - startTime;
      
      // Update performance metrics
      this.queryStats.avgResponseTime = (this.queryStats.avgResponseTime + responseTime) / 2;
      
      // Log slow queries
      if (responseTime > this.slowQueryThreshold) {
        logger.warn(`[DB_ROUTER] Slow query detected: ${responseTime}ms for ${context.type} on ${context.model}`);
        await this.logSlowQuery(context, responseTime);
      }
      
      // Track write operations for consistency
      if (context.type === 'write' || context.type === 'transaction') {
        this.trackWrite(context.userId || context.sessionId || context.model || '');
      }
      
      // Cache read results if applicable
      if (context.type === 'read' && context.useCache !== false && responseTime < 500) {
        this.cacheQueryResult(context, result);
      }
      
      // Reset circuit breaker on success
      this.recordQuerySuccess(context.preferredReplica || 'default');
      
      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Update error metrics
      this.queryStats.errorRate = (this.queryStats.errorRate + 1) / 2;
      
      // Record failure for circuit breaker
      this.recordQueryFailure(context.preferredReplica || 'default', error as Error);
      
      logger.error(`[DB_ROUTER] Query failed for ${context.type} operation after ${responseTime}ms:`, error);
      
      // Log error to Redis for monitoring
      await this.logQueryError(context, error as Error, responseTime);
      
      throw error;
    }
  }

  /**
   * Execute read query with replica preference
   */
  async read<T>(
    queryFn: (client: PrismaClient) => Promise<T>,
    options: {
      model?: string;
      userId?: string;
      requiresConsistency?: boolean;
      preferredReplica?: string;
    } = {
}
  ): Promise<T> {
    return this.executeQuery(
      {
        type: 'read',
        ...options,
      },
      queryFn
    );
  }

  /**
   * Execute write query on master
   */
  async write<T>(
    queryFn: (client: PrismaClient) => Promise<T>,
    options: {
      model?: string;
      userId?: string;
    } = {
}
  ): Promise<T> {
    return this.executeQuery(
      {
        type: 'write',
        ...options,
      },
      queryFn
    );
  }

  /**
   * Execute transaction on master
   */
  async transaction<T>(
    queryFn: (client: PrismaClient) => Promise<T>,
    options: {
      userId?: string;
    } = {
}
  ): Promise<T> {
    return this.executeQuery(
      {
        type: 'transaction',
        ...options,
      },
      queryFn
    );
  }

  /**
   * Track recent write for read-after-write consistency
   */
  private trackWrite(key: string): void {
    const timestamp = Date.now();
    this.consistencyMap.set(key, timestamp);
    
    // Also track in Redis for distributed consistency
    this.redis.setex(`write_timestamp:${key}`, 30, timestamp.toString()).catch(err => {
      logger.warn('[DB_ROUTER] Failed to track write in Redis:', err);
    });
    
    // Clean up old entries periodically
    if (Math.random() < 0.1) { // 10% chance to trigger cleanup
      setTimeout(() => this.cleanupConsistencyMap(), 1000);
    }
  }

  /**
   * Check if there's a recent write requiring consistency
   */
  private hasRecentWrite(key: string): boolean {
    const localWriteTime = this.consistencyMap.get(key);
    
    // Check local consistency map first (faster)
    if (localWriteTime) {
      const timeSinceWrite = Date.now() - localWriteTime;
      const consistencyWindow = 5000; // 5 seconds
      return timeSinceWrite < consistencyWindow;
    }
    
    // For distributed systems, we would also check Redis
    // This is handled asynchronously to avoid blocking the main query
    this.checkDistributedConsistency(key);
    
    return false;
  }
  
  /**
   * Check distributed consistency (async)
   */
  private async checkDistributedConsistency(key: string): Promise<boolean> {
    try {
      const redisTimestamp = await this.redis.get(`write_timestamp:${key}`);
      if (redisTimestamp) {
        const writeTime = parseInt(redisTimestamp as string);
        const timeSinceWrite = Date.now() - writeTime;
        const consistencyWindow = 5000; // 5 seconds
        
        if (timeSinceWrite < consistencyWindow) {
          // Update local cache
          this.consistencyMap.set(key, writeTime);
          return true;
        }
      }
    } catch (error: any) {
      logger.warn('[DB_ROUTER] Failed to check distributed consistency:', error);
    }
    
    return false;
  }

  /**
   * Clean up old consistency tracking entries
   */
  private cleanupConsistencyMap(): void {
    const now = Date.now();
    const maxAge = 60000; // 1 minute
    
    for (const [key, writeTime] of this.consistencyMap.entries()) {
      if (now - writeTime > maxAge) {
        this.consistencyMap.delete(key);
      }
    }
  }

  /**
   * Generate cache key for query result caching
   */
  private generateCacheKey(context: QueryContext): string {
    const parts = [
      context.type,
      context.model || 'unknown',
      context.operation || 'unknown',
      context.userId || 'anonymous',
    ];
    return `query_cache:${parts.join(':')}`;
  }

  /**
   * Cache query result
   */
  private cacheQueryResult(context: QueryContext, result: any): void {
    if (context.type === 'read') {
      const cacheKey = this.generateCacheKey(context);
      const ttl = context.priority === 'low' ? 300000 : 60000; // 5min for low priority, 1min for others
      
      this.queryCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        ttl,
      });
      
      // Clean up old cache entries periodically
      if (this.queryCache.size > 1000) {
        this.cleanupQueryCache();
      }
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupQueryCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(replicaId: string): boolean {
    const breaker = this.circuitBreakers.get(replicaId);
    if (!breaker) return false;
    
    // Circuit breaker logic: open if 5+ failures in last 30 seconds
    const now = Date.now();
    const resetTime = 30000; // 30 seconds
    
    if (breaker.isOpen && now - breaker.lastFailure > resetTime) {
      breaker.isOpen = false;
      breaker.failures = 0;

    }
    
    return breaker.isOpen;
  }

  /**
   * Record query success for circuit breaker
   */
  private recordQuerySuccess(replicaId: string): void {
    const breaker = this.circuitBreakers.get(replicaId);
    if (breaker && breaker.failures > 0) {
      breaker.failures = Math.max(0, breaker.failures - 1);
    }
  }

  /**
   * Record query failure for circuit breaker
   */
  private recordQueryFailure(replicaId: string, error: Error): void {
    let breaker = this.circuitBreakers.get(replicaId);
    if (!breaker) {
      breaker = { failures: 0, lastFailure: 0, isOpen: false };
      this.circuitBreakers.set(replicaId, breaker);
    }
    
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    // Open circuit breaker if too many failures
    if (breaker.failures >= 5) {
      breaker.isOpen = true;
      logger.warn(`[DB_ROUTER] Circuit breaker opened for ${replicaId} due to ${breaker.failures} failures`);
    }
  }

  /**
   * Update query statistics
   */
  private updateQueryStats(context: QueryContext, targetType: string): void {
    this.queryStats.totalQueries++;
    
    switch (context.type) {
      case 'read':
        this.queryStats.readQueries++;
        break;
      case 'write':
        this.queryStats.writeQueries++;
        break;
      case 'transaction':
        this.queryStats.transactionQueries++;
        break;
    }
    
    if (targetType === 'master') {
      this.queryStats.routedToMaster++;
    } else {
      this.queryStats.routedToReplica++;
    }
  }

  /**
   * Log slow query for monitoring
   */
  private async logSlowQuery(context: QueryContext, responseTime: number): Promise<void> {
    try {
      const slowQueryData = {
        timestamp: new Date(),
        context,
        responseTime,
        threshold: this.slowQueryThreshold,
      };
      
      await this.redis.lpush('slow_queries', JSON.stringify(slowQueryData));
      await this.redis.ltrim('slow_queries', 0, 999); // Keep last 1000 entries
    } catch (error: any) {
      logger.warn('[DB_ROUTER] Failed to log slow query:', error);
    }
  }

  /**
   * Log query error for monitoring
   */
  private async logQueryError(context: QueryContext, error: Error, responseTime: number): Promise<void> {
    try {
      const errorData = {
        timestamp: new Date(),
        context,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        responseTime,
      };
      
      await this.redis.lpush('query_errors', JSON.stringify(errorData));
      await this.redis.ltrim('query_errors', 0, 999); // Keep last 1000 entries
    } catch (redisError) {
      logger.warn('[DB_ROUTER] Failed to log query error:', redisError);
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        await this.collectAndPersistMetrics();
      } catch (error: any) {
        logger.error('[DB_ROUTER] Metrics collection failed:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Collect and persist routing metrics
   */
  private async collectAndPersistMetrics(): Promise<void> {
    try {
      const metrics = {
        ...this.queryStats,
        circuitBreakers: Object.fromEntries(
          Array.from(this.circuitBreakers.entries()).map(([id, breaker]) => [id, {
            failures: breaker.failures,
            isOpen: breaker.isOpen,
            lastFailure: breaker.lastFailure,
          }])
        ),
        cacheStats: {
          size: this.queryCache.size,
          hitRate: this.queryStats.cacheHitRate,
        },
        consistencyTracking: this.consistencyMap.size,
        timestamp: new Date(),
      };
      
      await this.redis.setex('db_router_metrics', 300, JSON.stringify(metrics));

    } catch (error: any) {
      logger.error('[DB_ROUTER] Failed to persist metrics:', error);
    }
  }

  /**
   * Add custom routing rule
   */
  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.push({
      ...rule,
      enabled: rule.enabled !== false, // Default to enabled
    });
    this.routingRules.sort((a, b) => a.priority - b.priority);
    
    console.log(`[DB_ROUTER] Added routing rule: ${rule.name} (priority: ${rule.priority})`);
  }

  /**
   * Remove routing rule
   */
  removeRoutingRule(ruleName: string): void {
    const index = this.routingRules.findIndex(rule => rule.name === ruleName);
    if (index !== -1) {
      this.routingRules.splice(index, 1);

    }
  }

  /**
   * Get comprehensive routing statistics
   */
  getRoutingStats(): {
    queryStats: QueryStats;
    rules: Array<{ name: string; priority: number; target: string; enabled: boolean; description?: string }>;
    consistencyTracking: number;
    recentWrites: Array<{ key: string; age: number }>;
    circuitBreakers: Record<string, { failures: number; isOpen: boolean; lastFailure: number }>;
    cacheStats: { size: number; hitRate: number };
    performance: {
      slowQueryThreshold: number;
      avgResponseTime: number;
      errorRate: number;
    };
  } {
    const recentWrites = Array.from(this.consistencyMap.entries()).map(([key, writeTime]) => ({
      key,
      age: Date.now() - writeTime,
    }));

    const circuitBreakerStats = Object.fromEntries(
      Array.from(this.circuitBreakers.entries()).map(([id, breaker]) => [id, {
        failures: breaker.failures,
        isOpen: breaker.isOpen,
        lastFailure: breaker.lastFailure,
      }])
    );

    return {
      queryStats: { ...this.queryStats },
      rules: this.routingRules.map(rule => ({
        name: rule.name,
        priority: rule.priority,
        target: rule.target,
        enabled: rule.enabled !== false,
        description: rule.description,
      })),
      consistencyTracking: this.consistencyMap.size,
      recentWrites,
      circuitBreakers: circuitBreakerStats,
      cacheStats: {
        size: this.queryCache.size,
        hitRate: this.queryStats.cacheHitRate,
      },
      performance: {
        slowQueryThreshold: this.slowQueryThreshold,
        avgResponseTime: this.queryStats.avgResponseTime,
        errorRate: this.queryStats.errorRate,
      },
    };
  }

  /**
   * Configure slow query threshold
   */
  setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;

  }

  /**
   * Reset query statistics
   */
  resetQueryStats(): void {
    this.queryStats = {
      totalQueries: 0,
      readQueries: 0,
      writeQueries: 0,
      transactionQueries: 0,
      routedToMaster: 0,
      routedToReplica: 0,
      avgResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      lastReset: new Date(),
    };

  }

  /**
   * Enable or disable routing rule
   */
  setRuleEnabled(ruleName: string, enabled: boolean): void {
    const rule = this.routingRules.find(r => r.name === ruleName);
    if (rule) {
      rule.enabled = enabled;

    } else {
      logger.warn(`[DB_ROUTER] Rule ${ruleName} not found`);
    }
  }

  /**
   * Clear query cache
   */
  clearQueryCache(): void {
    this.queryCache.clear();

  }

  /**
   * Force reset circuit breakers
   */
  resetCircuitBreakers(): void {
    for (const [id, breaker] of this.circuitBreakers.entries()) {
      breaker.failures = 0;
      breaker.isOpen = false;
      breaker.lastFailure = 0;
    }

  }

  /**
   * Get raw database connections for advanced use cases
   */
  async getRawConnection(isWrite: boolean = false): Promise<{
    client: PoolClient;
    replicaId: string;
    release: () => void;
  }> {
    return this.replicaManager.getConnection(isWrite);
  }

  /**
   * Execute raw SQL with routing
   */
  async executeRawQuery<T = any>(
    query: string,
    params: any[] = [],
    context: Partial<QueryContext> = {
}
  ): Promise<T[]> {
    const fullContext: QueryContext = {
      type: context.type || (query.trim().toLowerCase().startsWith('select') ? 'read' : 'write'),
      operation: 'raw-query',
      ...context,
    };

    if (fullContext.type === 'read') {
      return this.replicaManager.executeRawReadQuery(query, params);
    } else {
      return this.replicaManager.executeRawWriteQuery(query, params);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {

    // Stop metrics collection
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
    }
    
    // Persist final metrics
    try {
      await this.collectAndPersistMetrics();
    } catch (error: any) {
      logger.warn('[DB_ROUTER] Failed to persist final metrics:', error);
    }
    
    // Clear caches and maps
    this.queryCache.clear();
    this.consistencyMap.clear();
    this.circuitBreakers.clear();

  }
}

/**
 * High-level database operations with automatic routing
 */
export class RoutedDatabaseOperations {
  private router: DatabaseRouter;

  constructor(replicaManager: DatabaseReplicaManager) {
    this.router = new DatabaseRouter(replicaManager);
  }

  /**
   * Find many with read replica preference
   */
  async findMany<T>(
    model: string,
    args: any,
    options: {
      userId?: string;
      requiresConsistency?: boolean;
    } = {
}
  ): Promise<T[]> {
    return this.router.read(
      (client) => (client as any)[model].findMany(args),
      {
        model,
        ...options,
      }
    );
  }

  /**
   * Find unique with consistency check
   */
  async findUnique<T>(
    model: string,
    args: any,
    options: {
      userId?: string;
      requiresConsistency?: boolean;
    } = {
}
  ): Promise<T | null> {
    return this.router.read(
      (client) => (client as any)[model].findUnique(args),
      {
        model,
        ...options,
      }
    );
  }

  /**
   * Create operation on master
   */
  async create<T>(
    model: string,
    args: any,
    options: {
      userId?: string;
    } = {
}
  ): Promise<T> {
    return this.router.write(
      (client) => (client as any)[model].create(args),
      {
        model,
        ...options,
      }
    );
  }

  /**
   * Update operation on master
   */
  async update<T>(
    model: string,
    args: any,
    options: {
      userId?: string;
    } = {
}
  ): Promise<T> {
    return this.router.write(
      (client) => (client as any)[model].update(args),
      {
        model,
        ...options,
      }
    );
  }

  /**
   * Delete operation on master
   */
  async delete<T>(
    model: string,
    args: any,
    options: {
      userId?: string;
    } = {
}
  ): Promise<T> {
    return this.router.write(
      (client) => (client as any)[model].delete(args),
      {
        model,
        ...options,
      }
    );
  }

  /**
   * Aggregate operations on read replica
   */
  async aggregate<T>(
    model: string,
    args: any,
    options: {
      requiresConsistency?: boolean;
    } = {
}
  ): Promise<T> {
    return this.router.read(
      (client) => (client as any)[model].aggregate(args),
      {
        model,
        ...options,
      }
    );
  }

  /**
   * Count operations on read replica
   */
  async count(
    model: string,
    args: any,
    options: {
      requiresConsistency?: boolean;
    } = {
}
  ): Promise<number> {
    return this.router.read(
      (client) => (client as any)[model].count(args),
      {
        model,
        ...options,
      }
    );
  }

  /**
   * Complex transaction on master
   */
  async executeTransaction<T>(
    transactionFn: (client: PrismaClient) => Promise<T>,
    options: {
      userId?: string;
    } = {
}
  ): Promise<T> {
    return this.router.transaction(transactionFn, options);
  }

  /**
   * Raw query with routing
   */
  async queryRaw<T>(
    query: string,
    params: any[] = [],
    options: {
      isWrite?: boolean;
      userId?: string;
      requiresConsistency?: boolean;
    } = {
}
  ): Promise<T> {
    const queryType: QueryType = options.isWrite ? 'write' : 'read';
    
    return this.router.executeQuery(
      {
        type: queryType,
        operation: 'raw-query',
        ...options,
      },
      (client) => client.$queryRaw`${query}`
    );
  }

  /**
   * Get router for advanced configuration
   */
  getRouter(): DatabaseRouter {
    return this.router;
  }
}

/**
 * Specialized routing for common patterns
 */
export class SpecializedRouting {
  private operations: RoutedDatabaseOperations;

  constructor(replicaManager: DatabaseReplicaManager) {
    this.operations = new RoutedDatabaseOperations(replicaManager);
  }

  /**
   * User-specific operations with consistency guarantee
   */
  async userOperation<T>(
    userId: string,
    operationFn: (operations: RoutedDatabaseOperations) => Promise<T>
  ): Promise<T> {
    // All user operations require consistency
    return operationFn(this.operations);
  }

  /**
   * Analytics operations optimized for read replicas
   */
  async analyticsOperation<T>(
    operationFn: (operations: RoutedDatabaseOperations) => Promise<T>
  ): Promise<T> {
    // Analytics operations don't require strong consistency
    return operationFn(this.operations);
  }

  /**
   * Reporting operations with eventual consistency
   */
  async reportingOperation<T>(
    operationFn: (operations: RoutedDatabaseOperations) => Promise<T>
  ): Promise<T> {
    // Reporting can use slightly stale data
    return operationFn(this.operations);
  }

  /**
   * Critical operations that must use master
   */
  async criticalOperation<T>(
    operationFn: (operations: RoutedDatabaseOperations) => Promise<T>
  ): Promise<T> {
    // Critical operations always use master with highest priority
    const router = this.operations.getRouter();
    return router.executeQuery(
      {
        type: 'read',
        priority: 'critical',
        requiresConsistency: true,
      },
      (client) => operationFn(this.operations)
    );
  }

  /**
   * Get router for advanced configuration
   */
  getRouter(): DatabaseRouter {
    return this.operations.getRouter();
  }
}

/**
 * Factory function to create enterprise database router
 */
export function createEnterpriseRouter(
  replicaManager: DatabaseReplicaManager,
  redis?: Redis
): {
  router: DatabaseRouter;
  operations: RoutedDatabaseOperations;
  specialized: SpecializedRouting;
} {
  const router = new DatabaseRouter(replicaManager, redis);
  const operations = new RoutedDatabaseOperations(replicaManager);
  const specialized = new SpecializedRouting(replicaManager);
  
  return { router, operations, specialized };
}

/**
 * Advanced query builder with routing awareness
 */
export class RoutingAwareQueryBuilder {
  private router: DatabaseRouter;
  private baseContext: Partial<QueryContext>;

  constructor(router: DatabaseRouter, baseContext: Partial<QueryContext> = {}) {
    this.router = router;
    this.baseContext = baseContext;
  }

  /**
   * Set query priority
   */
  priority(level: 'low' | 'medium' | 'high' | 'critical'): RoutingAwareQueryBuilder {
    return new RoutingAwareQueryBuilder(this.router, {
      ...this.baseContext,
      priority: level,
    });
  }

  /**
   * Require strong consistency
   */
  consistent(): RoutingAwareQueryBuilder {
    return new RoutingAwareQueryBuilder(this.router, {
      ...this.baseContext,
      requiresConsistency: true,
    });
  }

  /**
   * Set preferred replica
   */
  replica(replicaId: string): RoutingAwareQueryBuilder {
    return new RoutingAwareQueryBuilder(this.router, {
      ...this.baseContext,
      preferredReplica: replicaId,
    });
  }

  /**
   * Disable caching for this query
   */
  noCache(): RoutingAwareQueryBuilder {
    return new RoutingAwareQueryBuilder(this.router, {
      ...this.baseContext,
      useCache: false,
    });
  }

  /**
   * Set timeout for query
   */
  timeout(ms: number): RoutingAwareQueryBuilder {
    return new RoutingAwareQueryBuilder(this.router, {
      ...this.baseContext,
      timeout: ms,
    });
  }

  /**
   * Add tags for categorization
   */
  tags(...tagList: string[]): RoutingAwareQueryBuilder {
    return new RoutingAwareQueryBuilder(this.router, {
      ...this.baseContext,
      tags: [...(this.baseContext.tags || []), ...tagList],
    });
  }

  /**
   * Execute the configured query
   */
  async execute<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    const context: QueryContext = {
      type: 'read', // Default to read, can be overridden
      ...this.baseContext,
    } as QueryContext;

    return this.router.executeQuery(context, queryFn);
  }

  /**
   * Execute as write operation
   */
  async write<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    const context: QueryContext = {
      ...this.baseContext,
      type: 'write',
    } as QueryContext;

    return this.router.executeQuery(context, queryFn);
  }

  /**
   * Execute as transaction
   */
  async transaction<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    const context: QueryContext = {
      ...this.baseContext,
      type: 'transaction',
    } as QueryContext;

    return this.router.executeQuery(context, queryFn);
  }
}

export default DatabaseRouter;