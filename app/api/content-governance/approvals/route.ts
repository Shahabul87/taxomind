import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentGovernanceService } from "@/lib/content-governance";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const contentType = searchParams.get('contentType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = {};
    
    if (userId) {
      whereClause.approverId = userId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (priority) {
      whereClause.priority = priority;
    }

    if (contentType) {
      whereClause.version = {
        contentType
      };
    }

    const [approvals, totalCount] = await Promise.all([
      db.contentVersionApproval.findMany({
        where: whereClause,
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
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.contentVersionApproval.count({
        where: whereClause
      })
    ]);

    return Response.json({
      approvals,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("[APPROVALS_GET]", error);
    return Response.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { versionId, priority, dueDate, templateId, reviewerIds, comments } = body;

    if (!versionId) {
      return Response.json(
        { error: "Version ID is required" },
        { status: 400 }
      );
    }

    const result = await ContentGovernanceService.startApprovalWorkflow({
      versionId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      templateId,
      reviewerIds,
      comments
    });

    return Response.json({ workflow: result.workflow, approvals: result.approvals });
  } catch (error) {
    console.error("[APPROVALS_POST]", error);
    return Response.json(
      { error: "Failed to start approval workflow" },
      { status: 500 }
    );
  }
});