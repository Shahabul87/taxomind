'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  MessageSquare,
  Menu,
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

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      href: '/dashboard/user',
    },
    {
      id: 'courses',
      label: 'Learn',
      icon: BookOpen,
      href: '/teacher/courses',
    },
    {
      id: 'messages',
      label: 'Chat',
      icon: MessageSquare,
      href: '/dashboard/user/messages',
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/dashboard/user' || href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'menu') {
      onMenuClick();
    }
  };

  return (
    <>
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
                      <Icon className="h-5 w-5 mb-1" />
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