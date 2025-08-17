import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

// GET endpoint to fetch exams for a section (student view)
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch exams for the section with user attempts
    const exams = await db.exam.findMany({
      where: {
        sectionId: params.sectionId,
        isPublished: true, // Only show published exams to students
      },
      include: {
        ExamQuestion: {
          orderBy: {
            order: 'asc'
          },
          select: {
            id: true,
            question: true,
            questionType: true,
            points: true,
            order: true,
            // Don't include correct answers for security
          }
        },
        UserExamAttempt: {
          where: {
            userId: user.id
          },
          orderBy: {
            attemptNumber: 'desc'
          },
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            startedAt: true,
            submittedAt: true,
            timeSpent: true,
            scorePercentage: true,
            isPassed: true,
            correctAnswers: true,
            totalQuestions: true,
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

    // Transform to match expected interface
    const transformedExams = exams.map(exam => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      timeLimit: exam.timeLimit,
      attempts: exam.attempts || 3, // Default max attempts
      passingScore: exam.passingScore,
      questions: exam.ExamQuestion,
      userAttempts: exam.UserExamAttempt,
    }));

    return NextResponse.json(transformedExams);

  } catch (error: any) {
    logger.error('Student exam fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}