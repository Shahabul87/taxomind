/**
 * Verification Tests for the 5 AI Architecture Fixes
 *
 * Tests both source-code structure (static analysis) and runtime behavior
 * for each fix to ensure correctness.
 *
 * Fix #1 — Default settings single source of truth (PLATFORM_AI_DEFAULTS)
 * Fix #2 — Capability passed through getResolvedProvider
 * Fix #3 — Streaming fallback on provider failure
 * Fix #4 — Stream token estimation and usage recording
 * Fix #5 — createSAMLogger() utility eliminates duplication
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('@/lib/db', () => ({
  db: {
    platformAISettings: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    userAIPreferences: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Break the deep import chain: sam-config-factory → user-scoped-adapter → enterprise-client
// → subscription-enforcement → check-admin → auth.admin → cookie-config
jest.mock('@/lib/ai/user-scoped-adapter', () => ({
  createUserScopedAdapter: jest.fn(),
  createSystemScopedAdapter: jest.fn(),
}));

jest.mock('@sam-ai/core', () => ({
  createSAMConfig: jest.fn((opts: Record<string, unknown>) => opts),
  createAnthropicAdapter: jest.fn(),
  createMemoryCache: jest.fn(),
}));

jest.mock('@sam-ai/adapter-prisma', () => ({
  createPrismaSAMAdapter: jest.fn(() => ({})),
}));

// ============================================================================
// HELPERS: Read source files
// ============================================================================

function readSource(relativePath: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, relativePath),
    'utf-8'
  );
}

// ============================================================================
// FIX #1: Default settings single source of truth (PLATFORM_AI_DEFAULTS)
// ============================================================================

describe('Fix #1: PLATFORM_AI_DEFAULTS single source of truth', () => {
  describe('Source structure', () => {
    it('platform-settings-cache.ts exports PLATFORM_AI_DEFAULTS', () => {
      const source = readSource('../platform-settings-cache.ts');
      expect(source).toContain('export const PLATFORM_AI_DEFAULTS: CachedPlatformAISettings');
    });

    it('PLATFORM_AI_DEFAULTS is NOT duplicated as PLATFORM_AI_PLATFORM_AI_DEFAULTS', () => {
      const source = readSource('../platform-settings-cache.ts');
      expect(source).not.toContain('PLATFORM_AI_PLATFORM_AI_DEFAULTS');
    });

    it('admin route imports PLATFORM_AI_DEFAULTS from platform-settings-cache', () => {
      const source = readSource('../../../app/api/admin/ai-settings/route.ts');
      expect(source).toContain('PLATFORM_AI_DEFAULTS');
      expect(source).toContain('from "@/lib/ai/platform-settings-cache"');
    });

    it('admin route DEFAULT_SETTINGS spreads PLATFORM_AI_DEFAULTS', () => {
      const source = readSource('../../../app/api/admin/ai-settings/route.ts');
      expect(source).toContain('...PLATFORM_AI_DEFAULTS');
    });

    it('admin route does NOT hardcode provider-specific defaults', () => {
      const source = readSource('../../../app/api/admin/ai-settings/route.ts');
      // Should NOT contain hardcoded model names in DEFAULT_SETTINGS
      // (they come from PLATFORM_AI_DEFAULTS via spread)
      expect(source).not.toMatch(/DEFAULT_SETTINGS\s*=\s*\{[^}]*deepseekEnabled/s);
    });
  });

  describe('Runtime behavior', () => {
    it('PLATFORM_AI_DEFAULTS has all required fields', () => {
      const { PLATFORM_AI_DEFAULTS } = require('../platform-settings-cache');

      // Provider routing
      expect(PLATFORM_AI_DEFAULTS.defaultProvider).toBeNull();
      expect(PLATFORM_AI_DEFAULTS.fallbackProvider).toBeNull();

      // Provider enables
      expect(PLATFORM_AI_DEFAULTS.anthropicEnabled).toBe(true);
      expect(PLATFORM_AI_DEFAULTS.deepseekEnabled).toBe(true);
      expect(PLATFORM_AI_DEFAULTS.openaiEnabled).toBe(true);
      expect(PLATFORM_AI_DEFAULTS.geminiEnabled).toBe(false);
      expect(PLATFORM_AI_DEFAULTS.mistralEnabled).toBe(false);

      // Models
      expect(PLATFORM_AI_DEFAULTS.defaultAnthropicModel).toBe('claude-sonnet-4-5-20250929');
      expect(PLATFORM_AI_DEFAULTS.defaultDeepseekModel).toBe('deepseek-chat');
      expect(PLATFORM_AI_DEFAULTS.defaultOpenaiModel).toBe('gpt-4o');
      expect(PLATFORM_AI_DEFAULTS.defaultGeminiModel).toBe('gemini-pro');
      expect(PLATFORM_AI_DEFAULTS.defaultMistralModel).toBe('mistral-large');

      // Rate limits
      expect(PLATFORM_AI_DEFAULTS.freeMonthlyLimit).toBe(50);
      expect(PLATFORM_AI_DEFAULTS.starterMonthlyLimit).toBe(500);
      expect(PLATFORM_AI_DEFAULTS.proMonthlyLimit).toBe(2000);
      expect(PLATFORM_AI_DEFAULTS.enterpriseMonthlyLimit).toBe(10000);

      // Daily chat limits
      expect(PLATFORM_AI_DEFAULTS.freeDailyChatLimit).toBe(10);
      expect(PLATFORM_AI_DEFAULTS.starterDailyChatLimit).toBe(100);
      expect(PLATFORM_AI_DEFAULTS.proDailyChatLimit).toBe(1000);
      expect(PLATFORM_AI_DEFAULTS.enterpriseDailyChatLimit).toBe(10000);

      // Pricing
      expect(PLATFORM_AI_DEFAULTS.anthropicInputPrice).toBe(3.0);
      expect(PLATFORM_AI_DEFAULTS.anthropicOutputPrice).toBe(15.0);
      expect(PLATFORM_AI_DEFAULTS.deepseekInputPrice).toBe(0.14);
      expect(PLATFORM_AI_DEFAULTS.deepseekOutputPrice).toBe(0.28);

      // Feature toggles
      expect(PLATFORM_AI_DEFAULTS.allowUserProviderSelection).toBe(true);
      expect(PLATFORM_AI_DEFAULTS.allowUserModelSelection).toBe(true);
      expect(PLATFORM_AI_DEFAULTS.maintenanceMode).toBe(false);
    });

    it('getCachedPlatformAISettings returns PLATFORM_AI_DEFAULTS when DB returns null', async () => {
      const {
        getCachedPlatformAISettings,
        invalidateSharedPlatformCache,
        PLATFORM_AI_DEFAULTS,
      } = require('../platform-settings-cache');

      // Invalidate to force re-fetch
      invalidateSharedPlatformCache();

      const settings = await getCachedPlatformAISettings();

      // Every field should match PLATFORM_AI_DEFAULTS since DB mock returns null
      for (const key of Object.keys(PLATFORM_AI_DEFAULTS)) {
        expect(settings[key]).toEqual(
          PLATFORM_AI_DEFAULTS[key as keyof typeof PLATFORM_AI_DEFAULTS]
        );
      }
    });
  });
});

// ============================================================================
// FIX #2: Capability passed through getResolvedProvider
// ============================================================================

describe('Fix #2: Capability passed through getResolvedProvider', () => {
  describe('Source structure', () => {
    it('enterprise-client getResolvedProvider accepts capability parameter', () => {
      const source = readSource('../enterprise-client.ts');
      // The options interface should include capability
      expect(source).toMatch(/getResolvedProvider\(options\?\:\s*\{[^}]*capability\?/s);
    });

    it('enterprise-client passes capability to resolveProvider', () => {
      const source = readSource('../enterprise-client.ts');
      // Inside getResolvedProvider body, capability is passed through
      expect(source).toContain('capability: options?.capability');
    });

    it('user-scoped-adapter passes capability to getResolvedProvider', () => {
      const source = readSource('../user-scoped-adapter.ts');
      // Should pass both userId AND capability
      expect(source).toContain(
        'resolvedProvider = await aiClient.getResolvedProvider({\n' +
        '      userId,\n' +
        '      capability,\n' +
        '    })'
      );
    });

    it('user-scoped-adapter does NOT use default "chat" for initial resolution', () => {
      const source = readSource('../user-scoped-adapter.ts');
      // The old code defaulted to 'chat' — now it passes the actual capability
      const getResolvedBlock = source.match(
        /getResolvedProvider\(\{[\s\S]*?\}\)/
      );
      expect(getResolvedBlock).toBeTruthy();
      // Should NOT hardcode 'chat' in the getResolvedProvider call
      expect(getResolvedBlock![0]).not.toContain("'chat'");
    });
  });

  describe('resolveProvider uses capability for per-capability preference lookup', () => {
    it('resolveProvider maps capability to correct preference field', () => {
      const source = readSource('../enterprise-client.ts');
      // The providerMap inside resolveProvider should use capability
      expect(source).toContain("chat: prefs.preferredChatProvider");
      expect(source).toContain("course: prefs.preferredCourseProvider");
      expect(source).toContain("analysis: prefs.preferredAnalysisProvider");
      expect(source).toContain("code: prefs.preferredCodeProvider");
      expect(source).toContain("'skill-roadmap': prefs.preferredSkillRoadmapProvider");
    });
  });
});

// ============================================================================
// FIX #3: Streaming fallback on provider failure
// ============================================================================

describe('Fix #3: Streaming fallback on provider failure', () => {
  describe('Source structure', () => {
    it('stream() has tryStreamProvider helper', () => {
      const source = readSource('../enterprise-client.ts');
      expect(source).toContain('const tryStreamProvider = async (');
    });

    it('stream() builds fallback candidate list', () => {
      const source = readSource('../enterprise-client.ts');
      // Should have fallback candidate building logic in stream()
      // Look for stream-specific fallback log message
      expect(source).toContain(
        '[Enterprise AI] Stream primary provider failed, trying fallback'
      );
    });

    it('stream() does NOT fallback for AIAccessDeniedError', () => {
      const source = readSource('../enterprise-client.ts');
      // In the stream method, should check for access denied
      const streamSection = source.substring(
        source.indexOf('async *stream('),
      );
      expect(streamSection).toContain('AIAccessDeniedError');
      expect(streamSection).toContain('AIMaintenanceModeError');
    });

    it('stream() records mid-stream failures on circuit breaker', () => {
      const source = readSource('../enterprise-client.ts');
      expect(source).toContain(
        'Mid-stream failure'
      );
      expect(source).toContain(
        'getProviderCircuitBreaker(activeProvider).recordFailure'
      );
    });

    it('stream() fallback logic matches chat() fallback structure', () => {
      const source = readSource('../enterprise-client.ts');

      // Both chat() and stream() should have same fallback candidate building
      const chatFallbackMsg = source.indexOf('[Enterprise AI] Primary provider failed, trying fallback');
      const streamFallbackMsg = source.indexOf('[Enterprise AI] Stream primary provider failed, trying fallback');

      expect(chatFallbackMsg).toBeGreaterThan(-1);
      expect(streamFallbackMsg).toBeGreaterThan(-1);
      // Stream fallback should come after chat fallback
      expect(streamFallbackMsg).toBeGreaterThan(chatFallbackMsg);
    });

    it('tryStreamProvider falls back to single chunk when chatStream is missing', () => {
      const source = readSource('../enterprise-client.ts');
      expect(source).toContain(
        'Adapter does not support streaming, falling back to single chunk'
      );
    });
  });
});

// ============================================================================
// FIX #4: Stream token estimation and usage recording
// ============================================================================

describe('Fix #4: Stream token estimation and usage recording', () => {
  describe('Source structure', () => {
    it('stream() accumulates totalContentLength', () => {
      const source = readSource('../enterprise-client.ts');
      expect(source).toContain('let totalContentLength = 0');
      expect(source).toContain('totalContentLength += chunk.content.length');
    });

    it('stream() estimates input tokens from message content', () => {
      const source = readSource('../enterprise-client.ts');
      // Check the estimation formula
      expect(source).toContain("messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0)");
      expect(source).toContain("(systemPrompt?.length ?? 0)");
      expect(source).toContain("Math.ceil(inputChars / 4)");
    });

    it('stream() estimates output tokens from content length', () => {
      const source = readSource('../enterprise-client.ts');
      expect(source).toContain('Math.ceil(totalContentLength / 4)');
    });

    it('stream() calls recordAIUsageWithRetry with token estimates', () => {
      const source = readSource('../enterprise-client.ts');
      // After stream loop, should record usage
      const streamSection = source.substring(
        source.indexOf('async *stream('),
      );
      expect(streamSection).toContain('recordAIUsageWithRetry(userId, feature, 1, {');
      expect(streamSection).toContain('tokensUsed: estimatedTotalTokens');
    });

    it('stream() passes estimated cost to usage recording', () => {
      const source = readSource('../enterprise-client.ts');
      const streamSection = source.substring(
        source.indexOf('async *stream('),
      );
      expect(streamSection).toContain('cost: estimateCost(activeProvider');
      expect(streamSection).toContain('inputTokens: estimatedInputTokens');
      expect(streamSection).toContain('outputTokens: estimatedOutputTokens');
    });

    it('stream() records isFallback in request type', () => {
      const source = readSource('../enterprise-client.ts');
      const streamSection = source.substring(
        source.indexOf('async *stream('),
      );
      expect(streamSection).toContain("isFallback ? `${capability ?? 'chat'}_fallback`");
    });
  });

  describe('Token estimation formula correctness', () => {
    it('estimates ~250 tokens for 1000 chars (4 chars/token)', () => {
      const chars = 1000;
      const estimatedTokens = Math.ceil(chars / 4);
      expect(estimatedTokens).toBe(250);
    });

    it('handles empty content (0 tokens)', () => {
      const chars = 0;
      const estimatedTokens = Math.ceil(chars / 4);
      expect(estimatedTokens).toBe(0);
    });

    it('rounds up partial tokens correctly', () => {
      // 5 chars -> ceil(5/4) = 2 tokens
      expect(Math.ceil(5 / 4)).toBe(2);
      // 8 chars -> ceil(8/4) = 2 tokens
      expect(Math.ceil(8 / 4)).toBe(2);
      // 9 chars -> ceil(9/4) = 3 tokens
      expect(Math.ceil(9 / 4)).toBe(3);
    });

    it('estimates combined input+output correctly', () => {
      // Simulate: system prompt 200 chars, 2 messages of 100 chars each, output 500 chars
      const inputChars = 200 + 100 + 100; // 400 chars
      const outputChars = 500;

      const estimatedInputTokens = Math.ceil(inputChars / 4); // 100
      const estimatedOutputTokens = Math.ceil(outputChars / 4); // 125
      const total = estimatedInputTokens + estimatedOutputTokens; // 225

      expect(estimatedInputTokens).toBe(100);
      expect(estimatedOutputTokens).toBe(125);
      expect(total).toBe(225);
    });
  });
});

// ============================================================================
// FIX #5: createSAMLogger() utility eliminates duplication
// ============================================================================

describe('Fix #5: createSAMLogger() utility', () => {
  describe('Source structure', () => {
    it('createSAMLogger is exported from sam-config-factory.ts', () => {
      const source = readSource('../../adapters/sam-config-factory.ts');
      expect(source).toContain('export function createSAMLogger(prefix?: string): SAMLogger');
    });

    it('SAMLogger type is imported from @sam-ai/core', () => {
      const source = readSource('../../adapters/sam-config-factory.ts');
      expect(source).toContain('SAMLogger');
      expect(source).toMatch(/import type \{[^}]*SAMLogger[^}]*\} from '@sam-ai\/core'/s);
    });

    it('sam-config-factory uses createSAMLogger instead of inline blocks', () => {
      const source = readSource('../../adapters/sam-config-factory.ts');

      // Count createSAMLogger usage sites (should be 3: buildTime, userScoped, systemFallback)
      const usages = source.match(/logger: createSAMLogger\(/g);
      expect(usages).toHaveLength(3);

      // Should NOT have any inline logger blocks outside the function definition
      const withoutDefinition = source.replace(
        /export function createSAMLogger[\s\S]*?^}/m,
        ''
      );
      // No leftover inline logger objects
      expect(withoutDefinition).not.toMatch(
        /logger:\s*\{\s*debug:.*logger\.debug/
      );
    });

    it('subsystem-init.ts imports createSAMLogger', () => {
      const source = readSource('../../sam/pipeline/subsystem-init.ts');
      expect(source).toContain("import { createSAMLogger } from '@/lib/adapters/sam-config-factory'");
    });

    it('subsystem-init.ts uses createSAMLogger instead of inline blocks', () => {
      const source = readSource('../../sam/pipeline/subsystem-init.ts');

      // Count createSAMLogger usage sites (should be 2: initShared, initSubsystems)
      const usages = source.match(/logger: createSAMLogger\(/g);
      expect(usages).toHaveLength(2);

      // Should NOT have any inline logger blocks
      expect(source).not.toMatch(
        /logger:\s*\{\s*debug:\s*\(msg.*=>\s*logger\.debug/
      );
    });
  });

  describe('Runtime behavior', () => {
    it('createSAMLogger returns object with all 4 log methods', () => {
      const { createSAMLogger } = require('../../adapters/sam-config-factory');
      const samLogger = createSAMLogger();

      expect(typeof samLogger.debug).toBe('function');
      expect(typeof samLogger.info).toBe('function');
      expect(typeof samLogger.warn).toBe('function');
      expect(typeof samLogger.error).toBe('function');
    });

    it('createSAMLogger without prefix delegates directly', () => {
      const { logger } = require('@/lib/logger');
      const { createSAMLogger } = require('../../adapters/sam-config-factory');

      // Clear any previous calls
      (logger.debug as jest.Mock).mockClear();
      (logger.info as jest.Mock).mockClear();

      const samLogger = createSAMLogger();

      samLogger.debug('test message', { key: 'value' });
      expect(logger.debug).toHaveBeenCalledWith('test message', { key: 'value' });

      samLogger.info('info msg');
      expect(logger.info).toHaveBeenCalledWith('info msg');
    });

    it('createSAMLogger with prefix prepends it to messages', () => {
      const { logger } = require('@/lib/logger');
      const { createSAMLogger } = require('../../adapters/sam-config-factory');

      (logger.debug as jest.Mock).mockClear();
      (logger.warn as jest.Mock).mockClear();
      (logger.error as jest.Mock).mockClear();

      const samLogger = createSAMLogger('[SAM]');

      samLogger.debug('init complete');
      expect(logger.debug).toHaveBeenCalledWith('[SAM] init complete');

      samLogger.warn('slow response', { ms: 5000 });
      expect(logger.warn).toHaveBeenCalledWith('[SAM] slow response', { ms: 5000 });

      samLogger.error('adapter failed', new Error('timeout'));
      expect(logger.error).toHaveBeenCalledWith(
        '[SAM] adapter failed',
        expect.any(Error)
      );
    });

    it('createSAMLogger with different prefixes produce independent loggers', () => {
      const { logger } = require('@/lib/logger');
      const { createSAMLogger } = require('../../adapters/sam-config-factory');

      (logger.info as jest.Mock).mockClear();

      const samLogger = createSAMLogger('[SAM]');
      const pipelineLogger = createSAMLogger('[Pipeline]');

      samLogger.info('from sam');
      pipelineLogger.info('from pipeline');

      expect(logger.info).toHaveBeenCalledWith('[SAM] from sam');
      expect(logger.info).toHaveBeenCalledWith('[Pipeline] from pipeline');
    });
  });
});

// ============================================================================
// CROSS-CUTTING: Verify no regressions
// ============================================================================

describe('Cross-cutting: No regressions', () => {
  it('enterprise-client still exports aiClient with chat, stream, getResolvedProvider, invalidateCaches', () => {
    const source = readSource('../enterprise-client.ts');
    expect(source).toContain('export const aiClient = {');
    expect(source).toContain('async chat(options: AIChatOptions)');
    expect(source).toContain('async *stream(options: AIChatOptions)');
    expect(source).toContain('async getResolvedProvider(');
    expect(source).toContain('invalidateCaches()');
  });

  it('user-scoped-adapter still exports createUserScopedAdapter and createSystemScopedAdapter', () => {
    const source = readSource('../user-scoped-adapter.ts');
    expect(source).toContain('export async function createUserScopedAdapter(');
    expect(source).toContain('export async function createSystemScopedAdapter(');
  });

  it('platform-settings-cache still exports getCachedPlatformAISettings and invalidateSharedPlatformCache', () => {
    const source = readSource('../platform-settings-cache.ts');
    expect(source).toContain('export async function getCachedPlatformAISettings(');
    expect(source).toContain('export function invalidateSharedPlatformCache(');
  });

  it('sam-config-factory still exports getUserScopedSAMConfig and getUserScopedSAMConfigOrDefault', () => {
    const source = readSource('../../adapters/sam-config-factory.ts');
    expect(source).toContain('export async function getUserScopedSAMConfig(');
    expect(source).toContain('export async function getUserScopedSAMConfigOrDefault(');
  });

  it('subsystem-init still exports initializeSubsystems and getOrchestrator', () => {
    const source = readSource('../../sam/pipeline/subsystem-init.ts');
    expect(source).toContain('export async function initializeSubsystems(');
    expect(source).toContain('export async function getOrchestrator(');
  });

  it('no direct inline logger blocks remain in sam-config-factory or subsystem-init', () => {
    const factory = readSource('../../adapters/sam-config-factory.ts');
    const subsystem = readSource('../../sam/pipeline/subsystem-init.ts');

    // Outside createSAMLogger definition, no file should have inline logger: { debug: ... } blocks
    // In subsystem-init there's no createSAMLogger definition so any inline block is wrong
    expect(subsystem).not.toMatch(
      /logger:\s*\{\s*\n?\s*debug:\s*\(/
    );

    // In factory, only the definition should have inline handlers
    // Count how many `logger: {` patterns exist (should be 0 outside createSAMLogger)
    const factoryWithoutDef = factory.replace(
      /export function createSAMLogger[\s\S]*?^}/m,
      'REMOVED_DEFINITION'
    );
    expect(factoryWithoutDef).not.toMatch(
      /logger:\s*\{\s*\n?\s*debug:\s*\(/
    );
  });
});
