/**
 * SAM Database Adapters
 *
 * This module exports database adapters and configuration factories
 * for connecting SAM AI packages to the Taxomind database.
 */

export { PrismaSAMDatabaseAdapter, createPrismaSAMAdapter } from './prisma-sam-adapter';
export {
  getSAMConfig,
  getDatabaseAdapter,
  createCustomSAMConfig,
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
