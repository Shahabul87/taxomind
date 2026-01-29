import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/auth.admin";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import {
  createPermissionManager,
  createPrismaPermissionStore,
  UserRole,
  type ToolCategory,
  type PermissionCondition,
} from "@sam-ai/agentic";

const permissionLevelsSchema = z.array(z.enum(["read", "write", "execute", "admin"])).min(1);

const grantSchema = z.object({
  userId: z.string().min(1),
  toolId: z.string().optional(),
  category: z.string().optional(),
  levels: permissionLevelsSchema.optional(),
  expiresAt: z.string().datetime().optional(),
  conditions: z.array(z.unknown()).optional(),
  role: z.enum([UserRole.STUDENT, UserRole.MENTOR, UserRole.INSTRUCTOR, UserRole.ADMIN]).optional(),
}).refine((data) => data.role || data.levels, {
  message: "Provide either role or permission levels",
});

const revokeSchema = z.object({
  userId: z.string().min(1),
  toolId: z.string().optional(),
  category: z.string().optional(),
});

const querySchema = z.object({
  userId: z.string().optional(),
  toolId: z.string().optional(),
  category: z.string().optional(),
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

    const permissions = await db.agentPermission.findMany({
      where: {
        userId: parsed.data.userId,
        toolId: parsed.data.toolId,
        category: parsed.data.category,
      },
      orderBy: { grantedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      data: {
        permissions: permissions.map((permission) => ({
          id: permission.id,
          userId: permission.userId,
          toolId: permission.toolId,
          category: permission.category,
          levels: permission.levels,
          grantedBy: permission.grantedBy,
          grantedAt: permission.grantedAt,
          expiresAt: permission.expiresAt,
          conditions: permission.conditions ? JSON.parse(permission.conditions) : undefined,
        })),
      },
    });
  } catch (error) {
    logger.error("[ADMIN_AGENTIC_TOOLS] Failed to list permissions:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to list permissions" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await adminAuth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin access required" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = grantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_BODY", message: "Invalid permission payload" } },
        { status: 400 }
      );
    }

    // Cast db to PrismaClientLike to avoid type incompatibility with Prisma extensions
    const permissionStore = createPrismaPermissionStore(db as unknown as Parameters<typeof createPrismaPermissionStore>[0]);
    const permissionManager = createPermissionManager({
      permissionStore,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });

    if (parsed.data.role) {
      const grants = await permissionManager.setRolePermissions(
        parsed.data.userId,
        parsed.data.role,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        data: { permissions: grants },
      });
    }

    if (!parsed.data.levels) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_BODY", message: "Missing permission levels" } },
        { status: 400 }
      );
    }

    const permission = await permissionStore.grant({
      userId: parsed.data.userId,
      toolId: parsed.data.toolId,
      category: parsed.data.category as ToolCategory | undefined,
      levels: parsed.data.levels,
      grantedBy: session.user.id,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      conditions: parsed.data.conditions as PermissionCondition[] | undefined,
    });

    return NextResponse.json({
      success: true,
      data: { permission },
    });
  } catch (error) {
    logger.error("[ADMIN_AGENTIC_TOOLS] Failed to grant permissions:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to grant permissions" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await adminAuth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Admin access required" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = revokeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_BODY", message: "Invalid revoke payload" } },
        { status: 400 }
      );
    }

    // Cast db to PrismaClientLike to avoid type incompatibility with Prisma extensions
    const permissionStore = createPrismaPermissionStore(db as unknown as Parameters<typeof createPrismaPermissionStore>[0]);
    await permissionStore.revoke(parsed.data.userId, parsed.data.toolId, parsed.data.category as ToolCategory | undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[ADMIN_AGENTIC_TOOLS] Failed to revoke permissions:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Failed to revoke permissions" } },
      { status: 500 }
    );
  }
}
