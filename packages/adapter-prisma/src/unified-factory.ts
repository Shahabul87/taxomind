/**
 * Unified SAM Prisma Adapters Factory
 *
 * Creates all SAM Prisma adapters with a single configuration.
 */

import { PrismaSAMAdapter, type PrismaClientLike } from './database-adapter';
import { PrismaSampleStore } from './sample-store';
import { PrismaStudentProfileStore } from './student-profile-store';
import { PrismaMemoryStore } from './memory-store';
import { PrismaReviewScheduleStore } from './review-schedule-store';
import { PrismaGoldenTestStore } from './golden-test-store';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SAMPrismaAdaptersConfig {
  /**
   * Prisma client instance
   */
  prisma: PrismaClientLike;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Model name overrides for custom schemas
   */
  modelNames?: {
    // Core models
    calibrationSample?: string;
    studentProfile?: string;
    topicMastery?: string;
    learningPathway?: string;
    memoryEntry?: string;
    reviewSchedule?: string;
    goldenTestCase?: string;
  };
}

// ============================================================================
// UNIFIED ADAPTERS
// ============================================================================

/**
 * Collection of all SAM Prisma adapters
 */
export interface SAMPrismaAdapters {
  /**
   * Core database adapter implementing SAMDatabaseAdapter
   */
  database: PrismaSAMAdapter;

  /**
   * Calibration sample store for evaluation quality tracking
   */
  calibration: PrismaSampleStore;

  /**
   * Student profile store for learning profiles and mastery
   */
  studentProfiles: PrismaStudentProfileStore;

  /**
   * Memory store for long-term context
   */
  memory: PrismaMemoryStore;

  /**
   * Review schedule store for spaced repetition
   */
  reviewSchedules: PrismaReviewScheduleStore;

  /**
   * Golden test store for version control
   */
  goldenTests: PrismaGoldenTestStore;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create all SAM Prisma adapters with unified configuration
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { createSAMPrismaAdapters } from '@sam-ai/adapter-prisma';
 *
 * const prisma = new PrismaClient();
 * const adapters = createSAMPrismaAdapters({ prisma });
 *
 * // Use in SAM configuration
 * const samConfig = createSAMConfig({
 *   ai: aiAdapter,
 *   database: adapters.database,
 *   // ...
 * });
 *
 * // Use student profiles
 * const profile = await adapters.studentProfiles.get(studentId);
 *
 * // Use calibration
 * await adapters.calibration.save(sample);
 * ```
 */
export function createSAMPrismaAdapters(config: SAMPrismaAdaptersConfig): SAMPrismaAdapters {
  const { prisma, debug, modelNames = {} } = config;

  return {
    database: new PrismaSAMAdapter({ prisma, debug }),

    calibration: new PrismaSampleStore({
      prisma,
      tableName: modelNames.calibrationSample,
    }),

    studentProfiles: new PrismaStudentProfileStore({
      prisma,
      profileTableName: modelNames.studentProfile,
      masteryTableName: modelNames.topicMastery,
      pathwayTableName: modelNames.learningPathway,
    }),

    memory: new PrismaMemoryStore({
      prisma,
      tableName: modelNames.memoryEntry,
    }),

    reviewSchedules: new PrismaReviewScheduleStore({
      prisma,
      tableName: modelNames.reviewSchedule,
    }),

    goldenTests: new PrismaGoldenTestStore({
      prisma,
      tableName: modelNames.goldenTestCase,
    }),
  };
}
