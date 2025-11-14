"use client";

import { useSession } from "next-auth/react";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import type { User } from "next-auth";

interface ProfilePageLayoutProps {
  children: React.ReactNode;
}

export function ProfilePageLayout({ children }: ProfilePageLayoutProps) {
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
    <MobileLayout
      user={user}
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    >
      {children}
    </MobileLayout>
  );
}
