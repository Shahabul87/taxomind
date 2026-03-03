/**
 * SAM Fairness Audit Cron Job
 *
 * Runs scheduled fairness audits on AI-generated evaluations.
 * Identifies bias patterns, demographic disparities, and generates
 * recommendations for improving evaluation fairness.
 *
 * Schedule: Runs weekly on Mondays at 3:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { z } from 'zod';
import {
  createFairnessAuditor,
  type EvaluationWithDemographics,
} from '@sam-ai/safety';

import { withCronAuth } from '@/lib/api/cron-auth';

/**
 * Type guard for checking if a value is a record/object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const querySchema = z.object({
  daysSince: z.coerce.number().int().min(1).max(90).optional().default(7),
  limit: z.coerce.number().int().min(10).max(10000).optional().default(1000),
  courseId: z.string().optional(),
});

interface FairnessAuditResult {
  passed: boolean;
  fairnessScore: number;
  evaluationsAnalyzed: number;
  criticalIssues: number;
  highPriorityRecommendations: number;
  demographicDisparities: string[];
}

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(req);
    if (authResponse) return authResponse;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      daysSince: searchParams.get('daysSince') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { daysSince, limit, courseId } = parsed.data;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysSince);

    // Fetch recent AI-generated evaluations with student demographics
    const evaluations = await fetchRecentEvaluations(sinceDate, limit, courseId);

    if (evaluations.length < 10) {
      logger.info('[SAM_FAIRNESS_AUDIT] Insufficient evaluations for audit', {
        evaluationCount: evaluations.length,
        minRequired: 10,
      });

      return NextResponse.json({
        success: true,
        data: {
          skipped: true,
          reason: 'Insufficient evaluations for meaningful analysis',
          evaluationCount: evaluations.length,
          minRequired: 10,
          durationMs: Date.now() - startTime,
        },
      });
    }

    // Run fairness audit
    const auditor = createFairnessAuditor({
      minSampleSize: 10,
      checkScoreDistribution: true,
      checkFeedbackSentiment: true,
      checkIssuePatterns: true,
    });

    const auditReport = await auditor.runFairnessAudit(evaluations);

    // Extract key metrics
    const result: FairnessAuditResult = {
      passed: auditReport.passed,
      fairnessScore: auditReport.fairnessScore,
      evaluationsAnalyzed: auditReport.evaluationsAnalyzed,
      criticalIssues: auditReport.recommendations.filter(
        (r) => r.priority === 'critical'
      ).length,
      highPriorityRecommendations: auditReport.recommendations.filter(
        (r) => r.priority === 'critical' || r.priority === 'high'
      ).length,
      demographicDisparities: auditReport.demographicAnalysis
        .filter((da) => da.isSignificant)
        .map((da) => da.dimension),
    };

    // Store audit results
    await storeAuditResult(result, auditReport, courseId);

    // Log warnings for failed audits
    if (!result.passed) {
      logger.warn('[SAM_FAIRNESS_AUDIT] Fairness audit FAILED', {
        fairnessScore: result.fairnessScore,
        criticalIssues: result.criticalIssues,
        demographicDisparities: result.demographicDisparities,
        courseId,
      });

      // If there are critical issues, queue notifications
      if (result.criticalIssues > 0) {
        await queueAdminNotification(result, courseId);
      }
    } else {
      logger.info('[SAM_FAIRNESS_AUDIT] Fairness audit PASSED', {
        fairnessScore: result.fairnessScore,
        evaluationsAnalyzed: result.evaluationsAnalyzed,
        courseId,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        daysSince,
        courseId: courseId ?? 'all',
        durationMs: Date.now() - startTime,
        recommendations: auditReport.recommendations.slice(0, 5).map((r) => ({
          priority: r.priority,
          category: r.category,
          description: r.description,
          action: r.action,
        })),
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[SAM_FAIRNESS_AUDIT] Error running fairness audit: ${errMsg}`);
    return NextResponse.json(
      { error: 'Failed to run fairness audit' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetchRecentEvaluations(
  sinceDate: Date,
  limit: number,
  courseId?: string
): Promise<EvaluationWithDemographics[]> {
  // Fetch completed self-assessment attempts as evaluation samples
  const attempts = await db.selfAssessmentAttempt.findMany({
    where: {
      createdAt: { gte: sinceDate },
      status: 'GRADED',
      ...(courseId ? { exam: { courseId } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          Enrollment: {
            select: {
              Course: {
                select: {
                  categoryId: true,
                  category: {
                    select: { name: true },
                  },
                },
              },
            },
            take: 1,
          },
        },
      },
      exam: {
        select: {
          courseId: true,
          title: true,
        },
      },
    },
  });

  // Transform to evaluation format expected by fairness auditor
  return attempts.map((attempt) => {
    const aiSummary = isRecord(attempt.aiEvaluationSummary) ? attempt.aiEvaluationSummary : null;
    const cogProfile = isRecord(attempt.cognitiveProfile) ? attempt.cognitiveProfile : null;
    const enrollment = attempt.user.Enrollment[0];
    const subject = enrollment?.Course?.category?.name ?? undefined;

    return {
      id: attempt.id,
      text: typeof aiSummary?.feedback === 'string' ? aiSummary.feedback : '',
      score: attempt.scorePercentage ?? 0,
      maxScore: 100,
      studentId: attempt.userId,
      targetGradeLevel: undefined,
      subject,
      demographics: {
        gradeLevel: undefined,
        subject,
        learnerType: (typeof cogProfile?.learnerType === 'string'
          ? cogProfile.learnerType as 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing'
          : undefined),
        performanceLevel: (typeof cogProfile?.performanceLevel === 'string'
          ? cogProfile.performanceLevel as 'low' | 'medium' | 'high'
          : undefined),
      },
    };
  });
}

async function storeAuditResult(
  result: FairnessAuditResult,
  _fullReport: unknown,
  courseId?: string
): Promise<void> {
  try {
    // Store audit result in the SAM metrics table
    await db.sAMMetric.create({
      data: {
        name: 'fairness_audit.fairness_score',
        value: result.fairnessScore,
        labels: {
          component: 'fairness-audit',
          passed: result.passed,
          criticalIssues: result.criticalIssues,
          highPriorityRecommendations: result.highPriorityRecommendations,
          demographicDisparities: result.demographicDisparities,
          courseId: courseId ?? 'all',
          sampleCount: result.evaluationsAnalyzed,
        },
        timestamp: new Date(),
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(`[SAM_FAIRNESS_AUDIT] Failed to store audit result: ${errMsg}`);
  }
}

async function queueAdminNotification(
  result: FairnessAuditResult,
  courseId?: string
): Promise<void> {
  try {
    // Create notification for admins about fairness issues
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
      take: 10,
    });

    const notificationMessage = `Fairness audit detected ${result.criticalIssues} critical issue(s). Score: ${result.fairnessScore}/100. ${
      result.demographicDisparities.length > 0
        ? `Disparities in: ${result.demographicDisparities.join(', ')}`
        : ''
    }`;

    // Batch-insert all admin notifications in a single query
    await db.notification.createMany({
      data: admins.map((admin) => ({
        id: crypto.randomUUID(),
        userId: admin.id,
        type: 'system',
        title: 'SAM Fairness Audit Alert',
        message: notificationMessage,
      })),
    });

    logger.info('[SAM_FAIRNESS_AUDIT] Admin notifications queued', {
      adminCount: admins.length,
      criticalIssues: result.criticalIssues,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(`[SAM_FAIRNESS_AUDIT] Failed to queue admin notifications: ${errMsg}`);
  }
}
