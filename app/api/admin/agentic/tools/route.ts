import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/auth.admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  includeDisabled: z.coerce.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await adminAuth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin access required" } },
        { status: 401 }
      );
    }

    const parsed = querySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams)
    );

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_QUERY", message: "Invalid query parameters" } },
        { status: 400 }
      );
    }

    const tools = await db.agentTool.findMany({
      where: parsed.data.includeDisabled ? undefined : { enabled: true },
      orderBy: { name: "asc" },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      data: {
        tools: tools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          category: tool.category,
          version: tool.version,
          requiredPermissions: tool.requiredPermissions,
          confirmationType: tool.confirmationType,
          timeoutMs: tool.timeoutMs,
          maxRetries: tool.maxRetries,
          tags: tool.tags,
          enabled: tool.enabled,
          deprecated: tool.deprecated,
          deprecationMessage: tool.deprecationMessage,
          updatedAt: tool.updatedAt,
        })),
      },
    });
  } catch (error) {
    logger.error("[ADMIN_AGENTIC_TOOLS] Failed to list tools:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to list tools" } },
      { status: 500 }
    );
  }
}
