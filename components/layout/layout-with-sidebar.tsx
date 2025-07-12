"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarContainer } from "@/components/ui/sidebar-container";
import clsx from "clsx";

interface LayoutWithSidebarProps {
  user: any;
  children: React.ReactNode;
}

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
];

// Routes that need full-width layout (no padding)
const FULL_WIDTH_ROUTES = [
  "/features",
  "/",
  "/about",
  "/blog",
  "/courses",
  "/profile",
  "/solutions",
  "/ai-trends",
  "/ai-tutor",
  "/ai-news",
  "/ai-research",
];

// Patterns for routes where the sidebar should be hidden
const SIDEBAR_HIDDEN_PATTERNS = [
  /^\/courses\/[^\/]+$/, // Course detail pages
  /^\/blog\/[^\/]+$/, 
  /^\/courses\/[^\/]+\/learn\/[^\/]+\/sections\/[^\/]+$/, // Course learning section pages
];

export default function LayoutWithSidebar({ user, children }: LayoutWithSidebarProps) {
  const pathname = usePathname();
  
  // Check if the current path matches any of the hidden routes or patterns
  const isHiddenRoute = pathname ? SIDEBAR_HIDDEN_ROUTES.includes(pathname) : false;
  const matchesHiddenPattern = pathname ? 
    SIDEBAR_HIDDEN_PATTERNS.some(pattern => pattern.test(pathname)) : false;
  
  const shouldShowSidebar = !(isHiddenRoute || matchesHiddenPattern);
  const hasUser = !!user;
  const showSidebar = hasUser && shouldShowSidebar;
  
  // Determine if we're on a course page or full-width page
  const isCoursePage = pathname ? /^\/courses\/[^\/]+$/.test(pathname) : false;
  const isFullWidthPage = pathname ? FULL_WIDTH_ROUTES.includes(pathname) : false;

  return (
    <div className={clsx(
      "flex h-screen",
      isCoursePage ? "" : "pt-16"
    )}>
      {/* Conditional sidebar */}
      {showSidebar && (
        <div className={clsx(
          "fixed left-0 bottom-0 z-40",
          isCoursePage ? "top-0 h-screen" : "top-16 h-[calc(100vh-4rem)]"
        )}>
          <SidebarContainer user={user} />
        </div>
      )}
      
      {/* Main content with conditional margin and padding */}
      <main
        className={clsx(
          "flex-1",
          isCoursePage ? "h-screen pt-0 px-0 overflow-y-auto" : 
          isFullWidthPage ? "min-h-screen pt-0 px-0" :
          "h-[calc(100vh-4rem)] pt-2 px-4 overflow-y-auto",
          showSidebar && !isFullWidthPage ? "ml-[80px]" : ""
        )}
      >
        {children}
      </main>
    </div>
  );
} 