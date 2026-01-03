/**
 * SAM Agentic Skills API
 * Retrieves and manages user skill assessments
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  createSkillAssessor,
  MasteryLevel,
} from '@sam-ai/agentic';
import { createPrismaSkillAssessmentStore } from '@/lib/sam/stores';

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  courseId: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

// ============================================================================
// LAZY SINGLETON
// ============================================================================

let skillAssessorInstance: ReturnType<typeof createSkillAssessor> | null = null;

function getSkillAssessor() {
  if (!skillAssessorInstance) {
    skillAssessorInstance = createSkillAssessor({
      logger,
      store: createPrismaSkillAssessmentStore(),
    });
  }
  return skillAssessorInstance;
}

function toTrend(currentScore: number, previousScore?: number | null): 'improving' | 'stable' | 'declining' {
  if (previousScore === null || previousScore === undefined) return 'stable';
  const delta = currentScore - previousScore;
  if (delta > 5) return 'improving';
  if (delta < -5) return 'declining';
  return 'stable';
}

// ============================================================================
// GET /api/sam/agentic/skills
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

    const { category, limit } = parsed.data;
    const assessor = getSkillAssessor();
    let assessments = await assessor.getUserAssessments(user.id);

    if (category) {
      assessments = assessments.filter((assessment) => {
        const skill = assessor.getSkill(assessment.skillId);
        return skill?.category === category;
      });
    }

    const skills = assessments.slice(0, limit).map((assessment) => {
      const skill = assessor.getSkill(assessment.skillId);
      return {
        skillId: assessment.skillId,
        skillName: assessment.skillName,
        level: assessment.level as MasteryLevel,
        score: Math.round(assessment.score),
        confidence: Math.round(assessment.confidence * 100),
        lastAssessedAt: assessment.assessedAt.toISOString(),
        trend: toTrend(assessment.score, assessment.previousScore),
        category: skill?.category,
        relatedCourses: [],
      };
    });

    return NextResponse.json({
      success: true,
      data: { skills },
    });
  } catch (error) {
    logger.error('Error fetching skill assessments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skill assessments' },
      { status: 500 }
    );
  }
}
