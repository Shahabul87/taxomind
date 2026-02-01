'use client';

/**
 * Plan Progress Panel
 *
 * Collapsible timeline showing active plan steps and progress.
 * Renders inside the chat header area when a plan is active.
 */

import { useCallback, useState } from 'react';
import { CheckCircle, Circle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface PlanStep {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface PlanProgressPanelProps {
  planTitle: string;
  steps: PlanStep[];
  currentStepId?: string;
  progressPercent: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PlanProgressPanel({
  planTitle,
  steps,
  currentStepId,
  progressPercent,
}: PlanProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  if (steps.length === 0) return null;

  return (
    <div className="border-b border-[var(--sam-border)] bg-[var(--sam-surface)]">
      {/* Header with progress bar */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--sam-hover)] transition-colors"
      >
        <span className="font-medium text-[var(--sam-text)] truncate flex-1 text-left">
          {planTitle}
        </span>
        <span className="text-[var(--sam-text-secondary)] whitespace-nowrap">
          {progressPercent}%
        </span>
        <div className="w-16 h-1.5 rounded-full bg-[var(--sam-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--sam-accent)] transition-all duration-300"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 text-[var(--sam-text-secondary)]" />
        ) : (
          <ChevronDown className="h-3 w-3 text-[var(--sam-text-secondary)]" />
        )}
      </button>

      {/* Step timeline */}
      {isExpanded && (
        <div className="max-h-[200px] overflow-y-auto px-3 pb-2">
          <div className="space-y-1">
            {steps.map((step) => {
              const isCurrent = step.id === currentStepId;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 py-1 px-2 rounded text-xs ${
                    isCurrent
                      ? 'bg-[var(--sam-accent)]/10 text-[var(--sam-accent)]'
                      : 'text-[var(--sam-text-secondary)]'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : step.status === 'in_progress' ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--sam-accent)]" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className={`truncate ${isCurrent ? 'font-medium' : ''}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
