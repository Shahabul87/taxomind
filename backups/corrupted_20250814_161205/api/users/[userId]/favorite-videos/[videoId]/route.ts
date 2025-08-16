import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
export const DELETE = withOwnership(
  async (request, context, params) => {
    
  },
  async (request, params) => params?.userId, // Extract userId for ownership check
  {
    rateLimit: { requests: 20, window: 60000 },
    auditLog: true
  }
); from '@/lib/api/with-api-auth';

export async function DELETE(
  req: Request,
  props: { params: Promise<{ userId: string; videoId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the favorite video exists and belongs to the current user
    const favoriteVideo = await db.favoriteVideo.findUnique({
      where: {
        id: params.videoId,
      },
    });

    if (!favoriteVideo || favoriteVideo.userId !== user.id) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    // Delete the favorite video
    const deletedFavoriteVideo = await db.favoriteVideo.delete({
      where: {
        id: params.videoId,
      },
    });

    return NextResponse.json(deletedFavoriteVideo);
  } catch (error: any) {
    logger.error("[DELETE_FAVORITE_VIDEexport const PATCH = withOwnership("
  async (request, context, params) => {
    
  },
  async (request, params) => params?.userId, // Extract userId for ownership check
  {
    rateLimit: { requests: 20, window: 60000 },
    auditLog: true
  }
););
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ userId: string; videoId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { title, platform, url, category } = await req.json();

    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedVideo = await db.favoriteVideo.update({
      where: {
        id: params.videoId,
        userId: params.userId,
      },
      data: {
        title,
        platform,
        url,
        category,
      },
    });

    return NextResponse.json(updatedVideo);
  } catch (error: any) {
    logger.error("[FAVORITE VIDEO UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
