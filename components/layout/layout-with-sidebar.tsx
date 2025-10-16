"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarContainer } from "@/components/ui/sidebar-container";
import { useLayoutDimensions } from "@/hooks/use-layout-dimensions";
import clsx from "clsx";

interface LayoutWithSidebarProps {
  user: any;
  children: React.ReactNode;
}

// Behavior toggle: set to `true` to keep sidebar fixed (always visible) on mobile
// Set to `false` to use overlay behavior on mobile
const MOBILE_SIDEBAR_FIXED = true;

// Routes where the sidebar should be hidden
const SIDEBAR_HIDDEN_ROUTES = [
  "/", // Homepage
  "/about",
  "/features",
  "/blog",
  "/courses",
  "/support",
  "/solutions",
  "/ai-trends",
  "/ai-tutor",
  "/ai-news",
  "/ai-research",
  "/intelligent-lms/overview",
  "/intelligent-lms/sam-ai-assistant",
  "/intelligent-lms/evaluation-standards",
  "/intelligent-lms/adaptive-learning",
  "/intelligent-lms/course-intelligence",
  "/dashboard/admin", // Admin dashboard - has its own sidebar
];

// Routes that need full-width layout (no padding)
const FULL_WIDTH_ROUTES = [
  "/features",
  "/",
  "/about",
  "/blog",
  "/courses",
  "/solutions",
  "/ai-trends",
  "/ai-tutor",
  "/ai-news",
  "/ai-research",
  "/intelligent-lms/overview",
  "/intelligent-lms/sam-ai-assistant",
  "/intelligent-lms/evaluation-standards",
  "/intelligent-lms/adaptive-learning",
  "/intelligent-lms/course-intelligence",
  "/dashboard", // User dashboard - no gaps between sidebar and content
  "/dashboard/admin", // Admin dashboard - uses full width with its own layout
  "/search", // Search page - has own container padding
  "/learn/analytics", // Learning analytics - has own container padding
  "/teacher/courses", // Teacher courses list - has own container padding
  "/teacher/analytics", // Teacher analytics - has own container padding
  "/teacher/create", // Course creation - has own container padding
  "/teacher/create/ai-creator", // AI course creator - has own container padding
  "/teacher/create/enhanced", // Enhanced course creator - has own container padding
  "/settings", // Settings page - has own container padding
  "/my-courses", // User enrolled courses - has own container padding
  "/post", // Post page - has own container padding
  "/post/all-posts", // All posts page - has own container padding
  "/post/create-post", // Create post page - has own container padding
  "/analytics/user", // User analytics - has own container padding
  "/groups", // Groups page - has own container padding
  "/groups/my-groups", // User groups - has own container padding
  "/resources", // Resources page - has own container padding
];

// Patterns for routes where the sidebar should be hidden
const SIDEBAR_HIDDEN_PATTERNS = [
  /^\/courses\/[^\/]+$/, // Course detail pages
  /^\/blog\/[^\/]+$/,
  /^\/courses\/[^\/]+\/learn\/[^\/]+\/sections\/[^\/]+$/, // Course learning section pages
  /^\/intelligent-lms\/.*$/, // All intelligent-lms pages
  /^\/dashboard\/admin.*$/, // Admin dashboard and all subroutes - has its own sidebar
];

// Patterns for routes that need full-width layout (no padding/gaps)
const FULL_WIDTH_PATTERNS = [
  /^\/teacher\/.*$/, // All teacher routes - have own container padding
  /^\/learn\/.*$/, // All learning routes - have own container padding
  /^\/search.*$/, // Search routes - have own container padding
  /^\/post\/.*$/, // All post routes - have own container padding
  /^\/groups\/.*$/, // All group routes - have own container padding
  /^\/analytics\/.*$/, // All analytics routes - have own container padding
];

export default function LayoutWithSidebar({ user, children }: LayoutWithSidebarProps) {
  const pathname = usePathname();
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Get dynamic layout dimensions (sidebar width, header height)
  const { sidebarWidth, headerHeight, isSidebarExpanded } = useLayoutDimensions();

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
  const matchesHiddenPattern = pathname ? 
    SIDEBAR_HIDDEN_PATTERNS.some(pattern => pattern.test(pathname)) : false;
  
  const shouldShowSidebar = !(isHiddenRoute || matchesHiddenPattern);
  const hasUser = !!user;
  
  // Responsive sidebar logic:
  // - Small mobile (<768px): No sidebar (user menu handles navigation)
  // - Tablet (768px-1023px): Sidebar as overlay
  // - Desktop (≥1024px): Fixed sidebar
  // Render sidebar container on all screen sizes; HomeSidebar handles overlay/fixed specifics
  const showSidebar = hasUser && shouldShowSidebar;
  
  // Determine if we're on a course page, teacher page, or full-width page
  const isCoursePage = pathname ? /^\/courses\/[^\/]+$/.test(pathname) : false;
  const isTeacherPage = pathname ? /^\/teacher\/.*$/.test(pathname) : false;
  const isIntelligentLMSPage = pathname ? /^\/intelligent-lms\/.*$/.test(pathname) : false;
  const matchesFullWidthPattern = pathname ?
    FULL_WIDTH_PATTERNS.some(pattern => pattern.test(pathname)) : false;
  // Full-width pages have no horizontal padding from layout (pages have their own container padding)
  const isFullWidthPage = pathname ? (FULL_WIDTH_ROUTES.includes(pathname) || isIntelligentLMSPage || matchesFullWidthPattern) : false;

  return (
    <div className={clsx(
      "flex h-screen",
      isCoursePage ? "" : "pt-14 xl:pt-16"
    )}>
      {/* Conditional sidebar */}
      {showSidebar && (
        <div className={clsx(
          "fixed left-0 bottom-0 z-40",
          isCoursePage ? "top-0 h-screen" : "top-14 xl:top-16 h-[calc(100vh-3.5rem)] xl:h-[calc(100vh-4rem)]"
        )}>
          <SidebarContainer user={user} />
        </div>
      )}

      {/* Main content with conditional margin and padding */}
      <main
        className={clsx(
          "flex-1 transition-all duration-300",
          // Course pages: Full screen, no padding
          isCoursePage ? "h-screen pt-0 px-0 overflow-y-auto" :
          // Teacher pages: No padding gaps, but keep space for sidebar
          isTeacherPage ? "min-h-screen pt-0 px-0 overflow-y-auto" :
          // Full-width pages: No padding
          isFullWidthPage ? "min-h-screen pt-0 px-0" :
          // Regular pages: Standard padding
          "h-[calc(100vh-3.5rem)] xl:h-[calc(100vh-4rem)] pt-2 px-4 overflow-y-auto"
        )}
        style={{
          // Reserve space for sidebar depending on behavior
          marginLeft: showSidebar
            ? (isSmallMobile
                ? (MOBILE_SIDEBAR_FIXED
                    ? (isFullWidthPage ? '94px' : `${sidebarWidth}px`)
                    : '0'
                  )
                : (!isTablet ? (isFullWidthPage ? '94px' : `${sidebarWidth}px`) : '0')
              )
            : '0',
        }}
      >
        {children}
      </main>
    </div>
  );
} 
