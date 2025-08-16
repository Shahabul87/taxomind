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
    const { title, description, category, visibility, tags, status } = values;

    const idea = await db.idea.create({
      data: {
        id: randomUUID(),
        title,
        description,
        category,
        visibility,
        status,
        tags,
        userId: session.user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(idea);
  } catch (error) {
    logger.error("[IDEA_POST]", error);
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
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const visibility = searchParams.get("visibility");

    const ideas = await db.idea.findMany({
      where: {
        userId: session.user.id,
        ...(status && status !== "all" ? { status } : {}),
        ...(category && category !== "all" ? { category } : {}),
        ...(visibility && visibility !== "all" ? { visibility } : {}),
      },
      include: {
        _count: {
          select: {
            IdeaLike: true,
            IdeaComment: true,
            User_IdeaCollaborators: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(ideas);
  } catch (error) {
    logger.error("[IDEAS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 