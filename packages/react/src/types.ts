/**
 * @sam-ai/react - Types
 */

import type {
  SAMContext,
  SAMConfig,
  SAMMessage,
  SAMAction,
  SAMSuggestion,
  SAMFormField,
  SAMFormContext,
  SAMPageType,
  OrchestrationResult,
  BloomsAnalysis,
  SAMState,
  OrchestrationMetadata,
} from '@sam-ai/core';

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export interface SAMProviderConfig {
  /** Core SAM configuration */
  config?: SAMConfig;
  /** Transport mode for chat execution */
  transport?: 'orchestrator' | 'api';
  /** API transport options (used when transport === 'api') */
  api?: SAMApiTransportOptions;
  /** Initial context (optional) */
  initialContext?: Partial<SAMContext>;
  /** Enable auto-context detection from URL/DOM */
  autoDetectContext?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Callback when SAM state changes */
  onStateChange?: (state: SAMState) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

export interface SAMApiTransportOptions {
  /** API endpoint for chat requests */
  endpoint: string;
  /** Optional streaming endpoint for SSE responses */
  streamEndpoint?: string;
  /** Extra headers to include */
  headers?: Record<string, string>;
  /** Custom request builder for API payloads */
  buildRequest?: (input: {
    message: string;
    context: SAMContext;
    history: SAMMessage[];
  }) => unknown;
  /** Custom response parser */
  parseResponse?: (payload: unknown) => SAMApiTransportResponse | null;
}

export interface SAMApiTransportResponse {
  message: string;
  suggestions?: SAMSuggestion[];
  actions?: SAMAction[];
  insights?: Record<string, unknown>;
  blooms?: BloomsAnalysis;
  metadata?: Partial<OrchestrationMetadata>;
}

export interface SAMProviderState {
  /** Current SAM context */
  context: SAMContext;
  /** Current state machine state */
  state: SAMState;
  /** Whether SAM is open/visible */
  isOpen: boolean;
  /** Whether SAM is processing a request */
  isProcessing: boolean;
  /** Whether SAM is streaming a response */
  isStreaming: boolean;
  /** Current conversation messages */
  messages: SAMMessage[];
  /** Last error if any */
  error: Error | null;
  /** Last orchestration result */
  lastResult: OrchestrationResult | null;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseSAMReturn extends SAMProviderState {
  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (content: string) => Promise<OrchestrationResult | null>;
  clearMessages: () => void;
  clearError: () => void;

  // Context updates
  updateContext: (updates: Partial<SAMContext>) => void;
  updatePage: (page: Partial<SAMContext['page']>) => void;
  updateForm: (fields: Record<string, SAMFormField>) => void;

  // Analysis
  analyze: (query?: string) => Promise<OrchestrationResult | null>;
  getBloomsAnalysis: () => BloomsAnalysis | null;

  // Suggestions & Actions
  suggestions: SAMSuggestion[];
  actions: SAMAction[];
  executeAction: (action: SAMAction) => Promise<void>;
}

export interface UseSAMContextReturn {
  context: SAMContext;
  updateContext: (updates: Partial<SAMContext>) => void;
  updatePage: (page: Partial<SAMContext['page']>) => void;
  updateUser: (user: Partial<SAMContext['user']>) => void;
  detectPageContext: () => void;
}

export interface UseSAMChatReturn {
  messages: SAMMessage[];
  isProcessing: boolean;
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<OrchestrationResult | null>;
  clearMessages: () => void;
  suggestions: SAMSuggestion[];
}

export interface UseSAMActionsReturn {
  actions: SAMAction[];
  executeAction: (action: SAMAction) => Promise<void>;
  isExecuting: boolean;
  lastActionResult: unknown;
}

export interface UseSAMFormReturn {
  fields: Record<string, SAMFormField>;
  updateFields: (fields: Record<string, SAMFormField>) => void;
  syncFormToSAM: (formElement: HTMLFormElement) => void;
  autoFillField: (fieldName: string, value: unknown) => void;
  getFieldSuggestions: (fieldName: string) => Promise<string[]>;
}

export interface SAMPageLink {
  href: string;
  text?: string;
  ariaLabel?: string;
  title?: string;
  rel?: string;
  target?: string;
}

export interface UseSAMPageLinksOptions {
  enabled?: boolean;
  selector?: string;
  maxLinks?: number;
  includeHidden?: boolean;
  includeText?: boolean;
  includeAriaLabel?: boolean;
  includeTitle?: boolean;
  includeRel?: boolean;
  includeTarget?: boolean;
  dedupe?: boolean;
  throttleMs?: number;
  onLinks?: (links: SAMPageLink[]) => void;
}

export interface UseSAMPageLinksReturn {
  links: SAMPageLink[];
  refresh: () => void;
}

export interface UseSAMFormDataSyncOptions {
  formName?: string;
  metadata?: Record<string, unknown>;
  fieldMeta?: Record<
    string,
    {
      label?: string;
      placeholder?: string;
      type?: string;
      required?: boolean;
      disabled?: boolean;
      readOnly?: boolean;
    }
  >;
  debounceMs?: number;
  maxDepth?: number;
  enabled?: boolean;
  formType?: string;
  isDirty?: boolean;
  isValid?: boolean;
}

export interface UseSAMFormDataSyncReturn {
  sync: () => void;
}

export interface SAMFormDataEventDetail {
  formId: string;
  formData: Record<string, unknown>;
  options?: UseSAMFormDataSyncOptions;
  emittedAt?: string;
}

export interface UseSAMFormDataEventsOptions {
  enabled?: boolean;
  defaultOptions?: UseSAMFormDataSyncOptions;
  target?: EventTarget;
}

export interface UseSAMFormDataEventsReturn {
  lastPayload: SAMFormDataEventDetail | null;
}

export interface UseSAMFormAutoDetectOptions {
  enabled?: boolean;
  selector?: string;
  includeHidden?: boolean;
  maxFields?: number;
  debounceMs?: number;
  preferFocused?: boolean;
  overrideExisting?: boolean;
  metadata?: Record<string, unknown>;
  formType?: string;
}

export interface UseSAMFormAutoDetectReturn {
  formContext: SAMFormContext | null;
  refresh: () => void;
}

export interface UseSAMFormAutoFillOptions {
  triggerEvents?: boolean;
  onFill?: (fieldName: string, value: unknown) => void;
}

export interface UseSAMFormAutoFillReturn {
  fillField: (target: string, value: unknown) => boolean;
  resolveField: (target: string) => string | null;
}

export interface UseSAMAnalysisReturn {
  analyze: (query?: string) => Promise<OrchestrationResult | null>;
  isAnalyzing: boolean;
  lastAnalysis: OrchestrationResult | null;
  bloomsAnalysis: BloomsAnalysis | null;
}

// ============================================================================
// CONTEXT DETECTION TYPES
// ============================================================================

export interface PageContextDetection {
  type: SAMPageType;
  entityId?: string;
  parentEntityId?: string;
  path: string;
  capabilities: string[];
  breadcrumb: string[];
}

export interface ContextDetectorOptions {
  /** Custom route patterns for page type detection */
  routePatterns?: Record<string, SAMPageType>;
  /** Custom entity ID extractors */
  entityExtractors?: Record<SAMPageType, (path: string) => string | undefined>;
  /** Whether to detect from DOM elements */
  detectFromDOM?: boolean;
  /** Custom capability mappings */
  capabilityMappings?: Record<SAMPageType, string[]>;
}

// ============================================================================
// FORM SYNC TYPES
// ============================================================================

export interface FormSyncOptions {
  /** Form element or selector */
  form: HTMLFormElement | string;
  /** Whether to auto-sync on form changes */
  autoSync?: boolean;
  /** Debounce delay for auto-sync (ms) */
  debounceMs?: number;
  /** Fields to exclude from sync */
  excludeFields?: string[];
  /** Custom field type detection */
  fieldTypeDetector?: (element: HTMLElement) => SAMFormField['type'];
}

export interface FormAutoFillOptions {
  /** Field ID to auto-fill */
  fieldId: string;
  /** Whether to trigger change events */
  triggerEvents?: boolean;
  /** Animation for auto-fill */
  animate?: boolean;
}
