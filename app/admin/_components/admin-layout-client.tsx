"use client";

import { AdminGuard } from "@/components/auth/admin-guard";
import { usePathname } from "next/navigation";

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Admin auth routes should NOT be wrapped in AdminGuard
  // These routes need to be accessible to non-authenticated users
  const isAdminAuthRoute = pathname?.startsWith("/admin/auth/");

  // If it's an admin auth route, render without guard and without wrapper
  // This allows the auth pages to have their own full-screen backgrounds
  if (isAdminAuthRoute) {
    return <>{children}</>;
  }

  // All other admin routes require authentication
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {children}
      </div>
    </AdminGuard>
  );
}
