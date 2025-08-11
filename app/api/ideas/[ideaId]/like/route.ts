import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function POST(req: Request, props: { params: Promise<{ ideaId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingLike = await db.ideaLike.findUnique({
      where: {
        ideaId_userId: {
          ideaId: params.ideaId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      await db.ideaLike.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      await db.ideaLike.create({
        data: {
          id: randomUUID(),
          ideaId: params.ideaId,
          userId: session.user.id,
        },
      });
    }

    // Update idea likes count
    const likesCount = await db.ideaLike.count({
      where: {
        ideaId: params.ideaId,
      },
    });

    await db.idea.update({
      where: {
        id: params.ideaId,
      },
      data: {
        likes: likesCount,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[IDEA_LIKE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 