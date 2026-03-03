import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

const reorderSchema = z.object({
  list: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().min(0),
    })
  ).max(200),
});

export async function PUT(req: Request, props: { params: Promise<{ courseId: string; chapterId: string; }> }) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const userId = session.user.id;
    const body = await req.json();
    const { list } = reorderSchema.parse(body);

    // Verify the course belongs to the user
    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId
      }
    });

    if (!ownCourse) {
      return ApiResponses.unauthorized();
    }

    // Verify the chapter exists and belongs to the course
    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      }
    });

    if (!chapter) {
      return ApiResponses.notFound("Chapter not found");
    }

    // Update positions - scoped to chapterId to prevent IDOR
    await db.$transaction(
      list.map((item) =>
        db.section.update({
          where: { id: item.id, chapterId: params.chapterId },
          data: { position: item.position },
        })
      )
    );

    return ApiResponses.ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest("Invalid input");
    }
    return ApiResponses.internal();
  }
} 