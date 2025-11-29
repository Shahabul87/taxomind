'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  FileText,
  Award,
  MessageSquare,
  Heart,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Home,
  Video,
  Newspaper,
  User,
  Briefcase,
  Microscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as NextAuthUser } from 'next-auth';

interface SmartSidebarProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  roles?: string[];
  submenu?: { label: string; href: string }[];
}

export function SmartSidebar({ user, isMobileOpen = false, onMobileClose }: SmartSidebarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const pathname = usePathname();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch unread messages count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/unread/count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add cache control to ensure fresh data
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadMessagesCount(data.count || 0);
        } else if (response.status === 401) {
          // User is not authenticated, silently fail
          setUnreadMessagesCount(0);
        } else {
          // Other errors, log but don't crash
          console.warn('Failed to fetch unread count, status:', response.status);
          setUnreadMessagesCount(0);
        }
      } catch (error) {
        // Network error or server not available - fail silently
        // This prevents errors when dev server is not running
        setUnreadMessagesCount(0);
      }
    };

    // Only fetch if we're in a browser environment
    if (typeof window !== 'undefined') {
      fetchUnreadCount();

      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  // Comprehensive navigation items based on existing sidebar
  const navigationItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard',
      icon: LayoutDashboard,
      roles: ['all'],
    },
    {
      label: 'My Plans',
      href: '/my-plan',
      icon: Briefcase,
      roles: ['all'],
    },
    {
      label: 'Profile Manager',
      href: '/profile',
      icon: User,
      roles: ['all'],
    },
    {
      label: 'Courses',
      icon: BookOpen,
      roles: ['all'],
      submenu: [
        { label: 'My Courses', href: '/my-courses' },
        { label: 'All Courses', href: '/teacher/courses' },
        { label: 'Create Course', href: '/teacher/create' },
      ],
    },
    {
      label: 'Posts & Blog',
      icon: Newspaper,
      roles: ['all'],
      submenu: [
        { label: 'My Posts', href: '/teacher/posts/all-posts' },
        { label: 'Browse Posts', href: '/blog' },
        { label: 'Create Post', href: '/teacher/posts/create-post' },
      ],
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['all'],
    },
    {
      label: 'Depth Analyzer',
      href: '/teacher/depth-analyzer',
      icon: Microscope,
      roles: ['all'],
    },
    {
      label: 'Study Groups',
      href: '/groups',
      icon: Users,
      roles: ['all'],
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? String(unreadMessagesCount) : undefined,
      roles: ['all'],
    },
    {
      label: 'Certificates',
      href: '/certificates',
      icon: Award,
      roles: ['all'],
    },
    {
      label: 'Favorites',
      href: '/favorites',
      icon: Heart,
      roles: ['all'],
    },
  ];

  const bottomNavigationItems: NavItem[] = [
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['all'],
    },
    {
      label: 'Help & Support',
      href: '/support',
      icon: HelpCircle,
      roles: ['all'],
    },
  ];

  // Filter navigation items based on user role
  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.roles?.includes('all')) return true;
      if (item.roles?.includes('teacher') && user.isTeacher) return true;
      if (item.roles?.includes('affiliate') && user.isAffiliate) return true;
      return false;
    });
  };

  const filteredNavItems = filterByRole(navigationItems);
  const filteredBottomItems = filterByRole(bottomNavigationItems);

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Prevent hydration mismatch: render placeholder until mounted
  if (!isMounted) {
    return (
      <>
        {/* Desktop sidebar placeholder - matches final structure */}
        <aside
          className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 z-30"
          style={{ width: 72 }}
        />
      </>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onMobileClose}
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
            className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200/50 dark:border-slate-700/50 z-50 overflow-hidden"
          >
            {/* Mobile Sidebar Content */}
            <div className="flex flex-col h-full">
              {/* Main Navigation */}
              <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-1 px-3">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href ? isActiveLink(item.href) : false;

                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isSubmenuActive = activeSubmenu === item.label;

                    return (
                      <div key={item.label}>
                        {/* Main Item */}
                        {item.href ? (
                          <Link href={item.href} onClick={onMobileClose}>
                            <motion.div
                              whileHover={{ x: 4 }}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group',
                                isActive
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                              )}
                            >
                              <div className="flex-shrink-0">
                                <Icon
                                  className={cn(
                                    'h-5 w-5',
                                    isActive
                                      ? 'text-white'
                                      : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                                  )}
                                />
                              </div>

                              <div className="flex items-center justify-between flex-1 overflow-hidden">
                                <span className="text-sm font-medium whitespace-nowrap">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                                    {item.badge}
                                  </span>
                                )}
                              </div>

                              {isActive && (
                                <motion.div
                                  layoutId="mobileActiveIndicator"
                                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"
                                />
                              )}
                            </motion.div>
                          </Link>
                        ) : (
                          <motion.div
                            whileHover={{ x: 4 }}
                            onClick={() => setActiveSubmenu(isSubmenuActive ? null : item.label)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group',
                              isSubmenuActive
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            )}
                          >
                            <div className="flex-shrink-0">
                              <Icon
                                className={cn(
                                  'h-5 w-5',
                                  isSubmenuActive
                                    ? 'text-white'
                                    : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                                )}
                              />
                            </div>

                            <div className="flex items-center justify-between flex-1 overflow-hidden">
                              <span className="text-sm font-medium whitespace-nowrap">
                                {item.label}
                              </span>
                              {hasSubmenu && (
                                <motion.div
                                  animate={{ rotate: isSubmenuActive ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Submenu */}
                        {hasSubmenu && (
                          <AnimatePresence>
                            {isSubmenuActive && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden mt-1"
                              >
                                {item.submenu?.map((subItem, subIndex) => {
                                  const isSubActive = pathname === subItem.href;
                                  return (
                                    <Link
                                      key={subIndex}
                                      href={subItem.href}
                                      onClick={onMobileClose}
                                    >
                                      <motion.div
                                        whileHover={{ x: 4 }}
                                        className={cn(
                                          'flex items-center gap-2 px-3 py-2 ml-8 mr-2 rounded-lg text-sm transition-colors cursor-pointer',
                                          isSubActive
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        )}
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        <span>{subItem.label}</span>
                                      </motion.div>
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    );
                  })}
                </div>
              </nav>

              {/* Bottom Navigation */}
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-3 space-y-1">
                {filteredBottomItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href ? isActiveLink(item.href) : false;

                  if (!item.href) return null;

                  return (
                    <Link key={item.href} href={item.href} onClick={onMobileClose}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group',
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        )}
                      >
                        <div className="flex-shrink-0">
                          <Icon
                            className={cn(
                              'h-5 w-5',
                              isActive
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                            )}
                          />
                        </div>

                        <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        initial={false}
        animate={{
          width: isExpanded ? 256 : 72,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 z-30 overflow-hidden"
        suppressHydrationWarning
      >
        <div className="flex flex-col h-full">
          {/* Main Navigation */}
          <nav
            className={cn(
              'flex-1 py-4',
              isExpanded ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'
            )}
          >
            <div className="space-y-1 px-3">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href ? isActiveLink(item.href) : false;

                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isSubmenuActive = activeSubmenu === item.label;

                return (
                  <div key={item.label}>
                    {/* Main Item */}
                    {item.href ? (
                      <Link href={item.href}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group',
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          )}
                        >
                          <div className="flex-shrink-0">
                            <Icon
                              className={cn(
                                'h-5 w-5',
                                isActive
                                  ? 'text-white'
                                  : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                              )}
                            />
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between flex-1 overflow-hidden"
                              >
                                <span className="text-sm font-medium whitespace-nowrap">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                                    {item.badge}
                                  </span>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"
                            />
                          )}

                          {!isExpanded && (
                            <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                              {item.label}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                            </div>
                          )}
                        </motion.div>
                      </Link>
                    ) : (
                      <motion.div
                        whileHover={{ x: 4 }}
                        onClick={() => setActiveSubmenu(isSubmenuActive ? null : item.label)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group',
                          isSubmenuActive
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        )}
                      >
                        <div className="flex-shrink-0">
                          <Icon
                            className={cn(
                              'h-5 w-5',
                              isSubmenuActive
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                            )}
                          />
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-between flex-1 overflow-hidden"
                            >
                              <span className="text-sm font-medium whitespace-nowrap">
                                {item.label}
                              </span>
                              {hasSubmenu && (
                                <motion.div
                                  animate={{ rotate: isSubmenuActive ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!isExpanded && (
                          <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                            {item.label}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Submenu */}
                    {hasSubmenu && isExpanded && (
                      <AnimatePresence>
                        {isSubmenuActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-1"
                          >
                            {item.submenu?.map((subItem, subIndex) => {
                              const isSubActive = pathname === subItem.href;
                              return (
                                <Link key={subIndex} href={subItem.href}>
                                  <motion.div
                                    whileHover={{ x: 4 }}
                                    className={cn(
                                      'flex items-center gap-2 px-3 py-2 ml-8 mr-2 rounded-lg text-sm transition-colors cursor-pointer',
                                      isSubActive
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    )}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    <span>{subItem.label}</span>
                                  </motion.div>
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-3 space-y-1">
            {filteredBottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href ? isActiveLink(item.href) : false;

              if (!item.href) return null;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative group',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    )}
                  >
                    <div className="flex-shrink-0">
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          isActive
                            ? 'text-white'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                        )}
                      />
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                      </div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Expand/Collapse Indicator */}
          <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-3">
            <div className="flex items-center justify-center">
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-slate-400 dark:text-slate-600"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
