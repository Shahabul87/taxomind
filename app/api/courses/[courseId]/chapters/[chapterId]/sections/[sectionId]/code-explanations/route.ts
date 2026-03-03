import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

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
      // Title is always required
      if (!block.title) {
        return new NextResponse("Each code block must have a title", { status: 400 });
      }

      // For main code blocks (no groupId): require code
      // For line explanations (has groupId): require explanation
      const isLineExplanation = block.groupId || block.lineStart !== undefined;

      if (!isLineExplanation && !block.code) {
        return new NextResponse("Main code blocks must have code", { status: 400 });
      }

      // Note: explanation text is optional - teachers can add it later
    }

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

    // Create code explanations for each block
    const createdExplanations = await Promise.all(
      codeBlocks.map(async (block: {
        title: string;
        code?: string;
        explanation?: string;
        language?: string;
        position?: number;
        lineStart?: number;
        lineEnd?: number;
        groupId?: string;
      }, index: number) => {
        return await db.codeExplanation.create({
          data: {
            title: block.title,
            code: block.code || "", // Default to empty string for line explanations
            explanation: block.explanation || null,
            sectionId,
            language: block.language || "typescript",
            position: block.position ?? index,
            lineStart: block.lineStart ?? null,
            lineEnd: block.lineEnd ?? null,
            groupId: block.groupId ?? null,
          },
        });
      })
    );

    return NextResponse.json(createdExplanations);
  } catch (error) {
    logger.error("[CODE_EXPLANATIONS_POST]", error);
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
        userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all code explanations for this section
    const codeExplanations = await db.codeExplanation.findMany({
      where: {
        sectionId,
      },
      take: 200,
      orderBy: [
        {
          position: "asc",
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