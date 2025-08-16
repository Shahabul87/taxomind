import { UserOrAdminGuard } from "@/components/auth/role-guard";
import { TeacherAnalyticsDashboard } from '@/components/analytics/TeacherAnalyticsDashboard';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function TeacherAnalyticsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <UserOrAdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50/30 to-pink-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="container mx-auto px-4 py-8">
          <TeacherAnalyticsDashboard user={session.user} />
        </div>
      </div>
    </UserOrAdminGuard>
  );
}