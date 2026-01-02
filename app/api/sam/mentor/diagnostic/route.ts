/**
 * SAM AI Mentor - Diagnostic Assessment API
 *
 * Generates and evaluates diagnostic assessments.
 * Note: Uses SAMInteraction for storage until dedicated models are added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { runSAMChat } from '@/lib/sam/ai-provider';

// Request validation schemas
const GenerateDiagnosticSchema = z.object({
  courseId: z.string().uuid(),
  topic: z.string().min(1).max(200).optional(),
  questionCount: z.number().min(3).max(20).optional().default(10),
  difficulty: z.enum(['adaptive', 'beginner', 'intermediate', 'advanced']).optional().default('adaptive'),
  bloomsLevels: z.array(z.string()).optional().default(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE']),
});

const SubmitDiagnosticSchema = z.object({
  diagnosticId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string(),
    timeSpentSeconds: z.number().min(0).optional(),
    confidence: z.number().min(0).max(1).optional(),
  })),
});

// Context type for diagnostic sessions stored in SAMInteraction
interface DiagnosticSessionContext {
  type: 'diagnostic_session';
  status: 'IN_PROGRESS' | 'COMPLETED';
  courseId: string;
  topic: string;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
    correctAnswer: string;
    bloomsLevel: string;
    topic: string;
    difficulty: string;
    misconceptionTarget?: string;
  }>;
  metadata: {
    estimatedTimeMinutes: number;
    topicsCovered: string[];
  };
  outcome?: {
    score: number;
    results: unknown[];
    topicScores: Record<string, unknown>;
    bloomsScores: Record<string, unknown>;
    weakTopics: unknown[];
    misconceptionsDetected: string[];
  };
  completedAt?: string;
}

/**
 * POST - Generate a diagnostic assessment
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

    const body = await request.json();
    const validatedData = GenerateDiagnosticSchema.parse(body);

    const { courseId, topic, questionCount, difficulty, bloomsLevels } = validatedData;

    // Get course data
    const course = await db.course.findFirst({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        chapters: {
          select: {
            id: true,
            title: true,
            sections: {
              select: {
                id: true,
                title: true,
                learningObjectives: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Build context for AI
    const courseContext = course.chapters.map(ch => ({
      chapter: ch.title,
      sections: ch.sections.map(s => ({
        title: s.title,
        objectives: s.learningObjectives?.split(',').map(o => o.trim()) || [],
        description: s.description,
      })),
    }));

    // Generate diagnostic questions using AI
    const diagnosticPrompt = `Generate a diagnostic assessment for the course: "${course.title}"
${topic ? `Focus topic: ${topic}` : 'Cover all major topics'}

Course structure:
${JSON.stringify(courseContext, null, 2)}

Requirements:
- Generate ${questionCount} questions
- Cover Bloom's levels: ${bloomsLevels.join(', ')}
- Difficulty: ${difficulty === 'adaptive' ? 'Mix of difficulties to identify gaps' : difficulty}
- Include questions that can identify common misconceptions

Return valid JSON only:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "B",
      "bloomsLevel": "UNDERSTAND",
      "topic": "Topic name",
      "difficulty": "intermediate",
      "misconceptionTarget": "Common misconception this tests"
    }
  ],
  "metadata": {
    "estimatedTimeMinutes": 15,
    "topicsCovered": ["topic1", "topic2"]
  }
}`;

    const diagnosticResponse = await runSAMChat({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 6000,
      temperature: 0.6,
      systemPrompt: 'You are an expert educational assessment designer. Generate diagnostic assessments in valid JSON format only.',
      messages: [{ role: 'user', content: diagnosticPrompt }],
    });

    // Parse the generated diagnostic
    let diagnosticData: {
      questions: Array<{
        id: string;
        question: string;
        type: string;
        options?: string[];
        correctAnswer: string;
        bloomsLevel: string;
        topic: string;
        difficulty: string;
        misconceptionTarget?: string;
      }>;
      metadata: {
        estimatedTimeMinutes: number;
        topicsCovered: string[];
      };
    };

    try {
      const jsonMatch = diagnosticResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        diagnosticData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      logger.warn('[DIAGNOSTIC] Failed to parse AI-generated diagnostic');
      return NextResponse.json(
        { success: false, error: { code: 'GENERATION_ERROR', message: 'Failed to generate diagnostic assessment' } },
        { status: 500 }
      );
    }

    // Store as SAMInteraction with diagnostic context
    const sessionContext: DiagnosticSessionContext = {
      type: 'diagnostic_session',
      status: 'IN_PROGRESS',
      courseId: course.id,
      topic: topic || course.title,
      questions: diagnosticData.questions,
      metadata: diagnosticData.metadata,
    };

    const session = await db.sAMInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
        context: sessionContext as unknown as Record<string, unknown>,
        actionTaken: 'diagnostic_generated',
      },
    });

    // Remove correct answers from response
    const questionsForUser = diagnosticData.questions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      bloomsLevel: q.bloomsLevel,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    return NextResponse.json({
      success: true,
      data: {
        diagnosticId: session.id,
        courseId: course.id,
        courseTitle: course.title,
        topic: topic || 'Comprehensive',
        questions: questionsForUser,
        estimatedTimeMinutes: diagnosticData.metadata.estimatedTimeMinutes,
        topicsCovered: diagnosticData.metadata.topicsCovered,
        totalQuestions: diagnosticData.questions.length,
      },
    });

  } catch (error) {
    logger.error('[DIAGNOSTIC] Generate diagnostic error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate diagnostic assessment' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Submit diagnostic answers and get results
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = SubmitDiagnosticSchema.parse(body);

    const { diagnosticId, answers } = validatedData;

    // Get the diagnostic session
    const session = await db.sAMInteraction.findFirst({
      where: { id: diagnosticId, userId: user.id },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'DIAGNOSTIC_NOT_FOUND', message: 'Diagnostic session not found' } },
        { status: 404 }
      );
    }

    const sessionContext = session.context as unknown as DiagnosticSessionContext | null;
    if (!sessionContext || sessionContext.type !== 'diagnostic_session') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SESSION', message: 'Invalid diagnostic session' } },
        { status: 400 }
      );
    }

    const content = sessionContext;

    if (!content?.questions) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SESSION', message: 'Invalid diagnostic session data' } },
        { status: 400 }
      );
    }

    // Evaluate answers
    const results: Array<{
      questionId: string;
      correct: boolean;
      topic: string;
      bloomsLevel: string;
      misconceptionDetected?: string;
    }> = [];

    let correctCount = 0;
    const topicScores: Record<string, { correct: number; total: number }> = {};
    const bloomsScores: Record<string, { correct: number; total: number }> = {};
    const misconceptionsDetected: string[] = [];

    for (const answer of answers) {
      const question = content.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = answer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

      if (isCorrect) correctCount++;

      // Track topic scores
      if (!topicScores[question.topic]) {
        topicScores[question.topic] = { correct: 0, total: 0 };
      }
      topicScores[question.topic].total++;
      if (isCorrect) topicScores[question.topic].correct++;

      // Track Bloom's scores
      if (!bloomsScores[question.bloomsLevel]) {
        bloomsScores[question.bloomsLevel] = { correct: 0, total: 0 };
      }
      bloomsScores[question.bloomsLevel].total++;
      if (isCorrect) bloomsScores[question.bloomsLevel].correct++;

      // Track misconceptions
      if (!isCorrect && question.misconceptionTarget) {
        misconceptionsDetected.push(question.misconceptionTarget);
      }

      results.push({
        questionId: answer.questionId,
        correct: isCorrect,
        topic: question.topic,
        bloomsLevel: question.bloomsLevel,
        misconceptionDetected: !isCorrect ? question.misconceptionTarget : undefined,
      });

      // Log confidence for calibration if provided
      if (answer.confidence !== undefined) {
        const wasOverconfident = answer.confidence > 0.7 && !isCorrect;
        const wasUnderconfident = answer.confidence < 0.3 && isCorrect;

        await db.sAMInteraction.create({
          data: {
            userId: user.id,
            interactionType: 'ANALYTICS_VIEW',
            context: {
              type: 'confidence_log',
              questionId: answer.questionId,
              topicId: question.topic,
              confidence: answer.confidence,
              isCorrect,
              wasOverconfident,
              wasUnderconfident,
              timeSpent: answer.timeSpentSeconds || 0,
              diagnosticId,
              bloomsLevel: question.bloomsLevel,
            },
            actionTaken: 'confidence_logged',
          },
        });
      }
    }

    // Calculate overall score
    const overallScore = answers.length > 0 ? correctCount / answers.length : 0;

    // Identify weak areas (topics with < 60% score)
    const weakTopics = Object.entries(topicScores)
      .filter(([, scores]) => scores.total > 0 && (scores.correct / scores.total) < 0.6)
      .map(([topic, scores]) => ({
        topic,
        score: scores.correct / scores.total,
        questionsWrong: scores.total - scores.correct,
      }));

    // Store misconceptions as SAMInteraction
    for (const misconception of [...new Set(misconceptionsDetected)]) {
      await db.sAMInteraction.create({
        data: {
          userId: user.id,
          interactionType: 'ANALYTICS_VIEW',
          context: {
            type: 'misconception',
            topic: misconception,
            description: `Detected from diagnostic: ${misconception}`,
            severity: misconceptionsDetected.filter(m => m === misconception).length > 1 ? 'HIGH' : 'MEDIUM',
            status: 'DETECTED',
            diagnosticId,
            detectedAt: new Date().toISOString(),
            occurrences: misconceptionsDetected.filter(m => m === misconception).length,
          },
          actionTaken: 'misconception_detected',
        },
      });
    }

    // Store weak topics as review items
    for (const weak of weakTopics) {
      await db.sAMInteraction.create({
        data: {
          userId: user.id,
          interactionType: 'ANALYTICS_VIEW',
          context: {
            type: 'review_entry',
            topic: weak.topic,
            concept: `Weakness identified from diagnostic assessment`,
            priority: weak.score < 0.4 ? 'CRITICAL' : 'HIGH',
            masteryLevel: weak.score,
            diagnosticId,
          },
          actionTaken: 'review_queued',
        },
      });
    }

    // Update session as completed
    const updatedContext: DiagnosticSessionContext = {
      ...content,
      status: 'COMPLETED',
      outcome: {
        score: overallScore,
        results,
        topicScores,
        bloomsScores,
        weakTopics,
        misconceptionsDetected: [...new Set(misconceptionsDetected)],
      },
      completedAt: new Date().toISOString(),
    };

    await db.sAMInteraction.update({
      where: { id: diagnosticId },
      data: {
        context: updatedContext as unknown as Record<string, unknown>,
        actionTaken: 'diagnostic_completed',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        diagnosticId,
        overallScore,
        correctCount,
        totalQuestions: answers.length,
        topicScores: Object.fromEntries(
          Object.entries(topicScores).map(([topic, scores]) => [
            topic,
            { score: scores.total > 0 ? scores.correct / scores.total : 0, ...scores }
          ])
        ),
        bloomsScores: Object.fromEntries(
          Object.entries(bloomsScores).map(([level, scores]) => [
            level,
            { score: scores.total > 0 ? scores.correct / scores.total : 0, ...scores }
          ])
        ),
        weakTopics,
        misconceptionsDetected: [...new Set(misconceptionsDetected)],
        recommendations: {
          focusAreas: weakTopics.map(w => w.topic),
          reviewQueueUpdated: weakTopics.length,
          suggestedNextSteps: weakTopics.length > 0
            ? ['Review flagged topics', 'Complete remediation exercises', 'Schedule follow-up diagnostic']
            : ['Continue with current learning plan', 'Move to advanced topics'],
        },
      },
    });

  } catch (error) {
    logger.error('[DIAGNOSTIC] Submit diagnostic error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit diagnostic' } },
      { status: 500 }
    );
  }
}

/**
 * GET - Get diagnostic history
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
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get diagnostic sessions from SAMInteraction
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2, // Get more to filter
    });

    // Filter to only diagnostic sessions
    const diagnostics = interactions
      .filter(i => {
        const ctx = i.context as Record<string, unknown> | null;
        return ctx?.type === 'diagnostic_session' && ctx?.status === 'COMPLETED';
      })
      .slice(0, limit)
      .map(i => {
        const ctx = i.context as unknown as DiagnosticSessionContext;
        return {
          id: i.id,
          topic: ctx.topic,
          courseId: ctx.courseId,
          completedAt: ctx.completedAt,
          outcome: ctx.outcome,
        };
      });

    return NextResponse.json({
      success: true,
      data: diagnostics,
    });

  } catch (error) {
    logger.error('[DIAGNOSTIC] Get history error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get diagnostic history' } },
      { status: 500 }
    );
  }
}
