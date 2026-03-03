import { getEnvironmentConfig, safeDBOperation } from '@/lib/db-environment';

// Helper functions for tests
const getEnvironment = () => {
  const config = getEnvironmentConfig();
  return config.isProduction ? 'production' : config.isStaging ? 'staging' : 'development';
};

const canPerformDestructiveOperation = () => {
  const config = getEnvironmentConfig();
  return config.isDevelopment;
};

describe('Environment Separation Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment Detection', () => {
    it('should correctly identify development environment', () => {
      (process.env as any).NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5433/dev_db';
      
      expect(getEnvironment()).toBe('development');
    });

    it('should correctly identify production environment', () => {
      (process.env as any).NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      expect(getEnvironment()).toBe('production');
    });

    it('should correctly identify staging environment', () => {
      (process.env as any).NODE_ENV = 'staging';
      process.env.DATABASE_URL = 'postgresql://staging-postgres.railway.internal:5432/staging_db';
      
      expect(getEnvironment()).toBe('staging');
    });
  });

  describe('Destructive Operation Protection', () => {
    it('should allow destructive operations in development', () => {
      (process.env as any).NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5433/dev_db';
      
      expect(canPerformDestructiveOperation()).toBe(true);
    });

    it('should block destructive operations in production', () => {
      (process.env as any).NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      expect(canPerformDestructiveOperation()).toBe(false);
    });

    it('should block destructive operations in staging', () => {
      (process.env as any).NODE_ENV = 'staging';
      process.env.DATABASE_URL = 'postgresql://staging-postgres.railway.internal:5432/staging_db';
      
      expect(canPerformDestructiveOperation()).toBe(false);
    });
  });

  describe('Cross-Environment Protection', () => {
    it('should warn when using production database in development', () => {
      (process.env as any).NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.AUTH_SECRET = 'test-secret';

      const { logger: mockLog } = require('@/lib/logger');
      mockLog.warn.mockClear();

      // Import module to trigger warning
      jest.isolateModules(() => {
        const dbEnv = require('@/lib/db-environment');
        dbEnv.validateEnvironment();
      });

      expect(mockLog.warn).toHaveBeenCalledWith(
        expect.stringContaining('Using production database in development environment')
      );
    });

    it('should not warn when using local database in development', () => {
      const { logger: isolatedLogger } = require('@/lib/logger');
      isolatedLogger.warn.mockClear();

      (process.env as any).NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5433/dev_db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.AUTH_SECRET = 'test-secret';

      jest.isolateModules(() => {
        const dbEnv = require('@/lib/db-environment');
        dbEnv.validateEnvironment();
      });

      // logger.warn should not be called with the production database warning
      expect(isolatedLogger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('Using production database in development environment')
      );
    });
  });

  describe('Strict Mode Enforcement', () => {
    it('should enforce strict mode when enabled', () => {
      (process.env as any).NODE_ENV = 'production';
      process.env.STRICT_ENV_MODE = 'true';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      const { getDbEnvironment } = require('@/lib/db-environment');
      const env = getDbEnvironment();
      
      expect(env.strictMode).toBe(true);
    });

    it('should not enforce strict mode when disabled', () => {
      (process.env as any).NODE_ENV = 'production';
      process.env.STRICT_ENV_MODE = 'false';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      const { getDbEnvironment } = require('@/lib/db-environment');
      const env = getDbEnvironment();
      
      expect(env.strictMode).toBe(false);
    });
  });
});