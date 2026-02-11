// INTERNAL: Do not import aiClient directly in routes.
// Use lib/sam/ai-provider.ts instead:
//   import { runSAMChatWithPreference, runSAMChatWithMetadata, getSAMAdapter } from '@/lib/sam/ai-provider';

/**
 * Enterprise AI Client
 *
 * @internal This module is the low-level AI engine. Route code should NOT
 * import from here. Use `lib/sam/ai-provider.ts` as the single entry point.
 *
 * Provider Resolution Order:
 * 1. Explicit provider override (if specified)
 * 2. User preference (if userId provided)
 * 3. Platform default (from PlatformAISettings DB)
 * 4. Factory default (DeepSeek > Anthropic > OpenAI based on configured API keys)
 */

import type { AIAdapter, AIMessage, AIChatStreamChunk } from '@sam-ai/core';
import {
  createAIAdapter,
  getUserModelPreferences,
  getModelForProvider,
  type CreateAdapterOptions,
} from '@/lib/sam/providers/ai-factory';
import {
  type AIProviderType,
  type AICapability,
  isProviderAvailable,
  getConfiguredProviders,
} from '@/lib/sam/providers/ai-registry';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  checkAIAccess,
  recordAIUsage,
  type AIFeatureType,
  type EnforcementResult,
} from './subscription-enforcement';
import {
  CircuitBreaker,
  SAMServiceUnavailableError,
} from '@/lib/sam/utils/error-handler';

// ============================================================================
// TYPES
// ============================================================================

export interface AIChatOptions {
  /** User ID for provider/model preference resolution */
  userId?: string;
  /** System prompt for the AI */
  systemPrompt?: string;
  /** Chat messages */
  messages: AIMessage[];
  /** Maximum tokens in the response (default: 2000) */
  maxTokens?: number;
  /** Temperature for response creativity (default: 0.7) */
  temperature?: number;
  /** Use extended timeout for long operations like course generation (default: false) */
  extended?: boolean;
  /** Explicit provider override - bypasses all preference resolution */
  provider?: AIProviderType;
  /** Capability context for per-task provider resolution (default: 'chat') */
  capability?: AICapability;
}

export interface AIChatResponse {
  /** The generated text content */
  content: string;
  /** The provider that was used */
  provider: string;
  /** The model that was used */
  model: string;
  /** Token usage information from the provider response */
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

/**
 * Error thrown when AI access is denied due to rate limits or subscription restrictions
 */
export class AIAccessDeniedError extends Error {
  public readonly enforcement: EnforcementResult;

  constructor(result: EnforcementResult) {
    super(result.reason ?? 'AI access denied');
    this.name = 'AIAccessDeniedError';
    this.enforcement = result;
  }
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

/**
 * Approximate pricing per 1M tokens (input / output) for each provider.
 *
 * Sources:
 *   Anthropic  — https://www.anthropic.com/pricing  (Claude Sonnet 4.5)
 *   DeepSeek   — https://platform.deepseek.com/api-docs/pricing
 *   OpenAI     — https://openai.com/api/pricing  (GPT-4o)
 *   Google     — https://ai.google.dev/pricing  (Gemini Pro)
 *   Mistral    — https://mistral.ai/products  (Mistral Large)
 *
 * TODO: Move pricing to PlatformAISettings table for admin-controlled updates.
 */
const PRICING_LAST_VERIFIED = new Date('2026-02-09').getTime();
const PRICING_STALENESS_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
let pricingStalenessWarned = false;

const AI_PROVIDER_PRICING: Record<AIProviderType, { input: number; output: number }> = {
  anthropic: { input: 3.0, output: 15.0 },
  deepseek: { input: 0.14, output: 0.28 },
  openai: { input: 2.5, output: 10.0 },
  gemini: { input: 1.25, output: 5.0 },
  mistral: { input: 2.0, output: 6.0 },
};

/**
 * Estimate cost for AI request based on token usage.
 * Prices are per 1M tokens (input/output).
 * Logs a warning once if pricing data is older than 30 days.
 */
function estimateCost(
  provider: AIProviderType,
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
): number | undefined {
  if (!usage?.inputTokens && !usage?.outputTokens && !usage?.totalTokens) return undefined;

  // Warn once if pricing data is stale
  if (!pricingStalenessWarned && Date.now() - PRICING_LAST_VERIFIED > PRICING_STALENESS_THRESHOLD_MS) {
    pricingStalenessWarned = true;
    const daysSinceVerified = Math.floor((Date.now() - PRICING_LAST_VERIFIED) / (24 * 60 * 60 * 1000));
    logger.warn('[Enterprise AI] Provider pricing data is stale — cost estimates may be inaccurate', {
      lastVerified: new Date(PRICING_LAST_VERIFIED).toISOString(),
      daysSinceVerified,
      action: 'Update AI_PROVIDER_PRICING in lib/ai/enterprise-client.ts',
    });
  }

  const prices = AI_PROVIDER_PRICING[provider] ?? { input: 1.0, output: 3.0 };

  // Prefer actual token breakdown from provider response
  if (usage.inputTokens != null && usage.outputTokens != null) {
    return (usage.inputTokens * prices.input + usage.outputTokens * prices.output) / 1_000_000;
  }

  // Fallback: estimate split from totalTokens (30% input / 70% output)
  const inputTokens = usage.inputTokens ?? Math.floor((usage.totalTokens ?? 0) * 0.3);
  const outputTokens = usage.outputTokens ?? Math.floor((usage.totalTokens ?? 0) * 0.7);

  return (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000;
}

// ============================================================================
// PLATFORM SETTINGS CACHE
// ============================================================================

interface PlatformProviderSettings {
  defaultProvider: AIProviderType | null;
  fallbackProvider: AIProviderType | null;
  // Provider enable/disable toggles
  anthropicEnabled: boolean;
  deepseekEnabled: boolean;
  openaiEnabled: boolean;
  geminiEnabled: boolean;
  mistralEnabled: boolean;
  // User control toggles
  allowUserProviderSelection: boolean;
  allowUserModelSelection: boolean;
  // Default models per provider
  defaultAnthropicModel: string;
  defaultDeepseekModel: string;
  defaultOpenaiModel: string;
  defaultGeminiModel: string;
  defaultMistralModel: string;
  // System status
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  fetchedAt: number;
}

let platformSettingsCache: PlatformProviderSettings | null = null;
const PLATFORM_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the platform's default and fallback providers from PlatformAISettings.
 * Cached for 5 minutes to avoid excessive DB queries.
 */
async function getPlatformSettings(): Promise<PlatformProviderSettings> {
  const now = Date.now();

  if (
    platformSettingsCache &&
    now - platformSettingsCache.fetchedAt < PLATFORM_CACHE_TTL_MS
  ) {
    return platformSettingsCache;
  }

  try {
    const settings = await db.platformAISettings.findFirst({
      where: { id: 'default' },
      select: {
        defaultProvider: true,
        fallbackProvider: true,
        anthropicEnabled: true,
        deepseekEnabled: true,
        openaiEnabled: true,
        geminiEnabled: true,
        mistralEnabled: true,
        allowUserProviderSelection: true,
        allowUserModelSelection: true,
        defaultAnthropicModel: true,
        defaultDeepseekModel: true,
        defaultOpenaiModel: true,
        defaultGeminiModel: true,
        defaultMistralModel: true,
        maintenanceMode: true,
        maintenanceMessage: true,
      },
    });

    const result: PlatformProviderSettings = {
      defaultProvider: (settings?.defaultProvider as AIProviderType) ?? null,
      fallbackProvider: (settings?.fallbackProvider as AIProviderType) ?? null,
      anthropicEnabled: settings?.anthropicEnabled ?? true,
      deepseekEnabled: settings?.deepseekEnabled ?? true,
      openaiEnabled: settings?.openaiEnabled ?? true,
      geminiEnabled: settings?.geminiEnabled ?? false,
      mistralEnabled: settings?.mistralEnabled ?? false,
      allowUserProviderSelection: settings?.allowUserProviderSelection ?? true,
      allowUserModelSelection: settings?.allowUserModelSelection ?? true,
      defaultAnthropicModel: settings?.defaultAnthropicModel ?? 'claude-sonnet-4-5-20250929',
      defaultDeepseekModel: settings?.defaultDeepseekModel ?? 'deepseek-chat',
      defaultOpenaiModel: settings?.defaultOpenaiModel ?? 'gpt-4o',
      defaultGeminiModel: settings?.defaultGeminiModel ?? 'gemini-pro',
      defaultMistralModel: settings?.defaultMistralModel ?? 'mistral-large',
      maintenanceMode: settings?.maintenanceMode ?? false,
      maintenanceMessage: settings?.maintenanceMessage ?? null,
      fetchedAt: now,
    };

    platformSettingsCache = result;
    return result;
  } catch (error) {
    logger.warn('[Enterprise AI] Failed to fetch platform settings, using factory default', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      defaultProvider: null,
      fallbackProvider: null,
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
      fetchedAt: now,
    };
  }
}

/**
 * Get the platform's default provider from PlatformAISettings.
 * Cached for 5 minutes to avoid excessive DB queries.
 */
async function getPlatformDefaultProvider(): Promise<AIProviderType | null> {
  const settings = await getPlatformSettings();
  return settings.defaultProvider;
}

/**
 * Invalidate the platform settings cache.
 * Call this when admin changes the default provider.
 *
 * Also clears the adapter cache and resets circuit breakers since
 * provider enable/disable or default model changes may have occurred.
 * Without this, stale adapters could be served for up to 10 minutes.
 */
export function invalidatePlatformSettingsCache(): void {
  platformSettingsCache = null;
  invalidateAdapterCache();
  for (const breaker of providerCircuitBreakers.values()) {
    breaker.reset();
  }
}

// ============================================================================
// ADAPTER CACHE
// ============================================================================

const adapterCache = new Map<string, { adapter: AIAdapter; createdAt: number }>();
const ADAPTER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedAdapter(cacheKey: string): AIAdapter | null {
  const cached = adapterCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < ADAPTER_CACHE_TTL_MS) {
    return cached.adapter;
  }
  if (cached) {
    adapterCache.delete(cacheKey);
  }
  return null;
}

function setCachedAdapter(cacheKey: string, adapter: AIAdapter): void {
  adapterCache.set(cacheKey, { adapter, createdAt: Date.now() });
}

/**
 * Invalidate all cached adapters.
 * Call this when provider configuration changes.
 */
export function invalidateAdapterCache(): void {
  adapterCache.clear();
}

// ============================================================================
// PER-PROVIDER CIRCUIT BREAKERS
// ============================================================================

/**
 * Per-provider circuit breakers prevent a single provider's failure from
 * blocking all AI operations. When DeepSeek fails 5 times, only DeepSeek
 * is blocked — Anthropic and OpenAI continue to work and can serve as
 * fallback providers.
 */
const providerCircuitBreakers = new Map<AIProviderType, CircuitBreaker>();

function getProviderCircuitBreaker(provider: AIProviderType): CircuitBreaker {
  let breaker = providerCircuitBreakers.get(provider);
  if (!breaker) {
    breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 30_000, // 30 seconds
      component: `EnterpriseAI:${provider}`,
    });
    providerCircuitBreakers.set(provider, breaker);
  }
  return breaker;
}

/**
 * Get the current state of the enterprise AI circuit breakers.
 * Used by system health checks. Returns state for each provider.
 */
export function getEnterpriseCircuitBreakerState(): string {
  if (providerCircuitBreakers.size === 0) return 'closed';
  const states: string[] = [];
  for (const [provider, breaker] of providerCircuitBreakers) {
    const state = breaker.getState();
    if (state !== 'closed') {
      states.push(`${provider}:${state}`);
    }
  }
  return states.length === 0 ? 'closed' : states.join(',');
}

// ============================================================================
// USER PREFERENCE CACHE
// ============================================================================

interface CachedUserPreferences {
  preferredGlobalProvider: string | null;
  preferredChatProvider: string | null;
  preferredCourseProvider: string | null;
  preferredAnalysisProvider: string | null;
  preferredCodeProvider: string | null;
  preferredSkillRoadmapProvider: string | null;
  fetchedAt: number;
}

const userPreferenceCache = new Map<string, CachedUserPreferences>();
const USER_PREF_CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCachedUserPreferences(userId: string): CachedUserPreferences | null {
  const cached = userPreferenceCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < USER_PREF_CACHE_TTL_MS) {
    return cached;
  }
  if (cached) {
    userPreferenceCache.delete(userId);
  }
  return null;
}

function setCachedUserPreferences(userId: string, prefs: Omit<CachedUserPreferences, 'fetchedAt'>): void {
  userPreferenceCache.set(userId, { ...prefs, fetchedAt: Date.now() });
}

/**
 * Invalidate the cached AI preferences for a specific user.
 * Call this after the user saves new preferences.
 */
export function invalidateUserPreferenceCache(userId: string): void {
  userPreferenceCache.delete(userId);
}

// ============================================================================
// PROVIDER RESOLUTION
// ============================================================================

/**
 * Error thrown when AI service is in maintenance mode
 */
export class AIMaintenanceModeError extends Error {
  public readonly maintenanceMessage: string | null;

  constructor(message: string | null) {
    super(message ?? 'AI service is currently in maintenance mode. Please try again later.');
    this.name = 'AIMaintenanceModeError';
    this.maintenanceMessage = message;
  }
}

/**
 * Check if a provider is enabled by platform admin settings.
 */
function isProviderEnabledByPlatform(
  provider: AIProviderType,
  settings: PlatformProviderSettings
): boolean {
  const enableMap: Record<AIProviderType, boolean> = {
    anthropic: settings.anthropicEnabled,
    deepseek: settings.deepseekEnabled,
    openai: settings.openaiEnabled,
    gemini: settings.geminiEnabled,
    mistral: settings.mistralEnabled,
  };
  return enableMap[provider] ?? false;
}

/**
 * Get the platform default model for a specific provider.
 */
function getPlatformDefaultModel(
  provider: AIProviderType,
  settings: PlatformProviderSettings
): string {
  const modelMap: Record<AIProviderType, string> = {
    anthropic: settings.defaultAnthropicModel,
    deepseek: settings.defaultDeepseekModel,
    openai: settings.defaultOpenaiModel,
    gemini: settings.defaultGeminiModel,
    mistral: settings.defaultMistralModel,
  };
  return modelMap[provider];
}

/**
 * Check if a provider is both available (API key configured) and enabled by platform.
 */
function isProviderUsable(
  provider: AIProviderType,
  settings: PlatformProviderSettings
): boolean {
  return isProviderAvailable(provider) && isProviderEnabledByPlatform(provider, settings);
}

/**
 * Resolve the provider to use based on resolution order:
 * 0. Check maintenance mode
 * 1. Explicit override (also checks platform enable)
 * 2. User preference — per-capability first, then global as fallback
 *    (respects allowUserProviderSelection)
 * 3. Platform default (filtered by enabled)
 * 4. Factory default (filtered by enabled: DeepSeek > Anthropic > OpenAI)
 *
 * IMPORTANT: Per-capability preferences take priority over global preference.
 * If a user sets globalProvider='deepseek' but courseProvider='anthropic',
 * course-related requests will use Anthropic. Global is only used as fallback
 * when no per-capability preference is set for the requested capability.
 */
async function resolveProvider(options: {
  explicitProvider?: AIProviderType;
  userId?: string;
  capability?: AICapability;
}): Promise<AIProviderType> {
  const { explicitProvider, userId, capability = 'chat' } = options;

  const settings = await getPlatformSettings();

  // 0. Check maintenance mode
  if (settings.maintenanceMode) {
    throw new AIMaintenanceModeError(settings.maintenanceMessage);
  }

  // 1. Explicit override (still check if provider is enabled by platform)
  if (explicitProvider && isProviderUsable(explicitProvider, settings)) {
    return explicitProvider;
  }

  // 2. User preference (only if platform allows user provider selection)
  if (userId && settings.allowUserProviderSelection) {
    try {
      // Check in-memory cache first (60s TTL)
      let prefs = getCachedUserPreferences(userId);

      if (!prefs) {
        const dbPrefs = await db.userAIPreferences.findUnique({
          where: { userId },
          select: {
            preferredGlobalProvider: true,
            preferredChatProvider: true,
            preferredCourseProvider: true,
            preferredAnalysisProvider: true,
            preferredCodeProvider: true,
            preferredSkillRoadmapProvider: true,
          },
        });

        if (dbPrefs) {
          setCachedUserPreferences(userId, dbPrefs);
          prefs = getCachedUserPreferences(userId);
        }
      }

      if (prefs) {
        // 2a. Per-capability preference FIRST (highest user-level priority)
        const providerMap: Record<string, string | null> = {
          chat: prefs.preferredChatProvider,
          course: prefs.preferredCourseProvider,
          analysis: prefs.preferredAnalysisProvider,
          code: prefs.preferredCodeProvider,
          'skill-roadmap': prefs.preferredSkillRoadmapProvider,
        };

        const preferred = providerMap[capability] as AIProviderType | null;
        if (preferred && isProviderUsable(preferred, settings)) {
          return preferred;
        }

        // 2b. Global provider as fallback (when no per-capability is set)
        if (prefs.preferredGlobalProvider) {
          const globalProvider = prefs.preferredGlobalProvider as AIProviderType;
          if (isProviderUsable(globalProvider, settings)) {
            return globalProvider;
          }
        }
      }
    } catch (error) {
      logger.warn('[Enterprise AI] Failed to fetch user preferences', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // 3. Platform default (filtered by enabled)
  if (settings.defaultProvider && isProviderUsable(settings.defaultProvider, settings)) {
    return settings.defaultProvider;
  }

  // 4. Factory default (filtered by enabled: DeepSeek > Anthropic > OpenAI > Gemini > Mistral)
  const fallbackOrder: AIProviderType[] = ['deepseek', 'anthropic', 'openai', 'gemini', 'mistral'];
  for (const provider of fallbackOrder) {
    if (isProviderUsable(provider, settings)) {
      return provider;
    }
  }

  // No providers available - throw descriptive error
  const configured = getConfiguredProviders();
  throw new Error(
    configured.length === 0
      ? 'No AI provider is configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.'
      : `No available AI provider found. Configured: ${configured.map((p) => p.name).join(', ')}. Check that providers are enabled in platform settings.`
  );
}

/**
 * Get an adapter for the resolved provider with optional user model preferences.
 * Respects platform settings for model selection control.
 */
async function getAdapter(options: {
  provider: AIProviderType;
  userId?: string;
  extended?: boolean;
}): Promise<AIAdapter> {
  const { provider, userId, extended = false } = options;
  const timeoutConfig: CreateAdapterOptions = extended
    ? { timeout: 180000, maxRetries: 1 }
    : { timeout: 60000, maxRetries: 2 };

  const settings = await getPlatformSettings();

  // Determine model: user preference → platform default per provider → registry default
  let modelOverride: string | undefined;

  if (userId && settings.allowUserModelSelection) {
    try {
      const userPrefs = await getUserModelPreferences(userId);
      modelOverride = getModelForProvider(provider, userPrefs) ?? undefined;
    } catch {
      // Ignore - will use platform default model
    }
  }

  // If no user model, use platform default model for this provider
  if (!modelOverride) {
    modelOverride = getPlatformDefaultModel(provider, settings);
  }

  const cacheKey = `${provider}-${extended ? 'ext' : 'std'}-${modelOverride ?? 'default'}`;
  const cached = getCachedAdapter(cacheKey);
  if (cached) return cached;

  try {
    const adapter = createAIAdapter(provider, {
      ...timeoutConfig,
      model: modelOverride,
    });

    setCachedAdapter(cacheKey, adapter);
    return adapter;
  } catch (error) {
    // Record adapter creation failure on the provider's circuit breaker
    // so repeated creation failures trigger the breaker open state
    const breaker = getProviderCircuitBreaker(provider);
    breaker.recordFailure(error instanceof Error ? error : new Error(String(error)));
    logger.error('[Enterprise AI] Adapter creation failed', {
      provider,
      model: modelOverride,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ============================================================================
// ENTERPRISE AI CLIENT
// ============================================================================

// ============================================================================
// CAPABILITY → FEATURE MAPPING (single source of truth for rate limiting)
// ============================================================================

/**
 * Maps AICapability to AIFeatureType for rate limiting.
 * 'skill-roadmap' maps to 'chat' because it shares the same rate limit bucket.
 */
const CAPABILITY_TO_FEATURE: Record<AICapability, AIFeatureType> = {
  'chat': 'chat',
  'course': 'course',
  'analysis': 'analysis',
  'code': 'code',
  'skill-roadmap': 'chat',
};

// ============================================================================
// REQUEST ID GENERATION
// ============================================================================

let requestIdCounter = 0;

/**
 * Generate a unique request ID for distributed tracing.
 * Format: ai_{timestamp}_{counter} — lightweight, no external deps.
 */
function generateRequestId(): string {
  requestIdCounter = (requestIdCounter + 1) % 1_000_000;
  return `ai_${Date.now().toString(36)}_${requestIdCounter.toString(36)}`;
}

// ============================================================================
// USAGE RECORDING WITH RETRY + FAILED RECORD BUFFER
// ============================================================================

/**
 * Buffer for failed usage records. These are retried on the next successful
 * recording call. Capped to prevent unbounded memory growth.
 */
interface FailedUsageRecord {
  userId: string;
  feature: AIFeatureType;
  usage: number;
  metadata: Record<string, unknown>;
  failedAt: number;
}

const failedUsageBuffer: FailedUsageRecord[] = [];
const MAX_FAILED_BUFFER_SIZE = 50;
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 500;

/**
 * Drain buffered failed records on successful write.
 * Fire-and-forget — errors are logged but don't block the caller.
 */
function drainFailedUsageBuffer(): void {
  if (failedUsageBuffer.length === 0) return;

  const records = failedUsageBuffer.splice(0, 10); // Process up to 10 at a time
  for (const record of records) {
    recordAIUsage(record.userId, record.feature, record.usage, record.metadata).catch(err => {
      // If still failing after buffer retry, log and discard
      logger.error('[Enterprise AI] Buffered usage record permanently lost', {
        userId: record.userId,
        feature: record.feature,
        provider: record.metadata.provider,
        failedAt: new Date(record.failedAt).toISOString(),
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
}

/**
 * Record AI usage with exponential backoff (3 attempts).
 * Failed records are buffered and retried on the next successful recording.
 */
function recordAIUsageWithRetry(
  userId: string,
  feature: AIFeatureType,
  usage: number,
  metadata: Record<string, unknown>,
  requestId: string
): void {
  const attemptRecord = (attempt: number): void => {
    recordAIUsage(userId, feature, usage, metadata)
      .then(() => {
        // Success — drain any buffered failed records
        drainFailedUsageBuffer();
      })
      .catch(err => {
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1); // 500ms, 1s, 2s
          logger.warn('[Enterprise AI] Usage recording failed, retrying', {
            requestId,
            attempt,
            maxAttempts: MAX_RETRY_ATTEMPTS,
            nextRetryMs: delay,
            error: err instanceof Error ? err.message : String(err),
          });
          setTimeout(() => attemptRecord(attempt + 1), delay);
        } else {
          // All retries exhausted — buffer for later
          if (failedUsageBuffer.length < MAX_FAILED_BUFFER_SIZE) {
            failedUsageBuffer.push({ userId, feature, usage, metadata, failedAt: Date.now() });
            logger.error('[Enterprise AI] Usage recording failed after all retries — buffered for later', {
              requestId,
              userId,
              feature,
              provider: metadata.provider,
              bufferedCount: failedUsageBuffer.length,
              error: err instanceof Error ? err.message : String(err),
            });
          } else {
            logger.error('[Enterprise AI] Usage recording failed — buffer full, record lost', {
              requestId,
              userId,
              feature,
              provider: metadata.provider,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
      });
  };

  attemptRecord(1);
}

export const aiClient = {
  /**
   * Send a chat request to the AI provider.
   *
   * Automatically resolves the provider based on:
   * 1. Explicit `provider` option
   * 2. User preferences (if `userId` provided)
   * 3. Platform default
   * 4. Factory default (DeepSeek > Anthropic > OpenAI)
   *
   * Also handles:
   * - Rate limiting based on subscription tier
   * - Usage recording with provider metadata (with retry)
   * - Automatic fallback to secondary provider on failure
   * - Per-provider circuit breakers
   * - Request ID correlation for distributed tracing
   */
  async chat(options: AIChatOptions): Promise<AIChatResponse> {
    const {
      userId,
      systemPrompt,
      messages,
      maxTokens = 2000,
      temperature = 0.7,
      extended = false,
      provider: explicitProvider,
      capability,
    } = options;

    const requestId = generateRequestId();
    const feature = CAPABILITY_TO_FEATURE[capability ?? 'chat'];

    // Check rate limits for authenticated users
    if (userId) {
      const accessCheck = await checkAIAccess(userId, feature);

      if (!accessCheck.allowed) {
        throw new AIAccessDeniedError(accessCheck);
      }
    }

    // Resolve provider
    const resolvedProvider = await resolveProvider({
      explicitProvider,
      userId,
      capability,
    });

    logger.debug('[Enterprise AI] Chat request', {
      requestId,
      provider: resolvedProvider,
      userId: userId ?? 'system',
      capability: capability ?? 'chat',
      extended,
      maxTokens,
      messageCount: messages.length,
    });

    // Helper function to execute chat and record usage
    const executeChat = async (
      provider: AIProviderType,
      isFallback = false
    ): Promise<AIChatResponse> => {
      const adapter = await getAdapter({
        provider,
        userId,
        extended,
      });

      const response = await adapter.chat({
        maxTokens,
        temperature,
        systemPrompt,
        messages,
      });

      // Record usage with retry
      if (userId) {
        recordAIUsageWithRetry(userId, feature, 1, {
          provider,
          model: response.model ?? provider,
          tokensUsed: response.usage?.totalTokens,
          cost: estimateCost(provider, response.usage),
          requestType: isFallback ? `${capability ?? 'chat'}_fallback` : (capability ?? 'chat'),
          requestId,
        }, requestId);
      }

      return {
        content: response.content ?? '',
        provider,
        model: response.model ?? provider,
        usage: response.usage
          ? {
              inputTokens: response.usage.inputTokens,
              outputTokens: response.usage.outputTokens,
              totalTokens: response.usage.totalTokens,
            }
          : undefined,
      };
    };

    // Try primary provider with per-provider circuit breaker
    const primaryBreaker = getProviderCircuitBreaker(resolvedProvider);
    try {
      return await primaryBreaker.execute(() => executeChat(resolvedProvider));
    } catch (primaryError) {
      // Don't fallback for access-denied or maintenance errors
      if (
        primaryError instanceof AIAccessDeniedError ||
        primaryError instanceof AIMaintenanceModeError
      ) {
        throw primaryError;
      }

      const errorMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);

      // Build ordered list of fallback candidates (filtered by platform-enabled)
      const fallbackSettings = await getPlatformSettings();
      const candidates: AIProviderType[] = [];

      // 1. Configured fallback provider (highest priority, must be enabled)
      if (
        fallbackSettings.fallbackProvider &&
        fallbackSettings.fallbackProvider !== resolvedProvider &&
        isProviderUsable(fallbackSettings.fallbackProvider, fallbackSettings)
      ) {
        candidates.push(fallbackSettings.fallbackProvider);
      }

      // 2. Any other enabled + available provider (ordered: deepseek > anthropic > openai > others)
      const providerPriority: AIProviderType[] = ['deepseek', 'anthropic', 'openai', 'gemini', 'mistral'];
      for (const provider of providerPriority) {
        if (
          provider !== resolvedProvider &&
          !candidates.includes(provider) &&
          isProviderUsable(provider, fallbackSettings)
        ) {
          candidates.push(provider);
        }
      }

      // Try each candidate with its own circuit breaker
      for (const candidate of candidates) {
        const candidateBreaker = getProviderCircuitBreaker(candidate);
        try {
          logger.warn('[Enterprise AI] Primary provider failed, trying fallback', {
            requestId,
            primary: resolvedProvider,
            fallback: candidate,
            error: errorMsg,
          });
          return await candidateBreaker.execute(() => executeChat(candidate, true));
        } catch (fallbackError) {
          // SAMServiceUnavailableError means this candidate's circuit is open — skip it
          if (fallbackError instanceof SAMServiceUnavailableError) {
            logger.debug('[Enterprise AI] Fallback provider circuit open, skipping', {
              requestId,
              fallback: candidate,
            });
            continue;
          }
          logger.warn('[Enterprise AI] Fallback provider also failed', {
            requestId,
            fallback: candidate,
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          });
          // Continue to next candidate
        }
      }

      // All candidates exhausted, re-throw original error
      throw primaryError;
    }
  },

  /**
   * Stream a chat response from the AI provider.
   *
   * Uses the same provider resolution, rate limiting, and usage recording
   * as `chat()`, but yields `AIChatStreamChunk` objects for real-time streaming.
   *
   * Falls back to a single-chunk non-streaming response if the adapter
   * does not support `chatStream()`.
   */
  async *stream(options: AIChatOptions): AsyncGenerator<AIChatStreamChunk> {
    const {
      userId,
      systemPrompt,
      messages,
      maxTokens = 2000,
      temperature = 0.7,
      extended = false,
      provider: explicitProvider,
      capability,
    } = options;

    const requestId = generateRequestId();
    const feature = CAPABILITY_TO_FEATURE[capability ?? 'chat'];

    // Check rate limits for authenticated users
    if (userId) {
      const accessCheck = await checkAIAccess(userId, feature);
      if (!accessCheck.allowed) {
        throw new AIAccessDeniedError(accessCheck);
      }
    }

    // Resolve provider
    const resolvedProvider = await resolveProvider({
      explicitProvider,
      userId,
      capability,
    });

    logger.debug('[Enterprise AI] Stream request', {
      requestId,
      provider: resolvedProvider,
      userId: userId ?? 'system',
      capability: capability ?? 'chat',
      extended,
      maxTokens,
      messageCount: messages.length,
    });

    // Per-provider circuit breaker wraps adapter creation + initial connection.
    // Stream iteration happens outside the breaker (mid-stream errors are different).
    const providerBreaker = getProviderCircuitBreaker(resolvedProvider);
    const { adapter, chatParams } = await providerBreaker.execute(async () => {
      const adapterInstance = await getAdapter({
        provider: resolvedProvider,
        userId,
        extended,
      });
      return {
        adapter: adapterInstance,
        chatParams: { maxTokens, temperature, systemPrompt, messages },
      };
    });

    // Use native streaming if available, otherwise fallback to single chunk.
    // Wrap in try-catch so mid-stream failures are recorded by the circuit
    // breaker — otherwise the NEXT request would still hit the broken provider.
    try {
      if (adapter.chatStream) {
        yield* adapter.chatStream(chatParams);
      } else {
        logger.warn('[Enterprise AI] Adapter does not support streaming, falling back to single chunk', { requestId });
        const response = await adapter.chat(chatParams);
        yield { content: response.content ?? '', done: true };
      }
    } catch (streamError) {
      providerBreaker.recordFailure(
        streamError instanceof Error ? streamError : new Error(String(streamError))
      );
      throw streamError;
    }

    // Record usage after stream completes (with retry)
    if (userId) {
      recordAIUsageWithRetry(userId, feature, 1, {
        provider: resolvedProvider,
        model: adapter.getModel(),
        requestType: capability ?? 'chat',
        requestId,
      }, requestId);
    }
  },

  /**
   * Get the currently resolved provider for a given context.
   * Useful for displaying which provider will be used.
   */
  async getResolvedProvider(options?: {
    userId?: string;
    provider?: AIProviderType;
  }): Promise<AIProviderType> {
    return resolveProvider({
      explicitProvider: options?.provider,
      userId: options?.userId,
    });
  },

  /**
   * Invalidate all caches (call when admin changes settings).
   */
  invalidateCaches(): void {
    invalidatePlatformSettingsCache();
    invalidateAdapterCache();
    userPreferenceCache.clear();
    // Reset all per-provider circuit breakers
    for (const breaker of providerCircuitBreakers.values()) {
      breaker.reset();
    }
  },
};

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Simple chat function for backward compatibility with runSAMChat pattern.
 * Prefer using `aiClient.chat()` directly for new code.
 */
export async function enterpriseChat(options: {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  extended?: boolean;
  userId?: string;
}): Promise<string> {
  const result = await aiClient.chat(options);
  return result.content;
}
