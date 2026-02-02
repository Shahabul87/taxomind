/**
 * @sam-ai/react - useSAMSocraticDialogue Hook
 * React hook for Socratic teaching dialogues
 */
'use client';
import { useState, useCallback, useRef } from 'react';
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
export function useSAMSocraticDialogue(options = {}) {
    const { apiEndpoint = '/api/sam/socratic', userId, courseId, sectionId, preferredStyle = 'balanced', onDialogueStart, onQuestion, onInsightDiscovered, onDialogueComplete, } = options;
    const [dialogue, setDialogue] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [dialogueState, setDialogueState] = useState(null);
    const [isWaiting, setIsWaiting] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);
    const [discoveredInsights, setDiscoveredInsights] = useState([]);
    const [progress, setProgress] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [encouragement, setEncouragement] = useState(null);
    const [availableHints, setAvailableHints] = useState([]);
    const [error, setError] = useState(null);
    const currentHintIndexRef = useRef(0);
    const previousInsightsRef = useRef([]);
    const isActive = dialogue !== null && dialogueState !== 'conclusion';
    const isComplete = dialogueState === 'conclusion';
    /**
     * Start a new Socratic dialogue
     */
    const startDialogue = useCallback(async (topic, startOptions) => {
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
                const socraticResponse = data.data;
                const newDialogue = data.dialogue;
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsWaiting(false);
        }
    }, [apiEndpoint, userId, courseId, sectionId, preferredStyle, onDialogueStart, onQuestion]);
    /**
     * Submit a response
     */
    const submitResponse = useCallback(async (userResponse) => {
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
                const socraticResponse = data.data;
                setDialogueState(socraticResponse.state);
                setCurrentQuestion(socraticResponse.question || null);
                setLastResponse(socraticResponse);
                setProgress(socraticResponse.progress);
                setFeedback(socraticResponse.feedback || null);
                setEncouragement(socraticResponse.encouragement || null);
                setAvailableHints(socraticResponse.availableHints || []);
                currentHintIndexRef.current = 0;
                // Check for new insights
                const newInsights = socraticResponse.discoveredInsights.filter((i) => !previousInsightsRef.current.includes(i));
                if (newInsights.length > 0) {
                    newInsights.forEach((insight) => onInsightDiscovered?.(insight));
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsWaiting(false);
        }
    }, [apiEndpoint, dialogue, userId, onQuestion, onInsightDiscovered, onDialogueComplete]);
    /**
     * Request a hint
     */
    const requestHint = useCallback(async () => {
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
        }
        catch {
            return null;
        }
    }, [apiEndpoint, dialogue, availableHints]);
    /**
     * Skip current question
     */
    const skipQuestion = useCallback(async () => {
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
                const socraticResponse = data.data;
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsWaiting(false);
        }
    }, [apiEndpoint, dialogue, userId, onQuestion]);
    /**
     * End dialogue early
     */
    const endDialogue = useCallback(async () => {
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsWaiting(false);
        }
    }, [apiEndpoint, dialogue, onDialogueComplete]);
    /**
     * Get dialogue history
     */
    const getHistory = useCallback(async (limit = 10) => {
        if (!userId)
            return [];
        try {
            const response = await fetch(`${apiEndpoint}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, limit }),
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.success ? data.data : [];
        }
        catch {
            return [];
        }
    }, [apiEndpoint, userId]);
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
