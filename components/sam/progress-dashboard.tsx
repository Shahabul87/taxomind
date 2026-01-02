'use client';

/**
 * ProgressDashboard Component
 * Displays learning progress analytics from SAM Agentic AI
 *
 * Phase 5: Frontend Integration
 * - Shows progress report with metrics
 * - Displays skill assessments
 * - Visualizes learning streaks and goals
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  Trophy,
  Flame,
  BookOpen,
  Brain,
  Star,
  ChevronRight,
  Loader2,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  useAgentic,
  type ProgressReport,
  type SkillAssessment,
} from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface ProgressDashboardProps {
  className?: string;
  defaultPeriod?: 'daily' | 'weekly' | 'monthly';
  showSkills?: boolean;
  showGoals?: boolean;
  compact?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getSkillLevelColor(level: string): string {
  const colors: Record<string, string> = {
    novice: 'bg-gray-200 text-gray-700',
    beginner: 'bg-blue-100 text-blue-700',
    intermediate: 'bg-green-100 text-green-700',
    advanced: 'bg-purple-100 text-purple-700',
    expert: 'bg-amber-100 text-amber-700',
  };
  return colors[level] || colors.novice;
}

function getSkillLevelProgress(level: string): number {
  const progress: Record<string, number> = {
    novice: 10,
    beginner: 30,
    intermediate: 50,
    advanced: 75,
    expert: 100,
  };
  return progress[level] || 0;
}

function getTrendIcon(trend: string) {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  icon,
  label,
  value,
  subValue,
  trend,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">{icon}</div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                trend === 'up' && 'text-green-500',
                trend === 'down' && 'text-red-500',
                trend === 'neutral' && 'text-gray-400'
              )}
            >
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function SkillCard({ skill }: { skill: SkillAssessment }) {
  const levelProgress = getSkillLevelProgress(skill.level);

  return (
    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-sm">{skill.skillName}</h4>
          <Badge className={cn('text-xs mt-1', getSkillLevelColor(skill.level))}>
            {skill.level}
          </Badge>
        </div>
        <div className="flex items-center gap-1">{getTrendIcon(skill.trend)}</div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Mastery</span>
          <span>{Math.round(skill.score)}%</span>
        </div>
        <Progress value={levelProgress} className="h-1.5" />
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Last assessed: {new Date(skill.lastAssessedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function GoalProgressCard({
  goal,
}: {
  goal: {
    goalId: string;
    goalTitle: string;
    progressDelta: number;
    currentProgress: number;
  };
}) {
  const isPositive = goal.progressDelta >= 0;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
      <div
        className={cn(
          'p-2 rounded-full',
          isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        )}
      >
        <Target className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{goal.goalTitle}</p>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={goal.currentProgress} className="h-1.5 flex-1" />
          <span className="text-xs text-gray-500">{Math.round(goal.currentProgress)}%</span>
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn('text-xs', isPositive ? 'text-green-600' : 'text-red-600')}
      >
        {isPositive ? '+' : ''}
        {goal.progressDelta}%
      </Badge>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressDashboard({
  className,
  defaultPeriod = 'weekly',
  showSkills = true,
  showGoals = true,
  compact = false,
}: ProgressDashboardProps) {
  const {
    progressReport,
    isLoadingProgress,
    fetchProgressReport,
    skills,
    isLoadingSkills,
    fetchSkillMap,
    error,
  } = useAgentic();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(defaultPeriod);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data on mount and period change
  useEffect(() => {
    fetchProgressReport(period);
    if (showSkills) {
      fetchSkillMap();
    }
  }, [period, fetchProgressReport, fetchSkillMap, showSkills]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProgressReport(period);
    if (showSkills) {
      await fetchSkillMap();
    }
    setIsRefreshing(false);
  };

  const isLoading = isLoadingProgress || isLoadingSkills;

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw
                className={cn('w-4 h-4', (isLoading || isRefreshing) && 'animate-spin')}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProgress ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : progressReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Study Time</span>
                <span className="font-medium">{formatDuration(progressReport.totalStudyTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Sessions</span>
                <span className="font-medium">{progressReport.sessionsCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Streak</span>
                <span className="font-medium flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  {progressReport.streak} days
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No progress data</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Learning Progress
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your learning journey with SAM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw
              className={cn('w-4 h-4', (isLoading || isRefreshing) && 'animate-spin')}
            />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isLoadingProgress ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : progressReport ? (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Clock className="w-5 h-5 text-blue-500" />}
              label="Study Time"
              value={formatDuration(progressReport.totalStudyTime)}
              subValue={`${progressReport.sessionsCompleted} sessions`}
            />
            <StatCard
              icon={<BookOpen className="w-5 h-5 text-green-500" />}
              label="Topics Studied"
              value={progressReport.topicsStudied.length}
              subValue="this period"
            />
            <StatCard
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              label="Learning Streak"
              value={`${progressReport.streak} days`}
              trend={progressReport.streak > 3 ? 'up' : 'neutral'}
            />
            <StatCard
              icon={<Trophy className="w-5 h-5 text-amber-500" />}
              label="Skills Improved"
              value={progressReport.skillsImproved.length}
              subValue="skills leveled up"
            />
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressReport.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {progressReport.strengths.map((strength, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-50 text-green-700">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Keep learning to discover your strengths!</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressReport.areasForImprovement.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {progressReport.areasForImprovement.map((area, i) => (
                      <Badge key={i} variant="secondary" className="bg-amber-50 text-amber-700">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Great job! No major areas flagged.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Goal Progress */}
          {showGoals && progressReport.goalsProgress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Goal Progress</CardTitle>
                <CardDescription>How your goals progressed this {period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {progressReport.goalsProgress.map((goal) => (
                    <GoalProgressCard key={goal.goalId} goal={goal} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {showSkills && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Skill Assessment
                </CardTitle>
                <CardDescription>Your current skill levels</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSkills ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : skills.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {skills.map((skill) => (
                      <SkillCard key={skill.skillId} skill={skill} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Complete assessments to track your skill progress
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-2">No progress data yet</p>
          <p className="text-sm text-gray-400">
            Start learning with SAM to see your progress analytics
          </p>
        </Card>
      )}
    </div>
  );
}

export default ProgressDashboard;
