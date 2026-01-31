'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import type { GoalContext } from '@/lib/sam/agentic-chat/types';

interface GoalProgressBadgeProps {
  goalContext: GoalContext;
}

export function GoalProgressBadge({ goalContext }: GoalProgressBadgeProps) {
  const goal = goalContext.relevantGoal;
  if (!goal) return null;

  const progressPercent = Math.round(goal.progress);
  const progressColor =
    progressPercent >= 75
      ? 'bg-green-500'
      : progressPercent >= 40
        ? 'bg-yellow-500'
        : 'bg-blue-500';

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-1">
        <Target className="w-3 h-3" />
        {goal.title}
      </Badge>
      <div className="flex items-center gap-1">
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
      </div>
    </div>
  );
}
