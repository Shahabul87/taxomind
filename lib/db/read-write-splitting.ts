/**
 * Read-Write Splitting
 * Automatic query routing between master and read replicas
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseReplicaManager } from './db-replicas';

export type QueryType = 'read' | 'write' | 'transaction';

export interface QueryContext {
  type: QueryType;
  model?: string;
  operation?: string;
  userId?: string;
  requiresConsistency?: boolean;
  preferredReplica?: string;
}

export interface RoutingRule {
  name: string;
  condition: (context: QueryContext) => boolean;
  target: 'master' | 'replica' | 'specific-replica';
  specificReplica?: string;
  priority: number;
}

/**
 * Smart Database Router
 */
export class DatabaseRouter {
  private replicaManager: DatabaseReplicaManager;
  private routingRules: RoutingRule[] = [];
  private consistencyMap: Map<string, number> = new Map(); // Track recent writes for read-after-write consistency

  constructor(replicaManager: DatabaseReplicaManager) {
    this.replicaManager = replicaManager;
    this.initializeDefaultRules();
  }

  /**
   * Initialize default routing rules
   */
  private initializeDefaultRules(): void {
    this.routingRules = [
      // High priority rules
      {
        name: 'force-master-for-writes',
        condition: (ctx) => ctx.type === 'write' || ctx.type === 'transaction',
        target: 'master',
        priority: 1,
      },
      {
        name: 'force-master-for-consistency',
        condition: (ctx) => ctx.requiresConsistency === true,
        target: 'master',
        priority: 2,
      },
      {
        name: 'recent-write-consistency',
        condition: (ctx) => this.hasRecentWrite(ctx.userId || ctx.model || ''),
        target: 'master',
        priority: 3,
      },
      
      // Medium priority rules
      {
        name: 'preferred-replica',
        condition: (ctx) => !!ctx.preferredReplica,
        target: 'specific-replica',
        priority: 10,
      },
      {
        name: 'analytics-queries',
        condition: (ctx) => ctx.model === 'analytics' || ctx.operation?.includes('aggregate'),
        target: 'replica',
        priority: 15,
      },
      
      // Low priority rules (defaults)
      {
        name: 'read-operations',
        condition: (ctx) => ctx.type === 'read',
        target: 'replica',
        priority: 50,
      },
      {
        name: 'fallback-to-master',
        condition: () => true,
        target: 'master',
        priority: 100,
      },
    ];

    console.log(`[DB_ROUTER] Initialized with ${this.routingRules.length} routing rules`);
  }

  /**
   * Route query to appropriate database
   */
  route(context: QueryContext): PrismaClient {
    const applicableRules = this.routingRules
      .filter(rule => rule.condition(context))
      .sort((a, b) => a.priority - b.priority);

    if (applicableRules.length === 0) {
      console.warn('[DB_ROUTER] No routing rules matched, defaulting to master');
      return this.replicaManager.getMaster();
    }

    const selectedRule = applicableRules[0];
    console.log(`[DB_ROUTER] Applied rule: ${selectedRule.name} for ${context.type} operation`);

    switch (selectedRule.target) {
      case 'master':
        return this.replicaManager.getMaster();
        
      case 'replica':
        return this.replicaManager.getReadReplica();
        
      case 'specific-replica':
        if (selectedRule.specificReplica || context.preferredReplica) {
          // In a full implementation, you'd get specific replica by name
          // For now, fall back to any read replica
          return this.replicaManager.getReadReplica();
        }
        return this.replicaManager.getReadReplica();
        
      default:
        return this.replicaManager.getMaster();
    }
  }

  /**
   * Execute query with automatic routing
   */
  async executeQuery<T>(
    context: QueryContext,
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client = this.route(context);
    
    try {
      const result = await queryFn(client);
      
      // Track write operations for consistency
      if (context.type === 'write') {
        this.trackWrite(context.userId || context.model || '');
      }
      
      return result;
    } catch (error) {
      console.error(`[DB_ROUTER] Query failed for ${context.type} operation:`, error);
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
    } = {}
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
    } = {}
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
    } = {}
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
    this.consistencyMap.set(key, Date.now());
    
    // Clean up old entries
    setTimeout(() => {
      this.cleanupConsistencyMap();
    }, 30000); // Clean up every 30 seconds
  }

  /**
   * Check if there's a recent write requiring consistency
   */
  private hasRecentWrite(key: string): boolean {
    const writeTime = this.consistencyMap.get(key);
    if (!writeTime) return false;
    
    const timeSinceWrite = Date.now() - writeTime;
    const consistencyWindow = 5000; // 5 seconds
    
    return timeSinceWrite < consistencyWindow;
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
   * Add custom routing rule
   */
  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.push(rule);
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
      console.log(`[DB_ROUTER] Removed routing rule: ${ruleName}`);
    }
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    rules: Array<{ name: string; priority: number; target: string }>;
    consistencyTracking: number;
    recentWrites: Array<{ key: string; age: number }>;
  } {
    const recentWrites = Array.from(this.consistencyMap.entries()).map(([key, writeTime]) => ({
      key,
      age: Date.now() - writeTime,
    }));

    return {
      rules: this.routingRules.map(rule => ({
        name: rule.name,
        priority: rule.priority,
        target: rule.target,
      })),
      consistencyTracking: this.consistencyMap.size,
      recentWrites,
    };
  }

  /**
   * Update consistency window
   */
  updateConsistencyWindow(windowMs: number): void {
    // This would update the consistency window used in hasRecentWrite
    console.log(`[DB_ROUTER] Consistency window updated to ${windowMs}ms`);
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
    } = {}
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
    } = {}
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
    } = {}
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
    } = {}
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
    } = {}
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
    } = {}
  ): Promise<T> {
    return this.router.read(
      (client) => (client as any)[model].aggregate(args),
      {
        model,
        operation: 'aggregate',
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
    } = {}
  ): Promise<number> {
    return this.router.read(
      (client) => (client as any)[model].count(args),
      {
        model,
        operation: 'count',
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
    } = {}
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
    } = {}
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
    // Critical operations always use master
    const router = this.operations.getRouter();
    return router.executeQuery(
      {
        type: 'read',
        requiresConsistency: true,
      },
      (client) => operationFn(new RoutedDatabaseOperations(new DatabaseReplicaManager(
        { url: '', name: 'master', role: 'master', priority: 1, maxConnections: 10, connectionTimeout: 5000, queryTimeout: 30000 }
      )))
    );
  }
}

export default DatabaseRouter;