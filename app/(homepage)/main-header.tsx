"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import {
  BookOpen,
  Search,
  LogIn,
} from 'lucide-react';

// Component imports
import { NotificationsPopover } from './_components/notifications-popover';
import { MessagesPopover } from './_components/messages-popover';
import { UserMenu } from './_components/user-menu';
import { SearchOverlay } from './components/search-overlay';
import { LogoutButton } from '@/components/auth/logout-button';
import './styles/user-menu.css';
import { useTheme } from '@/components/providers/theme-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { IconButton } from '@/components/ui/icon-button';
import { AIFeaturesMegaMenu } from './components/mega-menu/AIFeaturesMegaMenu';
import { AIFeaturesMobileSheet } from './components/mega-menu/AIFeaturesMobileSheet';
import { aiFeatureTopics, getAIFeaturesByTopic, aiConceptChips, aiFeaturesByTopic } from './data/ai-features-data';

// Types and utils
import { HeaderAfterLoginProps, SearchResult } from './types/header-types';
import { highlightMatches } from './utils/search-utils';
import { useSearch } from './hooks/useSearch';

export const MainHeader = ({ user }: HeaderAfterLoginProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAIFeaturesMobileSheet, setShowAIFeaturesMobileSheet] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  
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

  const dashboardLink = user?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/user";
  const isAuthenticated = !!user?.id;

  // Handle hydration and scroll detection
  useEffect(() => {
    setMounted(true);

    // Scroll-aware header styling
    const onScroll = () => {
      setScrolled(window.scrollY > 6);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Handle click outside for search
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        clearSearch();
      }
    };

    // Focus input when search is opened
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen, clearSearch]);


  // Command palette hotkey (Cmd/Ctrl + K)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Check if e.key exists before calling toLowerCase() to prevent undefined errors
      const isK = e.key?.toLowerCase() === 'k';
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearchIconClick = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    clearSearch();
  };

  const navigateToResult = (result: SearchResult) => {
    const path = result.type === 'course' ? `/courses/${result.id}` : `/blog/${result.id}`;
    router.push(path);
    handleCloseSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If user presses Enter, perform search immediately
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      performSearch().catch(err => {
        logger.error("Search error when pressing Enter:", err);
      });
    }
    // If user presses Escape, close search
    if (e.key === 'Escape') {
      handleCloseSearch();
    }
  };

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300',
          'backdrop-blur-md',
          scrolled
            ? 'bg-white/85 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800/70 shadow-[0_10px_30px_-10px_rgba(2,6,23,0.2)] dark:shadow-[0_10px_30px_-10px_rgba(2,6,23,0.6)]'
            : 'bg-white/95 dark:bg-gradient-to-r dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 border-b border-slate-200 dark:border-slate-700/50'
        ].join(' ')}
        aria-label="Primary"
        suppressHydrationWarning
      >
        {/* Skip to content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[1000] focus:px-3 focus:py-2 focus:rounded-md focus:bg-white focus:text-slate-900 dark:focus:bg-slate-900 dark:focus:text-white border border-slate-200 dark:border-slate-700 shadow-md"
        >
          Skip to content
        </a>
        <div className="w-full max-w-full sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-7xl 2xl:max-w-8xl 3xl:max-w-9xl mx-auto px-3 xs:px-4 sm:px-4 md:px-6 lg:px-8 w-full relative">
          {/* Subtle header glow effects */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
          {/* Animated accent line */}
          <div className="absolute inset-x-0 -bottom-px h-px">
            <div className="w-full h-full bg-[linear-gradient(90deg,rgba(168,85,247,0.35),rgba(99,102,241,0.35),rgba(34,211,238,0.35))] animate-[pulse_4s_ease-in-out_infinite]" />
          </div>

          <div className={[
            'flex justify-between items-center relative transition-all duration-300',
            'h-16'
          ].join(' ')}>
            {/* Logo */}
            <Link href="/" className="group flex items-center space-x-1.5 xs:space-x-2 pl-0 sm:pl-0" suppressHydrationWarning>
              <div className="relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-white dark:bg-slate-800">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <Image
                  src="/taxomind-logo.png"
                  alt="Taxomind"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain relative z-10"
                  priority
                />
              </div>
              <span className="text-xl font-bold transition-all text-slate-900 dark:bg-gradient-to-r dark:from-purple-400 dark:to-blue-400 dark:text-transparent dark:bg-clip-text" suppressHydrationWarning>
                Taxomind
              </span>
              <span className="hidden xs:inline-flex md:inline-flex items-center px-1.5 xs:px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] font-semibold ml-1 bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30" suppressHydrationWarning>
                AI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2 md:space-x-2.5 lg:space-x-5 xl:space-x-8">
              <Link
                href="/courses"
                className={[
                  'group relative text-base font-medium transition-colors',
                  pathname?.startsWith('/courses')
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                ].join(' ')}
                aria-current={pathname?.startsWith('/courses') ? 'page' : undefined}
                suppressHydrationWarning
              >
                Courses
                <span className={[
                  'pointer-events-none absolute -bottom-1 left-0 h-0.5 rounded-full transition-all duration-300',
                  pathname?.startsWith('/courses') ? 'w-full bg-gradient-to-r from-purple-500 to-indigo-500' : 'w-0 group-hover:w-full bg-slate-300/60 dark:bg-slate-500/50'
                ].join(' ')} suppressHydrationWarning />
              </Link>
              <Link
                href="/blog"
                className={[
                  'group relative text-base font-medium transition-colors',
                  pathname?.startsWith('/blog')
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                ].join(' ')}
                aria-current={pathname?.startsWith('/blog') ? 'page' : undefined}
                suppressHydrationWarning
              >
                Blogs
                <span className={[
                  'pointer-events-none absolute -bottom-1 left-0 h-0.5 rounded-full transition-all duration-300',
                  pathname?.startsWith('/blog') ? 'w-full bg-gradient-to-r from-purple-500 to-indigo-500' : 'w-0 group-hover:w-full bg-slate-300/60 dark:bg-slate-500/50'
                ].join(' ')} suppressHydrationWarning />
              </Link>
              {/* AI Features Mega Menu - Replaces Features, Intelligent LMS, and AI Tools */}
              <AIFeaturesMegaMenu
                topics={aiFeatureTopics}
                getContentByTopic={getAIFeaturesByTopic}
                conceptChips={aiConceptChips}
                variant="rich"
                triggerLabel="AI Features"
                panelId="ai-features-desktop-menu"
                hoverDelay={150}
                closeDelay={300}
                maxItems={6}
                currentPathname={pathname || undefined}
                centerOnHover={true}
              />
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 md:space-x-2 lg:space-x-3 xl:space-x-4">
              {/* Theme Toggle (Desktop) */}
              <div className="hidden md:flex">
                <ThemeToggle />
              </div>

              {/* Search Icon */}
              <IconButton
                onClick={handleSearchIconClick}
                variant="default"
                size="sm"
                aria-label="Search"
                className="group xs:min-w-[40px] sm:min-w-[44px]"
              >
                <Search className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
              </IconButton>

              {/* Notifications and Messages (for authenticated users) */}
              {isAuthenticated && (
                <div className="flex items-center space-x-0.5 xs:space-x-1 sm:space-x-2 md:space-x-1 lg:space-x-2">
                  <NotificationsPopover />
                  <MessagesPopover />
                </div>
              )}

              {/* Authenticated User Actions */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-1 md:gap-1 lg:gap-2 xl:gap-3">
                  <UserMenu user={user} />
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2 xl:space-x-3">
                  <Link href="/auth/login">
                    <motion.div
                      className="px-2 xs:px-3 xl:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-medium transition-colors text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Sign In
                    </motion.div>
                  </Link>
                </div>
              )}

              {/* Note: Mobile menu button removed - MainHeader only renders for desktop (≥1280px) 
                  Mobile/tablet devices use dedicated headers via ResponsiveHeaderWrapper */}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Navigation Menu removed - MainHeader only renders for desktop (≥1280px) 
          Mobile/tablet devices (< 1280px) use dedicated responsive headers:
          - MobileMiniHeader (< 480px)
          - MobileLandscapeHeader (480-767px) 
          - TabletHeader (768-1023px)
          - LaptopHeader (1024-1279px)
          All managed by ResponsiveHeaderWrapper component */}

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

      {/* AI Features Mobile Sheet */}
      <AIFeaturesMobileSheet
        isOpen={showAIFeaturesMobileSheet}
        onClose={() => setShowAIFeaturesMobileSheet(false)}
        topics={aiFeatureTopics}
        contentByTopic={aiFeaturesByTopic}
        conceptChips={aiConceptChips}
        onItemClick={() => {
          setShowAIFeaturesMobileSheet(false);
        }}
      />

      {/* Debug info (visible in development only) */}
      {process.env.NODE_ENV === 'development' && searchError && (
        <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900 p-4 rounded-lg shadow-lg z-50">
          <p className="text-red-700 dark:text-red-200 font-medium">Search Error:</p>
          <p className="text-red-600 dark:text-red-300">{searchError}</p>
        </div>
      )}
    </>
  );
};
