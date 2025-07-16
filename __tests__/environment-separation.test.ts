import { getEnvironment, canPerformDestructiveOperation } from '@/lib/db-environment';

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
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5433/dev_db';
      
      expect(getEnvironment()).toBe('development');
    });

    it('should correctly identify production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      expect(getEnvironment()).toBe('production');
    });

    it('should correctly identify staging environment', () => {
      process.env.NODE_ENV = 'staging';
      process.env.DATABASE_URL = 'postgresql://staging-postgres.railway.internal:5432/staging_db';
      
      expect(getEnvironment()).toBe('staging');
    });
  });

  describe('Destructive Operation Protection', () => {
    it('should allow destructive operations in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5433/dev_db';
      
      expect(canPerformDestructiveOperation('DROP TABLE')).toBe(true);
    });

    it('should block destructive operations in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      expect(canPerformDestructiveOperation('DROP TABLE')).toBe(false);
    });

    it('should block destructive operations in staging', () => {
      process.env.NODE_ENV = 'staging';
      process.env.DATABASE_URL = 'postgresql://staging-postgres.railway.internal:5432/staging_db';
      
      expect(canPerformDestructiveOperation('DROP TABLE')).toBe(false);
    });
  });

  describe('Cross-Environment Protection', () => {
    it('should warn when using production database in development', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      // Import module to trigger warning
      jest.isolateModules(() => {
        require('@/lib/db-environment');
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: Using production database in development environment!')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not warn when using local database in development', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5433/dev_db';
      
      jest.isolateModules(() => {
        require('@/lib/db-environment');
      });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Strict Mode Enforcement', () => {
    it('should enforce strict mode when enabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.STRICT_ENV_MODE = 'true';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      const { getDbEnvironment } = require('@/lib/db-environment');
      const env = getDbEnvironment();
      
      expect(env.strictMode).toBe(true);
    });

    it('should not enforce strict mode when disabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.STRICT_ENV_MODE = 'false';
      process.env.DATABASE_URL = 'postgresql://postgres.railway.internal:5432/railway';
      
      const { getDbEnvironment } = require('@/lib/db-environment');
      const env = getDbEnvironment();
      
      expect(env.strictMode).toBe(false);
    });
  });
});