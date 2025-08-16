import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    const post = await db.post.findUnique({
      where: {
        id: params.postId,
        userId,
      },
      include: {
        PostChapterSection: true,
      }
    });

    if (!post) {
      return new NextResponse("Not found", { status: 404 });
    }

    const hasPublishedChapter = post.postchapter.some((chapter) => chapter.isPublished);

    if (!post.title || !post.description || !post.imageUrl || !post.category || !hasPublishedChapter) {
      return new NextResponse("Missing required fields", { status: 401 });
    }

    const publishedPost = await db.post.update({
      where: {
        id: params.postId,
        userId,
      },
      data: {
        published: true,
      }
    });

    return NextResponse.json(publishedPost);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}
