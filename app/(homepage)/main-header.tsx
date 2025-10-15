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
  UserPlus,
  Menu,
  X,
  GraduationCap,
  Home,
  BookOpenCheck,
  FileText,
  Star,
  Cpu,
  Brain,
  TrendingUp,
  Newspaper,
  FlaskConical,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Zap,
  Clock,
  Bookmark,
  HelpCircle,
  Keyboard,
  MapPin,
  Activity,
  Loader2,
  LogOut,
  Shield
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

// Types and utils
import { HeaderAfterLoginProps, SearchResult } from './types/header-types';
import { highlightMatches } from './utils/search-utils';
import { useSearch } from './hooks/useSearch';

export const MainHeader = ({ user }: HeaderAfterLoginProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showFavoritesDropdown, setShowFavoritesDropdown] = useState(false);
  const [showAIToolsDropdown, setShowAIToolsDropdown] = useState(false);
  const [showDesktopAIToolsDropdown, setShowDesktopAIToolsDropdown] = useState(false);
  const [showDesktopIntelligentLMSDropdown, setShowDesktopIntelligentLMSDropdown] = useState(false);
  // One-time spotlight for first-time visitors to draw attention
  const [hasSeenDropdownSpotlight, setHasSeenDropdownSpotlight] = useState(true);
  const [showDropdownSpotlight, setShowDropdownSpotlight] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const desktopAIToolsRef = useRef<HTMLDivElement>(null);
  const desktopIntelligentLMSRef = useRef<HTMLDivElement>(null);
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

  // Analytics tracking function
  const trackMobileMenuInteraction = useCallback((action: string, item: string, category: string = 'mobile_menu') => {
    try {
      // Track with analytics service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', action, {
          event_category: category,
          event_label: item,
          user_id: user?.id || 'anonymous',
          user_role: user?.role || 'guest'
        });
      }
      
      // Log for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Mobile Menu Analytics: ${action} - ${item}`, {
          category,
          userId: user?.id,
          userRole: user?.role,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      logger.error('Analytics tracking error:', error);
    }
  }, [user?.id, user?.role]);

  // Enhanced link click handler with analytics
  const handleEnhancedLinkClick = (href: string, label: string) => {
    trackMobileMenuInteraction('navigation_click', label, 'mobile_menu_navigation');
    setIsOpen(false);
    router.push(href);
  };

  // Handle hydration and load professional features
  useEffect(() => {
    setMounted(true);
    // Scroll-aware header styling
    const onScroll = () => {
      setScrolled(window.scrollY > 6);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Load recent items and favorites
    const loadUserData = async () => {
      if (isAuthenticated) {
        setIsLoading(true);
        try {
          // Mock data for recent items
          const mockRecent = [
            { id: '1', title: 'Introduction to AI', href: '/courses/ai-intro', icon: Brain },
            { id: '2', title: 'React Fundamentals', href: '/courses/react-basics', icon: BookOpenCheck },
            { id: '3', title: 'Data Science Blog', href: '/blog/data-science', icon: FileText }
          ];
          
          // Mock data for favorites
          const mockFavorites = [
            { id: '1', title: 'Machine Learning', href: '/courses/ml-course', icon: Brain },
            { id: '2', title: 'Web Development', href: '/courses/web-dev', icon: Cpu }
          ];
          
          setTimeout(() => {
            setRecentItems(mockRecent);
            setFavorites(mockFavorites);
            setIsLoading(false);
          }, 800);
        } catch (error: any) {
          logger.error('Failed to load user data:', error);
          setIsLoading(false);
        }
      }
    };
    
    loadUserData();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [isAuthenticated]);

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

  // Handle click outside for desktop AI Tools dropdown
  useEffect(() => {
    if (!showDesktopAIToolsDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopAIToolsRef.current && 
        !desktopAIToolsRef.current.contains(event.target as Node)
      ) {
        setShowDesktopAIToolsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDesktopAIToolsDropdown]);

  // Handle click outside for desktop Intelligent LMS dropdown
  useEffect(() => {
    if (!showDesktopIntelligentLMSDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopIntelligentLMSRef.current && 
        !desktopIntelligentLMSRef.current.contains(event.target as Node)
      ) {
        setShowDesktopIntelligentLMSDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDesktopIntelligentLMSDropdown]);

  // First-visit spotlight for dropdown menus
  useEffect(() => {
    try {
      const seen = localStorage.getItem('tm_nav_spotlight_seen') === '1';
      setHasSeenDropdownSpotlight(seen);
      if (!seen) {
        setShowDropdownSpotlight(true);
        const t = setTimeout(() => setShowDropdownSpotlight(false), 5000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const dismissDropdownSpotlight = useCallback(() => {
    if (!hasSeenDropdownSpotlight) {
      setHasSeenDropdownSpotlight(true);
      setShowDropdownSpotlight(false);
      try { localStorage.setItem('tm_nav_spotlight_seen', '1'); } catch {}
    }
  }, [hasSeenDropdownSpotlight]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, []);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close menu on escape
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        trackMobileMenuInteraction('keyboard_close', 'escape_key', 'mobile_menu_keyboard');
      }
      
      // Open menu with Alt+M
      if (event.altKey && event.key === 'm' && !isOpen) {
        event.preventDefault();
        setIsOpen(true);
        trackMobileMenuInteraction('keyboard_open', 'alt_m', 'mobile_menu_keyboard');
      }
      
      // Toggle help with Alt+H
      if (event.altKey && event.key === 'h' && isOpen) {
        event.preventDefault();
        setShowHelp(!showHelp);
        trackMobileMenuInteraction('keyboard_help', 'alt_h', 'mobile_menu_keyboard');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showHelp, trackMobileMenuInteraction]);

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

  const handleLinkClick = () => {
    setIsOpen(false);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 w-full relative">
          {/* Subtle header glow effects */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
          {/* Animated accent line */}
          <div className="absolute inset-x-0 -bottom-px h-px">
            <div className="w-full h-full bg-[linear-gradient(90deg,rgba(168,85,247,0.35),rgba(99,102,241,0.35),rgba(34,211,238,0.35))] animate-[pulse_4s_ease-in-out_infinite]" />
          </div>
          
          <div className={[
            'flex justify-between items-center relative transition-all duration-300',
            scrolled ? 'h-12 sm:h-14' : 'h-14 sm:h-16'
          ].join(' ')}>
            {/* Logo */}
            <Link href="/" className="group flex items-center space-x-2 pl-0 sm:pl-0" suppressHydrationWarning>
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <BookOpen className={[
                  'transition-transform duration-300 text-purple-400',
                  scrolled ? 'h-5 w-5 sm:h-5 sm:w-5' : 'h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7'
                ].join(' ')} />
              </div>
              <span className={[
                'font-bold transition-all text-slate-900 dark:bg-gradient-to-r dark:from-purple-400 dark:to-blue-400 dark:text-transparent dark:bg-clip-text',
                scrolled ? 'text-base sm:text-lg md:text-xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl'
              ].join(' ')} suppressHydrationWarning>
                Taxomind
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ml-1 bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30" suppressHydrationWarning>
                AI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 xl:space-x-8">
              <Link
                href="/courses"
                className={[
                  'group relative text-sm xl:text-base font-medium transition-colors',
                  pathname?.startsWith('/courses')
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                ].join(' ')}
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
                  'group relative text-sm xl:text-base font-medium transition-colors',
                  pathname?.startsWith('/blog')
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                ].join(' ')}
                suppressHydrationWarning
              >
                Blogs
                <span className={[
                  'pointer-events-none absolute -bottom-1 left-0 h-0.5 rounded-full transition-all duration-300',
                  pathname?.startsWith('/blog') ? 'w-full bg-gradient-to-r from-purple-500 to-indigo-500' : 'w-0 group-hover:w-full bg-slate-300/60 dark:bg-slate-500/50'
                ].join(' ')} suppressHydrationWarning />
              </Link>
              <div className="relative group">
                <Link href="/features" className="group relative text-sm xl:text-base transition-colors font-medium flex items-center text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white" suppressHydrationWarning>
                  <span>Features</span>
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30" suppressHydrationWarning>
                    New
                  </span>
                  <span className="pointer-events-none absolute -bottom-1 left-0 h-0.5 w-0 rounded-full group-hover:w-full transition-all duration-300 bg-slate-300/60 dark:bg-slate-500/50" suppressHydrationWarning />
                </Link>
              </div>
              <div
                className="relative"
                ref={desktopIntelligentLMSRef}
                onMouseEnter={() => { setShowDesktopIntelligentLMSDropdown(true); dismissDropdownSpotlight(); }}
                onMouseLeave={() => setShowDesktopIntelligentLMSDropdown(false)}
              >
                <button
                  className={[
                    'relative text-sm xl:text-base transition-colors font-medium flex items-center space-x-1',
                    'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white',
                    !hasSeenDropdownSpotlight && showDropdownSpotlight ? 'ring-2 ring-purple-400/40 rounded-md ring-offset-2 ring-offset-transparent' : ''
                  ].join(' ')}
                  aria-expanded={showDesktopIntelligentLMSDropdown}
                  aria-haspopup="true"
                  onFocus={() => { setShowDesktopIntelligentLMSDropdown(true); dismissDropdownSpotlight(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowDesktopIntelligentLMSDropdown((v) => !v);
                      dismissDropdownSpotlight();
                    }
                  }}
                >
                  <span>Intelligent LMS</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDesktopIntelligentLMSDropdown ? 'rotate-180' : ''}`} />
                  {!hasSeenDropdownSpotlight && showDropdownSpotlight && (
                    <motion.span
                      aria-hidden
                      className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_0_6px_rgba(168,85,247,0.15)]"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  )}
                </button>
                
                {/* Desktop Intelligent LMS Dropdown */}
                <AnimatePresence>
                  {showDesktopIntelligentLMSDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-0 mt-3 z-50"
                    >
                      <div className="relative">
                        {/* Gradient frame */}
                        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/50 via-indigo-500/40 to-blue-500/50 opacity-60 blur-md pointer-events-none" />
                        {/* Panel */}
                        <div className="relative w-[720px] max-w-[92vw] backdrop-blur-xl backdrop-saturate-150 rounded-xl shadow-[0_16px_40px_-10px_rgba(2,6,23,0.5)] dark:shadow-[0_20px_50px_-12px_rgba(2,6,23,0.9)] border bg-white/90 dark:bg-slate-900/92 border-slate-200/80 dark:border-slate-700/70 overflow-hidden">
                          {/* Accent line */}
                          <div className="pointer-events-none absolute top-0 inset-x-0 h-0.5 bg-[linear-gradient(90deg,rgba(168,85,247,0.7),rgba(79,70,229,0.7),rgba(14,165,233,0.7))] opacity-80" />
                          {/* Decorative glows */}
                          <div className="pointer-events-none absolute -top-16 -right-20 w-56 h-56 bg-purple-500/20 blur-[90px] rounded-full" />
                          <div className="pointer-events-none absolute -bottom-20 -left-24 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
                          <div className="grid grid-cols-12 gap-3 p-4">
                            {/* Feature card */}
                            <div className="col-span-12 md:col-span-5">
                              <Link
                                href="/intelligent-lms/overview"
                                onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                                className="group relative block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-gradient-to-br from-purple-600/10 via-indigo-600/10 to-blue-600/10 p-4 hover:from-purple-600/15 hover:via-indigo-600/15 hover:to-blue-600/15 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md">
                                    <Sparkles className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Overview</p>
                                    <h3 className="mt-0.5 text-base font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">The Intelligent LMS</h3>
                                    <p className="mt-1 text-sm leading-snug text-slate-700 dark:text-gray-300 line-clamp-2">Adaptive pathways, rigorous evaluation, and AI‑driven course intelligence.</p>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                                  <span>Learn more</span>
                                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                                </div>
                                {/* Subtle shine */}
                                <span className="pointer-events-none absolute -left-1 -top-1 h-[140%] w-24 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] opacity-0 group-hover:opacity-60 translate-x-[-80%] group-hover:translate-x-[220%] transition-transform duration-700" />
                              </Link>
                            </div>
                            {/* Links grid */}
                            <div className="col-span-12 md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Link
                                href="/intelligent-lms/sam-ai-assistant"
                                className="group flex items-start px-4 py-3 rounded-xl transition-all duration-200 transform group-hover:translate-x-0.5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                              >
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shrink-0 mr-3 mt-0.5 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <Brain className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold flex items-center gap-2">SAM — AI Assistant
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">New</span>
                                  </div>
                                  <div className="text-xs mt-0.5 text-slate-600 dark:text-gray-400">Always‑available AI learning support</div>
                                </div>
                              </Link>

                              <Link
                                href="/intelligent-lms/evaluation-standards"
                                className="group flex items-start px-4 py-3 rounded-xl transition-all duration-200 transform group-hover:translate-x-0.5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                              >
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shrink-0 mr-3 mt-0.5 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <Shield className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold">Global Evaluation Standards</div>
                                  <div className="text-xs mt-0.5 text-slate-600 dark:text-gray-400">Aligned with 12+ international frameworks</div>
                                </div>
                              </Link>

                              <Link
                                href="/intelligent-lms/adaptive-learning"
                                className="group flex items-start px-4 py-3 rounded-xl transition-all duration-200 transform group-hover:translate-x-0.5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 dark:hover:from-yellow-900/20 dark:hover:to-amber-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                              >
                                <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg shrink-0 mr-3 mt-0.5 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <Zap className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold">Adaptive Learning</div>
                                  <div className="text-xs mt-0.5 text-slate-600 dark:text-gray-400">Personalized paths and recommendations</div>
                                </div>
                              </Link>

                              <Link
                                href="/intelligent-lms/course-intelligence"
                                className="group flex items-start px-4 py-3 rounded-xl transition-all duration-200 transform group-hover:translate-x-0.5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-sky-50 dark:hover:from-cyan-900/20 dark:hover:to-sky-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                              >
                                <div className="p-2 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-lg shrink-0 mr-3 mt-0.5 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <Activity className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold">Course Intelligence</div>
                                  <div className="text-xs mt-0.5 text-slate-600 dark:text-gray-400">Design, optimize, and analyze courses with AI</div>
                                </div>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div
                className="relative"
                ref={desktopAIToolsRef}
                onMouseEnter={() => { setShowDesktopAIToolsDropdown(true); dismissDropdownSpotlight(); }}
                onMouseLeave={() => setShowDesktopAIToolsDropdown(false)}
              >
                <button
                  className={[
                    'relative text-sm xl:text-base transition-colors font-medium flex items-center space-x-1',
                    'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white',
                    !hasSeenDropdownSpotlight && showDropdownSpotlight ? 'ring-2 ring-purple-400/40 rounded-md ring-offset-2 ring-offset-transparent' : ''
                  ].join(' ')}
                  aria-expanded={showDesktopAIToolsDropdown}
                  aria-haspopup="true"
                  onFocus={() => { setShowDesktopAIToolsDropdown(true); dismissDropdownSpotlight(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowDesktopAIToolsDropdown((v) => !v);
                      dismissDropdownSpotlight();
                    }
                  }}
                >
                  <span>AI Tools</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDesktopAIToolsDropdown ? 'rotate-180' : ''}`} />
                  {!hasSeenDropdownSpotlight && showDropdownSpotlight && (
                    <motion.span
                      aria-hidden
                      className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_0_6px_rgba(168,85,247,0.15)]"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                    />
                  )}
                </button>

                {/* Desktop AI Tools Dropdown */}
                <AnimatePresence>
                  {showDesktopAIToolsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-0 mt-3 z-50"
                    >
                      <div className="relative">
                        {/* Gradient frame */}
                        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/50 via-indigo-500/40 to-blue-500/50 opacity-60 blur-md pointer-events-none" />
                        {/* Panel */}
                        <div className="relative w-[640px] max-w-[92vw] backdrop-blur-xl backdrop-saturate-150 rounded-xl shadow-[0_16px_40px_-10px_rgba(2,6,23,0.5)] dark:shadow-[0_20px_50px_-12px_rgba(2,6,23,0.9)] border bg-white/90 dark:bg-slate-900/92 border-slate-200/80 dark:border-slate-700/70 overflow-hidden">
                          {/* Accent line */}
                          <div className="pointer-events-none absolute top-0 inset-x-0 h-0.5 bg-[linear-gradient(90deg,rgba(79,70,229,0.7),rgba(147,51,234,0.7),rgba(6,182,212,0.7))] opacity-80" />
                          {/* Decorative glows */}
                          <div className="pointer-events-none absolute -top-16 -right-16 w-52 h-52 bg-blue-500/20 blur-[90px] rounded-full" />
                          <div className="pointer-events-none absolute -bottom-20 -left-24 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full" />
                          <div className="grid grid-cols-12 gap-3 p-4">
                            {/* Feature card */}
                            <div className="col-span-12 md:col-span-5">
                              <Link
                                href="/ai-tools"
                                onClick={() => setShowDesktopAIToolsDropdown(false)}
                                className="group relative block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-cyan-600/10 p-4 hover:from-indigo-600/15 hover:via-purple-600/15 hover:to-cyan-600/15 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md">
                                    <Cpu className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">Directory</p>
                                    <h3 className="mt-0.5 text-base font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">AI Tools Directory</h3>
                                    <p className="mt-1 text-sm leading-snug text-slate-700 dark:text-gray-300 line-clamp-2">Curated assistants, market trends, news, and research.</p>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                  <span>View directory</span>
                                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                                </div>
                                <span className="pointer-events-none absolute -left-1 -top-1 h-[140%] w-24 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] opacity-0 group-hover:opacity-60 translate-x-[-80%] group-hover:translate-x-[220%] transition-transform duration-700" />
                              </Link>
                            </div>
                            {/* Links grid */}
                            <div className="col-span-12 md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Link
                                href="/ai-tutor"
                                className="group flex items-start px-4 py-3 rounded-xl transition-all duration-200 transform group-hover:translate-x-0.5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                onClick={() => setShowDesktopAIToolsDropdown(false)}
                              >
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg shrink-0 mr-3 mt-0.5 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <Brain className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold">AI Tutor</div>
                                  <div className="text-xs mt-0.5 text-slate-600 dark:text-gray-400">Personalized AI tutoring</div>
                                </div>
                              </Link>

                              <Link
                                href="/ai-trends"
                                className="group flex items-start px-4 py-3 rounded-xl transition-all duration-200 transform group-hover:translate-x-0.5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                onClick={() => setShowDesktopAIToolsDropdown(false)}
                              >
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shrink-0 mr-3 mt-0.5 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold">AI Trends</div>
                                  <div className="text-xs mt-0.5 text-slate-600 dark:text-gray-400">Industry trends</div>
                                </div>
                              </Link>

                              <Link
                                href="/ai-news"
                                className="group flex items-start px-4 py-3 rounded-xl transition-all duration-200 transform group-hover:translate-x-0.5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                onClick={() => setShowDesktopAIToolsDropdown(false)}
                              >
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shrink-0 mr-3 mt-0.5 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <Newspaper className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold">AI News</div>
                                  <div className="text-xs mt-0.5 text-slate-600 dark:text-gray-400">News and updates</div>
                                </div>
                              </Link>

                              <Link
                                href="/ai-research"
                                className="group flex items-start px-4 py-3 rounded-xl transition-all duration-200 transform group-hover:translate-x-0.5 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-r hover:from-cyan-50 hover:to-sky-50 dark:hover:from-cyan-900/20 dark:hover:to-sky-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                onClick={() => setShowDesktopAIToolsDropdown(false)}
                              >
                                <div className="p-2 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-lg shrink-0 mr-3 mt-0.5 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                  <FlaskConical className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold">AI Research</div>
                                  <div className="text-xs mt-0.5 text-slate-600 dark:text-gray-400">Academic research and papers</div>
                                </div>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
              {/* Search Icon */}
              {/* Theme Toggle (Desktop) */}
              <div className="hidden md:flex">
                <ThemeToggle />
              </div>

              <button
                onClick={handleSearchIconClick}
                className="group relative p-1.5 sm:p-2 rounded-lg transition-colors bg-white/70 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-700 dark:text-gray-300"
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -right-1.5 -bottom-1 hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-200">
                  <kbd className="font-mono">⌘</kbd>
                  <span>K</span>
                </span>
              </button>

              {/* Notifications and Messages (for authenticated users) */}
              {isAuthenticated && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="p-1.5 sm:p-2 rounded-lg transition-colors bg-white/70 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent">
                    <NotificationsPopover />
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg transition-colors bg-white/70 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent">
                    <MessagesPopover />
                  </div>
                </div>
              )}

              {/* Authenticated User Actions */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2 xl:gap-3">
                  <UserMenu user={user} />
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2 xl:space-x-3">
                  <Link href="/auth/login">
                    <motion.div
                      className="px-3 xl:px-4 py-2 text-sm font-medium transition-colors text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Sign In
                    </motion.div>
                  </Link>
                  <Link href="/auth/register">
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="group relative overflow-hidden px-4 xl:px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25 text-sm xl:text-base"
                    >
                      <span className="relative z-10">Sign Up</span>
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent)] group-hover:translate-x-full transition-transform duration-700" />
                    </motion.div>
                  </Link>
                </div>
              )}

              {/* Mobile/Tablet Menu Button (for all users) */}
              <div className="md:hidden flex items-center gap-2">
                <ThemeToggle />
                <button 
                  onClick={() => {
                    const newState = !isOpen;
                    setIsOpen(newState);
                    trackMobileMenuInteraction(
                      newState ? 'menu_open' : 'menu_close', 
                      'menu_button', 
                      'mobile_menu_toggle'
                    );
                  }}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors text-white relative"
                  aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={isOpen}
                  aria-controls="mobile-menu"
                  aria-haspopup="true"
                >
                  {isOpen ? (
                    <X className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  )}
                  {/* Activity indicator */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Navigation Menu - Professional Design */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-14 sm:top-16 left-0 right-0 w-full md:hidden z-55 shadow-2xl"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 backdrop-blur-sm bg-black/20 dark:bg-slate-900/60"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Container */}
            <div
              className="relative backdrop-blur-xl shadow-2xl border-b bg-white/98 dark:bg-gradient-to-b dark:from-slate-900/98 dark:via-slate-800/98 dark:to-slate-900/98 border-slate-200 dark:border-slate-700/50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
            >
              {/* Subtle edge gradients in light mode for depth */}
              <div className="pointer-events-none absolute inset-x-0 -top-2 h-2 bg-gradient-to-b from-black/10 to-transparent dark:hidden" />
              <div className="pointer-events-none absolute inset-x-0 -bottom-2 h-2 bg-gradient-to-t from-black/10 to-transparent dark:hidden" />
              <div className="px-6 py-6 max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Professional Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    <span id="mobile-menu-title" className="text-sm font-medium text-slate-600 dark:text-gray-300">Navigation Menu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowHelp(!showHelp);
                        trackMobileMenuInteraction('toggle_help', 'help_button', 'mobile_menu_help');
                      }}
                      className="p-1.5 rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white/70 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent text-slate-700 dark:text-gray-400 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                      aria-label={showHelp ? "Hide help information" : "Show help information"}
                      aria-expanded={showHelp}
                    >
                      <HelpCircle className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <div className="flex items-center gap-1" role="note" aria-label="Keyboard shortcut">
                      <Keyboard className="w-3 h-3 text-slate-500 dark:text-gray-500" aria-hidden="true" />
                      <span className="text-xs text-slate-500 dark:text-gray-500">Alt+M</span>
                    </div>
                  </div>
                </div>

                <nav className="space-y-2" id="mobile-menu" role="navigation" aria-label="Mobile navigation">
                  {/* Help Section */}
                  <AnimatePresence>
                    {showHelp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                        role="complementary"
                        aria-live="polite"
                        aria-labelledby="help-title"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="w-4 h-4 text-blue-400" aria-hidden="true" />
                          <span id="help-title" className="text-sm font-semibold text-blue-300">Quick Help</span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-400" role="list">
                          <div role="listitem">• <kbd className="bg-slate-800 px-1 rounded">Alt+M</kbd> - Toggle menu</div>
                          <div role="listitem">• <kbd className="bg-slate-800 px-1 rounded">Alt+H</kbd> - Toggle help</div>
                          <div role="listitem">• <kbd className="bg-slate-800 px-1 rounded">Esc</kbd> - Close menu</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Recent Items Dropdown */}
                  {isAuthenticated && recentItems.length > 0 && (
                    <section className="mb-4" aria-labelledby="recent-items-title">
                      <button
                        onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                        className={[
                          'flex items-center justify-between w-full px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                          isDark ? 'text-gray-300 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                        ].join(' ')}
                        aria-expanded={showRecentDropdown}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-400" aria-hidden="true" />
                          <h3 id="recent-items-title" className={['text-sm font-semibold', isDark ? 'text-orange-300' : 'text-orange-600'].join(' ')}>Recent</h3>
                          {isLoading && <Loader2 className="w-3 h-3 text-orange-400 animate-spin" aria-label="Loading recent items" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-400'} transition-transform duration-200 ${showRecentDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                      <AnimatePresence>
                        {showRecentDropdown && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-1 pl-6"
                            role="list"
                          >
                            {recentItems.slice(0, 3).map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  handleEnhancedLinkClick(item.href, `recent_${item.title}`);
                                }}
                                className={[
                                  'group flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                                  isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                                ].join(' ')}
                                role="listitem"
                                aria-label={`Navigate to recent item: ${item.title}`}
                              >
                                <item.icon className="w-4 h-4 mr-3 group-hover:text-orange-400 transition-colors" aria-hidden="true" />
                                <span className="text-sm font-medium truncate">{item.title}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  )}

                  {/* Favorites Dropdown */}
                  {isAuthenticated && favorites.length > 0 && (
                    <section className="mb-4" aria-labelledby="favorites-title">
                      <button
                        onClick={() => setShowFavoritesDropdown(!showFavoritesDropdown)}
                        className={[
                          'flex items-center justify-between w-full px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
                          isDark ? 'text-gray-300 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                        ].join(' ')}
                        aria-expanded={showFavoritesDropdown}
                      >
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-amber-400" aria-hidden="true" />
                          <h3 id="favorites-title" className={['text-sm font-semibold', isDark ? 'text-amber-300' : 'text-amber-600'].join(' ')}>Favorites</h3>
                        </div>
                        <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-400'} transition-transform duration-200 ${showFavoritesDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                      <AnimatePresence>
                        {showFavoritesDropdown && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 space-y-1 pl-6"
                            role="list"
                          >
                            {favorites.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  handleEnhancedLinkClick(item.href, `favorite_${item.title}`);
                                }}
                                className={[
                                  'group flex items-center w-full px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
                                  isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                                ].join(' ')}
                                role="listitem"
                                aria-label={`Navigate to favorite item: ${item.title}`}
                              >
                                <item.icon className="w-4 h-4 mr-3 group-hover:text-amber-400 transition-colors" aria-hidden="true" />
                                <span className="text-sm font-medium truncate">{item.title}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  )}

                  {/* Main Navigation Links */}
                  <section className="space-y-1" aria-labelledby="main-nav-title">
                    <h3 id="main-nav-title" className="sr-only">Main Navigation</h3>
                    <button
                      onClick={() => handleEnhancedLinkClick('/', 'home')}
                      className={[
                        'group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                        isDark ? 'text-gray-300 hover:text-white hover:bg-slate-700/50 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                      ].join(' ')}
                      aria-label="Navigate to home page"
                    >
                      <Home className="w-5 h-5 mr-3 group-hover:text-purple-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Home</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => handleEnhancedLinkClick('/courses', 'courses')}
                      className={[
                        'group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        isDark ? 'text-gray-300 hover:text-white hover:bg-slate-700/50 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                      ].join(' ')}
                      aria-label="Navigate to courses page"
                    >
                      <BookOpenCheck className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Courses</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => handleEnhancedLinkClick('/blog', 'blog')}
                      className={[
                        'group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                        isDark ? 'text-gray-300 hover:text-white hover:bg-slate-700/50 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                      ].join(' ')}
                      aria-label="Navigate to blog page"
                    >
                      <FileText className="w-5 h-5 mr-3 group-hover:text-green-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Blogs</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => handleEnhancedLinkClick('/features', 'features')}
                      className={[
                        'group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2',
                        isDark ? 'text-gray-300 hover:text-white hover:bg-slate-700/50 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                      ].join(' ')}
                      aria-label="Navigate to features page"
                    >
                      <Star className="w-5 h-5 mr-3 group-hover:text-yellow-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Features</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => handleEnhancedLinkClick('/intelligent-lms/overview', 'intelligent-lms')}
                      className={[
                        'group flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                        isDark ? 'text-gray-300 hover:text-white hover:bg-slate-700/50 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                      ].join(' ')}
                      aria-label="Navigate to intelligent LMS page"
                    >
                      <Sparkles className="w-5 h-5 mr-3 group-hover:text-indigo-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Intelligent LMS</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                  </section>
                  
                  {/* AI Tools Dropdown Section */}
                  <section className="pt-4" aria-labelledby="ai-tools-title">
                    <button
                      onClick={() => setShowAIToolsDropdown(!showAIToolsDropdown)}
                      className={[
                        'flex items-center justify-between w-full px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                        isDark ? 'text-gray-300 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                      ].join(' ')}
                      aria-expanded={showAIToolsDropdown}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className={['w-4 h-4', isDark ? 'text-purple-400' : 'text-purple-600'].join(' ')} aria-hidden="true" />
                        <h3 id="ai-tools-title" className={['text-sm font-semibold uppercase tracking-wider', isDark ? 'text-purple-300' : 'text-purple-700'].join(' ')}>AI Tools</h3>
                      </div>
                      <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-400'} transition-transform duration-200 ${showAIToolsDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    <AnimatePresence>
                      {showAIToolsDropdown && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-1 pl-6"
                          role="list"
                        >
                          <Link 
                            href="/ai-tutor" 
                            className={[
                              'group flex items-start px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                              isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                            ].join(' ')} 
                            onClick={() => {
                              handleLinkClick();
                              setShowAIToolsDropdown(false);
                            }}
                            role="listitem"
                            aria-label="Navigate to AI Tutor"
                          >
                            <Brain className="w-5 h-5 mr-3 mt-0.5 group-hover:text-purple-400 transition-colors flex-shrink-0" aria-hidden="true" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">AI Tutor</div>
                              <div className="text-xs text-gray-500 mt-0.5">Personal AI learning assistant</div>
                            </div>
                          </Link>
                          
                          <Link 
                            href="/ai-trends" 
                            className={[
                              'group flex items-start px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                              isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                            ].join(' ')} 
                            onClick={() => {
                              handleLinkClick();
                              setShowAIToolsDropdown(false);
                            }}
                            role="listitem"
                            aria-label="Navigate to AI Trends"
                          >
                            <TrendingUp className="w-5 h-5 mr-3 mt-0.5 group-hover:text-blue-400 transition-colors flex-shrink-0" aria-hidden="true" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">AI Trends</div>
                              <div className="text-xs text-gray-500 mt-0.5">Latest AI industry trends</div>
                            </div>
                          </Link>
                          
                          <Link 
                            href="/ai-news" 
                            className={[
                              'group flex items-start px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                              isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                            ].join(' ')} 
                            onClick={() => {
                              handleLinkClick();
                              setShowAIToolsDropdown(false);
                            }}
                            role="listitem"
                            aria-label="Navigate to AI News"
                          >
                            <Newspaper className="w-5 h-5 mr-3 mt-0.5 group-hover:text-green-400 transition-colors flex-shrink-0" aria-hidden="true" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">AI News</div>
                              <div className="text-xs text-gray-500 mt-0.5">Breaking AI news & updates</div>
                            </div>
                          </Link>
                          
                          <Link 
                            href="/ai-research" 
                            className={[
                              'group flex items-start px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
                              isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700/30 focus:ring-offset-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-offset-white'
                            ].join(' ')} 
                            onClick={() => {
                              handleLinkClick();
                              setShowAIToolsDropdown(false);
                            }}
                            role="listitem"
                            aria-label="Navigate to AI Research"
                          >
                            <FlaskConical className="w-5 h-5 mr-3 mt-0.5 group-hover:text-cyan-400 transition-colors flex-shrink-0" aria-hidden="true" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">AI Research</div>
                              <div className="text-xs text-gray-500 mt-0.5">Academic research & papers</div>
                            </div>
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                  
                  {/* Authentication Section */}
                  <section className={['pt-6 border-t', isDark ? 'border-slate-700/50' : 'border-slate-200'].join(' ')} aria-labelledby="auth-section-title">
                    <h3 id="auth-section-title" className="sr-only">User Authentication</h3>
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        {/* User Profile Section */}
                        <div className={['flex items-center justify-between px-4 py-3 rounded-xl border', isDark ? 'bg-slate-800/50 border-slate-700/30' : 'bg-white/70 border-slate-200'].join(' ')} role="region" aria-label="User profile information">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/40 shadow-lg flex-shrink-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                              {user?.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || "User"}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={['text-sm font-medium truncate', isDark ? 'text-white' : 'text-slate-900'].join(' ')}>
                                  {user?.name || 'User'}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {user?.role === 'ADMIN' ? 'Admin' : 'Student'}
                                </span>
                              </div>
                              <p className={['text-xs truncate', isDark ? 'text-gray-400' : 'text-slate-500'].join(' ')}>
                                {user?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <LogoutButton>
                            <button
                              className="p-2 rounded-lg bg-red-600/80 hover:bg-red-500 transition-colors"
                              aria-label="Sign out"
                            >
                              <LogOut className="w-4 h-4 text-white" />
                            </button>
                          </LogoutButton>
                        </div>
                        
                        {/* Dashboard Button */}
                        <Link 
                          href={dashboardLink} 
                          className={['group flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all duration-200 active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2', isDark ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'].join(' ')} 
                          onClick={handleLinkClick}
                          aria-label="Go to your dashboard"
                        >
                          <GraduationCap className="w-5 h-5 mr-3" aria-hidden="true" />
                          <span className="font-semibold">Go to Dashboard</span>
                          <ChevronRight className="w-4 h-4 ml-auto" aria-hidden="true" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link 
                          href="/auth/login" 
                          className={['group flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all duration-200 active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2', isDark ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'].join(' ')} 
                          onClick={handleLinkClick}
                          aria-label="Sign in to your account"
                        >
                          <LogIn className="w-5 h-5 mr-3" aria-hidden="true" />
                          <span className="font-semibold">Sign In</span>
                          <ChevronRight className="w-4 h-4 ml-auto" aria-hidden="true" />
                        </Link>
                        
                        <Link
                          href="/auth/register"
                          className={['group flex items-center px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2', isDark ? 'bg-slate-700/80 hover:bg-slate-600 border border-purple-500/30 text-white focus:ring-offset-slate-900' : 'bg-white/70 hover:bg-white/90 border border-slate-200 text-slate-700 focus:ring-offset-white'].join(' ')}
                          onClick={handleLinkClick}
                          aria-label="Create new account and sign up"
                        >
                          <UserPlus className="w-5 h-5 mr-3" aria-hidden="true" />
                          <span className="font-semibold">Sign Up</span>
                          <ChevronRight className="w-4 h-4 ml-auto" aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </section>
                </nav>

                {/* Professional Footer */}
                <footer className="mt-6 pt-4 border-t border-slate-700/50" role="contentinfo">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3" aria-hidden="true" />
                      <span>Active Session</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>v2.1.0</span>
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          </motion.div>
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
