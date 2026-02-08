'use client';

/**
 * AIInsightsPanel
 *
 * Displays AI-generated insights and recommendations based on the user&apos;s
 * learning data across all enrolled courses.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  BookOpen,
  Award,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  type EnrolledCourseAnalytics,
  type CourseAnalyticsSummary,
  formatStudyTime,
  getStatusLabel,
  getStatusColor,
} from '@/hooks/use-enrolled-course-analytics';
import { EmptyState } from '../enterprise/EmptyState';

// ============================================================================
// TYPES
// ============================================================================

interface AIInsightsPanelProps {
  courses: EnrolledCourseAnalytics[];
  summary: CourseAnalyticsSummary;
  className?: string;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  message: string;
  action?: {
    label: string;
    courseId?: string;
  };
  priority: number;
}

// ============================================================================
// INSIGHT GENERATION
// ============================================================================

function generateInsights(
  courses: EnrolledCourseAnalytics[],
  summary: CourseAnalyticsSummary
): Insight[] {
  const insights: Insight[] = [];

  // No data case
  if (courses.length === 0) {
    return [
      {
        id: 'no-courses',
        type: 'info',
        title: 'Get Started',
        message:
          'Enroll in courses to receive personalized AI insights and recommendations for your learning journey.',
        priority: 0,
      },
    ];
  }

  // Streak insights
  if (summary.currentStreak >= 7) {
    insights.push({
      id: 'streak-success',
      type: 'success',
      title: 'Learning Streak',
      message: `Excellent! You&apos;ve maintained a ${summary.currentStreak}-day learning streak. Consistency is key to retention.`,
      priority: 1,
    });
  } else if (summary.currentStreak === 0) {
    insights.push({
      id: 'streak-warning',
      type: 'warning',
      title: 'Restart Your Streak',
      message:
        'Your learning streak has reset. Even 15 minutes of study today can help build momentum.',
      priority: 2,
    });
  }

  // Progress insights
  if (summary.averageProgress >= 75) {
    insights.push({
      id: 'progress-success',
      type: 'success',
      title: 'Great Progress',
      message: `You&apos;re ${summary.averageProgress}% through your courses on average. Keep up the excellent work!`,
      priority: 3,
    });
  }

  // Courses needing attention
  const attentionCourses = courses.filter(
    (c) => c.status === 'needs_attention' || c.status === 'behind'
  );
  if (attentionCourses.length > 0) {
    const course = attentionCourses[0];
    insights.push({
      id: `attention-${course.courseId}`,
      type: 'warning',
      title: 'Course Needs Attention',
      message: `"${course.title}" is ${getStatusLabel(course.status).toLowerCase()}. ${
        course.aiInsights.recommendation ?? 'Consider dedicating more time to this course.'
      }`,
      action: {
        label: 'View Course',
        courseId: course.courseId,
      },
      priority: 1,
    });
  }

  // Study time recommendations
  const avgDailyMinutes = summary.totalStudyTimeMinutes / Math.max(summary.currentStreak, 7);
  if (avgDailyMinutes < 30) {
    insights.push({
      id: 'time-recommendation',
      type: 'tip',
      title: 'Study Time',
      message:
        'Research shows 30-60 minutes of focused study daily leads to better retention. Try to increase your daily learning time.',
      priority: 4,
    });
  }

  // Topic-based insights
  const allTopics = courses.flatMap((c) => c.topics);
  const weakTopics = allTopics.filter((t) => t.masteryLevel < 40);
  if (weakTopics.length > 0) {
    const weakestTopic = weakTopics.sort((a, b) => a.masteryLevel - b.masteryLevel)[0];
    insights.push({
      id: `topic-weak-${weakestTopic.id}`,
      type: 'tip',
      title: 'Focus Area',
      message: `Your mastery in "${weakestTopic.name}" is at ${weakestTopic.masteryLevel}%. Consider reviewing this topic with practice exercises.`,
      priority: 3,
    });
  }

  // Bloom&apos;s taxonomy insights
  const avgBloomsScores = courses.reduce(
    (acc, course) => {
      Object.entries(course.assessments.bloomsBreakdown).forEach(([key, value]) => {
        acc[key] = (acc[key] ?? 0) + value;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const bloomsEntries = Object.entries(avgBloomsScores).map(([key, value]) => ({
    level: key,
    score: value / courses.length,
  }));

  const weakestBlooms = bloomsEntries.sort((a, b) => a.score - b.score)[0];
  if (weakestBlooms && weakestBlooms.score < 50) {
    const bloomsLabels: Record<string, string> = {
      remember: 'Remembering basic facts',
      understand: 'Understanding concepts',
      apply: 'Applying knowledge',
      analyze: 'Analyzing information',
      evaluate: 'Evaluating ideas',
      create: 'Creating new solutions',
    };

    insights.push({
      id: 'blooms-insight',
      type: 'info',
      title: 'Cognitive Skills',
      message: `Your "${bloomsLabels[weakestBlooms.level] ?? weakestBlooms.level}" scores are lower. Try exercises that challenge this skill level.`,
      priority: 5,
    });
  }

  // Completed course celebration
  if (summary.completedCourses > 0) {
    insights.push({
      id: 'completion-celebration',
      type: 'success',
      title: 'Courses Completed',
      message: `You&apos;ve completed ${summary.completedCourses} course${
        summary.completedCourses > 1 ? 's' : ''
      }! Each completion strengthens your knowledge foundation.`,
      priority: 6,
    });
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface InsightCardProps {
  insight: Insight;
  index: number;
  onAction?: (courseId: string) => void;
}

function InsightCard({ insight, index, onAction }: InsightCardProps) {
  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Lightbulb className="w-5 h-5" />,
    tip: <Sparkles className="w-5 h-5" />,
  };

  const styleMap = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      titleColor: 'text-emerald-800 dark:text-emerald-200',
      textColor: 'text-emerald-700 dark:text-emerald-300',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      titleColor: 'text-amber-800 dark:text-amber-200',
      textColor: 'text-amber-700 dark:text-amber-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-800 dark:text-blue-200',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
    tip: {
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-200 dark:border-violet-800',
      iconBg: 'bg-violet-100 dark:bg-violet-900/40',
      iconColor: 'text-violet-600 dark:text-violet-400',
      titleColor: 'text-violet-800 dark:text-violet-200',
      textColor: 'text-violet-700 dark:text-violet-300',
    },
  };

  const style = styleMap[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className={cn('border', style.bg, style.border)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn('p-2 rounded-full flex-shrink-0', style.iconBg)}>
              <div className={style.iconColor}>{iconMap[insight.type]}</div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={cn('font-semibold mb-1', style.titleColor)}>
                {insight.title}
              </h4>
              <p className={cn('text-sm', style.textColor)}>{insight.message}</p>
              {insight.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('mt-2 p-0 h-auto', style.textColor)}
                  onClick={() => {
                    if (insight.action?.courseId && onAction) {
                      onAction(insight.action.courseId);
                    }
                  }}
                >
                  {insight.action.label}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Quick Stats Cards
function QuickStatsSection({ summary }: { summary: CourseAnalyticsSummary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="p-4 text-center">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg w-fit mx-auto mb-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatStudyTime(summary.totalStudyTimeMinutes)}
          </p>
          <p className="text-xs text-slate-500">Total Study</p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="p-4 text-center">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg w-fit mx-auto mb-2">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.averageProgress}%
          </p>
          <p className="text-xs text-slate-500">Avg Progress</p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="p-4 text-center">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg w-fit mx-auto mb-2">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.currentStreak}
          </p>
          <p className="text-xs text-slate-500">Day Streak</p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="p-4 text-center">
          <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg w-fit mx-auto mb-2">
            <Award className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.overallHealthScore}%
          </p>
          <p className="text-xs text-slate-500">Health Score</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Course Risk Overview
function CourseRiskOverview({ courses }: { courses: EnrolledCourseAnalytics[] }) {
  const riskCourses = courses.filter((c) => c.aiInsights.riskLevel !== 'low');

  if (riskCourses.length === 0) {
    return (
      <Card className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
            All Courses On Track
          </h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Great job! All your enrolled courses are progressing well.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          Courses Needing Attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {riskCourses.map((course) => (
            <div
              key={course.courseId}
              className={cn(
                'p-3 rounded-lg border-l-4',
                course.aiInsights.riskLevel === 'high'
                  ? 'bg-red-50 dark:bg-red-900/20 border-l-red-500'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-l-amber-500'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {course.title}
                </h4>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    course.aiInsights.riskLevel === 'high'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  )}
                >
                  {course.aiInsights.riskLevel === 'high' ? 'High Risk' : 'Medium Risk'}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {course.aiInsights.recommendation ?? getStatusLabel(course.status)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIInsightsPanel({ courses, summary, className }: AIInsightsPanelProps) {
  const insights = useMemo(() => generateInsights(courses, summary), [courses, summary]);

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<Brain className="w-full h-full" />}
        title="AI Insights"
        description="Enroll in courses and start learning to receive personalized AI-powered insights and recommendations."
        action={{
          label: 'Browse Courses',
          href: '/search',
        }}
        size="lg"
        className="min-h-[400px]"
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 rounded-lg">
          <Brain className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            AI Learning Insights
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Personalized recommendations based on your learning patterns
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStatsSection summary={summary} />

      {/* Risk Overview */}
      <CourseRiskOverview courses={courses} />

      {/* Generated Insights */}
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
              <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            Personalized Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Tips */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Learning Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                  Spaced Repetition
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review material at increasing intervals for better retention
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800">
              <Target className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                  Set Daily Goals
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Small daily targets lead to consistent long-term progress
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800">
              <Brain className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                  Active Recall
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Test yourself instead of just re-reading material
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800">
              <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                  Teach Others
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Explaining concepts deepens your understanding
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIInsightsPanel;
