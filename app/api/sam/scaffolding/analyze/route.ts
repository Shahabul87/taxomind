/**
 * SAM Scaffolding Analysis API
 *
 * Provides personalized scaffolding recommendations based on student progress.
 * Returns scaffolding level, ZPD analysis, strategies, and fading recommendations.
 *
 * GET /api/sam/scaffolding/analyze?userId=...&courseId=...&conceptId=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// TYPES
// ============================================================================

interface ScaffoldingLevel {
  level: 'high' | 'medium' | 'low' | 'minimal';
  description: string;
  techniques: string[];
}

interface ZPDAnalysis {
  currentLevel: number;
  targetLevel: number;
  zpdRange: {
    lower: number;
    upper: number;
  };
  readinessScore: number;
  confidence: number;
}

interface ScaffoldingStrategy {
  id: string;
  name: string;
  type: 'questioning' | 'modeling' | 'hinting' | 'coaching' | 'fading';
  description: string;
  applicability: number;
  effort: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
  steps: string[];
}

interface FadingRecommendation {
  currentPhase: 'high_support' | 'moderate_support' | 'low_support' | 'independence';
  nextPhase: string;
  readyToProgress: boolean;
  progressionCriteria: string[];
  estimatedTimeToNextPhase: string;
}

interface ScaffoldingAnalysis {
  userId: string;
  courseId?: string;
  conceptId?: string;
  currentLevel: ScaffoldingLevel;
  zpd: ZPDAnalysis;
  recommendedStrategies: ScaffoldingStrategy[];
  fading: FadingRecommendation;
  recentEffectiveness: {
    strategyId: string;
    successRate: number;
    usageCount: number;
  }[];
  metadata: {
    analyzedAt: string;
    dataPointsUsed: number;
    confidence: number;
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

const QuerySchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().optional(),
  conceptId: z.string().optional(),
});

// ============================================================================
// GET - Get Scaffolding Analysis
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const params = {
      userId: url.searchParams.get('userId') ?? '',
      courseId: url.searchParams.get('courseId') ?? undefined,
      conceptId: url.searchParams.get('conceptId') ?? undefined,
    };

    const validated = QuerySchema.parse(params);

    // Get user's learning data for analysis
    const [userProgress, recentAssessments, enrollments] = await Promise.all([
      db.user_progress.findMany({
        where: { userId: validated.userId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      db.userExamAttempt.findMany({
        where: { userId: validated.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          scorePercentage: true,
          createdAt: true,
          Exam: {
            select: {
              passingScore: true,
            },
          },
        },
      }),
      db.enrollment.findMany({
        where: { userId: validated.userId },
        include: {
          Course: {
            select: {
              id: true,
              title: true,
              chapters: {
                select: {
                  sections: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate metrics
    const completedSections = userProgress.filter((p) => p.isCompleted).length;
    const totalSections = enrollments.reduce(
      (acc, e) => acc + (e.Course?.chapters.reduce((c, ch) => c + ch.sections.length, 0) ?? 0),
      0
    );

    const avgScore =
      recentAssessments.length > 0
        ? recentAssessments.reduce((acc, a) => acc + (a.scorePercentage ?? 0), 0) / recentAssessments.length
        : 50;

    const completionRate = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

    // Determine scaffolding level based on performance
    const scaffoldingLevel = determineScaffoldingLevel(avgScore, completionRate);
    const zpdAnalysis = calculateZPD(avgScore, completionRate, recentAssessments.length);
    const strategies = recommendStrategies(scaffoldingLevel.level, zpdAnalysis);
    const fadingRec = calculateFading(scaffoldingLevel.level, avgScore, completionRate);

    const analysis: ScaffoldingAnalysis = {
      userId: validated.userId,
      courseId: validated.courseId,
      conceptId: validated.conceptId,
      currentLevel: scaffoldingLevel,
      zpd: zpdAnalysis,
      recommendedStrategies: strategies,
      fading: fadingRec,
      recentEffectiveness: [],
      metadata: {
        analyzedAt: new Date().toISOString(),
        dataPointsUsed: userProgress.length + recentAssessments.length,
        confidence: Math.min(0.95, 0.5 + recentAssessments.length * 0.05),
      },
    };

    logger.info('[SCAFFOLDING_ANALYSIS] Analysis complete', {
      userId: validated.userId,
      level: scaffoldingLevel.level,
      dataPoints: analysis.metadata.dataPointsUsed,
    });

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('[SCAFFOLDING_ANALYSIS] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to analyze scaffolding' }, { status: 500 });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function determineScaffoldingLevel(avgScore: number, completionRate: number): ScaffoldingLevel {
  const combinedMetric = avgScore * 0.6 + completionRate * 0.4;

  if (combinedMetric >= 80) {
    return {
      level: 'minimal',
      description: 'Student demonstrates strong independent learning capability',
      techniques: ['Self-directed exploration', 'Peer teaching', 'Challenge problems'],
    };
  }
  if (combinedMetric >= 60) {
    return {
      level: 'low',
      description: 'Student needs occasional guidance on complex topics',
      techniques: ['Guiding questions', 'Resource suggestions', 'Progress checkpoints'],
    };
  }
  if (combinedMetric >= 40) {
    return {
      level: 'medium',
      description: 'Student benefits from structured support and regular feedback',
      techniques: ['Step-by-step guidance', 'Worked examples', 'Frequent check-ins', 'Concept mapping'],
    };
  }
  return {
    level: 'high',
    description: 'Student requires intensive support and careful pacing',
    techniques: [
      'Direct instruction',
      'Modeling',
      'Guided practice',
      'Immediate feedback',
      'Chunked content',
    ],
  };
}

function calculateZPD(
  avgScore: number,
  completionRate: number,
  assessmentCount: number
): ZPDAnalysis {
  const currentLevel = Math.min(100, Math.max(0, avgScore * 0.7 + completionRate * 0.3));
  const readiness = Math.min(1, assessmentCount * 0.1 + completionRate / 100);

  return {
    currentLevel: Math.round(currentLevel),
    targetLevel: Math.min(100, Math.round(currentLevel + 15 + readiness * 10)),
    zpdRange: {
      lower: Math.max(0, Math.round(currentLevel - 5)),
      upper: Math.min(100, Math.round(currentLevel + 25)),
    },
    readinessScore: Math.round(readiness * 100) / 100,
    confidence: Math.min(0.95, 0.5 + assessmentCount * 0.05),
  };
}

function recommendStrategies(
  level: 'high' | 'medium' | 'low' | 'minimal',
  zpd: ZPDAnalysis
): ScaffoldingStrategy[] {
  const strategies: ScaffoldingStrategy[] = [];

  if (level === 'high' || level === 'medium') {
    strategies.push({
      id: 'modeling',
      name: 'Expert Modeling',
      type: 'modeling',
      description: 'Demonstrate problem-solving processes step-by-step',
      applicability: level === 'high' ? 0.95 : 0.75,
      effort: 'medium',
      expectedImpact: 'high',
      steps: [
        'Select a representative problem',
        'Think aloud while solving',
        'Highlight key decision points',
        'Summarize the approach',
      ],
    });

    strategies.push({
      id: 'questioning',
      name: 'Socratic Questioning',
      type: 'questioning',
      description: 'Guide understanding through targeted questions',
      applicability: 0.85,
      effort: 'low',
      expectedImpact: 'medium',
      steps: [
        'Ask clarifying questions',
        'Probe assumptions',
        'Request evidence',
        'Explore implications',
      ],
    });
  }

  if (level === 'medium' || level === 'low') {
    strategies.push({
      id: 'hinting',
      name: 'Progressive Hints',
      type: 'hinting',
      description: 'Provide increasingly specific hints as needed',
      applicability: 0.8,
      effort: 'low',
      expectedImpact: 'medium',
      steps: [
        'Start with general direction',
        'Add specificity if needed',
        'Reference similar problems',
        'Reveal partial solution if stuck',
      ],
    });
  }

  if (level === 'low' || level === 'minimal') {
    strategies.push({
      id: 'coaching',
      name: 'Performance Coaching',
      type: 'coaching',
      description: 'Provide feedback on approach and execution',
      applicability: 0.7,
      effort: 'medium',
      expectedImpact: 'high',
      steps: [
        'Observe problem-solving attempt',
        'Identify specific strengths',
        'Suggest targeted improvements',
        'Set clear goals',
      ],
    });

    strategies.push({
      id: 'fading',
      name: 'Support Fading',
      type: 'fading',
      description: 'Gradually reduce assistance to build independence',
      applicability: level === 'minimal' ? 0.9 : 0.6,
      effort: 'medium',
      expectedImpact: 'high',
      steps: [
        'Identify current support level',
        'Reduce one support at a time',
        'Monitor performance',
        'Adjust pace as needed',
      ],
    });
  }

  return strategies.sort((a, b) => b.applicability - a.applicability);
}

function calculateFading(
  level: 'high' | 'medium' | 'low' | 'minimal',
  avgScore: number,
  completionRate: number
): FadingRecommendation {
  const phaseMap: Record<string, FadingRecommendation['currentPhase']> = {
    high: 'high_support',
    medium: 'moderate_support',
    low: 'low_support',
    minimal: 'independence',
  };

  const nextPhaseMap: Record<string, string> = {
    high_support: 'Moderate Support',
    moderate_support: 'Low Support',
    low_support: 'Independence',
    independence: 'Mastery',
  };

  const currentPhase = phaseMap[level];
  const readyToProgress = avgScore >= 70 && completionRate >= 60;

  return {
    currentPhase,
    nextPhase: nextPhaseMap[currentPhase],
    readyToProgress,
    progressionCriteria: [
      'Maintain 70%+ assessment score',
      'Complete 60%+ of assigned content',
      'Demonstrate consistent engagement',
      'Show reduced help-seeking behavior',
    ],
    estimatedTimeToNextPhase: readyToProgress ? '1-2 weeks' : '3-4 weeks',
  };
}
