/**
 * @sam-ai/react - Hooks exports
 */

export { useSAM } from './useSAM';
export { useSAMChat } from './useSAMChat';
export { useSAMActions } from './useSAMActions';
export { useSAMPageContext, useSAMAutoContext } from './useSAMPageContext';
export { useSAMAnalysis } from './useSAMAnalysis';
export { useSAMForm, useSAMFormSync } from './useSAMForm';
export { useSAMPageLinks } from './useSAMPageLinks';
export { useSAMFormDataSync } from './useSAMFormDataSync';
export { useSAMFormDataEvents } from './useSAMFormDataEvents';
export { useSAMFormAutoDetect } from './useSAMFormAutoDetect';
export { useSAMFormAutoFill } from './useSAMFormAutoFill';

// Phase 2 Hooks - Practice Problems, Adaptive Content, Socratic Teaching
export { useSAMPracticeProblems } from './useSAMPracticeProblems';
export type { UseSAMPracticeProblemsOptions, UseSAMPracticeProblemsReturn } from './useSAMPracticeProblems';

export { useSAMAdaptiveContent } from './useSAMAdaptiveContent';
export type { UseSAMAdaptiveContentOptions, UseSAMAdaptiveContentReturn } from './useSAMAdaptiveContent';

export { useSAMSocraticDialogue } from './useSAMSocraticDialogue';
export type { UseSAMSocraticDialogueOptions, UseSAMSocraticDialogueReturn } from './useSAMSocraticDialogue';

// Phase 5 Hooks - Agentic AI Capabilities
export { useAgentic } from './useAgentic';
export type {
  UseAgenticOptions,
  UseAgenticReturn,
  Goal,
  SubGoal,
  Plan,
  PlanStep,
  Recommendation,
  RecommendationBatch,
  ProgressReport,
  SkillAssessment,
  CheckIn,
  CreateGoalData,
  CheckInResponse,
} from './useAgentic';

// Phase 5 Hooks - Real-Time Communication
export { useRealtime } from './useRealtime';
export type { UseRealtimeOptions, UseRealtimeReturn } from './useRealtime';

export { usePresence } from './usePresence';
export type { UsePresenceOptions, UsePresenceReturn } from './usePresence';

export { useInterventions } from './useInterventions';
export type { UseInterventionsOptions, UseInterventionsReturn } from './useInterventions';

export { usePushNotifications } from './usePushNotifications';
export type {
  UsePushNotificationsOptions,
  UsePushNotificationsReturn,
  PushNotificationOptions,
  PushPermissionState,
  PushSubscription,
} from './usePushNotifications';

// Phase 5 Hooks - Memory System
export { useSAMMemory } from './useSAMMemory';
export type {
  UseSAMMemoryOptions,
  UseSAMMemoryReturn,
  MemorySearchResult,
  LongTermMemory,
  ConversationTurn,
  MemorySearchOptions,
  StoreMemoryData,
  StoreConversationData,
} from './useSAMMemory';

// Phase 5 Hooks - Tutoring Orchestration
export {
  useTutoringOrchestration,
  useCurrentStep,
  useStepProgress,
  useStepCelebration,
  TutoringOrchestrationProvider,
  useTutoringOrchestrationContext,
} from './useTutoringOrchestration';
export type {
  TutoringStep,
  StepProgress,
  StepTransition,
  PendingConfirmation,
  OrchestrationMetadata,
  TutoringOrchestrationState,
} from './useTutoringOrchestration';

// Phase 5 Hooks - Notifications, Behavior Patterns, Recommendations
export { useNotifications } from './useNotifications';
export type {
  UseNotificationsOptions,
  UseNotificationsReturn,
  SAMNotification,
  NotificationType,
  NotificationFeedback,
} from './useNotifications';

export { useBehaviorPatterns } from './useBehaviorPatterns';
export type {
  UseBehaviorPatternsOptions,
  UseBehaviorPatternsReturn,
  BehaviorPattern,
  PatternType,
} from './useBehaviorPatterns';

export { useRecommendations } from './useRecommendations';
export type {
  UseRecommendationsOptions,
  UseRecommendationsReturn,
  LearningRecommendation,
  RecommendationType,
  RecommendationPriority,
  RecommendationContext,
} from './useRecommendations';

// Phase 6 Hooks - Educational Engines
export { useExamEngine } from './useExamEngine';
export type {
  UseExamEngineOptions,
  UseExamEngineReturn,
  BloomsDistribution,
  DifficultyDistribution,
  ExamGenerationConfig,
  GeneratedQuestion,
  BloomsAnalysisResult,
  GeneratedExamResponse,
  ExamWithProfile,
} from './useExamEngine';

export { useQuestionBank } from './useQuestionBank';
export type {
  UseQuestionBankOptions,
  UseQuestionBankReturn,
  QuestionOption,
  QuestionInput,
  BankQuestion,
  QuestionBankStats,
  Pagination,
  QuestionBankQuery,
} from './useQuestionBank';

export { useInnovationFeatures } from './useInnovationFeatures';
export type {
  UseInnovationFeaturesOptions,
  UseInnovationFeaturesReturn,
  FeaturesStatus,
  CognitiveDimension,
  CognitiveFitnessAssessment,
  FitnessExercise,
  FitnessSession,
  FitnessRecommendation,
  LearningTrait,
  PhenotypeCapability,
  LearningDNA,
  DNAVisualization,
  BuddyPersonality,
  StudyBuddyAI,
  BuddyInteractionType,
  BuddyInteraction,
  BuddyEffectiveness,
  QuantumState,
  QuantumLearningPath,
  PathObservationType,
  ObservationResult,
  PathCollapseResult,
} from './useInnovationFeatures';

export { useMultimodal } from './useMultimodal';
export type {
  UseMultimodalOptions,
  UseMultimodalReturn,
  MultimodalInputType,
  MultimodalFile,
  ProcessingOptions,
  ProcessingStatus,
  QualityAssessment,
  TextExtractionResult,
  AccessibilityData,
  ProcessedInput,
  BatchProcessingResult,
  StorageQuota,
} from './useMultimodal';
