/**
 * Tutoring Orchestration Hook
 *
 * Provides access to plan-driven tutoring state for UI components.
 * Consumes orchestration data from the SAM unified API response.
 */

import { useState, useCallback, useMemo, createContext, useContext, type ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

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
  recommendations: Array<{ type: string; reason: string }>;
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

// ============================================================================
// HOOK
// ============================================================================

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

const initialState: TutoringOrchestrationState = {
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
export function useTutoringOrchestration(): UseTutoringOrchestrationReturn {
  const [state, setState] = useState<TutoringOrchestrationState>(initialState);

  const updateFromResponse = useCallback(
    (orchestration: TutoringOrchestrationState | undefined) => {
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
    },
    []
  );

  const clearState = useCallback(() => {
    setState(initialState);
  }, []);

  const hasStepTransition = useMemo(
    () => state.transition !== null,
    [state.transition]
  );

  const isPlanComplete = useMemo(
    () => state.transition?.planComplete ?? false,
    [state.transition]
  );

  const hasPendingConfirmations = useMemo(
    () => state.pendingConfirmations.length > 0,
    [state.pendingConfirmations]
  );

  const currentStepProgress = useMemo(
    () => state.stepProgress?.progressPercent ?? 0,
    [state.stepProgress]
  );

  const shouldShowCelebration = useMemo(
    () => state.transition?.celebration !== null && state.transition !== null,
    [state.transition]
  );

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
export function useCurrentStep(): {
  step: TutoringStep | null;
  objectives: string[];
  stepType: string | null;
} {
  const { state } = useTutoringOrchestration();

  return useMemo(
    () => ({
      step: state.currentStep,
      objectives: state.currentStep?.objectives ?? [],
      stepType: state.currentStep?.type ?? null,
    }),
    [state.currentStep]
  );
}

/**
 * Hook for step progress tracking
 */
export function useStepProgress(): {
  progressPercent: number;
  isComplete: boolean;
  confidence: number;
  pendingCriteria: string[];
} {
  const { state } = useTutoringOrchestration();

  return useMemo(
    () => ({
      progressPercent: state.stepProgress?.progressPercent ?? 0,
      isComplete: state.stepProgress?.stepComplete ?? false,
      confidence: state.stepProgress?.confidence ?? 0,
      pendingCriteria: state.stepProgress?.pendingCriteria ?? [],
    }),
    [state.stepProgress]
  );
}

/**
 * Hook for celebration display
 */
export function useStepCelebration(): {
  show: boolean;
  celebration: StepTransition['celebration'];
  dismiss: () => void;
} {
  const { state, clearState } = useTutoringOrchestration();

  return useMemo(
    () => ({
      show: state.transition?.celebration !== null && state.transition !== null,
      celebration: state.transition?.celebration ?? null,
      dismiss: clearState,
    }),
    [state.transition, clearState]
  );
}

// ============================================================================
// CONTEXT (for global state sharing)
// ============================================================================

const TutoringOrchestrationContext = createContext<UseTutoringOrchestrationReturn | null>(null);

export function TutoringOrchestrationProvider({ children }: { children: ReactNode }) {
  const orchestration = useTutoringOrchestration();

  return (
    <TutoringOrchestrationContext.Provider value={orchestration}>
      {children}
    </TutoringOrchestrationContext.Provider>
  );
}

export function useTutoringOrchestrationContext(): UseTutoringOrchestrationReturn {
  const context = useContext(TutoringOrchestrationContext);
  if (!context) {
    throw new Error(
      'useTutoringOrchestrationContext must be used within TutoringOrchestrationProvider'
    );
  }
  return context;
}
