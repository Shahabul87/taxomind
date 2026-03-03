import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";

// Force Node.js runtime to avoid Edge Runtime issues with bcrypt
export const runtime = 'nodejs';

// GET - Fetch chapters for a course
export async function GET(request: NextRequest, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;

  try {
    const user = await currentUser();

    if (!user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);
    }

    // Check if user is enrolled in the course or is the owner
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: params.courseId,
      },
    });

    const courseOwner = await db.course.findFirst({
      where: {
        id: params.courseId,
        userId: user.id,
      },
    });

    if (!enrollment && !courseOwner) {
      return errorResponse(ErrorCodes.FORBIDDEN, "You must be enrolled in this course to view chapters", HttpStatus.FORBIDDEN);
    }

    const chapters = await db.chapter.findMany({
      where: {
        courseId: params.courseId,
        isPublished: true,
        // Defense-in-depth: exclude chapters still being generated or failed
        OR: [{ status: null }, { status: 'ready' }],
      },
      take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: chapters,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    logger.error("[CHAPTERS_GET] Error:", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch chapters", HttpStatus.INTERNAL_ERROR);
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  
  // Add comprehensive logging for debugging production issues

  try {
    const user = await currentUser();

    const { title, description, position, bloomsLevel } = await request.json();

    if (!user?.id) {

      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    // Check course ownership with detailed logging

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      }
    });

    if (!courseOwner) {

      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get last chapter position with logging

    const lastChapter = await db.chapter.findFirst({
      where: {
        courseId: params.courseId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = position || (lastChapter ? lastChapter.position + 1 : 1);

    // Create chapter with logging

    const chapter = await db.chapter.create({
      data: {
        title,
        description: description || null,
        courseId: params.courseId,
        position: newPosition,
        // Store bloomsLevel in description for now if no dedicated field exists
        // TODO: Add bloomsLevel field to Chapter model if needed
      }
    });

    return NextResponse.json(chapter);
  } catch (error) {
    // Enhanced error logging
    logger.error("[CHAPTERS_CREATE] Error occurred:");
    logger.error("[CHAPTERS_CREATE] Error message:", error instanceof Error ? error.message : "Unknown error");
    logger.error("[CHAPTERS_CREATE] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    logger.error("[CHAPTERS_CREATE] Full error object:", error);
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        logger.error("[CHAPTERS_CREATE] Database connection error detected");
        return new NextResponse("Database connection error", { status: 503 });
      }
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        logger.error("[CHAPTERS_CREATE] Authentication error detected");
        return new NextResponse("Authentication error", { status: 401 });
      }
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}