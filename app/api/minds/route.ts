import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
import { z } from "zod";
import { successResponse, apiErrors } from "@/lib/utils/api-response";

const CreateMindSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  content: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  visibility: z.string().max(50).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  status: z.string().max(50).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    const values = await req.json();
    const result = CreateMindSchema.safeParse(values);

    if (!result.success) {
      return apiErrors.validationError({ errors: result.error.flatten().fieldErrors });
    }

    const { title, description, content, category, visibility, tags, status } = result.data;

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

    return successResponse(mind);
  } catch (error) {
    logger.error("[MIND_POST]", error);
    return apiErrors.internal();
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const visibility = searchParams.get("visibility");

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
      take: 50,
    });

    return successResponse(minds);
  } catch (error) {
    logger.error("[MINDS_GET]", error);
    return apiErrors.internal();
  }
}