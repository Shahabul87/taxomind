'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

import { HeaderAfterLoginProps } from '../types/header-types';
import { NotificationsPopover } from './notifications-popover';
import { MessagesPopover } from './messages-popover';
import { UserMenu } from './user-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AIFeaturesMegaMenu } from '../components/mega-menu/AIFeaturesMegaMenu';
import { aiFeatureTopics, getAIFeaturesByTopic, aiConceptChips } from '../data/ai-features-data';

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
              <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                Taxomind
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

              {/* AI Features Mega Menu - Combines Features, LMS, and AI Tools */}
              <AIFeaturesMegaMenu
                topics={aiFeatureTopics}
                getContentByTopic={getAIFeaturesByTopic}
                conceptChips={aiConceptChips}
                variant="rich"
                triggerLabel="AI Features"
                panelId="ai-features-laptop-menu"
                hoverDelay={150}
                closeDelay={200}
                maxItems={6}
                currentPathname={pathname || undefined}
                centerOnHover={true}
              />
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
