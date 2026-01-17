/**
 * Prisma Schema Helpers
 *
 * Utility functions for generating SAM-compatible Prisma schemas.
 */
/**
 * Required Prisma models for SAM AI
 */
export declare const SAM_PRISMA_MODELS: {
    /**
     * Core models (required)
     */
    readonly core: readonly ["User", "Course", "Chapter", "Section"];
    /**
     * SAM-specific models (optional but recommended)
     */
    readonly sam: readonly ["SAMInteraction", "StudentBloomsProgress", "CognitiveSkillProgress", "CourseBloomsAnalysis", "QuestionBank"];
    /**
     * Calibration models (for quality tracking)
     */
    readonly calibration: readonly ["CalibrationSample"];
    /**
     * Memory models (for adaptive learning)
     */
    readonly memory: readonly ["StudentProfile", "TopicMastery", "LearningPathway", "MemoryEntry", "ReviewSchedule"];
    /**
     * Version control models (for testing)
     */
    readonly versionControl: readonly ["GoldenTestCase"];
};
/**
 * Generate a Prisma schema snippet for SAM models
 *
 * @param options Schema generation options
 * @returns Prisma schema string
 */
export declare function generatePrismaSchema(options?: {
    includeCalibration?: boolean;
    includeMemory?: boolean;
    includeVersionControl?: boolean;
}): string;
//# sourceMappingURL=schema-helpers.d.ts.map