import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { SimpleDashboard } from "./_components/SimpleDashboard";
import { DashboardLayout } from "./_components/DashboardLayout";

const DashboardPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Admin users get redirected to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  // Regular users see the simplified dashboard with smart header and sidebar
  return (
    <DashboardLayout user={user}>
      <SimpleDashboard user={user} />
    </DashboardLayout>
  );
};

export default DashboardPage;