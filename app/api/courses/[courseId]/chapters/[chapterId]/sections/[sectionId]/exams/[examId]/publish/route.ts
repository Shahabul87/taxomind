import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

export async function PATCH(
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
        ExamQuestion: true
      }
    });

    if (!exam) {
      return ApiResponses.notFound("Exam not found");
    }

    // Check if exam has at least one question
    if (!exam.ExamQuestion || exam.ExamQuestion.length === 0) {
      return ApiResponses.badRequest("Exam must have at least one question before publishing");
    }

    // Update exam to published
    const publishedExam = await db.exam.update({
      where: {
        id: params.examId,
      },
      data: {
        isPublished: true,
      }
    });

    return NextResponse.json(publishedExam);
  } catch (error) {

    return ApiResponses.internal();
  }
}