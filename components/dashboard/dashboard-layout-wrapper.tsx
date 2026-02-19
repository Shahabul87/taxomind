"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SmartSidebar } from "./smart-sidebar";
import type { User as NextAuthUser } from "next-auth";
import type { DashboardView } from "@/components/dashboard/unified-header";

// Dynamic import to prevent hydration mismatch with Framer Motion
const UnifiedDashboardHeader = dynamic(
  () => import('@/components/dashboard/unified-header').then((mod) => mod.UnifiedDashboardHeader),
  {
    ssr: false,
    loading: () => (
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <div className="lg:pl-[88px] px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </header>
    ),
  }
);

interface DashboardLayoutWrapperProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ user, children }: DashboardLayoutWrapperProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardView>('todos');

  // Handle tab change - navigate to dashboard with the selected tab
  const handleTabChange = (tab: DashboardView) => {
    if (tab === 'todos') {
      router.push('/dashboard/user');
    } else {
      router.push(`/dashboard/user?tab=${tab}`);
    }
  };

  return (
    <>
      <UnifiedDashboardHeader
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <SmartSidebar user={user} />
      <div className="ml-[72px] min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 pt-14 transition-all duration-300">
        {children}
      </div>
    </>
  );
}
