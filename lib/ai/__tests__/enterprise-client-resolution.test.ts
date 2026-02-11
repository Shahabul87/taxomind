/**
 * Provider Resolution Tests
 *
 * Verifies the provider resolution logic in enterprise-client.ts:
 * 1. Global override takes priority over per-capability
 * 2. Per-capability used when no global set
 * 3. Platform default used when user has no preferences
 * 4. Factory fallback when nothing else set
 * 5. Disabled provider is skipped
 * 6. Maintenance mode throws AIMaintenanceModeError
 * 7. Cross-user isolation (no adapter leakage)
 */

import { aiClient, AIMaintenanceModeError } from '../enterprise-client';
import { db } from '@/lib/db';

// ============================================================================
// MOCKS
// ============================================================================

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock subscription enforcement (allow all by default)
jest.mock('../subscription-enforcement', () => ({
  checkAIAccess: jest.fn().mockResolvedValue({ allowed: true }),
  recordAIUsage: jest.fn().mockResolvedValue(undefined),
}));

// Mock AI registry
const mockIsProviderAvailable = jest.fn();
const mockGetConfiguredProviders = jest.fn();
jest.mock('@/lib/sam/providers/ai-registry', () => ({
  isProviderAvailable: (...args: unknown[]) => mockIsProviderAvailable(...args),
  getConfiguredProviders: () => mockGetConfiguredProviders(),
}));

// Mock AI factory
const mockCreateAIAdapter = jest.fn();
const mockGetUserModelPreferences = jest.fn();
const mockGetModelForProvider = jest.fn();
jest.mock('@/lib/sam/providers/ai-factory', () => ({
  createAIAdapter: (...args: unknown[]) => mockCreateAIAdapter(...args),
  getUserModelPreferences: (...args: unknown[]) => mockGetUserModelPreferences(...args),
  getModelForProvider: (...args: unknown[]) => mockGetModelForProvider(...args),
}));

// Mock circuit breaker
jest.mock('@/lib/sam/utils/error-handler', () => ({
  CircuitBreaker: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockImplementation((fn: () => unknown) => fn()),
    recordFailure: jest.fn(),
    getState: jest.fn().mockReturnValue('closed'),
    reset: jest.fn(),
  })),
  SAMServiceUnavailableError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'SAMServiceUnavailableError';
    }
  },
}));

// DB mock — use the global mock from jest.setup.js via jest.mock('@/lib/db').
// Do NOT call jest.mock('@/lib/db') here — that triggers auto-mock and loses the setup mock.
const dbAny = db as Record<string, Record<string, jest.Mock>>;
const mockPlatformFindUnique = dbAny.platformAISettings.findUnique;
const mockFindUnique = dbAny.userAIPreferences.findUnique;

// ============================================================================
// HELPERS
// ============================================================================

/** Default platform settings — all providers enabled, deepseek default */
function makePlatformSettings(overrides?: Record<string, unknown>) {
  return {
    defaultProvider: 'deepseek',
    fallbackProvider: 'anthropic',
    anthropicEnabled: true,
    deepseekEnabled: true,
    openaiEnabled: true,
    geminiEnabled: false,
    mistralEnabled: false,
    allowUserProviderSelection: true,
    allowUserModelSelection: true,
    defaultAnthropicModel: 'claude-sonnet-4-5-20250929',
    defaultDeepseekModel: 'deepseek-chat',
    defaultOpenaiModel: 'gpt-4o',
    defaultGeminiModel: 'gemini-pro',
    defaultMistralModel: 'mistral-large',
    maintenanceMode: false,
    maintenanceMessage: null,
    ...overrides,
  };
}

/** Default user preferences — all null (uses platform defaults) */
function makeUserPrefs(overrides?: Record<string, unknown>) {
  return {
    preferredGlobalProvider: null,
    preferredChatProvider: null,
    preferredCourseProvider: null,
    preferredAnalysisProvider: null,
    preferredCodeProvider: null,
    preferredSkillRoadmapProvider: null,
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('Enterprise AI Client - Provider Resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: all providers available
    mockIsProviderAvailable.mockImplementation((provider: string) =>
      ['anthropic', 'deepseek', 'openai'].includes(provider)
    );

    // Default platform settings
    mockPlatformFindUnique.mockResolvedValue(makePlatformSettings());

    // Default: no user preferences
    mockFindUnique.mockResolvedValue(null);

    // Default: configured providers
    mockGetConfiguredProviders.mockReturnValue([
      { name: 'DeepSeek', id: 'deepseek' },
      { name: 'Anthropic', id: 'anthropic' },
      { name: 'OpenAI', id: 'openai' },
    ]);

    // Clear ALL caches between tests (platform settings + user prefs + adapters + breakers)
    aiClient.invalidateCaches();
  });

  // -------------------------------------------------------------------------
  // 1. Global override takes priority over per-capability
  // -------------------------------------------------------------------------
  it('global provider overrides per-capability preference', async () => {
    mockFindUnique.mockResolvedValue(
      makeUserPrefs({
        preferredGlobalProvider: 'deepseek',
        preferredChatProvider: 'anthropic',
      })
    );

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    expect(resolved).toBe('deepseek');
  });

  it('global provider overrides per-capability for course capability', async () => {
    mockFindUnique.mockResolvedValue(
      makeUserPrefs({
        preferredGlobalProvider: 'openai',
        preferredCourseProvider: 'anthropic',
      })
    );

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
      // capability is passed through options in the real code
    });

    expect(resolved).toBe('openai');
  });

  // -------------------------------------------------------------------------
  // 2. Per-capability used when no global set
  // -------------------------------------------------------------------------
  it('per-capability preference used when global is null', async () => {
    mockFindUnique.mockResolvedValue(
      makeUserPrefs({
        preferredGlobalProvider: null,
        preferredChatProvider: 'anthropic',
      })
    );

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    expect(resolved).toBe('anthropic');
  });

  // -------------------------------------------------------------------------
  // 3. Platform default used when user has no preferences (null fields)
  // -------------------------------------------------------------------------
  it('platform default used when all user prefs are null', async () => {
    // User has a preferences record but all provider fields are null
    mockFindUnique.mockResolvedValue(makeUserPrefs());
    mockPlatformFindUnique.mockResolvedValue(makePlatformSettings({ defaultProvider: 'deepseek' }));

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    expect(resolved).toBe('deepseek');
  });

  it('platform default used when user has no preferences record', async () => {
    // No UserAIPreferences record at all
    mockFindUnique.mockResolvedValue(null);
    mockPlatformFindUnique.mockResolvedValue(makePlatformSettings({ defaultProvider: 'openai' }));

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    expect(resolved).toBe('openai');
  });

  // -------------------------------------------------------------------------
  // 4. Factory fallback when nothing else set
  // -------------------------------------------------------------------------
  it('factory default used when no user prefs and no platform default', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockPlatformFindUnique.mockResolvedValue(makePlatformSettings({ defaultProvider: null }));

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    // Factory order: deepseek > anthropic > openai
    expect(resolved).toBe('deepseek');
  });

  it('factory fallback skips unavailable providers', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockPlatformFindUnique.mockResolvedValue(makePlatformSettings({ defaultProvider: null }));
    // DeepSeek not available
    mockIsProviderAvailable.mockImplementation((provider: string) =>
      ['anthropic', 'openai'].includes(provider)
    );

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    expect(resolved).toBe('anthropic');
  });

  // -------------------------------------------------------------------------
  // 5. Disabled provider is skipped
  // -------------------------------------------------------------------------
  it('disabled provider is skipped, falls to next available', async () => {
    mockFindUnique.mockResolvedValue(
      makeUserPrefs({
        preferredChatProvider: 'anthropic',
      })
    );
    // Platform has disabled anthropic
    mockPlatformFindUnique.mockResolvedValue(
      makePlatformSettings({
        anthropicEnabled: false,
        defaultProvider: 'deepseek',
      })
    );

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    // Anthropic is disabled by platform, so it falls to platform default
    expect(resolved).toBe('deepseek');
  });

  it('disabled global provider falls to per-capability', async () => {
    mockFindUnique.mockResolvedValue(
      makeUserPrefs({
        preferredGlobalProvider: 'anthropic',
        preferredChatProvider: 'deepseek',
      })
    );
    mockPlatformFindUnique.mockResolvedValue(
      makePlatformSettings({ anthropicEnabled: false })
    );

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    // Global (anthropic) disabled → falls to per-capability (deepseek)
    expect(resolved).toBe('deepseek');
  });

  // -------------------------------------------------------------------------
  // 6. Maintenance mode throws AIMaintenanceModeError
  // -------------------------------------------------------------------------
  it('throws AIMaintenanceModeError when maintenance mode is on', async () => {
    mockPlatformFindUnique.mockResolvedValue(
      makePlatformSettings({
        maintenanceMode: true,
        maintenanceMessage: 'System under maintenance',
      })
    );

    await expect(
      aiClient.getResolvedProvider({ userId: 'user-1' })
    ).rejects.toThrow(AIMaintenanceModeError);
  });

  it('maintenance error includes custom message', async () => {
    mockPlatformFindUnique.mockResolvedValue(
      makePlatformSettings({
        maintenanceMode: true,
        maintenanceMessage: 'Back in 30 minutes',
      })
    );

    try {
      await aiClient.getResolvedProvider({ userId: 'user-1' });
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(AIMaintenanceModeError);
      expect((error as AIMaintenanceModeError).maintenanceMessage).toBe('Back in 30 minutes');
    }
  });

  // -------------------------------------------------------------------------
  // 7. Cross-user isolation
  // -------------------------------------------------------------------------
  it('resolves different providers for different users', async () => {
    // User A prefers deepseek globally
    // User B prefers anthropic globally
    mockFindUnique
      .mockResolvedValueOnce(
        makeUserPrefs({ preferredGlobalProvider: 'deepseek' })
      )
      .mockResolvedValueOnce(
        makeUserPrefs({ preferredGlobalProvider: 'anthropic' })
      );

    const resolvedA = await aiClient.getResolvedProvider({ userId: 'user-a' });
    const resolvedB = await aiClient.getResolvedProvider({ userId: 'user-b' });

    expect(resolvedA).toBe('deepseek');
    expect(resolvedB).toBe('anthropic');
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  it('explicit provider override bypasses all preference resolution', async () => {
    mockFindUnique.mockResolvedValue(
      makeUserPrefs({ preferredGlobalProvider: 'deepseek' })
    );

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
      provider: 'openai',
    });

    expect(resolved).toBe('openai');
  });

  it('user provider selection disabled falls through to platform default', async () => {
    mockFindUnique.mockResolvedValue(
      makeUserPrefs({ preferredGlobalProvider: 'anthropic' })
    );
    mockPlatformFindUnique.mockResolvedValue(
      makePlatformSettings({
        allowUserProviderSelection: false,
        defaultProvider: 'deepseek',
      })
    );

    const resolved = await aiClient.getResolvedProvider({
      userId: 'user-1',
    });

    // User selection disabled → skip user prefs → use platform default
    expect(resolved).toBe('deepseek');
  });
});
