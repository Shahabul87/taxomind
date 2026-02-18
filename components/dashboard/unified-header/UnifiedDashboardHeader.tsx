'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu } from 'lucide-react';
import type { User as NextAuthUser } from 'next-auth';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useViewportHeight } from '@/hooks/useViewportHeight';

// Components
import { BrandSection } from './components/BrandSection';
import { TabNavigation, type DashboardView } from './components/TabNavigation';
import { QuickCreateMenu, type QuickActionHandlers } from './components/QuickCreateMenu';
import { UserMenuDropdown } from './components/UserMenuDropdown';

// SAM Components - Presence and Notifications
import { LearningNotificationBell } from '@/app/dashboard/user/_components/learning-command-center/notifications';
import { PresenceIndicator, StudyStatusBadge } from '@/components/sam/presence';

interface UnifiedDashboardHeaderProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  // Tab Navigation
  activeTab: DashboardView;
  onTabChange: (tab: DashboardView) => void;
  // Quick Actions
  quickActionHandlers?: QuickActionHandlers;
  // Mobile Controls
  onMobileSidebarOpen?: () => void;
  // Visibility Control
  autoHideOnScroll?: boolean;
}

export function UnifiedDashboardHeader({
  user,
  activeTab,
  onTabChange,
  quickActionHandlers,
  onMobileSidebarOpen,
  autoHideOnScroll = true,
}: UnifiedDashboardHeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Mobile auto-hide functionality
  const { scrollDirection, scrollY, isAtTop, isNearTop } = useScrollDirection();
  const { isMobile } = useViewportHeight();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-hide header on mobile based on scroll
  useEffect(() => {
    if (!isMobile || !autoHideOnScroll) {
      setIsHeaderVisible(true);
      return;
    }

    if (isAtTop || isNearTop) {
      setIsHeaderVisible(true);
      return;
    }

    // scrollY is a ref snapshot — read window.scrollY for the freshest value
    if (scrollDirection === 'down' && window.scrollY > 100) {
      setIsHeaderVisible(false);
    } else if (scrollDirection === 'up' || scrollDirection === 'idle') {
      setIsHeaderVisible(true);
    }
  }, [scrollDirection, isAtTop, isNearTop, isMobile, autoHideOnScroll]);

  // Prevent hydration mismatch: render placeholder until mounted
  if (!isMounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <div className="h-14 lg:pl-[88px]" />
      </header>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isHeaderVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }}
          exit={{ y: -100, opacity: 0, transition: { duration: 0.2 } }}
          className={cn(
            'fixed top-0 left-0 right-0 z-40',
            'border-b border-slate-200/50 dark:border-slate-700/50',
            'backdrop-blur-md',
            isMobile && isNearTop
              ? 'bg-white/60 dark:bg-slate-800/60'
              : 'bg-white/95 dark:bg-slate-800/95'
          )}
        >
          <div className="lg:pl-[88px] px-3 sm:px-4 lg:px-6">
            {/* Single Row - Brand, Tabs, Actions */}
            <div className="flex items-center justify-between h-14 gap-4">
              {/* Left Section - Brand */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Mobile Menu Button */}
                <button
                  onClick={onMobileSidebarOpen}
                  className="lg:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <BrandSection showText={!isMobile} />
              </div>

              {/* Center Section - Tab Navigation */}
              <TabNavigation
                activeTab={activeTab}
                onTabChange={onTabChange}
                className="flex-1 max-w-3xl"
              />

              {/* Right Section - Action Group */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Search Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSearch(!showSearch)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'text-slate-600 dark:text-slate-300',
                    'hover:bg-slate-100 dark:hover:bg-slate-700/50',
                    'border border-slate-200 dark:border-slate-700'
                  )}
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </motion.button>

                {/* Quick Create - More visible styling */}
                <QuickCreateMenu handlers={quickActionHandlers} />

                {/* Study Status - Desktop Only */}
                <div className="hidden md:block">
                  <StudyStatusBadge compact />
                </div>

                {/* Unified Notification Bell */}
                <LearningNotificationBell />

                {/* Presence Indicator - Desktop Only */}
                <div className="hidden sm:block">
                  <PresenceIndicator asBadge />
                </div>

                {/* User Menu */}
                <UserMenuDropdown user={user} />
              </div>
            </div>
          </div>

          {/* Search Bar - Expanded - Desktop Only */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-slate-100 dark:border-slate-700/50"
              >
                <div className="px-4 lg:pl-[88px] py-3">
                  <div className="relative max-w-2xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search courses, articles, or resources..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      )}
    </AnimatePresence>
  );
}

// Re-export types
export type { DashboardView, QuickActionHandlers };
