/**
 * Admin Role Types
 *
 * Centralized type definitions for AdminRole to avoid Prisma client
 * generation issues during builds.
 *
 * NOTE: These types must match the AdminRole enum in prisma/schema.prisma
 */

export type AdminRole = "ADMIN" | "SUPERADMIN";

export const AdminRole = {
  ADMIN: "ADMIN" as const,
  SUPERADMIN: "SUPERADMIN" as const,
} as const;

export type AdminRoleValue = typeof AdminRole[keyof typeof AdminRole];
