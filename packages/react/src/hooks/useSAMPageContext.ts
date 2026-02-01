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
    // ============================================================================
    // TEACHER ROUTES (most specific first)
    // ============================================================================
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
      pattern: /^\/teacher\/analytics/,
      type: 'analytics',
    },
    {
      pattern: /^\/teacher/,
      type: 'teacher-dashboard',
    },

    // ============================================================================
    // LEARNING ROUTES (student-facing, most specific first)
    // ============================================================================
    // Exam results with attempt
    {
      pattern: /^\/courses\/([^/]+)\/learn\/([^/]+)\/sections\/([^/]+)\/exams\/([^/]+)\/results\/([^/]+)/,
      type: 'exam-results',
      extract: (match) => ({
        entityId: match[5], // attemptId
        parentEntityId: match[4], // examId
        grandParentEntityId: match[3], // sectionId
        metadata: {
          courseId: match[1],
          chapterId: match[2],
          sectionId: match[3],
          examId: match[4],
          attemptId: match[5],
        },
      }),
    },
    // Exam page
    {
      pattern: /^\/courses\/([^/]+)\/learn\/([^/]+)\/sections\/([^/]+)\/exams\/([^/]+)/,
      type: 'exam',
      extract: (match) => ({
        entityId: match[4], // examId
        parentEntityId: match[3], // sectionId
        grandParentEntityId: match[2], // chapterId
        metadata: {
          courseId: match[1],
          chapterId: match[2],
          sectionId: match[3],
          examId: match[4],
        },
      }),
    },
    // Section within learn flow
    {
      pattern: /^\/courses\/([^/]+)\/learn\/([^/]+)\/sections\/([^/]+)/,
      type: 'section-learning',
      extract: (match) => ({
        entityId: match[3], // sectionId
        parentEntityId: match[2], // chapterId
        grandParentEntityId: match[1], // courseId
        metadata: {
          courseId: match[1],
          chapterId: match[2],
          sectionId: match[3],
        },
      }),
    },
    // Chapter learning page
    {
      pattern: /^\/courses\/([^/]+)\/learn\/([^/]+)/,
      type: 'chapter-learning',
      extract: (match) => ({
        entityId: match[2], // chapterId
        parentEntityId: match[1], // courseId
        metadata: {
          courseId: match[1],
          chapterId: match[2],
        },
      }),
    },
    // Course learning landing
    {
      pattern: /^\/courses\/([^/]+)\/learn/,
      type: 'course-learning',
      extract: (match) => ({
        entityId: match[1], // courseId
        metadata: {
          courseId: match[1],
        },
      }),
    },
    // Course detail/preview
    {
      pattern: /^\/courses\/([^/]+)/,
      type: 'course-detail',
      extract: (match) => ({
        entityId: match[1],
      }),
    },
    // Course listing
    {
      pattern: /^\/courses$/,
      type: 'courses-list',
    },

    // ============================================================================
    // DASHBOARD & GENERAL ROUTES
    // ============================================================================
    {
      pattern: /^\/dashboard\/user\/analytics/,
      type: 'user-analytics',
    },
    {
      pattern: /^\/dashboard\/user/,
      type: 'user-dashboard',
    },
    {
      pattern: /^\/dashboard\/admin/,
      type: 'admin-dashboard',
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
        capabilities: getCapabilitiesForType(type),
        breadcrumb: buildBreadcrumbsFromPath(path),
        ...extracted,
      };
    }
  }

  return {
    type: 'other',
    path,
    capabilities: getCapabilitiesForType('other'),
    breadcrumb: buildBreadcrumbsFromPath(path),
  };
}

// ============================================================================
// ENRICHMENT HELPERS
// ============================================================================

function getCapabilitiesForType(pageType: string): string[] {
  const capabilities: Record<string, string[]> = {
    'courses-list': ['view-courses', 'create-course', 'search-courses'],
    'course-detail': ['edit-course', 'add-chapters', 'generate-content', 'publish-course'],
    'chapter-detail': ['edit-chapter', 'add-sections', 'generate-content', 'publish-chapter'],
    'section-detail': ['edit-section', 'add-content', 'add-video', 'add-quiz', 'generate-content'],
    'course-create': ['create-course', 'use-template', 'ai-suggestions'],
    'dashboard': ['view-overview', 'quick-actions'],
    'user-dashboard': ['view-overview', 'quick-actions'],
    'admin-dashboard': ['view-overview', 'manage-users', 'system-settings'],
    'user-analytics': ['view-metrics', 'export-data'],
    'analytics': ['view-metrics', 'export-data'],
    'teacher-dashboard': ['view-overview', 'manage-courses'],
    'course-learning': ['view-content', 'ask-questions', 'take-quiz'],
    'chapter-learning': ['view-content', 'ask-questions', 'take-quiz'],
    'section-learning': ['view-content', 'ask-questions', 'take-quiz'],
    'exam': ['take-exam', 'view-instructions'],
    'exam-results': ['view-results', 'review-answers'],
    'settings': ['update-profile', 'change-preferences'],
    'other': ['general-help', 'navigation'],
  };
  return capabilities[pageType] || capabilities.other;
}

function buildBreadcrumbsFromPath(path: string): string[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: string[] = [];

  for (const segment of segments) {
    // Skip UUID-like segments
    if (/^[a-f0-9-]{8,}$/i.test(segment)) continue;
    const formatted = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    breadcrumbs.push(formatted);
  }

  return breadcrumbs;
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
