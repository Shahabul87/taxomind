import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';

export async function GET(req: Request, props: { params: Promise<{ videoId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const video = await db.video.findUnique({
      where: {
        id: params.videoId,
      },
    });

    if (!video) {
      return new NextResponse("Video not found", { status: 404 });
    }

    return NextResponse.json(video);
  } catch (error: any) {
    logger.error("[VIDEO_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 