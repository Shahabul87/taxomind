/**
 * AI Provider Registry Tests
 *
 * Comprehensive test suite for lib/sam/providers/ai-registry.ts
 *
 * Tests the centralized AI provider registry including:
 * - Registry structure and provider metadata
 * - Reasoning model detection
 * - Provider configuration and availability checks
 * - Capability-based provider filtering
 * - Default provider selection with priority ordering
 *
 * Environment strategy: process.env is saved/restored per test to ensure
 * isolation. The module is NOT mocked -- we test the real exported functions
 * against controlled environment state.
 */

import type { AICapability, AIProviderType, ProviderInfo } from '@/lib/sam/providers/ai-registry';
import {
  AI_PROVIDERS,
  isReasoningModel,
  getConfiguredProviders,
  getAllProviders,
  getProvider,
  isProviderAvailable,
  getProvidersWithCapability,
  getDefaultProvider,
} from '@/lib/sam/providers/ai-registry';

// ============================================================================
// Environment Management
// ============================================================================

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  // Clear all provider API keys to start with a clean slate
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GOOGLE_AI_API_KEY;
  delete process.env.MISTRAL_API_KEY;
});

afterAll(() => {
  process.env = originalEnv;
});

// ============================================================================
// Constants used across tests
// ============================================================================

const ALL_PROVIDER_IDS: AIProviderType[] = [
  'anthropic',
  'deepseek',
  'openai',
  'gemini',
  'mistral',
];

const IMPLEMENTED_PROVIDER_IDS: AIProviderType[] = [
  'anthropic',
  'deepseek',
  'openai',
];

const UNIMPLEMENTED_PROVIDER_IDS: AIProviderType[] = [
  'gemini',
  'mistral',
];

const ALL_CAPABILITIES: AICapability[] = [
  'chat',
  'course',
  'analysis',
  'code',
  'skill-roadmap',
];

const ENV_KEY_MAP: Record<AIProviderType, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GOOGLE_AI_API_KEY',
  mistral: 'MISTRAL_API_KEY',
};

/**
 * Helper to set API keys for specified providers.
 */
function setApiKeys(...providerIds: AIProviderType[]): void {
  for (const id of providerIds) {
    process.env[ENV_KEY_MAP[id]] = `test-${id}-api-key`;
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('lib/sam/providers/ai-registry', () => {
  // ==========================================================================
  // 1. AI_PROVIDERS Registry Structure
  // ==========================================================================

  describe('AI_PROVIDERS registry structure', () => {
    it('should contain exactly 5 providers', () => {
      const providerIds = Object.keys(AI_PROVIDERS);
      expect(providerIds).toHaveLength(5);
    });

    it('should contain all expected provider IDs', () => {
      for (const id of ALL_PROVIDER_IDS) {
        expect(AI_PROVIDERS[id]).toBeDefined();
      }
    });

    it('should have required fields on every provider', () => {
      for (const id of ALL_PROVIDER_IDS) {
        const provider = AI_PROVIDERS[id];

        expect(provider.id).toBe(id);
        expect(typeof provider.name).toBe('string');
        expect(provider.name.length).toBeGreaterThan(0);
        expect(typeof provider.description).toBe('string');
        expect(provider.description.length).toBeGreaterThan(0);
        expect(Array.isArray(provider.models)).toBe(true);
        expect(provider.models.length).toBeGreaterThan(0);
        expect(typeof provider.defaultModel).toBe('string');
        expect(provider.models).toContain(provider.defaultModel);
        expect(Array.isArray(provider.capabilities)).toBe(true);
        expect(provider.capabilities.length).toBeGreaterThan(0);
        expect(typeof provider.isConfigured).toBe('function');
        expect(typeof provider.isImplemented).toBe('boolean');
        expect(typeof provider.envKeyName).toBe('string');
        expect(provider.envKeyName.length).toBeGreaterThan(0);
      }
    });

    describe('anthropic provider', () => {
      it('should have correct metadata', () => {
        const p = AI_PROVIDERS.anthropic;
        expect(p.id).toBe('anthropic');
        expect(p.name).toBe('Anthropic Claude');
        expect(p.isImplemented).toBe(true);
        expect(p.envKeyName).toBe('ANTHROPIC_API_KEY');
      });

      it('should support all 5 capabilities', () => {
        expect(AI_PROVIDERS.anthropic.capabilities).toEqual(
          expect.arrayContaining(ALL_CAPABILITIES)
        );
        expect(AI_PROVIDERS.anthropic.capabilities).toHaveLength(5);
      });

      it('should have valid models list', () => {
        expect(AI_PROVIDERS.anthropic.models.length).toBeGreaterThanOrEqual(2);
        expect(AI_PROVIDERS.anthropic.models).toContain(
          AI_PROVIDERS.anthropic.defaultModel
        );
      });

      it('should report configured when env var is set', () => {
        setApiKeys('anthropic');
        expect(AI_PROVIDERS.anthropic.isConfigured()).toBe(true);
      });

      it('should report not configured when env var is absent', () => {
        delete process.env.ANTHROPIC_API_KEY;
        expect(AI_PROVIDERS.anthropic.isConfigured()).toBe(false);
      });
    });

    describe('deepseek provider', () => {
      it('should have correct metadata', () => {
        const p = AI_PROVIDERS.deepseek;
        expect(p.id).toBe('deepseek');
        expect(p.name).toBe('DeepSeek');
        expect(p.isImplemented).toBe(true);
        expect(p.envKeyName).toBe('DEEPSEEK_API_KEY');
        expect(p.defaultModel).toBe('deepseek-chat');
      });

      it('should support all 5 capabilities', () => {
        expect(AI_PROVIDERS.deepseek.capabilities).toEqual(
          expect.arrayContaining(ALL_CAPABILITIES)
        );
        expect(AI_PROVIDERS.deepseek.capabilities).toHaveLength(5);
      });

      it('should include deepseek-reasoner in models', () => {
        expect(AI_PROVIDERS.deepseek.models).toContain('deepseek-reasoner');
      });

      it('should report configured when env var is set', () => {
        setApiKeys('deepseek');
        expect(AI_PROVIDERS.deepseek.isConfigured()).toBe(true);
      });

      it('should report not configured when env var is absent', () => {
        delete process.env.DEEPSEEK_API_KEY;
        expect(AI_PROVIDERS.deepseek.isConfigured()).toBe(false);
      });
    });

    describe('openai provider', () => {
      it('should have correct metadata', () => {
        const p = AI_PROVIDERS.openai;
        expect(p.id).toBe('openai');
        expect(p.name).toBe('OpenAI GPT');
        expect(p.isImplemented).toBe(true);
        expect(p.envKeyName).toBe('OPENAI_API_KEY');
        expect(p.defaultModel).toBe('gpt-4o');
      });

      it('should support all 5 capabilities', () => {
        expect(AI_PROVIDERS.openai.capabilities).toEqual(
          expect.arrayContaining(ALL_CAPABILITIES)
        );
        expect(AI_PROVIDERS.openai.capabilities).toHaveLength(5);
      });

      it('should include reasoning models o1 and o1-mini', () => {
        expect(AI_PROVIDERS.openai.models).toContain('o1');
        expect(AI_PROVIDERS.openai.models).toContain('o1-mini');
      });

      it('should report configured when env var is set', () => {
        setApiKeys('openai');
        expect(AI_PROVIDERS.openai.isConfigured()).toBe(true);
      });
    });

    describe('gemini provider', () => {
      it('should have correct metadata', () => {
        const p = AI_PROVIDERS.gemini;
        expect(p.id).toBe('gemini');
        expect(p.name).toBe('Google Gemini');
        expect(p.isImplemented).toBe(false);
        expect(p.envKeyName).toBe('GOOGLE_AI_API_KEY');
        expect(p.defaultModel).toBe('gemini-pro');
      });

      it('should support chat, course, and analysis capabilities', () => {
        expect(AI_PROVIDERS.gemini.capabilities).toEqual(
          expect.arrayContaining(['chat', 'course', 'analysis'])
        );
        expect(AI_PROVIDERS.gemini.capabilities).toHaveLength(3);
      });

      it('should NOT support code or skill-roadmap capabilities', () => {
        expect(AI_PROVIDERS.gemini.capabilities).not.toContain('code');
        expect(AI_PROVIDERS.gemini.capabilities).not.toContain('skill-roadmap');
      });

      it('should report configured when env var is set', () => {
        setApiKeys('gemini');
        expect(AI_PROVIDERS.gemini.isConfigured()).toBe(true);
      });
    });

    describe('mistral provider', () => {
      it('should have correct metadata', () => {
        const p = AI_PROVIDERS.mistral;
        expect(p.id).toBe('mistral');
        expect(p.name).toBe('Mistral AI');
        expect(p.isImplemented).toBe(false);
        expect(p.envKeyName).toBe('MISTRAL_API_KEY');
        expect(p.defaultModel).toBe('mistral-large');
      });

      it('should support chat, analysis, and code capabilities', () => {
        expect(AI_PROVIDERS.mistral.capabilities).toEqual(
          expect.arrayContaining(['chat', 'analysis', 'code'])
        );
        expect(AI_PROVIDERS.mistral.capabilities).toHaveLength(3);
      });

      it('should NOT support course or skill-roadmap capabilities', () => {
        expect(AI_PROVIDERS.mistral.capabilities).not.toContain('course');
        expect(AI_PROVIDERS.mistral.capabilities).not.toContain('skill-roadmap');
      });

      it('should report configured when env var is set', () => {
        setApiKeys('mistral');
        expect(AI_PROVIDERS.mistral.isConfigured()).toBe(true);
      });
    });

    it('should have empty string env var treated as not configured', () => {
      process.env.ANTHROPIC_API_KEY = '';
      expect(AI_PROVIDERS.anthropic.isConfigured()).toBe(false);
    });
  });

  // ==========================================================================
  // 2. isReasoningModel
  // ==========================================================================

  describe('isReasoningModel', () => {
    const REASONING_MODELS = [
      'deepseek-reasoner',
      'o1',
      'o1-mini',
      'o3',
      'o3-mini',
    ];

    it.each(REASONING_MODELS)(
      'should return true for reasoning model "%s"',
      (modelId) => {
        expect(isReasoningModel(modelId)).toBe(true);
      }
    );

    const NON_REASONING_MODELS = [
      'deepseek-chat',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'claude-sonnet-4-20250514',
      'claude-sonnet-4-5-20250929',
      'gemini-pro',
      'gemini-ultra',
      'mistral-large',
      'codestral',
      'mistral-small',
    ];

    it.each(NON_REASONING_MODELS)(
      'should return false for non-reasoning model "%s"',
      (modelId) => {
        expect(isReasoningModel(modelId)).toBe(false);
      }
    );

    it('should return false for empty string', () => {
      expect(isReasoningModel('')).toBe(false);
    });

    it('should return false for partial matches', () => {
      expect(isReasoningModel('o1-preview')).toBe(false);
      expect(isReasoningModel('deepseek-reasoner-v2')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isReasoningModel('O1')).toBe(false);
      expect(isReasoningModel('O3-MINI')).toBe(false);
      expect(isReasoningModel('Deepseek-Reasoner')).toBe(false);
    });
  });

  // ==========================================================================
  // 3. getConfiguredProviders
  // ==========================================================================

  describe('getConfiguredProviders', () => {
    it('should return empty array when no providers are configured', () => {
      const result = getConfiguredProviders();
      expect(result).toEqual([]);
    });

    it('should return only configured AND implemented providers', () => {
      setApiKeys('anthropic', 'deepseek');
      const result = getConfiguredProviders();

      expect(result).toHaveLength(2);
      const ids = result.map((p) => p.id);
      expect(ids).toContain('anthropic');
      expect(ids).toContain('deepseek');
    });

    it('should exclude configured but unimplemented providers', () => {
      setApiKeys('gemini', 'mistral');
      const result = getConfiguredProviders();

      expect(result).toHaveLength(0);
    });

    it('should exclude unconfigured but implemented providers', () => {
      // Only anthropic is configured
      setApiKeys('anthropic');
      const result = getConfiguredProviders();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('anthropic');
    });

    it('should return all 3 implemented providers when all are configured', () => {
      setApiKeys('anthropic', 'deepseek', 'openai');
      const result = getConfiguredProviders();

      expect(result).toHaveLength(3);
      const ids = result.map((p) => p.id);
      expect(ids).toContain('anthropic');
      expect(ids).toContain('deepseek');
      expect(ids).toContain('openai');
    });

    it('should return all 3 implemented providers even when unimplemented ones are also configured', () => {
      setApiKeys('anthropic', 'deepseek', 'openai', 'gemini', 'mistral');
      const result = getConfiguredProviders();

      // Only the 3 implemented ones should be returned
      expect(result).toHaveLength(3);
      const ids = result.map((p) => p.id);
      expect(ids).not.toContain('gemini');
      expect(ids).not.toContain('mistral');
    });

    it('should return ProviderInfo objects with correct structure', () => {
      setApiKeys('anthropic');
      const result = getConfiguredProviders();

      expect(result).toHaveLength(1);
      const provider = result[0];
      expect(provider.id).toBe('anthropic');
      expect(provider.name).toBe('Anthropic Claude');
      expect(typeof provider.isConfigured).toBe('function');
      expect(provider.isConfigured()).toBe(true);
      expect(provider.isImplemented).toBe(true);
    });
  });

  // ==========================================================================
  // 4. getAllProviders
  // ==========================================================================

  describe('getAllProviders', () => {
    it('should return all 5 providers regardless of configuration', () => {
      const result = getAllProviders();
      expect(result).toHaveLength(5);
    });

    it('should include all provider IDs', () => {
      const ids = getAllProviders().map((p) => p.id);
      for (const expected of ALL_PROVIDER_IDS) {
        expect(ids).toContain(expected);
      }
    });

    it('should return all 5 providers even when none are configured', () => {
      const result = getAllProviders();
      expect(result).toHaveLength(5);
    });

    it('should return the same providers when all are configured', () => {
      setApiKeys('anthropic', 'deepseek', 'openai', 'gemini', 'mistral');
      const result = getAllProviders();
      expect(result).toHaveLength(5);
    });

    it('should return ProviderInfo objects', () => {
      const result = getAllProviders();
      for (const provider of result) {
        expect(typeof provider.id).toBe('string');
        expect(typeof provider.name).toBe('string');
        expect(Array.isArray(provider.capabilities)).toBe(true);
        expect(typeof provider.isImplemented).toBe('boolean');
      }
    });
  });

  // ==========================================================================
  // 5. getProvider
  // ==========================================================================

  describe('getProvider', () => {
    it.each(ALL_PROVIDER_IDS)(
      'should return provider info for valid ID "%s"',
      (id) => {
        const result = getProvider(id);
        expect(result).toBeDefined();
        expect(result?.id).toBe(id);
      }
    );

    it('should return the correct provider object reference', () => {
      const result = getProvider('anthropic');
      expect(result).toBe(AI_PROVIDERS.anthropic);
    });

    it('should return undefined for invalid provider ID', () => {
      const result = getProvider('invalid' as AIProviderType);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = getProvider('' as AIProviderType);
      expect(result).toBeUndefined();
    });

    it('should return provider with correct capabilities', () => {
      const anthropic = getProvider('anthropic');
      expect(anthropic?.capabilities).toHaveLength(5);

      const gemini = getProvider('gemini');
      expect(gemini?.capabilities).toHaveLength(3);
    });
  });

  // ==========================================================================
  // 6. isProviderAvailable
  // ==========================================================================

  describe('isProviderAvailable', () => {
    it('should return true for implemented provider with API key set', () => {
      setApiKeys('anthropic');
      expect(isProviderAvailable('anthropic')).toBe(true);
    });

    it('should return false for implemented provider without API key', () => {
      expect(isProviderAvailable('anthropic')).toBe(false);
    });

    it('should return false for unimplemented provider even with API key', () => {
      setApiKeys('gemini');
      expect(isProviderAvailable('gemini')).toBe(false);
    });

    it('should return false for unimplemented provider without API key', () => {
      expect(isProviderAvailable('mistral')).toBe(false);
    });

    it.each(IMPLEMENTED_PROVIDER_IDS)(
      'should return true for implemented provider "%s" when configured',
      (id) => {
        setApiKeys(id);
        expect(isProviderAvailable(id)).toBe(true);
      }
    );

    it.each(UNIMPLEMENTED_PROVIDER_IDS)(
      'should return false for unimplemented provider "%s" even when configured',
      (id) => {
        setApiKeys(id);
        expect(isProviderAvailable(id)).toBe(false);
      }
    );

    it('should return false for unknown provider ID', () => {
      expect(isProviderAvailable('unknown' as AIProviderType)).toBe(false);
    });

    it('should reflect dynamic env changes', () => {
      expect(isProviderAvailable('deepseek')).toBe(false);

      setApiKeys('deepseek');
      expect(isProviderAvailable('deepseek')).toBe(true);

      delete process.env.DEEPSEEK_API_KEY;
      expect(isProviderAvailable('deepseek')).toBe(false);
    });
  });

  // ==========================================================================
  // 7. getProvidersWithCapability
  // ==========================================================================

  describe('getProvidersWithCapability', () => {
    describe('when no providers are configured', () => {
      it('should return empty array for any capability', () => {
        for (const capability of ALL_CAPABILITIES) {
          expect(getProvidersWithCapability(capability)).toEqual([]);
        }
      });
    });

    describe('when all implemented providers are configured', () => {
      beforeEach(() => {
        setApiKeys('anthropic', 'deepseek', 'openai');
      });

      it('should return all 3 implemented providers for "chat" capability', () => {
        const result = getProvidersWithCapability('chat');
        expect(result).toHaveLength(3);
        const ids = result.map((p) => p.id);
        expect(ids).toContain('anthropic');
        expect(ids).toContain('deepseek');
        expect(ids).toContain('openai');
      });

      it('should return all 3 implemented providers for "course" capability', () => {
        const result = getProvidersWithCapability('course');
        expect(result).toHaveLength(3);
      });

      it('should return all 3 implemented providers for "analysis" capability', () => {
        const result = getProvidersWithCapability('analysis');
        expect(result).toHaveLength(3);
      });

      it('should return all 3 implemented providers for "code" capability', () => {
        const result = getProvidersWithCapability('code');
        expect(result).toHaveLength(3);
      });

      it('should return all 3 implemented providers for "skill-roadmap" capability', () => {
        const result = getProvidersWithCapability('skill-roadmap');
        expect(result).toHaveLength(3);
      });
    });

    it('should exclude unimplemented providers even when configured and capable', () => {
      // gemini has chat capability and is configured, but NOT implemented
      setApiKeys('gemini', 'anthropic');
      const result = getProvidersWithCapability('chat');

      const ids = result.map((p) => p.id);
      expect(ids).toContain('anthropic');
      expect(ids).not.toContain('gemini');
    });

    it('should exclude unconfigured providers', () => {
      // Only anthropic is configured
      setApiKeys('anthropic');
      const result = getProvidersWithCapability('chat');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('anthropic');
    });

    it('should only return providers that have the requested capability', () => {
      // Configure all providers
      setApiKeys('anthropic', 'deepseek', 'openai', 'gemini', 'mistral');

      // skill-roadmap is only on anthropic, deepseek, openai (all implemented)
      // gemini and mistral don't support it AND are not implemented
      const result = getProvidersWithCapability('skill-roadmap');
      const ids = result.map((p) => p.id);

      expect(ids).toContain('anthropic');
      expect(ids).toContain('deepseek');
      expect(ids).toContain('openai');
      expect(ids).not.toContain('gemini');
      expect(ids).not.toContain('mistral');
    });

    it('should return ProviderInfo objects with the requested capability', () => {
      setApiKeys('anthropic');
      const result = getProvidersWithCapability('analysis');

      for (const provider of result) {
        expect(provider.capabilities).toContain('analysis');
      }
    });
  });

  // ==========================================================================
  // 8. getDefaultProvider
  // ==========================================================================

  describe('getDefaultProvider', () => {
    it('should return undefined when no providers are configured', () => {
      const result = getDefaultProvider();
      expect(result).toBeUndefined();
    });

    it('should return deepseek as highest priority when configured', () => {
      setApiKeys('deepseek', 'anthropic', 'openai');
      const result = getDefaultProvider();

      expect(result).toBeDefined();
      expect(result?.id).toBe('deepseek');
    });

    it('should return anthropic when deepseek is not configured', () => {
      setApiKeys('anthropic', 'openai');
      const result = getDefaultProvider();

      expect(result).toBeDefined();
      expect(result?.id).toBe('anthropic');
    });

    it('should return openai when deepseek and anthropic are not configured', () => {
      setApiKeys('openai');
      const result = getDefaultProvider();

      expect(result).toBeDefined();
      expect(result?.id).toBe('openai');
    });

    it('should prefer deepseek over anthropic', () => {
      setApiKeys('anthropic', 'deepseek');
      const result = getDefaultProvider();

      expect(result?.id).toBe('deepseek');
    });

    it('should prefer anthropic over openai', () => {
      setApiKeys('anthropic', 'openai');
      const result = getDefaultProvider();

      expect(result?.id).toBe('anthropic');
    });

    it('should prefer deepseek over openai', () => {
      setApiKeys('deepseek', 'openai');
      const result = getDefaultProvider();

      expect(result?.id).toBe('deepseek');
    });

    it('should return undefined when only unimplemented providers are configured', () => {
      setApiKeys('gemini', 'mistral');
      const result = getDefaultProvider();

      // gemini and mistral are not implemented, so getConfiguredProviders()
      // returns empty and the fallback also returns undefined
      expect(result).toBeUndefined();
    });

    it('should fallback to first configured provider when priority providers are unavailable', () => {
      // All three priority providers (deepseek, anthropic, openai) are checked
      // explicitly. If none match, it falls back to getConfiguredProviders()[0].
      // Since only openai is configured in this test, it should return openai
      // via the explicit check (not the fallback).
      setApiKeys('openai');
      const result = getDefaultProvider();

      expect(result).toBeDefined();
      expect(result?.id).toBe('openai');
    });

    it('should return a fully valid ProviderInfo object', () => {
      setApiKeys('deepseek');
      const result = getDefaultProvider();

      expect(result).toBeDefined();
      expect(result?.id).toBe('deepseek');
      expect(result?.name).toBe('DeepSeek');
      expect(result?.isImplemented).toBe(true);
      expect(result?.isConfigured()).toBe(true);
      expect(Array.isArray(result?.capabilities)).toBe(true);
    });

    it('should reflect environment changes dynamically', () => {
      // Start with deepseek configured
      setApiKeys('deepseek');
      expect(getDefaultProvider()?.id).toBe('deepseek');

      // Remove deepseek, add anthropic
      delete process.env.DEEPSEEK_API_KEY;
      setApiKeys('anthropic');
      expect(getDefaultProvider()?.id).toBe('anthropic');

      // Remove anthropic, add openai
      delete process.env.ANTHROPIC_API_KEY;
      setApiKeys('openai');
      expect(getDefaultProvider()?.id).toBe('openai');

      // Remove all
      delete process.env.OPENAI_API_KEY;
      expect(getDefaultProvider()).toBeUndefined();
    });
  });

  // ==========================================================================
  // 9. Cross-cutting / Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle all providers configured simultaneously', () => {
      setApiKeys('anthropic', 'deepseek', 'openai', 'gemini', 'mistral');

      // All providers return from getAllProviders
      expect(getAllProviders()).toHaveLength(5);

      // Only implemented ones return from getConfiguredProviders
      expect(getConfiguredProviders()).toHaveLength(3);

      // Default should be deepseek (highest priority)
      expect(getDefaultProvider()?.id).toBe('deepseek');
    });

    it('should handle environment with empty string API keys', () => {
      process.env.ANTHROPIC_API_KEY = '';
      process.env.DEEPSEEK_API_KEY = '';
      process.env.OPENAI_API_KEY = '';

      expect(getConfiguredProviders()).toHaveLength(0);
      expect(getDefaultProvider()).toBeUndefined();
      expect(isProviderAvailable('anthropic')).toBe(false);
    });

    it('should distinguish between configured and available', () => {
      // gemini is configured but NOT available (not implemented)
      setApiKeys('gemini');

      expect(AI_PROVIDERS.gemini.isConfigured()).toBe(true);
      expect(isProviderAvailable('gemini')).toBe(false);
    });

    it('should have consistent isConfigured behavior across all providers', () => {
      for (const id of ALL_PROVIDER_IDS) {
        const provider = AI_PROVIDERS[id];

        // Without key
        delete process.env[ENV_KEY_MAP[id]];
        expect(provider.isConfigured()).toBe(false);

        // With key
        process.env[ENV_KEY_MAP[id]] = 'test-key';
        expect(provider.isConfigured()).toBe(true);

        // Cleanup
        delete process.env[ENV_KEY_MAP[id]];
      }
    });

    it('should have correct envKeyName mapping for each provider', () => {
      expect(AI_PROVIDERS.anthropic.envKeyName).toBe('ANTHROPIC_API_KEY');
      expect(AI_PROVIDERS.deepseek.envKeyName).toBe('DEEPSEEK_API_KEY');
      expect(AI_PROVIDERS.openai.envKeyName).toBe('OPENAI_API_KEY');
      expect(AI_PROVIDERS.gemini.envKeyName).toBe('GOOGLE_AI_API_KEY');
      expect(AI_PROVIDERS.mistral.envKeyName).toBe('MISTRAL_API_KEY');
    });

    it('should have all implemented providers support all 5 capabilities', () => {
      for (const id of IMPLEMENTED_PROVIDER_IDS) {
        const provider = AI_PROVIDERS[id];
        expect(provider.capabilities).toHaveLength(5);
        for (const cap of ALL_CAPABILITIES) {
          expect(provider.capabilities).toContain(cap);
        }
      }
    });

    it('should have unimplemented providers support a subset of capabilities', () => {
      for (const id of UNIMPLEMENTED_PROVIDER_IDS) {
        const provider = AI_PROVIDERS[id];
        expect(provider.capabilities.length).toBeLessThan(5);
        expect(provider.capabilities.length).toBeGreaterThan(0);
      }
    });
  });
});
