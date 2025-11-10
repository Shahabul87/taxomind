"use client";

import { User } from "next-auth";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";

interface DashboardLayoutProps {
  user: User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
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
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
