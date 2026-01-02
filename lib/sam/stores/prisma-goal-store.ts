/**
 * Goal Store - Implements GoalStore interface from @sam-ai/agentic
 * Uses in-memory storage until SAMLearningGoal Prisma model is added
 * TODO: Convert to Prisma when model is added to schema
 */

import {
  type GoalStore,
  type GoalQueryOptions,
  type LearningGoal,
  type CreateGoalInput,
  type UpdateGoalInput,
  GoalStatus,
} from '@sam-ai/agentic';

/**
 * In-memory implementation of GoalStore
 * Stores goals in memory for now - will be replaced with Prisma when model exists
 */
export class PrismaGoalStore implements GoalStore {
  private goals: Map<string, LearningGoal> = new Map();

  private generateId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Create a new learning goal
   */
  async create(input: CreateGoalInput): Promise<LearningGoal> {
    const now = new Date();
    const goal: LearningGoal = {
      id: this.generateId(),
      userId: input.userId,
      title: input.title,
      description: input.description,
      targetDate: input.targetDate,
      priority: input.priority ?? 'medium',
      status: GoalStatus.DRAFT,
      context: {
        courseId: input.context?.courseId,
        chapterId: input.context?.chapterId,
        sectionId: input.context?.sectionId,
        topicIds: input.context?.topicIds ?? [],
        skillIds: input.context?.skillIds ?? [],
      },
      currentMastery: input.currentMastery,
      targetMastery: input.targetMastery,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.goals.set(goal.id, goal);
    return goal;
  }

  /**
   * Get a goal by ID
   */
  async get(goalId: string): Promise<LearningGoal | null> {
    return this.goals.get(goalId) ?? null;
  }

  /**
   * Get goals by user with optional filtering
   */
  async getByUser(
    userId: string,
    options?: GoalQueryOptions
  ): Promise<LearningGoal[]> {
    let goals = Array.from(this.goals.values()).filter(
      (goal) => goal.userId === userId
    );

    if (options?.status?.length) {
      goals = goals.filter((g) => options.status?.includes(g.status));
    }

    if (options?.priority?.length) {
      goals = goals.filter((g) => options.priority?.includes(g.priority));
    }

    if (options?.courseId) {
      goals = goals.filter((g) => g.context.courseId === options.courseId);
    }

    // Sort
    const orderBy = options?.orderBy ?? 'createdAt';
    const orderDir = options?.orderDir ?? 'desc';
    goals.sort((a, b) => {
      const aVal = a[orderBy as keyof LearningGoal];
      const bVal = b[orderBy as keyof LearningGoal];
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return orderDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return orderDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? goals.length;
    return goals.slice(offset, offset + limit);
  }

  /**
   * Update a goal
   */
  async update(goalId: string, input: UpdateGoalInput): Promise<LearningGoal> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    const updated: LearningGoal = {
      ...goal,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.targetDate !== undefined && { targetDate: input.targetDate }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.targetMastery !== undefined && {
        targetMastery: input.targetMastery,
      }),
      ...(input.tags !== undefined && { tags: input.tags }),
      context: {
        ...goal.context,
        ...(input.context?.courseId !== undefined && {
          courseId: input.context.courseId,
        }),
        ...(input.context?.chapterId !== undefined && {
          chapterId: input.context.chapterId,
        }),
        ...(input.context?.sectionId !== undefined && {
          sectionId: input.context.sectionId,
        }),
        ...(input.context?.topicIds !== undefined && {
          topicIds: input.context.topicIds,
        }),
        ...(input.context?.skillIds !== undefined && {
          skillIds: input.context.skillIds,
        }),
      },
      updatedAt: new Date(),
    };

    this.goals.set(goalId, updated);
    return updated;
  }

  /**
   * Delete a goal
   */
  async delete(goalId: string): Promise<void> {
    this.goals.delete(goalId);
  }

  /**
   * Activate a goal (set status to ACTIVE)
   */
  async activate(goalId: string): Promise<LearningGoal> {
    return this.update(goalId, { status: GoalStatus.ACTIVE });
  }

  /**
   * Pause a goal
   */
  async pause(goalId: string): Promise<LearningGoal> {
    return this.update(goalId, { status: GoalStatus.PAUSED });
  }

  /**
   * Complete a goal
   */
  async complete(goalId: string): Promise<LearningGoal> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    const updated: LearningGoal = {
      ...goal,
      status: GoalStatus.COMPLETED,
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    this.goals.set(goalId, updated);
    return updated;
  }

  /**
   * Abandon a goal
   */
  async abandon(goalId: string, _reason?: string): Promise<LearningGoal> {
    return this.update(goalId, { status: GoalStatus.ABANDONED });
  }
}

/**
 * Factory function to create a PrismaGoalStore
 */
export function createPrismaGoalStore(): PrismaGoalStore {
  return new PrismaGoalStore();
}
