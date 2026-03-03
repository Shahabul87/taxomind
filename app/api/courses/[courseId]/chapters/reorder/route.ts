import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
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

export async function PUT(req: Request, props: { params: Promise<{ courseId: string; }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.$transaction(
      list.map((item) =>
        db.chapter.update({
          where: { id: item.id, courseId: params.courseId },
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