/**
 * Accessibility Audit API
 * POST /api/accessibility/audit - Audit content for WCAG compliance
 * GET /api/accessibility/audit - Get user's accessibility accommodations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const AuditContentSchema = z.object({
  content: z.string().min(1),
  contentType: z.enum(['html', 'text', 'markdown']).default('text'),
  options: z
    .object({
      checkColors: z.boolean().default(true),
      checkReadability: z.boolean().default(true),
      checkStructure: z.boolean().default(true),
      targetLevel: z.enum(['A', 'AA', 'AAA']).default('AA'),
    })
    .optional(),
});

// Simple readability analysis (Flesch-Kincaid approximation)
function analyzeReadability(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((count, word) => {
    // Simple syllable counting
    const vowels = word.toLowerCase().match(/[aeiouy]+/g) || [];
    return count + Math.max(1, vowels.length);
  }, 0);

  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = Math.max(1, words.length);

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllables / wordCount;

  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  return {
    fleschKincaidGrade: Math.max(0, gradeLevel),
    avgSentenceLength: avgWordsPerSentence,
    wordCount,
    sentenceCount,
  };
}

// Audit content for accessibility
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
    const validatedData = AuditContentSchema.parse(body);

    const issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      wcagCriteria?: string;
      recommendation?: string;
    }> = [];

    const options = validatedData.options ?? {
      checkColors: true,
      checkReadability: true,
      checkStructure: true,
      targetLevel: 'AA' as const,
    };

    // Check readability
    if (options.checkReadability) {
      const readability = analyzeReadability(validatedData.content);

      if (readability.fleschKincaidGrade > 12) {
        issues.push({
          type: 'readability',
          severity: 'warning',
          message: `Content reading level (grade ${readability.fleschKincaidGrade.toFixed(1)}) may be too complex`,
          wcagCriteria: '3.1.5',
          recommendation: 'Consider simplifying language for broader accessibility',
        });
      }

      if (readability.avgSentenceLength > 25) {
        issues.push({
          type: 'readability',
          severity: 'info',
          message: `Average sentence length (${readability.avgSentenceLength.toFixed(1)} words) is high`,
          wcagCriteria: '3.1.5',
          recommendation: 'Break long sentences into shorter ones',
        });
      }
    }

    // Check structure (basic text checks)
    if (options.checkStructure) {
      // Check for missing alt text indicators in markdown/html
      const imgWithoutAlt = validatedData.content.match(/<img(?![^>]*alt=)[^>]*>/gi);
      if (imgWithoutAlt && imgWithoutAlt.length > 0) {
        issues.push({
          type: 'images',
          severity: 'error',
          message: `${imgWithoutAlt.length} image(s) missing alt text`,
          wcagCriteria: '1.1.1',
          recommendation: 'Add descriptive alt text to all images',
        });
      }

      // Check for heading structure in HTML
      if (validatedData.contentType === 'html') {
        const headings = validatedData.content.match(/<h[1-6][^>]*>/gi) || [];
        if (headings.length > 0) {
          const levels = headings.map((h) => parseInt(h.match(/h([1-6])/i)?.[1] || '0'));
          for (let i = 1; i < levels.length; i++) {
            if (levels[i] > levels[i - 1] + 1) {
              issues.push({
                type: 'structure',
                severity: 'warning',
                message: 'Heading levels skip (e.g., h2 to h4)',
                wcagCriteria: '1.3.1',
                recommendation: 'Use sequential heading levels',
              });
              break;
            }
          }
        }
      }

      // Check for link text
      const emptyLinks = validatedData.content.match(/<a[^>]*>\s*<\/a>/gi);
      if (emptyLinks && emptyLinks.length > 0) {
        issues.push({
          type: 'links',
          severity: 'error',
          message: `${emptyLinks.length} link(s) have no text content`,
          wcagCriteria: '2.4.4',
          recommendation: 'Add descriptive text to all links',
        });
      }

      // Check for generic link text
      const genericLinkText = validatedData.content.match(/>click here<|>read more<|>learn more</gi);
      if (genericLinkText && genericLinkText.length > 0) {
        issues.push({
          type: 'links',
          severity: 'warning',
          message: 'Generic link text detected',
          wcagCriteria: '2.4.4',
          recommendation: 'Use descriptive link text that indicates destination',
        });
      }
    }

    // Calculate score
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

    return NextResponse.json({
      success: true,
      data: {
        score,
        level: options.targetLevel,
        passed: errorCount === 0,
        summary: {
          errors: errorCount,
          warnings: warningCount,
          info: issues.filter((i) => i.severity === 'info').length,
        },
        issues,
        recommendations:
          errorCount > 0
            ? ['Fix all errors before publishing content']
            : warningCount > 0
              ? ['Consider addressing warnings for improved accessibility']
              : ['Content meets basic accessibility requirements'],
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        wcagVersion: '2.1',
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

    console.error('[ACCESSIBILITY_AUDIT]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to audit content' } },
      { status: 500 }
    );
  }
}

// Get user's accessibility accommodations
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
    const examId = searchParams.get('examId');

    const accommodations = await db.accessibilityAccommodation.findMany({
      where: {
        userId: user.id,
        ...(examId && { examId }),
        isActive: true,
      },
    });

    // Calculate time extension if exam specified
    let timeExtension = null;
    if (examId) {
      const exam = await db.exam.findUnique({
        where: { id: examId },
        select: { timeLimit: true },
      });

      if (exam?.timeLimit) {
        // Find time accommodation
        const timeAccom = accommodations.find((a) => a.timeMultiplier > 1);
        if (timeAccom) {
          const baseTime = exam.timeLimit;
          const extendedTime = Math.ceil(baseTime * timeAccom.timeMultiplier);
          const breakTime = timeAccom.breakInterval
            ? Math.floor(extendedTime / timeAccom.breakInterval) * (timeAccom.breakDuration || 0)
            : 0;

          timeExtension = {
            baseTime,
            extendedTime,
            breakTime,
            totalTime: extendedTime + breakTime,
            multiplier: timeAccom.timeMultiplier,
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        accommodations: accommodations.map((a) => ({
          id: a.id,
          timeMultiplier: a.timeMultiplier,
          breakInterval: a.breakInterval,
          breakDuration: a.breakDuration,
          display: {
            fontSize: a.fontSize,
            highContrast: a.highContrast,
            colorBlindMode: a.colorBlindMode,
          },
          input: {
            screenReader: a.screenReader,
            keyboardOnly: a.keyboardOnly,
          },
          content: {
            textToSpeech: a.textToSpeech,
            signLanguage: a.signLanguage,
            brailleFormat: a.brailleFormat,
          },
          approvedAt: a.approvedAt,
          expiresAt: a.expiresAt,
        })),
        timeExtension,
      },
    });
  } catch (error) {
    console.error('[ACCESSIBILITY_GET]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch accommodations' } },
      { status: 500 }
    );
  }
}
