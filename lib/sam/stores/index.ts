/**
 * SAM AI Store Adapters
 * Provides database persistence for @sam-ai/agentic package
 */

// Goal Store
export { PrismaGoalStore, createPrismaGoalStore } from './prisma-goal-store';

// SubGoal Store
export {
  PrismaSubGoalStore,
  createPrismaSubGoalStore,
} from './prisma-subgoal-store';

// Plan Store
export { PrismaPlanStore, createPrismaPlanStore } from './prisma-plan-store';

// Proactive Intervention Stores
export {
  PrismaBehaviorEventStore,
  createPrismaBehaviorEventStore,
} from './prisma-behavior-store';

export {
  PrismaPatternStore,
  createPrismaPatternStore,
} from './prisma-pattern-store';

export {
  PrismaInterventionStore,
  createPrismaInterventionStore,
} from './prisma-intervention-store';

export {
  PrismaCheckInStore,
  createPrismaCheckInStore,
} from './prisma-checkin-store';

// Tool Registry Store
export { PrismaToolStore, createPrismaToolStore } from './prisma-tool-store';

// Analytics Stores
export {
  PrismaLearningSessionStore,
  PrismaTopicProgressStore,
  PrismaLearningGapStore,
  PrismaSkillAssessmentStore,
  PrismaRecommendationStore,
  PrismaContentStore,
  createPrismaLearningSessionStore,
  createPrismaTopicProgressStore,
  createPrismaLearningGapStore,
  createPrismaSkillAssessmentStore,
  createPrismaRecommendationStore,
  createPrismaContentStore,
} from './prisma-analytics-stores';

// Memory Stores
export {
  PrismaVectorAdapter,
  PrismaKnowledgeGraphStore,
  PrismaSessionContextStore,
  createPrismaVectorAdapter,
  createPrismaKnowledgeGraphStore,
  createPrismaSessionContextStore,
} from './prisma-memory-stores';

// Learning Path Stores
export {
  PrismaSkillStore,
  createPrismaSkillStore,
} from './prisma-skill-store';

export {
  PrismaLearningPathStore,
  createPrismaLearningPathStore,
} from './prisma-learning-path-store';

export {
  PrismaCourseGraphStore,
  createPrismaCourseGraphStore,
} from './prisma-course-graph-store';

// Multi-Session Learning Plan Store
export {
  PrismaLearningPlanStore,
  createPrismaLearningPlanStore,
} from './prisma-learning-plan-store';
