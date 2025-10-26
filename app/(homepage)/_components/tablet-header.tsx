'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  LogIn,
  ChevronDown,
  Sparkles,
  Brain,
  Zap,
} from 'lucide-react';

import { HeaderAfterLoginProps, SearchResult } from '../types/header-types';
import { NotificationsPopover } from './notifications-popover';
import { MessagesPopover } from './messages-popover';
import { UserMenu } from './user-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AIFeaturesMegaMenu } from '../components/mega-menu/AIFeaturesMegaMenu';
import { aiFeatureTopics, getAIFeaturesByTopic, aiConceptChips } from '../data/ai-features-data';
import { SearchOverlay } from '../components/search-overlay';
import { useSearch } from '../hooks/useSearch';
import { highlightMatches } from '../utils/search-utils';
import { logger } from '@/lib/logger';

/**
 * Tablet Header Component
 * Optimized for screens 768px - 1023px (md breakpoint)
 *
 * Design Specifications:
 * - Fixed height: 64px (h-16)
 * - Font sizes: text-sm for all nav items, text-lg for logo
 * - Icon sizes: w-5 h-5 (20px)
 * - Spacing: consistent px-6 py-4
 * - Shows some navigation but has dropdown menus for complex items
 */
export const TabletHeader = ({ user }: HeaderAfterLoginProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = !!user?.id;
  const dashboardLink = user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user';

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

  // Search handlers
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
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 backdrop-blur-md ${
          scrolled
            ? 'bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 shadow-md'
            : 'bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="w-full max-w-screen-lg mx-auto px-6">
          {/* Main header container - Fixed height 64px */}
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-white dark:bg-slate-800">
                <Image
                  src="/taxomind-logo.png"
                  alt="Taxomind"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Taxomind
              </span>
            </Link>

            {/* Center Navigation - Visible on tablet */}
            <nav className="flex items-center space-x-6">
              <Link
                href="/courses"
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith('/courses')
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Courses
              </Link>

              <Link
                href="/blog"
                className={`text-sm font-medium transition-colors ${
                  pathname?.startsWith('/blog')
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Blogs
              </Link>

              {/* AI Features Mega Menu */}
              <AIFeaturesMegaMenu
                topics={aiFeatureTopics}
                getContentByTopic={getAIFeaturesByTopic}
                conceptChips={aiConceptChips}
                variant="rich"
                triggerLabel="AI Features"
                panelId="ai-features-tablet-menu"
                hoverDelay={150}
                closeDelay={200}
                maxItems={6}
                currentPathname={pathname || undefined}
                centerOnHover={true}
              />
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Search Icon */}
              <button
                onClick={handleSearchClick}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16" />
    </>
  );
};
