'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Clock,
  Zap,
  Calendar,
  Trophy,
  Activity,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { QuickStatCard } from './QuickStatCard';
import { ProficiencyBadge } from './ProficiencyBadge';
import { PracticeStreakWidget } from './PracticeStreakWidget';
import { PROFICIENCY_CONFIG, type PracticeJourneyOverviewProps, type ProficiencyLevel } from './types';

// ============================================================================
// PROGRESS RING COMPONENT
// ============================================================================

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 12,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PracticeJourneyOverview({
  data,
  isLoading,
  onRefresh,
  className,
}: PracticeJourneyOverviewProps) {
  if (isLoading) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-slate-500 dark:text-slate-400">Loading your journey...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="py-12 text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Start Your 10,000 Hour Journey
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Begin practicing to track your progress toward mastery.
          </p>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { overview, topSkills = [], recentActivity, streaks, milestoneProgress = [] } = data;

  // Safe defaults for overview data
  const totalQualityHours = overview?.totalQualityHours ?? 0;
  const totalRawHours = overview?.totalRawHours ?? 0;
  const totalSessions = overview?.totalSessions ?? 0;
  const avgQualityMultiplier = overview?.avgQualityMultiplier ?? 1;
  const totalSkillsTracked = overview?.totalSkillsTracked ?? 0;
  const skillsInProgress = overview?.skillsInProgress ?? 0;
  const skillsMastered = overview?.skillsMastered ?? 0;
  const topProficiencyLevel = overview?.topProficiencyLevel ?? 'BEGINNER';

  // Safe defaults for recent activity
  const last30Days = recentActivity?.last30Days ?? { qualityHours: 0, sessions: 0, avgMultiplier: 1 };

  // Safe defaults for streaks
  const currentStreak = streaks?.current ?? 0;
  const longestStreak = streaks?.longest ?? 0;

  const progressTo10K = (totalQualityHours / 10000) * 100;

  // Find next milestone
  const nextMilestone = milestoneProgress.find((m) => !m.achieved);
  const currentMilestoneProgress = nextMilestone
    ? (totalQualityHours / nextMilestone.hours) * 100
    : 100;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Your 10,000 Hour Journey
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track your path to mastery across all skills
          </p>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      {/* Main Progress Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress Ring */}
        <Card className="lg:col-span-1 border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ProgressRing progress={Math.min(progressTo10K, 100)} size={180} strokeWidth={14}>
              <div className="text-center">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl font-bold text-slate-900 dark:text-white"
                >
                  {totalQualityHours.toFixed(0)}
                </motion.span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  of 10,000 hours
                </p>
                <ProficiencyBadge
                  level={topProficiencyLevel as ProficiencyLevel}
                  size="sm"
                />
              </div>
            </ProgressRing>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              {progressTo10K.toFixed(2)}% of your journey complete
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <Card className="lg:col-span-2 border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <QuickStatCard
                icon={Clock}
                label="Total Quality Hours"
                value={totalQualityHours.toFixed(1)}
                subValue={`${totalRawHours.toFixed(1)} raw hours`}
                color="bg-blue-500"
              />
              <QuickStatCard
                icon={Zap}
                label="Total Sessions"
                value={totalSessions}
                subValue={`${avgQualityMultiplier.toFixed(2)}x avg multiplier`}
                color="bg-purple-500"
              />
              <QuickStatCard
                icon={Target}
                label="Skills Tracked"
                value={totalSkillsTracked}
                subValue={`${skillsInProgress} in progress`}
                color="bg-emerald-500"
              />
              <QuickStatCard
                icon={Trophy}
                label="Skills Mastered"
                value={skillsMastered}
                subValue="10,000+ hours each"
                color="bg-amber-500"
              />
            </div>

            {/* Last 30 Days Summary */}
            <div className="mt-4 p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Last 30 Days
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {last30Days.qualityHours.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">
                    quality hours
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {last30Days.sessions} sessions
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    {last30Days.avgMultiplier.toFixed(2)}x avg
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Widget */}
      <PracticeStreakWidget
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        lastActive={data.lastPracticeAt}
      />

      {/* Next Milestone Progress */}
      {nextMilestone && (
        <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Next Milestone: {nextMilestone.hours.toLocaleString()} Hours
                </span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {Math.max(0, nextMilestone.hours - totalQualityHours).toFixed(0)} hours to go
              </span>
            </div>
            <Progress value={currentMilestoneProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Top Skills Preview */}
      {topSkills.length > 0 && (
        <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-500" />
              Top Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSkills.slice(0, 3).map((skill, index) => {
                const skillQualityHours = skill.totalQualityHours ?? 0;
                return (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          {skill.skill?.name || skill.skillName || 'Unknown Skill'}
                        </span>
                        <ProficiencyBadge level={(skill.proficiencyLevel ?? 'BEGINNER') as ProficiencyLevel} size="sm" />
                      </div>
                      <Progress
                        value={(skillQualityHours / 10000) * 100}
                        className="h-1.5 mt-1"
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {skillQualityHours.toFixed(0)}h
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {((skillQualityHours / 10000) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PracticeJourneyOverview;
