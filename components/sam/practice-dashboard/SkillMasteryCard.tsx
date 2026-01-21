'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Zap, ChevronRight, AlertTriangle, RefreshCcw, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ProficiencyBadge } from './ProficiencyBadge';
import { PROFICIENCY_CONFIG, type SkillMasteryCardProps, type ProficiencyLevel, type ReviewUrgency } from './types';

// ============================================================================
// DECAY CALCULATION CONSTANTS (matching backend decay-calculator.ts)
// ============================================================================

const MIN_RETENTION = 0.3;
const MAX_RETENTION = 1.0;
const BASE_STABILITY_DAYS = 7;
const PROFICIENCY_STABILITY_MULTIPLIER: Record<ProficiencyLevel, number> = {
  BEGINNER: 1.0,
  NOVICE: 1.5,
  INTERMEDIATE: 2.0,
  COMPETENT: 3.0,
  PROFICIENT: 4.0,
  ADVANCED: 5.0,
  EXPERT: 6.0,
  MASTER: 8.0,
};

const URGENCY_THRESHOLDS = {
  OVERDUE: 0.5,
  DUE_SOON: 0.7,
  UPCOMING: 0.85,
};

const URGENCY_CONFIG: Record<ReviewUrgency, { color: string; label: string; icon: typeof AlertTriangle }> = {
  OVERDUE: { color: 'text-red-500', label: 'Overdue', icon: AlertTriangle },
  DUE_SOON: { color: 'text-amber-500', label: 'Due Soon', icon: RefreshCcw },
  UPCOMING: { color: 'text-blue-500', label: 'Review Soon', icon: RefreshCcw },
  STABLE: { color: 'text-green-500', label: 'On Track', icon: TrendingDown },
};

export function SkillMasteryCard({
  mastery,
  onClick,
  className,
}: SkillMasteryCardProps) {
  // Safe defaults for mastery data
  const totalQualityHours = mastery.totalQualityHours ?? 0;
  const totalRawHours = mastery.totalRawHours ?? 0;
  const totalSessions = mastery.totalSessions ?? 0;
  const avgQualityMultiplier = mastery.avgQualityMultiplier ?? 1;
  const currentStreak = mastery.currentStreak ?? 0;
  const proficiencyLevel = (mastery.proficiencyLevel ?? 'BEGINNER') as ProficiencyLevel;
  const nextMilestone = mastery.nextMilestone ?? null;
  const lastPracticedAtRaw = mastery.lastPracticedAt;

  const progress = (totalQualityHours / 10000) * 100;
  const config = PROFICIENCY_CONFIG[proficiencyLevel];

  // Calculate average session duration
  const avgSessionMinutes = totalSessions > 0
    ? Math.round((totalRawHours * 60) / totalSessions)
    : 0;

  // Phase 4: Calculate decay-aware metrics
  const decayMetrics = useMemo(() => {
    const lastPracticedAt = lastPracticedAtRaw ? new Date(lastPracticedAtRaw) : null;
    if (!lastPracticedAt || totalQualityHours === 0) {
      return {
        retentionRate: 1.0,
        effectiveHours: totalQualityHours,
        decayedHours: 0,
        daysSinceLastPractice: 0,
        reviewUrgency: 'STABLE' as ReviewUrgency,
      };
    }

    const now = new Date();
    const daysSinceLastPractice = Math.max(0, (now.getTime() - lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate stability based on proficiency level
    const stabilityMultiplier = PROFICIENCY_STABILITY_MULTIPLIER[proficiencyLevel];
    const stabilityDays = BASE_STABILITY_DAYS * stabilityMultiplier;

    // Ebbinghaus-inspired exponential decay
    // R = e^(-t/S) where t is time and S is stability
    const decayFactor = -daysSinceLastPractice / stabilityDays;
    const rawRetention = Math.exp(decayFactor);

    // Clamp retention to bounds
    const retentionRate = Math.max(MIN_RETENTION, Math.min(MAX_RETENTION, rawRetention));

    // Calculate effective hours (accounting for decay)
    const effectiveHours = totalQualityHours * retentionRate;
    const decayedHours = totalQualityHours - effectiveHours;

    // Determine review urgency
    let reviewUrgency: ReviewUrgency = 'STABLE';
    if (retentionRate < URGENCY_THRESHOLDS.OVERDUE) {
      reviewUrgency = 'OVERDUE';
    } else if (retentionRate < URGENCY_THRESHOLDS.DUE_SOON) {
      reviewUrgency = 'DUE_SOON';
    } else if (retentionRate < URGENCY_THRESHOLDS.UPCOMING) {
      reviewUrgency = 'UPCOMING';
    }

    return {
      retentionRate,
      effectiveHours,
      decayedHours,
      daysSinceLastPractice: Math.floor(daysSinceLastPractice),
      reviewUrgency,
    };
  }, [lastPracticedAtRaw, totalQualityHours, proficiencyLevel]);

  // Format hours nicely
  const formatHours = (hours: number): string => {
    if (hours >= 1000) {
      return `${(hours / 1000).toFixed(1)}k`;
    }
    return hours.toFixed(0);
  };

  const urgencyConfig = URGENCY_CONFIG[decayMetrics.reviewUrgency];
  const UrgencyIcon = urgencyConfig.icon;
  const showDecayWarning = decayMetrics.reviewUrgency !== 'STABLE' && decayMetrics.daysSinceLastPractice > 0;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className={cn(
            'cursor-pointer border-slate-200/50 bg-white/70 backdrop-blur-sm transition-all hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/70',
            onClick && 'hover:border-primary/50',
            showDecayWarning && decayMetrics.reviewUrgency === 'OVERDUE' && 'border-red-200 dark:border-red-900/50',
            showDecayWarning && decayMetrics.reviewUrgency === 'DUE_SOON' && 'border-amber-200 dark:border-amber-900/50',
            className
          )}
          onClick={() => onClick?.(mastery.skillId)}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {mastery.skill?.name || mastery.skillName || 'Unknown Skill'}
                  </h3>
                  {currentStreak > 0 && (
                    <div className="flex items-center gap-0.5 text-orange-500">
                      <Flame className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{currentStreak}</span>
                    </div>
                  )}
                  {/* Decay Warning Badge */}
                  {showDecayWarning && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 h-5 gap-0.5',
                            urgencyConfig.color,
                            decayMetrics.reviewUrgency === 'OVERDUE' && 'bg-red-50 dark:bg-red-950/30',
                            decayMetrics.reviewUrgency === 'DUE_SOON' && 'bg-amber-50 dark:bg-amber-950/30'
                          )}
                        >
                          <UrgencyIcon className="h-3 w-3" />
                          {urgencyConfig.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {decayMetrics.daysSinceLastPractice} days since last practice
                          <br />
                          Retention: {(decayMetrics.retentionRate * 100).toFixed(0)}%
                          {decayMetrics.decayedHours > 0 && (
                            <>
                              <br />
                              <span className="text-amber-500">
                                ~{decayMetrics.decayedHours.toFixed(1)} hours of knowledge decay
                              </span>
                            </>
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {mastery.skill?.category && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {mastery.skill.category}
                  </p>
                )}
              </div>
              <ProficiencyBadge level={proficiencyLevel} size="sm" />
            </div>

            {/* Progress Bar with Effective Hours */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">
                  {decayMetrics.retentionRate < 1 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help border-b border-dashed border-slate-400">
                          {formatHours(decayMetrics.effectiveHours)} effective
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {formatHours(totalQualityHours)} total hours
                          <br />
                          {(decayMetrics.retentionRate * 100).toFixed(0)}% retention
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span>{formatHours(totalQualityHours)} / 10,000 hours</span>
                  )}
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {progress.toFixed(1)}%
                </span>
              </div>
              {/* Dual progress bar showing total vs effective */}
              <div className="relative">
                <Progress value={Math.min(progress, 100)} className="h-2" />
                {decayMetrics.retentionRate < 0.95 && (
                  <div
                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-amber-400/30 to-red-400/30 rounded-full"
                    style={{
                      width: `${Math.min(((totalQualityHours - decayMetrics.effectiveHours) / 10000) * 100, progress)}%`,
                      marginLeft: `${Math.min((decayMetrics.effectiveHours / 10000) * 100, 100)}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{totalSessions} sessions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{avgQualityMultiplier.toFixed(2)}x</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span>Avg: {avgSessionMinutes}m</span>
                {onClick && <ChevronRight className="h-3 w-3" />}
              </div>
            </div>

            {/* Next Milestone Hint OR Decay Warning */}
            {showDecayWarning ? (
              <div className={cn(
                'mt-3 pt-3 border-t flex items-center gap-2',
                decayMetrics.reviewUrgency === 'OVERDUE' ? 'border-red-200 dark:border-red-900/50' : 'border-amber-200 dark:border-amber-900/50'
              )}>
                <UrgencyIcon className={cn('h-4 w-4', urgencyConfig.color)} />
                <p className={cn('text-xs', urgencyConfig.color)}>
                  Practice to restore {decayMetrics.decayedHours.toFixed(1)} hours of retention
                </p>
              </div>
            ) : nextMilestone && nextMilestone <= 10000 ? (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {Math.max(0, nextMilestone - totalQualityHours).toFixed(0)} hours
                  </span>{' '}
                  until {nextMilestone.toLocaleString()}-hour milestone
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

export default SkillMasteryCard;
