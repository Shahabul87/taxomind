import { TeacherOrAdminGuard } from "@/components/auth/role-guard";
import { TeacherAnalyticsDashboard } from '@/components/analytics/TeacherAnalyticsDashboard';
import { useSession } from "next-auth/react";

export default function TeacherAnalyticsPage() {
  const { data: session } = useSession();

  return (
    <TeacherOrAdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50/30 to-pink-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="container mx-auto px-4 py-8">
          <TeacherAnalyticsDashboard user={session?.user} />
        </div>
      </div>
    </TeacherOrAdminGuard>
  );
}