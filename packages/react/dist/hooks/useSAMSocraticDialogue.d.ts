/**
 * @sam-ai/react - useSAMSocraticDialogue Hook
 * React hook for Socratic teaching dialogues
 */
import type { SocraticDialogue, SocraticResponse, SocraticQuestion, StartDialogueInput, DialoguePerformance, DialogueState } from '@sam-ai/educational';
/**
 * Options for the Socratic dialogue hook
 */
export interface UseSAMSocraticDialogueOptions {
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
export interface UseSAMSocraticDialogueReturn {
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
export declare function useSAMSocraticDialogue(options?: UseSAMSocraticDialogueOptions): UseSAMSocraticDialogueReturn;
export default useSAMSocraticDialogue;
//# sourceMappingURL=useSAMSocraticDialogue.d.ts.map