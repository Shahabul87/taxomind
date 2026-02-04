'use client';

import { Clock, Flame, Target, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadmapDetail } from '@/hooks/use-skill-roadmap-journey';

interface JourneyHeaderProps {
  roadmap: RoadmapDetail;
}

/** Internal DB type names that must never leak into the UI. */
const INTERNAL_NAMES = ['SKILL_SET', 'SKILL_DEFINITION', 'UNTITLED', 'UNDEFINED', 'NULL'];

function isInternalName(value: string | undefined | null): boolean {
  if (!value) return true;
  return INTERNAL_NAMES.some(n => value.toUpperCase().includes(n));
}

function formatLevel(level: string | undefined | null): string {
  if (!level || isInternalName(level)) return '';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getDisplayTitle(roadmap: RoadmapDetail): string {
  const skillName = roadmap.targetOutcome?.targetName;
  if (skillName && !isInternalName(skillName)) {
    return `${skillName} Roadmap`;
  }
  if (roadmap.title && !isInternalName(roadmap.title)) {
    return roadmap.title;
  }
  return 'Learning Roadmap';
}

export function JourneyHeader({ roadmap }: JourneyHeaderProps) {
  const { stats } = roadmap;
  const currentLevel = formatLevel(roadmap.targetOutcome?.currentLevel);
  const targetLevelStr = formatLevel(roadmap.targetOutcome?.targetLevel);
  const pct = Math.round(roadmap.completionPercentage);
  const displayTitle = getDisplayTitle(roadmap);
  const hoursLeft = Math.max(0, stats.totalHoursEstimated - stats.totalHoursCompleted);
  const hasPhases = stats.totalMilestones > 0;

  const eta = roadmap.targetCompletionDate
    ? new Date(roadmap.targetCompletionDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/30" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-100/40 to-transparent dark:from-violet-900/20 rounded-full -translate-y-32 translate-x-32" />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Progress Ring */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="5"
                className="text-slate-200/80 dark:text-slate-700/80" />
              <circle
                cx="32" cy="32" r="27" fill="none"
                stroke="url(#headerGrad)" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 27}`}
                strokeDashoffset={`${2 * Math.PI * 27 * (1 - pct / 100)}`}
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{pct}%</span>
            </div>
          </div>

          {/* Title & Level */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {displayTitle}
            </h2>
            {currentLevel && targetLevelStr && (
              <div className="flex items-center gap-2.5 mt-2">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                )}>
                  {currentLevel}
                </span>
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                )}>
                  {targetLevelStr}
                </span>
              </div>
            )}
            {!currentLevel && !targetLevelStr && !hasPhases && (
              <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-500">
                No learning phases yet &mdash; create a new roadmap to get started
              </p>
            )}
          </div>

          {/* Stats Grid */}
          {hasPhases && (
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-5 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <Target className="h-4 w-4 text-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Phases</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {stats.completedMilestones}/{stats.totalMilestones}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Hours</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {Math.round(stats.totalHoursCompleted)}/{Math.round(stats.totalHoursEstimated)}h
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {Math.round(hoursLeft)}h
                  </p>
                </div>
              </div>

              {eta && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                  <Calendar className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">ETA</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{eta}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats for empty roadmaps */}
          {!hasPhases && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
              <Target className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Empty roadmap &mdash; generate phases to start learning
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
