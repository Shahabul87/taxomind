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

export {
  PrismaSAMAdapter,
  createPrismaSAMAdapter,
} from './database-adapter';

export type {
  PrismaSAMAdapterConfig,
  PrismaClientLike,
} from './database-adapter';

// ============================================================================
// CALIBRATION SAMPLE STORE
// ============================================================================

export {
  PrismaSampleStore,
  createPrismaSampleStore,
} from './sample-store';

export type {
  PrismaSampleStoreConfig,
} from './sample-store';

// ============================================================================
// STUDENT PROFILE STORE
// ============================================================================

export {
  PrismaStudentProfileStore,
  createPrismaStudentProfileStore,
} from './student-profile-store';

export type {
  PrismaStudentProfileStoreConfig,
} from './student-profile-store';

// ============================================================================
// MEMORY STORE
// ============================================================================

export {
  PrismaMemoryStore,
  createPrismaMemoryStore,
} from './memory-store';

export type {
  PrismaMemoryStoreConfig,
} from './memory-store';

// ============================================================================
// REVIEW SCHEDULE STORE
// ============================================================================

export {
  PrismaReviewScheduleStore,
  createPrismaReviewScheduleStore,
} from './review-schedule-store';

export type {
  PrismaReviewScheduleStoreConfig,
} from './review-schedule-store';

// ============================================================================
// GOLDEN TEST STORE (for version control)
// ============================================================================

export {
  PrismaGoldenTestStore,
  createPrismaGoldenTestStore,
} from './golden-test-store';

export type {
  PrismaGoldenTestStoreConfig,
} from './golden-test-store';

// ============================================================================
// PRESENCE STORE
// ============================================================================

export {
  PrismaPresenceStore,
  createPrismaPresenceStore,
} from './presence-store';

export type {
  PrismaPresenceStoreConfig,
} from './presence-store';

// ============================================================================
// OBSERVABILITY STORES
// ============================================================================

export {
  PrismaToolTelemetryStore,
  PrismaConfidenceCalibrationStore,
  PrismaMemoryQualityStore,
  PrismaPlanLifecycleStore,
  PrismaMetricsStore,
  createPrismaObservabilityStores,
} from './observability-store';

export type {
  PrismaObservabilityStoreConfig,
} from './observability-store';

// ============================================================================
// UNIFIED ADAPTER FACTORY
// ============================================================================

export {
  createSAMPrismaAdapters,
} from './unified-factory';

export type {
  SAMPrismaAdapters,
  SAMPrismaAdaptersConfig,
} from './unified-factory';

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

export {
  SAM_PRISMA_MODELS,
  generatePrismaSchema,
} from './schema-helpers';

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '0.1.0';
