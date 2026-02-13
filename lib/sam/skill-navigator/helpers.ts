/**
 * NAVIGATOR Helpers
 *
 * Data collection queries (3 parallel groups), gap computation,
 * course matching logic, and feasibility calculator.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type {
  NavigatorDataSnapshot,
  ExistingSkillProfile,
  RelatedSkillLevel,
  EnrollmentRecord,
  DiagnosticInsight,
  PracticeRecord,
  NavigatorCollectedParams,
  GapEntry,
  GapAction,
  MatchedCourse,
  ProficiencyLevel,
} from './agentic-types';

// =============================================================================
// PROFICIENCY LEVEL UTILITIES
// =============================================================================

const LEVEL_ORDER: ProficiencyLevel[] = [
  'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST',
];

export function getLevelIndex(level: string): number {
  const idx = LEVEL_ORDER.indexOf(level as ProficiencyLevel);
  return idx >= 0 ? idx : 0;
}

export function isHigherLevel(a: string, b: string): boolean {
  return getLevelIndex(a) > getLevelIndex(b);
}

// =============================================================================
// STAGE 1: DATA COLLECTION (3 PARALLEL GROUPS)
// =============================================================================

export async function collectNavigatorData(
  userId: string,
  params: NavigatorCollectedParams,
): Promise<NavigatorDataSnapshot> {
  const startTime = Date.now();

  try {
    // Run 3 groups in parallel
    const [groupA, groupB, groupC] = await Promise.all([
      collectGroupA(userId, params.skillName),
      collectGroupB(userId),
      collectGroupC(userId),
    ]);

    const snapshot: NavigatorDataSnapshot = {
      existingSkillProfile: groupA.existingProfile,
      relatedSkillLevels: groupA.relatedSkills,
      enrollmentHistory: groupB.enrollments,
      diagnosticInsights: groupC.diagnostics,
      practiceHistory: groupA.practiceLogs,
      collectedAt: new Date().toISOString(),
    };

    logger.info('[Navigator] Data collection complete', {
      durationMs: Date.now() - startTime,
      hasExistingProfile: !!snapshot.existingSkillProfile,
      relatedSkills: snapshot.relatedSkillLevels.length,
      enrollments: snapshot.enrollmentHistory.length,
      diagnostics: snapshot.diagnosticInsights.length,
      practiceLogs: snapshot.practiceHistory.length,
    });

    return snapshot;
  } catch (error) {
    logger.error('[Navigator] Data collection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Return empty snapshot on failure - pipeline continues with no prior data
    return {
      existingSkillProfile: null,
      relatedSkillLevels: [],
      enrollmentHistory: [],
      diagnosticInsights: [],
      practiceHistory: [],
      collectedAt: new Date().toISOString(),
    };
  }
}

// Group A: Skill profiles + practice logs
async function collectGroupA(
  userId: string,
  skillName: string,
): Promise<{
  existingProfile: ExistingSkillProfile | null;
  relatedSkills: RelatedSkillLevel[];
  practiceLogs: PracticeRecord[];
}> {
  // Find skill definition by name
  const skillDef = await db.skillBuildDefinition.findFirst({
    where: { name: { equals: skillName, mode: 'insensitive' } },
    select: { id: true, relatedSkills: true },
  });

  let existingProfile: ExistingSkillProfile | null = null;
  const relatedSkills: RelatedSkillLevel[] = [];
  const practiceLogs: PracticeRecord[] = [];

  if (skillDef) {
    // Fetch user's profile for this skill
    const profile = await db.skillBuildProfile.findFirst({
      where: { userId, skillId: skillDef.id },
      include: {
        skill: { select: { name: true, bloomsLevels: true } },
      },
    });

    if (profile) {
      existingProfile = {
        profileId: profile.id,
        skillName: profile.skill.name,
        masteryScore: profile.masteryScore,
        retentionScore: profile.retentionScore,
        applicationScore: profile.applicationScore,
        confidenceScore: profile.confidenceScore,
        compositeScore: profile.compositeScore,
        proficiencyLevel: profile.proficiencyLevel,
        totalSessions: profile.totalSessions,
        totalMinutes: profile.totalMinutes,
        averageScore: profile.averageScore,
        currentStreak: profile.currentStreak,
        lastPracticedAt: profile.lastPracticedAt?.toISOString() ?? null,
        velocityTrend: profile.velocityTrend,
      };
    }

    // Fetch recent practice logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await db.skillBuildPracticeLog.findMany({
      where: {
        userId,
        skillId: skillDef.id,
        timestamp: { gte: thirtyDaysAgo },
      },
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        profile: {
          include: { skill: { select: { name: true } } },
        },
      },
    });

    for (const log of logs) {
      practiceLogs.push({
        date: log.timestamp.toISOString(),
        durationMinutes: log.durationMinutes,
        score: log.score,
        skillName: log.profile.skill.name,
      });
    }

    // Fetch related skill profiles
    if (skillDef.relatedSkills.length > 0) {
      const relatedDefs = await db.skillBuildDefinition.findMany({
        where: { name: { in: skillDef.relatedSkills, mode: 'insensitive' } },
        select: { id: true, name: true, bloomsLevels: true },
      });

      if (relatedDefs.length > 0) {
        const relatedProfiles = await db.skillBuildProfile.findMany({
          where: {
            userId,
            skillId: { in: relatedDefs.map((d) => d.id) },
          },
          include: {
            skill: { select: { name: true, bloomsLevels: true } },
          },
        });

        for (const rp of relatedProfiles) {
          relatedSkills.push({
            skillName: rp.skill.name,
            compositeScore: rp.compositeScore,
            proficiencyLevel: rp.proficiencyLevel,
            bloomsLevels: rp.skill.bloomsLevels,
          });
        }
      }
    }
  }

  return { existingProfile, relatedSkills, practiceLogs };
}

// Group B: Enrollments
async function collectGroupB(
  userId: string,
): Promise<{ enrollments: EnrollmentRecord[] }> {
  const enrollments: EnrollmentRecord[] = [];

  const records = await db.enrollment.findMany({
    where: { userId },
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      Course: { select: { id: true, title: true } },
    },
  });

  for (const record of records) {
    enrollments.push({
      courseId: record.Course.id,
      courseTitle: record.Course.title ?? 'Untitled Course',
      status: record.status ?? 'ACTIVE',
      enrolledAt: record.createdAt.toISOString(),
    });
  }

  return { enrollments };
}

// Group C: Diagnostic insights (CognitiveSkillProgress — Bloom's mastery per concept)
async function collectGroupC(
  userId: string,
): Promise<{ diagnostics: DiagnosticInsight[] }> {
  const diagnostics: DiagnosticInsight[] = [];

  const skillProgress = await db.cognitiveSkillProgress.findMany({
    where: { userId },
    take: 20,
    orderBy: { overallMastery: 'desc' },
    select: {
      id: true,
      conceptId: true,
      rememberMastery: true,
      understandMastery: true,
      applyMastery: true,
      analyzeMastery: true,
      evaluateMastery: true,
      createMastery: true,
      overallMastery: true,
      currentBloomsLevel: true,
      totalAttempts: true,
      lastAttemptDate: true,
      trend: true,
    },
  });

  for (const sp of skillProgress) {
    diagnostics.push({
      conceptId: sp.conceptId,
      overallMastery: sp.overallMastery,
      currentBloomsLevel: sp.currentBloomsLevel,
      bloomsBreakdown: {
        remember: sp.rememberMastery,
        understand: sp.understandMastery,
        apply: sp.applyMastery,
        analyze: sp.analyzeMastery,
        evaluate: sp.evaluateMastery,
        create: sp.createMastery,
      },
      trend: sp.trend ?? 'stable',
      totalAttempts: sp.totalAttempts,
      lastAttemptDate: sp.lastAttemptDate?.toISOString() ?? null,
    });
  }

  return { diagnostics };
}

// =============================================================================
// GAP COMPUTATION
// =============================================================================

export function computeGapAction(
  currentLevel: string,
  targetLevel: string,
): GapAction {
  const currentIdx = getLevelIndex(currentLevel);
  const targetIdx = getLevelIndex(targetLevel);
  const gap = targetIdx - currentIdx;

  if (gap <= 0) return 'SKIP';
  if (gap === 1 && currentIdx >= 3) return 'VERIFY';
  if (gap === 1) return 'STRENGTHEN';
  if (gap === 2) return 'LEARN';
  return 'HEAVY_LEARN';
}

export function estimateGapHours(
  currentLevel: string,
  targetLevel: string,
): number {
  const currentIdx = getLevelIndex(currentLevel);
  const targetIdx = getLevelIndex(targetLevel);
  const gap = targetIdx - currentIdx;

  if (gap <= 0) return 0;

  // Hours per level jump (cumulative difficulty)
  const hoursPerJump = [0, 15, 30, 45, 55, 65, 75];
  let totalHours = 0;
  for (let i = 1; i <= gap; i++) {
    totalHours += hoursPerJump[Math.min(i, hoursPerJump.length - 1)];
  }
  return totalHours;
}

export function computeFeasibility(
  totalHoursNeeded: number,
  hoursPerWeek: number,
  deadlineWeeks: number | null,
): {
  feasible: boolean;
  weeksNeeded: number;
  utilizationPercent: number;
  verdict: string;
} {
  const weeksNeeded = Math.ceil(totalHoursNeeded / hoursPerWeek);

  if (!deadlineWeeks) {
    return {
      feasible: true,
      weeksNeeded,
      utilizationPercent: 100,
      verdict: `Flexible timeline: approximately ${weeksNeeded} weeks at ${hoursPerWeek} hours/week.`,
    };
  }

  const utilizationPercent = Math.round((totalHoursNeeded / (hoursPerWeek * deadlineWeeks)) * 100);
  const feasible = utilizationPercent <= 110; // Allow 10% buffer

  return {
    feasible,
    weeksNeeded,
    utilizationPercent,
    verdict: feasible
      ? `Plan fits within ${deadlineWeeks} weeks at ${utilizationPercent}% capacity.`
      : `Plan requires ${weeksNeeded} weeks but only ${deadlineWeeks} weeks available (${utilizationPercent}% capacity). Consider reducing scope or increasing hours.`,
  };
}

// =============================================================================
// COURSE MATCHING (Adapted from existing generate route)
// =============================================================================

export async function matchCoursesToPlatform(
  skillName: string,
  suggestedCourses: Array<{ title: string; description: string }>,
): Promise<MatchedCourse[]> {
  const matched: MatchedCourse[] = [];
  const cache = new Map<string, { id: string; title: string } | null>();

  for (const suggested of suggestedCourses) {
    if (cache.has(suggested.title)) {
      const cached = cache.get(suggested.title);
      matched.push({
        suggestedTitle: suggested.title,
        matchedCourseId: cached?.id ?? null,
        matchedCourseTitle: cached?.title ?? null,
        matchConfidence: cached ? 'partial' : 'none',
      });
      continue;
    }

    // Extract keywords from title
    const keywords = suggested.title
      .split(/[\s:,\-&]+/)
      .filter((w) => w.length > 3)
      .slice(0, 3);

    try {
      const matchedCourse = await db.course.findFirst({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: skillName, mode: 'insensitive' } },
            ...keywords.map((kw) => ({
              title: { contains: kw, mode: 'insensitive' as const },
            })),
          ],
        },
        select: { id: true, title: true },
      });

      cache.set(suggested.title, matchedCourse);

      matched.push({
        suggestedTitle: suggested.title,
        matchedCourseId: matchedCourse?.id ?? null,
        matchedCourseTitle: matchedCourse?.title ?? null,
        matchConfidence: matchedCourse
          ? matchedCourse.title?.toLowerCase().includes(skillName.toLowerCase())
            ? 'exact'
            : 'partial'
          : 'none',
      });
    } catch {
      cache.set(suggested.title, null);
      matched.push({
        suggestedTitle: suggested.title,
        matchedCourseId: null,
        matchedCourseTitle: null,
        matchConfidence: 'none',
      });
    }
  }

  return matched;
}

// =============================================================================
// DATA SNAPSHOT SERIALIZER (For AI prompts)
// =============================================================================

export function serializeDataSnapshot(snapshot: NavigatorDataSnapshot): string {
  const lines: string[] = [];

  // Existing skill profile
  if (snapshot.existingSkillProfile) {
    const p = snapshot.existingSkillProfile;
    lines.push(`EXISTING SKILL PROFILE:`);
    lines.push(`  Skill: ${p.skillName}`);
    lines.push(`  Level: ${p.proficiencyLevel} (composite: ${p.compositeScore})`);
    lines.push(`  Mastery: ${p.masteryScore}, Retention: ${p.retentionScore}, Application: ${p.applicationScore}`);
    lines.push(`  Sessions: ${p.totalSessions}, Total Time: ${p.totalMinutes} min`);
    lines.push(`  Streak: ${p.currentStreak}, Velocity: ${p.velocityTrend}`);
    if (p.lastPracticedAt) lines.push(`  Last practiced: ${p.lastPracticedAt}`);
  } else {
    lines.push(`EXISTING SKILL PROFILE: None (new skill for this user)`);
  }

  // Related skills
  if (snapshot.relatedSkillLevels.length > 0) {
    lines.push(`\nRELATED SKILLS:`);
    for (const rs of snapshot.relatedSkillLevels) {
      lines.push(`  ${rs.skillName}: ${rs.proficiencyLevel} (score: ${rs.compositeScore})`);
    }
  }

  // Enrollment history
  if (snapshot.enrollmentHistory.length > 0) {
    lines.push(`\nENROLLMENT HISTORY (${snapshot.enrollmentHistory.length} courses):`);
    for (const e of snapshot.enrollmentHistory.slice(0, 10)) {
      lines.push(`  ${e.courseTitle}: ${e.status} (enrolled: ${e.enrolledAt})`);
    }
  }

  // Diagnostic insights (Bloom's mastery per concept)
  if (snapshot.diagnosticInsights.length > 0) {
    lines.push(`\nCOGNITIVE SKILL PROGRESS (${snapshot.diagnosticInsights.length} concepts):`);
    for (const d of snapshot.diagnosticInsights.slice(0, 10)) {
      lines.push(`  Concept ${d.conceptId}: ${d.currentBloomsLevel} (mastery: ${Math.round(d.overallMastery)}%, trend: ${d.trend})`);
      const levels = Object.entries(d.bloomsBreakdown)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}: ${Math.round(v)}%`)
        .join(', ');
      if (levels) lines.push(`    Bloom's: ${levels}`);
    }
  }

  // Practice history summary
  if (snapshot.practiceHistory.length > 0) {
    const totalMinutes = snapshot.practiceHistory.reduce((sum, p) => sum + p.durationMinutes, 0);
    const avgScore = snapshot.practiceHistory.filter((p) => p.score !== null).length > 0
      ? snapshot.practiceHistory
          .filter((p) => p.score !== null)
          .reduce((sum, p) => sum + (p.score ?? 0), 0) /
        snapshot.practiceHistory.filter((p) => p.score !== null).length
      : 0;
    lines.push(`\nPRACTICE HISTORY (last 30 days):`);
    lines.push(`  Sessions: ${snapshot.practiceHistory.length}`);
    lines.push(`  Total time: ${totalMinutes} minutes`);
    if (avgScore > 0) lines.push(`  Average score: ${Math.round(avgScore)}`);
  }

  return lines.join('\n');
}

// =============================================================================
// SKILL DEFINITION HELPER
// =============================================================================

export async function findOrCreateSkillDefinition(
  skillName: string,
): Promise<{ id: string; name: string }> {
  let skillDef = await db.skillBuildDefinition.findFirst({
    where: { name: { equals: skillName, mode: 'insensitive' } },
    select: { id: true, name: true },
  });

  if (!skillDef) {
    skillDef = await db.skillBuildDefinition.create({
      data: {
        name: skillName,
        category: 'TECHNICAL',
        difficultyFactor: 1.0,
        retentionDifficulty: 1.0,
      },
      select: { id: true, name: true },
    });
  }

  return skillDef;
}
