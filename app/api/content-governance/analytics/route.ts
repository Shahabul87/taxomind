import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentGovernanceService } from "@/lib/content-governance";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const contentType = searchParams.get('contentType');

    if (!startDate || !endDate) {
      return Response.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const analytics = await ContentGovernanceService.getApprovalAnalytics(
      {
        start: new Date(startDate),
        end: new Date(endDate)
      },
      contentType || undefined
    );

    return Response.json({ analytics });
  } catch (error) {
    console.error("[ANALYTICS_GET]", error);
    return Response.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
});