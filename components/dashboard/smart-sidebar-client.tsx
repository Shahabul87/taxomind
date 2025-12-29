'use client';

import dynamic from 'next/dynamic';
import type { User as NextAuthUser } from 'next-auth';

// Dynamically import SmartSidebar with SSR disabled to prevent hydration mismatch
// The sidebar uses Framer Motion which renders differently on server vs client
const SmartSidebar = dynamic(
  () => import('./smart-sidebar').then((mod) => mod.SmartSidebar),
  {
    ssr: false,
    loading: () => (
      // Placeholder that matches the collapsed sidebar dimensions
      <aside
        className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 z-30"
        style={{ width: 72 }}
      />
    ),
  }
);

interface SmartSidebarClientProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SmartSidebarClient({
  user,
  isMobileOpen,
  onMobileClose,
}: SmartSidebarClientProps) {
  return (
    <SmartSidebar
      user={user}
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}
