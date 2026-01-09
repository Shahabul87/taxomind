'use client';

/**
 * SAM AI Intervention Provider
 * Context provider for managing intervention state and delivery
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import type {
  InterventionContextValue,
  InterventionInstance,
  InterventionPayload,
  InterventionProviderProps,
  InterventionType,
} from './types';
import { typeToTheme } from './types';
import { InterventionBanner } from './InterventionBanner';
import { InterventionToast } from './InterventionToast';
import { InterventionModal } from './InterventionModal';

// ============================================================================
// CONTEXT
// ============================================================================

const InterventionContext = createContext<InterventionContextValue | null>(null);

// ============================================================================
// HOOKS
// ============================================================================

export function useInterventionContext(): InterventionContextValue {
  const context = useContext(InterventionContext);
  if (!context) {
    throw new Error('useInterventionContext must be used within InterventionProvider');
  }
  return context;
}

/**
 * Optional version of useInterventionContext that returns null
 * when not inside InterventionProvider instead of throwing.
 * Useful for components that may or may not be wrapped in the provider.
 */
export function useInterventionContextOptional(): InterventionContextValue | null {
  return useContext(InterventionContext);
}

// ============================================================================
// PROVIDER
// ============================================================================

export function InterventionProvider({
  children,
  maxVisible = 3,
  defaultAutoDismiss = true,
  defaultAutoDismissDelay = 8000,
  soundEnabled = false,
  hapticEnabled = false,
  onInterventionShow,
  onInterventionDismiss,
}: InterventionProviderProps) {
  const [interventions, setInterventions] = useState<InterventionInstance[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const idCounter = useRef(0);
  const dismissTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generate unique ID
  const generateId = useCallback(() => {
    idCounter.current += 1;
    return `intervention-${Date.now()}-${idCounter.current}`;
  }, []);

  // Clear dismiss timer
  const clearDismissTimer = useCallback((id: string) => {
    const timer = dismissTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.current.delete(id);
    }
  }, []);

  // Set dismiss timer
  const setDismissTimer = useCallback((id: string, delay: number) => {
    clearDismissTimer(id);
    const timer = setTimeout(() => {
      setInterventions(prev =>
        prev.map(i => i.id === id ? { ...i, dismissed: true } : i)
      );
      dismissTimers.current.delete(id);
    }, delay);
    dismissTimers.current.set(id, timer);
  }, [clearDismissTimer]);

  // Play sound effect
  const playSound = useCallback((type: InterventionType) => {
    if (!soundEnabled || typeof window === 'undefined') return;

    // Create audio context for sound effects
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different types
      const frequencies: Record<InterventionType, number> = {
        celebration: 880,
        goal_progress: 660,
        step_completed: 550,
        nudge: 440,
        recommendation: 440,
        checkin: 330,
        intervention: 523,
        streak_alert: 698,
        break_suggestion: 392,
      };

      oscillator.frequency.value = frequencies[type] || 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (!hapticEnabled || typeof navigator === 'undefined') return;

    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  }, [hapticEnabled]);

  // Show intervention
  const showIntervention = useCallback((
    payload: InterventionPayload,
    eventId?: string
  ): string => {
    const id = generateId();
    const theme = payload.theme || typeToTheme[payload.type];

    const instance: InterventionInstance = {
      ...payload,
      id,
      eventId: eventId || id,
      timestamp: new Date(),
      viewed: false,
      dismissed: false,
      theme,
      autoDismiss: payload.autoDismiss ?? defaultAutoDismiss,
      autoDismissDelay: payload.autoDismissDelay ?? defaultAutoDismissDelay,
    };

    setInterventions(prev => [...prev, instance]);

    // Set auto-dismiss timer if enabled
    if (instance.autoDismiss && !instance.requireInteraction && !isPaused) {
      setDismissTimer(id, instance.autoDismissDelay || defaultAutoDismissDelay);
    }

    // Play sound and haptic
    playSound(payload.type);
    triggerHaptic();

    // Callback
    onInterventionShow?.(instance);

    return id;
  }, [
    generateId,
    defaultAutoDismiss,
    defaultAutoDismissDelay,
    isPaused,
    setDismissTimer,
    playSound,
    triggerHaptic,
    onInterventionShow,
  ]);

  // Dismiss intervention
  const dismissIntervention = useCallback((id: string, actionTaken?: string) => {
    clearDismissTimer(id);

    setInterventions(prev => {
      const intervention = prev.find(i => i.id === id);
      if (intervention && onInterventionDismiss) {
        onInterventionDismiss(intervention, actionTaken);
      }
      return prev.map(i =>
        i.id === id ? { ...i, dismissed: true, actionTaken } : i
      );
    });
  }, [clearDismissTimer, onInterventionDismiss]);

  // Dismiss all
  const dismissAll = useCallback(() => {
    dismissTimers.current.forEach((_, id) => clearDismissTimer(id));
    setInterventions(prev => prev.map(i => ({ ...i, dismissed: true })));
  }, [clearDismissTimer]);

  // Mark viewed
  const markViewed = useCallback((id: string) => {
    setInterventions(prev =>
      prev.map(i => i.id === id ? { ...i, viewed: true } : i)
    );
  }, []);

  // Get by type
  const getByType = useCallback((type: InterventionType): InterventionInstance[] => {
    return interventions.filter(i => i.type === type && !i.dismissed);
  }, [interventions]);

  // Clear history
  const clearHistory = useCallback(() => {
    dismissTimers.current.forEach((_, id) => clearDismissTimer(id));
    setInterventions([]);
  }, [clearDismissTimer]);

  // Pause/Resume
  const pauseInterventions = useCallback(() => {
    setIsPaused(true);
    // Clear all timers when paused
    dismissTimers.current.forEach((_, id) => clearDismissTimer(id));
  }, [clearDismissTimer]);

  const resumeInterventions = useCallback(() => {
    setIsPaused(false);
    // Restart timers for active interventions
    interventions
      .filter(i => !i.dismissed && i.autoDismiss && !i.requireInteraction)
      .forEach(i => {
        setDismissTimer(i.id, i.autoDismissDelay || defaultAutoDismissDelay);
      });
  }, [interventions, setDismissTimer, defaultAutoDismissDelay]);

  // Compute derived state
  const activeInterventions = useMemo(() =>
    interventions.filter(i => !i.dismissed),
    [interventions]
  );

  const queue = useMemo(() =>
    activeInterventions.slice(maxVisible),
    [activeInterventions, maxVisible]
  );

  const visibleInterventions = useMemo(() =>
    activeInterventions.slice(0, maxVisible),
    [activeInterventions, maxVisible]
  );

  const activeIntervention = visibleInterventions[0] || null;

  // Separate by surface type
  const bannerInterventions = visibleInterventions.filter(i => i.surface === 'banner');
  const toastInterventions = visibleInterventions.filter(i => i.surface === 'toast' || !i.surface);
  const modalInterventions = visibleInterventions.filter(i => i.surface === 'modal');

  // Context value
  const contextValue = useMemo<InterventionContextValue>(() => ({
    interventions,
    activeIntervention,
    queue,
    showIntervention,
    dismissIntervention,
    dismissAll,
    markViewed,
    getByType,
    clearHistory,
    isPaused,
    pauseInterventions,
    resumeInterventions,
  }), [
    interventions,
    activeIntervention,
    queue,
    showIntervention,
    dismissIntervention,
    dismissAll,
    markViewed,
    getByType,
    clearHistory,
    isPaused,
    pauseInterventions,
    resumeInterventions,
  ]);

  return (
    <InterventionContext.Provider value={contextValue}>
      {children}

      {/* Banner Container - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
        <AnimatePresence mode="sync">
          {bannerInterventions.map((intervention) => (
            <InterventionBanner
              key={intervention.id}
              intervention={intervention}
              onDismiss={(actionTaken) => dismissIntervention(intervention.id, actionTaken)}
              onView={() => markViewed(intervention.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Toast Container - Fixed at bottom right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toastInterventions.map((intervention) => (
            <InterventionToast
              key={intervention.id}
              intervention={intervention}
              onDismiss={(actionTaken) => dismissIntervention(intervention.id, actionTaken)}
              onView={() => markViewed(intervention.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Container - Centered overlay */}
      <AnimatePresence>
        {modalInterventions.length > 0 && (
          <InterventionModal
            intervention={modalInterventions[0]}
            onDismiss={(actionTaken) => dismissIntervention(modalInterventions[0].id, actionTaken)}
            onView={() => markViewed(modalInterventions[0].id)}
          />
        )}
      </AnimatePresence>
    </InterventionContext.Provider>
  );
}

export default InterventionProvider;
