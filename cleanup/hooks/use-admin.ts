"use client";

import { useSession } from "next-auth/react";
import { AdminRole } from "@/types/admin-role";

/**
 * Hook to check if current session is an admin session
 * Only works with admin authentication (adminAuth)
 * Regular users don't have roles
 */
export const useAdmin = () => {
  const { data: session } = useSession();
  return session?.user?.role === AdminRole.ADMIN || session?.user?.role === AdminRole.SUPERADMIN;
}; 