import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { withRole } from "@/lib/api-protection";
import { db } from "@/lib/db";
import { assignRole } from "@/lib/role-management";

interface RouteParams {
  params: {
    userId: string;
  };
}

export const GET = withRole(UserRole.ADMIN, async (
  request: NextRequest,
  { params }: RouteParams
) => {
  try {
    const user = await db.user.findUnique({
      where: { id: params.userId },
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
    const { role } = await request.json();
    
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
    
    await assignRole(params.userId, role);
    
    const updatedUser = await db.user.findUnique({
      where: { id: params.userId },
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
    await db.user.delete({
      where: { id: params.userId }
    });
    
    return Response.json({ 
      message: "User deleted successfully"
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
});