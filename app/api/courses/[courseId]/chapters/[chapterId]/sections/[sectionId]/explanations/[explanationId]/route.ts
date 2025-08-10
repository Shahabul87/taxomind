import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { heading, code, explanation } = await req.json();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedExplanation = await db.codeExplanation.update({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      },
      data: {
        heading,
        code,
        explanation,
      }
    });

    return NextResponse.json(updatedExplanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const deletedExplanation = await db.codeExplanation.delete({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(deletedExplanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const explanation = await db.codeExplanation.findUnique({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(explanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 