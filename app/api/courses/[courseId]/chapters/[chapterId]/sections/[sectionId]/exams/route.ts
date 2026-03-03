import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { safeErrorResponse } from '@/lib/api/safe-error';
import type {
  QuestionType,
  QuestionDifficulty,
  BloomsLevel,
  QuestionGenerationMode,
} from "@prisma/client";

// Force Node.js runtime
export const runtime = 'nodejs';

// ============================================================================
// ENUM MAPPINGS
// ============================================================================

/** Maps both legacy (lowercase) and Prisma (UPPERCASE) question types */
const QuestionTypeMap: Record<string, QuestionType> = {
  "multiple-choice": "MULTIPLE_CHOICE",
  "true-false": "TRUE_FALSE",
  "short-answer": "SHORT_ANSWER",
  "MULTIPLE_CHOICE": "MULTIPLE_CHOICE",
  "TRUE_FALSE": "TRUE_FALSE",
  "SHORT_ANSWER": "SHORT_ANSWER",
  "ESSAY": "ESSAY",
  "FILL_IN_BLANK": "FILL_IN_BLANK",
  "MATCHING": "MATCHING",
  "ORDERING": "ORDERING",
};

/** Maps both legacy (lowercase) and Prisma (UPPERCASE) difficulty levels */
const DifficultyMap: Record<string, QuestionDifficulty> = {
  "easy": "EASY",
  "medium": "MEDIUM",
  "hard": "HARD",
  "EASY": "EASY",
  "MEDIUM": "MEDIUM",
  "HARD": "HARD",
};

/** Maps both legacy (lowercase) and Prisma (UPPERCASE) Bloom's levels */
const BloomsMap: Record<string, BloomsLevel> = {
  "remember": "REMEMBER",
  "understand": "UNDERSTAND",
  "apply": "APPLY",
  "analyze": "ANALYZE",
  "evaluate": "EVALUATE",
  "create": "CREATE",
  "REMEMBER": "REMEMBER",
  "UNDERSTAND": "UNDERSTAND",
  "APPLY": "APPLY",
  "ANALYZE": "ANALYZE",
  "EVALUATE": "EVALUATE",
  "CREATE": "CREATE",
};

/** Maps generation mode strings to Prisma enum */
const GenerationModeMap: Record<string, QuestionGenerationMode> = {
  "MANUAL": "MANUAL",
  "AI_QUICK": "AI_QUICK",
  "AI_GUIDED": "AI_GUIDED",
  "AI_ADAPTIVE": "AI_ADAPTIVE",
  "AI_GAP_FILLING": "AI_GAP_FILLING",
  "HYBRID": "HYBRID",
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Legacy question format (from ExamCreationForm)
const LegacyQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple-choice", "true-false", "short-answer"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  bloomsLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional(),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  points: z.number().min(0),
});

// Unified question format (from UnifiedExamBuilder)
const UnifiedQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  questionType: z.string(),
  bloomsLevel: z.string().optional(),
  difficulty: z.string(),
  points: z.number().min(0),
  estimatedTime: z.number().optional(),
  options: z.array(z.string()).optional(),
  optionsFull: z.array(z.object({
    text: z.string(),
    isCorrect: z.boolean(),
  })).optional(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  cognitiveSkills: z.array(z.string()).optional(),
  relatedConcepts: z.array(z.string()).optional(),
  generationMode: z.string().optional(),
  orderIndex: z.number().optional(),
});

// Accept either format
const QuestionSchema = z.union([LegacyQuestionSchema, UnifiedQuestionSchema]);

const ExamSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  timeLimit: z.string().optional(),
  passingScore: z.number().optional(),
  questions: z.array(QuestionSchema),
  totalPoints: z.number().min(0),
});

// ============================================================================
// HELPERS
// ============================================================================

function resolveQuestionType(question: z.infer<typeof QuestionSchema>): QuestionType {
  if ('questionType' in question && question.questionType) {
    return QuestionTypeMap[question.questionType] ?? "MULTIPLE_CHOICE";
  }
  if ('type' in question && question.type) {
    return QuestionTypeMap[question.type] ?? "MULTIPLE_CHOICE";
  }
  return "MULTIPLE_CHOICE";
}

function resolveDifficulty(question: z.infer<typeof QuestionSchema>): QuestionDifficulty {
  const raw = question.difficulty;
  return DifficultyMap[raw] ?? "MEDIUM";
}

function resolveBloomsLevel(question: z.infer<typeof QuestionSchema>): BloomsLevel | null {
  const raw = question.bloomsLevel;
  if (!raw) return null;
  return BloomsMap[raw] ?? null;
}

function resolveOptions(question: z.infer<typeof QuestionSchema>): string[] | undefined {
  return question.options ?? undefined;
}

/** Check if a question is in the unified format (has AI-generated fields) */
function isUnifiedQuestion(
  question: z.infer<typeof QuestionSchema>
): question is z.infer<typeof UnifiedQuestionSchema> {
  return 'questionType' in question;
}

// ============================================================================
// POST - Create Exam
// ============================================================================

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const parseResult = ExamSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: parseResult.error.errors
        },
        { status: 400 }
      );
    }

    const examData = parseResult.data;

    // Verify section ownership
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!section || section.chapter.course.userId !== user.id) {
      return NextResponse.json(
        { error: 'Section not found or access denied' },
        { status: 404 }
      );
    }

    // Create exam with questions in a transaction
    const exam = await db.$transaction(async (tx) => {
      // Create the exam
      const createdExam = await tx.exam.create({
        data: {
          title: examData.title,
          description: examData.description || "",
          timeLimit: examData.timeLimit ? parseInt(examData.timeLimit) : null,
          sectionId: params.sectionId,
          passingScore: examData.passingScore ?? 70,
        }
      });

      // Create questions — supports both legacy and unified formats
      const examQuestions = await Promise.all(
        examData.questions.map((question, index) => {
          const orderIndex = 'orderIndex' in question && typeof question.orderIndex === 'number'
            ? question.orderIndex
            : index;

          return tx.examQuestion.create({
            data: {
              id: crypto.randomUUID(),
              question: question.question,
              questionType: resolveQuestionType(question),
              difficulty: resolveDifficulty(question),
              bloomsLevel: resolveBloomsLevel(question),
              points: question.points,
              order: orderIndex + 1,
              options: resolveOptions(question),
              correctAnswer: question.correctAnswer,
              explanation: question.explanation || null,
              examId: createdExam.id,
              updatedAt: new Date(),
            }
          });
        })
      );

      // Create EnhancedQuestion records for unified questions (preserves all AI data)
      const enhancedQuestions = await Promise.all(
        examData.questions
          .filter(isUnifiedQuestion)
          .map((question, index) => {
            const orderIndex = question.orderIndex ?? index;
            const bloomsLevel = resolveBloomsLevel(question);
            const genMode = question.generationMode
              ? GenerationModeMap[question.generationMode] ?? "MANUAL"
              : "MANUAL";

            return tx.enhancedQuestion.create({
              data: {
                question: question.question,
                questionType: resolveQuestionType(question),
                points: question.points,
                order: orderIndex + 1,
                // Store full options with isCorrect for rich data
                options: question.optionsFull ?? question.options ?? [],
                correctAnswer: question.correctAnswer,
                // Bloom's Taxonomy
                bloomsLevel: bloomsLevel ?? "UNDERSTAND",
                cognitiveSkills: question.cognitiveSkills ?? [],
                // Hints & Explanations
                hint: question.hint ?? null,
                explanation: question.explanation || "No explanation provided.",
                // Metadata
                difficulty: resolveDifficulty(question),
                estimatedTime: question.estimatedTime ?? null,
                relatedConcepts: question.relatedConcepts ?? [],
                generationMode: genMode,
                // Link to exam
                examId: createdExam.id,
              }
            });
          })
      );

      return {
        ...createdExam,
        questions: examQuestions,
        enhancedQuestions,
      };
    });

    return NextResponse.json({
      success: true,
      exam,
      message: `Exam "${examData.title}" created successfully with ${examData.questions.length} questions`
    });

  } catch (error: unknown) {
    logger.error('Exam creation error:', error);
    return safeErrorResponse(error, 500, 'EXAM_CREATE');
  }
}

// ============================================================================
// GET - Fetch Exams
// ============================================================================

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify section ownership
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!section || section.chapter.course.userId !== user.id) {
      return NextResponse.json(
        { error: 'Section not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch exams with both ExamQuestion and EnhancedQuestion records
    const examsRaw = await db.exam.findMany({
      where: {
        sectionId: params.sectionId
      },
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
        _count: {
          select: {
            UserExamAttempt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to match frontend expected format
    const exams = examsRaw.map(exam => ({
      ...exam,
      questions: exam.ExamQuestion || [],
      enhancedQuestions: exam.enhancedQuestions || [],
      totalPoints: exam.ExamQuestion?.reduce((sum, q) => sum + q.points, 0) || 0,
      _count: {
        userAttempts: exam._count?.UserExamAttempt || 0
      }
    }));

    return NextResponse.json({
      success: true,
      exams
    });

  } catch (error: unknown) {
    logger.error('Exam fetch error:', error);
    return safeErrorResponse(error, 500, 'EXAM_FETCH');
  }
}
