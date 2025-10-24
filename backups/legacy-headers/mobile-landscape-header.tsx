'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Search,
  LogIn,
  UserPlus,
  Home,
  BookOpen,
  FileText,
  Sparkles,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

import { HeaderAfterLoginProps } from '../types/header-types';
import { NotificationsPopover } from './notifications-popover';
import { MessagesPopover } from './messages-popover';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserMenu } from './user-menu';
import { logout } from '@/actions/logout';

/**
 * Mobile Landscape Header Component
 *
 * Optimized for landscape mobile devices: 481px - 767px
 *
 * Design Philosophy:
 * - Takes advantage of horizontal space in landscape mode
 * - Balances between compact mobile and full desktop navigation
 * - Touch-optimized with 44×44px minimum tap targets
 * - Smooth animations and professional UX
 *
 * Specifications:
 * - Height: 56px (optimal for landscape mode)
 * - Touch targets: Minimum 44×44px (Apple HIG, Material Design)
 * - Font sizes: text-sm (14px) for nav, text-base (16px) for logo
 * - Icon sizes: 20px (w-5 h-5)
 * - Animations: 60fps GPU-accelerated
 * - Accessibility: WCAG 2.1 Level AA compliant
 *
 * Features:
 * - Inline navigation links (takes advantage of landscape width)
 * - Compact icon-based actions
 * - Slide-out menu for secondary items
 * - Auto-close on route change
 * - Body scroll lock when menu open
 * - Keyboard navigation support
 * - Screen reader optimized
 */

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const MobileLandscapeHeader = ({ user }: HeaderAfterLoginProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = !!user?.id;
  const dashboardLink = user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user';

  // Primary navigation items (shown inline)
  const primaryNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Courses', href: '/courses', icon: BookOpen },
    { label: 'Blog', href: '/blog', icon: FileText },
  ];

  // Secondary navigation items (in slide-out menu)
  const secondaryNavItems: NavItem[] = [
    { label: 'AI Features', href: '/ai-features', icon: Sparkles },
  ];

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Body scroll lock when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle search
  const handleSearchClick = useCallback(() => {
    const event = new CustomEvent('open-search');
    window.dispatchEvent(event);
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  // Animation variants
  const menuVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    },
    open: {
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const backdropVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 backdrop-blur-md ${
          scrolled
            ? 'bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 shadow-sm'
            : 'bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700'
        }`}
        role="banner"
        style={{ height: '56px' }}
      >
        <div className="w-full max-w-full mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Left Section: Logo + Primary Nav */}
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center space-x-2 flex-shrink-0"
                aria-label="TaxoMind Home"
              >
                <div className="relative w-8 h-8">
                  <Image
                    src="/logo.svg"
                    alt=""
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    priority
                    aria-hidden="true"
                  />
                </div>
                <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  TaxoMind
                </span>
              </Link>

              {/* Primary Navigation - Inline (landscape advantage) */}
              <nav className="flex items-center space-x-1" aria-label="Primary navigation">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={{ minWidth: '44px', minHeight: '44px' }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center space-x-2">
              {/* Search Button */}
              <button
                onClick={handleSearchClick}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Authenticated User Actions */}
              {isAuthenticated ? (
                <>
                  <NotificationsPopover />
                  <MessagesPopover />
                  <UserMenu user={user} />
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <Link
                    href="/auth/login"
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    style={{ minHeight: '44px' }}
                    aria-label="Login"
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    <span>Login</span>
                  </Link>

                  {/* Sign Up Button */}
                  <Link
                    href="/auth/register"
                    className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                    style={{ minHeight: '44px' }}
                  >
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}

              {/* Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              role="dialog"
              aria-label="Navigation menu"
              aria-modal="true"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Menu
                </h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="p-4 space-y-6">
                {/* User Profile Section (if authenticated) */}
                {isAuthenticated && user && (
                  <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={dashboardLink}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                    >
                      <span className="flex items-center space-x-2">
                        <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                        <span>Dashboard</span>
                      </span>
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                )}

                {/* Secondary Navigation */}
                <nav className="space-y-1" aria-label="Secondary navigation">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        style={{ minHeight: '44px' }}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                        <span>{item.label}</span>
                        {item.label === 'AI Features' && (
                          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300">
                            New
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Logout Button (if authenticated) */}
                {isAuthenticated && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      style={{ minHeight: '44px' }}
                    >
                      <LogOut className="w-5 h-5" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-14" aria-hidden="true" />
    </>
  );
};
