"use client";

import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import type { User } from "next-auth";

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

interface AICreatorLayoutProps {
  children: React.ReactNode;
}

export function AICreatorLayout({ children }: AICreatorLayoutProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Smart Header - Hidden on mobile for AI Creator page */}
      <div className="hidden md:block">
        <SmartHeader user={user} />
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Smart Sidebar - Fixed position with 72px collapsed width */}
        <SmartSidebar user={user} />

        {/* Main Content Area - Left padding matches collapsed sidebar width (72px) */}
        <main className="flex-1 pt-0 md:pt-14 lg:pt-16 pl-0 sm:pl-[72px] transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
