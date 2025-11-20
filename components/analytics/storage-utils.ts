/**
 * Storage Utilities for Analytics Component
 *
 * Provides localStorage-based persistence for analytics UI state.
 * All functions include SSR safety checks.
 */

import { logger } from '@/lib/logger';

/** LocalStorage key for storing the active analytics tab */
const TAB_STORAGE_KEY = 'analytics-active-tab';

/** LocalStorage key for storing the selected time period */
const PERIOD_STORAGE_KEY = 'analytics-selected-period';

/**
 * Retrieves the stored active tab from localStorage.
 *
 * SSR-safe: Returns default value ('overview') when window is undefined.
 *
 * @returns The stored tab name, or 'overview' if none is stored
 *
 * @example
 * ```tsx
 * const activeTab = getStoredTab(); // 'performance' or 'overview'
 * ```
 */
export const getStoredTab = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TAB_STORAGE_KEY) || 'overview';
  }
  return 'overview';
};

/**
 * Retrieves the stored time period from localStorage.
 *
 * SSR-safe: Returns default value ('DAILY') when window is undefined.
 *
 * @returns The stored period ('DAILY' | 'WEEKLY' | 'MONTHLY'), or 'DAILY' if none is stored
 *
 * @example
 * ```tsx
 * const period = getStoredPeriod(); // 'WEEKLY' or 'DAILY'
 * ```
 */
export const getStoredPeriod = (): 'DAILY' | 'WEEKLY' | 'MONTHLY' => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem(PERIOD_STORAGE_KEY) as 'DAILY' | 'WEEKLY' | 'MONTHLY') || 'DAILY';
  }
  return 'DAILY';
};

/**
 * Stores the active tab in localStorage.
 *
 * SSR-safe: Does nothing when window is undefined.
 *
 * @param tab - The tab name to store
 *
 * @example
 * ```tsx
 * storeTab('performance');
 * // Next time: getStoredTab() will return 'performance'
 * ```
 */
export const storeTab = (tab: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch (error) {
      // Silently fail if localStorage is unavailable (private browsing, quota exceeded, etc.)
      logger.warn('[ANALYTICS_STORAGE] Failed to store analytics tab', {
        tab,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};

/**
 * Stores the selected time period in localStorage.
 *
 * SSR-safe: Does nothing when window is undefined.
 *
 * @param period - The period to store ('DAILY' | 'WEEKLY' | 'MONTHLY')
 *
 * @example
 * ```tsx
 * storePeriod('WEEKLY');
 * // Next time: getStoredPeriod() will return 'WEEKLY'
 * ```
 */
export const storePeriod = (period: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PERIOD_STORAGE_KEY, period);
    } catch (error) {
      // Silently fail if localStorage is unavailable (private browsing, quota exceeded, etc.)
      logger.warn('[ANALYTICS_STORAGE] Failed to store analytics period', {
        period,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};
