/**
 * Prisma Store for Practice Leaderboard
 * Handles rankings for practice hours across different scopes and timeframes
 */

import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type LeaderboardScope =
  | 'GLOBAL'
  | 'SKILL'
  | 'FRIENDS'
  | 'COURSE'
  | 'ORGANIZATION';

export type LeaderboardTimeframe =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'ALL_TIME';

export interface PracticeLeaderboardEntry {
  id: string;
  userId: string;
  scope: LeaderboardScope;
  scopeId?: string;
  timeframe: LeaderboardTimeframe;
  periodStart: Date;
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
  streakDays: number;
  rank?: number;
  previousRank?: number;
  rankChange?: number;
  percentile?: number;
  userName?: string;
  userAvatar?: string;
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardFilters {
  scope?: LeaderboardScope;
  scopeId?: string;
  timeframe?: LeaderboardTimeframe;
  limit?: number;
  offset?: number;
}

export interface PracticeLeaderboardStore {
  // Queries
  getLeaderboard(filters: LeaderboardFilters): Promise<PracticeLeaderboardEntry[]>;
  getUserRank(userId: string, filters: LeaderboardFilters): Promise<PracticeLeaderboardEntry | null>;
  getTopUsers(filters: LeaderboardFilters): Promise<PracticeLeaderboardEntry[]>;

  // Updates
  updateUserEntry(
    userId: string,
    scope: LeaderboardScope,
    scopeId: string | null,
    timeframe: LeaderboardTimeframe,
    data: LeaderboardUpdateData
  ): Promise<PracticeLeaderboardEntry>;

  // Batch operations
  recalculateLeaderboard(scope: LeaderboardScope, scopeId: string | null, timeframe: LeaderboardTimeframe): Promise<void>;
  recalculateRanks(scope: LeaderboardScope, scopeId: string | null, timeframe: LeaderboardTimeframe): Promise<void>;

  // Period management
  getCurrentPeriodStart(timeframe: LeaderboardTimeframe): Date;
  archivePeriod(scope: LeaderboardScope, scopeId: string | null, timeframe: LeaderboardTimeframe): Promise<void>;
}

export interface LeaderboardUpdateData {
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
  streakDays: number;
  userName?: string;
  userAvatar?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPrismaEntry(entry: Prisma.PracticeLeaderboardGetPayload<object>): PracticeLeaderboardEntry {
  return {
    id: entry.id,
    userId: entry.userId,
    scope: entry.scope as LeaderboardScope,
    scopeId: entry.scopeId ?? undefined,
    timeframe: entry.timeframe as LeaderboardTimeframe,
    periodStart: entry.periodStart,
    totalHours: entry.totalHours,
    qualityHours: entry.qualityHours,
    sessionsCount: entry.sessionsCount,
    avgQualityMultiplier: entry.avgQualityMultiplier,
    streakDays: entry.streakDays,
    rank: entry.rank ?? undefined,
    previousRank: entry.previousRank ?? undefined,
    rankChange: entry.rankChange ?? undefined,
    percentile: entry.percentile ?? undefined,
    userName: entry.userName ?? undefined,
    userAvatar: entry.userAvatar ?? undefined,
    lastCalculatedAt: entry.lastCalculatedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================================
// PRISMA PRACTICE LEADERBOARD STORE
// ============================================================================

export class PrismaPracticeLeaderboardStore implements PracticeLeaderboardStore {
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  async getLeaderboard(filters: LeaderboardFilters): Promise<PracticeLeaderboardEntry[]> {
    const scope = filters.scope || 'GLOBAL';
    const timeframe = filters.timeframe || 'WEEKLY';
    const periodStart = this.getCurrentPeriodStart(timeframe);
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const entries = await db.practiceLeaderboard.findMany({
      where: {
        scope,
        scopeId: filters.scopeId ?? null,
        timeframe,
        periodStart,
      },
      orderBy: [
        { qualityHours: 'desc' },
        { sessionsCount: 'desc' },
      ],
      skip: offset,
      take: limit,
    });

    return entries.map(mapPrismaEntry);
  }

  async getUserRank(
    userId: string,
    filters: LeaderboardFilters
  ): Promise<PracticeLeaderboardEntry | null> {
    const scope = filters.scope || 'GLOBAL';
    const timeframe = filters.timeframe || 'WEEKLY';
    const periodStart = this.getCurrentPeriodStart(timeframe);

    // Use findFirst instead of findUnique to handle nullable scopeId correctly
    const entry = await db.practiceLeaderboard.findFirst({
      where: {
        userId,
        scope,
        scopeId: filters.scopeId ?? null,
        timeframe,
        periodStart,
      },
    });

    if (!entry) return null;
    return mapPrismaEntry(entry);
  }

  async getTopUsers(filters: LeaderboardFilters): Promise<PracticeLeaderboardEntry[]> {
    return this.getLeaderboard({
      ...filters,
      limit: filters.limit || 10,
      offset: 0,
    });
  }

  // ---------------------------------------------------------------------------
  // Updates
  // ---------------------------------------------------------------------------

  async updateUserEntry(
    userId: string,
    scope: LeaderboardScope,
    scopeId: string | null,
    timeframe: LeaderboardTimeframe,
    data: LeaderboardUpdateData
  ): Promise<PracticeLeaderboardEntry> {
    const periodStart = this.getCurrentPeriodStart(timeframe);

    const entry = await db.practiceLeaderboard.upsert({
      where: {
        userId_scope_scopeId_timeframe_periodStart: {
          userId,
          scope,
          scopeId: scopeId ?? '',
          timeframe,
          periodStart,
        },
      },
      create: {
        userId,
        scope,
        scopeId,
        timeframe,
        periodStart,
        totalHours: data.totalHours,
        qualityHours: data.qualityHours,
        sessionsCount: data.sessionsCount,
        avgQualityMultiplier: data.avgQualityMultiplier,
        streakDays: data.streakDays,
        userName: data.userName,
        userAvatar: data.userAvatar,
      },
      update: {
        totalHours: data.totalHours,
        qualityHours: data.qualityHours,
        sessionsCount: data.sessionsCount,
        avgQualityMultiplier: data.avgQualityMultiplier,
        streakDays: data.streakDays,
        userName: data.userName,
        userAvatar: data.userAvatar,
        lastCalculatedAt: new Date(),
      },
    });

    return mapPrismaEntry(entry);
  }

  // ---------------------------------------------------------------------------
  // Batch Operations
  // ---------------------------------------------------------------------------

  async recalculateLeaderboard(
    scope: LeaderboardScope,
    scopeId: string | null,
    timeframe: LeaderboardTimeframe
  ): Promise<void> {
    const periodStart = this.getCurrentPeriodStart(timeframe);
    const periodEnd = this.getPeriodEnd(periodStart, timeframe);

    // Get all practice sessions in this period
    const sessionsQuery: Prisma.PracticeSessionWhereInput = {
      status: 'COMPLETED',
      startedAt: {
        gte: periodStart,
        lt: periodEnd,
      },
    };

    if (scope === 'SKILL' && scopeId) {
      sessionsQuery.skillId = scopeId;
    } else if (scope === 'COURSE' && scopeId) {
      sessionsQuery.courseId = scopeId;
    }

    // Group sessions by user
    const sessions = await db.practiceSession.findMany({
      where: sessionsQuery,
      select: {
        userId: true,
        rawHours: true,
        qualityHours: true,
        qualityMultiplier: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Aggregate by user
    const userStats = new Map<
      string,
      {
        totalHours: number;
        qualityHours: number;
        sessionsCount: number;
        totalMultiplier: number;
        userName?: string;
        userAvatar?: string;
      }
    >();

    for (const session of sessions) {
      const stats = userStats.get(session.userId) || {
        totalHours: 0,
        qualityHours: 0,
        sessionsCount: 0,
        totalMultiplier: 0,
        userName: session.user?.name ?? undefined,
        userAvatar: session.user?.image ?? undefined,
      };

      stats.totalHours += session.rawHours;
      stats.qualityHours += session.qualityHours;
      stats.sessionsCount += 1;
      stats.totalMultiplier += session.qualityMultiplier;

      userStats.set(session.userId, stats);
    }

    // Update leaderboard entries
    for (const [userId, stats] of userStats) {
      // Get user's streak from mastery records
      const masteries = await db.skillMastery10K.findMany({
        where: { userId },
        select: { currentStreak: true },
      });
      const maxStreak = masteries.length > 0
        ? Math.max(...masteries.map((m) => m.currentStreak))
        : 0;

      await this.updateUserEntry(userId, scope, scopeId, timeframe, {
        totalHours: stats.totalHours,
        qualityHours: stats.qualityHours,
        sessionsCount: stats.sessionsCount,
        avgQualityMultiplier:
          stats.sessionsCount > 0 ? stats.totalMultiplier / stats.sessionsCount : 1.0,
        streakDays: maxStreak,
        userName: stats.userName,
        userAvatar: stats.userAvatar,
      });
    }

    // Recalculate ranks
    await this.recalculateRanks(scope, scopeId, timeframe);
  }

  async recalculateRanks(
    scope: LeaderboardScope,
    scopeId: string | null,
    timeframe: LeaderboardTimeframe
  ): Promise<void> {
    const periodStart = this.getCurrentPeriodStart(timeframe);

    // Get all entries sorted by quality hours
    const entries = await db.practiceLeaderboard.findMany({
      where: {
        scope,
        scopeId,
        timeframe,
        periodStart,
      },
      orderBy: [
        { qualityHours: 'desc' },
        { sessionsCount: 'desc' },
      ],
    });

    const totalEntries = entries.length;

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const newRank = i + 1;
      const percentile = totalEntries > 0
        ? ((totalEntries - newRank + 1) / totalEntries) * 100
        : 100;

      await db.practiceLeaderboard.update({
        where: { id: entry.id },
        data: {
          previousRank: entry.rank,
          rank: newRank,
          rankChange: entry.rank ? entry.rank - newRank : 0,
          percentile,
          lastCalculatedAt: new Date(),
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Period Management
  // ---------------------------------------------------------------------------

  getCurrentPeriodStart(timeframe: LeaderboardTimeframe): Date {
    const now = new Date();

    switch (timeframe) {
      case 'DAILY':
        return getDayStart(now);
      case 'WEEKLY':
        return getWeekStart(now);
      case 'MONTHLY':
        return getMonthStart(now);
      case 'ALL_TIME':
        // Use a fixed date for all-time (e.g., platform launch date)
        return new Date('2024-01-01');
      default:
        return getWeekStart(now);
    }
  }

  private getPeriodEnd(periodStart: Date, timeframe: LeaderboardTimeframe): Date {
    const end = new Date(periodStart);

    switch (timeframe) {
      case 'DAILY':
        end.setDate(end.getDate() + 1);
        break;
      case 'WEEKLY':
        end.setDate(end.getDate() + 7);
        break;
      case 'MONTHLY':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'ALL_TIME':
        // Far future date
        end.setFullYear(end.getFullYear() + 100);
        break;
    }

    return end;
  }

  async archivePeriod(
    scope: LeaderboardScope,
    scopeId: string | null,
    timeframe: LeaderboardTimeframe
  ): Promise<void> {
    // For now, we just recalculate ranks at the end of each period
    // In the future, we could move old data to an archive table
    await this.recalculateRanks(scope, scopeId, timeframe);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaPracticeLeaderboardStore(): PrismaPracticeLeaderboardStore {
  return new PrismaPracticeLeaderboardStore();
}
