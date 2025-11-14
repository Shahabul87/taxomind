import React from 'react';
import { currentUser } from '@/lib/auth';
import { MobileLayout } from './MobileLayout';

interface PageWithMobileLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showSidebar?: boolean;
  showBottomBar?: boolean;
  enableGestures?: boolean;
  enablePullToRefresh?: boolean;
  contentClassName?: string;
}

export async function PageWithMobileLayout({
  children,
  showHeader = true,
  showSidebar = true,
  showBottomBar = true,
  enableGestures = true,
  enablePullToRefresh = false,
  contentClassName,
}: PageWithMobileLayoutProps) {
  const user = await currentUser();

  return (
    <MobileLayout
      user={user as any}
      showHeader={showHeader}
      showSidebar={showSidebar}
      showBottomBar={showBottomBar}
      enableGestures={enableGestures}
      enablePullToRefresh={enablePullToRefresh}
      contentClassName={contentClassName}
    >
      {children}
    </MobileLayout>
  );
}