import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-protection";
import { ContentGovernanceService } from "@/lib/content-governance";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get('operatorId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = {};
    
    if (operatorId) {
      whereClause.operatorId = operatorId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const [operations, totalCount] = await Promise.all([
      db.bulkApprovalOperation.findMany({
        where: whereClause,
        include: {
          operator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.bulkApprovalOperation.count({
        where: whereClause
      })
    ]);

    return Response.json({
      operations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("[BULK_OPERATIONS_GET]", error);
    return Response.json(
      { error: "Failed to fetch bulk operations" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { type, criteria, action } = body;

    if (!type || !criteria || !action) {
      return Response.json(
        { error: "Type, criteria, and action are required" },
        { status: 400 }
      );
    }

    const operation = await ContentGovernanceService.executeBulkApproval({
      type,
      criteria,
      action
    });

    return Response.json({ operation });
  } catch (error) {
    console.error("[BULK_OPERATIONS_POST]", error);
    return Response.json(
      { error: "Failed to execute bulk operation" },
      { status: 500 }
    );
  }
});