import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    courseId: string;
    chapterId: string;
    sectionId: string;
    videoId: string;
  }>;
};

export async function DELETE(req: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    // Verify the section exists and belongs to the course/chapter
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
      include: {
        chapter: {
          select: {
            id: true,
            courseId: true,
            course: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      return ApiResponses.notFound("Section not found");
    }

    // Check if user is the course owner
    if (section.chapter.course.userId !== session.user.id) {
      return ApiResponses.unauthorized();
    }

    // Verify the video exists and belongs to the section
    const video = await db.video.findUnique({
      where: {
        id: params.videoId,
        sectionId: params.sectionId,
      },
    });

    if (!video) {
      return ApiResponses.notFound("Video not found");
    }

    // Delete the video
    await db.video.delete({
      where: {
        id: params.videoId,
      },
    });

    return NextResponse.json({ success: true, message: "Video deleted" });
  } catch (error) {
    logger.error("[VIDEO_DELETE]", error);
    return ApiResponses.internal();
  }
}

export async function GET(req: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const video = await db.video.findUnique({
      where: {
        id: params.videoId,
        sectionId: params.sectionId,
      },
    });

    if (!video) {
      return ApiResponses.notFound("Video not found");
    }

    return NextResponse.json(video);
  } catch (error) {
    logger.error("[VIDEO_GET]", error);
    return ApiResponses.internal();
  }
}

export async function PATCH(req: Request, props: RouteParams) {
  const params = await props.params;
  try {
    const session = await auth();
    const body = await req.json();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    // Verify the section exists and get course owner info
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
      include: {
        chapter: {
          select: {
            course: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      return ApiResponses.notFound("Section not found");
    }

    // Check if user is the course owner
    if (section.chapter.course.userId !== session.user.id) {
      return ApiResponses.unauthorized();
    }

    // Update the video
    const video = await db.video.update({
      where: {
        id: params.videoId,
        sectionId: params.sectionId,
      },
      data: {
        title: body.title,
        description: body.description,
        url: body.videoUrl || body.url,
        rating: body.rating ? Number(body.rating) : null,
        thumbnail: body.thumbnail || null,
        platform: body.platform || null,
        isPublished: body.isPublished ?? true,
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    logger.error("[VIDEO_PATCH]", error);
    return ApiResponses.internal();
  }
}
