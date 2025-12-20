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
} from './hooks';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  createContextDetector,
  contextDetector,
  getCapabilities,
  hasCapability,
} from './utils';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Provider types
  SAMProviderConfig,
  SAMProviderState,

  // Hook return types
  UseSAMReturn,
  UseSAMContextReturn,
  UseSAMChatReturn,
  UseSAMActionsReturn,
  UseSAMFormReturn,
  UseSAMAnalysisReturn,

  // Context detection types
  PageContextDetection,
  ContextDetectorOptions,

  // Form sync types
  FormSyncOptions,
  FormAutoFillOptions,
} from './types';

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
