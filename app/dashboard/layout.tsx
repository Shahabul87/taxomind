import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { adminAuth } from "@/auth.admin";
import { headers, cookies } from "next/headers";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  // Check if this is an admin route by examining the URL
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";

  // Also check referer and current URL as fallback
  const referer = headersList.get("referer") || "";
  const isAdminRoute = pathname.startsWith("/dashboard/admin") ||
                       referer.includes("/dashboard/admin") ||
                       referer.includes("/admin/auth");

  // For admin routes, check admin session with error handling
  if (isAdminRoute) {
    try {
      const adminSession = await adminAuth();

      // Admin routes are handled by their own page component
      // Just render children without redirecting
      if (!adminSession || !adminSession.user) {
        // Let the admin page component handle the redirect
        // This prevents layout/page redirect conflicts
        return (
          <div className="flex min-h-screen pt-0">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        );
      }
    } catch (error) {
      // If admin auth fails (e.g., JWT decode error), clear stale cookies
      console.log('[dashboard-layout] Admin auth error, clearing stale cookies:', error instanceof Error ? error.message : 'Unknown error');

      // CRITICAL FIX: Clear all admin session cookies to prevent repeated errors
      const cookieStore = await cookies();
      try {
        // Clear both secure and non-secure admin session cookies
        cookieStore.delete('admin-session-token');
        cookieStore.delete('__Secure-admin-session-token');
        console.log('[dashboard-layout] Cleared stale admin session cookies');
      } catch (cookieError) {
        console.error('[dashboard-layout] Failed to clear cookies:', cookieError);
      }

      return (
        <div className="flex min-h-screen pt-0">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      );
    }
  } else {
    // For regular user dashboard routes, check regular session
    const session = await auth();

    // Redirect to login if not authenticated
    if (!session || !session.user) {
      redirect("/auth/login");
    }
  }

  return (
    <div className="flex min-h-screen pt-0">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout; 