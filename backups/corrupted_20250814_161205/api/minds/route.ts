import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();
    const { title, description, content, category, visibility, tags, status } = values;

    const mind = await db.mind.create({
      data: {
        id: randomUUID(),
        title,
        description,
        content,
        category,
        visibility,
        status,
        tags,
        userId: session.user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(mind);
  } catch (error: any) {
    logger.error("[MIND_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const visibility = searchParams.get("visibility") || undefined;

    const minds = await db.mind.findMany({
      where: {
        userId: session.user.id,
        ...(status && status !== "all" ? { status } : {}),
        ...(category && category !== "all" ? { category } : {}),
        ...(visibility && visibility !== "all" ? { visibility } : {}),
      },
      include: {
        _count: {
          select: {
            MindLike: true,
            User_MindCollaborators: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(minds);
  } catch (error: any) {
    logger.error("[MINDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 