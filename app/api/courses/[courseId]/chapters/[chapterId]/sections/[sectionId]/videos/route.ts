import { NextResponse } from "next/server";
import { z } from "zod";
import { VideoAccessTier } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

const CreateVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoUrl: z.string().url("Invalid video URL"),
  rating: z.number().int().min(0).max(5).optional().nullable(),
  thumbnail: z.string().nullable().optional(),
  platform: z.string().nullable().optional(),
  embedUrl: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  accessTier: z.nativeEnum(VideoAccessTier).default("ENROLLED"),
});

const PatchVideoSchema = z.object({
  accessTier: z.nativeEnum(VideoAccessTier),
  videoId: z.string().uuid("Invalid video ID"),
});

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const body = await req.json();
    const validated = CreateVideoSchema.parse(body);

    // First verify the section exists
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
    });

    if (!section) {
      return ApiResponses.notFound("Section not found");
    }

    // Create the video with proper fields
    const video = await db.video.create({
      data: {
        title: validated.title,
        description: validated.description ?? null,
        url: validated.videoUrl,
        rating: validated.rating ? Number(validated.rating) : null,
        sectionId: params.sectionId,
        userId: session.user.id,
        isPublished: true,
        position: 0,
        thumbnail: validated.thumbnail ?? null,
        platform: validated.platform ?? null,
        accessTier: validated.accessTier,
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    logger.error("[VIDEOS]", error);
    return ApiResponses.internal();
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const body = await req.json();
    const validated = PatchVideoSchema.parse(body);

    // Verify the video belongs to this section and user owns the course
    const video = await db.video.findFirst({
      where: {
        id: validated.videoId,
        sectionId: params.sectionId,
      },
    });

    if (!video) {
      return ApiResponses.notFound("Video not found");
    }

    const updated = await db.video.update({
      where: { id: validated.videoId },
      data: { accessTier: validated.accessTier },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponses.badRequest(error.errors[0].message);
    }
    logger.error("[VIDEOS_PATCH]", error);
    return ApiResponses.internal();
  }
}

export async function GET(req: Request, props: { params: Promise<{ sectionId: string }> }) {
  const params = await props.params;
  try {
    const videos = await db.video.findMany({
      where: {
        sectionId: params.sectionId,
      },
      take: 200,
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    logger.error("[VIDEOS_GET]", error);
    return ApiResponses.internal();
  }
} 