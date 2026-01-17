/**
 * SAM Accessibility Checker API
 *
 * Provides readability and accessibility analysis for feedback text.
 * Uses the @sam-ai/safety package for grade level, reading ease,
 * and text complexity analysis.
 *
 * Endpoints:
 * - POST: Analyze text accessibility and readability
 * - GET: Get accessibility configuration and thresholds
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  createAccessibilityChecker,
  createElementaryAccessibilityChecker,
  createHighSchoolAccessibilityChecker,
  createCollegeAccessibilityChecker,
  type AccessibilityResult,
} from '@sam-ai/safety';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AccessibilityCheckSchema = z.object({
  text: z.string().min(1).max(50000),
  targetGradeLevel: z.number().int().min(1).max(16).optional(),
  audienceLevel: z.enum(['elementary', 'middle', 'high', 'college', 'custom']).optional().default('custom'),
  config: z.object({
    maxGradeLevel: z.number().int().min(1).max(20).optional(),
    maxSentenceLength: z.number().int().min(10).max(100).optional(),
    maxPassiveVoicePercentage: z.number().min(0).max(100).optional(),
    maxComplexWordPercentage: z.number().min(0).max(100).optional(),
  }).optional(),
});

// ============================================================================
// POST - Check Text Accessibility
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = AccessibilityCheckSchema.parse(body);

    // Create checker based on audience level
    let checker;
    switch (validated.audienceLevel) {
      case 'elementary':
        checker = createElementaryAccessibilityChecker(validated.config);
        break;
      case 'high':
        checker = createHighSchoolAccessibilityChecker(validated.config);
        break;
      case 'college':
        checker = createCollegeAccessibilityChecker(validated.config);
        break;
      default:
        checker = createAccessibilityChecker({
          ...validated.config,
          targetGradeLevel: validated.targetGradeLevel,
        });
    }

    const startTime = Date.now();

    // Run accessibility check
    const result = checker.check(validated.text, validated.targetGradeLevel);

    // Get improvement suggestions
    const suggestions = checker.getSuggestions(result);

    // Determine target grade level for response
    const targetLevel = validated.targetGradeLevel ?? getDefaultTargetLevel(validated.audienceLevel);

    const response = transformAccessibilityResult(result, targetLevel, suggestions);

    logger.info('[ACCESSIBILITY_CHECK] Analysis completed', {
      userId: session.user.id,
      textLength: validated.text.length,
      gradeLevel: result.gradeLevel,
      readingEase: result.readabilityScore,
      passed: result.passed,
      issueCount: result.issues.length,
      processingTimeMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('[ACCESSIBILITY_CHECK] Error analyzing text:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze accessibility' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Accessibility Configuration Info
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configInfo = {
      audienceLevels: [
        {
          level: 'elementary',
          description: 'Grades 1-5: Basic vocabulary, simple sentences',
          defaults: {
            targetGradeLevel: 5,
            maxGradeLevel: 8,
          },
        },
        {
          level: 'middle',
          description: 'Grades 6-8: Moderate complexity, some technical terms',
          defaults: {
            targetGradeLevel: 8,
            maxGradeLevel: 12,
          },
        },
        {
          level: 'high',
          description: 'Grades 9-12: Complex sentences, academic vocabulary',
          defaults: {
            targetGradeLevel: 10,
            maxGradeLevel: 14,
          },
        },
        {
          level: 'college',
          description: 'College level: Advanced vocabulary, dense content',
          defaults: {
            targetGradeLevel: 12,
            maxGradeLevel: 16,
          },
        },
      ],
      readingEaseLevels: [
        { min: 90, max: 100, label: 'Very Easy', description: '5th grade or below' },
        { min: 80, max: 89, label: 'Easy', description: '6th grade' },
        { min: 70, max: 79, label: 'Fairly Easy', description: '7th grade' },
        { min: 60, max: 69, label: 'Standard', description: '8th-9th grade' },
        { min: 50, max: 59, label: 'Fairly Difficult', description: '10th-12th grade' },
        { min: 30, max: 49, label: 'Difficult', description: 'College level' },
        { min: 0, max: 29, label: 'Very Difficult', description: 'College graduate' },
      ],
      issueTypes: [
        { type: 'reading_level_too_high', severity: 'high', description: 'Text exceeds target reading level' },
        { type: 'sentence_too_long', severity: 'medium', description: 'Sentences exceed recommended length' },
        { type: 'complex_vocabulary', severity: 'medium', description: 'Too many complex words' },
        { type: 'passive_voice_overuse', severity: 'low', description: 'Excessive passive voice usage' },
        { type: 'jargon_without_explanation', severity: 'medium', description: 'Technical jargon detected' },
        { type: 'ambiguous_pronouns', severity: 'low', description: 'Unclear pronoun references' },
        { type: 'dense_paragraphs', severity: 'low', description: 'Paragraphs are too long' },
      ],
      thresholds: {
        maxSentenceLength: {
          description: 'Maximum recommended words per sentence',
          default: 25,
          range: { min: 10, max: 100 },
        },
        maxPassiveVoicePercentage: {
          description: 'Maximum percentage of passive voice usage',
          default: 30,
          range: { min: 0, max: 100 },
        },
        maxComplexWordPercentage: {
          description: 'Maximum percentage of complex words (3+ syllables)',
          default: 20,
          range: { min: 0, max: 100 },
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: configInfo,
    });
  } catch (error) {
    logger.error('[ACCESSIBILITY_CHECK] Error getting config info:', error);

    return NextResponse.json(
      { error: 'Failed to get accessibility configuration' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getDefaultTargetLevel(audienceLevel: string): number {
  switch (audienceLevel) {
    case 'elementary':
      return 5;
    case 'middle':
      return 8;
    case 'high':
      return 10;
    case 'college':
      return 12;
    default:
      return 8;
  }
}

function transformAccessibilityResult(
  result: AccessibilityResult,
  targetGradeLevel: number,
  suggestions: string[]
) {
  return {
    passed: result.passed,
    gradeLevel: result.gradeLevel,
    readingEase: result.readabilityScore,
    targetGradeLevel,
    statistics: {
      wordCount: result.statistics.wordCount,
      sentenceCount: result.statistics.sentenceCount,
      averageSentenceLength: result.statistics.averageSentenceLength,
      averageWordSyllables: result.statistics.averageWordSyllables,
      complexWordPercentage: result.statistics.complexWordPercentage,
      passiveVoicePercentage: result.statistics.passiveVoicePercentage,
    },
    issues: result.issues.map((issue) => ({
      type: issue.type,
      severity: issue.severity,
      description: issue.description,
      suggestion: issue.suggestion,
    })),
    suggestions,
  };
}
