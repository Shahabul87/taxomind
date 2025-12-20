/**
 * Protected Video Access API
 *
 * Returns YouTube video ID only if user is authorized to view the content.
 * Authorization is based on:
 * 1. Free content (section/chapter/course is free)
 * 2. User is enrolled in the course
 * 3. User is the course instructor
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getProtectedVideoUrl } from "@/lib/premium";

interface RouteParams {
  params: Promise<{
    courseId: string;
    sectionId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await currentUser();
    const { courseId, sectionId } = await params;

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Please log in to access this content",
          },
        },
        { status: 401 }
      );
    }

    const result = await getProtectedVideoUrl(user.id, sectionId);

    if (!result.accessResult.canAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.accessResult.requiresPurchase
              ? "ENROLLMENT_REQUIRED"
              : "ACCESS_DENIED",
            message: result.accessResult.reason,
          },
          requiresPurchase: result.accessResult.requiresPurchase,
          courseId,
        },
        { status: 403 }
      );
    }

    if (!result.youtubeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_VIDEO",
            message: "No video available for this section",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        youtubeId: result.youtubeId,
        isFreeContent: result.accessResult.isFreeContent,
      },
    });
  } catch (error) {
    console.error("[PROTECTED_VIDEO_API]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load video",
        },
      },
      { status: 500 }
    );
  }
}
