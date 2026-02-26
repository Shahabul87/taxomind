/**
 * Tests for @sam-ai/integration - Adapter Factory
 * Covers: AdapterFactory (register, get, lazy init, custom adapters, lifecycle)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdapterFactory, createAdapterFactory } from '../registry/adapter-factory';
import { CapabilityRegistry } from '../registry/capability-registry';
import { ProfileBuilder } from '../detection/profile-builder';
import type { IntegrationProfile } from '../types/profile';

function createTestProfile(): IntegrationProfile {
  return new ProfileBuilder('test', 'Test')
    .prisma()
    .nextAuth()
    .anthropic()
    .build();
}

describe('AdapterFactory', () => {
  let factory: AdapterFactory;
  let profile: IntegrationProfile;

  beforeEach(() => {
    profile = createTestProfile();
    factory = new AdapterFactory(profile);
  });

  describe('profile and registry', () => {
    it('returns profile', () => {
      expect(factory.getProfile()).toBe(profile);
    });

    it('returns capability registry', () => {
      expect(factory.getRegistry()).toBeInstanceOf(CapabilityRegistry);
    });

    it('updates profile and registry', () => {
      factory.updateProfile({ version: '2.0.0' });
      expect(factory.getProfile().version).toBe('2.0.0');
    });
  });

  describe('database adapter', () => {
    it('throws when not registered', async () => {
      await expect(factory.getDatabaseAdapter()).rejects.toThrow('not registered');
    });

    it('registers and retrieves database adapter', async () => {
      const mockAdapter = { query: vi.fn() };
      factory.registerDatabaseAdapter(() => mockAdapter as never);

      const adapter = await factory.getDatabaseAdapter();
      expect(adapter).toBe(mockAdapter);
    });

    it('caches adapter instance (singleton)', async () => {
      const providerFn = vi.fn(() => ({ query: vi.fn() } as never));
      factory.registerDatabaseAdapter(providerFn);

      await factory.getDatabaseAdapter();
      await factory.getDatabaseAdapter();

      expect(providerFn).toHaveBeenCalledTimes(1);
    });

    it('reports registration status', () => {
      expect(factory.hasDatabaseAdapter()).toBe(false);
      factory.registerDatabaseAdapter(() => ({} as never));
      expect(factory.hasDatabaseAdapter()).toBe(true);
    });
  });

  describe('auth adapter', () => {
    it('throws when not registered', async () => {
      await expect(factory.getAuthAdapter()).rejects.toThrow('not registered');
    });

    it('registers and retrieves auth adapter', async () => {
      const mockAdapter = { authenticate: vi.fn() };
      factory.registerAuthAdapter(() => mockAdapter as never);

      const adapter = await factory.getAuthAdapter();
      expect(adapter).toBe(mockAdapter);
    });

    it('reports registration status', () => {
      expect(factory.hasAuthAdapter()).toBe(false);
      factory.registerAuthAdapter(() => ({} as never));
      expect(factory.hasAuthAdapter()).toBe(true);
    });
  });

  describe('AI adapter', () => {
    it('throws when not registered', async () => {
      await expect(factory.getAIAdapter()).rejects.toThrow('not registered');
    });

    it('registers and retrieves AI adapter', async () => {
      const mockAdapter = { chat: vi.fn() };
      factory.registerAIAdapter(() => mockAdapter as never);

      const adapter = await factory.getAIAdapter();
      expect(adapter).toBe(mockAdapter);
    });
  });

  describe('vector adapter', () => {
    it('throws when not registered', async () => {
      await expect(factory.getVectorAdapter()).rejects.toThrow('not registered');
    });

    it('registers and retrieves vector adapter', async () => {
      const mockAdapter = { search: vi.fn() };
      factory.registerVectorAdapter(() => mockAdapter as never);

      const adapter = await factory.getVectorAdapter();
      expect(adapter).toBe(mockAdapter);
    });
  });

  describe('custom adapters', () => {
    it('registers and retrieves custom adapter', async () => {
      const mockAdapter = { doSomething: vi.fn() };
      factory.registerCustomAdapter('my-adapter', () => mockAdapter as never);

      const adapter = await factory.getCustomAdapter<typeof mockAdapter>('my-adapter');
      expect(adapter).toBe(mockAdapter);
    });

    it('throws for unregistered custom adapter', async () => {
      await expect(factory.getCustomAdapter('unknown')).rejects.toThrow('not registered');
    });

    it('reports custom adapter registration', () => {
      expect(factory.hasCustomAdapter('my-adapter')).toBe(false);
      factory.registerCustomAdapter('my-adapter', () => ({} as never));
      expect(factory.hasCustomAdapter('my-adapter')).toBe(true);
    });

    it('lists custom adapters', () => {
      factory.registerCustomAdapter('a', () => ({} as never));
      factory.registerCustomAdapter('b', () => ({} as never));

      expect(factory.listCustomAdapters()).toEqual(['a', 'b']);
    });
  });

  describe('lifecycle', () => {
    it('disposes all adapter instances', async () => {
      factory.registerDatabaseAdapter(() => ({ query: vi.fn() } as never));
      await factory.getDatabaseAdapter(); // Create instance

      await factory.disposeAll();

      // Next call should create a new instance
      const providerFn = vi.fn(() => ({ query: vi.fn() } as never));
      factory.registerDatabaseAdapter(providerFn);
      await factory.getDatabaseAdapter();
      expect(providerFn).toHaveBeenCalledTimes(1);
    });

    it('returns summary of registered adapters', () => {
      factory.registerDatabaseAdapter(() => ({} as never));
      factory.registerAuthAdapter(() => ({} as never));
      factory.registerCustomAdapter('x', () => ({} as never));

      const summary = factory.getSummary();
      expect(summary.database).toBe(true);
      expect(summary.auth).toBe(true);
      expect(summary.ai).toBe(false);
      expect(summary.custom).toEqual(['x']);
    });
  });

  describe('chaining', () => {
    it('supports fluent registration', () => {
      const result = factory
        .registerDatabaseAdapter(() => ({} as never))
        .registerAuthAdapter(() => ({} as never))
        .registerAIAdapter(() => ({} as never));

      expect(result).toBe(factory);
    });
  });

  describe('factory function', () => {
    it('creates an AdapterFactory', () => {
      const f = createAdapterFactory(profile);
      expect(f).toBeInstanceOf(AdapterFactory);
    });
  });
});
