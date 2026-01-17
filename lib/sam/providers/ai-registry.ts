/**
 * AI Provider Registry
 * Centralized registry for all AI providers with their capabilities and configuration
 */

// ============================================================================
// TYPES
// ============================================================================

export type AIProviderType =
  | 'anthropic'
  | 'deepseek'
  | 'openai'
  | 'gemini'
  | 'mistral';

export type AICapability =
  | 'chat'
  | 'course-creation'
  | 'analysis'
  | 'code'
  | 'reasoning';

export interface ProviderInfo {
  id: AIProviderType;
  name: string;
  description: string;
  models: string[];
  defaultModel: string;
  capabilities: AICapability[];
  isConfigured: () => boolean;
  envKeyName: string;
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

export const AI_PROVIDERS: Record<AIProviderType, ProviderInfo> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Advanced reasoning, analysis, and coding assistance',
    models: ['claude-sonnet-4-20250514', 'claude-sonnet-4-5-20250929'],
    defaultModel: 'claude-sonnet-4-5-20250929',
    capabilities: ['chat', 'course-creation', 'analysis', 'code', 'reasoning'],
    isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
    envKeyName: 'ANTHROPIC_API_KEY',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Cost-effective reasoning and coding specialist',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    capabilities: ['chat', 'course-creation', 'analysis', 'code', 'reasoning'],
    isConfigured: () => Boolean(process.env.DEEPSEEK_API_KEY),
    envKeyName: 'DEEPSEEK_API_KEY',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI GPT',
    description: 'Versatile AI for general tasks and creative content',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'o1', 'o1-mini'],
    defaultModel: 'gpt-4o',
    capabilities: ['chat', 'course-creation', 'analysis', 'code', 'reasoning'],
    isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
    envKeyName: 'OPENAI_API_KEY',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Multimodal AI by Google (coming soon)',
    models: ['gemini-pro', 'gemini-ultra'],
    defaultModel: 'gemini-pro',
    capabilities: ['chat', 'course-creation', 'analysis'],
    isConfigured: () => Boolean(process.env.GOOGLE_AI_API_KEY),
    envKeyName: 'GOOGLE_AI_API_KEY',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'European AI with strong coding abilities (coming soon)',
    models: ['mistral-large', 'codestral', 'mistral-small'],
    defaultModel: 'mistral-large',
    capabilities: ['chat', 'analysis', 'code'],
    isConfigured: () => Boolean(process.env.MISTRAL_API_KEY),
    envKeyName: 'MISTRAL_API_KEY',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all configured (available) providers
 */
export function getConfiguredProviders(): ProviderInfo[] {
  return Object.values(AI_PROVIDERS).filter((p) => p.isConfigured());
}

/**
 * Get all providers (including unconfigured)
 */
export function getAllProviders(): ProviderInfo[] {
  return Object.values(AI_PROVIDERS);
}

/**
 * Get a specific provider by ID
 */
export function getProvider(id: AIProviderType): ProviderInfo | undefined {
  return AI_PROVIDERS[id];
}

/**
 * Check if a provider is available (configured)
 */
export function isProviderAvailable(id: AIProviderType): boolean {
  const provider = AI_PROVIDERS[id];
  return provider?.isConfigured() ?? false;
}

/**
 * Get providers that support a specific capability
 */
export function getProvidersWithCapability(
  capability: AICapability
): ProviderInfo[] {
  return Object.values(AI_PROVIDERS).filter(
    (p) => p.isConfigured() && p.capabilities.includes(capability)
  );
}

/**
 * Get the default provider (first configured one, preferring Anthropic)
 */
export function getDefaultProvider(): ProviderInfo | undefined {
  // Prefer Anthropic if configured
  if (AI_PROVIDERS.anthropic.isConfigured()) {
    return AI_PROVIDERS.anthropic;
  }

  // Fall back to first configured provider
  return getConfiguredProviders()[0];
}
