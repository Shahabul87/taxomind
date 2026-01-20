/**
 * Type definitions for the 10,000 Hour Practice Dashboard
 */

// ============================================================================
// PHASE 3/4: QUALITY SCORING & VALIDATION TYPES
// ============================================================================

export type EvidenceType = 'ASSESSMENT' | 'PROJECT' | 'PEER_REVIEW' | 'SELF_REPORT' | 'TIME_BASED';
export type ProjectOutcome = 'SUCCESSFUL' | 'PARTIAL' | 'FAILED' | 'ABANDONED';
export type QualityLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR';
export type ValidationFlag =
  | 'EXCESSIVE_DURATION'
  | 'LOW_ACTIVITY'
  | 'RAPID_SESSION_CREATION'
  | 'IMPOSSIBLE_TIMING'
  | 'FOCUS_MISMATCH'
  | 'POMODORO_MISMATCH'
  | 'DURATION_OUTLIER';
export type DriftDirection = 'IMPROVING' | 'DECLINING' | 'STABLE' | 'OSCILLATING';
export type DriftSeverity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
export type ReviewUrgency = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'STABLE';

export interface QualityBreakdown {
  timeWeight: number;
  focusWeight: number;
  bloomsWeight: number;
  sessionTypeWeight: number;
  assessmentBonus: number;
  projectBonus: number;
  peerReviewBonus: number;
  difficultyAdjustment: number;
}

export interface QualityScoreResult {
  multiplier: number;
  breakdown: QualityBreakdown;
  confidenceLevel: number;
  evidenceType: EvidenceType;
}

export interface ValidationResult {
  isValid: boolean;
  adjustedDuration?: number;
  flags: ValidationFlag[];
  warnings: string[];
  confidence: number;
}

export interface FatigueIndicator {
  mentalFatigue: number;
  focusDegradation: number;
  suggestedBreakMinutes: number;
  shouldTakeBreak: boolean;
}

export interface FocusDriftResult {
  overallDrift: DriftDirection;
  driftSeverity: DriftSeverity;
  trendLine: { slope: number; intercept: number };
  volatility: number;
  fatigueIndicators: FatigueIndicator;
  recommendations: string[];
}

export interface DecayResult {
  retentionRate: number;
  effectiveHours: number;
  decayedHours: number;
  daysUntilCritical: number;
  reviewUrgency: ReviewUrgency;
  recommendedReviewDate: Date;
}

export interface EndSessionInputs {
  rating?: number;
  notes?: string;
  distractionCount?: number;
  // Phase 3: Enhanced Quality Scoring Inputs
  selfRatedDifficulty?: number;
  assessmentScore?: number;
  assessmentPassed?: boolean;
  projectOutcome?: ProjectOutcome;
  peerReviewScore?: number;
  // Phase 4: Timezone and custom target support
  timezone?: string;
  targetHours?: number;
}

export interface EndSessionResult {
  session: PracticeSession;
  masteryUpdate?: {
    skillName: string;
    newLevel?: ProficiencyLevel;
    levelUp: boolean;
    qualityHoursGained: number;
    totalQualityHours: number;
  };
  qualityScoring?: QualityScoreResult;
  validation?: ValidationResult;
  focusDrift?: FocusDriftResult;
  warnings?: string[];
}

// ============================================================================
// PROFICIENCY & MASTERY TYPES
// ============================================================================

export type ProficiencyLevel =
  | 'BEGINNER'
  | 'NOVICE'
  | 'INTERMEDIATE'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'MASTER';

export type PracticeSessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
export type PracticeSessionType = 'DELIBERATE' | 'POMODORO' | 'GUIDED' | 'ASSESSMENT' | 'CASUAL' | 'REVIEW';
export type PracticeFocusLevel = 'DEEP_FLOW' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';
export type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
export type GoalType = 'HOURS' | 'QUALITY_HOURS' | 'SESSIONS' | 'STREAK' | 'WEEKLY_HOURS';
export type MilestoneType =
  | 'FIRST_HOUR'
  | 'TEN_HOURS'
  | 'FIFTY_HOURS'
  | 'HUNDRED_HOURS'
  | 'FIVE_HUNDRED_HOURS'
  | 'THOUSAND_HOURS'
  | 'TWO_THOUSAND_HOURS'
  | 'FIVE_THOUSAND_HOURS'
  | 'TEN_THOUSAND_HOURS';

// ============================================================================
// SKILL MASTERY TYPES
// ============================================================================

export interface SkillInfo {
  id: string;
  name: string;
  category: string | null;
}

export interface SkillMastery {
  id: string;
  userId: string;
  skillId: string;
  skillName?: string;
  totalRawHours: number;
  totalQualityHours: number;
  totalSessions: number;
  avgQualityMultiplier: number;
  proficiencyLevel: ProficiencyLevel;
  currentStreak: number;
  longestStreak: number;
  lastPracticedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Enriched fields
  skill?: SkillInfo;
  progressTo10K?: number;
  nextMilestone?: number;
}

export interface MasteryOverview {
  totalQualityHours: number;
  totalRawHours: number;
  totalSessions: number;
  avgQualityMultiplier: number;
  topProficiencyLevel: ProficiencyLevel;
  totalSkillsTracked: number;
  skillsInProgress: number;
  skillsMastered: number;
}

export interface MilestoneProgress {
  hours: number;
  achieved: boolean;
  closestProgress: number;
  skillsAtOrAbove: number;
}

export interface ProficiencyDistribution {
  BEGINNER: number;
  NOVICE: number;
  INTERMEDIATE: number;
  COMPETENT: number;
  PROFICIENT: number;
  ADVANCED: number;
  EXPERT: number;
  MASTER: number;
}

export interface RecentActivity {
  last30Days: {
    rawHours: number;
    qualityHours: number;
    sessions: number;
    avgMultiplier: number;
  };
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastActive?: string | null;
}

export interface MasteryOverviewResponse {
  overview: MasteryOverview;
  topSkills: SkillMastery[];
  milestoneProgress: MilestoneProgress[];
  proficiencyDistribution: ProficiencyDistribution;
  recentActivity: RecentActivity;
  yearlyStats: YearlyStats;
  streaks: StreakInfo;
  lastPracticeAt: string | null;
  journeyStartDate: string | null;
}

// ============================================================================
// HEATMAP TYPES
// ============================================================================

export interface HeatmapDay {
  date: string;
  totalRawHours: number;
  totalQualityHours: number;
  totalSessions: number;
  avgMultiplier: number;
  intensity: number;
  color: string;
}

export interface YearlyStats {
  totalDays: number;
  activeDays: number;
  totalRawHours: number;
  totalQualityHours: number;
  totalSessions: number;
  avgDailyHours: number;
}

export interface WeeklyTrend {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalRawHours: number;
  totalQualityHours: number;
  totalSessions: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  totalRawHours: number;
  totalQualityHours: number;
  totalSessions: number;
}

export interface HeatmapMetadata {
  year: number;
  totalDays: number;
  activeDays: number;
  maxHoursInDay: number;
}

export interface HeatmapResponse {
  heatmap: HeatmapDay[];
  yearlyStats: YearlyStats;
  weeklyTrend: WeeklyTrend[];
  monthlyTrend: MonthlyTrend[];
  streaks: StreakInfo;
  metadata: HeatmapMetadata;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface PracticeSession {
  id: string;
  userId: string;
  skillId: string;
  skillName?: string;
  courseId?: string;
  courseName?: string;
  chapterId?: string;
  sectionId?: string;
  sessionType: PracticeSessionType;
  focusLevel: PracticeFocusLevel;
  bloomsLevel?: BloomsLevel;
  status: PracticeSessionStatus;
  startedAt: string;
  pausedAt?: string;
  endedAt?: string;
  rawHours: number;
  qualityHours: number;
  qualityMultiplier: number;
  totalPausedSeconds: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Enriched for active session
  currentElapsedSeconds?: number;
  currentElapsedMinutes?: number;
  currentElapsedHours?: number;
}

export interface SessionStats {
  totalSessions: number;
  totalRawHours: number;
  totalQualityHours: number;
  avgQualityMultiplier: number;
  avgSessionDuration: number;
  byType: Record<PracticeSessionType, number>;
  byFocus: Record<PracticeFocusLevel, number>;
}

export interface MultiplierInfo {
  sessionType: Record<PracticeSessionType, number>;
  focusLevel: Record<PracticeFocusLevel, number>;
  blooms: Record<BloomsLevel, number>;
}

export interface BloomsLevelInfo {
  level: BloomsLevel;
  multiplier: number;
  label: string;
  description: string;
  examples: string[];
  cognitiveEffort: string;
}

export interface SessionTypeInfo {
  type: PracticeSessionType;
  multiplier: number;
  label: string;
  description: string;
  bestFor: string;
}

export interface SessionsResponse {
  sessions: PracticeSession[];
  stats: SessionStats;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  multipliers: MultiplierInfo;
  bloomsLevelInfo: BloomsLevelInfo[];
  sessionTypeInfo: SessionTypeInfo[];
}

// ============================================================================
// MILESTONE TYPES
// ============================================================================

export interface Milestone {
  id: string;
  milestoneType: MilestoneType;
  achievedAt: string;
  qualityHoursAtAchievement: number;
  rewardClaimed: boolean;
  rewardClaimedAt: string | null;
  skillId: string;
  badgeName: string;
  xpReward: number;
  skill: SkillInfo;
}

export interface MilestoneStats {
  totalAchieved: number;
  unclaimed: number;
  byType: Array<{
    hours: number;
    type: MilestoneType;
    badgeName: string;
    xpReward: number;
    achieved: boolean;
    count: number;
  }>;
}

export interface MilestonesResponse {
  milestones: Milestone[];
  stats: MilestoneStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================================
// GOAL TYPES
// ============================================================================

export interface PracticeGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  skillId?: string;
  skillName?: string;
  deadline?: string;
  isCompleted: boolean;
  completedAt?: string;
  reminderEnabled: boolean;
  reminderFrequency: 'DAILY' | 'WEEKLY' | 'NONE';
  createdAt: string;
  updatedAt: string;
  // Enriched fields
  progressPercentage: number;
  remaining: number;
  isOverdue: boolean;
  daysUntilDeadline: number | null;
}

export interface GoalStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  completionRate: number;
  byType: Record<GoalType, number>;
}

export interface GoalsResponse {
  goals: PracticeGoal[];
  stats: GoalStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface QuickStatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface ProficiencyBadgeProps {
  level: ProficiencyLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export interface PracticeStreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  lastActive?: string | null;
  className?: string;
}

export interface PracticeJourneyOverviewProps {
  data: MasteryOverviewResponse | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export interface SkillMasteryCardProps {
  mastery: SkillMastery;
  onClick?: (skillId: string) => void;
  className?: string;
}

export interface SkillMasteryGridProps {
  masteries: SkillMastery[];
  isLoading?: boolean;
  onSkillClick?: (skillId: string) => void;
  className?: string;
}

export interface PracticeHeatmapProps {
  year?: number;
  onDayClick?: (day: HeatmapDay) => void;
  showStats?: boolean;
  compact?: boolean;
  className?: string;
}

export interface SessionStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (data: CreateSessionData) => Promise<void>;
  sessionTypeInfo: SessionTypeInfo[];
  bloomsLevelInfo: BloomsLevelInfo[];
  isLoading?: boolean;
}

export interface CreateSessionData {
  skillId: string;
  skillName?: string;
  courseId?: string;
  courseName?: string;
  sessionType: PracticeSessionType;
  focusLevel: PracticeFocusLevel;
  bloomsLevel?: BloomsLevel;
  notes?: string;
}

export interface ActiveSessionTrackerProps {
  session: PracticeSession | null;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onEnd: (inputs?: EndSessionInputs) => Promise<EndSessionResult | null>;
  isLoading?: boolean;
  className?: string;
}

export interface MilestoneTimelineProps {
  milestones: Milestone[];
  onClaim: (milestoneId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export interface PracticeGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGoalData) => Promise<void>;
  initialData?: Partial<PracticeGoal>;
  isLoading?: boolean;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  goalType: GoalType;
  targetValue: number;
  skillId?: string;
  skillName?: string;
  deadline?: string;
  reminderEnabled?: boolean;
  reminderFrequency?: 'DAILY' | 'WEEKLY' | 'NONE';
}

export interface PracticeGoalsListProps {
  goals: PracticeGoal[];
  onEdit?: (goal: PracticeGoal) => void;
  onDelete?: (goalId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// PROFICIENCY LEVEL CONFIGURATION
// ============================================================================

export const PROFICIENCY_CONFIG: Record<
  ProficiencyLevel,
  { label: string; color: string; bgColor: string; borderColor: string; hours: number }
> = {
  BEGINNER: {
    label: 'Beginner',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-600',
    hours: 0,
  },
  NOVICE: {
    label: 'Novice',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
    hours: 100,
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    hours: 500,
  },
  COMPETENT: {
    label: 'Competent',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-300 dark:border-purple-700',
    hours: 1000,
  },
  PROFICIENT: {
    label: 'Proficient',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    borderColor: 'border-indigo-300 dark:border-indigo-700',
    hours: 2000,
  },
  ADVANCED: {
    label: 'Advanced',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    hours: 5000,
  },
  EXPERT: {
    label: 'Expert',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
    hours: 7500,
  },
  MASTER: {
    label: 'Master',
    color: 'text-amber-600',
    bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
    borderColor: 'border-amber-400 dark:border-amber-600',
    hours: 10000,
  },
};

// ============================================================================
// HEATMAP INTENSITY LEVELS
// ============================================================================

export const HEATMAP_INTENSITY_LEVELS = {
  0: { color: 'bg-slate-100 dark:bg-slate-800', label: 'No activity' },
  1: { color: 'bg-emerald-200 dark:bg-emerald-900/50', label: 'Light' },
  2: { color: 'bg-emerald-400 dark:bg-emerald-700', label: 'Moderate' },
  3: { color: 'bg-emerald-500 dark:bg-emerald-600', label: 'Good' },
  4: { color: 'bg-emerald-600 dark:bg-emerald-500', label: 'High' },
} as const;

// ============================================================================
// MILESTONE CONFIGURATION
// ============================================================================

export const MILESTONE_CONFIG: Record<
  MilestoneType,
  { hours: number; badgeName: string; xpReward: number; emoji: string }
> = {
  FIRST_HOUR: { hours: 1, badgeName: 'First Step', xpReward: 50, emoji: '🎯' },
  TEN_HOURS: { hours: 10, badgeName: 'Getting Started', xpReward: 100, emoji: '🌱' },
  FIFTY_HOURS: { hours: 50, badgeName: 'Building Momentum', xpReward: 250, emoji: '🔥' },
  HUNDRED_HOURS: { hours: 100, badgeName: 'Century', xpReward: 500, emoji: '💯' },
  FIVE_HUNDRED_HOURS: { hours: 500, badgeName: 'Dedicated', xpReward: 1000, emoji: '⭐' },
  THOUSAND_HOURS: { hours: 1000, badgeName: 'Committed', xpReward: 2000, emoji: '🏆' },
  TWO_THOUSAND_HOURS: { hours: 2000, badgeName: 'Professional', xpReward: 3000, emoji: '💎' },
  FIVE_THOUSAND_HOURS: { hours: 5000, badgeName: 'Expert Path', xpReward: 5000, emoji: '🚀' },
  TEN_THOUSAND_HOURS: { hours: 10000, badgeName: 'Master', xpReward: 10000, emoji: '👑' },
};
