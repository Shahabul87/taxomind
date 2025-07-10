import { AdminGuard } from "@/components/auth/admin-guard";
import { AdminAnalyticsDashboard } from '@/components/analytics/AdminAnalyticsDashboard';
import { useSession } from "next-auth/react";

export default function AdminAnalyticsPage() {
  const { data: session } = useSession();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50/30 to-purple-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="container mx-auto px-4 py-8">
          <AdminAnalyticsDashboard user={session?.user} />
        </div>
      </div>
    </AdminGuard>
  );
}