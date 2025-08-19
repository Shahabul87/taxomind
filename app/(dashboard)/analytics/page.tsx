// Role-based Analytics Redirect Page

import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function AnalyticsRedirectPage(): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }
  
  // Redirect based on user role
  if (session.user.role === "ADMIN") {
    redirect("/analytics/admin");
  } else {
    redirect("/analytics/user");
  }
}