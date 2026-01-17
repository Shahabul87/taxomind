/**
 * SAM Discouraging Language Detector API
 *
 * Detects discouraging, demotivating, or harmful language in feedback.
 * Uses the @sam-ai/safety package for pattern matching and
 * alternative suggestions.
 *
 * Endpoints:
 * - POST: Detect discouraging language in text
 * - GET: Get detection configuration and pattern categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  createDiscouragingLanguageDetector,
  createStrictDiscouragingDetector,
  createLenientDiscouragingDetector,
  type DiscouragingLanguageResult,
  type DiscouragingCategory,
} from '@sam-ai/safety';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DiscouragingLanguageCheckSchema = z.object({
  text: z.string().min(1).max(50000),
  mode: z.enum(['strict', 'standard', 'lenient']).optional().default('standard'),
  includeRewrites: z.boolean().optional().default(false),
  customPhrases: z.array(z.string()).optional(),
});

// ============================================================================
// POST - Detect Discouraging Language
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = DiscouragingLanguageCheckSchema.parse(body);

    // Create detector based on mode
    let detector;
    const config = validated.customPhrases
      ? { customPhrases: validated.customPhrases }
      : undefined;

    switch (validated.mode) {
      case 'strict':
        detector = createStrictDiscouragingDetector(config);
        break;
      case 'lenient':
        detector = createLenientDiscouragingDetector(config);
        break;
      default:
        detector = createDiscouragingLanguageDetector(config);
    }

    const startTime = Date.now();

    // Run detection
    const result = detector.detect(validated.text);

    // Calculate category counts
    const categoryCounts = calculateCategoryCounts(result);

    // Get rewrites if requested
    let rewrittenText: string | undefined;
    if (validated.includeRewrites && result.found) {
      rewrittenText = detector.rewriteWithAlternatives(validated.text, result.matches);
    }

    const response = transformDiscouragingResult(result, categoryCounts, rewrittenText);

    logger.info('[DISCOURAGING_LANGUAGE] Detection completed', {
      userId: session.user.id,
      textLength: validated.text.length,
      mode: validated.mode,
      found: result.found,
      matchCount: result.matches.length,
      score: result.score,
      processingTimeMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('[DISCOURAGING_LANGUAGE] Error detecting language:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze discouraging language' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Detection Configuration Info
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configInfo = {
      detectionModes: [
        {
          mode: 'strict',
          description: 'Reports all severities (low, medium, high, critical)',
          minimumSeverity: 'low',
        },
        {
          mode: 'standard',
          description: 'Reports medium severity and above',
          minimumSeverity: 'medium',
        },
        {
          mode: 'lenient',
          description: 'Reports only high and critical severity',
          minimumSeverity: 'high',
        },
      ],
      categories: [
        {
          category: 'absolute_negative',
          description: 'Statements that present limitations as permanent',
          examples: ['you will never', 'you can\'t learn'],
          severity: 'high',
        },
        {
          category: 'personal_attack',
          description: 'Language that attacks the person rather than the work',
          examples: ['you\'re not smart enough', 'what\'s wrong with you'],
          severity: 'critical',
        },
        {
          category: 'dismissive',
          description: 'Language that dismisses or invalidates effort',
          examples: ['completely wrong', 'don\'t bother'],
          severity: 'medium',
        },
        {
          category: 'comparing_negatively',
          description: 'Unfavorable comparisons to others',
          examples: ['unlike other students', 'everyone else got it'],
          severity: 'high',
        },
        {
          category: 'hopelessness',
          description: 'Language that suggests giving up',
          examples: ['give up', 'no point trying', 'waste of time'],
          severity: 'critical',
        },
        {
          category: 'labeling',
          description: 'Negative labels applied to the student',
          examples: ['you\'re a bad student', 'failure'],
          severity: 'critical',
        },
        {
          category: 'sarcasm',
          description: 'Sarcastic or mocking language',
          examples: ['great job... not', 'wow, really'],
          severity: 'high',
        },
        {
          category: 'condescending',
          description: 'Patronizing or talking down',
          examples: ['obviously you', 'even a child could'],
          severity: 'medium',
        },
      ],
      severityLevels: [
        {
          severity: 'critical',
          description: 'Must be removed immediately',
          scorePenalty: 40,
        },
        {
          severity: 'high',
          description: 'Should be addressed urgently',
          scorePenalty: 25,
        },
        {
          severity: 'medium',
          description: 'Should be revised',
          scorePenalty: 15,
        },
        {
          severity: 'low',
          description: 'Consider rephrasing',
          scorePenalty: 5,
        },
      ],
      scoring: {
        maxScore: 100,
        passingScore: 60,
        description: 'Score decreases based on severity and count of matches',
      },
    };

    return NextResponse.json({
      success: true,
      data: configInfo,
    });
  } catch (error) {
    logger.error('[DISCOURAGING_LANGUAGE] Error getting config info:', error);

    return NextResponse.json(
      { error: 'Failed to get detection configuration' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateCategoryCounts(
  result: DiscouragingLanguageResult
): Record<DiscouragingCategory, number> {
  const counts: Record<DiscouragingCategory, number> = {
    absolute_negative: 0,
    personal_attack: 0,
    dismissive: 0,
    comparing_negatively: 0,
    hopelessness: 0,
    labeling: 0,
    sarcasm: 0,
    condescending: 0,
  };

  for (const match of result.matches) {
    counts[match.category]++;
  }

  return counts;
}

function transformDiscouragingResult(
  result: DiscouragingLanguageResult,
  categoryCounts: Record<DiscouragingCategory, number>,
  rewrittenText?: string
) {
  return {
    found: result.found,
    score: result.score,
    matches: result.matches.map((match) => ({
      phrase: match.phrase,
      category: match.category,
      severity: match.severity,
      position: match.position,
      alternative: match.alternative,
    })),
    categoryCounts,
    ...(rewrittenText && { rewrittenText }),
  };
}
