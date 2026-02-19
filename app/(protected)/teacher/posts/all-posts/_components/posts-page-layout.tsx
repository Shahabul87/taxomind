"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from 'next/dynamic';
import type { User as NextAuthUser } from "next-auth";
import { MobileGestureController } from "@/components/mobile/MobileGestureController";
import { useViewportHeight } from "@/hooks/useViewportHeight";
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
        className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 z-30"
        style={{ width: 72 }}
      />
    ),
  }
);

interface PostsPageLayoutProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  children: React.ReactNode;
}

export function PostsPageLayout({ user, children }: PostsPageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useViewportHeight();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
        onMobileSidebarOpen={() => setIsMobileSidebarOpen(true)}
      />
      <MobileGestureController
        onSidebarOpen={() => setIsMobileSidebarOpen(true)}
        enableEdgeSwipe={isMobile}
        enableBottomBar={isMobile}
        enablePullToRefresh={false}
      >
        {/* Sidebar */}
        <SmartSidebar
          user={user}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        <div className="lg:ml-[72px]">
          <div className="flex flex-col h-screen overflow-hidden">
            <div className="flex-1 overflow-y-auto pt-14 pb-20 lg:pb-16">
              {children}
            </div>
          </div>
        </div>
      </MobileGestureController>
    </>
  );
}
