/**
 * @sam-ai/react - useSAMPageContext Hook
 * Hook for page context management
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useSAMContext } from '../context/SAMContext';
import type { SAMContext } from '@sam-ai/core';
import type { UseSAMContextReturn } from '../types';

/**
 * Hook for SAM page context management
 *
 * @example
 * ```tsx
 * function PageComponent() {
 *   const { context, updatePage, detectPageContext } = useSAMPageContext();
 *
 *   useEffect(() => {
 *     // Auto-detect context on mount
 *     detectPageContext();
 *   }, []);
 *
 *   return (
 *     <div>
 *       <p>Current page: {context.page.type}</p>
 *       <button onClick={() => updatePage({ type: 'dashboard' })}>
 *         Set Dashboard
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSAMPageContext(): UseSAMContextReturn {
  const { context, updateContext, updatePage } = useSAMContext();

  const updateUser = useCallback(
    (user: Partial<SAMContext['user']>) => {
      updateContext({ user: { ...context.user, ...user } });
    },
    [context.user, updateContext]
  );

  const detectPageContext = useCallback(() => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    const detected = detectContextFromPath(path);
    updatePage(detected);
  }, [updatePage]);

  return {
    context,
    updateContext,
    updatePage,
    updateUser,
    detectPageContext,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectContextFromPath(path: string): Partial<SAMContext['page']> {
  const patterns: Array<{
    pattern: RegExp;
    type: SAMContext['page']['type'];
    extract?: (match: RegExpMatchArray) => Partial<SAMContext['page']>;
  }> = [
    {
      pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)\/section\/([^/]+)/,
      type: 'section-detail',
      extract: (match) => ({
        entityId: match[3],
        parentEntityId: match[2],
        grandParentEntityId: match[1],
      }),
    },
    {
      pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)/,
      type: 'chapter-detail',
      extract: (match) => ({
        entityId: match[2],
        parentEntityId: match[1],
      }),
    },
    {
      pattern: /^\/teacher\/courses\/([^/]+)/,
      type: 'course-detail',
      extract: (match) => ({
        entityId: match[1],
      }),
    },
    {
      pattern: /^\/teacher\/courses/,
      type: 'courses-list',
    },
    {
      pattern: /^\/teacher\/create/,
      type: 'course-create',
    },
    {
      pattern: /^\/courses\/([^/]+)/,
      type: 'course-detail',
      extract: (match) => ({
        entityId: match[1],
      }),
    },
    {
      pattern: /^\/dashboard/,
      type: 'dashboard',
    },
    {
      pattern: /^\/settings/,
      type: 'settings',
    },
  ];

  for (const { pattern, type, extract } of patterns) {
    const match = path.match(pattern);
    if (match) {
      const extracted = extract?.(match) ?? {};
      return {
        type,
        path,
        ...extracted,
      };
    }
  }

  return {
    type: 'other',
    path,
  };
}

/**
 * Hook to auto-detect and sync page context on route changes
 */
export function useSAMAutoContext(enabled = true): void {
  const { detectPageContext } = useSAMPageContext();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Detect on mount
    detectPageContext();

    // Listen for route changes (works with Next.js router)
    const handleRouteChange = () => {
      detectPageContext();
    };

    // Use popstate for browser navigation
    window.addEventListener('popstate', handleRouteChange);

    // For Next.js App Router, we can use MutationObserver on URL changes
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        handleRouteChange();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      observer.disconnect();
    };
  }, [enabled, detectPageContext]);
}
