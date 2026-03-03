import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

interface LineExplanation {
  id: string;
  title: string;
  explanation: string;
  lineStart: number;
  lineEnd: number;
  position: number;
}

interface CodeExplanationGroup {
  id: string;
  title: string;
  code: string;
  language: string;
  sectionId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  explanations: LineExplanation[];
}

/**
 * GET /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-explanations/grouped
 *
 * Returns code explanations grouped by main code blocks.
 * Main blocks have groupId = null and lineStart = null.
 * Line explanations have groupId pointing to their parent block.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const { courseId, sectionId } = await params;

    // Verify course ownership
    const courseOwner = await db.course.findUnique({
      where: {
        id: courseId,
        userId,
      },
    });

    if (!courseOwner) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Get all code explanations for this section
    const allRecords = await db.codeExplanation.findMany({
      where: {
        sectionId,
      },
      take: 200,
      orderBy: [
        { position: "asc" },
        { createdAt: "asc" },
      ],
    });

    // Separate main blocks from line explanations
    // Main blocks: groupId is null AND lineStart is null
    const mainBlocks = allRecords.filter(
      (r) => r.groupId === null && r.lineStart === null
    );

    // Line explanations: have groupId OR have lineStart
    const lineExplanations = allRecords.filter(
      (r) => r.groupId !== null || r.lineStart !== null
    );

    // Group explanations by their parent block
    const groupedData: CodeExplanationGroup[] = mainBlocks.map((block) => ({
      id: block.id,
      title: block.title,
      code: block.code,
      language: block.language,
      sectionId: block.sectionId,
      isPublished: block.isPublished,
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
      explanations: lineExplanations
        .filter((exp) => exp.groupId === block.id)
        .map((exp) => ({
          id: exp.id,
          title: exp.title,
          explanation: exp.explanation || "",
          lineStart: exp.lineStart || 1,
          lineEnd: exp.lineEnd || 1,
          position: exp.position,
        }))
        .sort((a, b) => a.position - b.position),
    }));

    return NextResponse.json({
      success: true,
      data: groupedData,
    });
  } catch (error) {
    logger.error("[CODE_EXPLANATIONS_GROUPED_GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal Error" } },
      { status: 500 }
    );
  }
}
