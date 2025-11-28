'use client';

import { useState } from "react";
import { MobileGestureController } from "@/components/mobile/MobileGestureController";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import type { User as NextAuthUser } from 'next-auth';

interface CreatePostClientProps {
  children: React.ReactNode;
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

export function CreatePostClient({ children, user }: CreatePostClientProps) {
  const { isMobile } = useViewportHeight();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
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

      <div className="min-h-screen transition-all duration-300">
        {children}
      </div>
    </MobileGestureController>
  );
}
