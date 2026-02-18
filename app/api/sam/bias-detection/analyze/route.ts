/**
 * SAM Bias Detection Analysis API
 *
 * Provides content-level bias detection for educational materials.
 * Analyzes text content for various types of biases including:
 * - Gender bias
 * - Cultural/ethnic bias
 * - Socioeconomic bias
 * - Cognitive style bias
 * - Language accessibility bias
 *
 * Endpoints:
 * - POST: Analyze content for bias
 * - GET: Get bias detection history and trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// ============================================================================
// TYPES
// ============================================================================

interface BiasIndicator {
  type: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
  position?: { start: number; end: number };
  suggestion?: string;
}

interface BiasScores {
  gender: number;
  cultural: number;
  socioeconomic: number;
  cognitiveStyle: number;
  language: number;
}

interface BiasAnalysisResult {
  id: string;
  contentId: string;
  contentType: string;
  overallBiasScore: number;
  overallSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  biasScores: BiasScores;
  indicators: BiasIndicator[];
  recommendations: string[];
  passesThreshold: boolean;
  analyzedAt: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ContentAnalysisSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum([
    'course_description',
    'lesson_content',
    'assessment_question',
    'feedback',
    'recommendation',
    'notification',
    'general',
  ]),
  content: z.string().min(1).max(50000),
  context: z
    .object({
      courseId: z.string().optional(),
      sectionId: z.string().optional(),
      targetAudience: z.string().optional(),
      subjectArea: z.string().optional(),
    })
    .optional(),
  threshold: z.number().min(0).max(100).optional().default(30), // Default bias threshold
});

const GetHistorySchema = z.object({
  contentId: z.string().optional(),
  contentType: z.string().optional(),
  courseId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// BIAS DETECTION ENGINE
// ============================================================================

// Bias indicator patterns (simplified - in production, use NLP models)
const BIAS_PATTERNS = {
  gender: {
    male_centric: /\b(he|him|his|himself|man|men|mankind|businessman|policeman|fireman)\b/gi,
    female_centric: /\b(she|her|hers|herself|woman|women|businesswoman)\b/gi,
    gendered_assumptions:
      /\b(boys are|girls are|men are|women are|typical (male|female))\b/gi,
    stereotypes:
      /\b(emotional women?|aggressive men?|nurturing mother|breadwinner father)\b/gi,
  },
  cultural: {
    western_centric:
      /\b(western civilization|developed world|third world|primitive|exotic)\b/gi,
    stereotypes:
      /\b(always|never|all \w+ people|typical (asian|african|latin|european))\b/gi,
    othering: /\b(those people|them|their kind|normal people)\b/gi,
  },
  socioeconomic: {
    wealth_assumptions:
      /\b(everyone has|everyone can afford|simply buy|just purchase|easy access to)\b/gi,
    classist_language:
      /\b(lower class|upper class|poor people are|rich people are|welfare|handout)\b/gi,
    education_bias:
      /\b(uneducated|less educated people|simple minds|common folk)\b/gi,
  },
  cognitiveStyle: {
    one_style_only:
      /\b(only way|must learn|should always|never use|wrong way to learn)\b/gi,
    visual_heavy: /\b(clearly see|look at|visualize|picture this)\b/gi,
    auditory_heavy: /\b(listen carefully|hear this|sounds like)\b/gi,
    kinesthetic_ignored: /\b(don&apos;t touch|just read|simply look)\b/gi,
  },
  language: {
    complex_jargon:
      /\b(hermeneutic|epistemological|paradigmatic|ontological|phenomenological)\b/gi,
    idiomatic: /\b(piece of cake|hit the nail|ball in court|back to square)\b/gi,
    informal_excess: /\b(gonna|wanna|kinda|sorta|like totally|you know)\b/gi,
    passive_excess: /\b(is being|are being|was being|were being|been being)\b/gi,
  },
};

function analyzeContent(content: string, contentType: string): {
  overallBiasScore: number;
  overallSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  biasScores: BiasScores;
  indicators: BiasIndicator[];
  recommendations: string[];
} {
  const indicators: BiasIndicator[] = [];
  const contentLower = content.toLowerCase();
  const wordCount = content.split(/\s+/).length;

  // Analyze each bias category
  const scores: BiasScores = {
    gender: 0,
    cultural: 0,
    socioeconomic: 0,
    cognitiveStyle: 0,
    language: 0,
  };

  // Gender bias analysis
  let genderIssues = 0;
  for (const [patternName, pattern] of Object.entries(BIAS_PATTERNS.gender)) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      genderIssues += matches.length;
      if (patternName === 'stereotypes' || patternName === 'gendered_assumptions') {
        indicators.push({
          type: 'gender_bias',
          severity: matches.length > 2 ? 'high' : 'medium',
          evidence: `Found ${matches.length} instance(s) of ${patternName.replace('_', ' ')}`,
          suggestion: 'Use gender-neutral language and avoid stereotypes',
        });
      }
    }
  }
  scores.gender = Math.min(100, (genderIssues / wordCount) * 500);

  // Cultural bias analysis
  let culturalIssues = 0;
  for (const [patternName, pattern] of Object.entries(BIAS_PATTERNS.cultural)) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      culturalIssues += matches.length;
      indicators.push({
        type: 'cultural_bias',
        severity: patternName === 'stereotypes' ? 'high' : 'medium',
        evidence: `Found ${matches.length} instance(s) of ${patternName.replace('_', ' ')}`,
        suggestion: 'Use inclusive language that respects cultural diversity',
      });
    }
  }
  scores.cultural = Math.min(100, (culturalIssues / wordCount) * 500);

  // Socioeconomic bias analysis
  let socioIssues = 0;
  for (const [patternName, pattern] of Object.entries(BIAS_PATTERNS.socioeconomic)) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      socioIssues += matches.length;
      indicators.push({
        type: 'socioeconomic_bias',
        severity: patternName === 'classist_language' ? 'high' : 'medium',
        evidence: `Found ${matches.length} instance(s) of ${patternName.replace('_', ' ')}`,
        suggestion: 'Avoid assumptions about economic status or access to resources',
      });
    }
  }
  scores.socioeconomic = Math.min(100, (socioIssues / wordCount) * 500);

  // Cognitive style bias analysis
  let cognitiveIssues = 0;
  const stylePatterns = BIAS_PATTERNS.cognitiveStyle;
  const visualMatches = content.match(stylePatterns.visual_heavy) ?? [];
  const auditoryMatches = content.match(stylePatterns.auditory_heavy) ?? [];
  const oneStyleMatches = content.match(stylePatterns.one_style_only) ?? [];

  if (oneStyleMatches.length > 0) {
    cognitiveIssues += oneStyleMatches.length * 2;
    indicators.push({
      type: 'cognitive_style_bias',
      severity: 'medium',
      evidence: 'Content suggests only one learning approach is valid',
      suggestion: 'Acknowledge multiple valid learning styles and approaches',
    });
  }

  // Check for heavy reliance on one modality
  if (visualMatches.length > 5 && auditoryMatches.length < 2) {
    cognitiveIssues += 2;
    indicators.push({
      type: 'cognitive_style_bias',
      severity: 'low',
      evidence: 'Content heavily relies on visual language',
      suggestion: 'Include varied sensory language for different learning styles',
    });
  }

  scores.cognitiveStyle = Math.min(100, (cognitiveIssues / wordCount) * 300);

  // Language accessibility analysis
  let languageIssues = 0;
  for (const [patternName, pattern] of Object.entries(BIAS_PATTERNS.language)) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      languageIssues += matches.length;
      if (patternName === 'complex_jargon' && matches.length > 2) {
        indicators.push({
          type: 'language_accessibility',
          severity: 'medium',
          evidence: `Found ${matches.length} complex jargon terms`,
          suggestion: 'Define technical terms or use simpler alternatives',
        });
      }
      if (patternName === 'idiomatic' && matches.length > 1) {
        indicators.push({
          type: 'language_accessibility',
          severity: 'low',
          evidence: `Found ${matches.length} idiomatic expressions`,
          suggestion: 'Reduce idioms for non-native speakers',
        });
      }
    }
  }
  scores.language = Math.min(100, (languageIssues / wordCount) * 400);

  // Calculate overall score (weighted average)
  const weights = {
    gender: 0.25,
    cultural: 0.25,
    socioeconomic: 0.2,
    cognitiveStyle: 0.15,
    language: 0.15,
  };

  const overallBiasScore = Math.round(
    scores.gender * weights.gender +
      scores.cultural * weights.cultural +
      scores.socioeconomic * weights.socioeconomic +
      scores.cognitiveStyle * weights.cognitiveStyle +
      scores.language * weights.language
  );

  // Determine severity
  let overallSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  if (overallBiasScore >= 70) overallSeverity = 'critical';
  else if (overallBiasScore >= 50) overallSeverity = 'high';
  else if (overallBiasScore >= 30) overallSeverity = 'medium';
  else if (overallBiasScore >= 10) overallSeverity = 'low';
  else overallSeverity = 'none';

  // Generate recommendations
  const recommendations: string[] = [];

  if (scores.gender > 20) {
    recommendations.push('Review content for gender-neutral language');
  }
  if (scores.cultural > 20) {
    recommendations.push('Include diverse cultural perspectives and examples');
  }
  if (scores.socioeconomic > 20) {
    recommendations.push('Ensure content is accessible regardless of economic background');
  }
  if (scores.cognitiveStyle > 20) {
    recommendations.push('Incorporate multiple learning modalities');
  }
  if (scores.language > 20) {
    recommendations.push('Simplify language for broader accessibility');
  }

  if (indicators.length === 0) {
    recommendations.push('Content appears unbiased - continue maintaining inclusive practices');
  }

  return {
    overallBiasScore,
    overallSeverity,
    biasScores: {
      gender: Math.round(scores.gender),
      cultural: Math.round(scores.cultural),
      socioeconomic: Math.round(scores.socioeconomic),
      cognitiveStyle: Math.round(scores.cognitiveStyle),
      language: Math.round(scores.language),
    },
    indicators: indicators.slice(0, 20), // Max 20 indicators
    recommendations: recommendations.slice(0, 5),
  };
}

// ============================================================================
// POST - Analyze Content for Bias
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateResult = await withSubscriptionGate(session.user.id, { category: 'analysis' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const validated = ContentAnalysisSchema.parse(body);

    const startTime = Date.now();

    // Analyze the content
    const result = analyzeContent(validated.content, validated.contentType);

    // Store the result
    const record = await db.sAMIntegrityCheck.create({
      data: {
        userId: session.user.id,
        contentHash: Buffer.from(validated.content).toString('base64').slice(0, 64),
        contentLength: validated.content.length,
        checkTypes: ['bias_detection'],
        overallVerdict:
          result.overallBiasScore <= validated.threshold ? 'PASSED' : 'REVIEW_NEEDED',
        riskLevel:
          result.overallSeverity === 'critical'
            ? 'CRITICAL'
            : result.overallSeverity === 'high'
              ? 'HIGH'
              : result.overallSeverity === 'medium'
                ? 'MEDIUM'
                : 'LOW',
        details: {
          contentId: validated.contentId,
          contentType: validated.contentType,
          biasScores: result.biasScores,
          indicators: result.indicators,
          overallBiasScore: result.overallBiasScore,
          overallSeverity: result.overallSeverity,
          context: validated.context,
        },
        recommendations: result.recommendations,
      },
    });

    const processingTime = Date.now() - startTime;

    logger.info('[BIAS_DETECTION] Analysis completed', {
      userId: session.user.id,
      contentId: validated.contentId,
      contentType: validated.contentType,
      overallScore: result.overallBiasScore,
      severity: result.overallSeverity,
      passesThreshold: result.overallBiasScore <= validated.threshold,
      processingTimeMs: processingTime,
    });

    const response: BiasAnalysisResult = {
      id: record.id,
      contentId: validated.contentId,
      contentType: validated.contentType,
      overallBiasScore: result.overallBiasScore,
      overallSeverity: result.overallSeverity,
      biasScores: result.biasScores,
      indicators: result.indicators,
      recommendations: result.recommendations,
      passesThreshold: result.overallBiasScore <= validated.threshold,
      analyzedAt: record.checkedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        processingTimeMs: processingTime,
        threshold: validated.threshold,
      },
    });
  } catch (error) {
    logger.error('[BIAS_DETECTION] Error analyzing content:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze content for bias' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Bias Detection History
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetHistorySchema.parse({
      contentId: searchParams.get('contentId') ?? undefined,
      contentType: searchParams.get('contentType') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    // Build where clause
    const whereClause: {
      userId: string;
      checkTypes: { has: string };
    } = {
      userId: session.user.id,
      checkTypes: { has: 'bias_detection' },
    };

    const records = await db.sAMIntegrityCheck.findMany({
      where: whereClause,
      orderBy: { checkedAt: 'desc' },
      take: query.limit,
      skip: query.offset,
      select: {
        id: true,
        contentLength: true,
        overallVerdict: true,
        riskLevel: true,
        details: true,
        recommendations: true,
        checkedAt: true,
      },
    });

    // Count total for pagination
    const total = await db.sAMIntegrityCheck.count({
      where: whereClause,
    });

    // Transform records
    const history = records.map((r) => {
      const details = r.details as {
        contentId?: string;
        contentType?: string;
        biasScores?: BiasScores;
        overallBiasScore?: number;
        overallSeverity?: string;
      } | null;

      return {
        id: r.id,
        contentId: details?.contentId ?? 'unknown',
        contentType: details?.contentType ?? 'general',
        overallBiasScore: details?.overallBiasScore ?? 0,
        overallSeverity: details?.overallSeverity ?? 'none',
        biasScores: details?.biasScores ?? {
          gender: 0,
          cultural: 0,
          socioeconomic: 0,
          cognitiveStyle: 0,
          language: 0,
        },
        verdict: r.overallVerdict,
        riskLevel: r.riskLevel,
        recommendations: r.recommendations,
        analyzedAt: r.checkedAt.toISOString(),
      };
    });

    // Calculate aggregate statistics
    const allScores = history.map((h) => h.overallBiasScore);
    const stats =
      allScores.length > 0
        ? {
            average: Math.round(
              (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10
            ) / 10,
            min: Math.min(...allScores),
            max: Math.max(...allScores),
            passRate:
              Math.round(
                (history.filter((h) => h.verdict === 'PASSED').length / history.length) * 100
              ) / 100,
          }
        : null;

    return NextResponse.json({
      success: true,
      data: {
        history,
        statistics: stats,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + history.length < total,
        },
      },
    });
  } catch (error) {
    logger.error('[BIAS_DETECTION] Error fetching history:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch bias detection history' },
      { status: 500 }
    );
  }
}
