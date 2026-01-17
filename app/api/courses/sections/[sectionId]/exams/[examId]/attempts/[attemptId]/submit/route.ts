import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { QueryPerformanceMonitor } from "@/lib/database/query-optimizer";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { recordExamProgress } from '@/lib/sam/progress-recorder';

// Force Node.js runtime
export const runtime = 'nodejs';

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
  const endTimer = QueryPerformanceMonitor.startQuery("exam:submit");
  
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    // Optimized: Fetch the attempt with exam, questions, and section (for courseId) in one query
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
            Section: {
              select: {
                id: true,
                chapterId: true,
                Chapter: {
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

    // Grade the exam
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    // Optimized: Prepare all answer data for batch insert
    const answerData = attempt.Exam.ExamQuestion.map((question) => {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const isCorrect = checkAnswer(question, userAnswer?.answer);
      const pointsEarned = isCorrect ? question.points : 0;
      
      totalPoints += question.points;
      earnedPoints += pointsEarned;
      if (isCorrect) correctAnswers++;

      return {
        id: crypto.randomUUID(),
        attemptId: params.attemptId,
        questionId: question.id,
        answer: userAnswer?.answer || null,
        isCorrect,
        pointsEarned,
        timeSpent: 0, // Could be calculated per question if needed
        updatedAt: new Date(),
      };
    });

    // Calculate score
    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = scorePercentage >= attempt.Exam.passingScore;

    // Optimized: Use transaction for batch operations
    const result = await db.$transaction(async (tx) => {
      // Batch insert all answers
      await tx.userAnswer.createMany({
        data: answerData,
      });

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
        }
      });
    });

    // Record Bloom's Taxonomy progress from exam questions
    // This is done outside the transaction to not block the main submission flow
    const courseId = attempt.Exam.Section?.Chapter?.courseId;
    const sectionId = attempt.Exam.Section?.id ?? params.sectionId;

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
      }
    });

  } catch (error: any) {
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

// Helper function to check if an answer is correct
function checkAnswer(question: any, userAnswer: any): boolean {
  if (!userAnswer && userAnswer !== false && userAnswer !== 0) {
    return false; // No answer provided
  }

  const {correctAnswer} = question;

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