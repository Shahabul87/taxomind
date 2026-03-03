import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

export async function GET(req: Request, props: { params: Promise<{ videoId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const video = await db.video.findUnique({
      where: {
        id: params.videoId,
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