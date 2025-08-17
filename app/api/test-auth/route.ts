import { NextResponse } from "next/server";
import { currentUser, currentRole } from "@/lib/auth";
import { Permission, UserRole as AppUserRole } from "@/types/auth";
import { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/auth/permissions";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await currentUser();
    const role = await currentRole();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please login to access this endpoint" },
        { status: 401 }
      );
    }

    // Test different permission levels
    const permissions = {
      canCreateCourse: role ? hasPermission(role as AppUserRole, Permission.CREATE_COURSE) : false,
      canManageUsers: role ? hasPermission(role as AppUserRole, Permission.CREATE_USER) : false,
      canAccessAdmin: role ? hasPermission(role as AppUserRole, Permission.ACCESS_ADMIN_PANEL) : false,
      canViewAllAnalytics: role ? hasPermission(role as AppUserRole, Permission.VIEW_ALL_ANALYTICS) : false,
    };

    const roleInfo = {
      isAdmin: role === UserRole.ADMIN,
      isUser: role === UserRole.USER,
    };

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
      },
      roleInfo,
      permissions,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Auth test error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to check authentication" },
      { status: 500 }
    );
  }
}

// Test role-specific endpoints
export async function POST() {
  try {
    const user = await currentUser();
    const role = await currentRole();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Admin-only operation
    if (role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin role required for this operation" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin operation completed successfully",
      operationBy: {
        id: user.id,
        name: user.name,
        role: role,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Admin operation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}