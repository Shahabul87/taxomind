/**
 * Plan Store - Implements PlanStore interface from @sam-ai/agentic
 * Uses Prisma with SAMExecutionPlan, SAMPlanStep, SAMPlanState models for persistent storage
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  type PlanStore,
  type PlanQueryOptions,
  type ExecutionPlan,
  type PlanStep,
  type PlanState,
  type Checkpoint,
  PlanStatus,
} from '@sam-ai/agentic';

/**
 * Map Prisma enum values to agentic package types
 */
const mapPrismaStatus = (
  status: string
): 'draft' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled' => {
  const map: Record<
    string,
    'draft' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled'
  > = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  };
  return map[status] || 'draft';
};

const mapPrismaStepStatus = (
  status: string
): 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'blocked' => {
  const map: Record<
    string,
    'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'blocked'
  > = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
    BLOCKED: 'blocked',
  };
  return map[status] || 'pending';
};

const mapPrismaStepType = (type: string): string => {
  const map: Record<string, string> = {
    READ_CONTENT: 'read_content',
    WATCH_VIDEO: 'watch_video',
    COMPLETE_EXERCISE: 'complete_exercise',
    TAKE_QUIZ: 'take_quiz',
    REFLECT: 'reflect',
    PRACTICE_PROBLEM: 'practice_problem',
    SOCRATIC_DIALOGUE: 'socratic_dialogue',
    SPACED_REVIEW: 'spaced_review',
    CREATE_SUMMARY: 'create_summary',
    PEER_DISCUSSION: 'peer_discussion',
    PROJECT_WORK: 'project_work',
    RESEARCH: 'research',
  };
  return map[type] || 'read_content';
};

const mapAgenticStatus = (
  status: string
): 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' => {
  const map: Record<
    string,
    'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  > = {
    draft: 'DRAFT',
    active: 'ACTIVE',
    paused: 'PAUSED',
    completed: 'COMPLETED',
    failed: 'FAILED',
    cancelled: 'CANCELLED',
  };
  return map[status] || 'DRAFT';
};

const mapAgenticStepStatus = (
  status: string
): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'BLOCKED' => {
  const map: Record<
    string,
    'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'BLOCKED'
  > = {
    pending: 'PENDING',
    in_progress: 'IN_PROGRESS',
    completed: 'COMPLETED',
    failed: 'FAILED',
    skipped: 'SKIPPED',
    blocked: 'BLOCKED',
  };
  return map[status] || 'PENDING';
};

type SAMStepTypeValue =
  | 'READ_CONTENT'
  | 'WATCH_VIDEO'
  | 'COMPLETE_EXERCISE'
  | 'TAKE_QUIZ'
  | 'REFLECT'
  | 'PRACTICE_PROBLEM'
  | 'SOCRATIC_DIALOGUE'
  | 'SPACED_REVIEW'
  | 'CREATE_SUMMARY'
  | 'PEER_DISCUSSION'
  | 'PROJECT_WORK'
  | 'RESEARCH';

const mapAgenticStepType = (type: string): SAMStepTypeValue => {
  const map: Record<string, SAMStepTypeValue> = {
    read_content: 'READ_CONTENT',
    watch_video: 'WATCH_VIDEO',
    complete_exercise: 'COMPLETE_EXERCISE',
    take_quiz: 'TAKE_QUIZ',
    reflect: 'REFLECT',
    practice_problem: 'PRACTICE_PROBLEM',
    socratic_dialogue: 'SOCRATIC_DIALOGUE',
    spaced_review: 'SPACED_REVIEW',
    create_summary: 'CREATE_SUMMARY',
    peer_discussion: 'PEER_DISCUSSION',
    project_work: 'PROJECT_WORK',
    research: 'RESEARCH',
  };
  return map[type] || 'READ_CONTENT';
};

interface PrismaStep {
  id: string;
  planId: string;
  subGoalId: string | null;
  type: string;
  title: string;
  description: string | null;
  order: number;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  estimatedMinutes: number;
  actualMinutes: number | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  inputs: unknown;
  outputs: unknown;
  executionContext: unknown;
  metadata: unknown;
}

interface PrismaPlan {
  id: string;
  goalId: string;
  userId: string;
  startDate: Date | null;
  targetDate: Date | null;
  currentStepId: string | null;
  overallProgress: number;
  status: string;
  pausedAt: Date | null;
  checkpointData: unknown;
  schedule: unknown;
  fallbackStrategies: unknown;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  steps: PrismaStep[];
  checkpoints: Array<{
    id: string;
    planId: string;
    stepId: string;
    name: string;
    description: string | null;
    type: string;
    targetDate: Date | null;
    achieved: boolean;
    achievedAt: Date | null;
  }>;
}

/**
 * Convert Prisma step to agentic PlanStep type
 */
const toAgenticStep = (step: PrismaStep): PlanStep => ({
  id: step.id,
  planId: step.planId,
  subGoalId: step.subGoalId ?? undefined,
  type: mapPrismaStepType(step.type) as PlanStep['type'],
  title: step.title,
  description: step.description ?? undefined,
  order: step.order,
  status: mapPrismaStepStatus(step.status),
  startedAt: step.startedAt ?? undefined,
  completedAt: step.completedAt ?? undefined,
  estimatedMinutes: step.estimatedMinutes,
  actualMinutes: step.actualMinutes ?? undefined,
  retryCount: step.retryCount,
  maxRetries: step.maxRetries,
  lastError: step.lastError ?? undefined,
  inputs: step.inputs as PlanStep['inputs'],
  outputs: step.outputs as PlanStep['outputs'],
  executionContext: step.executionContext as PlanStep['executionContext'],
  metadata: step.metadata as Record<string, unknown> | undefined,
});

/**
 * Convert Prisma plan to agentic ExecutionPlan type
 */
const toAgenticPlan = (plan: PrismaPlan): ExecutionPlan => ({
  id: plan.id,
  goalId: plan.goalId,
  userId: plan.userId,
  startDate: plan.startDate ?? undefined,
  targetDate: plan.targetDate ?? undefined,
  steps: plan.steps.map(toAgenticStep),
  schedule: plan.schedule as ExecutionPlan['schedule'],
  checkpoints: plan.checkpoints.map((cp) => ({
    id: cp.id,
    planId: cp.planId,
    stepId: cp.stepId,
    name: cp.name,
    description: cp.description ?? undefined,
    type: cp.type as 'progress' | 'milestone' | 'assessment',
    targetDate: cp.targetDate ?? undefined,
    achieved: cp.achieved,
    achievedAt: cp.achievedAt ?? undefined,
  })),
  fallbackStrategies: (plan.fallbackStrategies as ExecutionPlan['fallbackStrategies']) ?? [],
  currentStepId: plan.currentStepId ?? undefined,
  overallProgress: plan.overallProgress,
  status: mapPrismaStatus(plan.status),
  pausedAt: plan.pausedAt ?? undefined,
  checkpointData: plan.checkpointData as Record<string, unknown> | undefined,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
  completedAt: plan.completedAt ?? undefined,
});

/**
 * Prisma implementation of PlanStore
 * Uses SAMExecutionPlan, SAMPlanStep, SAMPlanState models for persistent storage
 */
export class PrismaPlanStore implements PlanStore {
  /**
   * Create a new execution plan
   */
  async create(
    plan: Omit<ExecutionPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExecutionPlan> {
    const newPlan = await db.sAMExecutionPlan.create({
      data: {
        goalId: plan.goalId,
        userId: plan.userId,
        startDate: plan.startDate,
        targetDate: plan.targetDate,
        currentStepId: plan.currentStepId,
        overallProgress: plan.overallProgress ?? 0,
        status: mapAgenticStatus(plan.status),
        pausedAt: plan.pausedAt,
        checkpointData: plan.checkpointData ?? {},
        schedule: plan.schedule ?? {},
        fallbackStrategies: plan.fallbackStrategies ?? [],
        completedAt: plan.completedAt,
        steps: {
          create: plan.steps.map((step, index) => ({
            subGoalId: step.subGoalId,
            type: mapAgenticStepType(step.type),
            title: step.title,
            description: step.description,
            order: step.order ?? index,
            status: mapAgenticStepStatus(step.status),
            startedAt: step.startedAt,
            completedAt: step.completedAt,
            estimatedMinutes: step.estimatedMinutes,
            actualMinutes: step.actualMinutes,
            retryCount: step.retryCount ?? 0,
            maxRetries: step.maxRetries ?? 3,
            lastError: step.lastError,
            inputs: step.inputs ?? [],
            outputs: step.outputs ?? [],
            executionContext: step.executionContext ?? {},
            metadata: step.metadata ?? {},
          })),
        },
        checkpoints: {
          create: plan.checkpoints.map((cp) => ({
            stepId: cp.stepId,
            name: cp.name,
            description: cp.description,
            type: cp.type.toUpperCase() as 'PROGRESS' | 'MILESTONE' | 'ASSESSMENT',
            targetDate: cp.targetDate,
            achieved: cp.achieved,
            achievedAt: cp.achievedAt,
          })),
        },
      },
      include: {
        steps: true,
        checkpoints: true,
      },
    });

    return toAgenticPlan(newPlan as unknown as PrismaPlan);
  }

  /**
   * Get a plan by ID
   */
  async get(planId: string): Promise<ExecutionPlan | null> {
    const plan = await db.sAMExecutionPlan.findUnique({
      where: { id: planId },
      include: {
        steps: { orderBy: { order: 'asc' } },
        checkpoints: true,
      },
    });

    if (!plan) return null;
    return toAgenticPlan(plan as unknown as PrismaPlan);
  }

  /**
   * Get plans by user with optional filtering
   */
  async getByUser(
    userId: string,
    options?: PlanQueryOptions
  ): Promise<ExecutionPlan[]> {
    const whereClause: Prisma.SAMExecutionPlanWhereInput = { userId };

    if (options?.status?.length) {
      whereClause.status = {
        in: options.status.map((s) => mapAgenticStatus(s)),
      };
    }

    if (options?.goalId) {
      whereClause.goalId = options.goalId;
    }

    const plans = await db.sAMExecutionPlan.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: options?.offset ?? 0,
      take: options?.limit,
      include: {
        steps: { orderBy: { order: 'asc' } },
        checkpoints: true,
      },
    });

    return plans.map((p) => toAgenticPlan(p as unknown as PrismaPlan));
  }

  /**
   * Get plans by goal
   */
  async getByGoal(goalId: string): Promise<ExecutionPlan[]> {
    const plans = await db.sAMExecutionPlan.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
      include: {
        steps: { orderBy: { order: 'asc' } },
        checkpoints: true,
      },
    });

    return plans.map((p) => toAgenticPlan(p as unknown as PrismaPlan));
  }

  /**
   * Update a plan
   */
  async update(
    planId: string,
    updates: Partial<ExecutionPlan>
  ): Promise<ExecutionPlan> {
    const updateData: Record<string, unknown> = {};

    if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
    if (updates.targetDate !== undefined) updateData.targetDate = updates.targetDate;
    if (updates.currentStepId !== undefined) updateData.currentStepId = updates.currentStepId;
    if (updates.overallProgress !== undefined) updateData.overallProgress = updates.overallProgress;
    if (updates.status !== undefined) updateData.status = mapAgenticStatus(updates.status);
    if (updates.pausedAt !== undefined) updateData.pausedAt = updates.pausedAt;
    if (updates.checkpointData !== undefined) updateData.checkpointData = updates.checkpointData;
    if (updates.schedule !== undefined) updateData.schedule = updates.schedule;
    if (updates.fallbackStrategies !== undefined) updateData.fallbackStrategies = updates.fallbackStrategies;
    if (updates.completedAt !== undefined) updateData.completedAt = updates.completedAt;

    const plan = await db.sAMExecutionPlan.update({
      where: { id: planId },
      data: updateData,
      include: {
        steps: { orderBy: { order: 'asc' } },
        checkpoints: true,
      },
    });

    return toAgenticPlan(plan as unknown as PrismaPlan);
  }

  /**
   * Delete a plan
   */
  async delete(planId: string): Promise<void> {
    await db.sAMExecutionPlan.delete({
      where: { id: planId },
    });
  }

  /**
   * Save plan state for resumability
   */
  async saveState(state: PlanState): Promise<void> {
    await db.sAMPlanState.upsert({
      where: { planId: state.planId },
      update: {
        currentStepId: state.currentStepId,
        currentStepProgress: state.currentStepProgress,
        completedSteps: state.completedSteps,
        failedSteps: state.failedSteps,
        skippedSteps: state.skippedSteps,
        pausedAt: state.pausedAt,
        lastActiveAt: state.lastActiveAt,
        totalActiveTime: state.totalActiveTime,
        context: state.context ?? {},
        checkpointData: state.checkpointData ?? {},
        sessionCount: state.sessionCount,
        currentSessionStart: state.currentSessionStart,
      },
      create: {
        planId: state.planId,
        goalId: state.goalId,
        userId: state.userId,
        currentStepId: state.currentStepId,
        currentStepProgress: state.currentStepProgress,
        completedSteps: state.completedSteps,
        failedSteps: state.failedSteps,
        skippedSteps: state.skippedSteps,
        startedAt: state.startedAt,
        pausedAt: state.pausedAt,
        lastActiveAt: state.lastActiveAt,
        totalActiveTime: state.totalActiveTime,
        context: state.context ?? {},
        checkpointData: state.checkpointData ?? {},
        sessionCount: state.sessionCount,
        currentSessionStart: state.currentSessionStart,
      },
    });
  }

  /**
   * Get saved plan state
   */
  async getState(planId: string): Promise<PlanState | null> {
    const state = await db.sAMPlanState.findUnique({
      where: { planId },
    });

    if (!state) return null;

    return {
      planId: state.planId,
      goalId: state.goalId,
      userId: state.userId,
      currentStepId: state.currentStepId,
      currentStepProgress: state.currentStepProgress,
      completedSteps: state.completedSteps,
      failedSteps: state.failedSteps,
      skippedSteps: state.skippedSteps,
      startedAt: state.startedAt,
      pausedAt: state.pausedAt ?? undefined,
      lastActiveAt: state.lastActiveAt,
      totalActiveTime: state.totalActiveTime,
      context: state.context as unknown as PlanState['context'],
      checkpointData: state.checkpointData as unknown as Record<string, unknown>,
      sessionCount: state.sessionCount,
      currentSessionStart: state.currentSessionStart ?? undefined,
    };
  }

  /**
   * Load plan state (alias for getState, required by PlanStore interface)
   */
  async loadState(planId: string): Promise<PlanState | null> {
    return this.getState(planId);
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(
    planId: string,
    stepId: string,
    name: string
  ): Promise<Checkpoint> {
    const checkpoint = await db.sAMCheckpoint.create({
      data: {
        planId,
        stepId,
        name,
        type: 'PROGRESS',
        achieved: false,
      },
    });

    return {
      id: checkpoint.id,
      planId: checkpoint.planId,
      stepId: checkpoint.stepId,
      name: checkpoint.name,
      description: checkpoint.description ?? undefined,
      type: checkpoint.type.toLowerCase() as 'progress' | 'milestone' | 'assessment',
      targetDate: checkpoint.targetDate ?? undefined,
      achieved: checkpoint.achieved,
      achievedAt: checkpoint.achievedAt ?? undefined,
    };
  }

  /**
   * Restore from checkpoint
   */
  async restoreCheckpoint(_checkpointId: string): Promise<PlanState | null> {
    // Find the checkpoint and its associated plan state
    const checkpoint = await db.sAMCheckpoint.findUnique({
      where: { id: _checkpointId },
    });

    if (!checkpoint) return null;

    return this.getState(checkpoint.planId);
  }

  /**
   * Update step status
   */
  async updateStep(
    planId: string,
    stepId: string,
    updates: Partial<PlanStep>
  ): Promise<PlanStep> {
    const updateData: Record<string, unknown> = {};

    if (updates.status !== undefined) updateData.status = mapAgenticStepStatus(updates.status);
    if (updates.startedAt !== undefined) updateData.startedAt = updates.startedAt;
    if (updates.completedAt !== undefined) updateData.completedAt = updates.completedAt;
    if (updates.actualMinutes !== undefined) updateData.actualMinutes = updates.actualMinutes;
    if (updates.retryCount !== undefined) updateData.retryCount = updates.retryCount;
    if (updates.lastError !== undefined) updateData.lastError = updates.lastError;
    if (updates.outputs !== undefined) updateData.outputs = updates.outputs;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const step = await db.sAMPlanStep.update({
      where: { id: stepId },
      data: updateData,
    });

    // Update plan's updatedAt
    await db.sAMExecutionPlan.update({
      where: { id: planId },
      data: { updatedAt: new Date() },
    });

    return toAgenticStep(step);
  }

  /**
   * Activate a plan
   */
  async activate(planId: string): Promise<ExecutionPlan> {
    return this.update(planId, { status: PlanStatus.ACTIVE });
  }

  /**
   * Pause a plan
   */
  async pause(planId: string): Promise<ExecutionPlan> {
    return this.update(planId, { status: PlanStatus.PAUSED, pausedAt: new Date() });
  }

  /**
   * Complete a plan
   */
  async complete(planId: string): Promise<ExecutionPlan> {
    return this.update(planId, {
      status: PlanStatus.COMPLETED,
      completedAt: new Date(),
    });
  }

  /**
   * Fail a plan
   */
  async fail(planId: string, _reason?: string): Promise<ExecutionPlan> {
    return this.update(planId, { status: PlanStatus.FAILED });
  }

  /**
   * Cancel a plan
   */
  async cancel(planId: string): Promise<ExecutionPlan> {
    return this.update(planId, { status: PlanStatus.CANCELLED });
  }
}

/**
 * Factory function to create a PrismaPlanStore
 */
export function createPrismaPlanStore(): PrismaPlanStore {
  return new PrismaPlanStore();
}
