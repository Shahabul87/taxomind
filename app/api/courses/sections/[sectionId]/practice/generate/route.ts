import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/sam/middleware/rate-limiter";
import { GeneratePracticeSetSchema } from "@/lib/validations/practice-problems";
import { runSAMChatWithPreference, handleAIAccessError, withSubscriptionGate } from "@/lib/sam/ai-provider";
import type { BloomsLevel, QuestionType, QuestionDifficulty } from "@prisma/client";
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from "@/lib/sam/utils/timeout";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/*  Mapping helpers                                                    */
/* ------------------------------------------------------------------ */

function mapDifficulty(diff: string): QuestionDifficulty {
  if (diff === "beginner" || diff === "easy") return "EASY";
  if (diff === "advanced" || diff === "expert" || diff === "hard") return "HARD";
  return "MEDIUM";
}

function mapBloomsLevel(level: string): BloomsLevel {
  const valid: BloomsLevel[] = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
  const upper = level?.toUpperCase() as BloomsLevel;
  return valid.includes(upper) ? upper : "APPLY";
}

/* ------------------------------------------------------------------ */
/*  AI problem type description for the prompt                         */
/* ------------------------------------------------------------------ */

function describeQuestionType(qt: string): string {
  const descriptions: Record<string, string> = {
    MULTIPLE_CHOICE: "multiple choice with 4 options (exactly one correct)",
    TRUE_FALSE: "true/false",
    SHORT_ANSWER: "short answer (1-3 sentences)",
    ESSAY: "essay (longer form explanation)",
    FILL_IN_BLANK: "fill in the blank",
  };
  return descriptions[qt] ?? "multiple choice with 4 options";
}

/* ------------------------------------------------------------------ */
/*  Build the generation prompt                                        */
/* ------------------------------------------------------------------ */

interface GenerationParams {
  topic: string;
  difficulty: string;
  bloomsLevel: string;
  count: number;
  questionTypes: string[];
  learningObjectives: string[];
  sectionTitle: string;
  sectionDescription: string | null;
}

function buildGenerationPrompt(p: GenerationParams): { system: string; user: string } {
  const typeDescriptions = p.questionTypes.map(describeQuestionType).join(", ");
  const objectivesText = p.learningObjectives.length > 0
    ? `Learning objectives: ${p.learningObjectives.join("; ")}`
    : "";

  const system = `You are an expert educational assessment designer. Generate practice problems that accurately test student knowledge at the specified Bloom's taxonomy level. Return ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON.`;

  const user = `Generate ${p.count} practice problems about "${p.topic}" for the section "${p.sectionTitle}".
${p.sectionDescription ? `Section context: ${p.sectionDescription}` : ""}
${objectivesText}

Requirements:
- Difficulty: ${p.difficulty}
- Bloom's taxonomy level: ${p.bloomsLevel}
- Question types to use: ${typeDescriptions}
- Distribute types evenly across the ${p.count} problems

Return a JSON object with this EXACT structure:
{
  "problems": [
    {
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_BLANK",
      "question": "The question text",
      "options": [
        { "id": "a", "text": "Option A", "isCorrect": false },
        { "id": "b", "text": "Option B", "isCorrect": true },
        { "id": "c", "text": "Option C", "isCorrect": false },
        { "id": "d", "text": "Option D", "isCorrect": false }
      ],
      "correctAnswer": "The correct answer text",
      "explanation": "Why this is the correct answer",
      "bloomsLevel": "${p.bloomsLevel}",
      "difficulty": "${p.difficulty}",
      "points": 10,
      "hints": ["Hint 1", "Hint 2"],
      "relatedConcepts": ["concept1", "concept2"]
    }
  ]
}

Rules for each type:
- MULTIPLE_CHOICE: must have exactly 4 options, exactly 1 with isCorrect=true. correctAnswer = the text of the correct option.
- TRUE_FALSE: must have 2 options: [{"id":"a","text":"True","isCorrect":...},{"id":"b","text":"False","isCorrect":...}]. correctAnswer = "True" or "False".
- SHORT_ANSWER: options should be null. correctAnswer = the expected answer.
- ESSAY: options should be null. correctAnswer = a model answer.
- FILL_IN_BLANK: options should be null. question should contain "___" for the blank. correctAnswer = the word/phrase for the blank.

Return ONLY the JSON object. No other text.`;

  return { system, user };
}

/* ------------------------------------------------------------------ */
/*  Parse AI response into structured problems                         */
/* ------------------------------------------------------------------ */

interface AIProblem {
  type: string;
  question: string;
  statement?: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }> | null;
  correctAnswer: string;
  explanation: string;
  solutionExplanation?: string;
  bloomsLevel: string;
  difficulty: string;
  points: number;
  hints: string[];
  relatedConcepts: string[];
}

function parseAIResponse(raw: string): AIProblem[] {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(cleaned);
  const problems: AIProblem[] = parsed.problems ?? parsed;

  if (!Array.isArray(problems) || problems.length === 0) {
    throw new Error("AI returned no problems array");
  }

  // Validate each problem has required fields
  return problems.map((p, i) => ({
    type: p.type ?? "MULTIPLE_CHOICE",
    question: p.question ?? p.statement ?? `Problem ${i + 1}`,
    options: Array.isArray(p.options) ? p.options : null,
    correctAnswer:
      p.correctAnswer ??
      (Array.isArray(p.options) ? p.options.find((o: { isCorrect: boolean; text: string }) => o.isCorrect)?.text : "") ??
      "",
    explanation: p.explanation ?? p.solutionExplanation ?? "",
    bloomsLevel: p.bloomsLevel ?? "APPLY",
    difficulty: p.difficulty ?? "intermediate",
    points: p.points ?? 10,
    hints: Array.isArray(p.hints) ? p.hints : [],
    relatedConcepts: Array.isArray(p.relatedConcepts) ? p.relatedConcepts : [],
  }));
}

/* ------------------------------------------------------------------ */
/*  Map AI question type string to Prisma QuestionType                 */
/* ------------------------------------------------------------------ */

function mapQuestionType(aiType: string): QuestionType {
  const map: Record<string, QuestionType> = {
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    multiple_choice: "MULTIPLE_CHOICE",
    TRUE_FALSE: "TRUE_FALSE",
    true_false: "TRUE_FALSE",
    SHORT_ANSWER: "SHORT_ANSWER",
    short_answer: "SHORT_ANSWER",
    ESSAY: "ESSAY",
    essay: "ESSAY",
    FILL_IN_BLANK: "FILL_IN_BLANK",
    fill_blank: "FILL_IN_BLANK",
    FILL_IN_THE_BLANK: "FILL_IN_BLANK",
  };
  return map[aiType] ?? "MULTIPLE_CHOICE";
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

/**
 * POST /api/courses/sections/[sectionId]/practice/generate
 *
 * Bypasses the PracticeProblemsEngine (which has an infinite recursion bug)
 * and calls the AI directly via runSAMChatWithPreference, then saves to DB.
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ sectionId: string }> }
) {
  const params = await props.params;

  try {
    const rateLimitResponse = await withRateLimit(req, "ai");
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Subscription gate: practice generation requires STARTER+
    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const validated = GeneratePracticeSetSchema.parse(body);

    // Fetch section for context
    const section = await db.section.findUnique({
      where: { id: params.sectionId },
      select: {
        id: true,
        title: true,
        description: true,
        learningObjectives: true,
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: { message: "Section not found" } },
        { status: 404 }
      );
    }

    const objectives = validated.learningObjectives.length > 0
      ? validated.learningObjectives
      : section.learningObjectives
        ? [section.learningObjectives]
        : [];

    // Build structured prompt
    const prompt = buildGenerationPrompt({
      topic: validated.topic,
      difficulty: validated.difficulty,
      bloomsLevel: validated.bloomsLevel,
      count: validated.count,
      questionTypes: validated.questionTypes,
      learningObjectives: objectives,
      sectionTitle: section.title,
      sectionDescription: section.description,
    });

    logger.info("[Practice] Generating problems via direct AI call", {
      topic: validated.topic,
      count: validated.count,
      bloomsLevel: validated.bloomsLevel,
      difficulty: validated.difficulty,
      questionTypes: validated.questionTypes,
      userId: user.id,
    });

    // Call AI directly — no engine, no recursion risk
    const aiResponse = await withRetryableTimeout(
      () => runSAMChatWithPreference({
        userId: user.id,
        capability: "chat",
        maxTokens: 4000,
        temperature: 0.7,
        systemPrompt: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      "practice-ai-generation",
    );

    logger.info("[Practice] AI responded", {
      responseLength: aiResponse?.length ?? 0,
      userId: user.id,
    });

    // Parse and validate AI response
    let problems: AIProblem[];
    try {
      problems = parseAIResponse(aiResponse);
    } catch (parseError) {
      logger.error("[Practice] Failed to parse AI response", {
        error: parseError,
        responsePreview: aiResponse?.substring(0, 500),
      });
      return NextResponse.json(
        { success: false, error: { message: "AI returned an invalid response. Please try again." } },
        { status: 502 }
      );
    }

    if (problems.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "AI failed to generate problems. Please try again." } },
        { status: 502 }
      );
    }

    logger.info("[Practice] Parsed problems", {
      count: problems.length,
      types: problems.map((p) => p.type),
    });

    // Save to DB in a transaction
    const practiceProblemSet = await db.$transaction(async (tx) => {
      const set = await tx.practiceProblemSet.create({
        data: {
          userId: user.id,
          sectionId: params.sectionId,
          title: `${validated.topic} Practice`,
          topic: validated.topic,
          status: "READY",
          difficulty: validated.difficulty,
          bloomsLevel: mapBloomsLevel(validated.bloomsLevel),
          questionCount: problems.length,
          questionTypes: validated.questionTypes,
        },
      });

      const questionData = problems.map((problem, index) => ({
        setId: set.id,
        questionType: mapQuestionType(problem.type),
        question: problem.question,
        options: problem.options
          ? JSON.parse(JSON.stringify(problem.options))
          : null,
        correctAnswer: problem.correctAnswer || "",
        explanation: problem.explanation || null,
        acceptableVariations: undefined,
        bloomsLevel: mapBloomsLevel(problem.bloomsLevel),
        difficulty: mapDifficulty(problem.difficulty),
        points: problem.points || 10,
        order: index,
        hints: problem.hints.length > 0
          ? JSON.parse(JSON.stringify(problem.hints.map((h, hi) => ({
              id: `hint-${hi}`,
              content: h,
              order: hi,
              penaltyPoints: 2,
            }))))
          : null,
        relatedConcepts: problem.relatedConcepts,
        cognitiveSkills: [],
        estimatedTime: null,
      }));

      await tx.practiceProblemQuestion.createMany({
        data: questionData,
      });

      return tx.practiceProblemSet.findUnique({
        where: { id: set.id },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: { questions: true, attempts: true },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: practiceProblemSet,
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error("[Practice] Generate error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to generate practice problems" } },
      { status: 500 }
    );
  }
}
