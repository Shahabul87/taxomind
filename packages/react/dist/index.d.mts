import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';
import { ReactNode } from 'react';
import { SAMConfig, SAMContext as SAMContext$1, SAMState, SAMMessage, OrchestrationResult, SAMFormField, BloomsAnalysis, SAMSuggestion, SAMAction, SAMPageType, SAMAgentOrchestrator, SAMStateMachine } from '@sam-ai/core';
export { BloomsAnalysis, BloomsLevel, OrchestrationResult, SAMAction, SAMConfig, SAMContext as SAMContextType, SAMFormField, SAMMessage, SAMPageType, SAMState, SAMSuggestion } from '@sam-ai/core';

/**
 * @sam-ai/react - Types
 */

interface SAMProviderConfig {
    /** Core SAM configuration */
    config: SAMConfig;
    /** Initial context (optional) */
    initialContext?: Partial<SAMContext$1>;
    /** Enable auto-context detection from URL/DOM */
    autoDetectContext?: boolean;
    /** Enable debug logging */
    debug?: boolean;
    /** Callback when SAM state changes */
    onStateChange?: (state: SAMState) => void;
    /** Callback when error occurs */
    onError?: (error: Error) => void;
}
interface SAMProviderState {
    /** Current SAM context */
    context: SAMContext$1;
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
interface UseSAMReturn extends SAMProviderState {
    open: () => void;
    close: () => void;
    toggle: () => void;
    sendMessage: (content: string) => Promise<OrchestrationResult | null>;
    clearMessages: () => void;
    clearError: () => void;
    updateContext: (updates: Partial<SAMContext$1>) => void;
    updatePage: (page: Partial<SAMContext$1['page']>) => void;
    updateForm: (fields: Record<string, SAMFormField>) => void;
    analyze: (query?: string) => Promise<OrchestrationResult | null>;
    getBloomsAnalysis: () => BloomsAnalysis | null;
    suggestions: SAMSuggestion[];
    actions: SAMAction[];
    executeAction: (action: SAMAction) => Promise<void>;
}
interface UseSAMContextReturn {
    context: SAMContext$1;
    updateContext: (updates: Partial<SAMContext$1>) => void;
    updatePage: (page: Partial<SAMContext$1['page']>) => void;
    updateUser: (user: Partial<SAMContext$1['user']>) => void;
    detectPageContext: () => void;
}
interface UseSAMChatReturn {
    messages: SAMMessage[];
    isProcessing: boolean;
    isStreaming: boolean;
    sendMessage: (content: string) => Promise<OrchestrationResult | null>;
    clearMessages: () => void;
    suggestions: SAMSuggestion[];
}
interface UseSAMActionsReturn {
    actions: SAMAction[];
    executeAction: (action: SAMAction) => Promise<void>;
    isExecuting: boolean;
    lastActionResult: unknown;
}
interface UseSAMFormReturn {
    fields: Record<string, SAMFormField>;
    updateFields: (fields: Record<string, SAMFormField>) => void;
    syncFormToSAM: (formElement: HTMLFormElement) => void;
    autoFillField: (fieldName: string, value: unknown) => void;
    getFieldSuggestions: (fieldName: string) => Promise<string[]>;
}
interface UseSAMAnalysisReturn {
    analyze: (query?: string) => Promise<OrchestrationResult | null>;
    isAnalyzing: boolean;
    lastAnalysis: OrchestrationResult | null;
    bloomsAnalysis: BloomsAnalysis | null;
}
interface PageContextDetection {
    type: SAMPageType;
    entityId?: string;
    parentEntityId?: string;
    path: string;
    capabilities: string[];
    breadcrumb: string[];
}
interface ContextDetectorOptions {
    /** Custom route patterns for page type detection */
    routePatterns?: Record<string, SAMPageType>;
    /** Custom entity ID extractors */
    entityExtractors?: Record<SAMPageType, (path: string) => string | undefined>;
    /** Whether to detect from DOM elements */
    detectFromDOM?: boolean;
    /** Custom capability mappings */
    capabilityMappings?: Record<SAMPageType, string[]>;
}
interface FormSyncOptions {
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
interface FormAutoFillOptions {
    /** Field ID to auto-fill */
    fieldId: string;
    /** Whether to trigger change events */
    triggerEvents?: boolean;
    /** Animation for auto-fill */
    animate?: boolean;
}

interface SAMContextValue extends UseSAMReturn {
    orchestrator: SAMAgentOrchestrator | null;
    stateMachine: SAMStateMachine | null;
}
declare const SAMContext: react.Context<SAMContextValue | null>;
interface SAMProviderProps extends SAMProviderConfig {
    children: ReactNode;
}
declare function SAMProvider({ children, config, initialContext, autoDetectContext, debug, onStateChange, onError, }: SAMProviderProps): react_jsx_runtime.JSX.Element;
declare function useSAMContext(): SAMContextValue;

/**
 * @sam-ai/react - useSAM Hook
 * Main hook for SAM AI Tutor functionality
 */

/**
 * Main hook for SAM AI Tutor functionality
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isOpen,
 *     messages,
 *     sendMessage,
 *     open,
 *     close,
 *   } = useSAM();
 *
 *   return (
 *     <div>
 *       <button onClick={open}>Open SAM</button>
 *       {isOpen && (
 *         <div>
 *           {messages.map(msg => (
 *             <div key={msg.id}>{msg.content}</div>
 *           ))}
 *           <input onSubmit={(e) => sendMessage(e.target.value)} />
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useSAM(): UseSAMReturn;

/**
 * @sam-ai/react - useSAMChat Hook
 * Hook for chat-specific functionality
 */

/**
 * Hook for SAM chat functionality
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { messages, sendMessage, isProcessing, suggestions } = useSAMChat();
 *
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *       {isProcessing && <span>Thinking...</span>}
 *       <div>
 *         {suggestions.map(s => (
 *           <button key={s.id} onClick={() => sendMessage(s.text)}>
 *             {s.label}
 *           </button>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
declare function useSAMChat(): UseSAMChatReturn;

/**
 * @sam-ai/react - useSAMActions Hook
 * Hook for SAM action execution
 */

/**
 * Hook for SAM action execution
 *
 * @example
 * ```tsx
 * function ActionsComponent() {
 *   const { actions, executeAction, isExecuting } = useSAMActions();
 *
 *   return (
 *     <div>
 *       {actions.map(action => (
 *         <button
 *           key={action.id}
 *           onClick={() => executeAction(action)}
 *           disabled={isExecuting}
 *         >
 *           {action.label}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useSAMActions(): UseSAMActionsReturn;

/**
 * @sam-ai/react - useSAMPageContext Hook
 * Hook for page context management
 */

/**
 * Hook for SAM page context management
 *
 * @example
 * ```tsx
 * function PageComponent() {
 *   const { context, updatePage, detectPageContext } = useSAMPageContext();
 *
 *   useEffect(() => {
 *     // Auto-detect context on mount
 *     detectPageContext();
 *   }, []);
 *
 *   return (
 *     <div>
 *       <p>Current page: {context.page.type}</p>
 *       <button onClick={() => updatePage({ type: 'dashboard' })}>
 *         Set Dashboard
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
declare function useSAMPageContext(): UseSAMContextReturn;
/**
 * Hook to auto-detect and sync page context on route changes
 */
declare function useSAMAutoContext(enabled?: boolean): void;

/**
 * @sam-ai/react - useSAMAnalysis Hook
 * Hook for content analysis functionality
 */

/**
 * Hook for SAM analysis functionality
 *
 * @example
 * ```tsx
 * function AnalysisComponent() {
 *   const { analyze, isAnalyzing, bloomsAnalysis } = useSAMAnalysis();
 *
 *   return (
 *     <div>
 *       <button onClick={() => analyze('Analyze this content')} disabled={isAnalyzing}>
 *         {isAnalyzing ? 'Analyzing...' : 'Analyze'}
 *       </button>
 *       {bloomsAnalysis && (
 *         <div>
 *           <p>Dominant Level: {bloomsAnalysis.dominantLevel}</p>
 *           <p>Cognitive Depth: {bloomsAnalysis.cognitiveDepth}%</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useSAMAnalysis(): UseSAMAnalysisReturn;

/**
 * @sam-ai/react - useSAMForm Hook
 * Hook for form synchronization with SAM
 */

/**
 * Hook for SAM form synchronization
 *
 * @example
 * ```tsx
 * function FormComponent() {
 *   const formRef = useRef<HTMLFormElement>(null);
 *   const { fields, syncFormToSAM, getFieldSuggestions } = useSAMForm();
 *
 *   useEffect(() => {
 *     if (formRef.current) {
 *       syncFormToSAM(formRef.current);
 *     }
 *   }, []);
 *
 *   return (
 *     <form ref={formRef}>
 *       <input name="title" placeholder="Course Title" />
 *       <textarea name="description" placeholder="Description" />
 *     </form>
 *   );
 * }
 * ```
 */
declare function useSAMForm(): UseSAMFormReturn;
/**
 * Hook for auto-syncing a form with SAM
 */
declare function useSAMFormSync(options: FormSyncOptions): void;

/**
 * @sam-ai/react - Context Detector Utilities
 * Auto-detection of page context from URL and DOM
 */

/**
 * Create a context detector with custom options
 */
declare function createContextDetector(options?: ContextDetectorOptions): {
    detectFromPath: (path: string) => PageContextDetection;
    detectFromDOM: () => Partial<PageContextDetection>;
    detect: () => PageContextDetection;
};
/**
 * Get capabilities for a page type
 */
declare function getCapabilities(pageType: SAMPageType): string[];
/**
 * Check if a capability is available for the current context
 */
declare function hasCapability(context: SAMContext$1, capability: string): boolean;
declare const contextDetector: {
    detectFromPath: (path: string) => PageContextDetection;
    detectFromDOM: () => Partial<PageContextDetection>;
    detect: () => PageContextDetection;
};

/**
 * @sam-ai/react
 * React hooks and providers for SAM AI Tutor
 *
 * @packageDocumentation
 */

declare const VERSION = "0.1.0";

export { type ContextDetectorOptions, type FormAutoFillOptions, type FormSyncOptions, type PageContextDetection, SAMContext, SAMProvider, type SAMProviderConfig, type SAMProviderState, type UseSAMActionsReturn, type UseSAMAnalysisReturn, type UseSAMChatReturn, type UseSAMContextReturn, type UseSAMFormReturn, type UseSAMReturn, VERSION, contextDetector, createContextDetector, getCapabilities, hasCapability, useSAM, useSAMActions, useSAMAnalysis, useSAMAutoContext, useSAMChat, useSAMContext, useSAMForm, useSAMFormSync, useSAMPageContext };
