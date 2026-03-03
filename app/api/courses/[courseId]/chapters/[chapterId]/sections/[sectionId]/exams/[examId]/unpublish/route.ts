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
      }
    });

    if (!exam) {
      return ApiResponses.notFound("Exam not found");
    }

    // Update exam to unpublished
    const unpublishedExam = await db.exam.update({
      where: {
        id: params.examId,
      },
      data: {
        isPublished: false,
      }
    });

    return NextResponse.json(unpublishedExam);
  } catch (error) {

    return ApiResponses.internal();
  }
}