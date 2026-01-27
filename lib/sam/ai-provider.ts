import { type AIMessage, type AIAdapter } from '@sam-ai/core';
import { createAIAdapter, createExtendedAIAdapter, getDefaultAdapter } from '@/lib/sam/providers/ai-factory';
import { type AIProviderType, isProviderAvailable } from '@/lib/sam/providers/ai-registry';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Cache for adapters by provider type
const adapterCache = new Map<string, AIAdapter>();

// Cached adapters using platform default provider (DeepSeek > Anthropic > OpenAI)
let standardAdapter: AIAdapter | null = null;
let extendedAdapter: AIAdapter | null = null;

function getStandardAdapter(): AIAdapter {
  if (!standardAdapter) {
    standardAdapter = getDefaultAdapter({ timeout: 60000, maxRetries: 2 });
    if (!standardAdapter) {
      throw new Error('No AI provider is configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.');
    }
    logger.info('[AI Provider] Standard adapter initialized using platform default provider');
  }
  return standardAdapter;
}

function getExtendedAdapter(): AIAdapter {
  if (!extendedAdapter) {
    extendedAdapter = getDefaultAdapter({ timeout: 180000, maxRetries: 1 });
    if (!extendedAdapter) {
      throw new Error('No AI provider is configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY.');
    }
    logger.info('[AI Provider] Extended adapter initialized using platform default provider');
  }
  return extendedAdapter;
}

/**
 * Get adapter for a specific provider type
 */
function getAdapterForProvider(providerType: AIProviderType, extended: boolean = false): AIAdapter {
  const cacheKey = `${providerType}-${extended ? 'extended' : 'standard'}`;

  if (adapterCache.has(cacheKey)) {
    return adapterCache.get(cacheKey)!;
  }

  const adapter = extended
    ? createExtendedAIAdapter(providerType)
    : createAIAdapter(providerType);

  adapterCache.set(cacheKey, adapter);
  return adapter;
}

/**
 * Get user's preferred AI provider for a specific capability
 */
export async function getUserPreferredProvider(
  userId: string,
  capability: 'chat' | 'course' | 'analysis' | 'code'
): Promise<AIProviderType> {
  try {
    const prefs = await db.userAIPreferences.findUnique({
      where: { userId },
      select: {
        preferredChatProvider: true,
        preferredCourseProvider: true,
        preferredAnalysisProvider: true,
        preferredCodeProvider: true,
      },
    });

    if (!prefs) {
      return 'anthropic'; // Default
    }

    const providerMap: Record<string, string | null> = {
      chat: prefs.preferredChatProvider,
      course: prefs.preferredCourseProvider,
      analysis: prefs.preferredAnalysisProvider,
      code: prefs.preferredCodeProvider,
    };

    const preferred = providerMap[capability] as AIProviderType | null;

    // Validate the provider is available
    if (preferred && isProviderAvailable(preferred)) {
      return preferred;
    }

    return 'anthropic'; // Fallback to default
  } catch (error) {
    console.error('[getUserPreferredProvider] Error:', error);
    return 'anthropic';
  }
}

export async function runSAMChat(options: {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  extended?: boolean; // Use extended timeout for complex operations
}): Promise<string> {
  const adapter = options.extended ? getExtendedAdapter() : getStandardAdapter();

  // Don't pass model override - let the adapter use its configured default model.
  // Routes previously passed Anthropic-specific models (e.g. claude-3-5-haiku)
  // which break when the platform is configured for DeepSeek/OpenAI.
  const response = await adapter.chat({
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    systemPrompt: options.systemPrompt,
    messages: options.messages,
  });

  return response.content ?? '';
}

/**
 * Run SAM chat with user's preferred provider for a specific capability
 * This respects user's AI provider preferences from settings
 */
export async function runSAMChatWithPreference(options: {
  userId: string;
  capability: 'chat' | 'course' | 'analysis' | 'code';
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  extended?: boolean;
}): Promise<string> {
  const providerType = await getUserPreferredProvider(options.userId, options.capability);

  console.log(`[runSAMChatWithPreference] Using provider: ${providerType} for ${options.capability}`);

  const adapter = getAdapterForProvider(providerType, options.extended ?? false);

  const response = await adapter.chat({
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    systemPrompt: options.systemPrompt,
    messages: options.messages,
  });

  return response.content ?? '';
}
