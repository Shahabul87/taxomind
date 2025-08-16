import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function PATCH(req: Request, props: { params: Promise<{ mindId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();
    const { title, description, content, category, visibility, tags, status } = values;

    const updateData: any = {};
    
    // Only include fields that are provided in the request
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;

    const mind = await db.mind.update({
      where: {
        id: params.mindId,
        userId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json(mind);
  } catch (error: any) {
    logger.error("[MIND_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ mindId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.mind.delete({
      where: {
        id: params.mindId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("[MIND_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 