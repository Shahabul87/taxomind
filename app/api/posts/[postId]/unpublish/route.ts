import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";

import { db } from "@/lib/db";

export const PATCH = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  const params = await props.params;
  try {

    const userId = context.user.id;

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

    return createSuccessResponse(unpublishedPost);
  } catch (error) {

    return createErrorResponse(ApiError.internal("Internal Error"));
  }
});
