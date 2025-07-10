import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; examId: string }> }
) {
  try {
    const params = await props.params;
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify ownership of the course
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if exam exists and belongs to the section
    const exam = await db.exam.findUnique({
      where: {
        id: params.examId,
        sectionId: params.sectionId,
      }
    });

    if (!exam) {
      return new NextResponse("Exam not found", { status: 404 });
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
    console.log("[EXAM_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}