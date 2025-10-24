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
} from 'lucide-react';

import { HeaderAfterLoginProps } from '../types/header-types';
import { NotificationsPopover } from './notifications-popover';
import { MessagesPopover } from './messages-popover';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AIFeaturesMobileSheet } from '../components/mega-menu/AIFeaturesMobileSheet';
import { aiFeatureTopics, aiFeaturesByTopic, aiConceptChips } from '../data/ai-features-data';

/**
 * Mobile Header Component
 * Optimized for screens up to 768px (sm breakpoint)
 *
 * Design Specifications:
 * - Fixed height: 56px (h-14)
 * - Font sizes: text-sm for nav items, text-base for logo
 * - Icon sizes: w-5 h-5 (20px)
 * - Spacing: consistent px-4 py-3
 */
export const MobileHeader = ({ user }: HeaderAfterLoginProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAIFeaturesMobileSheet, setShowAIFeaturesMobileSheet] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = !!user?.id;
  const dashboardLink = user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/user';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 backdrop-blur-md ${
          scrolled
            ? 'bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 shadow-sm'
            : 'bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="w-full max-w-full mx-auto px-4">
          {/* Main header container - Fixed height 56px */}
          <div className="flex justify-between items-center h-14">
            {/* Logo Section */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.svg"
                  alt="TaxoMind"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                TaxoMind
              </span>
            </Link>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
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
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <Link
                    href="/auth/login"
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Login"
                  >
                    <LogIn className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </Link>

                  {/* Sign Up Button */}
                  <Link
                    href="/auth/register"
                    className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-4 py-4 space-y-2">
              {/* Navigation Links */}
              <Link
                href="/courses"
                className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname?.startsWith('/courses')
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Courses
              </Link>

              <Link
                href="/blog"
                className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  pathname?.startsWith('/blog')
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blogs
              </Link>

              <button
                onClick={() => setShowAIFeaturesMobileSheet(true)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 rounded-lg transition-colors"
              >
                AI Features
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300">
                  New
                </span>
              </button>

              {isAuthenticated && (
                <Link
                  href={dashboardLink}
                  className="block px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* AI Features Mobile Sheet */}
      <AIFeaturesMobileSheet
        isOpen={showAIFeaturesMobileSheet}
        onClose={() => setShowAIFeaturesMobileSheet(false)}
        topics={aiFeatureTopics}
        contentByTopic={aiFeaturesByTopic}
        conceptChips={aiConceptChips}
        onItemClick={() => {
          setShowAIFeaturesMobileSheet(false);
          setIsMobileMenuOpen(false);
        }}
      />

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-14" />
    </>
  );
};
