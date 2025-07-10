import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

// POST endpoint to start a new exam attempt
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ sectionId: string; examId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch exam to verify it exists and is published
    const exam = await db.exam.findUnique({
      where: {
        id: params.examId,
        sectionId: params.sectionId,
        isPublished: true,
      },
      include: {
        userAttempts: {
          where: {
            userId: user.id
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found or not published' },
        { status: 404 }
      );
    }

    // Check if user has exceeded max attempts
    const maxAttempts = exam.attempts || 3;
    if (exam.userAttempts.length >= maxAttempts) {
      return NextResponse.json(
        { error: `Maximum attempts (${maxAttempts}) reached for this exam` },
        { status: 400 }
      );
    }

    // Check if user has an in-progress attempt
    const inProgressAttempt = exam.userAttempts.find(
      attempt => attempt.status === 'IN_PROGRESS'
    );

    if (inProgressAttempt) {
      return NextResponse.json(
        { error: 'You already have an in-progress attempt for this exam' },
        { status: 400 }
      );
    }

    // Get question count for this exam
    const questionCount = await db.examQuestion.count({
      where: {
        examId: params.examId
      }
    });

    // Create new attempt
    const newAttempt = await db.userExamAttempt.create({
      data: {
        userId: user.id,
        examId: params.examId,
        attemptNumber: exam.userAttempts.length + 1,
        totalQuestions: questionCount,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: {
                order: 'asc'
              },
              select: {
                id: true,
                question: true,
                questionType: true,
                options: true,
                points: true,
                order: true,
                imageUrl: true,
                videoUrl: true,
                // Don't include correct answers for security
              }
            }
          }
        }
      }
    });

    return NextResponse.json(newAttempt);

  } catch (error: any) {
    console.error('Exam attempt creation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch exam attempts
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ sectionId: string; examId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch attempts for this user and exam
    const attempts = await db.userExamAttempt.findMany({
      where: {
        userId: user.id,
        examId: params.examId,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            description: true,
            timeLimit: true,
            passingScore: true,
            questions: {
              orderBy: {
                order: 'asc'
              },
              select: {
                id: true,
                question: true,
                questionType: true,
                options: true,
                points: true,
                order: true,
                imageUrl: true,
                videoUrl: true,
                correctAnswer: true, // Include for completed attempts
                explanation: true,
              }
            }
          }
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                questionType: true,
                points: true,
                correctAnswer: true,
                explanation: true,
              }
            }
          }
        }
      },
      orderBy: {
        attemptNumber: 'desc'
      }
    });

    return NextResponse.json(attempts);

  } catch (error: any) {
    console.error('Exam attempts fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}