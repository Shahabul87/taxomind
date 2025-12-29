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
