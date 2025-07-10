import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentVersioningService } from "@/lib/content-versioning";

interface RouteParams {
  params: {
    versionId: string;
  };
}

export const GET = withAuth(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const version = await ContentVersioningService.getVersion(params.versionId);
    
    if (!version) {
      return Response.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    return Response.json({ version });
  } catch (error) {
    console.error("[CONTENT_VERSION_GET]", error);
    return Response.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "publish":
        const publishedVersion = await ContentVersioningService.publishVersion(params.versionId);
        return Response.json({ version: publishedVersion });

      case "submit_for_review":
        const { reviewerIds } = body;
        if (!reviewerIds || !Array.isArray(reviewerIds)) {
          return Response.json(
            { error: "Reviewer IDs are required" },
            { status: 400 }
          );
        }
        const approvals = await ContentVersioningService.submitForReview(
          params.versionId,
          reviewerIds
        );
        return Response.json({ approvals });

      case "review":
        const { approved, comments } = body;
        if (typeof approved !== "boolean") {
          return Response.json(
            { error: "Approved status is required" },
            { status: 400 }
          );
        }
        const approval = await ContentVersioningService.reviewVersion(
          params.versionId,
          approved,
          comments
        );
        return Response.json({ approval });

      default:
        return Response.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[CONTENT_VERSION_PATCH]", error);
    return Response.json(
      { error: "Failed to update version" },
      { status: 500 }
    );
  }
});