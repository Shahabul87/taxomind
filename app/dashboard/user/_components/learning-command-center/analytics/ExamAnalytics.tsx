'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Brain,
  Lightbulb,
  BarChart3,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ExamAnalyticsProps {
  compact?: boolean;
  className?: string;
}

interface Summary {
  totalAttempts: number;
  totalExams: number;
  passRate: number;
  failRate: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  averageTimePerExam: number;
  averageTimePerQuestion: number;
}

interface BloomsPerformance {
  level: string;
  attempts: number;
  totalQuestions: number;
  correctAnswers: number;
  avgScore: number;
}

interface WeakArea {
  topic: string;
  examTitle: string;
  score: number;
  attempts: number;
  recommendation: string;
}

interface ExamAttemptSummary {
  id: string;
  examId: string;
  examTitle: string;
  courseTitle: string;
  attemptNumber: number;
  score: number;
  isPassed: boolean;
  timeSpent: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string | null;
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: string;
}

interface Trends {
  scoreOverTime: Array<{ date: string; score: number; attempts: number }>;
  attemptsOverTime: Array<{ date: string; count: number }>;
  improvementRate: number;
}

interface ExamAnalyticsData {
  summary: Summary;
  trends: Trends;
  bloomsAnalysis: BloomsPerformance[];
  weakAreas: WeakArea[];
  recentAttempts: ExamAttemptSummary[];
  recommendations: Recommendation[];
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-800/70"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-red-500',
              trend === 'neutral' && 'text-slate-500'
            )}
          >
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {subValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </motion.div>
  );
}

// Bloom's Level Bar Component
function BloomsBar({ level, score, color }: { level: string; score: number; color: string }) {
  const levelLabels: Record<string, string> = {
    REMEMBER: 'Remember',
    UNDERSTAND: 'Understand',
    APPLY: 'Apply',
    ANALYZE: 'Analyze',
    EVALUATE: 'Evaluate',
    CREATE: 'Create',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {levelLabels[level] || level}
        </span>
        <span className="text-slate-500 dark:text-slate-400">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );
}

// Recent Attempt Row Component
function RecentAttemptRow({ attempt }: { attempt: ExamAttemptSummary }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            attempt.isPassed
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {attempt.isPassed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{attempt.examTitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {attempt.courseTitle} • Attempt #{attempt.attemptNumber}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="font-semibold text-slate-900 dark:text-white">{attempt.score}%</p>
          <p className="text-xs text-slate-500">{formatTime(attempt.timeSpent)}</p>
        </div>
        <span className="text-xs text-slate-400">{formatDate(attempt.submittedAt)}</span>
      </div>
    </motion.div>
  );
}

// Recommendation Card Component
function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const icons: Record<string, React.ElementType> = {
    improvement: Target,
    warning: AlertTriangle,
    success: CheckCircle2,
    study: Brain,
    time: Clock,
    focus: Lightbulb,
  };

  const colors: Record<string, string> = {
    improvement: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    study: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    time: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    focus: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  };

  const Icon = icons[recommendation.type] || Lightbulb;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50"
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', colors[recommendation.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 dark:text-white">{recommendation.title}</p>
          <Badge variant="secondary" className={cn('text-xs', priorityColors[recommendation.priority])}>
            {recommendation.priority}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{recommendation.description}</p>
      </div>
    </motion.div>
  );
}

// Loading Skeleton
function ExamAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl bg-slate-50 py-12 dark:bg-slate-800/50"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
        <ClipboardCheck className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No Exam Data Yet</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
        Complete some exams to see your analytics here. Your performance data, trends, and recommendations will appear once you start taking exams.
      </p>
      <Button variant="outline" className="mt-6 gap-2">
        <ChevronRight className="h-4 w-4" />
        Browse Courses
      </Button>
    </motion.div>
  );
}

export function ExamAnalytics({ compact = false, className }: ExamAnalyticsProps) {
  const [data, setData] = useState<ExamAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/user/exam-analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch exam analytics');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <ExamAnalyticsSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.totalAttempts === 0) {
    return <EmptyState />;
  }

  const { summary, bloomsAnalysis, weakAreas, recentAttempts, recommendations, trends } = data;

  const bloomsColors = [
    'bg-blue-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-orange-500',
    'bg-rose-500',
  ];

  // Compact view for overview tab
  if (compact) {
    return (
      <Card className={cn('border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5 text-indigo-500" />
            Exam Performance
          </CardTitle>
          <CardDescription>Your exam analytics summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.totalAttempts}</p>
              <p className="text-xs text-slate-500">Total Attempts</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.passRate}%</p>
              <p className="text-xs text-slate-500">Pass Rate</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.averageScore}%</p>
              <p className="text-xs text-slate-500">Avg Score</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summary.bestScore}%</p>
              <p className="text-xs text-slate-500">Best Score</p>
            </div>
          </div>

          {/* Recent Performance */}
          {recentAttempts.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Recent</p>
              <div className="space-y-2">
                {recentAttempts.slice(0, 3).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-400">{attempt.examTitle}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        attempt.isPassed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}
                    >
                      {attempt.score}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ClipboardCheck}
          label="Total Attempts"
          value={summary.totalAttempts}
          subValue={`${summary.totalExams} exams`}
          color="bg-indigo-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Pass Rate"
          value={`${summary.passRate}%`}
          subValue={trends.improvementRate > 0 ? `+${trends.improvementRate}%` : `${trends.improvementRate}%`}
          trend={trends.improvementRate >= 0 ? 'up' : 'down'}
          color="bg-emerald-500"
        />
        <StatCard
          icon={BarChart3}
          label="Average Score"
          value={`${summary.averageScore}%`}
          subValue={`Best: ${summary.bestScore}%`}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="Avg Time/Exam"
          value={`${Math.round(summary.averageTimePerExam / 60)}m`}
          subValue={`${summary.averageTimePerQuestion}s/question`}
          color="bg-orange-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bloom's Taxonomy Performance */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-purple-500" />
                Cognitive Level Performance
              </CardTitle>
              <CardDescription>Your performance by Bloom&apos;s taxonomy level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bloomsAnalysis.map((bloom, index) => (
                <TooltipProvider key={bloom.level}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <BloomsBar
                          level={bloom.level}
                          score={bloom.avgScore}
                          color={bloomsColors[index % bloomsColors.length]}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {bloom.correctAnswers}/{bloom.totalQuestions} correct ({bloom.avgScore}%)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* SAM AI Recommendations */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                SAM AI Recommendations
              </CardTitle>
              <CardDescription>Personalized suggestions to improve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.length > 0 ? (
                recommendations.slice(0, 4).map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))
              ) : (
                <p className="text-center text-sm text-slate-500">No recommendations at this time. Keep up the good work!</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-amber-200/50 bg-amber-50/50 backdrop-blur-sm dark:border-amber-700/30 dark:bg-amber-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Areas Needing Attention
              </CardTitle>
              <CardDescription>Topics where you scored below 70%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weakAreas.map((area, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-white/70 p-3 dark:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{area.examTitle}</p>
                      <p className="text-sm text-slate-500">{area.topic}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {area.score}%
                      </Badge>
                      <p className="mt-1 text-xs text-slate-500">{area.attempts} attempt(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Attempts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5 text-slate-500" />
              Recent Exam Attempts
            </CardTitle>
            <CardDescription>Your latest exam submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttempts.map((attempt) => (
              <RecentAttemptRow key={attempt.id} attempt={attempt} />
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
