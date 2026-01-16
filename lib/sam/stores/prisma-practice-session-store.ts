/**
 * Prisma Store for Practice Session Management
 * Handles 10,000 hour practice tracking with quality metrics
 */

import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type PracticeSessionType =
  | 'DELIBERATE'
  | 'POMODORO'
  | 'GUIDED'
  | 'ASSESSMENT'
  | 'CASUAL'
  | 'REVIEW';

export type PracticeFocusLevel =
  | 'DEEP_FLOW'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'VERY_LOW';

export type PracticeSessionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ABANDONED';

export interface PracticeSession {
  id: string;
  userId: string;
  skillId?: string;
  skillName?: string;
  courseId?: string;
  courseName?: string;
  sectionId?: string;
  chapterId?: string;
  sessionType: PracticeSessionType;
  focusLevel: PracticeFocusLevel;
  startedAt: Date;
  endedAt?: Date;
  pausedAt?: Date;
  totalPausedSeconds: number;
  durationMinutes: number;
  status: PracticeSessionStatus;
  rawHours: number;
  qualityMultiplier: number;
  qualityHours: number;
  bloomsLevel?: string;
  bloomsMultiplier: number;
  notes?: string;
  distractionCount: number;
  pomodoroCount: number;
  breaksTaken: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePracticeSessionInput {
  userId: string;
  skillId?: string;
  skillName?: string;
  courseId?: string;
  courseName?: string;
  sectionId?: string;
  chapterId?: string;
  sessionType?: PracticeSessionType;
  focusLevel?: PracticeFocusLevel;
  bloomsLevel?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePracticeSessionInput {
  focusLevel?: PracticeFocusLevel;
  bloomsLevel?: string;
  notes?: string;
  distractionCount?: number;
  pomodoroCount?: number;
  breaksTaken?: number;
  metadata?: Record<string, unknown>;
}

export interface EndPracticeSessionInput {
  focusLevel?: PracticeFocusLevel;
  notes?: string;
  distractionCount?: number;
  pomodoroCount?: number;
  breaksTaken?: number;
}

export interface PracticeSessionFilters {
  userId?: string;
  skillId?: string;
  courseId?: string;
  sessionType?: PracticeSessionType;
  status?: PracticeSessionStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface PracticeSessionStore {
  // CRUD
  create(input: CreatePracticeSessionInput): Promise<PracticeSession>;
  getById(id: string): Promise<PracticeSession | null>;
  update(id: string, input: UpdatePracticeSessionInput): Promise<PracticeSession>;
  delete(id: string): Promise<void>;

  // Session lifecycle
  pauseSession(id: string): Promise<PracticeSession>;
  resumeSession(id: string): Promise<PracticeSession>;
  endSession(id: string, input?: EndPracticeSessionInput): Promise<PracticeSession>;
  abandonSession(id: string): Promise<PracticeSession>;

  // Queries
  getActiveSession(userId: string): Promise<PracticeSession | null>;
  getUserSessions(userId: string, filters?: PracticeSessionFilters): Promise<PracticeSession[]>;
  getSessionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<PracticeSession[]>;
  getSessionStats(userId: string): Promise<SessionStats>;
}

export interface SessionStats {
  totalSessions: number;
  totalRawHours: number;
  totalQualityHours: number;
  averageSessionMinutes: number;
  averageQualityMultiplier: number;
  sessionsByType: Record<PracticeSessionType, number>;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
}

// ============================================================================
// QUALITY MULTIPLIERS
// ============================================================================

const SESSION_TYPE_MULTIPLIERS: Record<PracticeSessionType, number> = {
  DELIBERATE: 1.5,
  POMODORO: 1.4,
  GUIDED: 1.25,
  ASSESSMENT: 1.1,
  CASUAL: 1.0,
  REVIEW: 0.8,
};

const FOCUS_LEVEL_MULTIPLIERS: Record<PracticeFocusLevel, number> = {
  DEEP_FLOW: 1.5,
  HIGH: 1.25,
  MEDIUM: 1.0,
  LOW: 0.75,
  VERY_LOW: 0.5,
};

const BLOOMS_MULTIPLIERS: Record<string, number> = {
  CREATE: 1.1,
  EVALUATE: 1.0,
  ANALYZE: 0.95,
  APPLY: 0.85,
  UNDERSTAND: 0.7,
  REMEMBER: 0.5,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateQualityMultiplier(
  sessionType: PracticeSessionType,
  focusLevel: PracticeFocusLevel,
  bloomsLevel?: string
): number {
  const sessionTypeMultiplier = SESSION_TYPE_MULTIPLIERS[sessionType] || 1.0;
  const focusMultiplier = FOCUS_LEVEL_MULTIPLIERS[focusLevel] || 1.0;
  const bloomsMultiplier = bloomsLevel
    ? BLOOMS_MULTIPLIERS[bloomsLevel.toUpperCase()] || 1.0
    : 1.0;

  // Combined multiplier capped at 2.5x
  const combined = sessionTypeMultiplier * focusMultiplier * bloomsMultiplier;
  return Math.min(combined, 2.5);
}

function mapPrismaSession(session: Prisma.PracticeSessionGetPayload<object>): PracticeSession {
  return {
    id: session.id,
    userId: session.userId,
    skillId: session.skillId ?? undefined,
    skillName: session.skillName ?? undefined,
    courseId: session.courseId ?? undefined,
    courseName: session.courseName ?? undefined,
    sectionId: session.sectionId ?? undefined,
    chapterId: session.chapterId ?? undefined,
    sessionType: session.sessionType as PracticeSessionType,
    focusLevel: session.focusLevel as PracticeFocusLevel,
    startedAt: session.startedAt,
    endedAt: session.endedAt ?? undefined,
    pausedAt: session.pausedAt ?? undefined,
    totalPausedSeconds: session.totalPausedSeconds,
    durationMinutes: session.durationMinutes,
    status: session.status as PracticeSessionStatus,
    rawHours: session.rawHours,
    qualityMultiplier: session.qualityMultiplier,
    qualityHours: session.qualityHours,
    bloomsLevel: session.bloomsLevel ?? undefined,
    bloomsMultiplier: session.bloomsMultiplier,
    notes: session.notes ?? undefined,
    distractionCount: session.distractionCount,
    pomodoroCount: session.pomodoroCount,
    breaksTaken: session.breaksTaken,
    metadata: session.metadata as Record<string, unknown> | undefined,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

// ============================================================================
// PRISMA PRACTICE SESSION STORE
// ============================================================================

export class PrismaPracticeSessionStore implements PracticeSessionStore {
  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  async create(input: CreatePracticeSessionInput): Promise<PracticeSession> {
    const session = await db.practiceSession.create({
      data: {
        userId: input.userId,
        skillId: input.skillId,
        skillName: input.skillName,
        courseId: input.courseId,
        courseName: input.courseName,
        sectionId: input.sectionId,
        chapterId: input.chapterId,
        sessionType: input.sessionType || 'CASUAL',
        focusLevel: input.focusLevel || 'MEDIUM',
        bloomsLevel: input.bloomsLevel,
        bloomsMultiplier: input.bloomsLevel
          ? BLOOMS_MULTIPLIERS[input.bloomsLevel.toUpperCase()] || 1.0
          : 1.0,
        notes: input.notes,
        metadata: input.metadata as Prisma.InputJsonValue,
        status: 'ACTIVE',
      },
    });

    return mapPrismaSession(session);
  }

  async getById(id: string): Promise<PracticeSession | null> {
    const session = await db.practiceSession.findUnique({
      where: { id },
    });

    if (!session) return null;
    return mapPrismaSession(session);
  }

  async update(id: string, input: UpdatePracticeSessionInput): Promise<PracticeSession> {
    const session = await db.practiceSession.update({
      where: { id },
      data: {
        focusLevel: input.focusLevel,
        bloomsLevel: input.bloomsLevel,
        bloomsMultiplier: input.bloomsLevel
          ? BLOOMS_MULTIPLIERS[input.bloomsLevel.toUpperCase()] || 1.0
          : undefined,
        notes: input.notes,
        distractionCount: input.distractionCount,
        pomodoroCount: input.pomodoroCount,
        breaksTaken: input.breaksTaken,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });

    return mapPrismaSession(session);
  }

  async delete(id: string): Promise<void> {
    await db.practiceSession.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------------------------
  // Session Lifecycle
  // ---------------------------------------------------------------------------

  async pauseSession(id: string): Promise<PracticeSession> {
    const session = await db.practiceSession.update({
      where: { id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
      },
    });

    return mapPrismaSession(session);
  }

  async resumeSession(id: string): Promise<PracticeSession> {
    const existing = await db.practiceSession.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Session not found: ${id}`);
    }

    // Calculate how long the session was paused
    let additionalPausedSeconds = 0;
    if (existing.pausedAt) {
      additionalPausedSeconds = Math.floor(
        (new Date().getTime() - existing.pausedAt.getTime()) / 1000
      );
    }

    const session = await db.practiceSession.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        totalPausedSeconds: existing.totalPausedSeconds + additionalPausedSeconds,
      },
    });

    return mapPrismaSession(session);
  }

  async endSession(id: string, input?: EndPracticeSessionInput): Promise<PracticeSession> {
    const existing = await db.practiceSession.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error(`Session not found: ${id}`);
    }

    const now = new Date();

    // Calculate total duration
    const totalSeconds = Math.floor(
      (now.getTime() - existing.startedAt.getTime()) / 1000
    );
    const activeSeconds = totalSeconds - existing.totalPausedSeconds;
    const durationMinutes = Math.max(Math.floor(activeSeconds / 60), 1);
    const rawHours = durationMinutes / 60;

    // Determine final focus level
    const finalFocusLevel = (input?.focusLevel || existing.focusLevel) as PracticeFocusLevel;

    // Calculate quality multiplier
    const qualityMultiplier = calculateQualityMultiplier(
      existing.sessionType as PracticeSessionType,
      finalFocusLevel,
      existing.bloomsLevel ?? undefined
    );

    const qualityHours = rawHours * qualityMultiplier;

    const session = await db.practiceSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: now,
        pausedAt: null,
        durationMinutes,
        rawHours,
        qualityMultiplier,
        qualityHours,
        focusLevel: finalFocusLevel,
        notes: input?.notes ?? existing.notes,
        distractionCount: input?.distractionCount ?? existing.distractionCount,
        pomodoroCount: input?.pomodoroCount ?? existing.pomodoroCount,
        breaksTaken: input?.breaksTaken ?? existing.breaksTaken,
      },
    });

    return mapPrismaSession(session);
  }

  async abandonSession(id: string): Promise<PracticeSession> {
    const session = await db.practiceSession.update({
      where: { id },
      data: {
        status: 'ABANDONED',
        endedAt: new Date(),
        pausedAt: null,
      },
    });

    return mapPrismaSession(session);
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  async getActiveSession(userId: string): Promise<PracticeSession | null> {
    const session = await db.practiceSession.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) return null;
    return mapPrismaSession(session);
  }

  async getUserSessions(
    userId: string,
    filters?: PracticeSessionFilters
  ): Promise<PracticeSession[]> {
    const sessions = await db.practiceSession.findMany({
      where: {
        userId,
        ...(filters?.skillId && { skillId: filters.skillId }),
        ...(filters?.courseId && { courseId: filters.courseId }),
        ...(filters?.sessionType && { sessionType: filters.sessionType }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && { startedAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { startedAt: { lte: filters.endDate } }),
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    return sessions.map(mapPrismaSession);
  }

  async getSessionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PracticeSession[]> {
    const sessions = await db.practiceSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      orderBy: { startedAt: 'asc' },
    });

    return sessions.map(mapPrismaSession);
  }

  async getSessionStats(userId: string): Promise<SessionStats> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all completed sessions
    const allSessions = await db.practiceSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
    });

    // Calculate stats
    const totalSessions = allSessions.length;
    const totalRawHours = allSessions.reduce((sum, s) => sum + s.rawHours, 0);
    const totalQualityHours = allSessions.reduce((sum, s) => sum + s.qualityHours, 0);
    const totalMinutes = allSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const averageSessionMinutes = totalSessions > 0 ? totalMinutes / totalSessions : 0;
    const totalMultiplier = allSessions.reduce((sum, s) => sum + s.qualityMultiplier, 0);
    const averageQualityMultiplier = totalSessions > 0 ? totalMultiplier / totalSessions : 1.0;

    // Sessions by type
    const sessionsByType: Record<PracticeSessionType, number> = {
      DELIBERATE: 0,
      POMODORO: 0,
      GUIDED: 0,
      ASSESSMENT: 0,
      CASUAL: 0,
      REVIEW: 0,
    };
    for (const session of allSessions) {
      const type = session.sessionType as PracticeSessionType;
      if (type in sessionsByType) {
        sessionsByType[type]++;
      }
    }

    // Sessions this week/month
    const sessionsThisWeek = allSessions.filter(
      (s) => s.startedAt >= weekStart
    ).length;
    const sessionsThisMonth = allSessions.filter(
      (s) => s.startedAt >= monthStart
    ).length;

    return {
      totalSessions,
      totalRawHours,
      totalQualityHours,
      averageSessionMinutes,
      averageQualityMultiplier,
      sessionsByType,
      sessionsThisWeek,
      sessionsThisMonth,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaPracticeSessionStore(): PrismaPracticeSessionStore {
  return new PrismaPracticeSessionStore();
}

// Export multipliers for use in other modules
export {
  SESSION_TYPE_MULTIPLIERS,
  FOCUS_LEVEL_MULTIPLIERS,
  BLOOMS_MULTIPLIERS,
  calculateQualityMultiplier,
};
