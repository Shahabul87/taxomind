import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { withRole } from "@/lib/api-protection";
import { db, getEnterpriseDB } from "@/lib/db-migration";
import { assignRole } from "@/lib/role-management";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export const GET = withRole(UserRole.ADMIN, async (
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
        role: true,
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

export const PATCH = withRole(UserRole.ADMIN, async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const { userId } = await params;
    const { role } = await request.json();
    const user = await currentUser();
    
    if (!role) {
      return Response.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }
    
    if (!Object.values(UserRole).includes(role)) {
      return Response.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }
    
    // Use EnterpriseDB for role updates
    const enterpriseDb = getEnterpriseDB({
      userContext: user ? { id: user.id, role: user.role } : undefined,
      auditEnabled: true
    });
    
    // Prevent self-demotion from admin
    if (user?.id === userId && user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      return Response.json(
        { error: "Cannot remove your own admin privileges" },
        { status: 400 }
      );
    }
    
    await assignRole(userId, role);
    
    const updatedUser = await enterpriseDb.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true
      }
    });
    
    return Response.json({ 
      message: "Role updated successfully",
      user: updatedUser
    });
  } catch (error) {
    logger.error("Role update error:", error);
    return Response.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
});

export const DELETE = withRole(UserRole.ADMIN, async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const { userId } = await params;
    const user = await currentUser();
    
    // Use EnterpriseDB for this critical operation
    const enterpriseDb = getEnterpriseDB({
      userContext: user ? { id: user.id, role: user.role } : undefined,
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