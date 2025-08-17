import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentVersioningService } from "@/lib/content-versioning";
import { ContentType } from "@prisma/client";
import { logger } from '@/lib/logger';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      contentType,
      contentId,
      contentSnapshot,
      title,
      description,
      changeLog,
      scheduledAt
    } = body;

    if (!contentType || !contentId || !contentSnapshot) {
      return Response.json(
        { error: "Content type, ID, and snapshot are required" },
        { status: 400 }
      );
    }

    const version = await ContentVersioningService.createVersion({
      contentType,
      contentId,
      contentSnapshot,
      title,
      description,
      changeLog,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
    });

    return Response.json({ version });
  } catch (error) {
    logger.error("[CONTENT_VERSIONS_POST]", error);
    return Response.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType");
    const contentId = searchParams.get("contentId");

    if (!contentType || !contentId) {
      return Response.json(
        { error: "Content type and ID are required" },
        { status: 400 }
      );
    }

    const versions = await ContentVersioningService.getVersionHistory(
      contentType as ContentType,
      contentId
    );

    return Response.json({ versions });
  } catch (error) {
    logger.error("[CONTENT_VERSIONS_GET]", error);
    return Response.json(
      { error: "Failed to fetch version history" },
      { status: 500 }
    );
  }
});