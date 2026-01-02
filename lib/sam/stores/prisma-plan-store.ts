/**
 * Plan Store - Implements PlanStore interface from @sam-ai/agentic
 * Uses in-memory storage until SAMExecutionPlan, SAMPlanStep, SAMPlanState models are added
 * TODO: Convert to Prisma when models are added to schema
 */

import {
  type PlanStore,
  type PlanQueryOptions,
  type ExecutionPlan,
  type PlanStep,
  type PlanState,
  type Checkpoint,
  PlanStatus,
  StepStatus,
} from '@sam-ai/agentic';

/**
 * In-memory implementation of PlanStore
 * Stores plans, steps, and states in memory for now
 */
export class PrismaPlanStore implements PlanStore {
  private plans: Map<string, ExecutionPlan> = new Map();
  private states: Map<string, PlanState> = new Map();

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Create a new execution plan
   */
  async create(
    plan: Omit<ExecutionPlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExecutionPlan> {
    const now = new Date();
    const newPlan: ExecutionPlan = {
      ...plan,
      id: this.generateId('plan'),
      steps: plan.steps.map((step, index) => ({
        ...step,
        id: this.generateId('step'),
        order: step.order ?? index,
      })),
      createdAt: now,
      updatedAt: now,
    };

    this.plans.set(newPlan.id, newPlan);
    return newPlan;
  }

  /**
   * Get a plan by ID
   */
  async get(planId: string): Promise<ExecutionPlan | null> {
    return this.plans.get(planId) ?? null;
  }

  /**
   * Get plans by user with optional filtering
   */
  async getByUser(
    userId: string,
    options?: PlanQueryOptions
  ): Promise<ExecutionPlan[]> {
    let plans = Array.from(this.plans.values()).filter(
      (plan) => plan.userId === userId
    );

    if (options?.status?.length) {
      plans = plans.filter((p) => options.status?.includes(p.status));
    }

    if (options?.goalId) {
      plans = plans.filter((p) => p.goalId === options.goalId);
    }

    // Sort by createdAt descending
    plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? plans.length;
    return plans.slice(offset, offset + limit);
  }

  /**
   * Get plans by goal
   */
  async getByGoal(goalId: string): Promise<ExecutionPlan[]> {
    return Array.from(this.plans.values()).filter(
      (plan) => plan.goalId === goalId
    );
  }

  /**
   * Update a plan
   */
  async update(
    planId: string,
    updates: Partial<ExecutionPlan>
  ): Promise<ExecutionPlan> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const updated: ExecutionPlan = {
      ...plan,
      ...updates,
      id: plan.id, // Preserve ID
      createdAt: plan.createdAt, // Preserve createdAt
      updatedAt: new Date(),
    };

    this.plans.set(planId, updated);
    return updated;
  }

  /**
   * Delete a plan
   */
  async delete(planId: string): Promise<void> {
    this.plans.delete(planId);
    this.states.delete(planId);
  }

  /**
   * Save plan state for resumability
   */
  async saveState(state: PlanState): Promise<void> {
    this.states.set(state.planId, state);
  }

  /**
   * Get saved plan state
   */
  async getState(planId: string): Promise<PlanState | null> {
    return this.states.get(planId) ?? null;
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
  async createCheckpoint(planId: string, stepId: string, name: string): Promise<Checkpoint> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const checkpoint: Checkpoint = {
      id: this.generateId('checkpoint'),
      planId,
      stepId,
      name,
      type: 'progress',
      achieved: false,
    };

    return checkpoint;
  }

  /**
   * Restore from checkpoint
   */
  async restoreCheckpoint(_checkpointId: string): Promise<PlanState | null> {
    // In-memory implementation doesn't persist checkpoints
    // Return null to indicate checkpoint not found
    return null;
  }

  /**
   * Update step status
   */
  async updateStep(
    planId: string,
    stepId: string,
    updates: Partial<PlanStep>
  ): Promise<PlanStep> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const stepIndex = plan.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) {
      throw new Error(`Step not found: ${stepId}`);
    }

    const updatedStep: PlanStep = {
      ...plan.steps[stepIndex],
      ...updates,
    };

    plan.steps[stepIndex] = updatedStep;
    plan.updatedAt = new Date();
    this.plans.set(planId, plan);

    return updatedStep;
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
    return this.update(planId, { status: PlanStatus.PAUSED });
  }

  /**
   * Complete a plan
   */
  async complete(planId: string): Promise<ExecutionPlan> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    return this.update(planId, {
      status: PlanStatus.COMPLETED,
      completedAt: new Date(),
    });
  }

  /**
   * Fail a plan
   */
  async fail(planId: string, _reason?: string): Promise<ExecutionPlan> {
    return this.update(planId, {
      status: PlanStatus.FAILED,
    });
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
