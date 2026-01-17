/**
 * @sam-ai/react - Tutoring Orchestration Hook
 *
 * Provides access to plan-driven tutoring state for UI components.
 * Consumes orchestration data from the SAM unified API response.
 */
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useCallback, useMemo, createContext, useContext } from 'react';
const initialState = {
    hasActivePlan: false,
    currentStep: null,
    stepProgress: null,
    transition: null,
    pendingConfirmations: [],
    metadata: null,
};
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
export function useTutoringOrchestration() {
    const [state, setState] = useState(initialState);
    const updateFromResponse = useCallback((orchestration) => {
        if (!orchestration) {
            return;
        }
        setState({
            hasActivePlan: orchestration.hasActivePlan ?? false,
            currentStep: orchestration.currentStep ?? null,
            stepProgress: orchestration.stepProgress ?? null,
            transition: orchestration.transition ?? null,
            pendingConfirmations: orchestration.pendingConfirmations ?? [],
            metadata: orchestration.metadata ?? null,
        });
    }, []);
    const clearState = useCallback(() => {
        setState(initialState);
    }, []);
    const hasStepTransition = useMemo(() => state.transition !== null, [state.transition]);
    const isPlanComplete = useMemo(() => state.transition?.planComplete ?? false, [state.transition]);
    const hasPendingConfirmations = useMemo(() => state.pendingConfirmations.length > 0, [state.pendingConfirmations]);
    const currentStepProgress = useMemo(() => state.stepProgress?.progressPercent ?? 0, [state.stepProgress]);
    const shouldShowCelebration = useMemo(() => state.transition?.celebration !== null && state.transition !== null, [state.transition]);
    return {
        state,
        updateFromResponse,
        clearState,
        hasStepTransition,
        isPlanComplete,
        hasPendingConfirmations,
        currentStepProgress,
        shouldShowCelebration,
    };
}
// ============================================================================
// HELPER HOOKS
// ============================================================================
/**
 * Hook for just the current step information
 */
export function useCurrentStep() {
    const { state } = useTutoringOrchestration();
    return useMemo(() => ({
        step: state.currentStep,
        objectives: state.currentStep?.objectives ?? [],
        stepType: state.currentStep?.type ?? null,
    }), [state.currentStep]);
}
/**
 * Hook for step progress tracking
 */
export function useStepProgress() {
    const { state } = useTutoringOrchestration();
    return useMemo(() => ({
        progressPercent: state.stepProgress?.progressPercent ?? 0,
        isComplete: state.stepProgress?.stepComplete ?? false,
        confidence: state.stepProgress?.confidence ?? 0,
        pendingCriteria: state.stepProgress?.pendingCriteria ?? [],
    }), [state.stepProgress]);
}
/**
 * Hook for celebration display
 */
export function useStepCelebration() {
    const { state, clearState } = useTutoringOrchestration();
    return useMemo(() => ({
        show: state.transition?.celebration !== null && state.transition !== null,
        celebration: state.transition?.celebration ?? null,
        dismiss: clearState,
    }), [state.transition, clearState]);
}
// ============================================================================
// CONTEXT (for global state sharing)
// ============================================================================
const TutoringOrchestrationContext = createContext(null);
export function TutoringOrchestrationProvider({ children }) {
    const orchestration = useTutoringOrchestration();
    return (_jsx(TutoringOrchestrationContext.Provider, { value: orchestration, children: children }));
}
export function useTutoringOrchestrationContext() {
    const context = useContext(TutoringOrchestrationContext);
    if (!context) {
        throw new Error('useTutoringOrchestrationContext must be used within TutoringOrchestrationProvider');
    }
    return context;
}
