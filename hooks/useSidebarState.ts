'use client';

/**
 * Sidebar State Management Hook
 *
 * Manages:
 * - Pin state (persistent via localStorage)
 * - Hover intent delays
 * - Mobile/desktop responsive logic
 * - SSR-safe state initialization
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSidebarStateReturn {
  isPinned: boolean;
  isHovering: boolean;
  isExpanded: boolean;
  isMobile: boolean;
  togglePin: () => void;
  setHovering: (hovering: boolean) => void;
  sidebarWidth: number;
}

const STORAGE_KEY = 'sidebar-pinned';
const HOVER_ENTER_DELAY = 100;
const HOVER_LEAVE_DELAY = 150;
const MOBILE_BREAKPOINT = 1024; // lg breakpoint

export function useSidebarState(): UseSidebarStateReturn {
  // SSR-safe initialization
  const [isPinned, setIsPinned] = useState(false);
  const [isHovering, setIsHoveringState] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load pinned state from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsPinned(JSON.parse(stored));
    }
  }, []);

  // Detect mobile/desktop
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Toggle pin state with localStorage persistence
  const togglePin = useCallback(() => {
    setIsPinned((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));

      // Dispatch custom event for other components to react
      window.dispatchEvent(
        new CustomEvent('sidebar-state-change', {
          detail: {
            expanded: newValue,
            width: newValue ? 224 : 64,
          },
        })
      );

      return newValue;
    });
  }, []);

  // Hover intent management with delays
  const setHovering = useCallback((hovering: boolean) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (hovering) {
      // Delay showing expanded state on hover enter
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoveringState(true);
      }, HOVER_ENTER_DELAY);
    } else {
      // Delay collapsing on hover leave
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHoveringState(false);
      }, HOVER_LEAVE_DELAY);
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Calculate if sidebar should be expanded
  const isExpanded = isPinned || (!isMobile && isHovering);

  // Calculate sidebar width
  const sidebarWidth = isExpanded ? 224 : 64;

  return {
    isPinned,
    isHovering,
    isExpanded,
    isMobile,
    togglePin,
    setHovering,
    sidebarWidth,
  };
}
