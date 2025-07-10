import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { currentUser, currentRole } from "@/lib/auth";

export const ROLE_PERMISSIONS = {
  [UserRole.STUDENT]: [
    "course:view",
    "course:enroll",
    "exam:take",
    "progress:view_own",
    "analytics:view_own"
  ],
  [UserRole.TEACHER]: [
    "course:view",
    "course:create",
    "course:edit_own",
    "course:delete_own",
    "exam:create",
    "exam:edit_own",
    "exam:grade",
    "student:view_progress",
    "analytics:view_students",
    "analytics:view_courses"
  ],
  [UserRole.ADMIN]: [
    "course:view",
    "course:create",
    "course:edit_any",
    "course:delete_any",
    "user:view_all",
    "user:edit_roles",
    "user:delete",
    "analytics:view_all",
    "system:manage",
    "role:assign"
  ]
} as const;

export type Permission = typeof ROLE_PERMISSIONS[UserRole][number];

export async function hasPermission(permission: Permission): Promise<boolean> {
  const role = await currentRole();
  if (!role) return false;
  
  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function requirePermission(permission: Permission): Promise<void> {
  const hasAccess = await hasPermission(permission);
  if (!hasAccess) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}

export async function assignRole(userId: string, newRole: UserRole): Promise<void> {
  await requirePermission("role:assign");
  
  await db.user.update({
    where: { id: userId },
    data: { role: newRole }
  });
}

export async function getUsersWithRole(role: UserRole) {
  await requirePermission("user:view_all");
  
  return await db.user.findMany({
    where: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true
    }
  });
}

export async function getAllUsers() {
  await requirePermission("user:view_all");
  
  return await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function isOwnerOrAdmin(resourceUserId: string): Promise<boolean> {
  const user = await currentUser();
  const role = await currentRole();
  
  if (!user || !role) return false;
  
  return user.id === resourceUserId || role === UserRole.ADMIN;
}

export async function canModifyUser(targetUserId: string): Promise<boolean> {
  const currentUserData = await currentUser();
  const role = await currentRole();
  
  if (!currentUserData || !role) return false;
  
  if (role === UserRole.ADMIN) return true;
  
  return currentUserData.id === targetUserId;
}

export function getRoleHierarchy(): UserRole[] {
  return [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN];
}

export function canAssignRole(currentRole: UserRole, targetRole: UserRole): boolean {
  if (currentRole !== UserRole.ADMIN) return false;
  
  const hierarchy = getRoleHierarchy();
  const currentIndex = hierarchy.indexOf(currentRole);
  const targetIndex = hierarchy.indexOf(targetRole);
  
  return currentIndex >= targetIndex;
}