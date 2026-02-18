'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

// Memoized nav items — never recreated between renders
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home, href: '/dashboard/user' },
  { id: 'courses', label: 'Learn', icon: BookOpen, href: '/teacher/courses' },
  { id: 'messages', label: 'Chat', icon: MessageSquare, href: '/dashboard/user/messages' },
  { id: 'menu', label: 'Menu', icon: Menu },
];

export function SmartBottomBar({
  onMenuClick,
  isVisible = true,
  className,
}: SmartBottomBarProps) {
  const pathname = usePathname();

  // Memoize active link calculation — only changes on navigation
  const activeId = useMemo(() => {
    for (const item of NAV_ITEMS) {
      if (!item.href) continue;
      if (item.href === '/dashboard/user' || item.href === '/dashboard') {
        if (pathname === item.href) return item.id;
      } else if (pathname.startsWith(item.href)) {
        return item.id;
      }
    }
    return null;
  }, [pathname]);

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'menu') {
      onMenuClick();
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar — CSS transition replaces framer-motion spring */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-30 lg:hidden',
          'bg-white dark:bg-slate-800',
          'border-t border-slate-200/50 dark:border-slate-700/50',
          'pb-safe',
          'transition-transform duration-300 ease-out',
          isVisible ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;

            const content = (
              <div
                onClick={() => !item.href && handleNavClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'py-2 px-3 rounded-lg',
                  'transition-colors duration-200',
                  'active:scale-95 transition-transform',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 mb-1" />
                  {isActive && (
                    <div
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </div>
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </div>
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
      </nav>
    </>
  );
}
