import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ postId?: string; postchapterId?: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Ensure both postId and postchapterId are defined
    if (!params.postId || !params.postchapterId) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    // Verify that the post exists and belongs to the user
    const post = await db.post.findUnique({
      where: { id: params.postId, userId: user.id },
      include: { PostChapterSection: true },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Verify that the specific post chapter exists
    const postChapter = await db.postChapterSection.findUnique({
      where: { id: params.postchapterId },
    });

    if (!postChapter) {
      return new NextResponse("Post chapter not found", { status: 404 });
    }

    // Unpublish the post chapter by setting isPublished to false
    const updatedPostChapter = await db.postChapterSection.update({
      where: { id: params.postchapterId },
      data: { isPublished: false },
    });

    return NextResponse.json(updatedPostChapter);
  } catch (error: any) {
    logger.error("[POSTCHAPTER_ID_UNPUBLISH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
