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
    const content = await ContentVersioningService.getContentAtVersion(params.versionId);
    
    if (!content) {
      return Response.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return Response.json({ content });
  } catch (error) {
    console.error("[CONTENT_VERSION_CONTENT_GET]", error);
    return Response.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
});