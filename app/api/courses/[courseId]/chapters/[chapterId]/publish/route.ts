import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ownCourse = await db.course.findUnique({
      where: { id: params.courseId, userId: user.id },
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chapter = await db.chapter.findUnique({
      where: { id: params.chapterId },
      include: {
        sections: true
      }
    });

    // Check only basic required fields
    // NOTE: We intentionally don't require sections to be published, allowing instructors
    // to publish chapters directly without having to first publish individual sections
    if (!chapter || !chapter.title || !chapter.description || !chapter.learningOutcomes) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const updatedChapter = await db.chapter.update({
      where: { id: params.chapterId },
      data: { isPublished: !chapter.isPublished },  // Toggle isPublished based on current status
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
