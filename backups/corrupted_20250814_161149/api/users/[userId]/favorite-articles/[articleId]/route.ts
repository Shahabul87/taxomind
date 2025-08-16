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
  props: { params: Promise<{ userId: string; articleId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the favorite article exists and belongs to the current user
    const favoriteArticle = await db.favoriteArticle.findUnique({
      where: {
        id: params.articleId,
      },
    });

    if (!favoriteArticle || favoriteArticle.userId !== user.id) {
      return new NextResponse("Unauthorized or Not Found", { status: 404 });
    }

    // Delete the favorite article
    const deletedFavoriteArticle = await db.favoriteArticle.delete({
      where: {
        id: params.articleId,
      },
    });

    return NextResponse.json(deletedFavoriteArticle);
  } catch (error: any) {
    logger.error("[DELETE_FAVORITE_ARTICLexport const PATCH = withOwnership("
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
  props: { params: Promise<{ userId: string; articleId: string }> }
) {
  const params = await props.params;
  try {
    const { userId, articleId } = params;
    const { title, platform, url, category } = await req.json();

    const article = await db.favoriteArticle.update({
      where: {
        id: articleId,
        userId: userId,
      },
      data: {
        title,
        platform,
        url,
        category,
      },
    });

    return NextResponse.json(article);
  } catch (error: any) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
