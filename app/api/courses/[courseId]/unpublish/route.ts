import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();

    if (!user?.id) {
        return ApiResponses.unauthorized();
      }

    const userId = user?.id;

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!course) {
      return ApiResponses.notFound();
    }

    const unpublishedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId,
      },
      data: {
        isPublished: false,
      }
    });

    return NextResponse.json(unpublishedCourse);
  } catch (error) {

    return ApiResponses.internal();
  }
}