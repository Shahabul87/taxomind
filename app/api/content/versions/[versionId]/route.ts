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
    const version = await ContentVersioningService.getVersion(versionId);
    
    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ version });
  } catch (error) {
    logger.error("[CONTENT_VERSION_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) => {
  try {
    const { versionId } = await params;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "publish":
        const publishedVersion = await ContentVersioningService.publishVersion(versionId);
        return NextResponse.json({ version: publishedVersion });

      case "submit_for_review":
        const { reviewerIds } = body;
        if (!reviewerIds || !Array.isArray(reviewerIds)) {
          return NextResponse.json(
            { error: "Reviewer IDs are required" },
            { status: 400 }
          );
        }
        const approvals = await ContentVersioningService.submitForReview(
          versionId,
          reviewerIds
        );
        return NextResponse.json({ approvals });

      case "review":
        const { approved, comments } = body;
        if (typeof approved !== "boolean") {
          return NextResponse.json(
            { error: "Approved status is required" },
            { status: 400 }
          );
        }
        const approval = await ContentVersioningService.reviewVersion(
          versionId,
          approved,
          comments
        );
        return NextResponse.json({ approval });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error("[CONTENT_VERSION_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update version" },
      { status: 500 }
    );
  }
});
