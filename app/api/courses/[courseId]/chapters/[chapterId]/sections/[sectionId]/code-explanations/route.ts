import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return ApiResponses.unauthorized();
    }

    const { courseId, chapterId, sectionId } = await params;
    const { codeBlocks } = await req.json();

    if (!codeBlocks || !Array.isArray(codeBlocks) || codeBlocks.length === 0) {
      return ApiResponses.badRequest("At least one code block is required");
    }

    // Validate each code block
    for (const block of codeBlocks) {
      // Title is always required
      if (!block.title) {
        return ApiResponses.badRequest("Each code block must have a title");
      }

      // For main code blocks (no groupId): require code
      // For line explanations (has groupId): require explanation
      const isLineExplanation = block.groupId || block.lineStart !== undefined;

      if (!isLineExplanation && !block.code) {
        return ApiResponses.badRequest("Main code blocks must have code");
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
      return ApiResponses.unauthorized();
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
    return ApiResponses.internal();
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
      return ApiResponses.unauthorized();
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
      return ApiResponses.unauthorized();
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

    return ApiResponses.internal();
  }
} 