'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User as NextAuthUser } from 'next-auth';
import { SmartHeader } from '@/components/dashboard/smart-header';
import { SmartSidebar } from '@/components/dashboard/smart-sidebar';
import { MobileGestureController } from '@/components/mobile/MobileGestureController';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { cn } from '@/lib/utils';
import { ExtendedUser } from '@/next-auth';

/**
 * Mobile-optimized layout component with responsive navigation.
 * Supports both ExtendedUser (authenticated) and basic NextAuth User types.
 */
interface MobileLayoutProps {
  children: React.ReactNode;
  user?: ExtendedUser | (NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  }) | null;
  showHeader?: boolean;
  showSidebar?: boolean;
  showBottomBar?: boolean;
  enableGestures?: boolean;
  enablePullToRefresh?: boolean;
  contentClassName?: string;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  quickActionHandlers?: {
    onCreateStudyPlan?: () => void;
    onCreateCoursePlan?: () => void;
    onCreateBlogPlan?: () => void;
    onScheduleSession?: () => void;
    onAddTodo?: () => void;
    onSetGoal?: () => void;
  };
}

export function MobileLayout({
  children,
  user,
  showHeader = true,
  showSidebar = true,
  showBottomBar = true,
  enableGestures = true,
  enablePullToRefresh = false,
  contentClassName,
  viewMode = 'list',
  onViewModeChange,
  quickActionHandlers,
}: MobileLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isMobile, isTablet, isDesktop } = useViewportHeight();
  const pathname = usePathname();
  const router = useRouter();

  // Prevent hydration mismatch by only rendering viewport-dependent features after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Default quick action handlers if not provided
  const defaultQuickActionHandlers = {
    onCreateStudyPlan: () => router.push('/my-plan?action=create-study'),
    onCreateCoursePlan: () => router.push('/my-plan?action=create-course'),
    onCreateBlogPlan: () => router.push('/blog?action=create'),
    onScheduleSession: () => router.push('/calendar?action=schedule'),
    onAddTodo: () => router.push('/dashboard?action=add-todo'),
    onSetGoal: () => router.push('/dashboard?action=set-goal'),
  };

  const handlers = {
    ...defaultQuickActionHandlers,
    ...quickActionHandlers,
  };

  // Handle mobile quick actions from bottom bar
  const handleMobileQuickAction = (action: string) => {
    switch (action) {
      case 'course-plan':
        handlers.onCreateCoursePlan?.();
        break;
      case 'blog-plan':
        handlers.onCreateBlogPlan?.();
        break;
      case 'session':
        handlers.onScheduleSession?.();
        break;
      case 'todo':
        handlers.onAddTodo?.();
        break;
      case 'goal':
        handlers.onSetGoal?.();
        break;
      case 'study-plan':
        handlers.onCreateStudyPlan?.();
        break;
      default:
        break;
    }
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Determine padding based on device and sidebar state
  // Use default desktop padding until mounted to prevent hydration mismatch
  const getContentPadding = () => {
    if (!isMounted) {
      // Default to desktop padding on server/initial render
      return cn(
        showHeader ? 'pt-16' : 'pt-0',
        showSidebar ? 'pl-0 lg:pl-[72px]' : 'pl-0'
      );
    }

    if (isMobile) {
      return cn(
        showHeader ? 'pt-16' : 'pt-0',
        showBottomBar ? 'pb-20' : 'pb-0'
      );
    }
    if (isTablet) {
      return cn(
        showHeader ? 'pt-16' : 'pt-0',
        showSidebar ? 'pl-[72px]' : 'pl-0'
      );
    }
    // Desktop
    return cn(
      showHeader ? 'pt-16' : 'pt-0',
      showSidebar ? 'pl-0 lg:pl-[72px]' : 'pl-0'
    );
  };

  // If user is not provided, create a minimal fallback user object
  // This ensures type safety while providing a default for unauthenticated states
  // NOTE: Users don't have roles - use isTeacher flag instead
  const createFallbackUser = (): ExtendedUser => ({
    id: '',
    name: 'User',
    email: 'user@example.com',
    image: null,
    isTwoFactorEnabled: false,
    isOAuth: false,
    isTeacher: false,
  });

  const defaultUser: ExtendedUser | (NextAuthUser & {
    isTeacher?: boolean;
    isAffiliate?: boolean;
  }) = user || createFallbackUser();

  return (
    <MobileGestureController
      onSidebarOpen={() => setIsMobileSidebarOpen(true)}
      onQuickAction={handleMobileQuickAction}
      enableEdgeSwipe={isMobile && enableGestures}
      enableBottomBar={isMobile && showBottomBar}
      enablePullToRefresh={enablePullToRefresh}
    >
      <div className="min-h-screen mobile-layout-container">
        {/* Sidebar */}
        {showSidebar && (
          <SmartSidebar
            user={defaultUser}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Header with auto-hide on mobile */}
        {showHeader && (
          <SmartHeader
            user={defaultUser}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            quickActionHandlers={handlers}
            isMobileVisible={true}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            getContentPadding(),
            'transition-all duration-300 ease-in-out',
            contentClassName
          )}
        >
          {children}
        </main>
      </div>
    </MobileGestureController>
  );
}