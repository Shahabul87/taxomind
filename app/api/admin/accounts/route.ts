/**
 * Admin Accounts Management API
 *
 * Manages AdminAccount table (separate from User accounts)
 * Only SUPERADMIN can manage other admin accounts
 *
 * GET - List all admin accounts
 * POST - Create new admin account
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { adminAuth } from "@/config/auth/auth.admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// Validation schema for creating admin
const createAdminSchema = z.object({
  email: z.string().email("Valid email required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "SUPERADMIN"]).default("ADMIN"),
  department: z.string().optional(),
  phone: z.string().optional(),
});

/**
 * GET /api/admin/accounts
 * List all admin accounts (SUPERADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await adminAuth();

    // Only SUPERADMIN can list admin accounts
    if (!session?.user?.id || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only superadmin can manage admin accounts",
          },
        },
        { status: 403 }
      );
    }

    const admins = await db.adminAccount.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: {
        admins,
        total: admins.length,
      },
    });
  } catch (error) {
    logger.error("[ADMIN_ACCOUNTS_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch admin accounts",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/accounts
 * Create new admin account (SUPERADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await adminAuth();

    // Only SUPERADMIN can create admin accounts
    if (!session?.user?.id || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only superadmin can create admin accounts",
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { email, name, password, role, department, phone } = validation.data;

    // Check if admin already exists
    const existingAdmin = await db.adminAccount.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ADMIN_EXISTS",
            message: "An admin account with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create admin account
    const admin = await db.adminAccount.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        department,
        phone,
        emailVerified: new Date(), // Auto-verify since superadmin is creating
        isTwoFactorEnabled: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    // Log admin creation using AuditLog
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "ADMIN_ACCOUNT",
        entityId: admin.id,
        context: {
          createdEmail: email,
          createdRole: role,
          createdBy: session.user.email,
        },
      },
    });

    logger.info("[ADMIN_ACCOUNTS_CREATE]", {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        admin,
        message: "Admin account created successfully",
      },
    });
  } catch (error) {
    logger.error("[ADMIN_ACCOUNTS_CREATE]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create admin account",
        },
      },
      { status: 500 }
    );
  }
}
