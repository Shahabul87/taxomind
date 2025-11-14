'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  MessageSquare,
  Menu,
  X,
  GraduationCap,
  FileText,
  Clock,
  CheckSquare,
  Target,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartBottomBarProps {
  onMenuClick: () => void;
  onQuickAction?: (action: string) => void;
  isVisible?: boolean;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: string;
}

export function SmartBottomBar({
  onMenuClick,
  onQuickAction,
  isVisible = true,
  className,
}: SmartBottomBarProps) {
  const pathname = usePathname();
  const [isFabExpanded, setIsFabExpanded] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      href: '/dashboard',
    },
    {
      id: 'courses',
      label: 'Learn',
      icon: BookOpen,
      href: '/teacher/courses',
    },
    {
      id: 'fab',
      label: 'Add',
      icon: Plus,
    },
    {
      id: 'messages',
      label: 'Chat',
      icon: MessageSquare,
      href: '/messages',
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
    },
  ];

  const fabActions = [
    { icon: GraduationCap, label: 'Course Plan', action: 'course-plan', color: 'from-indigo-500 to-violet-500' },
    { icon: FileText, label: 'Blog Plan', action: 'blog-plan', color: 'from-cyan-500 to-blue-500' },
    { icon: Clock, label: 'Session', action: 'session', color: 'from-emerald-500 to-teal-500' },
    { icon: CheckSquare, label: 'Todo', action: 'todo', color: 'from-purple-500 to-pink-500' },
    { icon: Target, label: 'Goal', action: 'goal', color: 'from-orange-500 to-red-500' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'menu') {
      onMenuClick();
    } else if (item.id === 'fab') {
      setIsFabExpanded(!isFabExpanded);
    }
  };

  const handleFabAction = (action: string) => {
    setIsFabExpanded(false);
    onQuickAction?.(action);
  };

  return (
    <>
      {/* FAB Actions Overlay */}
      <AnimatePresence>
        {isFabExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFabExpanded(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />

            {/* FAB Actions */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 lg:hidden">
              {fabActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.action}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      y: -(index * 60),
                      scale: 1,
                    }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 400,
                      damping: 17,
                    }}
                    onClick={() => handleFabAction(action.action)}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                  >
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full shadow-lg px-4 py-3 whitespace-nowrap">
                      <div className={cn(
                        'p-2 rounded-full bg-gradient-to-r text-white',
                        action.color
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white pr-2">
                        {action.label}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-30 lg:hidden',
              'bg-white/95 dark:bg-slate-800/95 backdrop-blur-md',
              'border-t border-slate-200/50 dark:border-slate-700/50',
              'pb-safe', // For iOS safe area
              className
            )}
          >
            <div className="flex items-center justify-around h-16 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href ? isActiveLink(item.href) : false;
                const isFab = item.id === 'fab';

                if (isFab) {
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleNavClick(item)}
                      className="relative"
                    >
                      <motion.div
                        animate={{ rotate: isFabExpanded ? 45 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          'p-3 rounded-full',
                          'bg-gradient-to-r from-blue-500 to-indigo-500',
                          'text-white shadow-lg',
                          '-mt-6' // Elevate FAB
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </motion.div>
                    </motion.button>
                  );
                }

                const content = (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => !item.href && handleNavClick(item)}
                    className={cn(
                      'flex flex-col items-center justify-center',
                      'py-2 px-3 rounded-lg',
                      'transition-colors duration-200',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn(
                        'h-5 w-5 mb-1',
                        isActive && 'animate-pulse'
                      )} />
                      {isActive && (
                        <motion.div
                          layoutId="bottomActiveIndicator"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"
                        />
                      )}
                    </div>
                    <span className="text-xs font-medium">
                      {item.label}
                    </span>
                  </motion.div>
                );

                if (item.href) {
                  return (
                    <Link key={item.id} href={item.href}>
                      {content}
                    </Link>
                  );
                }

                return <div key={item.id}>{content}</div>;
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}