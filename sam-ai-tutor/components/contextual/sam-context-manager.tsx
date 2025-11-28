"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSAMGlobal } from '@/sam/components/global/sam-global-provider';
import { logger } from '@/lib/logger';

export interface SAMContextData {
  url: string;
  pageType: string;
  entityType?: string;
  entityId?: string;
  entityData?: any;
  formData?: Record<string, any>;
  userRole?: string;
  lastUpdated: Date;
}

export interface URLPattern {
  pattern: RegExp;
  pageType: string;
  entityType?: string;
  dataFetcher?: (params: Record<string, string>) => Promise<any>;
}

const URL_PATTERNS: URLPattern[] = [
  // Course patterns
  {
    pattern: /^\/teacher\/courses\/([^\/]+)$/,
    pageType: 'course-edit',
    entityType: 'course',
    dataFetcher: async (params) => {
      const response = await fetch(`/api/courses/${params.courseId}`);
      if (response.ok) return response.json();
      return null;
    }
  },
  {
    pattern: /^\/teacher\/courses\/([^\/]+)\/chapters\/([^\/]+)$/,
    pageType: 'chapter-edit',
    entityType: 'chapter',
    dataFetcher: async (params) => {
      const [courseResponse, chapterResponse] = await Promise.all([
        fetch(`/api/courses/${params.courseId}`),
        fetch(`/api/courses/${params.courseId}/chapters/${params.chapterId}`)
      ]);
      
      const course = courseResponse.ok ? await courseResponse.json() : null;
      const chapter = chapterResponse.ok ? await chapterResponse.json() : null;
      
      return { course, chapter };
    }
  },
  {
    pattern: /^\/teacher\/courses\/([^\/]+)\/chapters\/([^\/]+)\/section\/([^\/]+)$/,
    pageType: 'section-edit',
    entityType: 'section',
    dataFetcher: async (params) => {
      const [courseResponse, chapterResponse, sectionResponse] = await Promise.all([
        fetch(`/api/courses/${params.courseId}`),
        fetch(`/api/courses/${params.courseId}/chapters/${params.chapterId}`),
        fetch(`/api/courses/${params.courseId}/chapters/${params.chapterId}/sections/${params.sectionId}`)
      ]);
      
      const course = courseResponse.ok ? await courseResponse.json() : null;
      const chapter = chapterResponse.ok ? await chapterResponse.json() : null;
      const section = sectionResponse.ok ? await sectionResponse.json() : null;
      
      return { course, chapter, section };
    }
  },
  // Teacher dashboard patterns
  {
    pattern: /^\/teacher\/courses$/,
    pageType: 'courses-list',
    entityType: 'courses',
    dataFetcher: async () => {
      const response = await fetch('/api/teacher/courses');
      if (response.ok) return response.json();
      return null;
    }
  },
  {
    pattern: /^\/teacher\/create$/,
    pageType: 'course-create',
    entityType: 'course-creator'
  },
  {
    pattern: /^\/teacher\/create\/revolutionary-course-architect$/,
    pageType: 'revolutionary-architect',
    entityType: 'course-architect'
  },
  // Student patterns
  {
    pattern: /^\/course\/([^\/]+)$/,
    pageType: 'course-view',
    entityType: 'course',
    dataFetcher: async (params) => {
      const response = await fetch(`/api/courses/${params.courseId}/public`);
      if (response.ok) return response.json();
      return null;
    }
  },
  // Analytics patterns
  {
    pattern: /^\/teacher\/analytics$/,
    pageType: 'analytics-dashboard',
    entityType: 'analytics'
  },
  // Posts patterns
  {
    pattern: /^\/teacher\/posts\/([^\/]+)$/,
    pageType: 'post-edit',
    entityType: 'post',
    dataFetcher: async (params) => {
      const response = await fetch(`/api/posts/${params.postId}`);
      if (response.ok) return response.json();
      return null;
    }
  }
];

export function useContextAwareSAM() {
  const pathname = usePathname();
  const { updateContext } = useSAMGlobal();
  const [currentContext, setCurrentContext] = useState<SAMContextData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastFormHashRef = useRef<string | null>(null);

  const extractRouteParams = useCallback((pattern: RegExp, url: string): Record<string, string> => {
    const match = url.match(pattern);
    if (!match) return {};

    const params: Record<string, string> = {};
    
    // Extract common parameter names based on URL patterns
    if (match[1]) params.courseId = match[1];
    if (match[2]) params.chapterId = match[2];
    if (match[3]) params.sectionId = match[3];
    if (match[1] && url.includes('/posts/')) params.postId = match[1];
    
    return params;
  }, []);

  const fetchContextData = useCallback(async (url: string): Promise<SAMContextData | null> => {
    setIsLoading(true);
    
    try {
      // Find matching URL pattern
      const matchedPattern = URL_PATTERNS.find(pattern => pattern.pattern.test(url));
      
      if (!matchedPattern) {
        // Default context for unmatched URLs
        return {
          url,
          pageType: 'unknown',
          lastUpdated: new Date()
        };
      }

      const params = extractRouteParams(matchedPattern.pattern, url);
      let entityData = null;

      // Fetch data if fetcher is available
      if (matchedPattern.dataFetcher) {
        try {
          entityData = await matchedPattern.dataFetcher(params);
        } catch (error: any) {
          logger.warn('SAM Context: Failed to fetch entity data:', error);
        }
      }

      const context: SAMContextData = {
        url,
        pageType: matchedPattern.pageType,
        entityType: matchedPattern.entityType,
        entityId: params.courseId || params.chapterId || params.sectionId || params.postId,
        entityData,
        lastUpdated: new Date()
      };

      return context;
    } catch (error: any) {
      logger.error('SAM Context: Error fetching context data:', error);
      return {
        url,
        pageType: 'error',
        lastUpdated: new Date()
      };
    } finally {
      setIsLoading(false);
    }
  }, [extractRouteParams]);

  const gatherFormData = useCallback((): Record<string, any> => {
    const formData: Record<string, any> = {};
    
    // Gather data from all forms on the page
    const forms = document.querySelectorAll('form[data-form], form[id]');
    
    forms.forEach((form) => {
      const formElement = form as HTMLFormElement;
      const formId = formElement.getAttribute('data-form') || 
                     formElement.getAttribute('id') || 
                     formElement.getAttribute('data-purpose') || 
                     'unknown';
      
      const inputs = formElement.querySelectorAll('input, textarea, select');
      const formValues: Record<string, any> = {};
      
      inputs.forEach((input) => {
        const inputElement = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const name = inputElement.name || inputElement.getAttribute('data-field-purpose') || 'unnamed';
        
        if (inputElement.type === 'checkbox') {
          formValues[name] = (inputElement as HTMLInputElement).checked;
        } else if (inputElement.type === 'radio') {
          if ((inputElement as HTMLInputElement).checked) {
            formValues[name] = inputElement.value;
          }
        } else {
          formValues[name] = inputElement.value;
        }
      });
      
      if (Object.keys(formValues).length > 0) {
        formData[formId] = formValues;
      }
    });
    
    return formData;
  }, []);

  const updateContextWithFormData = useCallback(() => {
    if (currentContext) {
      const formData = gatherFormData();
      // Avoid noisy updates if nothing changed
      const hash = JSON.stringify(formData);
      if (lastFormHashRef.current === hash) return;
      lastFormHashRef.current = hash;

      const updatedContext = {
        ...currentContext,
        formData,
        lastUpdated: new Date()
      };
      
      setCurrentContext(updatedContext);
      updateContext({
        contextData: updatedContext,
        analysisMode: 'contextual'
      });
    }
  }, [currentContext, gatherFormData, updateContext]);

  // Initialize context when URL changes
  useEffect(() => {
    if (pathname) {
      fetchContextData(pathname).then((context) => {
        if (context) {
          setCurrentContext(context);
          
          // Also gather initial form data
          setTimeout(() => {
            const formData = gatherFormData();
            const contextWithForms = {
              ...context,
              formData,
              lastUpdated: new Date()
            };
            
            setCurrentContext(contextWithForms);
            updateContext({
              contextData: contextWithForms,
              analysisMode: 'contextual'
            });
          }, 500); // Small delay to ensure forms are rendered
        }
      });
    }
  }, [pathname, fetchContextData, gatherFormData, updateContext]);

  // Set up form change listeners
  useEffect(() => {
    const handleFormChange = () => {
      // Debounce form updates
      clearTimeout((window as any).samFormUpdateTimeout);
      (window as any).samFormUpdateTimeout = setTimeout(updateContextWithFormData, 2000);
    };

    // Listen to form changes
    document.addEventListener('input', handleFormChange);
    document.addEventListener('change', handleFormChange);

    return () => {
      document.removeEventListener('input', handleFormChange);
      document.removeEventListener('change', handleFormChange);
      clearTimeout((window as any).samFormUpdateTimeout);
    };
  }, [updateContextWithFormData]);

  const getContextualGreeting = useCallback((): string => {
    if (!currentContext) return "Hi! I&apos;m SAM, your AI learning assistant. How can I help you today?";

    const { pageType, entityType, entityData } = currentContext;

    switch (pageType) {
      case 'course-edit':
        const courseName = entityData?.title || 'your course';
        return `Hi! I&apos;m here to help you work on "${courseName}". I can assist with course structure, content creation, student engagement strategies, or any questions about your course development.`;
        
      case 'chapter-edit':
        const chapterTitle = entityData?.chapter?.title || 'this chapter';
        const courseTitle = entityData?.course?.title || 'your course';
        return `I&apos;m ready to help you develop "${chapterTitle}" in "${courseTitle}". I can assist with chapter content, learning objectives, section planning, or any pedagogical questions.`;
        
      case 'section-edit':
        const sectionTitle = entityData?.section?.title || 'this section';
        return `Let&apos;s work on "${sectionTitle}" together! I can help with content creation, assessments, interactive elements, or improving learning effectiveness.`;
        
      case 'revolutionary-architect':
        return `🚀 Welcome to the Revolutionary Course Architect! I&apos;m SAM, your AI pedagogical partner. Let&apos;s create an amazing course together using learning science and market intelligence.`;
        
      case 'course-create':
        return `Ready to create a new course? I'm here to guide you through the process, from initial concept to market-ready course. What subject would you like to teach?`;
        
      case 'courses-list':
        return `I can see your course dashboard! I&apos;m here to help with course management, analytics insights, student engagement strategies, or planning new courses.`;
        
      case 'analytics-dashboard':
        return `Let's dive into your analytics! I can help interpret student performance data, suggest improvements, identify trends, or optimize your teaching strategies.`;
        
      case 'post-edit':
        const postTitle = entityData?.title || 'your post';
        return `Working on "${postTitle}"? I can help with content structure, engagement strategies, educational value, or writing improvements.`;
        
      default:
        return `I&apos;m SAM, your AI learning assistant. I can see you&apos;re working in the ${entityType || 'platform'} section. How can I help you today?`;
    }
  }, [currentContext]);

  const getContextualCapabilities = useCallback((): string[] => {
    if (!currentContext) return ['General learning assistance', 'Course planning', 'Educational guidance'];

    const { pageType } = currentContext;

    switch (pageType) {
      case 'course-edit':
        return [
          'Course structure optimization',
          'Content planning and organization',
          'Student engagement strategies',
          'Learning outcome design',
          'Market positioning advice',
          'Assessment strategy planning'
        ];
        
      case 'chapter-edit':
        return [
          'Chapter content development',
          'Learning objective alignment',
          'Section planning and sequencing',
          'Cognitive load optimization',
          'Assessment integration',
          'Engagement activity suggestions'
        ];
        
      case 'section-edit':
        return [
          'Content creation guidance',
          'Interactive element suggestions',
          'Assessment design',
          'Difficulty progression',
          'Student activity planning',
          'Learning effectiveness optimization'
        ];
        
      case 'revolutionary-architect':
        return [
          'AI-powered course architecture',
          'Pedagogical design optimization',
          'Market analysis and positioning',
          'Learning science integration',
          'Predictive success analytics',
          'Real-time course building'
        ];
        
      case 'course-create':
        return [
          'Course concept development',
          'Target audience analysis',
          'Learning pathway design',
          'Content structure planning',
          'Market research insights',
          'Technology recommendations'
        ];
        
      default:
        return [
          'Educational guidance',
          'Learning optimization',
          'Content development',
          'Student engagement',
          'Performance analysis'
        ];
    }
  }, [currentContext]);

  return {
    currentContext,
    isLoading,
    updateContextWithFormData,
    getContextualGreeting,
    getContextualCapabilities,
    fetchContextData
  };
}

export function SAMContextManager() {
  const { isLoading } = useContextAwareSAM();
  
  // This component doesn't render anything visible
  // It just manages context in the background
  return null;
}
