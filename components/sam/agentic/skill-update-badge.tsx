'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SkillUpdateData } from '@/lib/sam/agentic-chat/types';

interface SkillUpdateBadgeProps {
  skillUpdate: SkillUpdateData;
}

export function SkillUpdateBadge({ skillUpdate }: SkillUpdateBadgeProps) {
  const improved = skillUpdate.newLevel !== skillUpdate.previousLevel
    && skillUpdate.previousLevel !== 'unknown';
  const isUpgrade = skillUpdate.score >= 50;

  const Icon = improved
    ? (isUpgrade ? TrendingUp : TrendingDown)
    : Minus;

  const colorClass = isUpgrade
    ? 'text-green-600 dark:text-green-400'
    : improved
      ? 'text-red-500 dark:text-red-400'
      : 'text-muted-foreground';

  return (
    <div className="mt-1 inline-flex items-center gap-1 text-[10px]">
      <Icon className={`w-3 h-3 ${colorClass}`} />
      <span className={colorClass}>
        {skillUpdate.skillName}: {skillUpdate.newLevel}
      </span>
      {improved && (
        <span className="text-muted-foreground">
          (was {skillUpdate.previousLevel})
        </span>
      )}
    </div>
  );
}
