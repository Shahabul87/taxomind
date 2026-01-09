/**
 * @sam-ai/agentic - Proactive Intervention Module
 * Mentor workflows, check-ins, and behavior monitoring
 */

// Types - selectively export to avoid conflicts with goal-planning and mentor-tools
export type {
  // Learning Plan Types
  LearningPlanInput,
  PlanConstraint,
  LearningPlan,
  WeeklyMilestone,
  DailyTarget,
  PlannedActivity,
  ActivityResource,
  DifficultyAdjustment,
  PaceAdjustment,
  WeeklyBreakdown,
  DailyPractice,
  DailyActivity,
  ReviewItem,
  StreakInfo,
  ProgressUpdate,
  PlanRecommendation,
  // Check-In Types
  ScheduledCheckIn,
  TriggerCondition,
  CheckInQuestion,
  SuggestedAction,
  TriggeredCheckIn,
  CheckInResult,
  CheckInResponse,
  QuestionAnswer,
  // Behavior Types
  BehaviorEvent,
  PageContext,
  EmotionalSignal,
  BehaviorPattern,
  PatternContext,
  BehaviorAnomaly,
  ChurnPrediction,
  ChurnFactor,
  StrugglePrediction,
  StruggleArea,
  SupportRecommendation,
  Intervention,
  InterventionTiming,
  InterventionResult,
  InterventionCheckResult,
  // Store Interfaces
  LearningPlanStore,
  CheckInStore,
  BehaviorEventStore,
  EventQueryOptions,
  PatternStore,
  InterventionStore,
  ProactiveLogger,
} from './types';

// Export renamed types to avoid conflicts
export {
  LearningPlanStatus,
  LearningPlanStatus as ProactivePlanStatus,
  PlanStatus,
} from './types';

// Export constants
export {
  MilestoneStatus,
  ActivityType,
  ActivityStatus,
  AdjustmentTrigger,
  CheckInStatus,
  CheckInType,
  NotificationChannel,
  TriggerType,
  QuestionType,
  ActionType,
  BehaviorEventType,
  EmotionalSignalType,
  PatternType,
  AnomalyType,
  InterventionType,
} from './types';

// Export Zod schemas
export {
  LearningPlanInputSchema,
  ProgressUpdateSchema,
  CheckInResponseSchema,
  BehaviorEventSchema,
} from './types';

// Re-export ProgressReport and PlanFeedback with aliases to avoid conflicts
export type { ProgressReport as LearningProgressReport, PlanFeedback as LearningPlanFeedback } from './types';

// Multi-Session Plan Tracker
export {
  MultiSessionPlanTracker,
  createMultiSessionPlanTracker,
  InMemoryLearningPlanStore,
  type MultiSessionPlanTrackerConfig,
} from './multi-session-plan-tracker';

// Check-In Scheduler
export {
  CheckInScheduler,
  createCheckInScheduler,
  InMemoryCheckInStore,
  TriggerEvaluator,
  type CheckInSchedulerConfig,
  type UserContext,
} from './check-in-scheduler';

// Behavior Monitor
export {
  BehaviorMonitor,
  createBehaviorMonitor,
  InMemoryBehaviorEventStore,
  InMemoryPatternStore,
  InMemoryInterventionStore,
  type BehaviorMonitorConfig,
} from './behavior-monitor';
