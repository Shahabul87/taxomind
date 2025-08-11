"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import {
  BookOpen,
  Sun,
  Moon,
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

// Types and utils
import { HeaderAfterLoginProps, SearchResult } from './types/header-types';
import { highlightMatches } from './utils/search-utils';
import { useSearch } from './hooks/useSearch';

export const MainHeader = ({ user }: HeaderAfterLoginProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showFavoritesDropdown, setShowFavoritesDropdown] = useState(false);
  const [showAIToolsDropdown, setShowAIToolsDropdown] = useState(false);
  const [showDesktopAIToolsDropdown, setShowDesktopAIToolsDropdown] = useState(false);
  const [showDesktopIntelligentLMSDropdown, setShowDesktopIntelligentLMSDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const desktopAIToolsRef = useRef<HTMLDivElement>(null);
  const desktopIntelligentLMSRef = useRef<HTMLDivElement>(null);
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
    } catch (error) {
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
        } catch (error) {
          logger.error('Failed to load user data:', error);
          setIsLoading(false);
        }
      }
    };
    
    loadUserData();
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
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 w-full relative">
          {/* Subtle header glow effects to match PageBackground */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none"></div>
          
          <div className="flex justify-between items-center h-14 sm:h-16 relative">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 pl-0 sm:pl-0">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-400" />
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
                Taxomind
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 xl:space-x-8">
              <Link href="/courses" className="text-sm xl:text-base text-gray-300 hover:text-white transition-colors font-medium">
                Courses
              </Link>
              <Link href="/blog" className="text-sm xl:text-base text-gray-300 hover:text-white transition-colors font-medium">
                Blogs
              </Link>
              <div className="relative group">
                <Link href="/features" className="text-sm xl:text-base text-gray-300 hover:text-white transition-colors font-medium flex items-center space-x-1">
                  <span>Features</span>
                </Link>
              </div>
              <div className="relative" ref={desktopIntelligentLMSRef}>
                <button
                  onClick={() => setShowDesktopIntelligentLMSDropdown(!showDesktopIntelligentLMSDropdown)}
                  className="text-sm xl:text-base text-gray-300 hover:text-white transition-colors font-medium flex items-center space-x-1"
                  aria-expanded={showDesktopIntelligentLMSDropdown}
                  aria-haspopup="true"
                >
                  <span>Intelligent LMS</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDesktopIntelligentLMSDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop Intelligent LMS Dropdown */}
                <AnimatePresence>
                  {showDesktopIntelligentLMSDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50"
                    >
                      <div className="p-3">
                        <Link 
                          href="/intelligent-lms/overview" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                        >
                          <Sparkles className="w-5 h-5 mr-3 mt-0.5 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Why Taxomind?</div>
                            <div className="text-xs text-gray-500 mt-0.5">Discover our AI-powered intelligent features</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/intelligent-lms/sam-ai-assistant" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                        >
                          <Brain className="w-5 h-5 mr-3 mt-0.5 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">SAM AI Assistant</div>
                            <div className="text-xs text-gray-500 mt-0.5">Your intelligent teaching & learning companion</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/intelligent-lms/evaluation-standards" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                        >
                          <Shield className="w-5 h-5 mr-3 mt-0.5 group-hover:text-green-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Evaluation Standards</div>
                            <div className="text-xs text-gray-500 mt-0.5">12+ international standards compliance</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/intelligent-lms/adaptive-learning" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                        >
                          <Zap className="w-5 h-5 mr-3 mt-0.5 group-hover:text-yellow-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Adaptive Learning</div>
                            <div className="text-xs text-gray-500 mt-0.5">Personalized learning paths & recommendations</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/intelligent-lms/course-intelligence" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopIntelligentLMSDropdown(false)}
                        >
                          <Activity className="w-5 h-5 mr-3 mt-0.5 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Course Intelligence</div>
                            <div className="text-xs text-gray-500 mt-0.5">AI-powered course creation & optimization</div>
                          </div>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative" ref={desktopAIToolsRef}>
                <button
                  onClick={() => setShowDesktopAIToolsDropdown(!showDesktopAIToolsDropdown)}
                  className="text-sm xl:text-base text-gray-300 hover:text-white transition-colors font-medium flex items-center space-x-1"
                  aria-expanded={showDesktopAIToolsDropdown}
                  aria-haspopup="true"
                >
                  <span>AI Tools</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDesktopAIToolsDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop AI Tools Dropdown */}
                <AnimatePresence>
                  {showDesktopAIToolsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50"
                    >
                      <div className="p-3">
                        <Link 
                          href="/ai-tutor" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopAIToolsDropdown(false)}
                        >
                          <Brain className="w-5 h-5 mr-3 mt-0.5 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">AI Tutor</div>
                            <div className="text-xs text-gray-500 mt-0.5">Personal AI learning assistant</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/ai-trends" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopAIToolsDropdown(false)}
                        >
                          <TrendingUp className="w-5 h-5 mr-3 mt-0.5 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">AI Trends</div>
                            <div className="text-xs text-gray-500 mt-0.5">Latest AI industry trends</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/ai-news" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopAIToolsDropdown(false)}
                        >
                          <Newspaper className="w-5 h-5 mr-3 mt-0.5 group-hover:text-green-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">AI News</div>
                            <div className="text-xs text-gray-500 mt-0.5">Breaking AI news & updates</div>
                          </div>
                        </Link>
                        
                        <Link 
                          href="/ai-research" 
                          className="group flex items-start px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200"
                          onClick={() => setShowDesktopAIToolsDropdown(false)}
                        >
                          <FlaskConical className="w-5 h-5 mr-3 mt-0.5 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">AI Research</div>
                            <div className="text-xs text-gray-500 mt-0.5">Academic research & papers</div>
                          </div>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
              {/* Search Icon */}
              <button
                onClick={handleSearchIconClick}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </button>
              
              {/* Theme Toggle - Fixed hydration */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                aria-label="Toggle theme"
              >
                {mounted ? (
                  theme === "dark" ? (
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  )
                ) : (
                  // Render a placeholder that matches the server during hydration
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-400 rounded animate-pulse" />
                )}
              </button>

              {/* Notifications and Messages (for authenticated users) */}
              {isAuthenticated && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors">
                    <NotificationsPopover />
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors">
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
                      className="px-3 xl:px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
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
                      className="px-4 xl:px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25 text-sm xl:text-base"
                    >
                      Start Free Trial
                    </motion.div>
                  </Link>
                </div>
              )}

              {/* Mobile/Tablet Menu Button (for all users) */}
              <div className="md:hidden">
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsOpen(false)} 
              aria-hidden="true"
            />
            
            {/* Menu Container */}
            <div 
              className="relative bg-gradient-to-b from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
            >
              <div className="px-6 py-6 max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Professional Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" aria-hidden="true" />
                    <span id="mobile-menu-title" className="text-sm font-medium text-gray-300">Navigation Menu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowHelp(!showHelp);
                        trackMobileMenuInteraction('toggle_help', 'help_button', 'mobile_menu_help');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
                      aria-label={showHelp ? "Hide help information" : "Show help information"}
                      aria-expanded={showHelp}
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    </button>
                    <div className="flex items-center gap-1" role="note" aria-label="Keyboard shortcut">
                      <Keyboard className="w-3 h-3 text-gray-500" aria-hidden="true" />
                      <span className="text-xs text-gray-500">Alt+M</span>
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
                        className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                        aria-expanded={showRecentDropdown}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-400" aria-hidden="true" />
                          <h3 id="recent-items-title" className="text-sm font-semibold text-orange-300">Recent</h3>
                          {isLoading && <Loader2 className="w-3 h-3 text-orange-400 animate-spin" aria-label="Loading recent items" />}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showRecentDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
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
                                className="group flex items-center w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
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
                        className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                        aria-expanded={showFavoritesDropdown}
                      >
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-amber-400" aria-hidden="true" />
                          <h3 id="favorites-title" className="text-sm font-semibold text-amber-300">Favorites</h3>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showFavoritesDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
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
                                className="group flex items-center w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900"
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
                      className="group flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                      aria-label="Navigate to home page"
                    >
                      <Home className="w-5 h-5 mr-3 group-hover:text-purple-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Home</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => handleEnhancedLinkClick('/courses', 'courses')}
                      className="group flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                      aria-label="Navigate to courses page"
                    >
                      <BookOpenCheck className="w-5 h-5 mr-3 group-hover:text-blue-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Courses</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => handleEnhancedLinkClick('/blog', 'blog')}
                      className="group flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                      aria-label="Navigate to blog page"
                    >
                      <FileText className="w-5 h-5 mr-3 group-hover:text-green-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Blogs</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => handleEnhancedLinkClick('/features', 'features')}
                      className="group flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                      aria-label="Navigate to features page"
                    >
                      <Star className="w-5 h-5 mr-3 group-hover:text-yellow-400 transition-colors" aria-hidden="true" />
                      <span className="font-medium">Features</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </button>
                    
                    <button
                      onClick={() => handleEnhancedLinkClick('/intelligent-lms/overview', 'intelligent-lms')}
                      className="group flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
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
                      className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                      aria-expanded={showAIToolsDropdown}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" aria-hidden="true" />
                        <h3 id="ai-tools-title" className="text-sm font-semibold text-purple-300 uppercase tracking-wider">AI Tools</h3>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showAIToolsDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
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
                            className="group flex items-start px-4 py-3 text-gray-400 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900" 
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
                            className="group flex items-start px-4 py-3 text-gray-400 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900" 
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
                            className="group flex items-start px-4 py-3 text-gray-400 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900" 
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
                            className="group flex items-start px-4 py-3 text-gray-400 hover:text-white hover:bg-slate-700/30 rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900" 
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
                  <section className="pt-6 border-t border-slate-700/50" aria-labelledby="auth-section-title">
                    <h3 id="auth-section-title" className="sr-only">User Authentication</h3>
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        {/* User Profile Section */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/30" role="region" aria-label="User profile information">
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
                                <span className="text-sm font-medium text-white truncate">
                                  {user?.name || 'User'}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {user?.role === 'ADMIN' ? 'Admin' : 'Student'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 truncate">
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
                          className="group flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all duration-200 active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900" 
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
                          className="group flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-all duration-200 active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900" 
                          onClick={handleLinkClick}
                          aria-label="Sign in to your account"
                        >
                          <LogIn className="w-5 h-5 mr-3" aria-hidden="true" />
                          <span className="font-semibold">Sign In</span>
                          <ChevronRight className="w-4 h-4 ml-auto" aria-hidden="true" />
                        </Link>
                        
                        <Link 
                          href="/auth/register" 
                          className="group flex items-center px-4 py-3 rounded-xl bg-slate-700/80 hover:bg-slate-600 border border-purple-500/30 text-white transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900" 
                          onClick={handleLinkClick}
                          aria-label="Create new account and start free trial"
                        >
                          <UserPlus className="w-5 h-5 mr-3" aria-hidden="true" />
                          <span className="font-semibold">Start Free Trial</span>
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

