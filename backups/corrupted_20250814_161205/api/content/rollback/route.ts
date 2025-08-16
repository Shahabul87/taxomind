import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentVersioningService } from "@/lib/content-versioning";
import { logger } from '@/lib/logger';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { contentType, contentId, targetVersionId, reason } = body;

    if (!contentType || !contentId || !targetVersionId) {
      return Response.json(
        { error: "Content type, ID, and target version ID are required" },
        { status: 400 }
      );
    }

    const version = await ContentVersioningService.rollbackToVersion(
      contentType,
      contentId,
      targetVersionId,
      reason
    );

    return Response.json({ version });
  } catch (error: any) {
    logger.error("[CONTENT_ROLLBACK_POST]", error);
    return Response.json(
      { error: "Failed to rollback content" },
      { status: 500 }
    );
  }
});