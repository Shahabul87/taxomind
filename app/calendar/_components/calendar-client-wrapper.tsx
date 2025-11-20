'use client';

import { DashboardLayoutWrapper } from '@/components/dashboard/dashboard-layout-wrapper';

interface CalendarClientWrapperProps {
  user: {
    id: string;
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
