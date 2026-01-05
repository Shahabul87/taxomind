/**
 * SAM AI Agentic Bridge
 * Integrates @sam-ai/agentic package with SAM AI Mentor
 *
 * This bridge provides a unified interface to access all agentic capabilities:
 * - Goal Planning: Autonomous goal tracking and decomposition
 * - Tool Registry: Permissioned action execution
 * - Proactive Interventions: Context-aware mentor triggers
 * - Self-Evaluation: Confidence scoring and verification
 * - Learning Analytics: Progress analysis and recommendations
 *
 * Integration Profile Support:
 * The bridge now supports an optional IntegrationProfile for portability.
 * When provided, the profile's feature flags and capabilities will be used
 * to determine which features are enabled and available.
 */

import {
  // Goal Planning
  GoalDecomposer,
  PlanBuilder,
  AgentStateMachine,
  createGoalDecomposer,
  createPlanBuilder,
  createAgentStateMachine,
  type LearningGoal,
  type GoalDecomposition,
  type ExecutionPlan,
  type GoalDecomposerConfig,
  type PlanBuilderConfig,
  type AgentStateMachineConfig,
  type GoalStore,
  type CreateGoalInput,
  GoalStatus,
  PlanStatus,

  // Tool Registry
  ToolRegistry,
  ToolExecutor,
  createToolRegistry,
  createToolExecutor,
  type ToolDefinition,
  type ToolExecutionResult,
  type ToolRegistryConfig,
  type ToolExecutorConfig,
  type ExecuteOptions,
  type ExecutionOutcome,

  // Proactive Interventions
  MultiSessionPlanTracker,
  CheckInScheduler,
  BehaviorMonitor,
  createMultiSessionPlanTracker,
  createCheckInScheduler,
  createBehaviorMonitor,
  type LearningPlan,
  type TriggeredCheckIn,
  type Intervention,
  type BehaviorMonitorConfig,
  type CheckInSchedulerConfig,
  NotificationChannel,

  // Self-Evaluation
  ConfidenceScorer,
  ResponseVerifier,
  QualityTracker,
  createConfidenceScorer,
  createResponseVerifier,
  createQualityTracker,
  type ConfidenceScore,
  type VerificationResult,
  ConfidenceLevel,
  ComplexityLevel,

  // Learning Analytics
  ProgressAnalyzer,
  SkillAssessor,
  RecommendationEngine,
  createProgressAnalyzer,
  createSkillAssessor,
  createRecommendationEngine,
  type ProgressReport,
  type SkillAssessment,
  type RecommendationBatch,
  type SkillMap,
  MasteryLevel,
  AssessmentSource,
  TimePeriod,

  // Package Info
  CAPABILITIES,
  hasCapability,
} from '@sam-ai/agentic';

// Import AI Adapter from @sam-ai/core for GoalDecomposer
import { AnthropicAdapter, type AIAdapter } from '@sam-ai/core';

// Import Prisma stores for persistent proactive feature storage
import {
  createPrismaBehaviorEventStore,
  createPrismaPatternStore,
  createPrismaInterventionStore,
  createPrismaCheckInStore,
  createPrismaGoalStore,
  createPrismaPlanStore,
  createPrismaLearningPlanStore,
} from './stores';
import {
  createPrismaLearningSessionStore,
  createPrismaTopicProgressStore,
  createPrismaLearningGapStore,
  createPrismaSkillAssessmentStore,
  createPrismaRecommendationStore,
  createPrismaContentStore,
} from './stores';
import { ensureToolingInitialized } from './agentic-tooling';

// Import Integration Profile types (optional for backward compatibility)
import {
  createCapabilityRegistry,
  type IntegrationProfile,
  type CapabilityRegistry,
} from '@sam-ai/integration';

// ============================================================================
// TYPES
// ============================================================================

/**
 * SAM Agentic Bridge Configuration
 */
export interface SAMAgenticBridgeConfig {
  userId: string;
  courseId?: string;
  enableGoalPlanning?: boolean;
  enableToolExecution?: boolean;
  enableProactiveInterventions?: boolean;
  enableSelfEvaluation?: boolean;
  enableLearningAnalytics?: boolean;
  logger?: AgenticLogger;
  /**
   * Use Prisma stores for persistent storage instead of in-memory stores.
   * When true, proactive features (behavior monitoring, check-ins, interventions)
   * and goal planning data will be persisted to the database.
   * @default true
   */
  usePrismaStores?: boolean;
  /**
   * Optional Integration Profile for portability.
   * When provided, the profile's feature flags will be used to determine
   * which capabilities are enabled. This enables SAM to adapt to different
   * host environments and configurations.
   */
  integrationProfile?: IntegrationProfile;
  /**
   * Optional Capability Registry for runtime capability queries.
   * If not provided but integrationProfile is set, a registry will be created
   * automatically from the profile.
   */
  capabilityRegistry?: CapabilityRegistry;
}

/**
 * Logger interface for agentic bridge
 */
export interface AgenticLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * User context for agentic operations
 */
export interface AgenticUserContext {
  userId: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  currentTopic?: string;
  learningStyle?: string;
  masteryLevel?: MasteryLevel;
  sessionStartTime?: Date;
}

/**
 * Result from agentic analysis
 */
export interface AgenticAnalysisResult {
  confidence: ConfidenceScore;
  verification?: VerificationResult;
  recommendations?: RecommendationBatch;
  interventions?: Intervention[];
  progress?: ProgressReport;
}

// ============================================================================
// DEFAULT LOGGER
// ============================================================================

const defaultLogger: AgenticLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// SAM AGENTIC BRIDGE
// ============================================================================

/**
 * SAM Agentic Bridge
 * Unified interface for all agentic capabilities
 */
export class SAMAgenticBridge {
  private userId: string;
  private courseId?: string;
  private logger: AgenticLogger;
  private usePrismaStores: boolean;

  // Integration Profile (for portability)
  private integrationProfile?: IntegrationProfile;
  private _capabilityRegistry?: CapabilityRegistry;

  // Components
  private goalStore?: GoalStore;
  private aiAdapter?: AIAdapter;
  private goalDecomposer?: GoalDecomposer;
  private planBuilder?: PlanBuilder;
  private stateMachine?: AgentStateMachine;
  private toolRegistry?: ToolRegistry;
  private toolExecutor?: ToolExecutor;
  private planTracker?: MultiSessionPlanTracker;
  private checkInScheduler?: CheckInScheduler;
  private behaviorMonitor?: BehaviorMonitor;
  private confidenceScorer?: ConfidenceScorer;
  private responseVerifier?: ResponseVerifier;
  private qualityTracker?: QualityTracker;
  private progressAnalyzer?: ProgressAnalyzer;
  private skillAssessor?: SkillAssessor;
  private recommendationEngine?: RecommendationEngine;

  constructor(config: SAMAgenticBridgeConfig) {
    this.userId = config.userId;
    this.courseId = config.courseId;
    this.logger = config.logger ?? defaultLogger;
    this.usePrismaStores = config.usePrismaStores !== false; // Default to true

    // Store Integration Profile for portability
    this.integrationProfile = config.integrationProfile;
    this._capabilityRegistry = config.capabilityRegistry;
    if (this.integrationProfile && !this._capabilityRegistry) {
      this._capabilityRegistry = createCapabilityRegistry(this.integrationProfile);
    }

    // Determine enabled features based on profile or config
    // If integration profile is provided, use its feature flags
    // Otherwise, fall back to config options
    const features = this.integrationProfile?.features;

    const enableGoalPlanning = features
      ? features.goalPlanning
      : config.enableGoalPlanning !== false;

    const enableToolExecution = features
      ? features.toolExecution
      : config.enableToolExecution !== false;

    const enableProactiveInterventions = features
      ? features.proactiveInterventions
      : config.enableProactiveInterventions !== false;

    const enableSelfEvaluation = features
      ? features.selfEvaluation
      : config.enableSelfEvaluation !== false;

    const enableLearningAnalytics = features
      ? features.learningAnalytics
      : config.enableLearningAnalytics !== false;

    // Initialize enabled components
    if (enableGoalPlanning) {
      this.initGoalPlanning();
    }

    if (enableToolExecution) {
      this.initToolExecution();
    }

    if (enableProactiveInterventions) {
      this.initProactiveInterventions();
    }

    if (enableSelfEvaluation) {
      this.initSelfEvaluation();
    }

    if (enableLearningAnalytics) {
      this.initLearningAnalytics();
    }

    this.logger.info('SAM Agentic Bridge initialized', {
      userId: this.userId,
      hasIntegrationProfile: !!this.integrationProfile,
      profileId: this.integrationProfile?.id,
      capabilities: this.getEnabledCapabilities(),
    });
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initGoalPlanning(): void {
    const samLogger = this.createSamLogger();

    // Initialize GoalStore for persistence
    if (this.usePrismaStores) {
      this.goalStore = createPrismaGoalStore();
    }

    // Initialize AIAdapter for GoalDecomposer
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        this.aiAdapter = new AnthropicAdapter({
          apiKey,
          model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
        });

        // Initialize GoalDecomposer with AIAdapter
        this.goalDecomposer = createGoalDecomposer({
          aiAdapter: this.aiAdapter,
          logger: samLogger,
        });

        this.logger.debug('GoalDecomposer initialized with AIAdapter');
      } catch (error) {
        this.logger.warn('Failed to initialize AIAdapter for GoalDecomposer', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set - GoalDecomposer will not be available');
    }

    // Initialize PlanBuilder and StateMachine
    if (this.usePrismaStores) {
      const planStore = createPrismaPlanStore();
      this.planBuilder = createPlanBuilder({ logger: samLogger });
      this.stateMachine = createAgentStateMachine({ planStore, logger: samLogger });
    } else {
      this.planBuilder = createPlanBuilder({ logger: samLogger });
    }

    this.logger.debug('Goal Planning initialized', {
      usePrismaStores: this.usePrismaStores,
      hasAIAdapter: !!this.aiAdapter,
      hasGoalDecomposer: !!this.goalDecomposer,
      hasGoalStore: !!this.goalStore,
    });
  }

  private initToolExecution(): void {
    void this.initializeTooling();
  }

  private async initializeTooling(): Promise<void> {
    try {
      const tooling = await ensureToolingInitialized();
      this.toolRegistry = tooling.toolRegistry;
      this.toolExecutor = tooling.toolExecutor;
      this.logger.debug('Tool Execution initialized');
    } catch (error) {
      this.logger.warn('Failed to initialize tool execution', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private initProactiveInterventions(): void {
    const proactiveLogger = this.logger;
    let behaviorConfig: BehaviorMonitorConfig = { logger: proactiveLogger };
    let checkInConfig: CheckInSchedulerConfig = { logger: proactiveLogger, defaultChannel: NotificationChannel.IN_APP };

    if (this.usePrismaStores) {
      try {
        const eventStore = createPrismaBehaviorEventStore();
        const patternStore = createPrismaPatternStore();
        const interventionStore = createPrismaInterventionStore();
        const checkInStore = createPrismaCheckInStore();

        behaviorConfig = {
          eventStore,
          patternStore,
          interventionStore,
          logger: proactiveLogger,
        };
        checkInConfig = {
          store: checkInStore,
          logger: proactiveLogger,
          defaultChannel: NotificationChannel.IN_APP,
        };
      } catch (error) {
        this.logger.warn('Failed to initialize Prisma proactive stores, falling back to in-memory', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Use Prisma LearningPlanStore for persistent multi-session plan tracking
    const learningPlanStore = this.usePrismaStores ? createPrismaLearningPlanStore() : undefined;
    this.planTracker = createMultiSessionPlanTracker({
      store: learningPlanStore,
      logger: proactiveLogger,
    });
    this.checkInScheduler = createCheckInScheduler(checkInConfig);
    this.behaviorMonitor = createBehaviorMonitor(behaviorConfig);
    this.logger.debug('Proactive Interventions initialized', { usePrismaStores: this.usePrismaStores });
  }

  private initSelfEvaluation(): void {
    const logger = this.logger;
    this.confidenceScorer = createConfidenceScorer({ logger });
    this.responseVerifier = createResponseVerifier({ logger });
    this.qualityTracker = createQualityTracker({ logger });
    this.logger.debug('Self-Evaluation initialized');
  }

  private initLearningAnalytics(): void {
    const logger = this.logger;
    const sessionStore = createPrismaLearningSessionStore();
    const progressStore = createPrismaTopicProgressStore();
    const gapStore = createPrismaLearningGapStore();
    const skillStore = createPrismaSkillAssessmentStore();
    const recommendationStore = createPrismaRecommendationStore();
    const contentStore = createPrismaContentStore();

    this.progressAnalyzer = createProgressAnalyzer({
      logger,
      sessionStore,
      progressStore,
      gapStore,
    });
    this.skillAssessor = createSkillAssessor({ logger, store: skillStore });
    this.recommendationEngine = createRecommendationEngine({
      logger,
      recommendationStore,
      contentStore,
    });
    this.logger.debug('Learning Analytics initialized');
  }

  private createSamLogger() {
    return {
      debug: (message: string, ...args: unknown[]) => this.logger.debug(message, { args }),
      info: (message: string, ...args: unknown[]) => this.logger.info(message, { args }),
      warn: (message: string, ...args: unknown[]) => this.logger.warn(message, { args }),
      error: (message: string, ...args: unknown[]) => this.logger.error(message, { args }),
    };
  }

  // ============================================================================
  // GOAL PLANNING
  // ============================================================================

  /**
   * Create a new learning goal
   */
  async createGoal(
    title: string,
    description?: string,
    options?: {
      targetDate?: Date;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      topicIds?: string[];
      skillIds?: string[];
    }
  ): Promise<LearningGoal> {
    if (!this.planBuilder) {
      throw new Error('Goal Planning not enabled');
    }

    // If we have a goal store, persist the goal
    if (this.goalStore) {
      const createInput: CreateGoalInput = {
        userId: this.userId,
        title,
        description,
        priority: options?.priority ?? 'medium',
        targetDate: options?.targetDate,
        context: {
          courseId: this.courseId,
          topicIds: options?.topicIds ?? [],
          skillIds: options?.skillIds ?? [],
        },
      };

      const goal = await this.goalStore.create(createInput);

      // Activate the goal immediately after creation
      const activatedGoal = await this.goalStore.activate(goal.id);

      this.logger.info('Goal created and persisted', {
        goalId: activatedGoal.id,
        title,
        status: activatedGoal.status,
      });

      return activatedGoal;
    }

    // Fallback: Create an in-memory goal if no store available
    const goal: LearningGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: this.userId,
      title,
      description,
      status: GoalStatus.ACTIVE,
      priority: options?.priority ?? 'medium',
      targetDate: options?.targetDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      context: {
        courseId: this.courseId,
        topicIds: options?.topicIds ?? [],
        skillIds: options?.skillIds ?? [],
      },
      metadata: {},
    };

    this.logger.info('Goal created (in-memory only)', { goalId: goal.id, title });
    return goal;
  }

  /**
   * Decompose a goal into sub-goals
   */
  async decomposeGoal(goal: LearningGoal): Promise<GoalDecomposition> {
    if (!this.goalDecomposer) {
      throw new Error('Goal Planning not enabled');
    }

    const decomposed = await this.goalDecomposer.decompose(goal);
    this.logger.info('Goal decomposed', {
      goalId: goal.id,
      subGoalCount: decomposed.subGoals?.length ?? 0,
    });

    return decomposed;
  }

  /**
   * Create an execution plan for a goal
   */
  async createPlan(
    goal: LearningGoal,
    decomposition: GoalDecomposition
  ): Promise<ExecutionPlan> {
    if (!this.planBuilder) {
      throw new Error('Goal Planning not enabled');
    }

    const plan = await this.planBuilder.createPlan(goal, decomposition);

    this.logger.info('Plan created', { planId: plan.id, goalId: goal.id });
    return plan;
  }

  /**
   * Get user's active goals
   */
  async getActiveGoals(): Promise<LearningGoal[]> {
    if (!this.planBuilder) {
      throw new Error('Goal Planning not enabled');
    }

    // If we have a goal store, retrieve from database
    if (this.goalStore) {
      const goals = await this.goalStore.getByUser(this.userId, {
        status: [GoalStatus.ACTIVE],
        courseId: this.courseId,
        orderBy: 'createdAt',
        orderDir: 'desc',
      });

      this.logger.debug('Active goals retrieved', { count: goals.length });
      return goals;
    }

    // Fallback: Return empty if no store
    this.logger.debug('getActiveGoals called - no store available');
    return [];
  }

  /**
   * Get a specific goal by ID
   */
  async getGoal(goalId: string): Promise<LearningGoal | null> {
    if (!this.goalStore) {
      throw new Error('Goal Store not available');
    }

    return this.goalStore.get(goalId);
  }

  /**
   * Update a goal
   */
  async updateGoal(
    goalId: string,
    updates: {
      title?: string;
      description?: string;
      targetDate?: Date;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      status?: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
    }
  ): Promise<LearningGoal> {
    if (!this.goalStore) {
      throw new Error('Goal Store not available');
    }

    const goal = await this.goalStore.update(goalId, updates);
    this.logger.info('Goal updated', { goalId, updates: Object.keys(updates) });
    return goal;
  }

  /**
   * Complete a goal
   */
  async completeGoal(goalId: string): Promise<LearningGoal> {
    if (!this.goalStore) {
      throw new Error('Goal Store not available');
    }

    const goal = await this.goalStore.complete(goalId);
    this.logger.info('Goal completed', { goalId });
    return goal;
  }

  /**
   * Abandon a goal
   */
  async abandonGoal(goalId: string, reason?: string): Promise<LearningGoal> {
    if (!this.goalStore) {
      throw new Error('Goal Store not available');
    }

    const goal = await this.goalStore.abandon(goalId, reason);
    this.logger.info('Goal abandoned', { goalId, reason });
    return goal;
  }

  // ============================================================================
  // TOOL EXECUTION
  // ============================================================================

  /**
   * Execute a mentor tool
   */
  async executeTool(
    toolId: string,
    input: Record<string, unknown>,
    options?: Partial<ExecuteOptions>
  ): Promise<ExecutionOutcome> {
    if (!this.toolExecutor) {
      throw new Error('Tool Execution not enabled');
    }

    const executeOptions: ExecuteOptions = {
      sessionId: options?.sessionId ?? `session_${Date.now()}`,
      skipConfirmation: options?.skipConfirmation,
      skipPermissionCheck: options?.skipPermissionCheck,
      metadata: options?.metadata,
      timeout: options?.timeout,
    };

    const result = await this.toolExecutor.execute(
      toolId,
      this.userId,
      input,
      executeOptions
    );

    this.logger.info('Tool executed', {
      toolId,
      success: result.invocation.status === 'success',
    });

    return result;
  }

  /**
   * Get available tools
   */
  async getAvailableTools(): Promise<ToolDefinition[]> {
    if (!this.toolRegistry) {
      throw new Error('Tool Execution not enabled');
    }

    return this.toolRegistry.listTools();
  }

  // ============================================================================
  // PROACTIVE INTERVENTIONS
  // ============================================================================

  /**
   * Check for needed interventions
   */
  async checkForInterventions(
    _context: AgenticUserContext
  ): Promise<Intervention[]> {
    if (!this.behaviorMonitor) {
      throw new Error('Proactive Interventions not enabled');
    }

    // Detect patterns for the user first
    const patterns = await this.behaviorMonitor.detectPatterns(this.userId);

    // Suggest interventions based on detected patterns
    const suggestions = await this.behaviorMonitor.suggestInterventions(patterns);
    const pending = await this.behaviorMonitor.getPendingInterventions(this.userId);
    const pendingTypes = new Set(pending.map((intervention) => intervention.type));

    const created: Intervention[] = [];

    for (const suggestion of suggestions) {
      if (pendingTypes.has(suggestion.type)) continue;
      const intervention = await this.behaviorMonitor.createIntervention(this.userId, {
        type: suggestion.type,
        priority: suggestion.priority,
        message: suggestion.message,
        suggestedActions: suggestion.suggestedActions,
        timing: suggestion.timing,
        executedAt: suggestion.executedAt,
        result: suggestion.result,
      });
      created.push(intervention);
    }

    const interventions = created.length > 0 ? created : pending;

    if (interventions.length > 0) {
      this.logger.info('Interventions triggered', {
        count: interventions.length,
        types: interventions.map((i) => i.type),
      });
    }

    return interventions;
  }

  /**
   * Get scheduled check-ins
   */
  async getScheduledCheckIns(): Promise<TriggeredCheckIn[]> {
    if (!this.checkInScheduler) {
      throw new Error('Proactive Interventions not enabled');
    }

    return this.checkInScheduler.evaluateTriggers(this.userId, { userId: this.userId });
  }

  /**
   * Update learning plan progress
   */
  async updatePlanProgress(
    planId: string,
    completedActivities: string[],
    actualMinutes: number
  ): Promise<void> {
    if (!this.planTracker) {
      throw new Error('Proactive Interventions not enabled');
    }

    await this.planTracker.trackProgress(planId, {
      planId,
      date: new Date(),
      completedActivities,
      actualMinutes,
    });

    this.logger.info('Plan progress updated', { planId, completedCount: completedActivities.length });
  }

  // ============================================================================
  // SELF-EVALUATION
  // ============================================================================

  /**
   * Score confidence of a response
   */
  async scoreConfidence(
    responseText: string,
    context?: {
      responseId?: string;
      sessionId?: string;
      topic?: string;
      responseType?: 'explanation' | 'answer' | 'hint' | 'feedback' | 'assessment' | 'recommendation' | 'clarification';
    }
  ): Promise<ConfidenceScore> {
    if (!this.confidenceScorer) {
      throw new Error('Self-Evaluation not enabled');
    }

    const score = await this.confidenceScorer.scoreResponse({
      responseId: context?.responseId ?? `response_${Date.now()}`,
      userId: this.userId,
      sessionId: context?.sessionId ?? `session_${Date.now()}`,
      responseText,
      responseType: context?.responseType ?? 'explanation',
      topic: context?.topic,
    });

    this.logger.debug('Confidence scored', {
      level: score.level,
      score: score.overallScore,
    });

    return score;
  }

  /**
   * Verify a response for accuracy
   */
  async verifyResponse(
    responseText: string,
    context?: {
      responseId?: string;
      claims?: string[];
      strictMode?: boolean;
    }
  ): Promise<VerificationResult> {
    if (!this.responseVerifier) {
      throw new Error('Self-Evaluation not enabled');
    }

    const result = await this.responseVerifier.verifyResponse({
      responseId: context?.responseId ?? `response_${Date.now()}`,
      userId: this.userId,
      responseText,
      claims: context?.claims,
      strictMode: context?.strictMode,
    });

    this.logger.debug('Response verified', {
      status: result.status,
      issueCount: result.issues?.length ?? 0,
    });

    return result;
  }

  /**
   * Check if response meets quality thresholds
   */
  async checkQuality(response: string): Promise<boolean> {
    if (!this.confidenceScorer) {
      throw new Error('Self-Evaluation not enabled');
    }

    const score = await this.scoreConfidence(response);
    return score.level !== ConfidenceLevel.LOW;
  }

  // ============================================================================
  // LEARNING ANALYTICS
  // ============================================================================

  /**
   * Record a learning session
   */
  async recordSession(session: {
    topicId: string;
    duration: number;
    questionsAnswered?: number;
    correctAnswers?: number;
    conceptsCovered?: string[];
  }): Promise<void> {
    if (!this.progressAnalyzer) {
      throw new Error('Learning Analytics not enabled');
    }

    await this.progressAnalyzer.recordSession({
      userId: this.userId,
      ...session,
    });

    this.logger.info('Session recorded', {
      topicId: session.topicId,
      duration: session.duration,
    });
  }

  /**
   * Assess a skill
   */
  async assessSkill(
    skillId: string,
    score: number,
    maxScore: number,
    source: 'quiz' | 'exercise' | 'project' | 'self_assessment'
  ): Promise<SkillAssessment> {
    if (!this.skillAssessor) {
      throw new Error('Learning Analytics not enabled');
    }

    const sourceMap: Record<string, AssessmentSource> = {
      quiz: AssessmentSource.QUIZ,
      exercise: AssessmentSource.EXERCISE,
      project: AssessmentSource.PROJECT,
      self_assessment: AssessmentSource.SELF_ASSESSMENT,
    };

    const assessment = await this.skillAssessor.assessSkill({
      userId: this.userId,
      skillId,
      score,
      maxScore,
      source: sourceMap[source],
    });

    this.logger.info('Skill assessed', {
      skillId,
      score,
      level: assessment.level,
    });

    return assessment;
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(options?: {
    availableTime?: number;
    learningStyle?: string;
    goals?: string[];
  }): Promise<RecommendationBatch> {
    if (!this.recommendationEngine) {
      throw new Error('Learning Analytics not enabled');
    }

    const batch = await this.recommendationEngine.generateRecommendations({
      userId: this.userId,
      availableTime: options?.availableTime,
      currentGoals: options?.goals,
    });

    this.logger.info('Recommendations generated', {
      count: batch.recommendations.length,
      totalTime: batch.totalEstimatedTime,
    });

    return batch;
  }

  /**
   * Get progress report
   */
  async getProgressReport(
    period?: 'daily' | 'weekly' | 'monthly'
  ): Promise<ProgressReport> {
    if (!this.progressAnalyzer) {
      throw new Error('Learning Analytics not enabled');
    }

    const periodMap: Record<string, TimePeriod> = {
      daily: TimePeriod.DAILY,
      weekly: TimePeriod.WEEKLY,
      monthly: TimePeriod.MONTHLY,
    };

    return this.progressAnalyzer.generateReport(
      this.userId,
      periodMap[period ?? 'weekly']
    );
  }

  /**
   * Get skill map
   */
  async getSkillMap(): Promise<SkillMap> {
    if (!this.skillAssessor) {
      throw new Error('Learning Analytics not enabled');
    }

    return this.skillAssessor.generateSkillMap(this.userId);
  }

  // ============================================================================
  // UNIFIED ANALYSIS
  // ============================================================================

  /**
   * Perform comprehensive agentic analysis
   */
  async analyzeResponse(
    response: string,
    context: AgenticUserContext
  ): Promise<AgenticAnalysisResult> {
    // Score confidence first to get a proper ConfidenceScore
    let confidence: ConfidenceScore | null = null;
    if (this.confidenceScorer) {
      confidence = await this.scoreConfidence(response, {
        topic: context.currentTopic,
      });
    }

    // Create default confidence if not scored
    const defaultConfidence: ConfidenceScore = {
      id: '',
      responseId: '',
      userId: this.userId,
      sessionId: '',
      overallScore: 0,
      level: ConfidenceLevel.MEDIUM,
      factors: [],
      responseType: 'explanation',
      complexity: ComplexityLevel.INTERMEDIATE,
      shouldVerify: true,
      scoredAt: new Date(),
    };

    const result: AgenticAnalysisResult = {
      confidence: confidence ?? defaultConfidence,
    };

    // Verify if confidence is not high
    if (
      this.responseVerifier &&
      result.confidence.level !== ConfidenceLevel.HIGH
    ) {
      result.verification = await this.verifyResponse(response);
    }

    // Check for interventions
    if (this.behaviorMonitor) {
      result.interventions = await this.checkForInterventions(context);
    }

    // Get recommendations if user has been learning
    if (this.recommendationEngine && context.sessionStartTime) {
      result.recommendations = await this.getRecommendations();
    }

    return result;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get enabled capabilities
   */
  getEnabledCapabilities(): string[] {
    const enabled: string[] = [];

    // Goal planning is enabled if we have either goalStore (persistence) or goalDecomposer (AI)
    if (this.goalStore || this.goalDecomposer) enabled.push(CAPABILITIES.GOAL_PLANNING);
    if (this.toolRegistry) enabled.push(CAPABILITIES.TOOL_REGISTRY);
    if (this.behaviorMonitor) enabled.push(CAPABILITIES.PROACTIVE_INTERVENTIONS);
    if (this.confidenceScorer) enabled.push(CAPABILITIES.SELF_EVALUATION);
    if (this.progressAnalyzer) enabled.push(CAPABILITIES.LEARNING_ANALYTICS);

    return enabled;
  }

  /**
   * Check if goal decomposition (AI-powered) is available
   */
  hasGoalDecomposition(): boolean {
    return !!this.goalDecomposer;
  }

  /**
   * Check if goal persistence is available
   */
  hasGoalPersistence(): boolean {
    return !!this.goalStore;
  }

  /**
   * Check if a capability is available
   */
  hasCapability(capability: string): boolean {
    return hasCapability(capability as Parameters<typeof hasCapability>[0]);
  }

  /**
   * Update user context
   */
  setUserContext(courseId?: string): void {
    this.courseId = courseId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Get the Integration Profile (if configured)
   * This provides information about the host environment's capabilities
   */
  getIntegrationProfile(): IntegrationProfile | undefined {
    return this.integrationProfile;
  }

  /**
   * Get the Capability Registry (if configured)
   * This allows runtime queries about available capabilities
   */
  getCapabilityRegistry(): CapabilityRegistry | undefined {
    return this._capabilityRegistry;
  }

  /**
   * Check if an integration profile is configured
   */
  hasIntegrationProfile(): boolean {
    return !!this.integrationProfile;
  }

  /**
   * Check if a specific feature is available based on the integration profile
   * Falls back to checking if the component is initialized
   */
  isFeatureAvailable(feature: keyof NonNullable<IntegrationProfile['features']>): boolean {
    if (this.integrationProfile?.features) {
      return this.integrationProfile.features[feature];
    }

    // Fallback: check if component is initialized
    switch (feature) {
      case 'goalPlanning':
        return !!(this.goalStore || this.goalDecomposer);
      case 'toolExecution':
        return !!this.toolRegistry;
      case 'proactiveInterventions':
        return !!this.behaviorMonitor;
      case 'selfEvaluation':
        return !!this.confidenceScorer;
      case 'learningAnalytics':
        return !!this.progressAnalyzer;
      case 'memorySystem':
        return this.integrationProfile?.features?.memorySystem ?? false;
      case 'knowledgeGraph':
        return this.integrationProfile?.features?.knowledgeGraph ?? false;
      case 'realTimeSync':
        return this.integrationProfile?.features?.realTimeSync ?? false;
      default:
        return false;
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new SAM Agentic Bridge instance
 */
export function createSAMAgenticBridge(
  config: SAMAgenticBridgeConfig
): SAMAgenticBridge {
  return new SAMAgenticBridge(config);
}

/**
 * Create a minimal bridge for quick operations
 */
export function createMinimalAgenticBridge(userId: string): SAMAgenticBridge {
  return new SAMAgenticBridge({
    userId,
    enableGoalPlanning: false,
    enableToolExecution: false,
    enableProactiveInterventions: false,
    enableSelfEvaluation: true,
    enableLearningAnalytics: true,
  });
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export commonly used types and enums
export {
  // Enums
  GoalStatus,
  PlanStatus,
  ConfidenceLevel,
  MasteryLevel,

  // Types
  type LearningGoal,
  type ExecutionPlan,
  type ToolDefinition,
  type ToolExecutionResult,
  type LearningPlan,
  type TriggeredCheckIn,
  type Intervention,
  type ConfidenceScore,
  type VerificationResult,
  type ProgressReport,
  type SkillAssessment,
  type RecommendationBatch,

  // Utilities
  CAPABILITIES,
  hasCapability,
};
