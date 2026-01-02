/**
 * @sam-ai/agentic - Agent State Machine
 * Resumable state machine for plan execution with persistence
 */

import type { SAMLogger } from '@sam-ai/core';
import {
  type ExecutionPlan,
  type PlanStep,
  type PlanState,
  type ExecutionContext,
  type StepResult,
  type FallbackAction,
  type PlanStore,
  PlanStatus,
  StepStatus,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AgentStateMachineConfig {
  planStore: PlanStore;
  logger?: SAMLogger;
  autoSaveInterval?: number; // milliseconds
  maxStepRetries?: number;
}

// ============================================================================
// STATE MACHINE EVENTS
// ============================================================================

export type StateMachineEvent =
  | { type: 'START'; plan: ExecutionPlan }
  | { type: 'PAUSE'; reason?: string }
  | { type: 'RESUME' }
  | { type: 'ABORT'; reason: string }
  | { type: 'STEP_COMPLETE'; stepId: string; result: StepResult }
  | { type: 'STEP_FAILED'; stepId: string; error: Error }
  | { type: 'STEP_SKIP'; stepId: string; reason: string }
  | { type: 'UPDATE_CONTEXT'; context: Partial<ExecutionContext> }
  | { type: 'CHECKPOINT'; data: Record<string, unknown> };

export type StateMachineState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'waiting_for_input'
  | 'completed'
  | 'failed'
  | 'aborted';

// ============================================================================
// STATE MACHINE LISTENER
// ============================================================================

export interface StateMachineListener {
  onStateChange?: (from: StateMachineState, to: StateMachineState) => void;
  onStepStart?: (step: PlanStep) => void;
  onStepComplete?: (step: PlanStep, result: StepResult) => void;
  onStepFailed?: (step: PlanStep, error: Error) => void;
  onPlanComplete?: (plan: ExecutionPlan) => void;
  onPlanFailed?: (plan: ExecutionPlan, error: Error) => void;
  onCheckpoint?: (state: PlanState) => void;
}

// ============================================================================
// AGENT STATE MACHINE
// ============================================================================

export class AgentStateMachine {
  private readonly planStore: PlanStore;
  private readonly logger: SAMLogger;
  private readonly autoSaveInterval: number;
  private readonly maxStepRetries: number;

  private currentState: StateMachineState = 'idle';
  private currentPlan: ExecutionPlan | null = null;
  private planState: PlanState | null = null;
  private listeners: StateMachineListener[] = [];
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private stepExecutor: StepExecutorFunction | null = null;

  constructor(config: AgentStateMachineConfig) {
    this.planStore = config.planStore;
    this.logger = config.logger ?? console;
    this.autoSaveInterval = config.autoSaveInterval ?? 30000; // 30 seconds
    this.maxStepRetries = config.maxStepRetries ?? 3;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get current state
   */
  getState(): StateMachineState {
    return this.currentState;
  }

  /**
   * Get current plan state (for resumability)
   */
  getPlanState(): PlanState | null {
    return this.planState;
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): ExecutionPlan | null {
    return this.currentPlan;
  }

  /**
   * Set the step executor function
   */
  setStepExecutor(executor: StepExecutorFunction): void {
    this.stepExecutor = executor;
  }

  /**
   * Add a listener
   */
  addListener(listener: StateMachineListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: StateMachineListener): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Start executing a plan
   */
  async start(plan: ExecutionPlan): Promise<void> {
    if (this.currentState !== 'idle') {
      throw new Error(`Cannot start: state machine is in '${this.currentState}' state`);
    }

    this.logger.debug?.(`[StateMachine] Starting plan: ${plan.id}`);

    this.currentPlan = plan;
    this.planState = this.initializePlanState(plan);

    // Update plan status
    plan.status = PlanStatus.ACTIVE;
    plan.startDate = new Date();
    await this.planStore.update(plan.id, { status: PlanStatus.ACTIVE, startDate: plan.startDate });

    this.transitionTo('running');
    this.startAutoSave();

    // Begin execution
    await this.executeNextStep();
  }

  /**
   * Pause execution
   */
  async pause(reason?: string): Promise<PlanState> {
    if (this.currentState !== 'running' && this.currentState !== 'waiting_for_input') {
      throw new Error(`Cannot pause: state machine is in '${this.currentState}' state`);
    }

    this.logger.debug?.(`[StateMachine] Pausing: ${reason ?? 'user requested'}`);

    this.planState!.pausedAt = new Date();
    await this.saveState();
    this.stopAutoSave();

    // Update plan status
    if (this.currentPlan) {
      this.currentPlan.status = PlanStatus.PAUSED;
      this.currentPlan.pausedAt = new Date();
      await this.planStore.update(this.currentPlan.id, {
        status: PlanStatus.PAUSED,
        pausedAt: this.currentPlan.pausedAt,
      });
    }

    this.transitionTo('paused');
    return this.planState!;
  }

  /**
   * Resume execution from saved state
   */
  async resume(savedState?: PlanState): Promise<void> {
    const state = savedState ?? this.planState;

    if (!state) {
      throw new Error('No state to resume from');
    }

    if (this.currentState !== 'paused' && this.currentState !== 'idle') {
      throw new Error(`Cannot resume: state machine is in '${this.currentState}' state`);
    }

    this.logger.debug?.(`[StateMachine] Resuming plan: ${state.planId}`);

    // Load plan if not already loaded
    if (!this.currentPlan || this.currentPlan.id !== state.planId) {
      const plan = await this.planStore.get(state.planId);
      if (!plan) {
        throw new Error(`Plan not found: ${state.planId}`);
      }
      this.currentPlan = plan;
    }

    // Restore state
    this.planState = {
      ...state,
      pausedAt: undefined,
      lastActiveAt: new Date(),
    };

    // Update plan status
    this.currentPlan.status = PlanStatus.ACTIVE;
    await this.planStore.update(this.currentPlan.id, { status: PlanStatus.ACTIVE });

    this.transitionTo('running');
    this.startAutoSave();

    // Continue execution
    await this.executeNextStep();
  }

  /**
   * Abort execution
   */
  async abort(reason: string): Promise<void> {
    this.logger.debug?.(`[StateMachine] Aborting: ${reason}`);

    this.stopAutoSave();

    if (this.currentPlan) {
      this.currentPlan.status = PlanStatus.CANCELLED;
      await this.planStore.update(this.currentPlan.id, { status: PlanStatus.CANCELLED });
    }

    this.transitionTo('aborted');
    this.cleanup();
  }

  /**
   * Load saved state
   */
  async loadState(planId: string): Promise<PlanState | null> {
    return this.planStore.loadState(planId);
  }

  /**
   * Save current state
   */
  async saveState(): Promise<void> {
    if (!this.planState) return;

    this.planState.lastActiveAt = new Date();
    await this.planStore.saveState(this.planState);
    this.notifyCheckpoint(this.planState);

    this.logger.debug?.(`[StateMachine] State saved for plan: ${this.planState.planId}`);
  }

  /**
   * Complete a step manually (for external step execution)
   */
  async completeStep(stepId: string, result: StepResult): Promise<void> {
    await this.handleEvent({ type: 'STEP_COMPLETE', stepId, result });
  }

  /**
   * Fail a step manually
   */
  async failStep(stepId: string, error: Error): Promise<void> {
    await this.handleEvent({ type: 'STEP_FAILED', stepId, error });
  }

  /**
   * Skip a step
   */
  async skipStep(stepId: string, reason: string): Promise<void> {
    await this.handleEvent({ type: 'STEP_SKIP', stepId, reason });
  }

  /**
   * Update execution context
   */
  async updateContext(context: Partial<ExecutionContext>): Promise<void> {
    await this.handleEvent({ type: 'UPDATE_CONTEXT', context });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async handleEvent(event: StateMachineEvent): Promise<void> {
    switch (event.type) {
      case 'START':
        await this.start(event.plan);
        break;

      case 'PAUSE':
        await this.pause(event.reason);
        break;

      case 'RESUME':
        await this.resume();
        break;

      case 'ABORT':
        await this.abort(event.reason);
        break;

      case 'STEP_COMPLETE':
        await this.handleStepComplete(event.stepId, event.result);
        break;

      case 'STEP_FAILED':
        await this.handleStepFailed(event.stepId, event.error);
        break;

      case 'STEP_SKIP':
        await this.handleStepSkip(event.stepId, event.reason);
        break;

      case 'UPDATE_CONTEXT':
        this.updateExecutionContext(event.context);
        break;

      case 'CHECKPOINT':
        this.planState!.checkpointData = {
          ...this.planState!.checkpointData,
          ...event.data,
        };
        await this.saveState();
        break;
    }
  }

  private async executeNextStep(): Promise<void> {
    if (!this.currentPlan || !this.planState) return;
    if (this.currentState !== 'running') return;

    // Find next pending step
    const nextStep = this.currentPlan.steps.find(
      (s) => s.status === StepStatus.PENDING
    );

    if (!nextStep) {
      // All steps completed
      await this.handlePlanComplete();
      return;
    }

    // Update current step
    this.planState.currentStepId = nextStep.id;
    nextStep.status = StepStatus.IN_PROGRESS;
    nextStep.startedAt = new Date();

    await this.planStore.updateStep(this.currentPlan.id, nextStep.id, {
      status: StepStatus.IN_PROGRESS,
      startedAt: nextStep.startedAt,
    });

    this.notifyStepStart(nextStep);

    // Execute step if executor is set
    if (this.stepExecutor) {
      try {
        const result = await this.stepExecutor(nextStep, this.planState.context);
        await this.handleStepComplete(nextStep.id, result);
      } catch (error) {
        await this.handleStepFailed(nextStep.id, error as Error);
      }
    } else {
      // Wait for external completion
      this.transitionTo('waiting_for_input');
    }
  }

  private async handleStepComplete(stepId: string, result: StepResult): Promise<void> {
    if (!this.currentPlan || !this.planState) return;

    const step = this.currentPlan.steps.find((s) => s.id === stepId);
    if (!step) return;

    // Update step
    step.status = StepStatus.COMPLETED;
    step.completedAt = result.completedAt;
    step.actualMinutes = result.duration;
    step.outputs = result.outputs;

    await this.planStore.updateStep(this.currentPlan.id, stepId, {
      status: StepStatus.COMPLETED,
      completedAt: step.completedAt,
      actualMinutes: step.actualMinutes,
      outputs: step.outputs,
    });

    // Update plan state
    this.planState.completedSteps.push(stepId);
    this.planState.currentStepId = null;
    this.planState.currentStepProgress = 0;
    this.planState.totalActiveTime += result.duration;

    // Update overall progress
    const totalSteps = this.currentPlan.steps.length;
    const completedSteps = this.planState.completedSteps.length;
    this.currentPlan.overallProgress = Math.round((completedSteps / totalSteps) * 100);

    await this.planStore.update(this.currentPlan.id, {
      overallProgress: this.currentPlan.overallProgress,
    });

    // Check checkpoints
    await this.checkCheckpoints(stepId);

    this.notifyStepComplete(step, result);

    // Continue to next step
    if (this.currentState === 'running' || this.currentState === 'waiting_for_input') {
      this.transitionTo('running');
      await this.executeNextStep();
    }
  }

  private async handleStepFailed(stepId: string, error: Error): Promise<void> {
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
      // Retry the step
      step.status = StepStatus.PENDING;
      await this.planStore.updateStep(this.currentPlan.id, stepId, {
        status: StepStatus.PENDING,
        retryCount: step.retryCount,
        lastError: step.lastError,
      });

      // Apply fallback strategy
      const fallback = this.selectFallbackStrategy('step_failed');
      if (fallback) {
        await this.applyFallbackAction(fallback, step);
      }

      // Continue execution after a brief delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.executeNextStep();
    } else {
      // Max retries exceeded
      step.status = StepStatus.FAILED;
      this.planState.failedSteps.push(stepId);

      await this.planStore.updateStep(this.currentPlan.id, stepId, {
        status: StepStatus.FAILED,
        retryCount: step.retryCount,
        lastError: step.lastError,
      });

      this.notifyStepFailed(step, error);

      // Check if we should continue or fail the plan
      const criticalFailure = this.isCriticalFailure(step);
      if (criticalFailure) {
        await this.handlePlanFailed(error);
      } else {
        // Skip failed step and continue
        await this.executeNextStep();
      }
    }
  }

  private async handleStepSkip(stepId: string, reason: string): Promise<void> {
    if (!this.currentPlan || !this.planState) return;

    const step = this.currentPlan.steps.find((s) => s.id === stepId);
    if (!step) return;

    step.status = StepStatus.SKIPPED;
    step.metadata = { ...step.metadata, skipReason: reason };
    this.planState.skippedSteps.push(stepId);

    await this.planStore.updateStep(this.currentPlan.id, stepId, {
      status: StepStatus.SKIPPED,
      metadata: step.metadata,
    });

    // Continue to next step
    await this.executeNextStep();
  }

  private async handlePlanComplete(): Promise<void> {
    if (!this.currentPlan) return;

    this.logger.debug?.(`[StateMachine] Plan completed: ${this.currentPlan.id}`);

    this.currentPlan.status = PlanStatus.COMPLETED;
    this.currentPlan.completedAt = new Date();
    this.currentPlan.overallProgress = 100;

    await this.planStore.update(this.currentPlan.id, {
      status: PlanStatus.COMPLETED,
      completedAt: this.currentPlan.completedAt,
      overallProgress: 100,
    });

    this.stopAutoSave();
    this.transitionTo('completed');
    this.notifyPlanComplete(this.currentPlan);
    this.cleanup();
  }

  private async handlePlanFailed(error: Error): Promise<void> {
    if (!this.currentPlan) return;

    this.logger.error?.(`[StateMachine] Plan failed: ${this.currentPlan.id} - ${error.message}`);

    this.currentPlan.status = PlanStatus.FAILED;

    await this.planStore.update(this.currentPlan.id, {
      status: PlanStatus.FAILED,
    });

    this.stopAutoSave();
    this.transitionTo('failed');
    this.notifyPlanFailed(this.currentPlan, error);
    this.cleanup();
  }

  private async checkCheckpoints(completedStepId: string): Promise<void> {
    if (!this.currentPlan) return;

    for (const checkpoint of this.currentPlan.checkpoints) {
      if (checkpoint.stepId === completedStepId && !checkpoint.achieved) {
        checkpoint.achieved = true;
        checkpoint.achievedAt = new Date();

        this.logger.debug?.(`[StateMachine] Checkpoint achieved: ${checkpoint.name}`);
      }
    }
  }

  private selectFallbackStrategy(triggerType: string): FallbackAction | null {
    if (!this.currentPlan) return null;

    const applicable = this.currentPlan.fallbackStrategies
      .filter((f) => f.trigger.type === triggerType)
      .sort((a, b) => a.priority - b.priority);

    return applicable[0]?.action ?? null;
  }

  private async applyFallbackAction(action: FallbackAction, step: PlanStep): Promise<void> {
    this.logger.debug?.(`[StateMachine] Applying fallback: ${action.type}`);

    switch (action.type) {
      case 'simplify':
        step.metadata = { ...step.metadata, simplified: true };
        break;
      case 'add_support':
        step.metadata = { ...step.metadata, additionalSupport: true };
        break;
      // Other actions handled by external systems
    }
  }

  private isCriticalFailure(step: PlanStep): boolean {
    // A failure is critical if it's an assessment or has no alternatives
    return step.type === 'take_quiz' || step.type === 'complete_exercise';
  }

  private updateExecutionContext(context: Partial<ExecutionContext>): void {
    if (!this.planState) return;
    this.planState.context = { ...this.planState.context, ...context };
  }

  private initializePlanState(plan: ExecutionPlan): PlanState {
    return {
      planId: plan.id,
      goalId: plan.goalId,
      userId: plan.userId,
      currentStepId: null,
      currentStepProgress: 0,
      completedSteps: [],
      failedSteps: [],
      skippedSteps: [],
      startedAt: new Date(),
      lastActiveAt: new Date(),
      totalActiveTime: 0,
      context: {
        recentTopics: [],
        strugglingConcepts: [],
        masteredConcepts: [],
      },
      checkpointData: {},
      sessionCount: 1,
      currentSessionStart: new Date(),
    };
  }

  private transitionTo(newState: StateMachineState): void {
    const oldState = this.currentState;
    this.currentState = newState;

    this.logger.debug?.(`[StateMachine] State: ${oldState} -> ${newState}`);

    for (const listener of this.listeners) {
      listener.onStateChange?.(oldState, newState);
    }
  }

  private startAutoSave(): void {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.saveState().catch((err) => {
        this.logger.error?.(`[StateMachine] Auto-save failed: ${err.message}`);
      });
    }, this.autoSaveInterval);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private cleanup(): void {
    this.stopAutoSave();
    this.currentPlan = null;
    this.planState = null;
  }

  // ============================================================================
  // NOTIFICATION HELPERS
  // ============================================================================

  private notifyStepStart(step: PlanStep): void {
    for (const listener of this.listeners) {
      listener.onStepStart?.(step);
    }
  }

  private notifyStepComplete(step: PlanStep, result: StepResult): void {
    for (const listener of this.listeners) {
      listener.onStepComplete?.(step, result);
    }
  }

  private notifyStepFailed(step: PlanStep, error: Error): void {
    for (const listener of this.listeners) {
      listener.onStepFailed?.(step, error);
    }
  }

  private notifyPlanComplete(plan: ExecutionPlan): void {
    for (const listener of this.listeners) {
      listener.onPlanComplete?.(plan);
    }
  }

  private notifyPlanFailed(plan: ExecutionPlan, error: Error): void {
    for (const listener of this.listeners) {
      listener.onPlanFailed?.(plan, error);
    }
  }

  private notifyCheckpoint(state: PlanState): void {
    for (const listener of this.listeners) {
      listener.onCheckpoint?.(state);
    }
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export type StepExecutorFunction = (
  step: PlanStep,
  context: ExecutionContext
) => Promise<StepResult>;

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAgentStateMachine(config: AgentStateMachineConfig): AgentStateMachine {
  return new AgentStateMachine(config);
}
