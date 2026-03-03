import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

const sectionCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  position: z.number().int().min(0).optional(),
  contentType: z.string().optional(),
  estimatedDuration: z.string().optional(),
  bloomsLevel: z.string().optional(),
  generatedContent: z.any().optional(),
});

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const body = await req.json();
    const parsed = sectionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.errors },
        { status: 400 }
      );
    }
    const { title, description, position, contentType, estimatedDuration, bloomsLevel, generatedContent } = parsed.data;

    // Verify course ownership
    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: { userId: true },
    });

    if (!course) {
      return ApiResponses.notFound("Course not found");
    }

    if (course.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not own this course' } },
        { status: 403 }
      );
    }

    // Verify the chapter exists and belongs to the course
    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      }
    });

    if (!chapter) {
      return ApiResponses.notFound("Chapter not found");
    }

    // Get the position for the new section
    const lastSection = await db.section.findFirst({
      where: {
        chapterId: params.chapterId,
      },
      orderBy: {
        position: 'desc',
      },
    });

    const newPosition = position !== undefined ? position : (lastSection ? lastSection.position + 1 : 0);

    // Convert duration string to minutes (integer) if provided
    let durationInMinutes = null;
    if (estimatedDuration) {
      // Extract numbers from duration string like "15-20 minutes"
      const match = estimatedDuration.match(/(\d+)/);
      if (match) {
        durationInMinutes = parseInt(match[1]);
      }
    }

    // Create the section
    const section = await db.section.create({
      data: {
        title,
        chapterId: params.chapterId,
        position: newPosition,
        type: contentType || null,
        duration: durationInMinutes,
        // Store AI-generated metadata using existing fields
      },
    });

    // If there's generated content, we could store it in a separate table or in the description
    // For now, log it for development purposes
    if (generatedContent) {
}
    return NextResponse.json(section);
  } catch (error) {
    logger.error("[SECTIONS]", error);
    return ApiResponses.internal();
  }
} 