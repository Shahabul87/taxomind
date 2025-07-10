import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { QueryPerformanceMonitor } from "@/lib/database/query-optimizer";

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

    // Optimized: Fetch the attempt with exam and questions in one query
    const attempt = await db.examAttempt.findUnique({
      where: {
        id: params.attemptId,
        userId: user.id,
        examId: params.examId,
      },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: {
                position: 'asc'
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

    if (attempt.completedAt) {
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
    const answerData = attempt.exam.questions.map((question) => {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const isCorrect = checkAnswer(question, userAnswer?.answer);
      const pointsEarned = isCorrect ? question.points : 0;
      
      totalPoints += question.points;
      earnedPoints += pointsEarned;
      if (isCorrect) correctAnswers++;

      return {
        attemptId: params.attemptId,
        questionId: question.id,
        userAnswer: userAnswer?.answer || null,
        isCorrect,
        pointsEarned,
        timeSpent: 0, // Could be calculated per question if needed
      };
    });

    // Calculate score
    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = scorePercentage >= attempt.exam.passingScore;

    // Optimized: Use transaction for batch operations
    const result = await db.$transaction(async (tx) => {
      // Batch insert all answers
      await tx.questionAttempt.createMany({
        data: answerData,
      });

      // Update the attempt
      const updatedAttempt = await tx.examAttempt.update({
        where: {
          id: params.attemptId,
        },
        data: {
          completedAt: new Date(),
          timeSpent,
          score: scorePercentage,
          passed: isPassed,
          correctAnswers,
          totalQuestions: attempt.exam.questions.length,
        }
      });

      return updatedAttempt;
    });

    return NextResponse.json({
      success: true,
      attempt: result,
      summary: {
        scorePercentage,
        isPassed,
        correctAnswers,
        totalQuestions: attempt.exam.questions.length,
        earnedPoints,
        totalPoints,
        timeSpent,
      }
    });

  } catch (error: any) {
    console.error('Exam submission error:', error);
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

  const correctAnswer = question.correctAnswer;

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