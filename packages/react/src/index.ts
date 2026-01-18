/**
 * @sam-ai/react
 * React hooks and providers for SAM AI Tutor
 *
 * @packageDocumentation
 */

// ============================================================================
// CONTEXT & PROVIDER
// ============================================================================

export { SAMProvider, useSAMContext, SAMContext } from './context';

// ============================================================================
// HOOKS
// ============================================================================

export {
  useSAM,
  useSAMChat,
  useSAMActions,
  useSAMPageContext,
  useSAMAutoContext,
  useSAMAnalysis,
  useSAMForm,
  useSAMFormSync,
  useSAMPageLinks,
  useSAMFormDataSync,
  useSAMFormDataEvents,
  useSAMFormAutoDetect,
  useSAMFormAutoFill,
  // Phase 2 Hooks
  useSAMPracticeProblems,
  useSAMAdaptiveContent,
  useSAMSocraticDialogue,
  // Phase 5 Hooks - Agentic AI
  useAgentic,
  // Behavior & Recommendations Hooks
  useBehaviorPatterns,
  useRecommendations,
  // Notifications Hook
  useNotifications,
  // Memory Hook
  useSAMMemory,
  // Push Notifications Hook
  usePushNotifications,
  // Presence Tracking Hook
  usePresence,
  // Real-time Communication Hook
  useRealtime,
  // Interventions Hook
  useInterventions,
  // Tutoring Orchestration Hook & Provider
  useTutoringOrchestration,
  useCurrentStep,
  useStepProgress,
  useStepCelebration,
  TutoringOrchestrationProvider,
  useTutoringOrchestrationContext,
  // Phase 6 Hooks - Educational Engines
  useExamEngine,
  useQuestionBank,
  useInnovationFeatures,
  useMultimodal,
} from './hooks';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  createContextDetector,
  contextDetector,
  getCapabilities,
  hasCapability,
  SAM_FORM_DATA_EVENT,
  emitSAMFormData,
} from './utils';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Provider types
  SAMProviderConfig,
  SAMProviderState,
  SAMApiTransportOptions,
  SAMApiTransportResponse,

  // Hook return types
  UseSAMReturn,
  UseSAMContextReturn,
  UseSAMChatReturn,
  UseSAMActionsReturn,
  UseSAMFormReturn,
  UseSAMAnalysisReturn,
  SAMPageLink,
  UseSAMPageLinksOptions,
  UseSAMPageLinksReturn,
  UseSAMFormDataSyncOptions,
  UseSAMFormDataSyncReturn,
  SAMFormDataEventDetail,
  UseSAMFormDataEventsOptions,
  UseSAMFormDataEventsReturn,
  UseSAMFormAutoDetectOptions,
  UseSAMFormAutoDetectReturn,
  UseSAMFormAutoFillOptions,
  UseSAMFormAutoFillReturn,

  // Context detection types
  PageContextDetection,
  ContextDetectorOptions,

  // Form sync types
  FormSyncOptions,
  FormAutoFillOptions,
} from './types';

// Phase 2 Hook types
export type {
  UseSAMPracticeProblemsOptions,
  UseSAMPracticeProblemsReturn,
  UseSAMAdaptiveContentOptions,
  UseSAMAdaptiveContentReturn,
  UseSAMSocraticDialogueOptions,
  UseSAMSocraticDialogueReturn,
} from './hooks';

// Phase 5 Hook types - Agentic AI
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
} from './hooks';

// Behavior Pattern types
export type {
  UseBehaviorPatternsOptions,
  UseBehaviorPatternsReturn,
  BehaviorPattern,
  PatternType,
} from './hooks';

// Recommendations types
export type {
  UseRecommendationsOptions,
  UseRecommendationsReturn,
  LearningRecommendation,
  RecommendationType,
  RecommendationPriority,
  RecommendationContext,
} from './hooks';

// Memory types
export type {
  MemorySearchResult,
  LongTermMemory,
  ConversationTurn,
  MemorySearchOptions,
  StoreMemoryData,
  StoreConversationData,
} from './hooks';

// Push notification types
export type {
  PushPermissionState,
  PushSubscription,
  PushNotificationOptions,
} from './hooks';

// Presence tracking types
export type {
  UsePresenceOptions,
  UsePresenceReturn,
} from './hooks';

// Notifications types
export type {
  UseNotificationsOptions,
  UseNotificationsReturn,
  SAMNotification,
  NotificationType,
  NotificationFeedback,
} from './hooks';

// Real-time communication types
export type {
  UseRealtimeOptions,
  UseRealtimeReturn,
} from './hooks';

// Interventions types
export type {
  UseInterventionsOptions,
  UseInterventionsReturn,
} from './hooks';

// Tutoring orchestration types
export type {
  TutoringStep,
  StepProgress,
  StepTransition,
  PendingConfirmation,
  OrchestrationMetadata,
  TutoringOrchestrationState,
} from './hooks';

// Phase 6 Hook types - Educational Engines
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
} from './hooks';

export type {
  UseQuestionBankOptions,
  UseQuestionBankReturn,
  QuestionOption,
  QuestionInput,
  BankQuestion,
  QuestionBankStats,
  Pagination,
  QuestionBankQuery,
} from './hooks';

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
} from './hooks';

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
} from './hooks';

// ============================================================================
// RE-EXPORT CORE TYPES (for convenience)
// ============================================================================

export type {
  SAMContext as SAMContextType,
  SAMConfig,
  SAMMessage,
  SAMAction,
  SAMSuggestion,
  SAMFormField,
  SAMPageType,
  SAMState,
  OrchestrationResult,
  BloomsAnalysis,
  BloomsLevel,
} from '@sam-ai/core';

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '0.1.0';
