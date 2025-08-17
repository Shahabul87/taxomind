import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
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

    // Unpublish the section
    const section = await db.section.update({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      data: {
        isPublished: false,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    logger.error("[SECTION_UNPUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 