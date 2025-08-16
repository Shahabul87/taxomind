import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAexport const PATCH = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify ownership
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Publish the section
    const section = await db.section.update({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      data: {
        isPublished: true,
      },
    });

    return NextResponse.json(section);
  } catch (error: any) {
    logger.error("[SECTION_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 