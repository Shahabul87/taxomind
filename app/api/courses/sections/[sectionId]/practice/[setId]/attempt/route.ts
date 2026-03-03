import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * POST /api/courses/sections/[sectionId]/practice/[setId]/attempt
 * Start a new practice attempt
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ sectionId: string; setId: string }> }
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

    // Verify set exists and belongs to user
    const set = await db.practiceProblemSet.findUnique({
      where: {
        id: params.setId,
        userId: user.id,
        sectionId: params.sectionId,
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        attempts: {
          where: { userId: user.id },
          select: { attemptNumber: true, status: true },
        },
      },
    });

    if (!set) {
      return NextResponse.json(
        { success: false, error: { message: "Practice set not found" } },
        { status: 404 }
      );
    }

    // Check for in-progress attempt
    const inProgress = set.attempts.find((a) => a.status === "IN_PROGRESS");
    if (inProgress) {
      return NextResponse.json(
        { success: false, error: { message: "You already have an in-progress attempt" } },
        { status: 400 }
      );
    }

    const nextAttemptNumber = set.attempts.length + 1;

    // Create attempt
    const attempt = await db.userPracticeAttempt.create({
      data: {
        userId: user.id,
        setId: params.setId,
        attemptNumber: nextAttemptNumber,
        totalQuestions: set.questions.length,
        totalPoints: set.questions.reduce((sum, q) => sum + q.points, 0),
        status: "IN_PROGRESS",
      },
    });

    // Strip correctAnswer, explanation, and isCorrect from options for security
    const questionsForSolving = set.questions.map((q) => {
      interface QuestionOption {
        id: string;
        text: string;
        isCorrect?: boolean;
        explanation?: string;
      }

      const options = q.options as QuestionOption[] | null;
      const sanitizedOptions = options
        ? options.map((opt) => ({
            id: opt.id,
            text: opt.text,
          }))
        : null;

      return {
        id: q.id,
        questionType: q.questionType,
        question: q.question,
        options: sanitizedOptions,
        bloomsLevel: q.bloomsLevel,
        difficulty: q.difficulty,
        points: q.points,
        order: q.order,
        hints: q.hints,
        relatedConcepts: q.relatedConcepts,
        estimatedTime: q.estimatedTime,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          startedAt: attempt.startedAt,
          totalQuestions: attempt.totalQuestions,
          totalPoints: attempt.totalPoints,
        },
        set: {
          id: set.id,
          title: set.title,
          topic: set.topic,
          difficulty: set.difficulty,
          bloomsLevel: set.bloomsLevel,
        },
        questions: questionsForSolving,
      },
    });
  } catch (error) {
    logger.error("[Practice] Start attempt error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to start practice attempt" } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/courses/sections/[sectionId]/practice/[setId]/attempt
 * List attempts for a practice set
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ sectionId: string; setId: string }> }
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

    const attempts = await db.userPracticeAttempt.findMany({
      where: {
        userId: user.id,
        setId: params.setId,
      },
      take: 100,
      orderBy: { attemptNumber: "desc" },
      select: {
        id: true,
        attemptNumber: true,
        status: true,
        totalQuestions: true,
        correctAnswers: true,
        scorePercentage: true,
        earnedPoints: true,
        totalPoints: true,
        startedAt: true,
        submittedAt: true,
        timeSpent: true,
        weakAreas: true,
        strongAreas: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    logger.error("[Practice] List attempts error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch attempts" } },
      { status: 500 }
    );
  }
}
