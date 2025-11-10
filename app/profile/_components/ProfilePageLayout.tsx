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
    <>
      {/* Smart Sidebar - Fixed position with 72px collapsed width */}
      <SmartSidebar user={user} />

      {/* Main Content Area - Left margin matches collapsed sidebar width (72px) */}
      <div className="ml-[72px]">
        {/* Smart Header - Full width, sticky to top */}
        <SmartHeader user={user} />

        {/* Page Content */}
        <main className="min-h-screen pt-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
          {children}
        </main>
      </div>
    </>
  );
}
