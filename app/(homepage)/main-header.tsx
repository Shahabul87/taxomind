"use client"

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Sun,
  Moon,
  Search,
  LogIn,
  UserPlus,
  Menu,
  X
} from 'lucide-react';

// Component imports
import { MobileMenuButton } from './components/mobile-menu-button';
import { NotificationsPopover } from './_components/notifications-popover';
import { MessagesPopover } from './_components/messages-popover';
import { UserMenu } from './_components/user-menu';
import { SearchOverlay } from './components/search-overlay';
import './styles/user-menu.css';

// Types and utils
import { HeaderAfterLoginProps, SearchResult } from './types/header-types';
import { highlightMatches } from './utils/search-utils';
import { useSearch } from './hooks/useSearch';

export const MainHeader = ({ user }: HeaderAfterLoginProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
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

  const dashboardLink = user?.role === "ADMIN" ? "/dashboard/admin" : "/user";
  const isAuthenticated = !!user?.id;

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Optimized effect - only handle click outside for search
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
        console.error("Search error when pressing Enter:", err);
      });
    }
    // If user presses Escape, close search
    if (e.key === 'Escape') {
      handleCloseSearch();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-[90] bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative">
          {/* Subtle header glow effects to match PageBackground */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
          
          <div className="flex justify-between items-center h-16 relative">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 pl-8 md:pl-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-400" />
              <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
                MindForge
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/courses" className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors font-medium">
                Courses
              </Link>
              <Link href="/blog" className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors font-medium">
                Blogs
              </Link>
              <div className="relative group">
                <Link href="/features" className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors font-medium flex items-center space-x-1">
                  <span>Features</span>
                </Link>
              </div>
              <div className="relative group">
                <div className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors font-medium flex items-center space-x-1 cursor-pointer">
                  <span>Solutions</span>
                  <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {/* Invisible bridge to prevent dropdown from disappearing */}
                <div className="absolute top-full left-0 w-64 h-2 opacity-0 group-hover:opacity-100 pointer-events-auto"></div>
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100]">
                  <div className="p-4 space-y-3">
                    <Link href="/solutions" className="block p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="font-medium text-white">For Students</div>
                      <div className="text-sm text-gray-400">Personalized learning paths</div>
                    </Link>
                    <Link href="/solutions" className="block p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="font-medium text-white">For Teachers</div>
                      <div className="text-sm text-gray-400">AI-powered course creation</div>
                    </Link>
                    <Link href="/solutions" className="block p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="font-medium text-white">For Enterprise</div>
                      <div className="text-sm text-gray-400">Scalable learning solutions</div>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors font-medium flex items-center space-x-1 cursor-pointer">
                  <span>AI</span>
                  <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {/* Invisible bridge to prevent dropdown from disappearing */}
                <div className="absolute top-full left-0 w-64 h-2 opacity-0 group-hover:opacity-100 pointer-events-auto"></div>
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto pointer-events-none transition-all duration-300 z-[100]">
                  <div className="p-4 space-y-3 pointer-events-auto">
                    <Link href="/ai-tutor" className="block p-3 rounded-lg hover:bg-slate-700/50 transition-colors pointer-events-auto">
                      <div className="font-medium text-white">AI Tutor</div>
                      <div className="text-sm text-gray-400">Personal AI learning assistant</div>
                    </Link>
                    <Link href="/ai-trends" className="block p-3 rounded-lg hover:bg-slate-700/50 transition-colors pointer-events-auto">
                      <div className="font-medium text-white">AI Trends</div>
                      <div className="text-sm text-gray-400">Latest AI education trends</div>
                    </Link>
                    <Link href="/ai-news" className="block p-3 rounded-lg hover:bg-slate-700/50 transition-colors pointer-events-auto">
                      <div className="font-medium text-white">AI News</div>
                      <div className="text-sm text-gray-400">Breaking AI developments</div>
                    </Link>
                    <Link href="/ai-research" className="block p-3 rounded-lg hover:bg-slate-700/50 transition-colors pointer-events-auto">
                      <div className="font-medium text-white">AI Research</div>
                      <div className="text-sm text-gray-400">Academic papers & insights</div>
                    </Link>
                  </div>
                </div>
              </div>
              <Link href="/resources" className="text-sm lg:text-base text-gray-300 hover:text-white transition-colors font-medium">
                Resources
              </Link>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Search Icon */}
              <button
                onClick={handleSearchIconClick}
                className="p-1.5 md:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
              </button>
              
              {/* Theme Toggle - Fixed hydration */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 md:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Sun className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  )
                ) : (
                  // Render a placeholder that matches the server during hydration
                  <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-400 rounded animate-pulse" />
                )}
              </button>

              {/* Authenticated User Actions */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2 lg:gap-4">
                  <NotificationsPopover />
                  <MessagesPopover />
                  <UserMenu user={user} />
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/auth/login">
                    <motion.div
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Sign In
                    </motion.div>
                  </Link>
                  <Link href="/auth/register">
                    <motion.div 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                    >
                      Start Free Trial
                    </motion.div>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                {isAuthenticated ? (
                  <MobileMenuButton 
                    isOpen={isOpen} 
                    setIsOpen={setIsOpen}
                    dashboardLink={dashboardLink}
                  />
                ) : (
                  <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors text-white"
                    aria-label="Toggle menu"
                  >
                    {isOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu for Unauthenticated Users */}
      {!isAuthenticated && isOpen && (
        <div className="fixed top-16 left-0 right-0 w-full md:hidden overflow-hidden z-40 shadow-lg bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="px-4 py-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col items-center space-y-3">
              <Link href="/courses" className="text-gray-300 hover:text-white transition-colors text-center w-full">
                Courses
              </Link>
              <Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-center w-full">
                Blogs
              </Link>
              <Link href="/features" className="text-gray-300 hover:text-white transition-colors text-center w-full">
                Features
              </Link>
              <Link href="/solutions" className="text-gray-300 hover:text-white transition-colors text-center w-full">
                Solutions
              </Link>
              <div className="w-full">
                <div className="font-medium text-gray-100 mb-2">AI Tools</div>
                <div className="space-y-2 pl-4">
                  <Link href="/ai-tutor" className="block text-gray-300 hover:text-white transition-colors">
                    AI Tutor
                  </Link>
                  <Link href="/ai-trends" className="block text-gray-300 hover:text-white transition-colors">
                    AI Trends
                  </Link>
                  <Link href="/ai-news" className="block text-gray-300 hover:text-white transition-colors">
                    AI News
                  </Link>
                  <Link href="/ai-research" className="block text-gray-300 hover:text-white transition-colors">
                    AI Research
                  </Link>
                </div>
              </div>
              <Link href="/resources" className="text-gray-300 hover:text-white transition-colors text-center w-full">
                Resources
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors text-center w-full">
                About
              </Link>
              <div className="flex flex-col items-center space-y-3 pt-3 border-slate-700/50 border-t w-full">
                <Link href="/auth/login" className="w-full max-w-[200px]">
                  <motion.div className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-colors w-full">
                    <LogIn className="w-4 h-4" />
                    <span className="font-medium">Login</span>
                  </motion.div>
                </Link>
                <Link href="/auth/register" className="w-full max-w-[200px]">
                  <motion.div className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-purple-500/30 text-white transition-colors w-full">
                    <UserPlus className="w-4 h-4" />
                    <span className="font-medium">Sign Up</span>
                  </motion.div>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

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

