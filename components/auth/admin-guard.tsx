"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AdminRole } from "@prisma/client";
import { AdminSession } from "@/types/admin-session";

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  // Check if user is authenticated first
  if (!session?.user) {
    redirect("/admin/auth/login");
  }

  // Cast to AdminSession since this guard is for admin routes
  const adminSession = session as AdminSession;

  // Then check if user has admin role
  if (adminSession.user.role !== AdminRole.ADMIN && adminSession.user.role !== AdminRole.SUPERADMIN) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
};
