import { createAnthropicAdapter, type AIMessage, type AIAdapter } from '@sam-ai/core';
import { createAIAdapter, createExtendedAIAdapter } from '@/lib/sam/providers/ai-factory';
import { type AIProviderType, isProviderAvailable } from '@/lib/sam/providers/ai-registry';
import { db } from '@/lib/db';

// Cache for adapters by provider type
const adapterCache = new Map<string, AIAdapter>();

// Standard adapter for quick operations (60s timeout) - default Anthropic
let standardAdapter: ReturnType<typeof createAnthropicAdapter> | null = null;

// Extended adapter for complex operations like course generation (3 min timeout)
let extendedAdapter: ReturnType<typeof createAnthropicAdapter> | null = null;

function getAPIKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return apiKey;
}

function getStandardAdapter() {
  if (!standardAdapter) {
    standardAdapter = createAnthropicAdapter({
      apiKey: getAPIKey(),
      model: 'claude-sonnet-4-5-20250929',
      timeout: 60000, // 60 seconds for quick operations
      maxRetries: 2,
    });
  }
  return standardAdapter;
}

function getExtendedAdapter() {
  if (!extendedAdapter) {
    extendedAdapter = createAnthropicAdapter({
      apiKey: getAPIKey(),
      model: 'claude-sonnet-4-5-20250929',
      timeout: 180000, // 3 minutes for complex operations
      maxRetries: 1, // Less retries for long operations
    });
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

  const response = await adapter.chat({
    model: options.model,
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
