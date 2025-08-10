import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, sectionId } = await params;
    const { codeBlocks } = await req.json();

    if (!codeBlocks || !Array.isArray(codeBlocks) || codeBlocks.length === 0) {
      return new NextResponse("At least one code block is required", { status: 400 });
    }

    // Validate each code block
    for (const block of codeBlocks) {
      if (!block.code || !block.explanation || !block.title) {
        return new NextResponse("Each code block must have code, explanation, and title", { status: 400 });
      }
    }

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Create code explanations for each block
    const createdExplanations = await Promise.all(
      codeBlocks.map(async (block: any, index: number) => {
        const codeExplanation = await db.codeExplanation.create({
          data: {
            heading: block.title,
            code: block.code,
            explanation: block.explanation,
            sectionId: sectionId,
            language: block.language || 'typescript',
            order: block.order || index,
          },
        });
        return codeExplanation;
      })
    );

    return NextResponse.json(createdExplanations);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId, chapterId, sectionId } = await params;

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all code explanations for this section
    const codeExplanations = await db.codeExplanation.findMany({
      where: {
        sectionId: sectionId,
      },
      orderBy: [
        {
          order: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return NextResponse.json(codeExplanations);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 