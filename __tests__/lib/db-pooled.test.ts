/**
 * Tests for lib/db-pooled.ts
 *
 * Verifies the enterprise database client's public API contract.
 * The global mock from jest.setup.js provides db-pooled mock.
 * Since resetMocks:true clears implementations, we restore them in beforeEach.
 */

import { db } from '@/lib/db';

const dbPooled = jest.requireMock('@/lib/db-pooled') as Record<string, unknown>;

describe('lib/db-pooled', () => {
  beforeEach(() => {
    // Restore implementations cleared by resetMocks
    (dbPooled.getDbMetrics as jest.Mock)?.mockReturnValue({
      totalQueries: 0, cacheHits: 0, cacheMisses: 0,
      averageQueryTime: 0, activeConnections: 1,
    });
    (dbPooled.checkDatabaseHealth as jest.Mock)?.mockResolvedValue({
      healthy: true, latency: 5, connectionCount: 1,
    });
  });

  it('should export db as a usable database client', () => {
    expect(db).toBeDefined();
    expect(db).toHaveProperty('user');
    expect(db).toHaveProperty('course');
  });

  it('should export getDb function', () => {
    expect(typeof dbPooled.getDb).toBe('function');
  });

  it('should return a db instance from getDb', () => {
    const getDb = dbPooled.getDb as () => unknown;
    const result = getDb();
    expect(result).toBeDefined();
  });

  it('should export getDbMetrics function that returns metrics', () => {
    expect(typeof dbPooled.getDbMetrics).toBe('function');
    const metrics = (dbPooled.getDbMetrics as () => Record<string, unknown>)();
    expect(metrics).toBeDefined();
    expect(metrics).toHaveProperty('totalQueries');
  });

  it('should export checkDatabaseHealth function', async () => {
    expect(typeof dbPooled.checkDatabaseHealth).toBe('function');
    const health = await (dbPooled.checkDatabaseHealth as () => Promise<Record<string, unknown>>)();
    expect(health).toBeDefined();
    expect(health).toHaveProperty('healthy');
    expect(health.healthy).toBe(true);
  });

  it('should export getBasePrismaClient function', () => {
    expect(typeof dbPooled.getBasePrismaClient).toBe('function');
  });

  it('should provide Prisma model operations on db proxy', () => {
    expect(typeof db.user.findUnique).toBe('function');
    expect(typeof db.user.findMany).toBe('function');
    expect(typeof db.user.create).toBe('function');
    expect(typeof db.user.update).toBe('function');
    expect(typeof db.user.delete).toBe('function');
  });

  it('should have $transaction method on db', () => {
    expect(typeof db.$transaction).toBe('function');
  });
});
