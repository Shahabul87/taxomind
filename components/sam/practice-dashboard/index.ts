/**
 * 10,000 Hour Practice Dashboard Components
 *
 * A comprehensive practice tracking dashboard with:
 * - Journey progress overview with circular progress ring
 * - Skill mastery cards showing 10K progress
 * - GitHub-style practice activity heatmap
 * - Real-time session tracking with timer
 * - Milestone timeline with rewards
 * - Goal setting and progress tracking
 */

// Types (explicit exports for tree-shaking)
export type {
  // Core types used by PracticeClient
  CreateSessionData,
  CreateGoalData,
  PracticeGoal,
  SkillMastery,
  EndSessionInputs,
  EndSessionResult,
  // Session/mastery types used by hooks
  PracticeSession,
  PracticeSessionStatus,
  PracticeSessionType,
  PracticeFocusLevel,
  BloomsLevel,
  ProficiencyLevel,
  GoalType,
  MilestoneType,
  // Response types
  MasteryOverviewResponse,
  HeatmapResponse,
  SessionsResponse,
  MilestonesResponse,
  GoalsResponse,
  // Component prop types
  SessionStartDialogProps,
  ActiveSessionTrackerProps,
  MilestoneTimelineProps,
  PracticeGoalFormProps,
  PracticeGoalsListProps,
  PracticeJourneyOverviewProps,
  SkillMasteryGridProps,
  PracticeHeatmapProps,
  PracticeStreakWidgetProps,
  ProficiencyBadgeProps,
  QuickStatCardProps,
  SkillMasteryCardProps,
  // Sub-types
  SessionTypeInfo,
  BloomsLevelInfo,
  MultiplierInfo,
  SessionStats,
  HeatmapDay,
  YearlyStats,
  WeeklyTrend,
  MonthlyTrend,
  Milestone,
  MilestoneStats,
  GoalStats,
  MasteryOverview,
  StreakInfo,
  SkillInfo,
  QualityScoreResult,
  ValidationResult,
  FocusDriftResult,
  DecayResult,
  QualityBreakdown,
  FatigueIndicator,
  // Enum-like types
  EvidenceType,
  ProjectOutcome,
  QualityLevel,
  ValidationFlag,
  DriftDirection,
  DriftSeverity,
  ReviewUrgency,
  ProficiencyDistribution,
  RecentActivity,
  MilestoneProgress,
  HeatmapMetadata,
} from './types';

// Config constants
export { PROFICIENCY_CONFIG, HEATMAP_INTENSITY_LEVELS, MILESTONE_CONFIG } from './types';

// Basic Components
export { QuickStatCard } from './QuickStatCard';
export { ProficiencyBadge } from './ProficiencyBadge';
export { PracticeStreakWidget } from './PracticeStreakWidget';

// Overview Tab
export { PracticeJourneyOverview } from './PracticeJourneyOverview';

// Mastery Tab
export { SkillMasteryCard } from './SkillMasteryCard';
export { SkillMasteryGrid } from './SkillMasteryGrid';

// Activity Tab (Heatmap)
export { PracticeHeatmap } from './PracticeHeatmap';

// Session Tab
export { SessionStartDialog } from './SessionStartDialog';
export { ActiveSessionTracker } from './ActiveSessionTracker';

// Milestones Tab
export { MilestoneTimeline } from './MilestoneTimeline';

// Goals Tab
export { PracticeGoalForm } from './PracticeGoalForm';
export { PracticeGoalsList } from './PracticeGoalsList';
