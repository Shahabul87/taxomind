/**
 * Unified SAM Prisma Adapters Factory
 *
 * Creates all SAM Prisma adapters with a single configuration.
 */
import { PrismaSAMAdapter } from './database-adapter';
import { PrismaSampleStore } from './sample-store';
import { PrismaStudentProfileStore } from './student-profile-store';
import { PrismaMemoryStore } from './memory-store';
import { PrismaReviewScheduleStore } from './review-schedule-store';
import { PrismaGoldenTestStore } from './golden-test-store';
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
export function createSAMPrismaAdapters(config) {
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
//# sourceMappingURL=unified-factory.js.map