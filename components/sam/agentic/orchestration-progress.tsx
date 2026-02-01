'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import type { OrchestrationData } from '@/lib/sam/agentic-chat/types';

interface OrchestrationProgressProps {
  orchestration: OrchestrationData;
}

export function OrchestrationProgress({ orchestration }: OrchestrationProgressProps) {
  if (!orchestration.hasActivePlan) return null;

  const progress = orchestration.stepProgress;
  const currentStep = orchestration.currentStep;
  const transition = orchestration.transition;

  return (
    <div className="mt-2 rounded-md border bg-blue-50/50 dark:bg-blue-950/20 p-2 space-y-1.5">
      {/* Step progress bar */}
      {progress && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">
                Plan Progress
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">
                {progress.completedSteps}/{progress.totalSteps} steps
              </span>
            </div>
            <div className="w-full h-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
            {progress.percentComplete}%
          </span>
        </div>
      )}

      {/* Current step */}
      {currentStep && (
        <div className="flex items-start gap-1.5">
          <Circle className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-medium text-blue-800 dark:text-blue-200">
              Step {currentStep.order}/{currentStep.totalSteps}: {currentStep.title}
            </p>
            {currentStep.description && (
              <p className="text-[10px] text-blue-600 dark:text-blue-400">
                {currentStep.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Transition indicator */}
      {transition && (
        <div className="flex items-center gap-1 text-[10px]">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-muted-foreground">{transition.from}</span>
          <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
          <Badge variant="outline" className="text-[9px] px-1 py-0">
            {transition.to}
          </Badge>
        </div>
      )}
    </div>
  );
}
