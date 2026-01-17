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
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { z } from 'zod';
import {
  createFairnessAuditor,
  type EvaluationWithDemographics,
} from '@sam-ai/safety';

const CRON_SECRET = process.env.CRON_SECRET;

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

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron authentication
    const authHeader = req.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      logger.warn('[SAM_FAIRNESS_AUDIT] Unauthorized cron access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
  } catch (error) {
    logger.error('[SAM_FAIRNESS_AUDIT] Error running fairness audit:', error);
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
  // Fetch SAM evaluation samples from the database
  const samples = await db.samEvaluationSample.findMany({
    where: {
      createdAt: { gte: sinceDate },
      ...(courseId && {
        context: {
          path: ['courseId'],
          equals: courseId,
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          enrollments: {
            select: {
              course: {
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
    },
  });

  // Transform to evaluation format
  return samples.map((sample) => {
    const context = sample.context as Record<string, unknown> | null;
    const studentInfo = context?.studentInfo as Record<string, unknown> | undefined;

    return {
      id: sample.id,
      text: sample.response,
      score: (context?.score as number) ?? 0,
      maxScore: (context?.maxScore as number) ?? 100,
      studentId: sample.userId,
      targetGradeLevel: (studentInfo?.gradeLevel as number) ?? undefined,
      subject: (context?.subject as string) ?? undefined,
      demographics: {
        gradeLevel: (studentInfo?.gradeLevel as number) ?? undefined,
        subject: (context?.subject as string) ?? undefined,
        learnerType: (studentInfo?.learnerType as 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing') ?? undefined,
        performanceLevel: (studentInfo?.performanceLevel as 'low' | 'medium' | 'high') ?? undefined,
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
    // Store audit result in the observability metrics table
    await db.sAMObservabilityMetrics.create({
      data: {
        component: 'fairness-audit',
        metricName: 'fairness_score',
        metricValue: result.fairnessScore,
        sampleCount: result.evaluationsAnalyzed,
        tags: {
          passed: result.passed,
          criticalIssues: result.criticalIssues,
          highPriorityRecommendations: result.highPriorityRecommendations,
          demographicDisparities: result.demographicDisparities,
          courseId: courseId ?? 'all',
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.warn('[SAM_FAIRNESS_AUDIT] Failed to store audit result:', error);
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

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          type: 'system',
          title: 'SAM Fairness Audit Alert',
          message: `Fairness audit detected ${result.criticalIssues} critical issue(s). Score: ${result.fairnessScore}/100. ${
            result.demographicDisparities.length > 0
              ? `Disparities in: ${result.demographicDisparities.join(', ')}`
              : ''
          }`,
          data: {
            type: 'fairness_audit',
            courseId: courseId ?? 'all',
            fairnessScore: result.fairnessScore,
            criticalIssues: result.criticalIssues,
          },
        },
      });
    }

    logger.info('[SAM_FAIRNESS_AUDIT] Admin notifications queued', {
      adminCount: admins.length,
      criticalIssues: result.criticalIssues,
    });
  } catch (error) {
    logger.warn('[SAM_FAIRNESS_AUDIT] Failed to queue admin notifications:', error);
  }
}
