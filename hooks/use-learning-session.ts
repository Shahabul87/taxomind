import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface LearningSessionHook {
  sessionId: string | null;
  isTracking: boolean;
  startSession: (courseId: string, chapterId?: string) => Promise<void>;
  updateProgress: (data: {
    completionPercentage?: number;
    engagementScore?: number;
    interactionCount?: number;
    pauseCount?: number;
    seekCount?: number;
    strugglingIndicators?: string[];
  }) => Promise<void>;
  endSession: (finalData?: any) => Promise<void>;
  recordInteraction: () => void;
  recordPause: () => void;
  recordSeek: () => void;
  markStruggling: (indicators: string[]) => void;
}

// Feature flag to control API calls - Set to true when database is ready
const ENABLE_SESSION_API_CALLS = false;

export function useLearningSession(): LearningSessionHook {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [engagementScore, setEngagementScore] = useState(100);
  const [interactionCount, setInteractionCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [seekCount, setSeekCount] = useState(0);
  const [strugglingIndicators, setStrugglingIndicators] = useState<string[]>([]);
  
  const lastActivityRef = useRef<Date>(new Date());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const periodicUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor user activity and adjust engagement score
  useEffect(() => {
    if (!isTracking) return;

    const handleActivity = () => {
      lastActivityRef.current = new Date();
      
      // Reset inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      // Set new inactivity timer
      inactivityTimerRef.current = setTimeout(() => {
        // Decrease engagement score due to inactivity
        setEngagementScore(prev => Math.max(0, prev - 10));
      }, 30000); // 30 seconds of inactivity
    };

    // Listen for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial activity setup
    handleActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isTracking]);

  const updateProgress = useCallback(async (data: {
    completionPercentage?: number;
    engagementScore?: number;
    interactionCount?: number;
    pauseCount?: number;
    seekCount?: number;
    strugglingIndicators?: string[];
  }) => {
    if (!sessionId) return;

    // Skip API calls if disabled
    if (!ENABLE_SESSION_API_CALLS) {
      console.log('[Learning Session] API calls disabled - skipping progress update');
      return;
    }

    try {
      const response = await axios.patch(`/api/progress/sessions/${sessionId}`, {
        ...data,
        engagementScore: data.engagementScore ?? engagementScore,
        interactionCount: data.interactionCount ?? interactionCount,
        pauseCount: data.pauseCount ?? pauseCount,
        seekCount: data.seekCount ?? seekCount,
        strugglingIndicators: data.strugglingIndicators ?? strugglingIndicators
      });

      if (!response.data.success) {
        console.error('Failed to update session progress');
      }
    } catch (error) {
      console.error('Failed to update session progress:', error);
    }
  }, [sessionId, engagementScore, interactionCount, pauseCount, seekCount, strugglingIndicators]);

  // Periodic updates to server
  useEffect(() => {
    if (!isTracking || !sessionId) return;

    periodicUpdateRef.current = setInterval(async () => {
      try {
        await updateProgress({
          engagementScore,
          interactionCount,
          pauseCount,
          seekCount,
          strugglingIndicators
        });
      } catch (error) {
        console.error('Failed to send periodic update:', error);
      }
    }, 60000); // Update every minute

    return () => {
      if (periodicUpdateRef.current) {
        clearInterval(periodicUpdateRef.current);
      }
    };
  }, [isTracking, sessionId, engagementScore, interactionCount, pauseCount, seekCount, strugglingIndicators, updateProgress]);

  const startSession = useCallback(async (courseId: string, chapterId?: string) => {
    // Skip API calls if disabled
    if (!ENABLE_SESSION_API_CALLS) {
      console.log('[Learning Session] API calls disabled - using mock session');
      // Use mock session ID
      setSessionId('mock-session-' + Date.now());
      setIsTracking(true);
      
      // Reset all counters
      setEngagementScore(100);
      setInteractionCount(0);
      setPauseCount(0);
      setSeekCount(0);
      setStrugglingIndicators([]);
      return;
    }

    try {
      const response = await axios.post('/api/progress/sessions', {
        courseId,
        chapterId
      });

      if (response.data.success) {
        setSessionId(response.data.session.id);
        setIsTracking(true);
        
        // Reset all counters
        setEngagementScore(100);
        setInteractionCount(0);
        setPauseCount(0);
        setSeekCount(0);
        setStrugglingIndicators([]);
        
        console.log('Learning session started:', response.data.session.id);
      }
    } catch (error) {
      console.error('Failed to start learning session:', error);
    }
  }, []);

  const endSession = useCallback(async (finalData?: any) => {
    if (!sessionId) return;

    // Clear timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (periodicUpdateRef.current) {
      clearInterval(periodicUpdateRef.current);
    }

    // Skip API calls if disabled
    if (!ENABLE_SESSION_API_CALLS) {
      console.log('[Learning Session] API calls disabled - ending mock session');
      setSessionId(null);
      setIsTracking(false);
      return;
    }

    try {
      const response = await axios.delete(`/api/progress/sessions/${sessionId}`, {
        data: {
          finalData: {
            ...finalData,
            engagementScore,
            interactionCount,
            pauseCount,
            seekCount,
            strugglingIndicators
          }
        }
      });

      if (response.data.success) {
        setSessionId(null);
        setIsTracking(false);
        console.log('Learning session ended');
      }
    } catch (error) {
      console.error('Failed to end learning session:', error);
    }
  }, [sessionId, engagementScore, interactionCount, pauseCount, seekCount, strugglingIndicators]);

  const recordInteraction = useCallback(() => {
    setInteractionCount(prev => prev + 1);
    
    // Positive interaction boosts engagement slightly
    setEngagementScore(prev => Math.min(100, prev + 1));
    
    lastActivityRef.current = new Date();
  }, []);

  const recordPause = useCallback(() => {
    setPauseCount(prev => prev + 1);
    
    // Too many pauses indicate confusion or difficulty
    if (pauseCount > 5) {
      setEngagementScore(prev => Math.max(0, prev - 5));
    }
  }, [pauseCount]);

  const recordSeek = useCallback(() => {
    setSeekCount(prev => prev + 1);
    
    // Excessive seeking might indicate confusion
    if (seekCount > 10) {
      setEngagementScore(prev => Math.max(0, prev - 3));
      
      // Auto-add struggling indicator
      setStrugglingIndicators(prev => 
        prev.includes('excessive_seeking') 
          ? prev 
          : [...prev, 'excessive_seeking']
      );
    }
  }, [seekCount]);

  const markStruggling = useCallback((indicators: string[]) => {
    setStrugglingIndicators(prev => {
      const newIndicators = [...prev];
      indicators.forEach(indicator => {
        if (!newIndicators.includes(indicator)) {
          newIndicators.push(indicator);
        }
      });
      return newIndicators;
    });
    
    // Significantly reduce engagement score when struggling
    setEngagementScore(prev => Math.max(0, prev - 20));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking && sessionId) {
        // Try to end session on unmount
        endSession({ status: 'ABANDONED' });
      }
    };
  }, [isTracking, sessionId, endSession]);

  return {
    sessionId,
    isTracking,
    startSession,
    updateProgress,
    endSession,
    recordInteraction,
    recordPause,
    recordSeek,
    markStruggling
  };
}