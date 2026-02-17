/**
 * Prisma Microlearning Store Adapter
 * Provides database persistence for SAM Microlearning Engine
 */

import { getDb, type PrismaClient } from './db-provider';
import type { SAMMicrolessonStatus, SAMDifficulty } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface Microlesson {
  id: string;
  userId: string;
  topicId: string;
  title: string;
  description: string | null;
  duration: number;
  content: MicrolessonContent;
  learningObjectives: string[];
  status: SAMMicrolessonStatus;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  xpReward: number;
  streakBonus: number;
  courseId: string | null;
  chapterId: string | null;
  difficulty: SAMDifficulty;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MicrolessonContent {
  type: 'video' | 'text' | 'quiz' | 'interactive' | 'flashcard';
  data: string;
  mediaUrl?: string;
  questions?: MicrolessonQuestion[];
}

export interface MicrolessonQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface CreateMicrolessonInput {
  userId: string;
  topicId: string;
  title: string;
  description?: string;
  duration: number;
  content: MicrolessonContent;
  learningObjectives: string[];
  xpReward?: number;
  courseId?: string;
  chapterId?: string;
  difficulty?: SAMDifficulty;
  tags?: string[];
}

export interface MicrolearningStore {
  create(input: CreateMicrolessonInput): Promise<Microlesson>;
  getById(id: string): Promise<Microlesson | null>;
  getByUserId(userId: string, limit?: number): Promise<Microlesson[]>;
  getByTopic(userId: string, topicId: string): Promise<Microlesson[]>;
  getInProgress(userId: string): Promise<Microlesson[]>;
  getCompleted(userId: string, limit?: number): Promise<Microlesson[]>;
  updateProgress(id: string, progress: number): Promise<Microlesson>;
  complete(id: string, streakBonus?: number): Promise<Microlesson>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// PRISMA MICROLEARNING STORE
// ============================================================================

export class PrismaMicrolearningStore implements MicrolearningStore {
  /**
   * Create a new microlesson
   */
  async create(input: CreateMicrolessonInput): Promise<Microlesson> {
    const microlesson = await getDb().sAMMicrolesson.create({
      data: {
        userId: input.userId,
        topicId: input.topicId,
        title: input.title,
        description: input.description ?? null,
        duration: input.duration,
        content: input.content as unknown as Record<string, unknown>,
        learningObjectives: input.learningObjectives,
        status: 'NOT_STARTED',
        progress: 0,
        xpReward: input.xpReward ?? 10,
        streakBonus: 0,
        courseId: input.courseId ?? null,
        chapterId: input.chapterId ?? null,
        difficulty: input.difficulty ?? 'MEDIUM',
        tags: input.tags ?? [],
        metadata: {},
      },
    });

    return this.mapToMicrolesson(microlesson);
  }

  /**
   * Get a microlesson by ID
   */
  async getById(id: string): Promise<Microlesson | null> {
    const microlesson = await getDb().sAMMicrolesson.findUnique({
      where: { id },
    });

    return microlesson ? this.mapToMicrolesson(microlesson) : null;
  }

  /**
   * Get all microlessons for a user
   */
  async getByUserId(userId: string, limit: number = 20): Promise<Microlesson[]> {
    const microlessons = await getDb().sAMMicrolesson.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return microlessons.map((m) => this.mapToMicrolesson(m));
  }

  /**
   * Get microlessons for a specific topic
   */
  async getByTopic(userId: string, topicId: string): Promise<Microlesson[]> {
    const microlessons = await getDb().sAMMicrolesson.findMany({
      where: { userId, topicId },
      orderBy: { createdAt: 'desc' },
    });

    return microlessons.map((m) => this.mapToMicrolesson(m));
  }

  /**
   * Get in-progress microlessons
   */
  async getInProgress(userId: string): Promise<Microlesson[]> {
    const microlessons = await getDb().sAMMicrolesson.findMany({
      where: { userId, status: 'IN_PROGRESS' },
      orderBy: { startedAt: 'desc' },
    });

    return microlessons.map((m) => this.mapToMicrolesson(m));
  }

  /**
   * Get completed microlessons
   */
  async getCompleted(userId: string, limit: number = 20): Promise<Microlesson[]> {
    const microlessons = await getDb().sAMMicrolesson.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    return microlessons.map((m) => this.mapToMicrolesson(m));
  }

  /**
   * Update microlesson progress
   */
  async updateProgress(id: string, progress: number): Promise<Microlesson> {
    const clampedProgress = Math.max(0, Math.min(100, progress));

    const microlesson = await getDb().sAMMicrolesson.update({
      where: { id },
      data: {
        progress: clampedProgress,
        status: clampedProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        startedAt: clampedProgress > 0 ? new Date() : undefined,
      },
    });

    return this.mapToMicrolesson(microlesson);
  }

  /**
   * Mark microlesson as completed
   */
  async complete(id: string, streakBonus: number = 0): Promise<Microlesson> {
    const microlesson = await getDb().sAMMicrolesson.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
        streakBonus,
      },
    });

    return this.mapToMicrolesson(microlesson);
  }

  /**
   * Delete a microlesson
   */
  async delete(id: string): Promise<void> {
    await getDb().sAMMicrolesson.delete({
      where: { id },
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapToMicrolesson(
    record: Awaited<ReturnType<PrismaClient['sAMMicrolesson']['findUnique']>>
  ): Microlesson {
    if (!record) {
      throw new Error('Microlesson record is null');
    }

    return {
      id: record.id,
      userId: record.userId,
      topicId: record.topicId,
      title: record.title,
      description: record.description,
      duration: record.duration,
      content: record.content as unknown as MicrolessonContent,
      learningObjectives: record.learningObjectives,
      status: record.status,
      progress: record.progress,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      xpReward: record.xpReward,
      streakBonus: record.streakBonus,
      courseId: record.courseId,
      chapterId: record.chapterId,
      difficulty: record.difficulty,
      tags: record.tags,
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaMicrolearningStore(): PrismaMicrolearningStore {
  return new PrismaMicrolearningStore();
}
