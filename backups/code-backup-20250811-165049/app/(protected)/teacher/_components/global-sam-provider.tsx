"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ContextAwareSamAssistant } from './context-aware-sam-assistant';
import { currentUser } from '@/lib/auth';

interface PageContext {
  pageName: string;
  pageType: 'courses' | 'create' | 'analytics' | 'posts' | 'templates' | 'course-detail' | 'chapter-detail' | 'section-detail' | 'other';
  breadcrumbs: string[];
  capabilities: string[];
  dataContext: any;
  currentRoute: string;
  parentContext?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    postId?: string;
  };
}

interface GlobalSamContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  pageContext: PageContext;
  updatePageContext: (context: Partial<PageContext>) => void;
}

const GlobalSamContext = createContext<GlobalSamContextType | null>(null);

export const useGlobalSam = () => {
  const context = useContext(GlobalSamContext);
  if (!context) {
    throw new Error('useGlobalSam must be used within GlobalSamProvider');
  }
  return context;
};

interface GlobalSamProviderProps {
  children: React.ReactNode;
}

export function GlobalSamProvider({ children }: GlobalSamProviderProps) {
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = useState(true);
  const [pageContext, setPageContext] = useState<PageContext>({
    pageName: 'Teacher Dashboard',
    pageType: 'other',
    breadcrumbs: [],
    capabilities: [],
    dataContext: {},
    currentRoute: pathname,
  });

  // Parse the current route and determine page context
  useEffect(() => {
    const analyzeRoute = () => {
      const segments = pathname.split('/').filter(Boolean);
      
      // Remove 'teacher' from segments for easier parsing
      const teacherIndex = segments.indexOf('teacher');
      const routeSegments = segments.slice(teacherIndex + 1);
      
      let newContext: PageContext = {
        pageName: 'Teacher Dashboard',
        pageType: 'other',
        breadcrumbs: ['Teacher'],
        capabilities: ['general_help', 'navigation'],
        dataContext: {},
        currentRoute: pathname,
      };

      // Analyze route segments
      if (routeSegments.length === 0) {
        // /teacher
        newContext = {
          ...newContext,
          pageName: 'Teacher Dashboard',
          pageType: 'other',
          breadcrumbs: ['Teacher', 'Dashboard'],
          capabilities: ['general_help', 'navigation', 'course_overview'],
        };
      } else if (routeSegments[0] === 'courses') {
        if (routeSegments.length === 1) {
          // /teacher/courses
          newContext = {
            ...newContext,
            pageName: 'Courses Management',
            pageType: 'courses',
            breadcrumbs: ['Teacher', 'Courses'],
            capabilities: ['course_management', 'course_creation', 'course_analytics', 'bulk_operations'],
            dataContext: { context: 'courses_list' },
          };
        } else if (routeSegments[1] && routeSegments[1] !== 'create') {
          // /teacher/courses/[courseId]
          const courseId = routeSegments[1];
          newContext = {
            ...newContext,
            pageName: 'Course Editor',
            pageType: 'course-detail',
            breadcrumbs: ['Teacher', 'Courses', 'Course Editor'],
            capabilities: ['course_editing', 'chapter_management', 'learning_objectives', 'course_analytics'],
            dataContext: { context: 'course_detail', courseId },
            parentContext: { courseId },
          };

          if (routeSegments[2] === 'chapters' && routeSegments[3]) {
            // /teacher/courses/[courseId]/chapters/[chapterId]
            const chapterId = routeSegments[3];
            newContext = {
              ...newContext,
              pageName: 'Chapter Editor',
              pageType: 'chapter-detail',
              breadcrumbs: ['Teacher', 'Courses', 'Course Editor', 'Chapter Editor'],
              capabilities: ['chapter_editing', 'section_management', 'content_creation', 'assessments'],
              dataContext: { context: 'chapter_detail', courseId, chapterId },
              parentContext: { courseId, chapterId },
            };

            if (routeSegments[4] === 'section' && routeSegments[5]) {
              // /teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]
              const sectionId = routeSegments[5];
              newContext = {
                ...newContext,
                pageName: 'Section Editor',
                pageType: 'section-detail',
                breadcrumbs: ['Teacher', 'Courses', 'Course Editor', 'Chapter Editor', 'Section Editor'],
                capabilities: ['section_editing', 'content_creation', 'assessments', 'video_management', 'blog_management'],
                dataContext: { context: 'section_detail', courseId, chapterId, sectionId },
                parentContext: { courseId, chapterId, sectionId },
              };
            }
          }
        }
      } else if (routeSegments[0] === 'create') {
        // /teacher/create
        newContext = {
          ...newContext,
          pageName: 'Course Creation',
          pageType: 'create',
          breadcrumbs: ['Teacher', 'Create Course'],
          capabilities: ['course_creation', 'ai_assistance', 'template_selection', 'course_planning'],
          dataContext: { context: 'course_creation' },
        };
      } else if (routeSegments[0] === 'analytics') {
        // /teacher/analytics
        newContext = {
          ...newContext,
          pageName: 'Analytics Dashboard',
          pageType: 'analytics',
          breadcrumbs: ['Teacher', 'Analytics'],
          capabilities: ['analytics_insights', 'performance_tracking', 'student_analytics', 'course_performance'],
          dataContext: { context: 'analytics_dashboard' },
        };
      } else if (routeSegments[0] === 'posts') {
        // /teacher/posts
        newContext = {
          ...newContext,
          pageName: 'Posts Management',
          pageType: 'posts',
          breadcrumbs: ['Teacher', 'Posts'],
          capabilities: ['post_management', 'content_creation', 'blog_editing'],
          dataContext: { context: 'posts_management' },
        };
      } else if (routeSegments[0] === 'templates') {
        // /teacher/templates
        newContext = {
          ...newContext,
          pageName: 'Templates Management',
          pageType: 'templates',
          breadcrumbs: ['Teacher', 'Templates'],
          capabilities: ['template_management', 'template_creation', 'template_marketplace'],
          dataContext: { context: 'templates_management' },
        };
      } else if (routeSegments[0] === 'allposts') {
        // /teacher/allposts
        newContext = {
          ...newContext,
          pageName: 'All Posts',
          pageType: 'posts',
          breadcrumbs: ['Teacher', 'All Posts'],
          capabilities: ['post_management', 'content_overview', 'bulk_operations'],
          dataContext: { context: 'all_posts' },
        };
      }

      setPageContext(newContext);
    };

    analyzeRoute();
  }, [pathname]);

  const updatePageContext = (context: Partial<PageContext>) => {
    setPageContext(prev => ({ ...prev, ...context }));
  };

  return (
    <GlobalSamContext.Provider value={{
      isEnabled,
      setIsEnabled,
      pageContext,
      updatePageContext,
    }}>
      {children}
      {isEnabled && <ContextAwareSamAssistant />}
    </GlobalSamContext.Provider>
  );
}