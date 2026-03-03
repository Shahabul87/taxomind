import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; examId: string }> }
) {
  try {
    const params = await props.params;
    const user = await currentUser();

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    // Verify ownership of the course
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    // Check if exam exists and belongs to the section
    const exam = await db.exam.findUnique({
      where: {
        id: params.examId,
        sectionId: params.sectionId,
      },
      include: {
        ExamQuestion: true,
        UserExamAttempt: true
      }
    });

    if (!exam) {
      return ApiResponses.notFound("Exam not found");
    }

    // Prevent deletion if exam has user attempts
    if (exam.UserExamAttempt && exam.UserExamAttempt.length > 0) {
      return ApiResponses.badRequest("Cannot delete exam with existing user attempts");
    }

    // Delete exam and its questions in a transaction
    await db.$transaction(async (tx) => {
      // Delete all exam questions first
      await tx.examQuestion.deleteMany({
        where: {
          examId: params.examId
        }
      });

      // Delete the exam
      await tx.exam.delete({
        where: {
          id: params.examId
        }
      });
    });

    return NextResponse.json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {

    return ApiResponses.internal();
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; examId: string }> }
) {
  try {
    const params = await props.params;
    const user = await currentUser();

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    // Verify ownership of the course
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    // Get exam with questions
    const exam = await db.exam.findUnique({
      where: {
        id: params.examId,
        sectionId: params.sectionId,
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
      }
    });

    if (!exam) {
      return ApiResponses.notFound("Exam not found");
    }

    return NextResponse.json({ success: true, exam });
  } catch (error) {

    return ApiResponses.internal();
  }
}