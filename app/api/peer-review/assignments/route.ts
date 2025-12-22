/**
 * Peer Review Assignments API
 * POST /api/peer-review/assignments - Create review assignments
 * GET /api/peer-review/assignments - Get user's assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const CreateAssignmentsSchema = z.object({
  rubricId: z.string().min(1),
  submissionIds: z.array(z.string()).min(1),
  reviewerIds: z.array(z.string()).min(1),
  reviewsPerSubmission: z.number().min(1).max(5).default(3),
  dueDate: z.string(),
  isBlind: z.boolean().default(true),
});

// Create review assignments
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Only teachers/admins can create assignments
    if (!['ADMIN', 'TEACHER', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = CreateAssignmentsSchema.parse(body);

    // Verify rubric exists
    const rubric = await db.reviewRubric.findUnique({
      where: { id: validatedData.rubricId },
    });

    if (!rubric) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Rubric not found' } },
        { status: 404 }
      );
    }

    // Create assignments using round-robin distribution
    const assignments = [];
    const reviewerCount = validatedData.reviewerIds.length;
    const dueDate = new Date(validatedData.dueDate);

    for (let i = 0; i < validatedData.submissionIds.length; i++) {
      const submissionId = validatedData.submissionIds[i];

      for (let j = 0; j < validatedData.reviewsPerSubmission; j++) {
        const reviewerIndex = (i + j) % reviewerCount;
        const reviewerId = validatedData.reviewerIds[reviewerIndex];

        assignments.push({
          rubricId: validatedData.rubricId,
          submissionId,
          reviewerId,
          status: 'ASSIGNED' as const,
          isBlind: validatedData.isBlind,
          dueDate,
        });
      }
    }

    // Batch create assignments
    const createdAssignments = await db.reviewAssignment.createMany({
      data: assignments,
    });

    return NextResponse.json({
      success: true,
      data: {
        assignmentsCreated: createdAssignments.count,
        submissionsAssigned: validatedData.submissionIds.length,
        reviewersAssigned: validatedData.reviewerIds.length,
        reviewsPerSubmission: validatedData.reviewsPerSubmission,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
        },
        { status: 400 }
      );
    }

    console.error('[PEER_REVIEW_ASSIGNMENTS_POST]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create assignments' } },
      { status: 500 }
    );
  }
}

// Get user's assignments
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const whereClause: {
      reviewerId: string;
      status?: 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'CALIBRATING' | 'DISPUTED' | 'RESOLVED' | 'COMPLETED';
    } = {
      reviewerId: user.id,
    };

    if (status) {
      whereClause.status = status as typeof whereClause.status;
    }

    const assignments = await db.reviewAssignment.findMany({
      where: whereClause,
      include: {
        rubric: {
          include: {
            criteria: true,
          },
        },
        review: {
          include: {
            scores: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: {
        assignments: assignments.map((a) => ({
          id: a.id,
          submissionId: a.isBlind ? undefined : a.submissionId,
          status: a.status,
          dueDate: a.dueDate,
          isBlind: a.isBlind,
          rubric: {
            id: a.rubric.id,
            name: a.rubric.name,
            criteriaCount: a.rubric.criteria.length,
            totalPoints: a.rubric.totalPoints,
          },
          existingReview: a.review
            ? {
                id: a.review.id,
                submittedAt: a.review.submittedAt,
                overallScore: a.review.overallScore,
              }
            : null,
          assignedAt: a.assignedAt,
          startedAt: a.startedAt,
          completedAt: a.completedAt,
        })),
        summary: {
          total: assignments.length,
          assigned: assignments.filter((a) => a.status === 'ASSIGNED').length,
          inProgress: assignments.filter((a) => a.status === 'IN_PROGRESS').length,
          completed: assignments.filter((a) => a.status === 'COMPLETED').length,
        },
      },
    });
  } catch (error) {
    console.error('[PEER_REVIEW_ASSIGNMENTS_GET]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assignments' } },
      { status: 500 }
    );
  }
}
