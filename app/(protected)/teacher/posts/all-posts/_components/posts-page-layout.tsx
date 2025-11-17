"use client";

import React, { useState } from "react";
import type { User as NextAuthUser } from "next-auth";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";
import { MobileGestureController } from "@/components/mobile/MobileGestureController";
import { useViewportHeight } from "@/hooks/useViewportHeight";

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
