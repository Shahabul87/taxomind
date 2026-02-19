/**
 * SAM Agentic Bridge Facade
 *
 * Thin delegation layer that preserves the EXACT same public API as the
 * original monolithic SAMAgenticBridge while routing calls to focused
 * domain services.
 */

import {
  type LearningGoal,
  type GoalDecomposition,
  type ExecutionPlan,
  type ToolDefinition,
  type ExecuteOptions,
  type ExecutionOutcome,
  type Intervention,
  type TriggeredCheckIn,
  type ConfidenceScore,
  type VerificationResult,
  type ProgressReport,
  type SkillAssessment,
  type RecommendationBatch,
  type SkillMap,
  CAPABILITIES,
  hasCapability,
  ConfidenceLevel,
  ComplexityLevel,
} from '@sam-ai/agentic';

import {
  createCapabilityRegistry,
  type IntegrationProfile,
  type CapabilityRegistry,
} from '@sam-ai/integration';

import type {
  SAMAgenticBridgeConfig,
  AgenticUserContext,
  AgenticAnalysisResult,
  AgenticLogger,
} from './types';
import { defaultLogger } from './types';
import { GoalPlanningService } from './goal-planning-service';
import { ToolExecutionService } from './tool-execution-service';
import { InterventionService } from './intervention-service';
import { SelfEvaluationService } from './self-evaluation-service';
import { LearningAnalyticsService } from './learning-analytics-service';

// ============================================================================
// FACADE
// ============================================================================

export class SAMAgenticBridge {
  private readonly userId: string;
  private readonly logger: AgenticLogger;

  // Integration Profile (for portability)
  private integrationProfile?: IntegrationProfile;
  private _capabilityRegistry?: CapabilityRegistry;

  // Domain services
  private goalPlanning?: GoalPlanningService;
  private toolExecution?: ToolExecutionService;
  private intervention?: InterventionService;
  private selfEvaluation?: SelfEvaluationService;
  private learningAnalytics?: LearningAnalyticsService;

  constructor(config: SAMAgenticBridgeConfig) {
    this.userId = config.userId;
    this.logger = config.logger ?? defaultLogger;
    const usePrismaStores = config.usePrismaStores !== false;

    // Integration Profile setup
    this.integrationProfile = config.integrationProfile;
    this._capabilityRegistry = config.capabilityRegistry;
    if (this.integrationProfile && !this._capabilityRegistry) {
      this._capabilityRegistry = createCapabilityRegistry(this.integrationProfile);
    }

    // Resolve feature flags from profile or config
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

    // Initialize enabled domain services
    if (enableGoalPlanning) {
      this.goalPlanning = new GoalPlanningService(
        config.userId, config.courseId, this.logger, usePrismaStores,
      );
      this.goalPlanning.initialize();
    }

    if (enableToolExecution) {
      this.toolExecution = new ToolExecutionService(config.userId, this.logger);
      this.toolExecution.initialize();
    }

    if (enableProactiveInterventions) {
      this.intervention = new InterventionService(config.userId, this.logger, usePrismaStores);
      this.intervention.initialize();
    }

    if (enableSelfEvaluation) {
      this.selfEvaluation = new SelfEvaluationService(config.userId, this.logger, usePrismaStores);
      this.selfEvaluation.initialize();
    }

    if (enableLearningAnalytics) {
      this.learningAnalytics = new LearningAnalyticsService(config.userId, this.logger);
      this.learningAnalytics.initialize();
    }

    this.logger.info('SAM Agentic Bridge initialized', {
      userId: this.userId,
      hasIntegrationProfile: !!this.integrationProfile,
      profileId: this.integrationProfile?.id,
      capabilities: this.getEnabledCapabilities(),
    });
  }

  // ==========================================================================
  // GOAL PLANNING — delegated to GoalPlanningService
  // ==========================================================================

  async createGoal(
    title: string,
    description?: string,
    options?: {
      targetDate?: Date;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      topicIds?: string[];
      skillIds?: string[];
    },
  ): Promise<LearningGoal> {
    if (!this.goalPlanning) throw new Error('Goal Planning not enabled');
    return this.goalPlanning.createGoal(title, description, options);
  }

  async decomposeGoal(goal: LearningGoal): Promise<GoalDecomposition> {
    if (!this.goalPlanning) throw new Error('Goal Planning not enabled');
    return this.goalPlanning.decomposeGoal(goal);
  }

  async createPlan(goal: LearningGoal, decomposition: GoalDecomposition): Promise<ExecutionPlan> {
    if (!this.goalPlanning) throw new Error('Goal Planning not enabled');
    return this.goalPlanning.createPlan(goal, decomposition);
  }

  async getActiveGoals(): Promise<LearningGoal[]> {
    if (!this.goalPlanning) throw new Error('Goal Planning not enabled');
    return this.goalPlanning.getActiveGoals();
  }

  async getGoal(goalId: string): Promise<LearningGoal | null> {
    if (!this.goalPlanning) throw new Error('Goal Store not available');
    return this.goalPlanning.getGoal(goalId);
  }

  async updateGoal(
    goalId: string,
    updates: {
      title?: string;
      description?: string;
      targetDate?: Date;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      status?: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
    },
  ): Promise<LearningGoal> {
    if (!this.goalPlanning) throw new Error('Goal Store not available');
    return this.goalPlanning.updateGoal(goalId, updates);
  }

  async completeGoal(goalId: string): Promise<LearningGoal> {
    if (!this.goalPlanning) throw new Error('Goal Store not available');
    return this.goalPlanning.completeGoal(goalId);
  }

  async abandonGoal(goalId: string, reason?: string): Promise<LearningGoal> {
    if (!this.goalPlanning) throw new Error('Goal Store not available');
    return this.goalPlanning.abandonGoal(goalId, reason);
  }

  // ==========================================================================
  // TOOL EXECUTION — delegated to ToolExecutionService
  // ==========================================================================

  async executeTool(
    toolId: string,
    input: Record<string, unknown>,
    options?: Partial<ExecuteOptions>,
  ): Promise<ExecutionOutcome> {
    if (!this.toolExecution) throw new Error('Tool Execution not enabled');
    return this.toolExecution.executeTool(toolId, input, options);
  }

  async getAvailableTools(): Promise<ToolDefinition[]> {
    if (!this.toolExecution) throw new Error('Tool Execution not enabled');
    return this.toolExecution.getAvailableTools();
  }

  // ==========================================================================
  // PROACTIVE INTERVENTIONS — delegated to InterventionService
  // ==========================================================================

  async checkForInterventions(context: AgenticUserContext): Promise<Intervention[]> {
    if (!this.intervention) throw new Error('Proactive Interventions not enabled');
    return this.intervention.checkForInterventions(context);
  }

  async getScheduledCheckIns(): Promise<TriggeredCheckIn[]> {
    if (!this.intervention) throw new Error('Proactive Interventions not enabled');
    return this.intervention.getScheduledCheckIns();
  }

  async updatePlanProgress(
    planId: string,
    completedActivities: string[],
    actualMinutes: number,
  ): Promise<void> {
    if (!this.intervention) throw new Error('Proactive Interventions not enabled');
    return this.intervention.updatePlanProgress(planId, completedActivities, actualMinutes);
  }

  // ==========================================================================
  // SELF-EVALUATION — delegated to SelfEvaluationService
  // ==========================================================================

  async scoreConfidence(
    responseText: string,
    context?: {
      responseId?: string;
      sessionId?: string;
      topic?: string;
      responseType?: 'explanation' | 'answer' | 'hint' | 'feedback' | 'assessment' | 'recommendation' | 'clarification';
    },
  ): Promise<ConfidenceScore> {
    if (!this.selfEvaluation) throw new Error('Self-Evaluation not enabled');
    // Map lowercase responseType to uppercase for SelfEvaluationService
    const RESPONSE_TYPE_MAP: Record<string, 'EXPLANATION' | 'ANSWER' | 'ASSESSMENT' | 'RECOMMENDATION' | 'INTERVENTION' | 'TOOL_RESULT'> = {
      explanation: 'EXPLANATION',
      answer: 'ANSWER',
      hint: 'EXPLANATION',
      feedback: 'ASSESSMENT',
      assessment: 'ASSESSMENT',
      recommendation: 'RECOMMENDATION',
      clarification: 'EXPLANATION',
    };
    const mappedContext = context ? {
      ...context,
      responseType: context.responseType
        ? RESPONSE_TYPE_MAP[context.responseType] ?? 'EXPLANATION'
        : undefined,
    } : undefined;
    return this.selfEvaluation.scoreConfidence(responseText, mappedContext);
  }

  async verifyResponse(
    responseText: string,
    context?: {
      responseId?: string;
      claims?: string[];
      strictMode?: boolean;
    },
  ): Promise<VerificationResult> {
    if (!this.selfEvaluation) throw new Error('Self-Evaluation not enabled');
    return this.selfEvaluation.verifyResponse(responseText, context);
  }

  async checkQuality(response: string): Promise<boolean> {
    if (!this.selfEvaluation) throw new Error('Self-Evaluation not enabled');
    return this.selfEvaluation.checkQuality(response);
  }

  // ==========================================================================
  // LEARNING ANALYTICS — delegated to LearningAnalyticsService
  // ==========================================================================

  async recordSession(session: {
    topicId: string;
    duration: number;
    questionsAnswered?: number;
    correctAnswers?: number;
    conceptsCovered?: string[];
  }): Promise<void> {
    if (!this.learningAnalytics) throw new Error('Learning Analytics not enabled');
    return this.learningAnalytics.recordSession(session);
  }

  async assessSkill(
    skillId: string,
    score: number,
    maxScore: number,
    source: 'quiz' | 'exercise' | 'project' | 'self_assessment',
  ): Promise<SkillAssessment> {
    if (!this.learningAnalytics) throw new Error('Learning Analytics not enabled');
    return this.learningAnalytics.assessSkill(skillId, score, maxScore, source);
  }

  async getRecommendations(options?: {
    availableTime?: number;
    learningStyle?: string;
    goals?: string[];
  }): Promise<RecommendationBatch> {
    if (!this.learningAnalytics) throw new Error('Learning Analytics not enabled');
    return this.learningAnalytics.getRecommendations(options);
  }

  async getProgressReport(period?: 'daily' | 'weekly' | 'monthly'): Promise<ProgressReport> {
    if (!this.learningAnalytics) throw new Error('Learning Analytics not enabled');
    return this.learningAnalytics.getProgressReport(period);
  }

  async getSkillMap(): Promise<SkillMap> {
    if (!this.learningAnalytics) throw new Error('Learning Analytics not enabled');
    return this.learningAnalytics.getSkillMap();
  }

  // ==========================================================================
  // UNIFIED ANALYSIS
  // ==========================================================================

  async analyzeResponse(
    response: string,
    context: AgenticUserContext,
  ): Promise<AgenticAnalysisResult> {
    let confidence: ConfidenceScore | null = null;
    if (this.selfEvaluation?.hasConfidenceScorer()) {
      confidence = await this.scoreConfidence(response, {
        topic: context.currentTopic,
      });
    }

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

    if (
      this.selfEvaluation?.hasResponseVerifier() &&
      result.confidence.level !== ConfidenceLevel.HIGH
    ) {
      result.verification = await this.verifyResponse(response);
    }

    if (this.intervention?.isEnabled()) {
      result.interventions = await this.checkForInterventions(context);
    }

    if (this.learningAnalytics?.hasRecommendationEngine() && context.sessionStartTime) {
      result.recommendations = await this.getRecommendations();
    }

    return result;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  getEnabledCapabilities(): string[] {
    const enabled: string[] = [];
    if (this.goalPlanning?.isEnabled()) enabled.push(CAPABILITIES.GOAL_PLANNING);
    if (this.toolExecution?.isEnabled()) enabled.push(CAPABILITIES.TOOL_REGISTRY);
    if (this.intervention?.isEnabled()) enabled.push(CAPABILITIES.PROACTIVE_INTERVENTIONS);
    if (this.selfEvaluation?.isEnabled()) enabled.push(CAPABILITIES.SELF_EVALUATION);
    if (this.learningAnalytics?.isEnabled()) enabled.push(CAPABILITIES.LEARNING_ANALYTICS);
    return enabled;
  }

  hasGoalDecomposition(): boolean {
    return this.goalPlanning?.hasGoalDecomposition() ?? false;
  }

  hasGoalPersistence(): boolean {
    return this.goalPlanning?.hasGoalPersistence() ?? false;
  }

  hasCapability(capability: string): boolean {
    return hasCapability(capability as Parameters<typeof hasCapability>[0]);
  }

  setUserContext(courseId?: string): void {
    this.goalPlanning?.setCourseId(courseId);
  }

  getUserId(): string {
    return this.userId;
  }

  getIntegrationProfile(): IntegrationProfile | undefined {
    return this.integrationProfile;
  }

  getCapabilityRegistry(): CapabilityRegistry | undefined {
    return this._capabilityRegistry;
  }

  hasIntegrationProfile(): boolean {
    return !!this.integrationProfile;
  }

  isFeatureAvailable(feature: keyof NonNullable<IntegrationProfile['features']>): boolean {
    if (this.integrationProfile?.features) {
      return this.integrationProfile.features[feature];
    }

    switch (feature) {
      case 'goalPlanning':
        return this.goalPlanning?.isEnabled() ?? false;
      case 'toolExecution':
        return this.toolExecution?.isEnabled() ?? false;
      case 'proactiveInterventions':
        return this.intervention?.isEnabled() ?? false;
      case 'selfEvaluation':
        return this.selfEvaluation?.isEnabled() ?? false;
      case 'learningAnalytics':
        return this.learningAnalytics?.isEnabled() ?? false;
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
