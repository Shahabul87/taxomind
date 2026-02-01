/**
 * Pure utility functions for page context (extracted from use-page-context.ts).
 * These are framework-free helpers — no React hooks.
 */

export function detectPageName(pageType: string): string {
  const nameMap: Record<string, string> = {
    'section-detail': 'Section Editor',
    'section-learning': 'Section Learning',
    'chapter-detail': 'Chapter Editor',
    'chapter-learning': 'Chapter Learning',
    'course-detail': 'Course Editor',
    'course-learning': 'Course Learning',
    'course-create': 'Create Course',
    'courses-list': 'My Courses',
    'dashboard': 'Dashboard',
    'user-dashboard': 'Dashboard',
    'admin-dashboard': 'Admin Dashboard',
    'user-analytics': 'Analytics',
    'analytics': 'Analytics',
    'posts': 'Posts',
    'templates': 'Templates',
    'learning': 'Learning',
    'teacher-dashboard': 'Teacher Dashboard',
    'exam': 'Exam',
    'exam-results': 'Exam Results',
    'settings': 'Settings',
    'other': 'Page',
  };
  return nameMap[pageType] || 'Page';
}

export function buildBreadcrumbs(path: string): string[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: string[] = [];

  for (const segment of segments) {
    // Skip UUID-like segments
    if (segment.match(/^[a-f0-9-]{8,}$/i)) continue;
    const formatted = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    breadcrumbs.push(formatted);
  }

  return breadcrumbs;
}

export function getPageCapabilities(pageType: string): string[] {
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
    'posts': ['create-post', 'edit-post'],
    'templates': ['use-template', 'create-template'],
    'learning': ['view-content', 'ask-questions', 'take-quiz'],
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
