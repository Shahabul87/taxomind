'use client';

import { DashboardLayoutWrapper } from '@/components/dashboard/dashboard-layout-wrapper';
import type { UserRole } from '@prisma/client';

interface CalendarClientWrapperProps {
  user: {
    id: string;
    role: UserRole;
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
  };
  children: React.ReactNode;
}

export function CalendarClientWrapper({ user, children }: CalendarClientWrapperProps) {
  return (
    <DashboardLayoutWrapper user={user}>
      {children}
    </DashboardLayoutWrapper>
  );
}
