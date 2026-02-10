/**
 * Goal Planning Service
 *
 * Handles all goal lifecycle operations: creation, decomposition, planning,
 * retrieval, updates, completion, and abandonment.
 *
 * Uses GoalStore (Prisma) for persistence and GoalDecomposer (AI) for
 * intelligent sub-goal generation.
 */

import {
  GoalDecomposer,
  PlanBuilder,
  AgentStateMachine,
  createGoalDecomposer,
  createPlanBuilder,
  createAgentStateMachine,
  type LearningGoal,
  type GoalDecomposition,
  type ExecutionPlan,
  type GoalStore,
  type CreateGoalInput,
  GoalStatus,
} from '@sam-ai/agentic';

import { type AIAdapter, type SAMLogger } from '@sam-ai/core';

import { getGoalStores } from '../taxomind-context';
import { createUserScopedAdapter } from '@/lib/ai/user-scoped-adapter';
import type { AgenticLogger } from './types';

// ============================================================================
// SERVICE
// ============================================================================

export class GoalPlanningService {
  private goalStore?: GoalStore;
  private aiAdapter?: AIAdapter;
  private goalDecomposer?: GoalDecomposer;
  private planBuilder?: PlanBuilder;
  private stateMachine?: AgentStateMachine;

  constructor(
    private readonly userId: string,
    private courseId: string | undefined,
    private readonly logger: AgenticLogger,
    private readonly usePrismaStores: boolean,
  ) {}

  /** Initialize all goal planning components */
  initialize(): void {
    const samLogger = this.createSamLogger();

    if (this.usePrismaStores) {
      const goalStores = getGoalStores();
      this.goalStore = goalStores.goal;
    }

    void this.initializeGoalDecomposer(samLogger);

    if (this.usePrismaStores) {
      const goalStores = getGoalStores();
      this.planBuilder = createPlanBuilder({ logger: samLogger });
      this.stateMachine = createAgentStateMachine({ planStore: goalStores.plan, logger: samLogger });
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

  async initializeGoalDecomposer(samLogger: SAMLogger): Promise<void> {
    if (this.goalDecomposer) {
      return;
    }

    try {
      const adapter = await createUserScopedAdapter(this.userId, 'chat');

      this.aiAdapter = adapter;
      this.goalDecomposer = createGoalDecomposer({
        aiAdapter: adapter,
        logger: samLogger,
      });

      this.logger.debug('GoalDecomposer initialized with user-scoped AI adapter');
    } catch (error) {
      this.logger.warn('Failed to initialize AI adapter for GoalDecomposer', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

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
    if (!this.planBuilder) {
      throw new Error('Goal Planning not enabled');
    }

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
      const activatedGoal = await this.goalStore.activate(goal.id);

      this.logger.info('Goal created and persisted', {
        goalId: activatedGoal.id,
        title,
        status: activatedGoal.status,
      });

      return activatedGoal;
    }

    // Fallback: in-memory goal
    const goal: LearningGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      userId: this.userId,
      title,
      description,
      status: GoalStatus.ACTIVE,
      priority: options?.priority ?? 'medium',
      targetDate: options?.targetDate,
      progress: 0,
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

  async decomposeGoal(goal: LearningGoal): Promise<GoalDecomposition> {
    if (!this.goalDecomposer) {
      await this.initializeGoalDecomposer(this.createSamLogger());
    }
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

  async createPlan(
    goal: LearningGoal,
    decomposition: GoalDecomposition,
  ): Promise<ExecutionPlan> {
    if (!this.planBuilder) {
      throw new Error('Goal Planning not enabled');
    }

    const plan = await this.planBuilder.createPlan(goal, decomposition);
    this.logger.info('Plan created', { planId: plan.id, goalId: goal.id });
    return plan;
  }

  async getActiveGoals(): Promise<LearningGoal[]> {
    if (!this.planBuilder) {
      throw new Error('Goal Planning not enabled');
    }

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

    this.logger.debug('getActiveGoals called - no store available');
    return [];
  }

  async getGoal(goalId: string): Promise<LearningGoal | null> {
    if (!this.goalStore) {
      throw new Error('Goal Store not available');
    }
    return this.goalStore.get(goalId);
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
    if (!this.goalStore) {
      throw new Error('Goal Store not available');
    }

    const goal = await this.goalStore.update(goalId, updates);
    this.logger.info('Goal updated', { goalId, updates: Object.keys(updates) });
    return goal;
  }

  async completeGoal(goalId: string): Promise<LearningGoal> {
    if (!this.goalStore) {
      throw new Error('Goal Store not available');
    }

    const goal = await this.goalStore.complete(goalId);
    this.logger.info('Goal completed', { goalId });
    return goal;
  }

  async abandonGoal(goalId: string, reason?: string): Promise<LearningGoal> {
    if (!this.goalStore) {
      throw new Error('Goal Store not available');
    }

    const goal = await this.goalStore.abandon(goalId, reason);
    this.logger.info('Goal abandoned', { goalId, reason });
    return goal;
  }

  // --------------------------------------------------------------------------
  // Capability checks
  // --------------------------------------------------------------------------

  hasGoalDecomposition(): boolean {
    return !!this.goalDecomposer;
  }

  hasGoalPersistence(): boolean {
    return !!this.goalStore;
  }

  isEnabled(): boolean {
    return !!(this.goalStore || this.goalDecomposer);
  }

  /** Update mutable course context */
  setCourseId(courseId: string | undefined): void {
    this.courseId = courseId;
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private createSamLogger(): SAMLogger {
    return {
      debug: (message: string, ...args: unknown[]) => this.logger.debug(message, { args }),
      info: (message: string, ...args: unknown[]) => this.logger.info(message, { args }),
      warn: (message: string, ...args: unknown[]) => this.logger.warn(message, { args }),
      error: (message: string, ...args: unknown[]) => this.logger.error(message, { args }),
    };
  }
}
