/**
 * Tests for SAM Configuration Factory
 * Source: lib/adapters/sam-config-factory.ts
 */

jest.mock('@/lib/ai/user-scoped-adapter', () => ({
  createUserScopedAdapter: jest.fn(() =>
    Promise.resolve({
      name: 'user-scoped',
      version: '1.0.0',
      chat: jest.fn(),
      isConfigured: () => true,
      getModel: () => 'test-model',
    })
  ),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  getSAMAdapterSystem: jest.fn(() =>
    Promise.resolve({
      name: 'system-adapter',
      version: '1.0.0',
      chat: jest.fn(),
      isConfigured: () => true,
      getModel: () => 'system-model',
    })
  ),
}));

import {
  createSAMLogger,
  getDatabaseAdapter,
  getUserScopedSAMConfig,
  getUserScopedSAMConfigOrDefault,
  resetSAMConfig,
} from '@/lib/adapters/sam-config-factory';

import { createUserScopedAdapter } from '@/lib/ai/user-scoped-adapter';
import { getSAMAdapterSystem } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';

describe('SAM Config Factory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSAMConfig();
  });

  // -------------------------------------------------------------------
  // createSAMLogger
  // -------------------------------------------------------------------
  describe('createSAMLogger', () => {
    it('creates logger without prefix', () => {
      const samLogger = createSAMLogger();
      samLogger.info('test message');
      expect(logger.info).toHaveBeenCalledWith('test message');
    });

    it('creates logger with prefix', () => {
      const samLogger = createSAMLogger('[PREFIX]');
      samLogger.warn('something');
      expect(logger.warn).toHaveBeenCalledWith('[PREFIX] something');
    });
  });

  // -------------------------------------------------------------------
  // getDatabaseAdapter
  // -------------------------------------------------------------------
  describe('getDatabaseAdapter', () => {
    it('returns a singleton database adapter', () => {
      const adapter1 = getDatabaseAdapter();
      const adapter2 = getDatabaseAdapter();
      expect(adapter1).toBe(adapter2);
    });

    it('returns an object with database adapter methods', () => {
      const adapter = getDatabaseAdapter();
      expect(adapter).toBeDefined();
      // The adapter should have standard SAMDatabaseAdapter methods
      expect(typeof adapter.findUser).toBe('function');
    });
  });

  // -------------------------------------------------------------------
  // getUserScopedSAMConfig
  // -------------------------------------------------------------------
  describe('getUserScopedSAMConfig', () => {
    it('creates config for analysis capability (default)', async () => {
      const config = await getUserScopedSAMConfig('user-1');
      expect(createUserScopedAdapter).toHaveBeenCalledWith('user-1', 'analysis');
      expect(config).toBeDefined();
      expect(config.ai).toBeDefined();
      expect(config.database).toBeDefined();
    });

    it('creates config for chat capability', async () => {
      await getUserScopedSAMConfig('user-1', 'chat');
      expect(createUserScopedAdapter).toHaveBeenCalledWith('user-1', 'chat');
    });

    it('creates config for course capability', async () => {
      await getUserScopedSAMConfig('user-1', 'course');
      expect(createUserScopedAdapter).toHaveBeenCalledWith('user-1', 'course');
    });

    it('includes cache and logger in the config', async () => {
      const config = await getUserScopedSAMConfig('user-1');
      expect(config.cache).toBeDefined();
      expect(config.logger).toBeDefined();
    });
  });

  // -------------------------------------------------------------------
  // getUserScopedSAMConfigOrDefault
  // -------------------------------------------------------------------
  describe('getUserScopedSAMConfigOrDefault', () => {
    it('returns user-scoped config when userId is provided', async () => {
      const config = await getUserScopedSAMConfigOrDefault('user-1', 'analysis');
      expect(createUserScopedAdapter).toHaveBeenCalledWith('user-1', 'analysis');
      expect(config).toBeDefined();
      expect(config.ai).toBeDefined();
    });

    it('uses system adapter when userId is undefined', async () => {
      const config = await getUserScopedSAMConfigOrDefault(undefined);
      expect(createUserScopedAdapter).not.toHaveBeenCalled();
      expect(getSAMAdapterSystem).toHaveBeenCalled();
      expect(config).toBeDefined();
    });

    it('falls back to system adapter when user-scoped fails', async () => {
      (createUserScopedAdapter as jest.Mock).mockRejectedValueOnce(
        new Error('User pref lookup failed')
      );

      const config = await getUserScopedSAMConfigOrDefault('user-1');
      expect(logger.warn).toHaveBeenCalled();
      expect(getSAMAdapterSystem).toHaveBeenCalled();
      expect(config).toBeDefined();
    });

    it('falls back to build-time config when both fail', async () => {
      (createUserScopedAdapter as jest.Mock).mockRejectedValueOnce(
        new Error('DB down')
      );
      (getSAMAdapterSystem as jest.Mock).mockRejectedValueOnce(
        new Error('System adapter fail')
      );

      const config = await getUserScopedSAMConfigOrDefault('user-1');
      expect(logger.warn).toHaveBeenCalledTimes(2);
      // Build-time fallback still returns a valid config
      expect(config).toBeDefined();
      expect(config.ai).toBeDefined();
    });

    it('handles missing API key in build-time fallback gracefully', async () => {
      (getSAMAdapterSystem as jest.Mock).mockResolvedValue(null);

      const config = await getUserScopedSAMConfigOrDefault(undefined);
      // Should still return a valid config (with real or placeholder adapter)
      expect(config).toBeDefined();
    });
  });

  // -------------------------------------------------------------------
  // resetSAMConfig
  // -------------------------------------------------------------------
  describe('resetSAMConfig', () => {
    it('clears cached instances so next call creates fresh ones', () => {
      const adapter1 = getDatabaseAdapter();
      resetSAMConfig();
      const adapter2 = getDatabaseAdapter();
      // After reset, a new adapter should be created
      expect(adapter1).not.toBe(adapter2);
    });
  });
});
