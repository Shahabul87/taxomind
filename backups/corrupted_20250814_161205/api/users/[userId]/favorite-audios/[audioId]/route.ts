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
  props: { params: Promise<{ userId: string; audioId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the favorite audio exists and belongs to the current user
    const favoriteAudio = await db.favoriteAudio.findUnique({
      where: {
        id: params.audioId,
      },
    });

    if (!favoriteAudio || favoriteAudio.userId !== user.id) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    // Delete the favorite audio
    const deletedFavoriteAudio = await db.favoriteAudio.delete({
      where: {
        id: params.audioId,
      },
    });

    return NextResponse.json(deletedFavoriteAudio);
  } catch (error: any) {
    logger.error("[DELETE_FAVORITE_AUDIexport const PATCH = withOwnership("
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
  props: { params: Promise<{ userId: string; audioId: string }> }
) {
  const params = await props.params;
  try {
    const { userId, audioId } = params;
    const { title, platform, url, category } = await req.json();

    const audio = await db.favoriteAudio.update({
      where: {
        id: audioId,
        userId: userId,
      },
      data: {
        title,
        platform,
        url,
        category,
      },
    });

    return NextResponse.json(audio);
  } catch (error: any) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
