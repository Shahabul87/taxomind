"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Menu,
  X,
  BookOpenCheck,
  FileText,
  Star,
  LogIn,
  UserPlus,
  GraduationCap,
  Home,
  Bell,
  MessageSquare,
  LogOut,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

// Import search utilities
import { SearchOverlay } from '../components/search-overlay';
import { useSearch } from '../hooks/useSearch';
import { highlightMatches } from '../utils/search-utils';
import { SearchResult } from '../types/header-types';
import { logger } from '@/lib/logger';
import { useTheme } from '@/components/providers/theme-provider';

// Types
interface MobileMiniHeaderProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  } | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * MobileMiniHeader - Enterprise-grade mobile header for devices <480px
 *
 * Features:
 * - Compact design optimized for small screens (320px-480px)
 * - Touch-first interactions with 44px minimum tap targets
 * - Swipe-friendly slide-out menu
 * - Optimized performance with minimal re-renders
 * - Full accessibility support (WCAG AA)
 * - Smooth animations with reduced motion support
 */
export const MobileMiniHeader: React.FC<MobileMiniHeaderProps> = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();

  const isAuthenticated = !!user?.id;
  const dashboardLink = user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/user";

  // Use the custom search hook
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    performSearch,
    clearSearch
  } = useSearch();

  // Navigation items
  const navItems: NavItem[] = [
    { label: 'Home', href: '/', icon: Home, color: 'purple' },
    { label: 'Courses', href: '/courses', icon: BookOpenCheck, color: 'blue' },
    { label: 'Blogs', href: '/blog', icon: FileText, color: 'green' },
    { label: 'Features', href: '/features', icon: Star, color: 'yellow' },
  ];

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Handle navigation
  const handleNavigation = useCallback((href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  }, [router]);

  // Handle search
  const handleSearchClick = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    clearSearch();
  }, [clearSearch]);

  const navigateToResult = useCallback((result: SearchResult) => {
    const path = result.type === 'course' ? `/courses/${result.id}` : `/blog/${result.id}`;
    router.push(path);
    handleCloseSearch();
  }, [router, handleCloseSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      performSearch().catch(err => {
        logger.error("Search error when pressing Enter:", err);
      });
    }
    if (e.key === 'Escape') {
      handleCloseSearch();
    }
  }, [searchQuery, performSearch, handleCloseSearch]);

  return (
    <>
      {/* Compact Header Bar */}
      <header
        className={[
          'fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/95 dark:bg-slate-950/95 shadow-md border-b border-slate-200 dark:border-slate-800'
            : 'bg-white/98 dark:bg-slate-950/98 border-b border-slate-100 dark:border-slate-900'
        ].join(' ')}
        style={{ height: '52px' }}
        role="banner"
      >
        <div className="h-full px-3 flex items-center justify-between">
          {/* Left: Logo (Compact) */}
          <Link
            href="/"
            className="flex items-center gap-1.5 min-w-0 flex-shrink-0"
            aria-label="Taxomind home"
          >
            <div className="relative w-7 h-7 flex-shrink-0 rounded-full overflow-hidden bg-white dark:bg-slate-800">
              <Image
                src="/taxomind-logo.png"
                alt="Taxomind"
                width={28}
                height={28}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 text-transparent bg-clip-text truncate">
              Taxomind
            </span>
          </Link>

          {/* Right: Actions - All icons 44x44px with compact padding */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={handleSearchClick}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:ring-offset-1"
              style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-slate-700 dark:text-gray-300" aria-hidden="true" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:ring-offset-1"
              style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-slate-700 dark:text-gray-300" aria-hidden="true" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 dark:text-gray-300" aria-hidden="true" />
              )}
            </button>

            {/* Notifications (Authenticated only) */}
            {isAuthenticated && (
              <button
                onClick={() => handleNavigation('/notifications')}
                className="relative flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:ring-offset-1"
                style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-700 dark:text-gray-300" aria-hidden="true" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
              </button>
            )}

            {/* Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center p-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-purple-400/60 focus:ring-offset-1 shadow-md"
              style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-white" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5 text-white" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsMenuOpen(false)}
              style={{ top: '52px' }}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-[52px] bottom-0 w-[85vw] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <nav className="flex flex-col h-full">
                {/* User Section */}
                {isAuthenticated && user && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30 flex-shrink-0 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || "User"}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-gray-400 truncate">
                          {user.email || 'No email'}
                        </p>
                      </div>
                    </div>

                    {/* Dashboard Button */}
                    <button
                      onClick={() => handleNavigation(dashboardLink)}
                      className="mt-3 w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      style={{ minHeight: '44px' }}
                    >
                      <GraduationCap className="w-4 h-4 inline mr-2" aria-hidden="true" />
                      Dashboard
                    </button>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="flex-1 p-4 space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigation(item.href)}
                      className={[
                        'group w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                        pathname === item.href
                          ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400'
                          : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      ].join(' ')}
                      style={{ minHeight: '44px' }}
                      aria-current={pathname === item.href ? 'page' : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                  ))}

                  {/* AI Features */}
                  <button
                    onClick={() => handleNavigation('/ai-features')}
                    className="group w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/10 dark:to-indigo-950/10 border border-purple-200 dark:border-purple-800/30 text-purple-700 dark:text-purple-400 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-950/20 dark:hover:to-indigo-950/20 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    style={{ minHeight: '44px' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
                      </div>
                      <span className="font-semibold">AI Features</span>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </button>
                </div>

                {/* Auth Section */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        // Trigger logout
                        const logoutEvent = new CustomEvent('trigger-logout');
                        window.dispatchEvent(logoutEvent);
                        setIsMenuOpen(false);
                      }}
                      className="w-full py-3 px-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      style={{ minHeight: '44px' }}
                    >
                      <LogOut className="w-4 h-4 inline mr-2" aria-hidden="true" />
                      Sign Out
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleNavigation('/auth/login')}
                        className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        style={{ minHeight: '44px' }}
                      >
                        <LogIn className="w-4 h-4 inline mr-2" aria-hidden="true" />
                        Sign In
                      </button>
                    </div>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Overlay Component */}
      <SearchOverlay
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchContainerRef={searchContainerRef}
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleKeyDown={handleKeyDown}
        handleCloseSearch={handleCloseSearch}
        isSearching={isSearching}
        searchResults={searchResults}
        searchError={searchError}
        navigateToResult={navigateToResult}
        highlightMatches={highlightMatches}
        performSearch={performSearch}
      />
    </>
  );
};
