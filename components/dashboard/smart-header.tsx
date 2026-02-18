'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import {
  Search,
  Settings,
  LogOut,
  User,
  MessageSquare,
  HelpCircle,
  Plus,
  Grid3x3,
  List,
  CheckSquare,
  Target,
  Clock,
  Sparkles,
  X,
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  BarChart3,
  FileText,
  Award,
} from 'lucide-react';
import { LearningNotificationBell } from '@/app/dashboard/user/_components/learning-command-center/notifications';
import { PresenceIndicator, StudyStatusBadge } from '@/components/sam/presence';
import { signOut } from 'next-auth/react';
import type { User as NextAuthUser } from 'next-auth';
import { cn } from '@/lib/utils';

interface SmartHeaderProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  quickActionHandlers?: {
    onCreateStudyPlan: () => void;
    onCreateCoursePlan: () => void;
    onCreateBlogPlan: () => void;
    onScheduleSession: () => void;
    onAddTodo: () => void;
    onSetGoal: () => void;
  };
  isMobileVisible?: boolean;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  onClick: () => void;
}

export function SmartHeader({
  user,
  viewMode = 'list',
  onViewModeChange,
  quickActionHandlers,
  isMobileVisible = true,
}: SmartHeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  // Mobile auto-hide functionality
  const { scrollDirection, scrollY, isAtTop, isNearTop } = useScrollDirection();
  const { isMobile } = useViewportHeight();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isPulledDown, setIsPulledDown] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-hide header on mobile based on scroll
  useEffect(() => {
    if (!isMobile) {
      setIsHeaderVisible(true);
      return;
    }

    // Always show header when at top or near top
    if (isAtTop || isNearTop) {
      setIsHeaderVisible(true);
      return;
    }

    // Hide on scroll down (with a threshold), always show on scroll up
    // scrollY is a ref snapshot — read window.scrollY for the freshest value
    if (scrollDirection === 'down' && window.scrollY > 100) {
      setIsHeaderVisible(false);
    } else if (scrollDirection === 'up' || scrollDirection === 'idle') {
      setIsHeaderVisible(true);
    }
  }, [scrollDirection, isAtTop, isNearTop, isMobile]);

  // Quick action items
  const quickActions: QuickAction[] = [
    {
      icon: BookOpen,
      label: 'Create Study Plan',
      description: 'AI-powered learning schedule',
      gradient: 'from-blue-500 to-indigo-500',
      onClick: () => {
        setIsQuickCreateOpen(false);
        quickActionHandlers?.onCreateStudyPlan();
      },
    },
    {
      icon: GraduationCap,
      label: 'Create Course Plan',
      description: 'Plan your course structure',
      gradient: 'from-indigo-500 to-violet-500',
      onClick: () => {
        setIsQuickCreateOpen(false);
        quickActionHandlers?.onCreateCoursePlan();
      },
    },
    {
      icon: FileText,
      label: 'Create Blog Plan',
      description: 'Organize your blog content',
      gradient: 'from-cyan-500 to-blue-500',
      onClick: () => {
        setIsQuickCreateOpen(false);
        quickActionHandlers?.onCreateBlogPlan();
      },
    },
    {
      icon: Clock,
      label: 'Schedule Session',
      description: 'Sync with Google Calendar',
      gradient: 'from-emerald-500 to-teal-500',
      onClick: () => {
        setIsQuickCreateOpen(false);
        quickActionHandlers?.onScheduleSession();
      },
    },
    {
      icon: CheckSquare,
      label: 'Add Todo',
      description: 'Quick task management',
      gradient: 'from-purple-500 to-pink-500',
      onClick: () => {
        setIsQuickCreateOpen(false);
        quickActionHandlers?.onAddTodo();
      },
    },
    {
      icon: Target,
      label: 'Set Goal',
      description: 'Track your progress',
      gradient: 'from-orange-500 to-red-500',
      onClick: () => {
        setIsQuickCreateOpen(false);
        quickActionHandlers?.onSetGoal();
      },
    },
  ];

  // Determine final visibility
  const shouldShowHeader = isMobileVisible && (isHeaderVisible || isPulledDown || !isMobile);

  // Prevent hydration mismatch: render placeholder until mounted
  if (!isMounted) {
    return (
      <header
        className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md bg-white/95 dark:bg-slate-800/95"
      >
        <div className="h-full pl-4 lg:pl-[88px] pr-4 sm:pr-6 lg:pr-8" />
      </header>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {shouldShowHeader && (
        <motion.header
          initial={{ y: -80, opacity: 0, scale: 0.95 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.4,
              opacity: { duration: 0.2 }
            }
          }}
          exit={{
            y: -80,
            opacity: 0,
            scale: 0.95,
            transition: {
              duration: 0.2,
              ease: "easeIn"
            }
          }}
          className={cn(
            "fixed top-0 left-0 right-0 z-40 h-16",
            "border-b border-slate-200/50 dark:border-slate-700/50",
            "backdrop-blur-md",
            isMobile && isNearTop
              ? "bg-white/60 dark:bg-slate-800/60"
              : "bg-white/95 dark:bg-slate-800/95"
          )}
          suppressHydrationWarning
        >
          <div className="h-full pl-4 lg:pl-[88px] pr-4 sm:pr-6 lg:pr-8">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: 0.15,
                  duration: 0.3,
                  ease: "easeOut"
                }
              }}
              className="flex h-16 items-center justify-between"
            >
              {/* Left: Logo */}
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white dark:bg-slate-900 shadow-md ring-2 ring-purple-500/20">
                    <Image
                      src="/taxomind-logo.png"
                      alt="Taxomind Logo"
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  <span className="hidden lg:inline-block text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    TaxoMind
                  </span>
                </Link>

                {/* Quick Navigation - Desktop Only */}
                <nav className="hidden md:flex items-center gap-1 lg:ml-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/courses"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Courses
                  </Link>
                  {user.isTeacher && (
                    <Link
                      href="/teacher/courses"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      My Courses
                    </Link>
                  )}
                </nav>
              </div>

              {/* Center: View Mode Toggle - Mobile Only */}
              {onViewModeChange && (
                <div className="lg:hidden flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-0.5">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onViewModeChange('grid')}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200',
                      viewMode === 'grid'
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    )}
                    aria-label="Grid View"
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onViewModeChange('list')}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200',
                      viewMode === 'list'
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    )}
                    aria-label="List View"
                  >
                    <List className="h-5 w-5" />
                  </motion.button>
                </div>
              )}

              {/* Right: Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Quick Create Plus Button */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                    className={cn(
                      'p-2 rounded-lg transition-all duration-200',
                      'bg-blue-50 dark:bg-blue-500/10',
                      'hover:bg-blue-100 dark:hover:bg-blue-500/20',
                      'text-blue-600 dark:text-blue-400'
                    )}
                    aria-label="Quick Create"
                  >
                    <Plus className="h-5 w-5" />
                  </motion.button>

                  {/* Quick Create Menu */}
                  <AnimatePresence>
                    {isQuickCreateOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-xl z-50"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              Quick Create
                            </h3>
                            <button
                              onClick={() => setIsQuickCreateOpen(false)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            {quickActions.map((action, index) => {
                              const Icon = action.icon;
                              return (
                                <motion.button
                                  key={action.label}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={action.onClick}
                                  className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-xl',
                                    'bg-slate-50 dark:bg-slate-700/50',
                                    'hover:bg-slate-100 dark:hover:bg-slate-700',
                                    'transition-all duration-200',
                                    'border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'p-2 rounded-lg bg-gradient-to-r',
                                      action.gradient
                                    )}
                                  >
                                    <Icon className="h-4 w-4 text-white" />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                      {action.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {action.description}
                                    </p>
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* View Mode Toggle - Desktop Only */}
                {onViewModeChange && (
                  <div className="hidden lg:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-0.5">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onViewModeChange('grid')}
                      className={cn(
                        'p-2 rounded-lg transition-all duration-200',
                        viewMode === 'grid'
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      )}
                      aria-label="Grid View"
                    >
                      <Grid3x3 className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onViewModeChange('list')}
                      className={cn(
                        'p-2 rounded-lg transition-all duration-200',
                        viewMode === 'list'
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      )}
                      aria-label="List View"
                    >
                      <List className="h-5 w-5" />
                    </motion.button>
                  </div>
                )}

                {/* Search Button - Desktop Only */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSearch(!showSearch)}
                  className="hidden lg:block p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </motion.button>

                {/* SAM Study Status Badge */}
                <StudyStatusBadge compact />

                {/* Learning Notifications */}
                <LearningNotificationBell />

                {/* SAM Presence Indicator */}
                <PresenceIndicator asBadge />

                {/* User Menu - Icon Only */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    aria-label="User Menu"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </motion.button>

                  {/* User Menu Dropdown */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-80 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-xl z-50 overflow-hidden"
                      >
                        {/* Header with User Info */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200/50 dark:border-slate-700/50">
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || 'User'}
                                  width={48}
                                  height={48}
                                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg ring-2 ring-white dark:ring-slate-700">
                                  {user.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                            </div>

                            {/* User Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                                {user.email}
                              </p>
                              {/* Role Badge */}
                              <div className="flex gap-2 mt-2">
                                {user.role === 'ADMIN' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                    <Sparkles className="h-3 w-3" />
                                    Admin
                                  </span>
                                )}
                                {user.isTeacher && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                                    <GraduationCap className="h-3 w-3" />
                                    Teacher
                                  </span>
                                )}
                                {user.isAffiliate && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                                    <Award className="h-3 w-3" />
                                    Affiliate
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Close Button */}
                            <button
                              onClick={() => setShowUserMenu(false)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                            </button>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {[
                            { href: '/profile', icon: User, label: 'My Profile', description: 'View and edit profile' },
                            { href: '/settings', icon: Settings, label: 'Settings', description: 'Preferences & privacy' },
                            { href: '/dashboard/user/messages', icon: MessageSquare, label: 'Messages', description: 'Inbox and chats' },
                            { href: '/help', icon: HelpCircle, label: 'Help Center', description: 'Get support' },
                          ].map((item, index) => {
                            const Icon = item.icon;
                            return (
                              <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                <Link
                                  href={item.href}
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group"
                                >
                                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                                    <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                      {item.label}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {item.description}
                                    </p>
                                  </div>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Sign Out Section */}
                        <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-2 bg-slate-50 dark:bg-slate-900/50">
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all w-full group"
                          >
                            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 group-hover:bg-red-200 dark:group-hover:bg-red-500/30 transition-colors">
                              <LogOut className="h-4 w-4" />
                            </div>
                            <span>Sign Out</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Search Bar - Expanded - Desktop Only */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 pt-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search courses, articles, or resources..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
