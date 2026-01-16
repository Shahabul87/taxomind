'use client';

/**
 * SAMContextTracker
 *
 * Invisible component that automatically detects and syncs page context with SAM.
 * Uses the useSAMAutoContext hook to track:
 * - Current page/route
 * - Page type (course, lesson, exam, dashboard, etc.)
 * - Relevant IDs (courseId, chapterId, sectionId, etc.)
 *
 * This component should be placed inside a SAMProvider context.
 * It renders nothing (returns null) but keeps SAM's context in sync with the current page.
 *
 * Supported page types:
 * - Dashboard routes: dashboard, user-dashboard, admin-dashboard, teacher-dashboard, user-analytics
 * - Course management: courses-list, course-detail, course-create, chapter-detail, section-detail
 * - Learning routes: course-learning, chapter-learning, section-learning
 * - Exam routes: exam, exam-results
 * - General routes: settings, analytics, other
 */

import { useSAMAutoContext } from '@sam-ai/react';

export interface SAMContextTrackerProps {
  /**
   * Enable or disable automatic context detection.
   * Defaults to true.
   */
  enabled?: boolean;
}

/**
 * SAMContextTracker Component
 *
 * Automatically syncs page context with SAM when the route changes.
 * Must be used within a SAMProvider.
 *
 * The hook detects context from URL patterns and extracts:
 * - pageType: The type of page (course-learning, exam-results, etc.)
 * - entityId: The primary entity ID (courseId, chapterId, etc.)
 * - parentEntityId: The parent entity ID for nested routes
 * - grandParentEntityId: The grandparent for deeply nested routes
 * - metadata: Additional context like courseId, chapterId, sectionId, examId
 *
 * @example
 * ```tsx
 * // In a layout or page component inside SAMProvider
 * <SAMProvider>
 *   <SAMContextTracker />
 *   {children}
 * </SAMProvider>
 * ```
 *
 * @example
 * ```tsx
 * // Conditionally enable based on user preference
 * <SAMContextTracker enabled={userPreferences.enableContextTracking} />
 * ```
 */
export function SAMContextTracker({ enabled = true }: SAMContextTrackerProps) {
  // Hook handles all context detection and syncing
  // - Detects on mount
  // - Listens for popstate events (browser back/forward)
  // - Uses MutationObserver to detect Next.js App Router navigation
  useSAMAutoContext(enabled);

  // This is an invisible component - renders nothing
  return null;
}

export default SAMContextTracker;
