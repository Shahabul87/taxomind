/**
 * @sam-ai/external-knowledge
 * External knowledge integration for SAM AI Mentor
 *
 * This package provides:
 * - News Integration: Search and aggregate news from multiple sources
 * - News Ranking: Intelligent news ranking based on multiple criteria
 * - Research Integration: Search academic papers and research
 * - Documentation Integration: Search technical documentation
 * - Web Content Extraction: Fetch and extract content from URLs
 * - Caching: Built-in caching for external content
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// ============================================================================
// NEWS MODULE
// ============================================================================

export * from './news';

// ============================================================================
// CACHE
// ============================================================================

export {
  InMemoryContentCache,
  createInMemoryCache,
} from './cache';

// ============================================================================
// AGGREGATOR
// ============================================================================

export {
  KnowledgeAggregator,
  createKnowledgeAggregator,
} from './aggregator';

// ============================================================================
// PACKAGE INFO
// ============================================================================

export const PACKAGE_NAME = '@sam-ai/external-knowledge';
export const PACKAGE_VERSION = '0.1.0';

/**
 * Package capabilities
 */
export const EXTERNAL_KNOWLEDGE_CAPABILITIES = {
  NEWS: 'external:news',
  NEWS_RANKING: 'external:news_ranking',
  RESEARCH: 'external:research',
  DOCUMENTATION: 'external:documentation',
  WEB_CONTENT: 'external:web_content',
  CACHING: 'external:caching',
  RECOMMENDATIONS: 'external:recommendations',
} as const;

export type ExternalKnowledgeCapability =
  (typeof EXTERNAL_KNOWLEDGE_CAPABILITIES)[keyof typeof EXTERNAL_KNOWLEDGE_CAPABILITIES];

/**
 * Check if a capability is available
 */
export function hasCapability(capability: ExternalKnowledgeCapability): boolean {
  switch (capability) {
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.NEWS:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.NEWS_RANKING:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.RESEARCH:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.DOCUMENTATION:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.WEB_CONTENT:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.CACHING:
    case EXTERNAL_KNOWLEDGE_CAPABILITIES.RECOMMENDATIONS:
      return true;
    default:
      return false;
  }
}
