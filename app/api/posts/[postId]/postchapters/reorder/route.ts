import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { safeErrorResponse } from '@/lib/api/safe-error';
import { z } from 'zod';

const ReorderBodySchema = z.object({
  list: z.array(
    z.object({
      id: z.string(),
      position: z.number(),
    })
  ).min(1, 'List must be a non-empty array'),
});

export async function PUT(req: Request, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;
  try {
    // Ensure the user is authenticated
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = user.id;

    // Parse request body and validate with Zod
    const body = await req.json();
    const validationResult = ReorderBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    const { list } = validationResult.data;

    // Verify the post belongs to the current user
    const post = await db.post.findFirst({
      where: {
        id: params.postId,
        userId: userId,
      },
    });
    if (!post) {
      return new NextResponse("Unauthorized or post not found", { status: 404 });
    }

    // Perform the updates in a transaction
    const updatePromises = list.map((item) =>
      db.postChapterSection.update({
        where: { id: item.id },
        data: { position: item.position },
      })
    );

    await db.$transaction(updatePromises);

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    logger.error("[REORDER ERROR]", error);
    return safeErrorResponse(error, 500, 'POSTCHAPTER_REORDER');
  }
}
