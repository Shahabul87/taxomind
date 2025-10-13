import { redirect } from "next/navigation";

export default async function UserDashboardPage() {
  // Redirect all /dashboard/user requests to /dashboard
  // The new simplified dashboard handles all user types
  redirect("/dashboard");
}