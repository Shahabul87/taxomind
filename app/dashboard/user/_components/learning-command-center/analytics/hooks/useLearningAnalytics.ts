'use client';

/**
 * Learning Analytics Hook
 *
 * This hook now uses SAM Agentic APIs as the data source instead of
 * the legacy /api/learning-analytics/personal endpoint.
 *
 * The data is transformed to maintain backward compatibility with
 * existing components that depend on the LearningAnalyticsData interface.
 *
 * @see hooks/use-sam-agentic-analytics.ts for the underlying SAM hook
 */

import { useMemo } from 'react';
import {
  useSAMAgenticAnalytics,
  type SAMAgenticAnalytics,
  type SAMRecommendation,
} from '@/hooks/use-sam-agentic-analytics';

// ============================================================================
// TYPES (maintained for backward compatibility)
// ============================================================================

export interface LearningAnalyticsData {
  overview: {
    totalCourses: number;
    activeCourses: number;
    completedCourses: number;
    totalStudyTime: number;
    averageProgress: number;
    currentStreak: number;
    totalExamsCompleted: number;
    averageScore: number;
  };
  cognitiveProgress: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  learningPatterns: {
    preferredStudyTime: string;
    averageSessionLength: number;
    studyFrequency: string;
    mostActiveDay: string;
    learningVelocity: number;
    retentionRate: number;
  };
  recentActivity: Array<{
    courseId: string;
    courseTitle: string;
    activityType: 'exam' | 'section' | 'chapter';
    activityTitle: string;
    score?: number;
    completedAt: string;
    timeSpent: number;
  }>;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    lastActivity: string;
    totalSections: number;
    completedSections: number;
    averageScore: number;
    estimatedTimeToComplete: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>;
  aiRecommendations: Array<{
    type: 'study_schedule' | 'weak_areas' | 'course_recommendation' | 'learning_strategy';
    title: string;
    description: string;
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    iconType: 'streak' | 'completion' | 'score' | 'time' | 'cognitive';
    unlockedAt: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

interface UseLearningAnalyticsReturn {
  data: LearningAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Raw SAM agentic data for advanced usage */
  samData: SAMAgenticAnalytics | null;
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

function mapRecommendationType(
  samType: SAMRecommendation['type']
): 'study_schedule' | 'weak_areas' | 'course_recommendation' | 'learning_strategy' {
  switch (samType) {
    case 'practice':
    case 'assessment':
      return 'weak_areas';
    case 'content':
    case 'goal':
      return 'course_recommendation';
    case 'break':
      return 'study_schedule';
    case 'review':
    default:
      return 'learning_strategy';
  }
}

function inferPreferredStudyTime(patterns: SAMAgenticAnalytics['patterns']): string {
  // Look for time-related patterns
  const timePattern = patterns.find(
    p => p.type === 'study_time' || p.name.toLowerCase().includes('time')
  );
  if (timePattern?.metadata?.preferredTime) {
    return timePattern.metadata.preferredTime as string;
  }
  // Default based on common patterns
  return 'morning';
}

function inferStudyFrequency(
  progress: SAMAgenticAnalytics['progress'],
  journey: SAMAgenticAnalytics['journey']
): string {
  const streak = progress?.streak ?? journey?.summary.currentStreak ?? 0;
  if (streak >= 7) return 'high';
  if (streak >= 3) return 'medium';
  return 'low';
}

function inferMostActiveDay(patterns: SAMAgenticAnalytics['patterns']): string {
  const dayPattern = patterns.find(
    p => p.type === 'active_day' || p.name.toLowerCase().includes('day')
  );
  if (dayPattern?.metadata?.day) {
    return dayPattern.metadata.day as string;
  }
  return 'Monday';
}

function transformSAMDataToLegacy(samData: SAMAgenticAnalytics): LearningAnalyticsData {
  const { progress, predictions, patterns, goals, journey, recommendations } = samData;

  // Calculate overview metrics
  const totalGoals = goals.total;
  const activeGoals = goals.active;
  const completedGoals = goals.completed;
  const totalStudyTime = progress?.totalStudyTime ?? 0;
  const currentStreak = progress?.streak ?? journey?.summary.currentStreak ?? 0;

  // Calculate average progress from goals
  const goalsWithProgress = goals.items.filter(g => g.progress > 0);
  const averageProgress = goalsWithProgress.length > 0
    ? goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / goalsWithProgress.length
    : 0;

  // Estimate score from learning health
  const estimatedScore = samData.computed.learningScore;

  // Transform recommendations
  const aiRecommendations = (recommendations?.items ?? []).map(rec => ({
    type: mapRecommendationType(rec.type),
    title: rec.title,
    description: rec.description,
    actionItems: rec.reason ? [rec.reason] : [],
    priority: rec.priority,
  }));

  // Add intervention-based recommendations
  samData.interventions
    .filter(i => i.status === 'pending')
    .slice(0, 3)
    .forEach(intervention => {
      aiRecommendations.push({
        type: 'learning_strategy' as const,
        title: intervention.message,
        description: intervention.suggestedActions[0]?.description ?? '',
        actionItems: intervention.suggestedActions.map(a => a.title),
        priority: intervention.priority === 'critical' ? 'high' : intervention.priority,
      });
    });

  // Calculate cognitive progress based on patterns and predictions
  const cognitiveBase = 50;
  const cognitiveBonus = samData.computed.learningScore / 10;

  // Create achievements from journey milestones and goals
  const achievements: LearningAnalyticsData['achievements'] = [];

  if (currentStreak >= 7) {
    achievements.push({
      id: 'streak-7',
      title: 'Week Warrior',
      description: '7-day learning streak achieved!',
      iconType: 'streak',
      unlockedAt: new Date().toISOString(),
      rarity: 'rare',
    });
  }

  if (currentStreak >= 30) {
    achievements.push({
      id: 'streak-30',
      title: 'Monthly Master',
      description: '30-day learning streak achieved!',
      iconType: 'streak',
      unlockedAt: new Date().toISOString(),
      rarity: 'epic',
    });
  }

  if (completedGoals > 0) {
    achievements.push({
      id: 'goals-completed',
      title: 'Goal Getter',
      description: `Completed ${completedGoals} learning goal${completedGoals > 1 ? 's' : ''}!`,
      iconType: 'completion',
      unlockedAt: new Date().toISOString(),
      rarity: completedGoals >= 5 ? 'epic' : 'common',
    });
  }

  if (totalStudyTime >= 600) {
    achievements.push({
      id: 'study-time-10h',
      title: 'Dedicated Learner',
      description: '10+ hours of study time!',
      iconType: 'time',
      unlockedAt: new Date().toISOString(),
      rarity: 'rare',
    });
  }

  // Infer learning patterns
  const learningPatterns = {
    preferredStudyTime: inferPreferredStudyTime(patterns),
    averageSessionLength: progress?.sessionsCompleted
      ? Math.round(totalStudyTime / Math.max(progress.sessionsCompleted, 1))
      : 30,
    studyFrequency: inferStudyFrequency(progress, journey),
    mostActiveDay: inferMostActiveDay(patterns),
    learningVelocity: averageProgress > 50 ? 1.2 : averageProgress > 25 ? 1.0 : 0.8,
    retentionRate: predictions?.struggle?.probability
      ? Math.round((1 - predictions.struggle.probability) * 100)
      : 75,
  };

  // Build course progress from goals (goals often map to courses)
  const courseProgress = goals.items
    .filter(g => g.status === 'active')
    .map(goal => ({
      courseId: goal.id,
      courseTitle: goal.title,
      progress: goal.progress,
      lastActivity: goal.createdAt,
      totalSections: goal.subGoals.length || 5,
      completedSections: goal.subGoals.filter(sg => sg.status === 'completed').length,
      averageScore: estimatedScore,
      estimatedTimeToComplete: Math.round((100 - goal.progress) * 2),
      difficulty: (goal.priority === 'critical' || goal.priority === 'high'
        ? 'advanced'
        : goal.priority === 'medium'
        ? 'intermediate'
        : 'beginner') as 'beginner' | 'intermediate' | 'advanced',
    }));

  return {
    overview: {
      totalCourses: totalGoals,
      activeCourses: activeGoals,
      completedCourses: completedGoals,
      totalStudyTime,
      averageProgress: Math.round(averageProgress),
      currentStreak,
      totalExamsCompleted: progress?.sessionsCompleted ?? 0,
      averageScore: estimatedScore,
    },
    cognitiveProgress: {
      remember: Math.min(100, cognitiveBase + cognitiveBonus + 10),
      understand: Math.min(100, cognitiveBase + cognitiveBonus + 5),
      apply: Math.min(100, cognitiveBase + cognitiveBonus),
      analyze: Math.min(100, cognitiveBase + cognitiveBonus - 5),
      evaluate: Math.min(100, cognitiveBase + cognitiveBonus - 10),
      create: Math.min(100, cognitiveBase + cognitiveBonus - 15),
    },
    learningPatterns,
    recentActivity: [], // Would need activity tracking API
    courseProgress,
    aiRecommendations,
    achievements,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useLearningAnalytics(
  timeframe: 'week' | 'month' | 'semester' | 'all' = 'month'
): UseLearningAnalyticsReturn {
  // Map timeframe to SAM period
  const periodMap: Record<typeof timeframe, 'daily' | 'weekly' | 'monthly'> = {
    week: 'weekly',
    month: 'monthly',
    semester: 'monthly',
    all: 'monthly',
  };

  const {
    data: samData,
    loading,
    error,
    refresh,
  } = useSAMAgenticAnalytics({
    period: periodMap[timeframe],
    enabled: true,
  });

  // Transform SAM data to legacy format
  const data = useMemo(() => {
    if (!samData) return null;
    return transformSAMDataToLegacy(samData);
  }, [samData]);

  return {
    data,
    isLoading: loading,
    error,
    refetch: refresh,
    samData,
  };
}

// ============================================================================
// HELPER FUNCTIONS (maintained for backward compatibility)
// ============================================================================

/**
 * Format study time in minutes to human-readable string
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hrs`;
}

/**
 * Get progress status based on current vs target progress
 */
export function getProgressStatus(
  currentProgress: number,
  targetProgress: number
): 'ahead' | 'on_track' | 'behind' | 'at_risk' {
  const diff = currentProgress - targetProgress;
  if (diff >= 10) return 'ahead';
  if (diff >= -5) return 'on_track';
  if (diff >= -20) return 'behind';
  return 'at_risk';
}

/**
 * Get health status color
 */
export function getHealthStatusColor(
  status: 'excellent' | 'good' | 'needs_attention' | 'at_risk'
): string {
  switch (status) {
    case 'excellent':
      return 'text-emerald-600';
    case 'good':
      return 'text-blue-600';
    case 'needs_attention':
      return 'text-amber-600';
    case 'at_risk':
      return 'text-red-600';
  }
}

/**
 * Get health status badge variant
 */
export function getHealthStatusBadge(
  status: 'excellent' | 'good' | 'needs_attention' | 'at_risk'
): string {
  switch (status) {
    case 'excellent':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'good':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'needs_attention':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'at_risk':
      return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
}
