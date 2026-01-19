'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { PROFICIENCY_CONFIG, type ProficiencyBadgeProps } from './types';

export function ProficiencyBadge({
  level,
  size = 'md',
  showLabel = true,
}: ProficiencyBadgeProps) {
  const config = PROFICIENCY_CONFIG[level];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        config.bgColor,
        config.color,
        config.borderColor,
        sizeClasses[size]
      )}
    >
      {showLabel && config.label}
    </span>
  );
}

export default ProficiencyBadge;
