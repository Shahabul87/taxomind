/**
 * Transactional Practice Session Orchestrator
 *
 * Handles atomic session end operations ensuring data consistency across:
 * - Practice session completion
 * - Skill mastery updates (10K hours tracking)
 * - Daily practice log updates (streaks, heatmaps)
 *
 * All operations happen in a single database transaction for data integrity.
 *
 * Phase 3 Enhancement: Uses multi-signal quality scoring for more accurate
 * quality hours calculation based on outcomes, engagement, and difficulty.
 *
 * Phase 4 Enhancement: Adds sophisticated features including:
 * - Session validation with anti-gaming detection
 * - Decay-aware mastery calculations
 * - Focus drift analysis
 */

import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import {
  PrismaPracticeSessionStore,
  type PracticeSession,
  type EndPracticeSessionInput,
  type PracticeFocusLevel,
  type PracticeSessionType,
} from '../stores/prisma-practice-session-store';
import {
  type SkillMastery10K,
  MILESTONE_HOURS,
  MILESTONE_XP_REWARDS,
  MILESTONE_BADGE_NAMES,
  type PracticeMilestoneType,
  type ProficiencyLevel,
} from '../stores/prisma-skill-mastery-10k-store';
import {
  getDateInTimezone,
  getDaysDifference,
  getTodayInTimezone,
  getWeekStartInTimezone,
  getMonthStartInTimezone,
} from '@/lib/utils/timezone';
import {
  calculateMultiSignalQuality,
  type QualityScoringInputs,
  type QualityScore,
  type ProjectOutcome,
} from '../quality/multi-signal-scorer';
import {
  validateSession,
  type ValidationResult,
  type ValidationFlag,
} from '../quality/session-validator';
import {
  analyzeFocusDrift,
  type FocusDriftResult,
} from '../quality/focus-drift-detector';
import {
  calculateRetentionRestoration,
  type ReviewUrgency,
} from '../quality/decay-calculator';

// ============================================================================
// TYPES
// ============================================================================

export interface TransactionalEndSessionInput extends EndPracticeSessionInput {
  /** User's timezone for accurate day boundary calculations */
  timezone?: string;

  /** Custom target hours for skill mastery (defaults to 10000 if not specified) */
  targetHours?: number;

  // Enhanced quality scoring inputs (Phase 3)
  /** Self-rated difficulty (1-5) */
  selfRatedDifficulty?: number;
  /** Assessment score if this was an assessment session (0-100) */
  assessmentScore?: number;
  /** Whether assessment was passed */
  assessmentPassed?: boolean;
  /** Project outcome for project-based sessions */
  projectOutcome?: ProjectOutcome;
  /** Peer review score if applicable (0-100) */
  peerReviewScore?: number;
}

export interface TransactionalEndSessionResult {
  /** The completed practice session */
  session: PracticeSession;
  /** Updated skill mastery record (if session had skill association) */
  mastery: SkillMastery10K | null;
  /** Updated daily practice log */
  dailyLog: DailyPracticeLogSummary | null;
  /** Any new milestones unlocked */
  newMilestones: MilestoneUnlocked[];
  /** Whether streak was continued */
  streakContinued: boolean;
  /** Whether this was first practice today */
  firstPracticeToday: boolean;

  // Quality scoring metadata (Phase 3)
  /** Detailed quality score breakdown */
  qualityScore: QualityScore;

  // Validation and analysis metadata (Phase 4)
  /** Session validation result with any flags */
  validation: ValidationResult;
  /** Focus drift analysis for the session */
  focusDrift: FocusDriftResult;
}

export interface DailyPracticeLogSummary {
  date: string;
  totalHours: number;
  sessionsCount: number;
  currentStreak: number;
  longestStreak: number;
}

export interface MilestoneUnlocked {
  milestoneType: PracticeMilestoneType;
  skillName: string;
  hoursRequired: number;
  xpReward: number;
  badgeName: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEZONE = 'UTC';
const DEFAULT_TARGET_HOURS = 10000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build quality scoring inputs from session data and end session input
 */
function buildQualityScoringInputs(
  sessionType: PracticeSessionType,
  focusLevel: PracticeFocusLevel,
  durationMinutes: number,
  distractionCount: number,
  breaksTaken: number,
  pomodoroCount: number,
  bloomsLevel?: string,
  input?: TransactionalEndSessionInput
): QualityScoringInputs {
  return {
    sessionType,
    focusLevel,
    bloomsLevel,
    durationMinutes,
    distractionCount,
    breaksTaken,
    pomodoroCount,
    assessmentScore: input?.assessmentScore,
    assessmentPassed: input?.assessmentPassed,
    projectOutcome: input?.projectOutcome,
    peerReviewScore: input?.peerReviewScore,
    selfRatedDifficulty: input?.selfRatedDifficulty,
  };
}

function getProficiencyLevel(qualityHours: number): ProficiencyLevel {
  if (qualityHours >= 10000) return 'MASTER';
  if (qualityHours >= 7500) return 'EXPERT';
  if (qualityHours >= 5000) return 'ADVANCED';
  if (qualityHours >= 2500) return 'PROFICIENT';
  if (qualityHours >= 1000) return 'COMPETENT';
  if (qualityHours >= 500) return 'INTERMEDIATE';
  if (qualityHours >= 100) return 'NOVICE';
  return 'BEGINNER';
}

// ============================================================================
// TRANSACTIONAL PRACTICE SESSION ORCHESTRATOR
// ============================================================================

export class TransactionalPracticeSessionOrchestrator {
  private sessionStore: PrismaPracticeSessionStore;

  constructor() {
    this.sessionStore = new PrismaPracticeSessionStore();
  }

  /**
   * End a practice session atomically, updating all related records in a single transaction.
   *
   * This is the preferred method for ending sessions as it ensures:
   * 1. Session calculations are accurate (including paused time)
   * 2. Skill mastery is updated atomically
   * 3. Daily practice log is updated atomically
   * 4. Milestones are checked and created
   * 5. Streaks are properly maintained
   *
   * @param sessionId - The ID of the session to end
   * @param input - Optional end session parameters
   * @returns Complete result with session, mastery, daily log, and milestones
   */
  async endSessionTransactionally(
    sessionId: string,
    input?: TransactionalEndSessionInput
  ): Promise<TransactionalEndSessionResult> {
    const timezone = input?.timezone || DEFAULT_TIMEZONE;

    return db.$transaction(async (tx) => {
      // Step 1: Get the session and validate it exists
      const existing = await tx.practiceSession.findUnique({
        where: { id: sessionId },
      });

      if (!existing) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      if (existing.status !== 'ACTIVE' && existing.status !== 'PAUSED') {
        throw new Error(
          `Session ${sessionId} is not active (status: ${existing.status})`
        );
      }

      const now = new Date();
      const todayStr = getDateInTimezone(now, timezone);
      const today = getTodayInTimezone(timezone);

      // Step 2: Calculate session duration and quality hours
      let totalPausedSeconds = existing.totalPausedSeconds;
      if (existing.status === 'PAUSED' && existing.pausedAt) {
        const finalPauseSeconds = Math.floor(
          (now.getTime() - existing.pausedAt.getTime()) / 1000
        );
        totalPausedSeconds += finalPauseSeconds;
      }

      const totalSeconds = Math.floor(
        (now.getTime() - existing.startedAt.getTime()) / 1000
      );
      const activeSeconds = Math.max(totalSeconds - totalPausedSeconds, 0);
      const durationMinutes = Math.max(Math.floor(activeSeconds / 60), 1);
      const rawHours = durationMinutes / 60;

      const finalFocusLevel = (input?.focusLevel ||
        existing.focusLevel) as PracticeFocusLevel;
      const initialFocusLevel = existing.focusLevel as PracticeFocusLevel;
      const finalDistractionCount = input?.distractionCount ?? existing.distractionCount;
      const finalPomodoroCount = input?.pomodoroCount ?? existing.pomodoroCount;
      const finalBreaksTaken = input?.breaksTaken ?? existing.breaksTaken;

      // Step 2b: Validate session for anti-gaming (Phase 4)
      const validation = validateSession({
        durationMinutes,
        sessionType: existing.sessionType as PracticeSessionType,
        focusLevel: finalFocusLevel,
        distractionCount: finalDistractionCount,
        pomodoroCount: finalPomodoroCount,
        breaksTaken: finalBreaksTaken,
        startedAt: existing.startedAt,
        endedAt: now,
        totalPausedSeconds,
      });

      // Apply duration adjustment if validation flagged excessive duration
      let adjustedDurationMinutes = durationMinutes;
      let originalDuration: number | undefined;
      if (validation.wasAdjusted && validation.suggestedDuration) {
        originalDuration = durationMinutes;
        adjustedDurationMinutes = validation.suggestedDuration;
      }
      const adjustedRawHours = adjustedDurationMinutes / 60;

      // Step 2c: Analyze focus drift (Phase 4)
      const focusDrift = analyzeFocusDrift({
        sessionStart: existing.startedAt,
        sessionEnd: now,
        initialFocusLevel,
        finalFocusLevel,
        totalDistractions: finalDistractionCount,
        breaksTaken: finalBreaksTaken,
        durationMinutes: adjustedDurationMinutes,
      });

      // Build quality scoring inputs and calculate multi-signal quality score
      const qualityInputs = buildQualityScoringInputs(
        existing.sessionType as PracticeSessionType,
        finalFocusLevel,
        adjustedDurationMinutes,
        finalDistractionCount,
        finalBreaksTaken,
        finalPomodoroCount,
        existing.bloomsLevel ?? undefined,
        input
      );
      const qualityScore = calculateMultiSignalQuality(qualityInputs);
      const qualityMultiplier = qualityScore.finalMultiplier;
      const qualityHours = adjustedRawHours * qualityMultiplier;

      // Step 3: Update the session record with multi-signal quality breakdown and validation
      const updatedSession = await tx.practiceSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          endedAt: now,
          pausedAt: null,
          totalPausedSeconds,
          durationMinutes: adjustedDurationMinutes,
          rawHours: adjustedRawHours,
          qualityMultiplier,
          qualityHours,
          focusLevel: finalFocusLevel,
          notes: input?.notes ?? existing.notes,
          distractionCount: finalDistractionCount,
          pomodoroCount: finalPomodoroCount,
          breaksTaken: finalBreaksTaken,
          // Enhanced quality scoring fields (Phase 3)
          selfRatedDifficulty: input?.selfRatedDifficulty,
          assessmentScore: input?.assessmentScore,
          assessmentPassed: input?.assessmentPassed,
          projectOutcome: input?.projectOutcome,
          peerReviewScore: input?.peerReviewScore,
          qualityBreakdown: qualityScore.breakdown as Prisma.InputJsonValue,
          // Anti-Gaming Validation fields (Phase 4)
          validationFlags: validation.flags,
          wasAdjusted: validation.wasAdjusted,
          originalDuration,
        },
      });

      let mastery: SkillMastery10K | null = null;
      let dailyLog: DailyPracticeLogSummary | null = null;
      const newMilestones: MilestoneUnlocked[] = [];
      let streakContinued = false;
      let firstPracticeToday = false;

      // Step 4: Update skill mastery if session has skill association
      if (existing.skillId) {
        mastery = await this.updateSkillMasteryInTransaction(
          tx,
          existing.userId,
          existing.skillId,
          existing.skillName ?? 'Unknown Skill',
          adjustedRawHours,
          qualityHours,
          adjustedDurationMinutes,
          qualityMultiplier,
          timezone,
          newMilestones,
          input?.targetHours // Pass custom target hours
        );
        streakContinued = mastery.currentStreak > 1;
      }

      // Step 5: Update daily practice log with comprehensive session data
      const dailyLogResult = await this.updateDailyPracticeLogInTransaction(
        tx,
        existing.userId,
        todayStr,
        {
          rawHours: adjustedRawHours,
          qualityHours,
          durationMinutes: adjustedDurationMinutes,
          sessionType: existing.sessionType as PracticeSessionType,
          skillId: existing.skillId ?? undefined,
          qualityMultiplier,
          focusLevel: finalFocusLevel,
          pomodoroCount: finalPomodoroCount,
        },
        timezone
      );
      dailyLog = dailyLogResult.log;
      firstPracticeToday = dailyLogResult.isFirstToday;

      // Map the session to our interface
      const session: PracticeSession = this.mapPrismaSession(updatedSession);

      return {
        session,
        mastery,
        dailyLog,
        newMilestones,
        streakContinued,
        firstPracticeToday,
        qualityScore,
        validation,
        focusDrift,
      };
    });
  }

  /**
   * Update skill mastery within a transaction
   */
  private async updateSkillMasteryInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    skillId: string,
    skillName: string,
    rawHours: number,
    qualityHours: number,
    sessionDuration: number,
    qualityMultiplier: number,
    timezone: string,
    newMilestones: MilestoneUnlocked[],
    targetHours?: number
  ): Promise<SkillMastery10K> {
    const now = new Date();
    const today = getTodayInTimezone(timezone);

    // Get or create mastery record
    let mastery = await tx.skillMastery10K.findUnique({
      where: { userId_skillId: { userId, skillId } },
    });

    if (!mastery) {
      // Create new mastery record with custom target hours support
      const effectiveTargetHours = targetHours ?? DEFAULT_TARGET_HOURS;
      mastery = await tx.skillMastery10K.create({
        data: {
          userId,
          skillId,
          skillName,
          targetHours: effectiveTargetHours,
          totalRawHours: rawHours,
          totalQualityHours: qualityHours,
          sessionsCount: 1,
          averageSessionMinutes: sessionDuration,
          averageQualityScore: qualityMultiplier,
          lastPracticedAt: now,
          currentStreak: 1,
          longestStreak: 1,
          streakStartDate: today,
          lastStreakDate: today,
          hoursThisWeek: qualityHours,
          hoursThisMonth: qualityHours,
          proficiencyLevel: getProficiencyLevel(qualityHours),
          progressPercentage: (qualityHours / effectiveTargetHours) * 100,
          bestSessionDuration: sessionDuration,
          bestQualityMultiplier: qualityMultiplier,
          bestSessionDate: now,
        },
      });

      // Check for milestones on first creation
      await this.checkAndCreateMilestonesInTransaction(
        tx,
        mastery.id,
        userId,
        skillId,
        skillName,
        0,
        qualityHours,
        newMilestones
      );
    } else {
      // Update existing mastery record
      const newTotalRawHours = mastery.totalRawHours + rawHours;
      const newTotalQualityHours = mastery.totalQualityHours + qualityHours;
      const newSessionsCount = mastery.sessionsCount + 1;
      const newAvgSessionMinutes =
        (mastery.averageSessionMinutes * mastery.sessionsCount + sessionDuration) /
        newSessionsCount;
      const newAvgQualityScore =
        (mastery.averageQualityScore * mastery.sessionsCount + qualityMultiplier) /
        newSessionsCount;

      // Update streak with timezone-aware calculations
      let newCurrentStreak = mastery.currentStreak;
      let newLongestStreak = mastery.longestStreak;
      let newStreakStartDate = mastery.streakStartDate;

      if (mastery.lastStreakDate) {
        const daysDiff = getDaysDifference(mastery.lastStreakDate, now, timezone);

        if (daysDiff === 1) {
          newCurrentStreak++;
          if (newCurrentStreak > newLongestStreak) {
            newLongestStreak = newCurrentStreak;
          }
        } else if (daysDiff > 1) {
          newCurrentStreak = 1;
          newStreakStartDate = today;
        }
      } else {
        newCurrentStreak = 1;
        newStreakStartDate = today;
      }

      // Compute period hours
      const periodHours = await this.computePeriodHoursInTransaction(
        tx,
        userId,
        skillId,
        timezone
      );

      // Update best session records
      const newBestDuration = Math.max(mastery.bestSessionDuration, sessionDuration);
      const newBestMultiplier = Math.max(mastery.bestQualityMultiplier, qualityMultiplier);
      const bestSessionDate =
        sessionDuration > mastery.bestSessionDuration ? now : mastery.bestSessionDate;

      mastery = await tx.skillMastery10K.update({
        where: { id: mastery.id },
        data: {
          totalRawHours: newTotalRawHours,
          totalQualityHours: newTotalQualityHours,
          sessionsCount: newSessionsCount,
          averageSessionMinutes: newAvgSessionMinutes,
          averageQualityScore: newAvgQualityScore,
          lastPracticedAt: now,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          streakStartDate: newStreakStartDate,
          lastStreakDate: today,
          hoursThisWeek: periodHours.hoursThisWeek + qualityHours,
          hoursThisMonth: periodHours.hoursThisMonth + qualityHours,
          proficiencyLevel: getProficiencyLevel(newTotalQualityHours),
          progressPercentage: (newTotalQualityHours / mastery.targetHours) * 100,
          bestSessionDuration: newBestDuration,
          bestQualityMultiplier: newBestMultiplier,
          bestSessionDate,
        },
      });

      // Check for new milestones
      await this.checkAndCreateMilestonesInTransaction(
        tx,
        mastery.id,
        userId,
        skillId,
        skillName,
        mastery.totalQualityHours - qualityHours,
        newTotalQualityHours,
        newMilestones
      );
    }

    return this.mapPrismaMastery(mastery);
  }

  /**
   * Compute period hours within transaction
   */
  private async computePeriodHoursInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    skillId: string,
    timezone: string
  ): Promise<{ hoursThisWeek: number; hoursThisMonth: number }> {
    const now = new Date();
    const weekStart = getWeekStartInTimezone(now, timezone);
    const monthStart = getMonthStartInTimezone(now, timezone);

    const sessions = await tx.practiceSession.findMany({
      where: {
        userId,
        skillId,
        status: 'COMPLETED',
        endedAt: { gte: monthStart },
      },
      select: {
        qualityHours: true,
        endedAt: true,
      },
    });

    const hoursThisWeek = sessions
      .filter((s) => s.endedAt && s.endedAt >= weekStart)
      .reduce((sum, s) => sum + (s.qualityHours ?? 0), 0);

    const hoursThisMonth = sessions.reduce(
      (sum, s) => sum + (s.qualityHours ?? 0),
      0
    );

    return { hoursThisWeek, hoursThisMonth };
  }

  /**
   * Check and create milestones within transaction
   */
  private async checkAndCreateMilestonesInTransaction(
    tx: Prisma.TransactionClient,
    masteryId: string,
    userId: string,
    skillId: string,
    skillName: string,
    previousHours: number,
    currentHours: number,
    newMilestones: MilestoneUnlocked[]
  ): Promise<void> {
    const milestoneTypes: PracticeMilestoneType[] = [
      'HOURS_100',
      'HOURS_500',
      'HOURS_1000',
      'HOURS_2500',
      'HOURS_5000',
      'HOURS_7500',
      'HOURS_10000',
    ];

    for (const milestoneType of milestoneTypes) {
      const requiredHours = MILESTONE_HOURS[milestoneType];

      if (previousHours < requiredHours && currentHours >= requiredHours) {
        const existing = await tx.practiceMilestone.findUnique({
          where: {
            userId_skillId_milestoneType: {
              userId,
              skillId,
              milestoneType,
            },
          },
        });

        if (!existing) {
          await tx.practiceMilestone.create({
            data: {
              userId,
              skillMasteryId: masteryId,
              skillId,
              skillName,
              milestoneType,
              hoursRequired: requiredHours,
              hoursAtUnlock: currentHours,
              xpReward: MILESTONE_XP_REWARDS[milestoneType],
              badgeName: MILESTONE_BADGE_NAMES[milestoneType],
            },
          });

          newMilestones.push({
            milestoneType,
            skillName,
            hoursRequired: requiredHours,
            xpReward: MILESTONE_XP_REWARDS[milestoneType],
            badgeName: MILESTONE_BADGE_NAMES[milestoneType],
          });
        }
      }
    }
  }

  /**
   * Update daily practice log within transaction with comprehensive session data
   */
  private async updateDailyPracticeLogInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    dateStr: string,
    sessionData: {
      rawHours: number;
      qualityHours: number;
      durationMinutes: number;
      sessionType: PracticeSessionType;
      skillId?: string;
      qualityMultiplier: number;
      focusLevel: PracticeFocusLevel;
      pomodoroCount: number;
    },
    timezone: string
  ): Promise<{ log: DailyPracticeLogSummary; isFirstToday: boolean }> {
    const { rawHours, qualityHours, durationMinutes, sessionType, skillId, qualityMultiplier, focusLevel, pomodoroCount } = sessionData;

    // Convert focus level to numeric value for averaging
    const focusLevelValue = this.focusLevelToNumeric(focusLevel);

    // Calculate intensity level (0-4 scale like GitHub)
    const calculateIntensityLevel = (totalMinutes: number): number => {
      if (totalMinutes <= 0) return 0;
      if (totalMinutes <= 30) return 1;
      if (totalMinutes <= 60) return 2;
      if (totalMinutes <= 120) return 3;
      return 4;
    };

    // Get session type field to increment
    const sessionTypeField = this.getSessionTypeCounterField(sessionType);

    // Get existing log for today
    const existingLog = await tx.dailyPracticeLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(dateStr),
        },
      },
    });

    const isFirstToday = !existingLog;

    if (existingLog) {
      // Calculate running averages
      const newSessionsCount = existingLog.sessionsCount + 1;
      const newAvgQualityMultiplier =
        (existingLog.avgQualityMultiplier * existingLog.sessionsCount + qualityMultiplier) / newSessionsCount;
      const newAvgFocusLevel =
        (existingLog.avgFocusLevel * existingLog.sessionsCount + focusLevelValue) / newSessionsCount;

      // Update skills practiced array
      const existingSkills = existingLog.skillsPracticed ?? [];
      const newSkillsPracticed = skillId && !existingSkills.includes(skillId)
        ? [...existingSkills, skillId]
        : existingSkills;

      // Calculate new totals
      const newTotalMinutes = existingLog.totalMinutes + durationMinutes;
      const newTotalHours = newTotalMinutes / 60;
      const newQualityHours = existingLog.qualityHours + qualityHours;
      const newRawHours = existingLog.rawHours + rawHours;
      const newPomodorosCompleted = existingLog.pomodorosCompleted + pomodoroCount;

      // Update existing log with all fields
      const updated = await tx.dailyPracticeLog.update({
        where: { id: existingLog.id },
        data: {
          totalMinutes: newTotalMinutes,
          totalHours: newTotalHours,
          qualityHours: newQualityHours,
          rawHours: newRawHours,
          sessionsCount: newSessionsCount,
          avgQualityMultiplier: newAvgQualityMultiplier,
          avgFocusLevel: newAvgFocusLevel,
          skillsPracticed: newSkillsPracticed,
          primarySkillId: skillId ?? existingLog.primarySkillId,
          intensityLevel: calculateIntensityLevel(newTotalMinutes),
          pomodorosCompleted: newPomodorosCompleted,
          contributesToStreak: true,
          // Increment session type counter
          [sessionTypeField]: (existingLog[sessionTypeField as keyof typeof existingLog] as number ?? 0) + 1,
        },
      });

      return {
        log: {
          date: dateStr,
          totalHours: updated.totalHours,
          sessionsCount: updated.sessionsCount,
          currentStreak: updated.currentStreak,
          longestStreak: updated.longestStreak,
        },
        isFirstToday,
      };
    } else {
      // Get previous log for streak calculation
      const yesterday = new Date(dateStr);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateInTimezone(yesterday, timezone);

      const yesterdayLog = await tx.dailyPracticeLog.findUnique({
        where: {
          userId_date: {
            userId,
            date: new Date(yesterdayStr),
          },
        },
      });

      // Calculate streak
      let currentStreak = 1;
      let longestStreak = 1;

      if (yesterdayLog && yesterdayLog.contributesToStreak) {
        currentStreak = yesterdayLog.currentStreak + 1;
        longestStreak = Math.max(currentStreak, yesterdayLog.longestStreak);
      } else {
        // Check if there's any previous log to get longestStreak
        const previousLogs = await tx.dailyPracticeLog.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 1,
        });

        if (previousLogs.length > 0) {
          longestStreak = Math.max(currentStreak, previousLogs[0].longestStreak);
        }
      }

      // Create new daily log with all fields
      const created = await tx.dailyPracticeLog.create({
        data: {
          userId,
          date: new Date(dateStr),
          totalMinutes: durationMinutes,
          totalHours: rawHours,
          qualityHours,
          rawHours,
          sessionsCount: 1,
          avgQualityMultiplier: qualityMultiplier,
          avgFocusLevel: focusLevelValue,
          skillsPracticed: skillId ? [skillId] : [],
          primarySkillId: skillId,
          intensityLevel: calculateIntensityLevel(durationMinutes),
          pomodorosCompleted: pomodoroCount,
          currentStreak,
          longestStreak,
          streakDayNumber: currentStreak,
          contributesToStreak: true,
          // Set session type counter
          [sessionTypeField]: 1,
        },
      });

      return {
        log: {
          date: dateStr,
          totalHours: created.totalHours,
          sessionsCount: created.sessionsCount,
          currentStreak: created.currentStreak,
          longestStreak: created.longestStreak,
        },
        isFirstToday,
      };
    }
  }

  /**
   * Convert focus level enum to numeric value for averaging
   */
  private focusLevelToNumeric(level: PracticeFocusLevel): number {
    const mapping: Record<PracticeFocusLevel, number> = {
      VERY_LOW: 1,
      LOW: 2,
      MEDIUM: 3,
      HIGH: 4,
      DEEP_FLOW: 5,
    };
    return mapping[level] ?? 3;
  }

  /**
   * Get the database field name for session type counter
   */
  private getSessionTypeCounterField(sessionType: PracticeSessionType): string {
    const mapping: Record<PracticeSessionType, string> = {
      DELIBERATE: 'deliberateSessions',
      POMODORO: 'pomodoroSessions',
      GUIDED: 'guidedSessions',
      ASSESSMENT: 'assessmentSessions',
      CASUAL: 'casualSessions',
      REVIEW: 'reviewSessions',
    };
    return mapping[sessionType] ?? 'casualSessions';
  }

  /**
   * Map Prisma session to our interface
   */
  private mapPrismaSession(session: Prisma.PracticeSessionGetPayload<object>): PracticeSession {
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
      status: session.status as 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED',
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

  /**
   * Map Prisma mastery to our interface
   */
  private mapPrismaMastery(mastery: Prisma.SkillMastery10KGetPayload<object>): SkillMastery10K {
    return {
      id: mastery.id,
      userId: mastery.userId,
      skillId: mastery.skillId,
      skillName: mastery.skillName,
      totalRawHours: mastery.totalRawHours,
      totalQualityHours: mastery.totalQualityHours,
      targetHours: mastery.targetHours,
      progressPercentage: mastery.progressPercentage,
      estimatedDaysToGoal: mastery.estimatedDaysToGoal ?? undefined,
      sessionsCount: mastery.sessionsCount,
      averageSessionMinutes: mastery.averageSessionMinutes,
      averageQualityScore: mastery.averageQualityScore,
      lastPracticedAt: mastery.lastPracticedAt ?? undefined,
      currentStreak: mastery.currentStreak,
      longestStreak: mastery.longestStreak,
      streakStartDate: mastery.streakStartDate ?? undefined,
      lastStreakDate: mastery.lastStreakDate ?? undefined,
      hoursThisWeek: mastery.hoursThisWeek,
      hoursThisMonth: mastery.hoursThisMonth,
      avgWeeklyHours: mastery.avgWeeklyHours,
      avgMonthlyHours: mastery.avgMonthlyHours,
      proficiencyLevel: mastery.proficiencyLevel as ProficiencyLevel,
      bestSessionDuration: mastery.bestSessionDuration,
      bestQualityMultiplier: mastery.bestQualityMultiplier,
      bestSessionDate: mastery.bestSessionDate ?? undefined,
      createdAt: mastery.createdAt,
      updatedAt: mastery.updatedAt,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createTransactionalPracticeSessionOrchestrator(): TransactionalPracticeSessionOrchestrator {
  return new TransactionalPracticeSessionOrchestrator();
}
