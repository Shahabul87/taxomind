import { z } from "zod";

import { currentUser } from "@/lib/auth";
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

export async function PUT(req: Request, props: { params: Promise<{ courseId: string; }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    const userId = user.id;
    const body = await req.json();
    const { list } = reorderSchema.parse(body);

    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId
      }
    });

    if (!ownCourse) {
      return ApiResponses.unauthorized();
    }

    await db.$transaction(
      list.map((item) =>
        db.chapter.update({
          where: { id: item.id, courseId: params.courseId },
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