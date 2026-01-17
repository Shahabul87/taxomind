/**
 * @sam-ai/react - useInterventions Hook
 * React hook for managing proactive interventions, nudges, and notifications
 */
import type { SAMWebSocketEvent, InterventionUIState, InterventionDisplayConfig, InterventionQueue, InterventionSurface, NudgePayload, CelebrationPayload, RecommendationPayload, GoalProgressPayload, StepCompletionPayload } from '@sam-ai/agentic';
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
export declare function useInterventions(options?: UseInterventionsOptions): UseInterventionsReturn;
export default useInterventions;
//# sourceMappingURL=useInterventions.d.ts.map