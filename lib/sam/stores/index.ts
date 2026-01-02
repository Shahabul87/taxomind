/**
 * SAM AI Store Adapters
 * Provides database persistence for @sam-ai/agentic package
 */

// Goal Store
export { PrismaGoalStore, createPrismaGoalStore } from './prisma-goal-store';

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
