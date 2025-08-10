import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function PATCH(req: Request, props: { params: Promise<{ postId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    const post = await db.post.findUnique({
      where: {
        id: params.postId,
        userId,
      },
    });

    if (!post) {
      return new NextResponse("Not found", { status: 404 });
    }

    const unpublishedPost = await db.post.update({
      where: {
        id: params.postId,
        userId,
      },
      data: {
        published: false,
      }
    });

    return NextResponse.json(unpublishedPost);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}
