/**
 * Creator Analytics Helpers
 *
 * Pure computation functions for Stages 1-2 of the PRISM creator pipeline.
 * NO AI calls — these functions aggregate and transform Prisma data.
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type {
  BloomsLevel,
  BloomsMasteryStatus,
  CohortBloomsData,
  CohortCognitiveAnalysis,
  ContentCompletionData,
  CreatorDataSnapshot,
  EngagementSummary,
  EngagementTier,
  EnrollmentSummary,
  ExamPerformanceSummary,
  MisconceptionFrequency,
  TimeRange,
} from './agentic-types';
import { BLOOMS_LEVELS, BLOOMS_LEVEL_ORDER } from './agentic-types';

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
      return new Date(0);
  }
}

// =============================================================================
// STAGE 1: DATA COLLECTION & AGGREGATION
// =============================================================================

/**
 * Collect all course-level data in parallel query groups.
 * Uses chunked aggregation and groupBy for large cohorts.
 */
export async function collectCreatorData(
  courseId: string,
  timeRange: TimeRange
): Promise<CreatorDataSnapshot> {
  const since = getDateRange(timeRange);

  // Get course info
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    throw new Error(`Course not found: ${courseId}`);
  }

  // Run parallel query groups
  const [
    enrollmentData,
    cohortBlooms,
    examPerf,
    engagementData,
    contentData,
    diagnoseAgg,
  ] = await Promise.all([
    collectEnrollmentData(courseId),
    collectCohortBloomsData(courseId, since),
    collectExamPerformance(courseId, since),
    collectEngagementData(courseId, since),
    collectContentCompletion(courseId),
    collectDiagnoseAggregation(courseId, since),
  ]);

  return {
    courseId,
    courseName: course.title ?? 'Untitled Course',
    collectedAt: new Date(),
    timeRange,
    enrollment: enrollmentData,
    cohortBlooms,
    examPerformance: examPerf,
    engagement: engagementData,
    contentCompletion: contentData,
    misconceptionFrequencies: diagnoseAgg.misconceptions,
    avgDiagnoseAccuracy: diagnoseAgg.avgAccuracy,
    avgDiagnoseDepth: diagnoseAgg.avgDepth,
    totalDiagnoseRecords: diagnoseAgg.totalRecords,
  };
}

// =============================================================================
// ENROLLMENT DATA
// =============================================================================

async function collectEnrollmentData(
  courseId: string
): Promise<EnrollmentSummary> {
  const enrollments = await db.enrollment.findMany({
    where: { courseId },
    select: { status: true },
  });

  const activeCount = enrollments.filter((e) => e.status === 'ACTIVE').length;
  const completedCount = enrollments.filter(
    (e) => e.status === 'COMPLETED'
  ).length;
  const droppedCount = enrollments.filter(
    (e) => e.status === 'DROPPED' || e.status === 'INACTIVE'
  ).length;

  return {
    totalEnrolled: enrollments.length,
    activeCount,
    completedCount,
    droppedCount,
  };
}

// =============================================================================
// COHORT BLOOM'S DATA
// =============================================================================

async function collectCohortBloomsData(
  courseId: string,
  since: Date
): Promise<CohortBloomsData[]> {
  // Get enrolled student IDs
  const enrollments = await db.enrollment.findMany({
    where: { courseId },
    select: { userId: true },
    take: 5000,
  });
  const userIds = enrollments.map((e) => e.userId);

  if (userIds.length === 0) return [];

  // Aggregate cognitive data across enrolled students
  const skills = await db.cognitiveSkillProgress.findMany({
    where: {
      userId: { in: userIds },
      updatedAt: { gte: since },
    },
    select: {
      rememberMastery: true,
      understandMastery: true,
      applyMastery: true,
      analyzeMastery: true,
      evaluateMastery: true,
      createMastery: true,
    },
    take: 10000,
  });

  if (skills.length === 0) return [];

  // Compute average mastery per Bloom's level
  const result: CohortBloomsData[] = BLOOMS_LEVELS.map((level) => {
    const scores = skills.map((s) => getMasteryForLevel(s, level));
    const nonZero = scores.filter((v) => v > 0);
    const avg =
      nonZero.length > 0
        ? nonZero.reduce((sum, v) => sum + v, 0) / nonZero.length
        : 0;
    return {
      level,
      avgMastery: Math.round(avg * 10) / 10,
      studentCount: nonZero.length,
    };
  });

  return result;
}

function getMasteryForLevel(
  skill: {
    rememberMastery: number;
    understandMastery: number;
    applyMastery: number;
    analyzeMastery: number;
    evaluateMastery: number;
    createMastery: number;
  },
  level: BloomsLevel
): number {
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

// =============================================================================
// EXAM PERFORMANCE
// =============================================================================

async function collectExamPerformance(
  courseId: string,
  since: Date
): Promise<ExamPerformanceSummary[]> {
  const exams = await db.exam.findMany({
    where: {
      section: {
        chapter: {
          courseId,
        },
      },
    },
    select: { id: true },
    take: 50,
  });

  if (exams.length === 0) return [];

  const examIds = exams.map((e) => e.id);

  const attempts = await db.userExamAttempt.findMany({
    where: {
      examId: { in: examIds },
      startedAt: { gte: since },
      status: { in: ['SUBMITTED', 'GRADED'] },
    },
    select: {
      examId: true,
      scorePercentage: true,
      isPassed: true,
      timeSpent: true,
    },
    take: 5000,
  });

  // Group by exam
  const examMap = new Map<string, typeof attempts>();
  for (const a of attempts) {
    const list = examMap.get(a.examId) ?? [];
    list.push(a);
    examMap.set(a.examId, list);
  }

  return Array.from(examMap.entries()).map(([examId, atts]) => {
    const scores = atts
      .map((a) => a.scorePercentage)
      .filter((s): s is number => s !== null);
    const passed = atts.filter((a) => a.isPassed === true).length;
    const times = atts
      .map((a) => a.timeSpent)
      .filter((t): t is number => t !== null);

    return {
      examId,
      totalAttempts: atts.length,
      avgScore:
        scores.length > 0
          ? Math.round(
              (scores.reduce((s, v) => s + v, 0) / scores.length) * 10
            ) / 10
          : 0,
      passRate:
        atts.length > 0
          ? Math.round((passed / atts.length) * 100)
          : 0,
      avgTimeSpent:
        times.length > 0
          ? Math.round(times.reduce((s, v) => s + v, 0) / times.length)
          : null,
    };
  });
}

// =============================================================================
// ENGAGEMENT DATA
// =============================================================================

async function collectEngagementData(
  courseId: string,
  since: Date
): Promise<EngagementSummary> {
  const enrollments = await db.enrollment.findMany({
    where: { courseId },
    select: { userId: true, updatedAt: true },
    take: 5000,
  });
  const userIds = enrollments.map((e) => e.userId);

  if (userIds.length === 0) {
    return {
      avgSessionsPerStudent: 0,
      avgDurationMinutes: 0,
      totalActiveSessions: 0,
      lastActiveDistribution: {
        within7Days: 0,
        within30Days: 0,
        over30Days: 0,
        over90Days: 0,
      },
    };
  }

  const sessions = await db.learningSession.findMany({
    where: {
      userId: { in: userIds },
      contentId: courseId,
      startTime: { gte: since },
    },
    select: { userId: true, duration: true },
    take: 10000,
  });

  const totalDuration = sessions.reduce((s, sess) => s + (sess.duration ?? 0), 0);
  const uniqueUsers = new Set(sessions.map((s) => s.userId)).size;

  // Last active distribution
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  let within7 = 0;
  let within30 = 0;
  let over30 = 0;
  let over90 = 0;

  for (const enrollment of enrollments) {
    const lastActive = enrollment.updatedAt;
    if (lastActive >= sevenDaysAgo) within7++;
    else if (lastActive >= thirtyDaysAgo) within30++;
    else if (lastActive >= ninetyDaysAgo) over30++;
    else over90++;
  }

  return {
    avgSessionsPerStudent:
      uniqueUsers > 0 ? Math.round(sessions.length / uniqueUsers) : 0,
    avgDurationMinutes:
      sessions.length > 0
        ? Math.round(totalDuration / sessions.length / 60)
        : 0,
    totalActiveSessions: sessions.length,
    lastActiveDistribution: {
      within7Days: within7,
      within30Days: within30,
      over30Days: over30,
      over90Days: over90,
    },
  };
}

// =============================================================================
// CONTENT COMPLETION
// =============================================================================

async function collectContentCompletion(
  courseId: string
): Promise<ContentCompletionData[]> {
  const chapters = await db.chapter.findMany({
    where: { courseId },
    select: { id: true, title: true },
    orderBy: { position: 'asc' },
    take: 50,
  });

  if (chapters.length === 0) return [];

  // Use UserProgress to calculate completion per chapter
  const result: ContentCompletionData[] = [];

  for (const chapter of chapters) {
    const progress = await db.user_progress.findMany({
      where: {
        chapterId: chapter.id,
      },
      select: { isCompleted: true },
      take: 5000,
    });

    const completed = progress.filter((p: { isCompleted: boolean }) => p.isCompleted).length;
    const completionRate =
      progress.length > 0
        ? Math.round((completed / progress.length) * 100)
        : 0;

    result.push({
      chapterId: chapter.id,
      chapterTitle: chapter.title ?? `Chapter ${chapter.id}`,
      completionRate,
      avgTimeSpent: 0, // Simplified — would need session data per chapter
    });
  }

  return result;
}

// =============================================================================
// DIAGNOSE AGGREGATION
// =============================================================================

async function collectDiagnoseAggregation(
  courseId: string,
  since: Date
): Promise<{
  misconceptions: MisconceptionFrequency[];
  avgAccuracy: number;
  avgDepth: number;
  totalRecords: number;
}> {
  // Get exams for this course (through Section -> Chapter -> Course)
  const exams = await db.exam.findMany({
    where: {
      section: {
        chapter: {
          courseId,
        },
      },
    },
    select: { id: true },
    take: 50,
  });

  if (exams.length === 0) {
    return { misconceptions: [], avgAccuracy: 0, avgDepth: 0, totalRecords: 0 };
  }

  const examIds = exams.map((e) => e.id);

  // Get evaluation records through attempts
  const attempts = await db.userExamAttempt.findMany({
    where: {
      examId: { in: examIds },
      startedAt: { gte: since },
    },
    select: { id: true },
    take: 5000,
  });

  if (attempts.length === 0) {
    return { misconceptions: [], avgAccuracy: 0, avgDepth: 0, totalRecords: 0 };
  }

  const attemptIds = attempts.map((a) => a.id);

  const answers = await db.enhancedAnswer.findMany({
    where: { attemptId: { in: attemptIds } },
    include: {
      aiEvaluations: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          accuracy: true,
          depth: true,
          misconceptions: true,
        },
      },
    },
    take: 10000,
  });

  const evals = answers.flatMap((a) => a.aiEvaluations);

  if (evals.length === 0) {
    return { misconceptions: [], avgAccuracy: 0, avgDepth: 0, totalRecords: 0 };
  }

  // Aggregate accuracy and depth
  const totalAccuracy = evals.reduce((s, e) => s + e.accuracy, 0);
  const totalDepth = evals.reduce((s, e) => s + e.depth, 0);

  // Aggregate misconceptions
  const misconceptionMap = new Map<
    string,
    { name: string; category: string; count: number; students: Set<string> }
  >();

  for (const answer of answers) {
    for (const eval_ of answer.aiEvaluations) {
      if (eval_.misconceptions && Array.isArray(eval_.misconceptions)) {
        for (const m of eval_.misconceptions as Array<{
          id?: string;
          name?: string;
          category?: string;
        }>) {
          const id = m.id ?? 'unknown';
          const existing = misconceptionMap.get(id);
          if (existing) {
            existing.count++;
            existing.students.add(answer.attemptId);
          } else {
            misconceptionMap.set(id, {
              name: m.name ?? id,
              category: m.category ?? 'unknown',
              count: 1,
              students: new Set([answer.attemptId]),
            });
          }
        }
      }
    }
  }

  const misconceptions: MisconceptionFrequency[] = Array.from(
    misconceptionMap.entries()
  )
    .map(([id, data]) => ({
      misconceptionId: id,
      name: data.name,
      category: data.category,
      frequency: data.count,
      affectedStudents: data.students.size,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);

  return {
    misconceptions,
    avgAccuracy: Math.round((totalAccuracy / evals.length) * 10) / 10,
    avgDepth: Math.round((totalDepth / evals.length) * 10) / 10,
    totalRecords: evals.length,
  };
}

// =============================================================================
// STAGE 2: COHORT COGNITIVE ANALYSIS
// =============================================================================

export function computeCohortCognitiveAnalysis(
  snapshot: CreatorDataSnapshot
): CohortCognitiveAnalysis {
  const bloomsDistribution = computeBloomsDistribution(snapshot);
  const isBimodal = detectBimodal(snapshot.cohortBlooms);
  const cohortVelocity = computeCohortVelocity(snapshot.cohortBlooms);
  const fragileAlarm = computeFragileAlarm(snapshot);
  const engagementDist = computeEngagementDistribution(snapshot.engagement);
  const conceptHeatmap = computeConceptHeatmap(snapshot.cohortBlooms);
  const dropoutRisk = computeDropoutRisk(snapshot.engagement);
  const healthScore = computeCohortHealthScore(
    snapshot,
    cohortVelocity,
    fragileAlarm.percentage,
    dropoutRisk
  );

  return {
    bloomsDistribution,
    isBimodal: isBimodal.is,
    bimodalDescription: isBimodal.description,
    cohortVelocity,
    fragileKnowledgeAlarm: fragileAlarm,
    engagementDistribution: engagementDist,
    conceptHeatmap,
    dropoutRisk,
    cohortHealthScore: healthScore,
  };
}

// =============================================================================
// SUB-COMPUTATIONS
// =============================================================================

function computeBloomsDistribution(
  snapshot: CreatorDataSnapshot
): Record<BloomsLevel, { studentCount: number; percentage: number }> {
  const result = {} as Record<
    BloomsLevel,
    { studentCount: number; percentage: number }
  >;
  const total = snapshot.enrollment.totalEnrolled || 1;

  for (const level of BLOOMS_LEVELS) {
    const data = snapshot.cohortBlooms.find((b) => b.level === level);
    const count = data?.studentCount ?? 0;
    result[level] = {
      studentCount: count,
      percentage: Math.round((count / total) * 100),
    };
  }

  return result;
}

function detectBimodal(
  cohortBlooms: CohortBloomsData[]
): { is: boolean; description?: string } {
  if (cohortBlooms.length < 2) return { is: false };

  // Check if there's a significant gap between lower and upper levels
  const lowerAvg =
    cohortBlooms
      .filter((b) => BLOOMS_LEVEL_ORDER[b.level] <= 1)
      .reduce((s, b) => s + b.avgMastery, 0) / 2;
  const upperAvg =
    cohortBlooms
      .filter((b) => BLOOMS_LEVEL_ORDER[b.level] >= 3)
      .reduce((s, b) => s + b.avgMastery, 0) / 3;

  const gap = Math.abs(lowerAvg - upperAvg);

  if (gap > 30) {
    return {
      is: true,
      description: `Cohort shows bimodal distribution with ${Math.round(gap)}% gap between lower (${Math.round(lowerAvg)}%) and upper (${Math.round(upperAvg)}%) Bloom&apos;s levels. Students are splitting into two distinct groups.`,
    };
  }

  return { is: false };
}

function computeCohortVelocity(cohortBlooms: CohortBloomsData[]): number {
  if (cohortBlooms.length === 0) return 0;

  // Find highest level with meaningful student count
  let highestMeaningful = 0;
  for (const data of cohortBlooms) {
    if (data.studentCount > 0 && data.avgMastery >= 40) {
      highestMeaningful = Math.max(
        highestMeaningful,
        BLOOMS_LEVEL_ORDER[data.level]
      );
    }
  }

  // Simplified velocity estimate (levels per month, assuming 1 month window)
  return Math.round(highestMeaningful * 10) / 10;
}

function computeFragileAlarm(
  snapshot: CreatorDataSnapshot
): { percentage: number; affectedStudents: number; isAlarming: boolean } {
  if (snapshot.totalDiagnoseRecords === 0) {
    return { percentage: 0, affectedStudents: 0, isAlarming: false };
  }

  // Estimate fragile knowledge from accuracy vs depth disparity
  const fragilePercentage =
    snapshot.avgDiagnoseAccuracy > 50 && snapshot.avgDiagnoseDepth < 40
      ? Math.round(
          ((snapshot.avgDiagnoseAccuracy - snapshot.avgDiagnoseDepth) /
            snapshot.avgDiagnoseAccuracy) *
            100
        )
      : 0;

  const affectedStudents = Math.round(
    (fragilePercentage / 100) * snapshot.enrollment.totalEnrolled
  );

  return {
    percentage: fragilePercentage,
    affectedStudents,
    isAlarming: fragilePercentage > 30,
  };
}

function computeEngagementDistribution(
  engagement: EngagementSummary
): Record<EngagementTier, { count: number; percentage: number }> {
  const dist = engagement.lastActiveDistribution;
  const total =
    dist.within7Days + dist.within30Days + dist.over30Days + dist.over90Days ||
    1;

  return {
    highly_engaged: {
      count: dist.within7Days,
      percentage: Math.round((dist.within7Days / total) * 100),
    },
    moderate: {
      count: dist.within30Days,
      percentage: Math.round((dist.within30Days / total) * 100),
    },
    disengaging: {
      count: dist.over30Days,
      percentage: Math.round((dist.over30Days / total) * 100),
    },
    inactive: {
      count: dist.over90Days,
      percentage: Math.round((dist.over90Days / total) * 100),
    },
  };
}

function computeConceptHeatmap(
  cohortBlooms: CohortBloomsData[]
): Array<{ conceptId: string; avgMastery: number; status: BloomsMasteryStatus }> {
  return cohortBlooms.map((b) => ({
    conceptId: b.level,
    avgMastery: b.avgMastery,
    status: scoreToStatus(b.avgMastery),
  }));
}

function scoreToStatus(score: number): BloomsMasteryStatus {
  if (score >= 80) return 'mastery';
  if (score >= 60) return 'solid';
  if (score >= 40) return 'developing';
  if (score >= 20) return 'emerging';
  return 'gap';
}

function computeDropoutRisk(
  engagement: EngagementSummary
): { highRiskCount: number; mediumRiskCount: number; totalAtRisk: number } {
  const high = engagement.lastActiveDistribution.over90Days;
  const medium = engagement.lastActiveDistribution.over30Days;

  return {
    highRiskCount: high,
    mediumRiskCount: medium,
    totalAtRisk: high + medium,
  };
}

function computeCohortHealthScore(
  snapshot: CreatorDataSnapshot,
  velocity: number,
  fragilePercentage: number,
  dropoutRisk: { totalAtRisk: number }
): number {
  const total = snapshot.enrollment.totalEnrolled || 1;

  // 30% completion rate
  const completionRate =
    (snapshot.enrollment.completedCount / total) * 100;
  const completionComponent = Math.min(completionRate, 100) * 0.3;

  // 25% engagement health
  const activeRate =
    (snapshot.enrollment.activeCount / total) * 100;
  const engagementComponent = Math.min(activeRate, 100) * 0.25;

  // 20% velocity
  const velocityComponent = Math.min(velocity * 20, 100) * 0.2;

  // 15% knowledge durability
  const durabilityComponent = Math.max(0, 100 - fragilePercentage) * 0.15;

  // 10% retention (inverse of dropout risk)
  const atRiskRate = (dropoutRisk.totalAtRisk / total) * 100;
  const retentionComponent = Math.max(0, 100 - atRiskRate) * 0.1;

  return Math.round(
    completionComponent +
      engagementComponent +
      velocityComponent +
      durabilityComponent +
      retentionComponent
  );
}

// =============================================================================
// ROI COMPUTATION
// =============================================================================

export function computeROI(
  impactScore: number,
  reachPercentage: number,
  effortScore: number
): number {
  if (effortScore === 0) return 0;
  return Math.round((impactScore * reachPercentage) / effortScore);
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
    logger.warn(`[CreatorAnalytics] Failed to parse ${label}`, {
      error: error instanceof Error ? error.message : String(error),
      rawLength: raw.length,
    });
    return null;
  }
}

// =============================================================================
// CACHE HELPERS
// =============================================================================

export function buildCacheKey(
  userId: string,
  courseId: string,
  timeRange: TimeRange
): string {
  return `creator-analytics:${userId}:${courseId}:${timeRange}`;
}

export function getCacheTTL(depth: string): number {
  switch (depth) {
    case 'overview':
      return 5 * 60 * 1000; // 5 minutes
    case 'standard':
      return 15 * 60 * 1000; // 15 minutes
    case 'deep_dive':
      return 30 * 60 * 1000; // 30 minutes
    default:
      return 15 * 60 * 1000;
  }
}
