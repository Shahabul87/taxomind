"use client";

import { useEffect } from 'react';
import { usePathname, useParams } from 'next/navigation';

export function TeacherPageContextInjector() {
  const pathname = usePathname();
  const params = useParams();

  useEffect(() => {
    // Inject page-specific context for Enhanced SAM
    const injectPageContext = () => {
      const pageContext: any = {
        pageType: detectPageType(pathname),
        pathname,
        params,
        timestamp: new Date().toISOString()
      };

      // Detect specific page contexts
      if (pathname.includes('/teacher/create')) {
        pageContext.context = 'course-creation';
        pageContext.capabilities = [
          'course-title-generation',
          'course-description-generation',
          'learning-objectives-generation',
          'form-assistance'
        ];
        pageContext.formData = {
          availableForms: ['create-course'],
          formPurposes: {
            'create-course': 'Create a new course with title'
          }
        };
      } else if (pathname.includes('/teacher/courses/') && params.courseId) {
        pageContext.context = 'course-editing';
        pageContext.entityType = 'course';
        pageContext.entityId = params.courseId;
        pageContext.capabilities = [
          'content-generation',
          'form-population',
          'course-improvement',
          'learning-objectives-generation'
        ];
        pageContext.formData = {
          availableForms: ['course-title', 'course-description', 'course-learning-outcomes', 'course-price', 'course-category'],
          formPurposes: {
            'course-title': 'Update course title',
            'course-description': 'Update course description',
            'course-learning-outcomes': 'Update learning objectives',
            'course-price': 'Set course price',
            'course-category': 'Set course category'
          }
        };
      } else if (pathname.includes('/teacher/posts/') && params.postId) {
        pageContext.context = 'post-editing';
        pageContext.entityType = 'post';
        pageContext.entityId = params.postId;
        pageContext.capabilities = [
          'blog-content-generation',
          'post-improvement',
          'form-assistance'
        ];
        pageContext.formData = {
          availableForms: ['post-title', 'post-description', 'post-category'],
          formPurposes: {
            'post-title': 'Update post title',
            'post-description': 'Update post description',
            'post-category': 'Set post category'
          }
        };
      } else if (pathname === '/teacher/courses') {
        pageContext.context = 'course-list';
        pageContext.capabilities = [
          'course-analysis',
          'navigation-assistance',
          'course-suggestions'
        ];
      } else if (pathname === '/teacher/analytics') {
        pageContext.context = 'analytics';
        pageContext.capabilities = [
          'data-analysis',
          'insights-generation',
          'trend-identification'
        ];
      }

      // Inject context into Enhanced SAM if available
      if ((window as any).enhancedSam?.injectContext) {
        (window as any).enhancedSam.injectContext({
          metadata: {
            ...((window as any).enhancedSam.getPageData().metadata || {}),
            teacherContext: pageContext,
            capabilities: pageContext.capabilities || []
          }
        });

      }

      // Also dispatch custom event
      window.dispatchEvent(new CustomEvent('teacher-page-context', {
        detail: pageContext
      }));
    };

    // Inject context after a short delay to ensure page is loaded
    const timer = setTimeout(injectPageContext, 500);
    
    // Also inject on various intervals to catch dynamic content
    const intervals = [1000, 2000, 3000];
    const timers = intervals.map(delay => 
      setTimeout(injectPageContext, delay)
    );

    return () => {
      clearTimeout(timer);
      timers.forEach(t => clearTimeout(t));
    };
  }, [pathname, params]);

  return null;
}

function detectPageType(pathname: string): string {
  if (pathname.includes('/create')) return 'create';
  if (pathname.includes('/courses/') && pathname.split('/').length > 4) return 'course-edit';
  if (pathname.includes('/posts/') && pathname.split('/').length > 4) return 'post-edit';
  if (pathname.includes('/analytics')) return 'analytics';
  if (pathname.includes('/courses')) return 'course-list';
  if (pathname.includes('/posts')) return 'post-list';
  return 'unknown';
}