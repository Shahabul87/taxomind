"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import type { User } from "next-auth";
import type { DashboardView } from "@/components/dashboard/unified-header";

// Dynamic imports to prevent hydration mismatch with Framer Motion
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

const SmartSidebar = dynamic(
  () => import('@/components/dashboard/smart-sidebar').then((mod) => mod.SmartSidebar),
  {
    ssr: false,
    loading: () => (
      <aside
        className="hidden lg:block fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 z-30"
        style={{ width: 72 }}
      />
    ),
  }
);

interface AICreatorLayoutProps {
  children: React.ReactNode;
}

export function AICreatorLayout({ children }: AICreatorLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardView>('learning');

  if (!session?.user) {
    return <>{children}</>;
  }

  const user = session.user as User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };

  // Handle tab change - navigate to dashboard with the selected tab
  const handleTabChange = (tab: DashboardView) => {
    if (tab === 'learning') {
      router.push('/dashboard/user');
    } else {
      router.push(`/dashboard/user?tab=${tab}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Unified Header - Hidden on mobile for AI Creator page */}
      <div className="hidden md:block">
        <UnifiedDashboardHeader
          user={user}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Smart Sidebar - Fixed position with 72px collapsed width */}
        <SmartSidebar user={user} />

        {/* Main Content Area - Left padding matches collapsed sidebar width (72px) */}
        <main className="flex-1 pt-0 md:pt-14 pl-0 sm:pl-[72px] transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
