import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { generateStudyPlan, type StudyPlanInput } from '@/lib/sam/study-plan-generator';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const GenerateStudyPlanSchema = z.object({
  // Course info
  courseId: z.string().optional(),
  courseTitle: z.string().optional(),
  courseType: z.enum(['enrolled', 'new']),
  newCourse: z
    .object({
      title: z.string().min(1),
      description: z.string().optional().default(''),
      platform: z.string().optional().default(''),
      url: z.string().optional().default(''),
    })
    .optional(),

  // Learning profile
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  learningStyles: z.array(z.string()).min(1),
  priorKnowledge: z.array(z.string()).optional().default([]),
  primaryGoal: z.enum(['complete', 'master', 'certify', 'project']),
  targetMastery: z.enum(['familiar', 'competent', 'proficient', 'expert']),
  motivation: z.string(),

  // Schedule
  startDate: z.string().datetime(),
  targetEndDate: z.string().datetime(),
  preferredTimeSlot: z.enum(['morning', 'afternoon', 'evening', 'flexible']),
  dailyStudyHours: z.number().min(0.5).max(8),
  studyDays: z.array(z.string()).min(1),

  // Preferences
  includePractice: z.boolean(),
  includeAssessments: z.boolean(),
  includeProjects: z.boolean(),
});

// ============================================================================
// POST - Generate Study Plan
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = GenerateStudyPlanSchema.parse(body);

    logger.info('[API] Generating study plan', {
      userId: session.user.id,
      courseId: validated.courseId,
      courseType: validated.courseType,
    });

    // Build input for generator
    const input: StudyPlanInput = {
      courseId: validated.courseId,
      courseTitle: validated.courseTitle,
      courseType: validated.courseType,
      newCourse: validated.newCourse
        ? {
            title: validated.newCourse.title,
            description: validated.newCourse.description || '',
            platform: validated.newCourse.platform || '',
            url: validated.newCourse.url || '',
          }
        : undefined,
      skillLevel: validated.skillLevel,
      learningStyles: validated.learningStyles,
      priorKnowledge: validated.priorKnowledge,
      primaryGoal: validated.primaryGoal,
      targetMastery: validated.targetMastery,
      motivation: validated.motivation,
      startDate: validated.startDate,
      targetEndDate: validated.targetEndDate,
      preferredTimeSlot: validated.preferredTimeSlot,
      dailyStudyHours: validated.dailyStudyHours,
      studyDays: validated.studyDays,
      includePractice: validated.includePractice,
      includeAssessments: validated.includeAssessments,
      includeProjects: validated.includeProjects,
    };

    // Generate the study plan
    const plan = await generateStudyPlan(input);

    logger.info('[API] Study plan generated successfully', {
      userId: session.user.id,
      totalWeeks: plan.totalWeeks,
      totalTasks: plan.totalTasks,
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    logger.error('[API] Error generating study plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate study plan',
        },
      },
      { status: 500 }
    );
  }
}
