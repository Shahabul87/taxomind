'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { DashboardView } from '../components/TabNavigation';

const TAB_ORDER: DashboardView[] = [
  'todos',
  'analytics',
  'skills',
  'practice',
  'goals',
  'gaps',
  'insights',
];

interface UseTabKeyboardNavOptions {
  activeTab: DashboardView;
  onTabChange: (tab: DashboardView) => void;
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation between tabs
 * - Left/Right arrows navigate between tabs
 * - Home goes to first tab
 * - End goes to last tab
 */
export function useTabKeyboardNav({
  activeTab,
  onTabChange,
  enabled = true,
}: UseTabKeyboardNavOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex === -1) return;

      let newIndex: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
          newIndex = (currentIndex + 1) % TAB_ORDER.length;
          event.preventDefault();
          break;
        case 'ArrowLeft':
          newIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
          event.preventDefault();
          break;
        case 'Home':
          newIndex = 0;
          event.preventDefault();
          break;
        case 'End':
          newIndex = TAB_ORDER.length - 1;
          event.preventDefault();
          break;
      }

      if (newIndex !== null) {
        onTabChange(TAB_ORDER[newIndex]);
        // Focus the new tab button
        const tabButton = containerRef.current?.querySelector(
          `[data-tab="${TAB_ORDER[newIndex]}"]`
        ) as HTMLButtonElement | null;
        tabButton?.focus();
      }
    },
    [activeTab, onTabChange, enabled]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return { containerRef };
}
