import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function POST(
  req: Request,
  props: { params: Promise<{ groupId: string; discussionId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has already liked the discussion
    const existingLike = await db.groupDiscussionLike.findUnique({
      where: {
        discussionId_userId: {
          discussionId: params.discussionId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike if already liked
      await db.groupDiscussionLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      await db.groupDiscussion.update({
        where: {
          id: params.discussionId,
        },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      return NextResponse.json({ liked: false });
    }

    // Create new like
    await db.groupDiscussionLike.create({
      data: {
        id: crypto.randomUUID(),
        discussionId: params.discussionId,
        userId: session.user.id,
      },
    });

    await db.groupDiscussion.update({
      where: {
        id: params.discussionId,
      },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ liked: true });
  } catch (error: any) {
    logger.error("[DISCUSSION_LIKE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 