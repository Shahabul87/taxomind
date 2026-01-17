/**
 * @sam-ai/react - Tutoring Orchestration Hook
 *
 * Provides access to plan-driven tutoring state for UI components.
 * Consumes orchestration data from the SAM unified API response.
 */
import { type ReactNode } from 'react';
export interface TutoringStep {
    id: string;
    title: string;
    type: string;
    objectives: string[];
}
export interface StepProgress {
    progressPercent: number;
    stepComplete: boolean;
    confidence: number;
    pendingCriteria: string[];
    recommendations: Array<{
        type: string;
        reason: string;
    }>;
}
export interface StepTransition {
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
export interface PendingConfirmation {
    id: string;
    toolId: string;
    toolName: string;
    riskLevel: string;
}
export interface OrchestrationMetadata {
    processingTime: number;
    stepAdvanced: boolean;
    planCompleted: boolean;
    interventionsTriggered: number;
}
export interface TutoringOrchestrationState {
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
export declare function useTutoringOrchestration(): UseTutoringOrchestrationReturn;
/**
 * Hook for just the current step information
 */
export declare function useCurrentStep(): {
    step: TutoringStep | null;
    objectives: string[];
    stepType: string | null;
};
/**
 * Hook for step progress tracking
 */
export declare function useStepProgress(): {
    progressPercent: number;
    isComplete: boolean;
    confidence: number;
    pendingCriteria: string[];
};
/**
 * Hook for celebration display
 */
export declare function useStepCelebration(): {
    show: boolean;
    celebration: StepTransition['celebration'];
    dismiss: () => void;
};
export declare function TutoringOrchestrationProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useTutoringOrchestrationContext(): UseTutoringOrchestrationReturn;
export {};
//# sourceMappingURL=useTutoringOrchestration.d.ts.map