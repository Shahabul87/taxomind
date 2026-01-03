import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/auth.admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  deprecationMessage: z.string().nullable().optional(),
  confirmationType: z.string().optional(),
  requiredPermissions: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const session = await adminAuth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin access required" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_BODY", message: "Invalid update payload" } },
        { status: 400 }
      );
    }

    const tool = await db.agentTool.update({
      where: { id: params.toolId },
      data: {
        enabled: parsed.data.enabled,
        deprecated: parsed.data.deprecated,
        deprecationMessage: parsed.data.deprecationMessage ?? undefined,
        confirmationType: parsed.data.confirmationType,
        requiredPermissions: parsed.data.requiredPermissions,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tool: {
          id: tool.id,
          enabled: tool.enabled,
          deprecated: tool.deprecated,
          deprecationMessage: tool.deprecationMessage,
          confirmationType: tool.confirmationType,
          requiredPermissions: tool.requiredPermissions,
          updatedAt: tool.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error("[ADMIN_AGENTIC_TOOLS] Failed to update tool:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to update tool" } },
      { status: 500 }
    );
  }
}
