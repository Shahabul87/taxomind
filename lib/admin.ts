/**
 * @deprecated Regular users no longer have roles.
 * Admin authentication is completely separate from user authentication.
 * For admin routes, use adminAuth from @/config/auth/auth.admin.ts instead.
 */

import { currentUser } from "@/lib/auth";

export const isAdmin = async () => {
  // Users don't have roles anymore - always returns false
  // For admin checks, use adminAuth instead of auth
  const user = await currentUser();
  return false;
}; 