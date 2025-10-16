'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  LogIn,
  UserPlus,
  ChevronDown,
  Sparkles,
  Brain,
  Zap,
} from 'lucide-react';

import { HeaderAfterLoginProps } from '../types/header-types';
import { NotificationsPopover } from './notifications-popover';
import { MessagesPopover } from './messages-popover';
import { UserMenu } from './user-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = !!user?.id;
  const dashboardLink = user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user';

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
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                TaxoMind
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

              {/* More Dropdown - Includes Features, Intelligent LMS, AI Tools */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1"
                  aria-expanded={showMoreDropdown}
                  aria-label="More menu"
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showMoreDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showMoreDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                    {/* Features */}
                    <Link
                      href="/features"
                      className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium">Features</span>
                        </div>
                        <span className="px-1.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded">
                          New
                        </span>
                      </div>
                    </Link>

                    {/* Divider */}
                    <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                    {/* Intelligent LMS Section */}
                    <div className="px-4 py-1.5">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Intelligent LMS
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/intelligent-lms/overview"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 pl-10 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      Overview
                    </Link>
                    <Link
                      href="/intelligent-lms/adaptive-learning"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 pl-10 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      Adaptive Learning
                    </Link>
                    <Link
                      href="/intelligent-lms/course-intelligence"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 pl-10 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      Course Intelligence
                    </Link>
                    <Link
                      href="/intelligent-lms/sam-ai-assistant"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 pl-10 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      SAM AI Assistant
                    </Link>

                    {/* Divider */}
                    <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

                    {/* AI Tools Section */}
                    <div className="px-4 py-1.5">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          AI Tools
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/ai-tutor"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 pl-10 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      AI Tutor
                    </Link>
                    <Link
                      href="/ai-trends"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 pl-10 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      AI Trends
                    </Link>
                    <Link
                      href="/ai-news"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 pl-10 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      AI News
                    </Link>
                    <Link
                      href="/ai-research"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 pl-10 transition-colors"
                      onClick={() => setShowMoreDropdown(false)}
                    >
                      AI Research
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Search Icon */}
              <button
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

                  {/* Sign Up Button */}
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
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
