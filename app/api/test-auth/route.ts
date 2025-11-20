import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please login to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user is admin - admins are now in AdminAccount table
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: user.id },
    });
    const isAdmin = adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';

    const roleInfo = {
      isAdmin,
      isUser: !isAdmin,
      adminRole: adminAccount?.role || null,
    };

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      roleInfo,
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

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin - admins are now in AdminAccount table
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: user.id },
    });

    // Admin-only operation
    if (!adminAccount || (adminAccount.role !== 'ADMIN' && adminAccount.role !== 'SUPERADMIN')) {
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
        adminRole: adminAccount.role,
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