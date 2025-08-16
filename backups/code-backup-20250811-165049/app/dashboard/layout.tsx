import { redirect } from "next/navigation";
import { auth } from "@/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen pt-0">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout; 