/**
 * Tests for lib/db/read-write-splitting.ts
 *
 * Verifies the DatabaseRouter, routing rules, circuit breakers,
 * consistency tracking, query caching, and factory functions.
 */

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    lpush: jest.fn().mockResolvedValue(1),
    ltrim: jest.fn().mockResolvedValue('OK'),
  })),
}));

jest.mock('@/lib/db/db-replicas', () => ({
  DatabaseReplicaManager: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

jest.mock('pg', () => ({
  Pool: jest.fn(),
  PoolClient: jest.fn(),
}));

import {
  DatabaseRouter,
  RoutedDatabaseOperations,
  SpecializedRouting,
  RoutingAwareQueryBuilder,
  createEnterpriseRouter,
  type QueryContext,
  type RoutingRule,
  type QueryStats,
} from '@/lib/db/read-write-splitting';

// Create mock replica manager
const mockMasterClient = {
  user: { findMany: jest.fn() },
  $queryRaw: jest.fn(),
} as any;

const mockReplicaClient = {
  user: { findMany: jest.fn() },
  $queryRaw: jest.fn(),
} as any;

const mockReplicaManager = {
  getMaster: jest.fn(() => mockMasterClient),
  getReadReplica: jest.fn(() => mockReplicaClient),
  getConnection: jest.fn(),
  executeRawReadQuery: jest.fn(),
  executeRawWriteQuery: jest.fn(),
} as any;

describe('DatabaseRouter', () => {
  let router: DatabaseRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    router = new DatabaseRouter(mockReplicaManager);
  });

  afterEach(async () => {
    await router.shutdown();
  });

  describe('route()', () => {
    it('should route write operations to master', () => {
      const context: QueryContext = { type: 'write', model: 'user' };
      const client = router.route(context);
      expect(mockReplicaManager.getMaster).toHaveBeenCalled();
    });

    it('should route transaction operations to master', () => {
      const context: QueryContext = { type: 'transaction' };
      const client = router.route(context);
      expect(mockReplicaManager.getMaster).toHaveBeenCalled();
    });

    it('should route read operations to replica', () => {
      const context: QueryContext = { type: 'read', model: 'user' };
      const client = router.route(context);
      expect(mockReplicaManager.getReadReplica).toHaveBeenCalled();
    });

    it('should route critical priority operations to master', () => {
      const context: QueryContext = { type: 'read', priority: 'critical' };
      const client = router.route(context);
      expect(mockReplicaManager.getMaster).toHaveBeenCalled();
    });

    it('should route consistency-required reads to master', () => {
      const context: QueryContext = { type: 'read', requiresConsistency: true };
      const client = router.route(context);
      expect(mockReplicaManager.getMaster).toHaveBeenCalled();
    });
  });

  describe('addRoutingRule() / removeRoutingRule()', () => {
    it('should add a custom routing rule', () => {
      const rule: RoutingRule = {
        name: 'test-rule',
        condition: () => true,
        target: 'master',
        priority: 0,
      };
      router.addRoutingRule(rule);
      const stats = router.getRoutingStats();
      const found = stats.rules.find((r) => r.name === 'test-rule');
      expect(found).toBeDefined();
    });

    it('should remove a routing rule', () => {
      router.removeRoutingRule('read-operations');
      const stats = router.getRoutingStats();
      const found = stats.rules.find((r) => r.name === 'read-operations');
      expect(found).toBeUndefined();
    });
  });

  describe('getRoutingStats()', () => {
    it('should return comprehensive routing statistics', () => {
      const stats = router.getRoutingStats();
      expect(stats).toHaveProperty('queryStats');
      expect(stats).toHaveProperty('rules');
      expect(stats).toHaveProperty('consistencyTracking');
      expect(stats).toHaveProperty('circuitBreakers');
      expect(stats).toHaveProperty('cacheStats');
      expect(stats).toHaveProperty('performance');
      expect(stats.queryStats.totalQueries).toBe(0);
    });
  });

  describe('resetQueryStats()', () => {
    it('should reset all query statistics', () => {
      router.route({ type: 'read' });
      router.resetQueryStats();
      const stats = router.getRoutingStats();
      expect(stats.queryStats.totalQueries).toBe(0);
    });
  });

  describe('setRuleEnabled()', () => {
    it('should enable or disable a rule by name', () => {
      router.setRuleEnabled('read-operations', false);
      const stats = router.getRoutingStats();
      const rule = stats.rules.find((r) => r.name === 'read-operations');
      expect(rule?.enabled).toBe(false);
    });
  });

  describe('setSlowQueryThreshold()', () => {
    it('should update the slow query threshold', () => {
      router.setSlowQueryThreshold(2000);
      const stats = router.getRoutingStats();
      expect(stats.performance.slowQueryThreshold).toBe(2000);
    });
  });
});

describe('RoutingAwareQueryBuilder', () => {
  let router: DatabaseRouter;

  beforeEach(() => {
    router = new DatabaseRouter(mockReplicaManager);
  });

  afterEach(async () => {
    await router.shutdown();
  });

  it('should build a fluent query chain', () => {
    const builder = new RoutingAwareQueryBuilder(router);
    const chained = builder
      .priority('high')
      .consistent()
      .noCache()
      .timeout(5000)
      .tags('reporting', 'analytics');
    expect(chained).toBeInstanceOf(RoutingAwareQueryBuilder);
  });

  it('should set a preferred replica', () => {
    const builder = new RoutingAwareQueryBuilder(router);
    const chained = builder.replica('replica-1');
    expect(chained).toBeInstanceOf(RoutingAwareQueryBuilder);
  });
});

describe('createEnterpriseRouter', () => {
  it('should return router, operations, and specialized instances', () => {
    const result = createEnterpriseRouter(mockReplicaManager);
    expect(result).toHaveProperty('router');
    expect(result).toHaveProperty('operations');
    expect(result).toHaveProperty('specialized');
    expect(result.router).toBeInstanceOf(DatabaseRouter);
    expect(result.operations).toBeInstanceOf(RoutedDatabaseOperations);
    expect(result.specialized).toBeInstanceOf(SpecializedRouting);
  });
});
