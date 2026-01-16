'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface SkillMasteryRingProps {
  /** Current quality hours */
  qualityHours: number;
  /** Target hours (default 10,000) */
  targetHours?: number;
  /** Ring size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show text in center */
  showText?: boolean;
  /** Custom label */
  label?: string;
  /** Color scheme */
  colorScheme?: 'default' | 'gradient' | 'proficiency';
  /** Proficiency level for proficiency color scheme */
  proficiencyLevel?: string;
  /** Additional class name */
  className?: string;
}

const PROFICIENCY_COLORS: Record<string, string> = {
  BEGINNER: '#6b7280',      // gray-500
  NOVICE: '#3b82f6',        // blue-500
  INTERMEDIATE: '#22c55e',  // green-500
  COMPETENT: '#eab308',     // yellow-500
  PROFICIENT: '#f97316',    // orange-500
  ADVANCED: '#ef4444',      // red-500
  EXPERT: '#a855f7',        // purple-500
  MASTER: '#fbbf24',        // amber-400 (gold)
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SkillMasteryRing({
  qualityHours,
  targetHours = 10000,
  size = 120,
  strokeWidth = 10,
  showText = true,
  label,
  colorScheme = 'default',
  proficiencyLevel,
  className,
}: SkillMasteryRingProps) {
  // Calculate ring metrics
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(qualityHours / targetHours, 1);
  const offset = circumference - progress * circumference;

  // Determine color
  const strokeColor = useMemo(() => {
    if (colorScheme === 'proficiency' && proficiencyLevel) {
      return PROFICIENCY_COLORS[proficiencyLevel] ?? '#3b82f6';
    }
    if (colorScheme === 'gradient') {
      // Return gradient ID
      return 'url(#masteryGradient)';
    }
    // Default color based on progress
    if (progress >= 1) return '#fbbf24'; // Gold for mastery
    if (progress >= 0.75) return '#a855f7'; // Purple
    if (progress >= 0.5) return '#22c55e'; // Green
    if (progress >= 0.25) return '#3b82f6'; // Blue
    return '#6b7280'; // Gray
  }, [colorScheme, proficiencyLevel, progress]);

  // Format display text
  const displayText = useMemo(() => {
    if (qualityHours >= 1000) {
      return `${(qualityHours / 1000).toFixed(1)}k`;
    }
    return qualityHours.toFixed(0);
  }, [qualityHours]);

  const displayLabel = label ?? (qualityHours >= targetHours ? 'MASTERED!' : 'hours');

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="img"
        aria-label={`${qualityHours.toFixed(0)} of ${targetHours} hours practiced`}
      >
        {/* Gradient definition for gradient color scheme */}
        {colorScheme === 'gradient' && (
          <defs>
            <linearGradient id="masteryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        )}

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground/20"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />

        {/* Milestone markers */}
        {[0.1, 0.25, 0.5, 0.75, 1].map((milestone) => {
          const angle = milestone * 360 - 90;
          const x = size / 2 + radius * Math.cos((angle * Math.PI) / 180);
          const y = size / 2 + radius * Math.sin((angle * Math.PI) / 180);

          return (
            <circle
              key={milestone}
              cx={x}
              cy={y}
              r={2}
              className={cn(
                'transition-colors duration-300',
                progress >= milestone
                  ? 'fill-current text-foreground'
                  : 'fill-current text-muted-foreground/40'
              )}
            />
          );
        })}
      </svg>

      {/* Center text */}
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums',
              size >= 100 ? 'text-xl' : 'text-lg'
            )}
          >
            {displayText}
          </span>
          <span
            className={cn(
              'text-muted-foreground',
              size >= 100 ? 'text-xs' : 'text-[10px]'
            )}
          >
            {displayLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MINI RING VARIANT
// ============================================================================

interface MiniMasteryRingProps {
  qualityHours: number;
  targetHours?: number;
  className?: string;
}

export function MiniMasteryRing({
  qualityHours,
  targetHours = 10000,
  className,
}: MiniMasteryRingProps) {
  return (
    <SkillMasteryRing
      qualityHours={qualityHours}
      targetHours={targetHours}
      size={40}
      strokeWidth={4}
      showText={false}
      className={className}
    />
  );
}
