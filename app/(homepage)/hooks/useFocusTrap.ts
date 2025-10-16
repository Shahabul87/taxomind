/**
 * useFocusTrap Hook
 * Traps focus within a container element for accessibility
 * Automatically returns focus to trigger element when deactivated
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { UseFocusTrapReturn } from '../types/mega-menu-types';

export const useFocusTrap = <T extends HTMLElement = HTMLDivElement>(): UseFocusTrapReturn & {
  containerRef: React.RefObject<T>;
} => {
  const containerRef = useRef<T>(null);
  const [isActive, setIsActive] = useState(false);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors))
      .filter(el => {
        // Exclude hidden elements
        return !el.hasAttribute('hidden') &&
               el.offsetParent !== null &&
               getComputedStyle(el).visibility !== 'hidden';
      });
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive || event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab (backwards)
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forwards)
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [isActive, getFocusableElements]);

  // Activate focus trap
  const activate = useCallback(() => {
    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;
    setIsActive(true);

    // Focus first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  // Deactivate focus trap
  const deactivate = useCallback(() => {
    setIsActive(false);

    // Return focus to previously focused element
    if (previousActiveElement.current && previousActiveElement.current.focus) {
      previousActiveElement.current.focus();
    }
  }, []);

  // Add keyboard event listener when active
  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  return {
    containerRef,
    isActive,
    activate,
    deactivate,
  };
};
