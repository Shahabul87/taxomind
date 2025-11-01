'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface SmartSidebarLayoutProps {
  user: any;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

// Routes where the sidebar should be hidden
const SIDEBAR_HIDDEN_ROUTES = [
  '/', // Homepage
  '/about',
  '/features',
  '/blog',
  '/courses',
  '/support',
  '/solutions',
  '/ai-trends',
  '/ai-tutor',
  '/ai-news',
  '/ai-research',
  '/intelligent-lms/overview',
  '/intelligent-lms/sam-ai-assistant',
  '/intelligent-lms/evaluation-standards',
  '/intelligent-lms/adaptive-learning',
  '/intelligent-lms/course-intelligence',
];

// Routes that need full-width layout (no padding)
const FULL_WIDTH_ROUTES = [
  '/features',
  '/',
  '/about',
  '/blog',
  '/courses',
  '/profile',
  '/solutions',
  '/ai-trends',
  '/ai-tutor',
  '/ai-news',
  '/ai-research',
  '/intelligent-lms/overview',
  '/intelligent-lms/sam-ai-assistant',
  '/intelligent-lms/evaluation-standards',
  '/intelligent-lms/adaptive-learning',
  '/intelligent-lms/course-intelligence',
];

// Patterns for routes where the sidebar should be hidden
const SIDEBAR_HIDDEN_PATTERNS = [
  /^\/courses\/[^\/]+$/, // Course detail pages
  /^\/blog\/[^\/]+$/, // Blog post pages
  /^\/post\/[^\/]+$/, // Post pages
  /^\/courses\/[^\/]+\/learn\/[^\/]+\/sections\/[^\/]+$/, // Course learning section pages
  /^\/intelligent-lms\/.*$/, // All intelligent-lms pages
];

export default function SmartSidebarLayout({ user, children, sidebar }: SmartSidebarLayoutProps) {
  const pathname = usePathname();
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsSmallMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check if the current path matches any of the hidden routes or patterns
  const isHiddenRoute = pathname ? SIDEBAR_HIDDEN_ROUTES.includes(pathname) : false;
  const matchesHiddenPattern = pathname
    ? SIDEBAR_HIDDEN_PATTERNS.some((pattern) => pattern.test(pathname))
    : false;

  const shouldShowSidebar = !(isHiddenRoute || matchesHiddenPattern);
  const hasUser = !!user;

  // Responsive sidebar logic:
  // - Small mobile (<768px): No sidebar (user menu handles navigation)
  // - Tablet (768px-1023px): Sidebar as overlay
  // - Desktop (≥1024px): Fixed sidebar
  const showSidebar = hasUser && shouldShowSidebar && !isSmallMobile;

  // Determine if we're on a course page or full-width page
  const isCoursePage = pathname ? /^\/courses\/[^\/]+$/.test(pathname) : false;
  const isIntelligentLMSPage = pathname ? /^\/intelligent-lms\/.*$/.test(pathname) : false;
  const isFullWidthPage = pathname
    ? FULL_WIDTH_ROUTES.includes(pathname) || isIntelligentLMSPage
    : false;

  return (
    <div className={clsx('flex h-screen', isCoursePage ? '' : 'pt-14 sm:pt-16')}>
      {/* Conditional sidebar */}
      {showSidebar && sidebar && (
        <div
          className={clsx(
            'fixed left-0 bottom-0 z-40',
            isCoursePage
              ? 'top-0 h-screen'
              : 'top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]'
          )}
        >
          {sidebar}
        </div>
      )}

      {/* Main content with conditional margin and padding */}
      <main
        className={clsx(
          'flex-1',
          isCoursePage
            ? 'h-screen pt-0 px-0 overflow-y-auto'
            : isFullWidthPage
              ? 'min-h-screen pt-0 px-0'
              : 'h-[calc(100vh-4rem)] pt-2 px-4 overflow-y-auto',
          // Only add margin on desktop when sidebar is fixed
          showSidebar && !isFullWidthPage && !isTablet ? 'ml-[94px]' : ''
        )}
      >
        {children}
      </main>
    </div>
  );
}
