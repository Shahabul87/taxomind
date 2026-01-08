/**
 * Taxomind Integration Context
 *
 * Singleton wrapper that provides centralized access to all SAM agentic stores
 * and integrations. This is the SINGLE ENTRY POINT for accessing Prisma stores.
 *
 * Architecture Goal: All SAM integration code should go through this context
 * instead of directly importing/creating stores.
 *
 * Usage:
 * ```typescript
 * import { getTaxomindContext } from '@/lib/sam/taxomind-context';
 *
 * const context = getTaxomindContext();
 * const goalStore = context.stores.goal;
 * const planStore = context.stores.plan;
 * ```
 */

import { logger } from '@/lib/logger';

// Import interface types from @sam-ai/agentic for stores that return interface types
import type {
  BehaviorEventStore,
  PatternStore,
  InterventionStore,
  CheckInStore,
} from '@sam-ai/agentic';

// Import all store factories
import {
  createPrismaGoalStore,
  createPrismaSubGoalStore,
  createPrismaPlanStore,
  createPrismaBehaviorEventStore,
  createPrismaPatternStore,
  createPrismaInterventionStore,
  createPrismaCheckInStore,
  createPrismaToolStore,
  createPrismaLearningSessionStore,
  createPrismaTopicProgressStore,
  createPrismaLearningGapStore,
  createPrismaSkillAssessmentStore,
  createPrismaRecommendationStore,
  createPrismaContentStore,
  createPrismaVectorAdapter,
  createPrismaKnowledgeGraphStore,
  createPrismaSessionContextStore,
  createPrismaSkillStore,
  createPrismaLearningPathStore,
  createPrismaCourseGraphStore,
  createPrismaLearningPlanStore,
  createPrismaTutoringSessionStore,
  createPrismaSkillBuildTrackStore,
} from './stores';

// Import class types from stores (for stores that return class types)
import type {
  PrismaGoalStore,
  PrismaSubGoalStore,
  PrismaPlanStore,
  PrismaToolStore,
  PrismaLearningSessionStore,
  PrismaTopicProgressStore,
  PrismaLearningGapStore,
  PrismaSkillAssessmentStore,
  PrismaRecommendationStore,
  PrismaContentStore,
  PrismaVectorAdapter,
  PrismaKnowledgeGraphStore,
  PrismaSessionContextStore,
  PrismaSkillStore,
  PrismaLearningPathStore,
  PrismaCourseGraphStore,
  PrismaLearningPlanStore,
  PrismaTutoringSessionStore,
  PrismaSkillBuildTrackStore,
} from './stores';

// ============================================================================
// STORE TYPES
// ============================================================================

/**
 * All available Prisma stores for SAM integration
 * Note: Some stores return interface types from @sam-ai/agentic,
 * while others return class types from our local stores.
 */
export interface TaxomindAgenticStores {
  // Goal Planning
  goal: PrismaGoalStore;
  subGoal: PrismaSubGoalStore;
  plan: PrismaPlanStore;

  // Proactive Intervention (these return interface types from @sam-ai/agentic)
  behaviorEvent: BehaviorEventStore;
  pattern: PatternStore;
  intervention: InterventionStore;
  checkIn: CheckInStore;

  // Tool Registry
  tool: PrismaToolStore;

  // Analytics
  learningSession: PrismaLearningSessionStore;
  topicProgress: PrismaTopicProgressStore;
  learningGap: PrismaLearningGapStore;
  skillAssessment: PrismaSkillAssessmentStore;
  recommendation: PrismaRecommendationStore;
  content: PrismaContentStore;

  // Memory
  vector: PrismaVectorAdapter;
  knowledgeGraph: PrismaKnowledgeGraphStore;
  sessionContext: PrismaSessionContextStore;

  // Learning Path
  skill: PrismaSkillStore;
  learningPath: PrismaLearningPathStore;
  courseGraph: PrismaCourseGraphStore;

  // Multi-Session
  learningPlan: PrismaLearningPlanStore;
  tutoringSession: PrismaTutoringSessionStore;

  // SkillBuildTrack
  skillBuildTrack: PrismaSkillBuildTrackStore;
}

/**
 * Taxomind Integration Context
 * Single entry point for all SAM stores and integrations
 */
export interface TaxomindIntegrationContext {
  stores: TaxomindAgenticStores;
  isInitialized: boolean;
  initializationTime: Date;
}

// ============================================================================
// SINGLETON IMPLEMENTATION
// ============================================================================

let contextInstance: TaxomindIntegrationContext | null = null;

/**
 * Initialize all stores lazily
 */
function initializeStores(): TaxomindAgenticStores {
  logger.info('[TaxomindContext] Initializing all Prisma stores...');

  const stores: TaxomindAgenticStores = {
    // Goal Planning
    goal: createPrismaGoalStore(),
    subGoal: createPrismaSubGoalStore(),
    plan: createPrismaPlanStore(),

    // Proactive Intervention
    behaviorEvent: createPrismaBehaviorEventStore(),
    pattern: createPrismaPatternStore(),
    intervention: createPrismaInterventionStore(),
    checkIn: createPrismaCheckInStore(),

    // Tool Registry
    tool: createPrismaToolStore(),

    // Analytics
    learningSession: createPrismaLearningSessionStore(),
    topicProgress: createPrismaTopicProgressStore(),
    learningGap: createPrismaLearningGapStore(),
    skillAssessment: createPrismaSkillAssessmentStore(),
    recommendation: createPrismaRecommendationStore(),
    content: createPrismaContentStore(),

    // Memory
    vector: createPrismaVectorAdapter(),
    knowledgeGraph: createPrismaKnowledgeGraphStore(),
    sessionContext: createPrismaSessionContextStore(),

    // Learning Path
    skill: createPrismaSkillStore(),
    learningPath: createPrismaLearningPathStore(),
    courseGraph: createPrismaCourseGraphStore(),

    // Multi-Session
    learningPlan: createPrismaLearningPlanStore(),
    tutoringSession: createPrismaTutoringSessionStore(),

    // SkillBuildTrack
    skillBuildTrack: createPrismaSkillBuildTrackStore(),
  };

  logger.info('[TaxomindContext] All stores initialized', {
    storeCount: Object.keys(stores).length,
  });

  return stores;
}

/**
 * Get the Taxomind Integration Context singleton
 *
 * This is the RECOMMENDED way to access all SAM stores.
 * Use this instead of directly importing store factories.
 *
 * @returns The initialized TaxomindIntegrationContext
 */
export function getTaxomindContext(): TaxomindIntegrationContext {
  if (!contextInstance) {
    logger.info('[TaxomindContext] Creating new context instance...');

    contextInstance = {
      stores: initializeStores(),
      isInitialized: true,
      initializationTime: new Date(),
    };

    logger.info('[TaxomindContext] Context created successfully', {
      initializationTime: contextInstance.initializationTime.toISOString(),
    });
  }

  return contextInstance;
}

/**
 * Reset the context singleton (useful for testing)
 */
export function resetTaxomindContext(): void {
  logger.info('[TaxomindContext] Resetting context instance');
  contextInstance = null;
}

/**
 * Check if the context has been initialized
 */
export function isTaxomindContextInitialized(): boolean {
  return contextInstance !== null && contextInstance.isInitialized;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Get a specific store from the context
 */
export function getStore<K extends keyof TaxomindAgenticStores>(
  storeName: K
): TaxomindAgenticStores[K] {
  return getTaxomindContext().stores[storeName];
}

/**
 * Get all proactive intervention stores
 */
export function getProactiveStores(): {
  behaviorEvent: BehaviorEventStore;
  pattern: PatternStore;
  intervention: InterventionStore;
  checkIn: CheckInStore;
} {
  const { stores } = getTaxomindContext();
  return {
    behaviorEvent: stores.behaviorEvent,
    pattern: stores.pattern,
    intervention: stores.intervention,
    checkIn: stores.checkIn,
  };
}

/**
 * Get all goal-related stores
 */
export function getGoalStores(): {
  goal: PrismaGoalStore;
  subGoal: PrismaSubGoalStore;
  plan: PrismaPlanStore;
} {
  const { stores } = getTaxomindContext();
  return {
    goal: stores.goal,
    subGoal: stores.subGoal,
    plan: stores.plan,
  };
}

/**
 * Get all memory-related stores
 */
export function getMemoryStores(): {
  vector: PrismaVectorAdapter;
  knowledgeGraph: PrismaKnowledgeGraphStore;
  sessionContext: PrismaSessionContextStore;
} {
  const { stores } = getTaxomindContext();
  return {
    vector: stores.vector,
    knowledgeGraph: stores.knowledgeGraph,
    sessionContext: stores.sessionContext,
  };
}

/**
 * Get all learning path stores
 */
export function getLearningPathStores(): {
  skill: PrismaSkillStore;
  learningPath: PrismaLearningPathStore;
  courseGraph: PrismaCourseGraphStore;
} {
  const { stores } = getTaxomindContext();
  return {
    skill: stores.skill,
    learningPath: stores.learningPath,
    courseGraph: stores.courseGraph,
  };
}

// Re-export store types for external use
export type {
  // From @sam-ai/agentic (interface types)
  BehaviorEventStore,
  PatternStore,
  InterventionStore,
  CheckInStore,
  // From local stores (class types)
  PrismaGoalStore,
  PrismaSubGoalStore,
  PrismaPlanStore,
  PrismaToolStore,
  PrismaLearningSessionStore,
  PrismaTopicProgressStore,
  PrismaLearningGapStore,
  PrismaSkillAssessmentStore,
  PrismaRecommendationStore,
  PrismaContentStore,
  PrismaVectorAdapter,
  PrismaKnowledgeGraphStore,
  PrismaSessionContextStore,
  PrismaSkillStore,
  PrismaLearningPathStore,
  PrismaCourseGraphStore,
  PrismaLearningPlanStore,
  PrismaTutoringSessionStore,
  PrismaSkillBuildTrackStore,
};
