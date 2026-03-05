/**
 * SAM AI Mentor - Interventions API
 *
 * Manages teacher-triggered interventions for students.
 * Note: Uses SAMInteraction for storage until dedicated models are added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const CreateInterventionSchema = z.object({
  studentId: z.string().optional(), // For teacher creating intervention for student
  type: z.enum(['REMINDER', 'GUIDANCE', 'ENCOURAGEMENT', 'ASSIGNMENT', 'MEETING_REQUEST']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
});

const UpdateInterventionSchema = z.object({
  interventionId: z.string(),
  status: z.enum(['ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED']),
  response: z.string().max(1000).optional(),
});

// Context type for interventions
interface InterventionContext {
  type: 'intervention';
  interventionType: 'REMINDER' | 'GUIDANCE' | 'ENCOURAGEMENT' | 'ASSIGNMENT' | 'MEETING_REQUEST';
  title: string;
  message: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
  createdBy: string;
  dueDate?: string;
  response?: string;
  respondedAt?: string;
}

/**
 * GET - Get interventions for user
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Get interventions from SAMInteraction
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Filter to interventions
    let interventions = interactions
      .filter(i => {
        const ctx = i.context as Record<string, unknown> | null;
        return ctx?.type === 'intervention';
      })
      .map(i => {
        const ctx = i.context as unknown as InterventionContext;
        return {
          id: i.id,
          ...ctx,
          createdAt: i.createdAt.toISOString(),
        };
      });

    // Apply status filter
    if (status) {
      interventions = interventions.filter(i => i.status === status);
    }

    // Sort by priority then date
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    interventions.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Calculate stats
    const pending = interventions.filter(i => i.status === 'PENDING').length;
    const inProgress = interventions.filter(i => i.status === 'IN_PROGRESS').length;

    return NextResponse.json({
      success: true,
      data: {
        interventions: interventions.slice(0, limit),
        stats: {
          pending,
          inProgress,
          total: interventions.length,
        },
      },
    });

  } catch (error) {
    logger.error('[INTERVENTIONS] Get error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get interventions' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new intervention
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
    const validatedData = CreateInterventionSchema.parse(body);

    // Determine target user (self or specified student)
    const targetUserId = validatedData.studentId || user.id;

    // Create intervention context
    const interventionContext: InterventionContext = {
      type: 'intervention',
      interventionType: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      priority: validatedData.priority,
      status: 'PENDING',
      createdBy: user.id,
      dueDate: validatedData.dueDate,
    };

    const intervention = await db.sAMInteraction.create({
      data: {
        userId: targetUserId,
        interactionType: 'LEARNING_ASSISTANCE',
        context: interventionContext as unknown as Record<string, unknown>,
        actionTaken: 'intervention_created',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: intervention.id,
        ...interventionContext,
        targetUserId,
        createdAt: intervention.createdAt.toISOString(),
      },
    });

  } catch (error) {
    logger.error('[INTERVENTIONS] Create error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create intervention' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update intervention status (respond to intervention)
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
    const validatedData = UpdateInterventionSchema.parse(body);

    const existing = await db.sAMInteraction.findFirst({
      where: { id: validatedData.interventionId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'INTERVENTION_NOT_FOUND', message: 'Intervention not found' } },
        { status: 404 }
      );
    }

    const existingContext = existing.context as unknown as InterventionContext | null;
    if (!existingContext || existingContext.type !== 'intervention') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INTERVENTION', message: 'Invalid intervention' } },
        { status: 400 }
      );
    }

    // Update context
    const updatedContext: InterventionContext = {
      ...existingContext,
      status: validatedData.status,
      response: validatedData.response,
      respondedAt: new Date().toISOString(),
    };

    await db.sAMInteraction.update({
      where: { id: validatedData.interventionId },
      data: {
        context: updatedContext as unknown as Record<string, unknown>,
        actionTaken: `intervention_${validatedData.status.toLowerCase()}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: validatedData.interventionId,
        ...updatedContext,
      },
    });

  } catch (error) {
    logger.error('[INTERVENTIONS] Update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update intervention' } },
      { status: 500 }
    );
  }
}
