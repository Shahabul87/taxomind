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
  // Factory
  createAIAdapter,
  createExtendedAIAdapter,
  getDefaultAdapter,
  getAllConfiguredAdapters,
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
