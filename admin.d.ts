import { AdminRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

/**
 * Extended Admin User type for admin authentication system
 * Separate from regular user authentication
 */
export type ExtendedAdminUser = DefaultSession["user"] & {
  id: string;
  role: AdminRole;  // Admins have roles: ADMIN or SUPERADMIN
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedAdminUser;
  }
}
