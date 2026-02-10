import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { SubmitPracticeAttemptSchema } from "@/lib/validations/practice-problems";
import { createPracticeProblemsEngine } from "@sam-ai/educational";
import type { PracticeProblem, ProblemEvaluation } from "@sam-ai/educational";
import { runSAMChatWithPreference } from "@/lib/sam/ai-provider";
import type { BloomsLevel, EvaluationType } from "@prisma/client";

export const runtime = "nodejs";

const SUBJECTIVE_TYPES = ["SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK"];

function createEngineWithAI(userId: string) {
  return createPracticeProblemsEngine({
    aiAdapter: {
      chat: async ({ messages }) => {
        const systemMessage = messages.find((m) => m.role === "system")?.content || "";
        const userMessage = messages.find((m) => m.role === "user")?.content || "";
        const response = await runSAMChatWithPreference({
          userId,
          capability: "chat",
          maxTokens: 2000,
          temperature: 0.3,
          systemPrompt: systemMessage,
          messages: [{ role: "user", content: userMessage }],
        });
        return { content: response };
      },
    },
  });
}

/**
 * POST /api/courses/sections/[sectionId]/practice/[setId]/attempt/[attemptId]/submit
 * Submit and grade a practice attempt
 */
export async function POST(
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

    const body = await req.json();
    const parseResult = SubmitPracticeAttemptSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid submission", details: parseResult.error.errors },
        },
        { status: 400 }
      );
    }

    const { answers, timeSpent } = parseResult.data;

    // Fetch attempt with questions
    const attempt = await db.userPracticeAttempt.findUnique({
      where: {
        id: params.attemptId,
        userId: user.id,
        setId: params.setId,
      },
      include: {
        set: {
          include: {
            questions: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: { message: "Attempt not found" } },
        { status: 404 }
      );
    }

    if (attempt.submittedAt) {
      return NextResponse.json(
        { success: false, error: { message: "Attempt already submitted" } },
        { status: 400 }
      );
    }

    const questions = attempt.set.questions;
    const engine = createEngineWithAI(user.id);

    // Grade each answer
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const bloomsPerformance: Record<string, { correct: number; total: number }> = {};
    const answerRecords: Array<{
      attemptId: string;
      questionId: string;
      answer: string;
      isCorrect: boolean | null;
      pointsEarned: number;
      timeSpent: number | null;
      evaluationType: EvaluationType;
      aiFeedback: string | null;
      aiScore: number | null;
      aiAccuracy: number | null;
      aiCompleteness: number | null;
      targetBloomsLevel: BloomsLevel | null;
      demonstratedLevel: BloomsLevel | null;
      misconceptions: string[];
      knowledgeGaps: string[];
      hintsUsed: number;
    }> = [];

    for (const question of questions) {
      const userAnswer = answers.find((a) => a.questionId === question.id);
      const answerText = userAnswer?.answer ?? "";
      const isSubjective = SUBJECTIVE_TYPES.includes(question.questionType);

      totalPoints += question.points;

      // Track Bloom's performance
      const bloomKey = question.bloomsLevel;
      if (!bloomsPerformance[bloomKey]) {
        bloomsPerformance[bloomKey] = { correct: 0, total: 0 };
      }
      bloomsPerformance[bloomKey].total += 1;

      let isCorrect: boolean | null = false;
      let pointsEarned2 = 0;
      let evaluationType: EvaluationType = "AUTO_GRADED";
      let aiFeedback: string | null = null;
      let aiScore: number | null = null;
      let aiAccuracy: number | null = null;
      let aiCompleteness: number | null = null;
      let demonstratedLevel: BloomsLevel | null = null;
      let misconceptions: string[] = [];
      let knowledgeGaps: string[] = [];

      if (isSubjective && answerText.trim().length > 0) {
        // AI evaluation for subjective questions
        try {
          const problemForEngine: PracticeProblem = {
            id: question.id,
            type: question.questionType === "ESSAY" ? "essay" : "short_answer",
            title: question.question.substring(0, 100),
            statement: question.question,
            difficulty: question.difficulty === "EASY" ? "beginner" : question.difficulty === "HARD" ? "advanced" : "intermediate",
            bloomsLevel: question.bloomsLevel as unknown as import("@sam-ai/core").BloomsLevel,
            points: question.points,
            correctAnswer: question.correctAnswer,
            hints: [],
            solutionExplanation: question.explanation ?? "",
            relatedConcepts: question.relatedConcepts,
            prerequisites: [],
            tags: question.cognitiveSkills,
            learningObjectives: [],
            createdAt: question.createdAt,
          };

          const evalResult: ProblemEvaluation = await engine.evaluateAttempt(
            problemForEngine,
            answerText,
            { partialCredit: true }
          );

          isCorrect = evalResult.isCorrect;
          pointsEarned2 = evalResult.pointsEarned;
          evaluationType = "AI_EVALUATED";
          aiFeedback = evalResult.feedback;
          aiScore = evalResult.partialCredit;
          misconceptions = evalResult.errors || [];
          knowledgeGaps = evalResult.conceptsToReview || [];
        } catch (evalError) {
          logger.warn("[Practice Submit] AI evaluation failed, using basic grading", {
            questionId: question.id,
            error: evalError instanceof Error ? evalError.message : "Unknown",
          });
          // Fallback: basic string match
          isCorrect = checkBasicAnswer(question.correctAnswer, answerText);
          pointsEarned2 = isCorrect ? question.points : 0;
        }
      } else {
        // Auto-grade objective questions
        isCorrect = checkBasicAnswer(question.correctAnswer, answerText, question.questionType);
        pointsEarned2 = isCorrect ? question.points : 0;
      }

      if (isCorrect) {
        correctCount++;
        bloomsPerformance[bloomKey].correct += 1;
      }
      earnedPoints += pointsEarned2;

      answerRecords.push({
        attemptId: params.attemptId,
        questionId: question.id,
        answer: answerText,
        isCorrect,
        pointsEarned: pointsEarned2,
        timeSpent: userAnswer?.timeSpent ?? null,
        evaluationType,
        aiFeedback,
        aiScore,
        aiAccuracy,
        aiCompleteness,
        targetBloomsLevel: question.bloomsLevel,
        demonstratedLevel,
        misconceptions,
        knowledgeGaps,
        hintsUsed: userAnswer?.hintsUsed ?? 0,
      });
    }

    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Identify weak/strong areas
    const weakAreas: string[] = [];
    const strongAreas: string[] = [];
    for (const [level, perf] of Object.entries(bloomsPerformance)) {
      const pct = perf.total > 0 ? perf.correct / perf.total : 0;
      if (pct < 0.5) weakAreas.push(level);
      else if (pct >= 0.8) strongAreas.push(level);
    }

    // Save everything in a transaction
    const updatedAttempt = await db.$transaction(async (tx) => {
      // Create answer records
      await tx.userPracticeAnswer.createMany({
        data: answerRecords,
      });

      // Update attempt
      const updated = await tx.userPracticeAttempt.update({
        where: { id: params.attemptId },
        data: {
          status: "GRADED",
          submittedAt: new Date(),
          timeSpent,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          scorePercentage,
          earnedPoints,
          totalPoints,
          bloomsPerformance: bloomsPerformance as Record<string, unknown>,
          weakAreas,
          strongAreas,
        },
        include: {
          answers: {
            include: {
              question: true,
            },
            orderBy: { question: { order: "asc" } },
          },
        },
      });

      // Update set analytics
      const allAttempts = await tx.userPracticeAttempt.findMany({
        where: { setId: params.setId, status: "GRADED" },
        select: { scorePercentage: true },
      });

      const scores = allAttempts
        .map((a) => a.scorePercentage)
        .filter((s): s is number => s !== null);

      await tx.practiceProblemSet.update({
        where: { id: params.setId },
        data: {
          totalAttempts: allAttempts.length,
          bestScore: scores.length > 0 ? Math.max(...scores) : null,
          avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
          lastAttemptedAt: new Date(),
        },
      });

      // Update per-question stats
      for (const answerRecord of answerRecords) {
        await tx.practiceProblemQuestion.update({
          where: { id: answerRecord.questionId },
          data: {
            totalAttempts: { increment: 1 },
            correctAttempts: answerRecord.isCorrect ? { increment: 1 } : undefined,
          },
        });
      }

      return updated;
    });

    // Build results with question details
    const results = updatedAttempt.answers.map((answer) => ({
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
        attemptId: updatedAttempt.id,
        attemptNumber: updatedAttempt.attemptNumber,
        status: updatedAttempt.status,
        totalQuestions: updatedAttempt.totalQuestions,
        correctAnswers: updatedAttempt.correctAnswers,
        scorePercentage: updatedAttempt.scorePercentage,
        earnedPoints: updatedAttempt.earnedPoints,
        totalPoints: updatedAttempt.totalPoints,
        timeSpent: updatedAttempt.timeSpent,
        bloomsPerformance: updatedAttempt.bloomsPerformance,
        weakAreas: updatedAttempt.weakAreas,
        strongAreas: updatedAttempt.strongAreas,
        startedAt: updatedAttempt.startedAt,
        submittedAt: updatedAttempt.submittedAt,
        answers: results,
      },
    });
  } catch (error) {
    logger.error("[Practice] Submit error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to submit practice attempt" } },
      { status: 500 }
    );
  }
}

/** Basic answer checking for objective questions */
function checkBasicAnswer(
  correctAnswer: string,
  userAnswer: string,
  questionType?: string
): boolean {
  if (!userAnswer?.trim()) return false;

  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  if (questionType === "TRUE_FALSE") {
    return normalizedUser === normalizedCorrect;
  }

  return normalizedUser === normalizedCorrect;
}
