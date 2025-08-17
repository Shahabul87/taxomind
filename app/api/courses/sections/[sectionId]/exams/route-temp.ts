// Temporary version that works with current database structure
// Use this file if you can't run the database migration yet
// Rename this to "route.ts" to use it temporarily

import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sectionId } = await params;

    if (!sectionId) {
      return new NextResponse("Section ID is required", { status: 400 });
    }

    // Use basic query that works with old schema
    const exams = await db.exam.findMany({
      where: {
        sectionId,
        isPublished: true,
      },
      include: {
        ExamQuestion: {
          select: {
            id: true,
            question: true,
            questionType: true,
            points: true,
            options: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Add default values for missing fields
    const examsWithDefaults = exams.map(exam => ({
      ...exam,
      timeLimit: exam.timeLimit || null,
      attempts: exam.attempts || 1,
      passingScore: exam.passingScore || 70,
      shuffleQuestions: exam.shuffleQuestions || false,
      showResults: exam.showResults !== false,
      isActive: exam.isActive !== false,
      userAttempts: [], // Empty for now
    }));

    return NextResponse.json(examsWithDefaults);
  } catch (error) {
    logger.error("[SECTION_EXAMS_GET_TEMP]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  return new NextResponse("Feature temporarily disabled during migration", { status: 503 });
} 