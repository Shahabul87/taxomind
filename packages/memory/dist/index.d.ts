/**
 * Memory Integration Module
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Exports for evaluation outcomes to update student profiles
 */
export type { BloomsLevel, MasteryLevel, TopicMastery, MasteryUpdate, PathwayStep, LearningPathway, PathwayAdjustment, ReviewPriority, ReviewScheduleEntry, SpacedRepetitionConfig, LearningStyle, CognitivePreferences, PerformanceMetrics, StudentProfile, EvaluationOutcome, OutcomeRecordingResult, MemoryEntryType, ImportanceLevel, MemoryEntry, StudentProfileStore, ReviewScheduleStore, MemoryStore, MemoryIntegrationConfig, EvaluationMemoryIntegration, } from './types';
export { DEFAULT_SPACED_REPETITION_CONFIG, DEFAULT_MEMORY_INTEGRATION_CONFIG, } from './types';
export { InMemoryStudentProfileStore, PrismaStudentProfileStore, createInMemoryStudentProfileStore, createPrismaStudentProfileStore, getDefaultStudentProfileStore, resetDefaultStudentProfileStore, type PrismaStudentProfileStoreConfig, } from './student-profile-store';
export { MasteryTracker, createMasteryTracker, DEFAULT_MASTERY_TRACKER_CONFIG, type MasteryTrackerConfig, type MasteryUpdateResult, type MasteryRecommendation, type MasterySummary, } from './mastery-tracker';
export { PathwayCalculator, createPathwayCalculator, DEFAULT_PATHWAY_CALCULATOR_CONFIG, type PathwayCalculatorConfig, type PathwayAdjustmentResult, type RemediationTemplate, } from './pathway-calculator';
export { SpacedRepetitionScheduler, InMemoryReviewScheduleStore, createSpacedRepetitionScheduler, createInMemoryReviewScheduleStore, getDefaultReviewScheduleStore, resetDefaultReviewScheduleStore, type SchedulingResult, type ReviewSessionResult, type ReviewStats, } from './spaced-repetition';
export { EvaluationMemoryIntegrationImpl, InMemoryMemoryStore, createEvaluationMemoryIntegration, createInMemoryMemoryStore, getDefaultMemoryStore, resetDefaultMemoryStore, type EvaluationMemoryIntegrationImplConfig, type MemoryIntegrationLogger, } from './evaluation-memory-integration';
export { buildMemorySummary, type MemorySummaryOptions, type MemorySummaryResult, } from './memory-summary';
//# sourceMappingURL=index.d.ts.map