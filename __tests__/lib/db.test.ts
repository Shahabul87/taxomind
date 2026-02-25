/**
 * Tests for lib/db.ts
 *
 * This module re-exports from db-pooled.ts.
 * Since jest.setup.js provides global mocks for @/lib/db and @/lib/db-pooled,
 * and resetMocks:true clears implementations between tests, we verify
 * the API contract by setting up mock implementations in beforeEach.
 */

import { db } from '@/lib/db';

// Access the mocked db-pooled module to verify its exports
const dbPooledMock = jest.requireMock('@/lib/db-pooled') as Record<string, unknown>;

describe('lib/db', () => {
  beforeEach(() => {
    // Re-apply implementations since resetMocks clears them
    (dbPooledMock.getDbMetrics as jest.Mock)?.mockReturnValue({
      totalQueries: 0, cacheHits: 0, cacheMisses: 0,
      averageQueryTime: 0, activeConnections: 1,
    });
    (dbPooledMock.checkDatabaseHealth as jest.Mock)?.mockResolvedValue({
      healthy: true, latency: 5, connectionCount: 1,
    });
  });

  it('should export db object with model access', () => {
    expect(db).toBeDefined();
    expect(db).toHaveProperty('user');
    expect(db).toHaveProperty('course');
  });

  it('should export db with Prisma model operations', () => {
    expect(typeof db.user.findUnique).toBe('function');
    expect(typeof db.user.findMany).toBe('function');
    expect(typeof db.user.create).toBe('function');
    expect(typeof db.user.update).toBe('function');
    expect(typeof db.user.delete).toBe('function');
  });

  it('should have $transaction method on db', () => {
    expect(typeof db.$transaction).toBe('function');
  });

  it('should have $queryRaw method on db', () => {
    expect(typeof db.$queryRaw).toBe('function');
  });

  it('should have getDb in db-pooled mock', () => {
    expect(typeof dbPooledMock.getDb).toBe('function');
  });

  it('should have getDbMetrics in db-pooled mock', () => {
    expect(typeof dbPooledMock.getDbMetrics).toBe('function');
  });

  it('should have checkDatabaseHealth in db-pooled mock', () => {
    expect(typeof dbPooledMock.checkDatabaseHealth).toBe('function');
  });

  it('should have getBasePrismaClient in db-pooled mock', () => {
    expect(typeof dbPooledMock.getBasePrismaClient).toBe('function');
  });
});
