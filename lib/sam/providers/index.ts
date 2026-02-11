/**
 * SAM AI Providers
 * External service integrations for SAM AI system
 */

// ============================================================================
// AI Provider Registry & Factory
// ============================================================================

export {
  // Types
  type AIProviderType,
  type AICapability,
  type ProviderInfo,
  // Registry
  AI_PROVIDERS,
  getConfiguredProviders,
  getAllProviders,
  getProvider,
  isProviderAvailable,
  getProvidersWithCapability,
  getDefaultProvider,
} from './ai-registry';

export {
  // Types
  type CreateAdapterOptions,
  type AIProviderError,
  // Factory (core function only — use lib/sam/ai-provider.ts for route code)
  createAIAdapter,
} from './ai-factory';

// ============================================================================
// Embedding Provider
// ============================================================================

export {
  OpenAIEmbeddingProvider,
  createOpenAIEmbeddingProvider,
  getOpenAIEmbeddingProvider,
  type OpenAIEmbeddingConfig,
} from './openai-embedding-provider';
