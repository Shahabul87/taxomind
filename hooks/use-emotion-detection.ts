"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Emotion types that can be detected during learning
 */
export type EmotionType =
  | "engaged"
  | "focused"
  | "confused"
  | "frustrated"
  | "bored"
  | "excited"
  | "neutral"
  | "overwhelmed";

export interface EmotionState {
  currentEmotion: EmotionType;
  confidence: number;
  timestamp: string;
  recommendation?: string;
  suggestedAction?: EmotionAction;
}

export interface EmotionAction {
  type: "show_help" | "take_break" | "simplify_content" | "offer_encouragement" | "suggest_exercise" | "none";
  message: string;
  priority: "low" | "medium" | "high";
}

export interface InteractionPattern {
  scrollSpeed: number;
  pauseDuration: number;
  clickFrequency: number;
  backtrackCount: number;
  timeOnSection: number;
  videoSeekCount: number;
  notesTaken: boolean;
}

interface UseEmotionDetectionOptions {
  /** User ID */
  userId?: string;
  /** Current course ID */
  courseId?: string;
  /** Current section ID */
  sectionId?: string;
  /** Detection interval in milliseconds (default: 5 minutes) */
  detectionInterval?: number;
  /** Whether to automatically detect emotions */
  autoDetect?: boolean;
  /** Callback when frustration or confusion is detected */
  onNegativeEmotion?: (state: EmotionState) => void;
  /** Callback when engagement drops */
  onDisengagement?: (state: EmotionState) => void;
}

interface UseEmotionDetectionReturn {
  /** Current emotion state */
  emotionState: EmotionState | null;
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Error if detection failed */
  error: string | null;
  /** Manually trigger emotion detection */
  detectEmotion: () => Promise<void>;
  /** Record an interaction for pattern analysis */
  recordInteraction: (type: string, data?: Record<string, unknown>) => void;
  /** Get current interaction patterns */
  getInteractionPatterns: () => InteractionPattern;
  /** Reset interaction tracking */
  resetTracking: () => void;
  /** Dismiss current emotion notification */
  dismissNotification: () => void;
  /** Whether a notification should be shown */
  showNotification: boolean;
}

const DETECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes
const INTERACTION_WINDOW = 60 * 1000; // 1 minute for interaction analysis

/**
 * Hook for detecting user emotions during learning sessions
 *
 * Analyzes user interaction patterns and uses SAM AI to detect
 * emotional states, providing recommendations for intervention.
 *
 * @example
 * ```tsx
 * const { emotionState, showNotification, dismissNotification } = useEmotionDetection({
 *   userId: user.id,
 *   courseId,
 *   sectionId,
 *   onNegativeEmotion: (state) => {
 *     toast.info(state.recommendation);
 *   }
 * });
 * ```
 */
export function useEmotionDetection(
  options: UseEmotionDetectionOptions = {}
): UseEmotionDetectionReturn {
  const {
    userId,
    courseId,
    sectionId,
    detectionInterval = DETECTION_INTERVAL,
    autoDetect = true,
    onNegativeEmotion,
    onDisengagement,
  } = options;

  const [emotionState, setEmotionState] = useState<EmotionState | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Interaction tracking refs
  const interactionsRef = useRef<Array<{ type: string; timestamp: number; data?: Record<string, unknown> }>>([]);
  const sessionStartRef = useRef<number>(Date.now());
  const scrollPositionsRef = useRef<number[]>([]);
  const lastScrollTimeRef = useRef<number>(Date.now());

  // Record user interactions
  const recordInteraction = useCallback((type: string, data?: Record<string, unknown>) => {
    const now = Date.now();
    interactionsRef.current.push({ type, timestamp: now, data });

    // Track scroll positions for backtrack detection
    if (type === "scroll" && data?.position !== undefined) {
      scrollPositionsRef.current.push(data.position as number);
      lastScrollTimeRef.current = now;
    }

    // Keep only recent interactions (within window)
    interactionsRef.current = interactionsRef.current.filter(
      (i) => now - i.timestamp < INTERACTION_WINDOW * 5
    );
  }, []);

  // Calculate interaction patterns
  const getInteractionPatterns = useCallback((): InteractionPattern => {
    const now = Date.now();
    const recentInteractions = interactionsRef.current.filter(
      (i) => now - i.timestamp < INTERACTION_WINDOW
    );

    // Calculate scroll speed (positions per second)
    const scrollPositions = scrollPositionsRef.current.slice(-10);
    const scrollSpeed =
      scrollPositions.length > 1
        ? Math.abs(scrollPositions[scrollPositions.length - 1] - scrollPositions[0]) /
          ((now - (lastScrollTimeRef.current - INTERACTION_WINDOW)) / 1000)
        : 0;

    // Calculate pause duration (time since last interaction)
    const lastInteraction = interactionsRef.current[interactionsRef.current.length - 1];
    const pauseDuration = lastInteraction ? now - lastInteraction.timestamp : 0;

    // Count clicks
    const clicks = recentInteractions.filter((i) => i.type === "click").length;
    const clickFrequency = clicks / (INTERACTION_WINDOW / 1000);

    // Detect backtracking (going back to previous scroll positions)
    let backtrackCount = 0;
    for (let i = 1; i < scrollPositions.length; i++) {
      if (scrollPositions[i] < scrollPositions[i - 1]) {
        backtrackCount++;
      }
    }

    // Time on current section
    const timeOnSection = now - sessionStartRef.current;

    // Video seek count
    const videoSeekCount = recentInteractions.filter((i) => i.type === "video_seek").length;

    // Notes taken
    const notesTaken = recentInteractions.some((i) => i.type === "note_taken");

    return {
      scrollSpeed,
      pauseDuration,
      clickFrequency,
      backtrackCount,
      timeOnSection,
      videoSeekCount,
      notesTaken,
    };
  }, []);

  // Detect emotion from patterns
  const detectEmotion = useCallback(async () => {
    if (!userId) return;

    setIsDetecting(true);
    setError(null);

    try {
      const patterns = getInteractionPatterns();

      const response = await fetch("/api/sam/ai-tutor/detect-emotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          courseId,
          sectionId,
          sessionDuration: Date.now() - sessionStartRef.current,
          interactionPatterns: patterns,
          recentInteractions: interactionsRef.current.slice(-20),
        }),
      });

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const newState: EmotionState = {
          currentEmotion: data.data.emotion ?? "neutral",
          confidence: data.data.confidence ?? 0.5,
          timestamp: new Date().toISOString(),
          recommendation: data.data.recommendation,
          suggestedAction: data.data.suggestedAction,
        };

        setEmotionState(newState);

        // Check for negative emotions
        if (["frustrated", "confused", "overwhelmed"].includes(newState.currentEmotion)) {
          setShowNotification(true);
          onNegativeEmotion?.(newState);
        }

        // Check for disengagement
        if (["bored", "neutral"].includes(newState.currentEmotion) && newState.confidence > 0.7) {
          onDisengagement?.(newState);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Emotion detection failed";
      console.error("Emotion detection error:", errorMessage);
      setError(errorMessage);

      // Set neutral state on error
      setEmotionState({
        currentEmotion: "neutral",
        confidence: 0.3,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsDetecting(false);
    }
  }, [userId, courseId, sectionId, getInteractionPatterns, onNegativeEmotion, onDisengagement]);

  // Auto-detect at intervals
  useEffect(() => {
    if (!autoDetect || !userId) return;

    // Initial detection after 2 minutes
    const initialTimer = setTimeout(() => {
      detectEmotion();
    }, 2 * 60 * 1000);

    // Recurring detection
    const intervalId = setInterval(detectEmotion, detectionInterval);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [autoDetect, userId, detectionInterval, detectEmotion]);

  // Track scroll events
  useEffect(() => {
    const handleScroll = () => {
      recordInteraction("scroll", { position: window.scrollY });
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      recordInteraction("click", {
        tagName: target.tagName,
        className: target.className,
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
    };
  }, [recordInteraction]);

  // Reset tracking when section changes
  useEffect(() => {
    sessionStartRef.current = Date.now();
    scrollPositionsRef.current = [];
    interactionsRef.current = [];
  }, [sectionId]);

  const resetTracking = useCallback(() => {
    sessionStartRef.current = Date.now();
    scrollPositionsRef.current = [];
    interactionsRef.current = [];
    setEmotionState(null);
    setShowNotification(false);
  }, []);

  const dismissNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  return {
    emotionState,
    isDetecting,
    error,
    detectEmotion,
    recordInteraction,
    getInteractionPatterns,
    resetTracking,
    dismissNotification,
    showNotification,
  };
}

/**
 * Get support message based on emotion
 */
export function getEmotionSupportMessage(emotion: EmotionType): string {
  switch (emotion) {
    case "frustrated":
      return "It looks like you might be finding this challenging. Would you like some hints or a different explanation?";
    case "confused":
      return "This topic can be tricky. Let me break it down differently for you.";
    case "overwhelmed":
      return "There is a lot to take in here. Would you like to take a short break or focus on one concept at a time?";
    case "bored":
      return "Ready for more of a challenge? Try the practice problems or move to the next section.";
    case "engaged":
      return "Great focus! Keep up the excellent work.";
    case "excited":
      return "Your enthusiasm is awesome! Ready to dive deeper?";
    case "focused":
      return "You are in the zone! Perfect time for complex topics.";
    default:
      return "How can I help you learn better?";
  }
}

export default useEmotionDetection;
