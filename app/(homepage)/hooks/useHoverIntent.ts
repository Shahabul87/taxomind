/**
 * useHoverIntent Hook
 * Implements hover intent with configurable delay to prevent flicker
 *
 * @param delay - Delay in milliseconds before triggering hover state (default: 150ms)
 * @param closeDelay - Delay in milliseconds before closing (default: 150ms)
 * @returns Hover state and handlers
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { UseHoverIntentReturn } from '../types/mega-menu-types';

export function useHoverIntent(delay: number = 150, closeDelay: number = 150): UseHoverIntentReturn {
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    isHoveringRef.current = true;

    // Set hover state after delay
    timeoutRef.current = setTimeout(() => {
      if (isHoveringRef.current) {
        setIsHovering(true);
      }
    }, delay);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    isHoveringRef.current = false;

    // Add a delay before hiding to account for small gaps (sticky zone)
    timeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setIsHovering(false);
      }
    }, closeDelay);
  }, [closeDelay]);

  return {
    isHovering,
    hoverHandlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
    setIsHovering,
  };
}
