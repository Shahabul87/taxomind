/**
 * Individual Admin Account Management API
 *
 * Manages individual AdminAccount (separate from User accounts)
 * Only SUPERADMIN can manage other admin accounts
 *
 * GET - Get admin account details
 * PATCH - Update admin account
 * DELETE - Delete admin account
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { adminAuth } from "@/config/auth/auth.admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ adminId: string }>;
}

// Validation schema for updating admin
const updateAdminSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "SUPERADMIN"]).optional(),
  department: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
});

/**
 * GET /api/admin/accounts/[adminId]
 * Get admin account details (SUPERADMIN only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { adminId } = await params;
    const session = await adminAuth();

    // Only SUPERADMIN can view admin details (or the admin themselves)
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    const isSuperAdmin = session.user.role === "SUPERADMIN";
    const isSelf = session.user.id === adminId;

    if (!isSuperAdmin && !isSelf) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Access denied",
          },
        },
        { status: 403 }
      );
    }

    const admin = await db.adminAccount.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        bio: true,
        image: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
        totpEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Admin account not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { admin },
    });
  } catch (error) {
    logger.error("[ADMIN_ACCOUNT_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch admin account",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/accounts/[adminId]
 * Update admin account (SUPERADMIN only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { adminId } = await params;
    const session = await adminAuth();

    // Only SUPERADMIN can update admin accounts
    if (!session?.user?.id || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only superadmin can update admin accounts",
          },
        },
        { status: 403 }
      );
    }

    // Prevent superadmin from demoting themselves
    if (adminId === session.user.id) {
      const body = await request.json();
      if (body.role && body.role !== "SUPERADMIN") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SELF_DEMOTION",
              message: "You cannot demote yourself",
            },
          },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const validation = updateAdminSchema.safeParse(body);

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

    // Check if admin exists
    const existingAdmin = await db.adminAccount.findUnique({
      where: { id: adminId },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Admin account not found",
          },
        },
        { status: 404 }
      );
    }

    const { name, role, department, phone, password } = validation.data;

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (phone !== undefined) updateData.phone = phone;
    if (password) updateData.password = await hash(password, 12);

    // Update admin account
    const admin = await db.adminAccount.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        updatedAt: true,
      },
    });

    // Log admin update using AuditLog
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entityType: "ADMIN_ACCOUNT",
        entityId: admin.id,
        context: {
          updatedFields: Object.keys(updateData).filter((k) => k !== "password"),
          passwordChanged: !!password,
          previousRole: existingAdmin.role,
          newRole: role || existingAdmin.role,
          updatedBy: session.user.email,
        },
      },
    });

    logger.info("[ADMIN_ACCOUNT_UPDATE]", {
      adminId: admin.id,
      updatedBy: session.user.id,
      fields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      data: {
        admin,
        message: "Admin account updated successfully",
      },
    });
  } catch (error) {
    logger.error("[ADMIN_ACCOUNT_UPDATE]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update admin account",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/accounts/[adminId]
 * Delete admin account (SUPERADMIN only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { adminId } = await params;
    const session = await adminAuth();

    // Only SUPERADMIN can delete admin accounts
    if (!session?.user?.id || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only superadmin can delete admin accounts",
          },
        },
        { status: 403 }
      );
    }

    // Prevent superadmin from deleting themselves
    if (adminId === session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SELF_DELETE",
            message: "You cannot delete your own account",
          },
        },
        { status: 400 }
      );
    }

    // Check if admin exists
    const existingAdmin = await db.adminAccount.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, role: true },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Admin account not found",
          },
        },
        { status: 404 }
      );
    }

    // Delete admin account
    await db.adminAccount.delete({
      where: { id: adminId },
    });

    // Log admin deletion using AuditLog
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entityType: "ADMIN_ACCOUNT",
        entityId: adminId,
        context: {
          deletedEmail: existingAdmin.email,
          deletedRole: existingAdmin.role,
          deletedBy: session.user.email,
        },
      },
    });

    logger.info("[ADMIN_ACCOUNT_DELETE]", {
      deletedAdminId: adminId,
      deletedEmail: existingAdmin.email,
      deletedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Admin account deleted successfully",
      },
    });
  } catch (error) {
    logger.error("[ADMIN_ACCOUNT_DELETE]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete admin account",
        },
      },
      { status: 500 }
    );
  }
}
