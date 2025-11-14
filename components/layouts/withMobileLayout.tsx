'use client';

import React from 'react';
import { MobileLayout } from './MobileLayout';
import { useSession } from 'next-auth/react';

interface WithMobileLayoutOptions {
  showHeader?: boolean;
  showSidebar?: boolean;
  showBottomBar?: boolean;
  enableGestures?: boolean;
  enablePullToRefresh?: boolean;
  contentClassName?: string;
}

export function withMobileLayout(
  Component: React.ComponentType<any>,
  options: WithMobileLayoutOptions = {}
) {
  return function WrappedComponent(props: any) {
    const { data: session } = useSession();

    return (
      <MobileLayout
        user={session?.user as any}
        showHeader={options.showHeader ?? true}
        showSidebar={options.showSidebar ?? true}
        showBottomBar={options.showBottomBar ?? true}
        enableGestures={options.enableGestures ?? true}
        enablePullToRefresh={options.enablePullToRefresh ?? false}
        contentClassName={options.contentClassName}
      >
        <Component {...props} />
      </MobileLayout>
    );
  };
}