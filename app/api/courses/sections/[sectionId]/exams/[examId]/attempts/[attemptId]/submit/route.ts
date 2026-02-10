import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { QueryPerformanceMonitor } from "@/lib/database/query-optimizer";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { recordExamProgress } from '@/lib/sam/progress-recorder';
import { createEvaluationEngine, createUnifiedBloomsEngine } from '@sam-ai/educational';
import type { EvaluationContext } from '@sam-ai/educational';
import { getUserScopedSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { wrapEvaluationWithSafety } from '@sam-ai/safety';
import { BloomsLevel, EvaluationType } from '@prisma/client';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

// Force Node.js runtime
export const runtime = 'nodejs';

// Per-request engine factories (user-scoped AI provider)
async function createEvalEngine(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createEvaluationEngine({
    samConfig,
    database: getDatabaseAdapter(),
  });
}

async function createBloomsEngine(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createUnifiedBloomsEngine({
    samConfig,
    database: getDatabaseAdapter(),
    defaultMode: 'standard',
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600,
  });
}

// Subjective question types that require AI evaluation
const SUBJECTIVE_QUESTION_TYPES = ['ESSAY', 'SHORT_ANSWER', 'FILL_IN_BLANK'];

// Validation schema for exam submission
const SubmissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.any(),
  })),
  timeSpent: z.number(),
});

// POST endpoint to submit an exam attempt
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ sectionId: string; examId: string; attemptId: string }> }
) {
  const params = await props.params;
  const rateLimitResponse = await withRateLimit(req, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  const endTimer = QueryPerformanceMonitor.startQuery("exam:submit");

  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Create user-scoped AI engines
    const userEvalEngine = await createEvalEngine(user.id);
    const userBloomsEngine = await createBloomsEngine(user.id);

    // Parse and validate request body
    const body = await req.json();
    const parseResult = SubmissionSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid submission format', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { answers, timeSpent } = parseResult.data;

    // Optimized: Fetch the attempt with exam, questions (both basic and enhanced), and section
    const attempt = await db.userExamAttempt.findUnique({
      where: {
        id: params.attemptId,
        userId: user.id,
        examId: params.examId,
      },
      include: {
        Exam: {
          include: {
            ExamQuestion: {
              orderBy: {
                order: 'asc'
              }
            },
            enhancedQuestions: {
              orderBy: {
                order: 'asc'
              }
            },
            section: {
              select: {
                id: true,
                chapterId: true,
                learningObjectiveItems: true,
                chapter: {
                  select: {
                    courseId: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Exam attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.submittedAt) {
      return NextResponse.json(
        { error: 'This exam has already been submitted' },
        { status: 400 }
      );
    }

    // Check if we have enhanced questions for AI evaluation
    const hasEnhancedQuestions = attempt.Exam.enhancedQuestions.length > 0;
    const learningObjectives = attempt.Exam.section?.learningObjectiveItems ?? [];

    // Create a map of enhanced questions by their content for matching
    const enhancedQuestionMap = new Map(
      attempt.Exam.enhancedQuestions.map(q => [q.question.toLowerCase().trim(), q])
    );

    // Grade the exam
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    // Track AI evaluations for enhanced answers
    interface AIEvaluationData {
      answerId: string;
      questionId: string;
      score: number;
      maxScore: number;
      accuracy: number;
      completeness: number;
      relevance: number;
      depth: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
      nextSteps: string[];
      targetBloomsLevel: BloomsLevel;
      demonstratedLevel: BloomsLevel;
      conceptsUnderstood: string[];
      misconceptions: string[];
      knowledgeGaps: string[];
      evaluationModel: string;
      confidence: number;
    }

    const aiEvaluations: AIEvaluationData[] = [];
    const enhancedAnswerData: Array<{
      id: string;
      attemptId: string;
      questionId: string;
      answer: string;
      isCorrect: boolean | null;
      pointsEarned: number;
      evaluationType: EvaluationType;
    }> = [];

    // Process each question
    const answerData: Array<{
      id: string;
      attemptId: string;
      questionId: string;
      answer: unknown;
      isCorrect: boolean;
      pointsEarned: number;
      timeSpent: number;
      updatedAt: Date;
    }> = [];

    for (const question of attempt.Exam.ExamQuestion) {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const answerText = userAnswer?.answer;
      const isSubjective = SUBJECTIVE_QUESTION_TYPES.includes(question.questionType);

      // Find matching enhanced question if available
      const enhancedQuestion = hasEnhancedQuestions
        ? enhancedQuestionMap.get(question.question.toLowerCase().trim())
        : null;

      let isCorrect: boolean;
      let pointsEarned: number;
      let evaluationType: EvaluationType = 'AUTO_GRADED';

      // For subjective questions with enhanced questions, use AI evaluation
      if (isSubjective && enhancedQuestion && answerText) {
        try {
          const evalResult = await withRetryableTimeout(
            () => evaluateSubjectiveAnswer(
              enhancedQuestion,
              String(answerText),
              learningObjectives,
              userEvalEngine
            ),
            TIMEOUT_DEFAULTS.AI_ANALYSIS,
            'examSubmit-evaluateAnswer'
          );

          isCorrect = evalResult.isCorrect;
          pointsEarned = evalResult.pointsEarned;
          evaluationType = 'AI_EVALUATED';

          // Store AI evaluation data for later
          const answerId = crypto.randomUUID();
          aiEvaluations.push({
            answerId,
            questionId: enhancedQuestion.id,
            score: evalResult.score,
            maxScore: evalResult.maxScore,
            accuracy: evalResult.accuracy,
            completeness: evalResult.completeness,
            relevance: evalResult.relevance,
            depth: evalResult.depth,
            feedback: evalResult.feedback,
            strengths: evalResult.strengths,
            improvements: evalResult.improvements,
            nextSteps: evalResult.nextSteps,
            targetBloomsLevel: enhancedQuestion.bloomsLevel,
            demonstratedLevel: evalResult.demonstratedLevel || enhancedQuestion.bloomsLevel,
            conceptsUnderstood: evalResult.conceptsUnderstood,
            misconceptions: evalResult.misconceptions,
            knowledgeGaps: evalResult.knowledgeGaps,
            evaluationModel: 'sam-ai/educational',
            confidence: evalResult.confidence,
          });

          enhancedAnswerData.push({
            id: answerId,
            attemptId: params.attemptId,
            questionId: enhancedQuestion.id,
            answer: String(answerText),
            isCorrect,
            pointsEarned,
            evaluationType,
          });
        } catch (evalError) {
          // Fallback to basic grading if AI evaluation fails
          logger.warn('[Exam Submit] AI evaluation failed, using basic grading', {
            questionId: question.id,
            error: evalError instanceof Error ? evalError.message : 'Unknown error'
          });
          isCorrect = checkAnswer(question, answerText);
          pointsEarned = isCorrect ? question.points : 0;
        }
      } else {
        // Use basic grading for objective questions or when no enhanced question
        isCorrect = checkAnswer(question, answerText);
        pointsEarned = isCorrect ? question.points : 0;
      }

      totalPoints += question.points;
      earnedPoints += pointsEarned;
      if (isCorrect) correctAnswers++;

      answerData.push({
        id: crypto.randomUUID(),
        attemptId: params.attemptId,
        questionId: question.id,
        answer: answerText ?? null,
        isCorrect,
        pointsEarned,
        timeSpent: 0,
        updatedAt: new Date(),
      });
    }

    // Calculate score
    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = scorePercentage >= attempt.Exam.passingScore;

    // Use transaction for batch operations
    const result = await db.$transaction(async (tx) => {
      // Batch insert all basic answers
      await tx.userAnswer.createMany({
        data: answerData,
      });

      // Insert enhanced answers if we have any
      if (enhancedAnswerData.length > 0) {
        await tx.enhancedAnswer.createMany({
          data: enhancedAnswerData,
        });
      }

      // Insert AI evaluation records
      for (const evalData of aiEvaluations) {
        await tx.aIEvaluationRecord.create({
          data: {
            answerId: evalData.answerId,
            questionId: evalData.questionId,
            score: evalData.score,
            maxScore: evalData.maxScore,
            targetBloomsLevel: evalData.targetBloomsLevel,
            demonstratedLevel: evalData.demonstratedLevel,
            accuracy: evalData.accuracy,
            completeness: evalData.completeness,
            relevance: evalData.relevance,
            depth: evalData.depth,
            conceptsUnderstood: evalData.conceptsUnderstood,
            misconceptions: evalData.misconceptions,
            knowledgeGaps: evalData.knowledgeGaps,
            feedback: evalData.feedback,
            strengths: evalData.strengths,
            improvements: evalData.improvements,
            nextSteps: evalData.nextSteps,
            evaluationModel: evalData.evaluationModel,
            confidence: evalData.confidence,
            flaggedForReview: evalData.confidence < 0.7,
            enhancedQuestionId: evalData.questionId,
          },
        });
      }

      // Update the attempt
      return await tx.userExamAttempt.update({
        where: {
          id: params.attemptId,
        },
        data: {
          submittedAt: new Date(),
          timeSpent,
          scorePercentage,
          isPassed,
          correctAnswers,
          totalQuestions: attempt.Exam.ExamQuestion.length,
          status: aiEvaluations.length > 0 ? 'GRADED' : 'SUBMITTED',
        }
      });
    });

    // Record Bloom's Taxonomy progress from exam questions
    // This is done outside the transaction to not block the main submission flow
    const courseId = attempt.Exam.section?.chapter?.courseId;
    const sectionId = attempt.Exam.section?.id ?? params.sectionId;

    if (courseId) {
      // Prepare question data with Bloom's levels for progress tracking
      const questionsWithBlooms = attempt.Exam.ExamQuestion.map((question) => {
        const answerResult = answerData.find(a => a.questionId === question.id);
        return {
          questionId: question.id,
          bloomsLevel: question.bloomsLevel,
          isCorrect: answerResult?.isCorrect ?? false,
          responseTimeMs: undefined, // Could be calculated per question if tracked
        };
      });

      // Record progress asynchronously (don't block response)
      recordExamProgress({
        userId: user.id,
        courseId,
        sectionId,
        questions: questionsWithBlooms,
      }).catch((err) => {
        // Log error but don't fail the submission
        logger.error('[Exam Submit] Failed to record Bloom\'s progress:', err);
      });
    }

    // Update Bloom's cognitive progress for AI-evaluated questions
    if (aiEvaluations.length > 0) {
      try {
        const blooms = userBloomsEngine;
        for (const evalData of aiEvaluations) {
          await blooms.updateCognitiveProgress(
            user.id,
            attempt.Exam.sectionId,
            evalData.targetBloomsLevel,
            (evalData.score / evalData.maxScore) * 100
          );
        }
        logger.info('[Exam Submit] Updated Bloom\'s progress for AI evaluations', {
          userId: user.id,
          evaluationCount: aiEvaluations.length,
        });
      } catch (bloomsError) {
        logger.warn('[Exam Submit] Failed to update Bloom\'s progress', {
          error: bloomsError instanceof Error ? bloomsError.message : 'Unknown error'
        });
      }
    }

    getAchievementEngine()
      .then((engine) => engine.trackProgress(
        user.id,
        'form_completed',
        { examId: params.examId, scorePercentage },
        { courseId, chapterId: attempt.Exam.section?.chapterId, sectionId: params.sectionId }
      ))
      .catch((err) => {
        logger.warn('[Exam Submit] Achievement tracking failed', { error: err });
      });

    return NextResponse.json({
      success: true,
      attempt: result,
      summary: {
        scorePercentage,
        isPassed,
        correctAnswers,
        totalQuestions: attempt.Exam.ExamQuestion.length,
        earnedPoints,
        totalPoints,
        timeSpent,
      },
      aiEvaluation: aiEvaluations.length > 0 ? {
        evaluatedCount: aiEvaluations.length,
        hasDetailedFeedback: true,
        resultsEndpoint: `/api/exams/results/${params.attemptId}`,
      } : null,
    });

  } catch (error: any) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Exam submission timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Exam submission error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  } finally {
    endTimer();
  }
}

// Helper function to check if an answer is correct (for objective questions)
function checkAnswer(question: { questionType: string; correctAnswer: unknown }, userAnswer: unknown): boolean {
  if (!userAnswer && userAnswer !== false && userAnswer !== 0) {
    return false; // No answer provided
  }

  const { correctAnswer } = question;

  switch (question.questionType) {
    case 'MULTIPLE_CHOICE':
      return String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();

    case 'TRUE_FALSE':
      return Boolean(userAnswer) === Boolean(correctAnswer);

    case 'SHORT_ANSWER':
    case 'FILL_IN_BLANK':
      // For short answers, we do a case-insensitive comparison
      // In a real system, you might want more sophisticated matching
      return String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();

    case 'ESSAY':
      // Essays typically require manual grading
      // For now, we'll mark them as correct if any answer is provided
      return Boolean(userAnswer && String(userAnswer).trim().length > 0);

    default:
      return false;
  }
}

// Interface for enhanced question from Prisma
interface EnhancedQuestionData {
  id: string;
  question: string;
  questionType: string;
  points: number;
  correctAnswer: string;
  acceptableVariations?: unknown;
  rubric?: unknown;
  bloomsLevel: BloomsLevel;
  hint?: string | null;
  explanation: string;
  relatedConcepts?: string[];
  learningObjectiveId?: string | null;
}

// Interface for learning objective item
interface LearningObjectiveItem {
  id: string;
  objective: string;
}

// Interface for AI evaluation result
interface SubjectiveEvaluationResult {
  isCorrect: boolean;
  pointsEarned: number;
  score: number;
  maxScore: number;
  accuracy: number;
  completeness: number;
  relevance: number;
  depth: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  demonstratedLevel: BloomsLevel | null;
  conceptsUnderstood: string[];
  misconceptions: string[];
  knowledgeGaps: string[];
  confidence: number;
}

// Helper function to evaluate subjective answers using AI
async function evaluateSubjectiveAnswer(
  question: EnhancedQuestionData,
  studentAnswer: string,
  learningObjectives: LearningObjectiveItem[],
  evalEngine: ReturnType<typeof createEvaluationEngine>
): Promise<SubjectiveEvaluationResult> {
  // Build evaluation context
  const context: EvaluationContext = {
    questionText: question.question,
    questionType: question.questionType === 'ESSAY' ? 'ESSAY' : 'SHORT_ANSWER',
    expectedAnswer: question.correctAnswer,
    acceptableVariations: question.acceptableVariations
      ? JSON.parse(JSON.stringify(question.acceptableVariations))
      : [],
    rubric: question.rubric
      ? JSON.parse(JSON.stringify(question.rubric))
      : undefined,
    bloomsLevel: question.bloomsLevel,
    maxPoints: question.points,
    learningObjective: getLearningObjective(question, learningObjectives),
    relatedConcepts: question.relatedConcepts ?? [],
  };

  // Get evaluation from AI engine
  const evaluation = await evalEngine.evaluateAnswer(studentAnswer, context);

  // Wrap with safety validation
  const safeEvaluation = await wrapEvaluationWithSafety(
    {
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      accuracy: evaluation.accuracy,
      completeness: evaluation.completeness,
      relevance: evaluation.relevance,
      depth: evaluation.depth,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      nextSteps: evaluation.nextSteps,
      demonstratedBloomsLevel: evaluation.demonstratedBloomsLevel,
      misconceptions: evaluation.misconceptions,
    },
    question.id
  );

  // Determine if answer is correct based on score threshold (60%)
  const isCorrect = safeEvaluation.score >= safeEvaluation.maxScore * 0.6;
  const pointsEarned = Math.round((safeEvaluation.score / safeEvaluation.maxScore) * question.points);

  return {
    isCorrect,
    pointsEarned,
    score: safeEvaluation.score,
    maxScore: safeEvaluation.maxScore,
    accuracy: safeEvaluation.accuracy ?? 0,
    completeness: safeEvaluation.completeness ?? 0,
    relevance: safeEvaluation.relevance ?? 0,
    depth: safeEvaluation.depth ?? 0,
    feedback: safeEvaluation.feedback,
    strengths: safeEvaluation.strengths ?? [],
    improvements: safeEvaluation.improvements ?? [],
    nextSteps: safeEvaluation.nextSteps ?? [],
    demonstratedLevel: (evaluation.demonstratedBloomsLevel as BloomsLevel) ?? null,
    conceptsUnderstood: evaluation.conceptsUnderstood ?? [],
    misconceptions: evaluation.misconceptions ?? [],
    knowledgeGaps: evaluation.knowledgeGaps ?? [],
    confidence: safeEvaluation.safetyValidation?.score ?? 0.8,
  };
}

// Helper to get learning objective for a question
function getLearningObjective(
  question: EnhancedQuestionData,
  objectives: LearningObjectiveItem[]
): string | undefined {
  if (question.learningObjectiveId) {
    const obj = objectives.find((o) => o.id === question.learningObjectiveId);
    return obj?.objective;
  }
  return objectives[0]?.objective;
}
