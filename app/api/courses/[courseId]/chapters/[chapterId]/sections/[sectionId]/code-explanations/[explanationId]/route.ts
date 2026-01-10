import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, sectionId, explanationId } = await params;
    const { title, code, explanation, language, position, lineStart, lineEnd } = await req.json();

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Prepare update data with explicit field mapping (prevents mass assignment)
    const updateData: Record<string, string | number | null> = {};
    if (title !== undefined) updateData.title = title;
    if (code !== undefined) updateData.code = code;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (language !== undefined) updateData.language = language;
    if (position !== undefined) updateData.position = position;
    if (lineStart !== undefined) updateData.lineStart = lineStart;
    if (lineEnd !== undefined) updateData.lineEnd = lineEnd;

    // Update code explanation
    const codeExplanation = await db.codeExplanation.update({
      where: {
        id: explanationId,
        sectionId,
      },
      data: updateData,
    });

    return NextResponse.json(codeExplanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, sectionId, explanationId } = await params;

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete code explanation
    const codeExplanation = await db.codeExplanation.delete({
      where: {
        id: explanationId,
        sectionId,
      },
    });

    return NextResponse.json(codeExplanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, sectionId, explanationId } = await params;

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get specific code explanation
    const codeExplanation = await db.codeExplanation.findUnique({
      where: {
        id: explanationId,
        sectionId,
      },
    });

    if (!codeExplanation) {
      return new NextResponse("Code explanation not found", { status: 404 });
    }

    return NextResponse.json(codeExplanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 