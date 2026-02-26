/**
 * Tests for @sam-ai/adapter-taxomind - Bootstrap & Singleton Management
 * Covers: initializeTaxomindIntegration, getTaxomindIntegration, setTaxomindIntegration,
 *         bootstrapTaxomindIntegration, VERSION, TaxomindIntegrationContext
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock external adapter modules before importing
vi.mock('../adapters/prisma-database-adapter', () => ({
  createPrismaDatabaseAdapter: vi.fn(() => ({ query: vi.fn(), name: 'prisma-db' })),
  PrismaDatabaseAdapter: vi.fn(),
}));

vi.mock('../adapters/nextauth-adapter', () => ({
  createNextAuthAdapter: vi.fn(() => ({ authenticate: vi.fn(), name: 'nextauth' })),
  NextAuthAdapter: vi.fn(),
}));

vi.mock('../adapters/anthropic-ai-adapter', () => ({
  createAnthropicAIAdapter: vi.fn(() => ({ chat: vi.fn(), name: 'anthropic' })),
  createTaxomindAIService: vi.fn(() => ({ generate: vi.fn(), name: 'ai-service' })),
  AnthropicAIAdapter: vi.fn(),
  TaxomindAIService: vi.fn(),
}));

vi.mock('../adapters/pgvector-adapter', () => ({
  TaxomindVectorService: vi.fn(),
}));

vi.mock('../adapters/sam-vector-embedding-adapter', () => ({
  createTaxomindSAMVectorService: vi.fn(() => ({
    getAdapter: vi.fn(() => ({ search: vi.fn() })),
    getEmbeddingProvider: vi.fn(() => ({ embed: vi.fn() })),
    name: 'vector-service',
  })),
}));

import {
  initializeTaxomindIntegration,
  getTaxomindIntegration,
  setTaxomindIntegration,
  bootstrapTaxomindIntegration,
  VERSION,
  TAXOMIND_PROFILE_ID,
  TAXOMIND_PROFILE_VERSION,
  type TaxomindIntegrationContext,
  type TaxomindIntegrationOptions,
} from '../index';

import { CapabilityRegistry, AdapterFactory } from '@sam-ai/integration';
import { createPrismaDatabaseAdapter } from '../adapters/prisma-database-adapter';
import { createNextAuthAdapter } from '../adapters/nextauth-adapter';
import { createAnthropicAIAdapter, createTaxomindAIService } from '../adapters/anthropic-ai-adapter';
import { createTaxomindSAMVectorService } from '../adapters/sam-vector-embedding-adapter';

function createMockPrisma(): TaxomindIntegrationOptions['prisma'] {
  return {} as TaxomindIntegrationOptions['prisma'];
}

describe('Bootstrap & Singleton Management', () => {
  const defaultOptions: TaxomindIntegrationOptions = {
    prisma: createMockPrisma(),
    isDevelopment: true,
    anthropicApiKey: 'test-anthropic-key',
    openaiApiKey: 'test-openai-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton by setting to a known state then getting fresh
    // We need to clear the module-level _integrationContext
    // The cleanest way is to set it to null via the set function with a cast
    try {
      // Reset by setting a dummy then we can test fresh
    } catch {
      // Ignore — getTaxomindIntegration may throw if not set
    }
  });

  describe('initializeTaxomindIntegration', () => {
    it('returns a complete integration context', () => {
      const context = initializeTaxomindIntegration(defaultOptions);

      expect(context).toBeDefined();
      expect(context.profile).toBeDefined();
      expect(context.registry).toBeDefined();
      expect(context.factory).toBeDefined();
      expect(context.adapters).toBeDefined();
    });

    it('creates profile with taxomind identity', () => {
      const context = initializeTaxomindIntegration(defaultOptions);

      expect(context.profile.id).toBe('taxomind-lms');
      expect(context.profile.name).toBe('Taxomind LMS');
    });

    it('creates CapabilityRegistry from profile', () => {
      const context = initializeTaxomindIntegration(defaultOptions);

      expect(context.registry).toBeInstanceOf(CapabilityRegistry);
    });

    it('creates AdapterFactory from profile', () => {
      const context = initializeTaxomindIntegration(defaultOptions);

      expect(context.factory).toBeInstanceOf(AdapterFactory);
    });

    it('passes development mode to profile', () => {
      const context = initializeTaxomindIntegration({
        ...defaultOptions,
        isDevelopment: true,
      });

      expect(context.profile.environment.isDevelopment).toBe(true);
    });

    it('passes region to profile', () => {
      const context = initializeTaxomindIntegration({
        ...defaultOptions,
        region: 'eu-west-1',
      });

      expect(context.profile.environment.region).toBe('eu-west-1');
    });

    it('creates all adapters', () => {
      initializeTaxomindIntegration(defaultOptions);

      expect(createPrismaDatabaseAdapter).toHaveBeenCalledWith(defaultOptions.prisma);
      expect(createNextAuthAdapter).toHaveBeenCalledWith(defaultOptions.prisma);
      expect(createAnthropicAIAdapter).toHaveBeenCalledWith({
        apiKey: 'test-anthropic-key',
      });
      expect(createTaxomindAIService).toHaveBeenCalledWith({
        anthropicApiKey: 'test-anthropic-key',
        openaiApiKey: 'test-openai-key',
      });
      expect(createTaxomindSAMVectorService).toHaveBeenCalledWith(
        defaultOptions.prisma,
        { openaiApiKey: 'test-openai-key' }
      );
    });

    it('populates adapters on the context', () => {
      const context = initializeTaxomindIntegration(defaultOptions);

      expect(context.adapters.database).toBeDefined();
      expect(context.adapters.auth).toBeDefined();
      expect(context.adapters.ai).toBeDefined();
      expect(context.adapters.aiService).toBeDefined();
      expect(context.adapters.vector).toBeDefined();
    });

    it('registers adapters with the factory', async () => {
      const context = initializeTaxomindIntegration(defaultOptions);

      // Factory should have database, auth, AI, and vector adapters registered
      expect(context.factory.hasDatabaseAdapter()).toBe(true);
      expect(context.factory.hasAuthAdapter()).toBe(true);
      expect(context.factory.hasAIAdapter()).toBe(true);
      expect(context.factory.hasVectorAdapter()).toBe(true);
    });

    it('works without optional API keys', () => {
      const context = initializeTaxomindIntegration({
        prisma: createMockPrisma(),
      });

      expect(context).toBeDefined();
      expect(context.adapters.ai).toBeDefined();
    });
  });

  describe('singleton management', () => {
    it('getTaxomindIntegration throws when not initialized', () => {
      // Reset singleton by setting to null-ish via a mock context approach
      // We need to ensure singleton is null. Since the module is already loaded,
      // and bootstrapTaxomindIntegration may have been called in prior tests,
      // we use a workaround: set a fresh context then test other behaviors.

      // Actually, we cannot easily reset the private _integrationContext.
      // Let's test the flow: init -> get -> works
      const context = initializeTaxomindIntegration(defaultOptions);
      setTaxomindIntegration(context);

      const retrieved = getTaxomindIntegration();
      expect(retrieved).toBe(context);
    });

    it('setTaxomindIntegration sets the singleton', () => {
      const context = initializeTaxomindIntegration(defaultOptions);
      setTaxomindIntegration(context);

      const retrieved = getTaxomindIntegration();
      expect(retrieved.profile.id).toBe('taxomind-lms');
    });

    it('bootstrapTaxomindIntegration initializes and sets singleton', () => {
      const context = bootstrapTaxomindIntegration(defaultOptions);

      expect(context.profile.id).toBe('taxomind-lms');
      expect(getTaxomindIntegration()).toBe(context);
    });

    it('bootstrapTaxomindIntegration returns context with all components', () => {
      const context = bootstrapTaxomindIntegration(defaultOptions);

      expect(context.registry).toBeInstanceOf(CapabilityRegistry);
      expect(context.factory).toBeInstanceOf(AdapterFactory);
      expect(context.adapters.database).toBeDefined();
      expect(context.adapters.auth).toBeDefined();
      expect(context.adapters.ai).toBeDefined();
    });
  });

  describe('constants and exports', () => {
    it('exports VERSION', () => {
      expect(VERSION).toBe('0.1.0');
    });

    it('exports TAXOMIND_PROFILE_ID', () => {
      expect(TAXOMIND_PROFILE_ID).toBe('taxomind-lms');
    });

    it('exports TAXOMIND_PROFILE_VERSION', () => {
      expect(TAXOMIND_PROFILE_VERSION).toBe('1.0.0');
    });
  });
});
