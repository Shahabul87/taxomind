import { NextRequest } from "next/server";
import { AdminRole } from "@prisma/client";
import { withRole } from "@/lib/api-protection";
import { db, getEnterpriseDB } from "@/lib/db-migration";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export const GET = withRole(AdminRole.ADMIN, async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const { userId } = await params;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isTeacher: true,
        createdAt: true,
        emailVerified: true,
        isTwoFactorEnabled: true
      }
    });
    
    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return Response.json({ user });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
});

export const PATCH = withRole(AdminRole.ADMIN, async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const { userId } = await params;
    const { isTeacher } = await request.json();
    const user = await currentUser();

    if (isTeacher === undefined) {
      return Response.json(
        { error: "isTeacher field is required" },
        { status: 400 }
      );
    }

    // Use EnterpriseDB for user updates
    const enterpriseDb = getEnterpriseDB({
      userContext: (user?.id) ? { id: user.id, role: "ADMIN" } : undefined,
      auditEnabled: true
    });

    // Update user's teacher status
    const updatedUser = await enterpriseDb.user.update({
      where: { id: userId },
      data: { isTeacher: Boolean(isTeacher) },
      select: {
        id: true,
        name: true,
        email: true,
        isTeacher: true,
        createdAt: true,
        emailVerified: true
      }
    });

    return Response.json({
      message: "User type updated successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error("User type update error:", error);
    return Response.json(
      { error: "Failed to update user type" },
      { status: 500 }
    );
  }
});

export const DELETE = withRole(AdminRole.ADMIN, async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const { userId } = await params;
    const user = await currentUser();
    
    // Use EnterpriseDB for this critical operation
    const enterpriseDb = getEnterpriseDB({
      userContext: (user && user.id) ? { id: user.id, role: "ADMIN" } : undefined,
      auditEnabled: true
    });
    
    // First check if user exists and prevent self-deletion
    const targetUser = await enterpriseDb.user.findUnique({
      where: { id: userId }
    });
    
    if (!targetUser) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (user?.id === userId) {
      return Response.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }
    
    // Perform the deletion with audit logging
    await enterpriseDb.user.delete({
      where: { id: userId }
    });
    
    return Response.json({ 
      message: "User deleted successfully",
      deletedUserId: userId
    });
  } catch (error) {
    logger.error("User deletion error:", error);
    return Response.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
});