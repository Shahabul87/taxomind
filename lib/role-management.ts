import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Simplified permission system without roles
// Since we have separate user and admin systems, all authenticated users have basic permissions

export const USER_PERMISSIONS = [
  "course:view",
  "course:enroll",
  "course:create",
  "course:edit_own",
  "course:delete_own",
  "exam:take",
  "exam:create",
  "exam:edit_own",
  "progress:view_own",
  "analytics:view_own",
  "analytics:view_students",
  "analytics:view_courses"
] as const;

export type Permission = typeof USER_PERMISSIONS[number];

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;

  // All authenticated users have basic permissions
  return USER_PERMISSIONS.includes(permission);
}

export async function requirePermission(permission: Permission): Promise<void> {
  const hasAccess = await hasPermission(permission);
  if (!hasAccess) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}

export async function getAllUsers() {
  // Basic implementation - in production, you'd want proper admin auth check
  const user = await currentUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  return await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      emailVerified: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function isOwner(resourceUserId: string): Promise<boolean> {
  const user = await currentUser();

  if (!user) return false;

  return user.id === resourceUserId;
}

export async function canModifyUser(targetUserId: string): Promise<boolean> {
  const currentUserData = await currentUser();

  if (!currentUserData) return false;

  // Users can only modify their own data
  return currentUserData.id === targetUserId;
}