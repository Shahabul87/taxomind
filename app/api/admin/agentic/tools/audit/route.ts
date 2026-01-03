import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/auth.admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  userId: z.string().optional(),
  toolId: z.string().optional(),
  action: z.string().optional(),
  level: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
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

    const { action, level, startDate, endDate, limit, offset } = parsed.data;
    const actionFilter = action ? action.split(",").map((item) => item.trim()).filter(Boolean) : undefined;
    const levelFilter = level ? level.split(",").map((item) => item.trim()).filter(Boolean) : undefined;

    const where: Record<string, unknown> = {
      userId: parsed.data.userId,
      toolId: parsed.data.toolId,
    };

    if (actionFilter?.length) where.action = { in: actionFilter };
    if (levelFilter?.length) where.level = { in: levelFilter };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) (where.timestamp as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.timestamp as Record<string, unknown>).lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      db.agentAuditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      db.agentAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        entries: entries.map((entry) => ({
          id: entry.id,
          timestamp: entry.timestamp,
          level: entry.level,
          action: entry.action,
          userId: entry.userId,
          sessionId: entry.sessionId,
          toolId: entry.toolId,
          invocationId: entry.invocationId,
          error: entry.error ? JSON.parse(entry.error) : null,
          metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
        })),
      },
    });
  } catch (error) {
    logger.error("[ADMIN_AGENTIC_TOOLS] Failed to fetch audit logs:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch audit logs" } },
      { status: 500 }
    );
  }
}
