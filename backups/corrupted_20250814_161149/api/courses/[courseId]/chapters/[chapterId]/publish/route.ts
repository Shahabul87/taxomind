import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, withAdminAuth, withOwnership, withPublicAexport const PATCH = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});> }
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
    // NOTE: We intentionally don't require sections to be published, allowing instructors'
    // to publish chapters directly without having to first publish individual sections
    if (!chapter || !chapter.title || !chapter.description || !chapter.learningOutcomes) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const updatedChapter = await db.chapter.update({
      where: { id: params.chapterId },
      data: { isPublished: !chapter.isPublished },  // Toggle isPublished based on current status
    });

    return NextResponse.json(updatedChapter);
  } catch (error: any) {

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
