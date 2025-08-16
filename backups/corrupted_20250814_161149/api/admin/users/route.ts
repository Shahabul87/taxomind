import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { withRole } from "@/lib/api-protection";
import { getAllUsers, assignRole } from "@/lib/role-management";

export const GET = withRole(UserRole.ADMIN, async (request: NextRequest) => {
  try {
    const users = await getAllUsers();
    return Response.json({ users });
  } catch (error: any) {
    return Response.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
});

export const PATCH = withRole(UserRole.ADMIN, async (request: NextRequest) => {
  try {
    const { userId, role } = await request.json();
    
    if (!userId || !role) {
      return Response.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }
    
    if (!Object.values(UserRole).includes(role)) {
      return Response.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }
    
    await assignRole(userId, role);
    
    return Response.json({ 
      message: "Role updated successfully",
      userId,
      newRole: role
    });
  } catch (error: any) {
    return Response.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
});