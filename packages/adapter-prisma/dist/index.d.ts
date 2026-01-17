/**
 * @sam-ai/adapter-prisma
 *
 * Prisma database adapter for SAM AI - connects SAM to any Prisma-supported database.
 * Provides implementations for all SAM storage interfaces.
 *
 * @packageDocumentation
 */
export { PrismaSAMAdapter, createPrismaSAMAdapter, } from './database-adapter';
export type { PrismaSAMAdapterConfig, PrismaClientLike, } from './database-adapter';
export { PrismaSampleStore, createPrismaSampleStore, } from './sample-store';
export type { PrismaSampleStoreConfig, } from './sample-store';
export { PrismaStudentProfileStore, createPrismaStudentProfileStore, } from './student-profile-store';
export type { PrismaStudentProfileStoreConfig, } from './student-profile-store';
export { PrismaMemoryStore, createPrismaMemoryStore, } from './memory-store';
export type { PrismaMemoryStoreConfig, } from './memory-store';
export { PrismaConfidenceScoreStore, PrismaVerificationResultStore, PrismaQualityRecordStore, PrismaCalibrationStore, PrismaSelfCritiqueStore, createPrismaSelfEvaluationStores, } from './self-evaluation-store';
export type { PrismaSelfEvaluationStoreConfig, } from './self-evaluation-store';
export { PrismaLearningPatternStore, PrismaMetaLearningInsightStore, PrismaLearningStrategyStore, PrismaLearningEventStore, createPrismaMetaLearningStores, } from './meta-learning-store';
export type { PrismaMetaLearningStoreConfig, } from './meta-learning-store';
export { PrismaJourneyTimelineStore, createPrismaJourneyTimelineStore, } from './journey-timeline-store';
export type { PrismaJourneyTimelineStoreConfig, } from './journey-timeline-store';
export { PrismaReviewScheduleStore, createPrismaReviewScheduleStore, } from './review-schedule-store';
export type { PrismaReviewScheduleStoreConfig, } from './review-schedule-store';
export { PrismaGoldenTestStore, createPrismaGoldenTestStore, } from './golden-test-store';
export type { PrismaGoldenTestStoreConfig, } from './golden-test-store';
export { PrismaPresenceStore, createPrismaPresenceStore, } from './presence-store';
export type { PrismaPresenceStoreConfig, } from './presence-store';
export { PrismaPushQueueStore, createPrismaPushQueueStore, } from './push-queue-store';
export type { PrismaPushQueueStoreConfig, } from './push-queue-store';
export { PrismaToolTelemetryStore, PrismaConfidenceCalibrationStore, PrismaMemoryQualityStore, PrismaPlanLifecycleStore, PrismaMetricsStore, createPrismaObservabilityStores, } from './observability-store';
export type { PrismaObservabilityStoreConfig, } from './observability-store';
export { createSAMPrismaAdapters, } from './unified-factory';
export type { SAMPrismaAdapters, SAMPrismaAdaptersConfig, } from './unified-factory';
export { SAM_PRISMA_MODELS, generatePrismaSchema, } from './schema-helpers';
export declare const VERSION = "0.1.0";
//# sourceMappingURL=index.d.ts.map