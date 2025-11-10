import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { DashboardClient } from "./_components/DashboardClient";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";

const DashboardPage = async () => {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Admin users get redirected to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  // Regular users see the new Canvas LMS-inspired dashboard
  return (
    <>
      <SmartSidebar user={user} />
      <DashboardClient user={user} />
    </>
  );
};

export default DashboardPage;