"use client";

import React, { useState } from "react";
import dynamic from 'next/dynamic';
import type { User as NextAuthUser } from "next-auth";
import { MobileGestureController } from "@/components/mobile/MobileGestureController";
import { useViewportHeight } from "@/hooks/useViewportHeight";

// Dynamic imports to prevent hydration mismatch with Framer Motion
const SmartHeader = dynamic(
  () => import('@/components/dashboard/smart-header').then((mod) => mod.SmartHeader),
  {
    ssr: false,
    loading: () => (
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <div className="h-full pl-4 lg:pl-[88px] pr-4 sm:pr-6 lg:pr-8" />
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
  const { isMobile } = useViewportHeight();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <>
      <SmartHeader user={user} />
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
            <div className="flex-1 overflow-y-auto pt-16 pb-20 lg:pb-16">
              {children}
            </div>
          </div>
        </div>
      </MobileGestureController>
    </>
  );
}
