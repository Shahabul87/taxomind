/**
 * @sam-ai/react - useInterventions Hook
 * React hook for managing proactive interventions, nudges, and notifications
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  SAMWebSocketEvent,
  InterventionUIState,
  InterventionDisplayConfig,
  InterventionQueue,
  InterventionSurface,
  NudgePayload,
  CelebrationPayload,
  RecommendationPayload,
  GoalProgressPayload,
  StepCompletionPayload,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface UseInterventionsOptions {
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

export interface UseInterventionsReturn {
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

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_OPTIONS: Required<
  Omit<UseInterventionsOptions, 'onIntervention' | 'onDismiss' | 'onAction' | 'acknowledge' | 'dismissEvent'>
> = {
  maxVisible: 3,
  autoDismissMs: 10000,
  enableSound: false,
  defaultSurface: 'toast',
};

const DEFAULT_DISPLAY_CONFIG: InterventionDisplayConfig = {
  surface: 'toast',
  position: 'top-right',
  duration: 10000,
  dismissible: true,
  blocking: false,
  priority: 1,
  animation: 'slide',
  sound: false,
  vibrate: false,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useInterventions(options: UseInterventionsOptions = {}): UseInterventionsReturn {
  // Store callback options in refs so they do not destabilize memoized values
  const onInterventionRef = useRef(options.onIntervention);
  onInterventionRef.current = options.onIntervention;
  const acknowledgeRef = useRef(options.acknowledge);
  acknowledgeRef.current = options.acknowledge;
  const onDismissRef = useRef(options.onDismiss);
  onDismissRef.current = options.onDismiss;
  const dismissEventRef = useRef(options.dismissEvent);
  dismissEventRef.current = options.dismissEvent;
  const onActionRef = useRef(options.onAction);
  onActionRef.current = options.onAction;

  const opts = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      defaultSurface: options.defaultSurface ?? DEFAULT_OPTIONS.defaultSurface,
      autoDismissMs: options.autoDismissMs ?? DEFAULT_OPTIONS.autoDismissMs,
      maxVisible: options.maxVisible ?? DEFAULT_OPTIONS.maxVisible,
      enableSound: options.enableSound ?? DEFAULT_OPTIONS.enableSound,
    }),
    [
      options.defaultSurface,
      options.autoDismissMs,
      options.maxVisible,
      options.enableSound,
    ]
  );

  // State
  const [interventions, setInterventions] = useState<Map<string, InterventionUIState>>(new Map());
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  // Latest events by type
  const [latestNudge, setLatestNudge] = useState<NudgePayload | null>(null);
  const [latestCelebration, setLatestCelebration] = useState<CelebrationPayload | null>(null);
  const [latestRecommendation, setLatestRecommendation] = useState<RecommendationPayload | null>(null);
  const [latestGoalProgress, setLatestGoalProgress] = useState<GoalProgressPayload | null>(null);
  const [latestStepCompletion, setLatestStepCompletion] = useState<StepCompletionPayload | null>(null);

  // Auto-dismiss timers
  const dismissTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Ref for dismiss callback to break circular dependency between add and dismiss
  const dismissRef = useRef<(id: string, reason?: string) => void>(() => {});

  // Generate unique ID
  const generateId = useCallback(() => {
    return `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Get display config for event type
  const getDisplayConfig = useCallback(
    (event: SAMWebSocketEvent): InterventionDisplayConfig => {
      const config = { ...DEFAULT_DISPLAY_CONFIG, surface: opts.defaultSurface };

      switch (event.type) {
        case 'celebration':
          return {
            ...config,
            surface: 'modal',
            position: 'center',
            blocking: true,
            priority: 10,
            animation: 'bounce',
            sound: opts.enableSound,
            duration: 5000,
          };
        case 'intervention':
          return {
            ...config,
            surface: 'modal',
            position: 'center',
            blocking: true,
            priority: 8,
            dismissible: (event as { dismissible?: boolean }).dismissible ?? true,
          };
        case 'checkin':
          return {
            ...config,
            surface: 'sidebar',
            position: 'right',
            blocking: false,
            priority: 6,
          };
        case 'nudge':
          return {
            ...config,
            surface: 'toast',
            position: ((event.payload as NudgePayload).position as InterventionDisplayConfig['position']) || 'top-right',
            priority: 4,
            duration: (event.payload as NudgePayload).dismissAfterMs || opts.autoDismissMs,
          };
        case 'recommendation':
          return {
            ...config,
            surface: 'toast',
            position: 'bottom-right',
            priority: 3,
          };
        case 'step_completed':
        case 'goal_progress':
          return {
            ...config,
            surface: 'toast',
            position: 'top-right',
            priority: 5,
            duration: 5000,
          };
        default:
          return config;
      }
    },
    [opts.defaultSurface, opts.enableSound, opts.autoDismissMs]
  );

  // Add intervention
  const add = useCallback(
    (event: SAMWebSocketEvent, customConfig?: Partial<InterventionDisplayConfig>) => {
      const id = event.eventId || generateId();
      const displayConfig = {
        ...getDisplayConfig(event),
        ...customConfig,
      };

      const intervention: InterventionUIState = {
        id,
        event,
        displayConfig,
        visible: false,
        createdAt: new Date(),
      };

      // Update type-specific state
      switch (event.type) {
        case 'nudge':
          setLatestNudge(event.payload as NudgePayload);
          break;
        case 'celebration':
          setLatestCelebration(event.payload as CelebrationPayload);
          break;
        case 'recommendation':
          setLatestRecommendation(event.payload as RecommendationPayload);
          break;
        case 'goal_progress':
          setLatestGoalProgress(event.payload as GoalProgressPayload);
          break;
        case 'step_completed':
          setLatestStepCompletion(event.payload as StepCompletionPayload);
          break;
      }

      setInterventions((prev) => {
        const next = new Map(prev);
        next.set(id, intervention);
        return next;
      });

      // Show if under max visible
      setVisibleIds((prev) => {
        if (prev.size < opts.maxVisible) {
          const next = new Set(prev);
          next.add(id);

          // Update intervention to visible
          setInterventions((interventions) => {
            const updated = new Map(interventions);
            const int = updated.get(id);
            if (int) {
              updated.set(id, { ...int, visible: true, displayedAt: new Date() });
            }
            return updated;
          });

          // Set auto-dismiss timer using ref to avoid circular dependency
          if (displayConfig.duration && displayConfig.duration > 0) {
            const timer = setTimeout(() => {
              dismissRef.current(id, 'timeout');
            }, displayConfig.duration);
            dismissTimersRef.current.set(id, timer);
          }

          return next;
        }
        return prev;
      });

      onInterventionRef.current?.(intervention);
      acknowledgeRef.current?.(id, 'viewed');
    },
    [generateId, getDisplayConfig, opts]
  );

  // Dismiss intervention
  const dismiss = useCallback(
    (interventionId: string, reason: string = 'user_action') => {
      // Clear timer
      const timer = dismissTimersRef.current.get(interventionId);
      if (timer) {
        clearTimeout(timer);
        dismissTimersRef.current.delete(interventionId);
      }

      setVisibleIds((prev) => {
        const next = new Set(prev);
        next.delete(interventionId);
        return next;
      });

      setInterventions((prev) => {
        const next = new Map(prev);
        const int = next.get(interventionId);
        if (int) {
          next.set(interventionId, {
            ...int,
            visible: false,
            dismissedAt: new Date(),
            interactionType: 'dismiss',
          });
        }
        return next;
      });

      onDismissRef.current?.(interventionId, reason);
      dismissEventRef.current?.(interventionId, reason);

      // Show next pending intervention
      setInterventions((interventions) => {
        const pending = Array.from(interventions.values())
          .filter((i) => !i.visible && !i.dismissedAt)
          .sort((a, b) => b.displayConfig.priority - a.displayConfig.priority);

        if (pending.length > 0) {
          const nextInt = pending[0];
          setVisibleIds((vis) => {
            if (vis.size < opts.maxVisible) {
              const next = new Set(vis);
              next.add(nextInt.id);
              return next;
            }
            return vis;
          });
        }
        return interventions;
      });
    },
    [opts.maxVisible]
  );

  // Keep dismissRef in sync so add's setTimeout always calls the latest dismiss
  dismissRef.current = dismiss;

  // Dismiss all
  const dismissAll = useCallback(() => {
    // Clear all timers
    dismissTimersRef.current.forEach((timer) => clearTimeout(timer));
    dismissTimersRef.current.clear();

    setVisibleIds(new Set());
    setInterventions((prev) => {
      const next = new Map(prev);
      next.forEach((int, id) => {
        next.set(id, { ...int, visible: false, dismissedAt: new Date() });
      });
      return next;
    });
  }, []);

  // Mark as viewed
  const markViewed = useCallback(
    (interventionId: string) => {
      setInterventions((prev) => {
        const next = new Map(prev);
        const int = next.get(interventionId);
        if (int && !int.interactedAt) {
          next.set(interventionId, { ...int, interactedAt: new Date() });
        }
        return next;
      });
      acknowledgeRef.current?.(interventionId, 'viewed');
    },
    []
  );

  // Trigger action
  const triggerAction = useCallback(
    (interventionId: string, action: string) => {
      setInterventions((prev) => {
        const next = new Map(prev);
        const int = next.get(interventionId);
        if (int) {
          next.set(interventionId, {
            ...int,
            interactedAt: new Date(),
            interactionType: 'action',
          });
        }
        return next;
      });
      onActionRef.current?.(interventionId, action);
      acknowledgeRef.current?.(interventionId, 'clicked');
    },
    []
  );

  // Check if type is visible
  const hasVisible = useCallback(
    (type: string): boolean => {
      return Array.from(interventions.values()).some((i) => i.visible && i.event.type === type);
    },
    [interventions]
  );

  // Get by ID
  const get = useCallback(
    (interventionId: string): InterventionUIState | undefined => {
      return interventions.get(interventionId);
    },
    [interventions]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = dismissTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Build queue
  const allInterventions = Array.from(interventions.values());
  const queue: InterventionQueue = {
    items: allInterventions,
    maxVisible: opts.maxVisible,
    currentlyVisible: Array.from(visibleIds),
    priorityOrder: allInterventions
      .filter((i) => !i.dismissedAt)
      .sort((a, b) => b.displayConfig.priority - a.displayConfig.priority)
      .map((i) => i.id),
  };

  const visible = allInterventions.filter((i) => visibleIds.has(i.id));
  const pending = allInterventions.filter((i) => !i.visible && !i.dismissedAt);

  return {
    queue,
    visible,
    pending,
    add,
    dismiss,
    dismissAll,
    markViewed,
    triggerAction,
    hasVisible,
    get,
    latestNudge,
    latestCelebration,
    latestRecommendation,
    latestGoalProgress,
    latestStepCompletion,
  };
}

export default useInterventions;
