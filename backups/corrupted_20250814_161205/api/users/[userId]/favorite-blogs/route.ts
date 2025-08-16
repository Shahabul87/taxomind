import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';


export async function POST(req: Request, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { title, platform, url, category } = await req.json();

    if (!user?.id || user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const newFavoriteBlog = await db.favoriteBlog.create({
      data: {
        id: crypto.randomUUID(),
        title,
        platform,
        url,
        category,
        userId: user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(newFavoriteBlog);
  } catch (error: any) {
    logger.error("[FAVORITE BLOG POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

