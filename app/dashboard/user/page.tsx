import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { DashboardClient } from "./_components/DashboardClient";

export const dynamic = 'force-dynamic';

/**
 * User Dashboard Page
 *
 * Main landing page for authenticated users.
 * Displays the Canvas LMS-inspired dashboard with user stats and activity.
 *
 * Route: /dashboard/user
 */
export default async function UserDashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <DashboardClient user={user} />;
}
