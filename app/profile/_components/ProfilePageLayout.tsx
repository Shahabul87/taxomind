"use client";

import { useSession } from "next-auth/react";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";
import type { User } from "next-auth";

interface ProfilePageLayoutProps {
  children: React.ReactNode;
}

export function ProfilePageLayout({ children }: ProfilePageLayoutProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return <>{children}</>;
  }

  const user = session.user as User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Smart Header */}
      <SmartHeader user={user} />

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Smart Sidebar - Fixed position with 72px collapsed width */}
        <SmartSidebar user={user} />

        {/* Main Content Area - Left padding matches collapsed sidebar width (72px) */}
        <main className="flex-1 pt-16 pl-[72px] transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
