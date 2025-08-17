import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PUT(req: Request, props: { params: Promise<{ courseId: string; chapterId: string; }> }) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    const { list } = await req.json();

    // Verify the chapter exists and belongs to the user
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

    // Update the positions of all sections in the list
    for (const item of list) {
      await db.section.update({
        where: { id: item.id },
        data: { position: item.position }
      });
    }

    return new NextResponse("Success", { status: 200 });
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 }); 
  }
} 