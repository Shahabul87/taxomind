import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { runSAMChatWithPreference, handleAIAccessError } from "@/lib/sam/ai-provider";
import type { BloomsLevel, QuestionType, QuestionDifficulty } from "@prisma/client";

export const runtime = "nodejs";

// ============================================================================
// VALIDATION
// ============================================================================

const BloomsDistributionSchema = z.object({
  REMEMBER: z.number().min(0).max(100),
  UNDERSTAND: z.number().min(0).max(100),
  APPLY: z.number().min(0).max(100),
  ANALYZE: z.number().min(0).max(100),
  EVALUATE: z.number().min(0).max(100),
  CREATE: z.number().min(0).max(100),
});

const ConfigSchema = z.object({
  questionCount: z.number().min(1).max(50),
  bloomsDistribution: BloomsDistributionSchema,
  questionTypes: z.array(z.string()).min(1),
  difficulty: z.string(),
  generationMode: z.enum(["AI_QUICK", "AI_GUIDED", "AI_ADAPTIVE", "AI_GAP_FILLING"]).optional().default("AI_GUIDED"),
  includeHints: z.boolean().optional().default(true),
  includeExplanations: z.boolean().optional().default(true),
  includeMisconceptions: z.boolean().optional().default(false),
  realWorldContext: z.boolean().optional().default(true),
  creativity: z.number().min(1).max(10).optional().default(5),
});

const SectionContextSchema = z.object({
  courseId: z.string(),
  chapterId: z.string(),
  sectionId: z.string(),
  courseTitle: z.string().optional(),
  chapterTitle: z.string().optional(),
  sectionTitle: z.string().optional(),
  sectionContent: z.string().optional(),
  learningObjectives: z.array(z.string()).optional(),
});

const RequestSchema = z.object({
  config: ConfigSchema,
  sectionContext: SectionContextSchema,
});

// ============================================================================
// BLOOM'S TAXONOMY REFERENCE
// ============================================================================

const BLOOMS_VERBS: Record<BloomsLevel, string> = {
  REMEMBER:
    "Create questions that test recall of facts and basic concepts. Use verbs like: define, list, name, identify, recall, recognize, state, match.",
  UNDERSTAND:
    "Create questions that test comprehension and interpretation. Use verbs like: explain, describe, summarize, classify, compare, interpret, discuss.",
  APPLY:
    "Create questions that require using knowledge in new situations. Use verbs like: apply, solve, demonstrate, use, implement, calculate, show.",
  ANALYZE:
    "Create questions that require breaking down information. Use verbs like: analyze, compare, contrast, examine, differentiate, investigate, categorize.",
  EVALUATE:
    "Create questions that require making judgments. Use verbs like: evaluate, judge, critique, justify, argue, defend, assess, rate.",
  CREATE:
    "Create questions that require producing original work. Use verbs like: create, design, develop, propose, formulate, construct, invent, compose.",
};

const POINTS_PER_LEVEL: Record<BloomsLevel, number> = {
  REMEMBER: 1,
  UNDERSTAND: 2,
  APPLY: 3,
  ANALYZE: 4,
  EVALUATE: 5,
  CREATE: 6,
};

const TIME_PER_LEVEL: Record<BloomsLevel, number> = {
  REMEMBER: 30,
  UNDERSTAND: 60,
  APPLY: 90,
  ANALYZE: 120,
  EVALUATE: 150,
  CREATE: 180,
};

const COGNITIVE_SKILLS_PER_LEVEL: Record<BloomsLevel, string[]> = {
  REMEMBER: ["INFORMATION_PROCESSING"],
  UNDERSTAND: ["INFORMATION_PROCESSING", "LOGICAL_REASONING"],
  APPLY: ["PROBLEM_SOLVING", "DECISION_MAKING"],
  ANALYZE: ["ANALYTICAL_THINKING", "CRITICAL_THINKING", "LOGICAL_REASONING"],
  EVALUATE: ["CRITICAL_THINKING", "DECISION_MAKING", "METACOGNITION"],
  CREATE: ["CREATIVE_THINKING", "PROBLEM_SOLVING", "METACOGNITION"],
};

/** Balanced default distribution for Quick and Adaptive modes */
const BALANCED_DISTRIBUTION: Record<BloomsLevel, number> = {
  REMEMBER: 15,
  UNDERSTAND: 20,
  APPLY: 25,
  ANALYZE: 20,
  EVALUATE: 12,
  CREATE: 8,
};

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { config, sectionContext } = parseResult.data;
    const mode = config.generationMode;

    // Verify section access and fetch content
    const section = await db.section.findUnique({
      where: { id: sectionContext.sectionId },
      include: {
        chapter: {
          include: {
            course: {
              select: { userId: true, title: true, description: true },
            },
          },
        },
        learningObjectiveItems: true,
      },
    });

    if (!section || section.chapter.course.userId !== user.id) {
      return NextResponse.json(
        { error: "Section not found or access denied" },
        { status: 404 }
      );
    }

    // Build rich context from section data
    const context = buildSectionContext(
      section,
      sectionContext,
      section.learningObjectiveItems ?? []
    );

    // Resolve Bloom's distribution based on generation mode
    const bloomsDistribution = resolveBloomsDistribution(
      mode,
      config.bloomsDistribution,
      section.learningObjectiveItems ?? []
    );

    // Calculate questions per Bloom's level
    const allLevels: BloomsLevel[] = [
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE",
    ];
    const questionsPerLevel: Array<{ level: BloomsLevel; count: number }> = [];

    for (const level of allLevels) {
      const percentage = bloomsDistribution[level] || 0;
      const count = Math.round((percentage / 100) * config.questionCount);
      if (count > 0) {
        questionsPerLevel.push({ level, count });
      }
    }

    // Ensure we have at least the requested count
    const totalPlanned = questionsPerLevel.reduce((s, q) => s + q.count, 0);
    if (totalPlanned < config.questionCount && questionsPerLevel.length > 0) {
      questionsPerLevel[questionsPerLevel.length - 1].count +=
        config.questionCount - totalPlanned;
    }

    // Generate questions per Bloom's level using runSAMChatWithPreference()
    const allQuestions = [];
    for (const { level, count } of questionsPerLevel) {
      const generated = await generateQuestionsForLevel(
        context,
        level,
        count,
        config.questionTypes as QuestionType[],
        config.difficulty as QuestionDifficulty,
        config.includeHints,
        config.includeExplanations,
        config.includeMisconceptions,
        config.realWorldContext,
        config.creativity ?? 5,
        mode,
        user.id
      );
      allQuestions.push(...generated);
    }

    // Transform to UnifiedQuestion format
    const questions = allQuestions
      .slice(0, config.questionCount)
      .map((q, index) => ({
        id: `gen-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        question: q.question,
        questionType: q.questionType,
        bloomsLevel: q.bloomsLevel,
        difficulty: q.difficulty,
        points: q.points,
        estimatedTime: q.estimatedTime,
        options: q.options?.map(
          (opt: { text: string; isCorrect: boolean }, i: number) => ({
            id: `opt-${index}-${i}`,
            text: opt.text,
            isCorrect: opt.isCorrect,
          })
        ),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hint: q.hint,
        cognitiveSkills: q.cognitiveSkills,
        relatedConcepts: q.relatedConcepts,
        generationMode: mode,
        confidence: 0.85,
        needsReview: false,
        answerVisibility: "hidden" as const,
      }));

    // Record SAM interaction (fire-and-forget)
    db.sAMInteraction
      .create({
        data: {
          userId: user.id,
          courseId: sectionContext.courseId,
          interactionType: "CONTENT_GENERATE",
          context: {
            type: "EXAM_BUILDER_GENERATE",
            generationMode: mode,
            questionCount: questions.length,
            bloomsDistribution,
          },
        },
      })
      .catch((err: unknown) =>
        logger.error("Failed to record SAM interaction:", err)
      );

    return NextResponse.json({
      success: true,
      questions,
      metadata: {
        generatedAt: new Date().toISOString(),
        engine: "aiClient",
        generationMode: mode,
        requestedCount: config.questionCount,
        actualCount: questions.length,
        bloomsDistribution,
      },
    });
  } catch (error) {
    // Handle AI access denied errors (rate limiting, subscription limits)
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Exam generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}

// ============================================================================
// MODE-SPECIFIC BLOOM'S DISTRIBUTION
// ============================================================================

type GenerationMode = "AI_QUICK" | "AI_GUIDED" | "AI_ADAPTIVE" | "AI_GAP_FILLING";

/**
 * Resolve Bloom's distribution based on generation mode:
 * - AI_QUICK: Uses balanced default distribution (ignores user sliders)
 * - AI_GUIDED: Uses the user-configured distribution exactly
 * - AI_ADAPTIVE: Analyzes learning objectives to weight levels intelligently
 * - AI_GAP_FILLING: Focuses on underrepresented Bloom's levels from objectives
 */
function resolveBloomsDistribution(
  mode: GenerationMode,
  userDistribution: Record<BloomsLevel, number>,
  learningObjectiveItems: Array<{ objective: string; bloomsLevel: string | null }>
): Record<BloomsLevel, number> {
  switch (mode) {
    case "AI_QUICK":
      return { ...BALANCED_DISTRIBUTION };

    case "AI_GUIDED":
      return userDistribution;

    case "AI_ADAPTIVE": {
      // Weight distribution based on what learning objectives actually cover
      if (learningObjectiveItems.length === 0) return { ...BALANCED_DISTRIBUTION };

      const levelCounts: Record<BloomsLevel, number> = {
        REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
      };
      for (const obj of learningObjectiveItems) {
        const level = (obj.bloomsLevel as BloomsLevel) ?? "UNDERSTAND";
        if (level in levelCounts) levelCounts[level]++;
      }
      const total = Object.values(levelCounts).reduce((a, b) => a + b, 0);
      if (total === 0) return { ...BALANCED_DISTRIBUTION };

      // Weight: 60% from objectives coverage, 40% from balanced baseline
      const dist = {} as Record<BloomsLevel, number>;
      const allLevels: BloomsLevel[] = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
      let sum = 0;
      for (const level of allLevels) {
        const fromObjectives = (levelCounts[level] / total) * 100;
        dist[level] = Math.round(fromObjectives * 0.6 + BALANCED_DISTRIBUTION[level] * 0.4);
        sum += dist[level];
      }
      // Fix rounding to 100%
      if (sum !== 100) dist.APPLY += 100 - sum;
      return dist;
    }

    case "AI_GAP_FILLING": {
      // Focus on levels NOT covered by existing learning objectives
      if (learningObjectiveItems.length === 0) return { ...BALANCED_DISTRIBUTION };

      const coveredLevels = new Set<string>();
      for (const obj of learningObjectiveItems) {
        if (obj.bloomsLevel) coveredLevels.add(obj.bloomsLevel);
      }
      const allLevels: BloomsLevel[] = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];
      const gaps = allLevels.filter((l) => !coveredLevels.has(l));

      if (gaps.length === 0) {
        // All levels covered — distribute evenly across higher-order thinking
        return { REMEMBER: 5, UNDERSTAND: 10, APPLY: 20, ANALYZE: 25, EVALUATE: 25, CREATE: 15 };
      }

      // Heavily weight the gaps, small weight for covered levels
      const dist = {} as Record<BloomsLevel, number>;
      const gapShare = Math.floor(80 / gaps.length);
      const coveredShare = Math.floor(20 / Math.max(allLevels.length - gaps.length, 1));
      let sum = 0;
      for (const level of allLevels) {
        dist[level] = gaps.includes(level) ? gapShare : coveredShare;
        sum += dist[level];
      }
      if (sum !== 100) dist[gaps[0]] += 100 - sum;
      return dist;
    }
  }
}

// ============================================================================
// AI GENERATION (using runSAMChatWithPreference via ai-provider)
// ============================================================================

interface GeneratedQuestionRaw {
  question: string;
  questionType: QuestionType;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation: string;
  hint?: string;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  points: number;
  estimatedTime: number;
  cognitiveSkills: string[];
  relatedConcepts: string[];
}

async function generateQuestionsForLevel(
  context: string,
  bloomsLevel: BloomsLevel,
  count: number,
  questionTypes: QuestionType[],
  difficulty: QuestionDifficulty,
  includeHints: boolean,
  includeExplanations: boolean,
  includeMisconceptions: boolean,
  realWorldContext: boolean,
  creativity: number,
  mode: GenerationMode,
  userId: string
): Promise<GeneratedQuestionRaw[]> {
  const systemPrompt = buildGenerationPrompt(
    bloomsLevel,
    questionTypes,
    difficulty,
    includeHints,
    includeExplanations,
    includeMisconceptions,
    realWorldContext,
    mode
  );

  const temperature = Math.min(0.3 + creativity * 0.08, 1.0);

  const userPrompt = buildUserPrompt(mode, count, difficulty, bloomsLevel, context);

  const text = await runSAMChatWithPreference({
    userId,
    capability: "course",
    maxTokens: 4000,
    temperature,
    extended: true,
    systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  try {
    // Extract JSON array from AI response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map(
        (q: Record<string, unknown>): GeneratedQuestionRaw => ({
          question: String(q.question ?? ""),
          questionType:
            (q.questionType as QuestionType) ?? "MULTIPLE_CHOICE",
          options: Array.isArray(q.options)
            ? q.options.map((o: Record<string, unknown>) => ({
                text: String(o.text ?? ""),
                isCorrect: Boolean(o.isCorrect),
              }))
            : undefined,
          correctAnswer: String(q.correctAnswer ?? ""),
          explanation: String(
            q.explanation ?? "No explanation provided."
          ),
          hint: includeHints ? String(q.hint ?? "") || undefined : undefined,
          bloomsLevel,
          difficulty,
          points: POINTS_PER_LEVEL[bloomsLevel],
          estimatedTime: TIME_PER_LEVEL[bloomsLevel],
          cognitiveSkills: Array.isArray(q.cognitiveSkills)
            ? (q.cognitiveSkills as string[])
            : COGNITIVE_SKILLS_PER_LEVEL[bloomsLevel],
          relatedConcepts: Array.isArray(q.relatedConcepts)
            ? (q.relatedConcepts as string[])
            : [],
        })
      );
    }
  } catch (parseError) {
    logger.error(
      `Error parsing AI response for ${bloomsLevel}:`,
      parseError
    );
  }

  return [];
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildGenerationPrompt(
  level: BloomsLevel,
  questionTypes: QuestionType[],
  difficulty: QuestionDifficulty,
  includeHints: boolean,
  includeExplanations: boolean,
  includeMisconceptions: boolean,
  realWorldContext: boolean,
  mode: GenerationMode
): string {
  const typeNames = questionTypes
    .map((t) => t.replace(/_/g, " ").toLowerCase())
    .join(", ");

  // Mode-specific personality
  const modeInstruction = getModeInstruction(mode);

  return `You are an expert educational assessment designer specializing in Bloom's Taxonomy.

${modeInstruction}

${BLOOMS_VERBS[level]}

Question types to include: ${typeNames}
Difficulty level: ${difficulty}

${
  includeHints
    ? "Include a helpful hint for each question (without giving away the answer)."
    : "Do NOT include hints."
}
${
  includeExplanations
    ? "Include a detailed explanation of why the correct answer is correct."
    : "Do NOT include explanations."
}
${
  includeMisconceptions
    ? "For each question, identify a common student misconception that the wrong answers exploit. Design distractors (wrong options) that specifically target these misconceptions so the exam reveals gaps in understanding."
    : ""
}
${
  realWorldContext
    ? "Ground each question in a real-world scenario, practical example, or authentic context that students would encounter in professional settings. Avoid abstract or purely theoretical questions."
    : "Focus on theoretical and conceptual understanding. Questions should test the underlying principles without requiring practical context."
}

For MULTIPLE_CHOICE questions, provide exactly 4 options with exactly one correct answer.
For TRUE_FALSE questions, provide 2 options: "True" and "False".
For SHORT_ANSWER questions, provide the expected answer as correctAnswer.
For ESSAY questions, provide key points to look for as correctAnswer.
For FILL_IN_BLANK questions, use ___ to mark the blank in the question text and provide the expected answer as correctAnswer.

Respond ONLY with a JSON array (no markdown, no code fences). Each element:
[
  {
    "question": "<question text>",
    "questionType": "<MULTIPLE_CHOICE|SHORT_ANSWER|TRUE_FALSE|ESSAY|FILL_IN_BLANK>",
    "options": [{"text": "<option>", "isCorrect": true/false}],
    "correctAnswer": "<correct answer text>",
    "explanation": "<why this is correct>",
    "hint": "<helpful hint>",
    "cognitiveSkills": ["<skill>"],
    "relatedConcepts": ["<concept>"]
  }
]

Make questions clear, educational, and appropriately challenging. Ensure only ONE option is marked isCorrect for MCQ.`;
}

/**
 * Mode-specific instructions that shape the AI's behavior:
 * - Quick: Fast, balanced, straightforward questions
 * - Guided: Precise Bloom's level adherence with pedagogical depth
 * - Adaptive: Content-aware questions aligned to learning objectives
 * - Gap Filling: Questions targeting underrepresented cognitive levels
 */
function getModeInstruction(mode: GenerationMode): string {
  switch (mode) {
    case "AI_QUICK":
      return `GENERATION MODE: Quick Generate
Generate straightforward, well-structured questions efficiently. Prioritize clarity and coverage of the key concepts. Keep questions concise — no long scenarios unless necessary. Aim for a balanced mix that tests breadth of knowledge across the content.`;

    case "AI_GUIDED":
      return `GENERATION MODE: Guided Generate
The teacher has carefully selected the Bloom's taxonomy level and question types for this batch. You MUST strictly adhere to the specified cognitive level. Every question must genuinely test the thinking skills of that Bloom's level — do not disguise a REMEMBER question as an ANALYZE question. The verbs used in the question stem must match the cognitive level.`;

    case "AI_ADAPTIVE":
      return `GENERATION MODE: Adaptive Generate
Analyze the provided content and learning objectives deeply. Generate questions that are specifically aligned to what the content actually teaches. If the content covers a process, ask about the process steps. If it explains a concept with examples, test understanding of those specific examples. Your questions should feel like they were written by the teacher who created this content — highly specific, not generic.`;

    case "AI_GAP_FILLING":
      return `GENERATION MODE: Gap Filling
You are filling gaps in the exam's cognitive coverage. The questions at this Bloom's level are currently underrepresented. Create questions that specifically target this cognitive level to ensure the exam provides a comprehensive assessment. Focus on quality over quantity — each question should be distinctly different and test a unique aspect of the content at this cognitive level.`;
  }
}

/**
 * Build mode-specific user prompt with context
 */
function buildUserPrompt(
  mode: GenerationMode,
  count: number,
  difficulty: QuestionDifficulty,
  bloomsLevel: BloomsLevel,
  context: string
): string {
  const base = `Generate exactly ${count} ${difficulty.toLowerCase()} difficulty questions at the ${bloomsLevel} Bloom's taxonomy level.`;

  switch (mode) {
    case "AI_QUICK":
      return `${base} Keep questions focused and efficient.\n\nContent:\n${context}\n\nRespond ONLY with a valid JSON array of question objects. No other text.`;

    case "AI_GUIDED":
      return `${base} Every question MUST genuinely require ${bloomsLevel.toLowerCase()}-level thinking — not just surface-level recall disguised as higher-order thinking.\n\nContent:\n${context}\n\nRespond ONLY with a valid JSON array of question objects. No other text.`;

    case "AI_ADAPTIVE":
      return `${base} Carefully read the content below and create questions that are deeply tied to the specific concepts, examples, and explanations provided. Do NOT create generic questions — every question should reference or require knowledge of the actual content.\n\nContent:\n${context}\n\nRespond ONLY with a valid JSON array of question objects. No other text.`;

    case "AI_GAP_FILLING":
      return `${base} These questions fill a gap in the exam's Bloom's taxonomy coverage. Make each question distinctly different and ensure they genuinely test ${bloomsLevel.toLowerCase()}-level cognitive skills.\n\nContent:\n${context}\n\nRespond ONLY with a valid JSON array of question objects. No other text.`;
  }
}

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

function buildSectionContext(
  section: {
    title: string;
    description: string | null;
    learningObjectives: string | null;
    chapter: {
      title: string;
      course: { title: string; description: string | null };
    };
  },
  sectionContext: {
    sectionContent?: string;
    learningObjectives?: string[];
    courseTitle?: string;
    chapterTitle?: string;
    sectionTitle?: string;
  },
  learningObjectiveItems: Array<{
    objective: string;
    bloomsLevel: string | null;
  }>
): string {
  let context = "";

  context += `Course: ${sectionContext.courseTitle || section.chapter.course.title}\n`;
  if (section.chapter.course.description) {
    context += `Course Description: ${section.chapter.course.description}\n`;
  }
  context += `Chapter: ${sectionContext.chapterTitle || section.chapter.title}\n`;
  context += `Section: ${sectionContext.sectionTitle || section.title}\n`;

  if (section.description) {
    context += `\nSection Description: ${section.description}\n`;
  }

  if (sectionContext.sectionContent) {
    context += `\nSection Content:\n${sectionContext.sectionContent}\n`;
  }

  if (section.learningObjectives) {
    context += `\nLearning Objectives: ${section.learningObjectives}\n`;
  }

  if (
    sectionContext.learningObjectives &&
    sectionContext.learningObjectives.length > 0
  ) {
    context += `\nSpecific Learning Objectives:\n`;
    sectionContext.learningObjectives.forEach((obj, i) => {
      context += `${i + 1}. ${obj}\n`;
    });
  }

  if (learningObjectiveItems.length > 0) {
    context += `\nDetailed Learning Objectives:\n`;
    learningObjectiveItems.forEach((obj, i) => {
      context += `${i + 1}. [${obj.bloomsLevel ?? "UNDERSTAND"}] ${obj.objective}\n`;
    });
  }

  return context;
}
