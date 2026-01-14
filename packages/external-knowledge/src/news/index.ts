/**
 * @sam-ai/external-knowledge - News Module
 * News ranking and analysis functionality
 */

// Types
export * from './types';

// News Ranking Engine
export {
  NewsRankingEngine,
  createNewsRankingEngine,
  getNewsRankingEngine,
  type NewsRankingEngineConfig,
} from './news-ranking-engine';
