'use client';

import { useState } from "react";
import dynamic from 'next/dynamic';
import { usePathname } from "next/navigation";
import { MobileGestureController } from "@/components/mobile/MobileGestureController";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import type { User as NextAuthUser } from 'next-auth';

// Dynamic import to prevent hydration mismatch with Framer Motion
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

interface TeacherCreateClientProps {
  children: React.ReactNode;
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

export function TeacherCreateClient({ children, user }: TeacherCreateClientProps) {
  const { isMobile } = useViewportHeight();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isAICreatorRoute = pathname?.startsWith('/teacher/create/ai-creator');

  return (
    <MobileGestureController
      onSidebarOpen={() => setIsMobileSidebarOpen(true)}
      enableEdgeSwipe={isMobile}
      enableBottomBar={isMobile && !isAICreatorRoute}
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
