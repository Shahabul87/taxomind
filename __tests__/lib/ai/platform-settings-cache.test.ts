/**
 * Tests for Platform AI Settings Cache
 * Source: lib/ai/platform-settings-cache.ts
 *
 * Covers: getCachedPlatformAISettings, invalidateSharedPlatformCache,
 *         PLATFORM_AI_DEFAULTS
 * - Cache hit returns cached settings
 * - Cache miss queries database
 * - TTL expiration triggers refresh
 * - Default settings when database row is null
 * - Table-not-exist graceful fallback
 * - General query failure fallback
 * - Cache invalidation
 * - Defaults export correctness
 */

// We need to control the module-level state so we re-import per test group.
// To avoid the Redis subscription side-effect at import time, mock ioredis
// and @/lib/redis BEFORE the module loads.

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    subscribe: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    connect: jest.fn(),
  }));
});

// @/lib/db, @/lib/logger, @/lib/redis are globally mocked

import { db } from '@/lib/db';

const mockFindUnique = db.platformAISettings.findUnique as jest.Mock;

// ---------------------------------------------------------------------------
// getCachedPlatformAISettings
// ---------------------------------------------------------------------------

describe('getCachedPlatformAISettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the module cache so the `cached` variable resets between groups.
    // This is needed because the module has file-level state.
    jest.resetModules();
  });

  it('returns database row merged with defaults on cache miss', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'default',
      freeMonthlyLimit: 100,
      maintenanceMode: true,
      maintenanceMessage: 'Down for upgrade',
    });

    // Re-import to get a fresh module with empty cache
    const { getCachedPlatformAISettings } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    const settings = await getCachedPlatformAISettings();

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 'default' } });
    expect(settings.freeMonthlyLimit).toBe(100);
    expect(settings.maintenanceMode).toBe(true);
    expect(settings.maintenanceMessage).toBe('Down for upgrade');
    // Other fields should fall back to defaults
    expect(settings.anthropicEnabled).toBe(true);
    expect(settings.deepseekEnabled).toBe(true);
  });

  it('returns cached settings on second call within TTL', async () => {
    mockFindUnique.mockResolvedValue({ id: 'default' });

    const { getCachedPlatformAISettings } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    const first = await getCachedPlatformAISettings();
    const second = await getCachedPlatformAISettings();

    // Should only query once
    expect(mockFindUnique).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  it('returns PLATFORM_AI_DEFAULTS when database row is null', async () => {
    mockFindUnique.mockResolvedValue(null);

    const { getCachedPlatformAISettings, PLATFORM_AI_DEFAULTS } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    const settings = await getCachedPlatformAISettings();

    expect(settings.freeMonthlyLimit).toBe(PLATFORM_AI_DEFAULTS.freeMonthlyLimit);
    expect(settings.starterMonthlyLimit).toBe(PLATFORM_AI_DEFAULTS.starterMonthlyLimit);
    expect(settings.maintenanceMode).toBe(false);
    expect(settings.defaultProvider).toBeNull();
  });

  it('returns defaults when table does not exist', async () => {
    mockFindUnique.mockRejectedValue(
      new Error('The table does not exist in the current database'),
    );

    const { getCachedPlatformAISettings, PLATFORM_AI_DEFAULTS } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    const settings = await getCachedPlatformAISettings();

    expect(settings).toEqual(PLATFORM_AI_DEFAULTS);
  });

  it('returns defaults when relation does not exist', async () => {
    mockFindUnique.mockRejectedValue(
      new Error('relation "PlatformAISettings" does not exist'),
    );

    const { getCachedPlatformAISettings } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    const settings = await getCachedPlatformAISettings();

    expect(settings.freeMonthlyLimit).toBe(50);
  });

  it('returns defaults on general query failure', async () => {
    mockFindUnique.mockRejectedValue(new Error('Connection refused'));

    const { getCachedPlatformAISettings } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    const settings = await getCachedPlatformAISettings();

    // Should not throw, and should return defaults
    expect(settings.freeMonthlyLimit).toBe(50);
    expect(settings.maintenanceMode).toBe(false);
  });

  it('merges partial row with defaults', async () => {
    // Simulate a row missing optional pricing fields (pre-migration)
    mockFindUnique.mockResolvedValue({
      id: 'default',
      anthropicEnabled: false,
      defaultProvider: 'openai',
      // pricing fields are undefined (not yet migrated)
    });

    const { getCachedPlatformAISettings, PLATFORM_AI_DEFAULTS } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    const settings = await getCachedPlatformAISettings();

    expect(settings.anthropicEnabled).toBe(false);
    expect(settings.defaultProvider).toBe('openai');
    // Missing fields should fall back to defaults
    expect(settings.anthropicInputPrice).toBe(PLATFORM_AI_DEFAULTS.anthropicInputPrice);
  });
});

// ---------------------------------------------------------------------------
// invalidateSharedPlatformCache
// ---------------------------------------------------------------------------

describe('invalidateSharedPlatformCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('clears cached settings so next call fetches fresh', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'default',
      maintenanceMode: false,
    });

    const { getCachedPlatformAISettings, invalidateSharedPlatformCache } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    // Populate cache
    await getCachedPlatformAISettings();
    expect(mockFindUnique).toHaveBeenCalledTimes(1);

    // Now change the mock return
    mockFindUnique.mockResolvedValue({
      id: 'default',
      maintenanceMode: true,
    });

    // Invalidate
    invalidateSharedPlatformCache();

    // Next call should query again
    const settings = await getCachedPlatformAISettings();
    expect(mockFindUnique).toHaveBeenCalledTimes(2);
    expect(settings.maintenanceMode).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PLATFORM_AI_DEFAULTS
// ---------------------------------------------------------------------------

describe('PLATFORM_AI_DEFAULTS', () => {
  it('has correct tier limits', async () => {
    const { PLATFORM_AI_DEFAULTS } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    expect(PLATFORM_AI_DEFAULTS.freeMonthlyLimit).toBe(50);
    expect(PLATFORM_AI_DEFAULTS.starterMonthlyLimit).toBe(500);
    expect(PLATFORM_AI_DEFAULTS.proMonthlyLimit).toBe(2000);
    expect(PLATFORM_AI_DEFAULTS.enterpriseMonthlyLimit).toBe(10000);
    expect(PLATFORM_AI_DEFAULTS.freeDailyChatLimit).toBe(10);
    expect(PLATFORM_AI_DEFAULTS.starterDailyChatLimit).toBe(100);
    expect(PLATFORM_AI_DEFAULTS.proDailyChatLimit).toBe(1000);
    expect(PLATFORM_AI_DEFAULTS.enterpriseDailyChatLimit).toBe(10000);
  });

  it('has maintenance mode disabled by default', async () => {
    const { PLATFORM_AI_DEFAULTS } = await import(
      '@/lib/ai/platform-settings-cache'
    );

    expect(PLATFORM_AI_DEFAULTS.maintenanceMode).toBe(false);
    expect(PLATFORM_AI_DEFAULTS.maintenanceMessage).toBeNull();
  });
});
