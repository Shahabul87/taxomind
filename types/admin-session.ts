import { AdminRole } from "@/types/admin-role";

/**
 * Admin Session Type
 *
 * Admin authentication is completely separate from user authentication.
 * Admin sessions include role information (ADMIN or SUPERADMIN).
 * Regular user sessions DO NOT have roles.
 */
export type AdminSession = {
  user: {
    id: string;
    role: AdminRole;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    isTwoFactorEnabled?: boolean;
    isOAuth?: boolean;
  };
  expires?: string;
};

/**
 * Type guard to check if a session is an admin session
 */
export function isAdminSession(session: any): session is AdminSession {
  return session?.user?.role !== undefined &&
    (session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN');
}
