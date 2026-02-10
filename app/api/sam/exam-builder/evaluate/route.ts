import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { BloomsLevel } from "@prisma/client";

export const runtime = "nodejs";

// ============================================================================
// VALIDATION
// ============================================================================

const QuestionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
});

const QuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  questionType: z.string(),
  bloomsLevel: z.string(),
  difficulty: z.string(),
  points: z.number().min(0),
  estimatedTime: z.number().min(0),
  options: z.array(QuestionOptionSchema).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  hint: z.string().optional(),
  cognitiveSkills: z.array(z.string()).optional(),
  relatedConcepts: z.array(z.string()).optional(),
});

const SectionContextSchema = z.object({
  courseId: z.string(),
  chapterId: z.string(),
  sectionId: z.string(),
  courseTitle: z.string().optional(),
  chapterTitle: z.string().optional(),
  sectionTitle: z.string().optional(),
});

const RequestSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
  sectionContext: SectionContextSchema,
});

// ============================================================================
// BLOOM'S LEVEL KEYWORDS (for fast classification fallback)
// ============================================================================

const BLOOMS_KEYWORDS: Record<BloomsLevel, string[]> = {
  REMEMBER: ["define", "list", "name", "identify", "recall", "state", "match", "label", "recognize", "what is", "which"],
  UNDERSTAND: ["explain", "describe", "summarize", "paraphrase", "classify", "compare", "interpret", "discuss", "distinguish"],
  APPLY: ["apply", "demonstrate", "solve", "use", "implement", "calculate", "execute", "show", "illustrate"],
  ANALYZE: ["analyze", "compare", "contrast", "differentiate", "examine", "investigate", "categorize", "organize", "relate"],
  EVALUATE: ["evaluate", "assess", "judge", "critique", "justify", "argue", "defend", "rate", "support", "do you agree"],
  CREATE: ["create", "design", "develop", "formulate", "construct", "produce", "propose", "invent", "compose", "plan"],
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

    const { questions, sectionContext } = parseResult.data;

    // Verify section access
    const section = await db.section.findUnique({
      where: { id: sectionContext.sectionId },
      include: {
        chapter: {
          include: {
            course: { select: { userId: true } },
          },
        },
      },
    });

    if (!section || section.chapter.course.userId !== user.id) {
      return NextResponse.json(
        { error: "Section not found or access denied" },
        { status: 404 }
      );
    }

    // ── Analyze each question ──────────────────────────────────────────
    const questionAnalyses = questions.map((q) => {
      const detectedLevel = detectBloomsLevel(q.question);
      const declaredLevel = q.bloomsLevel as BloomsLevel;
      const bloomsMatch = detectedLevel === declaredLevel;

      const clarityScore = assessClarity(q.question, q.options);
      const cognitiveRigorScore = assessCognitiveRigor(q.question, declaredLevel);
      const qualityScore = Math.round(
        (clarityScore * 0.3 + cognitiveRigorScore * 0.4 + (bloomsMatch ? 100 : 50) * 0.3)
      );
      const bloomsAlignmentScore = bloomsMatch ? 100 : calculateBloomsProximity(detectedLevel, declaredLevel);

      const issues: Array<{ type: "error" | "warning" | "info"; message: string; field?: string }> = [];
      const suggestions: string[] = [];

      if (!bloomsMatch) {
        issues.push({
          type: "warning",
          message: `Question appears to test "${detectedLevel}" rather than declared "${declaredLevel}"`,
          field: "bloomsLevel",
        });
        suggestions.push(
          `Consider changing the Bloom's level to "${detectedLevel}" or rewording to better target "${declaredLevel}"`
        );
      }

      if (clarityScore < 60) {
        issues.push({
          type: "warning",
          message: "Question could be clearer or more specific",
          field: "question",
        });
        suggestions.push("Add more context or specificity to the question");
      }

      if (q.question.length < 20) {
        issues.push({
          type: "info",
          message: "Question is very short - consider adding more detail",
          field: "question",
        });
      }

      if (!q.explanation || q.explanation.length < 10) {
        issues.push({
          type: "warning",
          message: "Explanation is too brief - students benefit from detailed explanations",
          field: "explanation",
        });
      }

      if (q.options && q.options.length > 0) {
        const correctCount = q.options.filter((o) => o.isCorrect).length;
        if (correctCount === 0) {
          issues.push({
            type: "error",
            message: "No correct answer is marked among the options",
            field: "options",
          });
        }
        if (q.options.length < 3) {
          issues.push({
            type: "info",
            message: "Consider adding more options to increase difficulty",
            field: "options",
          });
        }
      }

      // Generate suggested rewrite for low-quality questions
      let suggestedRewrite: string | undefined;
      if (qualityScore < 60) {
        const targetVerbs = BLOOMS_KEYWORDS[declaredLevel];
        const verb = targetVerbs[Math.floor(Math.random() * targetVerbs.length)];
        suggestedRewrite = `${verb.charAt(0).toUpperCase()}${verb.slice(1)} ${q.question.replace(/^(what|how|why|when|where|which|define|explain|describe)\s*/i, "")}`;
      }

      return {
        detectedBloomsLevel: detectedLevel,
        bloomsAlignmentScore,
        qualityScore,
        clarityScore,
        cognitiveRigorScore,
        issues,
        suggestions,
        suggestedRewrite,
      };
    });

    // ── Calculate Bloom's distribution ─────────────────────────────────
    const actualDistribution = calculateDistribution(
      questions.map((q) => q.bloomsLevel as BloomsLevel)
    );
    const targetDistribution = {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 30,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 5,
    };

    const allLevels: BloomsLevel[] = [
      "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE",
    ];

    const missingLevels = allLevels.filter((l) => actualDistribution[l] === 0);
    const overrepresentedLevels = allLevels.filter(
      (l) => actualDistribution[l] > targetDistribution[l] + 15
    );

    const alignmentScore = calculateAlignmentScore(actualDistribution, targetDistribution);

    // ── Coverage gaps ──────────────────────────────────────────────────
    const coverageGaps: Array<{
      area: string;
      severity: "low" | "medium" | "high";
      recommendation: string;
    }> = [];

    missingLevels.forEach((level) => {
      const severity = ["APPLY", "ANALYZE", "EVALUATE"].includes(level)
        ? "high"
        : "medium";
      coverageGaps.push({
        area: `Bloom's Level: ${level}`,
        severity,
        recommendation: `Add ${level.toLowerCase()} questions. Use verbs like: ${BLOOMS_KEYWORDS[level].slice(0, 3).join(", ")}`,
      });
    });

    if (questions.length < 5) {
      coverageGaps.push({
        area: "Question Count",
        severity: "medium",
        recommendation: "Consider adding more questions for a comprehensive assessment",
      });
    }

    // ── Overall score ──────────────────────────────────────────────────
    const avgQualityScore =
      questionAnalyses.reduce((sum, a) => sum + a.qualityScore, 0) / questionAnalyses.length;
    const overallScore = Math.round(avgQualityScore * 0.5 + alignmentScore * 0.3 + (missingLevels.length <= 2 ? 80 : 40) * 0.2);

    const grade =
      overallScore >= 90 ? "A" :
      overallScore >= 80 ? "B" :
      overallScore >= 70 ? "C" :
      overallScore >= 60 ? "D" : "F";

    // ── Exam-level suggestions ─────────────────────────────────────────
    const examSuggestions: string[] = [];
    if (missingLevels.length > 0) {
      examSuggestions.push(
        `Add questions for missing Bloom's levels: ${missingLevels.join(", ")}`
      );
    }
    if (overrepresentedLevels.length > 0) {
      examSuggestions.push(
        `Consider reducing questions at: ${overrepresentedLevels.join(", ")}`
      );
    }
    if (alignmentScore < 60) {
      examSuggestions.push(
        "The Bloom's distribution is significantly imbalanced - aim for a broader cognitive spread"
      );
    }
    if (avgQualityScore < 70) {
      examSuggestions.push(
        "Several questions could be improved - review the per-question suggestions"
      );
    }

    const summary = `This exam contains ${questions.length} questions covering ${6 - missingLevels.length}/6 Bloom's taxonomy levels with an overall pedagogical effectiveness score of ${overallScore}%.`;

    const report = {
      overallScore,
      grade,
      bloomsAnalysis: {
        targetDistribution,
        actualDistribution,
        alignmentScore,
        missingLevels,
        overrepresentedLevels,
      },
      questionAnalyses,
      coverageGaps,
      examSuggestions,
      summary,
      evaluatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    logger.error("Exam evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate exam" },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectBloomsLevel(questionText: string): BloomsLevel {
  const text = questionText.toLowerCase();
  const scores: Record<BloomsLevel, number> = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };

  for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[level as BloomsLevel] += 1;
      }
    }
  }

  const entries = Object.entries(scores) as Array<[BloomsLevel, number]>;
  const maxEntry = entries.reduce((max, entry) => (entry[1] > max[1] ? entry : max));

  // Default to UNDERSTAND if no keywords match
  if (maxEntry[1] === 0) return "UNDERSTAND";
  return maxEntry[0];
}

function assessClarity(questionText: string, options?: Array<{ text: string }> | undefined): number {
  let score = 70; // base score

  // Longer questions tend to be clearer (up to a point)
  if (questionText.length > 30) score += 10;
  if (questionText.length > 80) score += 5;
  if (questionText.length > 200) score -= 10; // too long

  // Ends with question mark
  if (questionText.trim().endsWith("?")) score += 5;

  // Has specific context
  if (questionText.includes("following") || questionText.includes("given") || questionText.includes("example")) {
    score += 5;
  }

  // Check options quality
  if (options && options.length > 0) {
    const avgOptionLen = options.reduce((sum, o) => sum + o.text.length, 0) / options.length;
    if (avgOptionLen > 5) score += 5;
    if (options.some((o) => o.text.length === 0)) score -= 15;
  }

  return Math.min(100, Math.max(0, score));
}

function assessCognitiveRigor(questionText: string, declaredLevel: BloomsLevel): number {
  const levelOrder: BloomsLevel[] = [
    "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE",
  ];
  const levelIndex = levelOrder.indexOf(declaredLevel);

  let score = 50;

  // Higher levels should have longer questions
  if (levelIndex >= 3 && questionText.length > 50) score += 20;
  if (levelIndex >= 4 && questionText.length > 100) score += 10;

  // Check for cognitive demand indicators
  const complexIndicators = [
    "why", "how", "compare", "contrast", "analyze", "evaluate", "create",
    "design", "develop", "justify", "argue", "critique", "propose",
    "explain the relationship", "what would happen if",
  ];

  const matchCount = complexIndicators.filter((ind) =>
    questionText.toLowerCase().includes(ind)
  ).length;

  score += Math.min(30, matchCount * 10);

  return Math.min(100, Math.max(0, score));
}

function calculateBloomsProximity(detected: BloomsLevel, declared: BloomsLevel): number {
  const order: BloomsLevel[] = [
    "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE",
  ];
  const diff = Math.abs(order.indexOf(detected) - order.indexOf(declared));
  // Adjacent levels get 75, 2 apart gets 50, etc.
  return Math.max(0, 100 - diff * 25);
}

function calculateDistribution(levels: BloomsLevel[]): Record<BloomsLevel, number> {
  const dist: Record<BloomsLevel, number> = {
    REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
  };
  const total = levels.length || 1;
  levels.forEach((l) => { dist[l]++; });
  // Convert to percentages
  for (const key of Object.keys(dist) as BloomsLevel[]) {
    dist[key] = Math.round((dist[key] / total) * 100);
  }
  return dist;
}

function calculateAlignmentScore(
  actual: Record<BloomsLevel, number>,
  target: Record<BloomsLevel, number>
): number {
  const levels: BloomsLevel[] = [
    "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE",
  ];
  let totalDiff = 0;
  levels.forEach((l) => {
    totalDiff += Math.abs(actual[l] - target[l]);
  });
  // Max possible diff is 200 (all in one level), normalize to 0-100
  return Math.round(Math.max(0, 100 - totalDiff / 2));
}
