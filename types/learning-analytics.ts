/**
 * Learning Analytics Types
 * Phase 5: Learning Analytics & Insights
 */

// ============================================
// HEATMAP TYPES
// ============================================

export interface HeatmapDay {
  date: string; // YYYY-MM-DD format
  count: number; // Number of activities or minutes
  level: 0 | 1 | 2 | 3 | 4; // Intensity level for visualization
  details?: {
    studyMinutes: number;
    lessonsCompleted: number;
    quizzesCompleted: number;
    activeSessions: number;
  };
}

export interface HeatmapWeek {
  weekNumber: number;
  days: HeatmapDay[];
}

export interface HeatmapMonth {
  month: number; // 0-11
  year: number;
  label: string; // "Jan", "Feb", etc.
  weeks: HeatmapWeek[];
}

export interface HeatmapStats {
  totalStudyHours: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  averageDailyMinutes: number;
  mostActiveDay: string; // "Monday", "Tuesday", etc.
  bestStudyTime: string; // "9:00 AM - 11:00 AM"
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
}

export interface HeatmapResponse {
  months: HeatmapMonth[];
  stats: HeatmapStats;
  year: number;
}

// ============================================
// COURSE PROGRESS ANALYTICS TYPES
// ============================================

export type CourseProgressStatus = 'ahead' | 'on_track' | 'behind' | 'at_risk';

// Type alias for backwards compatibility
export type ProgressStatus = CourseProgressStatus;

export interface CourseProgressData {
  courseId: string;
  courseTitle: string;
  courseImage?: string;

  // Progress metrics
  currentProgress: number; // 0-100
  plannedProgress: number; // 0-100 (where you should be)
  targetDate: string | null;
  startDate: string;

  // Status
  status: CourseProgressStatus;
  progressDelta: number; // Difference between actual and planned

  // Completion estimates
  estimatedCompletionDate?: string;
  daysUntilTarget?: number;
  isOverdue: boolean;

  // Activity metrics
  lastActivityDate?: string;
  totalTimeSpent: number; // minutes
  averageSessionLength: number; // minutes
  lessonsCompleted: number;
  totalLessons: number;
  quizScore?: number; // Average quiz score
}

export interface VelocityMetrics {
  lessonsPerWeek: number;
  lessonsPerWeekAvg: number;
  quizzesPerWeek: number;
  quizzesPerWeekAvg: number;
  studyHoursPerWeek: number;
  studyHoursPerWeekAvg: number;

  // Trends
  weeklyTrend: 'increasing' | 'stable' | 'decreasing';
  velocityScore: number; // 0-100
}

export interface CourseProgressAnalyticsResponse {
  courses: CourseProgressData[];
  velocity: VelocityMetrics;
  summary: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    averageProgress: number;
    coursesAhead: number;
    coursesOnTrack: number;
    coursesBehind: number;
    coursesAtRisk: number;
  };
}

// ============================================
// SAM INSIGHTS TYPES
// ============================================

export type InsightType =
  | 'recommendation'
  | 'warning'
  | 'achievement'
  | 'tip'
  | 'pattern'
  | 'milestone';

export type AttentionSeverity = 'critical' | 'warning' | 'info';

export type InsightPriority = 'high' | 'medium' | 'low';

export interface LearningInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  icon?: string;
  color?: string;

  // Action
  action?: {
    label: string;
    href?: string;
    type?: 'navigate' | 'reschedule' | 'adjust_goal' | 'dismiss';
  };

  // Metadata
  courseId?: string;
  courseName?: string;
  createdAt: string;
  expiresAt?: string;

  // Tracking
  dismissed?: boolean;
  dismissedAt?: string;
  actioned?: boolean;
  actionedAt?: string;
}

export interface LearningPattern {
  id: string;
  label: string;
  value: string;
  type: 'strength' | 'improvement' | 'neutral';
  description?: string;
}

export interface AttentionItem {
  id: string;
  message: string;
  type: 'deadline' | 'quiz' | 'streak' | 'goal' | 'review';
  severity: 'critical' | 'warning' | 'info';
  courseId?: string;
  courseName?: string;
  dueDate?: string;
  progress?: number;
}

export interface SuggestedAction {
  id: string;
  title: string;
  duration: string; // "35 min", "15 min"
  type: 'lesson' | 'quiz' | 'review' | 'exercise' | 'break';
  courseId?: string;
  courseName?: string;
  href?: string;
  priority: number;
}

export interface SAMInsightsResponse {
  insights: LearningInsight[];
  patterns: LearningPattern[];
  attentionItems: AttentionItem[];
  suggestedActions: SuggestedAction[];

  // Quick stats
  optimalStudyTime: string;
  focusArea?: string;

  // Summary
  learningScore: number; // 0-100 overall learning health
  engagementLevel: 'high' | 'medium' | 'low';
  progressRate: 'ahead' | 'on_track' | 'behind';
}

// ============================================
// WEEKLY/MONTHLY ANALYTICS TYPES
// ============================================

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number; // Percentage change
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyAnalytics {
  weekOf: string; // Start date of week
  studyHours: PeriodComparison;
  lessonsCompleted: PeriodComparison;
  quizzesCompleted: PeriodComparison;
  averageScore: PeriodComparison;
  streakDays: number;

  // Daily breakdown
  dailyMinutes: {
    day: string; // "Mon", "Tue", etc.
    planned: number;
    actual: number;
  }[];
}

export interface MonthlyAnalytics {
  month: string; // "January 2025"
  studyHours: PeriodComparison;
  lessonsCompleted: PeriodComparison;
  coursesCompleted: number;
  certificatesEarned: number;
  averageScore: PeriodComparison;

  // Weekly breakdown
  weeklyProgress: {
    week: number;
    studyHours: number;
    lessonsCompleted: number;
  }[];
}

// ============================================
// FULL ANALYTICS RESPONSE
// ============================================

export interface LearningAnalyticsResponse {
  heatmap: HeatmapResponse;
  courseProgress: CourseProgressAnalyticsResponse;
  samInsights: SAMInsightsResponse;
  weeklyAnalytics: WeeklyAnalytics;
  monthlyAnalytics?: MonthlyAnalytics;

  // Last updated
  generatedAt: string;
  userId: string;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface HeatmapQueryParams {
  year?: number;
}

export interface StudyHeatmapProps {
  year?: number;
  onDayClick?: (day: HeatmapDay) => void;
  showStats?: boolean;
  compact?: boolean;
}

export interface CourseProgressQueryParams {
  courseId?: string;
  limit?: number;
}

export interface CourseProgressSummary {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  averageProgress: number;
  coursesAhead: number;
  coursesOnTrack: number;
  coursesBehind: number;
  coursesAtRisk: number;
}

export interface CourseProgressAnalyticsProps {
  courseId?: string; // If provided, show single course
  maxCourses?: number;
  showVelocity?: boolean;
  compact?: boolean;
}

export interface SAMInsightsProps {
  maxInsights?: number;
  showPatterns?: boolean;
  showActions?: boolean;
  compact?: boolean;
  onInsightAction?: (insight: LearningInsight) => void;
}

export interface LearningAnalyticsDashboardProps {
  defaultView?: 'heatmap' | 'courses' | 'insights' | 'weekly';
  userId?: string;
}

// ============================================
// DISPLAY HELPERS
// ============================================

export const HEATMAP_LEVELS = {
  0: { color: 'bg-slate-100 dark:bg-slate-800', label: 'No activity' },
  1: { color: 'bg-emerald-200 dark:bg-emerald-900', label: 'Light activity' },
  2: { color: 'bg-emerald-400 dark:bg-emerald-700', label: 'Moderate activity' },
  3: { color: 'bg-emerald-500 dark:bg-emerald-600', label: 'Good activity' },
  4: { color: 'bg-emerald-600 dark:bg-emerald-500', label: 'High activity' },
} as const;

export const PROGRESS_STATUS_CONFIG = {
  ahead: {
    label: 'Ahead',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: 'TrendingUp',
  },
  on_track: {
    label: 'On Track',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'Check',
  },
  behind: {
    label: 'Behind',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: 'AlertTriangle',
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: 'AlertCircle',
  },
} as const;

export const INSIGHT_TYPE_CONFIG = {
  recommendation: {
    icon: 'Lightbulb',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  warning: {
    icon: 'AlertTriangle',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  achievement: {
    icon: 'Trophy',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  tip: {
    icon: 'Brain',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  pattern: {
    icon: 'BarChart3',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  milestone: {
    icon: 'Flag',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-200 dark:border-rose-800',
  },
} as const;

export const ATTENTION_SEVERITY_CONFIG = {
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    icon: 'AlertCircle',
  },
  warning: {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'AlertTriangle',
  },
  info: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'Info',
  },
} as const;

// Config types derived from const objects
export type ProgressStatusConfig = typeof PROGRESS_STATUS_CONFIG;
export type InsightTypeConfig = typeof INSIGHT_TYPE_CONFIG;
export type AttentionSeverityConfig = typeof ATTENTION_SEVERITY_CONFIG;

/**
 * Calculate heatmap level based on study minutes
 */
export function calculateHeatmapLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

/**
 * Calculate progress status based on delta
 */
export function calculateProgressStatus(
  currentProgress: number,
  plannedProgress: number
): CourseProgressStatus {
  const delta = currentProgress - plannedProgress;

  if (delta >= 10) return 'ahead';
  if (delta >= -5) return 'on_track';
  if (delta >= -15) return 'behind';
  return 'at_risk';
}

/**
 * Format study time for display
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Get trend icon based on change
 */
export function getTrendConfig(change: number): {
  icon: string;
  color: string;
  label: string;
} {
  if (change > 5) {
    return { icon: 'TrendingUp', color: 'text-emerald-500', label: 'Improving' };
  }
  if (change < -5) {
    return { icon: 'TrendingDown', color: 'text-red-500', label: 'Declining' };
  }
  return { icon: 'Minus', color: 'text-slate-500', label: 'Stable' };
}
