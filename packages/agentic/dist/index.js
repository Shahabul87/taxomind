"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ActionType: () => ActionType,
  ActiveStepExecutor: () => ActiveStepExecutor,
  ActivityStatus: () => ActivityStatus,
  ActivityType: () => ActivityType,
  AdjustmentTrigger: () => AdjustmentTrigger,
  AgentStateMachine: () => AgentStateMachine,
  AgenticMetricsCollector: () => AgenticMetricsCollector,
  AlertSeverity: () => AlertSeverity,
  AnomalyType: () => AnomalyType,
  AssessmentSource: () => AssessmentSource,
  AuditLogLevel: () => AuditLogLevel,
  AuditLogger: () => AuditLogger,
  BackgroundWorker: () => BackgroundWorker,
  BaseJobSchema: () => BaseJobSchema,
  BehaviorEventSchema: () => BehaviorEventSchema,
  BehaviorEventType: () => BehaviorEventType,
  BehaviorMonitor: () => BehaviorMonitor,
  BrowserPushChannel: () => BrowserPushChannel,
  CAPABILITIES: () => CAPABILITIES,
  CelebrationType: () => CelebrationType,
  ChangeType: () => ChangeType,
  CheckInResponseSchema: () => CheckInResponseSchema,
  CheckInScheduler: () => CheckInScheduler,
  CheckInStatus: () => CheckInStatus,
  CheckInType: () => CheckInType,
  ClientWebSocketManager: () => ClientWebSocketManager,
  ComplexityLevel: () => ComplexityLevel,
  ConfidenceCalibrationTracker: () => ConfidenceCalibrationTracker,
  ConfidenceFactorType: () => ConfidenceFactorType,
  ConfidenceInputSchema: () => ConfidenceInputSchema,
  ConfidenceLevel: () => ConfidenceLevel,
  ConfidenceScorer: () => ConfidenceScorer,
  ConfirmationGate: () => ConfirmationGate,
  ConfirmationManager: () => ConfirmationManager,
  ConfirmationType: () => ConfirmationType,
  ConfirmationTypeSchema: () => ConfirmationTypeSchema,
  ConnectionConfigSchema: () => ConnectionConfigSchema,
  ConnectionState: () => ConnectionState,
  ContentChangeEventSchema: () => ContentChangeEventSchema,
  ContentEntityType: () => ContentEntityType,
  ContentGenerationRequestSchema: () => ContentGenerationRequestSchema,
  ContentRecommendationRequestSchema: () => ContentRecommendationRequestSchema,
  ContentType: () => ContentType,
  ContextAction: () => ContextAction,
  CreateGoalInputSchema: () => CreateGoalInputSchema,
  CrossSessionContext: () => CrossSessionContext,
  DEFAULT_CALIBRATION_CONFIG: () => DEFAULT_CALIBRATION_CONFIG,
  DEFAULT_CONNECTION_CONFIG: () => DEFAULT_CONNECTION_CONFIG,
  DEFAULT_DISPLAY_CONFIGS: () => DEFAULT_DISPLAY_CONFIGS,
  DEFAULT_MEMORY_QUALITY_CONFIG: () => DEFAULT_MEMORY_QUALITY_CONFIG,
  DEFAULT_METRICS_COLLECTOR_CONFIG: () => DEFAULT_METRICS_COLLECTOR_CONFIG,
  DEFAULT_NORMALIZER_CONFIG: () => DEFAULT_NORMALIZER_CONFIG,
  DEFAULT_PRESENCE_CONFIG: () => DEFAULT_PRESENCE_CONFIG,
  DEFAULT_PUSH_DISPATCHER_CONFIG: () => DEFAULT_PUSH_DISPATCHER_CONFIG,
  DEFAULT_QUEUE_CONFIG: () => DEFAULT_QUEUE_CONFIG,
  DEFAULT_ROLE_PERMISSIONS: () => DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_SURFACE_MANAGER_CONFIG: () => DEFAULT_SURFACE_MANAGER_CONFIG,
  DEFAULT_TOOL_TELEMETRY_CONFIG: () => DEFAULT_TOOL_TELEMETRY_CONFIG,
  DEFAULT_WORKER_CONFIG: () => DEFAULT_WORKER_CONFIG,
  DecompositionOptionsSchema: () => DecompositionOptionsSchema,
  DeliveryChannel: () => DeliveryChannel,
  DeliveryPriority: () => DeliveryPriority,
  EmailChannel: () => EmailChannel,
  EmbeddingSourceType: () => EmbeddingSourceType,
  EmotionalSignalType: () => EmotionalSignalType,
  EmotionalState: () => EmotionalState,
  EntityType: () => EntityType,
  FactCheckStatus: () => FactCheckStatus,
  GoalContextSchema: () => GoalContextSchema,
  GoalDecomposer: () => GoalDecomposer,
  GoalPriority: () => GoalPriority,
  GoalPrioritySchema: () => GoalPrioritySchema,
  GoalStatus: () => GoalStatus,
  GoalStatusSchema: () => GoalStatusSchema,
  GraphQueryOptionsSchema: () => GraphQueryOptionsSchema,
  HealthStatus: () => HealthStatus,
  InMemoryAuditStore: () => InMemoryAuditStore,
  InMemoryBehaviorEventStore: () => InMemoryBehaviorEventStore,
  InMemoryCalibrationStore: () => InMemoryCalibrationStore,
  InMemoryCheckInStore: () => InMemoryCheckInStore,
  InMemoryConfidencePredictionStore: () => InMemoryConfidencePredictionStore,
  InMemoryConfidenceScoreStore: () => InMemoryConfidenceScoreStore,
  InMemoryConfirmationStore: () => InMemoryConfirmationStore,
  InMemoryContentStore: () => InMemoryContentStore,
  InMemoryContextStore: () => InMemoryContextStore,
  InMemoryGraphStore: () => InMemoryGraphStore,
  InMemoryInterventionStore: () => InMemoryInterventionStore,
  InMemoryInvocationStore: () => InMemoryInvocationStore,
  InMemoryJobQueue: () => InMemoryJobQueue,
  InMemoryLearningGapStore: () => InMemoryLearningGapStore,
  InMemoryLearningPlanStore: () => InMemoryLearningPlanStore,
  InMemoryLearningSessionStore: () => InMemoryLearningSessionStore,
  InMemoryMemoryRetrievalStore: () => InMemoryMemoryRetrievalStore,
  InMemoryOrchestrationConfirmationStore: () => InMemoryOrchestrationConfirmationStore,
  InMemoryPatternStore: () => InMemoryPatternStore,
  InMemoryPermissionStore: () => InMemoryPermissionStore,
  InMemoryPlanLifecycleStore: () => InMemoryPlanLifecycleStore,
  InMemoryPresenceStore: () => InMemoryPresenceStore,
  InMemoryProactiveEventStore: () => InMemoryProactiveEventStore,
  InMemoryPushQueueStore: () => InMemoryPushQueueStore,
  InMemoryQualityRecordStore: () => InMemoryQualityRecordStore,
  InMemoryRecommendationStore: () => InMemoryRecommendationStore,
  InMemoryReindexJobStore: () => InMemoryReindexJobStore,
  InMemorySkillAssessmentStore: () => InMemorySkillAssessmentStore,
  InMemoryTimelineStore: () => InMemoryTimelineStore,
  InMemoryToolExecutionStore: () => InMemoryToolExecutionStore,
  InMemoryToolStore: () => InMemoryToolStore,
  InMemoryTopicProgressStore: () => InMemoryTopicProgressStore,
  InMemoryTutoringSessionStore: () => InMemoryTutoringSessionStore,
  InMemoryVectorAdapter: () => InMemoryVectorAdapter,
  InMemoryVerificationResultStore: () => InMemoryVerificationResultStore,
  InterventionSurface: () => InterventionSurface,
  InterventionSurfaceManagerImpl: () => InterventionSurfaceManagerImpl,
  InterventionType: () => InterventionType,
  InvokeToolInputSchema: () => InvokeToolInputSchema,
  IssueSeverity: () => IssueSeverity,
  IssueType: () => IssueType,
  JobEvent: () => JobEvent,
  JobQueueConfigSchema: () => JobQueueConfigSchema,
  JobStatus: () => JobStatus,
  JobType: () => JobType,
  JourneyEventType: () => JourneyEventType,
  JourneyTimelineManager: () => JourneyTimelineManager,
  KGRefreshJobStatus: () => KGRefreshJobStatus,
  KGRefreshJobType: () => KGRefreshJobType,
  KGRefreshScheduler: () => KGRefreshScheduler,
  KnowledgeGraphManager: () => KnowledgeGraphManager,
  LearningPathRecommender: () => LearningPathRecommender,
  LearningPhase: () => LearningPhase,
  LearningPlanInputSchema: () => LearningPlanInputSchema,
  LearningPlanStatus: () => LearningPlanStatus,
  LearningSessionInputSchema: () => LearningSessionInputSchema,
  LearningStyle: () => LearningStyle,
  MEMORY_CAPABILITIES: () => MEMORY_CAPABILITIES,
  MasteryLevel: () => MasteryLevel2,
  MasteryLevelSchema: () => MasteryLevelSchema,
  MemoryItemType: () => MemoryItemType,
  MemoryLifecycleConfigSchema: () => MemoryLifecycleConfigSchema,
  MemoryLifecycleManager: () => MemoryLifecycleManager,
  MemoryNormalizer: () => MemoryNormalizer,
  MemoryNormalizerConfigSchema: () => MemoryNormalizerConfigSchema,
  MemoryQualityTracker: () => MemoryQualityTracker,
  MemoryRetriever: () => MemoryRetriever,
  MemorySegmentType: () => MemorySegmentType,
  MemorySourceType: () => MemorySourceType,
  MemoryType: () => MemoryType,
  MetricSource: () => MetricSource,
  MilestoneStatus: () => MilestoneStatus,
  MilestoneType: () => MilestoneType,
  MockEmbeddingProvider: () => MockEmbeddingProvider,
  MultiSessionPlanTracker: () => MultiSessionPlanTracker,
  NormalizationRetrievalStrategy: () => NormalizationRetrievalStrategy,
  NormalizedMemoryContextSchema: () => NormalizedMemoryContextSchema,
  NotificationChannel: () => NotificationChannel,
  NotificationRequestSchema: () => NotificationRequestSchema,
  NudgeType: () => NudgeType,
  PACKAGE_NAME: () => PACKAGE_NAME,
  PACKAGE_VERSION: () => PACKAGE_VERSION,
  PatternType: () => PatternType,
  PermissionLevel: () => PermissionLevel,
  PermissionLevelSchema: () => PermissionLevelSchema,
  PermissionManager: () => PermissionManager,
  PlanBuilder: () => PlanBuilder,
  PlanContextInjector: () => PlanContextInjector,
  PlanEventType: () => PlanEventType,
  PlanStatus: () => PlanStatus,
  PlanStatusSchema: () => PlanStatusSchema,
  PresenceChangeReason: () => PresenceChangeReason,
  PresenceStatus: () => PresenceStatus,
  PresenceTracker: () => PresenceTracker,
  ProactiveEventType: () => ProactiveEventType,
  ProactivePlanStatus: () => LearningPlanStatus,
  ProactivePushDispatcher: () => ProactivePushDispatcher,
  ProgressAnalyzer: () => ProgressAnalyzer,
  ProgressReportRequestSchema: () => ProgressReportRequestSchema,
  ProgressUpdateSchema: () => ProgressUpdateSchema,
  PushDeliveryRequestSchema: () => PushDeliveryRequestSchema,
  QualityMetricType: () => QualityMetricType,
  QualityTracker: () => QualityTracker,
  QuestionType: () => QuestionType,
  RailwayMetricsExporter: () => RailwayMetricsExporter,
  RateLimitSchema: () => RateLimitSchema,
  RecommendationEngine: () => RecommendationEngine,
  RecommendationFeedbackSchema: () => RecommendationFeedbackSchema,
  RecommendationPriority: () => RecommendationPriority,
  RecommendationReason: () => RecommendationReason,
  RegisterToolInputSchema: () => RegisterToolInputSchema,
  ReindexJobStatus: () => ReindexJobStatus,
  ReindexJobType: () => ReindexJobType,
  ReindexPriority: () => ReindexPriority,
  RelationshipType: () => RelationshipType,
  ReminderRequestSchema: () => ReminderRequestSchema,
  ResponseType: () => ResponseType,
  ResponseVerifier: () => ResponseVerifier,
  RetrievalQuerySchema: () => RetrievalQuerySchema,
  RetrievalStrategy: () => RetrievalStrategy,
  SAMEventType: () => SAMEventType,
  SAMWebSocketEventSchema: () => SAMWebSocketEventSchema,
  ServerConnectionManager: () => ServerConnectionManager,
  SkillAssessmentInputSchema: () => SkillAssessmentInputSchema,
  SkillAssessor: () => SkillAssessor,
  SkillTracker: () => SkillTracker,
  SourceType: () => SourceType,
  StepExecutor: () => StepExecutor,
  StepStatus: () => StepStatus,
  StepStatusSchema: () => StepStatusSchema,
  StepType: () => StepType,
  StudentFeedbackSchema: () => StudentFeedbackSchema,
  StudySessionRequestSchema: () => StudySessionRequestSchema,
  SubGoalType: () => SubGoalType,
  SubGoalTypeSchema: () => SubGoalTypeSchema,
  TelemetryMemorySource: () => MemorySource,
  TelemetryResponseType: () => ResponseType4,
  TelemetryToolExecutionStatus: () => ToolExecutionStatus2,
  TimePeriod: () => TimePeriod,
  ToolCategory: () => ToolCategory,
  ToolCategorySchema: () => ToolCategorySchema,
  ToolExampleSchema: () => ToolExampleSchema,
  ToolExecutionStatus: () => ToolExecutionStatus,
  ToolExecutionStatusSchema: () => ToolExecutionStatusSchema,
  ToolExecutor: () => ToolExecutor,
  ToolRegistry: () => ToolRegistry,
  ToolTelemetry: () => ToolTelemetry,
  TrendDirection: () => TrendDirection,
  TriggerEvaluator: () => TriggerEvaluator,
  TriggerType: () => TriggerType,
  TutoringLoopController: () => TutoringLoopController,
  UpdateGoalInputSchema: () => UpdateGoalInputSchema,
  UserRole: () => UserRole,
  VectorSearchOptionsSchema: () => VectorSearchOptionsSchema,
  VectorStore: () => VectorStore,
  VerificationInputSchema: () => VerificationInputSchema,
  VerificationMethod: () => VerificationMethod,
  VerificationStatus: () => VerificationStatus,
  WorkerConfigSchema: () => WorkerConfigSchema,
  WorkerStatus: () => WorkerStatus,
  cosineSimilarity: () => cosineSimilarity,
  createActiveStepExecutor: () => createActiveStepExecutor,
  createAgentStateMachine: () => createAgentStateMachine,
  createAgenticMetricsCollector: () => createAgenticMetricsCollector,
  createAuditLogger: () => createAuditLogger,
  createBackgroundWorker: () => createBackgroundWorker,
  createBehaviorMonitor: () => createBehaviorMonitor,
  createBrowserPushChannel: () => createBrowserPushChannel,
  createCheckInScheduler: () => createCheckInScheduler,
  createClientWebSocketManager: () => createClientWebSocketManager,
  createConfidenceCalibrationTracker: () => createConfidenceCalibrationTracker,
  createConfidenceScorer: () => createConfidenceScorer,
  createConfirmationGate: () => createConfirmationGate,
  createConfirmationManager: () => createConfirmationManager,
  createContentTools: () => createContentTools,
  createCrossSessionContext: () => createCrossSessionContext,
  createEmailChannel: () => createEmailChannel,
  createGoalDecomposer: () => createGoalDecomposer,
  createInMemoryConfidencePredictionStore: () => createInMemoryConfidencePredictionStore,
  createInMemoryMemoryRetrievalStore: () => createInMemoryMemoryRetrievalStore,
  createInMemoryOrchestrationConfirmationStore: () => createInMemoryOrchestrationConfirmationStore,
  createInMemoryOrchestrationStores: () => createInMemoryOrchestrationStores,
  createInMemoryPlanLifecycleStore: () => createInMemoryPlanLifecycleStore,
  createInMemoryPresenceStore: () => createInMemoryPresenceStore,
  createInMemoryProactiveEventStore: () => createInMemoryProactiveEventStore,
  createInMemoryPushQueueStore: () => createInMemoryPushQueueStore,
  createInMemorySessionStore: () => createInMemorySessionStore,
  createInMemoryStores: () => createInMemoryStores,
  createInMemoryToolExecutionStore: () => createInMemoryToolExecutionStore,
  createInterventionSurfaceManager: () => createInterventionSurfaceManager,
  createJobQueue: () => createJobQueue,
  createJourneyTimeline: () => createJourneyTimeline,
  createKGRefreshScheduler: () => createKGRefreshScheduler,
  createKnowledgeGraphManager: () => createKnowledgeGraphManager,
  createMemoryLifecycleManager: () => createMemoryLifecycleManager,
  createMemoryNormalizer: () => createMemoryNormalizer,
  createMemoryQualityTracker: () => createMemoryQualityTracker,
  createMemoryRetriever: () => createMemoryRetriever,
  createMemorySystem: () => createMemorySystem,
  createMentorTools: () => createMentorTools,
  createMultiSessionPlanTracker: () => createMultiSessionPlanTracker,
  createNotificationTools: () => createNotificationTools,
  createPathRecommender: () => createPathRecommender,
  createPermissionManager: () => createPermissionManager,
  createPlanBuilder: () => createPlanBuilder,
  createPlanContextInjector: () => createPlanContextInjector,
  createPresenceTracker: () => createPresenceTracker,
  createPrismaAuditStore: () => createPrismaAuditStore,
  createPrismaConfirmationStore: () => createPrismaConfirmationStore,
  createPrismaInvocationStore: () => createPrismaInvocationStore,
  createPrismaPermissionStore: () => createPrismaPermissionStore,
  createPrismaToolStore: () => createPrismaToolStore,
  createProgressAnalyzer: () => createProgressAnalyzer,
  createPushDispatcher: () => createPushDispatcher,
  createQualityTracker: () => createQualityTracker,
  createRailwayExporter: () => createRailwayExporter,
  createRecommendationEngine: () => createRecommendationEngine,
  createResponseVerifier: () => createResponseVerifier,
  createSchedulingTools: () => createSchedulingTools,
  createServerConnectionManager: () => createServerConnectionManager,
  createSkillAssessor: () => createSkillAssessor,
  createSkillTracker: () => createSkillTracker,
  createStepExecutor: () => createStepExecutor,
  createStepExecutorFunction: () => createStepExecutorFunction,
  createToolExecutor: () => createToolExecutor,
  createToolRegistry: () => createToolRegistry,
  createToolTelemetry: () => createToolTelemetry,
  createTutoringLoopController: () => createTutoringLoopController,
  createVectorStore: () => createVectorStore,
  euclideanDistance: () => euclideanDistance,
  getMentorToolById: () => getMentorToolById,
  getMentorToolsByCategory: () => getMentorToolsByCategory,
  getMentorToolsByTags: () => getMentorToolsByTags,
  getRailwayExporter: () => getRailwayExporter,
  hasCapability: () => hasCapability,
  logConfidencePrediction: () => logConfidencePrediction,
  logMemoryRetrieval: () => logMemoryRetrieval,
  logMetric: () => logMetric,
  logPlanLifecycleEvent: () => logPlanLifecycleEvent,
  logToolExecution: () => logToolExecution
});
module.exports = __toCommonJS(index_exports);

// src/goal-planning/types.ts
var import_zod = require("zod");
var GoalPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
};
var GoalStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  ABANDONED: "abandoned"
};
var SubGoalType = {
  LEARN: "learn",
  PRACTICE: "practice",
  ASSESS: "assess",
  REVIEW: "review",
  REFLECT: "reflect",
  CREATE: "create"
};
var PlanStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
};
var StepStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
  BLOCKED: "blocked"
};
var StepType = {
  READ_CONTENT: "read_content",
  WATCH_VIDEO: "watch_video",
  COMPLETE_EXERCISE: "complete_exercise",
  TAKE_QUIZ: "take_quiz",
  REFLECT: "reflect",
  PRACTICE_PROBLEM: "practice_problem",
  SOCRATIC_DIALOGUE: "socratic_dialogue",
  SPACED_REVIEW: "spaced_review",
  CREATE_SUMMARY: "create_summary",
  PEER_DISCUSSION: "peer_discussion",
  PROJECT_WORK: "project_work",
  RESEARCH: "research"
};
var GoalPrioritySchema = import_zod.z.enum(["low", "medium", "high", "critical"]);
var GoalStatusSchema = import_zod.z.enum(["draft", "active", "paused", "completed", "abandoned"]);
var SubGoalTypeSchema = import_zod.z.enum(["learn", "practice", "assess", "review", "reflect", "create"]);
var PlanStatusSchema = import_zod.z.enum(["draft", "active", "paused", "completed", "failed", "cancelled"]);
var StepStatusSchema = import_zod.z.enum(["pending", "in_progress", "completed", "failed", "skipped", "blocked"]);
var MasteryLevelSchema = import_zod.z.enum(["novice", "beginner", "intermediate", "advanced", "expert"]);
var GoalContextSchema = import_zod.z.object({
  courseId: import_zod.z.string().optional(),
  chapterId: import_zod.z.string().optional(),
  sectionId: import_zod.z.string().optional(),
  topicIds: import_zod.z.array(import_zod.z.string()).optional(),
  skillIds: import_zod.z.array(import_zod.z.string()).optional()
});
var CreateGoalInputSchema = import_zod.z.object({
  userId: import_zod.z.string().min(1),
  title: import_zod.z.string().min(1).max(500),
  description: import_zod.z.string().max(2e3).optional(),
  targetDate: import_zod.z.date().optional(),
  priority: GoalPrioritySchema.optional().default("medium"),
  context: GoalContextSchema.partial().optional(),
  currentMastery: MasteryLevelSchema.optional(),
  targetMastery: MasteryLevelSchema.optional(),
  tags: import_zod.z.array(import_zod.z.string()).optional()
});
var UpdateGoalInputSchema = import_zod.z.object({
  title: import_zod.z.string().min(1).max(500).optional(),
  description: import_zod.z.string().max(2e3).optional(),
  targetDate: import_zod.z.date().optional(),
  priority: GoalPrioritySchema.optional(),
  status: GoalStatusSchema.optional(),
  context: GoalContextSchema.partial().optional(),
  targetMastery: MasteryLevelSchema.optional(),
  tags: import_zod.z.array(import_zod.z.string()).optional()
});
var DecompositionOptionsSchema = import_zod.z.object({
  maxSubGoals: import_zod.z.number().int().min(1).max(20).optional().default(10),
  minSubGoals: import_zod.z.number().int().min(1).max(10).optional().default(2),
  includeAssessments: import_zod.z.boolean().optional().default(true),
  includeReviews: import_zod.z.boolean().optional().default(true),
  preferredLearningStyle: import_zod.z.string().optional(),
  availableTimePerDay: import_zod.z.number().int().min(5).max(480).optional(),
  targetCompletionDate: import_zod.z.date().optional()
});

// src/goal-planning/goal-decomposer.ts
var import_zod2 = require("zod");
var DEFAULT_OPTIONS = {
  maxSubGoals: 10,
  minSubGoals: 2,
  includeAssessments: true,
  includeReviews: true
};
var SubGoalAISchema = import_zod2.z.object({
  title: import_zod2.z.string(),
  description: import_zod2.z.string().optional(),
  type: import_zod2.z.enum(["learn", "practice", "assess", "review", "reflect", "create"]),
  estimatedMinutes: import_zod2.z.number().int().min(5).max(240),
  difficulty: import_zod2.z.enum(["easy", "medium", "hard"]),
  prerequisites: import_zod2.z.array(import_zod2.z.number().int()).default([]),
  // indices of prerequisite sub-goals
  successCriteria: import_zod2.z.array(import_zod2.z.string()).default([])
});
var DecompositionAIResponseSchema = import_zod2.z.object({
  subGoals: import_zod2.z.array(SubGoalAISchema).min(1).max(20),
  overallDifficulty: import_zod2.z.enum(["easy", "medium", "hard"]),
  reasoning: import_zod2.z.string().optional()
});
var GoalDecomposer = class {
  ai;
  logger;
  defaultOptions;
  constructor(config) {
    this.ai = config.aiAdapter;
    this.logger = config.logger ?? console;
    this.defaultOptions = { ...DEFAULT_OPTIONS, ...config.defaultOptions };
  }
  /**
   * Decompose a learning goal into sub-goals
   */
  async decompose(goal, options) {
    const startTime = Date.now();
    const mergedOptions = this.mergeOptions(options);
    this.logger.debug?.(`[GoalDecomposer] Decomposing goal: ${goal.title}`);
    try {
      const aiResponse = await this.generateDecomposition(goal, mergedOptions);
      const subGoals = this.convertToSubGoals(goal.id, aiResponse.subGoals);
      const dependencies = this.buildDependencyGraph(subGoals, aiResponse.subGoals);
      const estimatedDuration = subGoals.reduce((sum, sg) => sum + sg.estimatedMinutes, 0);
      const confidence = this.calculateConfidence(goal, subGoals, mergedOptions);
      const decomposition = {
        goalId: goal.id,
        subGoals,
        dependencies,
        estimatedDuration,
        difficulty: aiResponse.overallDifficulty,
        confidence
      };
      this.logger.debug?.(
        `[GoalDecomposer] Decomposed into ${subGoals.length} sub-goals in ${Date.now() - startTime}ms`
      );
      return decomposition;
    } catch (error) {
      this.logger.error?.(`[GoalDecomposer] Decomposition failed: ${error.message}`);
      throw error;
    }
  }
  /**
   * Validate a decomposition for logical consistency
   */
  validateDecomposition(decomposition) {
    const issues = [];
    const circularDeps = this.findCircularDependencies(decomposition.dependencies);
    if (circularDeps.length > 0) {
      issues.push({
        type: "error",
        code: "CIRCULAR_DEPENDENCY",
        message: `Circular dependencies detected: ${circularDeps.join(" -> ")}`
      });
    }
    const orphans = this.findOrphanedSubGoals(decomposition);
    if (orphans.length > 0) {
      issues.push({
        type: "warning",
        code: "ORPHANED_SUBGOALS",
        message: `Sub-goals with missing prerequisites: ${orphans.join(", ")}`
      });
    }
    const timeIssues = this.validateTimeDistribution(decomposition);
    issues.push(...timeIssues);
    const typeIssues = this.validateTypeDistribution(decomposition);
    issues.push(...typeIssues);
    return {
      valid: issues.filter((i) => i.type === "error").length === 0,
      issues
    };
  }
  /**
   * Estimate effort for a goal
   */
  async estimateEffort(goal, decomposition) {
    const decomp = decomposition ?? await this.decompose(goal);
    const breakdown = {
      learning: 0,
      practice: 0,
      assessment: 0,
      review: 0,
      buffer: 0
    };
    for (const subGoal of decomp.subGoals) {
      switch (subGoal.type) {
        case SubGoalType.LEARN:
          breakdown.learning += subGoal.estimatedMinutes;
          break;
        case SubGoalType.PRACTICE:
        case SubGoalType.CREATE:
          breakdown.practice += subGoal.estimatedMinutes;
          break;
        case SubGoalType.ASSESS:
          breakdown.assessment += subGoal.estimatedMinutes;
          break;
        case SubGoalType.REVIEW:
        case SubGoalType.REFLECT:
          breakdown.review += subGoal.estimatedMinutes;
          break;
      }
    }
    const subtotal = breakdown.learning + breakdown.practice + breakdown.assessment + breakdown.review;
    breakdown.buffer = Math.ceil(subtotal * 0.15);
    const factors = this.calculateEffortFactors(goal, decomp);
    let totalMinutes = subtotal + breakdown.buffer;
    for (const factor of factors) {
      totalMinutes = Math.ceil(totalMinutes * factor.impact);
    }
    return {
      totalMinutes,
      breakdown,
      confidence: decomp.confidence,
      factors
    };
  }
  /**
   * Refine a decomposition based on feedback
   */
  async refineDecomposition(decomposition, feedback) {
    this.logger.debug?.(`[GoalDecomposer] Refining decomposition based on feedback`);
    const refinedSubGoals = [...decomposition.subGoals];
    if (feedback.adjustments) {
      for (const adjustment of feedback.adjustments) {
        const subGoalIndex = refinedSubGoals.findIndex((sg) => sg.id === adjustment.subGoalId);
        if (subGoalIndex >= 0) {
          refinedSubGoals[subGoalIndex] = {
            ...refinedSubGoals[subGoalIndex],
            ...adjustment.changes
          };
        }
      }
    }
    if (feedback.addSubGoals) {
      for (const newSubGoal of feedback.addSubGoals) {
        refinedSubGoals.push({
          id: this.generateSubGoalId(),
          goalId: decomposition.goalId,
          status: StepStatus.PENDING,
          order: refinedSubGoals.length,
          ...newSubGoal
        });
      }
    }
    if (feedback.removeSubGoalIds) {
      const idsToRemove = new Set(feedback.removeSubGoalIds);
      const filtered = refinedSubGoals.filter((sg) => !idsToRemove.has(sg.id));
      refinedSubGoals.length = 0;
      refinedSubGoals.push(...filtered);
      refinedSubGoals.forEach((sg, index) => {
        sg.order = index;
      });
    }
    const dependencies = this.rebuildDependencies(refinedSubGoals);
    const estimatedDuration = refinedSubGoals.reduce((sum, sg) => sum + sg.estimatedMinutes, 0);
    return {
      ...decomposition,
      subGoals: refinedSubGoals,
      dependencies,
      estimatedDuration,
      confidence: decomposition.confidence * 0.9
      // Slight confidence reduction after refinement
    };
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  mergeOptions(options) {
    const merged = { ...this.defaultOptions, ...options };
    return DecompositionOptionsSchema.parse(merged);
  }
  async generateDecomposition(goal, options) {
    const prompt = this.buildDecompositionPrompt(goal, options);
    const response = await this.ai.chat({
      messages: [
        {
          role: "system",
          content: `You are an expert learning curriculum designer. Decompose learning goals into actionable sub-goals.

CRITICAL: Respond with ONLY valid JSON, no other text. The JSON must match this exact structure:
{
  "subGoals": [
    {
      "title": "Sub-goal title",
      "description": "Brief description",
      "type": "learn",
      "estimatedMinutes": 30,
      "difficulty": "easy",
      "prerequisites": [],
      "successCriteria": ["Criterion 1"]
    }
  ],
  "overallDifficulty": "medium",
  "reasoning": "Brief explanation"
}

Rules:
- type must be one of: learn, practice, assess, review, reflect, create
- difficulty must be: easy, medium, or hard
- estimatedMinutes: 5-240
- prerequisites: array of indices (0-indexed) of sub-goals that must come first
- Create ${options.minSubGoals}-${options.maxSubGoals} sub-goals
- Keep descriptions concise to fit within token limits`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      maxTokens: 4e3
      // Increased from 2000 to handle larger decompositions
    });
    this.logger.info?.(`[GoalDecomposer] AI Response received - content length: ${response.content?.length ?? 0}`);
    this.logger.info?.(`[GoalDecomposer] AI Response model: ${response.model}`);
    if (!response.content || response.content.length === 0) {
      this.logger.error?.(`[GoalDecomposer] AI returned empty response!`);
      throw new Error("AI returned empty response - no content received");
    }
    const content = response.content.trim();
    let jsonString = null;
    const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      jsonString = jsonBlockMatch[1].trim();
    }
    if (!jsonString) {
      const startIdx = content.indexOf("{");
      if (startIdx !== -1) {
        let depth = 0;
        let endIdx = -1;
        for (let i = startIdx; i < content.length; i++) {
          if (content[i] === "{") depth++;
          else if (content[i] === "}") {
            depth--;
            if (depth === 0) {
              endIdx = i;
              break;
            }
          }
        }
        if (endIdx !== -1) {
          jsonString = content.substring(startIdx, endIdx + 1);
        }
      }
    }
    if (!jsonString && content.startsWith("{")) {
      jsonString = content;
    }
    if (!jsonString) {
      this.logger.error?.(`[GoalDecomposer] No JSON found in response: ${content.substring(0, 200)}...`);
      throw new Error("Failed to extract JSON from AI response - no JSON object found");
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      this.logger.warn?.(`[GoalDecomposer] JSON parse failed, attempting repair...`);
      let repairedJson = jsonString;
      const openBraces = (repairedJson.match(/{/g) || []).length;
      const closeBraces = (repairedJson.match(/}/g) || []).length;
      const openBrackets = (repairedJson.match(/\[/g) || []).length;
      const closeBrackets = (repairedJson.match(/]/g) || []).length;
      if (openBrackets > closeBrackets) {
        repairedJson = repairedJson.replace(/,\s*\{[^}]*$/, "");
        repairedJson = repairedJson.replace(/,\s*"[^"]*$/, "");
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          repairedJson += "]";
        }
      }
      if (openBraces > closeBraces) {
        for (let i = 0; i < openBraces - closeBraces; i++) {
          repairedJson += "}";
        }
      }
      try {
        parsed = JSON.parse(repairedJson);
        this.logger.info?.(`[GoalDecomposer] JSON repair successful`);
      } catch {
        this.logger.error?.(`[GoalDecomposer] JSON repair failed. Original: ${jsonString.substring(0, 500)}...`);
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
      }
    }
    try {
      return DecompositionAIResponseSchema.parse(parsed);
    } catch (validationError) {
      this.logger.error?.(`[GoalDecomposer] Schema validation failed: ${validationError.message}`);
      throw new Error(`AI response does not match expected schema: ${validationError.message}`);
    }
  }
  buildDecompositionPrompt(goal, options) {
    const parts = [
      `Decompose this learning goal into ${options.minSubGoals}-${options.maxSubGoals} actionable sub-goals:`,
      "",
      `Goal: ${goal.title}`
    ];
    if (goal.description) {
      parts.push(`Description: ${goal.description}`);
    }
    if (goal.currentMastery) {
      parts.push(`Current mastery level: ${goal.currentMastery}`);
    }
    if (goal.targetMastery) {
      parts.push(`Target mastery level: ${goal.targetMastery}`);
    }
    if (goal.context?.courseId) {
      parts.push(`Context: Part of a structured course`);
    }
    if (options.availableTimePerDay) {
      parts.push(`Available time per day: ${options.availableTimePerDay} minutes`);
    }
    if (options.targetCompletionDate) {
      const daysUntil = Math.ceil(
        (options.targetCompletionDate.getTime() - Date.now()) / (1e3 * 60 * 60 * 24)
      );
      parts.push(`Target completion: ${daysUntil} days from now`);
    }
    if (options.preferredLearningStyle) {
      parts.push(`Preferred learning style: ${options.preferredLearningStyle}`);
    }
    parts.push("");
    parts.push("Requirements:");
    if (options.includeAssessments) {
      parts.push("- Include assessment checkpoints");
    }
    if (options.includeReviews) {
      parts.push("- Include review/reflection steps");
    }
    return parts.join("\n");
  }
  convertToSubGoals(goalId, aiSubGoals) {
    return aiSubGoals.map((sg, index) => ({
      id: this.generateSubGoalId(),
      goalId,
      title: sg.title,
      description: sg.description,
      type: sg.type,
      order: index,
      estimatedMinutes: sg.estimatedMinutes,
      difficulty: sg.difficulty,
      prerequisites: [],
      // Will be filled by buildDependencyGraph
      successCriteria: sg.successCriteria,
      status: StepStatus.PENDING
    }));
  }
  buildDependencyGraph(subGoals, aiSubGoals) {
    const nodes = subGoals.map((sg) => sg.id);
    const edges = [];
    aiSubGoals.forEach((aiSg, index) => {
      const targetId = subGoals[index].id;
      for (const prereqIndex of aiSg.prerequisites) {
        if (prereqIndex >= 0 && prereqIndex < subGoals.length && prereqIndex !== index) {
          const fromId = subGoals[prereqIndex].id;
          edges.push({
            from: fromId,
            to: targetId,
            type: "prerequisite"
          });
          subGoals[index].prerequisites.push(fromId);
        }
      }
    });
    return { nodes, edges };
  }
  rebuildDependencies(subGoals) {
    const nodes = subGoals.map((sg) => sg.id);
    const edges = [];
    const idSet = new Set(nodes);
    for (const sg of subGoals) {
      for (const prereqId of sg.prerequisites) {
        if (idSet.has(prereqId)) {
          edges.push({
            from: prereqId,
            to: sg.id,
            type: "prerequisite"
          });
        }
      }
    }
    return { nodes, edges };
  }
  calculateConfidence(goal, subGoals, options) {
    let confidence = 0.8;
    if (goal.description && goal.description.length > 50) {
      confidence += 0.05;
    }
    if (goal.context?.courseId) {
      confidence += 0.05;
    }
    if (goal.targetMastery && goal.currentMastery) {
      confidence += 0.05;
    }
    const count = subGoals.length;
    if (count >= options.minSubGoals && count <= options.maxSubGoals) {
      confidence += 0.05;
    } else {
      confidence -= 0.1;
    }
    const types = new Set(subGoals.map((sg) => sg.type));
    if (types.size >= 3) {
      confidence += 0.05;
    }
    return Math.min(1, Math.max(0, confidence));
  }
  calculateEffortFactors(goal, decomp) {
    const factors = [];
    if (goal.currentMastery && goal.targetMastery) {
      const masteryLevels = ["novice", "beginner", "intermediate", "advanced", "expert"];
      const currentIdx = masteryLevels.indexOf(goal.currentMastery);
      const targetIdx = masteryLevels.indexOf(goal.targetMastery);
      const gap = targetIdx - currentIdx;
      if (gap >= 3) {
        factors.push({
          name: "Large mastery gap",
          impact: 1.3,
          reason: "Moving from novice to advanced requires extra time"
        });
      }
    }
    if (decomp.difficulty === "hard") {
      factors.push({
        name: "High difficulty",
        impact: 1.2,
        reason: "Complex material requires additional processing time"
      });
    }
    if (decomp.confidence < 0.7) {
      factors.push({
        name: "Uncertainty buffer",
        impact: 1.15,
        reason: "Low decomposition confidence adds uncertainty"
      });
    }
    return factors;
  }
  findCircularDependencies(graph) {
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const cycle = [];
    const dfs = (node, path) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      const outEdges = graph.edges.filter((e) => e.from === node);
      for (const edge of outEdges) {
        if (!visited.has(edge.to)) {
          if (dfs(edge.to, path)) {
            return true;
          }
        } else if (recursionStack.has(edge.to)) {
          const cycleStart = path.indexOf(edge.to);
          cycle.push(...path.slice(cycleStart), edge.to);
          return true;
        }
      }
      path.pop();
      recursionStack.delete(node);
      return false;
    };
    for (const node of graph.nodes) {
      if (!visited.has(node)) {
        if (dfs(node, [])) {
          return cycle;
        }
      }
    }
    return [];
  }
  findOrphanedSubGoals(decomp) {
    const nodeSet = new Set(decomp.dependencies.nodes);
    const orphans = [];
    for (const subGoal of decomp.subGoals) {
      for (const prereq of subGoal.prerequisites) {
        if (!nodeSet.has(prereq)) {
          orphans.push(subGoal.id);
          break;
        }
      }
    }
    return orphans;
  }
  validateTimeDistribution(decomp) {
    const issues = [];
    const total = decomp.estimatedDuration;
    for (const sg of decomp.subGoals) {
      if (sg.estimatedMinutes > 180) {
        issues.push({
          type: "warning",
          code: "LONG_SUBGOAL",
          message: `Sub-goal "${sg.title}" may be too long (${sg.estimatedMinutes} min). Consider breaking it down.`
        });
      }
    }
    if (total < 30) {
      issues.push({
        type: "warning",
        code: "SHORT_DURATION",
        message: `Total estimated time (${total} min) seems too short for a learning goal.`
      });
    }
    return issues;
  }
  validateTypeDistribution(decomp) {
    const issues = [];
    const typeCounts = /* @__PURE__ */ new Map();
    for (const sg of decomp.subGoals) {
      typeCounts.set(sg.type, (typeCounts.get(sg.type) || 0) + 1);
    }
    if (!typeCounts.has("learn") && !typeCounts.has("practice")) {
      issues.push({
        type: "warning",
        code: "MISSING_LEARNING",
        message: "Decomposition has no learn or practice activities."
      });
    }
    const learnCount = typeCounts.get("learn") || 0;
    const practiceCount = typeCounts.get("practice") || 0;
    const assessCount = typeCounts.get("assess") || 0;
    if (learnCount > 0 && practiceCount === 0) {
      issues.push({
        type: "info",
        code: "NO_PRACTICE",
        message: "Consider adding practice activities to reinforce learning."
      });
    }
    if (learnCount + practiceCount > 3 && assessCount === 0) {
      issues.push({
        type: "info",
        code: "NO_ASSESSMENT",
        message: "Consider adding assessment checkpoints to verify progress."
      });
    }
    return issues;
  }
  generateSubGoalId() {
    return `sg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};
function createGoalDecomposer(config) {
  return new GoalDecomposer(config);
}

// src/goal-planning/plan-builder.ts
var DEFAULT_OPTIONS2 = {
  dailyMinutes: 60,
  generateSchedule: true,
  includeCheckpoints: true,
  includeFallbacks: true,
  maxDaysAhead: 90
};
var PlanBuilder = class {
  logger;
  defaultOptions;
  constructor(config = {}) {
    this.logger = config.logger ?? console;
    this.defaultOptions = { ...DEFAULT_OPTIONS2, ...config.defaultOptions };
  }
  /**
   * Build an execution plan from a goal decomposition
   */
  async createPlan(goal, decomposition, options) {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };
    this.logger.debug?.(`[PlanBuilder] Building plan for goal: ${goal.title}`);
    try {
      const orderedSubGoals = this.topologicalSort(decomposition);
      const steps = this.createSteps(orderedSubGoals, goal);
      const schedule = mergedOptions.generateSchedule ? this.generateSchedule(steps, goal, mergedOptions) : void 0;
      const checkpoints = mergedOptions.includeCheckpoints ? this.generateCheckpoints(steps, decomposition) : [];
      const fallbackStrategies = mergedOptions.includeFallbacks ? this.generateFallbackStrategies() : [];
      const plan = {
        id: this.generatePlanId(),
        goalId: goal.id,
        userId: goal.userId,
        startDate: schedule?.sessions[0]?.date,
        targetDate: goal.targetDate,
        steps,
        schedule,
        checkpoints,
        fallbackStrategies,
        overallProgress: 0,
        status: PlanStatus.DRAFT,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.logger.debug?.(
        `[PlanBuilder] Built plan with ${steps.length} steps in ${Date.now() - startTime}ms`
      );
      return plan;
    } catch (error) {
      this.logger.error?.(`[PlanBuilder] Plan creation failed: ${error.message}`);
      throw error;
    }
  }
  /**
   * Optimize an existing plan based on constraints
   */
  optimizePlan(plan, constraints) {
    this.logger.debug?.(`[PlanBuilder] Optimizing plan with constraints`);
    let optimizedPlan = { ...plan };
    if (constraints.maxTotalMinutes) {
      optimizedPlan = this.applyTimeConstraint(optimizedPlan, constraints.maxTotalMinutes);
    }
    if (constraints.deadline) {
      optimizedPlan = this.applyDeadlineConstraint(optimizedPlan, constraints.deadline);
    }
    if (constraints.maxDailyMinutes && optimizedPlan.schedule) {
      optimizedPlan = this.applyDailyLimit(optimizedPlan, constraints.maxDailyMinutes);
    }
    optimizedPlan.updatedAt = /* @__PURE__ */ new Date();
    return optimizedPlan;
  }
  /**
   * Adapt a plan based on feedback and progress
   */
  adaptPlan(plan, adaptation) {
    this.logger.debug?.(`[PlanBuilder] Adapting plan based on ${adaptation.type}`);
    const adaptedPlan = { ...plan, steps: [...plan.steps] };
    switch (adaptation.type) {
      case "difficulty_increase":
        this.increaseDifficulty(adaptedPlan, adaptation.targetStepIds);
        break;
      case "difficulty_decrease":
        this.decreaseDifficulty(adaptedPlan, adaptation.targetStepIds);
        break;
      case "add_support":
        this.addSupportSteps(adaptedPlan, adaptation.targetStepIds);
        break;
      case "skip_ahead":
        if (adaptation.targetStepIds) {
          this.skipSteps(adaptedPlan, adaptation.targetStepIds);
        }
        break;
      case "reschedule":
        if (adaptation.newSchedule) {
          adaptedPlan.schedule = adaptation.newSchedule;
        }
        break;
    }
    adaptedPlan.updatedAt = /* @__PURE__ */ new Date();
    return adaptedPlan;
  }
  /**
   * Calculate plan progress
   */
  calculateProgress(plan) {
    const totalSteps = plan.steps.length;
    const completedSteps = plan.steps.filter((s) => s.status === StepStatus.COMPLETED).length;
    const failedSteps = plan.steps.filter((s) => s.status === StepStatus.FAILED).length;
    const skippedSteps = plan.steps.filter((s) => s.status === StepStatus.SKIPPED).length;
    const inProgressSteps = plan.steps.filter((s) => s.status === StepStatus.IN_PROGRESS).length;
    const totalEstimatedMinutes = plan.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    const completedMinutes = plan.steps.filter((s) => s.status === StepStatus.COMPLETED).reduce((sum, s) => sum + (s.actualMinutes ?? s.estimatedMinutes), 0);
    const remainingMinutes = plan.steps.filter((s) => s.status === StepStatus.PENDING || s.status === StepStatus.IN_PROGRESS).reduce((sum, s) => sum + s.estimatedMinutes, 0);
    const achievedCheckpoints = plan.checkpoints.filter((c) => c.achieved).length;
    return {
      overallPercentage: totalSteps > 0 ? Math.round(completedSteps / totalSteps * 100) : 0,
      stepStats: {
        total: totalSteps,
        completed: completedSteps,
        failed: failedSteps,
        skipped: skippedSteps,
        inProgress: inProgressSteps,
        pending: totalSteps - completedSteps - failedSteps - skippedSteps - inProgressSteps
      },
      timeStats: {
        totalEstimated: totalEstimatedMinutes,
        completed: completedMinutes,
        remaining: remainingMinutes
      },
      checkpointStats: {
        total: plan.checkpoints.length,
        achieved: achievedCheckpoints
      },
      currentStep: plan.steps.find((s) => s.status === StepStatus.IN_PROGRESS),
      nextStep: plan.steps.find((s) => s.status === StepStatus.PENDING)
    };
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  topologicalSort(decomposition) {
    const { subGoals, dependencies } = decomposition;
    const result = [];
    const visited = /* @__PURE__ */ new Set();
    const temp = /* @__PURE__ */ new Set();
    const subGoalMap = new Map(subGoals.map((sg) => [sg.id, sg]));
    const visit = (id) => {
      if (temp.has(id)) {
        throw new Error(`Circular dependency detected involving ${id}`);
      }
      if (visited.has(id)) return;
      temp.add(id);
      const subGoal = subGoalMap.get(id);
      if (subGoal) {
        for (const prereqId of subGoal.prerequisites) {
          if (subGoalMap.has(prereqId)) {
            visit(prereqId);
          }
        }
        visited.add(id);
        temp.delete(id);
        result.push(subGoal);
      }
    };
    for (const node of dependencies.nodes) {
      if (!visited.has(node)) {
        visit(node);
      }
    }
    return result;
  }
  createSteps(orderedSubGoals, goal) {
    const steps = [];
    for (let i = 0; i < orderedSubGoals.length; i++) {
      const subGoal = orderedSubGoals[i];
      const stepType = this.mapSubGoalTypeToStepType(subGoal.type);
      const step = {
        id: this.generateStepId(),
        planId: "",
        // Will be set when plan is created
        subGoalId: subGoal.id,
        type: stepType,
        title: subGoal.title,
        description: subGoal.description,
        order: i,
        status: StepStatus.PENDING,
        estimatedMinutes: subGoal.estimatedMinutes,
        retryCount: 0,
        maxRetries: 3,
        inputs: this.createStepInputs(subGoal, goal),
        executionContext: this.createExecutionContext(goal)
      };
      steps.push(step);
    }
    return steps;
  }
  mapSubGoalTypeToStepType(type) {
    const mapping = {
      [SubGoalType.LEARN]: StepType.READ_CONTENT,
      [SubGoalType.PRACTICE]: StepType.PRACTICE_PROBLEM,
      [SubGoalType.ASSESS]: StepType.TAKE_QUIZ,
      [SubGoalType.REVIEW]: StepType.SPACED_REVIEW,
      [SubGoalType.REFLECT]: StepType.REFLECT,
      [SubGoalType.CREATE]: StepType.PROJECT_WORK
    };
    return mapping[type] ?? StepType.READ_CONTENT;
  }
  createStepInputs(_subGoal, goal) {
    const inputs = [];
    if (goal.context.sectionId) {
      inputs.push({
        name: "sectionId",
        type: "content",
        value: goal.context.sectionId,
        required: false
      });
    }
    if (goal.context.chapterId) {
      inputs.push({
        name: "chapterId",
        type: "content",
        value: goal.context.chapterId,
        required: false
      });
    }
    if (goal.context.courseId) {
      inputs.push({
        name: "courseId",
        type: "content",
        value: goal.context.courseId,
        required: false
      });
    }
    return inputs;
  }
  createExecutionContext(goal) {
    return {
      courseId: goal.context.courseId,
      chapterId: goal.context.chapterId,
      sectionId: goal.context.sectionId
    };
  }
  generateSchedule(steps, _goal, options) {
    const sessions = [];
    let currentDate = /* @__PURE__ */ new Date();
    let stepIndex = 0;
    let daysScheduled = 0;
    while (stepIndex < steps.length && daysScheduled < (options.maxDaysAhead ?? 90)) {
      const dayOfWeek = currentDate.getDay();
      if (options.excludeDays?.includes(dayOfWeek)) {
        currentDate = this.addDays(currentDate, 1);
        daysScheduled++;
        continue;
      }
      const daySteps = [];
      let dayMinutes = 0;
      while (stepIndex < steps.length && dayMinutes + steps[stepIndex].estimatedMinutes <= options.dailyMinutes) {
        daySteps.push(steps[stepIndex].id);
        dayMinutes += steps[stepIndex].estimatedMinutes;
        stepIndex++;
      }
      if (daySteps.length === 0 && stepIndex < steps.length) {
        daySteps.push(steps[stepIndex].id);
        dayMinutes = steps[stepIndex].estimatedMinutes;
        stepIndex++;
      }
      if (daySteps.length > 0) {
        sessions.push({
          date: new Date(currentDate),
          steps: daySteps,
          estimatedMinutes: dayMinutes,
          completed: false
        });
      }
      currentDate = this.addDays(currentDate, 1);
      daysScheduled++;
    }
    return {
      dailyMinutes: options.dailyMinutes,
      preferredTimes: options.preferredTimes,
      excludeDays: options.excludeDays,
      sessions
    };
  }
  generateCheckpoints(steps, _decomposition) {
    const checkpoints = [];
    const totalSteps = steps.length;
    const milestoneIndices = [
      Math.floor(totalSteps * 0.25),
      Math.floor(totalSteps * 0.5),
      Math.floor(totalSteps * 0.75),
      totalSteps - 1
    ].filter((v, i, a) => a.indexOf(v) === i && v >= 0);
    for (let i = 0; i < milestoneIndices.length; i++) {
      const stepIndex = milestoneIndices[i];
      const step = steps[stepIndex];
      const percentage = Math.round((stepIndex + 1) / totalSteps * 100);
      checkpoints.push({
        id: this.generateCheckpointId(),
        planId: "",
        // Will be set when plan is created
        stepId: step.id,
        name: `${percentage}% Complete`,
        description: `Reached ${percentage}% of the learning plan`,
        type: "milestone",
        achieved: false
      });
    }
    const assessmentSteps = steps.filter(
      (s) => s.type === StepType.TAKE_QUIZ || s.type === StepType.COMPLETE_EXERCISE
    );
    for (const step of assessmentSteps) {
      checkpoints.push({
        id: this.generateCheckpointId(),
        planId: "",
        stepId: step.id,
        name: `Assessment: ${step.title}`,
        type: "assessment",
        achieved: false
      });
    }
    return checkpoints;
  }
  generateFallbackStrategies() {
    return [
      {
        trigger: { type: "step_failed", threshold: 2 },
        action: { type: "simplify", parameters: { reduceComplexity: true } },
        priority: 1
      },
      {
        trigger: { type: "stuck_too_long", threshold: 15 },
        // 15 minutes
        action: { type: "add_support", parameters: { addHints: true } },
        priority: 2
      },
      {
        trigger: { type: "low_engagement", threshold: 0.3 },
        action: { type: "replan", parameters: { adjustDifficulty: "decrease" } },
        priority: 3
      },
      {
        trigger: { type: "mastery_not_improving", threshold: 5 },
        // 5 attempts
        action: { type: "escalate", parameters: { seekHelp: true } },
        priority: 4
      }
    ];
  }
  applyTimeConstraint(plan, maxMinutes) {
    let totalMinutes = plan.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    if (totalMinutes <= maxMinutes) return plan;
    const prioritizedSteps = [...plan.steps].sort((a, b) => {
      const priority = {
        [StepType.READ_CONTENT]: 1,
        [StepType.TAKE_QUIZ]: 2,
        [StepType.PRACTICE_PROBLEM]: 3,
        [StepType.COMPLETE_EXERCISE]: 3,
        [StepType.SOCRATIC_DIALOGUE]: 4,
        [StepType.SPACED_REVIEW]: 5,
        [StepType.REFLECT]: 6,
        [StepType.CREATE_SUMMARY]: 6,
        [StepType.WATCH_VIDEO]: 2,
        [StepType.PEER_DISCUSSION]: 7,
        [StepType.PROJECT_WORK]: 4,
        [StepType.RESEARCH]: 5
      };
      return (priority[a.type] ?? 5) - (priority[b.type] ?? 5);
    });
    const keptSteps = [];
    let runningTotal = 0;
    for (const step of prioritizedSteps) {
      if (runningTotal + step.estimatedMinutes <= maxMinutes) {
        keptSteps.push(step);
        runningTotal += step.estimatedMinutes;
      }
    }
    keptSteps.sort((a, b) => a.order - b.order);
    return { ...plan, steps: keptSteps };
  }
  applyDeadlineConstraint(plan, deadline) {
    if (!plan.schedule) return plan;
    const filteredSessions = plan.schedule.sessions.filter(
      (s) => s.date <= deadline
    );
    return {
      ...plan,
      targetDate: deadline,
      schedule: { ...plan.schedule, sessions: filteredSessions }
    };
  }
  applyDailyLimit(plan, maxDailyMinutes) {
    if (!plan.schedule) return plan;
    const newSchedule = { ...plan.schedule, dailyMinutes: maxDailyMinutes };
    const allStepIds = plan.schedule.sessions.flatMap((s) => s.steps);
    const stepMap = new Map(plan.steps.map((s) => [s.id, s]));
    const newSessions = [];
    let currentDate = plan.schedule.sessions[0]?.date ?? /* @__PURE__ */ new Date();
    let currentSession = {
      date: currentDate,
      steps: [],
      estimatedMinutes: 0,
      completed: false
    };
    for (const stepId of allStepIds) {
      const step = stepMap.get(stepId);
      if (!step) continue;
      if (currentSession.estimatedMinutes + step.estimatedMinutes > maxDailyMinutes) {
        if (currentSession.steps.length > 0) {
          newSessions.push(currentSession);
        }
        currentDate = this.addDays(currentDate, 1);
        currentSession = {
          date: currentDate,
          steps: [stepId],
          estimatedMinutes: step.estimatedMinutes,
          completed: false
        };
      } else {
        currentSession.steps.push(stepId);
        currentSession.estimatedMinutes += step.estimatedMinutes;
      }
    }
    if (currentSession.steps.length > 0) {
      newSessions.push(currentSession);
    }
    return { ...plan, schedule: { ...newSchedule, sessions: newSessions } };
  }
  increaseDifficulty(plan, stepIds) {
    const targetSteps = stepIds ? plan.steps.filter((s) => stepIds.includes(s.id)) : plan.steps;
    for (const step of targetSteps) {
      if (step.type === StepType.PRACTICE_PROBLEM) {
        step.metadata = { ...step.metadata, difficulty: "increased" };
      }
    }
  }
  decreaseDifficulty(plan, stepIds) {
    const targetSteps = stepIds ? plan.steps.filter((s) => stepIds.includes(s.id)) : plan.steps;
    for (const step of targetSteps) {
      step.metadata = { ...step.metadata, difficulty: "decreased" };
      step.estimatedMinutes = Math.ceil(step.estimatedMinutes * 1.2);
    }
  }
  addSupportSteps(plan, stepIds) {
    const targetSteps = stepIds ? plan.steps.filter((s) => stepIds.includes(s.id)) : plan.steps.filter((s) => s.status === StepStatus.FAILED);
    for (const step of targetSteps) {
      const stepIndex = plan.steps.findIndex((s) => s.id === step.id);
      if (stepIndex === -1) continue;
      const supportStep = {
        id: this.generateStepId(),
        planId: plan.id,
        type: StepType.SOCRATIC_DIALOGUE,
        title: `Extra Support: ${step.title}`,
        description: `Additional explanation and practice for ${step.title}`,
        order: step.order - 0.5,
        status: StepStatus.PENDING,
        estimatedMinutes: 15,
        retryCount: 0,
        maxRetries: 1,
        metadata: { supportFor: step.id }
      };
      plan.steps.splice(stepIndex, 0, supportStep);
    }
    plan.steps.sort((a, b) => a.order - b.order);
    plan.steps.forEach((s, i) => s.order = i);
  }
  skipSteps(plan, stepIds) {
    for (const stepId of stepIds) {
      const step = plan.steps.find((s) => s.id === stepId);
      if (step && step.status === StepStatus.PENDING) {
        step.status = StepStatus.SKIPPED;
      }
    }
  }
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  generatePlanId() {
    return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  generateStepId() {
    return `step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  generateCheckpointId() {
    return `cp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};
function createPlanBuilder(config) {
  return new PlanBuilder(config);
}

// src/goal-planning/agent-state-machine.ts
var AgentStateMachine = class {
  planStore;
  logger;
  autoSaveInterval;
  maxStepRetries;
  currentState = "idle";
  currentPlan = null;
  planState = null;
  listeners = [];
  autoSaveTimer = null;
  stepExecutor = null;
  constructor(config) {
    this.planStore = config.planStore;
    this.logger = config.logger ?? console;
    this.autoSaveInterval = config.autoSaveInterval ?? 3e4;
    this.maxStepRetries = config.maxStepRetries ?? 3;
  }
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  /**
   * Get current state
   */
  getState() {
    return this.currentState;
  }
  /**
   * Get current plan state (for resumability)
   */
  getPlanState() {
    return this.planState;
  }
  /**
   * Get current plan
   */
  getCurrentPlan() {
    return this.currentPlan;
  }
  /**
   * Set the step executor function
   */
  setStepExecutor(executor) {
    this.stepExecutor = executor;
  }
  /**
   * Add a listener
   */
  addListener(listener) {
    this.listeners.push(listener);
  }
  /**
   * Remove a listener
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }
  /**
   * Start executing a plan
   */
  async start(plan) {
    if (this.currentState !== "idle") {
      throw new Error(`Cannot start: state machine is in '${this.currentState}' state`);
    }
    this.logger.debug?.(`[StateMachine] Starting plan: ${plan.id}`);
    this.currentPlan = plan;
    this.planState = this.initializePlanState(plan);
    plan.status = PlanStatus.ACTIVE;
    plan.startDate = /* @__PURE__ */ new Date();
    await this.planStore.update(plan.id, { status: PlanStatus.ACTIVE, startDate: plan.startDate });
    this.transitionTo("running");
    this.startAutoSave();
    await this.executeNextStep();
  }
  /**
   * Pause execution
   */
  async pause(reason) {
    if (this.currentState !== "running" && this.currentState !== "waiting_for_input") {
      throw new Error(`Cannot pause: state machine is in '${this.currentState}' state`);
    }
    this.logger.debug?.(`[StateMachine] Pausing: ${reason ?? "user requested"}`);
    this.planState.pausedAt = /* @__PURE__ */ new Date();
    await this.saveState();
    this.stopAutoSave();
    if (this.currentPlan) {
      this.currentPlan.status = PlanStatus.PAUSED;
      this.currentPlan.pausedAt = /* @__PURE__ */ new Date();
      await this.planStore.update(this.currentPlan.id, {
        status: PlanStatus.PAUSED,
        pausedAt: this.currentPlan.pausedAt
      });
    }
    this.transitionTo("paused");
    return this.planState;
  }
  /**
   * Resume execution from saved state
   */
  async resume(savedState) {
    const state = savedState ?? this.planState;
    if (!state) {
      throw new Error("No state to resume from");
    }
    if (this.currentState !== "paused" && this.currentState !== "idle") {
      throw new Error(`Cannot resume: state machine is in '${this.currentState}' state`);
    }
    this.logger.debug?.(`[StateMachine] Resuming plan: ${state.planId}`);
    if (!this.currentPlan || this.currentPlan.id !== state.planId) {
      const plan = await this.planStore.get(state.planId);
      if (!plan) {
        throw new Error(`Plan not found: ${state.planId}`);
      }
      this.currentPlan = plan;
    }
    this.planState = {
      ...state,
      pausedAt: void 0,
      lastActiveAt: /* @__PURE__ */ new Date()
    };
    this.currentPlan.status = PlanStatus.ACTIVE;
    await this.planStore.update(this.currentPlan.id, { status: PlanStatus.ACTIVE });
    this.transitionTo("running");
    this.startAutoSave();
    await this.executeNextStep();
  }
  /**
   * Abort execution
   */
  async abort(reason) {
    this.logger.debug?.(`[StateMachine] Aborting: ${reason}`);
    this.stopAutoSave();
    if (this.currentPlan) {
      this.currentPlan.status = PlanStatus.CANCELLED;
      await this.planStore.update(this.currentPlan.id, { status: PlanStatus.CANCELLED });
    }
    this.transitionTo("aborted");
    this.cleanup();
  }
  /**
   * Load saved state
   */
  async loadState(planId) {
    return this.planStore.loadState(planId);
  }
  /**
   * Save current state
   */
  async saveState() {
    if (!this.planState) return;
    this.planState.lastActiveAt = /* @__PURE__ */ new Date();
    await this.planStore.saveState(this.planState);
    this.notifyCheckpoint(this.planState);
    this.logger.debug?.(`[StateMachine] State saved for plan: ${this.planState.planId}`);
  }
  /**
   * Complete a step manually (for external step execution)
   */
  async completeStep(stepId, result) {
    await this.handleEvent({ type: "STEP_COMPLETE", stepId, result });
  }
  /**
   * Fail a step manually
   */
  async failStep(stepId, error) {
    await this.handleEvent({ type: "STEP_FAILED", stepId, error });
  }
  /**
   * Skip a step
   */
  async skipStep(stepId, reason) {
    await this.handleEvent({ type: "STEP_SKIP", stepId, reason });
  }
  /**
   * Update execution context
   */
  async updateContext(context) {
    await this.handleEvent({ type: "UPDATE_CONTEXT", context });
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  async handleEvent(event) {
    switch (event.type) {
      case "START":
        await this.start(event.plan);
        break;
      case "PAUSE":
        await this.pause(event.reason);
        break;
      case "RESUME":
        await this.resume();
        break;
      case "ABORT":
        await this.abort(event.reason);
        break;
      case "STEP_COMPLETE":
        await this.handleStepComplete(event.stepId, event.result);
        break;
      case "STEP_FAILED":
        await this.handleStepFailed(event.stepId, event.error);
        break;
      case "STEP_SKIP":
        await this.handleStepSkip(event.stepId, event.reason);
        break;
      case "UPDATE_CONTEXT":
        this.updateExecutionContext(event.context);
        break;
      case "CHECKPOINT":
        this.planState.checkpointData = {
          ...this.planState.checkpointData,
          ...event.data
        };
        await this.saveState();
        break;
    }
  }
  async executeNextStep() {
    if (!this.currentPlan || !this.planState) return;
    if (this.currentState !== "running") return;
    const nextStep = this.currentPlan.steps.find(
      (s) => s.status === StepStatus.PENDING
    );
    if (!nextStep) {
      await this.handlePlanComplete();
      return;
    }
    this.planState.currentStepId = nextStep.id;
    nextStep.status = StepStatus.IN_PROGRESS;
    nextStep.startedAt = /* @__PURE__ */ new Date();
    await this.planStore.updateStep(this.currentPlan.id, nextStep.id, {
      status: StepStatus.IN_PROGRESS,
      startedAt: nextStep.startedAt
    });
    this.notifyStepStart(nextStep);
    if (this.stepExecutor) {
      try {
        const result = await this.stepExecutor(nextStep, this.planState.context);
        await this.handleStepComplete(nextStep.id, result);
      } catch (error) {
        await this.handleStepFailed(nextStep.id, error);
      }
    } else {
      this.transitionTo("waiting_for_input");
    }
  }
  async handleStepComplete(stepId, result) {
    if (!this.currentPlan || !this.planState) return;
    const step = this.currentPlan.steps.find((s) => s.id === stepId);
    if (!step) return;
    step.status = StepStatus.COMPLETED;
    step.completedAt = result.completedAt;
    step.actualMinutes = result.duration;
    step.outputs = result.outputs;
    await this.planStore.updateStep(this.currentPlan.id, stepId, {
      status: StepStatus.COMPLETED,
      completedAt: step.completedAt,
      actualMinutes: step.actualMinutes,
      outputs: step.outputs
    });
    this.planState.completedSteps.push(stepId);
    this.planState.currentStepId = null;
    this.planState.currentStepProgress = 0;
    this.planState.totalActiveTime += result.duration;
    const totalSteps = this.currentPlan.steps.length;
    const completedSteps = this.planState.completedSteps.length;
    this.currentPlan.overallProgress = Math.round(completedSteps / totalSteps * 100);
    await this.planStore.update(this.currentPlan.id, {
      overallProgress: this.currentPlan.overallProgress
    });
    await this.checkCheckpoints(stepId);
    this.notifyStepComplete(step, result);
    if (this.currentState === "running" || this.currentState === "waiting_for_input") {
      this.transitionTo("running");
      await this.executeNextStep();
    }
  }
  async handleStepFailed(stepId, error) {
    if (!this.currentPlan || !this.planState) return;
    const step = this.currentPlan.steps.find((s) => s.id === stepId);
    if (!step) return;
    step.retryCount++;
    step.lastError = error.message;
    const maxRetries = step.maxRetries ?? this.maxStepRetries;
    this.logger.warn?.(
      `[StateMachine] Step failed: ${stepId}, attempt ${step.retryCount}/${maxRetries}`
    );
    if (step.retryCount < maxRetries) {
      step.status = StepStatus.PENDING;
      await this.planStore.updateStep(this.currentPlan.id, stepId, {
        status: StepStatus.PENDING,
        retryCount: step.retryCount,
        lastError: step.lastError
      });
      const fallback = this.selectFallbackStrategy("step_failed");
      if (fallback) {
        await this.applyFallbackAction(fallback, step);
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      await this.executeNextStep();
    } else {
      step.status = StepStatus.FAILED;
      this.planState.failedSteps.push(stepId);
      await this.planStore.updateStep(this.currentPlan.id, stepId, {
        status: StepStatus.FAILED,
        retryCount: step.retryCount,
        lastError: step.lastError
      });
      this.notifyStepFailed(step, error);
      const criticalFailure = this.isCriticalFailure(step);
      if (criticalFailure) {
        await this.handlePlanFailed(error);
      } else {
        await this.executeNextStep();
      }
    }
  }
  async handleStepSkip(stepId, reason) {
    if (!this.currentPlan || !this.planState) return;
    const step = this.currentPlan.steps.find((s) => s.id === stepId);
    if (!step) return;
    step.status = StepStatus.SKIPPED;
    step.metadata = { ...step.metadata, skipReason: reason };
    this.planState.skippedSteps.push(stepId);
    await this.planStore.updateStep(this.currentPlan.id, stepId, {
      status: StepStatus.SKIPPED,
      metadata: step.metadata
    });
    await this.executeNextStep();
  }
  async handlePlanComplete() {
    if (!this.currentPlan) return;
    this.logger.debug?.(`[StateMachine] Plan completed: ${this.currentPlan.id}`);
    this.currentPlan.status = PlanStatus.COMPLETED;
    this.currentPlan.completedAt = /* @__PURE__ */ new Date();
    this.currentPlan.overallProgress = 100;
    await this.planStore.update(this.currentPlan.id, {
      status: PlanStatus.COMPLETED,
      completedAt: this.currentPlan.completedAt,
      overallProgress: 100
    });
    this.stopAutoSave();
    this.transitionTo("completed");
    this.notifyPlanComplete(this.currentPlan);
    this.cleanup();
  }
  async handlePlanFailed(error) {
    if (!this.currentPlan) return;
    this.logger.error?.(`[StateMachine] Plan failed: ${this.currentPlan.id} - ${error.message}`);
    this.currentPlan.status = PlanStatus.FAILED;
    await this.planStore.update(this.currentPlan.id, {
      status: PlanStatus.FAILED
    });
    this.stopAutoSave();
    this.transitionTo("failed");
    this.notifyPlanFailed(this.currentPlan, error);
    this.cleanup();
  }
  async checkCheckpoints(completedStepId) {
    if (!this.currentPlan) return;
    for (const checkpoint of this.currentPlan.checkpoints) {
      if (checkpoint.stepId === completedStepId && !checkpoint.achieved) {
        checkpoint.achieved = true;
        checkpoint.achievedAt = /* @__PURE__ */ new Date();
        this.logger.debug?.(`[StateMachine] Checkpoint achieved: ${checkpoint.name}`);
      }
    }
  }
  selectFallbackStrategy(triggerType) {
    if (!this.currentPlan) return null;
    const applicable = this.currentPlan.fallbackStrategies.filter((f) => f.trigger.type === triggerType).sort((a, b) => a.priority - b.priority);
    return applicable[0]?.action ?? null;
  }
  async applyFallbackAction(action, step) {
    this.logger.debug?.(`[StateMachine] Applying fallback: ${action.type}`);
    switch (action.type) {
      case "simplify":
        step.metadata = { ...step.metadata, simplified: true };
        break;
      case "add_support":
        step.metadata = { ...step.metadata, additionalSupport: true };
        break;
    }
  }
  isCriticalFailure(step) {
    return step.type === "take_quiz" || step.type === "complete_exercise";
  }
  updateExecutionContext(context) {
    if (!this.planState) return;
    this.planState.context = { ...this.planState.context, ...context };
  }
  initializePlanState(plan) {
    return {
      planId: plan.id,
      goalId: plan.goalId,
      userId: plan.userId,
      currentStepId: null,
      currentStepProgress: 0,
      completedSteps: [],
      failedSteps: [],
      skippedSteps: [],
      startedAt: /* @__PURE__ */ new Date(),
      lastActiveAt: /* @__PURE__ */ new Date(),
      totalActiveTime: 0,
      context: {
        recentTopics: [],
        strugglingConcepts: [],
        masteredConcepts: []
      },
      checkpointData: {},
      sessionCount: 1,
      currentSessionStart: /* @__PURE__ */ new Date()
    };
  }
  transitionTo(newState) {
    const oldState = this.currentState;
    this.currentState = newState;
    this.logger.debug?.(`[StateMachine] State: ${oldState} -> ${newState}`);
    for (const listener of this.listeners) {
      listener.onStateChange?.(oldState, newState);
    }
  }
  startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.saveState().catch((err) => {
        this.logger.error?.(`[StateMachine] Auto-save failed: ${err.message}`);
      });
    }, this.autoSaveInterval);
  }
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  cleanup() {
    this.stopAutoSave();
    this.currentPlan = null;
    this.planState = null;
  }
  // ============================================================================
  // NOTIFICATION HELPERS
  // ============================================================================
  notifyStepStart(step) {
    for (const listener of this.listeners) {
      listener.onStepStart?.(step);
    }
  }
  notifyStepComplete(step, result) {
    for (const listener of this.listeners) {
      listener.onStepComplete?.(step, result);
    }
  }
  notifyStepFailed(step, error) {
    for (const listener of this.listeners) {
      listener.onStepFailed?.(step, error);
    }
  }
  notifyPlanComplete(plan) {
    for (const listener of this.listeners) {
      listener.onPlanComplete?.(plan);
    }
  }
  notifyPlanFailed(plan, error) {
    for (const listener of this.listeners) {
      listener.onPlanFailed?.(plan, error);
    }
  }
  notifyCheckpoint(state) {
    for (const listener of this.listeners) {
      listener.onCheckpoint?.(state);
    }
  }
};
function createAgentStateMachine(config) {
  return new AgentStateMachine(config);
}

// src/goal-planning/step-executor.ts
var StepExecutor = class {
  logger;
  contentProvider;
  assessmentProvider;
  aiProvider;
  timeoutMs;
  enableMetrics;
  handlers;
  constructor(config = {}) {
    this.logger = config.logger ?? console;
    this.contentProvider = config.contentProvider ?? null;
    this.assessmentProvider = config.assessmentProvider ?? null;
    this.aiProvider = config.aiProvider ?? null;
    this.timeoutMs = config.timeoutMs ?? 3e5;
    this.enableMetrics = config.enableMetrics ?? true;
    this.handlers = /* @__PURE__ */ new Map();
    this.registerDefaultHandlers();
  }
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  /**
   * Execute a step
   */
  async execute(step, context) {
    const startTime = Date.now();
    this.logger.debug?.(`[StepExecutor] Executing step: ${step.id} (${step.type})`);
    const extendedContext = {
      ...context,
      stepContext: step.executionContext,
      userId: ""
      // Should be provided by caller
    };
    try {
      const handler = this.handlers.get(step.type);
      if (!handler) {
        throw new Error(`No handler registered for step type: ${step.type}`);
      }
      const result = await this.executeWithTimeout(
        handler(step, extendedContext),
        this.timeoutMs
      );
      const duration = Math.round((Date.now() - startTime) / 6e4);
      return this.buildStepResult(step, result, duration);
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 6e4);
      return {
        stepId: step.id,
        success: false,
        completedAt: /* @__PURE__ */ new Date(),
        duration,
        outputs: [],
        error: {
          code: "EXECUTION_ERROR",
          message: error.message,
          recoverable: true
        }
      };
    }
  }
  /**
   * Register a custom step handler
   */
  registerHandler(stepType, handler) {
    this.handlers.set(stepType, handler);
    this.logger.debug?.(`[StepExecutor] Registered handler for: ${stepType}`);
  }
  /**
   * Check if a handler exists for a step type
   */
  hasHandler(stepType) {
    return this.handlers.has(stepType);
  }
  /**
   * Get supported step types
   */
  getSupportedStepTypes() {
    return Array.from(this.handlers.keys());
  }
  // ============================================================================
  // DEFAULT HANDLERS
  // ============================================================================
  registerDefaultHandlers() {
    this.handlers.set(StepType.READ_CONTENT, this.handleReadContent.bind(this));
    this.handlers.set(StepType.WATCH_VIDEO, this.handleWatchVideo.bind(this));
    this.handlers.set(StepType.COMPLETE_EXERCISE, this.handleCompleteExercise.bind(this));
    this.handlers.set(StepType.TAKE_QUIZ, this.handleTakeQuiz.bind(this));
    this.handlers.set(StepType.REFLECT, this.handleReflect.bind(this));
    this.handlers.set(StepType.PRACTICE_PROBLEM, this.handlePracticeProblem.bind(this));
    this.handlers.set(StepType.SOCRATIC_DIALOGUE, this.handleSocraticDialogue.bind(this));
    this.handlers.set(StepType.SPACED_REVIEW, this.handleSpacedReview.bind(this));
    this.handlers.set(StepType.CREATE_SUMMARY, this.handleCreateSummary.bind(this));
    this.handlers.set(StepType.PEER_DISCUSSION, this.handlePeerDiscussion.bind(this));
    this.handlers.set(StepType.PROJECT_WORK, this.handleProjectWork.bind(this));
    this.handlers.set(StepType.RESEARCH, this.handleResearch.bind(this));
  }
  // ============================================================================
  // CONTENT HANDLERS
  // ============================================================================
  async handleReadContent(step, context) {
    if (!this.contentProvider) {
      return this.createSimulatedResult(step, "content_read");
    }
    const contentId = step.executionContext?.contentId;
    if (!contentId) {
      return {
        success: false,
        outputs: [],
        error: {
          code: "MISSING_CONTENT_ID",
          message: "No content ID provided for read_content step",
          recoverable: false
        }
      };
    }
    const content = await this.contentProvider.getContent(contentId);
    await this.contentProvider.markComplete(contentId, context.userId);
    return {
      success: true,
      outputs: [
        {
          name: "content_data",
          type: "result",
          value: { contentId, title: content.title },
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.8,
        // Base engagement for completing reading
        comprehension: 0.7,
        timeEfficiency: 1
      }
    };
  }
  async handleWatchVideo(step, context) {
    if (!this.contentProvider) {
      return this.createSimulatedResult(step, "video_watched");
    }
    const contentId = step.executionContext?.contentId;
    if (!contentId) {
      return {
        success: false,
        outputs: [],
        error: {
          code: "MISSING_CONTENT_ID",
          message: "No content ID provided for watch_video step",
          recoverable: false
        }
      };
    }
    await this.contentProvider.markComplete(contentId, context.userId);
    return {
      success: true,
      outputs: [
        {
          name: "video_completed",
          type: "result",
          value: { contentId, watchedAt: /* @__PURE__ */ new Date() },
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.85,
        comprehension: 0.65,
        timeEfficiency: 1
      }
    };
  }
  // ============================================================================
  // ASSESSMENT HANDLERS
  // ============================================================================
  async handleCompleteExercise(step, context) {
    if (!this.assessmentProvider) {
      return this.createSimulatedResult(step, "exercise_completed");
    }
    const assessmentId = step.executionContext?.assessmentId;
    if (!assessmentId) {
      return {
        success: false,
        outputs: [],
        error: {
          code: "MISSING_ASSESSMENT_ID",
          message: "No assessment ID provided for exercise step",
          recoverable: false
        }
      };
    }
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: "Please complete the exercise and submit your answer.",
        error: {
          code: "AWAITING_INPUT",
          message: "User input required",
          recoverable: true
        }
      };
    }
    const result = await this.assessmentProvider.submitAnswer(
      assessmentId,
      context.userId,
      context.userInput
    );
    return {
      success: result.passed,
      outputs: [
        {
          name: "exercise_result",
          type: "result",
          value: result,
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          name: "score",
          type: "metric",
          value: result.score / result.maxScore,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.9,
        comprehension: result.score / result.maxScore,
        masteryGain: result.passed ? 0.1 : 0
      }
    };
  }
  async handleTakeQuiz(step, context) {
    if (!this.assessmentProvider) {
      return this.createSimulatedResult(step, "quiz_completed");
    }
    const assessmentId = step.executionContext?.assessmentId;
    if (!assessmentId) {
      return {
        success: false,
        outputs: [],
        error: {
          code: "MISSING_ASSESSMENT_ID",
          message: "No assessment ID provided for quiz step",
          recoverable: false
        }
      };
    }
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: "Please complete the quiz and submit your answers.",
        error: {
          code: "AWAITING_INPUT",
          message: "User input required",
          recoverable: true
        }
      };
    }
    const result = await this.assessmentProvider.submitAnswer(
      assessmentId,
      context.userId,
      context.userInput
    );
    return {
      success: result.passed,
      outputs: [
        {
          name: "quiz_result",
          type: "result",
          value: result,
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          name: "quiz_score",
          type: "metric",
          value: result.score / result.maxScore,
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          name: "quiz_feedback",
          type: "feedback",
          value: result.feedback ?? "Quiz completed",
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.95,
        comprehension: result.score / result.maxScore,
        masteryGain: result.passed ? 0.15 : 0.05
      }
    };
  }
  async handlePracticeProblem(step, context) {
    if (!this.assessmentProvider || !this.aiProvider) {
      return this.createSimulatedResult(step, "practice_completed");
    }
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: "Please solve the practice problem.",
        error: {
          code: "AWAITING_INPUT",
          message: "User input required",
          recoverable: true
        }
      };
    }
    const analysis = await this.aiProvider.analyzeComprehension(
      step.description ?? step.title,
      String(context.userInput)
    );
    const passed = analysis.score >= 0.7;
    return {
      success: passed,
      outputs: [
        {
          name: "practice_analysis",
          type: "result",
          value: analysis,
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          name: "comprehension_score",
          type: "metric",
          value: analysis.score,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.9,
        comprehension: analysis.score,
        masteryGain: passed ? 0.1 : 0.03
      }
    };
  }
  // ============================================================================
  // REFLECTION HANDLERS
  // ============================================================================
  async handleReflect(step, context) {
    if (!this.aiProvider) {
      return this.createSimulatedResult(step, "reflection_completed");
    }
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: `Please reflect on: ${step.description ?? step.title}`,
        error: {
          code: "AWAITING_INPUT",
          message: "User reflection required",
          recoverable: true
        }
      };
    }
    const evaluation = await this.aiProvider.evaluateReflection(
      step.title,
      String(context.userInput)
    );
    const score = (evaluation.depth + evaluation.insightfulness + evaluation.connectionsToContent) / 3;
    return {
      success: score >= 0.5,
      outputs: [
        {
          name: "reflection",
          type: "artifact",
          value: context.userInput,
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          name: "reflection_evaluation",
          type: "result",
          value: evaluation,
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          name: "reflection_feedback",
          type: "feedback",
          value: evaluation.feedback,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.85,
        comprehension: score,
        masteryGain: 0.05
      }
    };
  }
  async handleSocraticDialogue(step, context) {
    if (!this.aiProvider) {
      return this.createSimulatedResult(step, "dialogue_completed");
    }
    const previousResponses = context.stepContext?.previousResults?.responses ?? [];
    const question = await this.aiProvider.generateSocraticQuestion(
      step.title,
      previousResponses
    );
    if (!context.userInput) {
      return {
        success: false,
        outputs: [
          {
            name: "socratic_question",
            type: "result",
            value: question,
            timestamp: /* @__PURE__ */ new Date()
          }
        ],
        userPrompt: question,
        error: {
          code: "AWAITING_INPUT",
          message: "Awaiting user response to Socratic question",
          recoverable: true
        }
      };
    }
    const analysis = await this.aiProvider.analyzeComprehension(
      question,
      String(context.userInput)
    );
    const dialogueRounds = previousResponses.length + 1;
    const isComplete = dialogueRounds >= 5 || analysis.score >= 0.9;
    return {
      success: isComplete,
      outputs: [
        {
          name: "dialogue_response",
          type: "result",
          value: {
            question,
            response: context.userInput,
            round: dialogueRounds
          },
          timestamp: /* @__PURE__ */ new Date()
        },
        {
          name: "comprehension_analysis",
          type: "result",
          value: analysis,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.95,
        comprehension: analysis.score,
        masteryGain: isComplete ? 0.2 : 0.05
      }
    };
  }
  // ============================================================================
  // REVIEW HANDLERS
  // ============================================================================
  async handleSpacedReview(step, context) {
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: `Review: ${step.description ?? step.title}. What do you remember about this topic?`,
        error: {
          code: "AWAITING_INPUT",
          message: "User recall required",
          recoverable: true
        }
      };
    }
    if (this.aiProvider) {
      const analysis = await this.aiProvider.analyzeComprehension(
        step.title,
        String(context.userInput)
      );
      return {
        success: analysis.score >= 0.6,
        outputs: [
          {
            name: "recall_attempt",
            type: "result",
            value: context.userInput,
            timestamp: /* @__PURE__ */ new Date()
          },
          {
            name: "recall_analysis",
            type: "result",
            value: analysis,
            timestamp: /* @__PURE__ */ new Date()
          }
        ],
        metrics: {
          engagement: 0.8,
          comprehension: analysis.score,
          masteryGain: analysis.score >= 0.8 ? 0.1 : 0.02
        }
      };
    }
    return this.createSimulatedResult(step, "review_completed");
  }
  async handleCreateSummary(step, context) {
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: `Create a summary of: ${step.description ?? step.title}`,
        error: {
          code: "AWAITING_INPUT",
          message: "User summary required",
          recoverable: true
        }
      };
    }
    let metrics = {
      engagement: 0.85,
      comprehension: 0.7,
      masteryGain: 0.08
    };
    if (this.aiProvider) {
      const evaluation = await this.aiProvider.evaluateReflection(
        step.title,
        String(context.userInput)
      );
      metrics = {
        engagement: 0.85,
        comprehension: evaluation.connectionsToContent,
        masteryGain: evaluation.depth >= 0.7 ? 0.1 : 0.05
      };
    }
    return {
      success: true,
      outputs: [
        {
          name: "summary",
          type: "artifact",
          value: context.userInput,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics
    };
  }
  // ============================================================================
  // COLLABORATIVE HANDLERS
  // ============================================================================
  async handlePeerDiscussion(step, context) {
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: `Discuss "${step.title}" with a peer. When done, share your key insights.`,
        error: {
          code: "AWAITING_INPUT",
          message: "Discussion completion required",
          recoverable: true
        }
      };
    }
    return {
      success: true,
      outputs: [
        {
          name: "discussion_insights",
          type: "artifact",
          value: context.userInput,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.95,
        comprehension: 0.8,
        masteryGain: 0.12
      }
    };
  }
  async handleProjectWork(step, context) {
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: `Work on your project: ${step.description ?? step.title}. Submit your progress when ready.`,
        error: {
          code: "AWAITING_INPUT",
          message: "Project submission required",
          recoverable: true
        }
      };
    }
    return {
      success: true,
      outputs: [
        {
          name: "project_artifact",
          type: "artifact",
          value: context.userInput,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 1,
        comprehension: 0.85,
        masteryGain: 0.2
      }
    };
  }
  async handleResearch(step, context) {
    if (!context.userInput) {
      return {
        success: false,
        outputs: [],
        userPrompt: `Research: ${step.description ?? step.title}. Document your findings.`,
        error: {
          code: "AWAITING_INPUT",
          message: "Research findings required",
          recoverable: true
        }
      };
    }
    return {
      success: true,
      outputs: [
        {
          name: "research_findings",
          type: "artifact",
          value: context.userInput,
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.9,
        comprehension: 0.8,
        masteryGain: 0.15
      }
    };
  }
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  createSimulatedResult(step, outputName) {
    return {
      success: true,
      outputs: [
        {
          name: outputName,
          type: "result",
          value: { stepId: step.id, simulated: true },
          timestamp: /* @__PURE__ */ new Date()
        }
      ],
      metrics: {
        engagement: 0.7,
        comprehension: 0.7,
        timeEfficiency: 1
      }
    };
  }
  async executeWithTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Step execution timed out")), timeoutMs)
      )
    ]);
  }
  buildStepResult(step, handlerResult, duration) {
    const metrics = {
      engagement: handlerResult.metrics?.engagement ?? 0.5,
      comprehension: handlerResult.metrics?.comprehension ?? 0.5,
      timeEfficiency: step.estimatedMinutes > 0 ? step.estimatedMinutes / Math.max(duration, 1) : 1,
      masteryGain: handlerResult.metrics?.masteryGain
    };
    return {
      stepId: step.id,
      success: handlerResult.success,
      completedAt: /* @__PURE__ */ new Date(),
      duration,
      outputs: handlerResult.outputs,
      metrics: this.enableMetrics ? metrics : void 0,
      error: handlerResult.error
    };
  }
};
function createStepExecutor(config) {
  return new StepExecutor(config);
}
function createStepExecutorFunction(executor) {
  return async (step, context) => {
    return executor.execute(step, context);
  };
}

// src/tool-registry/types.ts
var import_zod3 = require("zod");
var ToolCategory = {
  CONTENT: "content",
  ASSESSMENT: "assessment",
  COMMUNICATION: "communication",
  ANALYTICS: "analytics",
  SYSTEM: "system",
  EXTERNAL: "external"
};
var PermissionLevel = {
  READ: "read",
  WRITE: "write",
  EXECUTE: "execute",
  ADMIN: "admin"
};
var ConfirmationType = {
  NONE: "none",
  IMPLICIT: "implicit",
  EXPLICIT: "explicit",
  CRITICAL: "critical"
};
var AuditLogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical"
};
var ToolExecutionStatus = {
  PENDING: "pending",
  AWAITING_CONFIRMATION: "awaiting_confirmation",
  EXECUTING: "executing",
  SUCCESS: "success",
  FAILED: "failed",
  DENIED: "denied",
  CANCELLED: "cancelled",
  TIMEOUT: "timeout"
};
var ToolCategorySchema = import_zod3.z.enum([
  "content",
  "assessment",
  "communication",
  "analytics",
  "system",
  "external"
]);
var PermissionLevelSchema = import_zod3.z.enum(["read", "write", "execute", "admin"]);
var ConfirmationTypeSchema = import_zod3.z.enum(["none", "implicit", "explicit", "critical"]);
var ToolExecutionStatusSchema = import_zod3.z.enum([
  "pending",
  "awaiting_confirmation",
  "executing",
  "success",
  "failed",
  "denied",
  "cancelled",
  "timeout"
]);
var RateLimitSchema = import_zod3.z.object({
  maxCalls: import_zod3.z.number().int().min(1),
  windowMs: import_zod3.z.number().int().min(1e3),
  scope: import_zod3.z.enum(["global", "user", "session"])
});
var ToolExampleSchema = import_zod3.z.object({
  name: import_zod3.z.string().min(1),
  description: import_zod3.z.string(),
  input: import_zod3.z.unknown(),
  expectedOutput: import_zod3.z.unknown().optional()
});
var RegisterToolInputSchema = import_zod3.z.object({
  name: import_zod3.z.string().min(1).max(100),
  description: import_zod3.z.string().min(1).max(1e3),
  category: ToolCategorySchema,
  version: import_zod3.z.string().regex(/^\d+\.\d+\.\d+$/),
  requiredPermissions: import_zod3.z.array(PermissionLevelSchema).min(1),
  confirmationType: ConfirmationTypeSchema,
  timeoutMs: import_zod3.z.number().int().min(1e3).max(3e5).optional(),
  maxRetries: import_zod3.z.number().int().min(0).max(5).optional(),
  rateLimit: RateLimitSchema.optional(),
  tags: import_zod3.z.array(import_zod3.z.string()).optional(),
  examples: import_zod3.z.array(ToolExampleSchema).optional(),
  enabled: import_zod3.z.boolean().optional().default(true)
});
var InvokeToolInputSchema = import_zod3.z.object({
  toolId: import_zod3.z.string().min(1),
  input: import_zod3.z.unknown(),
  sessionId: import_zod3.z.string().min(1),
  skipConfirmation: import_zod3.z.boolean().optional(),
  metadata: import_zod3.z.record(import_zod3.z.unknown()).optional()
});

// src/tool-registry/tool-registry.ts
var import_zod4 = require("zod");
var ToolRegistry = class {
  toolStore;
  invocationStore;
  auditStore;
  permissionStore;
  confirmationStore;
  logger;
  defaultTimeoutMs;
  enableAuditLogging;
  rateLimitEnabled;
  // In-memory rate limit tracking
  rateLimitStates = /* @__PURE__ */ new Map();
  constructor(config) {
    this.toolStore = config.toolStore;
    this.invocationStore = config.invocationStore;
    this.auditStore = config.auditStore;
    this.permissionStore = config.permissionStore;
    this.confirmationStore = config.confirmationStore;
    this.logger = config.logger ?? console;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 3e4;
    this.enableAuditLogging = config.enableAuditLogging ?? true;
    this.rateLimitEnabled = config.rateLimitEnabled ?? true;
  }
  // ============================================================================
  // TOOL REGISTRATION
  // ============================================================================
  /**
   * Register a new tool
   */
  async register(tool) {
    this.logger.debug?.(`[ToolRegistry] Registering tool: ${tool.id}`);
    this.validateToolDefinition(tool);
    const existing = await this.toolStore.get(tool.id);
    if (existing) {
      throw new Error(`Tool already registered: ${tool.id}`);
    }
    await this.toolStore.register(tool);
    await this.audit({
      level: AuditLogLevel.INFO,
      userId: "system",
      sessionId: "system",
      action: "tool_registered",
      toolId: tool.id,
      metadata: {
        name: tool.name,
        category: tool.category,
        version: tool.version
      }
    });
  }
  /**
   * Update an existing tool
   */
  async update(toolId, updates) {
    this.logger.debug?.(`[ToolRegistry] Updating tool: ${toolId}`);
    const tool = await this.toolStore.update(toolId, updates);
    await this.audit({
      level: AuditLogLevel.INFO,
      userId: "system",
      sessionId: "system",
      action: "tool_updated",
      toolId,
      metadata: { updates: Object.keys(updates) }
    });
    return tool;
  }
  /**
   * Get a tool by ID
   */
  async getTool(toolId) {
    return this.toolStore.get(toolId);
  }
  /**
   * List tools with optional filtering
   */
  async listTools(options) {
    return this.toolStore.list(options);
  }
  /**
   * Enable a tool
   */
  async enableTool(toolId) {
    await this.toolStore.enable(toolId);
    await this.audit({
      level: AuditLogLevel.INFO,
      userId: "system",
      sessionId: "system",
      action: "tool_enabled",
      toolId
    });
  }
  /**
   * Disable a tool
   */
  async disableTool(toolId) {
    await this.toolStore.disable(toolId);
    await this.audit({
      level: AuditLogLevel.WARNING,
      userId: "system",
      sessionId: "system",
      action: "tool_disabled",
      toolId
    });
  }
  // ============================================================================
  // TOOL INVOCATION
  // ============================================================================
  /**
   * Invoke a tool
   */
  async invoke(toolId, input, context) {
    const requestId = this.generateId();
    this.logger.debug?.(`[ToolRegistry] Invoking tool: ${toolId} (request: ${requestId})`);
    const tool = await this.toolStore.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }
    if (!tool.enabled) {
      throw new Error(`Tool is disabled: ${toolId}`);
    }
    if (tool.deprecated) {
      this.logger.warn?.(`[ToolRegistry] Tool is deprecated: ${toolId} - ${tool.deprecationMessage}`);
    }
    let invocation = await this.invocationStore.create({
      toolId,
      userId: context.userId,
      sessionId: context.sessionId,
      input,
      status: ToolExecutionStatus.PENDING,
      confirmationType: tool.confirmationType,
      metadata: context.metadata
    });
    await this.audit({
      level: AuditLogLevel.INFO,
      userId: context.userId,
      sessionId: context.sessionId,
      action: "tool_invoked",
      toolId,
      invocationId: invocation.id,
      input,
      requestId
    });
    try {
      const validatedInput = await this.validateInput(tool, input);
      invocation = await this.invocationStore.update(invocation.id, { validatedInput });
      const permissionResult = await this.permissionStore.check(
        context.userId,
        toolId,
        tool.requiredPermissions
      );
      if (!permissionResult.granted) {
        await this.audit({
          level: AuditLogLevel.WARNING,
          userId: context.userId,
          sessionId: context.sessionId,
          action: "permission_denied",
          toolId,
          invocationId: invocation.id,
          metadata: {
            missingLevels: permissionResult.missingLevels,
            reason: permissionResult.reason
          }
        });
        return this.invocationStore.update(invocation.id, {
          status: ToolExecutionStatus.DENIED,
          result: {
            success: false,
            error: {
              code: "PERMISSION_DENIED",
              message: permissionResult.reason ?? "Insufficient permissions",
              recoverable: false
            }
          }
        });
      }
      if (this.rateLimitEnabled && tool.rateLimit) {
        const rateLimitKey = this.getRateLimitKey(tool, context);
        if (!this.checkRateLimit(tool, rateLimitKey)) {
          await this.audit({
            level: AuditLogLevel.WARNING,
            userId: context.userId,
            sessionId: context.sessionId,
            action: "rate_limit_exceeded",
            toolId,
            invocationId: invocation.id
          });
          return this.invocationStore.update(invocation.id, {
            status: ToolExecutionStatus.DENIED,
            result: {
              success: false,
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Rate limit exceeded for this tool",
                recoverable: true
              }
            }
          });
        }
      }
      if (this.requiresConfirmation(tool, context.skipConfirmation)) {
        invocation = await this.requestConfirmation(tool, invocation);
        if (invocation.status === ToolExecutionStatus.AWAITING_CONFIRMATION) {
          return invocation;
        }
        if (invocation.status === ToolExecutionStatus.CANCELLED) {
          return invocation;
        }
      }
      return this.executeTool(tool, invocation, permissionResult.grantedLevels, requestId);
    } catch (error) {
      return this.invocationStore.update(invocation.id, {
        status: ToolExecutionStatus.FAILED,
        result: {
          success: false,
          error: {
            code: "INVOCATION_ERROR",
            message: error.message,
            recoverable: false
          }
        }
      });
    }
  }
  /**
   * Respond to a confirmation request
   */
  async respondToConfirmation(confirmationId, confirmed, userId) {
    const confirmation = await this.confirmationStore.get(confirmationId);
    if (!confirmation) {
      throw new Error(`Confirmation not found: ${confirmationId}`);
    }
    if (confirmation.userId !== userId) {
      throw new Error("Unauthorized to respond to this confirmation");
    }
    if (confirmation.status !== "pending") {
      throw new Error(`Confirmation already ${confirmation.status}`);
    }
    await this.confirmationStore.respond(confirmationId, confirmed);
    const invocation = await this.invocationStore.get(confirmation.invocationId);
    if (!invocation) {
      throw new Error(`Invocation not found: ${confirmation.invocationId}`);
    }
    await this.audit({
      level: AuditLogLevel.INFO,
      userId,
      sessionId: invocation.sessionId,
      action: confirmed ? "confirmation_granted" : "confirmation_denied",
      toolId: invocation.toolId,
      invocationId: invocation.id
    });
    if (!confirmed) {
      return this.invocationStore.update(invocation.id, {
        status: ToolExecutionStatus.CANCELLED,
        userConfirmed: false,
        result: {
          success: false,
          error: {
            code: "USER_CANCELLED",
            message: "User declined the action",
            recoverable: false
          }
        }
      });
    }
    const tool = await this.toolStore.get(invocation.toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${invocation.toolId}`);
    }
    const permissionResult = await this.permissionStore.check(
      userId,
      invocation.toolId,
      tool.requiredPermissions
    );
    return this.executeTool(
      tool,
      await this.invocationStore.update(invocation.id, {
        userConfirmed: true,
        confirmedAt: /* @__PURE__ */ new Date()
      }),
      permissionResult.grantedLevels,
      this.generateId()
    );
  }
  /**
   * Get pending confirmations for a user
   */
  async getPendingConfirmations(userId) {
    return this.confirmationStore.getPending(userId);
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  validateToolDefinition(tool) {
    if (!tool.id || !tool.name || !tool.handler) {
      throw new Error("Tool must have id, name, and handler");
    }
    if (!tool.inputSchema) {
      throw new Error("Tool must have an input schema");
    }
    if (tool.requiredPermissions.length === 0) {
      throw new Error("Tool must require at least one permission level");
    }
  }
  async validateInput(tool, input) {
    try {
      return tool.inputSchema.parse(input);
    } catch (error) {
      if (error instanceof import_zod4.z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(", ")}`);
      }
      throw error;
    }
  }
  requiresConfirmation(tool, skipConfirmation) {
    if (skipConfirmation && tool.confirmationType !== ConfirmationType.CRITICAL) {
      return false;
    }
    return tool.confirmationType === ConfirmationType.EXPLICIT || tool.confirmationType === ConfirmationType.CRITICAL;
  }
  async requestConfirmation(tool, invocation) {
    const confirmationRequest = await this.confirmationStore.create({
      invocationId: invocation.id,
      toolId: tool.id,
      toolName: tool.name,
      userId: invocation.userId,
      title: `Confirm: ${tool.name}`,
      message: this.generateConfirmationMessage(tool, invocation),
      type: tool.confirmationType,
      severity: this.getConfirmationSeverity(tool.confirmationType),
      status: "pending",
      expiresAt: new Date(Date.now() + 3e5)
      // 5 minutes
    });
    await this.audit({
      level: AuditLogLevel.INFO,
      userId: invocation.userId,
      sessionId: invocation.sessionId,
      action: "confirmation_requested",
      toolId: tool.id,
      invocationId: invocation.id
    });
    return this.invocationStore.update(invocation.id, {
      status: ToolExecutionStatus.AWAITING_CONFIRMATION,
      confirmationPrompt: confirmationRequest.message
    });
  }
  generateConfirmationMessage(tool, invocation) {
    const inputSummary = JSON.stringify(invocation.input, null, 2).slice(0, 200);
    return `The AI assistant wants to execute "${tool.name}".

Description: ${tool.description}

Input: ${inputSummary}...

Do you want to proceed?`;
  }
  getConfirmationSeverity(type) {
    switch (type) {
      case ConfirmationType.IMPLICIT:
        return "low";
      case ConfirmationType.EXPLICIT:
        return "medium";
      case ConfirmationType.CRITICAL:
        return "critical";
      default:
        return "low";
    }
  }
  async executeTool(tool, invocation, grantedPermissions, requestId) {
    const startTime = Date.now();
    invocation = await this.invocationStore.update(invocation.id, {
      status: ToolExecutionStatus.EXECUTING,
      startedAt: /* @__PURE__ */ new Date()
    });
    await this.audit({
      level: AuditLogLevel.INFO,
      userId: invocation.userId,
      sessionId: invocation.sessionId,
      action: "execution_started",
      toolId: tool.id,
      invocationId: invocation.id,
      requestId
    });
    try {
      const previousCalls = await this.getPreviousCalls(invocation.sessionId);
      const context = {
        userId: invocation.userId,
        sessionId: invocation.sessionId,
        requestId,
        grantedPermissions,
        userConfirmed: invocation.userConfirmed ?? false,
        previousCalls,
        metadata: invocation.metadata
      };
      const timeoutMs = tool.timeoutMs ?? this.defaultTimeoutMs;
      const result = await this.executeWithTimeout(
        tool.handler(invocation.validatedInput ?? invocation.input, context),
        timeoutMs
      );
      const duration = Date.now() - startTime;
      if (result.success && tool.outputSchema && result.output) {
        try {
          tool.outputSchema.parse(result.output);
        } catch (error) {
          this.logger.warn?.(`[ToolRegistry] Output validation failed for ${tool.id}`);
        }
      }
      await this.audit({
        level: result.success ? AuditLogLevel.INFO : AuditLogLevel.ERROR,
        userId: invocation.userId,
        sessionId: invocation.sessionId,
        action: result.success ? "execution_success" : "execution_failed",
        toolId: tool.id,
        invocationId: invocation.id,
        output: result.output,
        error: result.error,
        requestId,
        metadata: { duration }
      });
      return this.invocationStore.update(invocation.id, {
        status: result.success ? ToolExecutionStatus.SUCCESS : ToolExecutionStatus.FAILED,
        completedAt: /* @__PURE__ */ new Date(),
        duration,
        result
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const isTimeout = error.message.includes("timeout");
      await this.audit({
        level: AuditLogLevel.ERROR,
        userId: invocation.userId,
        sessionId: invocation.sessionId,
        action: isTimeout ? "execution_timeout" : "execution_failed",
        toolId: tool.id,
        invocationId: invocation.id,
        error: {
          code: isTimeout ? "TIMEOUT" : "EXECUTION_ERROR",
          message: error.message,
          recoverable: true
        },
        requestId,
        metadata: { duration }
      });
      return this.invocationStore.update(invocation.id, {
        status: isTimeout ? ToolExecutionStatus.TIMEOUT : ToolExecutionStatus.FAILED,
        completedAt: /* @__PURE__ */ new Date(),
        duration,
        result: {
          success: false,
          error: {
            code: isTimeout ? "TIMEOUT" : "EXECUTION_ERROR",
            message: error.message,
            recoverable: true
          }
        }
      });
    }
  }
  async executeWithTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Tool execution timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }
  async getPreviousCalls(sessionId) {
    const invocations = await this.invocationStore.getBySession(sessionId, 10);
    return invocations.filter((inv) => inv.status === ToolExecutionStatus.SUCCESS).map((inv) => ({
      toolId: inv.toolId,
      timestamp: inv.completedAt ?? inv.createdAt,
      success: inv.result?.success ?? false,
      outputSummary: inv.result?.output ? JSON.stringify(inv.result.output).slice(0, 100) : void 0
    }));
  }
  getRateLimitKey(tool, context) {
    const scope = tool.rateLimit?.scope ?? "user";
    switch (scope) {
      case "global":
        return `${tool.id}:global`;
      case "session":
        return `${tool.id}:${context.sessionId}`;
      case "user":
      default:
        return `${tool.id}:${context.userId}`;
    }
  }
  checkRateLimit(tool, key) {
    if (!tool.rateLimit) return true;
    const now = Date.now();
    const state = this.rateLimitStates.get(key);
    if (!state || now - state.windowStart > tool.rateLimit.windowMs) {
      this.rateLimitStates.set(key, { count: 1, windowStart: now });
      return true;
    }
    if (state.count >= tool.rateLimit.maxCalls) {
      return false;
    }
    state.count++;
    return true;
  }
  async audit(entry) {
    if (!this.enableAuditLogging) return;
    try {
      await this.auditStore.log(entry);
    } catch (error) {
      this.logger.error?.(`[ToolRegistry] Audit logging failed: ${error.message}`);
    }
  }
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
};
function createToolRegistry(config) {
  return new ToolRegistry(config);
}

// src/tool-registry/stores.ts
var InMemoryToolStore = class {
  tools = /* @__PURE__ */ new Map();
  async register(tool) {
    this.tools.set(tool.id, { ...tool });
  }
  async get(toolId) {
    const tool = this.tools.get(toolId);
    return tool ? { ...tool } : null;
  }
  async list(options) {
    let tools = Array.from(this.tools.values());
    if (options?.category) {
      tools = tools.filter((t) => t.category === options.category);
    }
    if (options?.tags?.length) {
      tools = tools.filter(
        (t) => options.tags?.some((tag) => t.tags?.includes(tag))
      );
    }
    if (options?.enabled !== void 0) {
      tools = tools.filter((t) => t.enabled === options.enabled);
    }
    if (options?.deprecated !== void 0) {
      tools = tools.filter((t) => (t.deprecated ?? false) === options.deprecated);
    }
    if (options?.search) {
      const search = options.search.toLowerCase();
      tools = tools.filter(
        (t) => t.name.toLowerCase().includes(search) || t.description.toLowerCase().includes(search)
      );
    }
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? tools.length;
    return tools.slice(offset, offset + limit).map((t) => ({ ...t }));
  }
  async update(toolId, updates) {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }
    const updated = { ...tool, ...updates };
    this.tools.set(toolId, updated);
    return { ...updated };
  }
  async delete(toolId) {
    this.tools.delete(toolId);
  }
  async enable(toolId) {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.enabled = true;
    }
  }
  async disable(toolId) {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.enabled = false;
    }
  }
  // Helper for testing
  clear() {
    this.tools.clear();
  }
};
var InMemoryInvocationStore = class {
  invocations = /* @__PURE__ */ new Map();
  counter = 0;
  async create(data) {
    const id = `inv_${++this.counter}`;
    const now = /* @__PURE__ */ new Date();
    const invocation = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.invocations.set(id, invocation);
    return { ...invocation };
  }
  async get(invocationId) {
    const inv = this.invocations.get(invocationId);
    return inv ? { ...inv } : null;
  }
  async update(invocationId, updates) {
    const inv = this.invocations.get(invocationId);
    if (!inv) {
      throw new Error(`Invocation not found: ${invocationId}`);
    }
    const updated = {
      ...inv,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.invocations.set(invocationId, updated);
    return { ...updated };
  }
  async getBySession(sessionId, limit) {
    const invocations = Array.from(this.invocations.values()).filter((inv) => inv.sessionId === sessionId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? invocations.slice(0, limit) : invocations;
  }
  async getByUser(userId, options) {
    const invocations = Array.from(this.invocations.values()).filter((inv) => inv.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? invocations.length;
    return invocations.slice(offset, offset + limit);
  }
  // Helper for testing
  clear() {
    this.invocations.clear();
    this.counter = 0;
  }
};
var InMemoryAuditStore = class {
  entries = [];
  counter = 0;
  async log(entry) {
    const logEntry = {
      ...entry,
      id: `audit_${++this.counter}`,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.entries.push(logEntry);
    return { ...logEntry };
  }
  async query(options) {
    let entries = [...this.entries];
    if (options.userId) {
      entries = entries.filter((e) => e.userId === options.userId);
    }
    if (options.toolId) {
      entries = entries.filter((e) => e.toolId === options.toolId);
    }
    if (options.action?.length) {
      entries = entries.filter((e) => options.action?.includes(e.action));
    }
    if (options.level?.length) {
      entries = entries.filter((e) => options.level?.includes(e.level));
    }
    if (options.startDate) {
      entries = entries.filter((e) => e.timestamp >= options.startDate);
    }
    if (options.endDate) {
      entries = entries.filter((e) => e.timestamp <= options.endDate);
    }
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const offset = options.offset ?? 0;
    const limit = options.limit ?? entries.length;
    return entries.slice(offset, offset + limit);
  }
  async count(options) {
    const entries = await this.query({ ...options, limit: void 0, offset: void 0 });
    return entries.length;
  }
  // Helper for testing
  clear() {
    this.entries = [];
    this.counter = 0;
  }
  getAll() {
    return [...this.entries];
  }
};
var InMemoryPermissionStore = class {
  permissions = [];
  async grant(permission) {
    const fullPermission = {
      ...permission,
      grantedAt: /* @__PURE__ */ new Date()
    };
    this.permissions = this.permissions.filter(
      (p) => !(p.userId === permission.userId && p.toolId === permission.toolId && p.category === permission.category)
    );
    this.permissions.push(fullPermission);
    return { ...fullPermission };
  }
  async revoke(userId, toolId, category) {
    this.permissions = this.permissions.filter((p) => {
      if (p.userId !== userId) return true;
      if (toolId && p.toolId !== toolId) return true;
      if (category && p.category !== category) return true;
      return false;
    });
  }
  async check(userId, toolId, requiredLevels) {
    const now = /* @__PURE__ */ new Date();
    const userPermissions = this.permissions.filter((p) => {
      if (p.userId !== userId) return false;
      if (p.expiresAt && p.expiresAt < now) return false;
      if (p.toolId && p.toolId !== toolId) return false;
      return true;
    });
    const grantedLevels = /* @__PURE__ */ new Set();
    for (const perm of userPermissions) {
      for (const level of perm.levels) {
        grantedLevels.add(level);
      }
    }
    const missingLevels = requiredLevels.filter((level) => !grantedLevels.has(level));
    return {
      granted: missingLevels.length === 0,
      grantedLevels: Array.from(grantedLevels),
      missingLevels,
      reason: missingLevels.length > 0 ? `Missing permissions: ${missingLevels.join(", ")}` : void 0
    };
  }
  async getUserPermissions(userId) {
    const now = /* @__PURE__ */ new Date();
    return this.permissions.filter((p) => p.userId === userId && (!p.expiresAt || p.expiresAt > now)).map((p) => ({ ...p }));
  }
  // Helper for testing
  clear() {
    this.permissions = [];
  }
};
var InMemoryConfirmationStore = class {
  confirmations = /* @__PURE__ */ new Map();
  counter = 0;
  async create(request) {
    const id = `conf_${++this.counter}`;
    const confirmation = {
      ...request,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.confirmations.set(id, confirmation);
    return { ...confirmation };
  }
  async get(requestId) {
    const conf = this.confirmations.get(requestId);
    return conf ? { ...conf } : null;
  }
  async getByInvocation(invocationId) {
    for (const conf of this.confirmations.values()) {
      if (conf.invocationId === invocationId) {
        return { ...conf };
      }
    }
    return null;
  }
  async respond(requestId, confirmed) {
    const conf = this.confirmations.get(requestId);
    if (!conf) {
      throw new Error(`Confirmation not found: ${requestId}`);
    }
    conf.status = confirmed ? "confirmed" : "denied";
    conf.respondedAt = /* @__PURE__ */ new Date();
    return { ...conf };
  }
  async getPending(userId) {
    const now = /* @__PURE__ */ new Date();
    return Array.from(this.confirmations.values()).filter(
      (c) => c.userId === userId && c.status === "pending" && (!c.expiresAt || c.expiresAt > now)
    ).map((c) => ({ ...c }));
  }
  // Helper for testing
  clear() {
    this.confirmations.clear();
    this.counter = 0;
  }
};
function createInMemoryStores() {
  return {
    toolStore: new InMemoryToolStore(),
    invocationStore: new InMemoryInvocationStore(),
    auditStore: new InMemoryAuditStore(),
    permissionStore: new InMemoryPermissionStore(),
    confirmationStore: new InMemoryConfirmationStore()
  };
}

// src/tool-registry/permission-manager.ts
var UserRole = {
  STUDENT: "student",
  MENTOR: "mentor",
  INSTRUCTOR: "instructor",
  ADMIN: "admin"
};
var DEFAULT_ROLE_PERMISSIONS = [
  {
    role: UserRole.STUDENT,
    defaultPermissions: {
      global: [PermissionLevel.READ],
      byCategory: {
        content: [PermissionLevel.READ],
        assessment: [PermissionLevel.READ, PermissionLevel.EXECUTE],
        communication: [PermissionLevel.READ, PermissionLevel.WRITE],
        analytics: [PermissionLevel.READ]
      }
    }
  },
  {
    role: UserRole.MENTOR,
    defaultPermissions: {
      global: [PermissionLevel.READ, PermissionLevel.EXECUTE],
      byCategory: {
        content: [PermissionLevel.READ, PermissionLevel.WRITE],
        assessment: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        communication: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        analytics: [PermissionLevel.READ, PermissionLevel.EXECUTE],
        system: [PermissionLevel.READ]
      }
    }
  },
  {
    role: UserRole.INSTRUCTOR,
    defaultPermissions: {
      global: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
      byCategory: {
        content: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        assessment: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        communication: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        analytics: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.EXECUTE],
        system: [PermissionLevel.READ, PermissionLevel.EXECUTE],
        external: [PermissionLevel.READ, PermissionLevel.EXECUTE]
      }
    }
  },
  {
    role: UserRole.ADMIN,
    defaultPermissions: {
      global: [
        PermissionLevel.READ,
        PermissionLevel.WRITE,
        PermissionLevel.EXECUTE,
        PermissionLevel.ADMIN
      ]
    }
  }
];
var PermissionManager = class {
  store;
  logger;
  enableConditions;
  permissionCache;
  cacheTimeoutMs;
  constructor(config) {
    this.store = config.permissionStore;
    this.logger = config.logger ?? console;
    this.enableConditions = config.enableConditions ?? true;
    this.cacheTimeoutMs = config.cacheTimeoutMs ?? 6e4;
    this.permissionCache = /* @__PURE__ */ new Map();
  }
  // ==========================================================================
  // PERMISSION CHECKING
  // ==========================================================================
  /**
   * Check if a user has permission to execute a specific tool
   */
  async checkToolPermission(userId, tool) {
    const cacheKey = `${userId}:${tool.id}`;
    const cached = this.getCachedPermission(cacheKey);
    if (cached) {
      this.logger.debug(`Permission cache hit for ${cacheKey}`);
      return cached;
    }
    const result = await this.store.check(userId, tool.id, tool.requiredPermissions);
    if (this.enableConditions && result.granted) {
      const userPermissions = await this.store.getUserPermissions(userId);
      const relevantPermission = userPermissions.find(
        (p) => p.toolId === tool.id || p.category === tool.category || !p.toolId && !p.category
      );
      if (relevantPermission?.conditions?.length) {
        const conditionsPass = this.evaluateConditions(relevantPermission.conditions);
        if (!conditionsPass) {
          const failedResult = {
            granted: false,
            grantedLevels: [],
            missingLevels: tool.requiredPermissions,
            reason: "Permission conditions not met"
          };
          this.cachePermission(cacheKey, failedResult);
          return failedResult;
        }
      }
    }
    this.cachePermission(cacheKey, result);
    return result;
  }
  /**
   * Check if a user has specific permission levels
   */
  async hasPermission(userId, levels, toolId, category) {
    const userPermissions = await this.store.getUserPermissions(userId);
    for (const level of levels) {
      const hasLevel = userPermissions.some((p) => {
        if (p.expiresAt && p.expiresAt < /* @__PURE__ */ new Date()) {
          return false;
        }
        const appliesToTool = !toolId || p.toolId === toolId || !p.toolId;
        const appliesToCategory = !category || p.category === category || !p.category;
        const hasPermissionLevel = p.levels.includes(level);
        return appliesToTool && appliesToCategory && hasPermissionLevel;
      });
      if (!hasLevel) {
        return false;
      }
    }
    return true;
  }
  /**
   * Check if a user has admin permission
   */
  async isAdmin(userId) {
    return this.hasPermission(userId, [PermissionLevel.ADMIN]);
  }
  // ==========================================================================
  // PERMISSION GRANTING
  // ==========================================================================
  /**
   * Grant permissions to a user
   */
  async grantPermission(userId, levels, options) {
    this.logger.info(`Granting permissions to user ${userId}`, {
      levels,
      toolId: options?.toolId,
      category: options?.category
    });
    const permission = await this.store.grant({
      userId,
      toolId: options?.toolId,
      category: options?.category,
      levels,
      grantedBy: options?.grantedBy,
      expiresAt: options?.expiresAt,
      conditions: options?.conditions
    });
    this.invalidateUserCache(userId);
    return permission;
  }
  /**
   * Grant multiple permissions in batch
   */
  async grantBatch(grants) {
    const results = [];
    for (const grant of grants) {
      const permission = await this.grantPermission(grant.userId, grant.levels, {
        toolId: grant.toolId,
        category: grant.category,
        ...grant.options
      });
      results.push(permission);
    }
    return results;
  }
  /**
   * Set default permissions for a user based on their role
   */
  async setRolePermissions(userId, role, grantedBy) {
    const roleMapping = DEFAULT_ROLE_PERMISSIONS.find((m) => m.role === role);
    if (!roleMapping) {
      throw new Error(`Unknown role: ${role}`);
    }
    const grants = [];
    if (roleMapping.defaultPermissions.global) {
      grants.push({
        userId,
        levels: roleMapping.defaultPermissions.global,
        options: { grantedBy }
      });
    }
    if (roleMapping.defaultPermissions.byCategory) {
      for (const [category, levels] of Object.entries(roleMapping.defaultPermissions.byCategory)) {
        if (levels) {
          grants.push({
            userId,
            category,
            levels,
            options: { grantedBy }
          });
        }
      }
    }
    if (roleMapping.defaultPermissions.byTool) {
      for (const [toolId, levels] of Object.entries(roleMapping.defaultPermissions.byTool)) {
        grants.push({
          userId,
          toolId,
          levels,
          options: { grantedBy }
        });
      }
    }
    return this.grantBatch(grants);
  }
  // ==========================================================================
  // PERMISSION REVOCATION
  // ==========================================================================
  /**
   * Revoke permissions from a user
   */
  async revokePermission(userId, toolId, category) {
    this.logger.info(`Revoking permissions from user ${userId}`, {
      toolId,
      category
    });
    await this.store.revoke(userId, toolId, category);
    this.invalidateUserCache(userId);
  }
  /**
   * Revoke all permissions from a user
   */
  async revokeAll(userId) {
    this.logger.info(`Revoking all permissions from user ${userId}`);
    await this.store.revoke(userId);
    this.invalidateUserCache(userId);
  }
  // ==========================================================================
  // PERMISSION QUERIES
  // ==========================================================================
  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId) {
    return this.store.getUserPermissions(userId);
  }
  /**
   * Get effective permissions for a user on a specific tool
   */
  async getEffectivePermissions(userId, tool) {
    const userPermissions = await this.store.getUserPermissions(userId);
    const effectiveLevels = /* @__PURE__ */ new Set();
    for (const permission of userPermissions) {
      if (permission.expiresAt && permission.expiresAt < /* @__PURE__ */ new Date()) {
        continue;
      }
      const appliesToTool = permission.toolId === tool.id || permission.category === tool.category || !permission.toolId && !permission.category;
      if (appliesToTool) {
        if (this.enableConditions && permission.conditions?.length) {
          if (!this.evaluateConditions(permission.conditions)) {
            continue;
          }
        }
        for (const level of permission.levels) {
          effectiveLevels.add(level);
        }
      }
    }
    return Array.from(effectiveLevels);
  }
  /**
   * Get list of tools a user can access
   */
  async getAccessibleTools(userId, availableTools) {
    const accessibleTools = [];
    for (const tool of availableTools) {
      const result = await this.checkToolPermission(userId, tool);
      if (result.granted) {
        accessibleTools.push(tool);
      }
    }
    return accessibleTools;
  }
  // ==========================================================================
  // CONDITION EVALUATION
  // ==========================================================================
  /**
   * Evaluate permission conditions
   */
  evaluateConditions(conditions) {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Evaluate a single permission condition
   */
  evaluateCondition(condition) {
    const now = /* @__PURE__ */ new Date();
    switch (condition.type) {
      case "time_of_day": {
        const value = condition.value;
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const startTime = this.parseTime(value.start);
        const endTime = this.parseTime(value.end);
        return currentTime >= startTime && currentTime <= endTime;
      }
      case "day_of_week": {
        const allowedDays = condition.value;
        return allowedDays.includes(now.getDay());
      }
      case "max_calls": {
        return true;
      }
      case "input_match": {
        return true;
      }
      default:
        this.logger.warn(`Unknown condition type: ${condition.type}`);
        return true;
    }
  }
  /**
   * Parse time string (HH:MM) to number (HHMM)
   */
  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 100 + minutes;
  }
  // ==========================================================================
  // CACHING
  // ==========================================================================
  /**
   * Get cached permission result
   */
  getCachedPermission(key) {
    const cached = this.permissionCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    if (cached) {
      this.permissionCache.delete(key);
    }
    return null;
  }
  /**
   * Cache a permission result
   */
  cachePermission(key, result) {
    this.permissionCache.set(key, {
      result,
      expiresAt: Date.now() + this.cacheTimeoutMs
    });
  }
  /**
   * Invalidate cache entries for a user
   */
  invalidateUserCache(userId) {
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key);
      }
    }
  }
  /**
   * Clear all cached permissions
   */
  clearCache() {
    this.permissionCache.clear();
    this.logger.debug("Permission cache cleared");
  }
};
function createPermissionManager(config) {
  return new PermissionManager(config);
}

// src/tool-registry/audit-logger.ts
var LOG_LEVEL_ORDER = {
  [AuditLogLevel.DEBUG]: 0,
  [AuditLogLevel.INFO]: 1,
  [AuditLogLevel.WARNING]: 2,
  [AuditLogLevel.ERROR]: 3,
  [AuditLogLevel.CRITICAL]: 4
};
var AuditLogger = class {
  store;
  logger;
  minLevel;
  includePayloads;
  maxPayloadSize;
  serviceName;
  constructor(config) {
    this.store = config.auditStore;
    this.logger = config.logger ?? console;
    this.minLevel = config.minLevel ?? AuditLogLevel.INFO;
    this.includePayloads = config.includePayloads ?? false;
    this.maxPayloadSize = config.maxPayloadSize ?? 1e4;
    this.serviceName = config.serviceName ?? "sam-ai-agentic";
  }
  // ==========================================================================
  // CORE LOGGING METHODS
  // ==========================================================================
  /**
   * Log a tool-related action
   */
  async log(level, action, context, details) {
    if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[this.minLevel]) {
      return null;
    }
    const entry = {
      level,
      action,
      userId: context.userId,
      sessionId: context.sessionId,
      toolId: details?.toolId,
      invocationId: details?.invocationId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        ...context.metadata,
        serviceName: this.serviceName
      }
    };
    if (this.includePayloads) {
      entry.input = this.truncatePayload(details?.input);
      entry.output = this.truncatePayload(details?.output);
    }
    if (details?.error) {
      entry.error = details.error;
    }
    try {
      const logged = await this.store.log(entry);
      this.logger.debug(`Audit log created: ${action}`, { entryId: logged.id });
      return logged;
    } catch (error) {
      this.logger.error("Failed to create audit log", { error, action });
      return null;
    }
  }
  /**
   * Log debug level
   */
  async debug(action, context, details) {
    return this.log(AuditLogLevel.DEBUG, action, context, details);
  }
  /**
   * Log info level
   */
  async info(action, context, details) {
    return this.log(AuditLogLevel.INFO, action, context, details);
  }
  /**
   * Log warning level
   */
  async warn(action, context, details) {
    return this.log(AuditLogLevel.WARNING, action, context, details);
  }
  /**
   * Log error level
   */
  async error(action, context, details) {
    return this.log(AuditLogLevel.ERROR, action, context, details);
  }
  /**
   * Log critical level
   */
  async critical(action, context, details) {
    return this.log(AuditLogLevel.CRITICAL, action, context, details);
  }
  // ==========================================================================
  // TOOL LIFECYCLE LOGGING
  // ==========================================================================
  /**
   * Log tool registration
   */
  async logToolRegistered(tool, context) {
    return this.info("tool_registered", context, {
      toolId: tool.id,
      input: {
        name: tool.name,
        category: tool.category,
        version: tool.version
      }
    });
  }
  /**
   * Log tool invocation
   */
  async logToolInvoked(invocation, context) {
    return this.info("tool_invoked", context, {
      toolId: invocation.toolId,
      invocationId: invocation.id,
      input: invocation.input
    });
  }
  /**
   * Log execution start
   */
  async logExecutionStarted(invocation, context) {
    return this.info("execution_started", context, {
      toolId: invocation.toolId,
      invocationId: invocation.id
    });
  }
  /**
   * Log successful execution
   */
  async logExecutionSuccess(invocation, context) {
    return this.info("execution_success", context, {
      toolId: invocation.toolId,
      invocationId: invocation.id,
      output: invocation.result?.output
    });
  }
  /**
   * Log failed execution
   */
  async logExecutionFailed(invocation, error, context) {
    return this.error("execution_failed", context, {
      toolId: invocation.toolId,
      invocationId: invocation.id,
      error
    });
  }
  /**
   * Log permission denied
   */
  async logPermissionDenied(toolId, reason, context) {
    return this.warn("permission_denied", context, {
      toolId,
      error: {
        code: "PERMISSION_DENIED",
        message: reason,
        recoverable: false
      }
    });
  }
  /**
   * Log confirmation request
   */
  async logConfirmationRequested(invocation, context) {
    return this.info("confirmation_requested", context, {
      toolId: invocation.toolId,
      invocationId: invocation.id
    });
  }
  /**
   * Log confirmation granted
   */
  async logConfirmationGranted(invocation, context) {
    return this.info("confirmation_granted", context, {
      toolId: invocation.toolId,
      invocationId: invocation.id
    });
  }
  /**
   * Log confirmation denied
   */
  async logConfirmationDenied(invocation, context) {
    return this.warn("confirmation_denied", context, {
      toolId: invocation.toolId,
      invocationId: invocation.id
    });
  }
  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(toolId, context) {
    return this.warn("rate_limit_exceeded", context, {
      toolId,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Tool rate limit exceeded",
        recoverable: true
      }
    });
  }
  // ==========================================================================
  // QUERYING
  // ==========================================================================
  /**
   * Query audit logs
   */
  async query(options) {
    return this.store.query(options);
  }
  /**
   * Count audit logs matching criteria
   */
  async count(options) {
    return this.store.count(options);
  }
  /**
   * Get recent logs for a user
   */
  async getRecentUserActivity(userId, limit = 100) {
    return this.store.query({
      userId,
      limit
    });
  }
  /**
   * Get recent logs for a tool
   */
  async getRecentToolActivity(toolId, limit = 100) {
    return this.store.query({
      toolId,
      limit
    });
  }
  /**
   * Get errors within a time range
   */
  async getErrors(startDate, endDate, limit) {
    return this.store.query({
      level: [AuditLogLevel.ERROR, AuditLogLevel.CRITICAL],
      startDate,
      endDate,
      limit
    });
  }
  // ==========================================================================
  // REPORTING
  // ==========================================================================
  /**
   * Generate a summary report for a time period
   */
  async generateSummaryReport(startDate, endDate) {
    const entries = await this.store.query({ startDate, endDate });
    const byLevel = {
      [AuditLogLevel.DEBUG]: 0,
      [AuditLogLevel.INFO]: 0,
      [AuditLogLevel.WARNING]: 0,
      [AuditLogLevel.ERROR]: 0,
      [AuditLogLevel.CRITICAL]: 0
    };
    const byAction = {};
    const toolCounts = {};
    const userCounts = {};
    let errorCount = 0;
    for (const entry of entries) {
      byLevel[entry.level]++;
      if (!byAction[entry.action]) {
        byAction[entry.action] = 0;
      }
      byAction[entry.action]++;
      if (entry.toolId) {
        toolCounts[entry.toolId] = (toolCounts[entry.toolId] || 0) + 1;
      }
      userCounts[entry.userId] = (userCounts[entry.userId] || 0) + 1;
      if (entry.level === AuditLogLevel.ERROR || entry.level === AuditLogLevel.CRITICAL) {
        errorCount++;
      }
    }
    const topTools = Object.entries(toolCounts).map(([toolId, count]) => ({ toolId, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const topUsers = Object.entries(userCounts).map(([userId, count]) => ({ userId, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    return {
      period: { startDate, endDate },
      totalEntries: entries.length,
      byLevel,
      byAction,
      topTools,
      topUsers,
      errorRate: entries.length > 0 ? errorCount / entries.length : 0
    };
  }
  /**
   * Generate a user activity report
   */
  async generateUserActivityReport(userId, startDate, endDate) {
    const entries = await this.store.query({ userId, startDate, endDate });
    const toolsUsed = /* @__PURE__ */ new Set();
    let successfulExecutions = 0;
    let failedExecutions = 0;
    let deniedExecutions = 0;
    for (const entry of entries) {
      if (entry.toolId) {
        toolsUsed.add(entry.toolId);
      }
      switch (entry.action) {
        case "execution_success":
          successfulExecutions++;
          break;
        case "execution_failed":
        case "execution_timeout":
          failedExecutions++;
          break;
        case "permission_denied":
        case "confirmation_denied":
          deniedExecutions++;
          break;
      }
    }
    return {
      userId,
      period: { startDate, endDate },
      totalActions: entries.length,
      toolsUsed: Array.from(toolsUsed),
      successfulExecutions,
      failedExecutions,
      deniedExecutions,
      recentActivity: entries.slice(0, 20)
    };
  }
  /**
   * Generate a tool usage report
   */
  async generateToolUsageReport(toolId, startDate, endDate) {
    const entries = await this.store.query({ toolId, startDate, endDate });
    const uniqueUsers = /* @__PURE__ */ new Set();
    let successCount = 0;
    let totalCount = 0;
    const errorBreakdown = {};
    const usageByDay = {};
    for (const entry of entries) {
      uniqueUsers.add(entry.userId);
      if (entry.action === "execution_success") {
        successCount++;
        totalCount++;
      } else if (entry.action === "execution_failed") {
        totalCount++;
        if (entry.error?.code) {
          errorBreakdown[entry.error.code] = (errorBreakdown[entry.error.code] || 0) + 1;
        }
      }
      const day = entry.timestamp.toISOString().split("T")[0];
      usageByDay[day] = (usageByDay[day] || 0) + 1;
    }
    return {
      toolId,
      period: { startDate, endDate },
      totalInvocations: totalCount,
      uniqueUsers: uniqueUsers.size,
      successRate: totalCount > 0 ? successCount / totalCount : 0,
      errorBreakdown: Object.entries(errorBreakdown).map(([errorCode, count]) => ({ errorCode, count })).sort((a, b) => b.count - a.count),
      usageByDay: Object.entries(usageByDay).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
    };
  }
  // ==========================================================================
  // UTILITIES
  // ==========================================================================
  /**
   * Truncate payload to max size
   */
  truncatePayload(payload) {
    if (payload === void 0 || payload === null) {
      return payload;
    }
    const str = JSON.stringify(payload);
    if (str.length <= this.maxPayloadSize) {
      return payload;
    }
    return {
      __truncated: true,
      __originalSize: str.length,
      __preview: str.slice(0, this.maxPayloadSize)
    };
  }
};
function createAuditLogger(config) {
  return new AuditLogger(config);
}

// src/tool-registry/confirmation-manager.ts
var DEFAULT_TEMPLATES = {
  implicit: {
    title: "Proceeding with action",
    messageTemplate: "SAM AI will {{action}} using the {{toolName}} tool.",
    defaultSeverity: "low"
  },
  explicit: {
    title: "Confirmation required",
    messageTemplate: "SAM AI wants to {{action}}. Do you want to proceed?",
    defaultSeverity: "medium"
  },
  critical: {
    title: "Critical action - Confirmation required",
    messageTemplate: "SAM AI is requesting to {{action}}. This action may have significant effects.",
    defaultSeverity: "critical"
  }
};
var ConfirmationManager = class {
  store;
  logger;
  defaultTimeoutSeconds;
  onConfirmationRequested;
  onConfirmationResolved;
  pendingWaits;
  constructor(config) {
    this.store = config.confirmationStore;
    this.logger = config.logger ?? console;
    this.defaultTimeoutSeconds = config.defaultTimeoutSeconds ?? 300;
    this.onConfirmationRequested = config.onConfirmationRequested;
    this.onConfirmationResolved = config.onConfirmationResolved;
    this.pendingWaits = /* @__PURE__ */ new Map();
  }
  // ==========================================================================
  // CONFIRMATION CHECKING
  // ==========================================================================
  /**
   * Check if a tool requires confirmation
   */
  requiresConfirmation(tool) {
    return tool.confirmationType !== ConfirmationType.NONE;
  }
  /**
   * Check if a confirmation type requires explicit user action
   */
  requiresExplicitConfirmation(type) {
    return type === ConfirmationType.EXPLICIT || type === ConfirmationType.CRITICAL;
  }
  /**
   * Get the severity level for a confirmation type
   */
  getSeverityForType(type) {
    switch (type) {
      case ConfirmationType.IMPLICIT:
        return "low";
      case ConfirmationType.EXPLICIT:
        return "medium";
      case ConfirmationType.CRITICAL:
        return "critical";
      default:
        return "low";
    }
  }
  // ==========================================================================
  // CONFIRMATION REQUEST MANAGEMENT
  // ==========================================================================
  /**
   * Create a confirmation request for a tool invocation
   */
  async createConfirmationRequest(invocation, tool, options) {
    const template = tool.confirmationType !== ConfirmationType.NONE ? DEFAULT_TEMPLATES[tool.confirmationType] : DEFAULT_TEMPLATES.explicit;
    const title = options?.title ?? template.title;
    const message = options?.message ?? this.formatMessage(template.messageTemplate, tool, invocation);
    const severity = options?.severity ?? template.defaultSeverity;
    const timeoutSeconds = options?.timeoutSeconds ?? this.defaultTimeoutSeconds;
    const expiresAt = new Date(Date.now() + timeoutSeconds * 1e3);
    const request = await this.store.create({
      invocationId: invocation.id,
      toolId: tool.id,
      toolName: tool.name,
      userId: invocation.userId,
      title,
      message,
      details: options?.details ?? this.generateDefaultDetails(tool, invocation),
      type: tool.confirmationType,
      severity,
      confirmText: options?.confirmText ?? "Confirm",
      cancelText: options?.cancelText ?? "Cancel",
      timeout: timeoutSeconds,
      status: "pending",
      expiresAt
    });
    this.logger.info(`Confirmation request created: ${request.id}`, {
      invocationId: invocation.id,
      toolId: tool.id,
      type: tool.confirmationType
    });
    if (this.onConfirmationRequested) {
      try {
        await this.onConfirmationRequested(request);
      } catch (error) {
        this.logger.error("Error in onConfirmationRequested callback", { error });
      }
    }
    return request;
  }
  /**
   * Get a confirmation request by ID
   */
  async getRequest(requestId) {
    return this.store.get(requestId);
  }
  /**
   * Get confirmation request for an invocation
   */
  async getRequestByInvocation(invocationId) {
    return this.store.getByInvocation(invocationId);
  }
  /**
   * Get pending confirmation requests for a user
   */
  async getPendingRequests(userId) {
    return this.store.getPending(userId);
  }
  // ==========================================================================
  // CONFIRMATION RESPONSE HANDLING
  // ==========================================================================
  /**
   * Respond to a confirmation request
   */
  async respond(requestId, confirmed) {
    const request = await this.store.respond(requestId, confirmed);
    this.logger.info(`Confirmation ${confirmed ? "granted" : "denied"}: ${requestId}`, {
      invocationId: request.invocationId,
      toolId: request.toolId
    });
    if (this.onConfirmationResolved) {
      try {
        await this.onConfirmationResolved(request, confirmed);
      } catch (error) {
        this.logger.error("Error in onConfirmationResolved callback", { error });
      }
    }
    const pendingWait = this.pendingWaits.get(requestId);
    if (pendingWait) {
      if (pendingWait.timeoutId) {
        clearTimeout(pendingWait.timeoutId);
      }
      pendingWait.resolve({
        confirmed,
        request,
        timedOut: false
      });
      this.pendingWaits.delete(requestId);
    }
    return request;
  }
  /**
   * Confirm a request (shorthand for respond(id, true))
   */
  async confirm(requestId) {
    return this.respond(requestId, true);
  }
  /**
   * Deny a request (shorthand for respond(id, false))
   */
  async deny(requestId) {
    return this.respond(requestId, false);
  }
  /**
   * Auto-confirm an implicit confirmation
   */
  async autoConfirmImplicit(invocation, tool) {
    if (tool.confirmationType !== ConfirmationType.IMPLICIT) {
      return null;
    }
    const request = await this.createConfirmationRequest(invocation, tool);
    return this.confirm(request.id);
  }
  // ==========================================================================
  // WAITING FOR CONFIRMATION
  // ==========================================================================
  /**
   * Wait for a confirmation response with timeout
   */
  async waitForConfirmation(requestId, timeoutMs) {
    const request = await this.store.get(requestId);
    if (!request) {
      throw new Error(`Confirmation request not found: ${requestId}`);
    }
    if (request.status !== "pending") {
      return {
        confirmed: request.status === "confirmed",
        request,
        timedOut: request.status === "expired"
      };
    }
    const effectiveTimeout = timeoutMs ?? (request.timeout ? request.timeout * 1e3 : this.defaultTimeoutSeconds * 1e3);
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        const pendingWait = this.pendingWaits.get(requestId);
        if (pendingWait) {
          this.pendingWaits.delete(requestId);
          this.store.respond(requestId, false).catch((error) => {
            this.logger.error("Error expiring confirmation", { error, requestId });
          });
          resolve({
            confirmed: false,
            request: { ...request, status: "expired" },
            timedOut: true
          });
        }
      }, effectiveTimeout);
      this.pendingWaits.set(requestId, { resolve, timeoutId });
    });
  }
  /**
   * Wait for confirmation on an invocation
   */
  async waitForInvocationConfirmation(invocationId, timeoutMs) {
    const request = await this.store.getByInvocation(invocationId);
    if (!request) {
      return null;
    }
    return this.waitForConfirmation(request.id, timeoutMs);
  }
  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================
  /**
   * Confirm all pending requests for a user
   */
  async confirmAllPending(userId) {
    const pending = await this.store.getPending(userId);
    const results = [];
    for (const request of pending) {
      const confirmed = await this.confirm(request.id);
      results.push(confirmed);
    }
    return results;
  }
  /**
   * Deny all pending requests for a user
   */
  async denyAllPending(userId) {
    const pending = await this.store.getPending(userId);
    const results = [];
    for (const request of pending) {
      const denied = await this.deny(request.id);
      results.push(denied);
    }
    return results;
  }
  /**
   * Cancel pending waits for a user (without resolving them)
   */
  cancelPendingWaits(userId) {
    for (const [requestId, wait] of this.pendingWaits.entries()) {
      if (wait.timeoutId) {
        clearTimeout(wait.timeoutId);
      }
      if (!userId) {
        this.pendingWaits.delete(requestId);
      }
    }
  }
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  /**
   * Format a message template with tool and invocation data
   */
  formatMessage(template, tool, invocation) {
    return template.replace("{{action}}", this.generateActionDescription(tool, invocation)).replace("{{toolName}}", tool.name).replace("{{toolId}}", tool.id);
  }
  /**
   * Generate an action description from tool and input
   */
  generateActionDescription(tool, _invocation) {
    return tool.description.toLowerCase();
  }
  /**
   * Generate default details for a confirmation request
   */
  generateDefaultDetails(tool, invocation) {
    const details = [
      {
        label: "Tool",
        value: tool.name,
        type: "text"
      },
      {
        label: "Category",
        value: tool.category,
        type: "text"
      }
    ];
    if (invocation.input && typeof invocation.input === "object") {
      const inputStr = JSON.stringify(invocation.input, null, 2);
      if (inputStr.length <= 1e3) {
        details.push({
          label: "Input",
          value: inputStr,
          type: "json"
        });
      }
    }
    if (tool.confirmationType === ConfirmationType.CRITICAL) {
      details.push({
        label: "Warning",
        value: "This action may have significant or irreversible effects.",
        type: "warning"
      });
    }
    return details;
  }
  /**
   * Check if a request has expired
   */
  isExpired(request) {
    if (request.status === "expired") {
      return true;
    }
    if (request.expiresAt && request.expiresAt < /* @__PURE__ */ new Date()) {
      return true;
    }
    return false;
  }
  /**
   * Get remaining time for a confirmation request (in seconds)
   */
  getRemainingTime(request) {
    if (!request.expiresAt || request.status !== "pending") {
      return 0;
    }
    const remaining = request.expiresAt.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1e3));
  }
};
function createConfirmationManager(config) {
  return new ConfirmationManager(config);
}

// src/tool-registry/tool-executor.ts
var ToolExecutor = class {
  toolStore;
  invocationStore;
  permissionManager;
  auditLogger;
  confirmationManager;
  logger;
  enableSandbox;
  defaultTimeoutMs;
  maxConcurrentPerUser;
  onBeforeExecute;
  onAfterExecute;
  // Rate limiting state
  rateLimitState;
  // Concurrent execution tracking
  concurrentExecutions;
  // Active execution tracking for cancellation
  activeExecutions;
  constructor(config) {
    this.toolStore = config.toolStore;
    this.invocationStore = config.invocationStore;
    this.permissionManager = config.permissionManager;
    this.auditLogger = config.auditLogger;
    this.confirmationManager = config.confirmationManager;
    this.logger = config.logger ?? console;
    this.enableSandbox = config.enableSandbox ?? true;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 3e4;
    this.maxConcurrentPerUser = config.maxConcurrentPerUser ?? 5;
    this.onBeforeExecute = config.onBeforeExecute;
    this.onAfterExecute = config.onAfterExecute;
    this.rateLimitState = /* @__PURE__ */ new Map();
    this.concurrentExecutions = /* @__PURE__ */ new Map();
    this.activeExecutions = /* @__PURE__ */ new Map();
  }
  // ==========================================================================
  // MAIN EXECUTION FLOW
  // ==========================================================================
  /**
   * Execute a tool with full permission, confirmation, and audit flow
   */
  async execute(toolId, userId, input, options) {
    const auditContext = this.createAuditContext(userId, options);
    this.logger.debug(`Executing tool: ${toolId}`, { userId, sessionId: options.sessionId });
    const tool = await this.toolStore.get(toolId);
    if (!tool) {
      this.logger.error(`Tool not found: ${toolId}`);
      throw new Error(`Tool not found: ${toolId}`);
    }
    if (!tool.enabled) {
      await this.auditLogger.logPermissionDenied(toolId, "Tool is disabled", auditContext);
      throw new Error(`Tool is disabled: ${toolId}`);
    }
    let validatedInput;
    try {
      validatedInput = tool.inputSchema.parse(input);
    } catch (error) {
      throw new Error(`Invalid input: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    const invocation = await this.invocationStore.create({
      toolId,
      userId,
      sessionId: options.sessionId,
      input,
      validatedInput,
      status: ToolExecutionStatus.PENDING,
      confirmationType: tool.confirmationType,
      metadata: options.metadata
    });
    try {
      if (!options.skipPermissionCheck) {
        const permissionResult = await this.permissionManager.checkToolPermission(userId, tool);
        if (!permissionResult.granted) {
          await this.auditLogger.logPermissionDenied(
            toolId,
            permissionResult.reason ?? "Insufficient permissions",
            auditContext
          );
          await this.updateInvocationStatus(invocation.id, ToolExecutionStatus.DENIED);
          return {
            invocation: { ...invocation, status: ToolExecutionStatus.DENIED },
            result: null,
            status: ToolExecutionStatus.DENIED,
            awaitingConfirmation: false
          };
        }
      }
      if (tool.rateLimit) {
        const rateLimitOk = this.checkRateLimit(tool.id, userId, tool.rateLimit);
        if (!rateLimitOk) {
          await this.auditLogger.logRateLimitExceeded(toolId, auditContext);
          await this.updateInvocationStatus(invocation.id, ToolExecutionStatus.DENIED);
          return {
            invocation: { ...invocation, status: ToolExecutionStatus.DENIED },
            result: {
              success: false,
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Rate limit exceeded",
                recoverable: true
              }
            },
            status: ToolExecutionStatus.DENIED,
            awaitingConfirmation: false
          };
        }
      }
      if (!this.checkConcurrentLimit(userId)) {
        await this.updateInvocationStatus(invocation.id, ToolExecutionStatus.DENIED);
        return {
          invocation: { ...invocation, status: ToolExecutionStatus.DENIED },
          result: {
            success: false,
            error: {
              code: "CONCURRENT_LIMIT_EXCEEDED",
              message: "Maximum concurrent executions exceeded",
              recoverable: true
            }
          },
          status: ToolExecutionStatus.DENIED,
          awaitingConfirmation: false
        };
      }
      if (!options.skipConfirmation && this.confirmationManager.requiresConfirmation(tool)) {
        if (tool.confirmationType === ConfirmationType.IMPLICIT) {
          await this.confirmationManager.autoConfirmImplicit(invocation, tool);
        } else {
          const confirmRequest = await this.confirmationManager.createConfirmationRequest(
            invocation,
            tool
          );
          await this.auditLogger.logConfirmationRequested(invocation, auditContext);
          await this.updateInvocationStatus(
            invocation.id,
            ToolExecutionStatus.AWAITING_CONFIRMATION,
            { confirmationPrompt: confirmRequest.message }
          );
          return {
            invocation: {
              ...invocation,
              status: ToolExecutionStatus.AWAITING_CONFIRMATION,
              confirmationPrompt: confirmRequest.message
            },
            result: null,
            status: ToolExecutionStatus.AWAITING_CONFIRMATION,
            awaitingConfirmation: true,
            confirmationId: confirmRequest.id
          };
        }
      }
      return this.executeInternal(invocation, tool, validatedInput, options, auditContext);
    } catch (error) {
      const toolError = {
        code: "EXECUTION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        recoverable: false
      };
      await this.auditLogger.logExecutionFailed(invocation, toolError, auditContext);
      await this.updateInvocationStatus(invocation.id, ToolExecutionStatus.FAILED, {
        result: { success: false, error: toolError }
      });
      return {
        invocation: { ...invocation, status: ToolExecutionStatus.FAILED },
        result: { success: false, error: toolError },
        status: ToolExecutionStatus.FAILED,
        awaitingConfirmation: false
      };
    }
  }
  /**
   * Continue execution after confirmation
   */
  async continueAfterConfirmation(invocationId, confirmed) {
    const invocation = await this.invocationStore.get(invocationId);
    if (!invocation) {
      throw new Error(`Invocation not found: ${invocationId}`);
    }
    if (invocation.status !== ToolExecutionStatus.AWAITING_CONFIRMATION) {
      throw new Error(`Invocation is not awaiting confirmation: ${invocationId}`);
    }
    const tool = await this.toolStore.get(invocation.toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${invocation.toolId}`);
    }
    const auditContext = {
      userId: invocation.userId,
      sessionId: invocation.sessionId
    };
    if (!confirmed) {
      await this.auditLogger.logConfirmationDenied(invocation, auditContext);
      await this.updateInvocationStatus(invocationId, ToolExecutionStatus.CANCELLED, {
        userConfirmed: false,
        confirmedAt: /* @__PURE__ */ new Date()
      });
      return {
        invocation: { ...invocation, status: ToolExecutionStatus.CANCELLED },
        result: null,
        status: ToolExecutionStatus.CANCELLED,
        awaitingConfirmation: false
      };
    }
    await this.auditLogger.logConfirmationGranted(invocation, auditContext);
    await this.updateInvocationStatus(invocationId, ToolExecutionStatus.PENDING, {
      userConfirmed: true,
      confirmedAt: /* @__PURE__ */ new Date()
    });
    return this.executeInternal(
      { ...invocation, userConfirmed: true },
      tool,
      invocation.validatedInput ?? invocation.input,
      { sessionId: invocation.sessionId },
      auditContext
    );
  }
  /**
   * Cancel an execution
   */
  async cancel(invocationId) {
    const controller = this.activeExecutions.get(invocationId);
    if (controller) {
      controller.abort();
      this.activeExecutions.delete(invocationId);
      await this.updateInvocationStatus(invocationId, ToolExecutionStatus.CANCELLED);
      return true;
    }
    return false;
  }
  // ==========================================================================
  // INTERNAL EXECUTION
  // ==========================================================================
  /**
   * Internal execution with sandboxing and timeout
   */
  async executeInternal(invocation, tool, validatedInput, options, auditContext) {
    this.addConcurrentExecution(invocation.userId, invocation.id);
    const abortController = new AbortController();
    this.activeExecutions.set(invocation.id, abortController);
    try {
      if (this.onBeforeExecute) {
        const shouldProceed = await this.onBeforeExecute(invocation, tool);
        if (!shouldProceed) {
          await this.updateInvocationStatus(invocation.id, ToolExecutionStatus.CANCELLED);
          return {
            invocation: { ...invocation, status: ToolExecutionStatus.CANCELLED },
            result: null,
            status: ToolExecutionStatus.CANCELLED,
            awaitingConfirmation: false
          };
        }
      }
      await this.updateInvocationStatus(invocation.id, ToolExecutionStatus.EXECUTING, {
        startedAt: /* @__PURE__ */ new Date()
      });
      await this.auditLogger.logExecutionStarted(invocation, auditContext);
      const context = await this.buildExecutionContext(invocation, options);
      const timeoutMs = options.timeout ?? tool.timeoutMs ?? this.defaultTimeoutMs;
      const result = await this.executeWithTimeout(
        tool.handler,
        validatedInput,
        context,
        timeoutMs,
        abortController.signal
      );
      const completedAt = /* @__PURE__ */ new Date();
      const duration = invocation.startedAt ? completedAt.getTime() - invocation.startedAt.getTime() : void 0;
      const finalStatus = result.success ? ToolExecutionStatus.SUCCESS : ToolExecutionStatus.FAILED;
      await this.updateInvocationStatus(invocation.id, finalStatus, {
        result,
        completedAt,
        duration
      });
      if (result.success) {
        await this.auditLogger.logExecutionSuccess(
          { ...invocation, result },
          auditContext
        );
      } else {
        await this.auditLogger.logExecutionFailed(
          invocation,
          result.error ?? { code: "UNKNOWN", message: "Unknown error", recoverable: false },
          auditContext
        );
      }
      if (this.onAfterExecute) {
        await this.onAfterExecute(invocation, result);
      }
      if (tool.rateLimit) {
        this.recordRateLimitHit(tool.id, invocation.userId, tool.rateLimit);
      }
      return {
        invocation: {
          ...invocation,
          status: finalStatus,
          result,
          completedAt,
          duration
        },
        result,
        status: finalStatus,
        awaitingConfirmation: false
      };
    } finally {
      this.removeConcurrentExecution(invocation.userId, invocation.id);
      this.activeExecutions.delete(invocation.id);
    }
  }
  /**
   * Execute a tool handler with timeout
   */
  async executeWithTimeout(handler, input, context, timeoutMs, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        resolve({
          success: false,
          error: {
            code: "CANCELLED",
            message: "Execution was cancelled",
            recoverable: true
          }
        });
        return;
      }
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          error: {
            code: "TIMEOUT",
            message: `Execution timed out after ${timeoutMs}ms`,
            recoverable: true
          }
        });
      }, timeoutMs);
      const abortHandler = () => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          error: {
            code: "CANCELLED",
            message: "Execution was cancelled",
            recoverable: true
          }
        });
      };
      signal.addEventListener("abort", abortHandler, { once: true });
      const sandboxedHandler = this.enableSandbox ? this.wrapInSandbox(handler) : handler;
      sandboxedHandler(input, context).then((result) => {
        clearTimeout(timeoutId);
        signal.removeEventListener("abort", abortHandler);
        resolve(result);
      }).catch((error) => {
        clearTimeout(timeoutId);
        signal.removeEventListener("abort", abortHandler);
        reject(error);
      });
    });
  }
  /**
   * Wrap a handler in a sandbox (basic implementation)
   */
  wrapInSandbox(handler) {
    return async (input, context) => {
      try {
        return await handler(input, context);
      } catch (error) {
        return {
          success: false,
          error: {
            code: "SANDBOX_ERROR",
            message: error instanceof Error ? error.message : "Unknown error in sandbox",
            recoverable: false
          }
        };
      }
    };
  }
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  /**
   * Build execution context for a tool
   */
  async buildExecutionContext(invocation, options) {
    const previousInvocations = await this.invocationStore.getBySession(
      options.sessionId,
      10
    );
    const previousCalls = previousInvocations.filter((inv) => inv.id !== invocation.id && inv.status === ToolExecutionStatus.SUCCESS).map((inv) => ({
      toolId: inv.toolId,
      timestamp: inv.createdAt,
      success: true,
      outputSummary: this.summarizeOutput(inv.result?.output)
    }));
    const tool = await this.toolStore.get(invocation.toolId);
    const grantedPermissions = tool ? await this.permissionManager.getEffectivePermissions(invocation.userId, tool) : [];
    return {
      userId: invocation.userId,
      sessionId: invocation.sessionId,
      requestId: options.requestId ?? invocation.id,
      grantedPermissions,
      userConfirmed: invocation.userConfirmed ?? false,
      previousCalls,
      metadata: options.metadata
    };
  }
  /**
   * Create audit context from options
   */
  createAuditContext(userId, options) {
    return {
      userId,
      sessionId: options.sessionId,
      requestId: options.requestId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      metadata: options.metadata
    };
  }
  /**
   * Update invocation status
   */
  async updateInvocationStatus(invocationId, status, updates) {
    await this.invocationStore.update(invocationId, {
      status,
      ...updates
    });
  }
  /**
   * Summarize output for previous calls context
   */
  summarizeOutput(output) {
    if (output === void 0 || output === null) {
      return void 0;
    }
    const str = JSON.stringify(output);
    if (str.length <= 200) {
      return str;
    }
    return str.slice(0, 197) + "...";
  }
  // ==========================================================================
  // RATE LIMITING
  // ==========================================================================
  /**
   * Check if rate limit allows execution
   */
  checkRateLimit(toolId, userId, rateLimit) {
    const key = this.getRateLimitKey(toolId, userId, rateLimit.scope);
    const entry = this.rateLimitState.get(key);
    const now = Date.now();
    if (!entry) {
      return true;
    }
    if (now - entry.windowStart > rateLimit.windowMs) {
      this.rateLimitState.delete(key);
      return true;
    }
    return entry.count < rateLimit.maxCalls;
  }
  /**
   * Record a rate limit hit
   */
  recordRateLimitHit(toolId, userId, rateLimit) {
    const key = this.getRateLimitKey(toolId, userId, rateLimit.scope);
    const entry = this.rateLimitState.get(key);
    const now = Date.now();
    if (!entry || now - entry.windowStart > rateLimit.windowMs) {
      this.rateLimitState.set(key, { count: 1, windowStart: now });
    } else {
      entry.count++;
    }
  }
  /**
   * Get rate limit key
   */
  getRateLimitKey(toolId, userId, scope) {
    switch (scope) {
      case "global":
        return `rate:${toolId}:global`;
      case "user":
        return `rate:${toolId}:user:${userId}`;
      case "session":
        return `rate:${toolId}:session:${userId}`;
      default:
        return `rate:${toolId}:${userId}`;
    }
  }
  // ==========================================================================
  // CONCURRENT EXECUTION TRACKING
  // ==========================================================================
  /**
   * Check concurrent execution limit
   */
  checkConcurrentLimit(userId) {
    const userExecutions = this.concurrentExecutions.get(userId);
    if (!userExecutions) {
      return true;
    }
    return userExecutions.size < this.maxConcurrentPerUser;
  }
  /**
   * Add concurrent execution
   */
  addConcurrentExecution(userId, invocationId) {
    let userExecutions = this.concurrentExecutions.get(userId);
    if (!userExecutions) {
      userExecutions = /* @__PURE__ */ new Set();
      this.concurrentExecutions.set(userId, userExecutions);
    }
    userExecutions.add(invocationId);
  }
  /**
   * Remove concurrent execution
   */
  removeConcurrentExecution(userId, invocationId) {
    const userExecutions = this.concurrentExecutions.get(userId);
    if (userExecutions) {
      userExecutions.delete(invocationId);
      if (userExecutions.size === 0) {
        this.concurrentExecutions.delete(userId);
      }
    }
  }
  // ==========================================================================
  // STATUS QUERIES
  // ==========================================================================
  /**
   * Get current execution count for a user
   */
  getConcurrentExecutionCount(userId) {
    const userExecutions = this.concurrentExecutions.get(userId);
    return userExecutions?.size ?? 0;
  }
  /**
   * Get rate limit status for a tool/user
   */
  getRateLimitStatus(toolId, userId, rateLimit) {
    const key = this.getRateLimitKey(toolId, userId, rateLimit.scope);
    const entry = this.rateLimitState.get(key);
    const now = Date.now();
    if (!entry || now - entry.windowStart > rateLimit.windowMs) {
      return { remaining: rateLimit.maxCalls, resetsIn: 0 };
    }
    return {
      remaining: Math.max(0, rateLimit.maxCalls - entry.count),
      resetsIn: Math.max(0, rateLimit.windowMs - (now - entry.windowStart))
    };
  }
  /**
   * Clear all rate limit state (for testing)
   */
  clearRateLimitState() {
    this.rateLimitState.clear();
  }
};
function createToolExecutor(config) {
  return new ToolExecutor(config);
}

// src/mentor-tools/types.ts
var import_zod5 = require("zod");
var ContentGenerationRequestSchema = import_zod5.z.object({
  type: import_zod5.z.enum(["explanation", "example", "quiz", "summary", "hint", "feedback"]),
  topic: import_zod5.z.string().min(1),
  context: import_zod5.z.object({
    courseId: import_zod5.z.string().optional(),
    chapterId: import_zod5.z.string().optional(),
    sectionId: import_zod5.z.string().optional(),
    learningObjective: import_zod5.z.string().optional()
  }).optional(),
  difficulty: import_zod5.z.enum(["beginner", "intermediate", "advanced"]).optional(),
  format: import_zod5.z.enum(["markdown", "html", "plain"]).optional(),
  maxLength: import_zod5.z.number().int().min(50).max(1e4).optional(),
  style: import_zod5.z.enum(["formal", "casual", "technical"]).optional(),
  includeExamples: import_zod5.z.boolean().optional(),
  targetAudience: import_zod5.z.string().optional()
});
var ContentRecommendationRequestSchema = import_zod5.z.object({
  userId: import_zod5.z.string().min(1),
  currentContext: import_zod5.z.object({
    courseId: import_zod5.z.string().optional(),
    chapterId: import_zod5.z.string().optional(),
    sectionId: import_zod5.z.string().optional(),
    currentTopic: import_zod5.z.string().optional()
  }),
  learningGoals: import_zod5.z.array(import_zod5.z.string()).optional(),
  maxRecommendations: import_zod5.z.number().int().min(1).max(20).optional(),
  includeExternal: import_zod5.z.boolean().optional()
});
var StudySessionRequestSchema = import_zod5.z.object({
  userId: import_zod5.z.string().min(1),
  goalId: import_zod5.z.string().optional(),
  duration: import_zod5.z.number().int().min(15).max(480),
  topics: import_zod5.z.array(import_zod5.z.string()).optional(),
  preferredTime: import_zod5.z.object({
    start: import_zod5.z.string().regex(/^\d{2}:\d{2}$/),
    end: import_zod5.z.string().regex(/^\d{2}:\d{2}$/)
  }).optional(),
  breakInterval: import_zod5.z.number().int().min(15).max(120).optional(),
  breakDuration: import_zod5.z.number().int().min(5).max(30).optional()
});
var ReminderRequestSchema = import_zod5.z.object({
  userId: import_zod5.z.string().min(1),
  type: import_zod5.z.enum(["study", "assessment", "deadline", "check_in", "custom"]),
  message: import_zod5.z.string().min(1).max(500),
  scheduledFor: import_zod5.z.coerce.date(),
  recurring: import_zod5.z.object({
    frequency: import_zod5.z.enum(["daily", "weekly", "monthly"]),
    until: import_zod5.z.coerce.date().optional()
  }).optional(),
  channels: import_zod5.z.array(import_zod5.z.enum(["email", "push", "in_app"])).optional()
});
var NotificationRequestSchema = import_zod5.z.object({
  userId: import_zod5.z.string().min(1),
  type: import_zod5.z.enum([
    "achievement",
    "reminder",
    "progress_update",
    "feedback",
    "recommendation",
    "alert",
    "system"
  ]),
  title: import_zod5.z.string().min(1).max(100),
  body: import_zod5.z.string().min(1).max(500),
  priority: import_zod5.z.enum(["low", "normal", "high", "urgent"]),
  channels: import_zod5.z.array(import_zod5.z.enum(["email", "push", "in_app", "sms"])).optional(),
  data: import_zod5.z.record(import_zod5.z.unknown()).optional(),
  expiresAt: import_zod5.z.coerce.date().optional(),
  actionUrl: import_zod5.z.string().url().optional(),
  actionLabel: import_zod5.z.string().max(50).optional()
});
var ProgressReportRequestSchema = import_zod5.z.object({
  userId: import_zod5.z.string().min(1),
  period: import_zod5.z.enum(["daily", "weekly", "monthly"]),
  includeComparison: import_zod5.z.boolean().optional(),
  includeGoals: import_zod5.z.boolean().optional(),
  includeRecommendations: import_zod5.z.boolean().optional()
});

// src/mentor-tools/content-tools.ts
function createGenerateContentHandler(deps) {
  return async (input, _context) => {
    const request = input;
    try {
      const prompt = buildContentPrompt(request);
      const response = await deps.aiAdapter.chat({
        messages: [
          {
            role: "system",
            content: getContentSystemPrompt(request.type)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        maxTokens: request.maxLength ?? 2e3
      });
      const content = response.content;
      const wordCount = content.split(/\s+/).length;
      return {
        success: true,
        output: {
          content,
          format: request.format ?? "markdown",
          metadata: {
            wordCount,
            estimatedReadTime: Math.ceil(wordCount / 200),
            topics: extractTopics(content),
            difficulty: request.difficulty ?? "intermediate"
          }
        }
      };
    } catch (error) {
      deps.logger?.error("Content generation failed", { error, request });
      return {
        success: false,
        error: {
          code: "CONTENT_GENERATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to generate content",
          recoverable: true
        }
      };
    }
  };
}
function createRecommendContentHandler(deps) {
  return async (input, _context) => {
    const request = input;
    try {
      const maxRecs = request.maxRecommendations ?? 5;
      let recommendations = [];
      if (deps.contentRepository) {
        recommendations = await deps.contentRepository.getRelatedContent(
          request.currentContext,
          maxRecs
        );
      }
      if (recommendations.length < maxRecs) {
        const aiRecommendations = await generateAIRecommendations(
          deps.aiAdapter,
          request,
          maxRecs - recommendations.length
        );
        recommendations = [...recommendations, ...aiRecommendations];
      }
      recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return {
        success: true,
        output: recommendations.slice(0, maxRecs)
      };
    } catch (error) {
      deps.logger?.error("Content recommendation failed", { error, request });
      return {
        success: false,
        error: {
          code: "RECOMMENDATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to generate recommendations",
          recoverable: true
        }
      };
    }
  };
}
function createSummarizeContentHandler(deps) {
  return async (input, _context) => {
    const { content, maxLength } = input;
    try {
      const response = await deps.aiAdapter.chat({
        messages: [
          {
            role: "system",
            content: "You are an expert at summarizing educational content. Create clear, concise summaries that capture the key points."
          },
          {
            role: "user",
            content: `Please summarize the following content${maxLength ? ` in approximately ${maxLength} words` : ""}:

${content}`
          }
        ],
        temperature: 0.3,
        maxTokens: maxLength ?? 500
      });
      const keyPoints = extractKeyPoints(response.content);
      return {
        success: true,
        output: {
          summary: response.content,
          keyPoints,
          wordCount: response.content.split(/\s+/).length
        }
      };
    } catch (error) {
      deps.logger?.error("Content summarization failed", { error });
      return {
        success: false,
        error: {
          code: "SUMMARIZATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to summarize content",
          recoverable: true
        }
      };
    }
  };
}
function buildContentPrompt(request) {
  const parts = [];
  parts.push(`Generate a ${request.type} about: ${request.topic}`);
  if (request.context?.learningObjective) {
    parts.push(`Learning objective: ${request.context.learningObjective}`);
  }
  if (request.difficulty) {
    parts.push(`Difficulty level: ${request.difficulty}`);
  }
  if (request.style) {
    parts.push(`Writing style: ${request.style}`);
  }
  if (request.targetAudience) {
    parts.push(`Target audience: ${request.targetAudience}`);
  }
  if (request.includeExamples) {
    parts.push("Include practical examples.");
  }
  if (request.format) {
    parts.push(`Format: ${request.format}`);
  }
  return parts.join("\n");
}
function getContentSystemPrompt(type) {
  const prompts = {
    explanation: "You are an expert educator. Provide clear, comprehensive explanations that build understanding progressively.",
    example: "You are a practical educator. Provide concrete, relatable examples that illustrate concepts clearly.",
    quiz: "You are an assessment expert. Create engaging quiz questions that test understanding at various levels.",
    summary: "You are a content curator. Create concise summaries that capture essential information.",
    hint: "You are a supportive tutor. Provide helpful hints that guide without giving away answers.",
    feedback: "You are a constructive mentor. Provide specific, actionable feedback that encourages improvement."
  };
  return prompts[type];
}
function extractTopics(content) {
  const words = content.toLowerCase().split(/\s+/);
  const stopWords = /* @__PURE__ */ new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "need",
    "dare",
    "ought",
    "used",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "as",
    "into",
    "through",
    "and",
    "but",
    "or",
    "nor",
    "so",
    "yet",
    "both",
    "either",
    "neither",
    "not",
    "only",
    "this",
    "that",
    "these",
    "those"
  ]);
  const wordCounts = /* @__PURE__ */ new Map();
  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, "");
    if (cleaned.length > 3 && !stopWords.has(cleaned)) {
      wordCounts.set(cleaned, (wordCounts.get(cleaned) ?? 0) + 1);
    }
  }
  return Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);
}
function extractKeyPoints(summary) {
  const bulletPattern = /[-•*]\s*(.+)/g;
  const numberPattern = /\d+\.\s*(.+)/g;
  const points = [];
  let match;
  while ((match = bulletPattern.exec(summary)) !== null) {
    points.push(match[1].trim());
  }
  while ((match = numberPattern.exec(summary)) !== null) {
    points.push(match[1].trim());
  }
  if (points.length === 0) {
    const sentences = summary.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    return sentences.slice(0, 5).map((s) => s.trim());
  }
  return points.slice(0, 10);
}
async function generateAIRecommendations(aiAdapter, request, count) {
  const prompt = `Based on the following context, suggest ${count} learning resources:
Context: ${JSON.stringify(request.currentContext)}
Goals: ${request.learningGoals?.join(", ") ?? "General learning"}

Respond in JSON format with an array of recommendations, each having:
- id: unique identifier
- type: one of 'chapter', 'section', 'resource', 'exercise', 'video', 'article'
- title: resource title
- description: brief description
- difficulty: 'beginner', 'intermediate', or 'advanced'
- relevanceScore: 0-1 score
- estimatedTime: minutes to complete
- reason: why this is recommended`;
  try {
    const response = await aiAdapter.chat({
      messages: [
        {
          role: "system",
          content: "You are an educational content recommender. Respond only with valid JSON."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      maxTokens: 1e3
    });
    const parsed = JSON.parse(response.content);
    return Array.isArray(parsed) ? parsed : parsed.recommendations ?? [];
  } catch {
    return [];
  }
}
function createContentTools(deps) {
  return [
    {
      id: "content-generate",
      name: "Generate Content",
      description: "Generate educational content such as explanations, examples, quizzes, and summaries",
      category: ToolCategory.CONTENT,
      version: "1.0.0",
      inputSchema: ContentGenerationRequestSchema,
      requiredPermissions: [PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      handler: createGenerateContentHandler(deps),
      timeoutMs: 6e4,
      maxRetries: 2,
      rateLimit: {
        maxCalls: 50,
        windowMs: 6e4,
        scope: "user"
      },
      tags: ["content", "generation", "ai"],
      enabled: true,
      examples: [
        {
          name: "Generate explanation",
          description: "Generate an explanation about React hooks",
          input: {
            type: "explanation",
            topic: "React hooks",
            difficulty: "intermediate",
            format: "markdown"
          }
        }
      ]
    },
    {
      id: "content-recommend",
      name: "Recommend Content",
      description: "Get personalized content recommendations based on learning context",
      category: ToolCategory.CONTENT,
      version: "1.0.0",
      inputSchema: ContentRecommendationRequestSchema,
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      handler: createRecommendContentHandler(deps),
      timeoutMs: 3e4,
      maxRetries: 2,
      rateLimit: {
        maxCalls: 100,
        windowMs: 6e4,
        scope: "user"
      },
      tags: ["content", "recommendation", "personalization"],
      enabled: true,
      examples: [
        {
          name: "Get recommendations",
          description: "Get content recommendations for a course context",
          input: {
            userId: "user-123",
            currentContext: {
              courseId: "course-1",
              currentTopic: "JavaScript basics"
            },
            maxRecommendations: 5
          }
        }
      ]
    },
    {
      id: "content-summarize",
      name: "Summarize Content",
      description: "Create a concise summary of educational content",
      category: ToolCategory.CONTENT,
      version: "1.0.0",
      inputSchema: ContentGenerationRequestSchema.pick({ topic: true }).extend({
        content: ContentGenerationRequestSchema.shape.topic,
        maxLength: ContentGenerationRequestSchema.shape.maxLength
      }),
      requiredPermissions: [PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      handler: createSummarizeContentHandler(deps),
      timeoutMs: 3e4,
      maxRetries: 2,
      rateLimit: {
        maxCalls: 50,
        windowMs: 6e4,
        scope: "user"
      },
      tags: ["content", "summary", "ai"],
      enabled: true,
      examples: [
        {
          name: "Summarize content",
          description: "Summarize a long explanation",
          input: {
            content: "Long content text here...",
            maxLength: 200
          }
        }
      ]
    }
  ];
}

// src/mentor-tools/scheduling-tools.ts
var import_zod6 = require("zod");
function createScheduleSessionHandler(deps) {
  return async (input, _context) => {
    const request = input;
    try {
      const blocks = generateStudyBlocks(request);
      const startTime = calculateStartTime(request);
      const endTime = new Date(startTime.getTime() + request.duration * 6e4);
      const session = {
        userId: request.userId,
        goalId: request.goalId,
        startTime,
        endTime,
        blocks,
        totalStudyTime: blocks.filter((b) => b.type === "study").reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 6e4, 0),
        totalBreakTime: blocks.filter((b) => b.type === "break").reduce((sum, b) => sum + (b.endTime.getTime() - b.startTime.getTime()) / 6e4, 0),
        status: "scheduled"
      };
      let savedSession;
      if (deps.sessionRepository) {
        savedSession = await deps.sessionRepository.create(session);
      } else {
        savedSession = {
          ...session,
          id: `session-${Date.now()}`
        };
      }
      deps.logger?.info("Study session created", {
        sessionId: savedSession.id,
        userId: request.userId,
        duration: request.duration
      });
      return {
        success: true,
        output: savedSession
      };
    } catch (error) {
      deps.logger?.error("Failed to create study session", { error, request });
      return {
        success: false,
        error: {
          code: "SESSION_CREATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to create study session",
          recoverable: true
        }
      };
    }
  };
}
function createSetReminderHandler(deps) {
  return async (input, _context) => {
    const request = input;
    try {
      const reminder = {
        userId: request.userId,
        type: request.type,
        message: request.message,
        scheduledFor: request.scheduledFor,
        recurring: !!request.recurring,
        channels: request.channels ?? ["in_app"],
        status: "pending"
      };
      let savedReminder;
      if (deps.reminderRepository) {
        savedReminder = await deps.reminderRepository.create(reminder);
      } else {
        savedReminder = {
          ...reminder,
          id: `reminder-${Date.now()}`,
          createdAt: /* @__PURE__ */ new Date()
        };
      }
      if (deps.notificationService) {
        await deps.notificationService.schedule(
          request.userId,
          request.message,
          request.scheduledFor,
          reminder.channels
        );
      }
      deps.logger?.info("Reminder created", {
        reminderId: savedReminder.id,
        userId: request.userId,
        scheduledFor: request.scheduledFor
      });
      return {
        success: true,
        output: savedReminder
      };
    } catch (error) {
      deps.logger?.error("Failed to create reminder", { error, request });
      return {
        success: false,
        error: {
          code: "REMINDER_CREATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to create reminder",
          recoverable: true
        }
      };
    }
  };
}
function createOptimizeScheduleHandler(deps) {
  return async (input, _context) => {
    const request = input;
    try {
      let existingSessions = [];
      if (deps.sessionRepository) {
        const weekEnd = new Date(request.weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        existingSessions = await deps.sessionRepository.getByUser(request.userId, {
          from: request.weekStart,
          to: weekEnd
        });
      }
      const schedule = generateOptimizedSchedule(request, existingSessions);
      deps.logger?.info("Schedule optimized", {
        userId: request.userId,
        totalHours: schedule.totalHours,
        sessions: schedule.sessions.length
      });
      return {
        success: true,
        output: schedule
      };
    } catch (error) {
      deps.logger?.error("Failed to optimize schedule", { error, request });
      return {
        success: false,
        error: {
          code: "OPTIMIZATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to optimize schedule",
          recoverable: true
        }
      };
    }
  };
}
function createGetScheduleHandler(deps) {
  return async (input, _context) => {
    const { userId, from, to } = input;
    try {
      let sessions = [];
      let reminders = [];
      if (deps.sessionRepository) {
        sessions = await deps.sessionRepository.getByUser(userId, { from, to });
      }
      if (deps.reminderRepository) {
        reminders = await deps.reminderRepository.getByUser(userId, "pending");
      }
      return {
        success: true,
        output: {
          sessions,
          reminders
        }
      };
    } catch (error) {
      deps.logger?.error("Failed to get schedule", { error, userId });
      return {
        success: false,
        error: {
          code: "SCHEDULE_FETCH_FAILED",
          message: error instanceof Error ? error.message : "Failed to get schedule",
          recoverable: true
        }
      };
    }
  };
}
function generateStudyBlocks(request) {
  const blocks = [];
  const breakInterval = request.breakInterval ?? 45;
  const breakDuration = request.breakDuration ?? 10;
  const startTime = calculateStartTime(request);
  let currentTime = startTime.getTime();
  const endTime = currentTime + request.duration * 6e4;
  let blockIndex = 0;
  let topicIndex = 0;
  while (currentTime < endTime) {
    const remainingTime = (endTime - currentTime) / 6e4;
    const studyDuration = Math.min(breakInterval, remainingTime);
    if (studyDuration > 0) {
      const topic = request.topics?.[topicIndex % (request.topics.length || 1)];
      blocks.push({
        id: `block-${blockIndex++}`,
        type: "study",
        startTime: new Date(currentTime),
        endTime: new Date(currentTime + studyDuration * 6e4),
        topic,
        activity: topic ? `Study: ${topic}` : "Focused study",
        completed: false
      });
      currentTime += studyDuration * 6e4;
      topicIndex++;
      const remainingAfterStudy = (endTime - currentTime) / 6e4;
      if (remainingAfterStudy > breakDuration) {
        blocks.push({
          id: `block-${blockIndex++}`,
          type: "break",
          startTime: new Date(currentTime),
          endTime: new Date(currentTime + breakDuration * 6e4),
          activity: "Take a break",
          completed: false
        });
        currentTime += breakDuration * 6e4;
      }
    } else {
      break;
    }
  }
  return blocks;
}
function calculateStartTime(request) {
  const now = /* @__PURE__ */ new Date();
  if (request.preferredTime) {
    const [startHour, startMinute] = request.preferredTime.start.split(":").map(Number);
    const preferredStart = new Date(now);
    preferredStart.setHours(startHour, startMinute, 0, 0);
    if (preferredStart <= now) {
      preferredStart.setDate(preferredStart.getDate() + 1);
    }
    return preferredStart;
  }
  const defaultStart = new Date(now.getTime() + 30 * 6e4);
  const minutes = defaultStart.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  defaultStart.setMinutes(roundedMinutes, 0, 0);
  return defaultStart;
}
function generateOptimizedSchedule(request, _existingSessions) {
  const schedule = {
    sessions: [],
    totalHours: 0,
    coveragePercentage: 0,
    recommendations: []
  };
  const sortedGoals = [...request.goals].sort((a, b) => {
    if (a.deadline && b.deadline) {
      return a.deadline.getTime() - b.deadline.getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return b.priority - a.priority;
  });
  let totalAllocatedMinutes = 0;
  const totalNeededMinutes = sortedGoals.reduce((sum, g) => sum + g.estimatedMinutes, 0);
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayNumber = (request.weekStart.getDay() + dayOffset) % 7;
    if (!request.preferences.preferredDays.includes(dayNumber)) {
      continue;
    }
    const date = new Date(request.weekStart);
    date.setDate(date.getDate() + dayOffset);
    const daySessions = [];
    let dailyMinutes = 0;
    for (const goal of sortedGoals) {
      if (dailyMinutes >= request.preferences.dailyStudyLimit) {
        break;
      }
      const sessionDuration = Math.min(
        goal.estimatedMinutes,
        request.preferences.dailyStudyLimit - dailyMinutes,
        90
        // Max 90 minutes per session
      );
      if (sessionDuration >= 15) {
        const startTime = new Date(date);
        startTime.setHours(request.preferences.preferredHours.start, 0, 0, 0);
        startTime.setMinutes(startTime.getMinutes() + dailyMinutes);
        const endTime = new Date(startTime.getTime() + sessionDuration * 6e4);
        daySessions.push({
          id: `opt-session-${dayOffset}-${daySessions.length}`,
          userId: request.userId,
          goalId: goal.id,
          startTime,
          endTime,
          blocks: [],
          totalStudyTime: sessionDuration,
          totalBreakTime: 0,
          status: "scheduled"
        });
        dailyMinutes += sessionDuration;
        totalAllocatedMinutes += sessionDuration;
      }
    }
    if (daySessions.length > 0) {
      schedule.sessions.push({
        date,
        sessions: daySessions
      });
    }
  }
  schedule.totalHours = totalAllocatedMinutes / 60;
  schedule.coveragePercentage = totalNeededMinutes > 0 ? Math.min(100, totalAllocatedMinutes / totalNeededMinutes * 100) : 100;
  if (schedule.coveragePercentage < 100) {
    schedule.recommendations.push(
      `Current schedule covers ${schedule.coveragePercentage.toFixed(0)}% of your goals. Consider extending study time or adding more days.`
    );
  }
  if (sortedGoals.some((g) => g.deadline)) {
    schedule.recommendations.push(
      "You have goals with deadlines. Prioritize these in your daily schedule."
    );
  }
  return schedule;
}
function createSchedulingTools(deps) {
  return [
    {
      id: "schedule-session",
      name: "Schedule Study Session",
      description: "Create a structured study session with breaks and focused time blocks",
      category: ToolCategory.SYSTEM,
      version: "1.0.0",
      inputSchema: StudySessionRequestSchema,
      requiredPermissions: [PermissionLevel.WRITE],
      confirmationType: ConfirmationType.IMPLICIT,
      handler: createScheduleSessionHandler(deps),
      timeoutMs: 1e4,
      maxRetries: 2,
      tags: ["scheduling", "study", "session"],
      enabled: true,
      examples: [
        {
          name: "Create 2-hour session",
          description: "Schedule a 2-hour study session with breaks",
          input: {
            userId: "user-123",
            duration: 120,
            topics: ["React Hooks", "State Management"],
            breakInterval: 45,
            breakDuration: 10
          }
        }
      ]
    },
    {
      id: "schedule-reminder",
      name: "Set Reminder",
      description: "Create a reminder for study sessions, deadlines, or check-ins",
      category: ToolCategory.COMMUNICATION,
      version: "1.0.0",
      inputSchema: ReminderRequestSchema,
      requiredPermissions: [PermissionLevel.WRITE],
      confirmationType: ConfirmationType.IMPLICIT,
      handler: createSetReminderHandler(deps),
      timeoutMs: 5e3,
      maxRetries: 2,
      tags: ["scheduling", "reminder", "notification"],
      enabled: true,
      examples: [
        {
          name: "Study reminder",
          description: "Set a reminder for tomorrow morning",
          input: {
            userId: "user-123",
            type: "study",
            message: "Time for your React Hooks study session!",
            scheduledFor: new Date(Date.now() + 864e5),
            channels: ["push", "in_app"]
          }
        }
      ]
    },
    {
      id: "schedule-optimize",
      name: "Optimize Schedule",
      description: "Generate an optimized weekly study schedule based on goals and preferences",
      category: ToolCategory.ANALYTICS,
      version: "1.0.0",
      inputSchema: import_zod6.z.object({
        userId: import_zod6.z.string().min(1),
        weekStart: import_zod6.z.coerce.date(),
        goals: import_zod6.z.array(
          import_zod6.z.object({
            id: import_zod6.z.string(),
            title: import_zod6.z.string(),
            estimatedMinutes: import_zod6.z.number().int().min(15),
            deadline: import_zod6.z.coerce.date().optional(),
            priority: import_zod6.z.number().int().min(1).max(5)
          })
        ),
        preferences: import_zod6.z.object({
          dailyStudyLimit: import_zod6.z.number().int().min(30).max(480),
          preferredDays: import_zod6.z.array(import_zod6.z.number().int().min(0).max(6)),
          preferredHours: import_zod6.z.object({
            start: import_zod6.z.number().int().min(0).max(23),
            end: import_zod6.z.number().int().min(0).max(23)
          }),
          breakFrequency: import_zod6.z.number().int().min(15).max(120)
        })
      }),
      requiredPermissions: [PermissionLevel.READ, PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      handler: createOptimizeScheduleHandler(deps),
      timeoutMs: 15e3,
      maxRetries: 2,
      tags: ["scheduling", "optimization", "planning"],
      enabled: true,
      examples: [
        {
          name: "Weekly optimization",
          description: "Optimize schedule for the week",
          input: {
            userId: "user-123",
            weekStart: /* @__PURE__ */ new Date(),
            goals: [
              { id: "goal-1", title: "Learn React", estimatedMinutes: 180, priority: 5 }
            ],
            preferences: {
              dailyStudyLimit: 120,
              preferredDays: [1, 2, 3, 4, 5],
              preferredHours: { start: 9, end: 18 },
              breakFrequency: 45
            }
          }
        }
      ]
    },
    {
      id: "schedule-get",
      name: "Get Schedule",
      description: "Retrieve user study sessions and reminders",
      category: ToolCategory.SYSTEM,
      version: "1.0.0",
      inputSchema: import_zod6.z.object({
        userId: import_zod6.z.string().min(1),
        from: import_zod6.z.coerce.date().optional(),
        to: import_zod6.z.coerce.date().optional()
      }),
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      handler: createGetScheduleHandler(deps),
      timeoutMs: 1e4,
      maxRetries: 2,
      tags: ["scheduling", "query"],
      enabled: true,
      examples: [
        {
          name: "Get this week",
          description: "Get schedule for current week",
          input: {
            userId: "user-123"
          }
        }
      ]
    }
  ];
}

// src/mentor-tools/notification-tools.ts
var import_zod7 = require("zod");
function createSendNotificationHandler(deps) {
  return async (input, _context) => {
    const request = input;
    try {
      const channels = request.channels ?? ["in_app"];
      const notification = {
        userId: request.userId,
        type: request.type,
        title: request.title,
        body: request.body,
        priority: request.priority,
        channels,
        data: request.data,
        status: "pending",
        expiresAt: request.expiresAt,
        actionUrl: request.actionUrl,
        actionLabel: request.actionLabel
      };
      let savedNotification;
      if (deps.notificationRepository) {
        savedNotification = await deps.notificationRepository.create(notification);
      } else {
        savedNotification = {
          ...notification,
          id: `notif-${Date.now()}`,
          createdAt: /* @__PURE__ */ new Date()
        };
      }
      const deliveryResults = {};
      if (deps.deliveryService) {
        for (const channel of channels) {
          try {
            switch (channel) {
              case "push":
                deliveryResults.push = await deps.deliveryService.sendPush(
                  request.userId,
                  request.title,
                  request.body
                );
                break;
              case "email":
                deliveryResults.email = await deps.deliveryService.sendEmail(
                  request.userId,
                  request.title,
                  request.body
                );
                break;
              case "sms":
                deliveryResults.sms = await deps.deliveryService.sendSMS(
                  request.userId,
                  `${request.title}: ${request.body}`
                );
                break;
              case "in_app":
                deliveryResults.in_app = true;
                break;
            }
          } catch (error) {
            deps.logger?.warn(`Failed to deliver via ${channel}`, { error });
            deliveryResults[channel] = false;
          }
        }
      }
      const anyDelivered = Object.values(deliveryResults).some((v) => v);
      if (anyDelivered && deps.notificationRepository) {
        await deps.notificationRepository.update(savedNotification.id, {
          status: "sent",
          sentAt: /* @__PURE__ */ new Date()
        });
        savedNotification.status = "sent";
        savedNotification.sentAt = /* @__PURE__ */ new Date();
      }
      deps.logger?.info("Notification sent", {
        notificationId: savedNotification.id,
        userId: request.userId,
        channels,
        deliveryResults
      });
      return {
        success: true,
        output: savedNotification
      };
    } catch (error) {
      deps.logger?.error("Failed to send notification", { error, request });
      return {
        success: false,
        error: {
          code: "NOTIFICATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to send notification",
          recoverable: true
        }
      };
    }
  };
}
function createGetNotificationsHandler(deps) {
  return async (input, _context) => {
    const { userId, status, limit } = input;
    try {
      let notifications = [];
      if (deps.notificationRepository) {
        notifications = await deps.notificationRepository.getByUser(userId, {
          status,
          limit: limit ?? 50
        });
      }
      const unreadCount = notifications.filter(
        (n) => n.status !== "read" && n.status !== "dismissed"
      ).length;
      return {
        success: true,
        output: {
          notifications,
          unreadCount
        }
      };
    } catch (error) {
      deps.logger?.error("Failed to get notifications", { error, userId });
      return {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: error instanceof Error ? error.message : "Failed to get notifications",
          recoverable: true
        }
      };
    }
  };
}
function createMarkReadHandler(deps) {
  return async (input, _context) => {
    const { userId, notificationId, markAll } = input;
    try {
      let updated = 0;
      if (deps.notificationRepository) {
        if (markAll) {
          updated = await deps.notificationRepository.markAllRead(userId);
        } else if (notificationId) {
          await deps.notificationRepository.markRead(notificationId);
          updated = 1;
        }
      }
      return {
        success: true,
        output: { updated }
      };
    } catch (error) {
      deps.logger?.error("Failed to mark notifications read", { error, userId });
      return {
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: error instanceof Error ? error.message : "Failed to mark notifications read",
          recoverable: true
        }
      };
    }
  };
}
function createGenerateProgressReportHandler(deps) {
  return async (input, _context) => {
    const request = input;
    try {
      const endDate = /* @__PURE__ */ new Date();
      const startDate = /* @__PURE__ */ new Date();
      switch (request.period) {
        case "daily":
          startDate.setDate(startDate.getDate() - 1);
          break;
        case "weekly":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }
      let metrics = {
        studyTime: 0,
        lessonsCompleted: 0,
        assessmentsTaken: 0,
        averageScore: 0,
        streakDays: 0,
        masteryProgress: 0
      };
      if (deps.progressRepository) {
        metrics = await deps.progressRepository.getStudyMetrics(
          request.userId,
          startDate,
          endDate
        );
      }
      const report = {
        userId: request.userId,
        period: request.period,
        startDate,
        endDate,
        metrics,
        generatedAt: /* @__PURE__ */ new Date()
      };
      if (request.includeComparison) {
        const previousEndDate = startDate;
        const previousStartDate = new Date(startDate);
        switch (request.period) {
          case "daily":
            previousStartDate.setDate(previousStartDate.getDate() - 1);
            break;
          case "weekly":
            previousStartDate.setDate(previousStartDate.getDate() - 7);
            break;
          case "monthly":
            previousStartDate.setMonth(previousStartDate.getMonth() - 1);
            break;
        }
        if (deps.progressRepository) {
          const previousMetrics = await deps.progressRepository.getStudyMetrics(
            request.userId,
            previousStartDate,
            previousEndDate
          );
          const studyTimeChange = previousMetrics.studyTime > 0 ? (metrics.studyTime - previousMetrics.studyTime) / previousMetrics.studyTime * 100 : metrics.studyTime > 0 ? 100 : 0;
          const performanceChange = previousMetrics.averageScore > 0 ? (metrics.averageScore - previousMetrics.averageScore) / previousMetrics.averageScore * 100 : metrics.averageScore > 0 ? 100 : 0;
          let trend = "stable";
          if (studyTimeChange > 10 && performanceChange >= 0) {
            trend = "improving";
          } else if (studyTimeChange < -10 || performanceChange < -10) {
            trend = "declining";
          }
          report.comparison = {
            studyTimeChange,
            performanceChange,
            trend
          };
        }
      }
      if (request.includeGoals && deps.progressRepository) {
        report.goals = await deps.progressRepository.getGoalProgress(request.userId);
      }
      if (request.includeRecommendations) {
        report.recommendations = generateRecommendations(metrics, report.comparison);
      }
      deps.logger?.info("Progress report generated", {
        userId: request.userId,
        period: request.period
      });
      return {
        success: true,
        output: report
      };
    } catch (error) {
      deps.logger?.error("Failed to generate progress report", { error, request });
      return {
        success: false,
        error: {
          code: "REPORT_GENERATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to generate progress report",
          recoverable: true
        }
      };
    }
  };
}
function createSendAchievementHandler(deps) {
  return async (input, _context) => {
    const { userId, achievement, details } = input;
    try {
      const notification = {
        userId,
        type: "achievement",
        title: `Achievement Unlocked: ${achievement.name}`,
        body: achievement.description,
        priority: "high",
        channels: ["push", "in_app"],
        data: {
          achievementId: achievement.id,
          icon: achievement.icon,
          rarity: achievement.rarity,
          ...details
        },
        status: "pending"
      };
      let savedNotification;
      if (deps.notificationRepository) {
        savedNotification = await deps.notificationRepository.create(notification);
      } else {
        savedNotification = {
          ...notification,
          id: `notif-achievement-${Date.now()}`,
          createdAt: /* @__PURE__ */ new Date()
        };
      }
      if (deps.deliveryService) {
        await deps.deliveryService.sendPush(
          userId,
          notification.title,
          notification.body
        );
        savedNotification.status = "sent";
        savedNotification.sentAt = /* @__PURE__ */ new Date();
      }
      deps.logger?.info("Achievement notification sent", {
        userId,
        achievementId: achievement.id
      });
      return {
        success: true,
        output: savedNotification
      };
    } catch (error) {
      deps.logger?.error("Failed to send achievement notification", { error, userId });
      return {
        success: false,
        error: {
          code: "ACHIEVEMENT_NOTIFICATION_FAILED",
          message: error instanceof Error ? error.message : "Failed to send achievement notification",
          recoverable: true
        }
      };
    }
  };
}
function generateRecommendations(metrics, comparison) {
  const recommendations = [];
  if (metrics.studyTime < 30) {
    recommendations.push(
      "Try to increase your daily study time. Even 15 more minutes can make a big difference."
    );
  } else if (metrics.studyTime > 180) {
    recommendations.push(
      "Great dedication! Remember to take breaks to maintain focus and prevent burnout."
    );
  }
  if (metrics.averageScore < 70) {
    recommendations.push(
      "Consider reviewing the material before assessments. Practice exercises can help improve your scores."
    );
  } else if (metrics.averageScore >= 90) {
    recommendations.push(
      "Excellent performance! You might be ready to tackle more advanced topics."
    );
  }
  if (metrics.streakDays >= 7) {
    recommendations.push(
      `Amazing ${metrics.streakDays}-day streak! Keep it up to maintain your learning momentum.`
    );
  } else if (metrics.streakDays === 0) {
    recommendations.push(
      "Start a study streak today! Consistent daily practice leads to better retention."
    );
  }
  if (comparison) {
    if (comparison.trend === "declining") {
      recommendations.push(
        "Your study activity has decreased recently. Consider setting reminders to get back on track."
      );
    } else if (comparison.trend === "improving") {
      recommendations.push(
        "Your progress is trending upward! Keep up the excellent work."
      );
    }
  }
  return recommendations;
}
function createNotificationTools(deps) {
  return [
    {
      id: "notification-send",
      name: "Send Notification",
      description: "Send a notification to a user through specified channels",
      category: ToolCategory.COMMUNICATION,
      version: "1.0.0",
      inputSchema: NotificationRequestSchema,
      requiredPermissions: [PermissionLevel.WRITE, PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.IMPLICIT,
      handler: createSendNotificationHandler(deps),
      timeoutMs: 15e3,
      maxRetries: 3,
      rateLimit: {
        maxCalls: 100,
        windowMs: 6e4,
        scope: "user"
      },
      tags: ["notification", "communication"],
      enabled: true,
      examples: [
        {
          name: "Send progress update",
          description: "Notify user of their weekly progress",
          input: {
            userId: "user-123",
            type: "progress_update",
            title: "Weekly Progress Update",
            body: "Great job this week! You studied for 5 hours and completed 3 lessons.",
            priority: "normal",
            channels: ["push", "in_app"]
          }
        }
      ]
    },
    {
      id: "notification-get",
      name: "Get Notifications",
      description: "Retrieve notifications for a user",
      category: ToolCategory.COMMUNICATION,
      version: "1.0.0",
      inputSchema: import_zod7.z.object({
        userId: import_zod7.z.string().min(1),
        status: import_zod7.z.string().optional(),
        limit: import_zod7.z.number().int().min(1).max(100).optional()
      }),
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      handler: createGetNotificationsHandler(deps),
      timeoutMs: 5e3,
      maxRetries: 2,
      tags: ["notification", "query"],
      enabled: true
    },
    {
      id: "notification-mark-read",
      name: "Mark Notifications Read",
      description: "Mark notifications as read",
      category: ToolCategory.COMMUNICATION,
      version: "1.0.0",
      inputSchema: import_zod7.z.object({
        userId: import_zod7.z.string().min(1),
        notificationId: import_zod7.z.string().optional(),
        markAll: import_zod7.z.boolean().optional()
      }),
      requiredPermissions: [PermissionLevel.WRITE],
      confirmationType: ConfirmationType.NONE,
      handler: createMarkReadHandler(deps),
      timeoutMs: 5e3,
      maxRetries: 2,
      tags: ["notification", "update"],
      enabled: true
    },
    {
      id: "notification-progress-report",
      name: "Generate Progress Report",
      description: "Generate a progress report for a user",
      category: ToolCategory.ANALYTICS,
      version: "1.0.0",
      inputSchema: ProgressReportRequestSchema,
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      handler: createGenerateProgressReportHandler(deps),
      timeoutMs: 3e4,
      maxRetries: 2,
      tags: ["notification", "analytics", "report"],
      enabled: true,
      examples: [
        {
          name: "Weekly progress",
          description: "Generate weekly progress report",
          input: {
            userId: "user-123",
            period: "weekly",
            includeComparison: true,
            includeGoals: true,
            includeRecommendations: true
          }
        }
      ]
    },
    {
      id: "notification-achievement",
      name: "Send Achievement Notification",
      description: "Notify user of an unlocked achievement",
      category: ToolCategory.COMMUNICATION,
      version: "1.0.0",
      inputSchema: import_zod7.z.object({
        userId: import_zod7.z.string().min(1),
        achievement: import_zod7.z.object({
          id: import_zod7.z.string(),
          name: import_zod7.z.string(),
          description: import_zod7.z.string(),
          icon: import_zod7.z.string().optional(),
          rarity: import_zod7.z.enum(["common", "uncommon", "rare", "epic", "legendary"]).optional()
        }),
        details: import_zod7.z.record(import_zod7.z.unknown()).optional()
      }),
      requiredPermissions: [PermissionLevel.WRITE, PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      handler: createSendAchievementHandler(deps),
      timeoutMs: 1e4,
      maxRetries: 3,
      tags: ["notification", "achievement", "gamification"],
      enabled: true,
      examples: [
        {
          name: "First lesson badge",
          description: "Award first lesson completion badge",
          input: {
            userId: "user-123",
            achievement: {
              id: "first-lesson",
              name: "First Steps",
              description: "Completed your first lesson!",
              icon: "trophy",
              rarity: "common"
            }
          }
        }
      ]
    }
  ];
}

// src/mentor-tools/index.ts
function createMentorTools(deps) {
  const contentTools = createContentTools({
    aiAdapter: deps.aiAdapter,
    logger: deps.logger,
    ...deps.content
  });
  const schedulingTools = createSchedulingTools({
    logger: deps.logger,
    ...deps.scheduling
  });
  const notificationTools = createNotificationTools({
    logger: deps.logger,
    ...deps.notification
  });
  return [...contentTools, ...schedulingTools, ...notificationTools];
}
function getMentorToolById(tools, toolId) {
  return tools.find((t) => t.id === toolId);
}
function getMentorToolsByCategory(tools, category) {
  return tools.filter((t) => t.category === category);
}
function getMentorToolsByTags(tools, tags) {
  return tools.filter((t) => t.tags?.some((tag) => tags.includes(tag)));
}

// src/adapters/prisma-tool-stores.ts
function createPrismaToolStore(prisma, toolHandlers) {
  return {
    async register(tool) {
      toolHandlers.set(tool.id, tool.handler);
      await prisma.agentTool.create({
        data: {
          id: tool.id,
          name: tool.name,
          description: tool.description,
          category: tool.category,
          version: tool.version,
          inputSchema: JSON.stringify(tool.inputSchema),
          outputSchema: tool.outputSchema ? JSON.stringify(tool.outputSchema) : null,
          requiredPermissions: tool.requiredPermissions,
          confirmationType: tool.confirmationType,
          timeoutMs: tool.timeoutMs,
          maxRetries: tool.maxRetries,
          rateLimit: tool.rateLimit ? JSON.stringify(tool.rateLimit) : null,
          tags: tool.tags ?? [],
          examples: tool.examples ? JSON.stringify(tool.examples) : null,
          metadata: tool.metadata ? JSON.stringify(tool.metadata) : null,
          enabled: tool.enabled,
          deprecated: tool.deprecated ?? false,
          deprecationMessage: tool.deprecationMessage
        }
      });
    },
    async get(toolId) {
      const record = await prisma.agentTool.findUnique({
        where: { id: toolId }
      });
      if (!record) {
        return null;
      }
      const handler = toolHandlers.get(toolId);
      if (!handler) {
        return null;
      }
      return mapRecordToToolDefinition(record, handler);
    },
    async list(options) {
      const where = {};
      if (options?.category) {
        where.category = options.category;
      }
      if (options?.enabled !== void 0) {
        where.enabled = options.enabled;
      }
      if (options?.deprecated !== void 0) {
        where.deprecated = options.deprecated;
      }
      if (options?.tags?.length) {
        where.tags = { hasSome: options.tags };
      }
      if (options?.search) {
        where.OR = [
          { name: { contains: options.search, mode: "insensitive" } },
          { description: { contains: options.search, mode: "insensitive" } }
        ];
      }
      const records = await prisma.agentTool.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { name: "asc" }
      });
      return records.map((record) => {
        const handler = toolHandlers.get(record.id);
        if (!handler) return null;
        return mapRecordToToolDefinition(record, handler);
      }).filter((t) => t !== null);
    },
    async update(toolId, updates) {
      const data = {};
      if (updates.name) data.name = updates.name;
      if (updates.description) data.description = updates.description;
      if (updates.version) data.version = updates.version;
      if (updates.enabled !== void 0) data.enabled = updates.enabled;
      if (updates.deprecated !== void 0) data.deprecated = updates.deprecated;
      if (updates.deprecationMessage) data.deprecationMessage = updates.deprecationMessage;
      if (updates.timeoutMs) data.timeoutMs = updates.timeoutMs;
      if (updates.maxRetries) data.maxRetries = updates.maxRetries;
      if (updates.tags) data.tags = updates.tags;
      if (updates.rateLimit) data.rateLimit = JSON.stringify(updates.rateLimit);
      if (updates.metadata) data.metadata = JSON.stringify(updates.metadata);
      data.updatedAt = /* @__PURE__ */ new Date();
      const record = await prisma.agentTool.update({
        where: { id: toolId },
        data
      });
      const handler = toolHandlers.get(toolId);
      if (!handler) {
        throw new Error(`Handler not found for tool: ${toolId}`);
      }
      return mapRecordToToolDefinition(record, handler);
    },
    async delete(toolId) {
      await prisma.agentTool.delete({
        where: { id: toolId }
      });
      toolHandlers.delete(toolId);
    },
    async enable(toolId) {
      await prisma.agentTool.update({
        where: { id: toolId },
        data: { enabled: true, updatedAt: /* @__PURE__ */ new Date() }
      });
    },
    async disable(toolId) {
      await prisma.agentTool.update({
        where: { id: toolId },
        data: { enabled: false, updatedAt: /* @__PURE__ */ new Date() }
      });
    }
  };
}
function createPrismaInvocationStore(prisma) {
  return {
    async create(invocation) {
      const record = await prisma.agentToolInvocation.create({
        data: {
          toolId: invocation.toolId,
          userId: invocation.userId,
          sessionId: invocation.sessionId,
          input: JSON.stringify(invocation.input),
          validatedInput: invocation.validatedInput ? JSON.stringify(invocation.validatedInput) : null,
          status: invocation.status,
          confirmationType: invocation.confirmationType,
          confirmationPrompt: invocation.confirmationPrompt,
          userConfirmed: invocation.userConfirmed,
          confirmedAt: invocation.confirmedAt,
          startedAt: invocation.startedAt,
          completedAt: invocation.completedAt,
          duration: invocation.duration,
          result: invocation.result ? JSON.stringify(invocation.result) : null,
          metadata: invocation.metadata ? JSON.stringify(invocation.metadata) : null
        }
      });
      return mapRecordToInvocation(record);
    },
    async get(invocationId) {
      const record = await prisma.agentToolInvocation.findUnique({
        where: { id: invocationId }
      });
      if (!record) {
        return null;
      }
      return mapRecordToInvocation(record);
    },
    async update(invocationId, updates) {
      const data = {};
      if (updates.status) data.status = updates.status;
      if (updates.confirmationPrompt) data.confirmationPrompt = updates.confirmationPrompt;
      if (updates.userConfirmed !== void 0) data.userConfirmed = updates.userConfirmed;
      if (updates.confirmedAt) data.confirmedAt = updates.confirmedAt;
      if (updates.startedAt) data.startedAt = updates.startedAt;
      if (updates.completedAt) data.completedAt = updates.completedAt;
      if (updates.duration) data.duration = updates.duration;
      if (updates.result) data.result = JSON.stringify(updates.result);
      if (updates.metadata) data.metadata = JSON.stringify(updates.metadata);
      data.updatedAt = /* @__PURE__ */ new Date();
      const record = await prisma.agentToolInvocation.update({
        where: { id: invocationId },
        data
      });
      return mapRecordToInvocation(record);
    },
    async getBySession(sessionId, limit) {
      const records = await prisma.agentToolInvocation.findMany({
        where: { sessionId },
        take: limit,
        orderBy: { createdAt: "desc" }
      });
      return records.map(mapRecordToInvocation);
    },
    async getByUser(userId, options) {
      const records = await prisma.agentToolInvocation.findMany({
        where: { userId },
        take: options?.limit,
        skip: options?.offset,
        orderBy: { createdAt: "desc" }
      });
      return records.map(mapRecordToInvocation);
    }
  };
}
function createPrismaAuditStore(prisma) {
  return {
    async log(entry) {
      const record = await prisma.agentAuditLog.create({
        data: {
          level: entry.level,
          action: entry.action,
          userId: entry.userId,
          sessionId: entry.sessionId,
          toolId: entry.toolId,
          invocationId: entry.invocationId,
          input: entry.input ? JSON.stringify(entry.input) : null,
          output: entry.output ? JSON.stringify(entry.output) : null,
          error: entry.error ? JSON.stringify(entry.error) : null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          requestId: entry.requestId,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null
        }
      });
      return mapRecordToAuditEntry(record);
    },
    async query(options) {
      const where = {};
      if (options.userId) where.userId = options.userId;
      if (options.toolId) where.toolId = options.toolId;
      if (options.action?.length) where.action = { in: options.action };
      if (options.level?.length) where.level = { in: options.level };
      if (options.startDate || options.endDate) {
        where.timestamp = {};
        if (options.startDate) where.timestamp.gte = options.startDate;
        if (options.endDate) where.timestamp.lte = options.endDate;
      }
      const records = await prisma.agentAuditLog.findMany({
        where,
        take: options.limit,
        skip: options.offset,
        orderBy: { timestamp: "desc" }
      });
      return records.map(mapRecordToAuditEntry);
    },
    async count(options) {
      const where = {};
      if (options.userId) where.userId = options.userId;
      if (options.toolId) where.toolId = options.toolId;
      if (options.action?.length) where.action = { in: options.action };
      if (options.level?.length) where.level = { in: options.level };
      if (options.startDate || options.endDate) {
        where.timestamp = {};
        if (options.startDate) where.timestamp.gte = options.startDate;
        if (options.endDate) where.timestamp.lte = options.endDate;
      }
      return prisma.agentAuditLog.count({ where });
    }
  };
}
function createPrismaPermissionStore(prisma) {
  return {
    async grant(permission) {
      const record = await prisma.agentPermission.create({
        data: {
          userId: permission.userId,
          toolId: permission.toolId,
          category: permission.category,
          levels: permission.levels,
          grantedBy: permission.grantedBy,
          expiresAt: permission.expiresAt,
          conditions: permission.conditions ? JSON.stringify(permission.conditions) : null
        }
      });
      return mapRecordToPermission(record);
    },
    async revoke(userId, toolId, category) {
      const where = { userId };
      if (toolId) where.toolId = toolId;
      if (category) where.category = category;
      await prisma.agentPermission.deleteMany({ where });
    },
    async check(userId, toolId, requiredLevels) {
      const permissions = await prisma.agentPermission.findMany({
        where: {
          userId,
          OR: [
            { toolId },
            { toolId: null }
            // Global permissions
          ]
        }
      });
      const grantedLevels = /* @__PURE__ */ new Set();
      const now = /* @__PURE__ */ new Date();
      for (const record of permissions) {
        if (record.expiresAt && record.expiresAt < now) {
          continue;
        }
        for (const level of record.levels) {
          grantedLevels.add(level);
        }
      }
      const missingLevels = requiredLevels.filter((l) => !grantedLevels.has(l));
      return {
        granted: missingLevels.length === 0,
        grantedLevels: Array.from(grantedLevels),
        missingLevels,
        reason: missingLevels.length > 0 ? `Missing permissions: ${missingLevels.join(", ")}` : void 0
      };
    },
    async getUserPermissions(userId) {
      const records = await prisma.agentPermission.findMany({
        where: { userId }
      });
      return records.map(mapRecordToPermission);
    }
  };
}
function createPrismaConfirmationStore(prisma) {
  return {
    async create(request) {
      const record = await prisma.agentConfirmation.create({
        data: {
          invocationId: request.invocationId,
          toolId: request.toolId,
          toolName: request.toolName,
          userId: request.userId,
          title: request.title,
          message: request.message,
          details: request.details ? JSON.stringify(request.details) : null,
          type: request.type,
          severity: request.severity,
          confirmText: request.confirmText,
          cancelText: request.cancelText,
          timeout: request.timeout,
          status: request.status,
          expiresAt: request.expiresAt
        }
      });
      return mapRecordToConfirmation(record);
    },
    async get(requestId) {
      const record = await prisma.agentConfirmation.findUnique({
        where: { id: requestId }
      });
      if (!record) {
        return null;
      }
      return mapRecordToConfirmation(record);
    },
    async getByInvocation(invocationId) {
      const record = await prisma.agentConfirmation.findFirst({
        where: { invocationId }
      });
      if (!record) {
        return null;
      }
      return mapRecordToConfirmation(record);
    },
    async respond(requestId, confirmed) {
      const record = await prisma.agentConfirmation.update({
        where: { id: requestId },
        data: {
          status: confirmed ? "confirmed" : "denied",
          respondedAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }
      });
      return mapRecordToConfirmation(record);
    },
    async getPending(userId) {
      const records = await prisma.agentConfirmation.findMany({
        where: {
          userId,
          status: "pending"
        }
      });
      return records.map(mapRecordToConfirmation);
    }
  };
}
function mapRecordToToolDefinition(record, handler) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    category: record.category,
    version: record.version,
    inputSchema: JSON.parse(record.inputSchema),
    outputSchema: record.outputSchema ? JSON.parse(record.outputSchema) : void 0,
    requiredPermissions: record.requiredPermissions,
    confirmationType: record.confirmationType,
    handler,
    timeoutMs: record.timeoutMs,
    maxRetries: record.maxRetries,
    rateLimit: record.rateLimit ? JSON.parse(record.rateLimit) : void 0,
    tags: record.tags,
    examples: record.examples ? JSON.parse(record.examples) : void 0,
    metadata: record.metadata ? JSON.parse(record.metadata) : void 0,
    enabled: record.enabled,
    deprecated: record.deprecated,
    deprecationMessage: record.deprecationMessage
  };
}
function mapRecordToInvocation(record) {
  return {
    id: record.id,
    toolId: record.toolId,
    userId: record.userId,
    sessionId: record.sessionId,
    input: record.input ? JSON.parse(record.input) : void 0,
    validatedInput: record.validatedInput ? JSON.parse(record.validatedInput) : void 0,
    status: record.status,
    confirmationType: record.confirmationType,
    confirmationPrompt: record.confirmationPrompt,
    userConfirmed: record.userConfirmed,
    confirmedAt: record.confirmedAt,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    duration: record.duration,
    result: record.result ? JSON.parse(record.result) : void 0,
    metadata: record.metadata ? JSON.parse(record.metadata) : void 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}
function mapRecordToAuditEntry(record) {
  return {
    id: record.id,
    timestamp: record.timestamp,
    level: record.level,
    action: record.action,
    userId: record.userId,
    sessionId: record.sessionId,
    toolId: record.toolId,
    invocationId: record.invocationId,
    input: record.input ? JSON.parse(record.input) : void 0,
    output: record.output ? JSON.parse(record.output) : void 0,
    error: record.error ? JSON.parse(record.error) : void 0,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    requestId: record.requestId,
    metadata: record.metadata ? JSON.parse(record.metadata) : void 0
  };
}
function mapRecordToPermission(record) {
  return {
    userId: record.userId,
    toolId: record.toolId,
    category: record.category,
    levels: record.levels,
    grantedBy: record.grantedBy,
    grantedAt: record.grantedAt,
    expiresAt: record.expiresAt,
    conditions: record.conditions ? JSON.parse(record.conditions) : void 0
  };
}
function mapRecordToConfirmation(record) {
  return {
    id: record.id,
    invocationId: record.invocationId,
    toolId: record.toolId,
    toolName: record.toolName,
    userId: record.userId,
    title: record.title,
    message: record.message,
    details: record.details ? JSON.parse(record.details) : void 0,
    type: record.type,
    severity: record.severity,
    confirmText: record.confirmText,
    cancelText: record.cancelText,
    timeout: record.timeout,
    status: record.status,
    respondedAt: record.respondedAt,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt
  };
}

// src/memory/types.ts
var import_zod8 = require("zod");
var EmbeddingSourceType = {
  COURSE_CONTENT: "course_content",
  CHAPTER_CONTENT: "chapter_content",
  SECTION_CONTENT: "section_content",
  USER_NOTE: "user_note",
  CONVERSATION: "conversation",
  QUESTION: "question",
  ANSWER: "answer",
  SUMMARY: "summary",
  ARTIFACT: "artifact",
  EXTERNAL_RESOURCE: "external_resource"
};
var EntityType = {
  CONCEPT: "concept",
  TOPIC: "topic",
  SKILL: "skill",
  COURSE: "course",
  CHAPTER: "chapter",
  SECTION: "section",
  USER: "user",
  QUESTION: "question",
  RESOURCE: "resource",
  PREREQUISITE: "prerequisite",
  LEARNING_OBJECTIVE: "learning_objective"
};
var RelationshipType = {
  PREREQUISITE_OF: "prerequisite_of",
  PART_OF: "part_of",
  RELATED_TO: "related_to",
  TEACHES: "teaches",
  REQUIRES: "requires",
  FOLLOWS: "follows",
  SIMILAR_TO: "similar_to",
  MASTERED_BY: "mastered_by",
  STRUGGLED_WITH: "struggled_with",
  COMPLETED: "completed",
  REFERENCES: "references"
};
var EmotionalState = {
  CONFIDENT: "confident",
  CURIOUS: "curious",
  FRUSTRATED: "frustrated",
  ENGAGED: "engaged",
  BORED: "bored",
  OVERWHELMED: "overwhelmed",
  NEUTRAL: "neutral"
};
var ContextAction = {
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  TOPIC_CHANGE: "topic_change",
  GOAL_SET: "goal_set",
  GOAL_COMPLETED: "goal_completed",
  CONCEPT_LEARNED: "concept_learned",
  QUESTION_ASKED: "question_asked",
  ARTIFACT_CREATED: "artifact_created",
  PREFERENCE_UPDATED: "preference_updated",
  INSIGHT_GENERATED: "insight_generated"
};
var MemoryType = {
  FACTUAL: "factual",
  PROCEDURAL: "procedural",
  EPISODIC: "episodic",
  SEMANTIC: "semantic",
  CONTEXTUAL: "contextual"
};
var RetrievalStrategy = {
  VECTOR_SEARCH: "vector_search",
  GRAPH_TRAVERSAL: "graph_traversal",
  KEYWORD_MATCH: "keyword_match",
  RECENCY_BOOST: "recency_boost",
  USER_CONTEXT: "user_context",
  HYBRID: "hybrid"
};
var JourneyEventType = {
  STARTED_COURSE: "started_course",
  COMPLETED_CHAPTER: "completed_chapter",
  COMPLETED_SECTION: "completed_section",
  PASSED_QUIZ: "passed_quiz",
  FAILED_QUIZ: "failed_quiz",
  EARNED_BADGE: "earned_badge",
  REACHED_MILESTONE: "reached_milestone",
  MASTERED_CONCEPT: "mastered_concept",
  ASKED_QUESTION: "asked_question",
  RECEIVED_HELP: "received_help",
  CREATED_ARTIFACT: "created_artifact",
  REVIEWED_CONTENT: "reviewed_content",
  STREAK_CONTINUED: "streak_continued",
  STREAK_BROKEN: "streak_broken",
  GOAL_ACHIEVED: "goal_achieved",
  LEVEL_UP: "level_up"
};
var MilestoneType = {
  COURSE_COMPLETION: "course_completion",
  CHAPTER_MASTERY: "chapter_mastery",
  SKILL_ACQUISITION: "skill_acquisition",
  STREAK: "streak",
  ENGAGEMENT: "engagement",
  HELPING_OTHERS: "helping_others",
  EXPLORATION: "exploration",
  CONSISTENCY: "consistency"
};
var LearningPhase = {
  ONBOARDING: "onboarding",
  EXPLORATION: "exploration",
  BUILDING_FOUNDATION: "building_foundation",
  DEEPENING: "deepening",
  MASTERY: "mastery",
  MAINTENANCE: "maintenance"
};
var VectorSearchOptionsSchema = import_zod8.z.object({
  topK: import_zod8.z.number().min(1).max(100),
  minScore: import_zod8.z.number().min(0).max(1).optional(),
  maxDistance: import_zod8.z.number().min(0).optional(),
  filter: import_zod8.z.object({
    sourceTypes: import_zod8.z.array(import_zod8.z.string()).optional(),
    userIds: import_zod8.z.array(import_zod8.z.string()).optional(),
    courseIds: import_zod8.z.array(import_zod8.z.string()).optional(),
    tags: import_zod8.z.array(import_zod8.z.string()).optional(),
    dateRange: import_zod8.z.object({
      start: import_zod8.z.date().optional(),
      end: import_zod8.z.date().optional()
    }).optional()
  }).optional(),
  includeMetadata: import_zod8.z.boolean().optional()
});
var GraphQueryOptionsSchema = import_zod8.z.object({
  maxDepth: import_zod8.z.number().min(1).max(10).optional(),
  relationshipTypes: import_zod8.z.array(import_zod8.z.string()).optional(),
  entityTypes: import_zod8.z.array(import_zod8.z.string()).optional(),
  minWeight: import_zod8.z.number().min(0).max(1).optional(),
  limit: import_zod8.z.number().min(1).max(1e3).optional(),
  direction: import_zod8.z.enum(["outgoing", "incoming", "both"]).optional()
});
var RetrievalQuerySchema = import_zod8.z.object({
  query: import_zod8.z.string().min(1),
  userId: import_zod8.z.string().optional(),
  courseId: import_zod8.z.string().optional(),
  memoryTypes: import_zod8.z.array(import_zod8.z.string()).optional(),
  sourceTypes: import_zod8.z.array(import_zod8.z.string()).optional(),
  timeRange: import_zod8.z.object({
    start: import_zod8.z.date().optional(),
    end: import_zod8.z.date().optional()
  }).optional(),
  limit: import_zod8.z.number().min(1).max(100).optional(),
  minRelevance: import_zod8.z.number().min(0).max(1).optional(),
  includeRelated: import_zod8.z.boolean().optional(),
  hybridSearch: import_zod8.z.boolean().optional()
});

// ../../node_modules/.pnpm/uuid@9.0.1/node_modules/uuid/dist/esm-node/rng.js
var import_crypto = __toESM(require("crypto"));
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    import_crypto.default.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// ../../node_modules/.pnpm/uuid@9.0.1/node_modules/uuid/dist/esm-node/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

// ../../node_modules/.pnpm/uuid@9.0.1/node_modules/uuid/dist/esm-node/native.js
var import_crypto2 = __toESM(require("crypto"));
var native_default = {
  randomUUID: import_crypto2.default.randomUUID
};

// ../../node_modules/.pnpm/uuid@9.0.1/node_modules/uuid/dist/esm-node/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// src/memory/vector-store.ts
var InMemoryVectorAdapter = class {
  embeddings = /* @__PURE__ */ new Map();
  async save(embedding) {
    this.embeddings.set(embedding.id, embedding);
  }
  async saveBatch(embeddings) {
    for (const embedding of embeddings) {
      this.embeddings.set(embedding.id, embedding);
    }
  }
  async load(id) {
    return this.embeddings.get(id) ?? null;
  }
  async loadAll(filter) {
    let results = Array.from(this.embeddings.values());
    if (filter) {
      results = this.applyFilter(results, filter);
    }
    return results;
  }
  async delete(id) {
    return this.embeddings.delete(id);
  }
  async deleteBatch(ids) {
    let count = 0;
    for (const id of ids) {
      if (this.embeddings.delete(id)) {
        count++;
      }
    }
    return count;
  }
  async deleteByFilter(filter) {
    const all = Array.from(this.embeddings.values());
    const toDelete = this.applyFilter(all, filter);
    let count = 0;
    for (const embedding of toDelete) {
      if (this.embeddings.delete(embedding.id)) {
        count++;
      }
    }
    return count;
  }
  async update(id, updates) {
    const existing = this.embeddings.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      // Preserve ID
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.embeddings.set(id, updated);
    return updated;
  }
  async count(filter) {
    if (!filter) return this.embeddings.size;
    return this.applyFilter(Array.from(this.embeddings.values()), filter).length;
  }
  applyFilter(embeddings, filter) {
    return embeddings.filter((e) => {
      if (filter.sourceTypes?.length) {
        if (!filter.sourceTypes.includes(e.metadata.sourceType)) return false;
      }
      if (filter.userIds?.length) {
        if (!e.metadata.userId || !filter.userIds.includes(e.metadata.userId))
          return false;
      }
      if (filter.courseIds?.length) {
        if (!e.metadata.courseId || !filter.courseIds.includes(e.metadata.courseId))
          return false;
      }
      if (filter.tags?.length) {
        const hasTag = filter.tags.some((tag) => e.metadata.tags.includes(tag));
        if (!hasTag) return false;
      }
      if (filter.dateRange) {
        if (filter.dateRange.start && e.createdAt < filter.dateRange.start)
          return false;
        if (filter.dateRange.end && e.createdAt > filter.dateRange.end)
          return false;
      }
      return true;
    });
  }
  // Utility method for testing
  clear() {
    this.embeddings.clear();
  }
};
var VectorCache = class {
  cache = /* @__PURE__ */ new Map();
  maxSize;
  ttlMs;
  constructor(maxSize = 1e3, ttlSeconds = 300) {
    this.maxSize = maxSize;
    this.ttlMs = ttlSeconds * 1e3;
  }
  set(embedding) {
    this.evictExpired();
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(embedding.id, {
      embedding,
      expiresAt: Date.now() + this.ttlMs
    });
  }
  get(id) {
    const entry = this.cache.get(id);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(id);
      return null;
    }
    return entry.embedding;
  }
  delete(id) {
    return this.cache.delete(id);
  }
  clear() {
    this.cache.clear();
  }
  evictExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
};
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimensions");
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;
  return dotProduct / magnitude;
}
function euclideanDistance(a, b) {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimensions");
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
var VectorStore = class {
  embeddingProvider;
  adapter;
  logger;
  cache;
  constructor(config) {
    this.embeddingProvider = config.embeddingProvider;
    this.adapter = config.persistenceAdapter ?? new InMemoryVectorAdapter();
    this.logger = config.logger ?? console;
    if (config.cacheEnabled !== false) {
      this.cache = new VectorCache(
        config.cacheMaxSize ?? 1e3,
        config.cacheTTLSeconds ?? 300
      );
    } else {
      this.cache = null;
    }
  }
  /**
   * Generate content hash for deduplication
   */
  generateContentHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  async insert(content, metadata) {
    this.logger.debug("Inserting embedding", { sourceType: metadata.sourceType });
    const vector = await this.embeddingProvider.embed(content);
    const embedding = {
      id: v4_default(),
      vector,
      dimensions: vector.length,
      metadata: {
        ...metadata,
        contentHash: metadata.contentHash || this.generateContentHash(content)
      },
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    await this.adapter.save(embedding);
    this.cache?.set(embedding);
    this.logger.info("Embedding inserted", { id: embedding.id });
    return embedding;
  }
  async insertBatch(items) {
    this.logger.debug("Batch inserting embeddings", { count: items.length });
    const contents = items.map((item) => item.content);
    const vectors = await this.embeddingProvider.embedBatch(contents);
    const embeddings = items.map((item, index) => ({
      id: v4_default(),
      vector: vectors[index],
      dimensions: vectors[index].length,
      metadata: {
        ...item.metadata,
        contentHash: item.metadata.contentHash || this.generateContentHash(item.content)
      },
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }));
    await this.adapter.saveBatch(embeddings);
    for (const embedding of embeddings) {
      this.cache?.set(embedding);
    }
    this.logger.info("Batch embeddings inserted", { count: embeddings.length });
    return embeddings;
  }
  async search(query, options) {
    this.logger.debug("Searching embeddings", { topK: options.topK });
    const queryVector = await this.embeddingProvider.embed(query);
    return this.searchByVector(queryVector, options);
  }
  async searchByVector(vector, options) {
    if (this.adapter.searchByVector) {
      return this.adapter.searchByVector(vector, options);
    }
    const allEmbeddings = await this.adapter.loadAll(options.filter);
    const results = [];
    for (const embedding of allEmbeddings) {
      if (embedding.vector.length !== vector.length) {
        this.logger.warn("Dimension mismatch", {
          expected: vector.length,
          actual: embedding.vector.length
        });
        continue;
      }
      const score = cosineSimilarity(vector, embedding.vector);
      const distance = euclideanDistance(vector, embedding.vector);
      if (options.minScore !== void 0 && score < options.minScore) {
        continue;
      }
      if (options.maxDistance !== void 0 && distance > options.maxDistance) {
        continue;
      }
      results.push({
        embedding: options.includeMetadata !== false ? embedding : {
          ...embedding,
          vector: []
          // Omit vector for performance
        },
        score,
        distance
      });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.topK);
  }
  async get(id) {
    const cached = this.cache?.get(id);
    if (cached) return cached;
    const embedding = await this.adapter.load(id);
    if (embedding) {
      this.cache?.set(embedding);
    }
    return embedding;
  }
  async delete(id) {
    this.cache?.delete(id);
    return this.adapter.delete(id);
  }
  async deleteBatch(ids) {
    for (const id of ids) {
      this.cache?.delete(id);
    }
    return this.adapter.deleteBatch(ids);
  }
  async deleteByFilter(filter) {
    this.cache?.clear();
    return this.adapter.deleteByFilter(filter);
  }
  async update(id, metadata) {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Embedding not found: ${id}`);
    }
    const updated = await this.adapter.update(id, {
      metadata: { ...existing.metadata, ...metadata }
    });
    if (!updated) {
      throw new Error(`Failed to update embedding: ${id}`);
    }
    this.cache?.set(updated);
    return updated;
  }
  async count(filter) {
    return this.adapter.count(filter);
  }
  /**
   * Get statistics about the vector store
   */
  async getStats() {
    const total = await this.count();
    const allEmbeddings = await this.adapter.loadAll();
    const bySourceType = /* @__PURE__ */ new Map();
    const byCourse = /* @__PURE__ */ new Map();
    let totalDimensions = 0;
    for (const embedding of allEmbeddings) {
      const sourceType = embedding.metadata.sourceType;
      bySourceType.set(sourceType, (bySourceType.get(sourceType) ?? 0) + 1);
      if (embedding.metadata.courseId) {
        const courseId = embedding.metadata.courseId;
        byCourse.set(courseId, (byCourse.get(courseId) ?? 0) + 1);
      }
      totalDimensions = embedding.dimensions;
    }
    return {
      totalEmbeddings: total,
      dimensions: totalDimensions,
      bySourceType: Object.fromEntries(bySourceType),
      byCourse: Object.fromEntries(byCourse),
      modelName: this.embeddingProvider.getModelName()
    };
  }
};
function createVectorStore(config) {
  return new VectorStore(config);
}
var MockEmbeddingProvider = class {
  dimensions;
  modelName;
  constructor(dimensions = 384, modelName = "mock-embeddings") {
    this.dimensions = dimensions;
    this.modelName = modelName;
  }
  async embed(text) {
    const vector = [];
    for (let i = 0; i < this.dimensions; i++) {
      const charCode = text.charCodeAt(i % text.length) || 0;
      vector.push(Math.sin(charCode * (i + 1)) * 0.5 + 0.5);
    }
    return this.normalize(vector);
  }
  async embedBatch(texts) {
    return Promise.all(texts.map((text) => this.embed(text)));
  }
  getDimensions() {
    return this.dimensions;
  }
  getModelName() {
    return this.modelName;
  }
  normalize(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map((v) => v / magnitude);
  }
};

// src/memory/knowledge-graph.ts
var InMemoryGraphStore = class {
  entities = /* @__PURE__ */ new Map();
  relationships = /* @__PURE__ */ new Map();
  outgoingIndex = /* @__PURE__ */ new Map();
  // entity -> relationship IDs
  incomingIndex = /* @__PURE__ */ new Map();
  // entity -> relationship IDs
  async createEntity(entity) {
    const now = /* @__PURE__ */ new Date();
    const newEntity = {
      ...entity,
      id: v4_default(),
      createdAt: now,
      updatedAt: now
    };
    this.entities.set(newEntity.id, newEntity);
    return newEntity;
  }
  async getEntity(id) {
    return this.entities.get(id) ?? null;
  }
  async updateEntity(id, updates) {
    const existing = this.entities.get(id);
    if (!existing) {
      throw new Error(`Entity not found: ${id}`);
    }
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.entities.set(id, updated);
    return updated;
  }
  async deleteEntity(id) {
    const outgoing = this.outgoingIndex.get(id) ?? /* @__PURE__ */ new Set();
    const incoming = this.incomingIndex.get(id) ?? /* @__PURE__ */ new Set();
    for (const relId of [...outgoing, ...incoming]) {
      await this.deleteRelationship(relId);
    }
    this.outgoingIndex.delete(id);
    this.incomingIndex.delete(id);
    return this.entities.delete(id);
  }
  async findEntities(type, query, limit) {
    let results = Array.from(this.entities.values()).filter((e) => e.type === type);
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (e) => e.name.toLowerCase().includes(lowerQuery) || e.description?.toLowerCase().includes(lowerQuery)
      );
    }
    if (limit) {
      results = results.slice(0, limit);
    }
    return results;
  }
  async createRelationship(relationship) {
    const newRel = {
      ...relationship,
      id: v4_default(),
      createdAt: /* @__PURE__ */ new Date()
    };
    this.relationships.set(newRel.id, newRel);
    if (!this.outgoingIndex.has(relationship.sourceId)) {
      this.outgoingIndex.set(relationship.sourceId, /* @__PURE__ */ new Set());
    }
    this.outgoingIndex.get(relationship.sourceId).add(newRel.id);
    if (!this.incomingIndex.has(relationship.targetId)) {
      this.incomingIndex.set(relationship.targetId, /* @__PURE__ */ new Set());
    }
    this.incomingIndex.get(relationship.targetId).add(newRel.id);
    return newRel;
  }
  async getRelationship(id) {
    return this.relationships.get(id) ?? null;
  }
  async deleteRelationship(id) {
    const rel = this.relationships.get(id);
    if (!rel) return false;
    this.outgoingIndex.get(rel.sourceId)?.delete(id);
    this.incomingIndex.get(rel.targetId)?.delete(id);
    return this.relationships.delete(id);
  }
  async getRelationships(entityId, options) {
    const relIds = /* @__PURE__ */ new Set();
    const direction = options?.direction ?? "both";
    if (direction === "outgoing" || direction === "both") {
      const outgoing = this.outgoingIndex.get(entityId) ?? /* @__PURE__ */ new Set();
      for (const id of outgoing) relIds.add(id);
    }
    if (direction === "incoming" || direction === "both") {
      const incoming = this.incomingIndex.get(entityId) ?? /* @__PURE__ */ new Set();
      for (const id of incoming) relIds.add(id);
    }
    let results = [];
    for (const id of relIds) {
      const rel = this.relationships.get(id);
      if (rel) results.push(rel);
    }
    if (options?.relationshipTypes?.length) {
      results = results.filter(
        (r) => options.relationshipTypes.includes(r.type)
      );
    }
    if (options?.minWeight !== void 0) {
      results = results.filter((r) => r.weight >= options.minWeight);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    return results;
  }
  async traverse(startId, options) {
    const visited = /* @__PURE__ */ new Set();
    const entities = [];
    const relationships = [];
    const paths = [];
    const maxDepth = options.maxDepth ?? 3;
    const startEntity = await this.getEntity(startId);
    if (!startEntity) {
      return { entities: [], relationships: [], paths: [], depth: 0 };
    }
    const queue = [
      {
        entityId: startId,
        depth: 0,
        path: { nodes: [startEntity], edges: [], totalWeight: 0 }
      }
    ];
    while (queue.length > 0) {
      const { entityId, depth, path } = queue.shift();
      if (visited.has(entityId)) continue;
      visited.add(entityId);
      const entity = await this.getEntity(entityId);
      if (!entity) continue;
      if (!entities.find((e) => e.id === entity.id)) {
        entities.push(entity);
      }
      if (depth >= maxDepth) {
        paths.push(path);
        continue;
      }
      const rels = await this.getRelationships(entityId, options);
      for (const rel of rels) {
        if (!relationships.find((r) => r.id === rel.id)) {
          relationships.push(rel);
        }
        const nextId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;
        if (!visited.has(nextId)) {
          const nextEntity = await this.getEntity(nextId);
          if (nextEntity) {
            if (options.entityTypes?.length && !options.entityTypes.includes(nextEntity.type)) {
              continue;
            }
            queue.push({
              entityId: nextId,
              depth: depth + 1,
              path: {
                nodes: [...path.nodes, nextEntity],
                edges: [...path.edges, rel],
                totalWeight: path.totalWeight + rel.weight
              }
            });
          }
        }
      }
      if (depth === maxDepth - 1 || rels.length === 0) {
        paths.push(path);
      }
    }
    return {
      entities,
      relationships,
      paths,
      depth: maxDepth
    };
  }
  async findPath(sourceId, targetId, options) {
    const visited = /* @__PURE__ */ new Set();
    const maxDepth = options?.maxDepth ?? 10;
    const queue = [];
    const sourceEntity = await this.getEntity(sourceId);
    if (!sourceEntity) return null;
    queue.push({
      entityId: sourceId,
      path: { nodes: [sourceEntity], edges: [], totalWeight: 0 }
    });
    while (queue.length > 0) {
      const { entityId, path } = queue.shift();
      if (entityId === targetId) {
        return path;
      }
      if (visited.has(entityId) || path.nodes.length > maxDepth) {
        continue;
      }
      visited.add(entityId);
      const rels = await this.getRelationships(entityId, options);
      for (const rel of rels) {
        const nextId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;
        if (!visited.has(nextId)) {
          const nextEntity = await this.getEntity(nextId);
          if (nextEntity) {
            queue.push({
              entityId: nextId,
              path: {
                nodes: [...path.nodes, nextEntity],
                edges: [...path.edges, rel],
                totalWeight: path.totalWeight + rel.weight
              }
            });
          }
        }
      }
    }
    return null;
  }
  async getNeighbors(entityId, options) {
    const rels = await this.getRelationships(entityId, options);
    const neighborIds = /* @__PURE__ */ new Set();
    for (const rel of rels) {
      if (rel.sourceId === entityId) {
        neighborIds.add(rel.targetId);
      } else {
        neighborIds.add(rel.sourceId);
      }
    }
    const neighbors = [];
    for (const id of neighborIds) {
      const entity = await this.getEntity(id);
      if (entity) {
        if (options?.entityTypes?.length && !options.entityTypes.includes(entity.type)) {
          continue;
        }
        neighbors.push(entity);
      }
    }
    if (options?.limit) {
      return neighbors.slice(0, options.limit);
    }
    return neighbors;
  }
  // Utility methods for testing
  clear() {
    this.entities.clear();
    this.relationships.clear();
    this.outgoingIndex.clear();
    this.incomingIndex.clear();
  }
  getEntityCount() {
    return this.entities.size;
  }
  getRelationshipCount() {
    return this.relationships.size;
  }
};
var KnowledgeGraphManager = class {
  store;
  logger;
  maxTraversalDepth;
  defaultWeight;
  constructor(config = {}) {
    this.store = config.graphStore ?? new InMemoryGraphStore();
    this.logger = config.logger ?? console;
    this.maxTraversalDepth = config.maxTraversalDepth ?? 5;
    this.defaultWeight = config.defaultRelationshipWeight ?? 1;
  }
  // ============================================================================
  // ENTITY MANAGEMENT
  // ============================================================================
  async createEntity(type, name, options) {
    this.logger.debug("Creating entity", { type, name });
    const entity = await this.store.createEntity({
      type,
      name,
      description: options?.description,
      properties: options?.properties ?? {},
      embeddings: options?.embeddings
    });
    this.logger.info("Entity created", { id: entity.id, type, name });
    return entity;
  }
  async getEntity(id) {
    return this.store.getEntity(id);
  }
  async updateEntity(id, updates) {
    this.logger.debug("Updating entity", { id });
    return this.store.updateEntity(id, updates);
  }
  async deleteEntity(id) {
    this.logger.debug("Deleting entity", { id });
    return this.store.deleteEntity(id);
  }
  async findEntities(type, query, limit) {
    return this.store.findEntities(type, query, limit);
  }
  // ============================================================================
  // RELATIONSHIP MANAGEMENT
  // ============================================================================
  async createRelationship(sourceId, targetId, type, options) {
    this.logger.debug("Creating relationship", { sourceId, targetId, type });
    const [source, target] = await Promise.all([
      this.store.getEntity(sourceId),
      this.store.getEntity(targetId)
    ]);
    if (!source) {
      throw new Error(`Source entity not found: ${sourceId}`);
    }
    if (!target) {
      throw new Error(`Target entity not found: ${targetId}`);
    }
    const relationship = await this.store.createRelationship({
      type,
      sourceId,
      targetId,
      weight: options?.weight ?? this.defaultWeight,
      properties: options?.properties ?? {}
    });
    this.logger.info("Relationship created", {
      id: relationship.id,
      type,
      source: source.name,
      target: target.name
    });
    return relationship;
  }
  async getRelationship(id) {
    return this.store.getRelationship(id);
  }
  async deleteRelationship(id) {
    this.logger.debug("Deleting relationship", { id });
    return this.store.deleteRelationship(id);
  }
  async getRelationships(entityId, options) {
    return this.store.getRelationships(entityId, options);
  }
  // ============================================================================
  // GRAPH TRAVERSAL
  // ============================================================================
  async traverse(startId, options) {
    this.logger.debug("Traversing graph", { startId, options });
    const fullOptions = {
      maxDepth: options?.maxDepth ?? this.maxTraversalDepth,
      ...options
    };
    return this.store.traverse(startId, fullOptions);
  }
  async findPath(sourceId, targetId, options) {
    this.logger.debug("Finding path", { sourceId, targetId });
    const fullOptions = {
      maxDepth: options?.maxDepth ?? this.maxTraversalDepth,
      ...options
    };
    return this.store.findPath(sourceId, targetId, fullOptions);
  }
  async getNeighbors(entityId, options) {
    return this.store.getNeighbors(entityId, options);
  }
  // ============================================================================
  // HIGHER-LEVEL OPERATIONS
  // ============================================================================
  /**
   * Get all prerequisites for a concept/topic
   */
  async getPrerequisites(entityId, maxDepth) {
    const result = await this.traverse(entityId, {
      maxDepth: maxDepth ?? 3,
      relationshipTypes: ["prerequisite_of"],
      direction: "incoming"
    });
    return result.entities.filter((e) => e.id !== entityId);
  }
  /**
   * Get all topics that depend on this concept
   */
  async getDependents(entityId, maxDepth) {
    const result = await this.traverse(entityId, {
      maxDepth: maxDepth ?? 3,
      relationshipTypes: ["prerequisite_of"],
      direction: "outgoing"
    });
    return result.entities.filter((e) => e.id !== entityId);
  }
  /**
   * Get related concepts for a topic
   */
  async getRelatedConcepts(entityId, limit) {
    const result = await this.traverse(entityId, {
      maxDepth: 2,
      relationshipTypes: ["related_to", "similar_to"],
      direction: "both",
      limit
    });
    return result.entities.filter((e) => e.id !== entityId);
  }
  /**
   * Get learning path between two concepts
   */
  async getLearningPath(fromId, toId) {
    const path = await this.findPath(fromId, toId, {
      relationshipTypes: ["prerequisite_of", "follows", "part_of"]
    });
    if (!path) return null;
    return {
      steps: path.nodes.map((node, index) => ({
        order: index + 1,
        entity: node,
        relationship: index > 0 ? path.edges[index - 1].type : void 0
      })),
      totalWeight: path.totalWeight,
      estimatedDuration: this.estimateDuration(path)
    };
  }
  /**
   * Find common ancestors between two concepts
   */
  async findCommonAncestors(entityId1, entityId2) {
    const [ancestors1, ancestors2] = await Promise.all([
      this.getPrerequisites(entityId1, 5),
      this.getPrerequisites(entityId2, 5)
    ]);
    const ancestorIds1 = new Set(ancestors1.map((a) => a.id));
    return ancestors2.filter((a) => ancestorIds1.has(a.id));
  }
  /**
   * Get mastery dependencies for a user
   */
  async getMasteryDependencies(userId, conceptId) {
    const prerequisites = await this.getPrerequisites(conceptId, 3);
    const mastered = [];
    const notMastered = [];
    const readyToLearn = [];
    for (const prereq of prerequisites) {
      const rels = await this.store.getRelationships(prereq.id, {
        relationshipTypes: ["mastered_by"]
      });
      const isMastered = rels.some(
        (r) => r.targetId === userId || r.properties.userId === userId
      );
      if (isMastered) {
        mastered.push(prereq);
      } else {
        notMastered.push(prereq);
        const subPrereqs = await this.getPrerequisites(prereq.id, 1);
        const allSubMastered = subPrereqs.every(
          (sp) => mastered.some((m) => m.id === sp.id)
        );
        if (allSubMastered || subPrereqs.length === 0) {
          readyToLearn.push(prereq);
        }
      }
    }
    return { mastered, notMastered, readyToLearn };
  }
  /**
   * Build a concept map around an entity
   */
  async buildConceptMap(centerId, depth) {
    const result = await this.traverse(centerId, {
      maxDepth: depth ?? 2,
      direction: "both"
    });
    const center = await this.getEntity(centerId);
    if (!center) {
      throw new Error(`Entity not found: ${centerId}`);
    }
    const clusters = /* @__PURE__ */ new Map();
    for (const rel of result.relationships) {
      if (!clusters.has(rel.type)) {
        clusters.set(rel.type, []);
      }
      const otherId = rel.sourceId === centerId ? rel.targetId : rel.sourceId;
      const other = result.entities.find((e) => e.id === otherId);
      if (other) {
        clusters.get(rel.type).push(other);
      }
    }
    return {
      center,
      entities: result.entities,
      relationships: result.relationships,
      clusters: Object.fromEntries(clusters),
      depth: result.depth
    };
  }
  // ============================================================================
  // UTILITIES
  // ============================================================================
  estimateDuration(path) {
    return path.nodes.length * 30;
  }
  /**
   * Get statistics about the knowledge graph
   */
  async getStats() {
    const store = this.store;
    if (typeof store.getEntityCount !== "function") {
      return {
        entityCount: 0,
        relationshipCount: 0,
        entityTypes: {},
        relationshipTypes: {}
      };
    }
    return {
      entityCount: store.getEntityCount(),
      relationshipCount: store.getRelationshipCount(),
      entityTypes: {},
      relationshipTypes: {}
    };
  }
};
function createKnowledgeGraphManager(config) {
  return new KnowledgeGraphManager(config);
}

// src/memory/cross-session-context.ts
var DEFAULT_PREFERENCES = {
  learningStyle: "mixed",
  preferredPace: "moderate",
  preferredContentTypes: ["text", "interactive", "quiz"],
  preferredSessionLength: 30,
  notificationPreferences: {
    enabled: true,
    channels: ["in_app"],
    frequency: "daily"
  },
  accessibilitySettings: {
    fontSize: "medium",
    highContrast: false,
    reduceMotion: false,
    screenReaderOptimized: false,
    captionsEnabled: false
  }
};
var DEFAULT_INSIGHTS = {
  strengths: [],
  weaknesses: [],
  recommendedTopics: [],
  masteredConcepts: [],
  strugglingConcepts: [],
  averageSessionDuration: 0,
  totalLearningTime: 0,
  completionRate: 0,
  engagementScore: 0
};
var DEFAULT_STATE = {
  recentConcepts: [],
  pendingQuestions: [],
  activeArtifacts: [],
  sessionCount: 0
};
var InMemoryContextStore = class {
  contexts = /* @__PURE__ */ new Map();
  getKey(userId, courseId) {
    return courseId ? `${userId}:${courseId}` : userId;
  }
  async get(userId, courseId) {
    const key = this.getKey(userId, courseId);
    return this.contexts.get(key) ?? null;
  }
  async create(context) {
    const now = /* @__PURE__ */ new Date();
    const newContext = {
      ...context,
      id: v4_default(),
      createdAt: now,
      updatedAt: now
    };
    const key = this.getKey(context.userId, context.courseId);
    this.contexts.set(key, newContext);
    return newContext;
  }
  async update(id, updates) {
    for (const [key, context] of this.contexts) {
      if (context.id === id) {
        const updated = {
          ...context,
          ...updates,
          id: context.id,
          createdAt: context.createdAt,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.contexts.set(key, updated);
        return updated;
      }
    }
    throw new Error(`Context not found: ${id}`);
  }
  async delete(id) {
    for (const [key, context] of this.contexts) {
      if (context.id === id) {
        return this.contexts.delete(key);
      }
    }
    return false;
  }
  async addHistoryEntry(id, entry) {
    for (const [key, context] of this.contexts) {
      if (context.id === id) {
        const newEntry = {
          ...entry,
          timestamp: /* @__PURE__ */ new Date()
        };
        context.history.push(newEntry);
        context.updatedAt = /* @__PURE__ */ new Date();
        this.contexts.set(key, context);
        return;
      }
    }
    throw new Error(`Context not found: ${id}`);
  }
  async getRecentHistory(id, limit) {
    for (const context of this.contexts.values()) {
      if (context.id === id) {
        return context.history.slice(-limit).reverse();
      }
    }
    return [];
  }
  // Utility for testing
  clear() {
    this.contexts.clear();
  }
};
var CrossSessionContext = class {
  store;
  logger;
  maxHistoryEntries;
  defaultSessionLength;
  constructor(config = {}) {
    this.store = config.contextStore ?? new InMemoryContextStore();
    this.logger = config.logger ?? console;
    this.maxHistoryEntries = config.maxHistoryEntries ?? 1e3;
    this.defaultSessionLength = config.defaultSessionLength ?? 30;
  }
  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  /**
   * Get or create context for a user
   */
  async getOrCreateContext(userId, courseId) {
    let context = await this.store.get(userId, courseId);
    if (!context) {
      this.logger.debug("Creating new session context", { userId, courseId });
      context = await this.store.create({
        userId,
        courseId,
        lastActiveAt: /* @__PURE__ */ new Date(),
        currentState: {
          ...DEFAULT_STATE,
          recentConcepts: [],
          pendingQuestions: [],
          activeArtifacts: []
        },
        history: [],
        preferences: { ...DEFAULT_PREFERENCES },
        insights: {
          ...DEFAULT_INSIGHTS,
          strengths: [],
          weaknesses: [],
          recommendedTopics: [],
          masteredConcepts: [],
          strugglingConcepts: []
        }
      });
    }
    return context;
  }
  /**
   * Start a new session
   */
  async startSession(userId, courseId, sessionId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedState = {
      ...context.currentState,
      sessionCount: context.currentState.sessionCount + 1
    };
    await this.addHistoryEntry(context.id, {
      action: "session_start",
      data: { sessionId },
      sessionId
    });
    const updated = await this.store.update(context.id, {
      currentState: updatedState,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
    this.logger.info("Session started", {
      userId,
      courseId,
      sessionCount: updatedState.sessionCount
    });
    return updated;
  }
  /**
   * End current session
   */
  async endSession(userId, courseId, options) {
    const context = await this.getOrCreateContext(userId, courseId);
    if (options?.duration) {
      const insights = { ...context.insights };
      const totalSessions = context.currentState.sessionCount;
      insights.totalLearningTime += options.duration;
      insights.averageSessionDuration = (insights.averageSessionDuration * (totalSessions - 1) + options.duration) / totalSessions;
      await this.store.update(context.id, { insights });
    }
    await this.addHistoryEntry(context.id, {
      action: "session_end",
      data: { duration: options?.duration },
      sessionId: options?.sessionId
    });
    const updated = await this.store.update(context.id, {
      lastActiveAt: /* @__PURE__ */ new Date()
    });
    this.logger.info("Session ended", {
      userId,
      courseId,
      duration: options?.duration
    });
    return updated;
  }
  // ============================================================================
  // CONTEXT STATE MANAGEMENT
  // ============================================================================
  /**
   * Update current topic
   */
  async setCurrentTopic(userId, topic, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedState = {
      ...context.currentState,
      currentTopic: topic,
      recentConcepts: this.addToRecentList(
        context.currentState.recentConcepts,
        topic,
        10
      )
    };
    await this.addHistoryEntry(context.id, {
      action: "topic_change",
      data: { previousTopic: context.currentState.currentTopic, newTopic: topic }
    });
    return this.store.update(context.id, {
      currentState: updatedState,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Set current learning goal
   */
  async setCurrentGoal(userId, goal, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedState = {
      ...context.currentState,
      currentGoal: goal
    };
    await this.addHistoryEntry(context.id, {
      action: "goal_set",
      data: { goal }
    });
    return this.store.update(context.id, {
      currentState: updatedState,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Mark goal as completed
   */
  async completeGoal(userId, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    if (!context.currentState.currentGoal) {
      return context;
    }
    await this.addHistoryEntry(context.id, {
      action: "goal_completed",
      data: { goal: context.currentState.currentGoal }
    });
    const updatedState = {
      ...context.currentState,
      currentGoal: void 0
    };
    return this.store.update(context.id, {
      currentState: updatedState,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Record learned concept
   */
  async recordConceptLearned(userId, concept, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const insights = { ...context.insights };
    if (!insights.masteredConcepts.includes(concept)) {
      insights.masteredConcepts.push(concept);
    }
    insights.strugglingConcepts = insights.strugglingConcepts.filter(
      (c) => c !== concept
    );
    const updatedState = {
      ...context.currentState,
      recentConcepts: this.addToRecentList(
        context.currentState.recentConcepts,
        concept,
        10
      )
    };
    await this.addHistoryEntry(context.id, {
      action: "concept_learned",
      data: { concept }
    });
    return this.store.update(context.id, {
      currentState: updatedState,
      insights,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Record question asked
   */
  async recordQuestion(userId, question, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedState = {
      ...context.currentState,
      pendingQuestions: this.addToRecentList(
        context.currentState.pendingQuestions,
        question,
        5
      )
    };
    await this.addHistoryEntry(context.id, {
      action: "question_asked",
      data: { question }
    });
    return this.store.update(context.id, {
      currentState: updatedState,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Record artifact creation
   */
  async recordArtifact(userId, artifactId, artifactType, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedState = {
      ...context.currentState,
      activeArtifacts: this.addToRecentList(
        context.currentState.activeArtifacts,
        artifactId,
        10
      )
    };
    await this.addHistoryEntry(context.id, {
      action: "artifact_created",
      data: { artifactId, artifactType }
    });
    return this.store.update(context.id, {
      currentState: updatedState,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Update emotional state
   */
  async updateEmotionalState(userId, state, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedState = {
      ...context.currentState,
      emotionalState: state
    };
    return this.store.update(context.id, {
      currentState: updatedState,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Update focus level (0-100)
   */
  async updateFocusLevel(userId, level, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedState = {
      ...context.currentState,
      focusLevel: Math.max(0, Math.min(100, level))
    };
    return this.store.update(context.id, {
      currentState: updatedState,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  // ============================================================================
  // PREFERENCES MANAGEMENT
  // ============================================================================
  /**
   * Update user preferences
   */
  async updatePreferences(userId, preferences, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedPreferences = {
      ...context.preferences,
      ...preferences,
      notificationPreferences: {
        ...context.preferences.notificationPreferences,
        ...preferences.notificationPreferences
      },
      accessibilitySettings: {
        ...context.preferences.accessibilitySettings,
        ...preferences.accessibilitySettings
      }
    };
    await this.addHistoryEntry(context.id, {
      action: "preference_updated",
      data: { changes: preferences }
    });
    return this.store.update(context.id, {
      preferences: updatedPreferences,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Set learning style
   */
  async setLearningStyle(userId, style, courseId) {
    return this.updatePreferences(userId, { learningStyle: style }, courseId);
  }
  /**
   * Set preferred content types
   */
  async setPreferredContentTypes(userId, types, courseId) {
    return this.updatePreferences(userId, { preferredContentTypes: types }, courseId);
  }
  // ============================================================================
  // INSIGHTS MANAGEMENT
  // ============================================================================
  /**
   * Update learning insights
   */
  async updateInsights(userId, insights, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const updatedInsights = {
      ...context.insights,
      ...insights
    };
    await this.addHistoryEntry(context.id, {
      action: "insight_generated",
      data: { insights }
    });
    return this.store.update(context.id, {
      insights: updatedInsights,
      lastActiveAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Add strength
   */
  async addStrength(userId, strength, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const strengths = [.../* @__PURE__ */ new Set([...context.insights.strengths, strength])];
    return this.updateInsights(userId, { strengths }, courseId);
  }
  /**
   * Add weakness
   */
  async addWeakness(userId, weakness, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const weaknesses = [.../* @__PURE__ */ new Set([...context.insights.weaknesses, weakness])];
    return this.updateInsights(userId, { weaknesses }, courseId);
  }
  /**
   * Record struggling concept
   */
  async recordStruggle(userId, concept, courseId) {
    const context = await this.getOrCreateContext(userId, courseId);
    const strugglingConcepts = [.../* @__PURE__ */ new Set([...context.insights.strugglingConcepts, concept])];
    return this.updateInsights(userId, { strugglingConcepts }, courseId);
  }
  /**
   * Update engagement score
   */
  async updateEngagementScore(userId, score, courseId) {
    return this.updateInsights(
      userId,
      { engagementScore: Math.max(0, Math.min(100, score)) },
      courseId
    );
  }
  // ============================================================================
  // HISTORY & ANALYTICS
  // ============================================================================
  /**
   * Get recent history entries
   */
  async getRecentHistory(userId, limit = 20, courseId) {
    const context = await this.store.get(userId, courseId);
    if (!context) return [];
    return this.store.getRecentHistory(context.id, limit);
  }
  /**
   * Get history by action type
   */
  async getHistoryByAction(userId, action, limit = 20, courseId) {
    const context = await this.store.get(userId, courseId);
    if (!context) return [];
    return context.history.filter((entry) => entry.action === action).slice(-limit).reverse();
  }
  /**
   * Get session summary
   */
  async getSessionSummary(userId, courseId) {
    const context = await this.store.get(userId, courseId);
    if (!context) {
      return {
        userId,
        courseId,
        exists: false,
        totalSessions: 0,
        totalLearningTime: 0,
        averageSessionDuration: 0,
        lastActiveAt: null,
        currentState: null,
        masteredConceptCount: 0,
        strugglingConceptCount: 0,
        engagementScore: 0
      };
    }
    return {
      userId,
      courseId,
      exists: true,
      totalSessions: context.currentState.sessionCount,
      totalLearningTime: context.insights.totalLearningTime,
      averageSessionDuration: context.insights.averageSessionDuration,
      lastActiveAt: context.lastActiveAt,
      currentState: context.currentState,
      masteredConceptCount: context.insights.masteredConcepts.length,
      strugglingConceptCount: context.insights.strugglingConcepts.length,
      engagementScore: context.insights.engagementScore
    };
  }
  /**
   * Get context for AI prompting
   */
  async getContextForPrompt(userId, courseId) {
    const context = await this.store.get(userId, courseId);
    if (!context) {
      return {
        hasContext: false,
        learningStyle: "mixed",
        preferredPace: "moderate",
        currentTopic: null,
        currentGoal: null,
        recentConcepts: [],
        pendingQuestions: [],
        strengths: [],
        weaknesses: [],
        emotionalState: null,
        focusLevel: null,
        sessionCount: 0
      };
    }
    return {
      hasContext: true,
      learningStyle: context.preferences.learningStyle,
      preferredPace: context.preferences.preferredPace,
      currentTopic: context.currentState.currentTopic ?? null,
      currentGoal: context.currentState.currentGoal ?? null,
      recentConcepts: context.currentState.recentConcepts,
      pendingQuestions: context.currentState.pendingQuestions,
      strengths: context.insights.strengths,
      weaknesses: context.insights.weaknesses,
      emotionalState: context.currentState.emotionalState ?? null,
      focusLevel: context.currentState.focusLevel ?? null,
      sessionCount: context.currentState.sessionCount
    };
  }
  // ============================================================================
  // UTILITIES
  // ============================================================================
  addToRecentList(list, item, maxSize) {
    const filtered = list.filter((i) => i !== item);
    filtered.unshift(item);
    return filtered.slice(0, maxSize);
  }
  async addHistoryEntry(contextId, entry) {
    await this.store.addHistoryEntry(contextId, entry);
  }
  /**
   * Delete context for a user
   */
  async deleteContext(userId, courseId) {
    const context = await this.store.get(userId, courseId);
    if (!context) return false;
    return this.store.delete(context.id);
  }
  /**
   * Get max history entries configuration
   */
  getMaxHistoryEntries() {
    return this.maxHistoryEntries;
  }
  /**
   * Get default session length configuration
   */
  getDefaultSessionLength() {
    return this.defaultSessionLength;
  }
};
function createCrossSessionContext(config) {
  return new CrossSessionContext(config);
}

// src/memory/memory-retriever.ts
var MemoryRetriever = class {
  vectorStore;
  knowledgeGraph;
  sessionContext;
  logger;
  defaultLimit;
  minRelevanceScore;
  recencyBoostFactor;
  userContextBoostFactor;
  hybridSearchWeight;
  constructor(config) {
    this.vectorStore = config.vectorStore;
    this.knowledgeGraph = config.knowledgeGraph;
    this.sessionContext = config.sessionContext;
    this.logger = config.logger ?? console;
    this.defaultLimit = config.defaultLimit ?? 10;
    this.minRelevanceScore = config.minRelevanceScore ?? 0.5;
    this.recencyBoostFactor = config.recencyBoostFactor ?? 0.1;
    this.userContextBoostFactor = config.userContextBoostFactor ?? 0.15;
    this.hybridSearchWeight = config.hybridSearchWeight ?? 0.7;
  }
  // ============================================================================
  // MAIN RETRIEVAL METHODS
  // ============================================================================
  /**
   * Retrieve relevant memories for a query
   */
  async retrieve(query) {
    const startTime = Date.now();
    this.logger.debug("Starting memory retrieval", { query: query.query });
    const strategies = [];
    let memories = [];
    if (!query.hybridSearch || query.hybridSearch) {
      const vectorResults = await this.vectorSearch(query);
      memories.push(...vectorResults);
      strategies.push("vector_search");
    }
    if (this.knowledgeGraph && query.includeRelated) {
      const graphResults = await this.graphSearch(query);
      memories.push(...graphResults);
      strategies.push("graph_traversal");
    }
    if (this.sessionContext && query.userId) {
      memories = await this.applyUserContextBoost(query.userId, memories, query.courseId);
      strategies.push("user_context");
    }
    memories = this.applyRecencyBoost(memories);
    strategies.push("recency_boost");
    memories = this.deduplicateAndSort(memories);
    if (query.memoryTypes?.length) {
      memories = memories.filter((m) => query.memoryTypes.includes(m.type));
    }
    if (query.sourceTypes?.length) {
      memories = memories.filter(
        (m) => query.sourceTypes.includes(m.source.type)
      );
    }
    if (query.timeRange) {
      memories = memories.filter((m) => {
        if (query.timeRange.start && m.timestamp < query.timeRange.start)
          return false;
        if (query.timeRange.end && m.timestamp > query.timeRange.end)
          return false;
        return true;
      });
    }
    const minRelevance = query.minRelevance ?? this.minRelevanceScore;
    memories = memories.filter((m) => m.relevanceScore >= minRelevance);
    const limit = query.limit ?? this.defaultLimit;
    memories = memories.slice(0, limit);
    const queryTime = Date.now() - startTime;
    this.logger.info("Memory retrieval completed", {
      resultCount: memories.length,
      queryTime,
      strategies
    });
    return {
      memories,
      totalCount: memories.length,
      queryTime,
      strategies
    };
  }
  /**
   * Retrieve memories specifically for RAG context
   */
  async retrieveForContext(query, userId, courseId, limit) {
    const result = await this.retrieve({
      query,
      userId,
      courseId,
      limit: limit ?? 5,
      hybridSearch: true,
      includeRelated: true
    });
    return result.memories.map((m) => m.content);
  }
  /**
   * Retrieve memories for a specific topic
   */
  async retrieveByTopic(topic, userId, courseId, limit) {
    const result = await this.retrieve({
      query: topic,
      userId,
      courseId,
      limit: limit ?? 10,
      includeRelated: true
    });
    return result.memories;
  }
  /**
   * Retrieve recent memories
   */
  async retrieveRecent(userId, limit, courseId) {
    const options = {
      topK: limit ?? 20,
      filter: {
        userIds: [userId],
        courseIds: courseId ? [courseId] : void 0
      }
    };
    const results = await this.vectorStore.searchByVector(
      new Array(384).fill(0),
      // Dummy vector
      options
    );
    results.sort(
      (a, b) => b.embedding.createdAt.getTime() - a.embedding.createdAt.getTime()
    );
    return results.slice(0, limit ?? 20).map((r) => this.convertToMemoryItem(r));
  }
  /**
   * Retrieve related concepts
   */
  async retrieveRelatedConcepts(conceptId, limit) {
    if (!this.knowledgeGraph) {
      return [];
    }
    const related = await this.knowledgeGraph.getRelatedConcepts(
      conceptId,
      limit ?? 10
    );
    return related.map((entity) => ({
      id: entity.id,
      type: "semantic",
      content: `${entity.name}: ${entity.description ?? ""}`,
      relevanceScore: 0.8,
      source: {
        type: "course_content",
        id: entity.id,
        title: entity.name
      },
      context: {
        relatedEntities: entity.embeddings ?? [],
        tags: []
      },
      timestamp: entity.createdAt
    }));
  }
  // ============================================================================
  // SEARCH STRATEGIES
  // ============================================================================
  async vectorSearch(query) {
    const searchOptions = {
      topK: (query.limit ?? this.defaultLimit) * 2,
      // Get more for re-ranking
      minScore: query.minRelevance ?? this.minRelevanceScore * 0.8,
      filter: {
        userIds: query.userId ? [query.userId] : void 0,
        courseIds: query.courseId ? [query.courseId] : void 0,
        sourceTypes: query.sourceTypes,
        dateRange: query.timeRange
      },
      includeMetadata: true
    };
    const results = await this.vectorStore.search(query.query, searchOptions);
    return results.map((r) => this.convertToMemoryItem(r));
  }
  async graphSearch(query) {
    if (!this.knowledgeGraph) {
      return [];
    }
    const entities = await this.knowledgeGraph.findEntities(
      "concept",
      query.query,
      10
    );
    if (entities.length === 0) {
      return [];
    }
    const memories = [];
    for (const entity of entities) {
      const options = {
        maxDepth: 2,
        limit: 5,
        direction: "both"
      };
      const neighbors = await this.knowledgeGraph.getNeighbors(entity.id, options);
      for (const neighbor of neighbors) {
        memories.push({
          id: neighbor.id,
          type: "semantic",
          content: `${neighbor.name}: ${neighbor.description ?? ""}`,
          relevanceScore: 0.7,
          // Lower base score for graph results
          source: {
            type: "course_content",
            id: neighbor.id,
            title: neighbor.name
          },
          context: {
            relatedEntities: [entity.id],
            tags: []
          },
          timestamp: neighbor.createdAt
        });
      }
    }
    return memories;
  }
  async applyUserContextBoost(userId, memories, courseId) {
    if (!this.sessionContext) {
      return memories;
    }
    const context = await this.sessionContext.getContextForPrompt(userId, courseId);
    if (!context.hasContext) {
      return memories;
    }
    return memories.map((memory) => {
      let boost = 0;
      if (context.currentTopic && memory.content.toLowerCase().includes(context.currentTopic.toLowerCase())) {
        boost += this.userContextBoostFactor;
      }
      if (context.currentGoal && memory.content.toLowerCase().includes(context.currentGoal.toLowerCase())) {
        boost += this.userContextBoostFactor;
      }
      for (const concept of context.recentConcepts) {
        if (memory.content.toLowerCase().includes(concept.toLowerCase())) {
          boost += this.userContextBoostFactor * 0.5;
          break;
        }
      }
      for (const concept of context.weaknesses) {
        if (memory.content.toLowerCase().includes(concept.toLowerCase())) {
          boost += this.userContextBoostFactor;
          break;
        }
      }
      return {
        ...memory,
        relevanceScore: Math.min(1, memory.relevanceScore + boost)
      };
    });
  }
  applyRecencyBoost(memories) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1e3;
    return memories.map((memory) => {
      const ageInDays = (now - memory.timestamp.getTime()) / dayMs;
      const recencyMultiplier = Math.exp(-ageInDays / 30);
      const boost = this.recencyBoostFactor * recencyMultiplier;
      return {
        ...memory,
        relevanceScore: Math.min(1, memory.relevanceScore + boost)
      };
    });
  }
  // ============================================================================
  // SPECIALIZED RETRIEVAL
  // ============================================================================
  /**
   * Retrieve prerequisites for a topic
   */
  async retrievePrerequisites(topicId, userId) {
    if (!this.knowledgeGraph) {
      return [];
    }
    const prerequisites = await this.knowledgeGraph.getPrerequisites(topicId);
    return prerequisites.map((prereq) => ({
      id: prereq.id,
      type: "procedural",
      content: `Prerequisite: ${prereq.name} - ${prereq.description ?? ""}`,
      relevanceScore: 0.9,
      source: {
        type: "course_content",
        id: prereq.id,
        title: prereq.name
      },
      context: {
        userId,
        relatedEntities: [topicId],
        tags: ["prerequisite"]
      },
      timestamp: prereq.createdAt
    }));
  }
  /**
   * Retrieve learning path context
   */
  async retrieveLearningPathContext(fromTopicId, toTopicId) {
    if (!this.knowledgeGraph) {
      return [];
    }
    const path = await this.knowledgeGraph.getLearningPath(
      fromTopicId,
      toTopicId
    );
    if (!path) {
      return [];
    }
    return path.steps.map((step, index) => ({
      id: step.entity.id,
      type: "procedural",
      content: `Step ${step.order}: ${step.entity.name} - ${step.entity.description ?? ""}`,
      relevanceScore: 1 - index * 0.05,
      // Decrease relevance for later steps
      source: {
        type: "course_content",
        id: step.entity.id,
        title: step.entity.name
      },
      context: {
        relatedEntities: [fromTopicId, toTopicId],
        tags: ["learning_path", `step_${step.order}`]
      },
      timestamp: step.entity.createdAt
    }));
  }
  /**
   * Retrieve conversation history
   * @param sessionId - Optional session filter (reserved for future use)
   */
  async retrieveConversationHistory(userId, _sessionId, limit) {
    const options = {
      topK: limit ?? 10,
      filter: {
        userIds: [userId],
        sourceTypes: ["conversation", "question", "answer"]
      }
    };
    const results = await this.vectorStore.searchByVector(
      new Array(384).fill(0),
      // Dummy vector
      options
    );
    return results.map((r) => this.convertToMemoryItem(r));
  }
  /**
   * Find similar questions/answers
   */
  async findSimilarQA(question, courseId, limit) {
    const result = await this.retrieve({
      query: question,
      courseId,
      sourceTypes: ["question", "answer"],
      limit: limit ?? 5,
      minRelevance: 0.7
    });
    return result.memories;
  }
  // ============================================================================
  // HYBRID SEARCH
  // ============================================================================
  /**
   * Perform hybrid search combining vector and keyword search
   */
  async hybridSearch(query, options) {
    const vectorWeight = options?.vectorWeight ?? this.hybridSearchWeight;
    const keywordWeight = 1 - vectorWeight;
    const vectorResults = await this.vectorSearch({
      query,
      userId: options?.userId,
      courseId: options?.courseId,
      limit: (options?.limit ?? 10) * 2
    });
    const keywordResults = await this.keywordSearch(query, options);
    const combinedMap = /* @__PURE__ */ new Map();
    for (const item of vectorResults) {
      combinedMap.set(item.id, {
        ...item,
        relevanceScore: item.relevanceScore * vectorWeight
      });
    }
    for (const item of keywordResults) {
      const existing = combinedMap.get(item.id);
      if (existing) {
        existing.relevanceScore += item.relevanceScore * keywordWeight;
      } else {
        combinedMap.set(item.id, {
          ...item,
          relevanceScore: item.relevanceScore * keywordWeight
        });
      }
    }
    const memories = Array.from(combinedMap.values());
    memories.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return {
      memories: memories.slice(0, options?.limit ?? 10),
      totalCount: memories.length,
      queryTime: 0,
      strategies: ["vector_search", "keyword_match", "hybrid"]
    };
  }
  async keywordSearch(query, options) {
    const allEmbeddings = await this.vectorStore.searchByVector(
      new Array(384).fill(0),
      {
        topK: 100,
        filter: {
          userIds: options?.userId ? [options.userId] : void 0,
          courseIds: options?.courseId ? [options.courseId] : void 0
        }
      }
    );
    const queryTerms = query.toLowerCase().split(/\s+/);
    const results = [];
    for (const result of allEmbeddings) {
      const content = result.embedding.metadata.sourceId.toLowerCase();
      const tags = result.embedding.metadata.tags.map((t) => t.toLowerCase());
      let matchScore = 0;
      for (const term of queryTerms) {
        if (content.includes(term) || tags.some((t) => t.includes(term))) {
          matchScore += 1 / queryTerms.length;
        }
      }
      if (matchScore > 0) {
        results.push({
          ...this.convertToMemoryItem(result),
          relevanceScore: matchScore
        });
      }
    }
    return results.slice(0, options?.limit ?? 20);
  }
  // ============================================================================
  // UTILITIES
  // ============================================================================
  convertToMemoryItem(result) {
    const metadata = result.embedding.metadata;
    return {
      id: result.embedding.id,
      type: this.inferMemoryType(metadata.sourceType),
      content: metadata.sourceId,
      // Would typically store content separately
      relevanceScore: result.score,
      source: {
        type: metadata.sourceType,
        id: metadata.sourceId
      },
      context: {
        userId: metadata.userId,
        courseId: metadata.courseId,
        relatedEntities: [],
        tags: metadata.tags
      },
      timestamp: result.embedding.createdAt
    };
  }
  inferMemoryType(sourceType) {
    switch (sourceType) {
      case "course_content":
      case "chapter_content":
      case "section_content":
        return "factual";
      case "conversation":
      case "question":
      case "answer":
        return "episodic";
      case "summary":
        return "semantic";
      case "artifact":
      case "external_resource":
        return "contextual";
      default:
        return "semantic";
    }
  }
  deduplicateAndSort(memories) {
    const seen = /* @__PURE__ */ new Set();
    const unique = [];
    for (const memory of memories) {
      if (!seen.has(memory.id)) {
        seen.add(memory.id);
        unique.push(memory);
      } else {
        const existingIndex = unique.findIndex((m) => m.id === memory.id);
        if (existingIndex >= 0 && memory.relevanceScore > unique[existingIndex].relevanceScore) {
          unique[existingIndex] = memory;
        }
      }
    }
    return unique.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  /**
   * Get retriever statistics
   */
  async getStats() {
    const vectorStats = await this.vectorStore.getStats();
    const graphStats = this.knowledgeGraph ? await this.knowledgeGraph.getStats() : null;
    return {
      vectorStore: vectorStats,
      knowledgeGraph: graphStats,
      configuration: {
        defaultLimit: this.defaultLimit,
        minRelevanceScore: this.minRelevanceScore,
        recencyBoostFactor: this.recencyBoostFactor,
        userContextBoostFactor: this.userContextBoostFactor,
        hybridSearchWeight: this.hybridSearchWeight
      }
    };
  }
};
function createMemoryRetriever(config) {
  return new MemoryRetriever(config);
}

// src/memory/journey-timeline.ts
var DEFAULT_STATISTICS = {
  totalEvents: 0,
  totalMilestones: 0,
  milestonesAchieved: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalXP: 0,
  currentLevel: 1,
  averageDailyProgress: 0,
  completionRate: 0,
  engagementScore: 0
};
var DEFAULT_MILESTONES = [
  {
    id: "first-login",
    type: "engagement",
    title: "First Steps",
    description: "Complete your first learning session",
    progress: 0,
    requirements: [
      { type: "sessions", target: 1, current: 0, description: "Complete 1 session" }
    ],
    rewards: [
      { type: "xp", value: 50, description: "50 XP bonus" },
      { type: "badge", value: "first_steps", description: "First Steps Badge" }
    ]
  },
  {
    id: "week-streak",
    type: "streak",
    title: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    progress: 0,
    requirements: [
      { type: "streak", target: 7, current: 0, description: "7-day streak" }
    ],
    rewards: [
      { type: "xp", value: 200, description: "200 XP bonus" },
      { type: "badge", value: "week_warrior", description: "Week Warrior Badge" }
    ]
  },
  {
    id: "month-streak",
    type: "streak",
    title: "Monthly Master",
    description: "Maintain a 30-day learning streak",
    progress: 0,
    requirements: [
      { type: "streak", target: 30, current: 0, description: "30-day streak" }
    ],
    rewards: [
      { type: "xp", value: 1e3, description: "1000 XP bonus" },
      { type: "badge", value: "monthly_master", description: "Monthly Master Badge" }
    ]
  }
];
var InMemoryTimelineStore = class {
  timelines = /* @__PURE__ */ new Map();
  getKey(userId, courseId) {
    return courseId ? `${userId}:${courseId}` : userId;
  }
  async get(userId, courseId) {
    const key = this.getKey(userId, courseId);
    return this.timelines.get(key) ?? null;
  }
  async create(timeline) {
    const now = /* @__PURE__ */ new Date();
    const newTimeline = {
      ...timeline,
      id: v4_default(),
      createdAt: now,
      updatedAt: now
    };
    const key = this.getKey(timeline.userId, timeline.courseId);
    this.timelines.set(key, newTimeline);
    return newTimeline;
  }
  async update(id, updates) {
    for (const [key, timeline] of this.timelines) {
      if (timeline.id === id) {
        const updated = {
          ...timeline,
          ...updates,
          id: timeline.id,
          createdAt: timeline.createdAt,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.timelines.set(key, updated);
        return updated;
      }
    }
    throw new Error(`Timeline not found: ${id}`);
  }
  async delete(id) {
    for (const [key, timeline] of this.timelines) {
      if (timeline.id === id) {
        return this.timelines.delete(key);
      }
    }
    return false;
  }
  async getById(id) {
    for (const timeline of this.timelines.values()) {
      if (timeline.id === id) {
        return timeline;
      }
    }
    return null;
  }
  async addEvent(id, event) {
    for (const [key, timeline] of this.timelines) {
      if (timeline.id === id) {
        const newEvent = {
          ...event,
          id: v4_default()
        };
        timeline.events.push(newEvent);
        timeline.statistics.totalEvents++;
        timeline.updatedAt = /* @__PURE__ */ new Date();
        this.timelines.set(key, timeline);
        return newEvent;
      }
    }
    throw new Error(`Timeline not found: ${id}`);
  }
  async getEvents(id, options) {
    for (const timeline of this.timelines.values()) {
      if (timeline.id === id) {
        let events = [...timeline.events];
        if (options?.types?.length) {
          events = events.filter(
            (e) => options.types.includes(e.type)
          );
        }
        events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (options?.offset) {
          events = events.slice(options.offset);
        }
        if (options?.limit) {
          events = events.slice(0, options.limit);
        }
        return events;
      }
    }
    return [];
  }
  async updateMilestone(id, milestoneId, updates) {
    for (const [key, timeline] of this.timelines) {
      if (timeline.id === id) {
        const milestoneIndex = timeline.milestones.findIndex(
          (m) => m.id === milestoneId
        );
        if (milestoneIndex === -1) {
          throw new Error(`Milestone not found: ${milestoneId}`);
        }
        const updated = {
          ...timeline.milestones[milestoneIndex],
          ...updates,
          id: milestoneId
        };
        timeline.milestones[milestoneIndex] = updated;
        timeline.updatedAt = /* @__PURE__ */ new Date();
        this.timelines.set(key, timeline);
        return updated;
      }
    }
    throw new Error(`Timeline not found: ${id}`);
  }
  // Utility for testing
  clear() {
    this.timelines.clear();
  }
};
var JourneyTimelineManager = class {
  store;
  logger;
  xpPerLevel;
  streakBonusMultiplier;
  constructor(config = {}) {
    this.store = config.timelineStore ?? new InMemoryTimelineStore();
    this.logger = config.logger ?? console;
    this.xpPerLevel = config.xpPerLevel ?? 1e3;
    this.streakBonusMultiplier = config.streakBonusMultiplier ?? 1.5;
  }
  // ============================================================================
  // TIMELINE MANAGEMENT
  // ============================================================================
  /**
   * Get or create timeline for a user
   */
  async getOrCreateTimeline(userId, courseId) {
    let timeline = await this.store.get(userId, courseId);
    if (!timeline) {
      this.logger.debug("Creating new journey timeline", { userId, courseId });
      timeline = await this.store.create({
        userId,
        courseId,
        events: [],
        milestones: JSON.parse(JSON.stringify(DEFAULT_MILESTONES)),
        currentPhase: "onboarding",
        statistics: { ...DEFAULT_STATISTICS }
      });
    }
    return timeline;
  }
  /**
   * Get timeline by ID
   */
  async getTimeline(userId, courseId) {
    return this.store.get(userId, courseId);
  }
  /**
   * Delete timeline
   */
  async deleteTimeline(userId, courseId) {
    const timeline = await this.store.get(userId, courseId);
    if (!timeline) return false;
    return this.store.delete(timeline.id);
  }
  // ============================================================================
  // EVENT TRACKING
  // ============================================================================
  /**
   * Record a journey event
   */
  async recordEvent(userId, type, data, options) {
    const timeline = await this.getOrCreateTimeline(userId, options?.courseId);
    const impact = {
      xpGained: options?.impact?.xpGained ?? this.getDefaultXP(type),
      progressDelta: options?.impact?.progressDelta,
      skillsAffected: options?.impact?.skillsAffected,
      emotionalImpact: options?.impact?.emotionalImpact,
      streakValue: options?.impact?.streakValue,
      previousStreak: options?.impact?.previousStreak
    };
    const event = await this.store.addEvent(timeline.id, {
      type,
      timestamp: /* @__PURE__ */ new Date(),
      data,
      impact,
      relatedEntities: options?.relatedEntities ?? []
    });
    await this.updateStatistics(timeline.id, type, impact);
    await this.checkMilestones(timeline.id);
    await this.updatePhase(timeline.id);
    this.logger.info("Journey event recorded", {
      userId,
      type,
      xp: impact.xpGained
    });
    return event;
  }
  /**
   * Record course start
   */
  async recordCourseStart(userId, courseId, courseName) {
    return this.recordEvent(
      userId,
      "started_course",
      { courseId, courseName },
      { courseId, impact: { xpGained: 100 } }
    );
  }
  /**
   * Record chapter completion
   */
  async recordChapterCompletion(userId, courseId, chapterId, chapterTitle) {
    return this.recordEvent(
      userId,
      "completed_chapter",
      { chapterId, chapterTitle },
      {
        courseId,
        impact: { xpGained: 200, progressDelta: 10 },
        relatedEntities: [chapterId]
      }
    );
  }
  /**
   * Record section completion
   */
  async recordSectionCompletion(userId, courseId, sectionId, sectionTitle) {
    return this.recordEvent(
      userId,
      "completed_section",
      { sectionId, sectionTitle },
      {
        courseId,
        impact: { xpGained: 50, progressDelta: 2 },
        relatedEntities: [sectionId]
      }
    );
  }
  /**
   * Record quiz result
   */
  async recordQuizResult(userId, courseId, quizId, score, passed) {
    const type = passed ? "passed_quiz" : "failed_quiz";
    const xp = passed ? Math.round(score * 2) : 10;
    return this.recordEvent(
      userId,
      type,
      { quizId, score, passed },
      {
        courseId,
        impact: {
          xpGained: xp,
          emotionalImpact: passed ? "confident" : "frustrated"
        },
        relatedEntities: [quizId]
      }
    );
  }
  /**
   * Record concept mastery
   */
  async recordConceptMastery(userId, conceptId, conceptName, courseId) {
    return this.recordEvent(
      userId,
      "mastered_concept",
      { conceptId, conceptName },
      {
        courseId,
        impact: { xpGained: 150, skillsAffected: [conceptName] },
        relatedEntities: [conceptId]
      }
    );
  }
  /**
   * Record streak continuation
   */
  async recordStreakContinued(userId, currentStreak, courseId) {
    const streakBonus = Math.floor(
      currentStreak * 10 * this.streakBonusMultiplier
    );
    return this.recordEvent(
      userId,
      "streak_continued",
      { currentStreak },
      {
        courseId,
        impact: {
          xpGained: 25 + streakBonus,
          emotionalImpact: "engaged",
          streakValue: currentStreak
        }
      }
    );
  }
  /**
   * Record streak broken
   */
  async recordStreakBroken(userId, previousStreak, courseId) {
    return this.recordEvent(
      userId,
      "streak_broken",
      { previousStreak },
      {
        courseId,
        impact: {
          emotionalImpact: "frustrated",
          previousStreak
        }
      }
    );
  }
  /**
   * Record goal achieved
   */
  async recordGoalAchieved(userId, goalId, goalDescription, courseId) {
    return this.recordEvent(
      userId,
      "goal_achieved",
      { goalId, goalDescription },
      {
        courseId,
        impact: { xpGained: 300, emotionalImpact: "confident" },
        relatedEntities: [goalId]
      }
    );
  }
  /**
   * Record level up
   */
  async recordLevelUp(userId, newLevel, courseId) {
    return this.recordEvent(
      userId,
      "level_up",
      { newLevel },
      {
        courseId,
        impact: { xpGained: 500, emotionalImpact: "confident" }
      }
    );
  }
  // ============================================================================
  // MILESTONE MANAGEMENT
  // ============================================================================
  /**
   * Get milestones for a user
   */
  async getMilestones(userId, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    return timeline.milestones;
  }
  /**
   * Update milestone progress
   */
  async updateMilestoneProgress(userId, milestoneId, requirementUpdates, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    const milestone = timeline.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }
    for (const update of requirementUpdates) {
      const req = milestone.requirements.find((r) => r.type === update.type);
      if (req) {
        req.current = update.current;
      }
    }
    const totalProgress = milestone.requirements.reduce((sum, req) => {
      return sum + Math.min(100, req.current / req.target * 100);
    }, 0);
    milestone.progress = Math.round(
      totalProgress / milestone.requirements.length
    );
    const isAchieved = milestone.requirements.every(
      (req) => req.current >= req.target
    );
    if (isAchieved && !milestone.achievedAt) {
      milestone.achievedAt = /* @__PURE__ */ new Date();
      milestone.progress = 100;
      await this.awardMilestoneRewards(userId, milestone, courseId);
      this.logger.info("Milestone achieved", {
        userId,
        milestoneId,
        title: milestone.title
      });
    }
    return this.store.updateMilestone(timeline.id, milestoneId, milestone);
  }
  /**
   * Add custom milestone
   */
  async addMilestone(userId, milestone, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    const newMilestone = {
      ...milestone,
      id: v4_default(),
      progress: 0
    };
    timeline.milestones.push(newMilestone);
    timeline.statistics.totalMilestones++;
    await this.store.update(timeline.id, {
      milestones: timeline.milestones,
      statistics: timeline.statistics
    });
    return newMilestone;
  }
  // ============================================================================
  // STATISTICS & ANALYTICS
  // ============================================================================
  /**
   * Get journey statistics
   */
  async getStatistics(userId, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    return timeline.statistics;
  }
  /**
   * Get recent events
   */
  async getRecentEvents(userId, limit = 10, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    return this.store.getEvents(timeline.id, { limit });
  }
  /**
   * Get events by type
   */
  async getEventsByType(userId, types, limit, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    return this.store.getEvents(timeline.id, { types, limit });
  }
  /**
   * Get current phase
   */
  async getCurrentPhase(userId, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    return timeline.currentPhase;
  }
  /**
   * Get learning summary
   */
  async getLearningSummary(userId, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    const stats = timeline.statistics;
    const milestones = timeline.milestones;
    const achievedMilestones = milestones.filter((m) => m.achievedAt);
    const inProgressMilestones = milestones.filter(
      (m) => !m.achievedAt && m.progress > 0
    );
    const nextMilestone = milestones.find(
      (m) => !m.achievedAt && m.progress < 100
    );
    const xpInCurrentLevel = stats.totalXP % this.xpPerLevel;
    const levelProgress = Math.round(xpInCurrentLevel / this.xpPerLevel * 100);
    return {
      userId,
      courseId,
      currentPhase: timeline.currentPhase,
      level: stats.currentLevel,
      totalXP: stats.totalXP,
      levelProgress,
      xpToNextLevel: this.xpPerLevel - xpInCurrentLevel,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      completionRate: stats.completionRate,
      engagementScore: stats.engagementScore,
      totalEvents: stats.totalEvents,
      achievedMilestones: achievedMilestones.length,
      totalMilestones: milestones.length,
      nextMilestone: nextMilestone ? {
        id: nextMilestone.id,
        title: nextMilestone.title,
        progress: nextMilestone.progress
      } : null,
      inProgressMilestones: inProgressMilestones.map((m) => ({
        id: m.id,
        title: m.title,
        progress: m.progress
      }))
    };
  }
  /**
   * Get achievement badges
   */
  async getAchievements(userId, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    const achievements = [];
    for (const milestone of timeline.milestones) {
      if (milestone.achievedAt) {
        for (const reward of milestone.rewards) {
          if (reward.type === "badge") {
            achievements.push({
              id: `${milestone.id}-${reward.value}`,
              badgeId: reward.value,
              title: milestone.title,
              description: reward.description,
              achievedAt: milestone.achievedAt,
              milestoneId: milestone.id
            });
          }
        }
      }
    }
    return achievements;
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  getDefaultXP(type) {
    const xpMap = {
      started_course: 100,
      completed_chapter: 200,
      completed_section: 50,
      passed_quiz: 100,
      failed_quiz: 10,
      earned_badge: 150,
      reached_milestone: 300,
      mastered_concept: 150,
      asked_question: 25,
      received_help: 15,
      created_artifact: 75,
      reviewed_content: 30,
      streak_continued: 25,
      streak_broken: 0,
      goal_achieved: 300,
      level_up: 500
    };
    return xpMap[type] ?? 10;
  }
  async updateStatistics(timelineId, eventType, impact) {
    const timeline = await this.findTimelineById(timelineId);
    if (!timeline) return;
    const stats = { ...timeline.statistics };
    if (impact.xpGained) {
      stats.totalXP += impact.xpGained;
      const newLevel = Math.floor(stats.totalXP / this.xpPerLevel) + 1;
      if (newLevel > stats.currentLevel) {
        stats.currentLevel = newLevel;
      }
    }
    if (eventType === "streak_continued") {
      stats.currentStreak = impact.streakValue ?? stats.currentStreak + 1;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
    } else if (eventType === "streak_broken") {
      if (impact.previousStreak && impact.previousStreak > stats.longestStreak) {
        stats.longestStreak = impact.previousStreak;
      }
      stats.currentStreak = 0;
    }
    if (eventType === "completed_chapter" && impact.progressDelta) {
      stats.completionRate = Math.min(
        100,
        stats.completionRate + impact.progressDelta
      );
    }
    await this.store.update(timelineId, { statistics: stats });
  }
  async checkMilestones(timelineId) {
    const timeline = await this.findTimelineById(timelineId);
    if (!timeline) return;
    const sessionCount = timeline.events.filter(
      (e) => e.type === "started_course"
    ).length;
    const firstLoginMilestone = timeline.milestones.find(
      (m) => m.id === "first-login"
    );
    if (firstLoginMilestone && !firstLoginMilestone.achievedAt) {
      await this.updateMilestoneProgress(
        timeline.userId,
        "first-login",
        [{ type: "sessions", current: sessionCount }],
        timeline.courseId
      );
    }
    const weekStreakMilestone = timeline.milestones.find(
      (m) => m.id === "week-streak"
    );
    if (weekStreakMilestone && !weekStreakMilestone.achievedAt) {
      await this.updateMilestoneProgress(
        timeline.userId,
        "week-streak",
        [{ type: "streak", current: timeline.statistics.currentStreak }],
        timeline.courseId
      );
    }
    const monthStreakMilestone = timeline.milestones.find(
      (m) => m.id === "month-streak"
    );
    if (monthStreakMilestone && !monthStreakMilestone.achievedAt) {
      await this.updateMilestoneProgress(
        timeline.userId,
        "month-streak",
        [{ type: "streak", current: timeline.statistics.currentStreak }],
        timeline.courseId
      );
    }
  }
  async updatePhase(timelineId) {
    const timeline = await this.findTimelineById(timelineId);
    if (!timeline) return;
    const stats = timeline.statistics;
    let newPhase = timeline.currentPhase;
    if (stats.totalEvents < 5) {
      newPhase = "onboarding";
    } else if (stats.completionRate < 20) {
      newPhase = "exploration";
    } else if (stats.completionRate < 50) {
      newPhase = "building_foundation";
    } else if (stats.completionRate < 80) {
      newPhase = "deepening";
    } else if (stats.completionRate < 100) {
      newPhase = "mastery";
    } else {
      newPhase = "maintenance";
    }
    if (newPhase !== timeline.currentPhase) {
      await this.store.update(timelineId, { currentPhase: newPhase });
      this.logger.info("Learning phase updated", {
        userId: timeline.userId,
        previousPhase: timeline.currentPhase,
        newPhase
      });
    }
  }
  async awardMilestoneRewards(userId, milestone, courseId) {
    const timeline = await this.getOrCreateTimeline(userId, courseId);
    const stats = { ...timeline.statistics };
    for (const reward of milestone.rewards) {
      if (reward.type === "xp") {
        stats.totalXP += reward.value;
      }
    }
    stats.milestonesAchieved++;
    await this.store.update(timeline.id, { statistics: stats });
    await this.recordEvent(
      userId,
      "reached_milestone",
      { milestoneId: milestone.id, title: milestone.title },
      { courseId }
    );
  }
  async findTimelineById(id) {
    return this.store.getById(id);
  }
};
function createJourneyTimeline(config) {
  return new JourneyTimelineManager(config);
}

// src/memory/lifecycle/types.ts
var import_zod9 = require("zod");
var ContentEntityType = {
  COURSE: "course",
  CHAPTER: "chapter",
  SECTION: "section",
  LESSON: "lesson",
  QUIZ: "quiz",
  RESOURCE: "resource",
  USER_NOTE: "user_note",
  CONVERSATION: "conversation"
};
var ChangeType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  BULK_UPDATE: "bulk_update"
};
var ReindexJobType = {
  SINGLE: "single",
  BATCH: "batch",
  FULL: "full",
  INCREMENTAL: "incremental"
};
var ReindexJobStatus = {
  PENDING: "pending",
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  RETRYING: "retrying"
};
var ReindexPriority = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  CRITICAL: 100
};
var ContentChangeEventSchema = import_zod9.z.object({
  id: import_zod9.z.string().min(1),
  entityType: import_zod9.z.enum([
    "course",
    "chapter",
    "section",
    "lesson",
    "quiz",
    "resource",
    "user_note",
    "conversation"
  ]),
  entityId: import_zod9.z.string().min(1),
  changeType: import_zod9.z.enum(["create", "update", "delete", "bulk_update"]),
  timestamp: import_zod9.z.date(),
  metadata: import_zod9.z.object({
    courseId: import_zod9.z.string().optional(),
    chapterId: import_zod9.z.string().optional(),
    sectionId: import_zod9.z.string().optional(),
    userId: import_zod9.z.string().optional(),
    previousHash: import_zod9.z.string().optional(),
    newHash: import_zod9.z.string().optional(),
    fieldsChanged: import_zod9.z.array(import_zod9.z.string()).optional(),
    batchId: import_zod9.z.string().optional()
  })
});
var MemoryLifecycleConfigSchema = import_zod9.z.object({
  autoReindexEnabled: import_zod9.z.boolean().default(true),
  debounceMs: import_zod9.z.number().min(0).default(5e3),
  maxBatchSize: import_zod9.z.number().min(1).max(1e3).default(100),
  maxConcurrentJobs: import_zod9.z.number().min(1).max(50).default(5),
  retry: import_zod9.z.object({
    maxAttempts: import_zod9.z.number().min(1).max(10).default(3),
    backoffMs: import_zod9.z.number().min(100).max(6e4).default(1e3),
    backoffMultiplier: import_zod9.z.number().min(1).max(10).default(2)
  }),
  priorityRules: import_zod9.z.array(import_zod9.z.any()).default([]),
  entityConfigs: import_zod9.z.record(import_zod9.z.any()).default({})
});

// src/memory/lifecycle/memory-lifecycle-manager.ts
var DEFAULT_CONFIG = {
  autoReindexEnabled: true,
  debounceMs: 5e3,
  maxBatchSize: 100,
  maxConcurrentJobs: 5,
  retry: {
    maxAttempts: 3,
    backoffMs: 1e3,
    backoffMultiplier: 2
  },
  priorityRules: [],
  entityConfigs: {}
};
var InMemoryReindexJobStore = class {
  jobs = /* @__PURE__ */ new Map();
  async create(job) {
    const now = /* @__PURE__ */ new Date();
    const newJob = {
      ...job,
      id: v4_default(),
      createdAt: now,
      updatedAt: now
    };
    this.jobs.set(newJob.id, newJob);
    return newJob;
  }
  async get(id) {
    return this.jobs.get(id) ?? null;
  }
  async update(id, updates) {
    const job = this.jobs.get(id);
    if (!job) return null;
    const updated = {
      ...job,
      ...updates,
      id: job.id,
      createdAt: job.createdAt,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.jobs.set(id, updated);
    return updated;
  }
  async delete(id) {
    return this.jobs.delete(id);
  }
  async findPending(limit) {
    const pending = Array.from(this.jobs.values()).filter(
      (j) => j.status === "pending" || j.status === "queued" || j.status === "retrying"
    ).filter((j) => j.scheduledFor <= /* @__PURE__ */ new Date()).sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());
    return pending.slice(0, limit);
  }
  async findByEntity(entityType, entityId) {
    return Array.from(this.jobs.values()).filter(
      (j) => j.entityType === entityType && j.entityId === entityId
    );
  }
  async findByStatus(status, limit) {
    const jobs = Array.from(this.jobs.values()).filter((j) => j.status === status);
    return limit ? jobs.slice(0, limit) : jobs;
  }
  async countByStatus() {
    const counts = {
      pending: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      retrying: 0
    };
    for (const job of this.jobs.values()) {
      counts[job.status]++;
    }
    return counts;
  }
  async cleanupCompleted(olderThan) {
    let count = 0;
    for (const [id, job] of this.jobs) {
      if (job.status === "completed" && job.completedAt && job.completedAt < olderThan) {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }
  clear() {
    this.jobs.clear();
  }
};
var ChangeDebouncer = class {
  constructor(debounceMs, onFlush) {
    this.debounceMs = debounceMs;
    this.onFlush = onFlush;
  }
  pending = /* @__PURE__ */ new Map();
  add(event) {
    const key = `${event.entityType}:${event.entityId}`;
    const existing = this.pending.get(key);
    if (existing) {
      clearTimeout(existing.timer);
      existing.events.push(event);
    } else {
      this.pending.set(key, {
        events: [event],
        timer: setTimeout(() => this.flush(key), this.debounceMs),
        createdAt: /* @__PURE__ */ new Date()
      });
      return;
    }
    const updated = this.pending.get(key);
    updated.timer = setTimeout(() => this.flush(key), this.debounceMs);
  }
  flush(key) {
    const debounced = this.pending.get(key);
    if (!debounced) return;
    this.pending.delete(key);
    this.onFlush(debounced.events);
  }
  flushAll() {
    for (const key of this.pending.keys()) {
      this.flush(key);
    }
  }
  clear() {
    for (const debounced of this.pending.values()) {
      clearTimeout(debounced.timer);
    }
    this.pending.clear();
  }
};
var MemoryLifecycleManager = class {
  config;
  store;
  vectorAdapter;
  logger;
  debouncer;
  isRunning = false;
  processingInterval;
  activeJobs = 0;
  constructor(options) {
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.store = options.store ?? new InMemoryReindexJobStore();
    this.vectorAdapter = options.vectorAdapter;
    this.logger = options.logger ?? console;
    this.debouncer = new ChangeDebouncer(
      this.config.debounceMs,
      (events) => this.processDebouncedEvents(events)
    );
  }
  // -------------------------------------------------------------------------
  // Event Handling
  // -------------------------------------------------------------------------
  async handleContentChange(event) {
    if (!this.config.autoReindexEnabled) {
      this.logger.debug("Auto-reindex disabled, ignoring event", {
        entityType: event.entityType,
        entityId: event.entityId
      });
      return;
    }
    this.logger.info("Content change detected", {
      entityType: event.entityType,
      entityId: event.entityId,
      changeType: event.changeType
    });
    this.debouncer.add(event);
  }
  async processDebouncedEvents(events) {
    if (events.length === 0) return;
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    let effectiveChangeType = firstEvent.changeType;
    if (events.some((e) => e.changeType === "delete")) {
      effectiveChangeType = "delete";
    } else if (events.length > 1) {
      effectiveChangeType = "bulk_update";
    }
    const priority = this.calculatePriority(firstEvent);
    try {
      await this.queueReindexJob({
        type: events.length > 1 ? "batch" : "single",
        status: "pending",
        priority,
        entityType: firstEvent.entityType,
        entityId: firstEvent.entityId,
        changeType: effectiveChangeType,
        metadata: {
          courseId: firstEvent.metadata.courseId,
          source: "content_change",
          triggeredBy: "lifecycle_manager",
          custom: {
            eventCount: events.length,
            firstEventId: firstEvent.id,
            lastEventId: lastEvent.id
          }
        },
        attempts: 0,
        maxAttempts: this.config.retry.maxAttempts,
        scheduledFor: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      this.logger.error("Failed to queue reindex job", {
        entityType: firstEvent.entityType,
        entityId: firstEvent.entityId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  calculatePriority(event) {
    for (const rule of this.config.priorityRules) {
      if (rule.condition.entityTypes?.includes(event.entityType)) {
        if (!rule.condition.changeTypes || rule.condition.changeTypes.includes(event.changeType)) {
          if (!rule.condition.custom || rule.condition.custom(event)) {
            return rule.priority;
          }
        }
      }
    }
    switch (event.entityType) {
      case "course":
        return 10;
      // HIGH
      case "chapter":
        return 5;
      // NORMAL
      case "section":
        return 5;
      // NORMAL
      default:
        return 1;
    }
  }
  // -------------------------------------------------------------------------
  // Job Management
  // -------------------------------------------------------------------------
  async queueReindexJob(job) {
    const existingJobs = await this.store.findByEntity(job.entityType, job.entityId);
    const pendingJob = existingJobs.find(
      (j) => j.status === "pending" || j.status === "queued"
    );
    if (pendingJob) {
      if (job.priority > pendingJob.priority) {
        const updated = await this.store.update(pendingJob.id, {
          priority: job.priority,
          changeType: job.changeType
        });
        this.logger.debug("Updated existing job priority", {
          jobId: pendingJob.id,
          newPriority: job.priority
        });
        return updated;
      }
      return pendingJob;
    }
    const newJob = await this.store.create(job);
    this.logger.info("Reindex job queued", {
      jobId: newJob.id,
      entityType: newJob.entityType,
      entityId: newJob.entityId,
      priority: newJob.priority
    });
    return newJob;
  }
  async getPendingJobs(limit = 100) {
    return this.store.findPending(limit);
  }
  async processJobs() {
    const availableSlots = this.config.maxConcurrentJobs - this.activeJobs;
    if (availableSlots <= 0) {
      return [];
    }
    const jobs = await this.store.findPending(availableSlots);
    if (jobs.length === 0) {
      return [];
    }
    const results = [];
    for (const job of jobs) {
      try {
        this.activeJobs++;
        await this.store.update(job.id, {
          status: "processing",
          startedAt: /* @__PURE__ */ new Date()
        });
        const result = await this.processJob(job);
        results.push(result);
        await this.store.update(job.id, {
          status: result.success ? "completed" : "failed",
          completedAt: /* @__PURE__ */ new Date(),
          lastError: result.errors.length > 0 ? result.errors[0].message : void 0
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        this.logger.error("Job processing failed", {
          jobId: job.id,
          error: errorMessage
        });
        if (job.attempts + 1 < job.maxAttempts) {
          const backoffMs = this.config.retry.backoffMs * Math.pow(this.config.retry.backoffMultiplier, job.attempts);
          await this.store.update(job.id, {
            status: "retrying",
            attempts: job.attempts + 1,
            lastAttemptAt: /* @__PURE__ */ new Date(),
            lastError: errorMessage,
            scheduledFor: new Date(Date.now() + backoffMs)
          });
        } else {
          await this.store.update(job.id, {
            status: "failed",
            attempts: job.attempts + 1,
            lastAttemptAt: /* @__PURE__ */ new Date(),
            lastError: errorMessage
          });
        }
        results.push({
          jobId: job.id,
          success: false,
          documentsProcessed: 0,
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsDeleted: 0,
          errors: [{ message: errorMessage, code: "PROCESSING_ERROR", recoverable: true }],
          duration: 0,
          timestamp: /* @__PURE__ */ new Date()
        });
      } finally {
        this.activeJobs--;
      }
    }
    return results;
  }
  async processJob(job) {
    const startTime = Date.now();
    let documentsProcessed = 0;
    let documentsAdded = 0;
    let documentsUpdated = 0;
    let documentsDeleted = 0;
    const errors = [];
    this.logger.info("Processing reindex job", {
      jobId: job.id,
      entityType: job.entityType,
      entityId: job.entityId,
      changeType: job.changeType
    });
    try {
      const entityConfig = this.config.entityConfigs[job.entityType];
      if (!entityConfig?.enabled) {
        this.logger.warn("Entity type not configured for reindexing", {
          entityType: job.entityType
        });
        return {
          jobId: job.id,
          success: true,
          documentsProcessed: 0,
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsDeleted: 0,
          errors: [],
          duration: Date.now() - startTime,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
      if (job.changeType === "delete") {
        const deletedCount = await this.vectorAdapter.deleteByFilter({
          sourceTypes: [job.entityType],
          custom: { entityId: job.entityId }
        });
        documentsDeleted = deletedCount;
        documentsProcessed = deletedCount;
      } else {
        const content = await entityConfig.extractContent(job.entityId);
        if (!content) {
          this.logger.warn("No content extracted for entity", {
            entityType: job.entityType,
            entityId: job.entityId
          });
        } else {
          const chunks = content.chunks ?? [{ id: content.id, content: content.content, index: 0, metadata: {} }];
          for (const chunk of chunks) {
            try {
              const vectorId = `${job.entityType}:${job.entityId}:${chunk.index}`;
              const existing = await this.vectorAdapter.get(vectorId);
              if (existing) {
                await this.vectorAdapter.upsert({
                  id: vectorId,
                  content: chunk.content,
                  metadata: {
                    sourceType: job.entityType,
                    sourceId: job.entityId,
                    courseId: job.metadata.courseId,
                    tags: [],
                    ...chunk.metadata
                  }
                });
                documentsUpdated++;
              } else {
                await this.vectorAdapter.insert({
                  id: vectorId,
                  content: chunk.content,
                  metadata: {
                    sourceType: job.entityType,
                    sourceId: job.entityId,
                    courseId: job.metadata.courseId,
                    tags: [],
                    ...chunk.metadata
                  }
                });
                documentsAdded++;
              }
              documentsProcessed++;
            } catch (chunkError) {
              errors.push({
                documentId: `${job.entityType}:${job.entityId}:${chunk.index}`,
                entityId: job.entityId,
                message: chunkError instanceof Error ? chunkError.message : "Unknown error",
                code: "CHUNK_PROCESSING_ERROR",
                recoverable: true
              });
            }
          }
        }
      }
    } catch (error) {
      errors.push({
        entityId: job.entityId,
        message: error instanceof Error ? error.message : "Unknown error",
        code: "JOB_PROCESSING_ERROR",
        recoverable: false
      });
    }
    const result = {
      jobId: job.id,
      success: errors.filter((e) => !e.recoverable).length === 0,
      documentsProcessed,
      documentsAdded,
      documentsUpdated,
      documentsDeleted,
      errors,
      duration: Date.now() - startTime,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.logger.info("Reindex job completed", {
      jobId: job.id,
      success: result.success,
      documentsProcessed: result.documentsProcessed,
      duration: result.duration
    });
    return result;
  }
  async cancelJob(jobId) {
    const job = await this.store.get(jobId);
    if (!job) return false;
    if (job.status === "processing") {
      this.logger.warn("Cannot cancel job in processing state", { jobId });
      return false;
    }
    await this.store.update(jobId, { status: "cancelled" });
    this.logger.info("Job cancelled", { jobId });
    return true;
  }
  async getJobStatus(jobId) {
    return this.store.get(jobId);
  }
  async getStats() {
    const counts = await this.store.countByStatus();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return {
      pendingJobs: counts.pending + counts.queued + counts.retrying,
      processingJobs: counts.processing,
      completedToday: counts.completed,
      failedToday: counts.failed,
      averageProcessingTime: 0,
      // Would need to track this
      queueDepthByPriority: {}
    };
  }
  async triggerFullReindex(entityType) {
    return this.queueReindexJob({
      type: "full",
      status: "pending",
      priority: 1,
      // LOW - full reindex runs in background
      entityType,
      entityId: "*",
      changeType: "bulk_update",
      metadata: {
        source: "manual_trigger",
        triggeredBy: "lifecycle_manager"
      },
      attempts: 0,
      maxAttempts: this.config.retry.maxAttempts,
      scheduledFor: /* @__PURE__ */ new Date()
    });
  }
  // -------------------------------------------------------------------------
  // Lifecycle Control
  // -------------------------------------------------------------------------
  async start() {
    if (this.isRunning) {
      this.logger.warn("Lifecycle manager already running");
      return;
    }
    this.isRunning = true;
    this.logger.info("Memory lifecycle manager started");
    this.processingInterval = setInterval(
      () => this.processJobs().catch((e) => this.logger.error("Job processing error", { error: e })),
      5e3
      // Process every 5 seconds
    );
  }
  async stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.debouncer.flushAll();
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = void 0;
    }
    this.logger.info("Memory lifecycle manager stopped");
  }
};
function createMemoryLifecycleManager(options) {
  return new MemoryLifecycleManager(options);
}

// src/memory/lifecycle/kg-refresh-scheduler.ts
var KGRefreshJobType = {
  FULL_REBUILD: "full_rebuild",
  INCREMENTAL: "incremental",
  RELATIONSHIP_CHECK: "relationship_check",
  STALE_PRUNING: "stale_pruning",
  CONSISTENCY_CHECK: "consistency_check"
};
var KGRefreshJobStatus = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
};
var DEFAULT_CONFIG2 = {
  enabled: true,
  scheduleIntervalMs: 6 * 60 * 60 * 1e3,
  // 6 hours
  staleRelationshipAgeMs: 7 * 24 * 60 * 60 * 1e3,
  // 7 days
  entityTypes: ["concept", "topic", "skill", "course", "chapter", "section"],
  incrementalMode: true,
  batchSize: 100,
  minRelationshipConfidence: 0.5
};
var KGRefreshScheduler = class {
  config;
  kgStore;
  logger;
  jobs = /* @__PURE__ */ new Map();
  isRunning = false;
  schedulerInterval;
  constructor(options) {
    this.config = { ...DEFAULT_CONFIG2, ...options.config };
    this.kgStore = options.kgStore;
    this.logger = options.logger ?? console;
  }
  // -------------------------------------------------------------------------
  // Job Management
  // -------------------------------------------------------------------------
  async scheduleRefresh(type, options) {
    const now = /* @__PURE__ */ new Date();
    const job = {
      id: v4_default(),
      type,
      status: "pending",
      entityTypes: options?.entityTypes ?? this.config.entityTypes,
      relationshipTypes: options?.relationshipTypes,
      scheduledFor: options?.scheduledFor ?? now,
      createdAt: now,
      updatedAt: now
    };
    this.jobs.set(job.id, job);
    this.logger.info("KG refresh job scheduled", {
      jobId: job.id,
      type: job.type,
      scheduledFor: job.scheduledFor
    });
    return job;
  }
  async executePendingJobs() {
    const now = /* @__PURE__ */ new Date();
    const pendingJobs = Array.from(this.jobs.values()).filter((j) => j.status === "pending" && j.scheduledFor <= now).sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
    const results = [];
    for (const job of pendingJobs) {
      try {
        job.status = "running";
        job.startedAt = /* @__PURE__ */ new Date();
        job.updatedAt = /* @__PURE__ */ new Date();
        this.jobs.set(job.id, job);
        const result = await this.executeJob(job);
        results.push(result);
        job.status = "completed";
        job.completedAt = /* @__PURE__ */ new Date();
        job.result = result;
        job.updatedAt = /* @__PURE__ */ new Date();
        this.jobs.set(job.id, job);
        this.logger.info("KG refresh job completed", {
          jobId: job.id,
          type: job.type,
          duration: result.duration,
          entitiesProcessed: result.entitiesProcessed,
          relationshipsProcessed: result.relationshipsProcessed
        });
      } catch (error) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : "Unknown error";
        job.updatedAt = /* @__PURE__ */ new Date();
        this.jobs.set(job.id, job);
        this.logger.error("KG refresh job failed", {
          jobId: job.id,
          error: job.error
        });
      }
    }
    return results;
  }
  async executeJob(job) {
    const startTime = Date.now();
    const result = {
      entitiesProcessed: 0,
      entitiesAdded: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsProcessed: 0,
      relationshipsAdded: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      staleRelationshipsPruned: 0,
      inconsistenciesFound: 0,
      inconsistenciesFixed: 0,
      duration: 0
    };
    switch (job.type) {
      case "full_rebuild":
        await this.executeFullRebuild(job, result);
        break;
      case "incremental":
        await this.executeIncrementalRefresh(job, result);
        break;
      case "relationship_check":
        await this.executeRelationshipCheck(job, result);
        break;
      case "stale_pruning":
        await this.executeStalePruning(job, result);
        break;
      case "consistency_check":
        await this.executeConsistencyCheck(job, result);
        break;
    }
    result.duration = Date.now() - startTime;
    return result;
  }
  async executeFullRebuild(job, result) {
    this.logger.info("Executing full KG rebuild", { jobId: job.id });
    for (const entityType of job.entityTypes ?? this.config.entityTypes) {
      const entities = await this.kgStore.findEntities(
        entityType,
        void 0,
        this.config.batchSize
      );
      for (const entity of entities) {
        result.entitiesProcessed++;
        const relationships = await this.kgStore.getRelationships(entity.id);
        result.relationshipsProcessed += relationships.length;
        for (const rel of relationships) {
          const isValid = await this.validateRelationship(rel);
          if (!isValid) {
            await this.kgStore.deleteRelationship(rel.id);
            result.relationshipsDeleted++;
          }
        }
      }
    }
  }
  async executeIncrementalRefresh(job, result) {
    this.logger.info("Executing incremental KG refresh", { jobId: job.id });
    const cutoff = new Date(Date.now() - this.config.scheduleIntervalMs);
    for (const entityType of job.entityTypes ?? this.config.entityTypes) {
      const entities = await this.kgStore.findEntities(
        entityType,
        void 0,
        this.config.batchSize
      );
      const recentEntities = entities.filter((e) => e.updatedAt >= cutoff);
      for (const entity of recentEntities) {
        result.entitiesProcessed++;
        const relationships = await this.kgStore.getRelationships(entity.id);
        result.relationshipsProcessed += relationships.length;
      }
    }
  }
  async executeRelationshipCheck(job, result) {
    this.logger.info("Executing relationship check", { jobId: job.id });
    for (const entityType of job.entityTypes ?? this.config.entityTypes) {
      const entities = await this.kgStore.findEntities(
        entityType,
        void 0,
        this.config.batchSize
      );
      for (const entity of entities) {
        const relationships = await this.kgStore.getRelationships(entity.id);
        for (const rel of relationships) {
          result.relationshipsProcessed++;
          const target = await this.kgStore.getEntity(rel.targetId);
          if (!target) {
            await this.kgStore.deleteRelationship(rel.id);
            result.relationshipsDeleted++;
            result.inconsistenciesFound++;
            result.inconsistenciesFixed++;
          }
        }
      }
    }
  }
  async executeStalePruning(job, result) {
    this.logger.info("Executing stale relationship pruning", { jobId: job.id });
    const staleThreshold = new Date(Date.now() - this.config.staleRelationshipAgeMs);
    for (const entityType of job.entityTypes ?? this.config.entityTypes) {
      const entities = await this.kgStore.findEntities(
        entityType,
        void 0,
        this.config.batchSize
      );
      for (const entity of entities) {
        const relationships = await this.kgStore.getRelationships(entity.id);
        for (const rel of relationships) {
          result.relationshipsProcessed++;
          if (rel.createdAt < staleThreshold && rel.weight < this.config.minRelationshipConfidence) {
            await this.kgStore.deleteRelationship(rel.id);
            result.staleRelationshipsPruned++;
          }
        }
      }
    }
  }
  async executeConsistencyCheck(job, result) {
    this.logger.info("Executing consistency check", { jobId: job.id });
    for (const entityType of job.entityTypes ?? this.config.entityTypes) {
      const entities = await this.kgStore.findEntities(
        entityType,
        void 0,
        this.config.batchSize
      );
      for (const entity of entities) {
        result.entitiesProcessed++;
        const relationships = await this.kgStore.getRelationships(entity.id);
        if (relationships.length === 0) {
          result.inconsistenciesFound++;
        }
        const relMap = /* @__PURE__ */ new Map();
        for (const rel of relationships) {
          result.relationshipsProcessed++;
          const key = `${rel.type}:${rel.sourceId}:${rel.targetId}`;
          if (relMap.has(key)) {
            const existing = relMap.get(key);
            const toDelete = rel.createdAt < existing.createdAt ? rel : existing;
            await this.kgStore.deleteRelationship(toDelete.id);
            result.inconsistenciesFound++;
            result.inconsistenciesFixed++;
          } else {
            relMap.set(key, rel);
          }
        }
      }
    }
  }
  async validateRelationship(rel) {
    const source = await this.kgStore.getEntity(rel.sourceId);
    const target = await this.kgStore.getEntity(rel.targetId);
    return source !== null && target !== null;
  }
  // -------------------------------------------------------------------------
  // Status and Control
  // -------------------------------------------------------------------------
  async getJobStatus(jobId) {
    return this.jobs.get(jobId) ?? null;
  }
  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === "running") {
      this.logger.warn("Cannot cancel running job", { jobId });
      return false;
    }
    job.status = "cancelled";
    job.updatedAt = /* @__PURE__ */ new Date();
    this.jobs.set(jobId, job);
    return true;
  }
  async getStats() {
    const now = /* @__PURE__ */ new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const completedJobs = Array.from(this.jobs.values()).filter(
      (j) => j.status === "completed" && j.completedAt && j.completedAt >= oneDayAgo
    );
    const lastCompleted = completedJobs.sort(
      (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
    )[0];
    return {
      lastRefreshAt: lastCompleted?.completedAt,
      lastRefreshDuration: lastCompleted?.result?.duration,
      totalEntities: 0,
      // Would need to query KG store
      totalRelationships: 0,
      staleRelationships: 0,
      pendingJobs: Array.from(this.jobs.values()).filter((j) => j.status === "pending").length,
      completedJobs24h: completedJobs.length
    };
  }
  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  async start() {
    if (this.isRunning) {
      this.logger.warn("KG refresh scheduler already running");
      return;
    }
    this.isRunning = true;
    this.logger.info("KG refresh scheduler started", {
      intervalMs: this.config.scheduleIntervalMs,
      incrementalMode: this.config.incrementalMode
    });
    await this.scheduleRefresh(
      this.config.incrementalMode ? "incremental" : "full_rebuild"
    );
    this.schedulerInterval = setInterval(async () => {
      try {
        await this.executePendingJobs();
        const nextRun = new Date(Date.now() + this.config.scheduleIntervalMs);
        await this.scheduleRefresh(
          this.config.incrementalMode ? "incremental" : "full_rebuild",
          { scheduledFor: nextRun }
        );
      } catch (error) {
        this.logger.error("KG refresh scheduler error", {
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }, this.config.scheduleIntervalMs);
  }
  async stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = void 0;
    }
    this.logger.info("KG refresh scheduler stopped");
  }
};
function createKGRefreshScheduler(options) {
  return new KGRefreshScheduler(options);
}

// src/memory/normalization/types.ts
var import_zod10 = require("zod");
var MemorySegmentType = {
  COURSE_CONTENT: "course_content",
  USER_HISTORY: "user_history",
  PREVIOUS_CONVERSATIONS: "previous_conversations",
  RELATED_CONCEPTS: "related_concepts",
  LEARNING_PROGRESS: "learning_progress",
  USER_NOTES: "user_notes",
  EXTERNAL_KNOWLEDGE: "external_knowledge",
  RECENT_ACTIVITY: "recent_activity"
};
var MemoryItemType = {
  TEXT: "text",
  CONVERSATION_TURN: "conversation_turn",
  CONCEPT: "concept",
  SKILL: "skill",
  PROGRESS: "progress",
  NOTE: "note",
  QUESTION: "question",
  ANSWER: "answer",
  ARTIFACT: "artifact"
};
var MemorySourceType = {
  VECTOR_STORE: "vector_store",
  KNOWLEDGE_GRAPH: "knowledge_graph",
  SESSION_CONTEXT: "session_context",
  JOURNEY_TIMELINE: "journey_timeline",
  DATABASE: "database",
  EXTERNAL_API: "external_api"
};
var NormalizationRetrievalStrategy = {
  SEMANTIC_SEARCH: "semantic_search",
  KEYWORD_SEARCH: "keyword_search",
  GRAPH_TRAVERSAL: "graph_traversal",
  RECENCY_BOOST: "recency_boost",
  HYBRID: "hybrid",
  CONTEXTUAL: "contextual"
};
var DEFAULT_NORMALIZER_CONFIG = {
  maxItems: 50,
  maxItemsPerSegment: 10,
  maxContentLength: 2e3,
  minRelevanceScore: 0.3,
  includeSummaries: true,
  maxSummaryLength: 200,
  segmentPriority: [
    "course_content",
    "previous_conversations",
    "related_concepts",
    "learning_progress",
    "user_notes",
    "user_history",
    "recent_activity",
    "external_knowledge"
  ],
  tokenBudget: 4e3,
  charsPerToken: 4
};
var NormalizedMemoryContextSchema = import_zod10.z.object({
  id: import_zod10.z.string().min(1),
  userId: import_zod10.z.string().min(1),
  courseId: import_zod10.z.string().optional(),
  generatedAt: import_zod10.z.date(),
  generationTimeMs: import_zod10.z.number().min(0),
  segments: import_zod10.z.array(
    import_zod10.z.object({
      type: import_zod10.z.string(),
      title: import_zod10.z.string(),
      items: import_zod10.z.array(import_zod10.z.any()),
      relevanceScore: import_zod10.z.number().min(0).max(1),
      priority: import_zod10.z.number()
    })
  ),
  relevanceScore: import_zod10.z.number().min(0).max(1),
  sources: import_zod10.z.array(
    import_zod10.z.object({
      type: import_zod10.z.string(),
      id: import_zod10.z.string(),
      name: import_zod10.z.string().optional(),
      url: import_zod10.z.string().optional()
    })
  ),
  strategies: import_zod10.z.array(
    import_zod10.z.object({
      type: import_zod10.z.string(),
      durationMs: import_zod10.z.number(),
      resultsCount: import_zod10.z.number(),
      avgRelevance: import_zod10.z.number()
    })
  ),
  metadata: import_zod10.z.object({
    query: import_zod10.z.string().optional(),
    totalItemsFound: import_zod10.z.number(),
    filteredItems: import_zod10.z.number(),
    estimatedTokens: import_zod10.z.number(),
    truncated: import_zod10.z.boolean(),
    custom: import_zod10.z.record(import_zod10.z.unknown()).optional()
  })
});
var MemoryNormalizerConfigSchema = import_zod10.z.object({
  maxItems: import_zod10.z.number().min(1).max(1e3),
  maxItemsPerSegment: import_zod10.z.number().min(1).max(100),
  maxContentLength: import_zod10.z.number().min(100).max(1e4),
  minRelevanceScore: import_zod10.z.number().min(0).max(1),
  includeSummaries: import_zod10.z.boolean(),
  maxSummaryLength: import_zod10.z.number().min(50).max(1e3),
  segmentPriority: import_zod10.z.array(import_zod10.z.string()),
  tokenBudget: import_zod10.z.number().min(100).max(1e5),
  charsPerToken: import_zod10.z.number().min(1).max(10)
});

// src/memory/normalization/memory-normalizer.ts
var MemoryNormalizer = class {
  config;
  logger;
  constructor(options) {
    this.config = { ...DEFAULT_NORMALIZER_CONFIG, ...options?.config };
    this.logger = options?.logger ?? console;
  }
  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------
  getConfig() {
    return { ...this.config };
  }
  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
  // -------------------------------------------------------------------------
  // Normalization
  // -------------------------------------------------------------------------
  async normalize(input) {
    const startTime = Date.now();
    const sources = [];
    const strategies = [];
    const segments = [];
    let totalItemsFound = 0;
    this.logger.debug("Normalizing memory input", {
      userId: input.userId,
      courseId: input.courseId,
      hasQuery: !!input.query
    });
    if (input.vectorResults?.length) {
      const vectorStartTime = Date.now();
      const vectorSegments = this.processVectorResults(input.vectorResults, input.courseId);
      segments.push(...vectorSegments);
      totalItemsFound += input.vectorResults.length;
      sources.push({
        type: "vector_store",
        id: "primary",
        name: "Vector Store"
      });
      strategies.push({
        type: "semantic_search",
        durationMs: Date.now() - vectorStartTime,
        resultsCount: input.vectorResults.length,
        avgRelevance: this.calculateAvgRelevance(input.vectorResults.map((r) => r.score))
      });
    }
    if (input.graphResults?.length) {
      const graphStartTime = Date.now();
      const graphSegments = this.processGraphResults(input.graphResults);
      segments.push(...graphSegments);
      totalItemsFound += input.graphResults.length;
      sources.push({
        type: "knowledge_graph",
        id: "primary",
        name: "Knowledge Graph"
      });
      strategies.push({
        type: "graph_traversal",
        durationMs: Date.now() - graphStartTime,
        resultsCount: input.graphResults.length,
        avgRelevance: 0.7
        // Default relevance for graph results
      });
    }
    if (input.sessionContext) {
      const sessionSegment = this.processSessionContext(input.sessionContext);
      if (sessionSegment.items.length > 0) {
        segments.push(sessionSegment);
        totalItemsFound += sessionSegment.items.length;
        sources.push({
          type: "session_context",
          id: "current",
          name: "Current Session"
        });
      }
    }
    if (input.journeyEvents?.length) {
      const journeySegment = this.processJourneyEvents(input.journeyEvents);
      if (journeySegment.items.length > 0) {
        segments.push(journeySegment);
        totalItemsFound += input.journeyEvents.length;
        sources.push({
          type: "journey_timeline",
          id: "user",
          name: "Learning Journey"
        });
      }
    }
    segments.sort((a, b) => b.priority - a.priority);
    const { truncatedSegments, truncated, estimatedTokens } = this.applyTokenBudget(segments);
    const relevanceScore = this.calculateOverallRelevance(truncatedSegments);
    const context = {
      id: v4_default(),
      userId: input.userId,
      courseId: input.courseId,
      generatedAt: /* @__PURE__ */ new Date(),
      generationTimeMs: Date.now() - startTime,
      segments: truncatedSegments,
      relevanceScore,
      sources,
      strategies,
      metadata: {
        query: input.query,
        totalItemsFound,
        filteredItems: this.countItems(truncatedSegments),
        estimatedTokens,
        truncated
      }
    };
    this.logger.info("Memory normalization complete", {
      contextId: context.id,
      segmentCount: context.segments.length,
      itemCount: context.metadata.filteredItems,
      estimatedTokens: context.metadata.estimatedTokens,
      durationMs: context.generationTimeMs
    });
    return context;
  }
  // -------------------------------------------------------------------------
  // Processing Methods
  // -------------------------------------------------------------------------
  processVectorResults(results, _courseId) {
    if (!results?.length) return [];
    const groups = {};
    for (const result of results) {
      const sourceType = result.metadata.sourceType || "unknown";
      const segmentType = this.mapSourceToSegmentType(sourceType);
      if (!groups[segmentType]) {
        groups[segmentType] = [];
      }
      if (result.score < this.config.minRelevanceScore) {
        continue;
      }
      const item = {
        id: result.id,
        type: this.mapToItemType(sourceType),
        content: this.truncateContent(result.content),
        summary: this.config.includeSummaries ? this.generateSummary(result.content) : void 0,
        relevanceScore: result.score,
        source: {
          type: "vector_store",
          id: result.id,
          name: result.metadata.title || void 0
        },
        createdAt: new Date(result.metadata.createdAt || Date.now()),
        metadata: result.metadata
      };
      groups[segmentType].push(item);
    }
    const segments = [];
    for (const [type, items] of Object.entries(groups)) {
      const sortedItems = items.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, this.config.maxItemsPerSegment);
      if (sortedItems.length > 0) {
        segments.push({
          type,
          title: this.getSegmentTitle(type),
          items: sortedItems,
          relevanceScore: this.calculateAvgRelevance(sortedItems.map((i) => i.relevanceScore)),
          priority: this.getSegmentPriority(type)
        });
      }
    }
    return segments;
  }
  processGraphResults(results) {
    if (!results?.length) return [];
    const items = results.map((result) => ({
      id: result.entity.id,
      type: "concept",
      content: `${result.entity.name}: ${JSON.stringify(result.entity.properties)}`,
      relevanceScore: 0.7,
      // Default for graph results
      source: {
        type: "knowledge_graph",
        id: result.entity.id,
        name: result.entity.name
      },
      createdAt: /* @__PURE__ */ new Date(),
      metadata: {
        entityType: result.entity.type,
        relationships: result.relationships,
        depth: result.depth
      }
    }));
    return [
      {
        type: "related_concepts",
        title: "Related Concepts",
        items: items.slice(0, this.config.maxItemsPerSegment),
        relevanceScore: 0.7,
        priority: this.getSegmentPriority("related_concepts")
      }
    ];
  }
  processSessionContext(context) {
    const items = [];
    if (context?.currentTopic) {
      items.push({
        id: "current-topic",
        type: "text",
        content: `Current topic: ${context.currentTopic}`,
        relevanceScore: 0.9,
        source: { type: "session_context", id: "topic" },
        createdAt: /* @__PURE__ */ new Date(),
        metadata: {}
      });
    }
    if (context?.recentConcepts?.length) {
      items.push({
        id: "recent-concepts",
        type: "concept",
        content: `Recently discussed: ${context.recentConcepts.join(", ")}`,
        relevanceScore: 0.8,
        source: { type: "session_context", id: "concepts" },
        createdAt: /* @__PURE__ */ new Date(),
        metadata: { concepts: context.recentConcepts }
      });
    }
    if (context?.pendingQuestions?.length) {
      items.push({
        id: "pending-questions",
        type: "question",
        content: `Pending questions: ${context.pendingQuestions.join("; ")}`,
        relevanceScore: 0.85,
        source: { type: "session_context", id: "questions" },
        createdAt: /* @__PURE__ */ new Date(),
        metadata: { questions: context.pendingQuestions }
      });
    }
    return {
      type: "user_history",
      title: "Current Session",
      items,
      relevanceScore: items.length > 0 ? 0.85 : 0,
      priority: this.getSegmentPriority("user_history")
    };
  }
  processJourneyEvents(events) {
    if (!events?.length) {
      return {
        type: "recent_activity",
        title: "Recent Activity",
        items: [],
        relevanceScore: 0,
        priority: this.getSegmentPriority("recent_activity")
      };
    }
    const items = events.slice(0, this.config.maxItemsPerSegment).map((event) => ({
      id: `journey-${event.timestamp.getTime()}`,
      type: "progress",
      content: `${event.type}: ${JSON.stringify(event.data)}`,
      relevanceScore: 0.6,
      source: { type: "journey_timeline", id: event.type },
      createdAt: event.timestamp,
      metadata: event.data
    }));
    return {
      type: "recent_activity",
      title: "Recent Activity",
      items,
      relevanceScore: items.length > 0 ? 0.6 : 0,
      priority: this.getSegmentPriority("recent_activity")
    };
  }
  // -------------------------------------------------------------------------
  // Formatting Methods
  // -------------------------------------------------------------------------
  formatForPrompt(context) {
    const lines = ["## Relevant Context"];
    for (const segment of context.segments) {
      if (segment.items.length === 0) continue;
      lines.push(`
### ${segment.title}`);
      for (const item of segment.items) {
        const content = item.summary ?? item.content;
        lines.push(`- ${content}`);
      }
    }
    if (context.metadata.truncated) {
      lines.push("\n*Note: Context has been summarized due to length constraints.*");
    }
    return lines.join("\n");
  }
  formatAsStructuredData(context) {
    const segments = context.segments.map((segment) => ({
      type: segment.type,
      title: segment.title,
      itemCount: segment.items.length,
      topItems: segment.items.slice(0, 3).map((item) => ({
        content: item.summary ?? item.content.substring(0, 200),
        relevance: item.relevanceScore
      }))
    }));
    const allItems = context.segments.flatMap((s) => s.items);
    const avgRelevance = this.calculateAvgRelevance(allItems.map((i) => i.relevanceScore));
    return {
      summary: this.generateContextSummary(context),
      segments,
      sources: context.sources.map((s) => s.name ?? s.type),
      stats: {
        totalItems: allItems.length,
        avgRelevance,
        tokenEstimate: context.metadata.estimatedTokens
      }
    };
  }
  // -------------------------------------------------------------------------
  // Helper Methods
  // -------------------------------------------------------------------------
  mapSourceToSegmentType(sourceType) {
    const mapping = {
      course_content: "course_content",
      chapter_content: "course_content",
      section_content: "course_content",
      conversation: "previous_conversations",
      user_note: "user_notes",
      question: "previous_conversations",
      answer: "previous_conversations",
      external_resource: "external_knowledge"
    };
    return mapping[sourceType] ?? "course_content";
  }
  mapToItemType(sourceType) {
    const mapping = {
      conversation: "conversation_turn",
      question: "question",
      answer: "answer",
      user_note: "note",
      artifact: "artifact"
    };
    return mapping[sourceType] ?? "text";
  }
  getSegmentTitle(type) {
    const titles = {
      course_content: "Course Content",
      user_history: "Your History",
      previous_conversations: "Previous Discussions",
      related_concepts: "Related Concepts",
      learning_progress: "Learning Progress",
      user_notes: "Your Notes",
      external_knowledge: "Additional Resources",
      recent_activity: "Recent Activity"
    };
    return titles[type] ?? type;
  }
  getSegmentPriority(type) {
    const index = this.config.segmentPriority.indexOf(type);
    return index >= 0 ? this.config.segmentPriority.length - index : 0;
  }
  truncateContent(content) {
    if (content.length <= this.config.maxContentLength) {
      return content;
    }
    return content.substring(0, this.config.maxContentLength - 3) + "...";
  }
  generateSummary(content) {
    if (content.length <= this.config.maxSummaryLength) {
      return void 0;
    }
    const firstSentence = content.match(/^[^.!?]*[.!?]/)?.[0];
    if (firstSentence && firstSentence.length <= this.config.maxSummaryLength) {
      return firstSentence;
    }
    return content.substring(0, this.config.maxSummaryLength - 3) + "...";
  }
  generateContextSummary(context) {
    const segmentNames = context.segments.filter((s) => s.items.length > 0).map((s) => s.title).join(", ");
    const itemCount = this.countItems(context.segments);
    return `Context includes ${itemCount} items from: ${segmentNames}`;
  }
  calculateAvgRelevance(scores) {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }
  calculateOverallRelevance(segments) {
    if (segments.length === 0) return 0;
    const weightedSum = segments.reduce(
      (sum, seg) => sum + seg.relevanceScore * seg.priority,
      0
    );
    const totalWeight = segments.reduce((sum, seg) => sum + seg.priority, 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  countItems(segments) {
    return segments.reduce((sum, seg) => sum + seg.items.length, 0);
  }
  applyTokenBudget(segments) {
    let totalChars = 0;
    const truncatedSegments = [];
    let truncated = false;
    for (const segment of segments) {
      const segmentChars = segment.items.reduce(
        (sum, item) => sum + (item.summary ?? item.content).length,
        0
      );
      if (totalChars + segmentChars <= this.config.tokenBudget * this.config.charsPerToken) {
        truncatedSegments.push(segment);
        totalChars += segmentChars;
      } else {
        const remainingBudget = this.config.tokenBudget * this.config.charsPerToken - totalChars;
        if (remainingBudget > 200) {
          let includedChars = 0;
          const includedItems = [];
          for (const item of segment.items) {
            const itemChars = (item.summary ?? item.content).length;
            if (includedChars + itemChars <= remainingBudget) {
              includedItems.push(item);
              includedChars += itemChars;
            }
          }
          if (includedItems.length > 0) {
            truncatedSegments.push({
              ...segment,
              items: includedItems
            });
            totalChars += includedChars;
          }
        }
        truncated = true;
        break;
      }
    }
    return {
      truncatedSegments,
      truncated,
      estimatedTokens: Math.ceil(totalChars / this.config.charsPerToken)
    };
  }
};
function createMemoryNormalizer(options) {
  return new MemoryNormalizer(options);
}

// src/memory/worker/types.ts
var import_zod11 = require("zod");
var JobType = {
  REINDEX: "reindex",
  KG_REFRESH: "kg_refresh",
  EMBEDDING_GENERATION: "embedding_generation",
  CONTENT_ANALYSIS: "content_analysis",
  MEMORY_CLEANUP: "memory_cleanup",
  NOTIFICATION: "notification",
  SCHEDULED_TASK: "scheduled_task",
  CUSTOM: "custom"
};
var JobStatus = {
  PENDING: "pending",
  QUEUED: "queued",
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  DELAYED: "delayed",
  PAUSED: "paused"
};
var DEFAULT_QUEUE_CONFIG = {
  name: "default",
  concurrency: 5,
  defaultPriority: 5,
  defaultMaxAttempts: 3,
  retryDelayMs: 1e3,
  retryBackoffMultiplier: 2,
  jobTimeoutMs: 3e5,
  // 5 minutes
  cleanupAfterMs: 864e5,
  // 24 hours
  persistJobs: false
};
var DEFAULT_WORKER_CONFIG = {
  id: "worker-default",
  queues: ["default"],
  concurrency: 5,
  pollIntervalMs: 1e3,
  maxJobsPerCycle: 100,
  gracefulShutdown: true,
  shutdownTimeoutMs: 3e4
};
var WorkerStatus = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  STOPPING: "stopping",
  STOPPED: "stopped"
};
var JobEvent = {
  CREATED: "created",
  STARTED: "started",
  PROGRESS: "progress",
  COMPLETED: "completed",
  FAILED: "failed",
  RETRYING: "retrying",
  CANCELLED: "cancelled"
};
var BaseJobSchema = import_zod11.z.object({
  id: import_zod11.z.string().min(1),
  type: import_zod11.z.enum([
    "reindex",
    "kg_refresh",
    "embedding_generation",
    "content_analysis",
    "memory_cleanup",
    "notification",
    "scheduled_task",
    "custom"
  ]),
  status: import_zod11.z.enum([
    "pending",
    "queued",
    "active",
    "completed",
    "failed",
    "cancelled",
    "delayed",
    "paused"
  ]),
  priority: import_zod11.z.number().min(0).max(100),
  data: import_zod11.z.unknown(),
  result: import_zod11.z.unknown().optional(),
  error: import_zod11.z.string().optional(),
  attempts: import_zod11.z.number().min(0),
  maxAttempts: import_zod11.z.number().min(1),
  createdAt: import_zod11.z.date(),
  updatedAt: import_zod11.z.date(),
  scheduledFor: import_zod11.z.date(),
  startedAt: import_zod11.z.date().optional(),
  completedAt: import_zod11.z.date().optional(),
  progress: import_zod11.z.number().min(0).max(100).optional()
});
var JobQueueConfigSchema = import_zod11.z.object({
  name: import_zod11.z.string().min(1),
  concurrency: import_zod11.z.number().min(1).max(100),
  defaultPriority: import_zod11.z.number().min(0).max(100),
  defaultMaxAttempts: import_zod11.z.number().min(1).max(10),
  retryDelayMs: import_zod11.z.number().min(100).max(36e5),
  retryBackoffMultiplier: import_zod11.z.number().min(1).max(10),
  jobTimeoutMs: import_zod11.z.number().min(1e3).max(36e5),
  cleanupAfterMs: import_zod11.z.number().min(6e4),
  persistJobs: import_zod11.z.boolean()
});
var WorkerConfigSchema = import_zod11.z.object({
  id: import_zod11.z.string().min(1),
  queues: import_zod11.z.array(import_zod11.z.string().min(1)),
  concurrency: import_zod11.z.number().min(1).max(50),
  pollIntervalMs: import_zod11.z.number().min(100).max(6e4),
  maxJobsPerCycle: import_zod11.z.number().min(1).max(1e3),
  gracefulShutdown: import_zod11.z.boolean(),
  shutdownTimeoutMs: import_zod11.z.number().min(1e3).max(3e5)
});

// src/memory/worker/background-worker.ts
var InMemoryJobQueue = class {
  config;
  logger;
  jobs = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Map();
  isPaused = false;
  processedCount = 0;
  totalProcessingTime = 0;
  lastProcessedAt;
  constructor(options) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...options?.config };
    this.logger = options?.logger ?? console;
  }
  async add(type, data, options) {
    const now = /* @__PURE__ */ new Date();
    const job = {
      id: v4_default(),
      type,
      status: "pending",
      priority: options?.priority ?? this.config.defaultPriority,
      data,
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? this.config.defaultMaxAttempts,
      createdAt: now,
      updatedAt: now,
      scheduledFor: options?.scheduledFor ?? now,
      ...options
    };
    this.jobs.set(job.id, job);
    this.emit("created", job);
    this.logger.debug("Job added to queue", {
      jobId: job.id,
      type: job.type,
      priority: job.priority
    });
    return job;
  }
  async get(jobId) {
    return this.jobs.get(jobId) ?? null;
  }
  async update(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    const updated = {
      ...job,
      ...updates,
      id: job.id,
      createdAt: job.createdAt,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.jobs.set(jobId, updated);
    return updated;
  }
  async remove(jobId) {
    return this.jobs.delete(jobId);
  }
  async getNextPending() {
    if (this.isPaused) return null;
    const now = /* @__PURE__ */ new Date();
    const pendingJobs = Array.from(this.jobs.values()).filter(
      (j) => (j.status === "pending" || j.status === "queued") && j.scheduledFor <= now
    ).sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());
    return pendingJobs[0] ?? null;
  }
  async getByStatus(status, limit) {
    const jobs = Array.from(this.jobs.values()).filter((j) => j.status === status);
    return limit ? jobs.slice(0, limit) : jobs;
  }
  async getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      name: this.config.name,
      pending: jobs.filter((j) => j.status === "pending").length,
      active: jobs.filter((j) => j.status === "active").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      delayed: jobs.filter((j) => j.status === "delayed").length,
      paused: jobs.filter((j) => j.status === "paused").length,
      totalProcessed: this.processedCount,
      avgProcessingTime: this.processedCount > 0 ? this.totalProcessingTime / this.processedCount : 0,
      lastProcessedAt: this.lastProcessedAt
    };
  }
  async pause() {
    this.isPaused = true;
    this.logger.info("Queue paused", { name: this.config.name });
  }
  async resume() {
    this.isPaused = false;
    this.logger.info("Queue resumed", { name: this.config.name });
  }
  async cleanup(olderThan) {
    let count = 0;
    for (const [id, job] of this.jobs) {
      if ((job.status === "completed" || job.status === "failed") && job.completedAt && job.completedAt < olderThan) {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(listener);
  }
  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
  }
  emit(event, job) {
    this.listeners.get(event)?.forEach((listener) => listener(event, job));
  }
  recordProcessing(durationMs) {
    this.processedCount++;
    this.totalProcessingTime += durationMs;
    this.lastProcessedAt = /* @__PURE__ */ new Date();
  }
  clear() {
    this.jobs.clear();
    this.processedCount = 0;
    this.totalProcessingTime = 0;
    this.lastProcessedAt = void 0;
  }
};
var BackgroundWorker = class {
  config;
  queues;
  handlers;
  logger;
  status = "stopped";
  startedAt;
  processedJobs = 0;
  failedJobs = 0;
  activeJobs = 0;
  totalProcessingTime = 0;
  lastActivityAt;
  pollInterval;
  shutdownPromise;
  constructor(options) {
    this.config = { ...DEFAULT_WORKER_CONFIG, ...options.config };
    this.queues = options.queues ?? /* @__PURE__ */ new Map();
    this.handlers = /* @__PURE__ */ new Map();
    this.logger = options.logger ?? console;
    if (this.queues.size === 0) {
      for (const queueName of this.config.queues) {
        this.queues.set(
          queueName,
          new InMemoryJobQueue({ config: { name: queueName }, logger: this.logger })
        );
      }
    }
  }
  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  async start() {
    if (this.status === "running") {
      this.logger.warn("Worker already running", { id: this.config.id });
      return;
    }
    this.status = "running";
    this.startedAt = /* @__PURE__ */ new Date();
    this.logger.info("Worker started", {
      id: this.config.id,
      queues: this.config.queues,
      concurrency: this.config.concurrency
    });
    this.pollInterval = setInterval(() => this.poll(), this.config.pollIntervalMs);
    await this.poll();
  }
  async stop() {
    if (this.status === "stopped") return;
    this.status = "stopping";
    this.logger.info("Worker stopping", { id: this.config.id, activeJobs: this.activeJobs });
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = void 0;
    }
    if (this.config.gracefulShutdown && this.activeJobs > 0) {
      this.shutdownPromise = new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.activeJobs === 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          this.logger.warn("Shutdown timeout, forcing stop", {
            id: this.config.id,
            remainingJobs: this.activeJobs
          });
          resolve();
        }, this.config.shutdownTimeoutMs);
      });
      await this.shutdownPromise;
    }
    this.status = "stopped";
    this.logger.info("Worker stopped", { id: this.config.id });
  }
  async pause() {
    if (this.status !== "running") return;
    this.status = "paused";
    for (const queue of this.queues.values()) {
      await queue.pause();
    }
    this.logger.info("Worker paused", { id: this.config.id });
  }
  async resume() {
    if (this.status !== "paused") return;
    this.status = "running";
    for (const queue of this.queues.values()) {
      await queue.resume();
    }
    this.logger.info("Worker resumed", { id: this.config.id });
  }
  // -------------------------------------------------------------------------
  // Handler Management
  // -------------------------------------------------------------------------
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
    this.logger.debug("Handler registered", { type });
  }
  unregisterHandler(type) {
    this.handlers.delete(type);
    this.logger.debug("Handler unregistered", { type });
  }
  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------
  getStatus() {
    return this.status;
  }
  getStats() {
    return {
      id: this.config.id,
      status: this.status,
      startedAt: this.startedAt,
      activeJobs: this.activeJobs,
      processedJobs: this.processedJobs,
      failedJobs: this.failedJobs,
      avgProcessingTime: this.processedJobs > 0 ? this.totalProcessingTime / this.processedJobs : 0,
      lastActivityAt: this.lastActivityAt,
      uptime: this.startedAt ? Date.now() - this.startedAt.getTime() : 0
    };
  }
  // -------------------------------------------------------------------------
  // Processing
  // -------------------------------------------------------------------------
  async processJob(jobId) {
    let job = null;
    let queue = null;
    for (const q of this.queues.values()) {
      const found = await q.get(jobId);
      if (found) {
        job = found;
        queue = q;
        break;
      }
    }
    if (!job || !queue) {
      throw new Error(`Job not found: ${jobId}`);
    }
    await this.executeJob(job, queue);
  }
  async poll() {
    if (this.status !== "running") return;
    const availableSlots = this.config.concurrency - this.activeJobs;
    if (availableSlots <= 0) return;
    let jobsProcessed = 0;
    for (const queue of this.queues.values()) {
      if (jobsProcessed >= this.config.maxJobsPerCycle) break;
      if (this.activeJobs >= this.config.concurrency) break;
      const job = await queue.getNextPending();
      if (job) {
        this.executeJob(job, queue).catch((error) => {
          this.logger.error("Job execution error", {
            jobId: job.id,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        });
        jobsProcessed++;
      }
    }
  }
  async executeJob(job, queue) {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      this.logger.warn("No handler for job type", { type: job.type, jobId: job.id });
      await queue.update(job.id, {
        status: "failed",
        error: `No handler registered for job type: ${job.type}`
      });
      return;
    }
    this.activeJobs++;
    const startTime = Date.now();
    try {
      await queue.update(job.id, {
        status: "active",
        startedAt: /* @__PURE__ */ new Date(),
        attempts: job.attempts + 1
      });
      this.logger.debug("Executing job", {
        jobId: job.id,
        type: job.type,
        attempt: job.attempts + 1
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Job timeout")), DEFAULT_QUEUE_CONFIG.jobTimeoutMs);
      });
      const result = await Promise.race([handler(job), timeoutPromise]);
      const duration = Date.now() - startTime;
      await queue.update(job.id, {
        status: "completed",
        result,
        completedAt: /* @__PURE__ */ new Date()
      });
      this.processedJobs++;
      this.totalProcessingTime += duration;
      this.lastActivityAt = /* @__PURE__ */ new Date();
      if (queue instanceof InMemoryJobQueue) {
        queue.recordProcessing(duration);
      }
      this.logger.info("Job completed", {
        jobId: job.id,
        type: job.type,
        durationMs: duration
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      void (Date.now() - startTime);
      this.logger.error("Job failed", {
        jobId: job.id,
        type: job.type,
        error: errorMessage,
        attempt: job.attempts + 1
      });
      if (job.attempts + 1 < job.maxAttempts) {
        const retryDelayMs = DEFAULT_QUEUE_CONFIG.retryDelayMs * Math.pow(DEFAULT_QUEUE_CONFIG.retryBackoffMultiplier, job.attempts);
        await queue.update(job.id, {
          status: "delayed",
          error: errorMessage,
          scheduledFor: new Date(Date.now() + retryDelayMs)
        });
        this.logger.debug("Job scheduled for retry", {
          jobId: job.id,
          retryIn: retryDelayMs,
          nextAttempt: job.attempts + 2
        });
      } else {
        await queue.update(job.id, {
          status: "failed",
          error: errorMessage,
          completedAt: /* @__PURE__ */ new Date()
        });
        this.failedJobs++;
      }
      this.lastActivityAt = /* @__PURE__ */ new Date();
    } finally {
      this.activeJobs--;
    }
  }
  // -------------------------------------------------------------------------
  // Queue Access
  // -------------------------------------------------------------------------
  getQueue(name) {
    return this.queues.get(name);
  }
  async addJob(type, data, options) {
    const queueName = options?.queue ?? this.config.queues[0];
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }
    return queue.add(type, data, options);
  }
};
function createBackgroundWorker(options) {
  return new BackgroundWorker(options ?? {});
}
function createJobQueue(options) {
  return new InMemoryJobQueue(options);
}

// src/memory/index.ts
function createMemorySystem(config = {}) {
  const logger = config.logger ?? console;
  const embeddingProvider = config.embeddingProvider ?? new MockEmbeddingProvider();
  const vectorStore = new VectorStore({
    embeddingProvider,
    logger,
    ...config.vectorStore
  });
  const knowledgeGraph = new KnowledgeGraphManager({
    logger,
    ...config.knowledgeGraph
  });
  const sessionContext = new CrossSessionContext({
    logger,
    ...config.sessionContext
  });
  const journeyTimeline = new JourneyTimelineManager({
    logger,
    ...config.journeyTimeline
  });
  const memoryRetriever = new MemoryRetriever({
    vectorStore,
    knowledgeGraph,
    sessionContext,
    logger
  });
  return {
    vectorStore,
    knowledgeGraph,
    sessionContext,
    memoryRetriever,
    journeyTimeline
  };
}
var MEMORY_CAPABILITIES = {
  VECTOR_STORE: "memory:vector_store",
  KNOWLEDGE_GRAPH: "memory:knowledge_graph",
  SESSION_CONTEXT: "memory:session_context",
  MEMORY_RETRIEVAL: "memory:retrieval",
  JOURNEY_TIMELINE: "memory:journey_timeline"
};

// src/proactive-intervention/types.ts
var import_zod12 = require("zod");
var LearningPlanStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  ABANDONED: "abandoned"
};
var PlanStatus2 = LearningPlanStatus;
var MilestoneStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  BEHIND: "behind"
};
var ActivityType = {
  READ: "read",
  WATCH: "watch",
  PRACTICE: "practice",
  QUIZ: "quiz",
  REVIEW: "review",
  PROJECT: "project",
  REFLECTION: "reflection",
  SOCRATIC: "socratic",
  SPACED_REVIEW: "spaced_review"
};
var AdjustmentTrigger = {
  USER_REQUEST: "user_request",
  PERFORMANCE_BASED: "performance_based",
  SCHEDULE_CONFLICT: "schedule_conflict",
  MENTOR_SUGGESTION: "mentor_suggestion",
  AUTOMATIC: "automatic"
};
var ActivityStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  DEFERRED: "deferred"
};
var CheckInStatus = {
  SCHEDULED: "scheduled",
  PENDING: "pending",
  SENT: "sent",
  RESPONDED: "responded",
  EXPIRED: "expired",
  CANCELLED: "cancelled"
};
var CheckInType = {
  DAILY_REMINDER: "daily_reminder",
  PROGRESS_CHECK: "progress_check",
  STRUGGLE_DETECTION: "struggle_detection",
  MILESTONE_CELEBRATION: "milestone_celebration",
  INACTIVITY_REENGAGEMENT: "inactivity_reengagement",
  GOAL_REVIEW: "goal_review",
  WEEKLY_SUMMARY: "weekly_summary",
  STREAK_RISK: "streak_risk",
  ENCOURAGEMENT: "encouragement"
};
var NotificationChannel = {
  IN_APP: "in_app",
  PUSH: "push",
  EMAIL: "email",
  SMS: "sms"
};
var TriggerType = {
  DAYS_INACTIVE: "days_inactive",
  STREAK_AT_RISK: "streak_at_risk",
  MASTERY_PLATEAU: "mastery_plateau",
  FRUSTRATION_DETECTED: "frustration_detected",
  GOAL_BEHIND_SCHEDULE: "goal_behind_schedule",
  ASSESSMENT_FAILED: "assessment_failed",
  TIME_SINCE_LAST_SESSION: "time_since_last_session",
  MILESTONE_APPROACHING: "milestone_approaching",
  WEEKLY_REVIEW_DUE: "weekly_review_due"
};
var QuestionType = {
  TEXT: "text",
  SINGLE_CHOICE: "single_choice",
  MULTIPLE_CHOICE: "multiple_choice",
  SCALE: "scale",
  YES_NO: "yes_no",
  EMOJI: "emoji"
};
var ActionType = {
  START_ACTIVITY: "start_activity",
  REVIEW_CONTENT: "review_content",
  TAKE_BREAK: "take_break",
  ADJUST_GOAL: "adjust_goal",
  CONTACT_MENTOR: "contact_mentor",
  VIEW_PROGRESS: "view_progress",
  COMPLETE_REVIEW: "complete_review"
};
var BehaviorEventType = {
  PAGE_VIEW: "page_view",
  CONTENT_INTERACTION: "content_interaction",
  ASSESSMENT_ATTEMPT: "assessment_attempt",
  HINT_REQUEST: "hint_request",
  QUESTION_ASKED: "question_asked",
  FRUSTRATION_SIGNAL: "frustration_signal",
  SUCCESS_SIGNAL: "success_signal",
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  GOAL_SET: "goal_set",
  GOAL_ABANDONED: "goal_abandoned",
  CONTENT_SKIPPED: "content_skipped",
  HELP_REQUESTED: "help_requested",
  BREAK_TAKEN: "break_taken"
};
var EmotionalSignalType = {
  FRUSTRATION: "frustration",
  CONFUSION: "confusion",
  EXCITEMENT: "excitement",
  BOREDOM: "boredom",
  ENGAGEMENT: "engagement",
  FATIGUE: "fatigue",
  CONFIDENCE: "confidence",
  ANXIETY: "anxiety"
};
var PatternType = {
  LEARNING_HABIT: "learning_habit",
  STRUGGLE_PATTERN: "struggle_pattern",
  SUCCESS_PATTERN: "success_pattern",
  TIME_PREFERENCE: "time_preference",
  CONTENT_PREFERENCE: "content_preference",
  ENGAGEMENT_CYCLE: "engagement_cycle",
  FATIGUE_PATTERN: "fatigue_pattern",
  HELP_SEEKING: "help_seeking"
};
var AnomalyType = {
  SUDDEN_DISENGAGEMENT: "sudden_disengagement",
  UNUSUAL_ACTIVITY_TIME: "unusual_activity_time",
  PERFORMANCE_DROP: "performance_drop",
  REPEATED_FAILURES: "repeated_failures",
  CONTENT_AVOIDANCE: "content_avoidance",
  SESSION_ABNORMALITY: "session_abnormality"
};
var InterventionType = {
  ENCOURAGEMENT: "encouragement",
  DIFFICULTY_ADJUSTMENT: "difficulty_adjustment",
  CONTENT_RECOMMENDATION: "content_recommendation",
  BREAK_SUGGESTION: "break_suggestion",
  GOAL_REVISION: "goal_revision",
  PEER_CONNECTION: "peer_connection",
  MENTOR_ESCALATION: "mentor_escalation",
  PROGRESS_CELEBRATION: "progress_celebration",
  STREAK_REMINDER: "streak_reminder"
};
var LearningPlanInputSchema = import_zod12.z.object({
  userId: import_zod12.z.string().min(1),
  goalTitle: import_zod12.z.string().min(1).max(200),
  goalDescription: import_zod12.z.string().min(1).max(1e3),
  targetDate: import_zod12.z.date().optional(),
  courseId: import_zod12.z.string().optional(),
  chapterId: import_zod12.z.string().optional(),
  currentLevel: import_zod12.z.enum(["beginner", "intermediate", "advanced"]),
  targetLevel: import_zod12.z.enum(["beginner", "intermediate", "advanced", "mastery"]),
  preferredDailyMinutes: import_zod12.z.number().min(5).max(480),
  preferredDaysPerWeek: import_zod12.z.number().min(1).max(7),
  constraints: import_zod12.z.array(
    import_zod12.z.object({
      type: import_zod12.z.enum(["time", "content", "pace", "style"]),
      description: import_zod12.z.string(),
      value: import_zod12.z.unknown()
    })
  ).optional()
});
var ProgressUpdateSchema = import_zod12.z.object({
  planId: import_zod12.z.string().min(1),
  date: import_zod12.z.date(),
  completedActivities: import_zod12.z.array(import_zod12.z.string()),
  actualMinutes: import_zod12.z.number().min(0),
  notes: import_zod12.z.string().max(1e3).optional(),
  emotionalState: import_zod12.z.string().optional(),
  difficultyFeedback: import_zod12.z.enum(["too_easy", "just_right", "too_hard"]).optional()
});
var CheckInResponseSchema = import_zod12.z.object({
  checkInId: import_zod12.z.string().min(1),
  respondedAt: import_zod12.z.date(),
  answers: import_zod12.z.array(
    import_zod12.z.object({
      questionId: import_zod12.z.string().min(1),
      answer: import_zod12.z.union([import_zod12.z.string(), import_zod12.z.array(import_zod12.z.string()), import_zod12.z.number(), import_zod12.z.boolean()])
    })
  ),
  selectedActions: import_zod12.z.array(import_zod12.z.string()),
  feedback: import_zod12.z.string().max(1e3).optional(),
  emotionalState: import_zod12.z.string().optional()
});
var BehaviorEventSchema = import_zod12.z.object({
  userId: import_zod12.z.string().min(1),
  sessionId: import_zod12.z.string().min(1),
  timestamp: import_zod12.z.date(),
  type: import_zod12.z.string(),
  data: import_zod12.z.record(import_zod12.z.unknown()),
  pageContext: import_zod12.z.object({
    url: import_zod12.z.string(),
    courseId: import_zod12.z.string().optional(),
    chapterId: import_zod12.z.string().optional(),
    sectionId: import_zod12.z.string().optional(),
    contentType: import_zod12.z.string().optional(),
    timeOnPage: import_zod12.z.number().optional(),
    scrollDepth: import_zod12.z.number().optional()
  }),
  emotionalSignals: import_zod12.z.array(
    import_zod12.z.object({
      type: import_zod12.z.string(),
      intensity: import_zod12.z.number().min(0).max(1),
      source: import_zod12.z.enum(["text", "behavior", "timing", "pattern"]),
      timestamp: import_zod12.z.date()
    })
  ).optional()
});

// src/proactive-intervention/multi-session-plan-tracker.ts
var InMemoryLearningPlanStore = class {
  plans = /* @__PURE__ */ new Map();
  async get(id) {
    return this.plans.get(id) ?? null;
  }
  async getByUser(userId) {
    return Array.from(this.plans.values()).filter((plan) => plan.userId === userId);
  }
  async getActive(userId) {
    return Array.from(this.plans.values()).find(
      (plan) => plan.userId === userId && plan.status === PlanStatus2.ACTIVE
    ) ?? null;
  }
  async create(plan) {
    const now = /* @__PURE__ */ new Date();
    const newPlan = {
      ...plan,
      id: v4_default(),
      createdAt: now,
      updatedAt: now
    };
    this.plans.set(newPlan.id, newPlan);
    return newPlan;
  }
  async update(id, updates) {
    const plan = this.plans.get(id);
    if (!plan) {
      throw new Error(`Plan not found: ${id}`);
    }
    const updatedPlan = {
      ...plan,
      ...updates,
      id: plan.id,
      createdAt: plan.createdAt,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.plans.set(id, updatedPlan);
    return updatedPlan;
  }
  async delete(id) {
    return this.plans.delete(id);
  }
  async getDailyTarget(planId, date) {
    const plan = this.plans.get(planId);
    if (!plan) return null;
    const dateStr = date.toISOString().split("T")[0];
    return plan.dailyTargets.find(
      (target) => target.date.toISOString().split("T")[0] === dateStr
    ) ?? null;
  }
  async updateDailyTarget(planId, date, updates) {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const dateStr = date.toISOString().split("T")[0];
    const targetIndex = plan.dailyTargets.findIndex(
      (target) => target.date.toISOString().split("T")[0] === dateStr
    );
    if (targetIndex === -1) {
      throw new Error(`Daily target not found for date: ${dateStr}`);
    }
    const updatedTarget = {
      ...plan.dailyTargets[targetIndex],
      ...updates
    };
    plan.dailyTargets[targetIndex] = updatedTarget;
    plan.updatedAt = /* @__PURE__ */ new Date();
    this.plans.set(planId, plan);
    return updatedTarget;
  }
  async getWeeklyBreakdown(planId, weekNumber) {
    const plan = this.plans.get(planId);
    if (!plan) return null;
    const milestone = plan.weeklyMilestones.find((m) => m.weekNumber === weekNumber);
    if (!milestone) return null;
    const weeklyTargets = plan.dailyTargets.filter((t) => t.weekNumber === weekNumber);
    const startDate = weeklyTargets[0]?.date ?? plan.startDate;
    const endDate = weeklyTargets[weeklyTargets.length - 1]?.date ?? plan.startDate;
    const totalEstimated = weeklyTargets.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const totalActual = weeklyTargets.reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
    const completedCount = weeklyTargets.filter((t) => t.completed).length;
    const progress = weeklyTargets.length > 0 ? completedCount / weeklyTargets.length * 100 : 0;
    return {
      planId,
      weekNumber,
      startDate,
      endDate,
      milestone,
      dailyTargets: weeklyTargets,
      totalEstimatedMinutes: totalEstimated,
      totalActualMinutes: totalActual,
      progress,
      status: milestone.status
    };
  }
};
var defaultLogger = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var MultiSessionPlanTracker = class {
  store;
  logger;
  defaultDailyMinutes;
  streakGracePeriodDays;
  constructor(config = {}) {
    this.store = config.store ?? new InMemoryLearningPlanStore();
    this.logger = config.logger ?? defaultLogger;
    this.defaultDailyMinutes = config.defaultDailyMinutes ?? 30;
    this.streakGracePeriodDays = config.streakGracePeriodDays ?? 1;
  }
  /**
   * Create a new learning plan
   */
  async createLearningPlan(input) {
    const validated = LearningPlanInputSchema.parse(input);
    this.logger.info("Creating learning plan", { userId: validated.userId, goal: validated.goalTitle });
    const startDate = /* @__PURE__ */ new Date();
    const targetDate = validated.targetDate ?? this.calculateDefaultTargetDate(validated);
    const durationWeeks = Math.ceil(
      (targetDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1e3)
    );
    const weeklyMilestones = this.generateWeeklyMilestones(validated, durationWeeks);
    const dailyTargets = this.generateDailyTargets(
      validated,
      startDate,
      durationWeeks,
      weeklyMilestones
    );
    const plan = await this.store.create({
      userId: validated.userId,
      goalId: v4_default(),
      title: validated.goalTitle,
      description: validated.goalDescription,
      startDate,
      targetDate,
      durationWeeks,
      weeklyMilestones,
      dailyTargets,
      currentWeek: 1,
      currentDay: 1,
      overallProgress: 0,
      difficultyAdjustments: [],
      paceAdjustments: [],
      status: PlanStatus2.ACTIVE
    });
    this.logger.info("Learning plan created", { planId: plan.id, weeks: durationWeeks });
    return plan;
  }
  /**
   * Generate weekly breakdown for a plan
   */
  async generateWeeklyBreakdown(plan) {
    const breakdown = await this.store.getWeeklyBreakdown(plan.id, plan.currentWeek);
    if (!breakdown) {
      throw new Error(`Weekly breakdown not found for week ${plan.currentWeek}`);
    }
    return breakdown;
  }
  /**
   * Get daily practice schedule for a user
   */
  async getDailyPractice(userId, date) {
    const plan = await this.store.getActive(userId);
    if (!plan) {
      return this.createEmptyDailyPractice(userId, date);
    }
    const dailyTarget = await this.store.getDailyTarget(plan.id, date);
    if (!dailyTarget) {
      return this.createEmptyDailyPractice(userId, date, plan.id);
    }
    const activities = this.convertToActivities(dailyTarget.activities);
    const reviewItems = await this.getReviewItems(userId);
    const streakInfo = await this.calculateStreakInfo(userId);
    return {
      date,
      userId,
      planId: plan.id,
      activities,
      estimatedMinutes: dailyTarget.estimatedMinutes,
      reviewItems,
      dailyGoals: this.extractDailyGoals(dailyTarget),
      motivationalMessage: this.generateMotivationalMessage(streakInfo, plan.overallProgress),
      streakInfo
    };
  }
  /**
   * Track progress for a plan
   */
  async trackProgress(planId, progress) {
    const validated = ProgressUpdateSchema.parse(progress);
    this.logger.info("Tracking progress", { planId, completedActivities: validated.completedActivities.length });
    const plan = await this.store.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const dailyTarget = await this.store.getDailyTarget(planId, validated.date);
    if (!dailyTarget) {
      throw new Error(`Daily target not found for date: ${validated.date.toISOString()}`);
    }
    const updatedActivities = dailyTarget.activities.map((activity) => ({
      ...activity,
      completed: validated.completedActivities.includes(activity.id),
      actualMinutes: validated.completedActivities.includes(activity.id) ? activity.estimatedMinutes : activity.actualMinutes
    }));
    const allCompleted = updatedActivities.every((a) => a.completed);
    await this.store.updateDailyTarget(planId, validated.date, {
      activities: updatedActivities,
      actualMinutes: validated.actualMinutes,
      completed: allCompleted,
      completedAt: allCompleted ? /* @__PURE__ */ new Date() : void 0,
      notes: validated.notes
    });
    await this.updateOverallProgress(planId);
  }
  /**
   * Get progress report for a plan
   */
  async getProgressReport(planId) {
    const plan = await this.store.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const completedTargets = plan.dailyTargets.filter((t) => t.completed);
    const totalPlannedMinutes = plan.dailyTargets.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const totalActualMinutes = plan.dailyTargets.reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
    const activitiesTotal = plan.dailyTargets.reduce((sum, t) => sum + t.activities.length, 0);
    const activitiesCompleted = plan.dailyTargets.reduce(
      (sum, t) => sum + t.activities.filter((a) => a.completed).length,
      0
    );
    const milestonesCompleted = plan.weeklyMilestones.filter(
      (m) => m.status === MilestoneStatus.COMPLETED
    ).length;
    const dayStats = this.analyzeDayPatterns(plan.dailyTargets);
    const daysCompleted = completedTargets.length;
    const daysRemaining = plan.dailyTargets.filter((t) => !t.completed).length;
    const weeksCompleted = plan.weeklyMilestones.filter(
      (m) => m.status === MilestoneStatus.COMPLETED
    ).length;
    const currentWeekTargets = plan.dailyTargets.filter(
      (t) => t.weekNumber === plan.currentWeek
    );
    const currentWeekCompleted = currentWeekTargets.filter((t) => t.completed).length;
    const currentWeekProgress = currentWeekTargets.length > 0 ? currentWeekCompleted / currentWeekTargets.length * 100 : 0;
    const recommendations = this.generateRecommendations(plan, dayStats);
    return {
      planId,
      generatedAt: /* @__PURE__ */ new Date(),
      overallProgress: plan.overallProgress,
      daysCompleted,
      daysRemaining,
      onTrack: plan.overallProgress >= this.expectedProgress(plan),
      weeksCompleted,
      currentWeekProgress,
      totalPlannedMinutes,
      totalActualMinutes,
      averageDailyMinutes: daysCompleted > 0 ? totalActualMinutes / daysCompleted : 0,
      activitiesCompleted,
      activitiesTotal,
      milestonesCompleted,
      milestonesTotal: plan.weeklyMilestones.length,
      strongDays: dayStats.strongDays,
      weakDays: dayStats.weakDays,
      bestTimeOfDay: void 0,
      recommendations
    };
  }
  /**
   * Adjust plan based on feedback
   */
  async adjustPlan(planId, feedback) {
    const plan = await this.store.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    this.logger.info("Adjusting plan", { planId, feedbackType: feedback.type });
    let updatedPlan = plan;
    switch (feedback.type) {
      case "pace":
        updatedPlan = this.adjustPace(plan, feedback);
        break;
      case "difficulty":
        updatedPlan = this.adjustDifficulty(plan, feedback);
        break;
      case "content":
        updatedPlan = this.adjustContent(plan, feedback);
        break;
      case "schedule":
        updatedPlan = this.adjustSchedule(plan, feedback);
        break;
    }
    return this.store.update(planId, updatedPlan);
  }
  /**
   * Get a plan by ID
   */
  async getPlan(planId) {
    return this.store.get(planId);
  }
  /**
   * Get all plans for a user
   */
  async getUserPlans(userId) {
    return this.store.getByUser(userId);
  }
  /**
   * Get active plan for a user
   */
  async getActivePlan(userId) {
    return this.store.getActive(userId);
  }
  /**
   * Pause a plan
   */
  async pausePlan(planId) {
    const plan = await this.store.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    return this.store.update(planId, { status: PlanStatus2.PAUSED });
  }
  /**
   * Resume a paused plan
   */
  async resumePlan(planId) {
    const plan = await this.store.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    return this.store.update(planId, { status: PlanStatus2.ACTIVE });
  }
  /**
   * Complete a plan
   */
  async completePlan(planId) {
    const plan = await this.store.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    return this.store.update(planId, {
      status: PlanStatus2.COMPLETED,
      overallProgress: 100
    });
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  calculateDefaultTargetDate(input) {
    const weeksNeeded = this.estimateWeeksNeeded(input);
    const targetDate = /* @__PURE__ */ new Date();
    targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);
    return targetDate;
  }
  estimateWeeksNeeded(input) {
    const levelDiff = this.getLevelValue(input.targetLevel) - this.getLevelValue(input.currentLevel);
    const baseWeeks = levelDiff * 4;
    const adjustedWeeks = Math.ceil(
      baseWeeks * (this.defaultDailyMinutes / input.preferredDailyMinutes)
    );
    return Math.max(1, adjustedWeeks);
  }
  getLevelValue(level) {
    const levels = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      mastery: 4
    };
    return levels[level] ?? 1;
  }
  generateWeeklyMilestones(input, durationWeeks) {
    const milestones = [];
    for (let week = 1; week <= durationWeeks; week++) {
      milestones.push({
        weekNumber: week,
        title: `Week ${week}: ${this.getWeekTitle(week, durationWeeks)}`,
        description: this.getWeekDescription(week, durationWeeks, input),
        objectives: this.getWeekObjectives(week, durationWeeks),
        estimatedHours: input.preferredDailyMinutes * input.preferredDaysPerWeek / 60,
        status: week === 1 ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.PENDING,
        feedback: void 0
      });
    }
    return milestones;
  }
  getWeekTitle(week, totalWeeks) {
    const phase = week / totalWeeks;
    if (phase <= 0.25) return "Foundation Building";
    if (phase <= 0.5) return "Core Concepts";
    if (phase <= 0.75) return "Deepening Understanding";
    return "Mastery and Application";
  }
  getWeekDescription(week, totalWeeks, input) {
    const phase = week / totalWeeks;
    if (phase <= 0.25) {
      return `Build foundational understanding of ${input.goalTitle}`;
    }
    if (phase <= 0.5) {
      return `Explore core concepts and principles`;
    }
    if (phase <= 0.75) {
      return `Deepen understanding through practice and application`;
    }
    return `Master advanced concepts and demonstrate proficiency`;
  }
  getWeekObjectives(week, totalWeeks) {
    const phase = week / totalWeeks;
    if (phase <= 0.25) {
      return [
        "Complete introductory materials",
        "Build vocabulary and basic concepts",
        "Establish learning routine"
      ];
    }
    if (phase <= 0.5) {
      return [
        "Master core principles",
        "Complete practice exercises",
        "Connect concepts together"
      ];
    }
    if (phase <= 0.75) {
      return [
        "Apply concepts to problems",
        "Identify areas for improvement",
        "Build confidence through practice"
      ];
    }
    return [
      "Demonstrate mastery through projects",
      "Teach concepts to solidify understanding",
      "Prepare for assessment"
    ];
  }
  generateDailyTargets(input, startDate, durationWeeks, milestones) {
    const targets = [];
    const currentDate = new Date(startDate);
    for (let week = 1; week <= durationWeeks; week++) {
      const milestone = milestones[week - 1];
      for (let day = 0; day < 7; day++) {
        const dayOfWeek = currentDate.getDay();
        const isActiveDay = this.isActiveDay(dayOfWeek, input.preferredDaysPerWeek);
        if (isActiveDay) {
          targets.push({
            date: new Date(currentDate),
            weekNumber: week,
            dayOfWeek,
            activities: this.generateDailyActivities(week, day, input, milestone),
            estimatedMinutes: input.preferredDailyMinutes,
            completed: false
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    return targets;
  }
  isActiveDay(dayOfWeek, preferredDaysPerWeek) {
    if (preferredDaysPerWeek >= 7) return true;
    if (preferredDaysPerWeek >= 5) return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (preferredDaysPerWeek >= 3) return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
    return dayOfWeek === 1 || dayOfWeek === 4;
  }
  generateDailyActivities(_week, day, input, milestone) {
    const activities = [];
    const minutesPerActivity = Math.floor(input.preferredDailyMinutes / 3);
    activities.push({
      id: v4_default(),
      type: ActivityType.READ,
      title: `Learn: ${milestone.objectives[day % milestone.objectives.length]}`,
      description: "Study the core material for today",
      estimatedMinutes: minutesPerActivity,
      completed: false,
      order: 1
    });
    activities.push({
      id: v4_default(),
      type: ActivityType.PRACTICE,
      title: "Practice exercises",
      description: "Apply what you learned through exercises",
      estimatedMinutes: minutesPerActivity,
      completed: false,
      order: 2
    });
    activities.push({
      id: v4_default(),
      type: ActivityType.REVIEW,
      title: "Review and reflect",
      description: "Consolidate learning with spaced review",
      estimatedMinutes: input.preferredDailyMinutes - 2 * minutesPerActivity,
      completed: false,
      order: 3
    });
    return activities;
  }
  convertToActivities(planned) {
    return planned.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      estimatedMinutes: activity.estimatedMinutes,
      priority: activity.order === 1 ? "high" : activity.order === 2 ? "medium" : "low",
      status: activity.completed ? ActivityStatus.COMPLETED : ActivityStatus.PENDING,
      completedAt: activity.completed ? /* @__PURE__ */ new Date() : void 0,
      resource: activity.resources?.[0]
    }));
  }
  async getReviewItems(_userId) {
    return [];
  }
  async calculateStreakInfo(userId) {
    const plans = await this.store.getByUser(userId);
    if (plans.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: /* @__PURE__ */ new Date(),
        streakAtRisk: false,
        daysUntilStreakBreaks: 0
      };
    }
    const allTargets = plans.flatMap((p) => p.dailyTargets).filter((t) => t.completed);
    allTargets.sort((a, b) => b.date.getTime() - a.date.getTime());
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = 0;
    let longestStreak = 0;
    let streakCount = 0;
    let lastDate = null;
    for (const target of allTargets) {
      const targetDate = new Date(target.date);
      targetDate.setHours(0, 0, 0, 0);
      if (lastDate === null) {
        streakCount = 1;
        lastDate = targetDate;
      } else {
        const dayDiff = Math.floor(
          (lastDate.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1e3)
        );
        if (dayDiff <= this.streakGracePeriodDays + 1) {
          streakCount++;
        } else {
          longestStreak = Math.max(longestStreak, streakCount);
          streakCount = 1;
        }
        lastDate = targetDate;
      }
    }
    longestStreak = Math.max(longestStreak, streakCount);
    if (allTargets.length > 0) {
      const lastActivity = new Date(allTargets[0].date);
      lastActivity.setHours(0, 0, 0, 0);
      const daysSinceActivity2 = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1e3)
      );
      if (daysSinceActivity2 <= this.streakGracePeriodDays) {
        currentStreak = streakCount;
      }
    }
    const lastActivityDate = allTargets[0]?.date ?? /* @__PURE__ */ new Date();
    const daysSinceActivity = Math.floor(
      (today.getTime() - new Date(lastActivityDate).getTime()) / (24 * 60 * 60 * 1e3)
    );
    return {
      currentStreak,
      longestStreak,
      lastActivityDate,
      streakAtRisk: daysSinceActivity >= this.streakGracePeriodDays && currentStreak > 0,
      daysUntilStreakBreaks: Math.max(0, this.streakGracePeriodDays + 1 - daysSinceActivity)
    };
  }
  extractDailyGoals(target) {
    return target.activities.map((a) => a.title);
  }
  generateMotivationalMessage(streak, progress) {
    if (streak.streakAtRisk) {
      return `Your ${streak.currentStreak}-day streak is at risk! Complete today's practice to keep it going.`;
    }
    if (streak.currentStreak >= 7) {
      return `Amazing! You're on a ${streak.currentStreak}-day streak! Keep the momentum going!`;
    }
    if (progress >= 75) {
      return `You're ${progress.toFixed(0)}% through your plan. The finish line is in sight!`;
    }
    if (progress >= 50) {
      return `Halfway there! You've made great progress. Keep pushing forward!`;
    }
    if (streak.currentStreak > 0) {
      return `${streak.currentStreak} days strong! Every day of practice builds your skills.`;
    }
    return `Start your learning journey today. Small steps lead to big achievements!`;
  }
  createEmptyDailyPractice(userId, date, planId) {
    return {
      date,
      userId,
      planId: planId ?? "",
      activities: [],
      estimatedMinutes: 0,
      reviewItems: [],
      dailyGoals: [],
      motivationalMessage: "No activities scheduled for today. Take a break or explore new topics!",
      streakInfo: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: date,
        streakAtRisk: false,
        daysUntilStreakBreaks: 0
      }
    };
  }
  async updateOverallProgress(planId) {
    const plan = await this.store.get(planId);
    if (!plan) return;
    const completedTargets = plan.dailyTargets.filter((t) => t.completed).length;
    const totalTargets = plan.dailyTargets.length;
    const progress = totalTargets > 0 ? completedTargets / totalTargets * 100 : 0;
    const lastCompletedTarget = plan.dailyTargets.filter((t) => t.completed).sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    const currentWeek = lastCompletedTarget?.weekNumber ?? plan.currentWeek;
    const updatedMilestones = plan.weeklyMilestones.map((milestone) => {
      const weekTargets = plan.dailyTargets.filter((t) => t.weekNumber === milestone.weekNumber);
      const weekCompleted = weekTargets.filter((t) => t.completed).length;
      const weekTotal = weekTargets.length;
      let status = milestone.status;
      if (weekTotal > 0 && weekCompleted === weekTotal) {
        status = MilestoneStatus.COMPLETED;
      } else if (weekCompleted > 0) {
        status = MilestoneStatus.IN_PROGRESS;
      } else if (milestone.weekNumber < currentWeek) {
        status = MilestoneStatus.BEHIND;
      }
      return { ...milestone, status };
    });
    await this.store.update(planId, {
      overallProgress: progress,
      currentWeek,
      weeklyMilestones: updatedMilestones
    });
  }
  expectedProgress(plan) {
    const now = /* @__PURE__ */ new Date();
    const elapsed = now.getTime() - plan.startDate.getTime();
    const total = plan.targetDate.getTime() - plan.startDate.getTime();
    return elapsed / total * 100;
  }
  analyzeDayPatterns(targets) {
    const dayStats = {};
    for (const target of targets) {
      if (!dayStats[target.dayOfWeek]) {
        dayStats[target.dayOfWeek] = { completed: 0, total: 0 };
      }
      dayStats[target.dayOfWeek].total++;
      if (target.completed) {
        dayStats[target.dayOfWeek].completed++;
      }
    }
    const strongDays = [];
    const weakDays = [];
    for (const [day, stats] of Object.entries(dayStats)) {
      const rate = stats.total > 0 ? stats.completed / stats.total : 0;
      if (rate >= 0.8) {
        strongDays.push(parseInt(day));
      } else if (rate <= 0.3) {
        weakDays.push(parseInt(day));
      }
    }
    return { strongDays, weakDays };
  }
  generateRecommendations(plan, dayStats) {
    const recommendations = [];
    const expectedProg = this.expectedProgress(plan);
    if (plan.overallProgress < expectedProg - 10) {
      recommendations.push({
        type: "pace",
        priority: "high",
        message: "You are behind schedule",
        suggestedAction: "Consider increasing daily practice time or extending your target date"
      });
    }
    if (dayStats.weakDays.length > 0) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const weakDayNames = dayStats.weakDays.map((d) => dayNames[d]).join(", ");
      recommendations.push({
        type: "schedule",
        priority: "medium",
        message: `Lower completion rate on ${weakDayNames}`,
        suggestedAction: "Consider rescheduling activities to your stronger days"
      });
    }
    if (plan.difficultyAdjustments.length === 0 && plan.overallProgress > 25) {
      recommendations.push({
        type: "content",
        priority: "low",
        message: "No difficulty adjustments made yet",
        suggestedAction: "Provide feedback on difficulty to optimize your learning experience"
      });
    }
    return recommendations;
  }
  adjustPace(plan, feedback) {
    const currentPace = plan.dailyTargets.reduce((sum, t) => sum + t.estimatedMinutes, 0) / plan.durationWeeks;
    let newPace = currentPace;
    if (feedback.feedback === "increase") {
      newPace = currentPace * 1.2;
    } else if (feedback.feedback === "decrease") {
      newPace = currentPace * 0.8;
    }
    const adjustment = {
      timestamp: /* @__PURE__ */ new Date(),
      previousPace: currentPace,
      newPace,
      reason: feedback.reason ?? "User requested",
      triggeredBy: AdjustmentTrigger.USER_REQUEST
    };
    return {
      ...plan,
      paceAdjustments: [...plan.paceAdjustments, adjustment]
    };
  }
  adjustDifficulty(plan, feedback) {
    const currentDifficulty = "medium";
    let newDifficulty = currentDifficulty;
    if (feedback.feedback === "increase") {
      newDifficulty = "hard";
    } else if (feedback.feedback === "decrease") {
      newDifficulty = "easy";
    }
    const adjustment = {
      timestamp: /* @__PURE__ */ new Date(),
      previousDifficulty: currentDifficulty,
      newDifficulty,
      reason: feedback.reason ?? "User requested",
      triggeredBy: AdjustmentTrigger.USER_REQUEST
    };
    return {
      ...plan,
      difficultyAdjustments: [...plan.difficultyAdjustments, adjustment]
    };
  }
  adjustContent(plan, _feedback) {
    this.logger.info("Content adjustment requested", { planId: plan.id });
    return plan;
  }
  adjustSchedule(plan, _feedback) {
    this.logger.info("Schedule adjustment requested", { planId: plan.id });
    return plan;
  }
};
function createMultiSessionPlanTracker(config) {
  return new MultiSessionPlanTracker(config);
}

// src/proactive-intervention/check-in-scheduler.ts
var InMemoryCheckInStore = class {
  checkIns = /* @__PURE__ */ new Map();
  responses = /* @__PURE__ */ new Map();
  async get(id) {
    return this.checkIns.get(id) ?? null;
  }
  async getByUser(userId, status) {
    return Array.from(this.checkIns.values()).filter(
      (checkIn) => checkIn.userId === userId && (status === void 0 || checkIn.status === status)
    );
  }
  async getScheduled(userId, from, to) {
    return Array.from(this.checkIns.values()).filter(
      (checkIn) => checkIn.userId === userId && checkIn.status === CheckInStatus.SCHEDULED && checkIn.scheduledTime >= from && checkIn.scheduledTime <= to
    );
  }
  async create(checkIn) {
    const now = /* @__PURE__ */ new Date();
    const newCheckIn = {
      ...checkIn,
      id: v4_default(),
      createdAt: now,
      updatedAt: now
    };
    this.checkIns.set(newCheckIn.id, newCheckIn);
    return newCheckIn;
  }
  async update(id, updates) {
    const checkIn = this.checkIns.get(id);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${id}`);
    }
    const updatedCheckIn = {
      ...checkIn,
      ...updates,
      id: checkIn.id,
      createdAt: checkIn.createdAt,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.checkIns.set(id, updatedCheckIn);
    return updatedCheckIn;
  }
  async delete(id) {
    return this.checkIns.delete(id);
  }
  async recordResponse(id, response) {
    const responses = this.responses.get(id) ?? [];
    responses.push(response);
    this.responses.set(id, responses);
  }
  async getResponses(checkInId) {
    return this.responses.get(checkInId) ?? [];
  }
};
var defaultLogger2 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var TriggerEvaluator = class {
  evaluateCondition(condition, context) {
    const value = this.getValueForTrigger(condition.type, context);
    if (value === void 0) return false;
    const threshold = condition.threshold;
    switch (condition.comparison) {
      case "gt":
        return value > threshold;
      case "lt":
        return value < threshold;
      case "eq":
        return value === threshold;
      case "gte":
        return value >= threshold;
      case "lte":
        return value <= threshold;
      default:
        return false;
    }
  }
  evaluateAllConditions(conditions, context) {
    return conditions.map((condition) => ({
      ...condition,
      currentValue: this.getValueForTrigger(condition.type, context),
      met: this.evaluateCondition(condition, context)
    }));
  }
  shouldTrigger(conditions, context) {
    if (conditions.length === 0) return true;
    return conditions.some((condition) => this.evaluateCondition(condition, context));
  }
  getValueForTrigger(type, context) {
    switch (type) {
      case TriggerType.DAYS_INACTIVE:
        return context.daysSinceLastSession;
      case TriggerType.STREAK_AT_RISK:
        return context.streakAtRisk ? 1 : 0;
      case TriggerType.MASTERY_PLATEAU:
        return context.masteryTrend === "stable" ? 1 : 0;
      case TriggerType.FRUSTRATION_DETECTED:
        return context.frustrationLevel;
      case TriggerType.GOAL_BEHIND_SCHEDULE:
        return this.calculateBehindSchedule(context);
      case TriggerType.ASSESSMENT_FAILED:
        return context.lastAssessmentPassed === false ? 1 : 0;
      case TriggerType.TIME_SINCE_LAST_SESSION:
        return context.daysSinceLastSession;
      case TriggerType.MILESTONE_APPROACHING:
        return this.calculateMilestoneDistance(context);
      case TriggerType.WEEKLY_REVIEW_DUE:
        return this.calculateWeeklyReviewDue(context);
      default:
        return void 0;
    }
  }
  calculateBehindSchedule(context) {
    if (!context.goalProgress || !context.goalDeadline) return 0;
    const now = /* @__PURE__ */ new Date();
    const totalDays = (context.goalDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1e3);
    const expectedProgress = Math.min(100, Math.max(0, 100 - totalDays / 30 * 100));
    const behindBy = expectedProgress - context.goalProgress;
    return Math.max(0, behindBy);
  }
  calculateMilestoneDistance(context) {
    if (!context.goalProgress) return 100;
    const nextMilestone = Math.ceil(context.goalProgress / 25) * 25;
    return nextMilestone - context.goalProgress;
  }
  calculateWeeklyReviewDue(context) {
    if (!context.lastSessionAt) return 7;
    const now = /* @__PURE__ */ new Date();
    const daysSinceSession = Math.floor(
      (now.getTime() - context.lastSessionAt.getTime()) / (24 * 60 * 60 * 1e3)
    );
    return daysSinceSession % 7 === 0 ? 1 : 0;
  }
};
var CheckInScheduler = class {
  store;
  logger;
  triggerEvaluator;
  defaultChannel;
  checkInExpirationHours;
  constructor(config = {}) {
    this.store = config.store ?? new InMemoryCheckInStore();
    this.logger = config.logger ?? defaultLogger2;
    this.triggerEvaluator = new TriggerEvaluator();
    this.defaultChannel = config.defaultChannel ?? NotificationChannel.IN_APP;
    this.checkInExpirationHours = config.checkInExpirationHours ?? 24;
  }
  /**
   * Schedule a new check-in
   */
  async scheduleCheckIn(checkIn) {
    this.logger.info("Scheduling check-in", { userId: checkIn.userId, type: checkIn.type });
    const expiresAt = new Date(checkIn.scheduledTime);
    expiresAt.setHours(expiresAt.getHours() + this.checkInExpirationHours);
    return this.store.create({
      ...checkIn,
      status: CheckInStatus.SCHEDULED,
      expiresAt: checkIn.expiresAt ?? expiresAt
    });
  }
  /**
   * Get scheduled check-ins for a user
   */
  async getScheduledCheckIns(userId) {
    return this.store.getByUser(userId, CheckInStatus.SCHEDULED);
  }
  /**
   * Get all check-ins for a user
   */
  async getUserCheckIns(userId, status) {
    return this.store.getByUser(userId, status);
  }
  /**
   * Evaluate triggers and return check-ins that should be triggered
   */
  async evaluateTriggers(userId, context) {
    this.logger.debug("Evaluating triggers", { userId });
    const scheduledCheckIns = await this.store.getByUser(userId, CheckInStatus.SCHEDULED);
    const triggeredCheckIns = [];
    for (const checkIn of scheduledCheckIns) {
      const evaluatedConditions = this.triggerEvaluator.evaluateAllConditions(
        checkIn.triggerConditions,
        context
      );
      const shouldTrigger = this.triggerEvaluator.shouldTrigger(
        checkIn.triggerConditions,
        context
      );
      if (shouldTrigger) {
        triggeredCheckIns.push({
          checkInId: checkIn.id,
          triggeredAt: /* @__PURE__ */ new Date(),
          triggerConditions: evaluatedConditions,
          urgency: this.calculateUrgency(checkIn, evaluatedConditions)
        });
        await this.store.update(checkIn.id, { status: CheckInStatus.PENDING });
      }
    }
    this.logger.info("Triggers evaluated", {
      userId,
      triggered: triggeredCheckIns.length,
      total: scheduledCheckIns.length
    });
    return triggeredCheckIns;
  }
  /**
   * Execute a check-in (send notification)
   */
  async executeCheckIn(checkInId) {
    const checkIn = await this.store.get(checkInId);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${checkInId}`);
    }
    this.logger.info("Executing check-in", { checkInId, type: checkIn.type });
    try {
      const success = await this.sendNotification(checkIn);
      if (success) {
        await this.store.update(checkInId, { status: CheckInStatus.SENT });
      }
      return {
        checkInId,
        executedAt: /* @__PURE__ */ new Date(),
        deliveredVia: checkIn.channel,
        success
      };
    } catch (error) {
      this.logger.error("Failed to execute check-in", {
        checkInId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return {
        checkInId,
        executedAt: /* @__PURE__ */ new Date(),
        deliveredVia: checkIn.channel,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Handle a response to a check-in
   */
  async handleResponse(checkInId, response) {
    const validated = CheckInResponseSchema.parse(response);
    const checkIn = await this.store.get(checkInId);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${checkInId}`);
    }
    this.logger.info("Handling check-in response", {
      checkInId,
      answers: validated.answers.length,
      selectedActions: validated.selectedActions.length
    });
    await this.store.recordResponse(checkInId, {
      ...validated,
      emotionalState: validated.emotionalState
    });
    await this.store.update(checkInId, { status: CheckInStatus.RESPONDED });
  }
  /**
   * Get a check-in by ID
   */
  async getCheckIn(checkInId) {
    return this.store.get(checkInId);
  }
  /**
   * Cancel a scheduled check-in
   */
  async cancelCheckIn(checkInId) {
    const checkIn = await this.store.get(checkInId);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${checkInId}`);
    }
    return this.store.update(checkInId, { status: CheckInStatus.CANCELLED });
  }
  /**
   * Process expired check-ins
   */
  async processExpiredCheckIns() {
    const allCheckIns = await this.getAllPendingCheckIns();
    const now = /* @__PURE__ */ new Date();
    let expiredCount = 0;
    for (const checkIn of allCheckIns) {
      if (checkIn.expiresAt && checkIn.expiresAt < now) {
        await this.store.update(checkIn.id, { status: CheckInStatus.EXPIRED });
        expiredCount++;
      }
    }
    if (expiredCount > 0) {
      this.logger.info("Processed expired check-ins", { count: expiredCount });
    }
    return expiredCount;
  }
  /**
   * Create a standard daily reminder check-in
   */
  async createDailyReminder(userId, scheduledTime, planId) {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.DAILY_REMINDER,
      scheduledTime,
      triggerConditions: [],
      message: "Time for today's learning session! Your personalized practice is ready.",
      questions: [
        {
          id: v4_default(),
          question: "How are you feeling about learning today?",
          type: QuestionType.EMOJI,
          options: ["\u{1F60A} Great", "\u{1F610} Okay", "\u{1F614} Not great"],
          required: false,
          order: 1
        }
      ],
      suggestedActions: [
        {
          id: v4_default(),
          title: "Start Learning",
          description: "Begin your daily practice session",
          type: ActionType.START_ACTIVITY,
          priority: "high"
        },
        {
          id: v4_default(),
          title: "Quick Review",
          description: "Review concepts from previous sessions",
          type: ActionType.COMPLETE_REVIEW,
          priority: "medium"
        }
      ],
      channel: this.defaultChannel,
      planId,
      priority: "medium"
    });
  }
  /**
   * Create a progress check-in
   */
  async createProgressCheck(userId, scheduledTime, planId) {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.PROGRESS_CHECK,
      scheduledTime,
      triggerConditions: [],
      message: "Let's check in on your progress! You've been making great strides.",
      questions: [
        {
          id: v4_default(),
          question: "How is the difficulty level for you?",
          type: QuestionType.SINGLE_CHOICE,
          options: ["Too easy", "Just right", "A bit challenging", "Too difficult"],
          required: true,
          order: 1
        },
        {
          id: v4_default(),
          question: "Are you enjoying the content?",
          type: QuestionType.SCALE,
          required: true,
          order: 2
        }
      ],
      suggestedActions: [
        {
          id: v4_default(),
          title: "View Progress",
          description: "See your detailed progress report",
          type: ActionType.VIEW_PROGRESS,
          priority: "high"
        },
        {
          id: v4_default(),
          title: "Adjust Goal",
          description: "Modify your learning plan if needed",
          type: ActionType.ADJUST_GOAL,
          priority: "medium"
        }
      ],
      channel: this.defaultChannel,
      planId,
      priority: "medium"
    });
  }
  /**
   * Create a struggle detection check-in
   */
  async createStruggleCheckIn(userId, triggerConditions) {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.STRUGGLE_DETECTION,
      scheduledTime: /* @__PURE__ */ new Date(),
      triggerConditions,
      message: "I noticed you might be having some difficulty. Let's work through this together!",
      questions: [
        {
          id: v4_default(),
          question: "What are you finding most challenging?",
          type: QuestionType.TEXT,
          required: false,
          order: 1
        },
        {
          id: v4_default(),
          question: "Would you like some additional help?",
          type: QuestionType.YES_NO,
          required: true,
          order: 2
        }
      ],
      suggestedActions: [
        {
          id: v4_default(),
          title: "Get Help",
          description: "Connect with a mentor for personalized support",
          type: ActionType.CONTACT_MENTOR,
          priority: "high"
        },
        {
          id: v4_default(),
          title: "Review Basics",
          description: "Go back to foundational concepts",
          type: ActionType.REVIEW_CONTENT,
          priority: "medium"
        },
        {
          id: v4_default(),
          title: "Take a Break",
          description: "Sometimes a short break helps",
          type: ActionType.TAKE_BREAK,
          priority: "low"
        }
      ],
      channel: this.defaultChannel,
      priority: "high"
    });
  }
  /**
   * Create a milestone celebration check-in
   */
  async createMilestoneCelebration(userId, milestoneName, planId) {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.MILESTONE_CELEBRATION,
      scheduledTime: /* @__PURE__ */ new Date(),
      triggerConditions: [],
      message: `Congratulations! You've reached a milestone: ${milestoneName}! \u{1F389}`,
      questions: [
        {
          id: v4_default(),
          question: "How does it feel to reach this milestone?",
          type: QuestionType.EMOJI,
          options: ["\u{1F389} Amazing", "\u{1F60A} Good", "\u{1F60C} Relieved"],
          required: false,
          order: 1
        }
      ],
      suggestedActions: [
        {
          id: v4_default(),
          title: "Share Achievement",
          description: "Share your success with others",
          type: ActionType.VIEW_PROGRESS,
          priority: "medium"
        },
        {
          id: v4_default(),
          title: "Continue Learning",
          description: "Keep the momentum going",
          type: ActionType.START_ACTIVITY,
          priority: "high"
        }
      ],
      channel: this.defaultChannel,
      planId,
      priority: "low"
    });
  }
  /**
   * Create an inactivity re-engagement check-in
   */
  async createInactivityCheckIn(userId, daysSinceLastActivity) {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.INACTIVITY_REENGAGEMENT,
      scheduledTime: /* @__PURE__ */ new Date(),
      triggerConditions: [
        {
          type: TriggerType.DAYS_INACTIVE,
          threshold: daysSinceLastActivity,
          comparison: "gte",
          met: true
        }
      ],
      message: `We miss you! It's been ${daysSinceLastActivity} days since your last session. Ready to jump back in?`,
      questions: [
        {
          id: v4_default(),
          question: "What's been keeping you away?",
          type: QuestionType.SINGLE_CHOICE,
          options: ["Too busy", "Lost motivation", "Content too difficult", "Other priorities"],
          required: false,
          order: 1
        }
      ],
      suggestedActions: [
        {
          id: v4_default(),
          title: "Quick Session",
          description: "Start with a short 5-minute refresher",
          type: ActionType.START_ACTIVITY,
          priority: "high"
        },
        {
          id: v4_default(),
          title: "Review Progress",
          description: "See how far you have come",
          type: ActionType.VIEW_PROGRESS,
          priority: "medium"
        },
        {
          id: v4_default(),
          title: "Adjust Plan",
          description: "Modify your learning schedule",
          type: ActionType.ADJUST_GOAL,
          priority: "medium"
        }
      ],
      channel: this.defaultChannel,
      priority: "high"
    });
  }
  /**
   * Create a streak risk check-in
   */
  async createStreakRiskCheckIn(userId, currentStreak) {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.STREAK_RISK,
      scheduledTime: /* @__PURE__ */ new Date(),
      triggerConditions: [
        {
          type: TriggerType.STREAK_AT_RISK,
          threshold: 1,
          comparison: "eq",
          met: true
        }
      ],
      message: `Your ${currentStreak}-day streak is at risk! A quick session will keep it going.`,
      questions: [],
      suggestedActions: [
        {
          id: v4_default(),
          title: "Save Streak",
          description: "Complete a quick activity to maintain your streak",
          type: ActionType.START_ACTIVITY,
          priority: "high"
        }
      ],
      channel: NotificationChannel.PUSH,
      // Push for urgency
      priority: "high"
    });
  }
  /**
   * Create a weekly summary check-in
   */
  async createWeeklySummary(userId, scheduledTime, planId) {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.WEEKLY_SUMMARY,
      scheduledTime,
      triggerConditions: [],
      message: "Here's your weekly learning summary! Let's reflect on your progress.",
      questions: [
        {
          id: v4_default(),
          question: "How satisfied are you with this week?",
          type: QuestionType.SCALE,
          required: true,
          order: 1
        },
        {
          id: v4_default(),
          question: "What would you like to focus on next week?",
          type: QuestionType.TEXT,
          required: false,
          order: 2
        }
      ],
      suggestedActions: [
        {
          id: v4_default(),
          title: "View Report",
          description: "See your detailed weekly progress",
          type: ActionType.VIEW_PROGRESS,
          priority: "high"
        },
        {
          id: v4_default(),
          title: "Plan Next Week",
          description: "Set goals for the coming week",
          type: ActionType.ADJUST_GOAL,
          priority: "medium"
        }
      ],
      channel: this.defaultChannel,
      planId,
      priority: "medium"
    });
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  calculateUrgency(checkIn, conditions) {
    if (checkIn.priority === "high") {
      return "immediate";
    }
    const criticalTypes = [
      TriggerType.STREAK_AT_RISK,
      TriggerType.FRUSTRATION_DETECTED,
      TriggerType.ASSESSMENT_FAILED
    ];
    const hasCriticalCondition = conditions.some(
      (c) => c.met && criticalTypes.includes(c.type)
    );
    if (hasCriticalCondition) {
      return "immediate";
    }
    if (checkIn.priority === "medium") {
      return "soon";
    }
    return "routine";
  }
  async sendNotification(checkIn) {
    this.logger.info("Sending notification", {
      checkInId: checkIn.id,
      channel: checkIn.channel,
      type: checkIn.type
    });
    return true;
  }
  async getAllPendingCheckIns() {
    const scheduled = await this.store.getByUser("", CheckInStatus.SCHEDULED);
    const sent = await this.store.getByUser("", CheckInStatus.SENT);
    return [...scheduled, ...sent];
  }
};
function createCheckInScheduler(config) {
  return new CheckInScheduler(config);
}

// src/proactive-intervention/behavior-monitor.ts
var InMemoryBehaviorEventStore = class {
  events = /* @__PURE__ */ new Map();
  async add(event) {
    const newEvent = {
      ...event,
      id: v4_default(),
      processed: false
    };
    this.events.set(newEvent.id, newEvent);
    return newEvent;
  }
  async addBatch(events) {
    const newEvents = [];
    for (const event of events) {
      const newEvent = await this.add(event);
      newEvents.push(newEvent);
    }
    return newEvents;
  }
  async get(id) {
    return this.events.get(id) ?? null;
  }
  async getByUser(userId, options) {
    let events = Array.from(this.events.values()).filter(
      (event) => event.userId === userId
    );
    if (options?.types && options.types.length > 0) {
      events = events.filter((e) => options.types?.includes(e.type));
    }
    if (options?.since) {
      events = events.filter((e) => e.timestamp >= options.since);
    }
    if (options?.until) {
      events = events.filter((e) => e.timestamp <= options.until);
    }
    if (!options?.includeProcessed) {
      events = events.filter((e) => !e.processed);
    }
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (options?.offset) {
      events = events.slice(options.offset);
    }
    if (options?.limit) {
      events = events.slice(0, options.limit);
    }
    return events;
  }
  async getBySession(sessionId) {
    return Array.from(this.events.values()).filter((event) => event.sessionId === sessionId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  async getUnprocessed(limit) {
    return Array.from(this.events.values()).filter((event) => !event.processed).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).slice(0, limit);
  }
  async markProcessed(ids) {
    const now = /* @__PURE__ */ new Date();
    for (const id of ids) {
      const event = this.events.get(id);
      if (event) {
        this.events.set(id, { ...event, processed: true, processedAt: now });
      }
    }
  }
  async count(userId, type, since) {
    let events = Array.from(this.events.values()).filter(
      (event) => event.userId === userId
    );
    if (type) {
      events = events.filter((e) => e.type === type);
    }
    if (since) {
      events = events.filter((e) => e.timestamp >= since);
    }
    return events.length;
  }
};
var InMemoryPatternStore = class {
  patterns = /* @__PURE__ */ new Map();
  async get(id) {
    return this.patterns.get(id) ?? null;
  }
  async getByUser(userId) {
    return Array.from(this.patterns.values()).filter((pattern) => pattern.userId === userId);
  }
  async getByType(userId, type) {
    return Array.from(this.patterns.values()).filter(
      (pattern) => pattern.userId === userId && pattern.type === type
    );
  }
  async create(pattern) {
    const newPattern = {
      ...pattern,
      id: v4_default()
    };
    this.patterns.set(newPattern.id, newPattern);
    return newPattern;
  }
  async update(id, updates) {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error(`Pattern not found: ${id}`);
    }
    const updatedPattern = {
      ...pattern,
      ...updates,
      id: pattern.id
    };
    this.patterns.set(id, updatedPattern);
    return updatedPattern;
  }
  async delete(id) {
    return this.patterns.delete(id);
  }
  async recordOccurrence(id) {
    const pattern = this.patterns.get(id);
    if (pattern) {
      this.patterns.set(id, {
        ...pattern,
        occurrences: pattern.occurrences + 1,
        lastObservedAt: /* @__PURE__ */ new Date()
      });
    }
  }
};
var InMemoryInterventionStore = class {
  interventions = /* @__PURE__ */ new Map();
  userInterventions = /* @__PURE__ */ new Map();
  async get(id) {
    return this.interventions.get(id) ?? null;
  }
  async getByUser(userId, pending) {
    const interventionIds = this.userInterventions.get(userId) ?? [];
    let interventions = interventionIds.map((id) => this.interventions.get(id)).filter((i) => i !== void 0);
    if (pending !== void 0) {
      interventions = interventions.filter(
        (i) => pending ? !i.executedAt : i.executedAt !== void 0
      );
    }
    return interventions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async create(intervention, userId) {
    const newIntervention = {
      ...intervention,
      id: v4_default(),
      createdAt: /* @__PURE__ */ new Date()
    };
    this.interventions.set(newIntervention.id, newIntervention);
    if (userId) {
      const userIds = this.userInterventions.get(userId) ?? [];
      userIds.push(newIntervention.id);
      this.userInterventions.set(userId, userIds);
    }
    return newIntervention;
  }
  async update(id, updates) {
    const intervention = this.interventions.get(id);
    if (!intervention) {
      throw new Error(`Intervention not found: ${id}`);
    }
    const updatedIntervention = {
      ...intervention,
      ...updates,
      id: intervention.id,
      createdAt: intervention.createdAt
    };
    this.interventions.set(id, updatedIntervention);
    return updatedIntervention;
  }
  async recordResult(id, result) {
    const intervention = this.interventions.get(id);
    if (intervention) {
      this.interventions.set(id, { ...intervention, result });
    }
  }
  async getHistory(userId, limit) {
    const interventions = await this.getByUser(userId, false);
    return limit ? interventions.slice(0, limit) : interventions;
  }
  setUserIntervention(userId, interventionId) {
    const userIds = this.userInterventions.get(userId) ?? [];
    userIds.push(interventionId);
    this.userInterventions.set(userId, userIds);
  }
};
var defaultLogger3 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var BehaviorMonitor = class {
  eventStore;
  patternStore;
  interventionStore;
  logger;
  patternDetectionThreshold;
  churnPredictionWindow;
  frustrationThreshold;
  constructor(config = {}) {
    this.eventStore = config.eventStore ?? new InMemoryBehaviorEventStore();
    this.patternStore = config.patternStore ?? new InMemoryPatternStore();
    this.interventionStore = config.interventionStore ?? new InMemoryInterventionStore();
    this.logger = config.logger ?? defaultLogger3;
    this.patternDetectionThreshold = config.patternDetectionThreshold ?? 3;
    this.churnPredictionWindow = config.churnPredictionWindow ?? 14;
    this.frustrationThreshold = config.frustrationThreshold ?? 0.7;
  }
  /**
   * Track a behavior event
   */
  async trackEvent(event) {
    const validated = BehaviorEventSchema.parse(event);
    this.logger.debug("Tracking event", { type: validated.type, userId: validated.userId });
    const storedEvent = await this.eventStore.add({
      ...validated,
      type: validated.type,
      timestamp: new Date(validated.timestamp),
      emotionalSignals: validated.emotionalSignals?.map((s) => ({
        ...s,
        type: s.type
      }))
    });
    if (validated.emotionalSignals && validated.emotionalSignals.length > 0) {
      await this.processEmotionalSignals(
        validated.userId,
        validated.emotionalSignals.map((s) => ({
          ...s,
          type: s.type
        }))
      );
    }
    return storedEvent;
  }
  /**
   * Track multiple events at once
   */
  async trackEvents(events) {
    return this.eventStore.addBatch(events);
  }
  /**
   * Detect patterns in user behavior
   */
  async detectPatterns(userId) {
    this.logger.info("Detecting patterns", { userId });
    const events = await this.eventStore.getByUser(userId, {
      includeProcessed: true,
      limit: 1e3
    });
    if (events.length < this.patternDetectionThreshold) {
      return [];
    }
    const patterns = [];
    const timePattern = this.detectTimePreference(userId, events);
    if (timePattern) patterns.push(timePattern);
    const habitPattern = this.detectLearningHabit(userId, events);
    if (habitPattern) patterns.push(habitPattern);
    const strugglePatterns = this.detectStrugglePatterns(userId, events);
    patterns.push(...strugglePatterns);
    const successPattern = this.detectSuccessPattern(userId, events);
    if (successPattern) patterns.push(successPattern);
    for (const pattern of patterns) {
      const existing = await this.patternStore.getByType(userId, pattern.type);
      if (existing.length === 0) {
        await this.patternStore.create(pattern);
      } else {
        await this.patternStore.update(existing[0].id, {
          occurrences: existing[0].occurrences + 1,
          lastObservedAt: /* @__PURE__ */ new Date(),
          confidence: Math.min(1, existing[0].confidence + 0.05)
        });
      }
    }
    return patterns;
  }
  /**
   * Detect anomalies in user behavior
   */
  async detectAnomalies(userId) {
    this.logger.info("Detecting anomalies", { userId });
    const anomalies = [];
    const now = /* @__PURE__ */ new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1e3);
    const recentEvents = await this.eventStore.getByUser(userId, {
      since: weekAgo,
      includeProcessed: true
    });
    const historicalEvents = await this.eventStore.getByUser(userId, {
      since: twoWeeksAgo,
      until: weekAgo,
      includeProcessed: true
    });
    const recentSessions = recentEvents.filter(
      (e) => e.type === BehaviorEventType.SESSION_START
    ).length;
    const historicalSessions = historicalEvents.filter(
      (e) => e.type === BehaviorEventType.SESSION_START
    ).length;
    if (historicalSessions > 0 && recentSessions < historicalSessions * 0.5) {
      anomalies.push({
        id: v4_default(),
        userId,
        type: AnomalyType.SUDDEN_DISENGAGEMENT,
        severity: recentSessions === 0 ? "high" : "medium",
        description: "Significant decrease in session frequency detected",
        detectedAt: now,
        expectedValue: historicalSessions,
        actualValue: recentSessions,
        deviation: (historicalSessions - recentSessions) / historicalSessions * 100,
        relatedEvents: recentEvents.slice(0, 5).map((e) => e.id),
        suggestedAction: "Consider sending a re-engagement check-in"
      });
    }
    const failures = recentEvents.filter(
      (e) => e.type === BehaviorEventType.ASSESSMENT_ATTEMPT && e.data.passed === false
    );
    if (failures.length >= 3) {
      anomalies.push({
        id: v4_default(),
        userId,
        type: AnomalyType.REPEATED_FAILURES,
        severity: failures.length >= 5 ? "high" : "medium",
        description: "Multiple failed assessment attempts detected",
        detectedAt: now,
        expectedValue: 0,
        actualValue: failures.length,
        deviation: failures.length * 20,
        relatedEvents: failures.map((e) => e.id),
        suggestedAction: "Suggest review materials or easier content"
      });
    }
    const frustrationSignals = recentEvents.filter(
      (e) => e.emotionalSignals?.some(
        (s) => s.type === EmotionalSignalType.FRUSTRATION && s.intensity >= this.frustrationThreshold
      )
    );
    if (frustrationSignals.length >= 2) {
      anomalies.push({
        id: v4_default(),
        userId,
        type: AnomalyType.PERFORMANCE_DROP,
        severity: "high",
        description: "High frustration levels detected",
        detectedAt: now,
        expectedValue: 0,
        actualValue: frustrationSignals.length,
        deviation: frustrationSignals.length * 30,
        relatedEvents: frustrationSignals.map((e) => e.id),
        suggestedAction: "Offer immediate support or break suggestion"
      });
    }
    return anomalies;
  }
  /**
   * Predict churn risk for a user
   */
  async predictChurn(userId) {
    this.logger.info("Predicting churn", { userId });
    const now = /* @__PURE__ */ new Date();
    const windowStart = new Date(
      now.getTime() - this.churnPredictionWindow * 24 * 60 * 60 * 1e3
    );
    const events = await this.eventStore.getByUser(userId, {
      since: windowStart,
      includeProcessed: true
    });
    const factors = [];
    let totalRisk = 0;
    const sessions = events.filter((e) => e.type === BehaviorEventType.SESSION_START).length;
    const expectedSessions = this.churnPredictionWindow * 0.7;
    const sessionRisk = Math.max(0, 1 - sessions / expectedSessions);
    totalRisk += sessionRisk * 0.3;
    factors.push({
      name: "Session Frequency",
      contribution: sessionRisk * 0.3,
      trend: sessions < expectedSessions * 0.5 ? "decreasing" : "stable",
      description: `${sessions} sessions in the last ${this.churnPredictionWindow} days`
    });
    const interactions = events.filter(
      (e) => e.type === BehaviorEventType.CONTENT_INTERACTION
    ).length;
    const expectedInteractions = sessions * 3;
    const engagementRisk = sessions > 0 ? Math.max(0, 1 - interactions / expectedInteractions) : 1;
    totalRisk += engagementRisk * 0.25;
    factors.push({
      name: "Content Engagement",
      contribution: engagementRisk * 0.25,
      trend: interactions < expectedInteractions * 0.5 ? "decreasing" : "stable",
      description: `${interactions} content interactions across sessions`
    });
    const frustrationEvents = events.filter(
      (e) => e.emotionalSignals?.some((s) => s.type === EmotionalSignalType.FRUSTRATION)
    );
    const frustrationRisk = Math.min(1, frustrationEvents.length / 5);
    totalRisk += frustrationRisk * 0.25;
    factors.push({
      name: "Frustration Level",
      contribution: frustrationRisk * 0.25,
      trend: frustrationEvents.length > 2 ? "increasing" : "stable",
      description: `${frustrationEvents.length} frustration signals detected`
    });
    const abandonedGoals = events.filter(
      (e) => e.type === BehaviorEventType.GOAL_ABANDONED
    ).length;
    const goalRisk = Math.min(1, abandonedGoals / 2);
    totalRisk += goalRisk * 0.2;
    factors.push({
      name: "Goal Abandonment",
      contribution: goalRisk * 0.2,
      trend: abandonedGoals > 0 ? "increasing" : "stable",
      description: `${abandonedGoals} goals abandoned`
    });
    let riskLevel;
    if (totalRisk >= 0.8) riskLevel = "critical";
    else if (totalRisk >= 0.6) riskLevel = "high";
    else if (totalRisk >= 0.4) riskLevel = "medium";
    else riskLevel = "low";
    const timeToChurn = riskLevel === "critical" ? 3 : riskLevel === "high" ? 7 : riskLevel === "medium" ? 14 : void 0;
    const interventions = await this.suggestInterventions(
      await this.patternStore.getByUser(userId)
    );
    return {
      userId,
      predictedAt: now,
      churnProbability: totalRisk,
      riskLevel,
      factors,
      recommendedInterventions: interventions,
      timeToChurn
    };
  }
  /**
   * Predict struggle areas for a user
   */
  async predictStruggle(userId) {
    this.logger.info("Predicting struggle", { userId });
    const now = /* @__PURE__ */ new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    const events = await this.eventStore.getByUser(userId, {
      since: weekAgo,
      includeProcessed: true
    });
    const areas = [];
    const support = [];
    const contentAreas = /* @__PURE__ */ new Map();
    for (const event of events) {
      const courseId = event.pageContext.courseId;
      const chapterId = event.pageContext.chapterId;
      const areaKey = `${courseId}:${chapterId}`;
      if (!contentAreas.has(areaKey)) {
        contentAreas.set(areaKey, { failures: 0, hints: 0, time: 0, total: 0 });
      }
      const area = contentAreas.get(areaKey);
      area.total++;
      if (event.type === BehaviorEventType.ASSESSMENT_ATTEMPT && event.data.passed === false) {
        area.failures++;
      }
      if (event.type === BehaviorEventType.HINT_REQUEST) {
        area.hints++;
      }
      if (event.pageContext.timeOnPage) {
        area.time += event.pageContext.timeOnPage;
      }
    }
    for (const [areaKey, stats] of contentAreas.entries()) {
      const failureRate = stats.total > 0 ? stats.failures / stats.total : 0;
      const hintRate = stats.total > 0 ? stats.hints / stats.total : 0;
      const avgTime = stats.total > 0 ? stats.time / stats.total : 0;
      if (failureRate > 0.3 || hintRate > 0.5 || avgTime > 600) {
        const severity = failureRate > 0.5 || hintRate > 0.7 ? "severe" : failureRate > 0.3 ? "moderate" : "mild";
        areas.push({
          topic: areaKey,
          severity,
          indicators: [
            `${Math.round(failureRate * 100)}% failure rate`,
            `${stats.hints} hint requests`,
            `${Math.round(avgTime / 60)} min average time`
          ],
          suggestedRemediation: "Review foundational concepts and try practice exercises"
        });
      }
    }
    if (areas.some((a) => a.severity === "severe")) {
      support.push({
        type: "tutoring",
        description: "One-on-one tutoring session recommended",
        priority: "high",
        resources: ["Mentor session", "Office hours"]
      });
    }
    if (areas.length > 0) {
      support.push({
        type: "content",
        description: "Review supplementary materials",
        priority: "medium",
        resources: areas.map((a) => `Review: ${a.topic}`)
      });
      support.push({
        type: "practice",
        description: "Additional practice exercises",
        priority: "medium"
      });
    }
    const struggleProbability = areas.length > 0 ? Math.min(
      1,
      areas.reduce(
        (sum, a) => sum + (a.severity === "severe" ? 0.4 : a.severity === "moderate" ? 0.2 : 0.1),
        0
      )
    ) : 0;
    return {
      userId,
      predictedAt: now,
      struggleProbability,
      areas,
      recommendedSupport: support
    };
  }
  /**
   * Suggest interventions based on patterns
   */
  async suggestInterventions(patterns) {
    const interventions = [];
    for (const pattern of patterns) {
      const intervention = this.createInterventionForPattern(pattern);
      if (intervention) {
        interventions.push(intervention);
      }
    }
    return interventions;
  }
  /**
   * Get behavior events for a user
   */
  async getEvents(userId, options) {
    return this.eventStore.getByUser(userId, options);
  }
  /**
   * Get events for a session
   */
  async getSessionEvents(sessionId) {
    return this.eventStore.getBySession(sessionId);
  }
  /**
   * Get patterns for a user
   */
  async getPatterns(userId) {
    return this.patternStore.getByUser(userId);
  }
  /**
   * Get pending interventions for a user
   */
  async getPendingInterventions(userId) {
    return this.interventionStore.getByUser(userId, true);
  }
  /**
   * Execute an intervention
   */
  async executeIntervention(interventionId) {
    const intervention = await this.interventionStore.get(interventionId);
    if (!intervention) {
      throw new Error(`Intervention not found: ${interventionId}`);
    }
    this.logger.info("Executing intervention", { interventionId, type: intervention.type });
    return this.interventionStore.update(interventionId, {
      executedAt: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Record intervention result
   */
  async recordInterventionResult(interventionId, result) {
    await this.interventionStore.recordResult(interventionId, result);
  }
  /**
   * Check for interventions based on recent events
   * Call this after recording events to evaluate if any interventions should be triggered
   */
  async checkInterventions(userId) {
    this.logger.info("Checking interventions", { userId });
    const result = {
      anomaliesDetected: [],
      patternsDetected: [],
      interventionsCreated: [],
      existingPendingInterventions: []
    };
    try {
      const pendingInterventions = await this.interventionStore.getByUser(userId, true);
      result.existingPendingInterventions = pendingInterventions;
      const anomalies = await this.detectAnomalies(userId);
      result.anomaliesDetected = anomalies;
      for (const anomaly of anomalies) {
        if (anomaly.severity === "high") {
          const hasExisting = pendingInterventions.some(
            (i) => i.type === this.mapAnomalyToInterventionType(anomaly.type)
          );
          if (!hasExisting) {
            const intervention = await this.createInterventionForAnomaly(userId, anomaly);
            if (intervention) {
              result.interventionsCreated.push(intervention);
            }
          }
        }
      }
      const patterns = await this.detectPatterns(userId);
      result.patternsDetected = patterns;
      for (const pattern of patterns) {
        if (pattern.confidence >= 0.6) {
          const interventionType = this.mapPatternToInterventionType(pattern.type);
          const hasExisting = pendingInterventions.some((i) => i.type === interventionType);
          if (!hasExisting) {
            const intervention = this.createInterventionForPattern(pattern);
            if (intervention) {
              const created = await this.interventionStore.create(intervention);
              this.interventionStore.setUserIntervention(userId, created.id);
              result.interventionsCreated.push(created);
            }
          }
        }
      }
      this.logger.info("Intervention check completed", {
        userId,
        anomaliesCount: result.anomaliesDetected.length,
        patternsCount: result.patternsDetected.length,
        interventionsCreatedCount: result.interventionsCreated.length,
        pendingCount: result.existingPendingInterventions.length
      });
    } catch (error) {
      this.logger.error("Failed to check interventions", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
    return result;
  }
  /**
   * Map anomaly type to intervention type
   */
  mapAnomalyToInterventionType(anomalyType) {
    switch (anomalyType) {
      case AnomalyType.SUDDEN_DISENGAGEMENT:
        return InterventionType.STREAK_REMINDER;
      case AnomalyType.REPEATED_FAILURES:
        return InterventionType.CONTENT_RECOMMENDATION;
      case AnomalyType.PERFORMANCE_DROP:
        return InterventionType.BREAK_SUGGESTION;
      case AnomalyType.SESSION_ABNORMALITY:
        return InterventionType.GOAL_REVISION;
      case AnomalyType.UNUSUAL_ACTIVITY_TIME:
        return InterventionType.ENCOURAGEMENT;
      case AnomalyType.CONTENT_AVOIDANCE:
        return InterventionType.CONTENT_RECOMMENDATION;
      default:
        return InterventionType.ENCOURAGEMENT;
    }
  }
  /**
   * Map pattern type to intervention type
   */
  mapPatternToInterventionType(patternType) {
    switch (patternType) {
      case PatternType.STRUGGLE_PATTERN:
        return InterventionType.CONTENT_RECOMMENDATION;
      case PatternType.HELP_SEEKING:
        return InterventionType.CONTENT_RECOMMENDATION;
      case PatternType.FATIGUE_PATTERN:
        return InterventionType.BREAK_SUGGESTION;
      case PatternType.SUCCESS_PATTERN:
        return InterventionType.ENCOURAGEMENT;
      default:
        return InterventionType.ENCOURAGEMENT;
    }
  }
  /**
   * Create an intervention for an anomaly
   */
  async createInterventionForAnomaly(userId, anomaly) {
    let intervention = null;
    switch (anomaly.type) {
      case AnomalyType.SUDDEN_DISENGAGEMENT:
        intervention = {
          type: InterventionType.STREAK_REMINDER,
          priority: "high",
          message: "We noticed you have not been as active recently. Would you like to get back on track?",
          suggestedActions: [
            {
              id: v4_default(),
              title: "Quick Review",
              description: "Do a quick 5-minute review session",
              type: ActionType.START_ACTIVITY,
              priority: "high"
            },
            {
              id: v4_default(),
              title: "Adjust Goals",
              description: "Update your learning goals if needed",
              type: ActionType.ADJUST_GOAL,
              priority: "medium"
            }
          ],
          timing: { type: "immediate" }
        };
        break;
      case AnomalyType.REPEATED_FAILURES:
        intervention = {
          type: InterventionType.CONTENT_RECOMMENDATION,
          priority: "high",
          message: anomaly.description,
          suggestedActions: [
            {
              id: v4_default(),
              title: "Review Materials",
              description: "Go back to review the fundamentals",
              type: ActionType.REVIEW_CONTENT,
              priority: "high"
            },
            {
              id: v4_default(),
              title: "Get Help",
              description: "Connect with a mentor for assistance",
              type: ActionType.CONTACT_MENTOR,
              priority: "medium"
            }
          ],
          timing: { type: "immediate" }
        };
        break;
      case AnomalyType.PERFORMANCE_DROP:
        intervention = {
          type: InterventionType.BREAK_SUGGESTION,
          priority: "high",
          message: anomaly.description,
          suggestedActions: [
            {
              id: v4_default(),
              title: "Take a Break",
              description: "A short break can help refresh your mind",
              type: ActionType.TAKE_BREAK,
              priority: "high"
            },
            {
              id: v4_default(),
              title: "Talk to Someone",
              description: "Connect with support",
              type: ActionType.CONTACT_MENTOR,
              priority: "medium"
            }
          ],
          timing: { type: "immediate" }
        };
        break;
    }
    if (intervention) {
      const created = await this.interventionStore.create(intervention);
      this.interventionStore.setUserIntervention(userId, created.id);
      return created;
    }
    return null;
  }
  /**
   * Create an intervention for a user
   */
  async createIntervention(userId, intervention) {
    const created = await this.interventionStore.create(intervention);
    this.interventionStore.setUserIntervention(userId, created.id);
    return created;
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  async processEmotionalSignals(userId, signals) {
    const frustrationSignals = signals.filter(
      (s) => s.type === EmotionalSignalType.FRUSTRATION && s.intensity >= this.frustrationThreshold
    );
    if (frustrationSignals.length > 0) {
      this.logger.warn("High frustration detected", {
        userId,
        intensity: frustrationSignals[0].intensity
      });
      await this.createIntervention(userId, {
        type: InterventionType.BREAK_SUGGESTION,
        priority: "high",
        message: "It looks like you might be feeling frustrated. Would you like to take a short break?",
        suggestedActions: [
          {
            id: v4_default(),
            title: "Take a Break",
            description: "5-minute break to refresh",
            type: ActionType.TAKE_BREAK,
            priority: "high"
          },
          {
            id: v4_default(),
            title: "Get Help",
            description: "Connect with a mentor",
            type: ActionType.CONTACT_MENTOR,
            priority: "medium"
          }
        ],
        timing: {
          type: "immediate"
        }
      });
    }
  }
  detectTimePreference(userId, events) {
    const hourCounts = /* @__PURE__ */ new Map();
    for (const event of events) {
      if (event.type === BehaviorEventType.SESSION_START) {
        const hour = event.timestamp.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      }
    }
    if (hourCounts.size === 0) return null;
    let maxCount = 0;
    let peakHour = 0;
    for (const [hour, count] of hourCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    }
    const totalSessions = Array.from(hourCounts.values()).reduce((a, b) => a + b, 0);
    const confidence = maxCount / totalSessions;
    if (confidence < 0.3) return null;
    const timeOfDay = peakHour < 12 ? "morning" : peakHour < 17 ? "afternoon" : peakHour < 21 ? "evening" : "night";
    return {
      id: "",
      userId,
      type: PatternType.TIME_PREFERENCE,
      name: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Learner`,
      description: `Prefers to study during ${timeOfDay} hours (around ${peakHour}:00)`,
      frequency: maxCount,
      duration: 0,
      confidence,
      contexts: [{ timeOfDay }],
      firstObservedAt: events[events.length - 1]?.timestamp ?? /* @__PURE__ */ new Date(),
      lastObservedAt: events[0]?.timestamp ?? /* @__PURE__ */ new Date(),
      occurrences: maxCount
    };
  }
  detectLearningHabit(userId, events) {
    const sessionStarts = events.filter((e) => e.type === BehaviorEventType.SESSION_START);
    if (sessionStarts.length < 3) return null;
    const sessionDurations = [];
    const sessionEndEvents = events.filter((e) => e.type === BehaviorEventType.SESSION_END);
    for (const start of sessionStarts) {
      const end = sessionEndEvents.find(
        (e) => e.sessionId === start.sessionId && e.timestamp > start.timestamp
      );
      if (end) {
        sessionDurations.push(
          (end.timestamp.getTime() - start.timestamp.getTime()) / (60 * 1e3)
        );
      }
    }
    if (sessionDurations.length === 0) return null;
    const avgDuration = sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;
    const daySet = new Set(
      sessionStarts.map((e) => e.timestamp.toISOString().split("T")[0])
    );
    const daysActive = daySet.size;
    const firstDay = new Date(
      Math.min(...sessionStarts.map((e) => e.timestamp.getTime()))
    );
    const lastDay = new Date(
      Math.max(...sessionStarts.map((e) => e.timestamp.getTime()))
    );
    const totalDays = Math.max(
      1,
      Math.ceil((lastDay.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1e3))
    );
    const consistency = daysActive / totalDays;
    if (consistency < 0.3) return null;
    return {
      id: "",
      userId,
      type: PatternType.LEARNING_HABIT,
      name: consistency > 0.7 ? "Consistent Learner" : "Regular Learner",
      description: `Studies ${Math.round(avgDuration)} minutes on average, active ${daysActive} out of ${totalDays} days`,
      frequency: daysActive,
      duration: avgDuration,
      confidence: consistency,
      contexts: [],
      firstObservedAt: firstDay,
      lastObservedAt: lastDay,
      occurrences: sessionStarts.length
    };
  }
  detectStrugglePatterns(userId, events) {
    const patterns = [];
    const hintRequests = events.filter((e) => e.type === BehaviorEventType.HINT_REQUEST);
    if (hintRequests.length >= 5) {
      const contentAreas = new Set(hintRequests.map((e) => e.pageContext.chapterId).filter(Boolean));
      patterns.push({
        id: "",
        userId,
        type: PatternType.HELP_SEEKING,
        name: "Hint Seeker",
        description: `Frequently requests hints (${hintRequests.length} times across ${contentAreas.size} areas)`,
        frequency: hintRequests.length,
        duration: 0,
        confidence: Math.min(1, hintRequests.length / 10),
        contexts: Array.from(contentAreas).map((chapterId) => ({ chapterId })),
        firstObservedAt: hintRequests[hintRequests.length - 1]?.timestamp ?? /* @__PURE__ */ new Date(),
        lastObservedAt: hintRequests[0]?.timestamp ?? /* @__PURE__ */ new Date(),
        occurrences: hintRequests.length
      });
    }
    const failedAttempts = events.filter(
      (e) => e.type === BehaviorEventType.ASSESSMENT_ATTEMPT && e.data.passed === false
    );
    if (failedAttempts.length >= 3) {
      patterns.push({
        id: "",
        userId,
        type: PatternType.STRUGGLE_PATTERN,
        name: "Assessment Challenges",
        description: `Experiencing difficulty with assessments (${failedAttempts.length} failed attempts)`,
        frequency: failedAttempts.length,
        duration: 0,
        confidence: Math.min(1, failedAttempts.length / 5),
        contexts: [],
        firstObservedAt: failedAttempts[failedAttempts.length - 1]?.timestamp ?? /* @__PURE__ */ new Date(),
        lastObservedAt: failedAttempts[0]?.timestamp ?? /* @__PURE__ */ new Date(),
        occurrences: failedAttempts.length
      });
    }
    return patterns;
  }
  detectSuccessPattern(userId, events) {
    const successSignals = events.filter(
      (e) => e.type === BehaviorEventType.SUCCESS_SIGNAL || e.type === BehaviorEventType.ASSESSMENT_ATTEMPT && e.data.passed === true
    );
    if (successSignals.length < 3) return null;
    return {
      id: "",
      userId,
      type: PatternType.SUCCESS_PATTERN,
      name: "Achievement Oriented",
      description: `Regular success signals (${successSignals.length} achievements)`,
      frequency: successSignals.length,
      duration: 0,
      confidence: Math.min(1, successSignals.length / 10),
      contexts: [],
      firstObservedAt: successSignals[successSignals.length - 1]?.timestamp ?? /* @__PURE__ */ new Date(),
      lastObservedAt: successSignals[0]?.timestamp ?? /* @__PURE__ */ new Date(),
      occurrences: successSignals.length
    };
  }
  createInterventionForPattern(pattern) {
    const now = /* @__PURE__ */ new Date();
    switch (pattern.type) {
      case PatternType.STRUGGLE_PATTERN:
        return {
          id: v4_default(),
          type: InterventionType.CONTENT_RECOMMENDATION,
          priority: "high",
          message: "We noticed you might be struggling with some content. Here are some resources that might help.",
          suggestedActions: [
            {
              id: v4_default(),
              title: "Review Basics",
              description: "Go back to foundational concepts",
              type: ActionType.REVIEW_CONTENT,
              priority: "high"
            },
            {
              id: v4_default(),
              title: "Get Help",
              description: "Connect with a mentor",
              type: ActionType.CONTACT_MENTOR,
              priority: "medium"
            }
          ],
          timing: { type: "on_next_session" },
          createdAt: now
        };
      case PatternType.HELP_SEEKING:
        return {
          id: v4_default(),
          type: InterventionType.CONTENT_RECOMMENDATION,
          priority: "medium",
          message: "We see you have been asking for hints frequently. Would you like some additional support?",
          suggestedActions: [
            {
              id: v4_default(),
              title: "Easier Content",
              description: "Try simpler exercises first",
              type: ActionType.START_ACTIVITY,
              priority: "high"
            }
          ],
          timing: { type: "on_next_session" },
          createdAt: now
        };
      case PatternType.FATIGUE_PATTERN:
        return {
          id: v4_default(),
          type: InterventionType.BREAK_SUGGESTION,
          priority: "medium",
          message: "You have been working hard! Consider taking a short break to refresh your mind.",
          suggestedActions: [
            {
              id: v4_default(),
              title: "Take a Break",
              description: "5-10 minute break",
              type: ActionType.TAKE_BREAK,
              priority: "high"
            }
          ],
          timing: { type: "immediate" },
          createdAt: now
        };
      case PatternType.SUCCESS_PATTERN:
        return {
          id: v4_default(),
          type: InterventionType.ENCOURAGEMENT,
          priority: "low",
          message: "Great job! You are making excellent progress. Keep up the good work!",
          suggestedActions: [
            {
              id: v4_default(),
              title: "Challenge Yourself",
              description: "Try more advanced content",
              type: ActionType.START_ACTIVITY,
              priority: "medium"
            }
          ],
          timing: { type: "on_next_session" },
          createdAt: now
        };
      default:
        return null;
    }
  }
};
function createBehaviorMonitor(config) {
  return new BehaviorMonitor(config);
}

// src/self-evaluation/types.ts
var import_zod13 = require("zod");
var ConfidenceLevel = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  UNCERTAIN: "uncertain"
};
var ConfidenceFactorType = {
  KNOWLEDGE_COVERAGE: "knowledge_coverage",
  SOURCE_RELIABILITY: "source_reliability",
  COMPLEXITY_MATCH: "complexity_match",
  CONTEXT_RELEVANCE: "context_relevance",
  HISTORICAL_ACCURACY: "historical_accuracy",
  CONCEPT_CLARITY: "concept_clarity",
  PREREQUISITE_KNOWLEDGE: "prerequisite_knowledge",
  AMBIGUITY_LEVEL: "ambiguity_level"
};
var ResponseType = {
  EXPLANATION: "explanation",
  ANSWER: "answer",
  HINT: "hint",
  FEEDBACK: "feedback",
  ASSESSMENT: "assessment",
  RECOMMENDATION: "recommendation",
  CLARIFICATION: "clarification"
};
var ComplexityLevel = {
  BASIC: "basic",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
  EXPERT: "expert"
};
var SourceType = {
  COURSE_CONTENT: "course_content",
  TEXTBOOK: "textbook",
  DOCUMENTATION: "documentation",
  ACADEMIC_PAPER: "academic_paper",
  KNOWLEDGE_BASE: "knowledge_base",
  EXPERT_REVIEW: "expert_review",
  GENERATED: "generated"
};
var VerificationStatus = {
  VERIFIED: "verified",
  PARTIALLY_VERIFIED: "partially_verified",
  UNVERIFIED: "unverified",
  CONTRADICTED: "contradicted",
  PENDING: "pending"
};
var FactCheckStatus = {
  CONFIRMED: "confirmed",
  LIKELY_CORRECT: "likely_correct",
  UNCERTAIN: "uncertain",
  LIKELY_INCORRECT: "likely_incorrect",
  INCORRECT: "incorrect",
  NOT_VERIFIABLE: "not_verifiable"
};
var IssueType = {
  FACTUAL_ERROR: "factual_error",
  OUTDATED_INFORMATION: "outdated_information",
  OVERSIMPLIFICATION: "oversimplification",
  MISSING_CONTEXT: "missing_context",
  AMBIGUOUS_STATEMENT: "ambiguous_statement",
  POTENTIAL_MISCONCEPTION: "potential_misconception",
  INCOMPLETE_EXPLANATION: "incomplete_explanation",
  TERMINOLOGY_ERROR: "terminology_error",
  LOGICAL_INCONSISTENCY: "logical_inconsistency"
};
var IssueSeverity = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info"
};
var QualityMetricType = {
  ACCURACY: "accuracy",
  HELPFULNESS: "helpfulness",
  CLARITY: "clarity",
  RELEVANCE: "relevance",
  COMPLETENESS: "completeness",
  ENGAGEMENT: "engagement",
  PEDAGOGICAL_EFFECTIVENESS: "pedagogical_effectiveness"
};
var MetricSource = {
  AUTOMATED: "automated",
  STUDENT_FEEDBACK: "student_feedback",
  EXPERT_REVIEW: "expert_review",
  OUTCOME_BASED: "outcome_based",
  COMPARATIVE: "comparative"
};
var ConfidenceInputSchema = import_zod13.z.object({
  responseId: import_zod13.z.string().min(1),
  userId: import_zod13.z.string().min(1),
  sessionId: import_zod13.z.string().min(1),
  responseText: import_zod13.z.string().min(1),
  responseType: import_zod13.z.enum([
    "explanation",
    "answer",
    "hint",
    "feedback",
    "assessment",
    "recommendation",
    "clarification"
  ]),
  topic: import_zod13.z.string().optional(),
  context: import_zod13.z.object({
    courseId: import_zod13.z.string().optional(),
    chapterId: import_zod13.z.string().optional(),
    sectionId: import_zod13.z.string().optional(),
    questionText: import_zod13.z.string().optional(),
    studentLevel: import_zod13.z.string().optional(),
    previousAttempts: import_zod13.z.number().optional(),
    relatedConcepts: import_zod13.z.array(import_zod13.z.string()).optional()
  }).optional(),
  sources: import_zod13.z.array(
    import_zod13.z.object({
      id: import_zod13.z.string(),
      type: import_zod13.z.string(),
      title: import_zod13.z.string(),
      url: import_zod13.z.string().optional(),
      reliability: import_zod13.z.number().min(0).max(1),
      lastVerified: import_zod13.z.date().optional()
    })
  ).optional()
});
var VerificationInputSchema = import_zod13.z.object({
  responseId: import_zod13.z.string().min(1),
  userId: import_zod13.z.string().min(1),
  responseText: import_zod13.z.string().min(1),
  claims: import_zod13.z.array(import_zod13.z.string()).optional(),
  sources: import_zod13.z.array(
    import_zod13.z.object({
      id: import_zod13.z.string(),
      type: import_zod13.z.string(),
      title: import_zod13.z.string(),
      url: import_zod13.z.string().optional(),
      reliability: import_zod13.z.number().min(0).max(1),
      lastVerified: import_zod13.z.date().optional()
    })
  ).optional(),
  context: import_zod13.z.object({
    courseId: import_zod13.z.string().optional(),
    chapterId: import_zod13.z.string().optional(),
    sectionId: import_zod13.z.string().optional(),
    questionText: import_zod13.z.string().optional(),
    studentLevel: import_zod13.z.string().optional(),
    previousAttempts: import_zod13.z.number().optional(),
    relatedConcepts: import_zod13.z.array(import_zod13.z.string()).optional()
  }).optional(),
  strictMode: import_zod13.z.boolean().optional()
});
var StudentFeedbackSchema = import_zod13.z.object({
  responseId: import_zod13.z.string().min(1),
  userId: import_zod13.z.string().min(1),
  helpful: import_zod13.z.boolean(),
  rating: import_zod13.z.number().min(1).max(5).optional(),
  clarity: import_zod13.z.number().min(1).max(5).optional(),
  comment: import_zod13.z.string().max(1e3).optional(),
  didUnderstand: import_zod13.z.boolean(),
  needMoreHelp: import_zod13.z.boolean(),
  askedFollowUp: import_zod13.z.boolean().optional(),
  triedAgain: import_zod13.z.boolean().optional(),
  succeededAfter: import_zod13.z.boolean().optional()
});

// src/self-evaluation/confidence-scorer.ts
var InMemoryConfidenceScoreStore = class {
  scores = /* @__PURE__ */ new Map();
  responseIndex = /* @__PURE__ */ new Map();
  // responseId -> scoreId
  async get(id) {
    return this.scores.get(id) ?? null;
  }
  async getByResponse(responseId) {
    const scoreId = this.responseIndex.get(responseId);
    if (!scoreId) return null;
    return this.scores.get(scoreId) ?? null;
  }
  async getByUser(userId, limit) {
    const userScores = Array.from(this.scores.values()).filter((score) => score.userId === userId).sort((a, b) => b.scoredAt.getTime() - a.scoredAt.getTime());
    return limit ? userScores.slice(0, limit) : userScores;
  }
  async create(score) {
    const newScore = {
      ...score,
      id: v4_default()
    };
    this.scores.set(newScore.id, newScore);
    this.responseIndex.set(newScore.responseId, newScore.id);
    return newScore;
  }
  async getAverageByTopic(topic, since) {
    const topicScores = Array.from(this.scores.values()).filter(
      (score) => score.topic === topic && (!since || score.scoredAt >= since)
    );
    if (topicScores.length === 0) return 0;
    return topicScores.reduce((sum, s) => sum + s.overallScore, 0) / topicScores.length;
  }
  async getDistribution(userId) {
    const distribution = {
      [ConfidenceLevel.HIGH]: 0,
      [ConfidenceLevel.MEDIUM]: 0,
      [ConfidenceLevel.LOW]: 0,
      [ConfidenceLevel.UNCERTAIN]: 0
    };
    const scores = userId ? Array.from(this.scores.values()).filter((s) => s.userId === userId) : Array.from(this.scores.values());
    for (const score of scores) {
      distribution[score.level]++;
    }
    return distribution;
  }
};
var defaultLogger4 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var DEFAULT_FACTOR_WEIGHTS = {
  [ConfidenceFactorType.KNOWLEDGE_COVERAGE]: 0.2,
  [ConfidenceFactorType.SOURCE_RELIABILITY]: 0.18,
  [ConfidenceFactorType.COMPLEXITY_MATCH]: 0.15,
  [ConfidenceFactorType.CONTEXT_RELEVANCE]: 0.12,
  [ConfidenceFactorType.HISTORICAL_ACCURACY]: 0.12,
  [ConfidenceFactorType.CONCEPT_CLARITY]: 0.1,
  [ConfidenceFactorType.PREREQUISITE_KNOWLEDGE]: 0.08,
  [ConfidenceFactorType.AMBIGUITY_LEVEL]: 0.05
};
var ConfidenceScorer = class {
  store;
  logger;
  highConfidenceThreshold;
  lowConfidenceThreshold;
  verificationThreshold;
  factorWeights;
  constructor(config = {}) {
    this.store = config.store ?? new InMemoryConfidenceScoreStore();
    this.logger = config.logger ?? defaultLogger4;
    this.highConfidenceThreshold = config.highConfidenceThreshold ?? 0.8;
    this.lowConfidenceThreshold = config.lowConfidenceThreshold ?? 0.4;
    this.verificationThreshold = config.verificationThreshold ?? 0.6;
    this.factorWeights = { ...DEFAULT_FACTOR_WEIGHTS, ...config.factorWeights };
  }
  /**
   * Calculate confidence score for a response
   */
  async scoreResponse(input) {
    const validated = ConfidenceInputSchema.parse(input);
    this.logger.info("Scoring response confidence", {
      responseId: validated.responseId,
      responseType: validated.responseType
    });
    const typedInput = {
      ...validated,
      responseType: validated.responseType,
      sources: validated.sources?.map((s) => ({
        ...s,
        type: s.type
      }))
    };
    const factors = await this.calculateFactors(typedInput);
    const overallScore = this.calculateOverallScore(factors);
    const level = this.determineConfidenceLevel(overallScore);
    const complexity = this.assessComplexity(validated.responseText, typedInput.context);
    const score = {
      id: "",
      responseId: validated.responseId,
      userId: validated.userId,
      sessionId: validated.sessionId,
      overallScore,
      level,
      factors,
      responseType: validated.responseType,
      topic: validated.topic,
      complexity,
      shouldVerify: overallScore < this.verificationThreshold,
      suggestedDisclaimer: this.generateDisclaimer(level, factors),
      alternativeApproaches: this.suggestAlternatives(factors, typedInput),
      scoredAt: /* @__PURE__ */ new Date()
    };
    const savedScore = await this.store.create(score);
    this.logger.info("Confidence score calculated", {
      responseId: validated.responseId,
      overallScore,
      level,
      shouldVerify: score.shouldVerify
    });
    return savedScore;
  }
  /**
   * Get confidence score for a response
   */
  async getScore(responseId) {
    return this.store.getByResponse(responseId);
  }
  /**
   * Get user's confidence history
   */
  async getUserHistory(userId, limit) {
    return this.store.getByUser(userId, limit);
  }
  /**
   * Get confidence distribution
   */
  async getDistribution(userId) {
    return this.store.getDistribution(userId);
  }
  /**
   * Get average confidence for a topic
   */
  async getTopicAverage(topic, since) {
    return this.store.getAverageByTopic(topic, since);
  }
  /**
   * Quick confidence check without storing
   */
  async quickCheck(responseText, responseType, sources) {
    const tempInput = {
      responseId: "temp",
      userId: "temp",
      sessionId: "temp",
      responseText,
      responseType,
      sources
    };
    const factors = await this.calculateFactors(tempInput);
    const score = this.calculateOverallScore(factors);
    const level = this.determineConfidenceLevel(score);
    return {
      score,
      level,
      shouldVerify: score < this.verificationThreshold
    };
  }
  /**
   * Adjust confidence based on calibration data
   */
  adjustConfidence(score, adjustmentFactor) {
    const adjusted = score * adjustmentFactor;
    return Math.max(0, Math.min(1, adjusted));
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  async calculateFactors(input) {
    const factors = [];
    factors.push(this.calculateKnowledgeCoverage(input));
    factors.push(this.calculateSourceReliability(input.sources));
    factors.push(this.calculateComplexityMatch(input));
    factors.push(this.calculateContextRelevance(input));
    factors.push(await this.calculateHistoricalAccuracy(input));
    factors.push(this.calculateConceptClarity(input.responseText));
    factors.push(this.calculatePrerequisiteKnowledge(input));
    factors.push(this.calculateAmbiguityLevel(input.responseText));
    return factors;
  }
  calculateKnowledgeCoverage(input) {
    let score = 0.7;
    const reasoning = [];
    if (input.topic) {
      score += 0.1;
      reasoning.push("Topic is well-defined");
    }
    if (input.sources && input.sources.length > 0) {
      const avgReliability = input.sources.reduce((sum, s) => sum + s.reliability, 0) / input.sources.length;
      score = Math.min(1, score + avgReliability * 0.2);
      reasoning.push(`${input.sources.length} sources available`);
    } else {
      score -= 0.1;
      reasoning.push("No explicit sources provided");
    }
    if (input.context) {
      if (input.context.courseId) score += 0.05;
      if (input.context.relatedConcepts && input.context.relatedConcepts.length > 0) {
        score += 0.05;
        reasoning.push("Related concepts identified");
      }
    }
    return {
      type: ConfidenceFactorType.KNOWLEDGE_COVERAGE,
      score: Math.max(0, Math.min(1, score)),
      weight: this.factorWeights[ConfidenceFactorType.KNOWLEDGE_COVERAGE],
      reasoning: reasoning.join("; ") || "Standard knowledge coverage"
    };
  }
  calculateSourceReliability(sources) {
    if (!sources || sources.length === 0) {
      return {
        type: ConfidenceFactorType.SOURCE_RELIABILITY,
        score: 0.5,
        weight: this.factorWeights[ConfidenceFactorType.SOURCE_RELIABILITY],
        reasoning: "No explicit sources to verify"
      };
    }
    const typeWeights = {
      [SourceType.ACADEMIC_PAPER]: 1,
      [SourceType.TEXTBOOK]: 0.95,
      [SourceType.DOCUMENTATION]: 0.9,
      [SourceType.EXPERT_REVIEW]: 0.9,
      [SourceType.COURSE_CONTENT]: 0.85,
      [SourceType.KNOWLEDGE_BASE]: 0.8,
      [SourceType.GENERATED]: 0.5
    };
    let totalWeight = 0;
    let weightedSum = 0;
    for (const source of sources) {
      const typeWeight = typeWeights[source.type] ?? 0.5;
      const sourceScore = source.reliability * typeWeight;
      weightedSum += sourceScore;
      totalWeight += typeWeight;
    }
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    return {
      type: ConfidenceFactorType.SOURCE_RELIABILITY,
      score,
      weight: this.factorWeights[ConfidenceFactorType.SOURCE_RELIABILITY],
      reasoning: `${sources.length} sources with average reliability ${(score * 100).toFixed(0)}%`,
      metadata: { sourceCount: sources.length }
    };
  }
  calculateComplexityMatch(input) {
    const responseComplexity = this.assessComplexity(input.responseText, input.context);
    const studentLevel = input.context?.studentLevel ?? "intermediate";
    const levelMap = {
      beginner: ComplexityLevel.BASIC,
      intermediate: ComplexityLevel.INTERMEDIATE,
      advanced: ComplexityLevel.ADVANCED,
      expert: ComplexityLevel.EXPERT
    };
    const expectedComplexity = levelMap[studentLevel] ?? ComplexityLevel.INTERMEDIATE;
    const complexityOrder = [
      ComplexityLevel.BASIC,
      ComplexityLevel.INTERMEDIATE,
      ComplexityLevel.ADVANCED,
      ComplexityLevel.EXPERT
    ];
    const expectedIndex = complexityOrder.indexOf(expectedComplexity);
    const actualIndex = complexityOrder.indexOf(responseComplexity);
    const diff = Math.abs(expectedIndex - actualIndex);
    const score = Math.max(0.2, 1 - diff * 0.3);
    let reasoning = "";
    if (diff === 0) {
      reasoning = "Complexity matches student level";
    } else if (actualIndex > expectedIndex) {
      reasoning = "Response may be too complex for student level";
    } else {
      reasoning = "Response may be oversimplified for student level";
    }
    return {
      type: ConfidenceFactorType.COMPLEXITY_MATCH,
      score,
      weight: this.factorWeights[ConfidenceFactorType.COMPLEXITY_MATCH],
      reasoning,
      metadata: { responseComplexity, expectedComplexity }
    };
  }
  calculateContextRelevance(input) {
    let score = 0.6;
    const reasoning = [];
    if (input.context) {
      if (input.context.courseId) {
        score += 0.15;
        reasoning.push("Course context available");
      }
      if (input.context.questionText) {
        score += 0.1;
        reasoning.push("Original question context available");
      }
      if (input.context.previousAttempts !== void 0) {
        score += 0.05;
        reasoning.push("Student history considered");
      }
      if (input.context.relatedConcepts && input.context.relatedConcepts.length > 0) {
        score += 0.1;
        reasoning.push("Related concepts identified");
      }
    }
    return {
      type: ConfidenceFactorType.CONTEXT_RELEVANCE,
      score: Math.min(1, score),
      weight: this.factorWeights[ConfidenceFactorType.CONTEXT_RELEVANCE],
      reasoning: reasoning.join("; ") || "Limited context available"
    };
  }
  async calculateHistoricalAccuracy(input) {
    if (input.topic) {
      const historicalAvg = await this.store.getAverageByTopic(input.topic);
      if (historicalAvg > 0) {
        return {
          type: ConfidenceFactorType.HISTORICAL_ACCURACY,
          score: historicalAvg,
          weight: this.factorWeights[ConfidenceFactorType.HISTORICAL_ACCURACY],
          reasoning: `Historical accuracy for topic: ${(historicalAvg * 100).toFixed(0)}%`
        };
      }
    }
    return {
      type: ConfidenceFactorType.HISTORICAL_ACCURACY,
      score: 0.7,
      weight: this.factorWeights[ConfidenceFactorType.HISTORICAL_ACCURACY],
      reasoning: "No historical data for this topic"
    };
  }
  calculateConceptClarity(responseText) {
    let score = 0.7;
    const reasoning = [];
    const hasStructure = responseText.includes("\n") || responseText.includes(":") || responseText.includes("-") || responseText.includes("1.");
    if (hasStructure) {
      score += 0.1;
      reasoning.push("Well-structured response");
    }
    const explanationMarkers = [
      "because",
      "therefore",
      "this means",
      "for example",
      "in other words"
    ];
    const hasExplanations = explanationMarkers.some(
      (marker) => responseText.toLowerCase().includes(marker)
    );
    if (hasExplanations) {
      score += 0.1;
      reasoning.push("Contains explanatory elements");
    }
    const hedgingWords = ["might", "perhaps", "possibly", "maybe", "could be", "not sure"];
    const hedgingCount = hedgingWords.filter(
      (word) => responseText.toLowerCase().includes(word)
    ).length;
    if (hedgingCount > 2) {
      score -= 0.15;
      reasoning.push("Excessive hedging language");
    } else if (hedgingCount > 0) {
      score -= 0.05;
      reasoning.push("Some uncertainty expressed");
    }
    const wordCount = responseText.split(/\s+/).length;
    if (wordCount < 10) {
      score -= 0.2;
      reasoning.push("Response may be too brief");
    } else if (wordCount > 500) {
      score -= 0.1;
      reasoning.push("Long response may reduce clarity");
    }
    return {
      type: ConfidenceFactorType.CONCEPT_CLARITY,
      score: Math.max(0, Math.min(1, score)),
      weight: this.factorWeights[ConfidenceFactorType.CONCEPT_CLARITY],
      reasoning: reasoning.join("; ") || "Standard clarity",
      metadata: { wordCount }
    };
  }
  calculatePrerequisiteKnowledge(input) {
    let score = 0.7;
    const reasoning = [];
    if (input.context?.relatedConcepts && input.context.relatedConcepts.length > 0) {
      const conceptCount = input.context.relatedConcepts.length;
      if (conceptCount > 5) {
        score -= 0.1;
        reasoning.push("Many prerequisite concepts involved");
      } else if (conceptCount > 2) {
        score += 0.1;
        reasoning.push("Reasonable prerequisite coverage");
      } else {
        score += 0.15;
        reasoning.push("Few prerequisites needed");
      }
    }
    if (input.context?.studentLevel === "beginner") {
      score -= 0.1;
      reasoning.push("Beginner level requires careful prerequisite consideration");
    }
    return {
      type: ConfidenceFactorType.PREREQUISITE_KNOWLEDGE,
      score: Math.max(0, Math.min(1, score)),
      weight: this.factorWeights[ConfidenceFactorType.PREREQUISITE_KNOWLEDGE],
      reasoning: reasoning.join("; ") || "Standard prerequisite coverage"
    };
  }
  calculateAmbiguityLevel(responseText) {
    let score = 0.8;
    const reasoning = [];
    const ambiguousPatterns = [
      "it depends",
      "in some cases",
      "sometimes",
      "usually",
      "often",
      "typically",
      "generally",
      "in most cases"
    ];
    const ambiguityCount = ambiguousPatterns.filter(
      (pattern) => responseText.toLowerCase().includes(pattern)
    ).length;
    if (ambiguityCount > 3) {
      score -= 0.3;
      reasoning.push("High ambiguity in response");
    } else if (ambiguityCount > 1) {
      score -= 0.15;
      reasoning.push("Some ambiguous statements");
    } else if (ambiguityCount === 1) {
      score -= 0.05;
      reasoning.push("Minor ambiguity present");
    }
    const contradictionMarkers = ["however", "but", "although", "on the other hand"];
    const contradictionCount = contradictionMarkers.filter(
      (marker) => responseText.toLowerCase().includes(marker)
    ).length;
    if (contradictionCount > 2) {
      score -= 0.15;
      reasoning.push("Multiple qualifying statements");
    }
    return {
      type: ConfidenceFactorType.AMBIGUITY_LEVEL,
      score: Math.max(0, Math.min(1, score)),
      weight: this.factorWeights[ConfidenceFactorType.AMBIGUITY_LEVEL],
      reasoning: reasoning.join("; ") || "Low ambiguity"
    };
  }
  calculateOverallScore(factors) {
    let totalWeight = 0;
    let weightedSum = 0;
    for (const factor of factors) {
      weightedSum += factor.score * factor.weight;
      totalWeight += factor.weight;
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }
  determineConfidenceLevel(score) {
    if (score >= this.highConfidenceThreshold) {
      return ConfidenceLevel.HIGH;
    } else if (score >= this.lowConfidenceThreshold) {
      return ConfidenceLevel.MEDIUM;
    } else if (score >= 0.2) {
      return ConfidenceLevel.LOW;
    } else {
      return ConfidenceLevel.UNCERTAIN;
    }
  }
  assessComplexity(responseText, context) {
    const wordCount = responseText.split(/\s+/).length;
    const avgWordLength = responseText.replace(/\s+/g, "").length / Math.max(1, wordCount);
    const technicalTermCount = this.countTechnicalTerms(responseText);
    let complexityScore = 0;
    if (wordCount > 200) complexityScore += 2;
    else if (wordCount > 100) complexityScore += 1;
    if (avgWordLength > 7) complexityScore += 2;
    else if (avgWordLength > 5) complexityScore += 1;
    if (technicalTermCount > 10) complexityScore += 2;
    else if (technicalTermCount > 5) complexityScore += 1;
    if (context?.studentLevel === "advanced" || context?.studentLevel === "expert") {
      complexityScore += 1;
    }
    if (complexityScore >= 5) return ComplexityLevel.EXPERT;
    if (complexityScore >= 3) return ComplexityLevel.ADVANCED;
    if (complexityScore >= 1) return ComplexityLevel.INTERMEDIATE;
    return ComplexityLevel.BASIC;
  }
  countTechnicalTerms(text) {
    const words = text.split(/\s+/);
    return words.filter((word) => word.length > 10).length;
  }
  generateDisclaimer(level, factors) {
    if (level === ConfidenceLevel.HIGH) {
      return void 0;
    }
    const lowFactors = factors.filter((f) => f.score < 0.5);
    if (level === ConfidenceLevel.UNCERTAIN) {
      return "I am not confident in this response. Please verify with additional sources.";
    }
    if (level === ConfidenceLevel.LOW) {
      if (lowFactors.some((f) => f.type === ConfidenceFactorType.SOURCE_RELIABILITY)) {
        return "This response is based on limited sources. Consider seeking additional verification.";
      }
      return "I have some uncertainty about this response. Please review carefully.";
    }
    if (lowFactors.length > 0) {
      const factorNames = lowFactors.map((f) => f.type.replace(/_/g, " ")).slice(0, 2);
      return `Note: Lower confidence in ${factorNames.join(" and ")}.`;
    }
    return void 0;
  }
  suggestAlternatives(factors, _input) {
    const alternatives = [];
    const complexityFactor = factors.find(
      (f) => f.type === ConfidenceFactorType.COMPLEXITY_MATCH
    );
    if (complexityFactor && complexityFactor.score < 0.6) {
      alternatives.push("Consider adjusting explanation complexity for student level");
    }
    const sourceFactor = factors.find(
      (f) => f.type === ConfidenceFactorType.SOURCE_RELIABILITY
    );
    if (sourceFactor && sourceFactor.score < 0.6) {
      alternatives.push("Consider citing additional authoritative sources");
    }
    const ambiguityFactor = factors.find(
      (f) => f.type === ConfidenceFactorType.AMBIGUITY_LEVEL
    );
    if (ambiguityFactor && ambiguityFactor.score < 0.5) {
      alternatives.push("Consider providing more specific, concrete examples");
    }
    const clarityFactor = factors.find(
      (f) => f.type === ConfidenceFactorType.CONCEPT_CLARITY
    );
    if (clarityFactor && clarityFactor.score < 0.5) {
      alternatives.push("Consider breaking down the explanation into clearer steps");
    }
    return alternatives.length > 0 ? alternatives : void 0;
  }
};
function createConfidenceScorer(config) {
  return new ConfidenceScorer(config);
}

// src/self-evaluation/response-verifier.ts
var InMemoryVerificationResultStore = class {
  results = /* @__PURE__ */ new Map();
  responseIndex = /* @__PURE__ */ new Map();
  async get(id) {
    return this.results.get(id) ?? null;
  }
  async getByResponse(responseId) {
    const resultId = this.responseIndex.get(responseId);
    if (!resultId) return null;
    return this.results.get(resultId) ?? null;
  }
  async getByUser(userId, limit) {
    const userResults = Array.from(this.results.values()).filter((result) => result.userId === userId).sort((a, b) => b.verifiedAt.getTime() - a.verifiedAt.getTime());
    return limit ? userResults.slice(0, limit) : userResults;
  }
  async create(result) {
    const newResult = {
      ...result,
      id: v4_default()
    };
    this.results.set(newResult.id, newResult);
    this.responseIndex.set(newResult.responseId, newResult.id);
    return newResult;
  }
  async update(id, updates) {
    const result = this.results.get(id);
    if (!result) {
      throw new Error(`Verification result not found: ${id}`);
    }
    const updatedResult = {
      ...result,
      ...updates,
      id: result.id
    };
    this.results.set(id, updatedResult);
    return updatedResult;
  }
  async getIssuesByType(type, since) {
    const issues = [];
    for (const result of this.results.values()) {
      if (since && result.verifiedAt < since) continue;
      for (const issue of result.issues) {
        if (issue.type === type) {
          issues.push(issue);
        }
      }
    }
    return issues;
  }
};
var defaultLogger5 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var ResponseVerifier = class {
  store;
  logger;
  claimExtractionPatterns;
  constructor(config = {}) {
    this.store = config.store ?? new InMemoryVerificationResultStore();
    this.logger = config.logger ?? defaultLogger5;
    this.claimExtractionPatterns = config.claimExtractionPatterns ?? [
      // Factual statements
      /(?:is|are|was|were|has|have|can|will|must)\s+[^.!?]+[.!?]/gi,
      // Definitions
      /(?:means?|refers?\s+to|is\s+defined\s+as|is\s+known\s+as)\s+[^.!?]+[.!?]/gi,
      // Cause and effect
      /(?:because|therefore|thus|hence|causes?|results?\s+in)\s+[^.!?]+[.!?]/gi
    ];
  }
  /**
   * Verify a response
   */
  async verifyResponse(input) {
    const validated = VerificationInputSchema.parse(input);
    this.logger.info("Verifying response", {
      responseId: validated.responseId,
      strictMode: validated.strictMode
    });
    const typedSources = validated.sources?.map((s) => ({
      ...s,
      type: s.type
    }));
    const claims = validated.claims ?? this.extractClaims(validated.responseText);
    const factChecks = await this.performFactChecks(claims, typedSources);
    const sourceValidations = this.validateSources(typedSources);
    const issues = await this.detectIssues(
      validated.responseText,
      factChecks,
      validated.strictMode
    );
    const corrections = this.generateCorrections(issues, validated.responseText);
    const verifiedCount = factChecks.filter(
      (fc) => fc.status === FactCheckStatus.CONFIRMED || fc.status === FactCheckStatus.LIKELY_CORRECT
    ).length;
    const contradictedCount = factChecks.filter(
      (fc) => fc.status === FactCheckStatus.INCORRECT || fc.status === FactCheckStatus.LIKELY_INCORRECT
    ).length;
    const overallAccuracy = claims.length > 0 ? (verifiedCount - contradictedCount * 0.5) / claims.length : 1;
    const status = this.determineStatus(overallAccuracy, issues, contradictedCount);
    const result = {
      id: "",
      responseId: validated.responseId,
      userId: validated.userId,
      status,
      overallAccuracy: Math.max(0, Math.min(1, overallAccuracy)),
      factChecks,
      totalClaims: claims.length,
      verifiedClaims: verifiedCount,
      contradictedClaims: contradictedCount,
      sourceValidations,
      issues,
      corrections: corrections.length > 0 ? corrections : void 0,
      verifiedAt: /* @__PURE__ */ new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
      // 7 days
    };
    const savedResult = await this.store.create(result);
    this.logger.info("Verification complete", {
      responseId: validated.responseId,
      status,
      accuracy: overallAccuracy.toFixed(2),
      issues: issues.length
    });
    return savedResult;
  }
  /**
   * Get verification result for a response
   */
  async getVerification(responseId) {
    return this.store.getByResponse(responseId);
  }
  /**
   * Get user's verification history
   */
  async getUserHistory(userId, limit) {
    return this.store.getByUser(userId, limit);
  }
  /**
   * Get issues by type
   */
  async getIssuesByType(type, since) {
    return this.store.getIssuesByType(type, since);
  }
  /**
   * Quick verification check without storing
   */
  async quickVerify(responseText, sources) {
    const claims = this.extractClaims(responseText);
    const factChecks = await this.performFactChecks(claims, sources);
    const issues = await this.detectIssues(responseText, factChecks, false);
    const verifiedCount = factChecks.filter(
      (fc) => fc.status === FactCheckStatus.CONFIRMED || fc.status === FactCheckStatus.LIKELY_CORRECT
    ).length;
    const contradictedCount = factChecks.filter(
      (fc) => fc.status === FactCheckStatus.INCORRECT || fc.status === FactCheckStatus.LIKELY_INCORRECT
    ).length;
    const accuracy = claims.length > 0 ? (verifiedCount - contradictedCount * 0.5) / claims.length : 1;
    const status = this.determineStatus(accuracy, issues, contradictedCount);
    const criticalIssues = issues.filter(
      (i) => i.severity === IssueSeverity.CRITICAL || i.severity === IssueSeverity.HIGH
    ).length;
    return {
      status,
      accuracy: Math.max(0, Math.min(1, accuracy)),
      issueCount: issues.length,
      criticalIssues
    };
  }
  /**
   * Validate a single claim
   */
  async validateClaim(claim, sources) {
    const factChecks = await this.performFactChecks([claim], sources);
    return factChecks[0];
  }
  /**
   * Extract claims from text
   */
  extractClaims(text) {
    const claims = /* @__PURE__ */ new Set();
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      for (const pattern of this.claimExtractionPatterns) {
        const matches = trimmed.match(pattern);
        if (matches) {
          for (const match of matches) {
            if (match.length > 15 && match.length < 300) {
              claims.add(match.trim());
            }
          }
        }
      }
      if (this.looksFactual(trimmed) && trimmed.length > 15 && trimmed.length < 300) {
        claims.add(trimmed);
      }
    }
    return Array.from(claims).slice(0, 20);
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  async performFactChecks(claims, sources) {
    const factChecks = [];
    for (const claim of claims) {
      const factCheck = await this.checkFact(claim, sources);
      factChecks.push(factCheck);
    }
    return factChecks;
  }
  async checkFact(claim, sources) {
    const analysis = this.analyzeClaim(claim);
    let confidence = 0.5;
    let status = FactCheckStatus.UNCERTAIN;
    const supportingEvidence = [];
    const contradictingEvidence = [];
    const sourceIds = [];
    if (sources && sources.length > 0) {
      for (const source of sources) {
        sourceIds.push(source.id);
        const sourceWeight = source.reliability * this.getSourceTypeWeight(source.type);
        if (sourceWeight > 0.7) {
          supportingEvidence.push(`Supported by ${source.title}`);
          confidence += sourceWeight * 0.2;
        }
      }
    }
    if (analysis.containsNumbers) {
      confidence -= 0.1;
    }
    if (analysis.isDefinition) {
      confidence += 0.1;
    }
    if (analysis.containsHedging) {
      status = FactCheckStatus.NOT_VERIFIABLE;
    } else if (analysis.isAbsolute) {
      confidence -= 0.15;
    }
    if (status !== FactCheckStatus.NOT_VERIFIABLE) {
      if (confidence >= 0.8) {
        status = FactCheckStatus.CONFIRMED;
      } else if (confidence >= 0.65) {
        status = FactCheckStatus.LIKELY_CORRECT;
      } else if (confidence >= 0.4) {
        status = FactCheckStatus.UNCERTAIN;
      } else if (confidence >= 0.25) {
        status = FactCheckStatus.LIKELY_INCORRECT;
      } else {
        status = FactCheckStatus.INCORRECT;
      }
    }
    return {
      id: v4_default(),
      claim,
      status,
      confidence: Math.max(0, Math.min(1, confidence)),
      supportingEvidence: supportingEvidence.length > 0 ? supportingEvidence : void 0,
      contradictingEvidence: contradictingEvidence.length > 0 ? contradictingEvidence : void 0,
      sources: sourceIds
    };
  }
  analyzeClaim(claim) {
    const lowerClaim = claim.toLowerCase();
    return {
      containsNumbers: /\d+/.test(claim),
      isDefinition: /(?:is defined as|means|refers to|is known as)/.test(lowerClaim),
      containsHedging: /(?:might|maybe|perhaps|possibly|could|may|sometimes|often)/.test(
        lowerClaim
      ),
      isAbsolute: /(?:always|never|all|none|every|must|definitely|certainly)/.test(lowerClaim)
    };
  }
  getSourceTypeWeight(type) {
    const weights = {
      [SourceType.ACADEMIC_PAPER]: 1,
      [SourceType.TEXTBOOK]: 0.95,
      [SourceType.DOCUMENTATION]: 0.9,
      [SourceType.EXPERT_REVIEW]: 0.9,
      [SourceType.COURSE_CONTENT]: 0.85,
      [SourceType.KNOWLEDGE_BASE]: 0.8,
      [SourceType.GENERATED]: 0.5
    };
    return weights[type] ?? 0.5;
  }
  validateSources(sources) {
    if (!sources || sources.length === 0) {
      return [];
    }
    return sources.map((source) => ({
      sourceId: source.id,
      isValid: source.reliability >= 0.5,
      reliability: source.reliability,
      lastChecked: /* @__PURE__ */ new Date(),
      issues: source.reliability < 0.5 ? ["Low reliability score"] : void 0
    }));
  }
  async detectIssues(responseText, factChecks, strictMode) {
    const issues = [];
    for (const factCheck of factChecks) {
      if (factCheck.status === FactCheckStatus.INCORRECT || factCheck.status === FactCheckStatus.LIKELY_INCORRECT) {
        issues.push({
          id: v4_default(),
          type: IssueType.FACTUAL_ERROR,
          severity: factCheck.status === FactCheckStatus.INCORRECT ? IssueSeverity.CRITICAL : IssueSeverity.HIGH,
          description: `Potential factual error: "${factCheck.claim.substring(0, 100)}..."`,
          relatedClaims: [factCheck.id],
          suggestedFix: "Review and correct this claim against authoritative sources"
        });
      }
    }
    if (this.detectOversimplification(responseText)) {
      issues.push({
        id: v4_default(),
        type: IssueType.OVERSIMPLIFICATION,
        severity: IssueSeverity.MEDIUM,
        description: "Response may oversimplify complex concepts",
        suggestedFix: "Consider adding nuance or acknowledging complexity"
      });
    }
    const ambiguousStatements = this.detectAmbiguity(responseText);
    for (const statement of ambiguousStatements) {
      issues.push({
        id: v4_default(),
        type: IssueType.AMBIGUOUS_STATEMENT,
        severity: IssueSeverity.LOW,
        description: `Ambiguous statement: "${statement.substring(0, 80)}..."`,
        location: statement,
        suggestedFix: "Provide more specific or concrete information"
      });
    }
    const misconceptions = this.detectPotentialMisconceptions(responseText);
    for (const misconception of misconceptions) {
      issues.push({
        id: v4_default(),
        type: IssueType.POTENTIAL_MISCONCEPTION,
        severity: IssueSeverity.HIGH,
        description: misconception.description,
        location: misconception.text,
        suggestedFix: misconception.fix
      });
    }
    if (strictMode) {
      if (this.detectIncompleteExplanation(responseText)) {
        issues.push({
          id: v4_default(),
          type: IssueType.INCOMPLETE_EXPLANATION,
          severity: IssueSeverity.MEDIUM,
          description: "Explanation may be incomplete or missing important context",
          suggestedFix: "Consider adding more context or prerequisite information"
        });
      }
      const inconsistencies = this.detectLogicalInconsistencies(responseText);
      for (const inconsistency of inconsistencies) {
        issues.push({
          id: v4_default(),
          type: IssueType.LOGICAL_INCONSISTENCY,
          severity: IssueSeverity.HIGH,
          description: inconsistency,
          suggestedFix: "Review logic and ensure statements are consistent"
        });
      }
    }
    return issues;
  }
  detectOversimplification(text) {
    const simplificationMarkers = [
      "simply",
      "just",
      "only",
      "always",
      "never",
      "all you need",
      "the only way"
    ];
    const markerCount = simplificationMarkers.filter(
      (marker) => text.toLowerCase().includes(marker)
    ).length;
    const wordCount = text.split(/\s+/).length;
    const hasTechnicalTerms = /(?:algorithm|function|variable|interface|protocol|architecture)/i.test(
      text
    );
    return markerCount >= 2 || hasTechnicalTerms && wordCount < 50;
  }
  detectAmbiguity(text) {
    const ambiguousStatements = [];
    const sentences = text.split(/[.!?]+/);
    const ambiguityPatterns = [
      /\b(?:it|this|that|these|those)\s+(?:is|are|can|will|should)\b/i,
      /\b(?:sometimes|often|usually|generally|typically)\b/i,
      /\b(?:some|many|few|several)\s+\w+s?\b/i
    ];
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 10) continue;
      for (const pattern of ambiguityPatterns) {
        if (pattern.test(trimmed)) {
          ambiguousStatements.push(trimmed);
          break;
        }
      }
    }
    return ambiguousStatements.slice(0, 3);
  }
  detectPotentialMisconceptions(text) {
    const misconceptions = [];
    const misconceptionPatterns = [
      {
        pattern: /\bpass(?:ed)?\s+by\s+reference\b/i,
        description: "Potential confusion about pass-by-reference semantics",
        fix: "Clarify whether language uses pass-by-value or pass-by-reference"
      },
      {
        pattern: /\bequal(?:s)?\s+null\b/i,
        description: "Potential null comparison issue",
        fix: "Consider mentioning null safety practices"
      },
      {
        pattern: /\bfloating\s+point.*(?:exact|precise|accurate)\b/i,
        description: "Potential floating-point precision misconception",
        fix: "Clarify limitations of floating-point arithmetic"
      }
    ];
    for (const mp of misconceptionPatterns) {
      const match = text.match(mp.pattern);
      if (match) {
        misconceptions.push({
          text: match[0],
          description: mp.description,
          fix: mp.fix
        });
      }
    }
    return misconceptions;
  }
  detectIncompleteExplanation(text) {
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 30) return true;
    const hasExamples = /(?:for example|such as|e\.g\.|like|consider)/i.test(text);
    const hasReasoning = /(?:because|therefore|since|due to|as a result)/i.test(text);
    return !hasExamples && !hasReasoning && wordCount < 100;
  }
  detectLogicalInconsistencies(text) {
    const inconsistencies = [];
    const sentences = text.split(/[.!?]+/).map((s) => s.trim().toLowerCase());
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        if (this.areContradictory(sentences[i], sentences[j])) {
          inconsistencies.push(
            `Potential contradiction between statements at positions ${i + 1} and ${j + 1}`
          );
        }
      }
    }
    return inconsistencies.slice(0, 2);
  }
  areContradictory(s1, s2) {
    const negationPairs = [
      ["is", "is not"],
      ["can", "cannot"],
      ["will", "will not"],
      ["should", "should not"],
      ["always", "never"],
      ["true", "false"]
    ];
    for (const [positive, negative] of negationPairs) {
      if (s1.includes(positive) && s2.includes(negative) || s1.includes(negative) && s2.includes(positive)) {
        const words1 = new Set(s1.split(/\s+/).filter((w) => w.length > 4));
        const words2 = new Set(s2.split(/\s+/).filter((w) => w.length > 4));
        const overlap = [...words1].filter((w) => words2.has(w)).length;
        if (overlap >= 2) {
          return true;
        }
      }
    }
    return false;
  }
  generateCorrections(issues, _responseText) {
    const corrections = [];
    for (const issue of issues) {
      if (issue.severity === IssueSeverity.CRITICAL || issue.severity === IssueSeverity.HIGH) {
        if (issue.location && issue.suggestedFix) {
          corrections.push({
            id: v4_default(),
            issueId: issue.id,
            originalText: issue.location.substring(0, 200),
            suggestedText: `[Needs revision: ${issue.suggestedFix}]`,
            reasoning: issue.description,
            confidence: issue.severity === IssueSeverity.CRITICAL ? 0.9 : 0.7
          });
        }
      }
    }
    return corrections;
  }
  looksFactual(sentence) {
    const factualIndicators = [
      /^[A-Z][a-z]+\s+(?:is|are|was|were|has|have)\s/,
      /\b(?:defined|known|called|named|referred)\b/i,
      /\b(?:consists?|contains?|includes?|comprises?)\b/i,
      /\b(?:causes?|results?\s+in|leads?\s+to)\b/i
    ];
    return factualIndicators.some((pattern) => pattern.test(sentence));
  }
  determineStatus(accuracy, issues, contradictedCount) {
    const criticalIssues = issues.filter(
      (i) => i.severity === IssueSeverity.CRITICAL
    ).length;
    const highIssues = issues.filter((i) => i.severity === IssueSeverity.HIGH).length;
    if (contradictedCount > 0 || criticalIssues > 0) {
      return VerificationStatus.CONTRADICTED;
    }
    if (accuracy >= 0.9 && highIssues === 0) {
      return VerificationStatus.VERIFIED;
    }
    if (accuracy >= 0.7) {
      return VerificationStatus.PARTIALLY_VERIFIED;
    }
    return VerificationStatus.UNVERIFIED;
  }
};
function createResponseVerifier(config) {
  return new ResponseVerifier(config);
}

// src/self-evaluation/quality-tracker.ts
var InMemoryQualityRecordStore = class {
  records = /* @__PURE__ */ new Map();
  responseIndex = /* @__PURE__ */ new Map();
  feedbackStore = /* @__PURE__ */ new Map();
  outcomeStore = /* @__PURE__ */ new Map();
  async get(id) {
    return this.records.get(id) ?? null;
  }
  async getByResponse(responseId) {
    const recordId = this.responseIndex.get(responseId);
    if (!recordId) return null;
    return this.records.get(recordId) ?? null;
  }
  async getByUser(userId, limit) {
    const userRecords = Array.from(this.records.values()).filter((record) => record.userId === userId).sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
    return limit ? userRecords.slice(0, limit) : userRecords;
  }
  async create(record) {
    const newRecord = {
      ...record,
      id: v4_default()
    };
    this.records.set(newRecord.id, newRecord);
    this.responseIndex.set(newRecord.responseId, newRecord.id);
    return newRecord;
  }
  async update(id, updates) {
    const record = this.records.get(id);
    if (!record) {
      throw new Error(`Quality record not found: ${id}`);
    }
    const updatedRecord = {
      ...record,
      ...updates,
      id: record.id,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.records.set(id, updatedRecord);
    return updatedRecord;
  }
  async recordFeedback(responseId, feedback) {
    this.feedbackStore.set(responseId, feedback);
    const recordId = this.responseIndex.get(responseId);
    if (recordId) {
      const record = this.records.get(recordId);
      if (record) {
        record.studentFeedback = feedback;
        record.updatedAt = /* @__PURE__ */ new Date();
        this.records.set(recordId, record);
      }
    }
  }
  async recordOutcome(responseId, outcome) {
    this.outcomeStore.set(responseId, outcome);
    const recordId = this.responseIndex.get(responseId);
    if (recordId) {
      const record = this.records.get(recordId);
      if (record) {
        record.learningOutcome = outcome;
        record.updatedAt = /* @__PURE__ */ new Date();
        this.records.set(recordId, record);
      }
    }
  }
  async getSummary(userId, periodStart, periodEnd) {
    const now = /* @__PURE__ */ new Date();
    const start = periodStart ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    const end = periodEnd ?? now;
    let records = Array.from(this.records.values()).filter(
      (r) => r.recordedAt >= start && r.recordedAt <= end
    );
    if (userId) {
      records = records.filter((r) => r.userId === userId);
    }
    const totalResponses = records.length;
    const averageQuality = totalResponses > 0 ? records.reduce((sum, r) => sum + r.overallQuality, 0) / totalResponses : 0;
    const averageConfidence = totalResponses > 0 ? records.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / totalResponses : 0;
    const calibrationScore = this.calculateCalibrationScore(records);
    const midpoint = new Date((start.getTime() + end.getTime()) / 2);
    const firstHalf = records.filter((r) => r.recordedAt < midpoint);
    const secondHalf = records.filter((r) => r.recordedAt >= midpoint);
    const firstQuality = firstHalf.length > 0 ? firstHalf.reduce((sum, r) => sum + r.overallQuality, 0) / firstHalf.length : 0;
    const secondQuality = secondHalf.length > 0 ? secondHalf.reduce((sum, r) => sum + r.overallQuality, 0) / secondHalf.length : 0;
    const qualityTrend = secondQuality > firstQuality + 0.05 ? "improving" : secondQuality < firstQuality - 0.05 ? "declining" : "stable";
    const firstConfidence = firstHalf.length > 0 ? firstHalf.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / firstHalf.length : 0;
    const secondConfidence = secondHalf.length > 0 ? secondHalf.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / secondHalf.length : 0;
    const confidenceTrend = secondConfidence > firstConfidence + 0.05 ? "improving" : secondConfidence < firstConfidence - 0.05 ? "declining" : "stable";
    return {
      userId,
      periodStart: start,
      periodEnd: end,
      totalResponses,
      averageQuality,
      averageConfidence,
      calibrationScore,
      byResponseType: {},
      byTopic: {},
      byComplexity: {},
      qualityTrend,
      confidenceTrend,
      improvementAreas: this.identifyImprovementAreas(records),
      strengths: this.identifyStrengths(records)
    };
  }
  calculateCalibrationScore(records) {
    const withBoth = records.filter(
      (r) => r.confidenceScore !== void 0 && r.overallQuality !== void 0
    );
    if (withBoth.length === 0) return 1;
    const errors = withBoth.map((r) => Math.abs((r.confidenceScore ?? 0) - r.overallQuality));
    const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    return Math.max(0, 1 - avgError);
  }
  identifyImprovementAreas(records) {
    const areas = [];
    const metricTotals = {};
    for (const record of records) {
      for (const metric of record.metrics) {
        if (!metricTotals[metric.type]) {
          metricTotals[metric.type] = { sum: 0, count: 0 };
        }
        metricTotals[metric.type].sum += metric.score;
        metricTotals[metric.type].count++;
      }
    }
    for (const [type, data] of Object.entries(metricTotals)) {
      const avg = data.sum / data.count;
      if (avg < 0.6) {
        areas.push(`Improve ${type.replace(/_/g, " ")}`);
      }
    }
    return areas.slice(0, 3);
  }
  identifyStrengths(records) {
    const strengths = [];
    const metricTotals = {};
    for (const record of records) {
      for (const metric of record.metrics) {
        if (!metricTotals[metric.type]) {
          metricTotals[metric.type] = { sum: 0, count: 0 };
        }
        metricTotals[metric.type].sum += metric.score;
        metricTotals[metric.type].count++;
      }
    }
    for (const [type, data] of Object.entries(metricTotals)) {
      const avg = data.sum / data.count;
      if (avg >= 0.8) {
        strengths.push(`Strong ${type.replace(/_/g, " ")}`);
      }
    }
    return strengths.slice(0, 3);
  }
};
var InMemoryCalibrationStore = class {
  calibrations = /* @__PURE__ */ new Map();
  async get(id) {
    return this.calibrations.get(id) ?? null;
  }
  async getLatest(userId, topic) {
    let matching = Array.from(this.calibrations.values());
    if (userId) {
      matching = matching.filter((c) => c.userId === userId);
    }
    if (topic) {
      matching = matching.filter((c) => c.topic === topic);
    }
    matching.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
    return matching[0] ?? null;
  }
  async create(data) {
    const newData = {
      ...data,
      id: v4_default()
    };
    this.calibrations.set(newData.id, newData);
    return newData;
  }
  async getHistory(userId, limit) {
    let history = Array.from(this.calibrations.values());
    if (userId) {
      history = history.filter((c) => c.userId === userId);
    }
    history.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
    return limit ? history.slice(0, limit) : history;
  }
};
var defaultLogger6 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var QualityTracker = class {
  qualityStore;
  calibrationStore;
  logger;
  calibrationWindow;
  minimumSamplesForCalibration;
  constructor(config = {}) {
    this.qualityStore = config.qualityStore ?? new InMemoryQualityRecordStore();
    this.calibrationStore = config.calibrationStore ?? new InMemoryCalibrationStore();
    this.logger = config.logger ?? defaultLogger6;
    this.calibrationWindow = config.calibrationWindow ?? 30;
    this.minimumSamplesForCalibration = config.minimumSamplesForCalibration ?? 10;
  }
  /**
   * Record quality metrics for a response
   */
  async recordQuality(responseId, userId, sessionId, metrics, confidenceScore) {
    this.logger.info("Recording quality metrics", { responseId, metricsCount: metrics.length });
    const overallQuality = this.calculateOverallQuality(metrics);
    const confidenceAccuracy = confidenceScore !== void 0 ? 1 - Math.abs(confidenceScore - overallQuality) : void 0;
    const record = {
      id: "",
      responseId,
      userId,
      sessionId,
      metrics,
      overallQuality,
      confidenceScore,
      confidenceAccuracy,
      recordedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const savedRecord = await this.qualityStore.create(record);
    this.logger.info("Quality recorded", {
      responseId,
      overallQuality,
      confidenceAccuracy
    });
    return savedRecord;
  }
  /**
   * Record student feedback
   */
  async recordFeedback(feedback) {
    const validated = StudentFeedbackSchema.parse(feedback);
    this.logger.info("Recording student feedback", {
      responseId: validated.responseId,
      helpful: validated.helpful
    });
    const feedbackWithId = {
      ...validated,
      id: v4_default(),
      submittedAt: /* @__PURE__ */ new Date()
    };
    await this.qualityStore.recordFeedback(validated.responseId, feedbackWithId);
    const record = await this.qualityStore.getByResponse(validated.responseId);
    if (record) {
      const feedbackMetrics = this.deriveFeedbackMetrics(feedbackWithId);
      const updatedMetrics = [...record.metrics, ...feedbackMetrics];
      const newOverallQuality = this.calculateOverallQuality(updatedMetrics);
      await this.qualityStore.update(record.id, {
        metrics: updatedMetrics,
        overallQuality: newOverallQuality,
        studentFeedback: feedbackWithId
      });
    }
  }
  /**
   * Record expert review
   */
  async recordExpertReview(responseId, review) {
    this.logger.info("Recording expert review", { responseId, approved: review.approved });
    const record = await this.qualityStore.getByResponse(responseId);
    if (record) {
      const reviewMetrics = this.deriveExpertMetrics(review);
      const updatedMetrics = [...record.metrics, ...reviewMetrics];
      const newOverallQuality = this.calculateOverallQuality(updatedMetrics);
      await this.qualityStore.update(record.id, {
        metrics: updatedMetrics,
        overallQuality: newOverallQuality,
        expertReview: review
      });
    }
  }
  /**
   * Record learning outcome
   */
  async recordOutcome(responseId, outcome) {
    this.logger.info("Recording learning outcome", {
      responseId,
      masteryImprovement: outcome.masteryImprovement
    });
    await this.qualityStore.recordOutcome(responseId, outcome);
    const record = await this.qualityStore.getByResponse(responseId);
    if (record) {
      const outcomeMetrics = this.deriveOutcomeMetrics(outcome);
      const updatedMetrics = [...record.metrics, ...outcomeMetrics];
      const newOverallQuality = this.calculateOverallQuality(updatedMetrics);
      await this.qualityStore.update(record.id, {
        metrics: updatedMetrics,
        overallQuality: newOverallQuality,
        learningOutcome: outcome
      });
    }
  }
  /**
   * Calculate calibration data
   */
  async calculateCalibration(userId, topic) {
    this.logger.info("Calculating calibration", { userId, topic });
    const now = /* @__PURE__ */ new Date();
    const windowStart = new Date(
      now.getTime() - this.calibrationWindow * 24 * 60 * 60 * 1e3
    );
    let records = await this.qualityStore.getByUser(userId ?? "");
    if (!userId) {
      const summary = await this.qualityStore.getSummary(void 0, windowStart, now);
      if (summary.totalResponses < this.minimumSamplesForCalibration) {
        this.logger.warn("Insufficient samples for calibration", {
          samples: summary.totalResponses,
          required: this.minimumSamplesForCalibration
        });
        return null;
      }
    }
    records = records.filter(
      (r) => r.recordedAt >= windowStart && r.confidenceScore !== void 0 && (!topic || r.metrics.some((m) => m.notes?.includes(topic)))
    );
    if (records.length < this.minimumSamplesForCalibration) {
      this.logger.warn("Insufficient samples for calibration", {
        samples: records.length,
        required: this.minimumSamplesForCalibration
      });
      return null;
    }
    const expectedAccuracy = records.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / records.length;
    const actualAccuracy = records.reduce((sum, r) => sum + r.overallQuality, 0) / records.length;
    const calibrationError = Math.abs(expectedAccuracy - actualAccuracy);
    const buckets = this.calculateCalibrationBuckets(records);
    const adjustmentFactor = actualAccuracy > 0 ? actualAccuracy / Math.max(0.1, expectedAccuracy) : 1;
    const adjustmentDirection = adjustmentFactor > 1.1 ? "increase" : adjustmentFactor < 0.9 ? "decrease" : "none";
    const calibration = {
      id: "",
      userId,
      topic,
      totalResponses: records.length,
      expectedAccuracy,
      actualAccuracy,
      calibrationError,
      byConfidenceLevel: buckets,
      adjustmentFactor: Math.max(0.5, Math.min(1.5, adjustmentFactor)),
      adjustmentDirection,
      periodStart: windowStart,
      periodEnd: now,
      calculatedAt: now
    };
    const saved = await this.calibrationStore.create(calibration);
    this.logger.info("Calibration calculated", {
      expectedAccuracy: expectedAccuracy.toFixed(2),
      actualAccuracy: actualAccuracy.toFixed(2),
      adjustmentFactor: adjustmentFactor.toFixed(2)
    });
    return saved;
  }
  /**
   * Get quality summary
   */
  async getSummary(userId, periodStart, periodEnd) {
    return this.qualityStore.getSummary(userId, periodStart, periodEnd);
  }
  /**
   * Get calibration history
   */
  async getCalibrationHistory(userId, limit) {
    return this.calibrationStore.getHistory(userId, limit);
  }
  /**
   * Get latest calibration
   */
  async getLatestCalibration(userId, topic) {
    return this.calibrationStore.getLatest(userId, topic);
  }
  /**
   * Get quality record for a response
   */
  async getQualityRecord(responseId) {
    return this.qualityStore.getByResponse(responseId);
  }
  /**
   * Get user's quality history
   */
  async getUserHistory(userId, limit) {
    return this.qualityStore.getByUser(userId, limit);
  }
  /**
   * Create automated quality metrics from response analysis
   */
  createAutomatedMetrics(responseText, verificationAccuracy, _confidenceScore) {
    const metrics = [];
    if (verificationAccuracy !== void 0) {
      metrics.push({
        type: QualityMetricType.ACCURACY,
        score: verificationAccuracy,
        source: MetricSource.AUTOMATED,
        confidence: 0.8,
        notes: "Based on response verification"
      });
    }
    const clarityScore = this.analyzeClarity(responseText);
    metrics.push({
      type: QualityMetricType.CLARITY,
      score: clarityScore,
      source: MetricSource.AUTOMATED,
      confidence: 0.7,
      notes: "Based on text structure analysis"
    });
    const completenessScore = this.analyzeCompleteness(responseText);
    metrics.push({
      type: QualityMetricType.COMPLETENESS,
      score: completenessScore,
      source: MetricSource.AUTOMATED,
      confidence: 0.6,
      notes: "Based on content coverage analysis"
    });
    return metrics;
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  calculateOverallQuality(metrics) {
    if (metrics.length === 0) return 0;
    let totalWeight = 0;
    let weightedSum = 0;
    const sourceWeights = {
      [MetricSource.EXPERT_REVIEW]: 1,
      [MetricSource.OUTCOME_BASED]: 0.9,
      [MetricSource.STUDENT_FEEDBACK]: 0.8,
      [MetricSource.COMPARATIVE]: 0.7,
      [MetricSource.AUTOMATED]: 0.6
    };
    for (const metric of metrics) {
      const sourceWeight = sourceWeights[metric.source];
      const weight = sourceWeight * metric.confidence;
      weightedSum += metric.score * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  deriveFeedbackMetrics(feedback) {
    const metrics = [];
    metrics.push({
      type: QualityMetricType.HELPFULNESS,
      score: feedback.helpful ? feedback.rating ? feedback.rating / 5 : 0.8 : 0.3,
      source: MetricSource.STUDENT_FEEDBACK,
      confidence: 0.9,
      notes: feedback.comment ?? void 0
    });
    if (feedback.clarity !== void 0) {
      metrics.push({
        type: QualityMetricType.CLARITY,
        score: feedback.clarity / 5,
        source: MetricSource.STUDENT_FEEDBACK,
        confidence: 0.85
      });
    }
    metrics.push({
      type: QualityMetricType.PEDAGOGICAL_EFFECTIVENESS,
      score: feedback.didUnderstand ? 0.9 : feedback.needMoreHelp ? 0.4 : 0.5,
      source: MetricSource.STUDENT_FEEDBACK,
      confidence: 0.8
    });
    return metrics;
  }
  deriveExpertMetrics(review) {
    const metrics = [];
    metrics.push({
      type: QualityMetricType.ACCURACY,
      score: review.accuracyScore,
      source: MetricSource.EXPERT_REVIEW,
      confidence: 0.95
    });
    metrics.push({
      type: QualityMetricType.PEDAGOGICAL_EFFECTIVENESS,
      score: review.pedagogyScore,
      source: MetricSource.EXPERT_REVIEW,
      confidence: 0.95
    });
    metrics.push({
      type: QualityMetricType.RELEVANCE,
      score: review.appropriatenessScore,
      source: MetricSource.EXPERT_REVIEW,
      confidence: 0.95
    });
    return metrics;
  }
  deriveOutcomeMetrics(outcome) {
    const metrics = [];
    const successRate = outcome.subsequentAttempts > 0 ? outcome.successfulAttempts / outcome.subsequentAttempts : 0.5;
    metrics.push({
      type: QualityMetricType.PEDAGOGICAL_EFFECTIVENESS,
      score: successRate,
      source: MetricSource.OUTCOME_BASED,
      confidence: 0.9,
      notes: `${outcome.successfulAttempts}/${outcome.subsequentAttempts} successful`
    });
    if (outcome.masteryImprovement !== void 0) {
      const improvementScore = Math.min(1, Math.max(0, 0.5 + outcome.masteryImprovement / 20));
      metrics.push({
        type: QualityMetricType.HELPFULNESS,
        score: improvementScore,
        source: MetricSource.OUTCOME_BASED,
        confidence: 0.85,
        notes: `Mastery improved by ${outcome.masteryImprovement}%`
      });
    }
    if (outcome.timeSpentLearning > 0) {
      const engagementScore = Math.min(1, outcome.timeSpentLearning / 30);
      metrics.push({
        type: QualityMetricType.ENGAGEMENT,
        score: engagementScore,
        source: MetricSource.OUTCOME_BASED,
        confidence: 0.7
      });
    }
    return metrics;
  }
  calculateCalibrationBuckets(records) {
    const buckets = [];
    const levelRanges = [
      { level: ConfidenceLevel.HIGH, min: 0.8, max: 1 },
      { level: ConfidenceLevel.MEDIUM, min: 0.4, max: 0.8 },
      { level: ConfidenceLevel.LOW, min: 0.2, max: 0.4 },
      { level: ConfidenceLevel.UNCERTAIN, min: 0, max: 0.2 }
    ];
    for (const range of levelRanges) {
      const levelRecords = records.filter(
        (r) => (r.confidenceScore ?? 0) >= range.min && (r.confidenceScore ?? 0) < range.max
      );
      if (levelRecords.length === 0) {
        buckets.push({
          level: range.level,
          count: 0,
          expectedAccuracy: (range.min + range.max) / 2,
          actualAccuracy: 0,
          isOverconfident: false,
          isUnderconfident: false
        });
        continue;
      }
      const expectedAccuracy = levelRecords.reduce((sum, r) => sum + (r.confidenceScore ?? 0), 0) / levelRecords.length;
      const actualAccuracy = levelRecords.reduce((sum, r) => sum + r.overallQuality, 0) / levelRecords.length;
      buckets.push({
        level: range.level,
        count: levelRecords.length,
        expectedAccuracy,
        actualAccuracy,
        isOverconfident: expectedAccuracy > actualAccuracy + 0.1,
        isUnderconfident: actualAccuracy > expectedAccuracy + 0.1
      });
    }
    return buckets;
  }
  analyzeClarity(text) {
    let score = 0.7;
    if (text.includes("\n") || text.includes(":") || text.includes("-")) {
      score += 0.1;
    }
    const explanationMarkers = ["because", "therefore", "for example", "in other words"];
    if (explanationMarkers.some((m) => text.toLowerCase().includes(m))) {
      score += 0.1;
    }
    const sentences = text.split(/[.!?]+/);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    if (avgLength > 30) {
      score -= 0.15;
    }
    const technicalTerms = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? [];
    if (technicalTerms.length > 5) {
      score -= 0.1;
    }
    return Math.max(0, Math.min(1, score));
  }
  analyzeCompleteness(text) {
    let score = 0.6;
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 50) score += 0.1;
    if (wordCount >= 100) score += 0.1;
    if (/(?:for example|such as|e\.g\.|like|consider)/i.test(text)) {
      score += 0.1;
    }
    if (/(?:in summary|to summarize|therefore|in conclusion|overall)/i.test(text)) {
      score += 0.1;
    }
    return Math.max(0, Math.min(1, score));
  }
};
function createQualityTracker(config) {
  return new QualityTracker(config);
}

// src/learning-analytics/types.ts
var import_zod14 = require("zod");
var TrendDirection = /* @__PURE__ */ ((TrendDirection2) => {
  TrendDirection2["IMPROVING"] = "improving";
  TrendDirection2["STABLE"] = "stable";
  TrendDirection2["DECLINING"] = "declining";
  TrendDirection2["FLUCTUATING"] = "fluctuating";
  return TrendDirection2;
})(TrendDirection || {});
var MasteryLevel2 = /* @__PURE__ */ ((MasteryLevel3) => {
  MasteryLevel3["NOVICE"] = "novice";
  MasteryLevel3["BEGINNER"] = "beginner";
  MasteryLevel3["INTERMEDIATE"] = "intermediate";
  MasteryLevel3["PROFICIENT"] = "proficient";
  MasteryLevel3["EXPERT"] = "expert";
  return MasteryLevel3;
})(MasteryLevel2 || {});
var LearningStyle = /* @__PURE__ */ ((LearningStyle3) => {
  LearningStyle3["VISUAL"] = "visual";
  LearningStyle3["AUDITORY"] = "auditory";
  LearningStyle3["READING_WRITING"] = "reading_writing";
  LearningStyle3["KINESTHETIC"] = "kinesthetic";
  return LearningStyle3;
})(LearningStyle || {});
var ContentType = /* @__PURE__ */ ((ContentType2) => {
  ContentType2["VIDEO"] = "video";
  ContentType2["ARTICLE"] = "article";
  ContentType2["EXERCISE"] = "exercise";
  ContentType2["QUIZ"] = "quiz";
  ContentType2["PROJECT"] = "project";
  ContentType2["TUTORIAL"] = "tutorial";
  ContentType2["DOCUMENTATION"] = "documentation";
  return ContentType2;
})(ContentType || {});
var RecommendationPriority = /* @__PURE__ */ ((RecommendationPriority2) => {
  RecommendationPriority2["CRITICAL"] = "critical";
  RecommendationPriority2["HIGH"] = "high";
  RecommendationPriority2["MEDIUM"] = "medium";
  RecommendationPriority2["LOW"] = "low";
  return RecommendationPriority2;
})(RecommendationPriority || {});
var RecommendationReason = /* @__PURE__ */ ((RecommendationReason2) => {
  RecommendationReason2["KNOWLEDGE_GAP"] = "knowledge_gap";
  RecommendationReason2["SKILL_DECAY"] = "skill_decay";
  RecommendationReason2["PREREQUISITE"] = "prerequisite";
  RecommendationReason2["REINFORCEMENT"] = "reinforcement";
  RecommendationReason2["EXPLORATION"] = "exploration";
  RecommendationReason2["CHALLENGE"] = "challenge";
  RecommendationReason2["REVIEW"] = "review";
  return RecommendationReason2;
})(RecommendationReason || {});
var TimePeriod = /* @__PURE__ */ ((TimePeriod2) => {
  TimePeriod2["DAILY"] = "daily";
  TimePeriod2["WEEKLY"] = "weekly";
  TimePeriod2["MONTHLY"] = "monthly";
  TimePeriod2["QUARTERLY"] = "quarterly";
  TimePeriod2["ALL_TIME"] = "all_time";
  return TimePeriod2;
})(TimePeriod || {});
var AssessmentSource = /* @__PURE__ */ ((AssessmentSource2) => {
  AssessmentSource2["QUIZ"] = "quiz";
  AssessmentSource2["EXERCISE"] = "exercise";
  AssessmentSource2["PROJECT"] = "project";
  AssessmentSource2["PEER_REVIEW"] = "peer_review";
  AssessmentSource2["SELF_ASSESSMENT"] = "self_assessment";
  AssessmentSource2["AI_EVALUATION"] = "ai_evaluation";
  return AssessmentSource2;
})(AssessmentSource || {});
var LearningSessionInputSchema = import_zod14.z.object({
  userId: import_zod14.z.string().min(1),
  topicId: import_zod14.z.string().min(1),
  startTime: import_zod14.z.date().optional(),
  duration: import_zod14.z.number().min(0).optional(),
  activitiesCompleted: import_zod14.z.number().min(0).optional(),
  questionsAnswered: import_zod14.z.number().min(0).optional(),
  correctAnswers: import_zod14.z.number().min(0).optional(),
  conceptsCovered: import_zod14.z.array(import_zod14.z.string()).optional(),
  focusScore: import_zod14.z.number().min(0).max(1).optional()
});
var SkillAssessmentInputSchema = import_zod14.z.object({
  userId: import_zod14.z.string().min(1),
  skillId: import_zod14.z.string().min(1),
  skillName: import_zod14.z.string().min(1).optional(),
  score: import_zod14.z.number().min(0).max(100),
  maxScore: import_zod14.z.number().min(1).optional().default(100),
  source: import_zod14.z.nativeEnum(AssessmentSource),
  duration: import_zod14.z.number().min(0).optional(),
  questionsAnswered: import_zod14.z.number().min(0).optional(),
  correctAnswers: import_zod14.z.number().min(0).optional(),
  evidence: import_zod14.z.array(
    import_zod14.z.object({
      type: import_zod14.z.string(),
      description: import_zod14.z.string(),
      score: import_zod14.z.number().optional(),
      timestamp: import_zod14.z.date(),
      weight: import_zod14.z.number().min(0).max(1)
    })
  ).optional()
});
var RecommendationFeedbackSchema = import_zod14.z.object({
  recommendationId: import_zod14.z.string().min(1),
  userId: import_zod14.z.string().min(1),
  isHelpful: import_zod14.z.boolean(),
  rating: import_zod14.z.number().min(1).max(5).optional(),
  comment: import_zod14.z.string().optional(),
  timeSpent: import_zod14.z.number().min(0).optional(),
  completed: import_zod14.z.boolean().optional()
});

// src/learning-analytics/progress-analyzer.ts
var InMemoryLearningSessionStore = class {
  sessions = /* @__PURE__ */ new Map();
  async create(session) {
    const newSession = {
      ...session,
      id: v4_default()
    };
    this.sessions.set(newSession.id, newSession);
    return newSession;
  }
  async get(id) {
    return this.sessions.get(id) ?? null;
  }
  async getByUser(userId, limit) {
    const userSessions = Array.from(this.sessions.values()).filter((s) => s.userId === userId).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return limit ? userSessions.slice(0, limit) : userSessions;
  }
  async getByUserAndTopic(userId, topicId) {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId && s.topicId === topicId).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }
  async getByPeriod(userId, start, end) {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.startTime >= start && s.startTime <= end
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
  async update(id, updates) {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Learning session not found: ${id}`);
    }
    const updated = { ...session, ...updates, id: session.id };
    this.sessions.set(id, updated);
    return updated;
  }
};
var InMemoryTopicProgressStore = class {
  progress = /* @__PURE__ */ new Map();
  getKey(userId, topicId) {
    return `${userId}:${topicId}`;
  }
  async get(userId, topicId) {
    return this.progress.get(this.getKey(userId, topicId)) ?? null;
  }
  async getByUser(userId) {
    return Array.from(this.progress.values()).filter((p) => p.userId === userId);
  }
  async upsert(progress) {
    this.progress.set(this.getKey(progress.userId, progress.topicId), progress);
    return progress;
  }
  async getByMasteryLevel(userId, level) {
    return Array.from(this.progress.values()).filter(
      (p) => p.userId === userId && p.masteryLevel === level
    );
  }
};
var InMemoryLearningGapStore = class {
  gaps = /* @__PURE__ */ new Map();
  async create(gap) {
    const newGap = {
      ...gap,
      id: v4_default()
    };
    this.gaps.set(newGap.id, newGap);
    return newGap;
  }
  async get(id) {
    return this.gaps.get(id) ?? null;
  }
  async getByUser(userId, includeResolved = false) {
    return Array.from(this.gaps.values()).filter(
      (g) => g.userId === userId && (includeResolved || !g.isResolved)
    );
  }
  async resolve(id) {
    const gap = this.gaps.get(id);
    if (!gap) {
      throw new Error(`Learning gap not found: ${id}`);
    }
    const resolved = { ...gap, isResolved: true, resolvedAt: /* @__PURE__ */ new Date() };
    this.gaps.set(id, resolved);
    return resolved;
  }
  async getBySeverity(userId, severity) {
    return Array.from(this.gaps.values()).filter(
      (g) => g.userId === userId && g.severity === severity && !g.isResolved
    );
  }
};
var defaultLogger7 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var DEFAULT_MASTERY_THRESHOLDS = {
  ["novice" /* NOVICE */]: 0,
  ["beginner" /* BEGINNER */]: 20,
  ["intermediate" /* INTERMEDIATE */]: 40,
  ["proficient" /* PROFICIENT */]: 70,
  ["expert" /* EXPERT */]: 90
};
var ProgressAnalyzer = class {
  sessionStore;
  progressStore;
  gapStore;
  logger;
  masteryThresholds;
  gapDetectionThreshold;
  constructor(config = {}) {
    this.sessionStore = config.sessionStore ?? new InMemoryLearningSessionStore();
    this.progressStore = config.progressStore ?? new InMemoryTopicProgressStore();
    this.gapStore = config.gapStore ?? new InMemoryLearningGapStore();
    this.logger = config.logger ?? defaultLogger7;
    this.masteryThresholds = { ...DEFAULT_MASTERY_THRESHOLDS, ...config.masteryThresholds };
    this.gapDetectionThreshold = config.gapDetectionThreshold ?? 0.4;
  }
  /**
   * Record a learning session
   */
  async recordSession(input) {
    const validated = LearningSessionInputSchema.parse(input);
    this.logger.info("Recording learning session", {
      userId: validated.userId,
      topicId: validated.topicId
    });
    const session = await this.sessionStore.create({
      userId: validated.userId,
      topicId: validated.topicId,
      startTime: validated.startTime ?? /* @__PURE__ */ new Date(),
      duration: validated.duration ?? 0,
      activitiesCompleted: validated.activitiesCompleted ?? 0,
      questionsAnswered: validated.questionsAnswered ?? 0,
      correctAnswers: validated.correctAnswers ?? 0,
      conceptsCovered: validated.conceptsCovered ?? [],
      focusScore: validated.focusScore
    });
    await this.updateTopicProgress(validated.userId, validated.topicId);
    return session;
  }
  /**
   * End a learning session
   */
  async endSession(sessionId) {
    const session = await this.sessionStore.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    const endTime = /* @__PURE__ */ new Date();
    const duration = session.startTime ? Math.round((endTime.getTime() - session.startTime.getTime()) / 6e4) : session.duration;
    const updated = await this.sessionStore.update(sessionId, {
      endTime,
      duration
    });
    await this.updateTopicProgress(session.userId, session.topicId);
    this.logger.info("Session ended", { sessionId, duration });
    return updated;
  }
  /**
   * Get topic progress for a user
   */
  async getTopicProgress(userId, topicId) {
    return this.progressStore.get(userId, topicId);
  }
  /**
   * Get all topic progress for a user
   */
  async getAllProgress(userId) {
    return this.progressStore.getByUser(userId);
  }
  /**
   * Detect learning gaps for a user
   */
  async detectGaps(userId) {
    this.logger.info("Detecting learning gaps", { userId });
    const allProgress = await this.progressStore.getByUser(userId);
    const existingGaps = await this.gapStore.getByUser(userId, false);
    const existingGapConcepts = new Set(existingGaps.map((g) => g.conceptId));
    const newGaps = [];
    for (const progress of allProgress) {
      for (const concept of progress.conceptsInProgress) {
        if (existingGapConcepts.has(concept)) continue;
        const sessions = await this.sessionStore.getByUserAndTopic(userId, progress.topicId);
        const gapAnalysis = this.analyzeConceptGap(concept, sessions, progress);
        if (gapAnalysis.isGap) {
          const gap = await this.gapStore.create({
            userId,
            conceptId: concept,
            conceptName: concept,
            // In real implementation, would lookup name
            topicId: progress.topicId,
            severity: gapAnalysis.severity,
            detectedAt: /* @__PURE__ */ new Date(),
            evidence: gapAnalysis.evidence,
            suggestedActions: this.generateGapActions(gapAnalysis.severity),
            isResolved: false
          });
          newGaps.push(gap);
        }
      }
      if (progress.trend === "declining" /* DECLINING */ && progress.masteryScore < 50) {
        const conceptsToCheck = progress.conceptsLearned.slice(-3);
        for (const concept of conceptsToCheck) {
          if (existingGapConcepts.has(concept)) continue;
          const gap = await this.gapStore.create({
            userId,
            conceptId: concept,
            conceptName: concept,
            topicId: progress.topicId,
            severity: "moderate",
            detectedAt: /* @__PURE__ */ new Date(),
            evidence: [
              {
                type: "low_confidence",
                description: "Declining progress trend detected",
                timestamp: /* @__PURE__ */ new Date()
              }
            ],
            suggestedActions: ["Review recent material", "Practice exercises"],
            isResolved: false
          });
          newGaps.push(gap);
        }
      }
    }
    this.logger.info("Gap detection complete", {
      userId,
      newGapsFound: newGaps.length
    });
    return newGaps;
  }
  /**
   * Get learning gaps for a user
   */
  async getGaps(userId, includeResolved = false) {
    return this.gapStore.getByUser(userId, includeResolved);
  }
  /**
   * Resolve a learning gap
   */
  async resolveGap(gapId) {
    return this.gapStore.resolve(gapId);
  }
  /**
   * Analyze progress trends
   */
  async analyzeTrends(userId, period = "weekly" /* WEEKLY */) {
    this.logger.info("Analyzing progress trends", { userId, period });
    const periodDays = this.getPeriodDays(period);
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1e3);
    const sessions = await this.sessionStore.getByPeriod(userId, start, now);
    const trends = [];
    const masteryTrend = this.calculateTrend(
      sessions,
      "mastery",
      (s) => s.correctAnswers / Math.max(1, s.questionsAnswered) * 100,
      period
    );
    trends.push(masteryTrend);
    const timeTrend = this.calculateTrend(
      sessions,
      "time_spent",
      (s) => s.duration,
      period
    );
    trends.push(timeTrend);
    const engagementTrend = this.calculateTrend(
      sessions,
      "engagement",
      (s) => s.focusScore ?? 0.5,
      period
    );
    trends.push(engagementTrend);
    return trends;
  }
  /**
   * Generate a progress report
   */
  async generateReport(userId, period = "weekly" /* WEEKLY */) {
    this.logger.info("Generating progress report", { userId, period });
    const periodDays = this.getPeriodDays(period);
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1e3);
    const sessions = await this.sessionStore.getByPeriod(userId, start, now);
    const allProgress = await this.progressStore.getByUser(userId);
    const gaps = await this.gapStore.getByUser(userId, false);
    const trends = await this.analyzeTrends(userId, period);
    const summary = this.calculateSummary(sessions, allProgress);
    const achievements = this.detectAchievements(sessions, allProgress, summary);
    const report = {
      id: v4_default(),
      userId,
      generatedAt: now,
      period,
      periodStart: start,
      periodEnd: now,
      summary,
      topicBreakdown: allProgress,
      trends,
      gaps,
      achievements,
      recommendations: this.generateRecommendations(summary, gaps, trends)
    };
    this.logger.info("Report generated", { userId, reportId: report.id });
    return report;
  }
  /**
   * Get a progress snapshot
   */
  async getSnapshot(userId, period = "weekly" /* WEEKLY */) {
    const periodDays = this.getPeriodDays(period);
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1e3);
    const sessions = await this.sessionStore.getByPeriod(userId, start, now);
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const uniqueTopics = new Set(sessions.map((s) => s.topicId));
    const allConcepts = new Set(sessions.flatMap((s) => s.conceptsCovered));
    const snapshot = {
      id: v4_default(),
      userId,
      period,
      periodStart: start,
      periodEnd: now,
      totalTimeSpent,
      sessionsCount: sessions.length,
      topicsProgressed: uniqueTopics.size,
      conceptsLearned: allConcepts.size,
      averageQuizScore: totalQuestions > 0 ? totalCorrect / totalQuestions * 100 : 0,
      streakDays: this.calculateStreak(sessions),
      engagementScore: this.calculateEngagement(sessions),
      productivityScore: this.calculateProductivity(sessions, totalTimeSpent),
      createdAt: now
    };
    return snapshot;
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  async updateTopicProgress(userId, topicId) {
    const sessions = await this.sessionStore.getByUserAndTopic(userId, topicId);
    if (sessions.length === 0) return;
    const existing = await this.progressStore.get(userId, topicId);
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const allConcepts = new Set(sessions.flatMap((s) => s.conceptsCovered));
    const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions * 100 : 0;
    const masteryScore = this.calculateMasteryScore(accuracy, totalTime, sessions.length);
    const masteryLevel = this.scoreToLevel(masteryScore);
    const recentSessions = sessions.slice(0, Math.min(5, sessions.length));
    const olderSessions = sessions.slice(5, 10);
    const trend = this.determineTrend(recentSessions, olderSessions);
    const progress = {
      topicId,
      topicName: topicId,
      // In real implementation, would lookup name
      userId,
      masteryLevel,
      masteryScore,
      completionPercentage: Math.min(100, allConcepts.size / 10 * 100),
      // Assuming 10 concepts per topic
      timeSpent: totalTime,
      sessionsCount: sessions.length,
      lastAccessedAt: sessions[0]?.startTime ?? /* @__PURE__ */ new Date(),
      startedAt: existing?.startedAt ?? sessions[sessions.length - 1]?.startTime ?? /* @__PURE__ */ new Date(),
      conceptsLearned: Array.from(allConcepts).slice(0, 10),
      conceptsInProgress: [],
      conceptsNotStarted: [],
      trend,
      trendScore: this.calculateTrendScore(recentSessions, olderSessions)
    };
    await this.progressStore.upsert(progress);
  }
  calculateMasteryScore(accuracy, totalTime, sessionCount) {
    const accuracyWeight = 0.5;
    const timeWeight = 0.3;
    const consistencyWeight = 0.2;
    const normalizedTime = Math.min(1, totalTime / 300) * 100;
    const normalizedConsistency = Math.min(1, sessionCount / 10) * 100;
    return Math.round(
      accuracy * accuracyWeight + normalizedTime * timeWeight + normalizedConsistency * consistencyWeight
    );
  }
  scoreToLevel(score) {
    if (score >= this.masteryThresholds["expert" /* EXPERT */]) return "expert" /* EXPERT */;
    if (score >= this.masteryThresholds["proficient" /* PROFICIENT */]) return "proficient" /* PROFICIENT */;
    if (score >= this.masteryThresholds["intermediate" /* INTERMEDIATE */]) return "intermediate" /* INTERMEDIATE */;
    if (score >= this.masteryThresholds["beginner" /* BEGINNER */]) return "beginner" /* BEGINNER */;
    return "novice" /* NOVICE */;
  }
  determineTrend(recent, older) {
    if (older.length === 0) return "stable" /* STABLE */;
    const recentAvg = this.calculateSessionAccuracy(recent);
    const olderAvg = this.calculateSessionAccuracy(older);
    const diff = recentAvg - olderAvg;
    if (diff > 10) return "improving" /* IMPROVING */;
    if (diff < -10) return "declining" /* DECLINING */;
    const recentVariance = this.calculateVariance(recent.map(
      (s) => s.questionsAnswered > 0 ? s.correctAnswers / s.questionsAnswered * 100 : 0
    ));
    if (recentVariance > 400) return "fluctuating" /* FLUCTUATING */;
    return "stable" /* STABLE */;
  }
  calculateSessionAccuracy(sessions) {
    const total = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const correct = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    return total > 0 ? correct / total * 100 : 0;
  }
  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
  calculateTrendScore(recent, older) {
    if (older.length === 0) return 0;
    const recentAvg = this.calculateSessionAccuracy(recent);
    const olderAvg = this.calculateSessionAccuracy(older);
    return recentAvg - olderAvg;
  }
  analyzeConceptGap(concept, sessions, _progress) {
    const evidence = [];
    let gapScore = 0;
    const conceptSessions = sessions.filter((s) => s.conceptsCovered.includes(concept));
    const avgAccuracy = this.calculateSessionAccuracy(conceptSessions);
    if (avgAccuracy < 50) {
      evidence.push({
        type: "repeated_mistakes",
        description: `Low accuracy (${avgAccuracy.toFixed(0)}%) on concept`,
        score: avgAccuracy,
        timestamp: /* @__PURE__ */ new Date()
      });
      gapScore += 0.4;
    }
    const avgDuration = conceptSessions.reduce((sum, s) => sum + s.duration, 0) / Math.max(1, conceptSessions.length);
    if (avgDuration > 30 && avgAccuracy < 70) {
      evidence.push({
        type: "time_struggle",
        description: "Long time spent with low accuracy indicates struggle",
        timestamp: /* @__PURE__ */ new Date()
      });
      gapScore += 0.3;
    }
    let severity = "minor";
    if (gapScore >= 0.6) severity = "critical";
    else if (gapScore >= 0.3) severity = "moderate";
    return {
      isGap: gapScore >= this.gapDetectionThreshold,
      severity,
      evidence
    };
  }
  generateGapActions(severity) {
    switch (severity) {
      case "critical":
        return [
          "Review foundational concepts",
          "Complete practice exercises",
          "Watch tutorial videos",
          "Seek mentor support"
        ];
      case "moderate":
        return [
          "Review recent material",
          "Practice with examples",
          "Take a quiz to assess understanding"
        ];
      case "minor":
        return ["Quick review recommended", "Try a few practice problems"];
      default:
        return ["Continue learning"];
    }
  }
  calculateTrend(sessions, metric, valueExtractor, period) {
    const dataPoints = [];
    const dailyData = /* @__PURE__ */ new Map();
    for (const session of sessions) {
      const dateKey = session.startTime.toISOString().split("T")[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey).push(valueExtractor(session));
    }
    for (const [date, values] of dailyData.entries()) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      dataPoints.push({ date: new Date(date), value: avg });
    }
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
    let direction = "stable" /* STABLE */;
    let changePercentage = 0;
    if (dataPoints.length >= 2) {
      const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
      const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));
      const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
      changePercentage = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg * 100 : 0;
      if (changePercentage > 10) direction = "improving" /* IMPROVING */;
      else if (changePercentage < -10) direction = "declining" /* DECLINING */;
      else direction = "stable" /* STABLE */;
    }
    const insight = this.generateTrendInsight(metric, direction, changePercentage);
    return {
      userId: sessions[0]?.userId ?? "",
      metric,
      direction,
      changePercentage,
      dataPoints,
      period,
      analysisDate: /* @__PURE__ */ new Date(),
      insight
    };
  }
  generateTrendInsight(metric, direction, change) {
    const absChange = Math.abs(change).toFixed(0);
    switch (direction) {
      case "improving" /* IMPROVING */:
        return `Your ${metric.replace("_", " ")} has improved by ${absChange}%`;
      case "declining" /* DECLINING */:
        return `Your ${metric.replace("_", " ")} has declined by ${absChange}%`;
      case "stable" /* STABLE */:
        return `Your ${metric.replace("_", " ")} has remained stable`;
      case "fluctuating" /* FLUCTUATING */:
        return `Your ${metric.replace("_", " ")} has been fluctuating`;
      default:
        return "";
    }
  }
  getPeriodDays(period) {
    switch (period) {
      case "daily" /* DAILY */:
        return 1;
      case "weekly" /* WEEKLY */:
        return 7;
      case "monthly" /* MONTHLY */:
        return 30;
      case "quarterly" /* QUARTERLY */:
        return 90;
      case "all_time" /* ALL_TIME */:
        return 365 * 5;
      // 5 years
      default:
        return 7;
    }
  }
  calculateSummary(sessions, progress) {
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgSessionDuration = sessions.length > 0 ? totalTimeSpent / sessions.length : 0;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const completedTopics = progress.filter((p) => p.completionPercentage >= 100).length;
    const inProgressTopics = progress.filter(
      (p) => p.completionPercentage > 0 && p.completionPercentage < 100
    ).length;
    const overallMastery = progress.length > 0 ? progress.reduce((sum, p) => sum + p.masteryScore, 0) / progress.length : 0;
    const engagementScore = this.calculateEngagement(sessions);
    let engagementLevel = "medium";
    if (engagementScore > 0.7) engagementLevel = "high";
    else if (engagementScore < 0.4) engagementLevel = "low";
    return {
      totalTimeSpent,
      averageSessionDuration: Math.round(avgSessionDuration),
      topicsCompleted: completedTopics,
      topicsInProgress: inProgressTopics,
      overallMastery: Math.round(overallMastery),
      quizzesCompleted: sessions.filter((s) => s.questionsAnswered > 0).length,
      averageQuizScore: totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0,
      currentStreak: this.calculateStreak(sessions),
      longestStreak: this.calculateLongestStreak(sessions),
      engagementLevel
    };
  }
  calculateStreak(sessions) {
    if (sessions.length === 0) return 0;
    const dates = new Set(sessions.map((s) => s.startTime.toISOString().split("T")[0]));
    const sortedDates = Array.from(dates).sort().reverse();
    let streak = 0;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = /* @__PURE__ */ new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split("T")[0];
      if (sortedDates.includes(expectedDateStr)) {
        streak++;
      } else if (i === 0 && sortedDates[0] !== today) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  }
  calculateLongestStreak(sessions) {
    if (sessions.length === 0) return 0;
    const dates = Array.from(
      new Set(sessions.map((s) => s.startTime.toISOString().split("T")[0]))
    ).sort();
    let longestStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1e3);
      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    return longestStreak;
  }
  calculateEngagement(sessions) {
    if (sessions.length === 0) return 0;
    const focusScores = sessions.filter((s) => s.focusScore !== void 0).map((s) => s.focusScore);
    const avgFocus = focusScores.length > 0 ? focusScores.reduce((a, b) => a + b, 0) / focusScores.length : 0.5;
    const avgActivities = sessions.reduce((sum, s) => sum + s.activitiesCompleted, 0) / sessions.length;
    const normalizedActivities = Math.min(1, avgActivities / 5);
    return avgFocus * 0.6 + normalizedActivities * 0.4;
  }
  calculateProductivity(sessions, totalTime) {
    if (totalTime === 0) return 0;
    const totalConcepts = new Set(sessions.flatMap((s) => s.conceptsCovered)).size;
    const totalActivities = sessions.reduce((sum, s) => sum + s.activitiesCompleted, 0);
    const conceptsPerHour = totalConcepts / (totalTime / 60);
    const activitiesPerHour = totalActivities / (totalTime / 60);
    return Math.min(1, (conceptsPerHour / 2 + activitiesPerHour / 10) / 2);
  }
  detectAchievements(sessions, allProgress, summary) {
    const achievements = [];
    const now = /* @__PURE__ */ new Date();
    if (summary.currentStreak >= 7) {
      achievements.push({
        id: v4_default(),
        userId: sessions[0]?.userId ?? "",
        type: "streak",
        title: "Week Warrior",
        description: "7-day learning streak",
        earnedAt: now,
        points: 100
      });
    }
    const expertTopics = allProgress.filter((p) => p.masteryLevel === "expert" /* EXPERT */);
    if (expertTopics.length > 0) {
      achievements.push({
        id: v4_default(),
        userId: sessions[0]?.userId ?? "",
        type: "mastery",
        title: "Topic Master",
        description: `Achieved expert level in ${expertTopics[0].topicName}`,
        earnedAt: now,
        points: 500
      });
    }
    if (summary.totalTimeSpent >= 600) {
      achievements.push({
        id: v4_default(),
        userId: sessions[0]?.userId ?? "",
        type: "dedication",
        title: "Dedicated Learner",
        description: "10+ hours of learning",
        earnedAt: now,
        points: 200
      });
    }
    return achievements;
  }
  generateRecommendations(summary, gaps, trends) {
    const recommendations = [];
    const criticalGaps = gaps.filter((g) => g.severity === "critical");
    if (criticalGaps.length > 0) {
      recommendations.push(
        `Focus on resolving ${criticalGaps.length} critical knowledge gap(s)`
      );
    }
    const decliningTrends = trends.filter((t) => t.direction === "declining" /* DECLINING */);
    for (const trend of decliningTrends) {
      recommendations.push(`Work on improving your ${trend.metric.replace("_", " ")}`);
    }
    if (summary.engagementLevel === "low") {
      recommendations.push("Try to increase your daily learning engagement");
    }
    if (summary.currentStreak === 0) {
      recommendations.push("Start a new learning streak today!");
    }
    if (summary.topicsInProgress > 3) {
      recommendations.push("Consider completing some topics before starting new ones");
    }
    return recommendations.slice(0, 5);
  }
};
function createProgressAnalyzer(config) {
  return new ProgressAnalyzer(config);
}

// src/learning-analytics/skill-assessor.ts
var InMemorySkillAssessmentStore = class {
  assessments = /* @__PURE__ */ new Map();
  userSkillIndex = /* @__PURE__ */ new Map();
  // `userId:skillId` -> assessmentId
  getKey(userId, skillId) {
    return `${userId}:${skillId}`;
  }
  async create(assessment) {
    const newAssessment = {
      ...assessment,
      id: v4_default()
    };
    const previousKey = this.getKey(assessment.userId, assessment.skillId);
    const previousId = this.userSkillIndex.get(previousKey);
    if (previousId) {
      const previous = this.assessments.get(previousId);
      if (previous) {
        newAssessment.previousLevel = previous.level;
        newAssessment.previousScore = previous.score;
      }
    }
    this.assessments.set(newAssessment.id, newAssessment);
    this.userSkillIndex.set(previousKey, newAssessment.id);
    return newAssessment;
  }
  async get(id) {
    return this.assessments.get(id) ?? null;
  }
  async getByUserAndSkill(userId, skillId) {
    const key = this.getKey(userId, skillId);
    const id = this.userSkillIndex.get(key);
    if (!id) return null;
    return this.assessments.get(id) ?? null;
  }
  async getByUser(userId) {
    const userAssessments = [];
    const seen = /* @__PURE__ */ new Set();
    for (const [key, id] of this.userSkillIndex.entries()) {
      if (key.startsWith(`${userId}:`)) {
        const assessment = this.assessments.get(id);
        if (assessment && !seen.has(assessment.skillId)) {
          userAssessments.push(assessment);
          seen.add(assessment.skillId);
        }
      }
    }
    return userAssessments.sort((a, b) => b.assessedAt.getTime() - a.assessedAt.getTime());
  }
  async getHistory(userId, skillId, limit) {
    const history = Array.from(this.assessments.values()).filter((a) => a.userId === userId && a.skillId === skillId).sort((a, b) => a.assessedAt.getTime() - b.assessedAt.getTime());
    return limit ? history.slice(0, limit) : history;
  }
};
var defaultLogger8 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var DEFAULT_MASTERY_THRESHOLDS2 = {
  ["novice" /* NOVICE */]: 0,
  ["beginner" /* BEGINNER */]: 20,
  ["intermediate" /* INTERMEDIATE */]: 40,
  ["proficient" /* PROFICIENT */]: 70,
  ["expert" /* EXPERT */]: 90
};
var SkillAssessor = class {
  store;
  logger;
  skills = /* @__PURE__ */ new Map();
  masteryThresholds;
  decayRatePerDay;
  assessmentValidityDays;
  constructor(config = {}) {
    this.store = config.store ?? new InMemorySkillAssessmentStore();
    this.logger = config.logger ?? defaultLogger8;
    this.masteryThresholds = { ...DEFAULT_MASTERY_THRESHOLDS2, ...config.masteryThresholds };
    this.decayRatePerDay = config.decayRatePerDay ?? 0.5;
    this.assessmentValidityDays = config.assessmentValidityDays ?? 30;
    if (config.skills) {
      for (const skill of config.skills) {
        this.skills.set(skill.id, skill);
      }
    }
  }
  /**
   * Register a skill
   */
  registerSkill(skill) {
    this.skills.set(skill.id, skill);
    this.logger.debug("Skill registered", { skillId: skill.id, name: skill.name });
  }
  /**
   * Get a registered skill
   */
  getSkill(skillId) {
    return this.skills.get(skillId);
  }
  /**
   * List all registered skills, optionally filtered by category
   */
  listSkills(category) {
    const skills = Array.from(this.skills.values());
    if (category) {
      return skills.filter((s) => s.category === category);
    }
    return skills;
  }
  /**
   * Assess a skill
   */
  async assessSkill(input) {
    const validated = SkillAssessmentInputSchema.parse(input);
    this.logger.info("Assessing skill", {
      userId: validated.userId,
      skillId: validated.skillId,
      score: validated.score
    });
    let skillName = validated.skillName;
    if (!skillName) {
      const skill = this.skills.get(validated.skillId);
      skillName = skill?.name ?? validated.skillId;
    }
    const level = this.scoreToLevel(validated.score);
    const confidence = this.calculateConfidence(validated.source, validated.evidence);
    const assessment = await this.store.create({
      userId: validated.userId,
      skillId: validated.skillId,
      skillName,
      level,
      score: validated.score,
      confidence,
      source: validated.source,
      evidence: validated.evidence ?? [],
      assessedAt: /* @__PURE__ */ new Date(),
      validUntil: new Date(Date.now() + this.assessmentValidityDays * 24 * 60 * 60 * 1e3)
    });
    this.logger.info("Skill assessed", {
      userId: validated.userId,
      skillId: validated.skillId,
      level,
      score: validated.score
    });
    return assessment;
  }
  /**
   * Get current assessment for a skill
   */
  async getAssessment(userId, skillId) {
    return this.store.getByUserAndSkill(userId, skillId);
  }
  /**
   * Get all assessments for a user
   */
  async getUserAssessments(userId) {
    return this.store.getByUser(userId);
  }
  /**
   * Get assessment history for a skill
   */
  async getAssessmentHistory(userId, skillId, limit) {
    return this.store.getHistory(userId, skillId, limit);
  }
  /**
   * Generate skill map for a user
   */
  async generateSkillMap(userId) {
    this.logger.info("Generating skill map", { userId });
    const assessments = await this.store.getByUser(userId);
    const assessmentMap = new Map(assessments.map((a) => [a.skillId, a]));
    const nodes = [];
    let overallScore = 0;
    let assessedCount = 0;
    for (const skill of this.skills.values()) {
      const assessment = assessmentMap.get(skill.id);
      const isUnlocked = skill.prerequisites.every((prereqId) => {
        const prereqAssessment = assessmentMap.get(prereqId);
        return prereqAssessment && prereqAssessment.score >= this.masteryThresholds["beginner" /* BEGINNER */];
      });
      const node = {
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        level: assessment?.level ?? "novice" /* NOVICE */,
        score: assessment?.score ?? 0,
        isUnlocked,
        dependencies: skill.prerequisites,
        dependents: this.findDependents(skill.id),
        lastAssessed: assessment?.assessedAt
      };
      nodes.push(node);
      if (assessment) {
        overallScore += assessment.score;
        assessedCount++;
      }
    }
    const avgScore = assessedCount > 0 ? overallScore / assessedCount : 0;
    const overallLevel = this.scoreToLevel(avgScore);
    const sortedByScore = [...nodes].filter((n) => n.score > 0).sort((a, b) => b.score - a.score);
    const strongestSkills = sortedByScore.slice(0, 3).map((n) => n.skillId);
    const weakestSkills = sortedByScore.slice(-3).reverse().filter((n) => n.score > 0).map((n) => n.skillId);
    const suggestedFocus = this.suggestFocusAreas(nodes, assessments);
    const skillMap = {
      userId,
      skills: nodes,
      lastUpdated: /* @__PURE__ */ new Date(),
      overallLevel,
      strongestSkills,
      weakestSkills,
      suggestedFocus
    };
    this.logger.info("Skill map generated", {
      userId,
      skillCount: nodes.length,
      overallLevel
    });
    return skillMap;
  }
  /**
   * Predict skill decay
   */
  async predictDecay(userId) {
    this.logger.info("Predicting skill decay", { userId });
    const assessments = await this.store.getByUser(userId);
    const decayPredictions = [];
    const now = /* @__PURE__ */ new Date();
    for (const assessment of assessments) {
      const daysSinceAssessment = Math.floor(
        (now.getTime() - assessment.assessedAt.getTime()) / (24 * 60 * 60 * 1e3)
      );
      if (daysSinceAssessment < 1) continue;
      const decayAmount = daysSinceAssessment * this.decayRatePerDay;
      const predictedScore = Math.max(0, assessment.score - decayAmount);
      const decayRate = this.calculateDecayRate(assessment);
      let riskLevel = "low";
      if (decayAmount > 20) riskLevel = "high";
      else if (decayAmount > 10) riskLevel = "medium";
      const daysUntilSignificantDecay = Math.ceil(assessment.score * 0.2 / this.decayRatePerDay);
      const suggestedReviewDate = new Date(
        assessment.assessedAt.getTime() + daysUntilSignificantDecay * 24 * 60 * 60 * 1e3
      );
      decayPredictions.push({
        skillId: assessment.skillId,
        skillName: assessment.skillName,
        userId,
        currentScore: assessment.score,
        predictedScore,
        decayRate,
        daysSinceLastPractice: daysSinceAssessment,
        riskLevel,
        suggestedReviewDate
      });
    }
    return decayPredictions.sort((a, b) => b.decayRate - a.decayRate);
  }
  /**
   * Compare user skills with benchmarks
   */
  async compareSkills(userId, benchmarkData) {
    this.logger.info("Comparing skills", { userId });
    const assessments = await this.store.getByUser(userId);
    const comparisons = [];
    for (const assessment of assessments) {
      const averageScore = benchmarkData?.get(assessment.skillId) ?? 50;
      const topPerformersScore = averageScore * 1.5;
      let percentile = 50;
      if (assessment.score > averageScore) {
        percentile = 50 + (assessment.score - averageScore) / (100 - averageScore) * 50;
      } else if (assessment.score < averageScore) {
        percentile = assessment.score / averageScore * 50;
      }
      comparisons.push({
        skillId: assessment.skillId,
        skillName: assessment.skillName,
        userScore: assessment.score,
        userLevel: assessment.level,
        averageScore,
        percentile: Math.round(percentile),
        topPerformersScore: Math.min(100, topPerformersScore),
        gap: averageScore - assessment.score
      });
    }
    return comparisons.sort((a, b) => b.gap - a.gap);
  }
  /**
   * Get skill prerequisites status
   */
  async getPrerequisiteStatus(userId, skillId) {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return { met: [], unmet: [], partiallyMet: [] };
    }
    const met = [];
    const unmet = [];
    const partiallyMet = [];
    for (const prereqId of skill.prerequisites) {
      const assessment = await this.store.getByUserAndSkill(userId, prereqId);
      if (!assessment) {
        unmet.push(prereqId);
      } else if (assessment.score >= this.masteryThresholds["intermediate" /* INTERMEDIATE */]) {
        met.push(prereqId);
      } else if (assessment.score >= this.masteryThresholds["beginner" /* BEGINNER */]) {
        partiallyMet.push(prereqId);
      } else {
        unmet.push(prereqId);
      }
    }
    return { met, unmet, partiallyMet };
  }
  /**
   * Calculate skill improvement rate
   */
  async getImprovementRate(userId, skillId) {
    const history = await this.store.getHistory(userId, skillId, 5);
    if (history.length < 2) return 0;
    let totalImprovement = 0;
    for (let i = 0; i < history.length - 1; i++) {
      totalImprovement += history[i].score - history[i + 1].score;
    }
    return totalImprovement / (history.length - 1);
  }
  /**
   * Get skills by mastery level
   */
  async getSkillsByLevel(userId, level) {
    const assessments = await this.store.getByUser(userId);
    return assessments.filter((a) => a.level === level);
  }
  /**
   * Estimate time to reach target level
   */
  async estimateTimeToLevel(userId, skillId, targetLevel) {
    const assessment = await this.store.getByUserAndSkill(userId, skillId);
    if (!assessment) return null;
    const targetScore = this.masteryThresholds[targetLevel];
    if (assessment.score >= targetScore) return 0;
    const improvementRate = await this.getImprovementRate(userId, skillId);
    if (improvementRate <= 0) return null;
    const scoreGap = targetScore - assessment.score;
    const estimatedSessions = Math.ceil(scoreGap / improvementRate);
    return estimatedSessions;
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  scoreToLevel(score) {
    if (score >= this.masteryThresholds["expert" /* EXPERT */]) return "expert" /* EXPERT */;
    if (score >= this.masteryThresholds["proficient" /* PROFICIENT */]) return "proficient" /* PROFICIENT */;
    if (score >= this.masteryThresholds["intermediate" /* INTERMEDIATE */]) return "intermediate" /* INTERMEDIATE */;
    if (score >= this.masteryThresholds["beginner" /* BEGINNER */]) return "beginner" /* BEGINNER */;
    return "novice" /* NOVICE */;
  }
  calculateConfidence(source, evidence) {
    const sourceConfidence = {
      ["quiz" /* QUIZ */]: 0.7,
      ["exercise" /* EXERCISE */]: 0.65,
      ["project" /* PROJECT */]: 0.85,
      ["peer_review" /* PEER_REVIEW */]: 0.75,
      ["self_assessment" /* SELF_ASSESSMENT */]: 0.5,
      ["ai_evaluation" /* AI_EVALUATION */]: 0.8
    };
    let confidence = sourceConfidence[source] ?? 0.6;
    if (evidence && evidence.length > 0) {
      const evidenceWeight = evidence.reduce((sum, e) => sum + e.weight, 0) / evidence.length;
      confidence = confidence * 0.7 + evidenceWeight * 0.3;
    }
    return Math.min(1, confidence);
  }
  calculateDecayRate(assessment) {
    const levelMultiplier = {
      ["novice" /* NOVICE */]: 1.5,
      ["beginner" /* BEGINNER */]: 1.2,
      ["intermediate" /* INTERMEDIATE */]: 1,
      ["proficient" /* PROFICIENT */]: 0.8,
      ["expert" /* EXPERT */]: 0.5
    };
    return this.decayRatePerDay * (levelMultiplier[assessment.level] ?? 1);
  }
  findDependents(skillId) {
    const dependents = [];
    for (const skill of this.skills.values()) {
      if (skill.prerequisites.includes(skillId)) {
        dependents.push(skill.id);
      }
    }
    return dependents;
  }
  suggestFocusAreas(nodes, _assessments) {
    const suggestions = [];
    for (const node of nodes) {
      if (!node.isUnlocked) continue;
      let priority = 0;
      if (node.score === 0) {
        priority += 10;
      }
      if (node.level === "intermediate" /* INTERMEDIATE */) {
        priority += 15;
      }
      priority += node.dependents.length * 5;
      if (node.lastAssessed) {
        const daysSince = Math.floor(
          (Date.now() - node.lastAssessed.getTime()) / (24 * 60 * 60 * 1e3)
        );
        if (daysSince < 7) priority += 5;
      }
      if (priority > 0) {
        suggestions.push({ skillId: node.skillId, priority });
      }
    }
    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 5).map((s) => s.skillId);
  }
};
function createSkillAssessor(config) {
  return new SkillAssessor(config);
}

// src/learning-analytics/recommendation-engine.ts
var InMemoryRecommendationStore = class {
  recommendations = /* @__PURE__ */ new Map();
  async create(recommendation) {
    const newRecommendation = {
      ...recommendation,
      id: v4_default()
    };
    this.recommendations.set(newRecommendation.id, newRecommendation);
    return newRecommendation;
  }
  async get(id) {
    return this.recommendations.get(id) ?? null;
  }
  async getByUser(userId, limit) {
    const userRecs = Array.from(this.recommendations.values()).filter((r) => r.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? userRecs.slice(0, limit) : userRecs;
  }
  async getActive(userId) {
    const now = /* @__PURE__ */ new Date();
    return Array.from(this.recommendations.values()).filter(
      (r) => r.userId === userId && !r.isCompleted && (!r.expiresAt || r.expiresAt > now)
    ).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
  async markViewed(id) {
    const rec = this.recommendations.get(id);
    if (!rec) throw new Error(`Recommendation not found: ${id}`);
    const updated = { ...rec, isViewed: true };
    this.recommendations.set(id, updated);
    return updated;
  }
  async markCompleted(id, rating) {
    const rec = this.recommendations.get(id);
    if (!rec) throw new Error(`Recommendation not found: ${id}`);
    const updated = { ...rec, isCompleted: true, userRating: rating };
    this.recommendations.set(id, updated);
    return updated;
  }
  async expire(id) {
    const rec = this.recommendations.get(id);
    if (rec) {
      this.recommendations.set(id, { ...rec, expiresAt: /* @__PURE__ */ new Date() });
    }
  }
};
var InMemoryContentStore = class {
  content = /* @__PURE__ */ new Map();
  addContent(item) {
    this.content.set(item.id, item);
  }
  async get(id) {
    return this.content.get(id) ?? null;
  }
  async getByTopic(topicId) {
    return Array.from(this.content.values()).filter((c) => c.topicId === topicId);
  }
  async getBySkill(skillId) {
    return Array.from(this.content.values()).filter((c) => c.skillIds.includes(skillId));
  }
  async getByType(type) {
    return Array.from(this.content.values()).filter((c) => c.type === type);
  }
  async search(query, filters) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.content.values()).filter((c) => {
      const matchesQuery = c.title.toLowerCase().includes(lowerQuery) || c.description.toLowerCase().includes(lowerQuery) || c.tags.some((t) => t.toLowerCase().includes(lowerQuery));
      if (!matchesQuery) return false;
      if (filters) {
        if (filters.types && !filters.types.includes(c.type)) return false;
        if (filters.difficulty && !filters.difficulty.includes(c.difficulty)) return false;
        if (filters.minDuration && c.duration < filters.minDuration) return false;
        if (filters.maxDuration && c.duration > filters.maxDuration) return false;
        if (filters.topicIds && !filters.topicIds.includes(c.topicId)) return false;
        if (filters.skillIds && !filters.skillIds.some((s) => c.skillIds.includes(s))) return false;
      }
      return true;
    });
  }
};
var defaultLogger9 = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var RecommendationEngine = class {
  recommendationStore;
  contentStore;
  logger;
  maxRecommendationsPerBatch;
  recommendationExpiryDays;
  preferredContentTypes;
  feedbackHistory = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.recommendationStore = config.recommendationStore ?? new InMemoryRecommendationStore();
    this.contentStore = config.contentStore ?? new InMemoryContentStore();
    this.logger = config.logger ?? defaultLogger9;
    this.maxRecommendationsPerBatch = config.maxRecommendationsPerBatch ?? 10;
    this.recommendationExpiryDays = config.recommendationExpiryDays ?? 7;
    this.preferredContentTypes = config.preferredContentTypes ?? [
      "tutorial" /* TUTORIAL */,
      "exercise" /* EXERCISE */,
      "video" /* VIDEO */
    ];
  }
  /**
   * Generate recommendations for a user
   */
  async generateRecommendations(input) {
    this.logger.info("Generating recommendations", { userId: input.userId });
    const recommendations = [];
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + this.recommendationExpiryDays * 24 * 60 * 60 * 1e3);
    const context = {
      recentTopics: input.topicProgress?.map((p) => p.topicId) ?? [],
      learningGaps: input.learningGaps?.map((g) => g.conceptId) ?? [],
      skillsToImprove: input.skillDecay?.filter((d) => d.riskLevel !== "low").map((d) => d.skillId) ?? [],
      preferredContentTypes: this.preferredContentTypes,
      availableTime: input.availableTime ?? 60,
      learningStyle: input.learningStyle,
      currentGoals: input.currentGoals ?? []
    };
    if (input.learningGaps && input.learningGaps.length > 0) {
      const gapRecs = await this.generateGapRecommendations(
        input.userId,
        input.learningGaps,
        expiresAt
      );
      recommendations.push(...gapRecs);
    }
    if (input.skillDecay && input.skillDecay.length > 0) {
      const decayRecs = await this.generateDecayRecommendations(
        input.userId,
        input.skillDecay,
        expiresAt
      );
      recommendations.push(...decayRecs);
    }
    if (input.skillAssessments && input.skillAssessments.length > 0) {
      const skillRecs = await this.generateSkillRecommendations(
        input.userId,
        input.skillAssessments,
        expiresAt
      );
      recommendations.push(...skillRecs);
    }
    const explorationRecs = await this.generateExplorationRecommendations(
      input.userId,
      context,
      expiresAt
    );
    recommendations.push(...explorationRecs);
    const sortedRecs = this.sortByPriority(recommendations).slice(0, this.maxRecommendationsPerBatch);
    const savedRecs = [];
    for (const rec of sortedRecs) {
      const saved = await this.recommendationStore.create(rec);
      savedRecs.push(saved);
    }
    const totalEstimatedTime = savedRecs.reduce((sum, r) => sum + r.estimatedDuration, 0);
    const batch = {
      id: v4_default(),
      userId: input.userId,
      recommendations: savedRecs,
      generatedAt: now,
      basedOn: context,
      totalEstimatedTime
    };
    this.logger.info("Recommendations generated", {
      userId: input.userId,
      count: savedRecs.length,
      totalTime: totalEstimatedTime
    });
    return batch;
  }
  /**
   * Get active recommendations for a user
   */
  async getActiveRecommendations(userId) {
    return this.recommendationStore.getActive(userId);
  }
  /**
   * Get recommendation by ID
   */
  async getRecommendation(id) {
    return this.recommendationStore.get(id);
  }
  /**
   * Mark recommendation as viewed
   */
  async markViewed(recommendationId) {
    this.logger.debug("Marking recommendation viewed", { recommendationId });
    return this.recommendationStore.markViewed(recommendationId);
  }
  /**
   * Mark recommendation as completed
   */
  async markCompleted(recommendationId, rating) {
    this.logger.info("Marking recommendation completed", { recommendationId, rating });
    return this.recommendationStore.markCompleted(recommendationId, rating);
  }
  /**
   * Record feedback on a recommendation
   */
  async recordFeedback(feedback) {
    const validated = RecommendationFeedbackSchema.parse(feedback);
    this.logger.info("Recording recommendation feedback", {
      recommendationId: validated.recommendationId,
      isHelpful: validated.isHelpful
    });
    if (!this.feedbackHistory.has(validated.userId)) {
      this.feedbackHistory.set(validated.userId, []);
    }
    this.feedbackHistory.get(validated.userId).push(validated);
    if (validated.completed) {
      await this.recommendationStore.markCompleted(
        validated.recommendationId,
        validated.rating
      );
    }
  }
  /**
   * Generate a learning path for a target skill
   */
  async generateLearningPath(userId, targetSkillIds, currentAssessments) {
    this.logger.info("Generating learning path", { userId, targetSkills: targetSkillIds });
    const assessmentMap = new Map(currentAssessments.map((a) => [a.skillId, a]));
    const steps = [];
    let totalDuration = 0;
    for (const skillId of targetSkillIds) {
      const currentAssessment = assessmentMap.get(skillId);
      const currentLevel = currentAssessment?.level ?? "novice" /* NOVICE */;
      const content = await this.contentStore.getBySkill(skillId);
      const orderedContent = this.orderContentByDifficulty(content);
      for (const item of orderedContent) {
        if (this.shouldSkipContent(item, currentLevel)) continue;
        steps.push({
          order: steps.length + 1,
          title: item.title,
          description: item.description,
          contentType: item.type,
          resourceId: item.id,
          estimatedDuration: item.duration,
          skillsGained: item.skillIds,
          isCompleted: false
        });
        totalDuration += item.duration;
      }
    }
    const difficulty = this.determineDifficulty(currentAssessments, targetSkillIds);
    const learningPath = {
      id: v4_default(),
      userId,
      title: `Path to ${targetSkillIds.join(", ")} mastery`,
      description: `A structured learning path to develop proficiency in ${targetSkillIds.length} skill(s)`,
      targetSkills: targetSkillIds,
      steps,
      totalDuration,
      difficulty,
      createdAt: /* @__PURE__ */ new Date(),
      progress: 0,
      currentStep: 0
    };
    this.logger.info("Learning path generated", {
      userId,
      pathId: learningPath.id,
      stepsCount: steps.length,
      totalDuration
    });
    return learningPath;
  }
  /**
   * Add content to the content store
   */
  addContent(item) {
    if (this.contentStore instanceof InMemoryContentStore) {
      this.contentStore.addContent(item);
    }
  }
  /**
   * Search for content
   */
  async searchContent(query, filters) {
    return this.contentStore.search(query, filters);
  }
  /**
   * Get content by ID
   */
  async getContent(id) {
    return this.contentStore.get(id);
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  async generateGapRecommendations(userId, gaps, expiresAt) {
    const recommendations = [];
    for (const gap of gaps.slice(0, 3)) {
      const priority = this.gapSeverityToPriority(gap.severity);
      const content = await this.contentStore.search(gap.conceptName);
      const bestContent = content[0];
      recommendations.push({
        id: "",
        userId,
        type: bestContent?.type ?? "tutorial" /* TUTORIAL */,
        priority,
        reason: "knowledge_gap" /* KNOWLEDGE_GAP */,
        title: `Fill knowledge gap: ${gap.conceptName}`,
        description: `Address the identified knowledge gap in ${gap.conceptName}`,
        targetConceptId: gap.conceptId,
        estimatedDuration: bestContent?.duration ?? 30,
        difficulty: gap.severity === "critical" ? "medium" : "easy",
        confidence: 0.9,
        resourceId: bestContent?.id,
        resourceUrl: bestContent?.url,
        createdAt: /* @__PURE__ */ new Date(),
        expiresAt,
        isViewed: false,
        isCompleted: false
      });
    }
    return recommendations;
  }
  async generateDecayRecommendations(userId, decayList, expiresAt) {
    const recommendations = [];
    const highRiskDecay = decayList.filter((d) => d.riskLevel === "high" || d.riskLevel === "medium");
    for (const decay of highRiskDecay.slice(0, 2)) {
      const content = await this.contentStore.getBySkill(decay.skillId);
      const reviewContent = content.find((c) => c.type === "quiz" /* QUIZ */ || c.type === "exercise" /* EXERCISE */);
      recommendations.push({
        id: "",
        userId,
        type: reviewContent?.type ?? "quiz" /* QUIZ */,
        priority: decay.riskLevel === "high" ? "high" /* HIGH */ : "medium" /* MEDIUM */,
        reason: "skill_decay" /* SKILL_DECAY */,
        title: `Review: ${decay.skillName}`,
        description: `Refresh your ${decay.skillName} skills to prevent knowledge decay`,
        targetSkillId: decay.skillId,
        estimatedDuration: reviewContent?.duration ?? 15,
        difficulty: "medium",
        confidence: 0.85,
        resourceId: reviewContent?.id,
        createdAt: /* @__PURE__ */ new Date(),
        expiresAt,
        isViewed: false,
        isCompleted: false
      });
    }
    return recommendations;
  }
  async generateSkillRecommendations(userId, assessments, expiresAt) {
    const recommendations = [];
    const improvableSkills = assessments.filter(
      (a) => a.level === "beginner" /* BEGINNER */ || a.level === "intermediate" /* INTERMEDIATE */
    );
    for (const assessment of improvableSkills.slice(0, 2)) {
      const content = await this.contentStore.getBySkill(assessment.skillId);
      const challengeContent = content.find(
        (c) => c.difficulty === "medium" || c.difficulty === "hard"
      );
      if (challengeContent) {
        recommendations.push({
          id: "",
          userId,
          type: challengeContent.type,
          priority: "medium" /* MEDIUM */,
          reason: "challenge" /* CHALLENGE */,
          title: `Level up: ${assessment.skillName}`,
          description: `Take your ${assessment.skillName} skills to the next level`,
          targetSkillId: assessment.skillId,
          estimatedDuration: challengeContent.duration,
          difficulty: challengeContent.difficulty,
          confidence: 0.75,
          resourceId: challengeContent.id,
          resourceUrl: challengeContent.url,
          createdAt: /* @__PURE__ */ new Date(),
          expiresAt,
          isViewed: false,
          isCompleted: false
        });
      }
    }
    return recommendations;
  }
  async generateExplorationRecommendations(userId, context, expiresAt) {
    const recommendations = [];
    const allContent = await this.contentStore.search("");
    const explorationContent = allContent.filter(
      (c) => !context.recentTopics.includes(c.topicId)
    );
    for (const type of context.preferredContentTypes) {
      const typeContent = explorationContent.filter((c) => c.type === type);
      if (typeContent.length > 0) {
        const selected = typeContent[0];
        recommendations.push({
          id: "",
          userId,
          type: selected.type,
          priority: "low" /* LOW */,
          reason: "exploration" /* EXPLORATION */,
          title: `Explore: ${selected.title}`,
          description: selected.description,
          estimatedDuration: selected.duration,
          difficulty: selected.difficulty,
          confidence: 0.6,
          resourceId: selected.id,
          resourceUrl: selected.url,
          createdAt: /* @__PURE__ */ new Date(),
          expiresAt,
          isViewed: false,
          isCompleted: false
        });
        break;
      }
    }
    return recommendations;
  }
  gapSeverityToPriority(severity) {
    switch (severity) {
      case "critical":
        return "critical" /* CRITICAL */;
      case "moderate":
        return "high" /* HIGH */;
      case "minor":
        return "medium" /* MEDIUM */;
      default:
        return "medium" /* MEDIUM */;
    }
  }
  sortByPriority(recommendations) {
    const priorityOrder = {
      ["critical" /* CRITICAL */]: 0,
      ["high" /* HIGH */]: 1,
      ["medium" /* MEDIUM */]: 2,
      ["low" /* LOW */]: 3
    };
    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }
  orderContentByDifficulty(content) {
    const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
    return [...content].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
  }
  shouldSkipContent(content, currentLevel) {
    if (content.difficulty === "easy" && (currentLevel === "intermediate" /* INTERMEDIATE */ || currentLevel === "proficient" /* PROFICIENT */ || currentLevel === "expert" /* EXPERT */)) {
      return true;
    }
    return false;
  }
  determineDifficulty(assessments, targetSkillIds) {
    const relevantAssessments = assessments.filter((a) => targetSkillIds.includes(a.skillId));
    if (relevantAssessments.length === 0) return "beginner";
    const avgScore = relevantAssessments.reduce((sum, a) => sum + a.score, 0) / relevantAssessments.length;
    if (avgScore < 30) return "beginner";
    if (avgScore < 60) return "intermediate";
    return "advanced";
  }
};
function createRecommendationEngine(config) {
  return new RecommendationEngine(config);
}

// src/orchestration/tutoring-loop-controller.ts
var TutoringLoopController = class {
  config;
  logger;
  constructor(config) {
    this.config = {
      ...config,
      stepCompletionThreshold: config.stepCompletionThreshold ?? 0.8,
      autoAdvance: config.autoAdvance ?? true,
      maxStepRetries: config.maxStepRetries ?? 3,
      sessionTimeoutMinutes: config.sessionTimeoutMinutes ?? 60,
      logger: config.logger ?? this.createDefaultLogger(),
      criterionEvaluator: config.criterionEvaluator
    };
    this.logger = this.config.logger;
  }
  /**
   * Prepare complete tutoring context for an LLM call
   */
  async prepareContext(userId, sessionId, _message, options = {}) {
    const startTime = Date.now();
    this.logger.debug("Preparing tutoring context", { userId, sessionId });
    const session = await this.config.sessionStore.getOrCreate(userId, options.planId);
    const [activeGoal, activePlan] = await Promise.all([
      this.getActiveGoal(userId, options.goalId),
      this.getActivePlan(userId, options.planId)
    ]);
    const currentStep = activePlan ? this.getCurrentStep(activePlan) : null;
    const stepObjectives = currentStep ? this.extractStepObjectives(currentStep) : [];
    const allowedTools = await this.getAllowedTools(currentStep);
    const memoryContext = await this.buildMemoryContext(
      userId,
      options.sessionContext
    );
    const pendingInterventions = await this.getPendingInterventions(
      userId,
      sessionId
    );
    const previousStepResults = activePlan ? this.getPreviousStepResults(activePlan) : [];
    const sessionMetadata = this.buildSessionMetadata(session);
    const context = {
      userId,
      sessionId: session.id,
      activeGoal,
      activePlan,
      currentStep,
      stepObjectives,
      allowedTools,
      memoryContext,
      pendingInterventions,
      previousStepResults,
      sessionMetadata
    };
    this.logger.debug("Context prepared", {
      userId,
      hasGoal: !!activeGoal,
      hasPlan: !!activePlan,
      hasStep: !!currentStep,
      toolCount: allowedTools.length,
      prepTimeMs: Date.now() - startTime
    });
    return context;
  }
  /**
   * Evaluate whether the current step can be advanced
   */
  async evaluateProgress(context, response, userMessage) {
    const startTime = Date.now();
    this.logger.debug("Evaluating step progress", {
      userId: context.userId,
      stepId: context.currentStep?.id
    });
    if (!context.currentStep) {
      return this.createEmptyEvaluation();
    }
    const step = context.currentStep;
    const evaluatedCriteria = [];
    const pendingCriteria = [];
    const successCriteria = step.metadata?.successCriteria || [];
    for (const criterion of successCriteria) {
      const evaluation2 = await this.evaluateCriterion(
        criterion,
        context,
        response,
        userMessage
      );
      if (evaluation2.met) {
        evaluatedCriteria.push(evaluation2);
      } else {
        pendingCriteria.push(criterion);
      }
    }
    const totalCriteria = successCriteria.length;
    const metCriteria = evaluatedCriteria.filter((c) => c.met).length;
    const progressPercent = totalCriteria > 0 ? Math.round(metCriteria / totalCriteria * 100) : 0;
    const avgConfidence = evaluatedCriteria.length > 0 ? evaluatedCriteria.reduce((sum, c) => sum + c.confidence, 0) / evaluatedCriteria.length : 0;
    const stepComplete = pendingCriteria.length === 0 && avgConfidence >= this.config.stepCompletionThreshold;
    const recommendations = this.generateRecommendations(
      context,
      evaluatedCriteria,
      pendingCriteria,
      progressPercent
    );
    const shouldAdvance = stepComplete && this.config.autoAdvance;
    const recommendedNextStepId = shouldAdvance ? this.getNextStepId(context.activePlan, step.id) : null;
    const evaluation = {
      stepComplete,
      confidence: avgConfidence,
      evaluatedCriteria,
      pendingCriteria,
      progressPercent,
      recommendations,
      shouldAdvance,
      recommendedNextStepId
    };
    this.logger.debug("Evaluation complete", {
      stepId: step.id,
      stepComplete,
      progressPercent,
      evaluationTimeMs: Date.now() - startTime
    });
    return evaluation;
  }
  /**
   * Advance to the next step in the plan
   */
  async advanceStep(planId, evaluation, options = {}) {
    this.logger.debug("Advancing step", { planId, shouldAdvance: evaluation.shouldAdvance });
    const plan = await this.config.planStore.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const currentStep = this.getCurrentStep(plan);
    const transitionType = this.determineTransitionType(evaluation, options);
    const nextStepId = options.targetStepId || evaluation.recommendedNextStepId;
    const nextStep = nextStepId ? plan.steps.find((s) => s.id === nextStepId) ?? null : null;
    const updatedPlanState = await this.updatePlanState(
      plan,
      currentStep,
      nextStep,
      evaluation,
      transitionType
    );
    const planComplete = this.isPlanComplete(plan, nextStep);
    const celebration = this.generateCelebration(
      currentStep,
      nextStep,
      planComplete
    );
    const transitionMessage = this.generateTransitionMessage(
      transitionType,
      currentStep,
      nextStep,
      planComplete
    );
    const transition = {
      previousStep: currentStep,
      currentStep: nextStep,
      transitionType,
      updatedPlanState,
      transitionMessage,
      planComplete,
      celebration
    };
    this.logger.info("Step transition complete", {
      planId,
      transitionType,
      planComplete,
      previousStepId: currentStep?.id,
      currentStepId: nextStep?.id
    });
    return transition;
  }
  /**
   * Plan tool usage based on the current tutoring context
   */
  async planToolUsage(context, userMessage) {
    const startTime = Date.now();
    this.logger.debug("Planning tool usage", {
      userId: context.userId,
      stepId: context.currentStep?.id
    });
    const plannedTools = [];
    let stepContext = null;
    if (context.currentStep) {
      stepContext = {
        stepId: context.currentStep.id,
        stepType: context.currentStep.type,
        objectives: context.stepObjectives,
        allowedTools: context.allowedTools.map((t) => t.id)
      };
      const toolRecommendations = await this.analyzeToolNeeds(
        context,
        userMessage
      );
      for (const rec of toolRecommendations) {
        const tool = context.allowedTools.find((t) => t.id === rec.toolId);
        if (tool) {
          plannedTools.push({
            toolId: tool.id,
            toolName: tool.name,
            input: rec.suggestedInput,
            priority: rec.priority,
            requiresConfirmation: tool.confirmationType !== "none",
            reasoning: rec.reasoning
          });
        }
      }
    }
    plannedTools.sort((a, b) => b.priority - a.priority);
    const plan = {
      tools: plannedTools,
      reasoning: this.generateToolPlanReasoning(plannedTools, context),
      confidence: this.calculateToolPlanConfidence(plannedTools),
      requiresConfirmation: plannedTools.some((t) => t.requiresConfirmation),
      stepContext
    };
    this.logger.debug("Tool plan created", {
      toolCount: plannedTools.length,
      requiresConfirmation: plan.requiresConfirmation,
      planTimeMs: Date.now() - startTime
    });
    return plan;
  }
  /**
   * Process the complete tutoring loop
   */
  async processLoop(userId, sessionId, userMessage, llmResponse, options = {}) {
    const loopStartTime = Date.now();
    const contextStartTime = Date.now();
    const context = await this.prepareContext(userId, sessionId, userMessage, {
      planId: options.planId,
      goalId: options.goalId,
      sessionContext: options.sessionContext
    });
    const contextPrepTime = Date.now() - contextStartTime;
    const toolPlanStartTime = Date.now();
    const toolPlan = await this.planToolUsage(context, userMessage);
    const toolPlanningTime = Date.now() - toolPlanStartTime;
    const evalStartTime = Date.now();
    const evaluation = await this.evaluateProgress(context, llmResponse, userMessage);
    const evaluationTime = Date.now() - evalStartTime;
    let transition = null;
    if (evaluation.shouldAdvance && context.activePlan) {
      transition = await this.advanceStep(context.activePlan.id, evaluation);
    }
    const pendingConfirmations = await this.config.confirmationStore.getByUser(
      userId,
      { status: ["pending"] }
    );
    await this.config.sessionStore.update(context.sessionId, {
      messageCount: context.sessionMetadata.messageCount + 1,
      metadata: { ...context.sessionMetadata, lastActiveAt: (/* @__PURE__ */ new Date()).toISOString() }
    });
    const metadata = {
      processingTime: Date.now() - loopStartTime,
      contextPrepTime,
      evaluationTime,
      toolPlanningTime,
      stepAdvanced: !!transition,
      planCompleted: transition?.planComplete ?? false,
      interventionsTriggered: context.pendingInterventions.length
    };
    return {
      response: llmResponse,
      modifiedResponse: null,
      // Can be enhanced with step context
      context,
      evaluation,
      transition,
      toolPlan,
      pendingConfirmations,
      metadata
    };
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  async getActiveGoal(userId, goalId) {
    if (goalId) {
      return this.config.goalStore.get(goalId);
    }
    const goals = await this.config.goalStore.getByUser(userId, {
      status: ["active"],
      limit: 1
    });
    return goals[0] ?? null;
  }
  async getActivePlan(userId, planId) {
    if (planId) {
      return this.config.planStore.get(planId);
    }
    const plans = await this.config.planStore.getByUser(userId, {
      status: ["active"],
      limit: 1
    });
    return plans[0] ?? null;
  }
  getCurrentStep(plan) {
    return plan.steps.find(
      (s) => s.status === "pending" || s.status === "in_progress"
    ) ?? null;
  }
  extractStepObjectives(step) {
    const objectives = [];
    if (step.description) {
      objectives.push(step.description);
    }
    const successCriteria = step.metadata?.successCriteria;
    if (successCriteria) {
      objectives.push(...successCriteria);
    }
    return objectives;
  }
  async getAllowedTools(step) {
    const allowedToolIds = step?.metadata?.allowedTools || [];
    if (allowedToolIds.length === 0) {
      return this.config.toolStore.list({
        enabled: true,
        category: "content",
        limit: 10
      });
    }
    const tools = [];
    for (const toolId of allowedToolIds) {
      const tool = await this.config.toolStore.get(toolId);
      if (tool && tool.enabled) {
        tools.push(tool);
      }
    }
    return tools;
  }
  async buildMemoryContext(_userId, sessionContext) {
    const insights = sessionContext?.insights;
    return {
      recentTopics: sessionContext?.currentState?.recentConcepts || [],
      strugglingConcepts: insights?.strugglingConcepts || [],
      masteredConcepts: insights?.masteredConcepts || [],
      sessionSummary: null,
      // Can be populated from memory system
      knowledgeSnippets: [],
      learningStyle: sessionContext?.preferences?.learningStyle || null,
      currentMasteryLevel: null
    };
  }
  async getPendingInterventions(_userId, _sessionId) {
    return [];
  }
  getPreviousStepResults(plan) {
    const results = [];
    for (const step of plan.steps) {
      if (step.status === "completed" || step.status === "failed") {
        results.push({
          stepId: step.id,
          success: step.status === "completed",
          outputs: step.outputs || [],
          completedAt: step.completedAt ?? /* @__PURE__ */ new Date(),
          duration: step.actualMinutes ?? step.estimatedMinutes
        });
      }
    }
    return results;
  }
  buildSessionMetadata(session) {
    const now = /* @__PURE__ */ new Date();
    const startedAt = session.startedAt;
    const totalMinutes = Math.round(
      (now.getTime() - startedAt.getTime()) / 6e4
    );
    return {
      startedAt,
      lastActiveAt: session.endedAt ?? now,
      messageCount: session.messageCount,
      stepsCompletedThisSession: session.stepsCompleted.length,
      totalSessionTime: totalMinutes
    };
  }
  /**
   * Evaluate a single criterion for step completion
   * Uses a combination of heuristic matching and LLM evaluation
   */
  async evaluateCriterion(criterion, context, response, userMessage) {
    const lowerCriterion = criterion.toLowerCase();
    const lowerResponse = response.toLowerCase();
    const lowerMessage = userMessage.toLowerCase();
    const heuristicResult = this.evaluateCriterionHeuristically(
      criterion,
      lowerCriterion,
      lowerResponse,
      lowerMessage,
      context
    );
    if (heuristicResult !== null) {
      this.logger.debug("Criterion evaluated heuristically", {
        criterion,
        met: heuristicResult.met,
        confidence: heuristicResult.confidence
      });
      return heuristicResult;
    }
    if (this.config.criterionEvaluator && context.currentStep) {
      try {
        const aiResult = await this.config.criterionEvaluator.evaluateCriterion({
          criterion,
          userMessage,
          assistantResponse: response,
          stepContext: {
            stepTitle: context.currentStep.title,
            stepType: context.currentStep.type,
            objectives: context.stepObjectives
          },
          memoryContext: {
            masteredConcepts: context.memoryContext.masteredConcepts,
            strugglingConcepts: context.memoryContext.strugglingConcepts
          }
        });
        this.logger.debug("Criterion evaluated by AI", {
          criterion,
          met: aiResult.met,
          confidence: aiResult.confidence
        });
        return {
          criterion,
          met: aiResult.met,
          evidence: aiResult.evidence,
          confidence: aiResult.confidence
        };
      } catch (error) {
        this.logger.warn("AI criterion evaluation failed, falling back to heuristics", { error });
      }
    }
    return this.evaluateCriterionSemantically(criterion, response, userMessage, context);
  }
  /**
   * Heuristic evaluation for common criterion types
   */
  evaluateCriterionHeuristically(criterion, lowerCriterion, lowerResponse, lowerMessage, context) {
    if (lowerCriterion.includes("time spent") || lowerCriterion.includes("duration")) {
      const sessionTime = context.sessionMetadata.totalSessionTime;
      const requiredTime = this.extractTimeRequirement(lowerCriterion);
      if (requiredTime > 0) {
        const met = sessionTime >= requiredTime;
        return {
          criterion,
          met,
          evidence: `Session time: ${sessionTime} minutes (required: ${requiredTime} minutes)`,
          confidence: 1
        };
      }
    }
    if (lowerCriterion.includes("message") || lowerCriterion.includes("interaction")) {
      const messageCount = context.sessionMetadata.messageCount;
      const requiredCount = this.extractNumberRequirement(lowerCriterion);
      if (requiredCount > 0) {
        const met = messageCount >= requiredCount;
        return {
          criterion,
          met,
          evidence: `Message count: ${messageCount} (required: ${requiredCount})`,
          confidence: 1
        };
      }
    }
    if (lowerCriterion.includes("quiz") || lowerCriterion.includes("test") || lowerCriterion.includes("score")) {
      const scoreMatch = lowerResponse.match(/(\d+)\s*(?:\/|out of)\s*(\d+)|score[:\s]+(\d+)%?/i);
      if (scoreMatch) {
        const score = scoreMatch[1] && scoreMatch[2] ? parseInt(scoreMatch[1]) / parseInt(scoreMatch[2]) * 100 : parseInt(scoreMatch[3] || "0");
        const requiredScore = this.extractScoreRequirement(lowerCriterion);
        const met = score >= requiredScore;
        return {
          criterion,
          met,
          evidence: `Score: ${score.toFixed(0)}% (required: ${requiredScore}%)`,
          confidence: 0.9
        };
      }
    }
    if (lowerCriterion.includes("complete") || lowerCriterion.includes("finish")) {
      const completionIndicators = [
        "completed",
        "finished",
        "done",
        "accomplished",
        "successfully",
        "well done",
        "great job",
        "excellent"
      ];
      const hasCompletionIndicator = completionIndicators.some((ind) => lowerResponse.includes(ind));
      if (hasCompletionIndicator) {
        return {
          criterion,
          met: true,
          evidence: "Response indicates completion",
          confidence: 0.75
        };
      }
    }
    if (lowerCriterion.includes("understand") || lowerCriterion.includes("demonstrate") || lowerCriterion.includes("explain")) {
      const explanationIndicators = [
        "because",
        "therefore",
        "this means",
        "in other words",
        "for example",
        "specifically",
        "essentially"
      ];
      const hasExplanation = explanationIndicators.some((ind) => lowerMessage.includes(ind));
      const confirmationIndicators = [
        "correct",
        "exactly",
        "that's right",
        "well explained",
        "good understanding",
        "you've got it",
        "precisely"
      ];
      const hasConfirmation = confirmationIndicators.some((ind) => lowerResponse.includes(ind));
      if (hasExplanation && hasConfirmation) {
        return {
          criterion,
          met: true,
          evidence: "User demonstrated understanding with explanation confirmed by assistant",
          confidence: 0.8
        };
      }
      if (hasExplanation || hasConfirmation) {
        return {
          criterion,
          met: false,
          evidence: hasExplanation ? "User provided explanation but awaiting confirmation" : "Partial understanding indicators detected",
          confidence: 0.5
        };
      }
    }
    if (lowerCriterion.includes("practice") || lowerCriterion.includes("exercise")) {
      const practiceIndicators = [
        "solved",
        "answered",
        "attempted",
        "worked through",
        "practiced",
        "tried",
        "completed the exercise"
      ];
      const hasPractice = practiceIndicators.some(
        (ind) => lowerMessage.includes(ind) || lowerResponse.includes(ind)
      );
      if (hasPractice) {
        return {
          criterion,
          met: true,
          evidence: "Practice/exercise completed",
          confidence: 0.7
        };
      }
    }
    if (lowerCriterion.includes("ask") && lowerCriterion.includes("question")) {
      const isQuestion = lowerMessage.includes("?") || lowerMessage.startsWith("what") || lowerMessage.startsWith("how") || lowerMessage.startsWith("why") || lowerMessage.startsWith("can you");
      if (isQuestion) {
        return {
          criterion,
          met: true,
          evidence: "User asked a question",
          confidence: 0.9
        };
      }
    }
    return null;
  }
  /**
   * Semantic similarity-based criterion evaluation
   */
  evaluateCriterionSemantically(criterion, response, userMessage, _context) {
    const criterionWords = this.extractKeywords(criterion);
    const responseWords = this.extractKeywords(response);
    const messageWords = this.extractKeywords(userMessage);
    const allContextWords = [...responseWords, ...messageWords];
    const matchCount = criterionWords.filter(
      (word) => allContextWords.some(
        (contextWord) => contextWord.includes(word) || word.includes(contextWord)
      )
    ).length;
    const similarity = criterionWords.length > 0 ? matchCount / criterionWords.length : 0;
    const met = similarity >= 0.5;
    const confidence = Math.min(similarity + 0.2, 0.7);
    return {
      criterion,
      met,
      evidence: met ? `Semantic match: ${matchCount}/${criterionWords.length} keywords found in context` : `Insufficient semantic match: ${matchCount}/${criterionWords.length} keywords`,
      confidence
    };
  }
  /**
   * Extract keywords from text for semantic matching
   */
  extractKeywords(text) {
    const stopWords = /* @__PURE__ */ new Set([
      "the",
      "a",
      "an",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "shall",
      "can",
      "to",
      "of",
      "in",
      "for",
      "on",
      "with",
      "at",
      "by",
      "from",
      "up",
      "about",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "between",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "all",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "just",
      "and",
      "but",
      "if",
      "or",
      "as",
      "until",
      "while",
      "this",
      "that",
      "these",
      "those",
      "it"
    ]);
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word));
  }
  /**
   * Extract time requirement from criterion text (in minutes)
   */
  extractTimeRequirement(criterion) {
    const hourMatch = criterion.match(/(\d+)\s*hour/);
    const minuteMatch = criterion.match(/(\d+)\s*min/);
    let minutes = 0;
    if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
    if (minuteMatch) minutes += parseInt(minuteMatch[1]);
    return minutes || 15;
  }
  /**
   * Extract number requirement from criterion text
   */
  extractNumberRequirement(criterion) {
    const match = criterion.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  }
  /**
   * Extract score requirement from criterion text (as percentage)
   */
  extractScoreRequirement(criterion) {
    const percentMatch = criterion.match(/(\d+)\s*%/);
    if (percentMatch) return parseInt(percentMatch[1]);
    const fractionMatch = criterion.match(/(\d+)\s*(?:\/|out of)\s*(\d+)/);
    if (fractionMatch) {
      return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]) * 100;
    }
    return 70;
  }
  generateRecommendations(_context, _evaluatedCriteria, pendingCriteria, progressPercent) {
    const recommendations = [];
    if (progressPercent >= 80) {
      recommendations.push({
        type: "continue",
        reason: "Good progress, continue with current approach",
        priority: 1
      });
    } else if (progressPercent >= 50) {
      recommendations.push({
        type: "practice",
        reason: "Some practice exercises may help solidify understanding",
        priority: 2
      });
    } else if (pendingCriteria.length > 2) {
      recommendations.push({
        type: "simplify",
        reason: "Consider breaking down the topic into smaller parts",
        priority: 3
      });
    }
    return recommendations;
  }
  getNextStepId(plan, currentStepId) {
    if (!plan) return null;
    const currentIndex = plan.steps.findIndex((s) => s.id === currentStepId);
    if (currentIndex === -1 || currentIndex >= plan.steps.length - 1) {
      return null;
    }
    return plan.steps[currentIndex + 1].id;
  }
  determineTransitionType(evaluation, options) {
    if (options.skip) return "skip";
    if (options.retry) return "retry";
    if (options.rollback) return "rollback";
    if (options.targetStepId) return "jump";
    if (evaluation.stepComplete) return "advance";
    return "advance";
  }
  async updatePlanState(plan, currentStep, nextStep, _evaluation, transitionType) {
    const now = /* @__PURE__ */ new Date();
    if (currentStep) {
      const stepIndex = plan.steps.findIndex((s) => s.id === currentStep.id);
      if (stepIndex !== -1) {
        await this.config.planStore.updateStep(plan.id, currentStep.id, {
          status: transitionType === "advance" ? "completed" : plan.steps[stepIndex].status,
          completedAt: transitionType === "advance" ? now : void 0
        });
      }
    }
    if (nextStep) {
      await this.config.planStore.updateStep(plan.id, nextStep.id, {
        status: "in_progress",
        startedAt: now
      });
    }
    const existingState = await this.config.planStore.loadState(plan.id);
    const completedStepIds = plan.steps.filter((s) => s.status === "completed").map((s) => s.id);
    const failedStepIds = plan.steps.filter((s) => s.status === "failed").map((s) => s.id);
    const skippedStepIds = plan.steps.filter((s) => s.status === "skipped").map((s) => s.id);
    const newState = {
      planId: plan.id,
      goalId: plan.goalId,
      userId: plan.userId,
      currentStepId: nextStep?.id ?? null,
      currentStepProgress: 0,
      completedSteps: completedStepIds,
      failedSteps: failedStepIds,
      skippedSteps: skippedStepIds,
      startedAt: existingState?.startedAt ?? now,
      lastActiveAt: now,
      totalActiveTime: existingState?.totalActiveTime ?? 0,
      context: existingState?.context ?? {
        recentTopics: [],
        strugglingConcepts: [],
        masteredConcepts: []
      },
      checkpointData: existingState?.checkpointData ?? {},
      sessionCount: existingState?.sessionCount ?? 1
    };
    await this.config.planStore.saveState(newState);
    return newState;
  }
  isPlanComplete(plan, nextStep) {
    if (nextStep) return false;
    return plan.steps.every((s) => s.status === "completed" || s.status === "skipped");
  }
  generateCelebration(currentStep, nextStep, planComplete) {
    if (planComplete) {
      return {
        type: "goal_complete",
        title: "Goal Achieved! \u{1F389}",
        message: "Congratulations! You have completed all steps in your learning plan.",
        xpEarned: 100
      };
    }
    if (currentStep && !nextStep) {
      return {
        type: "step_complete",
        title: "Step Complete! \u2728",
        message: `Great work completing: ${currentStep.title}`,
        xpEarned: 25
      };
    }
    return null;
  }
  generateTransitionMessage(transitionType, currentStep, nextStep, planComplete) {
    if (planComplete) {
      return "Congratulations! You have completed your learning plan.";
    }
    switch (transitionType) {
      case "advance":
        return nextStep ? `Moving on to: ${nextStep.title}` : "All steps completed!";
      case "skip":
        return currentStep ? `Skipped: ${currentStep.title}` : "Step skipped.";
      case "retry":
        return currentStep ? `Retrying: ${currentStep.title}` : "Retrying step.";
      case "rollback":
        return nextStep ? `Going back to: ${nextStep.title}` : "Rolling back.";
      case "jump":
        return nextStep ? `Jumping to: ${nextStep.title}` : "Jumping to step.";
      default:
        return "Continuing with your learning plan.";
    }
  }
  /**
   * Analyze user message to determine which tools might be needed
   */
  async analyzeToolNeeds(context, userMessage) {
    const recommendations = [];
    const lowerMessage = userMessage.toLowerCase();
    for (const tool of context.allowedTools) {
      const toolMatch = this.matchToolToMessage(tool, lowerMessage, context);
      if (toolMatch) {
        recommendations.push(toolMatch);
      }
    }
    recommendations.sort((a, b) => b.priority - a.priority);
    return recommendations.slice(0, 3);
  }
  /**
   * Match a tool to the user message to determine if it should be recommended
   */
  matchToolToMessage(tool, lowerMessage, context) {
    const toolPatterns = {
      // Content tools
      "search": {
        patterns: ["find", "search", "look for", "where is", "locate"],
        priority: 7
      },
      "explain": {
        patterns: ["explain", "what is", "what does", "how does", "tell me about"],
        priority: 8
      },
      "quiz": {
        patterns: ["quiz", "test", "practice questions", "try a quiz", "test me"],
        priority: 8
      },
      "example": {
        patterns: ["example", "show me", "demonstrate", "sample"],
        priority: 6
      },
      "summarize": {
        patterns: ["summarize", "summary", "brief", "recap", "overview"],
        priority: 5
      },
      // Progress tools
      "progress": {
        patterns: ["progress", "how am i doing", "my status", "track"],
        priority: 6
      },
      "goal": {
        patterns: ["goal", "objective", "target", "what should i learn"],
        priority: 7
      },
      // Learning tools
      "flashcard": {
        patterns: ["flashcard", "flash card", "memorize", "remember"],
        priority: 6
      },
      "hint": {
        patterns: ["hint", "help me", "stuck", "clue", "guide"],
        priority: 7
      },
      "simplify": {
        patterns: ["simplify", "easier", "simpler", "break down", "step by step"],
        priority: 8
      }
    };
    const toolNameLower = tool.name.toLowerCase();
    for (const [category, config] of Object.entries(toolPatterns)) {
      if (toolNameLower.includes(category) || tool.category === category) {
        const matchedPattern = config.patterns.find((pattern) => lowerMessage.includes(pattern));
        if (matchedPattern) {
          return {
            toolId: tool.id,
            suggestedInput: this.buildToolInput(tool, lowerMessage, context),
            priority: config.priority,
            reasoning: `User message contains "${matchedPattern}" which suggests ${tool.name} tool`
          };
        }
      }
    }
    if (tool.description) {
      const descKeywords = this.extractKeywords(tool.description);
      const messageKeywords = this.extractKeywords(lowerMessage);
      const overlap = descKeywords.filter((kw) => messageKeywords.includes(kw)).length;
      if (overlap >= 2) {
        return {
          toolId: tool.id,
          suggestedInput: this.buildToolInput(tool, lowerMessage, context),
          priority: Math.min(overlap + 2, 6),
          reasoning: `Tool description matches ${overlap} keywords in user message`
        };
      }
    }
    return null;
  }
  /**
   * Build suggested input for a tool based on context
   */
  buildToolInput(_tool, userMessage, context) {
    const input = {};
    input.userId = context.userId;
    input.sessionId = context.sessionId;
    if (context.currentStep) {
      input.topic = context.currentStep.title;
      input.stepId = context.currentStep.id;
    } else {
      input.topic = this.extractMainTopic(userMessage);
    }
    input.query = userMessage;
    if (context.activePlan?.checkpointData) {
      const courseId = context.activePlan.checkpointData.courseId;
      if (courseId) {
        input.courseId = courseId;
      }
    }
    return input;
  }
  /**
   * Extract the main topic from user message
   */
  extractMainTopic(message) {
    const cleaned = message.replace(/^(what|how|why|can you|could you|please|help me|tell me|explain)\s+(is|are|does|do|the|about|with|to|understand)?\s*/i, "").replace(/\?$/, "").trim();
    const words = cleaned.split(/\s+/).slice(0, 8);
    return words.join(" ").substring(0, 50);
  }
  generateToolPlanReasoning(tools, _context) {
    if (tools.length === 0) {
      return "No tools needed for this interaction.";
    }
    const toolNames = tools.map((t) => t.toolName).join(", ");
    return `Planned to use: ${toolNames}. ${tools[0]?.reasoning ?? ""}`;
  }
  calculateToolPlanConfidence(tools) {
    if (tools.length === 0) return 1;
    const avgPriority = tools.reduce((sum, t) => sum + t.priority, 0) / tools.length;
    return Math.min(avgPriority / 10, 1);
  }
  createEmptyEvaluation() {
    return {
      stepComplete: false,
      confidence: 0,
      evaluatedCriteria: [],
      pendingCriteria: [],
      progressPercent: 0,
      recommendations: [],
      shouldAdvance: false,
      recommendedNextStepId: null
    };
  }
  createDefaultLogger() {
    return {
      debug: (_message, _data) => {
      },
      info: (_message, _data) => {
      },
      warn: (message, data) => {
        console.warn(`[TutoringLoop] ${message}`, data);
      },
      error: (message, error, data) => {
        console.error(`[TutoringLoop] ${message}`, error, data);
      }
    };
  }
};
function createTutoringLoopController(config) {
  return new TutoringLoopController(config);
}

// src/orchestration/active-step-executor.ts
var ActiveStepExecutor = class {
  config;
  logger;
  pendingConfirmations = /* @__PURE__ */ new Map();
  constructor(config) {
    this.config = {
      ...config,
      defaultTimeoutMs: config.defaultTimeoutMs ?? 3e4,
      maxConcurrentTools: config.maxConcurrentTools ?? 3,
      requireConfirmation: config.requireConfirmation ?? true,
      confirmationExpiryMs: config.confirmationExpiryMs ?? 3e5,
      // 5 minutes
      logger: config.logger ?? this.createDefaultLogger()
    };
    this.logger = this.config.logger;
  }
  /**
   * Execute a step with its associated tools
   */
  async executeStep(step, context, toolPlan) {
    const startedAt = /* @__PURE__ */ new Date();
    this.logger.info("Executing step", {
      stepId: step.id,
      stepType: step.type,
      toolCount: toolPlan.tools.length
    });
    const toolResults = [];
    const errors = [];
    const artifacts = [];
    if (toolPlan.tools.length > 0) {
      const results = await this.executeToolPlan(toolPlan, context);
      toolResults.push(...results.summaries);
      errors.push(...results.errors);
      artifacts.push(...results.artifacts);
    }
    const hasErrors = errors.some((e) => !e.recoverable);
    const hasPendingConfirmations = toolResults.some(
      (r) => r.status === "pending_confirmation"
    );
    let status;
    if (hasErrors) {
      status = "failed";
    } else if (hasPendingConfirmations) {
      status = "blocked";
    } else {
      status = "completed";
    }
    const completedAt = /* @__PURE__ */ new Date();
    const duration = completedAt.getTime() - startedAt.getTime();
    const estimatedMs = step.estimatedMinutes * 60 * 1e3;
    const timeEfficiency = estimatedMs > 0 ? estimatedMs / duration : 1;
    const metrics = {
      engagement: 1,
      // Would be calculated from user interaction patterns
      comprehension: errors.length === 0 ? 1 : 0.5,
      // Based on error rate
      timeEfficiency: Math.min(timeEfficiency, 2),
      // Cap at 2x efficiency
      ...this.calculateAdditionalMetrics(toolResults)
    };
    const output = {
      message: this.generateOutputMessage(step, status, toolResults),
      data: this.aggregateToolOutputs(toolResults),
      artifacts
    };
    const result = {
      stepId: step.id,
      status,
      output,
      metrics,
      toolResults,
      errors,
      startedAt,
      completedAt
    };
    this.logger.info("Step execution complete", {
      stepId: step.id,
      status,
      duration,
      toolsExecuted: toolResults.length,
      errorsCount: errors.length
    });
    return result;
  }
  /**
   * Execute a tool plan with confirmation handling
   */
  async executeToolPlan(toolPlan, context) {
    const summaries = [];
    const errors = [];
    const artifacts = [];
    const { needsConfirmation, canExecute } = this.categorizeTools(
      toolPlan.tools,
      context
    );
    const immediateResults = await this.executeToolsBatch(
      canExecute,
      context
    );
    summaries.push(...immediateResults.summaries);
    errors.push(...immediateResults.errors);
    artifacts.push(...immediateResults.artifacts);
    for (const tool of needsConfirmation) {
      const confirmationResult = await this.requestToolConfirmation(
        tool,
        context
      );
      summaries.push(confirmationResult);
    }
    return { summaries, errors, artifacts };
  }
  /**
   * Execute a single tool
   */
  async executeTool(tool, context) {
    const startTime = Date.now();
    this.logger.debug("Executing tool", {
      toolId: tool.toolId,
      toolName: tool.toolName
    });
    try {
      const toolDef = await this.config.toolStore.get(tool.toolId);
      if (!toolDef) {
        return {
          toolId: tool.toolId,
          toolName: tool.toolName,
          status: "failed",
          error: `Tool not found: ${tool.toolId}`,
          duration: Date.now() - startTime
        };
      }
      if (!toolDef.enabled) {
        return {
          toolId: tool.toolId,
          toolName: tool.toolName,
          status: "skipped",
          error: "Tool is disabled",
          duration: Date.now() - startTime
        };
      }
      const validatedInput = await this.validateToolInput(toolDef, tool.input);
      const execContext = {
        userId: context.userId,
        sessionId: context.sessionId,
        requestId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        grantedPermissions: toolDef.requiredPermissions,
        userConfirmed: !tool.requiresConfirmation,
        previousCalls: []
      };
      const result = await this.executeWithTimeout(
        toolDef.handler(validatedInput, execContext),
        toolDef.timeoutMs ?? this.config.defaultTimeoutMs
      );
      return {
        toolId: tool.toolId,
        toolName: tool.toolName,
        status: result.success ? "success" : "failed",
        result,
        error: result.error?.message,
        duration: Date.now() - startTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Tool execution failed", error, {
        toolId: tool.toolId
      });
      return {
        toolId: tool.toolId,
        toolName: tool.toolName,
        status: "failed",
        error: errorMessage,
        duration: Date.now() - startTime
      };
    }
  }
  /**
   * Handle confirmation response for a pending tool execution
   */
  async handleConfirmation(confirmationId, response, context) {
    const pending = this.pendingConfirmations.get(confirmationId);
    if (!pending) {
      this.logger.warn("Confirmation not found", { confirmationId });
      return null;
    }
    await this.config.confirmationStore.respond(confirmationId, response);
    this.pendingConfirmations.delete(confirmationId);
    if (!response.approved) {
      return {
        toolId: pending.tool.toolId,
        toolName: pending.tool.toolName,
        status: "skipped",
        error: response.rejectionReason ?? "User declined",
        duration: 0,
        confirmationId
      };
    }
    const toolToExecute = {
      ...pending.tool,
      input: response.modifiedInput ?? pending.tool.input,
      requiresConfirmation: false
      // Already confirmed
    };
    return this.executeTool(toolToExecute, context);
  }
  /**
   * Get all pending confirmations for a user
   */
  async getPendingConfirmations(userId) {
    return this.config.confirmationStore.getByUser(userId, {
      status: ["pending"]
    });
  }
  /**
   * Cancel a pending confirmation
   */
  async cancelConfirmation(confirmationId) {
    const pending = this.pendingConfirmations.get(confirmationId);
    if (!pending) {
      return false;
    }
    await this.config.confirmationStore.update(confirmationId, {
      status: "expired"
    });
    this.pendingConfirmations.delete(confirmationId);
    return true;
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  categorizeTools(tools, _context) {
    const needsConfirmation = [];
    const canExecute = [];
    for (const tool of tools) {
      if (tool.requiresConfirmation && this.config.requireConfirmation) {
        needsConfirmation.push(tool);
      } else {
        canExecute.push(tool);
      }
    }
    return { needsConfirmation, canExecute };
  }
  async executeToolsBatch(tools, context) {
    const summaries = [];
    const errors = [];
    const artifacts = [];
    const batches = this.chunkArray(tools, this.config.maxConcurrentTools);
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map((tool) => this.executeTool(tool, context))
      );
      for (const result of batchResults) {
        summaries.push(result);
        if (result.status === "failed" && result.error) {
          errors.push({
            code: "TOOL_EXECUTION_ERROR",
            message: result.error,
            toolId: result.toolId,
            recoverable: true
          });
        }
        if (result.status === "success" && result.result?.output) {
          const extractedArtifacts = this.extractArtifacts(
            result.toolId,
            result.result.output
          );
          artifacts.push(...extractedArtifacts);
        }
      }
    }
    return { summaries, errors, artifacts };
  }
  async requestToolConfirmation(tool, context) {
    const expiresAt = new Date(Date.now() + this.config.confirmationExpiryMs);
    const request = await this.config.confirmationStore.create({
      userId: context.userId,
      sessionId: context.sessionId,
      toolId: tool.toolId,
      toolName: tool.toolName,
      toolDescription: tool.reasoning,
      plannedInput: tool.input,
      reasoning: tool.reasoning,
      riskLevel: this.assessRiskLevel(tool),
      stepId: context.currentStep?.id ?? null,
      stepTitle: context.currentStep?.title ?? null,
      status: "pending",
      expiresAt,
      respondedAt: null,
      approvedBy: null,
      rejectionReason: null
    });
    this.pendingConfirmations.set(request.id, {
      request,
      tool,
      context,
      createdAt: /* @__PURE__ */ new Date()
    });
    this.logger.info("Confirmation requested", {
      confirmationId: request.id,
      toolId: tool.toolId
    });
    return {
      toolId: tool.toolId,
      toolName: tool.toolName,
      status: "pending_confirmation",
      duration: 0,
      confirmationId: request.id
    };
  }
  async validateToolInput(toolDef, input) {
    try {
      return toolDef.inputSchema.parse(input);
    } catch (error) {
      throw new Error(`Invalid tool input: ${error instanceof Error ? error.message : "validation failed"}`);
    }
  }
  async executeWithTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Tool execution timeout")), timeoutMs)
      )
    ]);
  }
  assessRiskLevel(tool) {
    if (!tool.requiresConfirmation) return "safe";
    if (tool.priority >= 8) return "low";
    if (tool.priority >= 5) return "medium";
    if (tool.priority >= 3) return "high";
    return "critical";
  }
  extractArtifacts(toolId, output) {
    const artifacts = [];
    if (typeof output === "object" && output !== null) {
      const outputObj = output;
      if (outputObj.content && outputObj.type) {
        artifacts.push({
          id: `artifact-${toolId}-${Date.now()}`,
          type: outputObj.type || "content",
          title: outputObj.title || "Generated Content",
          content: outputObj.content,
          metadata: outputObj.metadata
        });
      }
    }
    return artifacts;
  }
  calculateAdditionalMetrics(results) {
    const successCount = results.filter((r) => r.status === "success").length;
    const successRate = results.length > 0 ? successCount / results.length : 1;
    return {
      masteryGain: successRate * 0.1
      // Small mastery gain per step
    };
  }
  generateOutputMessage(step, status, results) {
    const successCount = results.filter((r) => r.status === "success").length;
    switch (status) {
      case "completed":
        return `Step "${step.title}" completed successfully. ${successCount} tools executed.`;
      case "failed":
        return `Step "${step.title}" failed. Please check the errors and try again.`;
      case "blocked":
        return `Step "${step.title}" is waiting for confirmation to proceed.`;
      default:
        return `Step "${step.title}" status: ${status}`;
    }
  }
  aggregateToolOutputs(results) {
    const aggregated = {};
    for (const result of results) {
      if (result.status === "success" && result.result?.output) {
        aggregated[result.toolId] = result.result.output;
      }
    }
    return aggregated;
  }
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  createDefaultLogger() {
    return {
      debug: (_message, _data) => {
      },
      info: (_message, _data) => {
      },
      warn: (message, data) => {
        console.warn(`[ActiveStepExecutor] ${message}`, data);
      },
      error: (message, error, data) => {
        console.error(`[ActiveStepExecutor] ${message}`, error, data);
      }
    };
  }
};
function createActiveStepExecutor(config) {
  return new ActiveStepExecutor(config);
}

// src/orchestration/plan-context-injector.ts
var PlanContextInjector = class {
  config;
  logger;
  constructor(config = {}) {
    this.config = {
      logger: config.logger ?? this.createDefaultLogger(),
      maxObjectives: config.maxObjectives ?? 5,
      maxPreviousResults: config.maxPreviousResults ?? 3,
      includeMemoryContext: config.includeMemoryContext ?? true,
      includeGamification: config.includeGamification ?? false,
      templateFormat: config.templateFormat ?? "markdown"
    };
    this.logger = this.config.logger;
  }
  /**
   * Create plan context injection for LLM prompt
   */
  createInjection(context) {
    this.logger.debug("Creating plan context injection", {
      userId: context.userId,
      hasGoal: !!context.activeGoal,
      hasPlan: !!context.activePlan,
      hasStep: !!context.currentStep
    });
    const systemPromptAdditions = this.buildSystemPromptAdditions(context);
    const messagePrefix = this.buildMessagePrefix(context);
    const messageSuffix = this.buildMessageSuffix(context);
    const structuredContext = this.buildStructuredContext(context);
    return {
      systemPromptAdditions,
      messagePrefix,
      messageSuffix,
      structuredContext
    };
  }
  /**
   * Format context as a single string for system prompt
   */
  formatForSystemPrompt(context) {
    const injection = this.createInjection(context);
    return injection.systemPromptAdditions.join("\n\n");
  }
  /**
   * Format context as structured data
   */
  formatAsStructuredData(context) {
    return this.buildStructuredContext(context);
  }
  /**
   * Build the complete prompt with context
   */
  buildCompletePrompt(context, userMessage, systemPrompt) {
    const injection = this.createInjection(context);
    const enhancedSystemPrompt = [
      systemPrompt ?? "",
      ...injection.systemPromptAdditions
    ].filter(Boolean).join("\n\n");
    const enhancedUserMessage = [
      injection.messagePrefix,
      userMessage,
      injection.messageSuffix
    ].filter(Boolean).join("\n\n");
    return {
      systemPrompt: enhancedSystemPrompt,
      userMessage: enhancedUserMessage,
      structuredContext: injection.structuredContext
    };
  }
  // ============================================================================
  // PRIVATE BUILDER METHODS
  // ============================================================================
  buildSystemPromptAdditions(context) {
    const additions = [];
    if (context.activePlan && context.currentStep) {
      additions.push(this.formatPlanContext(context));
    }
    if (context.stepObjectives.length > 0) {
      additions.push(this.formatStepObjectives(context.stepObjectives));
    }
    if (this.config.includeMemoryContext) {
      const memoryPrompt = this.formatMemoryContext(context);
      if (memoryPrompt) {
        additions.push(memoryPrompt);
      }
    }
    if (context.allowedTools.length > 0) {
      additions.push(this.formatAvailableTools(context));
    }
    if (context.pendingInterventions.length > 0) {
      additions.push(this.formatInterventions(context));
    }
    return additions;
  }
  buildMessagePrefix(context) {
    if (!context.currentStep) {
      return null;
    }
    const step = context.currentStep;
    return this.formatTemplate("prefix", {
      stepTitle: step.title,
      stepType: step.type,
      progress: this.calculateProgress(context)
    });
  }
  buildMessageSuffix(context) {
    if (context.stepObjectives.length === 0) {
      return null;
    }
    return this.formatTemplate("suffix", {
      objectives: context.stepObjectives.slice(0, this.config.maxObjectives)
    });
  }
  buildStructuredContext(context) {
    return {
      goalSummary: context.activeGoal ? `${context.activeGoal.title}: ${context.activeGoal.description ?? ""}` : null,
      stepDetails: context.currentStep ? this.buildStepDetails(context.currentStep) : null,
      progressSummary: this.buildProgressSummary(context),
      availableActions: this.getAvailableActions(context),
      constraints: this.getConstraints(context)
    };
  }
  buildStepDetails(step) {
    const successCriteria = step.metadata?.successCriteria || [];
    return {
      title: step.title,
      type: step.type,
      description: step.description ?? null,
      objectives: successCriteria,
      estimatedMinutes: step.estimatedMinutes,
      currentProgress: 0
      // Would be calculated from evaluation
    };
  }
  buildProgressSummary(context) {
    if (!context.activePlan) {
      return "No active learning plan.";
    }
    const plan = context.activePlan;
    const totalSteps = plan.steps.length;
    const completedSteps = plan.steps.filter((s) => s.status === "completed").length;
    const progress = Math.round(completedSteps / totalSteps * 100);
    return `Progress: ${completedSteps}/${totalSteps} steps completed (${progress}%)`;
  }
  getAvailableActions(context) {
    const actions = [];
    actions.push("ask questions", "request clarification", "get examples");
    if (context.currentStep) {
      const stepActions = this.getStepTypeActions(context.currentStep.type);
      actions.push(...stepActions);
    }
    for (const tool of context.allowedTools) {
      actions.push(tool.name);
    }
    return actions;
  }
  getStepTypeActions(stepType) {
    const actionMap = {
      read_content: ["summarize content", "explain concept", "provide examples"],
      watch_video: ["summarize video", "ask about section", "note key points"],
      complete_exercise: ["check solution", "get hints", "show answer"],
      take_quiz: ["submit answer", "request feedback", "review explanation"],
      reflect: ["guided reflection", "connect concepts", "identify gaps"],
      practice_problem: ["check solution", "get hints", "show steps"],
      socratic_dialogue: ["ask questions", "explore reasoning", "challenge assumptions"],
      spaced_review: ["test recall", "highlight key points", "create summary"],
      create_summary: ["organize notes", "highlight key points", "create outline"],
      peer_discussion: ["share perspective", "ask clarifying questions"],
      project_work: ["validate approach", "suggest improvements", "debug code"],
      research: ["explore sources", "verify information", "synthesize findings"]
    };
    return actionMap[stepType] || [];
  }
  getConstraints(context) {
    const constraints = [];
    if (context.currentStep) {
      const step = context.currentStep;
      if (step.type === "take_quiz") {
        constraints.push("Do not reveal answers directly");
        constraints.push("Guide toward understanding rather than giving solutions");
      }
      if (step.type === "practice_problem" || step.type === "complete_exercise") {
        constraints.push("Provide hints before solutions");
        constraints.push("Encourage multiple attempts");
      }
    }
    if (context.memoryContext.strugglingConcepts.length > 0) {
      constraints.push(
        `Be patient with: ${context.memoryContext.strugglingConcepts.slice(0, 3).join(", ")}`
      );
    }
    return constraints;
  }
  // ============================================================================
  // FORMATTING METHODS
  // ============================================================================
  formatPlanContext(context) {
    const { activePlan, currentStep, activeGoal } = context;
    if (!activePlan || !currentStep) {
      return "";
    }
    const template = this.getTemplate("planContext");
    return template.replace("{{goalTitle}}", activeGoal?.title ?? "Learning Goal").replace("{{planTitle}}", `Plan for Goal: ${activeGoal?.title ?? "Unknown"}`).replace("{{currentStep}}", currentStep.title).replace("{{stepType}}", currentStep.type).replace("{{progress}}", this.calculateProgress(context));
  }
  formatStepObjectives(objectives) {
    const limitedObjectives = objectives.slice(0, this.config.maxObjectives);
    const template = this.getTemplate("objectives");
    const objectivesList = limitedObjectives.map((obj, i) => `${i + 1}. ${obj}`).join("\n");
    return template.replace("{{objectives}}", objectivesList);
  }
  formatMemoryContext(context) {
    const { memoryContext } = context;
    const parts = [];
    if (memoryContext.masteredConcepts.length > 0) {
      parts.push(`Mastered: ${memoryContext.masteredConcepts.slice(0, 5).join(", ")}`);
    }
    if (memoryContext.strugglingConcepts.length > 0) {
      parts.push(`Needs work: ${memoryContext.strugglingConcepts.slice(0, 5).join(", ")}`);
    }
    if (memoryContext.learningStyle) {
      parts.push(`Learning style: ${memoryContext.learningStyle}`);
    }
    if (parts.length === 0) {
      return null;
    }
    return this.getTemplate("memory").replace("{{memoryContext}}", parts.join("\n"));
  }
  formatAvailableTools(context) {
    const toolList = context.allowedTools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
    return this.getTemplate("tools").replace("{{tools}}", toolList);
  }
  formatInterventions(context) {
    const interventions = context.pendingInterventions.slice(0, 3).map((i) => `- [${i.priority}] ${i.message}`).join("\n");
    return this.getTemplate("interventions").replace("{{interventions}}", interventions);
  }
  formatTemplate(type, data) {
    switch (type) {
      case "prefix":
        return `[Current Step: ${data.stepTitle} (${data.stepType}) - Progress: ${data.progress}]`;
      case "suffix":
        const objectives = data.objectives;
        if (objectives.length === 0) return "";
        return `

[Objectives for this step: ${objectives.join("; ")}]`;
      default:
        return "";
    }
  }
  // ============================================================================
  // TEMPLATE METHODS
  // ============================================================================
  getTemplate(type) {
    const templates = {
      markdown: {
        planContext: `## Current Learning Context
**Goal:** {{goalTitle}}
**Plan:** {{planTitle}}
**Current Step:** {{currentStep}} ({{stepType}})
**Progress:** {{progress}}`,
        objectives: `## Step Objectives
{{objectives}}`,
        memory: `## Learner Context
{{memoryContext}}`,
        tools: `## Available Tools
{{tools}}`,
        interventions: `## Pending Interventions
{{interventions}}`
      },
      xml: {
        planContext: `<learning-context>
  <goal>{{goalTitle}}</goal>
  <plan>{{planTitle}}</plan>
  <current-step type="{{stepType}}">{{currentStep}}</current-step>
  <progress>{{progress}}</progress>
</learning-context>`,
        objectives: `<step-objectives>
{{objectives}}
</step-objectives>`,
        memory: `<learner-context>
{{memoryContext}}
</learner-context>`,
        tools: `<available-tools>
{{tools}}
</available-tools>`,
        interventions: `<interventions>
{{interventions}}
</interventions>`
      },
      json: {
        planContext: `{"learningContext":{"goal":"{{goalTitle}}","plan":"{{planTitle}}","currentStep":"{{currentStep}}","stepType":"{{stepType}}","progress":"{{progress}}"}}`,
        objectives: `{"objectives":[{{objectives}}]}`,
        memory: `{"learnerContext":{{memoryContext}}}`,
        tools: `{"tools":[{{tools}}]}`,
        interventions: `{"interventions":[{{interventions}}]}`
      }
    };
    return templates[this.config.templateFormat]?.[type] ?? templates.markdown[type] ?? "";
  }
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  calculateProgress(context) {
    if (!context.activePlan) {
      return "0%";
    }
    const plan = context.activePlan;
    const total = plan.steps.length;
    const completed = plan.steps.filter((s) => s.status === "completed").length;
    return `${Math.round(completed / total * 100)}%`;
  }
  createDefaultLogger() {
    return {
      debug: (_message, _data) => {
      },
      info: (_message, _data) => {
      },
      warn: (message, data) => {
        console.warn(`[PlanContextInjector] ${message}`, data);
      },
      error: (message, error, data) => {
        console.error(`[PlanContextInjector] ${message}`, error, data);
      }
    };
  }
};
function createPlanContextInjector(config) {
  return new PlanContextInjector(config);
}

// src/orchestration/confirmation-gate.ts
var ConfirmationGate = class {
  config;
  logger;
  constructor(config) {
    this.config = {
      ...config,
      defaultExpiryMs: config.defaultExpiryMs ?? 3e5,
      // 5 minutes
      autoApproveForSafe: config.autoApproveForSafe ?? true,
      maxPendingPerUser: config.maxPendingPerUser ?? 10,
      logger: config.logger ?? this.createDefaultLogger(),
      onConfirmationRequired: config.onConfirmationRequired ?? (() => {
      })
    };
    this.logger = this.config.logger;
  }
  /**
   * Check if a tool requires confirmation
   */
  requiresConfirmation(tool) {
    if (this.config.autoApproveForSafe && tool.confirmationType === "none") {
      return false;
    }
    return tool.confirmationType !== "none";
  }
  /**
   * Get the confirmation type for a tool
   */
  getConfirmationType(tool) {
    return tool.confirmationType;
  }
  /**
   * Request confirmation for a tool execution
   */
  async requestConfirmation(userId, sessionId, tool, input, options = {}) {
    this.logger.info("Requesting confirmation", {
      userId,
      toolId: tool.id,
      confirmationType: tool.confirmationType
    });
    const pending = await this.config.confirmationStore.getByUser(userId, {
      status: ["pending"]
    });
    if (pending.length >= this.config.maxPendingPerUser) {
      const oldest = pending.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      await this.expireConfirmation(oldest.id);
    }
    const riskLevel = this.assessRiskLevel(tool, input);
    const expiryMs = options.expiryMs ?? this.config.defaultExpiryMs;
    const expiresAt = new Date(Date.now() + expiryMs);
    const request = await this.config.confirmationStore.create({
      userId,
      sessionId,
      toolId: tool.id,
      toolName: tool.name,
      toolDescription: tool.description,
      plannedInput: input,
      reasoning: options.reasoning ?? this.generateReasoning(tool, input),
      riskLevel,
      stepId: options.stepId ?? null,
      stepTitle: options.stepTitle ?? null,
      status: "pending",
      expiresAt,
      respondedAt: null,
      approvedBy: null,
      rejectionReason: null
    });
    this.config.onConfirmationRequired(request);
    this.logger.debug("Confirmation created", {
      confirmationId: request.id,
      riskLevel,
      expiresAt
    });
    return request;
  }
  /**
   * Respond to a confirmation request
   */
  async respond(confirmationId, response) {
    this.logger.info("Processing confirmation response", {
      confirmationId,
      approved: response.approved
    });
    const request = await this.config.confirmationStore.get(confirmationId);
    if (!request) {
      throw new Error(`Confirmation not found: ${confirmationId}`);
    }
    if (request.status !== "pending") {
      throw new Error(`Confirmation already processed: ${request.status}`);
    }
    if (/* @__PURE__ */ new Date() > request.expiresAt) {
      await this.expireConfirmation(confirmationId);
      throw new Error("Confirmation has expired");
    }
    const updatedRequest = await this.config.confirmationStore.respond(
      confirmationId,
      response
    );
    this.logger.info("Confirmation processed", {
      confirmationId,
      status: updatedRequest.status
    });
    return updatedRequest;
  }
  /**
   * Approve a confirmation request
   */
  async approve(confirmationId, _approvedBy, modifiedInput) {
    return this.respond(confirmationId, {
      requestId: confirmationId,
      approved: true,
      modifiedInput
    });
  }
  /**
   * Reject a confirmation request
   */
  async reject(confirmationId, reason) {
    return this.respond(confirmationId, {
      requestId: confirmationId,
      approved: false,
      rejectionReason: reason
    });
  }
  /**
   * Get pending confirmations for a user
   */
  async getPendingConfirmations(userId) {
    const pending = await this.config.confirmationStore.getByUser(userId, {
      status: ["pending"]
    });
    const now = /* @__PURE__ */ new Date();
    const valid = [];
    const expired = [];
    for (const request of pending) {
      if (now > request.expiresAt) {
        expired.push(request.id);
      } else {
        valid.push(request);
      }
    }
    if (expired.length > 0) {
      Promise.all(expired.map((id) => this.expireConfirmation(id))).catch((err) => {
        this.logger.error("Failed to expire confirmations", err);
      });
    }
    return valid;
  }
  /**
   * Expire a confirmation request
   */
  async expireConfirmation(confirmationId) {
    await this.config.confirmationStore.update(confirmationId, {
      status: "expired"
    });
    this.logger.debug("Confirmation expired", { confirmationId });
  }
  /**
   * Expire all old confirmations
   */
  async expireOldConfirmations(maxAgeMinutes) {
    const minutes = maxAgeMinutes ?? Math.round(this.config.defaultExpiryMs / 6e4);
    return this.config.confirmationStore.expireOld(minutes);
  }
  /**
   * Check if a confirmation is still valid
   */
  async isValid(confirmationId) {
    const request = await this.config.confirmationStore.get(confirmationId);
    if (!request) {
      return false;
    }
    if (request.status !== "pending") {
      return false;
    }
    if (/* @__PURE__ */ new Date() > request.expiresAt) {
      await this.expireConfirmation(confirmationId);
      return false;
    }
    return true;
  }
  /**
   * Get confirmation request by ID
   */
  async getConfirmation(confirmationId) {
    return this.config.confirmationStore.get(confirmationId);
  }
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  assessRiskLevel(tool, _input) {
    const riskMap = {
      none: "safe",
      implicit: "low",
      explicit: "medium",
      critical: "critical"
    };
    return riskMap[tool.confirmationType] ?? "medium";
  }
  generateReasoning(tool, _input) {
    switch (tool.confirmationType) {
      case "critical":
        return `This action (${tool.name}) requires explicit confirmation as it may have significant impact.`;
      case "explicit":
        return `Please confirm you want to proceed with ${tool.name}.`;
      case "implicit":
        return `Proceeding with ${tool.name}. Cancel if this is not intended.`;
      default:
        return `Tool ${tool.name} execution planned.`;
    }
  }
  createDefaultLogger() {
    return {
      debug: (_message, _data) => {
      },
      info: (_message, _data) => {
      },
      warn: (message, data) => {
        console.warn(`[ConfirmationGate] ${message}`, data);
      },
      error: (message, error, data) => {
        console.error(`[ConfirmationGate] ${message}`, error, data);
      }
    };
  }
};
function createConfirmationGate(config) {
  return new ConfirmationGate(config);
}

// src/orchestration/stores.ts
var InMemoryOrchestrationConfirmationStore = class {
  requests = /* @__PURE__ */ new Map();
  async create(request) {
    const id = `confirm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = /* @__PURE__ */ new Date();
    const fullRequest = {
      ...request,
      id,
      createdAt
    };
    this.requests.set(id, fullRequest);
    return fullRequest;
  }
  async get(requestId) {
    return this.requests.get(requestId) ?? null;
  }
  async getByUser(userId, options) {
    let requests = Array.from(this.requests.values()).filter(
      (r) => r.userId === userId
    );
    if (options?.status) {
      requests = requests.filter((r) => options.status.includes(r.status));
    }
    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (options?.limit) {
      requests = requests.slice(0, options.limit);
    }
    return requests;
  }
  async update(requestId, updates) {
    const existing = this.requests.get(requestId);
    if (!existing) {
      throw new Error(`Confirmation request not found: ${requestId}`);
    }
    const updated = {
      ...existing,
      ...updates
    };
    this.requests.set(requestId, updated);
    return updated;
  }
  async respond(requestId, response) {
    const existing = this.requests.get(requestId);
    if (!existing) {
      throw new Error(`Confirmation request not found: ${requestId}`);
    }
    const updated = {
      ...existing,
      status: response.approved ? "approved" : "rejected",
      respondedAt: /* @__PURE__ */ new Date(),
      rejectionReason: response.rejectionReason ?? null
    };
    this.requests.set(requestId, updated);
    return updated;
  }
  async expireOld(maxAgeMinutes) {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1e3);
    let expired = 0;
    for (const [id, request] of this.requests) {
      if (request.status === "pending" && request.createdAt < cutoff) {
        request.status = "expired";
        this.requests.set(id, request);
        expired++;
      }
    }
    return expired;
  }
  // Utility methods for testing/management
  clear() {
    this.requests.clear();
  }
  size() {
    return this.requests.size;
  }
  getAll() {
    return Array.from(this.requests.values());
  }
};
var InMemoryTutoringSessionStore = class {
  sessions = /* @__PURE__ */ new Map();
  userActiveSessions = /* @__PURE__ */ new Map();
  async getOrCreate(userId, planId) {
    const activeSessionId = this.userActiveSessions.get(userId);
    if (activeSessionId) {
      const existingSession = this.sessions.get(activeSessionId);
      if (existingSession && !existingSession.endedAt) {
        existingSession.startedAt = existingSession.startedAt;
        return existingSession;
      }
    }
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = /* @__PURE__ */ new Date();
    const session = {
      id,
      userId,
      planId: planId ?? null,
      startedAt: now,
      endedAt: null,
      messageCount: 0,
      stepsCompleted: [],
      toolsExecuted: [],
      metadata: {}
    };
    this.sessions.set(id, session);
    this.userActiveSessions.set(userId, id);
    return session;
  }
  async update(sessionId, updates) {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }
    const updated = {
      ...existing,
      ...updates
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }
  async end(sessionId) {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }
    const ended = {
      ...existing,
      endedAt: /* @__PURE__ */ new Date()
    };
    this.sessions.set(sessionId, ended);
    if (this.userActiveSessions.get(existing.userId) === sessionId) {
      this.userActiveSessions.delete(existing.userId);
    }
    return ended;
  }
  async getActive(userId) {
    const activeSessionId = this.userActiveSessions.get(userId);
    if (!activeSessionId) {
      return null;
    }
    const session = this.sessions.get(activeSessionId);
    if (!session || session.endedAt) {
      this.userActiveSessions.delete(userId);
      return null;
    }
    return session;
  }
  async getRecent(userId, limit) {
    let sessions = Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId
    );
    sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    if (limit) {
      sessions = sessions.slice(0, limit);
    }
    return sessions;
  }
  // Utility methods for testing/management
  async get(sessionId) {
    return this.sessions.get(sessionId) ?? null;
  }
  clear() {
    this.sessions.clear();
    this.userActiveSessions.clear();
  }
  size() {
    return this.sessions.size;
  }
  getAll() {
    return Array.from(this.sessions.values());
  }
};
function createInMemoryOrchestrationConfirmationStore() {
  return new InMemoryOrchestrationConfirmationStore();
}
function createInMemorySessionStore() {
  return new InMemoryTutoringSessionStore();
}
function createInMemoryOrchestrationStores() {
  return {
    confirmationStore: new InMemoryOrchestrationConfirmationStore(),
    sessionStore: new InMemoryTutoringSessionStore()
  };
}

// src/learning-path/skill-tracker.ts
var SkillTracker = class {
  store;
  logger;
  masteryThreshold;
  struggleThreshold;
  decayRatePerDay;
  maxMasteryGain;
  minMasteryLoss;
  constructor(config) {
    this.store = config.store;
    this.logger = config.logger;
    this.masteryThreshold = config.masteryThreshold ?? 80;
    this.struggleThreshold = config.struggleThreshold ?? 40;
    this.decayRatePerDay = config.decayRatePerDay ?? 0.02;
    this.maxMasteryGain = config.maxMasteryGain ?? 20;
    this.minMasteryLoss = config.minMasteryLoss ?? 5;
  }
  /**
   * Get user's complete skill profile
   */
  async getSkillProfile(userId) {
    const existing = await this.store.getSkillProfile(userId);
    if (existing) {
      const updatedSkills = existing.skills.map(
        (skill) => this.applySkillDecay(skill)
      );
      return {
        ...existing,
        skills: updatedSkills,
        masteredConcepts: updatedSkills.filter((s) => s.masteryLevel >= this.masteryThreshold).map((s) => s.conceptId),
        inProgressConcepts: updatedSkills.filter(
          (s) => s.masteryLevel >= this.struggleThreshold && s.masteryLevel < this.masteryThreshold
        ).map((s) => s.conceptId),
        strugglingConcepts: updatedSkills.filter((s) => s.masteryLevel < this.struggleThreshold).map((s) => s.conceptId)
      };
    }
    const newProfile = {
      userId,
      skills: [],
      masteredConcepts: [],
      inProgressConcepts: [],
      strugglingConcepts: [],
      totalLearningTimeMinutes: 0,
      streakDays: 0,
      lastActivityAt: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    await this.store.saveSkillProfile(newProfile);
    return newProfile;
  }
  /**
   * Record performance and update skill mastery
   */
  async recordPerformance(performance) {
    const { userId, conceptId } = performance;
    let skill = await this.store.getSkill(userId, conceptId);
    const previousMastery = skill?.masteryLevel ?? 0;
    if (!skill) {
      skill = this.createNewSkill(conceptId, performance);
    } else {
      skill = this.updateExistingSkill(skill, performance);
    }
    await this.store.updateSkill(userId, skill);
    const profile = await this.getSkillProfile(userId);
    profile.totalLearningTimeMinutes += performance.timeSpentMinutes ?? 0;
    profile.lastActivityAt = /* @__PURE__ */ new Date();
    profile.updatedAt = /* @__PURE__ */ new Date();
    profile.streakDays = this.calculateStreak(profile.lastActivityAt);
    await this.store.saveSkillProfile(profile);
    const unlockedConcepts = await this.getNewlyUnlockedConcepts(
      userId,
      conceptId,
      skill.masteryLevel
    );
    const recommendedNext = await this.getRecommendedNextConcepts(
      userId,
      conceptId
    );
    this.logger?.debug("Skill updated", {
      userId,
      conceptId,
      previousMastery,
      newMastery: skill.masteryLevel
    });
    return {
      conceptId,
      previousMastery,
      newMastery: skill.masteryLevel,
      masteryChange: skill.masteryLevel - previousMastery,
      newTrend: skill.strengthTrend,
      unlockedConcepts,
      recommendedNext
    };
  }
  /**
   * Get concepts that are due for spaced repetition review
   */
  async getConceptsDueForReview(userId, limit = 10) {
    return this.store.getConceptsDueForReview(userId, limit);
  }
  /**
   * Get concepts the user is struggling with
   */
  async getStrugglingConcepts(userId, limit = 5) {
    return this.store.getStrugglingConcepts(userId, limit);
  }
  /**
   * Calculate spaced repetition schedule using SM-2 algorithm
   */
  calculateSpacedRepetition(schedule, quality) {
    let { interval, easeFactor, consecutiveCorrect } = schedule;
    if (quality < 3) {
      consecutiveCorrect = 0;
      interval = 1;
    } else {
      consecutiveCorrect++;
      if (consecutiveCorrect === 1) {
        interval = 1;
      } else if (consecutiveCorrect === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    const nextReviewAt = /* @__PURE__ */ new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);
    return {
      ...schedule,
      interval,
      easeFactor,
      consecutiveCorrect,
      nextReviewAt,
      lastReviewAt: /* @__PURE__ */ new Date(),
      reviewCount: schedule.reviewCount + 1
    };
  }
  /**
   * Check if user has mastered prerequisites for a concept
   */
  async checkPrerequisitesMet(userId, _conceptId, prerequisites) {
    const profile = await this.getSkillProfile(userId);
    const masteredSet = new Set(profile.masteredConcepts);
    const missing = prerequisites.filter((prereq) => !masteredSet.has(prereq));
    return {
      met: missing.length === 0,
      missing
    };
  }
  /**
   * Get mastery level for a specific concept
   */
  async getMasteryLevel(userId, conceptId) {
    const skill = await this.store.getSkill(userId, conceptId);
    return skill?.masteryLevel ?? 0;
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  createNewSkill(conceptId, performance) {
    const now = /* @__PURE__ */ new Date();
    const baseMastery = this.calculateInitialMastery(performance);
    return {
      conceptId,
      conceptName: "",
      // Will be filled by the adapter
      masteryLevel: baseMastery,
      confidenceScore: performance.score ? performance.score / 100 : 0.5,
      practiceCount: 1,
      correctCount: performance.completed && (performance.score ?? 0) >= 60 ? 1 : 0,
      lastPracticedAt: now,
      firstLearnedAt: now,
      strengthTrend: "new",
      nextReviewAt: this.calculateNextReview(baseMastery),
      retentionScore: baseMastery
    };
  }
  updateExistingSkill(skill, performance) {
    const masteryDelta = this.calculateMasteryDelta(skill, performance);
    const newMastery = Math.max(0, Math.min(100, skill.masteryLevel + masteryDelta));
    const isCorrect = performance.completed && (performance.score ?? 0) >= 60;
    return {
      ...skill,
      masteryLevel: newMastery,
      confidenceScore: this.updateConfidence(skill.confidenceScore, performance),
      practiceCount: skill.practiceCount + 1,
      correctCount: skill.correctCount + (isCorrect ? 1 : 0),
      lastPracticedAt: /* @__PURE__ */ new Date(),
      strengthTrend: this.determineStrengthTrend(skill.masteryLevel, newMastery, skill.strengthTrend),
      nextReviewAt: this.calculateNextReview(newMastery),
      retentionScore: this.calculateRetention(skill, newMastery)
    };
  }
  calculateInitialMastery(performance) {
    let mastery = 0;
    if (performance.completed) {
      mastery += 30;
    }
    if (performance.score !== void 0) {
      mastery += performance.score / 100 * 40;
    }
    if (performance.struggled) {
      mastery -= 15;
    }
    return Math.max(0, Math.min(100, mastery));
  }
  calculateMasteryDelta(skill, performance) {
    let delta = 0;
    if (performance.completed) {
      if (performance.score !== void 0) {
        if (performance.score >= 90) {
          delta = this.maxMasteryGain;
        } else if (performance.score >= 70) {
          delta = this.maxMasteryGain * 0.7;
        } else if (performance.score >= 50) {
          delta = this.maxMasteryGain * 0.3;
        } else {
          delta = -this.minMasteryLoss;
        }
      } else {
        delta = this.maxMasteryGain * 0.5;
      }
    } else if (performance.struggled) {
      delta = -this.minMasteryLoss * 1.5;
    }
    if (skill.masteryLevel >= 80) {
      delta *= 0.5;
    } else if (skill.masteryLevel >= 60) {
      delta *= 0.75;
    }
    return delta;
  }
  updateConfidence(currentConfidence, performance) {
    const performanceConfidence = performance.score ? performance.score / 100 : performance.completed ? 0.6 : 0.3;
    return currentConfidence * 0.6 + performanceConfidence * 0.4;
  }
  determineStrengthTrend(previousMastery, newMastery, currentTrend) {
    const delta = newMastery - previousMastery;
    if (delta > 5) return "improving";
    if (delta < -5) return "declining";
    return currentTrend === "new" ? "stable" : currentTrend;
  }
  applySkillDecay(skill) {
    const daysSinceLastPractice = Math.floor(
      (Date.now() - skill.lastPracticedAt.getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysSinceLastPractice <= 1) {
      return skill;
    }
    const decayAmount = daysSinceLastPractice * this.decayRatePerDay * skill.masteryLevel;
    const decayedMastery = Math.max(0, skill.masteryLevel - decayAmount);
    const retentionScore = Math.max(0, (skill.retentionScore ?? skill.masteryLevel) - decayAmount * 0.5);
    return {
      ...skill,
      masteryLevel: decayedMastery,
      retentionScore,
      strengthTrend: decayedMastery < skill.masteryLevel - 10 ? "declining" : skill.strengthTrend
    };
  }
  calculateNextReview(masteryLevel) {
    const now = /* @__PURE__ */ new Date();
    let daysUntilReview;
    if (masteryLevel >= 90) {
      daysUntilReview = 14;
    } else if (masteryLevel >= 70) {
      daysUntilReview = 7;
    } else if (masteryLevel >= 50) {
      daysUntilReview = 3;
    } else {
      daysUntilReview = 1;
    }
    now.setDate(now.getDate() + daysUntilReview);
    return now;
  }
  calculateRetention(skill, newMastery) {
    const baseRetention = skill.retentionScore ?? skill.masteryLevel;
    const practiceBonus = Math.min(10, skill.practiceCount * 2);
    return Math.min(100, (baseRetention + newMastery) / 2 + practiceBonus);
  }
  calculateStreak(lastActivityAt) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = new Date(lastActivityAt);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysDiff <= 1) {
      return 1;
    }
    return 0;
  }
  async getNewlyUnlockedConcepts(_userId, _conceptId, newMasteryLevel) {
    if (newMasteryLevel >= this.masteryThreshold) {
      return [];
    }
    return [];
  }
  async getRecommendedNextConcepts(_userId, _completedConceptId) {
    return [];
  }
};
function createSkillTracker(config) {
  return new SkillTracker(config);
}

// src/learning-path/path-recommender.ts
var LearningPathRecommender = class {
  pathStore;
  courseGraphStore;
  skillTracker;
  logger;
  defaultMaxSteps;
  defaultMaxMinutes;
  pathExpirationHours;
  constructor(config) {
    this.pathStore = config.pathStore;
    this.courseGraphStore = config.courseGraphStore;
    this.skillTracker = config.skillTracker;
    this.logger = config.logger;
    this.defaultMaxSteps = config.defaultMaxSteps ?? 10;
    this.defaultMaxMinutes = config.defaultMaxMinutes ?? 60;
    this.pathExpirationHours = config.pathExpirationHours ?? 24;
  }
  /**
   * Generate a personalized learning path
   */
  async generatePath(userId, options = {}) {
    const maxSteps = options.maxSteps ?? this.defaultMaxSteps;
    const maxMinutes = options.maxMinutes ?? this.defaultMaxMinutes;
    const skillProfile = await this.skillTracker.getSkillProfile(userId);
    let courseGraph = null;
    if (options.courseId) {
      courseGraph = await this.courseGraphStore.getCourseGraph(options.courseId);
    }
    const steps = [];
    let totalMinutes = 0;
    if (options.focusOnWeakAreas !== false) {
      const strugglingSteps = await this.buildStrugglingConceptSteps(
        skillProfile,
        courseGraph?.concepts ?? [],
        maxSteps - steps.length,
        maxMinutes - totalMinutes
      );
      for (const step of strugglingSteps) {
        if (steps.length >= maxSteps || totalMinutes >= maxMinutes) break;
        steps.push({ ...step, order: steps.length + 1 });
        totalMinutes += step.estimatedMinutes;
      }
    }
    const inProgressSteps = await this.buildInProgressSteps(
      skillProfile,
      courseGraph?.concepts ?? [],
      maxSteps - steps.length,
      maxMinutes - totalMinutes
    );
    for (const step of inProgressSteps) {
      if (steps.length >= maxSteps || totalMinutes >= maxMinutes) break;
      steps.push({ ...step, order: steps.length + 1 });
      totalMinutes += step.estimatedMinutes;
    }
    if (courseGraph) {
      const newConceptSteps = await this.buildNewConceptSteps(
        userId,
        skillProfile,
        courseGraph.concepts,
        courseGraph.prerequisites,
        maxSteps - steps.length,
        maxMinutes - totalMinutes,
        options.difficultyPreference
      );
      for (const step of newConceptSteps) {
        if (steps.length >= maxSteps || totalMinutes >= maxMinutes) break;
        steps.push({ ...step, order: steps.length + 1 });
        totalMinutes += step.estimatedMinutes;
      }
    }
    if (options.includeReview !== false) {
      const reviewSteps = await this.buildReviewSteps(
        userId,
        skillProfile,
        courseGraph?.concepts ?? [],
        maxSteps - steps.length,
        maxMinutes - totalMinutes
      );
      for (const step of reviewSteps) {
        if (steps.length >= maxSteps || totalMinutes >= maxMinutes) break;
        steps.push({ ...step, order: steps.length + 1 });
        totalMinutes += step.estimatedMinutes;
      }
    }
    const difficulty = this.calculatePathDifficulty(steps, courseGraph?.concepts ?? []);
    const confidence = this.calculateConfidence(skillProfile, steps.length, courseGraph);
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + this.pathExpirationHours);
    const path = {
      id: v4_default(),
      userId,
      courseId: options.courseId,
      targetConceptId: options.targetConceptId,
      steps,
      totalEstimatedMinutes: totalMinutes,
      difficulty,
      confidence,
      reason: this.generatePathReason(steps, skillProfile),
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt
    };
    await this.pathStore.saveLearningPath(path);
    this.logger?.info("Learning path generated", {
      userId,
      courseId: options.courseId,
      stepCount: steps.length,
      totalMinutes,
      confidence
    });
    return path;
  }
  /**
   * Get active learning path for a user
   */
  async getActivePath(userId, courseId) {
    if (courseId) {
      return this.pathStore.getPathForCourse(userId, courseId);
    }
    const paths = await this.pathStore.getActiveLearningPaths(userId);
    return paths[0] ?? null;
  }
  /**
   * Mark a step as completed
   */
  async completeStep(pathId, stepOrder) {
    await this.pathStore.markStepCompleted(pathId, stepOrder);
  }
  /**
   * Generate a path to reach a specific target concept
   */
  async generatePathToTarget(userId, targetConceptId, courseId) {
    const skillProfile = await this.skillTracker.getSkillProfile(userId);
    const courseGraph = await this.courseGraphStore.getCourseGraph(courseId);
    if (!courseGraph) {
      throw new Error(`Course graph not found for courseId: ${courseId}`);
    }
    const requiredConcepts = await this.findAllPrerequisites(
      targetConceptId,
      courseGraph.prerequisites,
      /* @__PURE__ */ new Set()
    );
    const masteredSet = new Set(skillProfile.masteredConcepts);
    const neededConcepts = Array.from(requiredConcepts).filter(
      (id) => !masteredSet.has(id)
    );
    if (!masteredSet.has(targetConceptId)) {
      neededConcepts.push(targetConceptId);
    }
    const steps = await this.buildOrderedSteps(
      neededConcepts,
      courseGraph.concepts,
      courseGraph.prerequisites,
      skillProfile
    );
    const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    const difficulty = this.calculatePathDifficulty(steps, courseGraph.concepts);
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setHours(expiresAt.getHours() + this.pathExpirationHours * 2);
    const path = {
      id: v4_default(),
      userId,
      courseId,
      targetConceptId,
      steps,
      totalEstimatedMinutes: totalMinutes,
      difficulty,
      confidence: 0.8,
      reason: `Path to master "${this.getConceptName(targetConceptId, courseGraph.concepts)}" including ${neededConcepts.length} prerequisite concepts.`,
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt
    };
    await this.pathStore.saveLearningPath(path);
    return path;
  }
  // ============================================================================
  // PRIVATE METHODS - STEP BUILDERS
  // ============================================================================
  async buildStrugglingConceptSteps(profile, concepts, maxSteps, maxMinutes) {
    const steps = [];
    let totalMinutes = 0;
    const strugglingSkills = profile.skills.filter(
      (s) => profile.strugglingConcepts.includes(s.conceptId)
    );
    strugglingSkills.sort((a, b) => a.masteryLevel - b.masteryLevel);
    for (const skill of strugglingSkills) {
      if (steps.length >= maxSteps || totalMinutes >= maxMinutes) break;
      const concept = concepts.find((c) => c.id === skill.conceptId);
      const estimatedMinutes = concept?.estimatedMinutes ?? 15;
      if (totalMinutes + estimatedMinutes > maxMinutes) continue;
      steps.push({
        conceptId: skill.conceptId,
        conceptName: skill.conceptName || concept?.name || "Unknown Concept",
        action: "review",
        priority: "critical",
        estimatedMinutes,
        reason: `Struggling area (${skill.masteryLevel}% mastery) - focused review needed`,
        prerequisites: []
      });
      totalMinutes += estimatedMinutes;
    }
    return steps;
  }
  async buildInProgressSteps(profile, concepts, maxSteps, maxMinutes) {
    const steps = [];
    let totalMinutes = 0;
    const inProgressSkills = profile.skills.filter(
      (s) => profile.inProgressConcepts.includes(s.conceptId)
    );
    inProgressSkills.sort((a, b) => b.masteryLevel - a.masteryLevel);
    for (const skill of inProgressSkills) {
      if (steps.length >= maxSteps || totalMinutes >= maxMinutes) break;
      const concept = concepts.find((c) => c.id === skill.conceptId);
      const estimatedMinutes = concept?.estimatedMinutes ?? 20;
      if (totalMinutes + estimatedMinutes > maxMinutes) continue;
      const action = skill.masteryLevel >= 60 ? "practice" : "learn";
      steps.push({
        conceptId: skill.conceptId,
        conceptName: skill.conceptName || concept?.name || "Unknown Concept",
        action,
        priority: "high",
        estimatedMinutes,
        reason: `Continue learning (${skill.masteryLevel}% complete)`,
        prerequisites: []
      });
      totalMinutes += estimatedMinutes;
    }
    return steps;
  }
  async buildNewConceptSteps(userId, profile, concepts, prerequisites, maxSteps, maxMinutes, difficultyPreference) {
    const steps = [];
    let totalMinutes = 0;
    const knownConceptIds = /* @__PURE__ */ new Set([
      ...profile.masteredConcepts,
      ...profile.inProgressConcepts,
      ...profile.strugglingConcepts
    ]);
    const newConcepts = concepts.filter((c) => !knownConceptIds.has(c.id));
    if (difficultyPreference) {
      const difficultyOrder = {
        beginner: 0,
        intermediate: 1,
        advanced: 2,
        expert: 3
      };
      const prefOrder = difficultyOrder[difficultyPreference];
      newConcepts.sort((a, b) => {
        const aDiff = Math.abs(difficultyOrder[a.difficulty] - prefOrder);
        const bDiff = Math.abs(difficultyOrder[b.difficulty] - prefOrder);
        return aDiff - bDiff;
      });
    } else {
      newConcepts.sort((a, b) => {
        const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      });
    }
    for (const concept of newConcepts) {
      if (steps.length >= maxSteps || totalMinutes >= maxMinutes) break;
      const conceptPrereqs = prerequisites.filter((p) => p.conceptId === concept.id).map((p) => p.requiresConceptId);
      const prereqCheck = await this.skillTracker.checkPrerequisitesMet(
        userId,
        concept.id,
        conceptPrereqs
      );
      if (!prereqCheck.met) continue;
      const estimatedMinutes = concept.estimatedMinutes ?? 25;
      if (totalMinutes + estimatedMinutes > maxMinutes) continue;
      steps.push({
        conceptId: concept.id,
        conceptName: concept.name,
        action: "learn",
        priority: "medium",
        estimatedMinutes,
        reason: "Next concept in learning sequence",
        prerequisites: conceptPrereqs
      });
      totalMinutes += estimatedMinutes;
    }
    return steps;
  }
  async buildReviewSteps(userId, _profile, concepts, maxSteps, maxMinutes) {
    const steps = [];
    let totalMinutes = 0;
    const dueForReview = await this.skillTracker.getConceptsDueForReview(userId, maxSteps);
    for (const skill of dueForReview) {
      if (steps.length >= maxSteps || totalMinutes >= maxMinutes) break;
      const concept = concepts.find((c) => c.id === skill.conceptId);
      const estimatedMinutes = 10;
      if (totalMinutes + estimatedMinutes > maxMinutes) continue;
      const daysSinceLastPractice = Math.floor(
        (Date.now() - skill.lastPracticedAt.getTime()) / (1e3 * 60 * 60 * 24)
      );
      steps.push({
        conceptId: skill.conceptId,
        conceptName: skill.conceptName || concept?.name || "Unknown Concept",
        action: "assess",
        priority: "low",
        estimatedMinutes,
        reason: `Spaced repetition review (${daysSinceLastPractice} days since last practice)`,
        prerequisites: []
      });
      totalMinutes += estimatedMinutes;
    }
    return steps;
  }
  async buildOrderedSteps(conceptIds, concepts, prerequisites, profile) {
    const sorted = this.topologicalSort(conceptIds, prerequisites);
    const steps = [];
    for (let i = 0; i < sorted.length; i++) {
      const conceptId = sorted[i];
      const concept = concepts.find((c) => c.id === conceptId);
      const skill = profile.skills.find((s) => s.conceptId === conceptId);
      const conceptPrereqs = prerequisites.filter((p) => p.conceptId === conceptId).map((p) => p.requiresConceptId);
      let action = "learn";
      let priority = "medium";
      if (skill) {
        if (skill.masteryLevel < 40) {
          action = "review";
          priority = "high";
        } else if (skill.masteryLevel < 80) {
          action = "practice";
          priority = "medium";
        } else {
          action = "assess";
          priority = "low";
        }
      }
      steps.push({
        order: i + 1,
        conceptId,
        conceptName: concept?.name || "Unknown Concept",
        action,
        priority,
        estimatedMinutes: concept?.estimatedMinutes ?? 20,
        reason: skill ? `Continue from ${skill.masteryLevel}% mastery` : "New concept to learn",
        prerequisites: conceptPrereqs
      });
    }
    return steps;
  }
  // ============================================================================
  // PRIVATE METHODS - UTILITIES
  // ============================================================================
  async findAllPrerequisites(conceptId, prerequisites, visited) {
    const result = /* @__PURE__ */ new Set();
    visited.add(conceptId);
    const directPrereqs = prerequisites.filter((p) => p.conceptId === conceptId).map((p) => p.requiresConceptId);
    for (const prereqId of directPrereqs) {
      if (!visited.has(prereqId)) {
        result.add(prereqId);
        const transitive = await this.findAllPrerequisites(
          prereqId,
          prerequisites,
          visited
        );
        for (const id of transitive) {
          result.add(id);
        }
      }
    }
    return result;
  }
  topologicalSort(conceptIds, prerequisites) {
    const graph = /* @__PURE__ */ new Map();
    const inDegree = /* @__PURE__ */ new Map();
    for (const id of conceptIds) {
      graph.set(id, []);
      inDegree.set(id, 0);
    }
    for (const prereq of prerequisites) {
      if (conceptIds.includes(prereq.conceptId) && conceptIds.includes(prereq.requiresConceptId)) {
        const neighbors = graph.get(prereq.requiresConceptId) ?? [];
        neighbors.push(prereq.conceptId);
        graph.set(prereq.requiresConceptId, neighbors);
        inDegree.set(prereq.conceptId, (inDegree.get(prereq.conceptId) ?? 0) + 1);
      }
    }
    const queue = [];
    const result = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }
    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);
      for (const neighbor of graph.get(current) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    for (const id of conceptIds) {
      if (!result.includes(id)) {
        result.push(id);
      }
    }
    return result;
  }
  calculatePathDifficulty(steps, concepts) {
    if (steps.length === 0) return "beginner";
    const difficulties = steps.map((step) => {
      const concept = concepts.find((c) => c.id === step.conceptId);
      return concept?.difficulty ?? "intermediate";
    });
    const difficultyWeights = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4
    };
    const avgWeight = difficulties.reduce((sum, d) => sum + difficultyWeights[d], 0) / difficulties.length;
    if (avgWeight <= 1.5) return "beginner";
    if (avgWeight <= 2.5) return "intermediate";
    if (avgWeight <= 3.5) return "advanced";
    return "expert";
  }
  calculateConfidence(profile, stepCount, courseGraph) {
    let confidence = 0.5;
    if (profile.skills.length > 10) confidence += 0.2;
    else if (profile.skills.length > 5) confidence += 0.1;
    if (courseGraph && courseGraph.concepts.length > 0) {
      const coverage = profile.skills.length / courseGraph.concepts.length;
      confidence += coverage * 0.2;
    }
    if (stepCount >= 3) confidence += 0.1;
    return Math.min(confidence, 1);
  }
  generatePathReason(steps, profile) {
    const parts = [];
    const reviewSteps = steps.filter((s) => s.action === "review").length;
    const learnSteps = steps.filter((s) => s.action === "learn").length;
    const practiceSteps = steps.filter((s) => s.action === "practice").length;
    const assessSteps = steps.filter((s) => s.action === "assess").length;
    if (reviewSteps > 0) {
      parts.push(`${reviewSteps} to review`);
    }
    if (learnSteps > 0) {
      parts.push(`${learnSteps} to learn`);
    }
    if (practiceSteps > 0) {
      parts.push(`${practiceSteps} to practice`);
    }
    if (assessSteps > 0) {
      parts.push(`${assessSteps} to assess`);
    }
    if (profile.strugglingConcepts.length > 0) {
      parts.push("focusing on areas needing improvement");
    }
    return parts.length > 0 ? `Personalized path: ${parts.join(", ")}.` : "Continue your learning journey.";
  }
  getConceptName(conceptId, concepts) {
    const concept = concepts.find((c) => c.id === conceptId);
    return concept?.name ?? "Unknown Concept";
  }
};
function createPathRecommender(config) {
  return new LearningPathRecommender(config);
}

// src/realtime/types.ts
var import_zod15 = require("zod");
var SAMEventType = {
  // Proactive events (server -> client)
  INTERVENTION: "intervention",
  CHECKIN: "checkin",
  RECOMMENDATION: "recommendation",
  STEP_COMPLETED: "step_completed",
  GOAL_PROGRESS: "goal_progress",
  NUDGE: "nudge",
  PRESENCE_UPDATE: "presence_update",
  SESSION_SYNC: "session_sync",
  CELEBRATION: "celebration",
  // Client events (client -> server)
  ACTIVITY: "activity",
  HEARTBEAT: "heartbeat",
  ACKNOWLEDGE: "acknowledge",
  DISMISS: "dismiss",
  RESPOND: "respond",
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  // System events
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
  RECONNECTING: "reconnecting"
};
var NudgeType = {
  REMINDER: "reminder",
  ENCOURAGEMENT: "encouragement",
  TIP: "tip",
  STREAK_ALERT: "streak_alert",
  BREAK_SUGGESTION: "break_suggestion",
  STUDY_PROMPT: "study_prompt",
  ACHIEVEMENT: "achievement"
};
var CelebrationType = {
  GOAL_COMPLETED: "goal_completed",
  MILESTONE_REACHED: "milestone_reached",
  STREAK_MILESTONE: "streak_milestone",
  BADGE_EARNED: "badge_earned",
  LEVEL_UP: "level_up",
  COURSE_COMPLETED: "course_completed",
  MASTERY_ACHIEVED: "mastery_achieved"
};
var PresenceStatus = {
  ONLINE: "online",
  AWAY: "away",
  IDLE: "idle",
  STUDYING: "studying",
  OFFLINE: "offline",
  DO_NOT_DISTURB: "do_not_disturb"
};
var PresenceChangeReason = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ACTIVITY: "activity",
  IDLE_TIMEOUT: "idle_timeout",
  AWAY_TIMEOUT: "away_timeout",
  USER_SET: "user_set",
  SESSION_END: "session_end"
};
var ConnectionState = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTED: "disconnected",
  FAILED: "failed"
};
var DEFAULT_CONNECTION_CONFIG = {
  url: "/api/sam/ws",
  maxReconnectAttempts: 5,
  reconnectDelay: 1e3,
  heartbeatInterval: 3e4,
  idleTimeout: 6e4,
  // 1 minute
  awayTimeout: 3e5,
  // 5 minutes
  autoReconnect: true
};
var DeliveryChannel = {
  WEBSOCKET: "websocket",
  SSE: "sse",
  PUSH_NOTIFICATION: "push_notification",
  EMAIL: "email",
  IN_APP: "in_app"
};
var DeliveryPriority = {
  CRITICAL: "critical",
  HIGH: "high",
  NORMAL: "normal",
  LOW: "low"
};
var DEFAULT_PUSH_DISPATCHER_CONFIG = {
  maxQueueSize: 1e3,
  batchSize: 50,
  processingInterval: 100,
  retryAttempts: 3,
  retryDelay: 1e3,
  defaultExpirationMs: 36e5
  // 1 hour
};
var InterventionSurface = {
  TOAST: "toast",
  MODAL: "modal",
  SIDEBAR: "sidebar",
  INLINE: "inline",
  FLOATING: "floating",
  BANNER: "banner",
  ASSISTANT_PANEL: "assistant_panel",
  DASHBOARD_WIDGET: "dashboard_widget"
};
var SAMWebSocketEventSchema = import_zod15.z.object({
  type: import_zod15.z.string(),
  payload: import_zod15.z.unknown(),
  timestamp: import_zod15.z.date(),
  eventId: import_zod15.z.string().min(1),
  userId: import_zod15.z.string().optional(),
  sessionId: import_zod15.z.string().optional()
});
var ConnectionConfigSchema = import_zod15.z.object({
  url: import_zod15.z.string().url(),
  maxReconnectAttempts: import_zod15.z.number().min(0).max(20),
  reconnectDelay: import_zod15.z.number().min(100).max(6e4),
  heartbeatInterval: import_zod15.z.number().min(5e3).max(3e5),
  idleTimeout: import_zod15.z.number().min(1e4).max(6e5),
  awayTimeout: import_zod15.z.number().min(6e4).max(36e5),
  autoReconnect: import_zod15.z.boolean(),
  authToken: import_zod15.z.string().optional()
});
var PushDeliveryRequestSchema = import_zod15.z.object({
  id: import_zod15.z.string().min(1),
  userId: import_zod15.z.string().min(1),
  event: SAMWebSocketEventSchema,
  priority: import_zod15.z.enum(["critical", "high", "normal", "low"]),
  channels: import_zod15.z.array(import_zod15.z.enum(["websocket", "sse", "push_notification", "email", "in_app"])),
  fallbackChannels: import_zod15.z.array(import_zod15.z.enum(["websocket", "sse", "push_notification", "email", "in_app"])).optional(),
  expiresAt: import_zod15.z.date().optional(),
  metadata: import_zod15.z.record(import_zod15.z.unknown()).optional()
});

// src/realtime/presence-tracker.ts
var InMemoryPresenceStore = class {
  presences = /* @__PURE__ */ new Map();
  connectionIndex = /* @__PURE__ */ new Map();
  // connectionId -> userId
  async get(userId) {
    return this.presences.get(userId) ?? null;
  }
  async getByConnection(connectionId) {
    const userId = this.connectionIndex.get(connectionId);
    if (!userId) return null;
    return this.presences.get(userId) ?? null;
  }
  async set(presence) {
    this.presences.set(presence.userId, presence);
    this.connectionIndex.set(presence.connectionId, presence.userId);
  }
  async update(userId, updates) {
    const existing = this.presences.get(userId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.presences.set(userId, updated);
    return updated;
  }
  async delete(userId) {
    const presence = this.presences.get(userId);
    if (presence) {
      this.connectionIndex.delete(presence.connectionId);
    }
    return this.presences.delete(userId);
  }
  async deleteByConnection(connectionId) {
    const userId = this.connectionIndex.get(connectionId);
    if (!userId) return false;
    this.connectionIndex.delete(connectionId);
    return this.presences.delete(userId);
  }
  async getOnline() {
    return Array.from(this.presences.values()).filter(
      (p) => p.status === PresenceStatus.ONLINE || p.status === PresenceStatus.STUDYING
    );
  }
  async getByStatus(status) {
    return Array.from(this.presences.values()).filter((p) => p.status === status);
  }
  async cleanup(olderThan) {
    let count = 0;
    for (const [userId, presence] of this.presences) {
      if (presence.lastActivityAt < olderThan && presence.status === PresenceStatus.OFFLINE) {
        this.connectionIndex.delete(presence.connectionId);
        this.presences.delete(userId);
        count++;
      }
    }
    return count;
  }
  clear() {
    this.presences.clear();
    this.connectionIndex.clear();
  }
};
var DEFAULT_PRESENCE_CONFIG = {
  idleTimeoutMs: 6e4,
  awayTimeoutMs: 3e5,
  offlineTimeoutMs: 18e5,
  checkIntervalMs: 1e4,
  autoCheckTimeouts: true
};
var PresenceTracker = class {
  store;
  config;
  logger;
  listeners = /* @__PURE__ */ new Set();
  checkInterval;
  isRunning = false;
  constructor(options) {
    this.store = options.store ?? new InMemoryPresenceStore();
    this.config = { ...DEFAULT_PRESENCE_CONFIG, ...options.config };
    this.logger = options.logger ?? console;
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.config.autoCheckTimeouts) {
      this.checkInterval = setInterval(() => {
        this.checkTimeouts().catch((err) => {
          this.logger.error("Error checking presence timeouts", {
            error: err instanceof Error ? err.message : "Unknown error"
          });
        });
      }, this.config.checkIntervalMs);
    }
    this.logger.info("Presence tracker started", {
      idleTimeoutMs: this.config.idleTimeoutMs,
      awayTimeoutMs: this.config.awayTimeoutMs
    });
  }
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = void 0;
    }
    this.logger.info("Presence tracker stopped");
  }
  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------
  async connect(userId, connectionId, metadata) {
    const now = /* @__PURE__ */ new Date();
    const presence = {
      userId,
      connectionId,
      status: PresenceStatus.ONLINE,
      lastActivityAt: now,
      connectedAt: now,
      metadata,
      subscriptions: []
    };
    await this.store.set(presence);
    this.emitChange({
      userId,
      previousStatus: PresenceStatus.OFFLINE,
      newStatus: PresenceStatus.ONLINE,
      changedAt: now,
      reason: PresenceChangeReason.CONNECTED
    });
    this.logger.info("User connected", {
      userId,
      connectionId,
      deviceType: metadata.deviceType
    });
    return presence;
  }
  async disconnect(connectionId, reason) {
    const presence = await this.store.getByConnection(connectionId);
    if (!presence) return;
    const previousStatus = presence.status;
    await this.store.update(presence.userId, {
      status: PresenceStatus.OFFLINE,
      lastActivityAt: /* @__PURE__ */ new Date()
    });
    this.emitChange({
      userId: presence.userId,
      previousStatus,
      newStatus: PresenceStatus.OFFLINE,
      changedAt: /* @__PURE__ */ new Date(),
      reason: PresenceChangeReason.DISCONNECTED
    });
    this.logger.info("User disconnected", {
      userId: presence.userId,
      connectionId,
      reason
    });
  }
  // ---------------------------------------------------------------------------
  // Activity Recording
  // ---------------------------------------------------------------------------
  async recordActivity(userId, activity) {
    const presence = await this.store.get(userId);
    if (!presence) {
      this.logger.warn("Activity recorded for unknown user", { userId, type: activity.type });
      return;
    }
    const now = /* @__PURE__ */ new Date();
    const previousStatus = presence.status;
    let newStatus = presence.status;
    if (activity.type === "interaction" || activity.type === "typing" || activity.type === "scroll") {
      if (activity.pageContext?.courseId) {
        newStatus = PresenceStatus.STUDYING;
      } else if (previousStatus !== PresenceStatus.ONLINE) {
        newStatus = PresenceStatus.ONLINE;
      }
    } else if (activity.type === "focus") {
      if (previousStatus === PresenceStatus.IDLE || previousStatus === PresenceStatus.AWAY) {
        newStatus = PresenceStatus.ONLINE;
      }
    } else if (activity.type === "blur") {
    }
    await this.store.update(userId, {
      lastActivityAt: now,
      status: newStatus,
      metadata: {
        ...presence.metadata,
        location: activity.pageContext ? {
          pageUrl: activity.pageContext.url,
          courseId: activity.pageContext.courseId,
          sectionId: activity.pageContext.sectionId
        } : presence.metadata.location
      }
    });
    if (previousStatus !== newStatus) {
      this.emitChange({
        userId,
        previousStatus,
        newStatus,
        changedAt: now,
        reason: PresenceChangeReason.ACTIVITY
      });
    }
  }
  // ---------------------------------------------------------------------------
  // Status Management
  // ---------------------------------------------------------------------------
  async getPresence(userId) {
    return this.store.get(userId);
  }
  async updateStatus(userId, status) {
    const presence = await this.store.get(userId);
    if (!presence) {
      this.logger.warn("Status update for unknown user", { userId, status });
      return;
    }
    const previousStatus = presence.status;
    if (previousStatus === status) return;
    await this.store.update(userId, {
      status,
      lastActivityAt: /* @__PURE__ */ new Date()
    });
    this.emitChange({
      userId,
      previousStatus,
      newStatus: status,
      changedAt: /* @__PURE__ */ new Date(),
      reason: PresenceChangeReason.USER_SET
    });
    this.logger.info("User status updated", { userId, previousStatus, newStatus: status });
  }
  // ---------------------------------------------------------------------------
  // Timeout Checking
  // ---------------------------------------------------------------------------
  async checkTimeouts() {
    const changes = [];
    const now = Date.now();
    const onlineUsers = await this.store.getOnline();
    const idleUsers = await this.store.getByStatus(PresenceStatus.IDLE);
    const awayUsers = await this.store.getByStatus(PresenceStatus.AWAY);
    for (const presence of onlineUsers) {
      const inactiveMs = now - presence.lastActivityAt.getTime();
      if (inactiveMs >= this.config.awayTimeoutMs) {
        const change = await this.transitionStatus(
          presence,
          PresenceStatus.AWAY,
          PresenceChangeReason.AWAY_TIMEOUT
        );
        if (change) changes.push(change);
      } else if (inactiveMs >= this.config.idleTimeoutMs) {
        const change = await this.transitionStatus(
          presence,
          PresenceStatus.IDLE,
          PresenceChangeReason.IDLE_TIMEOUT
        );
        if (change) changes.push(change);
      }
    }
    for (const presence of idleUsers) {
      const inactiveMs = now - presence.lastActivityAt.getTime();
      if (inactiveMs >= this.config.awayTimeoutMs) {
        const change = await this.transitionStatus(
          presence,
          PresenceStatus.AWAY,
          PresenceChangeReason.AWAY_TIMEOUT
        );
        if (change) changes.push(change);
      }
    }
    for (const presence of awayUsers) {
      const inactiveMs = now - presence.lastActivityAt.getTime();
      if (inactiveMs >= this.config.offlineTimeoutMs) {
        const change = await this.transitionStatus(
          presence,
          PresenceStatus.OFFLINE,
          PresenceChangeReason.SESSION_END
        );
        if (change) changes.push(change);
      }
    }
    if (changes.length > 0) {
      this.logger.debug("Presence timeout changes", { count: changes.length });
    }
    return changes;
  }
  async transitionStatus(presence, newStatus, reason) {
    const previousStatus = presence.status;
    if (previousStatus === newStatus) return null;
    await this.store.update(presence.userId, { status: newStatus });
    const change = {
      userId: presence.userId,
      previousStatus,
      newStatus,
      changedAt: /* @__PURE__ */ new Date(),
      reason
    };
    this.emitChange(change);
    return change;
  }
  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------
  async getOnlineUsers() {
    return this.store.getOnline();
  }
  async getStudyingUsers() {
    return this.store.getByStatus(PresenceStatus.STUDYING);
  }
  async getIdleUsers() {
    return this.store.getByStatus(PresenceStatus.IDLE);
  }
  async isUserOnline(userId) {
    const presence = await this.store.get(userId);
    if (!presence) return false;
    return presence.status === PresenceStatus.ONLINE || presence.status === PresenceStatus.STUDYING || presence.status === PresenceStatus.IDLE;
  }
  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------
  async subscribe(userId, channels) {
    const presence = await this.store.get(userId);
    if (!presence) return;
    const currentSubs = new Set(presence.subscriptions);
    channels.forEach((ch) => currentSubs.add(ch));
    await this.store.update(userId, {
      subscriptions: Array.from(currentSubs)
    });
  }
  async unsubscribe(userId, channels) {
    const presence = await this.store.get(userId);
    if (!presence) return;
    const currentSubs = new Set(presence.subscriptions);
    channels.forEach((ch) => currentSubs.delete(ch));
    await this.store.update(userId, {
      subscriptions: Array.from(currentSubs)
    });
  }
  async getSubscribedUsers(channel) {
    const online = await this.store.getOnline();
    return online.filter((p) => p.subscriptions.includes(channel)).map((p) => p.userId);
  }
  // ---------------------------------------------------------------------------
  // Event Emitting
  // ---------------------------------------------------------------------------
  onPresenceChange(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
  emitChange(change) {
    for (const listener of this.listeners) {
      try {
        listener(change);
      } catch (err) {
        this.logger.error("Error in presence change listener", {
          error: err instanceof Error ? err.message : "Unknown error",
          userId: change.userId
        });
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  async cleanup(olderThanMs = 864e5) {
    const cutoff = new Date(Date.now() - olderThanMs);
    return this.store.cleanup(cutoff);
  }
};
function createPresenceTracker(options) {
  return new PresenceTracker(options ?? {});
}
function createInMemoryPresenceStore() {
  return new InMemoryPresenceStore();
}

// src/realtime/push-dispatcher.ts
var InMemoryPushQueueStore = class {
  queue = /* @__PURE__ */ new Map();
  completed = /* @__PURE__ */ new Map();
  failed = /* @__PURE__ */ new Map();
  processing = 0;
  totalProcessingTime = 0;
  processedCount = 0;
  async enqueue(request) {
    const queuedRequest = {
      ...request,
      queuedAt: /* @__PURE__ */ new Date(),
      attempts: 0,
      processing: false
    };
    this.queue.set(request.id, queuedRequest);
  }
  async dequeue(count) {
    const requests = [];
    const priorityOrder = ["critical", "high", "normal", "low"];
    const sortedQueue = Array.from(this.queue.values()).filter((r) => !r.processing).sort((a, b) => {
      const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.queuedAt.getTime() - b.queuedAt.getTime();
    });
    for (let i = 0; i < Math.min(count, sortedQueue.length); i++) {
      const request = sortedQueue[i];
      request.processing = true;
      this.processing++;
      requests.push(request);
    }
    return requests;
  }
  async peek(count) {
    const priorityOrder = ["critical", "high", "normal", "low"];
    return Array.from(this.queue.values()).filter((r) => !r.processing).sort((a, b) => {
      const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.queuedAt.getTime() - b.queuedAt.getTime();
    }).slice(0, count);
  }
  async acknowledge(requestId, result) {
    const request = this.queue.get(requestId);
    if (request) {
      this.processing--;
      if (result.success) {
        this.completed.set(requestId, result);
        this.queue.delete(requestId);
      } else {
        this.failed.set(requestId, result);
        this.queue.delete(requestId);
      }
      if (result.deliveredAt && request.queuedAt) {
        const processingTime = result.deliveredAt.getTime() - request.queuedAt.getTime();
        this.totalProcessingTime += processingTime;
        this.processedCount++;
      }
    }
  }
  async requeue(request) {
    const existing = this.queue.get(request.id);
    if (existing) {
      existing.processing = false;
      existing.attempts++;
      existing.lastAttemptAt = /* @__PURE__ */ new Date();
      this.processing--;
    } else {
      await this.enqueue(request);
    }
  }
  async getStats() {
    const pendingItems = Array.from(this.queue.values()).filter((r) => !r.processing);
    const oldestPending = pendingItems.length > 0 ? pendingItems.sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime())[0]?.queuedAt : void 0;
    return {
      pending: pendingItems.length,
      processing: this.processing,
      completed: this.completed.size,
      failed: this.failed.size,
      avgProcessingTimeMs: this.processedCount > 0 ? this.totalProcessingTime / this.processedCount : 0,
      oldestPendingAt: oldestPending
    };
  }
  async cleanup(olderThan) {
    let count = 0;
    for (const [id, result] of this.completed) {
      if (result.deliveredAt && result.deliveredAt < olderThan) {
        this.completed.delete(id);
        count++;
      }
    }
    for (const [id, result] of this.failed) {
      if (result.deliveredAt && result.deliveredAt < olderThan) {
        this.failed.delete(id);
        count++;
      }
    }
    return count;
  }
  getQueueSize() {
    return this.queue.size;
  }
  clear() {
    this.queue.clear();
    this.completed.clear();
    this.failed.clear();
    this.processing = 0;
  }
};
var ProactivePushDispatcher = class {
  store;
  config;
  logger;
  handlers = /* @__PURE__ */ new Map();
  presenceTracker;
  isRunning = false;
  processInterval;
  deliveredCount = 0;
  failedCount = 0;
  lastProcessedAt;
  constructor(options) {
    this.store = options.store ?? new InMemoryPushQueueStore();
    this.config = { ...DEFAULT_PUSH_DISPATCHER_CONFIG, ...options.config };
    this.presenceTracker = options.presenceTracker;
    this.logger = options.logger ?? console;
  }
  // ---------------------------------------------------------------------------
  // Handler Registration
  // ---------------------------------------------------------------------------
  registerHandler(handler) {
    this.handlers.set(handler.channel, handler);
    this.logger.debug("Delivery handler registered", { channel: handler.channel });
  }
  unregisterHandler(channel) {
    this.handlers.delete(channel);
    this.logger.debug("Delivery handler unregistered", { channel });
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  start() {
    if (this.isRunning) {
      this.logger.warn("Push dispatcher already running");
      return;
    }
    this.isRunning = true;
    this.processInterval = setInterval(
      () => this.processQueue(),
      this.config.processingInterval
    );
    this.logger.info("Push dispatcher started", {
      processingInterval: this.config.processingInterval,
      batchSize: this.config.batchSize
    });
  }
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = void 0;
    }
    this.logger.info("Push dispatcher stopped");
  }
  // ---------------------------------------------------------------------------
  // Dispatch
  // ---------------------------------------------------------------------------
  async dispatch(request) {
    const stats = await this.store.getStats();
    if (stats.pending >= this.config.maxQueueSize) {
      this.logger.warn("Push queue full, dropping request", {
        requestId: request.id,
        userId: request.userId,
        queueSize: stats.pending
      });
      return;
    }
    if (!request.expiresAt) {
      request.expiresAt = new Date(Date.now() + this.config.defaultExpirationMs);
    }
    await this.store.enqueue(request);
    this.logger.debug("Request enqueued", {
      requestId: request.id,
      userId: request.userId,
      priority: request.priority,
      channels: request.channels
    });
    if (request.priority === "critical") {
      await this.processQueue();
    }
  }
  /**
   * Create and dispatch an event with defaults
   */
  async dispatchEvent(userId, event, options) {
    const request = {
      id: v4_default(),
      userId,
      event,
      priority: options?.priority ?? "normal",
      channels: options?.channels ?? [DeliveryChannel.WEBSOCKET, DeliveryChannel.IN_APP],
      fallbackChannels: options?.fallbackChannels,
      expiresAt: options?.expiresAt
    };
    await this.dispatch(request);
  }
  // ---------------------------------------------------------------------------
  // Processing
  // ---------------------------------------------------------------------------
  async processQueue() {
    if (!this.isRunning) return [];
    const results = [];
    const batch = await this.store.dequeue(this.config.batchSize);
    for (const request of batch) {
      try {
        const result = await this.processRequest(request);
        results.push(result);
        await this.store.acknowledge(request.id, result);
        if (result.success) {
          this.deliveredCount++;
        } else {
          this.failedCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const result = {
          requestId: request.id,
          userId: request.userId,
          deliveredVia: null,
          success: false,
          error: errorMessage,
          attemptedChannels: request.channels,
          deliveredAt: /* @__PURE__ */ new Date()
        };
        results.push(result);
        this.failedCount++;
        if (this.shouldRetry(request)) {
          await this.store.requeue(request);
        } else {
          await this.store.acknowledge(request.id, result);
        }
        this.logger.error("Request processing failed", {
          requestId: request.id,
          error: errorMessage
        });
      }
    }
    if (batch.length > 0) {
      this.lastProcessedAt = /* @__PURE__ */ new Date();
    }
    return results;
  }
  async processRequest(request) {
    const now = /* @__PURE__ */ new Date();
    if (request.expiresAt && request.expiresAt < now) {
      return {
        requestId: request.id,
        userId: request.userId,
        deliveredVia: null,
        success: false,
        error: "Request expired",
        attemptedChannels: [],
        deliveredAt: now
      };
    }
    const attemptedChannels = [];
    for (const channel of request.channels) {
      attemptedChannels.push(channel);
      const handler = this.handlers.get(channel);
      if (!handler) {
        this.logger.debug("No handler for channel", { channel, requestId: request.id });
        continue;
      }
      try {
        const canDeliver = await handler.canDeliver(request.userId);
        if (!canDeliver) {
          this.logger.debug("Cannot deliver via channel", {
            channel,
            requestId: request.id,
            userId: request.userId
          });
          continue;
        }
        const delivered = await handler.deliver(request.userId, request.event);
        if (delivered) {
          return {
            requestId: request.id,
            userId: request.userId,
            deliveredVia: channel,
            success: true,
            attemptedChannels,
            deliveredAt: now
          };
        }
      } catch (error) {
        this.logger.warn("Delivery attempt failed", {
          channel,
          requestId: request.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    if (request.fallbackChannels) {
      for (const channel of request.fallbackChannels) {
        if (attemptedChannels.includes(channel)) continue;
        attemptedChannels.push(channel);
        const handler = this.handlers.get(channel);
        if (!handler) continue;
        try {
          const canDeliver = await handler.canDeliver(request.userId);
          if (!canDeliver) continue;
          const delivered = await handler.deliver(request.userId, request.event);
          if (delivered) {
            return {
              requestId: request.id,
              userId: request.userId,
              deliveredVia: channel,
              success: true,
              attemptedChannels,
              deliveredAt: now
            };
          }
        } catch (error) {
          this.logger.warn("Fallback delivery failed", {
            channel,
            requestId: request.id,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    }
    return {
      requestId: request.id,
      userId: request.userId,
      deliveredVia: null,
      success: false,
      error: "All delivery channels failed",
      attemptedChannels,
      deliveredAt: now
    };
  }
  shouldRetry(request) {
    const queuedRequest = request;
    return (queuedRequest.attempts ?? 0) < this.config.retryAttempts;
  }
  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------
  async isUserOnline(userId) {
    if (this.presenceTracker) {
      const presence = await this.presenceTracker.getPresence(userId);
      return presence !== null && presence.status !== "offline";
    }
    const wsHandler = this.handlers.get(DeliveryChannel.WEBSOCKET);
    if (wsHandler) {
      return wsHandler.canDeliver(userId);
    }
    return false;
  }
  async getStats() {
    const queueStats = await this.store.getStats();
    const online = this.presenceTracker ? (await this.presenceTracker.getOnlineUsers()).length : 0;
    return {
      queueSize: queueStats.pending + queueStats.processing,
      deliveredCount: this.deliveredCount,
      failedCount: this.failedCount,
      activeConnections: online,
      avgDeliveryTimeMs: queueStats.avgProcessingTimeMs,
      lastProcessedAt: this.lastProcessedAt
    };
  }
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  async cleanup(olderThanMs = 864e5) {
    const cutoff = new Date(Date.now() - olderThanMs);
    return this.store.cleanup(cutoff);
  }
};
function createPushDispatcher(options) {
  return new ProactivePushDispatcher(options ?? {});
}
function createInMemoryPushQueueStore() {
  return new InMemoryPushQueueStore();
}

// src/realtime/websocket-manager.ts
var ClientWebSocketManager = class {
  config;
  logger;
  socket = null;
  state = ConnectionState.DISCONNECTED;
  connectionId = null;
  userId = null;
  metadata = null;
  reconnectAttempts = 0;
  reconnectTimeout;
  heartbeatInterval;
  eventHandlers = /* @__PURE__ */ new Map();
  connectionHandlers = /* @__PURE__ */ new Set();
  errorHandlers = /* @__PURE__ */ new Set();
  stats = {
    connectionId: "",
    connectedAt: /* @__PURE__ */ new Date(),
    lastHeartbeatAt: /* @__PURE__ */ new Date(),
    messagesSent: 0,
    messagesReceived: 0,
    reconnectCount: 0,
    latencyMs: 0
  };
  constructor(options) {
    this.config = { ...DEFAULT_CONNECTION_CONFIG, ...options?.config };
    this.logger = options?.logger ?? console;
  }
  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------
  async connect(userId, metadata) {
    if (this.state === ConnectionState.CONNECTED) {
      this.logger.warn("Already connected");
      return;
    }
    const configUrl = this.config.url;
    if (typeof WebSocket === "undefined") {
      throw new Error("WebSocket not available in this environment");
    }
    const isValidWsUrl = configUrl && (configUrl.startsWith("ws://") || configUrl.startsWith("wss://"));
    if (!isValidWsUrl) {
      this.logger.debug("WebSocket not configured", { url: configUrl || "not set" });
      throw new Error("WebSocket not configured - no valid URL provided");
    }
    this.userId = userId;
    this.metadata = metadata ?? {
      deviceType: this.detectDeviceType(),
      browser: this.detectBrowser()
    };
    this.setState(ConnectionState.CONNECTING);
    return new Promise((resolve, reject) => {
      try {
        const url = this.buildWebSocketUrl();
        this.socket = new WebSocket(url);
        const connectionTimeout = setTimeout(() => {
          if (this.state === ConnectionState.CONNECTING) {
            this.socket?.close();
            const error = new Error("WebSocket connection timeout - server may not be running");
            this.handleError(error);
            reject(error);
          }
        }, 5e3);
        this.socket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.handleOpen();
          resolve();
        };
        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.handleClose(event);
        };
        this.socket.onerror = () => {
          clearTimeout(connectionTimeout);
          const errorUrl = this.config.url || "unknown URL";
          const error = new Error(`WebSocket connection failed to ${errorUrl}`);
          this.handleError(error);
          if (this.state === ConnectionState.CONNECTING) {
            reject(new Error(`Failed to connect to WebSocket server at ${errorUrl}. Server may not be running.`));
          }
        };
        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error("Connection failed"));
        reject(error);
      }
    });
  }
  disconnect() {
    this.clearTimers();
    if (this.socket) {
      this.socket.close(1e3, "Client disconnect");
      this.socket = null;
    }
    this.setState(ConnectionState.DISCONNECTED);
    this.reconnectAttempts = 0;
  }
  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------
  async send(event) {
    if (!this.socket || this.state !== ConnectionState.CONNECTED) {
      throw new Error("Not connected");
    }
    const message = JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString(),
      userId: this.userId,
      sessionId: this.connectionId
    });
    this.socket.send(message);
    this.stats.messagesSent++;
  }
  // ---------------------------------------------------------------------------
  // Event Subscription
  // ---------------------------------------------------------------------------
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, /* @__PURE__ */ new Set());
    }
    this.eventHandlers.get(eventType).add(handler);
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }
  onConnectionChange(handler) {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }
  onError(handler) {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }
  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------
  getState() {
    return this.state;
  }
  getStats() {
    return { ...this.stats };
  }
  isConnected() {
    return this.state === ConnectionState.CONNECTED;
  }
  getConnectionId() {
    return this.connectionId;
  }
  // ---------------------------------------------------------------------------
  // Activity Reporting
  // ---------------------------------------------------------------------------
  async reportActivity(activity) {
    if (!this.isConnected()) return;
    await this.send({
      type: SAMEventType.ACTIVITY,
      payload: {
        type: activity.type,
        data: activity.data ?? {},
        pageContext: activity.pageContext
      },
      timestamp: /* @__PURE__ */ new Date(),
      eventId: v4_default(),
      userId: this.userId ?? void 0,
      sessionId: this.connectionId ?? void 0
    });
  }
  async acknowledgeEvent(eventId, action) {
    if (!this.isConnected()) return;
    await this.send({
      type: SAMEventType.ACKNOWLEDGE,
      payload: {
        eventId,
        received: true,
        action
      },
      timestamp: /* @__PURE__ */ new Date(),
      eventId: v4_default(),
      userId: this.userId ?? void 0,
      sessionId: this.connectionId ?? void 0
    });
  }
  async dismissEvent(targetEventId, reason) {
    if (!this.isConnected()) return;
    await this.send({
      type: SAMEventType.DISMISS,
      payload: {
        eventId: targetEventId,
        reason: reason ?? "user_action"
      },
      timestamp: /* @__PURE__ */ new Date(),
      eventId: v4_default(),
      userId: this.userId ?? void 0,
      sessionId: this.connectionId ?? void 0
    });
  }
  // ---------------------------------------------------------------------------
  // Internal Handlers
  // ---------------------------------------------------------------------------
  handleOpen() {
    this.connectionId = v4_default();
    this.setState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    this.stats = {
      connectionId: this.connectionId,
      connectedAt: /* @__PURE__ */ new Date(),
      lastHeartbeatAt: /* @__PURE__ */ new Date(),
      messagesSent: 0,
      messagesReceived: 0,
      reconnectCount: this.stats.reconnectCount,
      latencyMs: 0
    };
    this.startHeartbeat();
    this.logger.info("WebSocket connected", {
      connectionId: this.connectionId,
      userId: this.userId
    });
  }
  handleClose(event) {
    this.clearTimers();
    const wasConnected = this.state === ConnectionState.CONNECTED;
    if (event.code === 1e3) {
      this.setState(ConnectionState.DISCONNECTED);
    } else if (this.config.autoReconnect && wasConnected) {
      this.scheduleReconnect();
    } else {
      this.setState(ConnectionState.DISCONNECTED);
    }
    this.logger.info("WebSocket closed", {
      code: event.code,
      reason: event.reason,
      wasConnected
    });
  }
  handleError(error) {
    if (this.state === ConnectionState.CONNECTING) {
      this.logger.debug("WebSocket connection not available", {
        message: error.message,
        hint: "This is expected if no WebSocket server is running. The app will fallback to REST polling."
      });
    } else if (this.state === ConnectionState.RECONNECTING) {
      this.logger.warn("WebSocket reconnection attempt failed", {
        message: error.message,
        attemptNumber: this.reconnectAttempts
      });
    } else {
      this.logger.warn("WebSocket error", {
        message: error.message,
        state: this.state
      });
    }
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (e) {
        this.logger.warn("Error in error handler", {
          error: e instanceof Error ? e.message : "Unknown"
        });
      }
    }
  }
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      const samEvent = {
        ...data,
        timestamp: new Date(data.timestamp)
      };
      this.stats.messagesReceived++;
      if (samEvent.type === SAMEventType.HEARTBEAT) {
        this.stats.lastHeartbeatAt = /* @__PURE__ */ new Date();
        return;
      }
      if (samEvent.type === SAMEventType.CONNECTED) {
        this.connectionId = samEvent.payload.connectionId;
        this.stats.connectionId = this.connectionId;
      }
      const handlers = this.eventHandlers.get(samEvent.type);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(samEvent);
          } catch (e) {
            this.logger.error("Error in message handler", {
              type: samEvent.type,
              error: e instanceof Error ? e.message : "Unknown"
            });
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to parse message", {
        error: error instanceof Error ? error.message : "Unknown"
      });
    }
  }
  // ---------------------------------------------------------------------------
  // Reconnection
  // ---------------------------------------------------------------------------
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setState(ConnectionState.FAILED);
      this.logger.error("Max reconnect attempts reached");
      return;
    }
    this.setState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;
    this.stats.reconnectCount++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    this.logger.info("Scheduling reconnect", {
      attempt: this.reconnectAttempts,
      delayMs: delay
    });
    this.reconnectTimeout = setTimeout(async () => {
      try {
        if (this.userId && this.metadata) {
          await this.connect(this.userId, this.metadata);
        }
      } catch (error) {
        this.scheduleReconnect();
      }
    }, delay);
  }
  // ---------------------------------------------------------------------------
  // Heartbeat
  // ---------------------------------------------------------------------------
  startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isConnected()) return;
      try {
        await this.send({
          type: SAMEventType.HEARTBEAT,
          payload: {
            status: "alive",
            timestamp: /* @__PURE__ */ new Date(),
            connectionId: this.connectionId ?? ""
          },
          timestamp: /* @__PURE__ */ new Date(),
          eventId: v4_default(),
          userId: this.userId ?? void 0,
          sessionId: this.connectionId ?? void 0
        });
      } catch (error) {
        this.logger.warn("Heartbeat failed", {
          error: error instanceof Error ? error.message : "Unknown"
        });
      }
    }, this.config.heartbeatInterval);
  }
  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  setState(state) {
    const previousState = this.state;
    this.state = state;
    if (previousState !== state) {
      for (const handler of this.connectionHandlers) {
        try {
          handler(state);
        } catch (e) {
          this.logger.error("Error in connection handler", {
            error: e instanceof Error ? e.message : "Unknown"
          });
        }
      }
    }
  }
  clearTimers() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = void 0;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = void 0;
    }
  }
  buildWebSocketUrl() {
    const configUrl = this.config.url;
    if (configUrl.startsWith("ws://") || configUrl.startsWith("wss://")) {
      const url2 = new URL(configUrl);
      if (this.userId) {
        url2.searchParams.set("userId", this.userId);
      }
      if (this.config.authToken) {
        url2.searchParams.set("token", this.config.authToken);
      }
      return url2.toString();
    }
    const url = new URL(configUrl, window.location.origin);
    url.protocol = url.protocol.replace("http", "ws");
    if (this.userId) {
      url.searchParams.set("userId", this.userId);
    }
    if (this.config.authToken) {
      url.searchParams.set("token", this.config.authToken);
    }
    return url.toString();
  }
  detectDeviceType() {
    if (typeof window === "undefined") return "desktop";
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
    return "desktop";
  }
  detectBrowser() {
    if (typeof window === "undefined") return "unknown";
    const ua = navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "unknown";
  }
};
var ServerConnectionManager = class {
  logger;
  connections = /* @__PURE__ */ new Map();
  userConnections = /* @__PURE__ */ new Map();
  handlers = /* @__PURE__ */ new Set();
  constructor(options) {
    this.logger = options?.logger ?? console;
  }
  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------
  registerConnection(connectionId, userId, socket, metadata) {
    const connection = {
      id: connectionId,
      userId,
      socket,
      metadata,
      connectedAt: /* @__PURE__ */ new Date(),
      lastActivityAt: /* @__PURE__ */ new Date(),
      subscriptions: /* @__PURE__ */ new Set()
    };
    this.connections.set(connectionId, connection);
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, /* @__PURE__ */ new Set());
    }
    this.userConnections.get(userId).add(connectionId);
    for (const handler of this.handlers) {
      handler.onConnect(connectionId, userId, metadata).catch((err) => {
        this.logger.error("Error in connection handler", {
          error: err instanceof Error ? err.message : "Unknown"
        });
      });
    }
    this.logger.info("Connection registered", {
      connectionId,
      userId,
      totalConnections: this.connections.size
    });
  }
  removeConnection(connectionId, reason) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    const userConns = this.userConnections.get(connection.userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }
    this.connections.delete(connectionId);
    for (const handler of this.handlers) {
      handler.onDisconnect(connectionId, reason).catch((err) => {
        this.logger.error("Error in disconnect handler", {
          error: err instanceof Error ? err.message : "Unknown"
        });
      });
    }
    this.logger.info("Connection removed", {
      connectionId,
      userId: connection.userId,
      reason
    });
  }
  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------
  async sendToConnection(connectionId, event) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;
    try {
      const message = JSON.stringify({
        ...event,
        timestamp: event.timestamp.toISOString()
      });
      const socket = connection.socket;
      if (socket.send) {
        socket.send(message);
        connection.lastActivityAt = /* @__PURE__ */ new Date();
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error("Failed to send to connection", {
        connectionId,
        error: error instanceof Error ? error.message : "Unknown"
      });
      return false;
    }
  }
  async sendToUser(userId, event) {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds || connectionIds.size === 0) return 0;
    let sent = 0;
    for (const connectionId of connectionIds) {
      const success = await this.sendToConnection(connectionId, event);
      if (success) sent++;
    }
    return sent;
  }
  async broadcast(event, filter) {
    let sent = 0;
    for (const [connectionId, connection] of this.connections) {
      if (filter && !filter(connection)) continue;
      const success = await this.sendToConnection(connectionId, event);
      if (success) sent++;
    }
    return sent;
  }
  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }
  getUserConnections(userId) {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];
    return Array.from(connectionIds).map((id) => this.connections.get(id)).filter((c) => c !== void 0);
  }
  isUserConnected(userId) {
    const connections = this.userConnections.get(userId);
    return connections !== void 0 && connections.size > 0;
  }
  getConnectionCount() {
    return this.connections.size;
  }
  getConnectedUserIds() {
    return Array.from(this.userConnections.keys());
  }
  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  addHandler(handler) {
    this.handlers.add(handler);
  }
  removeHandler(handler) {
    this.handlers.delete(handler);
  }
  // ---------------------------------------------------------------------------
  // Message Processing
  // ---------------------------------------------------------------------------
  async handleMessage(connectionId, rawMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    try {
      const event = JSON.parse(rawMessage);
      event.timestamp = new Date(event.timestamp);
      connection.lastActivityAt = /* @__PURE__ */ new Date();
      for (const handler of this.handlers) {
        await handler.onMessage(connectionId, event);
      }
    } catch (error) {
      this.logger.error("Failed to handle message", {
        connectionId,
        error: error instanceof Error ? error.message : "Unknown"
      });
    }
  }
};
function createClientWebSocketManager(options) {
  return new ClientWebSocketManager(options);
}
function createServerConnectionManager(options) {
  return new ServerConnectionManager(options);
}

// src/realtime/intervention-surface.ts
var DEFAULT_DISPLAY_CONFIGS = {
  // Proactive events
  intervention: {
    surface: InterventionSurface.MODAL,
    position: "center",
    dismissible: true,
    blocking: false,
    priority: 80,
    animation: "fade"
  },
  checkin: {
    surface: InterventionSurface.SIDEBAR,
    position: "right",
    dismissible: true,
    blocking: false,
    priority: 70,
    animation: "slide"
  },
  recommendation: {
    surface: InterventionSurface.TOAST,
    position: "bottom-right",
    duration: 1e4,
    dismissible: true,
    blocking: false,
    priority: 40,
    animation: "slide"
  },
  step_completed: {
    surface: InterventionSurface.TOAST,
    position: "top",
    duration: 5e3,
    dismissible: true,
    blocking: false,
    priority: 50,
    animation: "bounce",
    sound: true
  },
  goal_progress: {
    surface: InterventionSurface.TOAST,
    position: "bottom-right",
    duration: 8e3,
    dismissible: true,
    blocking: false,
    priority: 45,
    animation: "slide"
  },
  nudge: {
    surface: InterventionSurface.FLOATING,
    position: "bottom-right",
    duration: 6e3,
    dismissible: true,
    blocking: false,
    priority: 30,
    animation: "fade"
  },
  celebration: {
    surface: InterventionSurface.MODAL,
    position: "center",
    duration: 5e3,
    dismissible: true,
    blocking: true,
    priority: 90,
    animation: "bounce",
    sound: true
  },
  // System events
  presence_update: {
    surface: InterventionSurface.TOAST,
    position: "top",
    duration: 3e3,
    dismissible: true,
    blocking: false,
    priority: 20,
    animation: "fade"
  },
  session_sync: {
    surface: InterventionSurface.BANNER,
    position: "top",
    dismissible: true,
    blocking: false,
    priority: 60,
    animation: "slide"
  },
  // Client events (typically not displayed)
  activity: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  heartbeat: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  acknowledge: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  dismiss: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  respond: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  subscribe: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  unsubscribe: {
    surface: InterventionSurface.TOAST,
    dismissible: false,
    blocking: false,
    priority: 0
  },
  // System events
  connected: {
    surface: InterventionSurface.TOAST,
    position: "bottom",
    duration: 2e3,
    dismissible: true,
    blocking: false,
    priority: 10,
    animation: "fade"
  },
  disconnected: {
    surface: InterventionSurface.BANNER,
    position: "top",
    dismissible: false,
    blocking: false,
    priority: 95,
    animation: "slide"
  },
  error: {
    surface: InterventionSurface.TOAST,
    position: "top",
    duration: 8e3,
    dismissible: true,
    blocking: false,
    priority: 85,
    animation: "slide"
  },
  reconnecting: {
    surface: InterventionSurface.BANNER,
    position: "top",
    dismissible: false,
    blocking: false,
    priority: 90,
    animation: "fade"
  }
};
var DEFAULT_SURFACE_MANAGER_CONFIG = {
  maxVisible: 3,
  maxQueueSize: 20,
  defaultDuration: 5e3,
  enableSound: true,
  enableHaptics: true,
  autoAcknowledge: true
};
var InterventionSurfaceManagerImpl = class {
  config;
  logger;
  items = /* @__PURE__ */ new Map();
  visibleItems = /* @__PURE__ */ new Set();
  dismissTimers = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  constructor(options) {
    this.config = { ...DEFAULT_SURFACE_MANAGER_CONFIG, ...options?.config };
    this.logger = options?.logger ?? console;
  }
  // ---------------------------------------------------------------------------
  // Queue Management
  // ---------------------------------------------------------------------------
  queue(event, config) {
    if (!this.isDisplayableEvent(event.type)) {
      return;
    }
    if (this.items.size >= this.config.maxQueueSize) {
      this.removeLowestPriority();
    }
    const defaultConfig = DEFAULT_DISPLAY_CONFIGS[event.type] ?? {};
    const displayConfig = {
      surface: config?.surface ?? defaultConfig.surface ?? InterventionSurface.TOAST,
      position: config?.position ?? defaultConfig.position ?? "bottom-right",
      duration: config?.duration ?? defaultConfig.duration,
      dismissible: config?.dismissible ?? defaultConfig.dismissible ?? true,
      blocking: config?.blocking ?? defaultConfig.blocking ?? false,
      priority: config?.priority ?? defaultConfig.priority ?? 50,
      animation: config?.animation ?? defaultConfig.animation ?? "fade",
      sound: config?.sound ?? defaultConfig.sound ?? false,
      vibrate: config?.vibrate ?? defaultConfig.vibrate ?? false
    };
    const state = {
      id: event.eventId,
      event,
      displayConfig,
      visible: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.items.set(state.id, state);
    this.logger.debug("Intervention queued", {
      id: state.id,
      type: event.type,
      surface: displayConfig.surface,
      priority: displayConfig.priority
    });
    this.processQueue();
  }
  isDisplayableEvent(type) {
    const displayableTypes = [
      SAMEventType.INTERVENTION,
      SAMEventType.CHECKIN,
      SAMEventType.RECOMMENDATION,
      SAMEventType.STEP_COMPLETED,
      SAMEventType.GOAL_PROGRESS,
      SAMEventType.NUDGE,
      SAMEventType.CELEBRATION,
      SAMEventType.SESSION_SYNC,
      SAMEventType.CONNECTED,
      SAMEventType.DISCONNECTED,
      SAMEventType.ERROR,
      SAMEventType.RECONNECTING
    ];
    return displayableTypes.includes(type);
  }
  removeLowestPriority() {
    let lowestItem = null;
    for (const [_, item] of this.items) {
      if (this.visibleItems.has(item.id)) continue;
      if (!lowestItem || item.displayConfig.priority < lowestItem.displayConfig.priority) {
        lowestItem = item;
      }
    }
    if (lowestItem) {
      this.items.delete(lowestItem.id);
      this.logger.debug("Removed low priority item from queue", {
        id: lowestItem.id,
        priority: lowestItem.displayConfig.priority
      });
    }
  }
  processQueue() {
    if (this.visibleItems.size >= this.config.maxVisible) {
      return;
    }
    const pending = Array.from(this.items.values()).filter((item) => !item.visible).sort((a, b) => b.displayConfig.priority - a.displayConfig.priority);
    const availableSlots = this.config.maxVisible - this.visibleItems.size;
    for (let i = 0; i < Math.min(availableSlots, pending.length); i++) {
      this.show(pending[i].id);
    }
  }
  show(id) {
    const item = this.items.get(id);
    if (!item || item.visible) return;
    item.visible = true;
    item.displayedAt = /* @__PURE__ */ new Date();
    this.visibleItems.add(id);
    if (item.displayConfig.duration) {
      const timer = setTimeout(() => {
        this.dismiss(id, "timeout");
      }, item.displayConfig.duration);
      this.dismissTimers.set(id, timer);
    }
    if (item.displayConfig.sound && this.config.enableSound) {
      this.playSound(item.event.type);
    }
    if (item.displayConfig.vibrate && this.config.enableHaptics) {
      this.vibrate();
    }
    this.notifyListeners();
    this.logger.debug("Intervention shown", {
      id,
      type: item.event.type,
      surface: item.displayConfig.surface
    });
  }
  // ---------------------------------------------------------------------------
  // Dismiss
  // ---------------------------------------------------------------------------
  dismiss(eventId, reason) {
    const item = this.items.get(eventId);
    if (!item) return;
    const timer = this.dismissTimers.get(eventId);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(eventId);
    }
    item.visible = false;
    item.dismissedAt = /* @__PURE__ */ new Date();
    item.interactionType = reason === "timeout" ? "timeout" : "dismiss";
    this.visibleItems.delete(eventId);
    this.items.delete(eventId);
    this.notifyListeners();
    this.processQueue();
    this.logger.debug("Intervention dismissed", {
      id: eventId,
      reason
    });
  }
  dismissAll() {
    for (const id of this.visibleItems) {
      this.dismiss(id, "replaced");
    }
  }
  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------
  markInteracted(eventId, interactionType) {
    const item = this.items.get(eventId);
    if (!item) return;
    item.interactedAt = /* @__PURE__ */ new Date();
    item.interactionType = interactionType;
    this.notifyListeners();
  }
  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  getQueue() {
    const items = Array.from(this.items.values());
    const priorityOrder = items.sort((a, b) => b.displayConfig.priority - a.displayConfig.priority).map((item) => item.id);
    return {
      items,
      maxVisible: this.config.maxVisible,
      currentlyVisible: Array.from(this.visibleItems),
      priorityOrder
    };
  }
  getVisible() {
    return Array.from(this.visibleItems).map((id) => this.items.get(id)).filter((item) => item !== void 0);
  }
  getVisibleBySurface(surface) {
    return this.getVisible().filter((item) => item.displayConfig.surface === surface);
  }
  getItem(eventId) {
    return this.items.get(eventId);
  }
  // ---------------------------------------------------------------------------
  // Clear
  // ---------------------------------------------------------------------------
  clearAll() {
    for (const timer of this.dismissTimers.values()) {
      clearTimeout(timer);
    }
    this.dismissTimers.clear();
    this.items.clear();
    this.visibleItems.clear();
    this.notifyListeners();
    this.logger.info("All interventions cleared");
  }
  clearBySurface(surface) {
    const toRemove = [];
    for (const [id, item] of this.items) {
      if (item.displayConfig.surface === surface) {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.dismiss(id, "replaced");
    }
  }
  // ---------------------------------------------------------------------------
  // Listeners
  // ---------------------------------------------------------------------------
  onQueueChange(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
  notifyListeners() {
    const queue = this.getQueue();
    for (const listener of this.listeners) {
      try {
        listener(queue);
      } catch (error) {
        this.logger.error("Error in queue listener", {
          error: error instanceof Error ? error.message : "Unknown"
        });
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Audio/Haptics
  // ---------------------------------------------------------------------------
  playSound(eventType) {
    if (typeof window === "undefined") return;
    try {
      const soundMap = {
        celebration: "/sounds/celebration.mp3",
        step_completed: "/sounds/complete.mp3",
        intervention: "/sounds/notification.mp3",
        checkin: "/sounds/gentle.mp3"
      };
      const soundUrl = soundMap[eventType];
      if (soundUrl) {
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        audio.play().catch(() => {
        });
      }
    } catch {
    }
  }
  vibrate() {
    if (typeof window === "undefined" || !navigator.vibrate) return;
    try {
      navigator.vibrate(100);
    } catch {
    }
  }
};
function createInterventionSurfaceManager(options) {
  return new InterventionSurfaceManagerImpl(options);
}

// src/realtime/channels/email-channel.ts
function getEmailTemplate(event) {
  const eventType = event.type;
  const payload = event.payload;
  switch (eventType) {
    case "intervention":
      return {
        subject: "SAM AI: Important Learning Update",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">\u{1F393} SAM has an important message for you</h2>
            <p style="font-size: 16px; color: #374151;">${payload.message || "You have a new learning update"}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Open SAM
            </a>
          </div>
        `,
        text: `SAM has an important message for you: ${payload.message || "You have a new learning update"}`
      };
    case "checkin":
      return {
        subject: "SAM AI: Time for a Quick Check-In",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">\u{1F44B} SAM wants to check in with you</h2>
            <p style="font-size: 16px; color: #374151;">${payload.message || "How is your learning going?"}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Respond to SAM
            </a>
          </div>
        `,
        text: `SAM wants to check in with you: ${payload.message || "How is your learning going?"}`
      };
    case "nudge":
      const nudgePayload = payload;
      return {
        subject: `SAM AI: ${getNudgeSubject(nudgePayload.type || "reminder")}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">\u{1F4A1} ${getNudgeTitle(nudgePayload.type || "reminder")}</h2>
            <p style="font-size: 16px; color: #374151;">${nudgePayload.message || "SAM has a suggestion for you"}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Learn More
            </a>
          </div>
        `,
        text: `${getNudgeTitle(nudgePayload.type || "reminder")}: ${nudgePayload.message || "SAM has a suggestion for you"}`
      };
    case "goal_progress":
      const goalPayload = payload;
      return {
        subject: `SAM AI: Progress Update - ${goalPayload.goalTitle || "Your Goal"}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">\u{1F4C8} Goal Progress Update</h2>
            <p style="font-size: 16px; color: #374151;">Great news! You&apos;ve made progress on: <strong>${goalPayload.goalTitle || "Your Goal"}</strong></p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <div style="background: #e5e7eb; border-radius: 4px; height: 8px;">
                <div style="background: #4f46e5; border-radius: 4px; height: 8px; width: ${goalPayload.progress || 0}%;"></div>
              </div>
              <p style="text-align: center; margin-top: 8px; font-weight: 600; color: #4f46e5;">${goalPayload.progress || 0}% Complete</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              View Details
            </a>
          </div>
        `,
        text: `Goal Progress Update: You&apos;ve made ${goalPayload.progress || 0}% progress on ${goalPayload.goalTitle || "Your Goal"}`
      };
    case "celebration":
      const celebrationPayload = payload;
      return {
        subject: `\u{1F389} SAM AI: ${celebrationPayload.title || "Congratulations!"}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">\u{1F389} ${celebrationPayload.title || "Congratulations!"}</h2>
            <p style="font-size: 16px; color: #374151;">${celebrationPayload.message || "You achieved something great!"}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Celebrate with SAM
            </a>
          </div>
        `,
        text: `${celebrationPayload.title || "Congratulations!"}: ${celebrationPayload.message || "You achieved something great!"}`
      };
    default:
      return {
        subject: "SAM AI: New Notification",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">\u{1F514} New Notification from SAM</h2>
            <p style="font-size: 16px; color: #374151;">You have a new notification waiting for you.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Open SAM
            </a>
          </div>
        `,
        text: "You have a new notification from SAM AI."
      };
  }
}
function getNudgeSubject(type) {
  const subjects = {
    reminder: "Learning Reminder",
    encouragement: "Keep Going!",
    tip: "Learning Tip",
    streak_alert: "Streak Alert!",
    break_suggestion: "Time for a Break",
    study_prompt: "Time to Study",
    achievement: "Achievement Unlocked!"
  };
  return subjects[type] || "Learning Update";
}
function getNudgeTitle(type) {
  const titles = {
    reminder: "A quick reminder",
    encouragement: "You&apos;re doing great!",
    tip: "Pro tip for you",
    streak_alert: "Don&apos;t lose your streak!",
    break_suggestion: "Take a breather",
    study_prompt: "Ready to learn?",
    achievement: "Achievement unlocked!"
  };
  return titles[type] || "SAM has a message";
}
var EmailChannel = class {
  channel = "email";
  config;
  logger;
  throttleMap = /* @__PURE__ */ new Map();
  constructor(config) {
    this.config = config;
    this.logger = config.logger ?? console;
  }
  async canDeliver(userId) {
    if (this.config.enabled === false) {
      return false;
    }
    const email = await this.config.getUserEmail(userId);
    if (!email) {
      return false;
    }
    if (this.config.getUserPreferences) {
      const prefs = await this.config.getUserPreferences(userId);
      if (prefs && !prefs.enabled) {
        return false;
      }
      if (prefs?.quietHours) {
        const now = /* @__PURE__ */ new Date();
        const hour = now.getHours();
        const { start, end } = prefs.quietHours;
        if (start < end) {
          if (hour >= start && hour < end) {
            return false;
          }
        } else {
          if (hour >= start || hour < end) {
            return false;
          }
        }
      }
    }
    if (!this.checkThrottle(userId)) {
      this.logger.debug("Email throttled for user", { userId });
      return false;
    }
    return true;
  }
  async deliver(userId, event) {
    const email = await this.config.getUserEmail(userId);
    if (!email) {
      return false;
    }
    if (this.config.getUserPreferences) {
      const prefs = await this.config.getUserPreferences(userId);
      if (prefs && prefs.types.length > 0 && !prefs.types.includes(event.type)) {
        this.logger.debug("Event type not in user preferences", { userId, type: event.type });
        return false;
      }
    }
    const template = getEmailTemplate(event);
    try {
      const sent = await this.config.emailService.send({
        to: email,
        from: this.config.fromEmail,
        fromName: this.config.fromName ?? "SAM AI",
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: ["sam-notification", event.type],
        metadata: {
          userId,
          eventType: event.type,
          eventId: event.eventId
        }
      });
      if (sent) {
        this.incrementThrottle(userId);
        this.logger.info("Email notification sent", {
          userId,
          eventType: event.type,
          eventId: event.eventId
        });
      }
      return sent;
    } catch (error) {
      this.logger.error("Failed to send email notification", {
        userId,
        eventType: event.type,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return false;
    }
  }
  checkThrottle(userId) {
    const throttle = this.config.throttle;
    if (!throttle) return true;
    const now = /* @__PURE__ */ new Date();
    let userData = this.throttleMap.get(userId);
    if (userData && userData.lastReset.getDate() !== now.getDate()) {
      userData = { hourly: 0, daily: 0, lastReset: now };
      this.throttleMap.set(userId, userData);
    }
    if (userData && userData.lastReset.getHours() !== now.getHours()) {
      userData.hourly = 0;
    }
    if (!userData) {
      userData = { hourly: 0, daily: 0, lastReset: now };
      this.throttleMap.set(userId, userData);
    }
    if (throttle.maxPerHour && userData.hourly >= throttle.maxPerHour) {
      return false;
    }
    if (throttle.maxPerDay && userData.daily >= throttle.maxPerDay) {
      return false;
    }
    return true;
  }
  incrementThrottle(userId) {
    const userData = this.throttleMap.get(userId);
    if (userData) {
      userData.hourly++;
      userData.daily++;
      userData.lastReset = /* @__PURE__ */ new Date();
    }
  }
};
function createEmailChannel(config) {
  return new EmailChannel(config);
}

// src/realtime/channels/browser-push-channel.ts
function buildNotificationPayload(event) {
  const eventType = event.type;
  const payload = event.payload;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  switch (eventType) {
    case "intervention":
      return {
        title: "\u{1F393} SAM AI",
        body: payload.message || "You have an important learning update",
        icon: "/icons/sam-icon-192.png",
        badge: "/icons/sam-badge-72.png",
        tag: `intervention-${event.eventId}`,
        requireInteraction: true,
        data: {
          url: `${appUrl}/dashboard`,
          eventId: event.eventId,
          type: eventType
        },
        actions: [
          { action: "open", title: "Open SAM" },
          { action: "dismiss", title: "Later" }
        ]
      };
    case "checkin":
      return {
        title: "\u{1F44B} SAM Check-In",
        body: payload.message || "How is your learning going?",
        icon: "/icons/sam-icon-192.png",
        badge: "/icons/sam-badge-72.png",
        tag: `checkin-${event.eventId}`,
        data: {
          url: `${appUrl}/dashboard`,
          eventId: event.eventId,
          type: eventType
        },
        actions: [
          { action: "respond", title: "Respond" },
          { action: "snooze", title: "Snooze" }
        ]
      };
    case "nudge": {
      const nudgePayload = payload;
      return {
        title: getNudgeIcon(nudgePayload.type || "reminder") + " " + getNudgeTitle2(nudgePayload.type || "reminder"),
        body: nudgePayload.message || "SAM has a suggestion for you",
        icon: "/icons/sam-icon-192.png",
        badge: "/icons/sam-badge-72.png",
        tag: `nudge-${nudgePayload.type || "reminder"}-${event.eventId}`,
        renotify: nudgePayload.type === "streak_alert",
        data: {
          url: `${appUrl}/dashboard`,
          eventId: event.eventId,
          type: eventType,
          nudgeType: nudgePayload.type
        }
      };
    }
    case "goal_progress": {
      const goalPayload = payload;
      return {
        title: "\u{1F4C8} Goal Progress",
        body: `${goalPayload.progress || 0}% complete: ${goalPayload.goalTitle || "Your Goal"}`,
        icon: "/icons/sam-icon-192.png",
        badge: "/icons/sam-badge-72.png",
        tag: `goal-progress-${event.eventId}`,
        data: {
          url: `${appUrl}/dashboard`,
          eventId: event.eventId,
          type: eventType
        }
      };
    }
    case "step_completed": {
      const stepPayload = payload;
      return {
        title: "\u2705 Step Completed!",
        body: stepPayload.nextStepTitle ? `Up next: ${stepPayload.nextStepTitle}` : `Great job completing: ${stepPayload.stepTitle || "this step"}`,
        icon: "/icons/sam-icon-192.png",
        badge: "/icons/sam-badge-72.png",
        tag: `step-completed-${event.eventId}`,
        data: {
          url: `${appUrl}/dashboard`,
          eventId: event.eventId,
          type: eventType
        }
      };
    }
    case "celebration": {
      const celebrationPayload = payload;
      return {
        title: "\u{1F389} " + (celebrationPayload.title || "Congratulations!"),
        body: celebrationPayload.message || "You achieved something great!",
        icon: "/icons/sam-icon-192.png",
        badge: "/icons/sam-badge-72.png",
        tag: `celebration-${celebrationPayload.type || "achievement"}-${event.eventId}`,
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
          url: `${appUrl}/dashboard`,
          eventId: event.eventId,
          type: eventType,
          celebrationType: celebrationPayload.type
        },
        actions: [
          { action: "celebrate", title: "\u{1F389} Celebrate!" },
          { action: "share", title: "Share" }
        ]
      };
    }
    case "recommendation": {
      const recPayload = payload;
      return {
        title: "\u{1F4A1} Recommended for You",
        body: recPayload.title || recPayload.description || "Check out this learning recommendation",
        icon: "/icons/sam-icon-192.png",
        badge: "/icons/sam-badge-72.png",
        tag: `recommendation-${event.eventId}`,
        data: {
          url: `${appUrl}/dashboard`,
          eventId: event.eventId,
          type: eventType
        }
      };
    }
    default:
      return {
        title: "\u{1F514} SAM AI",
        body: "You have a new notification",
        icon: "/icons/sam-icon-192.png",
        badge: "/icons/sam-badge-72.png",
        tag: `notification-${event.eventId}`,
        data: {
          url: `${appUrl}/dashboard`,
          eventId: event.eventId,
          type: eventType
        }
      };
  }
}
function getNudgeIcon(type) {
  const icons = {
    reminder: "\u23F0",
    encouragement: "\u{1F4AA}",
    tip: "\u{1F4A1}",
    streak_alert: "\u{1F525}",
    break_suggestion: "\u2615",
    study_prompt: "\u{1F4DA}",
    achievement: "\u{1F3C6}"
  };
  return icons[type] || "\u{1F4A1}";
}
function getNudgeTitle2(type) {
  const titles = {
    reminder: "Reminder",
    encouragement: "Keep Going!",
    tip: "Learning Tip",
    streak_alert: "Streak Alert!",
    break_suggestion: "Break Time",
    study_prompt: "Time to Learn",
    achievement: "Achievement"
  };
  return titles[type] || "SAM Notification";
}
function getUrgency(event) {
  const eventType = event.type;
  switch (eventType) {
    case "intervention":
    case "celebration":
      return "high";
    case "checkin":
    case "step_completed":
      return "normal";
    case "nudge":
    case "recommendation":
      return "low";
    case "goal_progress":
      return "very-low";
    default:
      return "normal";
  }
}
var BrowserPushChannel = class {
  channel = "push_notification";
  config;
  logger;
  constructor(config) {
    this.config = config;
    this.logger = config.logger ?? console;
  }
  async canDeliver(userId) {
    if (this.config.enabled === false) {
      return false;
    }
    const subscription = await this.config.getUserSubscription(userId);
    if (!subscription) {
      return false;
    }
    if (subscription.expirationTime && subscription.expirationTime < Date.now()) {
      this.logger.debug("Push subscription expired", { userId });
      return false;
    }
    return true;
  }
  async deliver(userId, event) {
    const subscription = await this.config.getUserSubscription(userId);
    if (!subscription) {
      return false;
    }
    const notification = buildNotificationPayload(event);
    const payload = JSON.stringify(notification);
    const urgency = getUrgency(event);
    try {
      const result = await this.config.pushService.sendNotification(subscription, payload, {
        vapidDetails: {
          subject: this.config.vapidSubject,
          publicKey: this.config.vapidPublicKey,
          privateKey: this.config.vapidPrivateKey
        },
        ttl: this.config.ttl ?? 86400,
        urgency,
        topic: notification.tag
      });
      if (result.statusCode >= 200 && result.statusCode < 300) {
        this.logger.info("Push notification sent", {
          userId,
          eventType: event.type,
          eventId: event.eventId,
          statusCode: result.statusCode
        });
        return true;
      }
      if (result.statusCode === 404 || result.statusCode === 410) {
        this.logger.warn("Push subscription no longer valid", {
          userId,
          statusCode: result.statusCode
        });
      }
      this.logger.error("Push notification failed", {
        userId,
        eventType: event.type,
        statusCode: result.statusCode,
        body: result.body
      });
      return false;
    } catch (error) {
      this.logger.error("Failed to send push notification", {
        userId,
        eventType: event.type,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      return false;
    }
  }
};
function createBrowserPushChannel(config) {
  return new BrowserPushChannel(config);
}

// src/observability/types.ts
var ToolExecutionStatus2 = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  EXECUTING: "executing",
  SUCCESS: "success",
  FAILED: "failed",
  TIMEOUT: "timeout",
  CANCELLED: "cancelled"
};
var MemorySource = {
  VECTOR_SEARCH: "vector_search",
  KNOWLEDGE_GRAPH: "knowledge_graph",
  SESSION_CONTEXT: "session_context",
  CROSS_SESSION: "cross_session",
  CURRICULUM: "curriculum",
  EXTERNAL: "external"
};
var ResponseType4 = {
  EXPLANATION: "explanation",
  ANSWER: "answer",
  RECOMMENDATION: "recommendation",
  ASSESSMENT: "assessment",
  INTERVENTION: "intervention",
  TOOL_RESULT: "tool_result"
};
var VerificationMethod = {
  USER_FEEDBACK: "user_feedback",
  EXPERT_REVIEW: "expert_review",
  AUTOMATED_CHECK: "automated_check",
  OUTCOME_TRACKING: "outcome_tracking",
  SELF_VERIFICATION: "self_verification"
};
var PlanEventType = {
  CREATED: "created",
  ACTIVATED: "activated",
  STEP_STARTED: "step_started",
  STEP_COMPLETED: "step_completed",
  STEP_FAILED: "step_failed",
  STEP_SKIPPED: "step_skipped",
  PAUSED: "paused",
  RESUMED: "resumed",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
  MODIFIED: "modified"
};
var ProactiveEventType = {
  CHECKIN_SCHEDULED: "checkin_scheduled",
  CHECKIN_TRIGGERED: "checkin_triggered",
  CHECKIN_DELIVERED: "checkin_delivered",
  CHECKIN_RESPONDED: "checkin_responded",
  CHECKIN_DISMISSED: "checkin_dismissed",
  CHECKIN_EXPIRED: "checkin_expired",
  INTERVENTION_TRIGGERED: "intervention_triggered",
  INTERVENTION_DELIVERED: "intervention_delivered",
  INTERVENTION_ACCEPTED: "intervention_accepted",
  INTERVENTION_DISMISSED: "intervention_dismissed",
  NUDGE_SENT: "nudge_sent",
  NUDGE_CLICKED: "nudge_clicked",
  RECOMMENDATION_SHOWN: "recommendation_shown",
  RECOMMENDATION_CLICKED: "recommendation_clicked"
};
var HealthStatus = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNHEALTHY: "unhealthy",
  UNKNOWN: "unknown"
};
var AlertSeverity = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical"
};

// src/observability/tool-telemetry.ts
var InMemoryToolExecutionStore = class {
  events = /* @__PURE__ */ new Map();
  maxEvents;
  constructor(maxEvents = 1e4) {
    this.maxEvents = maxEvents;
  }
  async record(event) {
    if (this.events.size >= this.maxEvents) {
      const oldestKey = this.events.keys().next().value;
      if (oldestKey) {
        this.events.delete(oldestKey);
      }
    }
    this.events.set(event.executionId, event);
  }
  async getById(executionId) {
    return this.events.get(executionId) ?? null;
  }
  async query(options) {
    let results = Array.from(this.events.values());
    if (options.userId) {
      results = results.filter((e) => e.userId === options.userId);
    }
    if (options.toolId) {
      results = results.filter((e) => e.toolId === options.toolId);
    }
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      results = results.filter((e) => statuses.includes(e.status));
    }
    if (options.planId) {
      results = results.filter((e) => e.planId === options.planId);
    }
    if (options.startTime) {
      results = results.filter((e) => e.startedAt >= options.startTime);
    }
    if (options.endTime) {
      results = results.filter((e) => e.startedAt <= options.endTime);
    }
    results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 100;
    return results.slice(offset, offset + limit);
  }
  async getMetrics(periodStart, periodEnd) {
    const events = Array.from(this.events.values()).filter(
      (e) => e.startedAt >= periodStart && e.startedAt <= periodEnd
    );
    const completedEvents = events.filter(
      (e) => e.status === ToolExecutionStatus2.SUCCESS || e.status === ToolExecutionStatus2.FAILED
    );
    const successfulEvents = events.filter((e) => e.status === ToolExecutionStatus2.SUCCESS);
    const latencies = completedEvents.filter((e) => e.durationMs !== void 0).map((e) => e.durationMs).sort((a, b) => a - b);
    const confirmationRequiredEvents = events.filter((e) => e.confirmationRequired);
    const confirmationGivenEvents = events.filter(
      (e) => e.confirmationRequired && e.confirmationGiven
    );
    const failuresByCode = {};
    events.filter((e) => e.status === ToolExecutionStatus2.FAILED && e.error).forEach((e) => {
      const code = e.error.code;
      failuresByCode[code] = (failuresByCode[code] ?? 0) + 1;
    });
    const executionsByTool = {};
    events.forEach((e) => {
      executionsByTool[e.toolId] = (executionsByTool[e.toolId] ?? 0) + 1;
    });
    return {
      executionCount: events.length,
      successRate: completedEvents.length > 0 ? successfulEvents.length / completedEvents.length : 0,
      avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p50LatencyMs: this.percentile(latencies, 50),
      p95LatencyMs: this.percentile(latencies, 95),
      p99LatencyMs: this.percentile(latencies, 99),
      confirmationRate: events.length > 0 ? confirmationRequiredEvents.length / events.length : 0,
      confirmationAcceptRate: confirmationRequiredEvents.length > 0 ? confirmationGivenEvents.length / confirmationRequiredEvents.length : 0,
      failuresByCode,
      executionsByTool,
      periodStart,
      periodEnd
    };
  }
  percentile(sortedValues, p) {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(p / 100 * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
  clear() {
    this.events.clear();
  }
};
var DEFAULT_TOOL_TELEMETRY_CONFIG = {
  enabled: true,
  sampleRate: 1,
  maxEvents: 1e4,
  sanitize: true,
  redactFields: ["password", "token", "secret", "apiKey", "authorization"]
};
var ToolTelemetry = class {
  store;
  config;
  logger;
  activeExecutions = /* @__PURE__ */ new Map();
  constructor(options) {
    this.config = { ...DEFAULT_TOOL_TELEMETRY_CONFIG, ...options.config };
    this.store = options.store ?? new InMemoryToolExecutionStore(this.config.maxEvents);
    this.logger = options.logger ?? console;
  }
  // ---------------------------------------------------------------------------
  // Event Recording
  // ---------------------------------------------------------------------------
  /**
   * Start tracking a tool execution
   */
  startExecution(params) {
    if (!this.config.enabled || !this.shouldSample()) {
      return "";
    }
    const executionId = v4_default();
    const event = {
      executionId,
      toolId: params.toolId,
      toolName: params.toolName,
      userId: params.userId,
      sessionId: params.sessionId,
      planId: params.planId,
      stepId: params.stepId,
      startedAt: /* @__PURE__ */ new Date(),
      status: ToolExecutionStatus2.PENDING,
      confirmationRequired: params.confirmationRequired,
      inputSummary: this.sanitizeAndSummarize(params.input),
      tags: params.tags
    };
    this.activeExecutions.set(executionId, event);
    this.logger.debug("Tool execution started", {
      executionId,
      toolId: params.toolId,
      userId: params.userId
    });
    return executionId;
  }
  /**
   * Record confirmation response
   */
  recordConfirmation(executionId, confirmed) {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;
    event.confirmationGiven = confirmed;
    event.status = confirmed ? ToolExecutionStatus2.CONFIRMED : ToolExecutionStatus2.REJECTED;
    if (!confirmed) {
      this.completeExecution(executionId, false, void 0, {
        code: "CONFIRMATION_REJECTED",
        message: "User rejected tool execution",
        retryable: false
      });
    }
  }
  /**
   * Mark execution as started (after confirmation)
   */
  markExecuting(executionId) {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;
    event.status = ToolExecutionStatus2.EXECUTING;
  }
  /**
   * Complete a tool execution
   */
  async completeExecution(executionId, success, output, error) {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;
    event.completedAt = /* @__PURE__ */ new Date();
    event.durationMs = event.completedAt.getTime() - event.startedAt.getTime();
    event.status = success ? ToolExecutionStatus2.SUCCESS : ToolExecutionStatus2.FAILED;
    event.outputSummary = success ? this.sanitizeAndSummarize(output) : void 0;
    event.error = error;
    this.activeExecutions.delete(executionId);
    await this.store.record(event);
    this.logger.debug("Tool execution completed", {
      executionId,
      toolId: event.toolId,
      success,
      durationMs: event.durationMs
    });
  }
  /**
   * Record a timeout
   */
  async recordTimeout(executionId) {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;
    event.completedAt = /* @__PURE__ */ new Date();
    event.durationMs = event.completedAt.getTime() - event.startedAt.getTime();
    event.status = ToolExecutionStatus2.TIMEOUT;
    event.error = {
      code: "TIMEOUT",
      message: "Tool execution timed out",
      retryable: true
    };
    this.activeExecutions.delete(executionId);
    await this.store.record(event);
    this.logger.warn("Tool execution timeout", {
      executionId,
      toolId: event.toolId,
      durationMs: event.durationMs
    });
  }
  /**
   * Record a cancellation
   */
  async recordCancellation(executionId) {
    const event = this.activeExecutions.get(executionId);
    if (!event) return;
    event.completedAt = /* @__PURE__ */ new Date();
    event.durationMs = event.completedAt.getTime() - event.startedAt.getTime();
    event.status = ToolExecutionStatus2.CANCELLED;
    this.activeExecutions.delete(executionId);
    await this.store.record(event);
    this.logger.info("Tool execution cancelled", {
      executionId,
      toolId: event.toolId
    });
  }
  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------
  async getExecution(executionId) {
    const active = this.activeExecutions.get(executionId);
    if (active) return active;
    return this.store.getById(executionId);
  }
  async queryExecutions(query) {
    return this.store.query(query);
  }
  async getMetrics(periodStart, periodEnd) {
    return this.store.getMetrics(periodStart, periodEnd);
  }
  /**
   * Get metrics for the last N minutes
   */
  async getRecentMetrics(minutes = 60) {
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - minutes * 60 * 1e3);
    return this.getMetrics(start, now);
  }
  /**
   * Get active execution count
   */
  getActiveExecutionCount() {
    return this.activeExecutions.size;
  }
  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------
  shouldSample() {
    return Math.random() < this.config.sampleRate;
  }
  sanitizeAndSummarize(data) {
    if (data === void 0 || data === null) return void 0;
    try {
      let str = typeof data === "string" ? data : JSON.stringify(data);
      if (this.config.sanitize) {
        for (const field of this.config.redactFields) {
          const regex = new RegExp(`"${field}"\\s*:\\s*"[^"]*"`, "gi");
          str = str.replace(regex, `"${field}":"[REDACTED]"`);
        }
      }
      if (str.length > 500) {
        str = str.substring(0, 500) + "...[truncated]";
      }
      return str;
    } catch {
      return "[serialization failed]";
    }
  }
};
function createToolTelemetry(options) {
  return new ToolTelemetry(options ?? {});
}
function createInMemoryToolExecutionStore(maxEvents) {
  return new InMemoryToolExecutionStore(maxEvents);
}

// src/observability/memory-quality-tracker.ts
var InMemoryMemoryRetrievalStore = class {
  events = /* @__PURE__ */ new Map();
  maxEvents;
  constructor(maxEvents = 1e4) {
    this.maxEvents = maxEvents;
  }
  async record(event) {
    if (this.events.size >= this.maxEvents) {
      const oldestKey = this.events.keys().next().value;
      if (oldestKey) {
        this.events.delete(oldestKey);
      }
    }
    this.events.set(event.retrievalId, event);
  }
  async getById(retrievalId) {
    return this.events.get(retrievalId) ?? null;
  }
  async recordFeedback(retrievalId, feedback) {
    const event = this.events.get(retrievalId);
    if (event) {
      event.userFeedback = feedback;
    }
  }
  async getMetrics(periodStart, periodEnd) {
    const events = Array.from(this.events.values()).filter(
      (e) => e.timestamp >= periodStart && e.timestamp <= periodEnd
    );
    const bySource = {
      [MemorySource.VECTOR_SEARCH]: this.emptySourceMetrics(),
      [MemorySource.KNOWLEDGE_GRAPH]: this.emptySourceMetrics(),
      [MemorySource.SESSION_CONTEXT]: this.emptySourceMetrics(),
      [MemorySource.CROSS_SESSION]: this.emptySourceMetrics(),
      [MemorySource.CURRICULUM]: this.emptySourceMetrics(),
      [MemorySource.EXTERNAL]: this.emptySourceMetrics()
    };
    const relevanceScores = [];
    const latencies = [];
    let cacheHits = 0;
    let emptyResults = 0;
    let positiveFeedback = 0;
    let feedbackCount = 0;
    for (const event of events) {
      relevanceScores.push(event.avgRelevanceScore);
      latencies.push(event.latencyMs);
      if (event.cacheHit) cacheHits++;
      if (event.resultCount === 0) emptyResults++;
      if (event.userFeedback) {
        feedbackCount++;
        if (event.userFeedback.helpful) positiveFeedback++;
      }
      const sourceMetrics = bySource[event.source];
      sourceMetrics.searchCount++;
      sourceMetrics.avgRelevanceScore = (sourceMetrics.avgRelevanceScore * (sourceMetrics.searchCount - 1) + event.avgRelevanceScore) / sourceMetrics.searchCount;
      sourceMetrics.avgLatencyMs = (sourceMetrics.avgLatencyMs * (sourceMetrics.searchCount - 1) + event.latencyMs) / sourceMetrics.searchCount;
      if (event.cacheHit) {
        sourceMetrics.cacheHitRate = (sourceMetrics.cacheHitRate * (sourceMetrics.searchCount - 1) + 1) / sourceMetrics.searchCount;
      }
    }
    relevanceScores.sort((a, b) => a - b);
    latencies.sort((a, b) => a - b);
    return {
      searchCount: events.length,
      avgRelevanceScore: relevanceScores.length > 0 ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length : 0,
      medianRelevanceScore: this.median(relevanceScores),
      cacheHitRate: events.length > 0 ? cacheHits / events.length : 0,
      avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p95LatencyMs: this.percentile(latencies, 95),
      emptyResultRate: events.length > 0 ? emptyResults / events.length : 0,
      positiveFeedbackRate: feedbackCount > 0 ? positiveFeedback / feedbackCount : 0,
      bySource,
      reindexQueueDepth: 0,
      // Would be populated by lifecycle manager
      lastReindexAt: void 0,
      periodStart,
      periodEnd
    };
  }
  emptySourceMetrics() {
    return {
      searchCount: 0,
      avgRelevanceScore: 0,
      avgLatencyMs: 0,
      cacheHitRate: 0
    };
  }
  median(sortedValues) {
    if (sortedValues.length === 0) return 0;
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 !== 0 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  }
  percentile(sortedValues, p) {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(p / 100 * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
  clear() {
    this.events.clear();
  }
};
var DEFAULT_MEMORY_QUALITY_CONFIG = {
  enabled: true,
  sampleRate: 1,
  maxEvents: 1e4,
  lowRelevanceThreshold: 0.3,
  highLatencyThreshold: 2e3
};
var MemoryQualityTracker = class {
  store;
  config;
  logger;
  alertListeners = /* @__PURE__ */ new Set();
  constructor(options) {
    this.config = { ...DEFAULT_MEMORY_QUALITY_CONFIG, ...options.config };
    this.store = options.store ?? new InMemoryMemoryRetrievalStore(this.config.maxEvents);
    this.logger = options.logger ?? console;
  }
  // ---------------------------------------------------------------------------
  // Event Recording
  // ---------------------------------------------------------------------------
  /**
   * Record a memory retrieval event
   */
  async recordRetrieval(params) {
    if (!this.config.enabled || !this.shouldSample()) {
      return "";
    }
    const retrievalId = v4_default();
    const event = {
      retrievalId,
      userId: params.userId,
      sessionId: params.sessionId,
      query: params.query,
      source: params.source,
      resultCount: params.resultCount,
      topRelevanceScore: params.topRelevanceScore,
      avgRelevanceScore: params.avgRelevanceScore,
      cacheHit: params.cacheHit,
      latencyMs: params.latencyMs,
      timestamp: /* @__PURE__ */ new Date(),
      metadata: params.metadata
    };
    await this.store.record(event);
    this.checkAlerts(event);
    this.logger.debug("Memory retrieval recorded", {
      retrievalId,
      source: params.source,
      resultCount: params.resultCount,
      avgRelevanceScore: params.avgRelevanceScore,
      latencyMs: params.latencyMs
    });
    return retrievalId;
  }
  /**
   * Record user feedback for a retrieval
   */
  async recordFeedback(retrievalId, feedback) {
    await this.store.recordFeedback(retrievalId, {
      ...feedback,
      providedAt: /* @__PURE__ */ new Date()
    });
    this.logger.info("Memory retrieval feedback recorded", {
      retrievalId,
      helpful: feedback.helpful,
      relevanceRating: feedback.relevanceRating
    });
  }
  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------
  async getRetrieval(retrievalId) {
    return this.store.getById(retrievalId);
  }
  async getMetrics(periodStart, periodEnd) {
    return this.store.getMetrics(periodStart, periodEnd);
  }
  /**
   * Get metrics for the last N minutes
   */
  async getRecentMetrics(minutes = 60) {
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - minutes * 60 * 1e3);
    return this.getMetrics(start, now);
  }
  /**
   * Get quality summary for a specific source
   */
  async getSourceQuality(source, periodStart, periodEnd) {
    const metrics = await this.getMetrics(periodStart, periodEnd);
    return metrics.bySource[source];
  }
  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------
  checkAlerts(event) {
    const alerts = [];
    if (event.avgRelevanceScore < this.config.lowRelevanceThreshold) {
      alerts.push({
        type: "low_relevance",
        message: `Low relevance score: ${event.avgRelevanceScore.toFixed(2)}`,
        retrievalId: event.retrievalId,
        value: event.avgRelevanceScore,
        threshold: this.config.lowRelevanceThreshold
      });
    }
    if (event.latencyMs > this.config.highLatencyThreshold) {
      alerts.push({
        type: "high_latency",
        message: `High latency: ${event.latencyMs}ms`,
        retrievalId: event.retrievalId,
        value: event.latencyMs,
        threshold: this.config.highLatencyThreshold
      });
    }
    if (event.resultCount === 0) {
      alerts.push({
        type: "empty_results",
        message: "No results returned for query",
        retrievalId: event.retrievalId,
        value: 0,
        threshold: 1
      });
    }
    for (const alert of alerts) {
      this.emitAlert(alert);
    }
  }
  /**
   * Subscribe to quality alerts
   */
  onAlert(callback) {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }
  emitAlert(alert) {
    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (err) {
        this.logger.error("Error in alert listener", {
          error: err instanceof Error ? err.message : "Unknown"
        });
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------
  shouldSample() {
    return Math.random() < this.config.sampleRate;
  }
};
function createMemoryQualityTracker(options) {
  return new MemoryQualityTracker(options ?? {});
}
function createInMemoryMemoryRetrievalStore(maxEvents) {
  return new InMemoryMemoryRetrievalStore(maxEvents);
}

// src/observability/confidence-calibration.ts
var InMemoryConfidencePredictionStore = class {
  predictions = /* @__PURE__ */ new Map();
  maxPredictions;
  constructor(maxPredictions = 1e4) {
    this.maxPredictions = maxPredictions;
  }
  async record(prediction) {
    if (this.predictions.size >= this.maxPredictions) {
      const oldestKey = this.predictions.keys().next().value;
      if (oldestKey) {
        this.predictions.delete(oldestKey);
      }
    }
    this.predictions.set(prediction.predictionId, prediction);
  }
  async getById(predictionId) {
    return this.predictions.get(predictionId) ?? null;
  }
  async recordOutcome(predictionId, outcome) {
    const prediction = this.predictions.get(predictionId);
    if (prediction) {
      prediction.actualOutcome = outcome;
    }
  }
  async getCalibrationMetrics(periodStart, periodEnd) {
    const predictions = Array.from(this.predictions.values()).filter(
      (p) => p.predictedAt >= periodStart && p.predictedAt <= periodEnd
    );
    const withOutcomes = predictions.filter((p) => p.actualOutcome !== void 0);
    const avgPredictedConfidence = predictions.length > 0 ? predictions.reduce((sum, p) => sum + p.predictedConfidence, 0) / predictions.length : 0;
    const avgActualAccuracy = withOutcomes.length > 0 ? withOutcomes.reduce(
      (sum, p) => sum + (p.actualOutcome.accurate ? 1 : 0),
      0
    ) / withOutcomes.length : 0;
    const calibrationError = Math.abs(avgPredictedConfidence - avgActualAccuracy);
    const brierScore = withOutcomes.length > 0 ? withOutcomes.reduce((sum, p) => {
      const actual = p.actualOutcome.accurate ? 1 : 0;
      return sum + Math.pow(p.predictedConfidence - actual, 2);
    }, 0) / withOutcomes.length : 0;
    const calibrationBuckets = this.calculateBuckets(withOutcomes);
    const verificationOverrideRate = this.calculateOverrideRate(withOutcomes);
    const byResponseType = this.calculateByResponseType(predictions, withOutcomes);
    return {
      predictionCount: predictions.length,
      outcomesRecorded: withOutcomes.length,
      avgPredictedConfidence,
      avgActualAccuracy,
      calibrationError,
      brierScore,
      calibrationBuckets,
      verificationOverrideRate,
      byResponseType,
      periodStart,
      periodEnd
    };
  }
  calculateBuckets(withOutcomes) {
    const buckets = [];
    const bucketRanges = [
      [0, 0.1],
      [0.1, 0.2],
      [0.2, 0.3],
      [0.3, 0.4],
      [0.4, 0.5],
      [0.5, 0.6],
      [0.6, 0.7],
      [0.7, 0.8],
      [0.8, 0.9],
      [0.9, 1]
    ];
    for (const [rangeStart, rangeEnd] of bucketRanges) {
      const inBucket = withOutcomes.filter(
        (p) => p.predictedConfidence >= rangeStart && p.predictedConfidence < rangeEnd
      );
      if (inBucket.length === 0) {
        buckets.push({
          rangeStart,
          rangeEnd,
          count: 0,
          avgPredicted: 0,
          actualAccuracy: 0,
          error: 0
        });
        continue;
      }
      const avgPredicted = inBucket.reduce((sum, p) => sum + p.predictedConfidence, 0) / inBucket.length;
      const actualAccuracy = inBucket.reduce((sum, p) => sum + (p.actualOutcome.accurate ? 1 : 0), 0) / inBucket.length;
      buckets.push({
        rangeStart,
        rangeEnd,
        count: inBucket.length,
        avgPredicted,
        actualAccuracy,
        error: Math.abs(avgPredicted - actualAccuracy)
      });
    }
    return buckets;
  }
  calculateOverrideRate(withOutcomes) {
    const overrides = withOutcomes.filter((p) => {
      const confident = p.predictedConfidence >= 0.7;
      const accurate = p.actualOutcome.accurate;
      return confident && !accurate || !confident && accurate;
    });
    return withOutcomes.length > 0 ? overrides.length / withOutcomes.length : 0;
  }
  calculateByResponseType(predictions, withOutcomes) {
    const types = Object.values(ResponseType4);
    const result = {};
    for (const type of types) {
      const typePredictions = predictions.filter((p) => p.responseType === type);
      const typeWithOutcomes = withOutcomes.filter((p) => p.responseType === type);
      const avgPredictedConfidence = typePredictions.length > 0 ? typePredictions.reduce((sum, p) => sum + p.predictedConfidence, 0) / typePredictions.length : 0;
      const avgActualAccuracy = typeWithOutcomes.length > 0 ? typeWithOutcomes.reduce(
        (sum, p) => sum + (p.actualOutcome.accurate ? 1 : 0),
        0
      ) / typeWithOutcomes.length : 0;
      result[type] = {
        predictionCount: typePredictions.length,
        avgPredictedConfidence,
        avgActualAccuracy,
        calibrationError: Math.abs(avgPredictedConfidence - avgActualAccuracy)
      };
    }
    return result;
  }
  clear() {
    this.predictions.clear();
  }
};
var DEFAULT_CALIBRATION_CONFIG = {
  enabled: true,
  sampleRate: 1,
  maxPredictions: 1e4,
  bucketCount: 10,
  calibrationErrorThreshold: 0.15
};
var ConfidenceCalibrationTracker = class {
  store;
  config;
  logger;
  alertListeners = /* @__PURE__ */ new Set();
  constructor(options) {
    this.config = { ...DEFAULT_CALIBRATION_CONFIG, ...options.config };
    this.store = options.store ?? new InMemoryConfidencePredictionStore(this.config.maxPredictions);
    this.logger = options.logger ?? console;
  }
  // ---------------------------------------------------------------------------
  // Event Recording
  // ---------------------------------------------------------------------------
  /**
   * Record a confidence prediction
   */
  async recordPrediction(params) {
    if (!this.config.enabled || !this.shouldSample()) {
      return "";
    }
    const predictionId = v4_default();
    const prediction = {
      predictionId,
      userId: params.userId,
      sessionId: params.sessionId,
      responseId: params.responseId,
      responseType: params.responseType,
      predictedConfidence: params.predictedConfidence,
      factors: params.factors,
      predictedAt: /* @__PURE__ */ new Date()
    };
    await this.store.record(prediction);
    this.logger.debug("Confidence prediction recorded", {
      predictionId,
      responseType: params.responseType,
      predictedConfidence: params.predictedConfidence
    });
    return predictionId;
  }
  /**
   * Record the actual outcome for a prediction
   */
  async recordOutcome(predictionId, params) {
    const outcome = {
      accurate: params.accurate,
      userVerified: params.userVerified,
      verificationMethod: params.verificationMethod,
      qualityScore: params.qualityScore,
      notes: params.notes,
      recordedAt: /* @__PURE__ */ new Date()
    };
    await this.store.recordOutcome(predictionId, outcome);
    await this.checkCalibrationAlerts(predictionId);
    this.logger.debug("Confidence outcome recorded", {
      predictionId,
      accurate: params.accurate,
      verificationMethod: params.verificationMethod
    });
  }
  /**
   * Record outcome from user feedback
   */
  async recordUserFeedback(predictionId, helpful, rating) {
    await this.recordOutcome(predictionId, {
      accurate: helpful,
      userVerified: true,
      verificationMethod: VerificationMethod.USER_FEEDBACK,
      qualityScore: rating ? rating / 5 : void 0
    });
  }
  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------
  async getPrediction(predictionId) {
    return this.store.getById(predictionId);
  }
  async getCalibrationMetrics(periodStart, periodEnd) {
    return this.store.getCalibrationMetrics(periodStart, periodEnd);
  }
  /**
   * Get metrics for the last N days
   */
  async getRecentMetrics(days = 7) {
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
    return this.getCalibrationMetrics(start, now);
  }
  /**
   * Get calibration summary
   */
  async getCalibrationSummary() {
    const metrics = await this.getRecentMetrics(7);
    const calibrationQuality = metrics.calibrationError < 0.05 ? "excellent" : metrics.calibrationError < 0.1 ? "good" : metrics.calibrationError < 0.15 ? "fair" : "poor";
    const recommendations = [];
    if (metrics.calibrationError > 0.1) {
      recommendations.push("Consider adjusting confidence scoring weights");
    }
    if (metrics.verificationOverrideRate > 0.2) {
      recommendations.push("High override rate indicates miscalibration");
    }
    const worstBucket = metrics.calibrationBuckets.filter((b) => b.count > 0).sort((a, b) => b.error - a.error)[0];
    if (worstBucket && worstBucket.error > 0.2) {
      recommendations.push(
        `Focus on improving calibration in ${(worstBucket.rangeStart * 100).toFixed(0)}-${(worstBucket.rangeEnd * 100).toFixed(0)}% confidence range`
      );
    }
    return {
      calibrationQuality,
      calibrationError: metrics.calibrationError,
      brierScore: metrics.brierScore,
      sampleSize: metrics.outcomesRecorded,
      recommendations,
      lastUpdated: /* @__PURE__ */ new Date()
    };
  }
  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------
  async checkCalibrationAlerts(predictionId) {
    const recentMetrics = await this.getRecentMetrics(1);
    if (recentMetrics.calibrationError > this.config.calibrationErrorThreshold) {
      this.emitAlert({
        type: "high_calibration_error",
        message: `Calibration error (${recentMetrics.calibrationError.toFixed(3)}) exceeds threshold`,
        predictionId,
        calibrationError: recentMetrics.calibrationError,
        threshold: this.config.calibrationErrorThreshold
      });
    }
  }
  /**
   * Subscribe to calibration alerts
   */
  onAlert(callback) {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }
  emitAlert(alert) {
    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (err) {
        this.logger.error("Error in calibration alert listener", {
          error: err instanceof Error ? err.message : "Unknown"
        });
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------
  shouldSample() {
    return Math.random() < this.config.sampleRate;
  }
};
function createConfidenceCalibrationTracker(options) {
  return new ConfidenceCalibrationTracker(options ?? {});
}
function createInMemoryConfidencePredictionStore(maxPredictions) {
  return new InMemoryConfidencePredictionStore(maxPredictions);
}

// src/observability/metrics-collector.ts
var InMemoryPlanLifecycleStore = class {
  events = /* @__PURE__ */ new Map();
  maxEventsPerPlan;
  constructor(maxEventsPerPlan = 100) {
    this.maxEventsPerPlan = maxEventsPerPlan;
  }
  async record(event) {
    const planEvents = this.events.get(event.planId) ?? [];
    if (planEvents.length >= this.maxEventsPerPlan) {
      planEvents.shift();
    }
    planEvents.push(event);
    this.events.set(event.planId, planEvents);
  }
  async getByPlanId(planId) {
    return this.events.get(planId) ?? [];
  }
  async getMetrics(periodStart, periodEnd) {
    const allEvents = Array.from(this.events.values()).flat();
    const periodEvents = allEvents.filter(
      (e) => e.timestamp >= periodStart && e.timestamp <= periodEnd
    );
    const planIds = new Set(periodEvents.map((e) => e.planId));
    let totalCreated = 0;
    let completed = 0;
    let abandoned = 0;
    const stepsPerPlan = [];
    const completionTimes = [];
    const stepCompletionByPosition = {};
    const dropoffByStep = {};
    const byStatus = {};
    for (const planId of planIds) {
      const planEvents = periodEvents.filter((e) => e.planId === planId);
      const created = planEvents.find((e) => e.eventType === PlanEventType.CREATED);
      if (created) totalCreated++;
      const completedEvent = planEvents.find(
        (e) => e.eventType === PlanEventType.COMPLETED
      );
      if (completedEvent) {
        completed++;
        if (created) {
          completionTimes.push(
            completedEvent.timestamp.getTime() - created.timestamp.getTime()
          );
        }
      }
      const abandonedEvent = planEvents.find(
        (e) => e.eventType === PlanEventType.ABANDONED
      );
      if (abandonedEvent) abandoned++;
      const stepEvents = planEvents.filter(
        (e) => e.eventType === PlanEventType.STEP_COMPLETED || e.eventType === PlanEventType.STEP_STARTED
      );
      stepsPerPlan.push(stepEvents.length);
      for (const event of stepEvents) {
        if (event.eventType === PlanEventType.STEP_COMPLETED) {
          const position = event.metadata?.stepPosition;
          if (position !== void 0) {
            stepCompletionByPosition[position] = (stepCompletionByPosition[position] ?? 0) + 1;
          }
        }
      }
      const lastEvent = planEvents[planEvents.length - 1];
      if (lastEvent?.newState) {
        byStatus[lastEvent.newState] = (byStatus[lastEvent.newState] ?? 0) + 1;
      }
    }
    const maxStep = Math.max(...Object.keys(stepCompletionByPosition).map(Number), 0);
    for (let i = 1; i <= maxStep; i++) {
      const current = stepCompletionByPosition[i] ?? 0;
      const previous = stepCompletionByPosition[i - 1] ?? totalCreated;
      dropoffByStep[i] = previous - current;
    }
    const activePlansCount = byStatus["in_progress"] ?? 0;
    return {
      activePlansCount,
      totalCreated,
      completionRate: totalCreated > 0 ? completed / totalCreated : 0,
      abandonmentRate: totalCreated > 0 ? abandoned / totalCreated : 0,
      avgStepsPerPlan: stepsPerPlan.length > 0 ? stepsPerPlan.reduce((a, b) => a + b, 0) / stepsPerPlan.length : 0,
      avgCompletionTimeMs: completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0,
      stepCompletionByPosition,
      dropoffByStep,
      byStatus,
      periodStart,
      periodEnd
    };
  }
  clear() {
    this.events.clear();
  }
};
var InMemoryProactiveEventStore = class {
  events = [];
  maxEvents;
  constructor(maxEvents = 1e4) {
    this.maxEvents = maxEvents;
  }
  async record(event) {
    if (this.events.length >= this.maxEvents) {
      this.events.shift();
    }
    this.events.push(event);
  }
  async getByUserId(userId, limit = 100) {
    return this.events.filter((e) => e.userId === userId).slice(-limit);
  }
  async getMetrics(periodStart, periodEnd) {
    const periodEvents = this.events.filter(
      (e) => e.timestamp >= periodStart && e.timestamp <= periodEnd
    );
    const checkInsSent = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.CHECKIN_DELIVERED
    ).length;
    const checkInsResponded = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.CHECKIN_RESPONDED
    ).length;
    const checkInResponseTimes = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.CHECKIN_RESPONDED && e.response
    ).map((e) => e.response.responseTimeMs);
    const interventionsTriggered = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.INTERVENTION_TRIGGERED
    ).length;
    const interventionsAccepted = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.INTERVENTION_ACCEPTED
    ).length;
    const nudgesSent = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.NUDGE_SENT
    ).length;
    const nudgesClicked = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.NUDGE_CLICKED
    ).length;
    const recommendationsShown = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.RECOMMENDATION_SHOWN
    ).length;
    const recommendationsClicked = periodEvents.filter(
      (e) => e.eventType === ProactiveEventType.RECOMMENDATION_CLICKED
    ).length;
    const byChannel = {};
    for (const event of periodEvents) {
      if (event.channel) {
        if (!byChannel[event.channel]) {
          byChannel[event.channel] = {
            sent: 0,
            delivered: 0,
            deliveryRate: 0,
            responseRate: 0
          };
        }
        byChannel[event.channel].sent++;
        if (event.delivered) {
          byChannel[event.channel].delivered++;
        }
      }
    }
    for (const channel of Object.keys(byChannel)) {
      const stats = byChannel[channel];
      stats.deliveryRate = stats.sent > 0 ? stats.delivered / stats.sent : 0;
    }
    return {
      checkInsSent,
      checkInResponseRate: checkInsSent > 0 ? checkInsResponded / checkInsSent : 0,
      avgCheckInResponseTimeMs: checkInResponseTimes.length > 0 ? checkInResponseTimes.reduce((a, b) => a + b, 0) / checkInResponseTimes.length : 0,
      interventionsTriggered,
      interventionAcceptRate: interventionsTriggered > 0 ? interventionsAccepted / interventionsTriggered : 0,
      nudgesSent,
      nudgeClickRate: nudgesSent > 0 ? nudgesClicked / nudgesSent : 0,
      recommendationsShown,
      recommendationClickRate: recommendationsShown > 0 ? recommendationsClicked / recommendationsShown : 0,
      byChannel,
      periodStart,
      periodEnd
    };
  }
  clear() {
    this.events = [];
  }
};
var DEFAULT_METRICS_COLLECTOR_CONFIG = {
  enabled: true,
  defaultPeriodHours: 24,
  healthCheckIntervalMs: 6e4,
  alertsEnabled: true
};
var AgenticMetricsCollector = class {
  config;
  logger;
  // Sub-collectors
  toolTelemetry;
  memoryQualityTracker;
  confidenceCalibration;
  planLifecycleStore;
  proactiveEventStore;
  // Alerts
  alertRules = [];
  activeAlerts = [];
  alertListeners = /* @__PURE__ */ new Set();
  // Health check
  healthCheckInterval;
  lastHealthCheck;
  constructor(options) {
    this.config = { ...DEFAULT_METRICS_COLLECTOR_CONFIG, ...options.config };
    this.logger = options.logger ?? console;
    this.toolTelemetry = options.toolTelemetry ?? new ToolTelemetry({ logger: this.logger });
    this.memoryQualityTracker = options.memoryQualityTracker ?? new MemoryQualityTracker({ logger: this.logger });
    this.confidenceCalibration = options.confidenceCalibration ?? new ConfidenceCalibrationTracker({ logger: this.logger });
    this.planLifecycleStore = options.planLifecycleStore ?? new InMemoryPlanLifecycleStore();
    this.proactiveEventStore = options.proactiveEventStore ?? new InMemoryProactiveEventStore();
  }
  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  start() {
    if (this.healthCheckInterval) return;
    this.healthCheckInterval = setInterval(() => {
      this.runHealthCheck().catch((err) => {
        this.logger.error("Health check failed", {
          error: err instanceof Error ? err.message : "Unknown"
        });
      });
    }, this.config.healthCheckIntervalMs);
    this.logger.info("Agentic metrics collector started");
  }
  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = void 0;
    }
    this.logger.info("Agentic metrics collector stopped");
  }
  // ---------------------------------------------------------------------------
  // Sub-Collector Access
  // ---------------------------------------------------------------------------
  getToolTelemetry() {
    return this.toolTelemetry;
  }
  getMemoryQualityTracker() {
    return this.memoryQualityTracker;
  }
  getConfidenceCalibration() {
    return this.confidenceCalibration;
  }
  getPlanLifecycleStore() {
    return this.planLifecycleStore;
  }
  getProactiveEventStore() {
    return this.proactiveEventStore;
  }
  // ---------------------------------------------------------------------------
  // Unified Metrics
  // ---------------------------------------------------------------------------
  /**
   * Get complete agentic metrics snapshot
   */
  async getMetrics(periodStart, periodEnd) {
    const end = periodEnd ?? /* @__PURE__ */ new Date();
    const start = periodStart ?? new Date(end.getTime() - this.config.defaultPeriodHours * 60 * 60 * 1e3);
    const [tools, memory, confidence, plans, proactive] = await Promise.all([
      this.toolTelemetry.getMetrics(start, end),
      this.memoryQualityTracker.getMetrics(start, end),
      this.confidenceCalibration.getCalibrationMetrics(start, end),
      this.planLifecycleStore.getMetrics(start, end),
      this.proactiveEventStore.getMetrics(start, end)
    ]);
    const system = await this.getSystemHealth();
    return {
      tools,
      memory,
      confidence,
      plans,
      proactive,
      system,
      generatedAt: /* @__PURE__ */ new Date(),
      periodStart: start,
      periodEnd: end
    };
  }
  /**
   * Get quick summary metrics for dashboard
   */
  async getQuickSummary() {
    const now = /* @__PURE__ */ new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
    const [tools, memory, confidence] = await Promise.all([
      this.toolTelemetry.getMetrics(hourAgo, now),
      this.memoryQualityTracker.getMetrics(hourAgo, now),
      this.confidenceCalibration.getCalibrationMetrics(hourAgo, now)
    ]);
    return {
      toolSuccessRate: tools.successRate,
      avgToolLatencyMs: tools.avgLatencyMs,
      memoryRelevanceScore: memory.avgRelevanceScore,
      memoryCacheHitRate: memory.cacheHitRate,
      confidenceCalibrationError: confidence.calibrationError,
      activeToolExecutions: this.toolTelemetry.getActiveExecutionCount(),
      healthScore: this.lastHealthCheck?.healthScore ?? 1,
      activeAlerts: this.activeAlerts.length,
      timestamp: now
    };
  }
  // ---------------------------------------------------------------------------
  // System Health
  // ---------------------------------------------------------------------------
  async runHealthCheck() {
    const health = await this.getSystemHealth();
    this.lastHealthCheck = health;
    if (this.config.alertsEnabled) {
      await this.evaluateAlerts(health);
    }
  }
  async getSystemHealth() {
    const components = {};
    components["tool_telemetry"] = {
      name: "Tool Telemetry",
      status: HealthStatus.HEALTHY,
      lastCheckAt: /* @__PURE__ */ new Date()
    };
    const recentMemory = await this.memoryQualityTracker.getRecentMetrics(5);
    components["memory_quality"] = {
      name: "Memory Quality",
      status: recentMemory.avgRelevanceScore > 0.5 ? HealthStatus.HEALTHY : recentMemory.avgRelevanceScore > 0.3 ? HealthStatus.DEGRADED : HealthStatus.UNHEALTHY,
      lastCheckAt: /* @__PURE__ */ new Date(),
      latencyMs: recentMemory.avgLatencyMs
    };
    const calibration = await this.confidenceCalibration.getRecentMetrics(1);
    components["confidence_calibration"] = {
      name: "Confidence Calibration",
      status: calibration.calibrationError < 0.1 ? HealthStatus.HEALTHY : calibration.calibrationError < 0.2 ? HealthStatus.DEGRADED : HealthStatus.UNHEALTHY,
      lastCheckAt: /* @__PURE__ */ new Date()
    };
    const healthScores = Object.values(components).map(
      (c) => c.status === HealthStatus.HEALTHY ? 1 : c.status === HealthStatus.DEGRADED ? 0.5 : 0
    );
    const healthScore = healthScores.length > 0 ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length : 1;
    return {
      healthScore,
      components,
      activeConnections: 0,
      // Would be populated by realtime module
      memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024,
      queueDepths: {},
      errorRate: 0,
      latencyP50Ms: recentMemory.avgLatencyMs,
      latencyP95Ms: recentMemory.p95LatencyMs,
      latencyP99Ms: 0
    };
  }
  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------
  /**
   * Add an alert rule
   */
  addAlertRule(rule) {
    this.alertRules.push(rule);
  }
  /**
   * Remove an alert rule
   */
  removeAlertRule(ruleId) {
    this.alertRules = this.alertRules.filter((r) => r.id !== ruleId);
  }
  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return [...this.activeAlerts];
  }
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.activeAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledgedAt = /* @__PURE__ */ new Date();
    }
  }
  /**
   * Subscribe to alerts
   */
  onAlert(callback) {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }
  async evaluateAlerts(health) {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;
      const value = this.getMetricValue(rule.metric, health);
      if (value === null) continue;
      const triggered = this.evaluateCondition(value, rule.operator, rule.threshold);
      if (triggered) {
        const existingAlert = this.activeAlerts.find((a) => a.ruleId === rule.id);
        if (!existingAlert) {
          const alert = {
            id: v4_default(),
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: `${rule.name}: ${value} ${rule.operator} ${rule.threshold}`,
            currentValue: value,
            threshold: rule.threshold,
            triggeredAt: /* @__PURE__ */ new Date()
          };
          this.activeAlerts.push(alert);
          this.emitAlert(alert);
        }
      } else {
        const alertIndex = this.activeAlerts.findIndex((a) => a.ruleId === rule.id);
        if (alertIndex >= 0) {
          this.activeAlerts[alertIndex].resolvedAt = /* @__PURE__ */ new Date();
          this.activeAlerts.splice(alertIndex, 1);
        }
      }
    }
  }
  getMetricValue(metric, health) {
    switch (metric) {
      case "healthScore":
        return health.healthScore;
      case "errorRate":
        return health.errorRate;
      case "latencyP95":
        return health.latencyP95Ms;
      case "latencyP99":
        return health.latencyP99Ms;
      case "memoryUsage":
        return health.memoryUsageMb;
      default:
        return null;
    }
  }
  evaluateCondition(value, operator, threshold) {
    switch (operator) {
      case "gt":
        return value > threshold;
      case "lt":
        return value < threshold;
      case "eq":
        return value === threshold;
      case "gte":
        return value >= threshold;
      case "lte":
        return value <= threshold;
      default:
        return false;
    }
  }
  emitAlert(alert) {
    this.logger.warn("Alert triggered", {
      alertId: alert.id,
      ruleName: alert.ruleName,
      severity: alert.severity,
      message: alert.message
    });
    for (const listener of this.alertListeners) {
      try {
        listener(alert);
      } catch (err) {
        this.logger.error("Error in alert listener", {
          error: err instanceof Error ? err.message : "Unknown"
        });
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Plan Lifecycle Recording
  // ---------------------------------------------------------------------------
  async recordPlanEvent(event) {
    const fullEvent = {
      ...event,
      eventId: v4_default(),
      timestamp: /* @__PURE__ */ new Date()
    };
    await this.planLifecycleStore.record(fullEvent);
    this.logger.debug("Plan lifecycle event recorded", {
      planId: event.planId,
      eventType: event.eventType
    });
  }
  // ---------------------------------------------------------------------------
  // Proactive Event Recording
  // ---------------------------------------------------------------------------
  async recordProactiveEvent(event) {
    const fullEvent = {
      ...event,
      eventId: v4_default(),
      timestamp: /* @__PURE__ */ new Date()
    };
    await this.proactiveEventStore.record(fullEvent);
    this.logger.debug("Proactive event recorded", {
      userId: event.userId,
      eventType: event.eventType
    });
  }
};
function createAgenticMetricsCollector(options) {
  return new AgenticMetricsCollector(options ?? {});
}
function createInMemoryPlanLifecycleStore(maxEventsPerPlan) {
  return new InMemoryPlanLifecycleStore(maxEventsPerPlan);
}
function createInMemoryProactiveEventStore(maxEvents) {
  return new InMemoryProactiveEventStore(maxEvents);
}

// src/observability/exporters/railway-exporter.ts
var RailwayMetricsExporter = class _RailwayMetricsExporter {
  config;
  buffer = [];
  flushTimer = null;
  constructor(config = {}) {
    this.config = {
      serviceName: config.serviceName || "sam-ai",
      environment: config.environment || process.env.RAILWAY_ENVIRONMENT || "development",
      debug: config.debug ?? false,
      logger: config.logger || console,
      samplingRate: config.samplingRate ?? 1,
      batchSize: config.batchSize ?? 100,
      flushIntervalMs: config.flushIntervalMs ?? 5e3
    };
    this.startFlushTimer();
  }
  // ============================================================================
  // METRIC EXPORT METHODS
  // ============================================================================
  /**
   * Export a generic metric
   */
  exportMetric(name, value, labels, metadata) {
    if (!this.shouldSample()) return;
    const log = {
      type: "metric",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment,
      name,
      value,
      labels,
      metadata
    };
    this.bufferLog(log);
  }
  /**
   * Export tool execution telemetry
   */
  exportToolExecution(event) {
    if (!this.shouldSample()) return;
    const log = {
      type: "event",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment,
      category: "tool_execution",
      action: event.toolName,
      status: event.status,
      durationMs: event.durationMs,
      userId: event.userId,
      sessionId: event.sessionId,
      metadata: {
        toolId: event.toolId,
        executionId: event.executionId,
        confirmationRequired: event.confirmationRequired,
        confirmationGiven: event.confirmationGiven,
        planId: event.planId,
        stepId: event.stepId,
        hasError: !!event.error,
        errorCode: event.error?.code
      }
    };
    this.bufferLog(log);
    this.exportMetric(
      "sam.tool.execution",
      1,
      {
        tool: event.toolName,
        status: event.status,
        confirmation_required: String(event.confirmationRequired)
      }
    );
    if (event.durationMs) {
      this.exportMetric(
        "sam.tool.latency_ms",
        event.durationMs,
        { tool: event.toolName, status: event.status }
      );
    }
  }
  /**
   * Export memory retrieval telemetry
   */
  exportMemoryRetrieval(event) {
    if (!this.shouldSample()) return;
    const log = {
      type: "event",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment,
      category: "memory_retrieval",
      action: event.source,
      durationMs: event.latencyMs,
      userId: event.userId,
      sessionId: event.sessionId,
      metadata: {
        retrievalId: event.retrievalId,
        query: event.query.substring(0, 100),
        // Truncate for logging
        resultCount: event.resultCount,
        topRelevanceScore: event.topRelevanceScore,
        avgRelevanceScore: event.avgRelevanceScore,
        cacheHit: event.cacheHit
      }
    };
    this.bufferLog(log);
    this.exportMetric(
      "sam.memory.retrieval",
      1,
      { source: event.source, cache_hit: String(event.cacheHit) }
    );
    this.exportMetric(
      "sam.memory.latency_ms",
      event.latencyMs,
      { source: event.source }
    );
    this.exportMetric(
      "sam.memory.relevance_score",
      event.avgRelevanceScore,
      { source: event.source }
    );
  }
  /**
   * Export confidence prediction telemetry
   */
  exportConfidencePrediction(prediction) {
    if (!this.shouldSample()) return;
    const log = {
      type: "event",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment,
      category: "confidence_prediction",
      action: prediction.responseType,
      userId: prediction.userId,
      sessionId: prediction.sessionId,
      metadata: {
        predictionId: prediction.predictionId,
        responseId: prediction.responseId,
        predictedConfidence: prediction.predictedConfidence,
        factorCount: prediction.factors.length,
        hasOutcome: !!prediction.actualOutcome,
        accurate: prediction.actualOutcome?.accurate
      }
    };
    this.bufferLog(log);
    this.exportMetric(
      "sam.confidence.prediction",
      prediction.predictedConfidence,
      { response_type: prediction.responseType }
    );
    if (prediction.actualOutcome) {
      this.exportMetric(
        "sam.confidence.accuracy",
        prediction.actualOutcome.accurate ? 1 : 0,
        { response_type: prediction.responseType }
      );
    }
  }
  /**
   * Export plan lifecycle event
   */
  exportPlanLifecycleEvent(event) {
    if (!this.shouldSample()) return;
    const log = {
      type: "event",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment,
      category: "plan_lifecycle",
      action: event.eventType,
      userId: event.userId,
      metadata: {
        eventId: event.eventId,
        planId: event.planId,
        stepId: event.stepId,
        previousState: event.previousState,
        newState: event.newState
      }
    };
    this.bufferLog(log);
    this.exportMetric(
      "sam.plan.event",
      1,
      { event_type: event.eventType }
    );
  }
  // ============================================================================
  // BUFFER MANAGEMENT
  // ============================================================================
  bufferLog(log) {
    this.buffer.push(log);
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }
  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.config.flushIntervalMs);
  }
  /**
   * Flush buffered logs to stdout
   */
  flush() {
    if (this.buffer.length === 0) return;
    const logs = this.buffer.splice(0, this.buffer.length);
    logs.forEach((log) => {
      this.config.logger.log(JSON.stringify(log));
    });
    if (this.config.debug) {
      this.config.logger.info(`[RailwayExporter] Flushed ${logs.length} logs`);
    }
  }
  /**
   * Stop the exporter and flush remaining logs
   */
  shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  shouldSample() {
    return Math.random() < this.config.samplingRate;
  }
  /**
   * Create a child exporter with additional labels
   */
  withLabels(labels) {
    const childConfig = {
      ...this.config,
      serviceName: labels.service || this.config.serviceName
    };
    return new _RailwayMetricsExporter(childConfig);
  }
};
var defaultExporter = null;
function getRailwayExporter(config) {
  if (!defaultExporter) {
    defaultExporter = new RailwayMetricsExporter(config);
  }
  return defaultExporter;
}
function createRailwayExporter(config) {
  return new RailwayMetricsExporter(config);
}
function logMetric(name, value, labels) {
  getRailwayExporter().exportMetric(name, value, labels);
}
function logToolExecution(event) {
  getRailwayExporter().exportToolExecution(event);
}
function logMemoryRetrieval(event) {
  getRailwayExporter().exportMemoryRetrieval(event);
}
function logConfidencePrediction(prediction) {
  getRailwayExporter().exportConfidencePrediction(prediction);
}
function logPlanLifecycleEvent(event) {
  getRailwayExporter().exportPlanLifecycleEvent(event);
}

// src/index.ts
var PACKAGE_NAME = "@sam-ai/agentic";
var PACKAGE_VERSION = "0.1.0";
var CAPABILITIES = {
  GOAL_PLANNING: "goal-planning",
  TOOL_REGISTRY: "tool-registry",
  MENTOR_TOOLS: "mentor-tools",
  MEMORY_SYSTEM: "memory-system",
  PROACTIVE_INTERVENTIONS: "proactive-interventions",
  SELF_EVALUATION: "self-evaluation",
  LEARNING_ANALYTICS: "learning-analytics",
  LEARNING_PATH: "learning-path",
  ORCHESTRATION: "orchestration",
  OBSERVABILITY: "observability"
};
function hasCapability(capability) {
  switch (capability) {
    case CAPABILITIES.GOAL_PLANNING:
      return true;
    case CAPABILITIES.TOOL_REGISTRY:
      return true;
    case CAPABILITIES.MENTOR_TOOLS:
      return true;
    case CAPABILITIES.MEMORY_SYSTEM:
      return true;
    case CAPABILITIES.PROACTIVE_INTERVENTIONS:
      return true;
    // Phase D implemented
    case CAPABILITIES.SELF_EVALUATION:
      return true;
    // Phase E implemented
    case CAPABILITIES.LEARNING_ANALYTICS:
      return true;
    // Phase F implemented
    case CAPABILITIES.LEARNING_PATH:
      return true;
    // Phase G - Knowledge Graph Integration
    case CAPABILITIES.ORCHESTRATION:
      return true;
    // Phase 2 - Plan-Driven Tutoring
    case CAPABILITIES.OBSERVABILITY:
      return true;
    // Phase 5 - Observability & Operations
    default:
      return false;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActionType,
  ActiveStepExecutor,
  ActivityStatus,
  ActivityType,
  AdjustmentTrigger,
  AgentStateMachine,
  AgenticMetricsCollector,
  AlertSeverity,
  AnomalyType,
  AssessmentSource,
  AuditLogLevel,
  AuditLogger,
  BackgroundWorker,
  BaseJobSchema,
  BehaviorEventSchema,
  BehaviorEventType,
  BehaviorMonitor,
  BrowserPushChannel,
  CAPABILITIES,
  CelebrationType,
  ChangeType,
  CheckInResponseSchema,
  CheckInScheduler,
  CheckInStatus,
  CheckInType,
  ClientWebSocketManager,
  ComplexityLevel,
  ConfidenceCalibrationTracker,
  ConfidenceFactorType,
  ConfidenceInputSchema,
  ConfidenceLevel,
  ConfidenceScorer,
  ConfirmationGate,
  ConfirmationManager,
  ConfirmationType,
  ConfirmationTypeSchema,
  ConnectionConfigSchema,
  ConnectionState,
  ContentChangeEventSchema,
  ContentEntityType,
  ContentGenerationRequestSchema,
  ContentRecommendationRequestSchema,
  ContentType,
  ContextAction,
  CreateGoalInputSchema,
  CrossSessionContext,
  DEFAULT_CALIBRATION_CONFIG,
  DEFAULT_CONNECTION_CONFIG,
  DEFAULT_DISPLAY_CONFIGS,
  DEFAULT_MEMORY_QUALITY_CONFIG,
  DEFAULT_METRICS_COLLECTOR_CONFIG,
  DEFAULT_NORMALIZER_CONFIG,
  DEFAULT_PRESENCE_CONFIG,
  DEFAULT_PUSH_DISPATCHER_CONFIG,
  DEFAULT_QUEUE_CONFIG,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_SURFACE_MANAGER_CONFIG,
  DEFAULT_TOOL_TELEMETRY_CONFIG,
  DEFAULT_WORKER_CONFIG,
  DecompositionOptionsSchema,
  DeliveryChannel,
  DeliveryPriority,
  EmailChannel,
  EmbeddingSourceType,
  EmotionalSignalType,
  EmotionalState,
  EntityType,
  FactCheckStatus,
  GoalContextSchema,
  GoalDecomposer,
  GoalPriority,
  GoalPrioritySchema,
  GoalStatus,
  GoalStatusSchema,
  GraphQueryOptionsSchema,
  HealthStatus,
  InMemoryAuditStore,
  InMemoryBehaviorEventStore,
  InMemoryCalibrationStore,
  InMemoryCheckInStore,
  InMemoryConfidencePredictionStore,
  InMemoryConfidenceScoreStore,
  InMemoryConfirmationStore,
  InMemoryContentStore,
  InMemoryContextStore,
  InMemoryGraphStore,
  InMemoryInterventionStore,
  InMemoryInvocationStore,
  InMemoryJobQueue,
  InMemoryLearningGapStore,
  InMemoryLearningPlanStore,
  InMemoryLearningSessionStore,
  InMemoryMemoryRetrievalStore,
  InMemoryOrchestrationConfirmationStore,
  InMemoryPatternStore,
  InMemoryPermissionStore,
  InMemoryPlanLifecycleStore,
  InMemoryPresenceStore,
  InMemoryProactiveEventStore,
  InMemoryPushQueueStore,
  InMemoryQualityRecordStore,
  InMemoryRecommendationStore,
  InMemoryReindexJobStore,
  InMemorySkillAssessmentStore,
  InMemoryTimelineStore,
  InMemoryToolExecutionStore,
  InMemoryToolStore,
  InMemoryTopicProgressStore,
  InMemoryTutoringSessionStore,
  InMemoryVectorAdapter,
  InMemoryVerificationResultStore,
  InterventionSurface,
  InterventionSurfaceManagerImpl,
  InterventionType,
  InvokeToolInputSchema,
  IssueSeverity,
  IssueType,
  JobEvent,
  JobQueueConfigSchema,
  JobStatus,
  JobType,
  JourneyEventType,
  JourneyTimelineManager,
  KGRefreshJobStatus,
  KGRefreshJobType,
  KGRefreshScheduler,
  KnowledgeGraphManager,
  LearningPathRecommender,
  LearningPhase,
  LearningPlanInputSchema,
  LearningPlanStatus,
  LearningSessionInputSchema,
  LearningStyle,
  MEMORY_CAPABILITIES,
  MasteryLevel,
  MasteryLevelSchema,
  MemoryItemType,
  MemoryLifecycleConfigSchema,
  MemoryLifecycleManager,
  MemoryNormalizer,
  MemoryNormalizerConfigSchema,
  MemoryQualityTracker,
  MemoryRetriever,
  MemorySegmentType,
  MemorySourceType,
  MemoryType,
  MetricSource,
  MilestoneStatus,
  MilestoneType,
  MockEmbeddingProvider,
  MultiSessionPlanTracker,
  NormalizationRetrievalStrategy,
  NormalizedMemoryContextSchema,
  NotificationChannel,
  NotificationRequestSchema,
  NudgeType,
  PACKAGE_NAME,
  PACKAGE_VERSION,
  PatternType,
  PermissionLevel,
  PermissionLevelSchema,
  PermissionManager,
  PlanBuilder,
  PlanContextInjector,
  PlanEventType,
  PlanStatus,
  PlanStatusSchema,
  PresenceChangeReason,
  PresenceStatus,
  PresenceTracker,
  ProactiveEventType,
  ProactivePlanStatus,
  ProactivePushDispatcher,
  ProgressAnalyzer,
  ProgressReportRequestSchema,
  ProgressUpdateSchema,
  PushDeliveryRequestSchema,
  QualityMetricType,
  QualityTracker,
  QuestionType,
  RailwayMetricsExporter,
  RateLimitSchema,
  RecommendationEngine,
  RecommendationFeedbackSchema,
  RecommendationPriority,
  RecommendationReason,
  RegisterToolInputSchema,
  ReindexJobStatus,
  ReindexJobType,
  ReindexPriority,
  RelationshipType,
  ReminderRequestSchema,
  ResponseType,
  ResponseVerifier,
  RetrievalQuerySchema,
  RetrievalStrategy,
  SAMEventType,
  SAMWebSocketEventSchema,
  ServerConnectionManager,
  SkillAssessmentInputSchema,
  SkillAssessor,
  SkillTracker,
  SourceType,
  StepExecutor,
  StepStatus,
  StepStatusSchema,
  StepType,
  StudentFeedbackSchema,
  StudySessionRequestSchema,
  SubGoalType,
  SubGoalTypeSchema,
  TelemetryMemorySource,
  TelemetryResponseType,
  TelemetryToolExecutionStatus,
  TimePeriod,
  ToolCategory,
  ToolCategorySchema,
  ToolExampleSchema,
  ToolExecutionStatus,
  ToolExecutionStatusSchema,
  ToolExecutor,
  ToolRegistry,
  ToolTelemetry,
  TrendDirection,
  TriggerEvaluator,
  TriggerType,
  TutoringLoopController,
  UpdateGoalInputSchema,
  UserRole,
  VectorSearchOptionsSchema,
  VectorStore,
  VerificationInputSchema,
  VerificationMethod,
  VerificationStatus,
  WorkerConfigSchema,
  WorkerStatus,
  cosineSimilarity,
  createActiveStepExecutor,
  createAgentStateMachine,
  createAgenticMetricsCollector,
  createAuditLogger,
  createBackgroundWorker,
  createBehaviorMonitor,
  createBrowserPushChannel,
  createCheckInScheduler,
  createClientWebSocketManager,
  createConfidenceCalibrationTracker,
  createConfidenceScorer,
  createConfirmationGate,
  createConfirmationManager,
  createContentTools,
  createCrossSessionContext,
  createEmailChannel,
  createGoalDecomposer,
  createInMemoryConfidencePredictionStore,
  createInMemoryMemoryRetrievalStore,
  createInMemoryOrchestrationConfirmationStore,
  createInMemoryOrchestrationStores,
  createInMemoryPlanLifecycleStore,
  createInMemoryPresenceStore,
  createInMemoryProactiveEventStore,
  createInMemoryPushQueueStore,
  createInMemorySessionStore,
  createInMemoryStores,
  createInMemoryToolExecutionStore,
  createInterventionSurfaceManager,
  createJobQueue,
  createJourneyTimeline,
  createKGRefreshScheduler,
  createKnowledgeGraphManager,
  createMemoryLifecycleManager,
  createMemoryNormalizer,
  createMemoryQualityTracker,
  createMemoryRetriever,
  createMemorySystem,
  createMentorTools,
  createMultiSessionPlanTracker,
  createNotificationTools,
  createPathRecommender,
  createPermissionManager,
  createPlanBuilder,
  createPlanContextInjector,
  createPresenceTracker,
  createPrismaAuditStore,
  createPrismaConfirmationStore,
  createPrismaInvocationStore,
  createPrismaPermissionStore,
  createPrismaToolStore,
  createProgressAnalyzer,
  createPushDispatcher,
  createQualityTracker,
  createRailwayExporter,
  createRecommendationEngine,
  createResponseVerifier,
  createSchedulingTools,
  createServerConnectionManager,
  createSkillAssessor,
  createSkillTracker,
  createStepExecutor,
  createStepExecutorFunction,
  createToolExecutor,
  createToolRegistry,
  createToolTelemetry,
  createTutoringLoopController,
  createVectorStore,
  euclideanDistance,
  getMentorToolById,
  getMentorToolsByCategory,
  getMentorToolsByTags,
  getRailwayExporter,
  hasCapability,
  logConfidencePrediction,
  logMemoryRetrieval,
  logMetric,
  logPlanLifecycleEvent,
  logToolExecution
});
