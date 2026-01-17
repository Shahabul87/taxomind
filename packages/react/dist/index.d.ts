/**
 * @sam-ai/react
 * React hooks and providers for SAM AI Tutor
 *
 * @packageDocumentation
 */
export { SAMProvider, useSAMContext, SAMContext } from './context';
export { useSAM, useSAMChat, useSAMActions, useSAMPageContext, useSAMAutoContext, useSAMAnalysis, useSAMForm, useSAMFormSync, useSAMPageLinks, useSAMFormDataSync, useSAMFormDataEvents, useSAMFormAutoDetect, useSAMFormAutoFill, useSAMPracticeProblems, useSAMAdaptiveContent, useSAMSocraticDialogue, useAgentic, useBehaviorPatterns, useRecommendations, useNotifications, useSAMMemory, usePushNotifications, usePresence, useRealtime, useInterventions, useTutoringOrchestration, useCurrentStep, useStepProgress, useStepCelebration, TutoringOrchestrationProvider, useTutoringOrchestrationContext, } from './hooks';
export { createContextDetector, contextDetector, getCapabilities, hasCapability, SAM_FORM_DATA_EVENT, emitSAMFormData, } from './utils';
export type { SAMProviderConfig, SAMProviderState, SAMApiTransportOptions, SAMApiTransportResponse, UseSAMReturn, UseSAMContextReturn, UseSAMChatReturn, UseSAMActionsReturn, UseSAMFormReturn, UseSAMAnalysisReturn, SAMPageLink, UseSAMPageLinksOptions, UseSAMPageLinksReturn, UseSAMFormDataSyncOptions, UseSAMFormDataSyncReturn, SAMFormDataEventDetail, UseSAMFormDataEventsOptions, UseSAMFormDataEventsReturn, UseSAMFormAutoDetectOptions, UseSAMFormAutoDetectReturn, UseSAMFormAutoFillOptions, UseSAMFormAutoFillReturn, PageContextDetection, ContextDetectorOptions, FormSyncOptions, FormAutoFillOptions, } from './types';
export type { UseSAMPracticeProblemsOptions, UseSAMPracticeProblemsReturn, UseSAMAdaptiveContentOptions, UseSAMAdaptiveContentReturn, UseSAMSocraticDialogueOptions, UseSAMSocraticDialogueReturn, } from './hooks';
export type { UseAgenticOptions, UseAgenticReturn, Goal, SubGoal, Plan, PlanStep, Recommendation, RecommendationBatch, ProgressReport, SkillAssessment, CheckIn, CreateGoalData, CheckInResponse, } from './hooks';
export type { UseBehaviorPatternsOptions, UseBehaviorPatternsReturn, BehaviorPattern, PatternType, } from './hooks';
export type { UseRecommendationsOptions, UseRecommendationsReturn, LearningRecommendation, RecommendationType, RecommendationPriority, RecommendationContext, } from './hooks';
export type { MemorySearchResult, LongTermMemory, ConversationTurn, MemorySearchOptions, StoreMemoryData, StoreConversationData, } from './hooks';
export type { PushPermissionState, PushSubscription, PushNotificationOptions, } from './hooks';
export type { UsePresenceOptions, UsePresenceReturn, } from './hooks';
export type { UseNotificationsOptions, UseNotificationsReturn, SAMNotification, NotificationType, NotificationFeedback, } from './hooks';
export type { UseRealtimeOptions, UseRealtimeReturn, } from './hooks';
export type { UseInterventionsOptions, UseInterventionsReturn, } from './hooks';
export type { TutoringStep, StepProgress, StepTransition, PendingConfirmation, OrchestrationMetadata, TutoringOrchestrationState, } from './hooks';
export type { SAMContext as SAMContextType, SAMConfig, SAMMessage, SAMAction, SAMSuggestion, SAMFormField, SAMPageType, SAMState, OrchestrationResult, BloomsAnalysis, BloomsLevel, } from '@sam-ai/core';
export declare const VERSION = "0.1.0";
//# sourceMappingURL=index.d.ts.map