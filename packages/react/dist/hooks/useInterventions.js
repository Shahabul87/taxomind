/**
 * @sam-ai/react - useInterventions Hook
 * React hook for managing proactive interventions, nudges, and notifications
 */
'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================
const DEFAULT_OPTIONS = {
    maxVisible: 3,
    autoDismissMs: 10000,
    enableSound: false,
    defaultSurface: 'toast',
};
const DEFAULT_DISPLAY_CONFIG = {
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
export function useInterventions(options = {}) {
    const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only recompute when specific options change
    [
        options.defaultSurface,
        options.autoDismissMs,
        options.maxVisible,
        options.enableSound,
        options.onIntervention,
        options.acknowledge,
    ]);
    // State
    const [interventions, setInterventions] = useState(new Map());
    const [visibleIds, setVisibleIds] = useState(new Set());
    // Latest events by type
    const [latestNudge, setLatestNudge] = useState(null);
    const [latestCelebration, setLatestCelebration] = useState(null);
    const [latestRecommendation, setLatestRecommendation] = useState(null);
    const [latestGoalProgress, setLatestGoalProgress] = useState(null);
    const [latestStepCompletion, setLatestStepCompletion] = useState(null);
    // Auto-dismiss timers
    const dismissTimersRef = useRef(new Map());
    // Generate unique ID
    const generateId = useCallback(() => {
        return `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }, []);
    // Get display config for event type
    const getDisplayConfig = useCallback((event) => {
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
                    dismissible: event.dismissible ?? true,
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
                    position: event.payload.position || 'top-right',
                    priority: 4,
                    duration: event.payload.dismissAfterMs || opts.autoDismissMs,
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
    }, [opts.defaultSurface, opts.enableSound, opts.autoDismissMs]);
    // Add intervention
    const add = useCallback((event, customConfig) => {
        const id = event.eventId || generateId();
        const displayConfig = {
            ...getDisplayConfig(event),
            ...customConfig,
        };
        const intervention = {
            id,
            event,
            displayConfig,
            visible: false,
            createdAt: new Date(),
        };
        // Update type-specific state
        switch (event.type) {
            case 'nudge':
                setLatestNudge(event.payload);
                break;
            case 'celebration':
                setLatestCelebration(event.payload);
                break;
            case 'recommendation':
                setLatestRecommendation(event.payload);
                break;
            case 'goal_progress':
                setLatestGoalProgress(event.payload);
                break;
            case 'step_completed':
                setLatestStepCompletion(event.payload);
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
                // Set auto-dismiss timer
                if (displayConfig.duration && displayConfig.duration > 0) {
                    const timer = setTimeout(() => {
                        dismiss(id, 'timeout');
                    }, displayConfig.duration);
                    dismissTimersRef.current.set(id, timer);
                }
                return next;
            }
            return prev;
        });
        opts.onIntervention?.(intervention);
        opts.acknowledge?.(id, 'viewed');
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dismiss is defined after this callback
    [generateId, getDisplayConfig, opts]);
    // Dismiss intervention
    const dismiss = useCallback((interventionId, reason = 'user_action') => {
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
        opts.onDismiss?.(interventionId, reason);
        opts.dismissEvent?.(interventionId, reason);
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
    }, [opts]);
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
    const markViewed = useCallback((interventionId) => {
        setInterventions((prev) => {
            const next = new Map(prev);
            const int = next.get(interventionId);
            if (int && !int.interactedAt) {
                next.set(interventionId, { ...int, interactedAt: new Date() });
            }
            return next;
        });
        opts.acknowledge?.(interventionId, 'viewed');
    }, [opts]);
    // Trigger action
    const triggerAction = useCallback((interventionId, action) => {
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
        opts.onAction?.(interventionId, action);
        opts.acknowledge?.(interventionId, 'clicked');
    }, [opts]);
    // Check if type is visible
    const hasVisible = useCallback((type) => {
        return Array.from(interventions.values()).some((i) => i.visible && i.event.type === type);
    }, [interventions]);
    // Get by ID
    const get = useCallback((interventionId) => {
        return interventions.get(interventionId);
    }, [interventions]);
    // Cleanup timers on unmount
    useEffect(() => {
        const timers = dismissTimersRef.current;
        return () => {
            timers.forEach((timer) => clearTimeout(timer));
        };
    }, []);
    // Build queue
    const allInterventions = Array.from(interventions.values());
    const queue = {
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
