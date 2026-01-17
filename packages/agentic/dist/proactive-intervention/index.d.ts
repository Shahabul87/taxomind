/**
 * @sam-ai/agentic - Proactive Intervention Module
 * Mentor workflows, check-ins, and behavior monitoring
 */
export type { LearningPlanInput, PlanConstraint, LearningPlan, WeeklyMilestone, DailyTarget, PlannedActivity, ActivityResource, DifficultyAdjustment, PaceAdjustment, WeeklyBreakdown, DailyPractice, DailyActivity, ReviewItem, StreakInfo, ProgressUpdate, PlanRecommendation, ScheduledCheckIn, TriggerCondition, CheckInQuestion, SuggestedAction, TriggeredCheckIn, CheckInResult, CheckInResponse, QuestionAnswer, BehaviorEvent, PageContext, EmotionalSignal, BehaviorPattern, PatternContext, BehaviorAnomaly, ChurnPrediction, ChurnFactor, StrugglePrediction, StruggleArea, SupportRecommendation, Intervention, InterventionTiming, InterventionResult, InterventionCheckResult, LearningPlanStore, CheckInStore, BehaviorEventStore, EventQueryOptions, PatternStore, InterventionStore, ProactiveLogger, } from './types';
export { LearningPlanStatus, LearningPlanStatus as ProactivePlanStatus, PlanStatus, } from './types';
export { MilestoneStatus, ActivityType, ActivityStatus, AdjustmentTrigger, CheckInStatus, CheckInType, NotificationChannel, TriggerType, QuestionType, ActionType, BehaviorEventType, EmotionalSignalType, PatternType, AnomalyType, InterventionType, } from './types';
export { LearningPlanInputSchema, ProgressUpdateSchema, CheckInResponseSchema, BehaviorEventSchema, } from './types';
export type { ProgressReport as LearningProgressReport, PlanFeedback as LearningPlanFeedback } from './types';
export { MultiSessionPlanTracker, createMultiSessionPlanTracker, InMemoryLearningPlanStore, type MultiSessionPlanTrackerConfig, } from './multi-session-plan-tracker';
export { CheckInScheduler, createCheckInScheduler, InMemoryCheckInStore, TriggerEvaluator, type CheckInSchedulerConfig, type UserContext, } from './check-in-scheduler';
export { BehaviorMonitor, createBehaviorMonitor, InMemoryBehaviorEventStore, InMemoryPatternStore, InMemoryInterventionStore, type BehaviorMonitorConfig, } from './behavior-monitor';
//# sourceMappingURL=index.d.ts.map