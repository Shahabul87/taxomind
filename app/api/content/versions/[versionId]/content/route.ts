import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentVersioningService } from "@/lib/content-versioning";
import { logger } from '@/lib/logger';

export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) => {
  try {
    const { versionId } = await params;
    const content = await ContentVersioningService.getContentAtVersion(versionId);
    
    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    logger.error("[CONTENT_VERSION_CONTENT_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
});
