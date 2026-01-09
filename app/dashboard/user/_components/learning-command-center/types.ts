// Learning Command Center Types

export type ActivityStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'SKIPPED'
  | 'RESCHEDULED';

export type ActivityType =
  | 'STUDY_SESSION'
  | 'VIDEO_LESSON'
  | 'READING'
  | 'QUIZ'
  | 'ASSIGNMENT'
  | 'PROJECT'
  | 'PRACTICE'
  | 'LIVE_CLASS'
  | 'DISCUSSION'
  | 'REVIEW'
  | 'EXAM'
  | 'GOAL_MILESTONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type GoalStatus = 'ON_TRACK' | 'AHEAD' | 'BEHIND' | 'AT_RISK' | 'COMPLETED' | 'PAUSED';

export interface LearningActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  scheduledDate?: Date;
  startTime?: string;
  endTime?: string;
  estimatedDuration: number;
  actualDuration?: number;
  status: ActivityStatus;
  progress: number;
  completedAt?: Date;
  courseId?: string;
  courseName?: string;
  chapterId?: string;
  chapterName?: string;
  lessonName?: string;
  priority: TaskPriority;
  tags: string[];
}

export interface LearningTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: TaskPriority;
  completed: boolean;
  tags: string[];
  courseId?: string;
  courseName?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetDate?: Date;
  completed: boolean;
}

export interface LearningGoal {
  id: string;
  title: string;
  description?: string;
  type?: 'COURSE' | 'SKILL' | 'CERTIFICATION' | 'CUSTOM';
  targetDate: Date;
  progress: number;
  milestones: GoalMilestone[];
  status: GoalStatus;
  courseName?: string;
  courseId?: string;
}

export interface DailyStats {
  totalActivities?: number;
  completedActivities?: number;
  totalPlannedMinutes?: number;
  totalCompletedMinutes?: number;
  completionRate: number;
  streak: number;
  plannedHours: number;
  completedHours: number;
  weeklyProgress: {
    current: number;
    target: number;
    percentage: number;
    // Legacy properties for backward compatibility
    hoursPlanned?: number;
    hoursCompleted?: number;
    goalHours?: number;
    percentComplete?: number;
  };
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: Date;
  streakStartDate?: Date;
  freezesAvailable?: number;
  freezesUsed?: number;
  // Legacy properties for backward compatibility
  current?: number;
  longest?: number;
  todayCompleted?: boolean;
  atRisk?: boolean;
}

export interface WeeklyProgress {
  current: number;
  target: number;
  percentage: number;
  // Legacy properties
  hoursPlanned?: number;
  hoursCompleted?: number;
  goalHours?: number;
  percentComplete?: number;
}

export interface DailyAgenda {
  date: Date;
  dayOfWeek?: string;
  greeting: string;
  userName?: string;
  motivationalQuote?: string;
  stats: DailyStats;
  // Legacy properties
  summary?: DailyStats;
  streak?: StreakInfo;
  weeklyProgress?: WeeklyProgress;
  schedule?: {
    morning: LearningActivity[];
    afternoon: LearningActivity[];
    evening: LearningActivity[];
    unscheduled: LearningActivity[];
  };
  todos?: LearningTask[];
  activeGoals?: LearningGoal[];
}

export interface WeeklyTimelineDay {
  date: Date;
  dayName: string;
  plannedHours: number;
  actualHours: number;
  completionRate?: number;
  isToday: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  metadata?: Record<string, unknown>;
}

// ============================================
// Learning Gantt Chart Types (Phase 2)
// ============================================

export type GanttItemType = 'COURSE' | 'CHAPTER' | 'LESSON' | 'STUDY_PLAN' | 'GOAL' | 'MILESTONE';

export type GanttItemStatus = 'NOT_STARTED' | 'ON_TRACK' | 'AHEAD' | 'BEHIND' | 'COMPLETED' | 'OVERDUE';

export interface GanttMilestone {
  id: string;
  title: string;
  date: Date;
  completed: boolean;
  type?: 'quiz' | 'assignment' | 'exam' | 'deadline' | 'custom';
}

export interface LearningGanttItem {
  id: string;
  type: GanttItemType;
  title: string;
  description?: string;

  // Timeline
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;

  // Progress Tracking
  plannedHours: number;
  actualHours: number;
  plannedProgress: number;  // Where should we be by today? (0-100)
  actualProgress: number;   // Where are we actually? (0-100)

  // Visual
  color: string;
  icon?: string;

  // Hierarchy
  parentId?: string;
  children?: LearningGanttItem[];
  depth?: number;
  isExpanded?: boolean;

  // Status
  status: GanttItemStatus;

  // Course/Lesson info
  courseId?: string;
  courseName?: string;
  chapterId?: string;
  chapterName?: string;

  // Milestones within this item
  milestones: GanttMilestone[];
}

export interface GanttViewConfig {
  view: 'day' | 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  showPlanned: boolean;
  showActual: boolean;
  showMilestones: boolean;
  groupBy: 'course' | 'type' | 'goal';
  courseFilter?: string[];
  expandAll?: boolean;
}

export interface PlannedVsAccomplished {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  planned: {
    totalHours: number;
    activities: number;
    courses: number;
  };
  accomplished: {
    totalHours: number;
    activities: number;
    courses: number;
  };
  variance: {
    hours: number;      // positive = ahead, negative = behind
    percentage: number;
    status: 'AHEAD' | 'ON_TRACK' | 'BEHIND';
  };
  dailyBreakdown: {
    date: string;
    dayName: string;
    plannedHours: number;
    actualHours: number;
    activities: number;
  }[];
}

export interface GanttCourseInfo {
  id: string;
  title: string;
  color: string;
  totalProgress: number;
  totalHours: number;
  completedHours: number;
  chaptersCount: number;
  lessonsCount: number;
}

export interface GanttResponse {
  items: LearningGanttItem[];
  summary: PlannedVsAccomplished;
  courses: GanttCourseInfo[];
}

export interface CourseGanttResponse {
  course: GanttCourseInfo;
  chapters: LearningGanttItem[];
  milestones: GanttMilestone[];
  timeline: {
    start: Date;
    end: Date;
    plannedCompletionDate: Date;
    estimatedCompletionDate: Date;
  };
}
