/**
 * Prisma Metacognition Store Adapter
 * Provides database persistence for SAM Metacognition Engine
 */

import { db } from '@/lib/db';
import type { SAMReflectionType } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface MetacognitionSession {
  id: string;
  userId: string;
  sessionId: string;
  reflectionType: SAMReflectionType;
  responses: MetacognitionResponse[];
  analysis: MetacognitionAnalysis | null;
  cognitiveLoad: number | null;
  selfAwareness: number | null;
  strategyEffectiveness: number | null;
  studyHabits: StudyHabits | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetacognitionResponse {
  question: string;
  answer: string;
  timestamp?: Date;
}

export interface MetacognitionAnalysis {
  insights: string[];
  recommendations: string[];
  learningStyle?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  suggestedStrategies?: string[];
}

export interface StudyHabits {
  preferredTime?: string;
  sessionDuration?: number;
  breakFrequency?: number;
  distractionLevel?: number;
  focusScore?: number;
}

export interface CreateMetacognitionInput {
  userId: string;
  sessionId: string;
  reflectionType: SAMReflectionType;
  responses: MetacognitionResponse[];
  cognitiveLoad?: number;
}

export interface MetacognitionStore {
  create(input: CreateMetacognitionInput): Promise<MetacognitionSession>;
  getById(id: string): Promise<MetacognitionSession | null>;
  getByUserId(userId: string, limit?: number): Promise<MetacognitionSession[]>;
  getBySession(sessionId: string): Promise<MetacognitionSession[]>;
  getByType(userId: string, type: SAMReflectionType): Promise<MetacognitionSession[]>;
  updateAnalysis(id: string, analysis: MetacognitionAnalysis): Promise<MetacognitionSession>;
  updateScores(id: string, scores: { selfAwareness?: number; strategyEffectiveness?: number }): Promise<MetacognitionSession>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// PRISMA METACOGNITION STORE
// ============================================================================

export class PrismaMetacognitionStore implements MetacognitionStore {
  /**
   * Create a new metacognition session
   */
  async create(input: CreateMetacognitionInput): Promise<MetacognitionSession> {
    const session = await db.sAMMetacognitionSession.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId,
        reflectionType: input.reflectionType,
        responses: input.responses as unknown as Record<string, unknown>[],
        cognitiveLoad: input.cognitiveLoad ?? null,
      },
    });

    return this.mapToSession(session);
  }

  /**
   * Get a metacognition session by ID
   */
  async getById(id: string): Promise<MetacognitionSession | null> {
    const session = await db.sAMMetacognitionSession.findUnique({
      where: { id },
    });

    return session ? this.mapToSession(session) : null;
  }

  /**
   * Get all metacognition sessions for a user
   */
  async getByUserId(userId: string, limit: number = 20): Promise<MetacognitionSession[]> {
    const sessions = await db.sAMMetacognitionSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return sessions.map((s) => this.mapToSession(s));
  }

  /**
   * Get metacognition sessions for a specific learning session
   */
  async getBySession(sessionId: string): Promise<MetacognitionSession[]> {
    const sessions = await db.sAMMetacognitionSession.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return sessions.map((s) => this.mapToSession(s));
  }

  /**
   * Get metacognition sessions by reflection type
   */
  async getByType(userId: string, type: SAMReflectionType): Promise<MetacognitionSession[]> {
    const sessions = await db.sAMMetacognitionSession.findMany({
      where: { userId, reflectionType: type },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => this.mapToSession(s));
  }

  /**
   * Update analysis results
   */
  async updateAnalysis(id: string, analysis: MetacognitionAnalysis): Promise<MetacognitionSession> {
    const session = await db.sAMMetacognitionSession.update({
      where: { id },
      data: {
        analysis: analysis as unknown as Record<string, unknown>,
      },
    });

    return this.mapToSession(session);
  }

  /**
   * Update self-awareness and strategy effectiveness scores
   */
  async updateScores(
    id: string,
    scores: { selfAwareness?: number; strategyEffectiveness?: number }
  ): Promise<MetacognitionSession> {
    const session = await db.sAMMetacognitionSession.update({
      where: { id },
      data: {
        selfAwareness: scores.selfAwareness,
        strategyEffectiveness: scores.strategyEffectiveness,
      },
    });

    return this.mapToSession(session);
  }

  /**
   * Delete a metacognition session
   */
  async delete(id: string): Promise<void> {
    await db.sAMMetacognitionSession.delete({
      where: { id },
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapToSession(
    record: Awaited<ReturnType<typeof db.sAMMetacognitionSession.findUnique>>
  ): MetacognitionSession {
    if (!record) {
      throw new Error('MetacognitionSession record is null');
    }

    return {
      id: record.id,
      userId: record.userId,
      sessionId: record.sessionId,
      reflectionType: record.reflectionType,
      responses: record.responses as unknown as MetacognitionResponse[],
      analysis: record.analysis as unknown as MetacognitionAnalysis | null,
      cognitiveLoad: record.cognitiveLoad,
      selfAwareness: record.selfAwareness,
      strategyEffectiveness: record.strategyEffectiveness,
      studyHabits: record.studyHabits as unknown as StudyHabits | null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaMetacognitionStore(): PrismaMetacognitionStore {
  return new PrismaMetacognitionStore();
}
