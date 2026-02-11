/**
 * SAM AI Mentor - Risk Radar API
 *
 * Analyzes student learning patterns to identify risks.
 * Note: Uses SAMInteraction for data until dedicated models are added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const CreateInterventionSchema = z.object({
  riskType: z.string().min(1),
  message: z.string().min(1).max(1000),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
});

// Context types
interface RiskDataContext {
  type: 'confidence_log' | 'misconception' | 'review_entry';
  topic?: string;
  isCorrect?: boolean;
  wasOverconfident?: boolean;
  wasUnderconfident?: boolean;
  masteryLevel?: number;
  priority?: string;
}

interface RiskIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedTopics: string[];
  recommendation: string;
}

/**
 * GET - Get risk analysis for student
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
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get relevant interactions
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Analyze risks
    const risks: RiskIndicator[] = [];
    const topicIssues = new Map<string, { misconceptions: number; lowMastery: number }>();

    let overconfidentCount = 0;
    let underconfidentCount = 0;
    let totalConfidenceLogs = 0;
    let inactivityDays = 0;

    // Check for inactivity
    const lastInteraction = interactions[0];
    if (lastInteraction) {
      const daysSinceLastActivity = Math.floor(
        (Date.now() - lastInteraction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      inactivityDays = daysSinceLastActivity;
    }

    // Analyze interaction patterns
    for (const interaction of interactions) {
      const ctx = interaction.context as unknown as RiskDataContext | null;
      if (!ctx) continue;

      const topic = ctx.topic;

      if (ctx.type === 'confidence_log') {
        totalConfidenceLogs++;
        if (ctx.wasOverconfident) overconfidentCount++;
        if (ctx.wasUnderconfident) underconfidentCount++;
      }

      if (ctx.type === 'misconception' && topic) {
        if (!topicIssues.has(topic)) {
          topicIssues.set(topic, { misconceptions: 0, lowMastery: 0 });
        }
        topicIssues.get(topic)!.misconceptions++;
      }

      if (ctx.type === 'review_entry' && topic && ctx.masteryLevel !== undefined) {
        if (ctx.masteryLevel < 0.4) {
          if (!topicIssues.has(topic)) {
            topicIssues.set(topic, { misconceptions: 0, lowMastery: 0 });
          }
          topicIssues.get(topic)!.lowMastery++;
        }
      }
    }

    // Generate risk indicators

    // Inactivity risk
    if (inactivityDays >= 7) {
      risks.push({
        type: 'inactivity',
        severity: inactivityDays >= 14 ? 'critical' : inactivityDays >= 7 ? 'high' : 'medium',
        description: `No learning activity for ${inactivityDays} days`,
        affectedTopics: [],
        recommendation: 'Schedule a short study session to maintain momentum',
      });
    }

    // Overconfidence risk
    if (totalConfidenceLogs >= 5 && overconfidentCount / totalConfidenceLogs > 0.3) {
      risks.push({
        type: 'overconfidence',
        severity: overconfidentCount / totalConfidenceLogs > 0.5 ? 'high' : 'medium',
        description: `High overconfidence rate (${Math.round(overconfidentCount / totalConfidenceLogs * 100)}%)`,
        affectedTopics: [],
        recommendation: 'Practice being more conservative with confidence ratings',
      });
    }

    // Underconfidence risk
    if (totalConfidenceLogs >= 5 && underconfidentCount / totalConfidenceLogs > 0.3) {
      risks.push({
        type: 'underconfidence',
        severity: 'medium',
        description: `Tendency to underestimate knowledge (${Math.round(underconfidentCount / totalConfidenceLogs * 100)}%)`,
        affectedTopics: [],
        recommendation: 'Trust your knowledge more - you know more than you think!',
      });
    }

    // Topic-specific risks
    for (const [topic, issues] of topicIssues) {
      if (issues.misconceptions >= 2 || issues.lowMastery >= 2) {
        risks.push({
          type: 'knowledge_gap',
          severity: issues.misconceptions >= 3 || issues.lowMastery >= 3 ? 'high' : 'medium',
          description: `Persistent issues with topic: ${topic}`,
          affectedTopics: [topic],
          recommendation: 'Schedule focused review and remediation exercises',
        });
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Calculate overall risk score
    const riskScore = Math.min(100, risks.reduce((sum, r) => {
      const scores = { critical: 30, high: 20, medium: 10, low: 5 };
      return sum + scores[r.severity];
    }, 0));

    return NextResponse.json({
      success: true,
      data: {
        risks,
        overallRiskScore: riskScore,
        riskLevel: riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low',
        stats: {
          daysAnalyzed: days,
          totalInteractions: interactions.length,
          inactivityDays,
          overconfidenceRate: totalConfidenceLogs > 0 ? overconfidentCount / totalConfidenceLogs : 0,
          topicsWithIssues: topicIssues.size,
        },
        recommendations: risks.slice(0, 3).map(r => ({
          priority: r.severity,
          action: r.recommendation,
          relatedTo: r.type,
        })),
      },
    });

  } catch (error) {
    logger.error('[RISK RADAR] Get error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to analyze risks' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Create teacher intervention based on risk
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

    const gateResult = await withSubscriptionGate(user.id, { category: 'premium-feature' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await request.json();
    const validatedData = CreateInterventionSchema.parse(body);

    // Store intervention as SAMInteraction
    const intervention = await db.sAMInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
        context: {
          type: 'teacher_intervention',
          riskType: validatedData.riskType,
          message: validatedData.message,
          priority: validatedData.priority,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        actionTaken: 'intervention_created',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: intervention.id,
        riskType: validatedData.riskType,
        message: validatedData.message,
        priority: validatedData.priority,
        status: 'PENDING',
        createdAt: intervention.createdAt.toISOString(),
      },
    });

  } catch (error) {
    logger.error('[RISK RADAR] Create intervention error:', error);

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
