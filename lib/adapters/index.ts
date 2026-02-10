/**
 * SAM Database Adapters
 *
 * This module exports database adapters and configuration factories
 * for connecting SAM AI packages to the Taxomind database.
 */

export { PrismaSAMDatabaseAdapter, createPrismaSAMAdapter } from './prisma-sam-adapter';

// --- Primary API (use these) ---
export {
  getUserScopedSAMConfig,
  getUserScopedSAMConfigOrDefault,
  getDatabaseAdapter,
  resetSAMConfig,
} from './sam-config-factory';

// Specialized adapters for each SAM engine
export {
  PrismaTrendsDatabaseAdapter,
  PrismaCourseGuideDatabaseAdapter,
  PrismaMarketDatabaseAdapter,
  PrismaCollaborationDatabaseAdapter,
  PrismaInnovationDatabaseAdapter,
  createTrendsAdapter,
  createCourseGuideAdapter,
  createMarketAdapter,
  createCollaborationAdapter,
  createInnovationAdapter,
} from './specialized-adapters';

export { PrismaCourseDepthAnalysisStore } from './course-depth-analysis-store';

// Adaptive Content Engine adapter
export {
  PrismaAdaptiveContentDatabaseAdapter,
  getAdaptiveContentAdapter,
  resetAdaptiveContentAdapter,
} from './adaptive-content-adapter';

// Social Engine adapter
export {
  PrismaSocialDatabaseAdapter,
  getSocialEngineAdapter,
  resetSocialEngineAdapter,
} from './social-engine-adapter';

// Knowledge Graph Engine adapter
export {
  PrismaKnowledgeGraphDatabaseAdapter,
  getKnowledgeGraphEngineAdapter,
  resetKnowledgeGraphEngineAdapter,
} from './knowledge-graph-engine-adapter';
