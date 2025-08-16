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

    // Check if the user owns the course
    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch the chapter to ensure it exists and has the required fields
    const chapterData = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
      }
    });

    if (!chapterData) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      const section = await db.section.findUnique({
        where: {
          id: params.sectionId,
        }
      });
      //console.log(section)

    // Check for the presence of required fields in the chapter
    if (!section || !section.title || !section.videoUrl) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Publish the chapter
    const publishedSection = await db.section.update({
      where: {
        id: params.sectionId,
      },
      data: {
        isPublished: true,
      }
    });

    return new NextResponse(JSON.stringify(publishedSection), { status: 200, headers: {"Content-Type": "application/json"} });
  } catch (error: any) {

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
