/**
 * SAM AI Mentor - Plan Management API
 *
 * Manages learning plans for the mentor system.
 * Note: Uses SAMInteraction for storage until dedicated models are added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const CreatePlanSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetMastery: z.number().min(0).max(100).optional().default(80),
  weeklyHours: z.number().min(1).max(40).optional().default(5),
  startDate: z.string().datetime().optional(),
});

const UpdatePlanSchema = z.object({
  planId: z.string(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  targetMastery: z.number().min(0).max(100).optional(),
  weeklyHours: z.number().min(1).max(40).optional(),
});

// Context type for plans stored in SAMInteraction
interface MentorPlanContext {
  type: 'mentor_plan';
  courseId: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  targetMastery: number;
  weeklyHours: number;
  startDate: string;
  progress: number;
  currentWeek: number;
}

/**
 * POST - Create a new mentor plan
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreatePlanSchema.parse(body);

    // Verify course exists
    const course = await db.course.findFirst({
      where: { id: validatedData.courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Check for existing active plan
    const existingPlans = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
      },
      take: 50,
    });

    const hasActivePlan = existingPlans.some(p => {
      const ctx = p.context as Record<string, unknown> | null;
      return ctx?.type === 'mentor_plan' &&
             ctx?.courseId === validatedData.courseId &&
             ctx?.status === 'ACTIVE';
    });

    if (hasActivePlan) {
      return NextResponse.json(
        { success: false, error: { code: 'PLAN_EXISTS', message: 'An active plan already exists for this course' } },
        { status: 400 }
      );
    }

    // Create plan context
    const planContext: MentorPlanContext = {
      type: 'mentor_plan',
      courseId: validatedData.courseId,
      title: validatedData.title,
      description: validatedData.description,
      status: 'ACTIVE',
      targetMastery: validatedData.targetMastery,
      weeklyHours: validatedData.weeklyHours,
      startDate: validatedData.startDate || new Date().toISOString(),
      progress: 0,
      currentWeek: 1,
    };

    const plan = await db.sAMInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
        context: planContext as unknown as Record<string, unknown>,
        actionTaken: 'plan_created',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        ...planContext,
        course: { id: course.id, title: course.title },
        createdAt: plan.createdAt.toISOString(),
      },
    });

  } catch (error) {
    logger.error('[MENTOR PLAN] Create error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create plan' } },
      { status: 500 }
    );
  }
}

/**
 * GET - Get user's mentor plans
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const courseId = searchParams.get('courseId');

    // Get plans from SAMInteraction
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Filter to mentor plans
    let plans = interactions
      .filter(i => {
        const ctx = i.context as Record<string, unknown> | null;
        return ctx?.type === 'mentor_plan';
      })
      .map(i => {
        const ctx = i.context as unknown as MentorPlanContext;
        return {
          id: i.id,
          ...ctx,
          createdAt: i.createdAt.toISOString(),
        };
      });

    // Apply filters
    if (status) {
      plans = plans.filter(p => p.status === status);
    }
    if (courseId) {
      plans = plans.filter(p => p.courseId === courseId);
    }

    return NextResponse.json({
      success: true,
      data: plans,
    });

  } catch (error) {
    logger.error('[MENTOR PLAN] Get error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get plans' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a mentor plan
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = UpdatePlanSchema.parse(body);

    // Get existing plan
    const existing = await db.sAMInteraction.findFirst({
      where: { id: validatedData.planId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' } },
        { status: 404 }
      );
    }

    const existingContext = existing.context as unknown as MentorPlanContext | null;
    if (!existingContext || existingContext.type !== 'mentor_plan') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PLAN', message: 'Invalid plan' } },
        { status: 400 }
      );
    }

    // Update context
    const updatedContext: MentorPlanContext = {
      ...existingContext,
      ...(validatedData.status && { status: validatedData.status }),
      ...(validatedData.targetMastery && { targetMastery: validatedData.targetMastery }),
      ...(validatedData.weeklyHours && { weeklyHours: validatedData.weeklyHours }),
    };

    await db.sAMInteraction.update({
      where: { id: validatedData.planId },
      data: {
        context: updatedContext as unknown as Record<string, unknown>,
        actionTaken: 'plan_updated',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: validatedData.planId,
        ...updatedContext,
      },
    });

  } catch (error) {
    logger.error('[MENTOR PLAN] Update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update plan' } },
      { status: 500 }
    );
  }
}
