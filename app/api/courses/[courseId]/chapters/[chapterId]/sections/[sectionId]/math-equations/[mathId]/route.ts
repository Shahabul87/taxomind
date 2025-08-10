import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; mathId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { title, equation, explanation, imageUrl, content, mode } = await req.json();

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

    // Prepare the data based on mode
    let contentData;
    let equationData;
    let imageUrlData;
    
    if (mode === "visual") {
      contentData = content || explanation || "";
      equationData = null;
      imageUrlData = imageUrl || "";
    } else {
      equationData = equation || "";
      contentData = explanation || "";
      imageUrlData = null;
    }

    const updatedMathExplanation = await db.mathExplanation.update({
      where: {
        id: params.mathId,
        sectionId: params.sectionId,
      },
      data: {
        title: title,
        content: contentData,
        latex: equationData, // Keep backward compatibility
        equation: equationData,
        imageUrl: imageUrlData,
        mode: mode || "equation",
      }
    });

    return NextResponse.json(updatedMathExplanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; mathId: string }> }
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

    const deletedMathExplanation = await db.mathExplanation.delete({
      where: {
        id: params.mathId,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(deletedMathExplanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; mathId: string }> }
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

    const mathExplanation = await db.mathExplanation.findUnique({
      where: {
        id: params.mathId,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(mathExplanation);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 