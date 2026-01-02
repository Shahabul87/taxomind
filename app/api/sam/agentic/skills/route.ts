/**
 * SAM Agentic Skills API
 * Retrieves and manages user skill assessments
 *
 * Phase 5: Frontend Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

interface SkillAssessment {
  skillId: string;
  skillName: string;
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number;
  confidence: number;
  lastAssessedAt: string;
  trend: 'improving' | 'stable' | 'declining';
  category?: string;
  relatedCourses?: string[];
}

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  courseId: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

// ============================================================================
// HELPERS
// ============================================================================

function calculateSkillLevel(score: number): SkillAssessment['level'] {
  if (score >= 90) return 'expert';
  if (score >= 75) return 'advanced';
  if (score >= 50) return 'intermediate';
  if (score >= 25) return 'beginner';
  return 'novice';
}

function determineTrend(
  currentScore: number,
  previousScores: number[]
): SkillAssessment['trend'] {
  if (previousScores.length === 0) return 'stable';

  const avgPrevious = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
  const delta = currentScore - avgPrevious;

  if (delta > 5) return 'improving';
  if (delta < -5) return 'declining';
  return 'stable';
}

async function getSkillAssessmentsFromProgress(userId: string): Promise<SkillAssessment[]> {
  // Get user progress across all courses
  const progress = await db.user_progress.findMany({
    where: { userId },
    include: {
      Chapter: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              categoryId: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Get quiz scores from SAM interactions (filter by context type)
  const quizInteractions = await db.sAMInteraction.findMany({
    where: {
      userId,
      interactionType: 'ANALYTICS_VIEW',
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Group progress by course/topic to derive skill assessments
  const skillMap = new Map<string, {
    scores: number[];
    courseTitles: Set<string>;
    lastAssessed: Date;
    category?: string;
  }>();

  // Process chapter progress
  for (const p of progress) {
    if (!p.Chapter?.course) continue;

    const skillKey = p.Chapter.course.title;
    const existing = skillMap.get(skillKey) || {
      scores: [],
      courseTitles: new Set<string>(),
      lastAssessed: new Date(0),
      category: p.Chapter.course.categoryId || undefined,
    };

    // Calculate completion score
    const completionScore = p.isCompleted ? 100 : 50;
    existing.scores.push(completionScore);
    existing.courseTitles.add(p.Chapter.course.id);
    if (p.updatedAt > existing.lastAssessed) {
      existing.lastAssessed = p.updatedAt;
    }

    skillMap.set(skillKey, existing);
  }

  // Process quiz scores
  for (const interaction of quizInteractions) {
    const context = interaction.context as Record<string, unknown> | null;
    if (!context) continue;

    const topic = context.topic as string;
    const score = context.score as number;

    if (topic && typeof score === 'number') {
      const existing = skillMap.get(topic) || {
        scores: [],
        courseTitles: new Set<string>(),
        lastAssessed: new Date(0),
      };

      existing.scores.push(score);
      if (interaction.createdAt > existing.lastAssessed) {
        existing.lastAssessed = interaction.createdAt;
      }

      skillMap.set(topic, existing);
    }
  }

  // Convert to skill assessments
  const skills: SkillAssessment[] = [];
  let idCounter = 1;

  for (const [skillName, data] of skillMap) {
    if (data.scores.length === 0) continue;

    const currentScore = data.scores[0];
    const previousScores = data.scores.slice(1);
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

    skills.push({
      skillId: `skill_${idCounter++}`,
      skillName,
      level: calculateSkillLevel(avgScore),
      score: Math.round(avgScore),
      confidence: Math.min(100, 50 + data.scores.length * 10), // Higher confidence with more data
      lastAssessedAt: data.lastAssessed.toISOString(),
      trend: determineTrend(currentScore, previousScores),
      category: data.category,
      relatedCourses: Array.from(data.courseTitles),
    });
  }

  // Sort by last assessed (most recent first)
  skills.sort((a, b) =>
    new Date(b.lastAssessedAt).getTime() - new Date(a.lastAssessedAt).getTime()
  );

  return skills;
}

// ============================================================================
// GET /api/sam/agentic/skills
// Retrieve user skill assessments
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      courseId: searchParams.get('courseId'),
      category: searchParams.get('category'),
      limit: searchParams.get('limit'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { courseId, category, limit } = parsed.data;

    // Get skill assessments
    let skills = await getSkillAssessmentsFromProgress(user.id);

    // Filter by course if specified
    if (courseId) {
      skills = skills.filter((s) => s.relatedCourses?.includes(courseId));
    }

    // Filter by category if specified
    if (category) {
      skills = skills.filter((s) => s.category === category);
    }

    // Apply limit
    skills = skills.slice(0, limit);

    // Calculate summary stats
    const summary = {
      totalSkills: skills.length,
      averageLevel: skills.length > 0
        ? skills.reduce((sum, s) => sum + s.score, 0) / skills.length
        : 0,
      improving: skills.filter((s) => s.trend === 'improving').length,
      declining: skills.filter((s) => s.trend === 'declining').length,
      levelDistribution: {
        novice: skills.filter((s) => s.level === 'novice').length,
        beginner: skills.filter((s) => s.level === 'beginner').length,
        intermediate: skills.filter((s) => s.level === 'intermediate').length,
        advanced: skills.filter((s) => s.level === 'advanced').length,
        expert: skills.filter((s) => s.level === 'expert').length,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        skills,
        summary,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[SAM Skills] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skill assessments' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/sam/agentic/skills
// Record a skill assessment result
// ============================================================================

const assessmentSchema = z.object({
  skillName: z.string().min(1).max(200),
  score: z.number().min(0).max(100),
  source: z.enum(['quiz', 'assignment', 'self-assessment', 'practice']),
  context: z.object({
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    assessmentId: z.string().optional(),
    duration: z.number().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = assessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { skillName, score, source, context } = parsed.data;

    // Record the assessment as a SAM interaction for tracking
    await db.sAMInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'ANALYTICS_VIEW',
        context: {
          type: 'skill_assessment',
          topic: skillName,
          score,
          level: calculateSkillLevel(score),
          source,
          duration: context?.duration,
          ...context,
        },
        actionTaken: `skill_assessment_${source}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        recorded: true,
        level: calculateSkillLevel(score),
        skillName,
        score,
      },
    });
  } catch (error) {
    console.error('[SAM Skills] Assessment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record assessment' },
      { status: 500 }
    );
  }
}
