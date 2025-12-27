/**
 * Memory Integration Module
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Exports for evaluation outcomes to update student profiles
 */

// Types
export type {
  // Mastery types
  MasteryLevel,
  TopicMastery,
  MasteryUpdate,
  // Learning pathway types
  PathwayStep,
  LearningPathway,
  PathwayAdjustment,
  // Spaced repetition types
  ReviewPriority,
  ReviewScheduleEntry,
  SpacedRepetitionConfig,
  // Student profile types
  LearningStyle,
  CognitivePreferences,
  PerformanceMetrics,
  StudentProfile,
  // Evaluation outcome types
  EvaluationOutcome,
  OutcomeRecordingResult,
  // Memory entry types
  MemoryEntryType,
  ImportanceLevel,
  MemoryEntry,
  // Store interfaces
  StudentProfileStore,
  ReviewScheduleStore,
  MemoryStore,
  // Integration types
  MemoryIntegrationConfig,
  EvaluationMemoryIntegration,
} from './types';

// Constants
export {
  DEFAULT_SPACED_REPETITION_CONFIG,
  DEFAULT_MEMORY_INTEGRATION_CONFIG,
} from './types';

// Student Profile Store
export {
  InMemoryStudentProfileStore,
  PrismaStudentProfileStore,
  createInMemoryStudentProfileStore,
  createPrismaStudentProfileStore,
  getDefaultStudentProfileStore,
  resetDefaultStudentProfileStore,
  type PrismaStudentProfileStoreConfig,
} from './student-profile-store';

// Mastery Tracker
export {
  MasteryTracker,
  createMasteryTracker,
  DEFAULT_MASTERY_TRACKER_CONFIG,
  type MasteryTrackerConfig,
  type MasteryUpdateResult,
  type MasteryRecommendation,
  type MasterySummary,
} from './mastery-tracker';

// Pathway Calculator
export {
  PathwayCalculator,
  createPathwayCalculator,
  DEFAULT_PATHWAY_CALCULATOR_CONFIG,
  type PathwayCalculatorConfig,
  type PathwayAdjustmentResult,
  type RemediationTemplate,
} from './pathway-calculator';

// Spaced Repetition
export {
  SpacedRepetitionScheduler,
  InMemoryReviewScheduleStore,
  createSpacedRepetitionScheduler,
  createInMemoryReviewScheduleStore,
  getDefaultReviewScheduleStore,
  resetDefaultReviewScheduleStore,
  type SchedulingResult,
  type ReviewSessionResult,
  type ReviewStats,
} from './spaced-repetition';

// Evaluation Memory Integration
export {
  EvaluationMemoryIntegrationImpl,
  InMemoryMemoryStore,
  createEvaluationMemoryIntegration,
  createInMemoryMemoryStore,
  getDefaultMemoryStore,
  resetDefaultMemoryStore,
  type EvaluationMemoryIntegrationImplConfig,
  type MemoryIntegrationLogger,
} from './evaluation-memory-integration';

// Memory Summary Helper
export {
  buildMemorySummary,
  type MemorySummaryOptions,
  type MemorySummaryResult,
} from './memory-summary';
