/**
 * Tests for lib/db-environment.ts
 *
 * Covers environment configuration resolution, safe DB operation gating,
 * environment validation, and destructive-operation permission checks.
 *
 * Phase 1.3 - Database Core Tests
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  getEnvironmentConfig,
  safeDBOperation,
  devLog,
  validateEnvironment,
  getDbEnvironment,
  canPerformDestructiveOperation,
} from '@/lib/db-environment';
import { logger } from '@/lib/logger';

const mockedLogger = logger as jest.Mocked<typeof logger>;

// Store original env to restore after each test
const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  // Create a shallow copy so mutations do not leak between tests
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

// ---------------------------------------------------------------------------
// getEnvironmentConfig
// ---------------------------------------------------------------------------
describe('getEnvironmentConfig', () => {
  describe('environment detection', () => {
    it('returns isDevelopment true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_ENV;

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isStaging).toBe(false);
    });

    it('returns isProduction true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.APP_ENV;

      const config = getEnvironmentConfig();

      expect(config.isProduction).toBe(true);
      expect(config.isDevelopment).toBe(false);
      expect(config.isStaging).toBe(false);
    });

    it('returns isStaging true when APP_ENV is staging regardless of NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_ENV = 'staging';

      const config = getEnvironmentConfig();

      expect(config.isStaging).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.isDevelopment).toBe(false);
    });

    it('defaults to development when neither NODE_ENV nor APP_ENV is set', () => {
      delete process.env.NODE_ENV;
      delete process.env.APP_ENV;

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(true);
    });
  });

  describe('database configuration', () => {
    it('allows reset only in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_ENV;
      expect(getEnvironmentConfig().database.canReset).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(getEnvironmentConfig().database.canReset).toBe(false);

      process.env.NODE_ENV = 'test';
      process.env.APP_ENV = 'staging';
      expect(getEnvironmentConfig().database.canReset).toBe(false);
    });

    it('allows seeding in dev and staging but not production', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_ENV;
      expect(getEnvironmentConfig().database.canSeed).toBe(true);

      process.env.APP_ENV = 'staging';
      expect(getEnvironmentConfig().database.canSeed).toBe(true);

      delete process.env.APP_ENV;
      process.env.NODE_ENV = 'production';
      expect(getEnvironmentConfig().database.canSeed).toBe(false);
    });

    it('allows drop migrations only in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_ENV;
      expect(getEnvironmentConfig().database.migrations.allowDrop).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(getEnvironmentConfig().database.migrations.allowDrop).toBe(false);
    });

    it('auto-runs migrations only in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_ENV;
      expect(getEnvironmentConfig().database.migrations.autoRun).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(getEnvironmentConfig().database.migrations.autoRun).toBe(false);
    });
  });

  describe('email configuration', () => {
    it('uses console provider in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_ENV;

      const config = getEnvironmentConfig();

      expect(config.email.provider).toBe('console');
      expect(config.email.logToConsole).toBe(true);
    });

    it('uses resend provider in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.APP_ENV;

      const config = getEnvironmentConfig();

      expect(config.email.provider).toBe('resend');
      expect(config.email.logToConsole).toBe(false);
    });
  });

  describe('feature flags', () => {
    it('enables realPayments only in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.APP_ENV;
      expect(getEnvironmentConfig().features.realPayments).toBe(true);

      process.env.NODE_ENV = 'development';
      expect(getEnvironmentConfig().features.realPayments).toBe(false);
    });

    it('enables debugMode only in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_ENV;
      expect(getEnvironmentConfig().features.debugMode).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(getEnvironmentConfig().features.debugMode).toBe(false);
    });

    it('disables analytics in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.APP_ENV;
      expect(getEnvironmentConfig().features.analytics).toBe(false);

      process.env.NODE_ENV = 'production';
      expect(getEnvironmentConfig().features.analytics).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// safeDBOperation
// ---------------------------------------------------------------------------
describe('safeDBOperation', () => {
  it('executes read operations in any environment', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    const mockOp = jest.fn().mockResolvedValue({ id: '1' });
    const result = await safeDBOperation(mockOp, 'read');

    expect(mockOp).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: '1' });
  });

  it('executes write operations in any environment', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    const mockOp = jest.fn().mockResolvedValue({ created: true });
    const result = await safeDBOperation(mockOp, 'write');

    expect(mockOp).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ created: true });
  });

  it('throws error for destructive operations in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    const mockOp = jest.fn().mockResolvedValue(undefined);

    await expect(safeDBOperation(mockOp, 'destructive')).rejects.toThrow(
      'Destructive database operations are not allowed in production'
    );
    expect(mockOp).not.toHaveBeenCalled();
  });

  it('allows destructive operations in development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    const mockOp = jest.fn().mockResolvedValue('dropped');
    const result = await safeDBOperation(mockOp, 'destructive');

    expect(mockOp).toHaveBeenCalledTimes(1);
    expect(result).toBe('dropped');
  });

  it('logs a warning for destructive operations in development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    const mockOp = jest.fn().mockResolvedValue(undefined);
    await safeDBOperation(mockOp, 'destructive');

    expect(mockedLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('destructive operation')
    );
  });

  it('defaults operationType to read when not specified', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    const mockOp = jest.fn().mockResolvedValue('data');
    const result = await safeDBOperation(mockOp);

    expect(result).toBe('data');
    expect(mockOp).toHaveBeenCalledTimes(1);
  });

  it('propagates errors from the underlying operation', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    const dbError = new Error('Connection refused');
    const mockOp = jest.fn().mockRejectedValue(dbError);

    await expect(safeDBOperation(mockOp, 'read')).rejects.toThrow('Connection refused');
  });
});

// ---------------------------------------------------------------------------
// devLog
// ---------------------------------------------------------------------------
describe('devLog', () => {
  it('logs messages in development environment', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    devLog('test message', { detail: 42 });

    expect(mockedLogger.debug).toHaveBeenCalledWith('test message', { detail: 42 });
  });

  it('does not log messages in production environment', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    devLog('should not appear');

    expect(mockedLogger.debug).not.toHaveBeenCalled();
  });

  it('works without optional data parameter', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    devLog('message only');

    expect(mockedLogger.debug).toHaveBeenCalledWith('message only', undefined);
  });
});

// ---------------------------------------------------------------------------
// validateEnvironment
// ---------------------------------------------------------------------------
describe('validateEnvironment', () => {
  const setRequiredEnvVars = () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5433/taxomind_db';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.AUTH_SECRET = 'test-secret-key-for-auth';
  };

  it('throws if DATABASE_URL is missing', () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.AUTH_SECRET = 'secret';
    delete process.env.DATABASE_URL;

    expect(() => validateEnvironment()).toThrow('DATABASE_URL');
  });

  it('throws if AUTH_SECRET is missing', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5433/test';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    delete process.env.AUTH_SECRET;

    expect(() => validateEnvironment()).toThrow('AUTH_SECRET');
  });

  it('throws if NEXTAUTH_URL is missing', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5433/test';
    process.env.AUTH_SECRET = 'secret';
    delete process.env.NEXTAUTH_URL;

    expect(() => validateEnvironment()).toThrow('NEXTAUTH_URL');
  });

  it('lists all missing variables in the error message', () => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.AUTH_SECRET;

    expect(() => validateEnvironment()).toThrow(
      /DATABASE_URL.*NEXTAUTH_URL.*AUTH_SECRET/
    );
  });

  it('warns when using railway database URL in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;
    process.env.DATABASE_URL = 'postgresql://user:pass@railway.app:5432/db';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.AUTH_SECRET = 'secret';

    validateEnvironment();

    expect(mockedLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('production database')
    );
  });

  it('warns when using postgres.railway.internal in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;
    process.env.DATABASE_URL = 'postgresql://user:pass@postgres.railway.internal:5432/db';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.AUTH_SECRET = 'secret';

    validateEnvironment();

    expect(mockedLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('production database')
    );
  });

  it('does not warn for localhost DATABASE_URL in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;
    setRequiredEnvVars();

    validateEnvironment();

    // Should not have the specific production-database warning
    const warnCalls = mockedLogger.warn.mock.calls.map((c) => c[0]);
    const hasProductionWarning = warnCalls.some(
      (msg: string) => typeof msg === 'string' && msg.includes('production database')
    );
    expect(hasProductionWarning).toBe(false);
  });

  it('does not throw when all required variables are present', () => {
    setRequiredEnvVars();
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    expect(() => validateEnvironment()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getDbEnvironment
// ---------------------------------------------------------------------------
describe('getDbEnvironment', () => {
  it('returns environment string as development when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    const env = getDbEnvironment();

    expect(env.environment).toBe('development');
  });

  it('returns environment string as production when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    const env = getDbEnvironment();

    expect(env.environment).toBe('production');
  });

  it('returns environment string as staging when APP_ENV is staging', () => {
    process.env.APP_ENV = 'staging';

    const env = getDbEnvironment();

    expect(env.environment).toBe('staging');
  });

  it('includes strictMode flag from STRICT_ENV_MODE env var', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;
    process.env.STRICT_ENV_MODE = 'true';

    expect(getDbEnvironment().strictMode).toBe(true);

    process.env.STRICT_ENV_MODE = 'false';
    expect(getDbEnvironment().strictMode).toBe(false);
  });

  it('sets strictMode to false when STRICT_ENV_MODE is not set', () => {
    delete process.env.STRICT_ENV_MODE;

    expect(getDbEnvironment().strictMode).toBe(false);
  });

  it('spreads all config properties from getEnvironmentConfig', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    const env = getDbEnvironment();

    expect(env).toHaveProperty('isDevelopment');
    expect(env).toHaveProperty('isProduction');
    expect(env).toHaveProperty('isStaging');
    expect(env).toHaveProperty('database');
    expect(env).toHaveProperty('email');
    expect(env).toHaveProperty('features');
  });
});

// ---------------------------------------------------------------------------
// canPerformDestructiveOperation
// ---------------------------------------------------------------------------
describe('canPerformDestructiveOperation', () => {
  it('returns true in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    expect(canPerformDestructiveOperation('DROP TABLE users')).toBe(true);
  });

  it('returns false in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    expect(canPerformDestructiveOperation('TRUNCATE courses')).toBe(false);
  });

  it('returns false in staging', () => {
    process.env.APP_ENV = 'staging';

    expect(canPerformDestructiveOperation('DELETE FROM posts')).toBe(false);
  });

  it('logs a debug message when allowing operation in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ENV;

    canPerformDestructiveOperation('DROP INDEX idx_test');

    expect(mockedLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('DROP INDEX idx_test')
    );
  });

  it('logs a warning when blocking operation outside development', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.APP_ENV;

    canPerformDestructiveOperation('TRUNCATE users');

    expect(mockedLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('TRUNCATE users')
    );
  });
});
