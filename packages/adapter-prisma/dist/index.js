/**
 * @sam-ai/adapter-prisma
 *
 * Prisma database adapter for SAM AI - connects SAM to any Prisma-supported database.
 * Provides implementations for all SAM storage interfaces.
 *
 * @packageDocumentation
 */
// ============================================================================
// CORE DATABASE ADAPTER
// ============================================================================
export { PrismaSAMAdapter, createPrismaSAMAdapter, } from './database-adapter';
// ============================================================================
// CALIBRATION SAMPLE STORE
// ============================================================================
export { PrismaSampleStore, createPrismaSampleStore, } from './sample-store';
// ============================================================================
// STUDENT PROFILE STORE
// ============================================================================
export { PrismaStudentProfileStore, createPrismaStudentProfileStore, } from './student-profile-store';
// ============================================================================
// MEMORY STORE
// ============================================================================
export { PrismaMemoryStore, createPrismaMemoryStore, } from './memory-store';
// ============================================================================
// SELF-EVALUATION STORES
// ============================================================================
export { PrismaConfidenceScoreStore, PrismaVerificationResultStore, PrismaQualityRecordStore, PrismaCalibrationStore, PrismaSelfCritiqueStore, createPrismaSelfEvaluationStores, } from './self-evaluation-store';
// ============================================================================
// META-LEARNING STORES
// ============================================================================
export { PrismaLearningPatternStore, PrismaMetaLearningInsightStore, PrismaLearningStrategyStore, PrismaLearningEventStore, createPrismaMetaLearningStores, } from './meta-learning-store';
// ============================================================================
// JOURNEY TIMELINE STORE
// ============================================================================
export { PrismaJourneyTimelineStore, createPrismaJourneyTimelineStore, } from './journey-timeline-store';
// ============================================================================
// REVIEW SCHEDULE STORE
// ============================================================================
export { PrismaReviewScheduleStore, createPrismaReviewScheduleStore, } from './review-schedule-store';
// ============================================================================
// GOLDEN TEST STORE (for version control)
// ============================================================================
export { PrismaGoldenTestStore, createPrismaGoldenTestStore, } from './golden-test-store';
// ============================================================================
// PRESENCE STORE
// ============================================================================
export { PrismaPresenceStore, createPrismaPresenceStore, } from './presence-store';
// ============================================================================
// PUSH QUEUE STORE
// ============================================================================
export { PrismaPushQueueStore, createPrismaPushQueueStore, } from './push-queue-store';
// ============================================================================
// OBSERVABILITY STORES
// ============================================================================
export { PrismaToolTelemetryStore, PrismaConfidenceCalibrationStore, PrismaMemoryQualityStore, PrismaPlanLifecycleStore, PrismaMetricsStore, createPrismaObservabilityStores, } from './observability-store';
// ============================================================================
// UNIFIED ADAPTER FACTORY
// ============================================================================
export { createSAMPrismaAdapters, } from './unified-factory';
// ============================================================================
// SCHEMA HELPERS
// ============================================================================
export { SAM_PRISMA_MODELS, generatePrismaSchema, } from './schema-helpers';
// ============================================================================
// VERSION
// ============================================================================
export const VERSION = '0.1.0';
//# sourceMappingURL=index.js.map