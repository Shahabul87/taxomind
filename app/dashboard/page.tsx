import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { DashboardClient } from "./_components/DashboardClient";

/**
 * User Dashboard Page
 *
 * NOTE: Regular users don't have roles - Admin auth is completely separate.
 * Admin users use /admin/* routes with AdminAccount authentication.
 * This dashboard is for regular users only.
 */
const DashboardPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Regular users see the Canvas LMS-inspired dashboard
  // Admin dashboard is accessed via /admin/* routes with separate AdminAccount auth
  return <DashboardClient user={user} />;
};

export default DashboardPage;