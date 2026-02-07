import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';
import { ReactNode } from 'react';
import { SAMConfig, SAMContext as SAMContext$1, SAMMessage, SAMSuggestion, SAMAction, BloomsAnalysis, OrchestrationMetadata as OrchestrationMetadata$1, SAMState, OrchestrationResult, SAMFormField, SAMFormContext, SAMPageType, SAMAgentOrchestrator, SAMStateMachine, UseContextGatheringOptions, UseContextGatheringReturn, PageContextSnapshot } from '@sam-ai/core';
export { BloomsAnalysis, BloomsLevel, ContextGatheringOutput, ContextProvider, OrchestrationResult, PageContextSnapshot, SAMAction, SAMConfig, SAMContext as SAMContextType, SAMFormField, SAMMessage, SAMPageType, SAMState, SAMSuggestion, UseContextGatheringOptions, UseContextGatheringReturn } from '@sam-ai/core';
import { PracticeProblem, ProblemEvaluation, PracticeSessionStats, DifficultyRecommendation, PracticeProblemInput, PracticeProblemOutput, ProblemHint, StyleDetectionResult, AdaptedContent, AdaptiveLearnerProfile, ContentToAdapt, AdaptationOptions, ContentInteractionData, SupplementaryResource, SocraticDialogue, SocraticQuestion, DialoguePerformance, DialogueState, SocraticResponse, StartDialogueInput } from '@sam-ai/educational';
import { SAMWebSocketEvent, ConnectionState, ConnectionStats, SAMEventType, ActivityPayload, PresenceStatus, PresenceMetadata, UserPresence, InterventionSurface, InterventionUIState, InterventionQueue, InterventionDisplayConfig, NudgePayload, CelebrationPayload, RecommendationPayload, GoalProgressPayload, StepCompletionPayload } from '@sam-ai/agentic';
import { QuestionType, BloomsLevel, QuestionDifficulty } from '@prisma/client';

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
    metadata?: Partial<OrchestrationMetadata$1>;
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
 * @sam-ai/react - useRealtime Hook
 * React hook for real-time WebSocket communication with SAM AI
 */

interface UseRealtimeOptions {
    /** WebSocket URL (defaults to /api/sam/ws) */
    url?: string;
    /** Auto-connect on mount */
    autoConnect?: boolean;
    /** Auth token for connection */
    authToken?: string;
    /** User ID for presence */
    userId?: string;
    /** Session ID */
    sessionId?: string;
    /** Reconnection settings */
    reconnect?: {
        enabled?: boolean;
        maxAttempts?: number;
        delay?: number;
    };
    /** Heartbeat interval in ms */
    heartbeatInterval?: number;
    /** Event handlers */
    onConnect?: (event: SAMWebSocketEvent) => void;
    onDisconnect?: (reason: string) => void;
    onError?: (error: Error) => void;
    onMessage?: (event: SAMWebSocketEvent) => void;
}
interface UseRealtimeReturn {
    /** Current connection state */
    connectionState: ConnectionState;
    /** Whether connected */
    isConnected: boolean;
    /** Connection statistics */
    stats: ConnectionStats | null;
    /** Last error */
    error: Error | null;
    /** Connect to WebSocket */
    connect: () => void;
    /** Disconnect from WebSocket */
    disconnect: () => void;
    /** Send an event */
    send: <T extends SAMEventType>(type: T, payload: unknown) => void;
    /** Subscribe to event type */
    subscribe: (eventType: SAMEventType, callback: (event: SAMWebSocketEvent) => void) => () => void;
    /** Send activity event */
    sendActivity: (activity: ActivityPayload) => void;
    /** Send heartbeat */
    sendHeartbeat: () => void;
    /** Acknowledge event */
    acknowledge: (eventId: string, action?: 'viewed' | 'clicked' | 'dismissed') => void;
    /** Dismiss event */
    dismiss: (eventId: string, reason?: string) => void;
}
declare function useRealtime(options?: UseRealtimeOptions): UseRealtimeReturn;

/**
 * @sam-ai/react - usePresence Hook
 * React hook for tracking user presence and activity state
 */

interface UsePresenceOptions {
    /** User ID for presence tracking */
    userId: string;
    /** Session ID for tracking */
    sessionId?: string;
    /** Initial presence status */
    initialStatus?: PresenceStatus;
    /** Auto-track page visibility */
    trackVisibility?: boolean;
    /** Auto-track user activity (mouse, keyboard) */
    trackActivity?: boolean;
    /** Idle timeout in ms (default: 60000 = 1 min) */
    idleTimeout?: number;
    /** Away timeout in ms (default: 300000 = 5 min) */
    awayTimeout?: number;
    /** Activity debounce in ms */
    activityDebounce?: number;
    /** WebSocket send function */
    sendActivity?: (activity: ActivityPayload) => void;
    /** Event handlers */
    onStatusChange?: (status: PresenceStatus, previousStatus: PresenceStatus) => void;
    onIdle?: () => void;
    onAway?: () => void;
    onActive?: () => void;
}
interface UsePresenceReturn {
    /** Current presence status */
    status: PresenceStatus;
    /** Whether user is currently active */
    isActive: boolean;
    /** Whether user is idle */
    isIdle: boolean;
    /** Whether user is away */
    isAway: boolean;
    /** Whether user is online (active or idle) */
    isOnline: boolean;
    /** Last activity timestamp */
    lastActivityAt: Date | null;
    /** Presence metadata */
    metadata: PresenceMetadata | null;
    /** Manually set status */
    setStatus: (status: PresenceStatus) => void;
    /** Record activity (resets idle timer) */
    recordActivity: (type?: ActivityPayload['type']) => void;
    /** Update presence metadata */
    updateMetadata: (updates: Partial<PresenceMetadata>) => void;
    /** Current presence state */
    presence: UserPresence | null;
}
declare function usePresence(options: UsePresenceOptions): UsePresenceReturn;

/**
 * @sam-ai/react - useInterventions Hook
 * React hook for managing proactive interventions, nudges, and notifications
 */

interface UseInterventionsOptions {
    /** Maximum visible interventions at once */
    maxVisible?: number;
    /** Auto-dismiss timeout in ms (default: 10000) */
    autoDismissMs?: number;
    /** Enable sound for interventions */
    enableSound?: boolean;
    /** Default surface for interventions */
    defaultSurface?: InterventionSurface;
    /** Event handlers */
    onIntervention?: (intervention: InterventionUIState) => void;
    onDismiss?: (interventionId: string, reason: string) => void;
    onAction?: (interventionId: string, action: string) => void;
    /** Acknowledge function from useRealtime */
    acknowledge?: (eventId: string, action?: 'viewed' | 'clicked' | 'dismissed') => void;
    /** Dismiss function from useRealtime */
    dismissEvent?: (eventId: string, reason?: string) => void;
}
interface UseInterventionsReturn {
    /** Current intervention queue */
    queue: InterventionQueue;
    /** Currently visible interventions */
    visible: InterventionUIState[];
    /** All pending interventions */
    pending: InterventionUIState[];
    /** Add intervention to queue */
    add: (event: SAMWebSocketEvent, config?: Partial<InterventionDisplayConfig>) => void;
    /** Dismiss intervention */
    dismiss: (interventionId: string, reason?: string) => void;
    /** Dismiss all interventions */
    dismissAll: () => void;
    /** Acknowledge intervention was viewed */
    markViewed: (interventionId: string) => void;
    /** Trigger action on intervention */
    triggerAction: (interventionId: string, action: string) => void;
    /** Check if specific intervention type is visible */
    hasVisible: (type: string) => boolean;
    /** Get intervention by ID */
    get: (interventionId: string) => InterventionUIState | undefined;
    /** Latest nudge */
    latestNudge: NudgePayload | null;
    /** Latest celebration */
    latestCelebration: CelebrationPayload | null;
    /** Latest recommendation */
    latestRecommendation: RecommendationPayload | null;
    /** Latest goal progress */
    latestGoalProgress: GoalProgressPayload | null;
    /** Latest step completion */
    latestStepCompletion: StepCompletionPayload | null;
}
declare function useInterventions(options?: UseInterventionsOptions): UseInterventionsReturn;

/**
 * @sam-ai/react - usePushNotifications Hook
 * React hook for managing browser push notifications
 */
type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';
interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}
interface PushNotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    data?: Record<string, unknown>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
}
interface UsePushNotificationsOptions {
    /** VAPID public key for push subscription */
    vapidPublicKey?: string;
    /** Application server key (alias for vapidPublicKey for Web Push API) */
    applicationServerKey?: string;
    /** Service worker path (default: /sw.js) */
    serviceWorkerPath?: string;
    /** Auto-request permission on mount */
    autoRequest?: boolean;
    /** Auto-request permission when component mounts */
    autoRequestOnMount?: boolean;
    /** Callback when permission changes */
    onPermissionChange?: (state: PushPermissionState) => void;
    /** Callback when subscription changes */
    onSubscriptionChange?: (subscription: PushSubscription | null) => void;
    /** Callback when successfully subscribed */
    onSubscribe?: (subscription: PushSubscription) => void;
    /** Callback when unsubscribed */
    onUnsubscribe?: () => void;
    /** Callback when notification is clicked */
    onNotificationClick?: (notification: Notification, action?: string) => void;
    /** Callback when notification is closed */
    onNotificationClose?: (notification: Notification) => void;
    /** Callback for notification errors */
    onError?: (error: Error) => void;
}
interface UsePushNotificationsReturn {
    /** Current permission state */
    permission: PushPermissionState;
    /** Whether push is supported */
    isSupported: boolean;
    /** Whether push is enabled (permission granted and subscribed) */
    isEnabled: boolean;
    /** Current subscription */
    subscription: PushSubscription | null;
    /** Loading state */
    isLoading: boolean;
    /** Request notification permission */
    requestPermission: () => Promise<PushPermissionState>;
    /** Subscribe to push notifications */
    subscribe: () => Promise<PushSubscription | null>;
    /** Unsubscribe from push notifications */
    unsubscribe: () => Promise<boolean>;
    /** Show a local notification */
    showNotification: (options: PushNotificationOptions) => Promise<Notification | null>;
    /** Check if notification is visible */
    isNotificationVisible: (tag: string) => Promise<boolean>;
    /** Close notification by tag */
    closeNotification: (tag: string) => Promise<void>;
    /** Register subscription with server */
    registerWithServer: (serverEndpoint: string, userId: string) => Promise<boolean>;
}
declare function usePushNotifications(options?: UsePushNotificationsOptions): UsePushNotificationsReturn;

/**
 * useSAMMemory Hook
 * Provides React integration for SAM memory APIs
 *
 * Enables UI components to:
 * - Search memories, embeddings, and conversations
 * - Store user memories and preferences
 * - Retrieve conversation context
 */
interface MemorySearchResult {
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
}
interface LongTermMemory {
    id: string;
    memoryType: string;
    title: string;
    content: string;
    summary?: string;
    importance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    courseId?: string;
    createdAt: string;
}
interface ConversationTurn {
    id: string;
    sessionId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
    content: string;
    turnNumber: number;
    createdAt: string;
}
interface MemorySearchOptions {
    /** Number of results to return (1-50, default 10) */
    topK?: number;
    /** Minimum similarity score (0-1) */
    minScore?: number;
    /** Filter by course */
    courseId?: string;
    /** Filter by source types */
    sourceTypes?: string[];
    /** Filter by tags */
    tags?: string[];
    /** Filter by session (for conversations) */
    sessionId?: string;
    /** Filter by memory types (for long-term memories) */
    memoryTypes?: string[];
}
interface StoreMemoryData {
    memoryType: 'INTERACTION' | 'LEARNING_EVENT' | 'STRUGGLE_POINT' | 'PREFERENCE' | 'FEEDBACK' | 'CONTEXT' | 'CONCEPT' | 'SKILL';
    title: string;
    content: string;
    summary?: string;
    courseId?: string;
    topicIds?: string[];
    importance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    emotionalValence?: number;
    tags?: string[];
    metadata?: Record<string, unknown>;
}
interface StoreConversationData {
    sessionId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
    content: string;
    turnNumber: number;
    tokenCount?: number;
    entities?: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;
    intent?: string;
    sentiment?: number;
    metadata?: Record<string, unknown>;
}
interface UseSAMMemoryOptions {
    /** Enable debug logging */
    debug?: boolean;
}
interface UseSAMMemoryReturn {
    searchMemories: (query: string, type: 'embeddings' | 'memories' | 'conversations', options?: MemorySearchOptions) => Promise<MemorySearchResult[]>;
    searchResults: MemorySearchResult[];
    isSearching: boolean;
    storeMemory: (data: StoreMemoryData) => Promise<string | null>;
    isStoringMemory: boolean;
    storeConversation: (data: StoreConversationData) => Promise<string | null>;
    getConversationContext: (sessionId: string, maxTurns?: number) => Promise<ConversationTurn[]>;
    conversationHistory: ConversationTurn[];
    isLoadingConversation: boolean;
    error: string | null;
    clearError: () => void;
    clearSearchResults: () => void;
}
declare function useSAMMemory(options?: UseSAMMemoryOptions): UseSAMMemoryReturn;

interface TutoringStep {
    id: string;
    title: string;
    type: string;
    objectives: string[];
}
interface StepProgress {
    progressPercent: number;
    stepComplete: boolean;
    confidence: number;
    pendingCriteria: string[];
    recommendations: Array<{
        type: string;
        reason: string;
    }>;
}
interface StepTransition {
    type: string;
    message: string;
    planComplete: boolean;
    celebration: {
        type: string;
        title: string;
        message: string;
        xpEarned?: number;
    } | null;
}
interface PendingConfirmation {
    id: string;
    toolId: string;
    toolName: string;
    riskLevel: string;
}
interface OrchestrationMetadata {
    processingTime: number;
    stepAdvanced: boolean;
    planCompleted: boolean;
    interventionsTriggered: number;
}
interface TutoringOrchestrationState {
    hasActivePlan: boolean;
    currentStep: TutoringStep | null;
    stepProgress: StepProgress | null;
    transition: StepTransition | null;
    pendingConfirmations: PendingConfirmation[];
    metadata: OrchestrationMetadata | null;
}
interface UseTutoringOrchestrationReturn {
    state: TutoringOrchestrationState;
    updateFromResponse: (orchestration: TutoringOrchestrationState | undefined) => void;
    clearState: () => void;
    hasStepTransition: boolean;
    isPlanComplete: boolean;
    hasPendingConfirmations: boolean;
    currentStepProgress: number;
    shouldShowCelebration: boolean;
}
/**
 * Hook for managing tutoring orchestration state in UI components
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   updateFromResponse,
 *   hasStepTransition,
 *   isPlanComplete,
 *   currentStepProgress,
 * } = useTutoringOrchestration();
 *
 * // After SAM API response:
 * updateFromResponse(response.insights?.orchestration);
 *
 * // In your component:
 * if (hasStepTransition) {
 *   showTransitionAnimation(state.transition);
 * }
 * ```
 */
declare function useTutoringOrchestration(): UseTutoringOrchestrationReturn;
/**
 * Hook for just the current step information
 */
declare function useCurrentStep(): {
    step: TutoringStep | null;
    objectives: string[];
    stepType: string | null;
};
/**
 * Hook for step progress tracking
 */
declare function useStepProgress(): {
    progressPercent: number;
    isComplete: boolean;
    confidence: number;
    pendingCriteria: string[];
};
/**
 * Hook for celebration display
 */
declare function useStepCelebration(): {
    show: boolean;
    celebration: StepTransition['celebration'];
    dismiss: () => void;
};
declare function TutoringOrchestrationProvider({ children }: {
    children: ReactNode;
}): react_jsx_runtime.JSX.Element;
declare function useTutoringOrchestrationContext(): UseTutoringOrchestrationReturn;

/**
 * @sam-ai/react - useNotifications Hook
 * Hook for managing SAM notifications
 */
type NotificationType = 'SAM_CHECK_IN' | 'SAM_INTERVENTION' | 'SAM_MILESTONE' | 'SAM_RECOMMENDATION';
type NotificationFeedback = 'helpful' | 'not_helpful' | 'too_frequent' | 'irrelevant';
interface SAMNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
    link?: string;
}
interface UseNotificationsOptions {
    /** Filter by notification type */
    type?: NotificationType;
    /** Only fetch unread notifications */
    unreadOnly?: boolean;
    /** Max notifications to fetch */
    limit?: number;
    /** Enable auto-refresh interval (ms) */
    refreshInterval?: number;
    /** Disable auto-fetch on mount */
    disabled?: boolean;
}
interface UseNotificationsReturn {
    /** List of notifications */
    notifications: SAMNotification[];
    /** Total notification count */
    total: number;
    /** Unread notification count */
    unreadCount: number;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: Error | null;
    /** Refresh notifications */
    refresh: () => Promise<void>;
    /** Mark notifications as read */
    markAsRead: (notificationIds: string[]) => Promise<void>;
    /** Dismiss notification with optional feedback */
    dismiss: (notificationId: string, feedback?: NotificationFeedback) => Promise<void>;
    /** Clear all read notifications */
    clearRead: () => Promise<void>;
    /** Load more notifications */
    loadMore: () => Promise<void>;
    /** Whether more notifications are available */
    hasMore: boolean;
}
declare function useNotifications(options?: UseNotificationsOptions): UseNotificationsReturn;

/**
 * @sam-ai/react - useBehaviorPatterns Hook
 * Hook for detecting and retrieving user behavior patterns
 */
type PatternType = 'STRUGGLE' | 'ENGAGEMENT_DROP' | 'LEARNING_STYLE' | 'TIME_PREFERENCE' | 'TOPIC_AFFINITY' | 'PACE' | 'RETENTION';
interface BehaviorPattern {
    id: string;
    userId: string;
    type: PatternType;
    name: string;
    description: string;
    confidence: number;
    frequency: number;
    firstDetected: string;
    lastDetected: string;
    metadata?: Record<string, unknown>;
}
interface UseBehaviorPatternsOptions {
    /** Enable auto-fetch on mount */
    autoFetch?: boolean;
    /** Auto-refresh interval (ms) */
    refreshInterval?: number;
}
interface UseBehaviorPatternsReturn {
    /** Detected behavior patterns */
    patterns: BehaviorPattern[];
    /** Loading state */
    isLoading: boolean;
    /** Detection in progress */
    isDetecting: boolean;
    /** Error state */
    error: Error | null;
    /** Refresh patterns from server */
    refresh: () => Promise<void>;
    /** Trigger pattern detection */
    detectPatterns: () => Promise<BehaviorPattern[]>;
}
declare function useBehaviorPatterns(options?: UseBehaviorPatternsOptions): UseBehaviorPatternsReturn;

/**
 * @sam-ai/react - useRecommendations Hook
 * Hook for fetching personalized learning recommendations
 */
type RecommendationType = 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
type RecommendationPriority = 'low' | 'medium' | 'high';
interface LearningRecommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    reason: string;
    priority: RecommendationPriority;
    estimatedMinutes: number;
    targetUrl?: string;
    metadata?: {
        resourceId?: string;
        difficulty?: string;
        confidence?: number;
    };
}
interface RecommendationContext {
    availableTime: number;
    currentGoals: string[];
    recentTopics: string[];
}
interface UseRecommendationsOptions {
    /** Available time in minutes (5-480) */
    availableTime?: number;
    /** Max recommendations to fetch (1-20) */
    limit?: number;
    /** Filter by recommendation types */
    types?: RecommendationType[];
    /** Enable auto-fetch on mount */
    autoFetch?: boolean;
    /** Auto-refresh interval (ms) */
    refreshInterval?: number;
}
interface UseRecommendationsReturn {
    /** List of recommendations */
    recommendations: LearningRecommendation[];
    /** Total estimated time for all recommendations */
    totalEstimatedTime: number;
    /** When recommendations were generated */
    generatedAt: string | null;
    /** Context used for generating recommendations */
    context: RecommendationContext | null;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: Error | null;
    /** Refresh recommendations */
    refresh: () => Promise<void>;
    /** Fetch with custom options */
    fetchRecommendations: (options?: {
        time?: number;
        limit?: number;
        types?: RecommendationType[];
    }) => Promise<void>;
}
declare function useRecommendations(options?: UseRecommendationsOptions): UseRecommendationsReturn;

/**
 * @sam-ai/react - useExamEngine Hook
 * React hook for SAM AI exam generation and management
 *
 * This hook provides access to the portable @sam-ai/educational
 * ExamEngine for generating exams with Bloom's Taxonomy alignment.
 */

/**
 * Bloom's distribution for exam generation
 */
interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
    [key: string]: number;
}
/**
 * Difficulty distribution for exam generation
 */
interface DifficultyDistribution {
    EASY: number;
    MEDIUM: number;
    HARD: number;
}
/**
 * Exam generation configuration
 */
interface ExamGenerationConfig {
    totalQuestions: number;
    timeLimit?: number;
    bloomsDistribution?: Partial<BloomsDistribution>;
    difficultyDistribution?: Partial<DifficultyDistribution>;
    questionTypes?: QuestionType[];
    adaptiveMode?: boolean;
}
/**
 * Generated question data
 */
interface GeneratedQuestion {
    id: string;
    text: string;
    type: QuestionType;
    bloomsLevel: BloomsLevel;
    difficulty: QuestionDifficulty;
    options?: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
    }>;
    correctAnswer: string;
    explanation?: string;
    estimatedTime: number;
    points: number;
    tags?: string[];
}
/**
 * Bloom's analysis result
 */
interface BloomsAnalysisResult {
    targetVsActual: {
        alignmentScore: number;
        deviations: Record<BloomsLevel, number>;
    };
    distribution: BloomsDistribution;
    recommendations: string[];
}
/**
 * Generated exam response
 */
interface GeneratedExamResponse {
    examId: string;
    questions: GeneratedQuestion[];
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    bloomsAnalysis: BloomsAnalysisResult;
    metadata: {
        generatedAt: string;
        engine: string;
        adaptiveMode: boolean;
    };
}
/**
 * Exam with Bloom's profile
 */
interface ExamWithProfile {
    exam: {
        id: string;
        title: string;
        timeLimit: number | null;
        isActive: boolean;
    };
    bloomsProfile: {
        targetDistribution: BloomsDistribution;
        actualDistribution: BloomsDistribution;
        difficultyMatrix: Record<string, unknown>;
        skillsAssessed: string[];
        coverageMap: Record<string, unknown>;
    } | null;
}
/**
 * Options for the exam engine hook
 */
interface UseExamEngineOptions {
    /** API endpoint for exam engine */
    apiEndpoint?: string;
    /** Course ID for context */
    courseId?: string;
    /** Section IDs for scope */
    sectionIds?: string[];
    /** Include student profile for adaptive generation */
    includeStudentProfile?: boolean;
    /** Callback when exam is generated */
    onExamGenerated?: (exam: GeneratedExamResponse) => void;
    /** Callback on error */
    onError?: (error: string) => void;
}
/**
 * Return type for the exam engine hook
 */
interface UseExamEngineReturn {
    /** Whether exam is being generated */
    isGenerating: boolean;
    /** Whether exam is being loaded */
    isLoading: boolean;
    /** Last generated exam */
    generatedExam: GeneratedExamResponse | null;
    /** Loaded exam with Bloom's profile */
    examWithProfile: ExamWithProfile | null;
    /** Error message if any */
    error: string | null;
    /** Generate a new exam */
    generateExam: (config: ExamGenerationConfig) => Promise<GeneratedExamResponse | null>;
    /** Get exam with Bloom's profile */
    getExam: (examId: string) => Promise<ExamWithProfile | null>;
    /** Get default Bloom's distribution */
    getDefaultBloomsDistribution: () => BloomsDistribution;
    /** Get default difficulty distribution */
    getDefaultDifficultyDistribution: () => DifficultyDistribution;
    /** Clear state */
    reset: () => void;
}
/**
 * Hook for SAM AI Exam Engine
 *
 * @example
 * ```tsx
 * function ExamGenerator() {
 *   const {
 *     isGenerating,
 *     generatedExam,
 *     error,
 *     generateExam,
 *     getDefaultBloomsDistribution,
 *   } = useExamEngine({
 *     courseId: course.id,
 *     sectionIds: [section.id],
 *     onExamGenerated: (exam) => {
 *       console.log('Generated exam:', exam);
 *     },
 *   });
 *
 *   const handleGenerate = async () => {
 *     await generateExam({
 *       totalQuestions: 20,
 *       timeLimit: 60,
 *       bloomsDistribution: getDefaultBloomsDistribution(),
 *       questionTypes: ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
 *       adaptiveMode: true,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isGenerating}>
 *         {isGenerating ? 'Generating...' : 'Generate Exam'}
 *       </button>
 *       {generatedExam && (
 *         <div>
 *           <p>Generated {generatedExam.totalQuestions} questions</p>
 *           <p>Alignment score: {generatedExam.bloomsAnalysis.targetVsActual.alignmentScore}%</p>
 *         </div>
 *       )}
 *       {error && <p className="error">{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useExamEngine(options?: UseExamEngineOptions): UseExamEngineReturn;

/**
 * @sam-ai/react - useQuestionBank Hook
 * React hook for SAM AI question bank management
 *
 * This hook provides access to the portable @sam-ai/educational
 * Question Bank for storing, retrieving, and managing exam questions.
 */

/**
 * Question option data
 */
interface QuestionOption {
    text: string;
    isCorrect: boolean;
}
/**
 * Question input data for adding to bank
 */
interface QuestionInput {
    text: string;
    type: QuestionType;
    bloomsLevel: BloomsLevel;
    difficulty: QuestionDifficulty;
    subtopic?: string;
    tags?: string[];
    options?: QuestionOption[];
    explanation?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Question from the bank
 */
interface BankQuestion {
    id: string;
    question: string;
    questionType: QuestionType;
    bloomsLevel: BloomsLevel;
    difficulty: QuestionDifficulty;
    subject?: string;
    topic?: string;
    subtopic?: string;
    tags: string[];
    usageCount: number;
    avgTimeSpent: number;
}
/**
 * Question bank statistics
 */
interface QuestionBankStats {
    bloomsDistribution: Record<BloomsLevel, number>;
    difficultyDistribution: Record<QuestionDifficulty, number>;
    typeDistribution: Record<QuestionType, number>;
    totalUsage: number;
    averageDifficulty: number;
}
/**
 * Pagination info
 */
interface Pagination {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}
/**
 * Question bank query filters
 */
interface QuestionBankQuery {
    courseId?: string;
    subject?: string;
    topic?: string;
    bloomsLevel?: BloomsLevel;
    difficulty?: QuestionDifficulty;
    questionType?: QuestionType;
    limit?: number;
    offset?: number;
}
/**
 * Options for the question bank hook
 */
interface UseQuestionBankOptions {
    /** API endpoint for question bank */
    apiEndpoint?: string;
    /** Course ID for scoping */
    courseId?: string;
    /** Default subject */
    subject?: string;
    /** Default topic */
    topic?: string;
    /** Items per page */
    pageSize?: number;
    /** Callback when questions are loaded */
    onQuestionsLoaded?: (questions: BankQuestion[]) => void;
    /** Callback when questions are added */
    onQuestionsAdded?: (count: number) => void;
    /** Callback on error */
    onError?: (error: string) => void;
}
/**
 * Return type for the question bank hook
 */
interface UseQuestionBankReturn {
    /** Questions from the bank */
    questions: BankQuestion[];
    /** Question bank statistics */
    stats: QuestionBankStats | null;
    /** Pagination information */
    pagination: Pagination | null;
    /** Whether questions are loading */
    isLoading: boolean;
    /** Whether questions are being added */
    isAdding: boolean;
    /** Whether question is being updated */
    isUpdating: boolean;
    /** Whether question is being deleted */
    isDeleting: boolean;
    /** Error message if any */
    error: string | null;
    /** Get questions from the bank */
    getQuestions: (query?: QuestionBankQuery) => Promise<BankQuestion[]>;
    /** Add questions to the bank */
    addQuestions: (questions: QuestionInput[], subject?: string, topic?: string) => Promise<number>;
    /** Update a question */
    updateQuestion: (questionId: string, updates: Partial<QuestionInput>) => Promise<boolean>;
    /** Delete a question */
    deleteQuestion: (questionId: string) => Promise<boolean>;
    /** Load more questions (pagination) */
    loadMore: () => Promise<void>;
    /** Refresh questions */
    refresh: () => Promise<void>;
    /** Clear state */
    reset: () => void;
}
/**
 * Hook for SAM AI Question Bank
 *
 * @example
 * ```tsx
 * function QuestionBankManager() {
 *   const {
 *     questions,
 *     stats,
 *     pagination,
 *     isLoading,
 *     isAdding,
 *     error,
 *     getQuestions,
 *     addQuestions,
 *     deleteQuestion,
 *     loadMore,
 *   } = useQuestionBank({
 *     courseId: course.id,
 *     pageSize: 20,
 *     onQuestionsLoaded: (qs) => {
 *       console.log('Loaded questions:', qs.length);
 *     },
 *   });
 *
 *   useEffect(() => {
 *     getQuestions({ bloomsLevel: 'APPLY' });
 *   }, [getQuestions]);
 *
 *   const handleAddQuestions = async () => {
 *     const newQuestions = [
 *       {
 *         text: 'What is React?',
 *         type: 'MULTIPLE_CHOICE',
 *         bloomsLevel: 'UNDERSTAND',
 *         difficulty: 'MEDIUM',
 *         options: [
 *           { text: 'A JavaScript library', isCorrect: true },
 *           { text: 'A programming language', isCorrect: false },
 *         ],
 *       },
 *     ];
 *     await addQuestions(newQuestions, 'Web Development', 'React');
 *   };
 *
 *   return (
 *     <div>
 *       {isLoading && <p>Loading...</p>}
 *       {questions.map(q => (
 *         <div key={q.id}>
 *           <p>{q.question}</p>
 *           <span>{q.bloomsLevel}</span>
 *           <button onClick={() => deleteQuestion(q.id)}>Delete</button>
 *         </div>
 *       ))}
 *       {pagination?.hasMore && (
 *         <button onClick={loadMore}>Load More</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useQuestionBank(options?: UseQuestionBankOptions): UseQuestionBankReturn;

/**
 * @sam-ai/react - useInnovationFeatures Hook
 * React hook for SAM AI innovative learning features
 *
 * This hook provides access to innovative learning features:
 * - Cognitive Fitness Assessment
 * - Learning DNA Generation
 * - AI Study Buddy
 * - Quantum Learning Paths
 */
/**
 * Cognitive dimension data
 */
interface CognitiveDimension {
    name: string;
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    description?: string;
}
/**
 * Cognitive fitness assessment result
 */
interface CognitiveFitnessAssessment {
    dimensions: CognitiveDimension[];
    overallScore: number;
    progress: {
        weeklyCompleted: number;
        weeklyGoal: number;
        streak: number;
    };
    recommendations: string[];
}
/**
 * Fitness exercise details
 */
interface FitnessExercise {
    id: string;
    name: string;
    instructions: string;
    duration: number;
    difficulty: number;
}
/**
 * Fitness session data
 */
interface FitnessSession {
    sessionId: string;
    exercise: FitnessExercise;
    startTime: Date;
}
/**
 * Fitness recommendation
 */
interface FitnessRecommendation {
    type: 'assessment' | 'exercise' | 'frequency';
    dimension?: string;
    message: string;
    exercises?: string[];
    priority: 'high' | 'medium' | 'low';
}
/**
 * Learning DNA trait
 */
interface LearningTrait {
    traitId: string;
    name: string;
    strength: number;
    malleability: number;
    linkedTraits: string[];
}
/**
 * DNA Phenotype capability
 */
interface PhenotypeCapability {
    name: string;
    level: number;
    applications: string[];
}
/**
 * Learning DNA result
 */
interface LearningDNA {
    dnaSequence: {
        cognitiveCode: string;
        segments: Array<{
            segmentId: string;
            type: string;
            expression: number;
        }>;
        uniqueMarkers: string[];
    };
    traits: LearningTrait[];
    phenotype: {
        capabilities: PhenotypeCapability[];
        learningPreferences: string[];
    };
}
/**
 * DNA visualization data
 */
interface DNAVisualization {
    helixData: Array<{
        position: string;
        expression: number;
        color: string;
    }>;
    traitNetwork: Array<{
        id: string;
        label: string;
        size: number;
        connections: string[];
    }>;
}
/**
 * Study buddy personality
 */
interface BuddyPersonality {
    type: 'motivator' | 'challenger' | 'supporter' | 'analyst' | 'creative';
    traits: string[];
    communicationStyle: string;
}
/**
 * Study buddy data
 */
interface StudyBuddyAI {
    buddyId: string;
    name: string;
    personality: BuddyPersonality;
    avatar: {
        type: string;
        color: string;
    };
    relationship: {
        level: number;
        trust: number;
    };
    capabilities: string[];
    isActive: boolean;
}
/**
 * Buddy interaction type
 */
type BuddyInteractionType = 'conversation' | 'quiz' | 'encouragement' | 'challenge' | 'celebration';
/**
 * Buddy interaction result
 */
interface BuddyInteraction {
    interactionId: string;
    type: BuddyInteractionType;
    content: string;
    emotionalTone: string;
    effectiveness?: number;
    responseOptions?: string[];
}
/**
 * Buddy effectiveness metrics
 */
interface BuddyEffectiveness {
    overall: number;
    byType: Record<BuddyInteractionType, number>;
    trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
    progressCorrelation: number;
    improvements: string[];
}
/**
 * Quantum state
 */
interface QuantumState {
    stateId: string;
    probability: number;
    energy: number;
    constraints: string[];
    outcomes: Array<{
        outcomeId: string;
        probability: number;
        description: string;
    }>;
}
/**
 * Quantum learning path
 */
interface QuantumLearningPath {
    pathId: string;
    learningGoal: string;
    superposition: {
        possibleStates: QuantumState[];
        currentProbabilities: Map<string, number>;
        coherenceLevel: number;
        decoherenceFactors: string[];
    };
    entanglements: Array<{
        entanglementId: string;
        entangledPaths: string[];
        correlationStrength: number;
        type: string;
    }>;
    probability: {
        successProbability: number;
        completionTimeDistribution: Record<string, number>;
        outcomeDistribution: Record<string, number>;
        uncertaintyPrinciple: {
            positionUncertainty: number;
            momentumUncertainty: number;
            product: number;
        };
    };
    collapsed: boolean;
    isActive: boolean;
}
/**
 * Quantum path observation type
 */
type PathObservationType = 'progress' | 'assessment' | 'decision';
/**
 * Observation result
 */
interface ObservationResult {
    observationId: string;
    type: PathObservationType;
    impact: {
        probabilityShifts: Map<string, number>;
        collapsedStates: string[];
        decoherence: number;
    };
    timestamp: string;
}
/**
 * Path collapse result
 */
interface PathCollapseResult {
    finalState: {
        learningPath: Array<{
            id: string;
            content: string;
            duration: number;
        }>;
        outcomes: Array<{
            outcomeId: string;
            description: string;
        }>;
    };
    alternativesLost: string[];
    nextSteps: string[];
}
/**
 * Options for the innovation features hook
 */
interface UseInnovationFeaturesOptions {
    /** API endpoint for innovation features */
    apiEndpoint?: string;
    /** Auto-load features status on mount */
    autoLoadStatus?: boolean;
    /** Callback on error */
    onError?: (error: string) => void;
}
/**
 * Feature status overview
 */
interface FeaturesStatus {
    hasCognitiveFitness: boolean;
    hasLearningDNA: boolean;
    hasStudyBuddy: boolean;
    activeQuantumPaths: number;
    lastUpdated: {
        fitness?: Date;
        dna?: Date;
        buddy?: Date;
    };
}
/**
 * Return type for the innovation features hook
 */
interface UseInnovationFeaturesReturn {
    featuresStatus: FeaturesStatus | null;
    isLoadingStatus: boolean;
    cognitiveFitness: CognitiveFitnessAssessment | null;
    isAssessingFitness: boolean;
    assessCognitiveFitness: () => Promise<CognitiveFitnessAssessment | null>;
    startFitnessExercise: (exerciseId: string) => Promise<FitnessSession | null>;
    completeFitnessExercise: (sessionId: string, performance: Record<string, unknown>, duration: number) => Promise<void>;
    getFitnessRecommendations: () => Promise<FitnessRecommendation[]>;
    learningDNA: LearningDNA | null;
    dnaVisualization: DNAVisualization | null;
    isGeneratingDNA: boolean;
    generateLearningDNA: () => Promise<LearningDNA | null>;
    analyzeDNATraits: () => Promise<{
        traits: LearningTrait[];
        interactions: unknown[];
        predictions: unknown;
        strategies: unknown[];
    } | null>;
    trackDNAEvolution: () => Promise<{
        evolution: unknown;
        mutations: unknown[];
        timeline: unknown[];
    } | null>;
    studyBuddy: StudyBuddyAI | null;
    isCreatingBuddy: boolean;
    isInteracting: boolean;
    createStudyBuddy: (preferences: Record<string, unknown>) => Promise<StudyBuddyAI | null>;
    interactWithBuddy: (type: BuddyInteractionType, context: Record<string, unknown>) => Promise<BuddyInteraction | null>;
    updateBuddyPersonality: (personalityUpdates: Partial<BuddyPersonality>, reason?: string) => Promise<boolean>;
    getBuddyEffectiveness: () => Promise<BuddyEffectiveness | null>;
    quantumPaths: QuantumLearningPath[];
    isCreatingPath: boolean;
    createQuantumPath: (learningGoal: string, preferences?: Record<string, unknown>) => Promise<QuantumLearningPath | null>;
    observeQuantumPath: (pathId: string, type: PathObservationType, data: Record<string, unknown>) => Promise<ObservationResult | null>;
    getPathProbabilities: (pathId: string) => Promise<{
        currentProbabilities: Record<string, number>;
        successProbability: number;
        predictions: unknown[];
    } | null>;
    collapseQuantumPath: (pathId: string, reason?: string) => Promise<PathCollapseResult | null>;
    error: string | null;
    loadFeaturesStatus: () => Promise<FeaturesStatus | null>;
    clearError: () => void;
}
/**
 * Hook for SAM AI Innovation Features
 *
 * @example
 * ```tsx
 * function InnovationDashboard() {
 *   const {
 *     featuresStatus,
 *     cognitiveFitness,
 *     learningDNA,
 *     studyBuddy,
 *     quantumPaths,
 *     assessCognitiveFitness,
 *     generateLearningDNA,
 *     createStudyBuddy,
 *     createQuantumPath,
 *     error,
 *   } = useInnovationFeatures({
 *     autoLoadStatus: true,
 *   });
 *
 *   return (
 *     <div>
 *       {!featuresStatus?.hasCognitiveFitness && (
 *         <button onClick={assessCognitiveFitness}>
 *           Start Cognitive Fitness Assessment
 *         </button>
 *       )}
 *       {!featuresStatus?.hasLearningDNA && (
 *         <button onClick={generateLearningDNA}>
 *           Generate Learning DNA
 *         </button>
 *       )}
 *       {!featuresStatus?.hasStudyBuddy && (
 *         <button onClick={() => createStudyBuddy({ type: 'motivator' })}>
 *           Create Study Buddy
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useInnovationFeatures(options?: UseInnovationFeaturesOptions): UseInnovationFeaturesReturn;

/**
 * @sam-ai/react - useMultimodal Hook
 * React hook for SAM AI multimodal input processing
 *
 * This hook provides access to multimodal capabilities:
 * - Voice transcription
 * - Image analysis
 * - Handwriting recognition
 * - Document processing
 */
/**
 * Multimodal input type
 */
type MultimodalInputType = 'IMAGE' | 'VOICE' | 'HANDWRITING' | 'VIDEO' | 'DOCUMENT' | 'MIXED';
/**
 * Multimodal file data
 */
interface MultimodalFile {
    data: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
}
/**
 * Processing options
 */
interface ProcessingOptions {
    enableOCR?: boolean;
    enableSpeechToText?: boolean;
    enableHandwritingRecognition?: boolean;
    targetLanguage?: string;
    includeQualityCheck?: boolean;
    generateAccessibilityData?: boolean;
}
/**
 * Processing status
 */
interface ProcessingStatus {
    inputId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    startedAt?: string;
    completedAt?: string;
    error?: string;
}
/**
 * Quality assessment result
 */
interface QualityAssessment {
    overallScore: number;
    clarity: number;
    completeness: number;
    accuracy: number;
    issues: string[];
    suggestions: string[];
}
/**
 * Text extraction result
 */
interface TextExtractionResult {
    text: string;
    confidence: number;
    language: string;
    segments: Array<{
        text: string;
        boundingBox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        confidence: number;
    }>;
}
/**
 * Accessibility data
 */
interface AccessibilityData {
    altText?: string;
    captions?: string[];
    transcript?: string;
    description?: string;
}
/**
 * Processed input result
 */
interface ProcessedInput {
    inputId: string;
    inputType: MultimodalInputType;
    originalFile: {
        name: string;
        mimeType: string;
        size: number;
    };
    extractedText?: TextExtractionResult;
    analysis?: {
        type: string;
        content: string;
        confidence: number;
        metadata: Record<string, unknown>;
    };
    qualityAssessment?: QualityAssessment;
    accessibilityData?: AccessibilityData;
    processedAt: string;
}
/**
 * Batch processing result
 */
interface BatchProcessingResult {
    totalFiles: number;
    successCount: number;
    failedCount: number;
    results: ProcessedInput[];
    errors: Array<{
        fileName: string;
        error: string;
    }>;
}
/**
 * Storage quota information
 */
interface StorageQuota {
    used: number;
    limit: number;
    available: number;
    percentUsed: number;
}
/**
 * Options for the multimodal hook
 */
interface UseMultimodalOptions {
    /** API endpoint for multimodal processing */
    apiEndpoint?: string;
    /** Course ID for context */
    courseId?: string;
    /** Assignment ID for context */
    assignmentId?: string;
    /** Default processing options */
    defaultOptions?: ProcessingOptions;
    /** Callback when processing completes */
    onProcessingComplete?: (result: ProcessedInput) => void;
    /** Callback on error */
    onError?: (error: string) => void;
}
/**
 * Return type for the multimodal hook
 */
interface UseMultimodalReturn {
    /** Whether currently processing */
    isProcessing: boolean;
    /** Last processed input */
    processedInput: ProcessedInput | null;
    /** Current processing status */
    processingStatus: ProcessingStatus | null;
    /** Storage quota information */
    storageQuota: StorageQuota | null;
    /** Error message if any */
    error: string | null;
    /** Process a single input file */
    processInput: (file: MultimodalFile, options?: ProcessingOptions, expectedType?: MultimodalInputType) => Promise<ProcessedInput | null>;
    /** Process multiple files in batch */
    processBatch: (files: MultimodalFile[], options?: ProcessingOptions) => Promise<BatchProcessingResult | null>;
    /** Validate input before processing */
    validateInput: (file: MultimodalFile) => Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    /** Extract text from file */
    extractText: (file: MultimodalFile) => Promise<TextExtractionResult | null>;
    /** Assess file quality */
    assessQuality: (file: MultimodalFile) => Promise<QualityAssessment | null>;
    /** Get processing status */
    getProcessingStatus: (inputId: string) => Promise<ProcessingStatus | null>;
    /** Cancel processing */
    cancelProcessing: (inputId: string) => Promise<boolean>;
    /** Get storage quota */
    getStorageQuota: () => Promise<StorageQuota | null>;
    /** Convert file to base64 */
    fileToBase64: (file: File) => Promise<MultimodalFile>;
    /** Clear state */
    reset: () => void;
}
/**
 * Hook for SAM AI Multimodal Input Processing
 *
 * @example
 * ```tsx
 * function MultimodalUploader() {
 *   const {
 *     isProcessing,
 *     processedInput,
 *     error,
 *     processInput,
 *     validateInput,
 *     fileToBase64,
 *   } = useMultimodal({
 *     courseId: course.id,
 *     onProcessingComplete: (result) => {
 *       console.log('Processed:', result);
 *     },
 *   });
 *
 *   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (!file) return;
 *
 *     const multimodalFile = await fileToBase64(file);
 *
 *     // Validate first
 *     const validation = await validateInput(multimodalFile);
 *     if (!validation.isValid) {
 *       alert(validation.errors.join(', '));
 *       return;
 *     }
 *
 *     // Process the file
 *     await processInput(multimodalFile, {
 *       enableOCR: true,
 *       generateAccessibilityData: true,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileUpload} disabled={isProcessing} />
 *       {isProcessing && <p>Processing...</p>}
 *       {processedInput && (
 *         <div>
 *           <p>Extracted text: {processedInput.extractedText?.text}</p>
 *           <p>Quality score: {processedInput.qualityAssessment?.overallScore}</p>
 *         </div>
 *       )}
 *       {error && <p className="error">{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useMultimodal(options?: UseMultimodalOptions): UseMultimodalReturn;

/**
 * @sam-ai/react - useContextGathering
 *
 * Comprehensive client-side DOM collector that produces a PageContextSnapshot.
 * Replaces and unifies useSAMPageContext page detection, useSAMFormAutoDetect,
 * and useSAMPageLinks into a single, complete snapshot of page state.
 *
 * Features:
 * - Full form scanning with field metadata, labels, validation, options
 * - Content extraction (headings, tables, code blocks, images, text)
 * - Navigation analysis (links, tabs, sidebar, pagination)
 * - Page state detection (editing, draft, publishing, wizard steps)
 * - Interaction tracking (scroll, focus, selection, time on page)
 * - MutationObserver for SPA navigation + DOM changes
 * - Extensible via custom ContextProviders
 * - Debounced with content hash change detection
 */

declare function useContextGathering(options?: UseContextGatheringOptions): UseContextGatheringReturn;

/**
 * @sam-ai/react - useContextMemorySync
 *
 * Bridges useContextGathering with the /api/sam/context endpoint.
 * Automatically submits snapshots when page context changes.
 *
 * Features:
 * - Debounced at 2 seconds to batch rapid changes
 * - Skips redundant submissions via contentHash comparison
 * - Non-blocking — failures are silently ignored
 */

interface UseContextMemorySyncOptions extends UseContextGatheringOptions {
    /** Whether context gathering and sync is enabled. Default: true */
    enabled?: boolean;
    /** Sync debounce in ms. Default: 2000 */
    syncDebounceMs?: number;
    /** API endpoint. Default: '/api/sam/context' */
    apiEndpoint?: string;
}
interface UseContextMemorySyncReturn {
    snapshot: PageContextSnapshot | null;
    isGathering: boolean;
    lastSynced: Date | null;
    syncCount: number;
    refresh: () => void;
}
declare function useContextMemorySync(options?: UseContextMemorySyncOptions): UseContextMemorySyncReturn;

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

export { type AccessibilityData, type BankQuestion, type BatchProcessingResult, type BehaviorPattern, type BloomsAnalysisResult, type BloomsDistribution, type BuddyEffectiveness, type BuddyInteraction, type BuddyInteractionType, type BuddyPersonality, type CheckIn, type CheckInResponse, type CognitiveDimension, type CognitiveFitnessAssessment, type ContextDetectorOptions, type ConversationTurn, type CreateGoalData, type DNAVisualization, type DifficultyDistribution, type ExamGenerationConfig, type ExamWithProfile, type FeaturesStatus, type FitnessExercise, type FitnessRecommendation, type FitnessSession, type FormAutoFillOptions, type FormSyncOptions, type GeneratedExamResponse, type GeneratedQuestion, type Goal, type LearningDNA, type LearningRecommendation, type LearningTrait, type LongTermMemory, type MemorySearchOptions, type MemorySearchResult, type MultimodalFile, type MultimodalInputType, type NotificationFeedback, type NotificationType, type ObservationResult, type OrchestrationMetadata, type PageContextDetection, type Pagination, type PathCollapseResult, type PathObservationType, type PatternType, type PendingConfirmation, type PhenotypeCapability, type Plan, type PlanStep, type ProcessedInput, type ProcessingOptions, type ProcessingStatus, type ProgressReport, type PushNotificationOptions, type PushPermissionState, type PushSubscription, type QualityAssessment, type QuantumLearningPath, type QuantumState, type QuestionBankQuery, type QuestionBankStats, type QuestionInput, type QuestionOption, type Recommendation, type RecommendationBatch, type RecommendationContext, type RecommendationPriority, type RecommendationType, type SAMApiTransportOptions, type SAMApiTransportResponse, SAMContext, type SAMFormDataEventDetail, type SAMNotification, type SAMPageLink, SAMProvider, type SAMProviderConfig, type SAMProviderState, SAM_FORM_DATA_EVENT, type SkillAssessment, type StepProgress, type StepTransition, type StorageQuota, type StoreConversationData, type StoreMemoryData, type StudyBuddyAI, type SubGoal, type TextExtractionResult, TutoringOrchestrationProvider, type TutoringOrchestrationState, type TutoringStep, type UseAgenticOptions, type UseAgenticReturn, type UseBehaviorPatternsOptions, type UseBehaviorPatternsReturn, type UseContextMemorySyncOptions, type UseContextMemorySyncReturn, type UseExamEngineOptions, type UseExamEngineReturn, type UseInnovationFeaturesOptions, type UseInnovationFeaturesReturn, type UseInterventionsOptions, type UseInterventionsReturn, type UseMultimodalOptions, type UseMultimodalReturn, type UseNotificationsOptions, type UseNotificationsReturn, type UsePresenceOptions, type UsePresenceReturn, type UseQuestionBankOptions, type UseQuestionBankReturn, type UseRealtimeOptions, type UseRealtimeReturn, type UseRecommendationsOptions, type UseRecommendationsReturn, type UseSAMActionsReturn, type UseSAMAdaptiveContentOptions, type UseSAMAdaptiveContentReturn, type UseSAMAnalysisReturn, type UseSAMChatReturn, type UseSAMContextReturn, type UseSAMFormAutoDetectOptions, type UseSAMFormAutoDetectReturn, type UseSAMFormAutoFillOptions, type UseSAMFormAutoFillReturn, type UseSAMFormDataEventsOptions, type UseSAMFormDataEventsReturn, type UseSAMFormDataSyncOptions, type UseSAMFormDataSyncReturn, type UseSAMFormReturn, type UseSAMPageLinksOptions, type UseSAMPageLinksReturn, type UseSAMPracticeProblemsOptions, type UseSAMPracticeProblemsReturn, type UseSAMReturn, type UseSAMSocraticDialogueOptions, type UseSAMSocraticDialogueReturn, VERSION, contextDetector, createContextDetector, emitSAMFormData, getCapabilities, hasCapability, useAgentic, useBehaviorPatterns, useContextGathering, useContextMemorySync, useCurrentStep, useExamEngine, useInnovationFeatures, useInterventions, useMultimodal, useNotifications, usePresence, usePushNotifications, useQuestionBank, useRealtime, useRecommendations, useSAM, useSAMActions, useSAMAdaptiveContent, useSAMAnalysis, useSAMAutoContext, useSAMChat, useSAMContext, useSAMForm, useSAMFormAutoDetect, useSAMFormAutoFill, useSAMFormDataEvents, useSAMFormDataSync, useSAMFormSync, useSAMMemory, useSAMPageContext, useSAMPageLinks, useSAMPracticeProblems, useSAMSocraticDialogue, useStepCelebration, useStepProgress, useTutoringOrchestration, useTutoringOrchestrationContext };
