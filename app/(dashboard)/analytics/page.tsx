// Role-based Analytics Redirect Page

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AnalyticsRedirectPage() {
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