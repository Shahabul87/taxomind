import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createEvaluationEngine } from '@sam-ai/educational';
import { getUserScopedSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

/**
 * Submit Self-Assessment Attempt API
 *
 * POST /api/self-assessment/exams/[examId]/attempts/[attemptId]/submit
 * Submits the attempt for grading
 */

// Validation schema
const SubmitAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string().nullable(),
    })
  ),
  timeSpent: z.number().int().min(0),
});

interface RouteParams {
  params: Promise<{ examId: string; attemptId: string }>;
}

// Create user-scoped evaluation engine
async function createEvalEngine(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createEvaluationEngine({
    samConfig,
    database: getDatabaseAdapter(),
  });
}

/**
 * POST - Submit attempt for grading
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();
    const { examId, attemptId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const evalEngine = await createEvalEngine(user.id);

    const attempt = await db.selfAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (attempt.examId !== examId) {
      return NextResponse.json({ error: 'Attempt does not match exam' }, { status: 400 });
    }

    if (attempt.status === 'GRADED' || attempt.status === 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Attempt already submitted' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = SubmitAttemptSchema.parse(body);

    // Create a map of questions for quick lookup
    const questionsMap = new Map(
      attempt.exam.questions.map((q) => [q.id, q])
    );

    // Process and grade each answer
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;

    // Bloom's level tracking
    const bloomsPerformance: Record<
      string,
      { total: number; correct: number; points: number; earned: number }
    > = {
      REMEMBER: { total: 0, correct: 0, points: 0, earned: 0 },
      UNDERSTAND: { total: 0, correct: 0, points: 0, earned: 0 },
      APPLY: { total: 0, correct: 0, points: 0, earned: 0 },
      ANALYZE: { total: 0, correct: 0, points: 0, earned: 0 },
      EVALUATE: { total: 0, correct: 0, points: 0, earned: 0 },
      CREATE: { total: 0, correct: 0, points: 0, earned: 0 },
    };

    const gradedAnswers: Array<{
      questionId: string;
      answer: string | null;
      isCorrect: boolean;
      pointsEarned: number;
      feedback: string | null;
      aiEvaluation: Record<string, unknown> | null;
      demonstratedLevel: string | null;
    }> = [];

    for (const answerData of data.answers) {
      const question = questionsMap.get(answerData.questionId);
      if (!question) continue;

      totalPoints += question.points;
      bloomsPerformance[question.bloomsLevel].total += 1;
      bloomsPerformance[question.bloomsLevel].points += question.points;

      let isCorrect = false;
      let pointsEarned = 0;
      let feedback: string | null = null;
      let aiEvaluation: Record<string, unknown> | null = null;
      let demonstratedLevel: string | null = null;

      if (answerData.answer === null || answerData.answer.trim() === '') {
        // No answer provided
        feedback = 'No answer provided.';
      } else if (
        question.questionType === 'MULTIPLE_CHOICE' ||
        question.questionType === 'TRUE_FALSE'
      ) {
        // Auto-grade MCQ and True/False
        const correctAnswer = question.correctAnswer?.toLowerCase().trim();
        const userAnswer = answerData.answer.toLowerCase().trim();
        isCorrect = userAnswer === correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect
          ? 'Correct!'
          : `Incorrect. The correct answer is: ${question.correctAnswer}`;
        demonstratedLevel = question.bloomsLevel;
      } else if (
        question.questionType === 'FILL_IN_BLANK'
      ) {
        // Auto-grade fill in blank with acceptable variations
        const correctAnswer = question.correctAnswer?.toLowerCase().trim();
        const userAnswer = answerData.answer.toLowerCase().trim();
        const variations =
          (question.acceptableVariations as string[] | null) ?? [];
        const allAcceptable = [
          correctAnswer,
          ...variations.map((v: string) => v.toLowerCase().trim()),
        ];
        isCorrect = allAcceptable.includes(userAnswer);
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect
          ? 'Correct!'
          : `Incorrect. The correct answer is: ${question.correctAnswer}`;
        demonstratedLevel = question.bloomsLevel;
      } else {
        // SHORT_ANSWER or ESSAY - Use AI evaluation
        try {
          const engine = evalEngine;
          const evaluation = await withRetryableTimeout(
            () => engine.evaluateAnswer(answerData.answer ?? '', {
              questionText: question.question,
              questionType: question.questionType,
              expectedAnswer: question.correctAnswer,
              bloomsLevel: question.bloomsLevel,
              maxPoints: question.points,
            }),
            TIMEOUT_DEFAULTS.AI_ANALYSIS,
            'evaluateAnswer'
          );

          isCorrect = (evaluation.score ?? 0) >= question.points * 0.7;
          pointsEarned = evaluation.score ?? 0;
          feedback = evaluation.feedback;
          aiEvaluation = {
            accuracy: evaluation.accuracy,
            completeness: evaluation.completeness,
            relevance: evaluation.relevance,
            depth: evaluation.depth,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            conceptsUnderstood: evaluation.nextSteps,
            misconceptions: evaluation.misconceptions,
            knowledgeGaps: evaluation.improvements,
          };
          demonstratedLevel = evaluation.demonstratedBloomsLevel ?? question.bloomsLevel;
        } catch (aiError) {
          // Fallback to simple comparison if AI fails
          logger.error('AI evaluation failed, using fallback:', aiError);
          const similarity = calculateSimilarity(
            answerData.answer,
            question.correctAnswer
          );
          isCorrect = similarity >= 0.7;
          pointsEarned = isCorrect ? question.points : question.points * similarity;
          feedback = isCorrect
            ? 'Your answer appears to be correct.'
            : 'Your answer needs improvement. Review the correct answer.';
          demonstratedLevel = question.bloomsLevel;
        }
      }

      earnedPoints += pointsEarned;
      if (isCorrect) {
        correctCount++;
        bloomsPerformance[question.bloomsLevel].correct += 1;
      }
      bloomsPerformance[question.bloomsLevel].earned += pointsEarned;

      gradedAnswers.push({
        questionId: answerData.questionId,
        answer: answerData.answer,
        isCorrect,
        pointsEarned,
        feedback,
        aiEvaluation,
        demonstratedLevel,
      });
    }

    // Calculate score percentage
    const scorePercentage =
      totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = scorePercentage >= attempt.exam.passingScore;

    // Format Bloom's breakdown
    const bloomsBreakdown: Record<
      string,
      { questionsCount: number; correctCount: number; scorePercentage: number }
    > = {};
    Object.entries(bloomsPerformance).forEach(([level, data]) => {
      if (data.total > 0) {
        bloomsBreakdown[level] = {
          questionsCount: data.total,
          correctCount: data.correct,
          scorePercentage: Math.round((data.correct / data.total) * 100),
        };
      }
    });

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    Object.entries(bloomsBreakdown).forEach(([level, data]) => {
      if (data.scorePercentage >= 80) {
        strengths.push(level);
      } else if (data.scorePercentage < 60 && data.questionsCount > 0) {
        weaknesses.push(level);
      }
    });

    // Create cognitive profile
    const cognitiveProfile = {
      overallMastery: Math.round(scorePercentage),
      strengths,
      weaknesses,
      recommendedFocus: weaknesses.slice(0, 3),
    };

    // Generate learning recommendations
    const learningRecommendations = weaknesses.map((level) => ({
      type: 'practice' as const,
      title: `Practice ${level.toLowerCase()} skills`,
      description: `Focus on questions that test ${level.toLowerCase()} cognitive skills to improve your understanding.`,
      priority: 'HIGH' as const,
      bloomsLevel: level,
    }));

    // Save graded answers
    for (const graded of gradedAnswers) {
      await db.selfAssessmentAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId: graded.questionId,
          },
        },
        create: {
          attemptId,
          questionId: graded.questionId,
          answer: graded.answer,
          isCorrect: graded.isCorrect,
          pointsEarned: graded.pointsEarned,
          feedback: graded.feedback,
          aiEvaluation: graded.aiEvaluation ?? undefined,
          demonstratedLevel: graded.demonstratedLevel as
            | 'REMEMBER'
            | 'UNDERSTAND'
            | 'APPLY'
            | 'ANALYZE'
            | 'EVALUATE'
            | 'CREATE'
            | null,
          answeredAt: new Date(),
          evaluatedAt: new Date(),
        },
        update: {
          answer: graded.answer,
          isCorrect: graded.isCorrect,
          pointsEarned: graded.pointsEarned,
          feedback: graded.feedback,
          aiEvaluation: graded.aiEvaluation ?? undefined,
          demonstratedLevel: graded.demonstratedLevel as
            | 'REMEMBER'
            | 'UNDERSTAND'
            | 'APPLY'
            | 'ANALYZE'
            | 'EVALUATE'
            | 'CREATE'
            | null,
          evaluatedAt: new Date(),
        },
      });
    }

    // Update attempt
    await db.selfAssessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'GRADED',
        submittedAt: new Date(),
        timeSpent: data.timeSpent,
        correctAnswers: correctCount,
        earnedPoints,
        scorePercentage: Math.round(scorePercentage * 100) / 100,
        isPassed,
        bloomsBreakdown,
        cognitiveProfile,
        learningRecommendations,
      },
    });

    // Update exam stats
    const allAttempts = await db.selfAssessmentAttempt.findMany({
      where: { examId, status: 'GRADED' },
      select: { scorePercentage: true },
      take: 100,
    });

    const avgScore =
      allAttempts.reduce((sum, a) => sum + (a.scorePercentage ?? 0), 0) /
      allAttempts.length;

    await db.selfAssessmentExam.update({
      where: { id: examId },
      data: {
        avgScore: Math.round(avgScore * 100) / 100,
        totalAttempts: allAttempts.length,
      },
    });

    // Update question stats
    for (const graded of gradedAnswers) {
      await db.selfAssessmentQuestion.update({
        where: { id: graded.questionId },
        data: {
          totalAttempts: { increment: 1 },
          correctAttempts: graded.isCorrect ? { increment: 1 } : undefined,
        },
      });
    }

    getAchievementEngine()
      .then((engine) => engine.trackProgress(
        user.id,
        'form_completed',
        { examId, scorePercentage },
        { courseId: attempt.exam.courseId ?? undefined }
      ))
      .catch((err) => {
        logger.warn('[Self Assessment] Achievement tracking failed', { error: err });
      });

    return NextResponse.json({
      success: true,
      result: {
        attemptId,
        status: 'GRADED',
        scorePercentage: Math.round(scorePercentage * 100) / 100,
        isPassed,
        passingScore: attempt.exam.passingScore,
        totalQuestions: attempt.exam.questions.length,
        correctAnswers: correctCount,
        totalPoints,
        earnedPoints: Math.round(earnedPoints * 100) / 100,
        timeSpent: data.timeSpent,
        bloomsBreakdown,
        cognitiveProfile,
        learningRecommendations,
      },
      message: isPassed
        ? 'Congratulations! You passed the assessment!'
        : 'Assessment completed. Review your results for improvement areas.',
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Attempt submission timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { error: 'Operation timed out. Please try again.' },
        { status: 504 }
      );
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Error submitting attempt:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit attempt' },
      { status: 500 }
    );
  }
}

/**
 * Simple string similarity calculation (Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}
