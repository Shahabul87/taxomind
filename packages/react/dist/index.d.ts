import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';
import { ReactNode } from 'react';
import { SAMConfig, SAMContext as SAMContext$1, SAMMessage, SAMSuggestion, SAMAction, BloomsAnalysis, OrchestrationMetadata, SAMState, OrchestrationResult, SAMFormField, SAMFormContext, SAMPageType, SAMAgentOrchestrator, SAMStateMachine } from '@sam-ai/core';
export { BloomsAnalysis, BloomsLevel, OrchestrationResult, SAMAction, SAMConfig, SAMContext as SAMContextType, SAMFormField, SAMMessage, SAMPageType, SAMState, SAMSuggestion } from '@sam-ai/core';
import { PracticeProblem, ProblemEvaluation, PracticeSessionStats, DifficultyRecommendation, PracticeProblemInput, PracticeProblemOutput, ProblemHint, StyleDetectionResult, AdaptedContent, AdaptiveLearnerProfile, ContentToAdapt, AdaptationOptions, ContentInteractionData, SupplementaryResource, SocraticDialogue, SocraticQuestion, DialoguePerformance, DialogueState, SocraticResponse, StartDialogueInput } from '@sam-ai/educational';

/**
 * @sam-ai/react - Types
 */

interface SAMProviderConfig {
    /** Core SAM configuration */
    config?: SAMConfig;
    /** Transport mode for chat execution */
    transport?: 'orchestrator' | 'api';
    /** API transport options (used when transport === 'api') */
    api?: SAMApiTransportOptions;
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
interface SAMApiTransportOptions {
    /** API endpoint for chat requests */
    endpoint: string;
    /** Optional streaming endpoint for SSE responses */
    streamEndpoint?: string;
    /** Extra headers to include */
    headers?: Record<string, string>;
    /** Custom request builder for API payloads */
    buildRequest?: (input: {
        message: string;
        context: SAMContext$1;
        history: SAMMessage[];
    }) => unknown;
    /** Custom response parser */
    parseResponse?: (payload: unknown) => SAMApiTransportResponse | null;
}
interface SAMApiTransportResponse {
    message: string;
    suggestions?: SAMSuggestion[];
    actions?: SAMAction[];
    insights?: Record<string, unknown>;
    blooms?: BloomsAnalysis;
    metadata?: Partial<OrchestrationMetadata>;
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
interface SAMPageLink {
    href: string;
    text?: string;
    ariaLabel?: string;
    title?: string;
    rel?: string;
    target?: string;
}
interface UseSAMPageLinksOptions {
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
interface UseSAMPageLinksReturn {
    links: SAMPageLink[];
    refresh: () => void;
}
interface UseSAMFormDataSyncOptions {
    formName?: string;
    metadata?: Record<string, unknown>;
    fieldMeta?: Record<string, {
        label?: string;
        placeholder?: string;
        type?: string;
        required?: boolean;
        disabled?: boolean;
        readOnly?: boolean;
    }>;
    debounceMs?: number;
    maxDepth?: number;
    enabled?: boolean;
    formType?: string;
    isDirty?: boolean;
    isValid?: boolean;
}
interface UseSAMFormDataSyncReturn {
    sync: () => void;
}
interface SAMFormDataEventDetail {
    formId: string;
    formData: Record<string, unknown>;
    options?: UseSAMFormDataSyncOptions;
    emittedAt?: string;
}
interface UseSAMFormDataEventsOptions {
    enabled?: boolean;
    defaultOptions?: UseSAMFormDataSyncOptions;
    target?: EventTarget;
}
interface UseSAMFormDataEventsReturn {
    lastPayload: SAMFormDataEventDetail | null;
}
interface UseSAMFormAutoDetectOptions {
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
interface UseSAMFormAutoDetectReturn {
    formContext: SAMFormContext | null;
    refresh: () => void;
}
interface UseSAMFormAutoFillOptions {
    triggerEvents?: boolean;
    onFill?: (fieldName: string, value: unknown) => void;
}
interface UseSAMFormAutoFillReturn {
    fillField: (target: string, value: unknown) => boolean;
    resolveField: (target: string) => string | null;
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
declare function SAMProvider({ children, config, transport, api, initialContext, autoDetectContext, debug, onStateChange, onError, }: SAMProviderProps): react_jsx_runtime.JSX.Element;
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
 * @sam-ai/react - useSAMPageLinks Hook
 * Collects visible page links and stores them in SAM page metadata.
 */

declare function useSAMPageLinks(options?: UseSAMPageLinksOptions): UseSAMPageLinksReturn;

/**
 * @sam-ai/react - useSAMFormDataSync Hook
 * Syncs structured form state (objects/arrays) into SAM form context.
 */

declare function useSAMFormDataSync<T = Record<string, unknown>>(formId: string, formData: T, options?: UseSAMFormDataSyncOptions): UseSAMFormDataSyncReturn;

/**
 * @sam-ai/react - useSAMFormDataEvents Hook
 * Listens for form data events and syncs them into SAM context.
 */

declare function useSAMFormDataEvents(options?: UseSAMFormDataEventsOptions): UseSAMFormDataEventsReturn;

/**
 * @sam-ai/react - useSAMFormAutoDetect Hook
 * Auto-detects the most relevant form on the page and syncs it into SAM context.
 */

declare function useSAMFormAutoDetect(options?: UseSAMFormAutoDetectOptions): UseSAMFormAutoDetectReturn;

/**
 * @sam-ai/react - useSAMFormAutoFill Hook
 * Resolves fields by name/label and fills DOM inputs + SAM context.
 */

declare function useSAMFormAutoFill(options?: UseSAMFormAutoFillOptions): UseSAMFormAutoFillReturn;

/**
 * @sam-ai/react - useSAMPracticeProblems Hook
 * React hook for practice problems generation and management
 */

/**
 * Options for the practice problems hook
 */
interface UseSAMPracticeProblemsOptions {
    /** API endpoint for practice problems */
    apiEndpoint?: string;
    /** User ID for personalization */
    userId?: string;
    /** Course ID for context */
    courseId?: string;
    /** Section ID for context */
    sectionId?: string;
    /** Enable adaptive difficulty */
    adaptiveDifficulty?: boolean;
    /** Enable spaced repetition */
    spacedRepetition?: boolean;
    /** Callback when a problem is completed */
    onProblemComplete?: (problem: PracticeProblem, evaluation: ProblemEvaluation) => void;
    /** Callback when session stats update */
    onStatsUpdate?: (stats: PracticeSessionStats) => void;
}
/**
 * Return type for the practice problems hook
 */
interface UseSAMPracticeProblemsReturn {
    /** Current set of problems */
    problems: PracticeProblem[];
    /** Currently active problem */
    currentProblem: PracticeProblem | null;
    /** Current problem index */
    currentIndex: number;
    /** Whether problems are being generated */
    isGenerating: boolean;
    /** Whether an answer is being evaluated */
    isEvaluating: boolean;
    /** Last evaluation result */
    lastEvaluation: ProblemEvaluation | null;
    /** Session statistics */
    sessionStats: PracticeSessionStats | null;
    /** Difficulty recommendation */
    difficultyRecommendation: DifficultyRecommendation | null;
    /** Error message if any */
    error: string | null;
    /** Hints used for current problem */
    hintsUsed: string[];
    /** Generate new practice problems */
    generateProblems: (input: PracticeProblemInput) => Promise<PracticeProblemOutput | null>;
    /** Submit an answer for evaluation */
    submitAnswer: (answer: string) => Promise<ProblemEvaluation | null>;
    /** Get next hint for current problem */
    getNextHint: () => ProblemHint | null;
    /** Move to next problem */
    nextProblem: () => void;
    /** Move to previous problem */
    previousProblem: () => void;
    /** Go to specific problem */
    goToProblem: (index: number) => void;
    /** Skip current problem */
    skipProblem: () => void;
    /** Reset the session */
    resetSession: () => void;
    /** Get adaptive difficulty recommendation */
    getRecommendedDifficulty: () => Promise<DifficultyRecommendation | null>;
    /** Get problems due for review (spaced repetition) */
    getReviewProblems: () => Promise<PracticeProblem[]>;
}
/**
 * Hook for SAM AI Practice Problems
 *
 * @example
 * ```tsx
 * function PracticeComponent() {
 *   const {
 *     problems,
 *     currentProblem,
 *     isGenerating,
 *     generateProblems,
 *     submitAnswer,
 *     getNextHint,
 *     nextProblem,
 *     sessionStats
 *   } = useSAMPracticeProblems({
 *     userId: user.id,
 *     courseId,
 *     adaptiveDifficulty: true
 *   });
 *
 *   const handleGenerate = async () => {
 *     await generateProblems({
 *       topic: 'JavaScript Closures',
 *       difficulty: 'intermediate',
 *       count: 5
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {currentProblem && (
 *         <div>
 *           <h3>{currentProblem.title}</h3>
 *           <p>{currentProblem.statement}</p>
 *           <button onClick={getNextHint}>Get Hint</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useSAMPracticeProblems(options?: UseSAMPracticeProblemsOptions): UseSAMPracticeProblemsReturn;

/**
 * @sam-ai/react - useSAMAdaptiveContent Hook
 * React hook for adaptive content personalization
 */

/**
 * Options for the adaptive content hook
 */
interface UseSAMAdaptiveContentOptions {
    /** API endpoint for adaptive content */
    apiEndpoint?: string;
    /** User ID for personalization */
    userId?: string;
    /** Course ID for context */
    courseId?: string;
    /** Auto-detect learning style */
    autoDetectStyle?: boolean;
    /** Cache duration for profile in milliseconds */
    profileCacheDuration?: number;
    /** Callback when learning style is detected */
    onStyleDetected?: (result: StyleDetectionResult) => void;
    /** Callback when content is adapted */
    onContentAdapted?: (content: AdaptedContent) => void;
}
/**
 * Return type for the adaptive content hook
 */
interface UseSAMAdaptiveContentReturn {
    /** User's learning profile */
    learnerProfile: AdaptiveLearnerProfile | null;
    /** Whether profile is being loaded */
    isLoadingProfile: boolean;
    /** Whether content is being adapted */
    isAdapting: boolean;
    /** Last adapted content */
    adaptedContent: AdaptedContent | null;
    /** Style detection result */
    styleDetection: StyleDetectionResult | null;
    /** Error message if any */
    error: string | null;
    /** Whether learning style has been detected */
    isStyleDetected: boolean;
    /** Get or create learner profile */
    getProfile: () => Promise<AdaptiveLearnerProfile | null>;
    /** Detect learning style from interactions */
    detectStyle: () => Promise<StyleDetectionResult | null>;
    /** Adapt content for the user */
    adaptContent: (content: ContentToAdapt, options?: AdaptationOptions) => Promise<AdaptedContent | null>;
    /** Record a content interaction */
    recordInteraction: (interaction: Omit<ContentInteractionData, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
    /** Get content recommendations */
    getRecommendations: (topic: string, count?: number) => Promise<SupplementaryResource[]>;
    /** Get style-specific tips */
    getStyleTips: () => string[];
    /** Update profile manually */
    updateProfile: (updates: Partial<AdaptiveLearnerProfile>) => Promise<void>;
    /** Clear cached profile */
    clearProfile: () => void;
}
/**
 * Hook for SAM AI Adaptive Content
 *
 * @example
 * ```tsx
 * function LearningComponent() {
 *   const {
 *     learnerProfile,
 *     adaptedContent,
 *     isAdapting,
 *     adaptContent,
 *     detectStyle,
 *     getStyleTips
 *   } = useSAMAdaptiveContent({
 *     userId: user.id,
 *     autoDetectStyle: true,
 *     onStyleDetected: (result) => {
 *       console.log('Learning style:', result.primaryStyle);
 *     }
 *   });
 *
 *   const handleAdapt = async () => {
 *     await adaptContent({
 *       id: 'lesson-1',
 *       type: 'lesson',
 *       content: lessonContent,
 *       topic: 'React Hooks',
 *       currentFormat: 'text',
 *       concepts: ['useState', 'useEffect'],
 *       prerequisites: ['JavaScript basics']
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {learnerProfile && (
 *         <p>Your learning style: {learnerProfile.primaryStyle}</p>
 *       )}
 *       {adaptedContent && (
 *         <div>
 *           {adaptedContent.chunks.map(chunk => (
 *             <div key={chunk.id}>{chunk.content}</div>
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useSAMAdaptiveContent(options?: UseSAMAdaptiveContentOptions): UseSAMAdaptiveContentReturn;

/**
 * @sam-ai/react - useSAMSocraticDialogue Hook
 * React hook for Socratic teaching dialogues
 */

/**
 * Options for the Socratic dialogue hook
 */
interface UseSAMSocraticDialogueOptions {
    /** API endpoint for Socratic dialogues */
    apiEndpoint?: string;
    /** User ID */
    userId?: string;
    /** Course ID for context */
    courseId?: string;
    /** Section ID for context */
    sectionId?: string;
    /** Preferred dialogue style */
    preferredStyle?: 'gentle' | 'challenging' | 'balanced';
    /** Callback when dialogue starts */
    onDialogueStart?: (dialogue: SocraticDialogue) => void;
    /** Callback when question is asked */
    onQuestion?: (question: SocraticQuestion) => void;
    /** Callback when insight is discovered */
    onInsightDiscovered?: (insight: string) => void;
    /** Callback when dialogue completes */
    onDialogueComplete?: (performance: DialoguePerformance) => void;
}
/**
 * Return type for the Socratic dialogue hook
 */
interface UseSAMSocraticDialogueReturn {
    /** Current dialogue */
    dialogue: SocraticDialogue | null;
    /** Current question */
    currentQuestion: SocraticQuestion | null;
    /** Current dialogue state */
    dialogueState: DialogueState | null;
    /** Whether dialogue is active */
    isActive: boolean;
    /** Whether waiting for response */
    isWaiting: boolean;
    /** Whether dialogue is complete */
    isComplete: boolean;
    /** Last response from the engine */
    lastResponse: SocraticResponse | null;
    /** Discovered insights */
    discoveredInsights: string[];
    /** Progress percentage */
    progress: number;
    /** Feedback message */
    feedback: string | null;
    /** Encouragement message */
    encouragement: string | null;
    /** Available hints */
    availableHints: string[];
    /** Error message if any */
    error: string | null;
    /** Start a new dialogue */
    startDialogue: (topic: string, options?: Partial<StartDialogueInput>) => Promise<SocraticResponse | null>;
    /** Submit a response */
    submitResponse: (response: string) => Promise<SocraticResponse | null>;
    /** Request a hint */
    requestHint: () => Promise<string | null>;
    /** Skip current question */
    skipQuestion: () => Promise<SocraticResponse | null>;
    /** End dialogue early */
    endDialogue: () => Promise<{
        synthesis: string;
        performance: DialoguePerformance;
    } | null>;
    /** Get dialogue history */
    getHistory: (limit?: number) => Promise<SocraticDialogue[]>;
    /** Reset dialogue state */
    resetDialogue: () => void;
}
/**
 * Hook for SAM AI Socratic Dialogues
 *
 * @example
 * ```tsx
 * function SocraticLearning() {
 *   const {
 *     dialogue,
 *     currentQuestion,
 *     isActive,
 *     progress,
 *     discoveredInsights,
 *     feedback,
 *     startDialogue,
 *     submitResponse,
 *     requestHint
 *   } = useSAMSocraticDialogue({
 *     userId: user.id,
 *     preferredStyle: 'balanced',
 *     onInsightDiscovered: (insight) => {
 *       toast.success(`Insight discovered: ${insight}`);
 *     }
 *   });
 *
 *   const handleStart = async () => {
 *     await startDialogue('JavaScript Closures', {
 *       targetBloomsLevel: 'analyze'
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {currentQuestion && (
 *         <div>
 *           <p>{currentQuestion.question}</p>
 *           <input onSubmit={(e) => submitResponse(e.target.value)} />
 *           <button onClick={requestHint}>Get Hint</button>
 *         </div>
 *       )}
 *       <progress value={progress} max={100} />
 *       {feedback && <p>{feedback}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useSAMSocraticDialogue(options?: UseSAMSocraticDialogueOptions): UseSAMSocraticDialogueReturn;

/**
 * useAgentic Hook
 * Provides React integration for SAM Agentic AI capabilities
 *
 * Phase 5: Frontend Integration
 * - Goal management (create, list, update, decompose)
 * - Learning recommendations
 * - Progress tracking
 * - Skill assessment
 * - Check-in management
 */
interface Goal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
    priority: 'low' | 'medium' | 'high' | 'critical';
    targetDate?: string;
    progress: number;
    context: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        topicIds?: string[];
        skillIds?: string[];
    };
    currentMastery?: string;
    targetMastery?: string;
    subGoals?: SubGoal[];
    createdAt: string;
    updatedAt: string;
}
interface SubGoal {
    id: string;
    goalId: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    order: number;
    estimatedMinutes?: number;
    completedAt?: string;
}
interface Plan {
    id: string;
    goalId: string;
    userId: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
    dailyMinutes: number;
    startDate: string;
    estimatedEndDate?: string;
    steps: PlanStep[];
    progress: number;
    createdAt: string;
    updatedAt: string;
}
interface PlanStep {
    id: string;
    planId: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    order: number;
    estimatedMinutes: number;
    scheduledDate?: string;
    completedAt?: string;
}
interface Recommendation {
    id: string;
    type: 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
    title: string;
    description: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    estimatedMinutes: number;
    targetUrl?: string;
    metadata?: Record<string, unknown>;
}
interface RecommendationBatch {
    recommendations: Recommendation[];
    totalEstimatedTime: number;
    generatedAt: string;
    context: {
        availableTime?: number;
        currentGoals?: string[];
        recentTopics?: string[];
    };
}
interface ProgressReport {
    userId: string;
    period: 'daily' | 'weekly' | 'monthly';
    totalStudyTime: number;
    sessionsCompleted: number;
    topicsStudied: string[];
    skillsImproved: string[];
    goalsProgress: Array<{
        goalId: string;
        goalTitle: string;
        progressDelta: number;
        currentProgress: number;
    }>;
    strengths: string[];
    areasForImprovement: string[];
    streak: number;
    generatedAt: string;
}
interface SkillAssessment {
    skillId: string;
    skillName: string;
    level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
    score: number;
    confidence: number;
    lastAssessedAt: string;
    trend: 'improving' | 'stable' | 'declining';
}
interface CheckIn {
    id: string;
    userId: string;
    type: string;
    status: 'scheduled' | 'pending' | 'sent' | 'responded' | 'expired';
    message: string;
    questions?: Array<{
        id: string;
        question: string;
        type: 'text' | 'single_choice' | 'multiple_choice' | 'scale' | 'yes_no' | 'emoji';
        options?: string[];
        required?: boolean;
    }>;
    suggestedActions?: Array<{
        id: string;
        title: string;
        description: string;
        type: string;
        priority: string;
    }>;
    scheduledTime: string;
    respondedAt?: string;
}
interface UseAgenticOptions {
    /** Auto-fetch goals on mount */
    autoFetchGoals?: boolean;
    /** Auto-fetch recommendations on mount */
    autoFetchRecommendations?: boolean;
    /** Auto-fetch pending check-ins on mount */
    autoFetchCheckIns?: boolean;
    /** Available time for recommendations (minutes) */
    availableTime?: number;
    /** Refresh interval for recommendations (ms) */
    recommendationRefreshInterval?: number;
}
interface UseAgenticReturn {
    goals: Goal[];
    isLoadingGoals: boolean;
    fetchGoals: (status?: string) => Promise<void>;
    createGoal: (data: CreateGoalData) => Promise<Goal | null>;
    updateGoal: (goalId: string, data: Partial<CreateGoalData>) => Promise<Goal | null>;
    decomposeGoal: (goalId: string) => Promise<Goal | null>;
    deleteGoal: (goalId: string) => Promise<boolean>;
    plans: Plan[];
    isLoadingPlans: boolean;
    fetchPlans: (goalId?: string) => Promise<void>;
    createPlan: (goalId: string, dailyMinutes?: number) => Promise<Plan | null>;
    startPlan: (planId: string) => Promise<boolean>;
    pausePlan: (planId: string) => Promise<boolean>;
    resumePlan: (planId: string) => Promise<boolean>;
    recommendations: RecommendationBatch | null;
    isLoadingRecommendations: boolean;
    fetchRecommendations: (availableTime?: number) => Promise<void>;
    dismissRecommendation: (recommendationId: string) => void;
    progressReport: ProgressReport | null;
    isLoadingProgress: boolean;
    fetchProgressReport: (period?: 'daily' | 'weekly' | 'monthly') => Promise<void>;
    skills: SkillAssessment[];
    isLoadingSkills: boolean;
    fetchSkillMap: () => Promise<void>;
    checkIns: CheckIn[];
    isLoadingCheckIns: boolean;
    fetchCheckIns: (status?: string) => Promise<void>;
    respondToCheckIn: (checkInId: string, response: CheckInResponse) => Promise<boolean>;
    dismissCheckIn: (checkInId: string) => Promise<boolean>;
    error: string | null;
    clearError: () => void;
}
interface CreateGoalData {
    title: string;
    description?: string;
    targetDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    topicIds?: string[];
    skillIds?: string[];
    currentMastery?: string;
    targetMastery?: string;
}
interface CheckInResponse {
    answers: Array<{
        questionId: string;
        answer: string | string[] | number | boolean;
    }>;
    selectedActions?: string[];
    feedback?: string;
    emotionalState?: string;
}
declare function useAgentic(options?: UseAgenticOptions): UseAgenticReturn;

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
 * @sam-ai/react - Form data event utilities
 * Lightweight event bridge for syncing external form state into SAM.
 */

declare const SAM_FORM_DATA_EVENT = "sam:form-data";
declare function emitSAMFormData(detail: SAMFormDataEventDetail, target?: EventTarget): void;

/**
 * @sam-ai/react
 * React hooks and providers for SAM AI Tutor
 *
 * @packageDocumentation
 */

declare const VERSION = "0.1.0";

export { type CheckIn, type CheckInResponse, type ContextDetectorOptions, type CreateGoalData, type FormAutoFillOptions, type FormSyncOptions, type Goal, type PageContextDetection, type Plan, type PlanStep, type ProgressReport, type Recommendation, type RecommendationBatch, type SAMApiTransportOptions, type SAMApiTransportResponse, SAMContext, type SAMFormDataEventDetail, type SAMPageLink, SAMProvider, type SAMProviderConfig, type SAMProviderState, SAM_FORM_DATA_EVENT, type SkillAssessment, type SubGoal, type UseAgenticOptions, type UseAgenticReturn, type UseSAMActionsReturn, type UseSAMAdaptiveContentOptions, type UseSAMAdaptiveContentReturn, type UseSAMAnalysisReturn, type UseSAMChatReturn, type UseSAMContextReturn, type UseSAMFormAutoDetectOptions, type UseSAMFormAutoDetectReturn, type UseSAMFormAutoFillOptions, type UseSAMFormAutoFillReturn, type UseSAMFormDataEventsOptions, type UseSAMFormDataEventsReturn, type UseSAMFormDataSyncOptions, type UseSAMFormDataSyncReturn, type UseSAMFormReturn, type UseSAMPageLinksOptions, type UseSAMPageLinksReturn, type UseSAMPracticeProblemsOptions, type UseSAMPracticeProblemsReturn, type UseSAMReturn, type UseSAMSocraticDialogueOptions, type UseSAMSocraticDialogueReturn, VERSION, contextDetector, createContextDetector, emitSAMFormData, getCapabilities, hasCapability, useAgentic, useSAM, useSAMActions, useSAMAdaptiveContent, useSAMAnalysis, useSAMAutoContext, useSAMChat, useSAMContext, useSAMForm, useSAMFormAutoDetect, useSAMFormAutoFill, useSAMFormDataEvents, useSAMFormDataSync, useSAMFormSync, useSAMPageContext, useSAMPageLinks, useSAMPracticeProblems, useSAMSocraticDialogue };
