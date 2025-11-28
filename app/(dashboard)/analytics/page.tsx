// Analytics Redirect Page
// NOTE: Users don't have roles - Admin auth is completely separate
// Regular users always go to /analytics/user
// Admins access /analytics/admin via AdminAccount auth

import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function AnalyticsRedirectPage(): Promise<void> {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // All regular users go to user analytics
  // Admin analytics requires separate AdminAccount auth
  redirect("/analytics/user");
}