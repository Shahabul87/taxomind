import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function POST(req: Request, props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    const discussion = await db.groupDiscussion.create({
      data: {
        id: randomUUID(),
        title: values.title,
        content: values.content,
        groupId: params.groupId,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(discussion);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Get all discussions for a group
export async function GET(req: Request, props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const discussions = await db.groupDiscussion.findMany({
      where: {
        groupId: params.groupId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            GroupDiscussionLike: true,
            GroupDiscussionComment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const total = await db.groupDiscussion.count({
      where: {
        groupId: params.groupId,
      },
    });

    return NextResponse.json({
      discussions,
      metadata: {
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    logger.error("[DISCUSSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 
