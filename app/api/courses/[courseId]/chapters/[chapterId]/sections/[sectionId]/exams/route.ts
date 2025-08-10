import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

// Enum mappings for database
const QuestionTypeMap = {
  "multiple-choice": "MULTIPLE_CHOICE",
  "true-false": "TRUE_FALSE", 
  "short-answer": "SHORT_ANSWER"
} as const;

const DifficultyMap = {
  "easy": "EASY",
  "medium": "MEDIUM",
  "hard": "HARD"
} as const;

const BloomsMap = {
  "remember": "REMEMBER",
  "understand": "UNDERSTAND", 
  "apply": "APPLY",
  "analyze": "ANALYZE",
  "evaluate": "EVALUATE",
  "create": "CREATE"
} as const;

// Validation schemas
const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple-choice", "true-false", "short-answer"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  bloomsLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional(),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  points: z.number().min(0)
});

const ExamSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  timeLimit: z.string().optional(),
  questions: z.array(QuestionSchema),
  totalPoints: z.number().min(0)
});

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
          passingScore: 70, // Default passing score
        }
      });

      // Create questions
      const questions = await Promise.all(
        examData.questions.map((question, index) => 
          tx.examQuestion.create({
            data: {
              id: crypto.randomUUID(),
              question: question.question,
              questionType: QuestionTypeMap[question.type],
              difficulty: DifficultyMap[question.difficulty],
              bloomsLevel: question.bloomsLevel ? BloomsMap[question.bloomsLevel] : null,
              points: question.points,
              order: index + 1,
              options: question.options || undefined,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation || null,
              examId: createdExam.id,
              updatedAt: new Date(),
            }
          })
        )
      );

      return {
        ...createdExam,
        questions
      };
    });

    return NextResponse.json({
      success: true,
      exam,
      message: `Exam "${examData.title}" created successfully with ${examData.questions.length} questions`
    });

  } catch (error: any) {
    logger.error('Exam creation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch exams for a section
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

    // Fetch exams with questions
    const exams = await db.exam.findMany({
      where: {
        sectionId: params.sectionId
      },
      include: {
        ExamQuestion: {
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

    return NextResponse.json({
      success: true,
      exams
    });

  } catch (error: any) {
    logger.error('Exam fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}