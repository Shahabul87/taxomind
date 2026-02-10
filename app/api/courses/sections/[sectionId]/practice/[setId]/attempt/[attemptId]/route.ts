import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/courses/sections/[sectionId]/practice/[setId]/attempt/[attemptId]
 * Get full attempt results including correct answers, explanations, AI feedback
 */
export async function GET(
  req: NextRequest,
  props: {
    params: Promise<{ sectionId: string; setId: string; attemptId: string }>;
  }
) {
  const params = await props.params;

  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const attempt = await db.userPracticeAttempt.findUnique({
      where: {
        id: params.attemptId,
        userId: user.id,
        setId: params.setId,
      },
      include: {
        set: {
          select: {
            id: true,
            title: true,
            topic: true,
            difficulty: true,
            bloomsLevel: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
          orderBy: { question: { order: "asc" } },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: { message: "Attempt not found" } },
        { status: 404 }
      );
    }

    // For IN_PROGRESS attempts, don't reveal answers
    if (attempt.status === "IN_PROGRESS") {
      return NextResponse.json({
        success: true,
        data: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          startedAt: attempt.startedAt,
          totalQuestions: attempt.totalQuestions,
          totalPoints: attempt.totalPoints,
          set: attempt.set,
          answers: [],
        },
      });
    }

    const results = attempt.answers.map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      question: answer.question.question,
      questionType: answer.question.questionType,
      answer: answer.answer,
      correctAnswer: answer.question.correctAnswer,
      explanation: answer.question.explanation,
      isCorrect: answer.isCorrect,
      pointsEarned: answer.pointsEarned,
      evaluationType: answer.evaluationType,
      aiFeedback: answer.aiFeedback,
      aiScore: answer.aiScore,
      targetBloomsLevel: answer.targetBloomsLevel,
      demonstratedLevel: answer.demonstratedLevel,
      misconceptions: answer.misconceptions,
      knowledgeGaps: answer.knowledgeGaps,
      hintsUsed: answer.hintsUsed,
      options: answer.question.options,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        scorePercentage: attempt.scorePercentage,
        earnedPoints: attempt.earnedPoints,
        totalPoints: attempt.totalPoints,
        timeSpent: attempt.timeSpent,
        bloomsPerformance: attempt.bloomsPerformance,
        weakAreas: attempt.weakAreas,
        strongAreas: attempt.strongAreas,
        recommendations: attempt.recommendations,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        set: attempt.set,
        answers: results,
      },
    });
  } catch (error) {
    logger.error("[Practice] Get results error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch attempt results" } },
      { status: 500 }
    );
  }
}
