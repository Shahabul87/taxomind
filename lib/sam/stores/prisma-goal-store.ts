/**
 * Goal Store - Implements GoalStore interface from @sam-ai/agentic
 * Uses Prisma with SAMLearningGoal model for persistent storage
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  type GoalStore,
  type GoalQueryOptions,
  type LearningGoal,
  type CreateGoalInput,
  type UpdateGoalInput,
  GoalStatus,
} from '@sam-ai/agentic';

/**
 * Map Prisma enum values to agentic package types
 */
const mapPrismaPriority = (
  priority: string
): 'low' | 'medium' | 'high' | 'critical' => {
  const map: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  };
  return map[priority] || 'medium';
};

const mapPrismaStatus = (
  status: string
): 'draft' | 'active' | 'paused' | 'completed' | 'abandoned' => {
  const map: Record<
    string,
    'draft' | 'active' | 'paused' | 'completed' | 'abandoned'
  > = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
  };
  return map[status] || 'draft';
};

const mapPrismaMastery = (
  mastery: string | null
): 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | undefined => {
  if (!mastery) return undefined;
  const map: Record<
    string,
    'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  > = {
    NOVICE: 'novice',
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert',
  };
  return map[mastery];
};

const mapAgenticPriority = (
  priority: string
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  const map: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL',
  };
  return map[priority] || 'MEDIUM';
};

const mapAgenticStatus = (
  status: string
): 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED' => {
  const map: Record<
    string,
    'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED'
  > = {
    draft: 'DRAFT',
    active: 'ACTIVE',
    paused: 'PAUSED',
    completed: 'COMPLETED',
    abandoned: 'ABANDONED',
  };
  return map[status] || 'DRAFT';
};

const mapAgenticMastery = (
  mastery: string | undefined
): 'NOVICE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null => {
  if (!mastery) return null;
  const map: Record<
    string,
    'NOVICE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  > = {
    novice: 'NOVICE',
    beginner: 'BEGINNER',
    intermediate: 'INTERMEDIATE',
    advanced: 'ADVANCED',
    expert: 'EXPERT',
  };
  return map[mastery] || null;
};

/**
 * Convert Prisma goal to agentic LearningGoal type
 */
const toAgenticGoal = (prismaGoal: {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  priority: string;
  status: string;
  courseId: string | null;
  chapterId: string | null;
  sectionId: string | null;
  topicIds: string[];
  skillIds: string[];
  currentMastery: string | null;
  targetMastery: string | null;
  tags: string[];
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}): LearningGoal => ({
  id: prismaGoal.id,
  userId: prismaGoal.userId,
  title: prismaGoal.title,
  description: prismaGoal.description ?? undefined,
  targetDate: prismaGoal.targetDate ?? undefined,
  priority: mapPrismaPriority(prismaGoal.priority),
  status: mapPrismaStatus(prismaGoal.status),
  progress: 0, // Default progress value - Prisma model doesn't store progress
  context: {
    courseId: prismaGoal.courseId ?? undefined,
    chapterId: prismaGoal.chapterId ?? undefined,
    sectionId: prismaGoal.sectionId ?? undefined,
    topicIds: prismaGoal.topicIds,
    skillIds: prismaGoal.skillIds,
  },
  currentMastery: mapPrismaMastery(prismaGoal.currentMastery),
  targetMastery: mapPrismaMastery(prismaGoal.targetMastery),
  tags: prismaGoal.tags,
  metadata: prismaGoal.metadata as Record<string, unknown> | undefined,
  createdAt: prismaGoal.createdAt,
  updatedAt: prismaGoal.updatedAt,
  completedAt: prismaGoal.completedAt ?? undefined,
});

/**
 * Prisma implementation of GoalStore
 * Uses SAMLearningGoal model for persistent storage
 */
export class PrismaGoalStore implements GoalStore {
  /**
   * Create a new learning goal
   */
  async create(input: CreateGoalInput): Promise<LearningGoal> {
    const goal = await db.sAMLearningGoal.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        targetDate: input.targetDate,
        priority: mapAgenticPriority(input.priority ?? 'medium'),
        status: input.status ? mapAgenticStatus(input.status) : 'DRAFT',
        courseId: input.context?.courseId,
        chapterId: input.context?.chapterId,
        sectionId: input.context?.sectionId,
        topicIds: input.context?.topicIds ?? [],
        skillIds: input.context?.skillIds ?? [],
        currentMastery: mapAgenticMastery(input.currentMastery),
        targetMastery: mapAgenticMastery(input.targetMastery),
        tags: input.tags ?? [],
        metadata: input.metadata ?? Prisma.JsonNull,
      },
    });

    return toAgenticGoal(goal);
  }

  /**
   * Get a goal by ID
   */
  async get(goalId: string): Promise<LearningGoal | null> {
    const goal = await db.sAMLearningGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) return null;
    return toAgenticGoal(goal);
  }

  /**
   * Get goals by user with optional filtering
   */
  async getByUser(
    userId: string,
    options?: GoalQueryOptions
  ): Promise<LearningGoal[]> {
    const whereClause: Prisma.SAMLearningGoalWhereInput = { userId };

    if (options?.status?.length) {
      whereClause.status = {
        in: options.status.map((s) => mapAgenticStatus(s)),
      };
    }

    if (options?.priority?.length) {
      whereClause.priority = {
        in: options.priority.map((p) => mapAgenticPriority(p)),
      };
    }

    if (options?.courseId) {
      whereClause.courseId = options.courseId;
    }

    const goals = await db.sAMLearningGoal.findMany({
      where: whereClause,
      orderBy: {
        [options?.orderBy ?? 'createdAt']: options?.orderDir ?? 'desc',
      },
      skip: options?.offset ?? 0,
      take: options?.limit,
    });

    return goals.map(toAgenticGoal);
  }

  /**
   * Update a goal
   */
  async update(goalId: string, input: UpdateGoalInput): Promise<LearningGoal> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.targetDate !== undefined) updateData.targetDate = input.targetDate;
    if (input.priority !== undefined)
      updateData.priority = mapAgenticPriority(input.priority);
    if (input.status !== undefined)
      updateData.status = mapAgenticStatus(input.status);
    if (input.targetMastery !== undefined)
      updateData.targetMastery = mapAgenticMastery(input.targetMastery);
    if (input.tags !== undefined) updateData.tags = input.tags;

    // Handle context updates
    if (input.context) {
      if (input.context.courseId !== undefined)
        updateData.courseId = input.context.courseId;
      if (input.context.chapterId !== undefined)
        updateData.chapterId = input.context.chapterId;
      if (input.context.sectionId !== undefined)
        updateData.sectionId = input.context.sectionId;
      if (input.context.topicIds !== undefined)
        updateData.topicIds = input.context.topicIds;
      if (input.context.skillIds !== undefined)
        updateData.skillIds = input.context.skillIds;
    }

    const goal = await db.sAMLearningGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    return toAgenticGoal(goal);
  }

  /**
   * Delete a goal
   */
  async delete(goalId: string): Promise<void> {
    await db.sAMLearningGoal.delete({
      where: { id: goalId },
    });
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
    const goal = await db.sAMLearningGoal.update({
      where: { id: goalId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return toAgenticGoal(goal);
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
