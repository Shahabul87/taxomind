import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentGovernanceService } from "@/lib/content-governance";

interface RouteParams {
  params: {
    approvalId: string;
  };
}

export const GET = withAuth(async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const approval = await db.contentVersionApproval.findUnique({
      where: { id: params.approvalId },
      include: {
        version: {
          include: {
            author: { select: { id: true, name: true, email: true } }
          }
        },
        approver: {
          select: { id: true, name: true, email: true }
        },
        stage: true
      }
    });

    if (!approval) {
      return Response.json(
        { error: "Approval not found" },
        { status: 404 }
      );
    }

    return Response.json({ approval });
  } catch (error) {
    console.error("[APPROVAL_GET]", error);
    return Response.json(
      { error: "Failed to fetch approval" },
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
    const { action, approved, comments, timeSpent, reason } = body;

    switch (action) {
      case "review":
        if (typeof approved !== "boolean") {
          return Response.json(
            { error: "Approved status is required" },
            { status: 400 }
          );
        }

        const approval = await db.contentVersionApproval.findUnique({
          where: { id: params.approvalId },
          include: { version: true }
        });

        if (!approval) {
          return Response.json(
            { error: "Approval not found" },
            { status: 404 }
          );
        }

        const result = await ContentGovernanceService.processApproval(
          approval.versionId,
          approval.approverId,
          approved,
          comments,
          timeSpent
        );

        return Response.json({ approval: result });

      case "escalate":
        if (!reason) {
          return Response.json(
            { error: "Escalation reason is required" },
            { status: 400 }
          );
        }

        const escalationApproval = await db.contentVersionApproval.findUnique({
          where: { id: params.approvalId },
          include: { version: true }
        });

        if (!escalationApproval) {
          return Response.json(
            { error: "Approval not found" },
            { status: 404 }
          );
        }

        const escalationResult = await ContentGovernanceService.escalateApproval(
          escalationApproval.versionId,
          reason
        );

        return Response.json({ approvals: escalationResult });

      default:
        return Response.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[APPROVAL_PATCH]", error);
    return Response.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
});