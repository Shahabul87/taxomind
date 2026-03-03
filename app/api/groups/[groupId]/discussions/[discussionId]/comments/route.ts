import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

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

    const values = await req.json();
    const validatedFields = createCommentSchema.safeParse(values);

    if (!validatedFields.success) {
      return new NextResponse("Invalid fields", { status: 400 });
    }

    const comment = await db.groupDiscussionComment.create({
      data: {
        id: randomUUID(),
        content: validatedFields.data.content,
        authorId: session.user.id,
        discussionId: params.discussionId,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    await db.groupDiscussion.update({
      where: {
        id: params.discussionId,
      },
      data: {
        commentsCount: {
          increment: 1
        }
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    logger.error("[DISCUSSION_COMMENT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ groupId: string; discussionId: string }> }
) {
  const params = await props.params;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10), 100);
    const skip = (page - 1) * limit;

    const comments = await db.groupDiscussionComment.findMany({
      where: {
        discussionId: params.discussionId,
      },
      include: {
        User: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await db.groupDiscussionComment.count({
      where: {
        discussionId: params.discussionId,
      },
    });

    return NextResponse.json({
      comments,
      metadata: {
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    logger.error("[DISCUSSION_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
