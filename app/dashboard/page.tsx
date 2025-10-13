import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { SimpleDashboard } from "./_components/SimpleDashboard";

const DashboardPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Admin users get redirected to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  // Regular users see the simplified dashboard with tabs (no context switching)
  return <SimpleDashboard user={user} />;
};

export default DashboardPage;