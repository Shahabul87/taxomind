'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Sparkles,
  ChevronRight,
  BarChart3,
  Zap,
  Award,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Flame,
  Star,
  ArrowUpRight,
  Minus,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface CourseInsightMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
  color?: string;
}

export interface CourseInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: boolean;
  action?: {
    label: string;
    href: string;
  };
}

export interface CourseInsightData {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  progress: number;
  totalSections: number;
  completedSections: number;
  studyTimeMinutes: number;
  lastStudied?: Date | string;
  estimatedCompletion?: Date | string;
  masteryLevel: number;
  bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  currentStreak: number;
  averageQuizScore?: number;
  engagementScore: number;
  learningVelocity: number; // sections per week
  predictedCompletionDays?: number;
  insights: CourseInsight[];
  metrics: CourseInsightMetric[];
  strengths: string[];
  areasToImprove: string[];
  nextMilestone?: {
    title: string;
    progress: number;
    target: number;
  };
}

export interface CourseInsightCardProps {
  course: CourseInsightData;
  className?: string;
  compact?: boolean;
  onContinue?: () => void;
  onViewDetails?: () => void;
}

const BLOOMS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  remember: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  understand: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  apply: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  analyze: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  evaluate: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  create: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
};

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  strength: TrendingUp,
  improvement: Target,
  recommendation: Sparkles,
  warning: AlertCircle,
  achievement: Trophy,
};

const INSIGHT_COLORS: Record<string, string> = {
  strength: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400',
  improvement: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400',
  recommendation: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400',
  warning: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
  achievement: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400',
};

function TrendIndicator({ trend, change }: { trend?: 'up' | 'down' | 'stable'; change?: string }) {
  if (!trend) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
        trend === 'down' && 'text-red-500 dark:text-red-400',
        trend === 'stable' && 'text-slate-500 dark:text-slate-400'
      )}
    >
      {trend === 'up' && <TrendingUp className="h-3 w-3" />}
      {trend === 'down' && <TrendingDown className="h-3 w-3" />}
      {trend === 'stable' && <Minus className="h-3 w-3" />}
      {change}
    </span>
  );
}

function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Never';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CourseInsightCard({
  course,
  className,
  compact = false,
  onContinue,
  onViewDetails,
}: CourseInsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bloomsStyle = BLOOMS_COLORS[course.bloomsLevel] || BLOOMS_COLORS.remember;

  // Get top insight for compact view
  const topInsight = course.insights.find(i => i.priority === 'high') || course.insights[0];

  if (compact) {
    return (
      <Card
        className={cn(
          'group relative overflow-hidden border border-slate-200/50 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg dark:border-slate-700/50 dark:bg-slate-800/80',
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Course Image */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
              {course.imageUrl ? (
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BookOpen className="h-6 w-6 text-slate-400" />
                </div>
              )}
              {/* Progress overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-200 dark:bg-slate-600">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {course.title}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{course.progress}% complete</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>{formatStudyTime(course.studyTimeMinutes)} studied</span>
              </div>

              {/* Key metric */}
              {topInsight && (
                <div className={cn('mt-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs', INSIGHT_COLORS[topInsight.type])}>
                  {React.createElement(INSIGHT_ICONS[topInsight.type] || Sparkles, { className: 'h-3 w-3' })}
                  <span className="truncate max-w-[160px]">{topInsight.title}</span>
                </div>
              )}
            </div>

            {/* Quick Action */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 flex-shrink-0"
              onClick={onContinue}
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border border-slate-200/50 bg-white/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-700/50 dark:bg-slate-800/90',
        className
      )}
    >
      {/* Gradient accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Course Image */}
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-inner dark:bg-slate-700">
            {course.imageUrl ? (
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-10 w-10 text-slate-400" />
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                    {course.description}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'capitalize text-xs',
                  bloomsStyle.bg,
                  bloomsStyle.text,
                  bloomsStyle.border
                )}
              >
                {course.bloomsLevel}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">
                  {course.completedSections} of {course.totalSections} sections
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {course.progress}%
                </span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>

            {/* Quick Stats Row */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatStudyTime(course.studyTimeMinutes)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Total study time</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {course.currentStreak > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <Flame className="h-3.5 w-3.5" />
                        <span>{course.currentStreak} days</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Current streak</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {course.averageQuizScore !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Target className="h-3.5 w-3.5" />
                        <span>{course.averageQuizScore}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Average quiz score</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <Brain className="h-3.5 w-3.5" />
                      <span>{course.masteryLevel}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Mastery level</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-slate-400 dark:text-slate-500">
                Last studied: {formatDate(course.lastStudied)}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {course.metrics.slice(0, 4).map((metric, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {metric.label}
              </div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className={cn('text-lg font-bold', metric.color || 'text-slate-900 dark:text-white')}>
                  {metric.value}
                </span>
                <TrendIndicator trend={metric.trend} change={metric.change} />
              </div>
            </div>
          ))}
        </div>

        {/* Insights Section */}
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/50"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              AI Insights ({course.insights.length})
            </span>
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
            />
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {course.insights.map((insight, idx) => {
                    const Icon = INSIGHT_ICONS[insight.type] || Sparkles;
                    return (
                      <div
                        key={insight.id || idx}
                        className={cn(
                          'rounded-lg border p-3',
                          INSIGHT_COLORS[insight.type]
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{insight.title}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1.5 py-0',
                                  insight.priority === 'high' && 'border-red-300 text-red-600',
                                  insight.priority === 'medium' && 'border-amber-300 text-amber-600',
                                  insight.priority === 'low' && 'border-slate-300 text-slate-600'
                                )}
                              >
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs opacity-80">
                              {insight.description}
                            </p>
                            {insight.actionable && insight.action && (
                              <Link href={insight.action.href}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="mt-2 h-7 px-2 text-xs gap-1"
                                >
                                  {insight.action.label}
                                  <ArrowUpRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Strengths & Improvements */}
                {(course.strengths.length > 0 || course.areasToImprove.length > 0) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {course.strengths.length > 0 && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                        <h4 className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Strengths
                        </h4>
                        <ul className="mt-2 space-y-1">
                          {course.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-emerald-600 dark:text-emerald-400/80">
                              &bull; {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {course.areasToImprove.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                        <h4 className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                          <Target className="h-4 w-4" />
                          Areas to Improve
                        </h4>
                        <ul className="mt-2 space-y-1">
                          {course.areasToImprove.map((a, i) => (
                            <li key={i} className="text-xs text-amber-600 dark:text-amber-400/80">
                              &bull; {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Next Milestone */}
        {course.nextMilestone && (
          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  {course.nextMilestone.title}
                </span>
              </div>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {course.nextMilestone.progress}/{course.nextMilestone.target}
              </span>
            </div>
            <Progress
              value={(course.nextMilestone.progress / course.nextMilestone.target) * 100}
              className="mt-2 h-1.5"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {course.predictedCompletionDays && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Est. completion in {course.predictedCompletionDays} days
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="gap-1.5"
            >
              <BarChart3 className="h-4 w-4" />
              Details
            </Button>
            <Button
              size="sm"
              onClick={onContinue}
              className="gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
            >
              <Play className="h-4 w-4" />
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
