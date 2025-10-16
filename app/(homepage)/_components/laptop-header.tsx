'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  Sparkles,
  Brain,
  Zap,
  Shield,
  Activity,
  TrendingUp,
  Newspaper,
  FlaskConical,
} from 'lucide-react';

import { HeaderAfterLoginProps } from '../types/header-types';
import { NotificationsPopover } from './notifications-popover';
import { MessagesPopover } from './messages-popover';
import { UserMenu } from './user-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';

/**
 * Laptop Header Component
 * Optimized for screens 1024px - 1279px (lg breakpoint)
 *
 * Design Specifications:
 * - Fixed height: 64px (h-16)
 * - Font sizes: text-sm (14px) for ALL navigation items - CONSISTENT
 * - Icon sizes: w-4 h-4 (16px) - smaller to fit better
 * - Spacing: px-6, compact layout
 * - Navigation: Condensed with dropdown menus
 */
export const LaptopHeader = ({ user }: HeaderAfterLoginProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [showIntelligentLMSDropdown, setShowIntelligentLMSDropdown] = useState(false);
  const [showAIToolsDropdown, setShowAIToolsDropdown] = useState(false);
  const intelligentLMSRef = useRef<HTMLDivElement>(null);
  const aiToolsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = !!user?.id;
  const dashboardLink = user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user';

  // Scroll handler
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 6);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (intelligentLMSRef.current && !intelligentLMSRef.current.contains(event.target as Node)) {
        setShowIntelligentLMSDropdown(false);
      }
      if (aiToolsRef.current && !aiToolsRef.current.contains(event.target as Node)) {
        setShowAIToolsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 backdrop-blur-md ${
          scrolled
            ? 'bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 shadow-md'
            : 'bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="w-full max-w-6xl mx-auto px-6">
          {/* Main header container - Fixed height 64px */}
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/logo.svg"
                  alt="TaxoMind"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded"
                  priority
                />
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                TaxoMind
              </span>
            </Link>

            {/* Center Navigation - Compact */}
            <nav className="flex items-center space-x-4">
              <Link
                href="/courses"
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname?.startsWith('/courses')
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Courses
              </Link>

              <Link
                href="/blog"
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname?.startsWith('/blog')
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Blogs
              </Link>

              <Link
                href="/features"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center whitespace-nowrap"
              >
                Features
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded">
                  New
                </span>
              </Link>

              {/* Intelligent LMS Dropdown */}
              <div className="relative" ref={intelligentLMSRef}>
                <button
                  onClick={() => setShowIntelligentLMSDropdown(!showIntelligentLMSDropdown)}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1 whitespace-nowrap"
                  aria-expanded={showIntelligentLMSDropdown}
                >
                  <span>LMS</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showIntelligentLMSDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showIntelligentLMSDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
                    >
                      <Link
                        href="/intelligent-lms/overview"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowIntelligentLMSDropdown(false)}
                      >
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                        Overview
                      </Link>
                      <Link
                        href="/intelligent-lms/adaptive-learning"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowIntelligentLMSDropdown(false)}
                      >
                        <Zap className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                        Adaptive Learning
                      </Link>
                      <Link
                        href="/intelligent-lms/course-intelligence"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowIntelligentLMSDropdown(false)}
                      >
                        <Activity className="w-4 h-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                        Course Intelligence
                      </Link>
                      <Link
                        href="/intelligent-lms/sam-ai-assistant"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowIntelligentLMSDropdown(false)}
                      >
                        <Brain className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                        SAM AI Assistant
                      </Link>
                      <Link
                        href="/intelligent-lms/evaluation-standards"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowIntelligentLMSDropdown(false)}
                      >
                        <Shield className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                        Evaluation Standards
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AI Tools Dropdown */}
              <div className="relative" ref={aiToolsRef}>
                <button
                  onClick={() => setShowAIToolsDropdown(!showAIToolsDropdown)}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1 whitespace-nowrap"
                  aria-expanded={showAIToolsDropdown}
                >
                  <span>AI Tools</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showAIToolsDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showAIToolsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
                    >
                      <Link
                        href="/ai-tutor"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowAIToolsDropdown(false)}
                      >
                        <Brain className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                        AI Tutor
                      </Link>
                      <Link
                        href="/ai-trends"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowAIToolsDropdown(false)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                        AI Trends
                      </Link>
                      <Link
                        href="/ai-news"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowAIToolsDropdown(false)}
                      >
                        <Newspaper className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                        AI News
                      </Link>
                      <Link
                        href="/ai-research"
                        className="flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        onClick={() => setShowAIToolsDropdown(false)}
                      >
                        <FlaskConical className="w-4 h-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                        AI Research
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Search Icon */}
              <button
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-slate-600 dark:text-slate-300" />
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
                    className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    Login
                  </Link>

                  {/* Sign Up Button */}
                  <Link
                    href="/auth/register"
                    className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16" />
    </>
  );
};
