"use client";

import { useEffect } from 'react';
import { useGlobalSam } from './global-sam-provider';

interface PageContextData {
  courses?: any[];
  course?: any;
  chapter?: any;
  section?: any;
  post?: any;
  stats?: any;
  analytics?: any;
  templates?: any[];
  categories?: any[];
  users?: any[];
  formData?: any;
  additionalCapabilities?: string[];
  customActions?: Array<{
    value: string;
    label: string;
    icon: string;
    description?: string;
  }>;
}

export function useSamPageContext(data: PageContextData) {
  const { updatePageContext, pageContext } = useGlobalSam();

  useEffect(() => {
    // Update page context with the provided data
    updatePageContext({
      dataContext: {
        ...pageContext.dataContext,
        ...data
      },
      capabilities: [
        ...pageContext.capabilities,
        ...(data.additionalCapabilities || [])
      ]
    });
  }, [data, updatePageContext, pageContext.capabilities, pageContext.dataContext]);

  return {
    updatePageContext,
    pageContext
  };
}

// Helper hooks for specific page types
export function useCoursesPageContext(courses: any[], stats: any) {
  return useSamPageContext({
    courses,
    stats,
    additionalCapabilities: ['course_creation', 'bulk_operations', 'performance_analysis']
  });
}

export function useCourseDetailPageContext(course: any, chapters: any[], categories: any[]) {
  return useSamPageContext({
    course: { ...course, chapters },
    categories,
    additionalCapabilities: ['content_editing', 'structure_analysis', 'learning_objectives']
  });
}

export function useChapterDetailPageContext(course: any, chapter: any, sections: any[]) {
  return useSamPageContext({
    course,
    chapter: { ...chapter, sections },
    additionalCapabilities: ['section_creation', 'content_generation', 'assessment_creation']
  });
}

export function useSectionDetailPageContext(course: any, chapter: any, section: any) {
  return useSamPageContext({
    course,
    chapter,
    section,
    additionalCapabilities: ['video_management', 'blog_creation', 'exam_creation', 'resource_management']
  });
}

export function useAnalyticsPageContext(analytics: any) {
  return useSamPageContext({
    analytics,
    additionalCapabilities: ['data_interpretation', 'trend_analysis', 'performance_insights']
  });
}

export function useCreatePageContext(categories: any[], templates: any[]) {
  return useSamPageContext({
    categories,
    templates,
    additionalCapabilities: ['course_planning', 'template_selection', 'ai_assistance']
  });
}

// Enhanced context provider for forms
export function useFormContext(formData: any, formType: string) {
  return useSamPageContext({
    formData,
    additionalCapabilities: [`${formType}_form_assistance`, 'validation_help', 'auto_completion']
  });
}