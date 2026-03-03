import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

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
      return ApiResponses.unauthorized();
    }

    // Verify ownership
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return ApiResponses.notFound();
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
  } catch (error) {
    logger.error("[SECTION_PUBLISH]", error);
    return ApiResponses.internal();
  }
} 