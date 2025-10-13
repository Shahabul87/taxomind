"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useLayoutDimensions } from '@/hooks/use-layout-dimensions';

interface LayoutContextType {
  sidebarWidth: number;
  headerHeight: number;
  isSidebarExpanded: boolean;
  isMobile: boolean;
  isTablet: boolean;
  contentWidth: string; // CSS value for content area width
  contentMargin: string; // CSS value for content margin
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const dimensions = useLayoutDimensions();

  // Calculate content dimensions
  const contentWidth = dimensions.isMobile
    ? '100%'
    : `calc(100% - ${dimensions.sidebarWidth}px)`;

  const contentMargin = dimensions.isMobile
    ? '0'
    : `${dimensions.sidebarWidth}px`;

  const value: LayoutContextType = {
    ...dimensions,
    contentWidth,
    contentMargin,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

/**
 * Hook to access layout dimensions in child components
 * Useful for teacher pages that need to adjust dynamically
 */
export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

/**
 * Optional hook that returns undefined if not in a layout context
 * Useful for components that can work with or without layout context
 */
export function useLayoutOptional() {
  return useContext(LayoutContext);
}
