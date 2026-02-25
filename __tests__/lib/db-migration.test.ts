/**
 * Tests for lib/db-migration.ts
 *
 * Verifies the migration-aware DB client with environment-based routing
 * between standard PrismaClient and EnterpriseDB.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    user: { findUnique: jest.fn() },
  })),
}));

jest.mock('@/lib/enterprise-db', () => ({
  EnterpriseDB: class MockEnterpriseDB {},
  db: {
    user: { findUnique: jest.fn() },
    $connect: jest.fn(),
  },
}));

jest.mock('@/lib/db-environment', () => ({
  getDbEnvironment: jest.fn(() => ({
    environment: 'development',
    strictMode: false,
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

describe('lib/db-migration', () => {
  beforeEach(() => {
    jest.resetModules();
    delete (globalThis as Record<string, unknown>).prisma;

    // Re-apply the mocks after resetModules
    jest.mock('@prisma/client', () => ({
      PrismaClient: jest.fn().mockImplementation(() => ({
        $connect: jest.fn(),
        user: { findUnique: jest.fn() },
      })),
    }));
    jest.mock('@/lib/enterprise-db', () => ({
      EnterpriseDB: class MockEnterpriseDB {},
      db: {
        user: { findUnique: jest.fn() },
        $connect: jest.fn(),
      },
    }));
    jest.mock('@/lib/db-environment', () => ({
      getDbEnvironment: jest.fn(() => ({
        environment: 'development',
        strictMode: false,
      })),
    }));
    jest.mock('@/lib/logger', () => ({
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    }));
  });

  it('should export db instance in development mode', () => {
    const { db } = require('@/lib/db-migration');
    expect(db).toBeDefined();
  });

  it('should export getEnterpriseDB function', () => {
    const { getEnterpriseDB } = require('@/lib/db-migration');
    expect(typeof getEnterpriseDB).toBe('function');
    const result = getEnterpriseDB();
    expect(result).toBeDefined();
  });

  it('should export migrateToEnterpriseDB function', () => {
    const { migrateToEnterpriseDB } = require('@/lib/db-migration');
    expect(typeof migrateToEnterpriseDB).toBe('function');
  });

  it('should export EnterpriseDB class', () => {
    const mod = require('@/lib/db-migration');
    expect(mod.EnterpriseDB).toBeDefined();
  });

  it('should call operation with db in migrateToEnterpriseDB', async () => {
    const { migrateToEnterpriseDB } = require('@/lib/db-migration');
    const operation = jest.fn().mockResolvedValue({ id: '1' });
    const result = await migrateToEnterpriseDB(operation);
    expect(operation).toHaveBeenCalled();
    expect(result).toEqual({ id: '1' });
  });
});
