/**
 * Tests for lib/db/connection-pool.ts
 *
 * Verifies ConnectionPoolManager, pool configs, and factory functions.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  }));
});

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    end: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  ConnectionPoolManager,
  createDefaultPoolConfigs,
  createEnterprisePoolManager,
  type ConnectionPoolConfig,
} from '@/lib/db/connection-pool';

describe('ConnectionPoolManager', () => {
  let manager: ConnectionPoolManager;

  beforeEach(() => {
    manager = new ConnectionPoolManager();
  });

  afterEach(async () => {
    await manager.closeAllPools();
  });

  it('should create a new instance', () => {
    expect(manager).toBeInstanceOf(ConnectionPoolManager);
  });

  it('should return pool summary with zero pools initially', () => {
    const summary = manager.getPoolSummary();
    expect(summary).toEqual({
      totalPools: 0,
      totalConnections: 0,
      healthyPools: 0,
      degradedPools: 0,
    });
  });

  it('should close all pools without error when no pools exist', async () => {
    await expect(manager.closeAllPools()).resolves.not.toThrow();
  });
});

describe('createDefaultPoolConfigs', () => {
  it('should return an array of pool configurations', () => {
    const configs = createDefaultPoolConfigs();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBe(4);
  });

  it('should include master-pool config', () => {
    const configs = createDefaultPoolConfigs();
    const masterPool = configs.find((c) => c.name === 'master-pool');
    expect(masterPool).toBeDefined();
    expect(masterPool?.minConnections).toBe(5);
    expect(masterPool?.maxConnections).toBe(20);
    expect(masterPool?.retryAttempts).toBe(3);
  });

  it('should include replica pool configs', () => {
    const configs = createDefaultPoolConfigs();
    const replica1 = configs.find((c) => c.name === 'replica-pool-1');
    const replica2 = configs.find((c) => c.name === 'replica-pool-2');
    expect(replica1).toBeDefined();
    expect(replica2).toBeDefined();
  });

  it('should include analytics pool config with longer timeouts', () => {
    const configs = createDefaultPoolConfigs();
    const analytics = configs.find((c) => c.name === 'analytics-pool');
    expect(analytics).toBeDefined();
    expect(analytics?.connectionTimeout).toBe(10000);
    expect(analytics?.idleTimeout).toBe(600000);
  });

  it('should have enableMetrics true for all configs', () => {
    const configs = createDefaultPoolConfigs();
    for (const config of configs) {
      expect(config.enableMetrics).toBe(true);
    }
  });
});

describe('createEnterprisePoolManager', () => {
  it('should create a ConnectionPoolManager instance', () => {
    const manager = createEnterprisePoolManager();
    expect(manager).toBeInstanceOf(ConnectionPoolManager);
  });
});
