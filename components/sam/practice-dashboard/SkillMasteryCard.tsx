'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ProficiencyBadge } from './ProficiencyBadge';
import { PROFICIENCY_CONFIG, type SkillMasteryCardProps, type ProficiencyLevel } from './types';

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
  const proficiencyLevel = mastery.proficiencyLevel ?? 'BEGINNER';
  const nextMilestone = mastery.nextMilestone ?? null;

  const progress = (totalQualityHours / 10000) * 100;
  const config = PROFICIENCY_CONFIG[proficiencyLevel as ProficiencyLevel];

  // Calculate average session duration
  const avgSessionMinutes = totalSessions > 0
    ? Math.round((totalRawHours * 60) / totalSessions)
    : 0;

  // Format hours nicely
  const formatHours = (hours: number): string => {
    if (hours >= 1000) {
      return `${(hours / 1000).toFixed(1)}k`;
    }
    return hours.toFixed(0);
  };

  return (
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
              </div>
              {mastery.skill?.category && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {mastery.skill.category}
                </p>
              )}
            </div>
            <ProficiencyBadge level={proficiencyLevel as ProficiencyLevel} size="sm" />
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">
                {formatHours(totalQualityHours)} / 10,000 hours
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {progress.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
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

          {/* Next Milestone Hint */}
          {nextMilestone && nextMilestone <= 10000 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {Math.max(0, nextMilestone - totalQualityHours).toFixed(0)} hours
                </span>{' '}
                until {nextMilestone.toLocaleString()}-hour milestone
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default SkillMasteryCard;
