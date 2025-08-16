import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { UnifiedDashboard } from "./_components/UnifiedDashboard";

const DashboardPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Admin users get redirected to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  return <UnifiedDashboard user={user} />;
};

export default DashboardPage;