/**
 * Student Analytics Helpers
 *
 * Pure computation functions for Stages 1-2 of the PRISM pipeline.
 * NO AI calls — these functions transform raw Prisma data into structured analytics.
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type {
  BloomsLevel,
  BloomsMasteryStatus,
  BloomsCognitiveMap,
  BloomsSkillData,
  DiagnoseData,
  EngagementData,
  ExamAttemptData,
  PerformanceSnapshot,
  ReasoningPath,
  TimeRange,
  CourseScope,
  CognitiveCluster,
} from './agentic-types';
import { BLOOMS_LEVEL_ORDER, BLOOMS_LEVELS } from './agentic-types';

// =============================================================================
// DATE RANGE HELPERS
// =============================================================================

export function getDateRange(timeRange: TimeRange): Date {
  const now = new Date();
  switch (timeRange) {
    case 'last_7_days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'last_30_days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'last_90_days':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all_time':
      return new Date(0); // epoch
  }
}

// =============================================================================
// STAGE 1: DATA COLLECTION
// =============================================================================

/**
 * Collect all raw performance data in 3 parallel query groups.
 * NO AI calls — pure Prisma queries.
 */
export async function collectPerformanceData(
  userId: string,
  timeRange: TimeRange,
  courseScope: CourseScope,
  courseId?: string
): Promise<PerformanceSnapshot> {
  const since = getDateRange(timeRange);
  const courseFilter = buildCourseFilter(courseScope, courseId);

  // Run 3 parallel query groups
  const [groupA, groupB, groupC] = await Promise.all([
    collectCognitiveData(userId, since, courseFilter),
    collectAssessmentData(userId, since, courseFilter),
    collectEngagementData(userId, since, courseFilter),
  ]);

  return {
    userId,
    collectedAt: new Date(),
    timeRange,
    courseScope,
    bloomsSkills: groupA.bloomsSkills,
    bloomsMetrics: groupA.bloomsMetrics,
    examAttempts: groupB.examAttempts,
    diagnoseRecords: groupB.diagnoseRecords,
    engagement: groupC,
  };
}

function buildCourseFilter(
  scope: CourseScope,
  courseId?: string
): { courseId?: string } | Record<string, never> {
  if (scope === 'specific_course' && courseId) {
    return { courseId };
  }
  return {};
}

// =============================================================================
// GROUP A: COGNITIVE DATA
// =============================================================================

async function collectCognitiveData(
  userId: string,
  since: Date,
  courseFilter: { courseId?: string } | Record<string, never>
): Promise<{
  bloomsSkills: BloomsSkillData[];
  bloomsMetrics: Array<{
    bloomsLevel: BloomsLevel;
    accuracy: number;
    totalAttempts: number;
    improvementRate: number;
  }>;
}> {
  const [skills, metrics] = await Promise.all([
    db.cognitiveSkillProgress.findMany({
      where: {
        userId,
        updatedAt: { gte: since },
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
    }),
    db.bloomsPerformanceMetric.findMany({
      where: {
        userId,
        recordedAt: { gte: since },
        ...courseFilter,
      },
      take: 100,
      orderBy: { recordedAt: 'desc' },
    }),
  ]);

  const bloomsSkills: BloomsSkillData[] = skills.map((s) => ({
    conceptId: s.conceptId,
    rememberMastery: s.rememberMastery,
    understandMastery: s.understandMastery,
    applyMastery: s.applyMastery,
    analyzeMastery: s.analyzeMastery,
    evaluateMastery: s.evaluateMastery,
    createMastery: s.createMastery,
    overallMastery: s.overallMastery,
    currentBloomsLevel: s.currentBloomsLevel,
    totalAttempts: s.totalAttempts,
    trend: s.trend ?? null,
    confidence: s.confidence ?? null,
  }));

  const bloomsMetrics = metrics.map((m) => ({
    bloomsLevel: m.bloomsLevel,
    accuracy: m.accuracy,
    totalAttempts: m.totalAttempts,
    improvementRate: m.improvementRate,
  }));

  return { bloomsSkills, bloomsMetrics };
}

// =============================================================================
// GROUP B: ASSESSMENT DATA
// =============================================================================

async function collectAssessmentData(
  userId: string,
  since: Date,
  courseFilter: { courseId?: string } | Record<string, never>
): Promise<{
  examAttempts: ExamAttemptData[];
  diagnoseRecords: DiagnoseData[];
}> {
  // Get exam attempts
  const examWhere: Record<string, unknown> = {
    userId,
    startedAt: { gte: since },
  };
  if (courseFilter.courseId) {
    examWhere.Exam = { courseId: courseFilter.courseId };
  }

  const attempts = await db.userExamAttempt.findMany({
    where: examWhere,
    take: 50,
    orderBy: { startedAt: 'desc' },
    select: {
      id: true,
      examId: true,
      scorePercentage: true,
      isPassed: true,
      totalQuestions: true,
      correctAnswers: true,
      startedAt: true,
      timeSpent: true,
    },
  });

  const examAttempts: ExamAttemptData[] = attempts.map((a) => ({
    attemptId: a.id,
    examId: a.examId,
    scorePercentage: a.scorePercentage,
    isPassed: a.isPassed,
    totalQuestions: a.totalQuestions,
    correctAnswers: a.correctAnswers,
    startedAt: a.startedAt,
    timeSpent: a.timeSpent,
  }));

  // Get DIAGNOSE evaluation records
  const attemptIds = attempts.map((a) => a.id);
  let diagnoseRecords: DiagnoseData[] = [];

  if (attemptIds.length > 0) {
    const answers = await db.enhancedAnswer.findMany({
      where: {
        attemptId: { in: attemptIds },
      },
      include: {
        aiEvaluations: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      take: 200,
    });

    diagnoseRecords = answers
      .filter((a) => a.aiEvaluations.length > 0)
      .map((a) => {
        const eval_ = a.aiEvaluations[0];
        return {
          answerId: a.id,
          targetBloomsLevel: eval_.targetBloomsLevel,
          demonstratedLevel: eval_.demonstratedLevel,
          score: eval_.score,
          accuracy: eval_.accuracy,
          completeness: eval_.completeness,
          depth: eval_.depth,
          misconceptions: eval_.misconceptions,
          feedback: eval_.feedback,
        };
      });
  }

  return { examAttempts, diagnoseRecords };
}

// =============================================================================
// GROUP C: ENGAGEMENT DATA
// =============================================================================

async function collectEngagementData(
  userId: string,
  since: Date,
  courseFilter: { courseId?: string } | Record<string, never>
): Promise<EngagementData> {
  const [sessions, enrollments, streaks, activities, practices, spacedRepDue] =
    await Promise.all([
      db.learningSession.findMany({
        where: {
          userId,
          startTime: { gte: since },
          ...(courseFilter.courseId ? { contentId: courseFilter.courseId } : {}),
        },
        select: { duration: true },
        take: 500,
      }),
      db.enrollment.findMany({
        where: { userId, ...courseFilter },
        select: { status: true },
      }),
      db.study_streaks.findMany({
        where: { userId, ...courseFilter },
        select: {
          currentStreak: true,
          longestStreak: true,
          lastStudyDate: true,
        },
        take: 10,
      }),
      db.learningActivityLog.count({
        where: {
          userId,
          createdAt: { gte: since },
          ...(courseFilter.courseId ? { courseId: courseFilter.courseId } : {}),
        },
      }),
      db.practiceSession.count({
        where: {
          userId,
          startedAt: { gte: since },
          ...(courseFilter.courseId ? { courseId: courseFilter.courseId } : {}),
        },
      }),
      db.spacedRepetitionSchedule.count({
        where: {
          userId,
          nextReviewDate: { lte: new Date() },
        },
      }),
    ]);

  const totalDurationSeconds = sessions.reduce(
    (sum, s) => sum + (s.duration ?? 0),
    0
  );
  const totalDurationMinutes = Math.round(totalDurationSeconds / 60);
  const avgSessionDurationMinutes =
    sessions.length > 0
      ? Math.round(totalDurationMinutes / sessions.length)
      : 0;

  const activeCourses = enrollments.filter(
    (e) => e.status === 'ACTIVE'
  ).length;

  const maxStreak = streaks.reduce(
    (acc, s) => ({
      currentStreak: Math.max(acc.currentStreak, s.currentStreak),
      longestStreak: Math.max(acc.longestStreak, s.longestStreak),
      lastStudyDate:
        !acc.lastStudyDate || s.lastStudyDate > acc.lastStudyDate
          ? s.lastStudyDate
          : acc.lastStudyDate,
    }),
    {
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null as Date | null,
    }
  );

  return {
    totalSessions: sessions.length,
    totalDurationMinutes,
    avgSessionDurationMinutes,
    enrolledCourses: enrollments.length,
    activeCourses,
    currentStreak: maxStreak.currentStreak,
    longestStreak: maxStreak.longestStreak,
    lastStudyDate: maxStreak.lastStudyDate,
    recentActivityCount: activities,
    practiceSessionCount: practices,
    spacedRepetitionDueCount: spacedRepDue,
  };
}

// =============================================================================
// STAGE 2: BLOOM'S COGNITIVE MAP COMPUTATION
// =============================================================================

/**
 * Compute the Bloom&apos;s Cognitive Map from raw performance data.
 * NO AI calls — pure computation.
 */
export function computeBloomsCognitiveMap(
  snapshot: PerformanceSnapshot
): BloomsCognitiveMap {
  const levelMastery = computeLevelMastery(snapshot.bloomsSkills);
  const cognitiveCeiling = computeCognitiveCeiling(levelMastery);
  const growthEdge = computeGrowthEdge(cognitiveCeiling);
  const velocity = computeVelocity(snapshot.bloomsSkills, snapshot.timeRange);
  const reasoningDistribution = computeReasoningDistribution(
    snapshot.diagnoseRecords
  );
  const { fragileCount, fragilePercentage } = detectFragileKnowledge(
    snapshot.diagnoseRecords
  );
  const cognitiveHealthScore = computeCognitiveHealthScore(
    levelMastery,
    velocity,
    fragilePercentage,
    snapshot.engagement
  );
  const { declining, improving } = detectTrends(snapshot.bloomsSkills);

  return {
    levelMastery,
    cognitiveCeiling,
    growthEdge,
    velocity,
    reasoningDistribution,
    fragileKnowledgeCount: fragileCount,
    fragileKnowledgePercentage: fragilePercentage,
    cognitiveHealthScore,
    decliningConcepts: declining,
    improvingConcepts: improving,
  };
}

// =============================================================================
// COGNITIVE MAP SUB-COMPUTATIONS
// =============================================================================

function computeLevelMastery(
  skills: BloomsSkillData[]
): Record<BloomsLevel, { score: number; status: BloomsMasteryStatus; skillCount: number }> {
  const result = {} as Record<
    BloomsLevel,
    { score: number; status: BloomsMasteryStatus; skillCount: number }
  >;

  for (const level of BLOOMS_LEVELS) {
    const scores = skills.map((s) => getMasteryForLevel(s, level));
    const nonZero = scores.filter((s) => s > 0);
    const avg = nonZero.length > 0
      ? nonZero.reduce((sum, s) => sum + s, 0) / nonZero.length
      : 0;

    result[level] = {
      score: Math.round(avg * 10) / 10,
      status: scoreToStatus(avg),
      skillCount: nonZero.length,
    };
  }

  return result;
}

function getMasteryForLevel(skill: BloomsSkillData, level: BloomsLevel): number {
  switch (level) {
    case 'REMEMBER': return skill.rememberMastery;
    case 'UNDERSTAND': return skill.understandMastery;
    case 'APPLY': return skill.applyMastery;
    case 'ANALYZE': return skill.analyzeMastery;
    case 'EVALUATE': return skill.evaluateMastery;
    case 'CREATE': return skill.createMastery;
    default: return 0;
  }
}

function scoreToStatus(score: number): BloomsMasteryStatus {
  if (score >= 80) return 'mastery';
  if (score >= 60) return 'solid';
  if (score >= 40) return 'developing';
  if (score >= 20) return 'emerging';
  return 'gap';
}

export function computeCognitiveCeiling(
  levelMastery: Record<BloomsLevel, { score: number; status: BloomsMasteryStatus; skillCount: number }>
): BloomsLevel {
  let ceiling: BloomsLevel = 'REMEMBER';
  for (const level of BLOOMS_LEVELS) {
    if (levelMastery[level].score >= 80) {
      ceiling = level;
    } else {
      break;
    }
  }
  return ceiling;
}

export function computeGrowthEdge(ceiling: BloomsLevel): BloomsLevel {
  const ceilingOrder = BLOOMS_LEVEL_ORDER[ceiling];
  const nextOrder = Math.min(ceilingOrder + 1, 5);
  return BLOOMS_LEVELS[nextOrder];
}

export function computeVelocity(
  skills: BloomsSkillData[],
  timeRange: TimeRange
): number {
  if (skills.length === 0) return 0;

  // Estimate months in the time range
  const monthsMap: Record<TimeRange, number> = {
    last_7_days: 0.25,
    last_30_days: 1,
    last_90_days: 3,
    all_time: 12,
  };
  const months = monthsMap[timeRange] || 1;

  // Count skills that have advanced above REMEMBER
  const advancedSkills = skills.filter(
    (s) => BLOOMS_LEVEL_ORDER[s.currentBloomsLevel] > 0
  );

  if (advancedSkills.length === 0) return 0;

  // Average levels gained across all skills
  const totalLevelsGained = advancedSkills.reduce(
    (sum, s) => sum + BLOOMS_LEVEL_ORDER[s.currentBloomsLevel],
    0
  );

  return Math.round((totalLevelsGained / advancedSkills.length / months) * 10) / 10;
}

export function computeReasoningDistribution(
  diagnoseRecords: DiagnoseData[]
): Record<ReasoningPath, number> {
  const distribution: Record<ReasoningPath, number> = {
    expert: 0,
    valid_alternative: 0,
    fragile: 0,
    partial: 0,
    wrong_model: 0,
    guessing: 0,
  };

  if (diagnoseRecords.length === 0) return distribution;

  // Extract reasoning paths from DIAGNOSE feedback
  // The reasoning path is embedded in the evaluation data
  for (const record of diagnoseRecords) {
    const feedback = record.feedback?.toLowerCase() ?? '';
    if (feedback.includes('expert') || record.accuracy >= 90) {
      distribution.expert++;
    } else if (feedback.includes('fragile') || (record.accuracy >= 70 && record.depth < 50)) {
      distribution.fragile++;
    } else if (feedback.includes('partial') || (record.accuracy >= 50 && record.accuracy < 70)) {
      distribution.partial++;
    } else if (record.accuracy < 30) {
      distribution.guessing++;
    } else {
      distribution.valid_alternative++;
    }
  }

  // Convert to percentages
  const total = diagnoseRecords.length;
  for (const key of Object.keys(distribution) as ReasoningPath[]) {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  }

  return distribution;
}

export function detectFragileKnowledge(
  diagnoseRecords: DiagnoseData[]
): { fragileCount: number; fragilePercentage: number } {
  if (diagnoseRecords.length === 0) {
    return { fragileCount: 0, fragilePercentage: 0 };
  }

  // Fragile knowledge: score >= 70 but depth < 50 (correct but shallow reasoning)
  const fragileCount = diagnoseRecords.filter(
    (r) => r.score >= 7 && r.depth < 50
  ).length;

  const fragilePercentage = Math.round(
    (fragileCount / diagnoseRecords.length) * 100
  );

  return { fragileCount, fragilePercentage };
}

function computeCognitiveHealthScore(
  levelMastery: Record<BloomsLevel, { score: number; status: BloomsMasteryStatus; skillCount: number }>,
  velocity: number,
  fragilePercentage: number,
  engagement: EngagementData
): number {
  // Weighted composite:
  // 40% Bloom's mastery breadth
  // 20% velocity
  // 20% engagement consistency
  // 20% knowledge durability (inverse of fragile %)

  const masteryScores = BLOOMS_LEVELS.map((l) => levelMastery[l].score);
  const avgMastery =
    masteryScores.reduce((s, v) => s + v, 0) / masteryScores.length;
  const masteryComponent = Math.min(avgMastery, 100) * 0.4;

  const velocityComponent = Math.min(velocity * 20, 100) * 0.2;

  const consistencyScore =
    engagement.currentStreak > 0
      ? Math.min(engagement.currentStreak * 10, 100)
      : engagement.totalSessions > 0
        ? 30
        : 0;
  const engagementComponent = consistencyScore * 0.2;

  const durabilityComponent = Math.max(0, 100 - fragilePercentage) * 0.2;

  return Math.round(
    masteryComponent + velocityComponent + engagementComponent + durabilityComponent
  );
}

function detectTrends(
  skills: BloomsSkillData[]
): { declining: string[]; improving: string[] } {
  const declining: string[] = [];
  const improving: string[] = [];

  for (const skill of skills) {
    if (skill.trend === 'declining') {
      declining.push(skill.conceptId);
    } else if (skill.trend === 'improving') {
      improving.push(skill.conceptId);
    }
  }

  return { declining: declining.slice(0, 10), improving: improving.slice(0, 10) };
}

// =============================================================================
// COGNITIVE CLUSTER CLASSIFICATION
// =============================================================================

export function classifyCognitiveCluster(
  map: BloomsCognitiveMap,
  engagement: EngagementData
): CognitiveCluster {
  const { levelMastery, velocity, fragileKnowledgePercentage, cognitiveHealthScore } = map;

  // Self-Directed Expert: high health, high velocity, low fragile
  if (
    cognitiveHealthScore >= 75 &&
    velocity >= 1.5 &&
    fragileKnowledgePercentage < 10
  ) {
    return 'self_directed_expert';
  }

  // Surface Skimmer: good at lower levels, poor at higher
  const lowerAvg =
    (levelMastery.REMEMBER.score + levelMastery.UNDERSTAND.score) / 2;
  const upperAvg =
    (levelMastery.APPLY.score +
      levelMastery.ANALYZE.score +
      levelMastery.EVALUATE.score +
      levelMastery.CREATE.score) /
    4;
  if (lowerAvg >= 60 && upperAvg < 30) {
    return 'surface_skimmer';
  }

  // Inconsistent Engager: variable engagement, fragile knowledge
  if (
    engagement.currentStreak < 3 &&
    engagement.totalSessions > 5 &&
    fragileKnowledgePercentage > 30
  ) {
    return 'inconsistent_engager';
  }

  // Slow but Deep: lower velocity but high upper-level scores
  if (velocity < 1.0 && upperAvg >= 40) {
    return 'slow_but_deep';
  }

  // Fast Starter: high velocity, moderate mastery
  if (velocity >= 1.5 && cognitiveHealthScore < 70) {
    return 'fast_starter';
  }

  // Default to inconsistent if nothing else matches
  return 'inconsistent_engager';
}

// =============================================================================
// CACHE KEY BUILDER
// =============================================================================

export function buildCacheKey(
  userId: string,
  scope: CourseScope,
  timeRange: TimeRange,
  courseId?: string
): string {
  const parts = ['student-analytics', userId, scope, timeRange];
  if (courseId) parts.push(courseId);
  return parts.join(':');
}

// =============================================================================
// CACHE TTL BY DEPTH
// =============================================================================

export function getCacheTTL(depth: string): number {
  switch (depth) {
    case 'quick_snapshot':
      return 15 * 60 * 1000; // 15 minutes
    case 'standard':
      return 60 * 60 * 1000; // 1 hour
    case 'deep_analysis':
      return 2 * 60 * 60 * 1000; // 2 hours
    default:
      return 60 * 60 * 1000;
  }
}

// =============================================================================
// JSON EXTRACTION UTILITY
// =============================================================================

export function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const fenced = trimmed.replace(/```json|```/g, '').trim();
  if (fenced.startsWith('{') || fenced.startsWith('[')) return fenced;
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export function safeJsonParse<T>(raw: string, label: string): T | null {
  try {
    const json = extractJson(raw);
    return JSON.parse(json) as T;
  } catch (error) {
    logger.warn(`[StudentAnalytics] Failed to parse ${label}`, {
      error: error instanceof Error ? error.message : String(error),
      rawLength: raw.length,
    });
    return null;
  }
}
