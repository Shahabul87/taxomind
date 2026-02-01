import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { PageContext } from '../types';

interface UsePageContextReturn {
  pageContext: PageContext;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  isHiddenRoute: boolean;
  isAdminPage: boolean;
}

export function usePageContext(): UsePageContextReturn {
  const pathname = usePathname();

  const pageContext = useMemo((): PageContext => {
    const path = pathname || '/';
    const pageType = detectPageType(path);
    const pageName = detectPageName(pageType);
    const breadcrumbs = buildBreadcrumbs(path);
    const capabilities = getPageCapabilities(pageType);

    const courseMatch = path.match(/\/courses\/([^/]+)/);
    const chapterMatch = path.match(/\/chapters\/([^/]+)/);
    const sectionMatch = path.match(/\/section\/([^/]+)/);

    return {
      pageName,
      pageType,
      path,
      breadcrumbs,
      capabilities,
      entityId: sectionMatch?.[1] || chapterMatch?.[1] || courseMatch?.[1],
      parentEntityId: chapterMatch?.[1] || courseMatch?.[1],
      grandParentEntityId: courseMatch?.[1],
    };
  }, [pathname]);

  const courseMatch = pathname?.match(/\/courses\/([^/]+)/);
  const chapterMatch = pathname?.match(/\/chapters\/([^/]+)/);
  const sectionMatch = pathname?.match(/\/section\/([^/]+)/);

  const hideRoutes = ['/auth', '/login', '/register', '/admin/auth'];
  const isHiddenRoute = hideRoutes.some((route) => pathname?.startsWith(route));
  const isAdminPage = pathname?.startsWith('/dashboard/admin') ?? false;

  return {
    pageContext,
    courseId: courseMatch?.[1],
    chapterId: chapterMatch?.[1],
    sectionId: sectionMatch?.[1],
    isHiddenRoute,
    isAdminPage,
  };
}

// =============================================================================
// Helper functions (moved from SAMAssistant.tsx)
// =============================================================================

function detectPageType(path: string): string {
  if (path.match(/\/teacher\/courses\/[^/]+\/chapters\/[^/]+\/section\/[^/]+/)) return 'section-detail';
  if (path.match(/\/teacher\/courses\/[^/]+\/chapters\/[^/]+/)) return 'chapter-detail';
  if (path.match(/\/teacher\/courses\/[^/]+/)) return 'course-detail';
  if (path.match(/\/teacher\/courses$/)) return 'courses-list';
  if (path.match(/\/teacher\/create/)) return 'course-create';
  if (path.match(/\/courses\/[^/]+/)) return 'course-detail';
  if (path.match(/\/dashboard/)) return 'dashboard';
  if (path.match(/\/teacher\/analytics/)) return 'analytics';
  if (path.match(/\/teacher\/posts/) || path.match(/\/teacher\/allposts/)) return 'posts';
  if (path.match(/\/teacher\/templates/)) return 'templates';
  if (path.match(/\/learn/)) return 'learning';
  if (path.match(/\/teacher/)) return 'teacher-dashboard';
  return 'other';
}

function detectPageName(pageType: string): string {
  const nameMap: Record<string, string> = {
    'section-detail': 'Section Editor',
    'chapter-detail': 'Chapter Editor',
    'course-detail': 'Course Editor',
    'courses-list': 'My Courses',
    'course-create': 'Create Course',
    'dashboard': 'Dashboard',
    'analytics': 'Analytics',
    'posts': 'Posts',
    'templates': 'Templates',
    'learning': 'Learning',
    'teacher-dashboard': 'Teacher Dashboard',
    'other': 'Page',
  };
  return nameMap[pageType] || 'Page';
}

function buildBreadcrumbs(path: string): string[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: string[] = [];

  for (const segment of segments) {
    if (segment.match(/^[a-f0-9-]{8,}$/i)) continue;
    const formatted = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    breadcrumbs.push(formatted);
  }

  return breadcrumbs;
}

function getPageCapabilities(pageType: string): string[] {
  const capabilities: Record<string, string[]> = {
    'courses-list': ['view-courses', 'create-course', 'search-courses'],
    'course-detail': ['edit-course', 'add-chapters', 'generate-content', 'publish-course'],
    'chapter-detail': ['edit-chapter', 'add-sections', 'generate-content', 'publish-chapter'],
    'section-detail': ['edit-section', 'add-content', 'add-video', 'add-quiz', 'generate-content'],
    'course-create': ['create-course', 'use-template', 'ai-suggestions'],
    'dashboard': ['view-overview', 'quick-actions'],
    'analytics': ['view-metrics', 'export-data'],
    'posts': ['create-post', 'edit-post'],
    'templates': ['use-template', 'create-template'],
    'learning': ['view-content', 'ask-questions', 'take-quiz'],
    'other': ['general-help', 'navigation'],
  };
  return capabilities[pageType] || capabilities.other;
}

// Re-export helpers for anyone who needs them
export { detectPageType, detectPageName, buildBreadcrumbs, getPageCapabilities };
