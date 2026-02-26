/**
 * Peer Review Submission API
 * POST /api/peer-review/reviews - Submit a peer review
 * GET /api/peer-review/reviews - Get reviews for a submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const SubmitReviewSchema = z.object({
  assignmentId: z.string().min(1),
  scores: z.array(
    z.object({
      criterionId: z.string().min(1),
      score: z.number().min(0),
      feedback: z.string().min(1),
    })
  ),
  overallFeedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  timeSpentMinutes: z.number().min(1),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});

// Submit peer review
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = SubmitReviewSchema.parse(body);

    // Verify assignment exists and belongs to user
    const assignment = await db.reviewAssignment.findFirst({
      where: {
        id: validatedData.assignmentId,
        reviewerId: user.id,
      },
      include: {
        rubric: {
          include: { criteria: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      );
    }

    if (assignment.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Review already submitted' } },
        { status: 409 }
      );
    }

    // Validate scores against rubric criteria
    const criteriaIds = assignment.rubric.criteria.map((c) => c.id);
    const scoresCriteriaIds = validatedData.scores.map((s) => s.criterionId);

    const missingCriteria = criteriaIds.filter((id) => !scoresCriteriaIds.includes(id));
    if (missingCriteria.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing scores for some criteria',
            details: { missingCriteria },
          },
        },
        { status: 400 }
      );
    }

    // Validate score ranges
    for (const score of validatedData.scores) {
      const criterion = assignment.rubric.criteria.find((c) => c.id === score.criterionId);
      if (criterion && score.score > criterion.maxScore) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Score for ${criterion.name} exceeds maximum (${criterion.maxScore})`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Calculate total score (weighted)
    let totalScore = 0;
    for (const score of validatedData.scores) {
      const criterion = assignment.rubric.criteria.find((c) => c.id === score.criterionId);
      if (criterion) {
        totalScore += (score.score / criterion.maxScore) * criterion.weight;
      }
    }
    totalScore = Math.round(totalScore * 100) / 100; // Round to 2 decimal places

    // Create review with scores
    const review = await db.peerReview.create({
      data: {
        assignmentId: validatedData.assignmentId,
        reviewerId: user.id,
        submissionId: assignment.submissionId,
        overallScore: totalScore,
        overallFeedback: validatedData.overallFeedback,
        strengths: validatedData.strengths,
        improvements: validatedData.improvements,
        timeSpentMinutes: validatedData.timeSpentMinutes,
        confidence: validatedData.confidence,
        submittedAt: new Date(),
        scores: {
          create: validatedData.scores.map((s) => ({
            criterionId: s.criterionId,
            score: s.score,
            feedback: s.feedback,
          })),
        },
      },
      include: {
        scores: true,
      },
    });

    // Update assignment status
    await db.reviewAssignment.update({
      where: { id: validatedData.assignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update reviewer profile stats
    await db.reviewerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        totalReviews: 1,
        averageTimeMinutes: validatedData.timeSpentMinutes,
        level: 'NOVICE',
      },
      update: {
        totalReviews: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        reviewId: review.id,
        overallScore: totalScore,
        totalPoints: assignment.rubric.totalPoints,
        scores: review.scores,
        submittedAt: review.submittedAt,
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

    console.error('[PEER_REVIEW_SUBMIT]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit review' } },
      { status: 500 }
    );
  }
}

// Get reviews for a submission (for teachers/admins)
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
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Submission ID required' } },
        { status: 400 }
      );
    }

    // Check authorization (teachers/admins or the submission owner)
    const isPrivileged = ['ADMIN', 'TEACHER', 'INSTRUCTOR'].includes(user.role);

    const reviews = await db.peerReview.findMany({
      where: { submissionId },
      include: {
        reviewer: isPrivileged
          ? { select: { id: true, name: true } }
          : false,
        scores: {
          include: {
            criterion: true,
          },
        },
      },
      take: 100,
    });

    // Calculate aggregated score
    const totalScores = reviews.map((r) => r.overallScore);
    const averageScore =
      totalScores.length > 0
        ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length
        : 0;

    // Calculate inter-rater reliability (simplified)
    const variance =
      totalScores.length > 1
        ? totalScores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) /
          (totalScores.length - 1)
        : 0;
    const standardDeviation = Math.sqrt(variance);

    return NextResponse.json({
      success: true,
      data: {
        submissionId,
        reviewCount: reviews.length,
        reviews: reviews.map((r) => ({
          id: r.id,
          reviewer: isPrivileged ? r.reviewer : undefined,
          overallScore: r.overallScore,
          overallFeedback: r.overallFeedback,
          strengths: r.strengths,
          improvements: r.improvements,
          confidence: r.confidence,
          scores: r.scores.map((s) => ({
            criterion: s.criterion.name,
            score: s.score,
            maxScore: s.criterion.maxScore,
            feedback: s.feedback,
          })),
          submittedAt: r.submittedAt,
        })),
        aggregatedScore: {
          average: Math.round(averageScore * 100) / 100,
          standardDeviation: Math.round(standardDeviation * 100) / 100,
          min: totalScores.length > 0 ? Math.min(...totalScores) : 0,
          max: totalScores.length > 0 ? Math.max(...totalScores) : 0,
        },
      },
    });
  } catch (error) {
    console.error('[PEER_REVIEW_GET]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reviews' } },
      { status: 500 }
    );
  }
}
