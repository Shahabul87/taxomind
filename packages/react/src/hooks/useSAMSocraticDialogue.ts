/**
 * @sam-ai/react - useSAMSocraticDialogue Hook
 * React hook for Socratic teaching dialogues
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  SocraticDialogue,
  SocraticResponse,
  SocraticQuestion,
  StartDialogueInput,
  DialoguePerformance,
  DialogueState,
} from '@sam-ai/educational';

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
  endDialogue: () => Promise<{ synthesis: string; performance: DialoguePerformance } | null>;
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
export function useSAMSocraticDialogue(
  options: UseSAMSocraticDialogueOptions = {}
): UseSAMSocraticDialogueReturn {
  const {
    apiEndpoint = '/api/sam/socratic',
    userId,
    courseId,
    sectionId,
    preferredStyle = 'balanced',
    onDialogueStart,
    onQuestion,
    onInsightDiscovered,
    onDialogueComplete,
  } = options;

  const [dialogue, setDialogue] = useState<SocraticDialogue | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<SocraticQuestion | null>(null);
  const [dialogueState, setDialogueState] = useState<DialogueState | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [lastResponse, setLastResponse] = useState<SocraticResponse | null>(null);
  const [discoveredInsights, setDiscoveredInsights] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [encouragement, setEncouragement] = useState<string | null>(null);
  const [availableHints, setAvailableHints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentHintIndexRef = useRef(0);
  const previousInsightsRef = useRef<string[]>([]);

  const isActive = dialogue !== null && dialogueState !== 'conclusion';
  const isComplete = dialogueState === 'conclusion';

  /**
   * Start a new Socratic dialogue
   */
  const startDialogue = useCallback(
    async (topic: string, startOptions?: Partial<StartDialogueInput>): Promise<SocraticResponse | null> => {
      if (!userId) {
        setError('User ID is required');
        return null;
      }

      setIsWaiting(true);
      setError(null);

      try {
        const response = await fetch(`${apiEndpoint}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            topic,
            courseId,
            sectionId,
            preferredStyle,
            ...startOptions,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to start dialogue: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const socraticResponse = data.data as SocraticResponse;
          const newDialogue = data.dialogue as SocraticDialogue;

          setDialogue(newDialogue);
          setDialogueState(socraticResponse.state);
          setCurrentQuestion(socraticResponse.question || null);
          setLastResponse(socraticResponse);
          setDiscoveredInsights(socraticResponse.discoveredInsights);
          setProgress(socraticResponse.progress);
          setFeedback(socraticResponse.feedback || null);
          setEncouragement(socraticResponse.encouragement || null);
          setAvailableHints(socraticResponse.availableHints || []);
          currentHintIndexRef.current = 0;
          previousInsightsRef.current = [];

          onDialogueStart?.(newDialogue);
          if (socraticResponse.question) {
            onQuestion?.(socraticResponse.question);
          }

          return socraticResponse;
        }

        throw new Error(data.error?.message || 'Failed to start dialogue');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsWaiting(false);
      }
    },
    [apiEndpoint, userId, courseId, sectionId, preferredStyle, onDialogueStart, onQuestion]
  );

  /**
   * Submit a response
   */
  const submitResponse = useCallback(
    async (userResponse: string): Promise<SocraticResponse | null> => {
      if (!dialogue) {
        setError('No active dialogue');
        return null;
      }

      setIsWaiting(true);
      setError(null);

      try {
        const response = await fetch(`${apiEndpoint}/continue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dialogueId: dialogue.id,
            response: userResponse,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to submit response: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const socraticResponse = data.data as SocraticResponse;

          setDialogueState(socraticResponse.state);
          setCurrentQuestion(socraticResponse.question || null);
          setLastResponse(socraticResponse);
          setProgress(socraticResponse.progress);
          setFeedback(socraticResponse.feedback || null);
          setEncouragement(socraticResponse.encouragement || null);
          setAvailableHints(socraticResponse.availableHints || []);
          currentHintIndexRef.current = 0;

          // Check for new insights
          const newInsights = socraticResponse.discoveredInsights.filter(
            (i: string) => !previousInsightsRef.current.includes(i)
          );
          if (newInsights.length > 0) {
            newInsights.forEach((insight: string) => onInsightDiscovered?.(insight));
            previousInsightsRef.current = socraticResponse.discoveredInsights;
          }
          setDiscoveredInsights(socraticResponse.discoveredInsights);

          // Update dialogue from response
          if (data.dialogue) {
            setDialogue(data.dialogue);
          }

          // Handle completion
          if (socraticResponse.isComplete) {
            if (data.performance) {
              onDialogueComplete?.(data.performance);
            }
          }

          // Trigger question callback
          if (socraticResponse.question) {
            onQuestion?.(socraticResponse.question);
          }

          return socraticResponse;
        }

        throw new Error(data.error?.message || 'Failed to submit response');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsWaiting(false);
      }
    },
    [apiEndpoint, dialogue, userId, onQuestion, onInsightDiscovered, onDialogueComplete]
  );

  /**
   * Request a hint
   */
  const requestHint = useCallback(async (): Promise<string | null> => {
    if (!dialogue) {
      setError('No active dialogue');
      return null;
    }

    // First try local hints
    if (availableHints.length > currentHintIndexRef.current) {
      const hint = availableHints[currentHintIndexRef.current];
      currentHintIndexRef.current++;
      return hint;
    }

    // Then try API
    try {
      const response = await fetch(`${apiEndpoint}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogueId: dialogue.id,
          hintIndex: currentHintIndexRef.current,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.success && data.hint) {
        currentHintIndexRef.current++;
        return data.hint;
      }

      return null;
    } catch {
      return null;
    }
  }, [apiEndpoint, dialogue, availableHints]);

  /**
   * Skip current question
   */
  const skipQuestion = useCallback(async (): Promise<SocraticResponse | null> => {
    if (!dialogue) {
      setError('No active dialogue');
      return null;
    }

    setIsWaiting(true);
    setError(null);

    try {
      const response = await fetch(`${apiEndpoint}/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogueId: dialogue.id,
          skipQuestion: true,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to skip question: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const socraticResponse = data.data as SocraticResponse;

        setDialogueState(socraticResponse.state);
        setCurrentQuestion(socraticResponse.question || null);
        setLastResponse(socraticResponse);
        setProgress(socraticResponse.progress);
        setFeedback(socraticResponse.feedback || null);
        setEncouragement(socraticResponse.encouragement || null);
        setAvailableHints(socraticResponse.availableHints || []);
        currentHintIndexRef.current = 0;

        if (socraticResponse.question) {
          onQuestion?.(socraticResponse.question);
        }

        return socraticResponse;
      }

      throw new Error(data.error?.message || 'Failed to skip question');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsWaiting(false);
    }
  }, [apiEndpoint, dialogue, userId, onQuestion]);

  /**
   * End dialogue early
   */
  const endDialogue = useCallback(async (): Promise<{ synthesis: string; performance: DialoguePerformance } | null> => {
    if (!dialogue) {
      setError('No active dialogue');
      return null;
    }

    setIsWaiting(true);
    setError(null);

    try {
      const response = await fetch(`${apiEndpoint}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialogueId: dialogue.id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to end dialogue: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setDialogueState('conclusion');
        setCurrentQuestion(null);

        onDialogueComplete?.(data.data.performance);

        return data.data;
      }

      throw new Error(data.error?.message || 'Failed to end dialogue');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsWaiting(false);
    }
  }, [apiEndpoint, dialogue, onDialogueComplete]);

  /**
   * Get dialogue history
   */
  const getHistory = useCallback(
    async (limit: number = 10): Promise<SocraticDialogue[]> => {
      if (!userId) return [];

      try {
        const response = await fetch(`${apiEndpoint}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, limit }),
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.success ? data.data : [];
      } catch {
        return [];
      }
    },
    [apiEndpoint, userId]
  );

  /**
   * Reset dialogue state
   */
  const resetDialogue = useCallback(() => {
    setDialogue(null);
    setCurrentQuestion(null);
    setDialogueState(null);
    setLastResponse(null);
    setDiscoveredInsights([]);
    setProgress(0);
    setFeedback(null);
    setEncouragement(null);
    setAvailableHints([]);
    setError(null);
    currentHintIndexRef.current = 0;
    previousInsightsRef.current = [];
  }, []);

  return {
    dialogue,
    currentQuestion,
    dialogueState,
    isActive,
    isWaiting,
    isComplete,
    lastResponse,
    discoveredInsights,
    progress,
    feedback,
    encouragement,
    availableHints,
    error,
    startDialogue,
    submitResponse,
    requestHint,
    skipQuestion,
    endDialogue,
    getHistory,
    resetDialogue,
  };
}

export default useSAMSocraticDialogue;
