import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { UserRole } from "@/lib/prisma-types";
import { AdminDashboardSkeleton } from "@/components/skeletons/admin-dashboard-skeleton";
import { ClientAdminDashboard } from "@/app/dashboard/admin/client";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for managing the learning platform",
};

export default async function AdminPage() {
  const session = await auth();
  
  // Redirect if not logged in or not an admin
  if (!session || !session.user) {
    redirect("/auth/login");
  }
  
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/user");
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <ClientAdminDashboard />
      </Suspense>
    </div>
  );
} 