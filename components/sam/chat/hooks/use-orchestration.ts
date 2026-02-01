import { useEffect, useMemo, useRef, useState } from 'react';
import type { OrchestrationInsight, OrchestrationContextInput, SAMInsights } from '../types';
import {
  useCelebration,
  type CelebrationType,
} from '@/components/sam/CelebrationOverlay';

// Module-level state for orchestration continuity across requests
const orchestrationStateRef = {
  current: { planId: undefined as string | undefined, goalId: undefined as string | undefined },
};

/**
 * Update orchestration state from API response.
 */
export function updateOrchestrationState(orchestration?: OrchestrationInsight) {
  if (orchestration?.planId) {
    orchestrationStateRef.current.planId = orchestration.planId;
  }
  if (orchestration?.goalId) {
    orchestrationStateRef.current.goalId = orchestration.goalId;
  }
}

/**
 * Clear orchestration state (e.g., when plan is completed).
 */
export function clearOrchestrationState() {
  orchestrationStateRef.current = { planId: undefined, goalId: undefined };
}

/**
 * Get current orchestration context for building requests.
 */
export function getOrchestrationContext(): OrchestrationContextInput {
  const { planId, goalId } = orchestrationStateRef.current;
  return {
    autoDetectPlan: !planId,
    ...(planId && { planId }),
    ...(goalId && { goalId }),
  };
}

// =============================================================================
// Hook
// =============================================================================

interface UseOrchestrationOptions {
  insights: SAMInsights | null;
}

interface UseOrchestrationReturn {
  orchestration: OrchestrationInsight | null;
  showStepsTimeline: boolean;
  setShowStepsTimeline: (show: boolean) => void;
  celebration: ReturnType<typeof useCelebration>['celebration'];
  showCelebration: ReturnType<typeof useCelebration>['showCelebration'];
  dismissCelebration: ReturnType<typeof useCelebration>['dismissCelebration'];
}

export function useOrchestration(
  options: UseOrchestrationOptions
): UseOrchestrationReturn {
  const { insights } = options;

  const [showStepsTimeline, setShowStepsTimeline] = useState(false);
  const { celebration, showCelebration, dismissCelebration } = useCelebration();
  const lastCelebrationIdRef = useRef<string | null>(null);

  const orchestration = useMemo(
    () => insights?.orchestration ?? null,
    [insights?.orchestration]
  );

  // Update orchestration state for plan/goal continuity
  useEffect(() => {
    if (orchestration) {
      updateOrchestrationState(orchestration);

      if (orchestration.transition?.planComplete) {
        clearOrchestrationState();
      }
    }
  }, [orchestration]);

  // Trigger celebration from orchestration transitions
  useEffect(() => {
    if (!orchestration?.transition?.celebration) return;

    const celebrationData = orchestration.transition.celebration;
    const celebrationId = `${celebrationData.title}-${Date.now()}`;

    if (lastCelebrationIdRef.current === celebrationId) return;
    lastCelebrationIdRef.current = celebrationId;

    let celebrationType: CelebrationType = 'step_complete';
    if (orchestration.transition.planComplete) {
      celebrationType = 'plan_complete';
    } else if (orchestration.transition.type === 'PLAN_COMPLETE') {
      celebrationType = 'goal_achieved';
    }

    showCelebration({
      type: celebrationType,
      title: celebrationData.title,
      message: celebrationData.message,
      xpEarned: celebrationData.xpEarned,
    });
  }, [orchestration, showCelebration]);

  return {
    orchestration,
    showStepsTimeline,
    setShowStepsTimeline,
    celebration,
    showCelebration,
    dismissCelebration,
  };
}
