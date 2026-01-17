/**
 * Prisma Store for Daily Practice Log (Heatmap Data)
 * Tracks daily practice statistics for GitHub-style activity visualization
 */

import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { PracticeSessionType } from './prisma-practice-session-store';

// ============================================================================
// TYPES
// ============================================================================

export interface DailyPracticeLog {
  id: string;
  userId: string;
  date: Date;
  totalMinutes: number;
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  deliberateSessions: number;
  pomodoroSessions: number;
  guidedSessions: number;
  assessmentSessions: number;
  casualSessions: number;
  reviewSessions: number;
  avgFocusLevel: number;
  avgQualityMultiplier: number;
  pomodorosCompleted: number;
  skillsPracticed: string[];
  primarySkillId?: string;
  intensityLevel: number;
  contributesToStreak: boolean;
  streakDayNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyPracticeLogUpdate {
  totalMinutes?: number;
  qualityHours?: number;
  sessionsCount?: number;
  sessionType?: PracticeSessionType;
  focusLevel?: number;
  qualityMultiplier?: number;
  pomodorosCompleted?: number;
  skillId?: string;
}

export interface HeatmapData {
  date: string; // YYYY-MM-DD format
  sessionsCount: number; // Number of sessions
  totalRawHours: number; // Raw hours practiced
  totalQualityHours: number; // Quality-adjusted hours
  avgQualityMultiplier: number; // Average quality multiplier
  level: number; // 0-4 intensity (deprecated, use intensity from API)
}

export interface YearlyStats {
  totalDays: number;
  activeDays: number;
  totalHours: number;
  totalQualityHours: number;
  totalSessions: number;
  longestStreak: number;
  currentStreak: number;
  averageDailyHours: number;
  mostActiveDay: { date: string; hours: number } | null;
}

export interface DailyPracticeLogStore {
  // CRUD
  getByDate(userId: string, date: Date): Promise<DailyPracticeLog | null>;
  getByDateRange(userId: string, startDate: Date, endDate: Date): Promise<DailyPracticeLog[]>;

  // Updates
  recordActivity(userId: string, date: Date, update: DailyPracticeLogUpdate): Promise<DailyPracticeLog>;
  updateStreakContribution(userId: string, date: Date, contributes: boolean, dayNumber?: number): Promise<void>;

  // Heatmap
  getHeatmapData(userId: string, year: number): Promise<HeatmapData[]>;
  getYearlyStats(userId: string, year: number): Promise<YearlyStats>;

  // Analytics
  getWeeklyTrend(userId: string, weeks?: number): Promise<{ week: string; hours: number }[]>;
  getMonthlyTrend(userId: string, months?: number): Promise<{ month: string; hours: number }[]>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPrismaLog(log: Prisma.DailyPracticeLogGetPayload<object>): DailyPracticeLog {
  return {
    id: log.id,
    userId: log.userId,
    date: log.date,
    totalMinutes: log.totalMinutes,
    totalHours: log.totalHours,
    qualityHours: log.qualityHours,
    sessionsCount: log.sessionsCount,
    deliberateSessions: log.deliberateSessions,
    pomodoroSessions: log.pomodoroSessions,
    guidedSessions: log.guidedSessions,
    assessmentSessions: log.assessmentSessions,
    casualSessions: log.casualSessions,
    reviewSessions: log.reviewSessions,
    avgFocusLevel: log.avgFocusLevel,
    avgQualityMultiplier: log.avgQualityMultiplier,
    pomodorosCompleted: log.pomodorosCompleted,
    skillsPracticed: log.skillsPracticed,
    primarySkillId: log.primarySkillId ?? undefined,
    intensityLevel: log.intensityLevel,
    contributesToStreak: log.contributesToStreak,
    streakDayNumber: log.streakDayNumber ?? undefined,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

function getDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function calculateIntensityLevel(totalMinutes: number): number {
  // 0: No activity
  // 1: 1-30 minutes
  // 2: 30-60 minutes
  // 3: 60-120 minutes
  // 4: 120+ minutes
  if (totalMinutes === 0) return 0;
  if (totalMinutes < 30) return 1;
  if (totalMinutes < 60) return 2;
  if (totalMinutes < 120) return 3;
  return 4;
}

// ============================================================================
// PRISMA DAILY PRACTICE LOG STORE
// ============================================================================

export class PrismaDailyPracticeLogStore implements DailyPracticeLogStore {
  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async getByDate(userId: string, date: Date): Promise<DailyPracticeLog | null> {
    const dateOnly = getDateOnly(date);

    const log = await db.dailyPracticeLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateOnly,
        },
      },
    });

    if (!log) return null;
    return mapPrismaLog(log);
  }

  async getByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyPracticeLog[]> {
    const logs = await db.dailyPracticeLog.findMany({
      where: {
        userId,
        date: {
          gte: getDateOnly(startDate),
          lte: getDateOnly(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });

    return logs.map(mapPrismaLog);
  }

  // ---------------------------------------------------------------------------
  // Updates
  // ---------------------------------------------------------------------------

  async recordActivity(
    userId: string,
    date: Date,
    update: DailyPracticeLogUpdate
  ): Promise<DailyPracticeLog> {
    const dateOnly = getDateOnly(date);

    // Get existing log or create new
    let log = await db.dailyPracticeLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateOnly,
        },
      },
    });

    const sessionMinutes = update.totalMinutes || 0;
    const sessionQualityHours = update.qualityHours || 0;

    if (!log) {
      // Create new log
      const sessionTypeField = this.getSessionTypeField(update.sessionType);
      const createData: Prisma.DailyPracticeLogCreateInput = {
        user: { connect: { id: userId } },
        date: dateOnly,
        totalMinutes: sessionMinutes,
        totalHours: sessionMinutes / 60,
        qualityHours: sessionQualityHours,
        sessionsCount: 1,
        avgFocusLevel: update.focusLevel || 3.0,
        avgQualityMultiplier: update.qualityMultiplier || 1.0,
        pomodorosCompleted: update.pomodorosCompleted || 0,
        skillsPracticed: update.skillId ? [update.skillId] : [],
        primarySkillId: update.skillId,
        intensityLevel: calculateIntensityLevel(sessionMinutes),
        contributesToStreak: sessionMinutes >= 15, // 15 min minimum for streak
        [sessionTypeField]: 1,
      };

      log = await db.dailyPracticeLog.create({
        data: createData,
      });
    } else {
      // Update existing log
      const newTotalMinutes = log.totalMinutes + sessionMinutes;
      const newSessionsCount = log.sessionsCount + 1;
      const newAvgFocusLevel =
        (log.avgFocusLevel * log.sessionsCount + (update.focusLevel || 3.0)) /
        newSessionsCount;
      const newAvgMultiplier =
        (log.avgQualityMultiplier * log.sessionsCount + (update.qualityMultiplier || 1.0)) /
        newSessionsCount;

      // Update skills practiced
      const skillsPracticed = [...log.skillsPracticed];
      if (update.skillId && !skillsPracticed.includes(update.skillId)) {
        skillsPracticed.push(update.skillId);
      }

      // Determine primary skill (most practiced)
      // For now, just keep the first one or update if new
      const primarySkillId = log.primarySkillId || update.skillId;

      const sessionTypeField = this.getSessionTypeField(update.sessionType);
      const currentTypeCount = (log as Record<string, unknown>)[sessionTypeField] as number || 0;

      log = await db.dailyPracticeLog.update({
        where: { id: log.id },
        data: {
          totalMinutes: newTotalMinutes,
          totalHours: newTotalMinutes / 60,
          qualityHours: log.qualityHours + sessionQualityHours,
          sessionsCount: newSessionsCount,
          avgFocusLevel: newAvgFocusLevel,
          avgQualityMultiplier: newAvgMultiplier,
          pomodorosCompleted: log.pomodorosCompleted + (update.pomodorosCompleted || 0),
          skillsPracticed,
          primarySkillId,
          intensityLevel: calculateIntensityLevel(newTotalMinutes),
          contributesToStreak: newTotalMinutes >= 15,
          [sessionTypeField]: currentTypeCount + 1,
        },
      });
    }

    return mapPrismaLog(log);
  }

  async updateStreakContribution(
    userId: string,
    date: Date,
    contributes: boolean,
    dayNumber?: number
  ): Promise<void> {
    const dateOnly = getDateOnly(date);

    await db.dailyPracticeLog.updateMany({
      where: {
        userId,
        date: dateOnly,
      },
      data: {
        contributesToStreak: contributes,
        streakDayNumber: dayNumber ?? null,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Heatmap
  // ---------------------------------------------------------------------------

  async getHeatmapData(userId: string, year: number): Promise<HeatmapData[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const logs = await db.dailyPracticeLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Create a map of existing data
    const dataMap = new Map<string, HeatmapData>();
    for (const log of logs) {
      const dateStr = formatDateString(log.date);
      dataMap.set(dateStr, {
        date: dateStr,
        sessionsCount: log.sessionsCount,
        totalRawHours: log.totalHours,
        totalQualityHours: log.qualityHours,
        avgQualityMultiplier: log.avgQualityMultiplier,
        level: log.intensityLevel,
      });
    }

    // Fill in missing days with zeros
    const result: HeatmapData[] = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= endDate && currentDate <= today) {
      const dateStr = formatDateString(currentDate);
      result.push(
        dataMap.get(dateStr) || {
          date: dateStr,
          sessionsCount: 0,
          totalRawHours: 0,
          totalQualityHours: 0,
          avgQualityMultiplier: 0,
          level: 0,
        }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  async getYearlyStats(userId: string, year: number): Promise<YearlyStats> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const today = new Date();
    const effectiveEndDate = endDate > today ? today : endDate;

    const logs = await db.dailyPracticeLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: effectiveEndDate,
        },
      },
    });

    // Calculate days in range
    const totalDays = Math.floor(
      (effectiveEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Calculate stats
    const activeDays = logs.length;
    const totalHours = logs.reduce((sum, log) => sum + log.totalHours, 0);
    const totalQualityHours = logs.reduce((sum, log) => sum + log.qualityHours, 0);
    const totalSessions = logs.reduce((sum, log) => sum + log.sessionsCount, 0);
    const averageDailyHours = activeDays > 0 ? totalQualityHours / activeDays : 0;

    // Find most active day
    let mostActiveDay: { date: string; hours: number } | null = null;
    if (logs.length > 0) {
      const maxLog = logs.reduce((max, log) =>
        log.qualityHours > max.qualityHours ? log : max
      );
      mostActiveDay = {
        date: formatDateString(maxLog.date),
        hours: maxLog.qualityHours,
      };
    }

    // Calculate streaks
    const { current, longest } = this.calculateStreaks(logs);

    return {
      totalDays,
      activeDays,
      totalHours,
      totalQualityHours,
      totalSessions,
      longestStreak: longest,
      currentStreak: current,
      averageDailyHours,
      mostActiveDay,
    };
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  async getWeeklyTrend(
    userId: string,
    weeks = 12
  ): Promise<{ week: string; hours: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const logs = await this.getByDateRange(userId, startDate, endDate);

    // Group by week
    const weeklyHours = new Map<string, number>();

    for (const log of logs) {
      const weekStart = this.getWeekStart(log.date);
      const weekKey = formatDateString(weekStart);
      const current = weeklyHours.get(weekKey) || 0;
      weeklyHours.set(weekKey, current + log.qualityHours);
    }

    // Generate all weeks
    const result: { week: string; hours: number }[] = [];
    const currentWeek = this.getWeekStart(startDate);

    while (currentWeek <= endDate) {
      const weekKey = formatDateString(currentWeek);
      result.push({
        week: weekKey,
        hours: weeklyHours.get(weekKey) || 0,
      });
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    return result;
  }

  async getMonthlyTrend(
    userId: string,
    months = 12
  ): Promise<{ month: string; hours: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const logs = await this.getByDateRange(userId, startDate, endDate);

    // Group by month
    const monthlyHours = new Map<string, number>();

    for (const log of logs) {
      const monthKey = `${log.date.getFullYear()}-${String(log.date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyHours.get(monthKey) || 0;
      monthlyHours.set(monthKey, current + log.qualityHours);
    }

    // Generate all months
    const result: { month: string; hours: number }[] = [];
    const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentMonth <= endDate) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: monthKey,
        hours: monthlyHours.get(monthKey) || 0,
      });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private getSessionTypeField(sessionType?: PracticeSessionType): string {
    switch (sessionType) {
      case 'DELIBERATE':
        return 'deliberateSessions';
      case 'POMODORO':
        return 'pomodoroSessions';
      case 'GUIDED':
        return 'guidedSessions';
      case 'ASSESSMENT':
        return 'assessmentSessions';
      case 'REVIEW':
        return 'reviewSessions';
      case 'CASUAL':
      default:
        return 'casualSessions';
    }
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private calculateStreaks(logs: { date: Date; contributesToStreak: boolean }[]): {
    current: number;
    longest: number;
  } {
    if (logs.length === 0) return { current: 0, longest: 0 };

    // Sort by date
    const sortedLogs = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: Date | null = null;

    for (const log of sortedLogs) {
      if (!log.contributesToStreak) continue;

      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor(
          (log.date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
        } else if (daysDiff > 1) {
          currentStreak = 1;
        }
        // daysDiff === 0: same day, no change
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      lastDate = log.date;
    }

    // Check if current streak is still active (last activity was today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastDate) {
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActivity > 1) {
        currentStreak = 0;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaDailyPracticeLogStore(): PrismaDailyPracticeLogStore {
  return new PrismaDailyPracticeLogStore();
}
