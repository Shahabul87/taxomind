/**
 * SAM Fairness Auditing API
 *
 * Provides comprehensive fairness auditing for AI-generated evaluations.
 * Uses the @sam-ai/safety package for bias detection, demographic analysis,
 * and fairness recommendations.
 *
 * Endpoints:
 * - POST: Run fairness audit on evaluations
 * - GET: Get fairness configuration and available dimensions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import {
  createFairnessAuditor,
  createStrictFairnessAuditor,
  createLenientFairnessAuditor,
  type EvaluationWithDemographics,
  type FairnessAuditReport,
} from '@sam-ai/safety';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DemographicsSchema = z.object({
  gradeLevel: z.number().int().min(1).max(12).optional(),
  subject: z.string().optional(),
  school: z.string().optional(),
  region: z.string().optional(),
  learnerType: z.enum(['visual', 'auditory', 'kinesthetic', 'reading-writing']).optional(),
  performanceLevel: z.enum(['low', 'medium', 'high']).optional(),
});

const EvaluationSchema = z.object({
  id: z.string(),
  text: z.string(), // Main feedback text (required)
  score: z.number().min(0),
  maxScore: z.number().min(1),
  strengths: z.array(z.string()).optional(), // Identified strengths
  improvements: z.array(z.string()).optional(), // Suggested improvements
  comments: z.string().optional(), // Additional comments
  targetGradeLevel: z.number().int().min(1).max(12).optional(),
  subject: z.string().optional(),
  studentId: z.string().optional(),
  demographics: DemographicsSchema.optional(),
});

const AuditConfigSchema = z.object({
  minSampleSize: z.number().int().min(1).max(1000).optional(),
  significanceThreshold: z.number().min(0).max(1).optional(),
  disparityThreshold: z.number().min(0).max(1).optional(),
  checkScoreDistribution: z.boolean().optional(),
  checkFeedbackSentiment: z.boolean().optional(),
  checkIssuePatterns: z.boolean().optional(),
});

const RunAuditSchema = z.object({
  evaluations: z.array(EvaluationSchema).min(1).max(10000),
  config: AuditConfigSchema.optional(),
  auditMode: z.enum(['standard', 'strict', 'lenient']).optional().default('standard'),
  quickAudit: z.boolean().optional().default(false),
});

// ============================================================================
// POST - Run Fairness Audit
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateResult = await withSubscriptionGate(session.user.id, { category: 'analysis' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const validated = RunAuditSchema.parse(body);

    // Transform evaluations to the expected format
    const evaluationsWithDemographics: EvaluationWithDemographics[] = validated.evaluations.map(
      (e) => ({
        id: e.id,
        text: e.text,
        score: e.score,
        maxScore: e.maxScore,
        strengths: e.strengths,
        improvements: e.improvements,
        comments: e.comments,
        targetGradeLevel: e.targetGradeLevel,
        subject: e.subject,
        studentId: e.studentId,
        demographics: e.demographics,
      })
    );

    // Create auditor based on mode
    let auditor;
    switch (validated.auditMode) {
      case 'strict':
        auditor = createStrictFairnessAuditor(validated.config);
        break;
      case 'lenient':
        auditor = createLenientFairnessAuditor(validated.config);
        break;
      default:
        auditor = createFairnessAuditor(validated.config);
    }

    let result;
    const startTime = Date.now();

    if (validated.quickAudit) {
      // Quick audit - critical issues only
      result = await auditor.quickAudit(evaluationsWithDemographics);

      logger.info('[FAIRNESS_AUDIT] Quick audit completed', {
        userId: session.user.id,
        evaluationCount: validated.evaluations.length,
        passed: result.passed,
        criticalIssues: result.criticalIssues,
        processingTimeMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        data: {
          type: 'quick',
          ...result,
          processingTimeMs: Date.now() - startTime,
        },
      });
    }

    // Full audit
    const fullResult = await auditor.runFairnessAudit(evaluationsWithDemographics);

    // Transform result for API response (convert Maps to objects)
    const response = transformAuditReport(fullResult);

    logger.info('[FAIRNESS_AUDIT] Full audit completed', {
      userId: session.user.id,
      evaluationCount: validated.evaluations.length,
      auditMode: validated.auditMode,
      passed: fullResult.passed,
      fairnessScore: fullResult.fairnessScore,
      recommendationCount: fullResult.recommendations.length,
      processingTimeMs: fullResult.auditDurationMs,
    });

    return NextResponse.json({
      success: true,
      data: {
        type: 'full',
        ...response,
      },
    });
  } catch (error) {
    logger.error('[FAIRNESS_AUDIT] Error running audit:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to run fairness audit' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Fairness Configuration Info
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configInfo = {
      auditModes: [
        {
          mode: 'standard',
          description: 'Default fairness auditing with balanced thresholds',
          defaults: {
            minSampleSize: 30,
            significanceThreshold: 0.05,
            disparityThreshold: 0.15,
          },
        },
        {
          mode: 'strict',
          description: 'Strict fairness auditing with tighter thresholds',
          defaults: {
            minSampleSize: 30,
            significanceThreshold: 0.01,
            disparityThreshold: 0.1,
          },
        },
        {
          mode: 'lenient',
          description: 'Lenient fairness auditing with relaxed thresholds',
          defaults: {
            minSampleSize: 10,
            significanceThreshold: 0.05,
            disparityThreshold: 0.25,
          },
        },
      ],
      demographicDimensions: [
        {
          dimension: 'gradeLevel',
          description: 'Student grade level (1-12)',
          type: 'number',
        },
        {
          dimension: 'subject',
          description: 'Academic subject area',
          type: 'string',
        },
        {
          dimension: 'school',
          description: 'School identifier',
          type: 'string',
        },
        {
          dimension: 'region',
          description: 'Geographic region',
          type: 'string',
        },
        {
          dimension: 'learnerType',
          description: 'Learning style preference',
          type: 'enum',
          values: ['visual', 'auditory', 'kinesthetic', 'reading-writing'],
        },
        {
          dimension: 'performanceLevel',
          description: 'Historical performance level',
          type: 'enum',
          values: ['low', 'medium', 'high'],
        },
      ],
      analysisTypes: [
        {
          type: 'scoreDistribution',
          description: 'Analyzes score distribution across demographic groups',
          metrics: ['mean', 'median', 'stdDev', 'skewness'],
        },
        {
          type: 'feedbackSentiment',
          description: 'Analyzes feedback sentiment consistency',
          metrics: ['positivityRate', 'disparities'],
        },
        {
          type: 'issuePatterns',
          description: 'Identifies common safety issues',
          metrics: ['totalIssues', 'issuesByType', 'issuesBySeverity'],
        },
      ],
      recommendationPriorities: [
        { priority: 'critical', description: 'Must be addressed immediately' },
        { priority: 'high', description: 'Should be addressed soon' },
        { priority: 'medium', description: 'Should be addressed when possible' },
        { priority: 'low', description: 'Nice to have improvements' },
      ],
      recommendationCategories: [
        'demographic_disparity',
        'score_distribution',
        'sentiment_disparity',
        'common_issue',
        'maintenance',
      ],
      sampleRequirements: {
        minimumEvaluations: 1,
        maximumEvaluations: 10000,
        recommendedMinimum: 30,
        optimalSampleSize: 100,
      },
    };

    return NextResponse.json({
      success: true,
      data: configInfo,
    });
  } catch (error) {
    logger.error('[FAIRNESS_AUDIT] Error getting config info:', error);

    return NextResponse.json(
      { error: 'Failed to get fairness configuration' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function transformAuditReport(report: FairnessAuditReport) {
  return {
    passed: report.passed,
    fairnessScore: report.fairnessScore,
    evaluationsAnalyzed: report.evaluationsAnalyzed,
    demographicAnalysis: report.demographicAnalysis.map((da) => ({
      dimension: da.dimension,
      groups: da.groups,
      disparity: da.disparity,
      isSignificant: da.isSignificant,
    })),
    scoreDistribution: report.scoreDistribution
      ? {
          overall: report.scoreDistribution.overall,
          byGroup: Object.fromEntries(report.scoreDistribution.byGroup),
        }
      : null,
    sentimentAnalysis: report.sentimentAnalysis
      ? {
          overallPositivityRate: report.sentimentAnalysis.overallPositivityRate,
          byGroup: Object.fromEntries(report.sentimentAnalysis.byGroup),
          disparities: report.sentimentAnalysis.disparities,
        }
      : null,
    issuePatterns: report.issuePatterns
      ? {
          totalIssues: report.issuePatterns.totalIssues,
          issuesByType: Object.fromEntries(report.issuePatterns.issuesByType),
          issuesBySeverity: Object.fromEntries(report.issuePatterns.issuesBySeverity),
          mostCommonIssues: report.issuePatterns.mostCommonIssues,
        }
      : null,
    overallStatistics: report.overallStatistics,
    recommendations: report.recommendations.map((rec) => ({
      priority: rec.priority,
      category: rec.category,
      description: rec.description,
      action: rec.action,
      expectedImpact: rec.expectedImpact,
      affectedDimensions: rec.affectedDimensions,
    })),
    metadata: {
      auditedAt: report.auditedAt.toISOString(),
      auditDurationMs: report.auditDurationMs,
    },
  };
}
