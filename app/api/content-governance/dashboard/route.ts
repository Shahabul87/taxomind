import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentGovernanceService } from "@/lib/content-governance";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const dashboard = await ContentGovernanceService.getApprovalDashboard(userId || undefined);

    return Response.json({ dashboard });
  } catch (error) {
    console.error("[DASHBOARD_GET]", error);
    return Response.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
});