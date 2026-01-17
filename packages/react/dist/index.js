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
export { useSAM, useSAMChat, useSAMActions, useSAMPageContext, useSAMAutoContext, useSAMAnalysis, useSAMForm, useSAMFormSync, useSAMPageLinks, useSAMFormDataSync, useSAMFormDataEvents, useSAMFormAutoDetect, useSAMFormAutoFill, 
// Phase 2 Hooks
useSAMPracticeProblems, useSAMAdaptiveContent, useSAMSocraticDialogue, 
// Phase 5 Hooks - Agentic AI
useAgentic, 
// Behavior & Recommendations Hooks
useBehaviorPatterns, useRecommendations, 
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
useTutoringOrchestration, useCurrentStep, useStepProgress, useStepCelebration, TutoringOrchestrationProvider, useTutoringOrchestrationContext, } from './hooks';
// ============================================================================
// UTILITIES
// ============================================================================
export { createContextDetector, contextDetector, getCapabilities, hasCapability, SAM_FORM_DATA_EVENT, emitSAMFormData, } from './utils';
// ============================================================================
// VERSION
// ============================================================================
export const VERSION = '0.1.0';
