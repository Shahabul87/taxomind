import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";

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
      return new NextResponse("Unauthorized", { status: 401 });
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the chapter exists and belongs to the course
    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      }
    });

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
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

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid input", { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
} 