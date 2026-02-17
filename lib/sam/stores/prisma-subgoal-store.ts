/**
 * SubGoal Store - Implements SubGoalStore interface from @sam-ai/agentic
 * Uses Prisma with SAMSubGoal model for persistent storage
 */

import { getDb } from './db-provider';
import { Prisma } from '@prisma/client';
import {
  type SubGoalStore,
  type SubGoalQueryOptions,
  type SubGoal,
  type CreateSubGoalInput,
  type UpdateSubGoalInput,
  SubGoalType,
  StepStatus,
} from '@sam-ai/agentic';

/**
 * Map Prisma enum values to agentic package types
 */
const mapPrismaType = (type: string): SubGoalType => {
  const map: Record<string, SubGoalType> = {
    LEARN: SubGoalType.LEARN,
    PRACTICE: SubGoalType.PRACTICE,
    ASSESS: SubGoalType.ASSESS,
    REVIEW: SubGoalType.REVIEW,
    REFLECT: SubGoalType.REFLECT,
    CREATE: SubGoalType.CREATE,
  };
  return map[type] || SubGoalType.LEARN;
};

const mapPrismaDifficulty = (
  difficulty: string
): 'easy' | 'medium' | 'hard' => {
  const map: Record<string, 'easy' | 'medium' | 'hard'> = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
  };
  return map[difficulty] || 'medium';
};

const mapPrismaStatus = (status: string): StepStatus => {
  const map: Record<string, StepStatus> = {
    PENDING: StepStatus.PENDING,
    IN_PROGRESS: StepStatus.IN_PROGRESS,
    COMPLETED: StepStatus.COMPLETED,
    FAILED: StepStatus.FAILED,
    SKIPPED: StepStatus.SKIPPED,
    BLOCKED: StepStatus.BLOCKED,
  };
  return map[status] || StepStatus.PENDING;
};

const mapAgenticType = (
  type: SubGoalType
): 'LEARN' | 'PRACTICE' | 'ASSESS' | 'REVIEW' | 'REFLECT' | 'CREATE' => {
  const map: Record<
    string,
    'LEARN' | 'PRACTICE' | 'ASSESS' | 'REVIEW' | 'REFLECT' | 'CREATE'
  > = {
    learn: 'LEARN',
    practice: 'PRACTICE',
    assess: 'ASSESS',
    review: 'REVIEW',
    reflect: 'REFLECT',
    create: 'CREATE',
  };
  return map[type] || 'LEARN';
};

const mapAgenticDifficulty = (
  difficulty: string
): 'EASY' | 'MEDIUM' | 'HARD' => {
  const map: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
  };
  return map[difficulty] || 'MEDIUM';
};

const mapAgenticStatus = (
  status: StepStatus
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

/**
 * Convert Prisma subgoal to agentic SubGoal type
 */
const toAgenticSubGoal = (prismaSubGoal: {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  type: string;
  order: number;
  estimatedMinutes: number;
  difficulty: string;
  prerequisites: string[];
  successCriteria: string[];
  status: string;
  completedAt: Date | null;
  metadata: unknown;
}): SubGoal => ({
  id: prismaSubGoal.id,
  goalId: prismaSubGoal.goalId,
  title: prismaSubGoal.title,
  description: prismaSubGoal.description ?? undefined,
  type: mapPrismaType(prismaSubGoal.type),
  order: prismaSubGoal.order,
  estimatedMinutes: prismaSubGoal.estimatedMinutes,
  difficulty: mapPrismaDifficulty(prismaSubGoal.difficulty),
  prerequisites: prismaSubGoal.prerequisites,
  successCriteria: prismaSubGoal.successCriteria,
  status: mapPrismaStatus(prismaSubGoal.status),
  completedAt: prismaSubGoal.completedAt ?? undefined,
  metadata: prismaSubGoal.metadata as Record<string, unknown> | undefined,
});

/**
 * Prisma implementation of SubGoalStore
 * Uses SAMSubGoal model for persistent storage
 */
export class PrismaSubGoalStore implements SubGoalStore {
  /**
   * Create a new sub-goal
   */
  async create(input: CreateSubGoalInput): Promise<SubGoal> {
    const subGoal = await getDb().sAMSubGoal.create({
      data: {
        goalId: input.goalId,
        title: input.title,
        description: input.description,
        type: mapAgenticType(input.type),
        order: input.order,
        estimatedMinutes: input.estimatedMinutes,
        difficulty: mapAgenticDifficulty(input.difficulty),
        prerequisites: input.prerequisites ?? [],
        successCriteria: input.successCriteria ?? [],
        status: 'PENDING',
        metadata: input.metadata ?? {},
      },
    });

    return toAgenticSubGoal(subGoal);
  }

  /**
   * Create multiple sub-goals at once
   */
  async createMany(inputs: CreateSubGoalInput[]): Promise<SubGoal[]> {
    // Use transaction to ensure all or nothing
    const subGoals = await getDb().$transaction(
      inputs.map((input) =>
        getDb().sAMSubGoal.create({
          data: {
            goalId: input.goalId,
            title: input.title,
            description: input.description,
            type: mapAgenticType(input.type),
            order: input.order,
            estimatedMinutes: input.estimatedMinutes,
            difficulty: mapAgenticDifficulty(input.difficulty),
            prerequisites: input.prerequisites ?? [],
            successCriteria: input.successCriteria ?? [],
            status: 'PENDING',
            metadata: input.metadata ?? {},
          },
        })
      )
    );

    return subGoals.map(toAgenticSubGoal);
  }

  /**
   * Get a sub-goal by ID
   */
  async get(subGoalId: string): Promise<SubGoal | null> {
    const subGoal = await getDb().sAMSubGoal.findUnique({
      where: { id: subGoalId },
    });

    if (!subGoal) return null;
    return toAgenticSubGoal(subGoal);
  }

  /**
   * Get sub-goals by goal with optional filtering
   */
  async getByGoal(
    goalId: string,
    options?: SubGoalQueryOptions
  ): Promise<SubGoal[]> {
    const whereClause: Prisma.SAMSubGoalWhereInput = { goalId };

    if (options?.status?.length) {
      whereClause.status = {
        in: options.status.map((s) => mapAgenticStatus(s)),
      };
    }

    if (options?.type?.length) {
      whereClause.type = {
        in: options.type.map((t) => mapAgenticType(t)),
      };
    }

    const subGoals = await getDb().sAMSubGoal.findMany({
      where: whereClause,
      orderBy: {
        [options?.orderBy ?? 'order']: options?.orderDir ?? 'asc',
      },
      skip: options?.offset ?? 0,
      take: options?.limit,
    });

    return subGoals.map(toAgenticSubGoal);
  }

  /**
   * Update a sub-goal
   */
  async update(subGoalId: string, input: UpdateSubGoalInput): Promise<SubGoal> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.type !== undefined) updateData.type = mapAgenticType(input.type);
    if (input.order !== undefined) updateData.order = input.order;
    if (input.estimatedMinutes !== undefined)
      updateData.estimatedMinutes = input.estimatedMinutes;
    if (input.difficulty !== undefined)
      updateData.difficulty = mapAgenticDifficulty(input.difficulty);
    if (input.prerequisites !== undefined)
      updateData.prerequisites = input.prerequisites;
    if (input.successCriteria !== undefined)
      updateData.successCriteria = input.successCriteria;
    if (input.status !== undefined)
      updateData.status = mapAgenticStatus(input.status);
    if (input.completedAt !== undefined)
      updateData.completedAt = input.completedAt;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const subGoal = await getDb().sAMSubGoal.update({
      where: { id: subGoalId },
      data: updateData,
    });

    return toAgenticSubGoal(subGoal);
  }

  /**
   * Delete a sub-goal
   */
  async delete(subGoalId: string): Promise<void> {
    await getDb().sAMSubGoal.delete({
      where: { id: subGoalId },
    });
  }

  /**
   * Delete all sub-goals for a goal
   */
  async deleteByGoal(goalId: string): Promise<void> {
    await getDb().sAMSubGoal.deleteMany({
      where: { goalId },
    });
  }

  /**
   * Mark a sub-goal as complete
   */
  async markComplete(subGoalId: string): Promise<SubGoal> {
    const subGoal = await getDb().sAMSubGoal.update({
      where: { id: subGoalId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return toAgenticSubGoal(subGoal);
  }

  /**
   * Mark a sub-goal as failed
   */
  async markFailed(subGoalId: string): Promise<SubGoal> {
    const subGoal = await getDb().sAMSubGoal.update({
      where: { id: subGoalId },
      data: {
        status: 'FAILED',
      },
    });

    return toAgenticSubGoal(subGoal);
  }

  /**
   * Mark a sub-goal as skipped
   */
  async markSkipped(subGoalId: string): Promise<SubGoal> {
    const subGoal = await getDb().sAMSubGoal.update({
      where: { id: subGoalId },
      data: {
        status: 'SKIPPED',
      },
    });

    return toAgenticSubGoal(subGoal);
  }
}

/**
 * Factory function to create a PrismaSubGoalStore
 */
export function createPrismaSubGoalStore(): PrismaSubGoalStore {
  return new PrismaSubGoalStore();
}
