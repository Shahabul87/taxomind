import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    const { title, description, videoUrl, rating } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First verify the section exists
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
    });

    if (!section) {
      return new NextResponse("Section not found", { status: 404 });
    }

    // Create the video with proper fields
    const video = await db.video.create({
      data: {
        title,
        description,
        url: videoUrl,
        rating: Number(rating),
        sectionId: params.sectionId,
        userId: session.user.id,
        isPublished: true,
        position: 0,
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    logger.error("[VIDEOS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request, props: { params: Promise<{ sectionId: string }> }) {
  const params = await props.params;
  try {
    const videos = await db.video.findMany({
      where: {
        sectionId: params.sectionId,
      },
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    logger.error("[VIDEOS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 