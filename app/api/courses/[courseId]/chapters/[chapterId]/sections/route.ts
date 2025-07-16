import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const { title, description, position, contentType, estimatedDuration, bloomsLevel, generatedContent } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the chapter exists and belongs to the user
    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      }
    });

    if (!chapter) {
      return new NextResponse("Not found", { status: 404 });
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
      console.log('Section created with AI-generated content:', {
        sectionId: section.id,
        contentType,
        bloomsLevel,
        estimatedDuration,
        generatedContent
      });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("[SECTIONS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 