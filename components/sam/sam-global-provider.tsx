"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SAMGlobalContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  learningContext: LearningContext;
  tutorMode: 'teacher' | 'student' | 'admin';
  features: string[];
  position: 'floating' | 'sidebar' | 'header' | 'tab';
  theme: 'teacher' | 'student' | 'learning' | 'dashboard' | 'default';
  screenSize: 'mobile' | 'tablet' | 'desktop';
  shouldShow: boolean;
  toggleSAM: () => void;
  updateContext: (context: Partial<LearningContext>) => void;
}

interface LearningContext {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  subject?: string;
  currentTopic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  currentPage?: string;
  userRole?: string;
  learningObjectives?: string[];
  studentLevel?: string;
  // Enhanced context awareness
  contextData?: any;
  pageType?: string;
  entityType?: string;
  entityData?: any;
  formData?: Record<string, any>;
  analysisMode?: 'basic' | 'contextual' | 'deep';
  lastContextUpdate?: Date;
}

const SAMGlobalContext = createContext<SAMGlobalContextType | undefined>(undefined);

export function useSAMGlobal() {
  const context = useContext(SAMGlobalContext);
  if (!context) {
    throw new Error('useSAMGlobal must be used within a SAMGlobalProvider');
  }
  return context;
}

interface SAMGlobalProviderProps {
  children: React.ReactNode;
}

export function SAMGlobalProvider({ children }: SAMGlobalProviderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [customContext, setCustomContext] = useState<Partial<LearningContext>>({});

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real course data loading
  const [courseData, setCourseData] = useState<any>(null);
  const [chapterData, setChapterData] = useState<any>(null);

  // Context detection from URL and session
  const learningContext = useMemo((): LearningContext => {
    if (!pathname) return customContext;

    // Extract context from URL patterns
    const courseMatch = pathname.match(/\/courses\/([^\/]+)/);
    const chapterMatch = pathname.match(/\/chapters\/([^\/]+)/);
    const sectionMatch = pathname.match(/\/sections\/([^\/]+)/);
    const teacherMatch = pathname.match(/\/(teacher|protected\/teacher)/);
    const learnMatch = pathname.match(/\/learn/);

    const baseContext: LearningContext = {
      courseId: courseMatch?.[1],
      chapterId: chapterMatch?.[1],
      sectionId: sectionMatch?.[1],
      currentPage: pathname,
      userRole: session?.user?.role || 'student',
      subject: courseData?.title || customContext.subject,
      currentTopic: chapterData?.title || customContext.currentTopic,
      learningObjectives: courseData?.learningObjectives || customContext.learningObjectives,
      ...customContext
    };

    // Add page-specific context
    if (teacherMatch) {
      baseContext.subject = 'Teaching';
      baseContext.currentTopic = 'Course Management';
      baseContext.difficulty = 'intermediate';
      baseContext.learningObjectives = ['Create engaging content', 'Monitor student progress', 'Assess learning outcomes'];
    } else if (learnMatch && courseMatch) {
      baseContext.subject = 'Learning';
      baseContext.currentTopic = 'Course Content';
      baseContext.difficulty = 'beginner';
      baseContext.learningObjectives = ['Understand concepts', 'Complete assignments', 'Track progress'];
    } else if (pathname.includes('/dashboard')) {
      baseContext.subject = 'Platform Navigation';
      baseContext.currentTopic = 'Dashboard';
      baseContext.difficulty = 'beginner';
      baseContext.learningObjectives = ['Navigate platform', 'Access resources', 'Track progress'];
    }

    return baseContext;
  }, [pathname, session, customContext, courseData, chapterData]);
  
  // Load course data when courseId changes
  useEffect(() => {
    const courseId = learningContext.courseId;
    if (!courseId) {
      setCourseData(null);
      return;
    }
    
    const loadCourseData = async () => {
      try {
        // Try to get course data from the page context first
        const pageTitle = document.title;
        const courseTitle = document.querySelector('h1')?.textContent;
        
        if (courseTitle && courseTitle !== pageTitle) {
          setCourseData({
            id: courseId,
            title: courseTitle,
            learningObjectives: [], // Could be extracted from page
          });
        }
        
        // Optionally make API call for full course data
        // const response = await fetch(`/api/courses/${courseId}`);
        // if (response.ok) {
        //   const course = await response.json();
        //   setCourseData(course);
        // }
      } catch (error) {
        console.error('Error loading course data:', error);
      }
    };
    
    loadCourseData();
  }, [learningContext.courseId]);
  
  // Load chapter data when chapterId changes
  useEffect(() => {
    const chapterId = learningContext.chapterId;
    if (!chapterId) {
      setChapterData(null);
      return;
    }
    
    const loadChapterData = async () => {
      try {
        // Extract chapter title from page
        const chapterTitle = document.querySelector('h1, h2')?.textContent;
        
        if (chapterTitle) {
          setChapterData({
            id: chapterId,
            title: chapterTitle,
          });
        }
      } catch (error) {
        console.error('Error loading chapter data:', error);
      }
    };
    
    loadChapterData();
  }, [learningContext.chapterId]);

  // Determine tutor mode based on context
  const tutorMode = useMemo((): 'teacher' | 'student' | 'admin' => {
    if (pathname?.includes('/teacher') || pathname?.includes('/protected/teacher')) return 'teacher';
    if (pathname?.includes('/admin')) return 'admin';
    return 'student';
  }, [pathname]);

  // Determine features based on tutor mode and context
  const features = useMemo((): string[] => {
    switch (tutorMode) {
      case 'teacher':
        return [
          'lesson-planning',
          'student-analytics',
          'assessment-generation',
          'teaching-insights',
          'curriculum-design',
          'grading-assistance'
        ];
      case 'student':
        if (pathname?.includes('/learn')) {
          return [
            'concept-explanation',
            'quiz-help',
            'study-guidance',
            'homework-assistance',
            'progress-tracking',
            'learning-tips'
          ];
        }
        return [
          'general-help',
          'course-recommendations',
          'study-planning',
          'progress-insights',
          'navigation-assistance'
        ];
      case 'admin':
        return [
          'platform-management',
          'user-analytics',
          'system-insights',
          'content-moderation',
          'platform-guidance'
        ];
      default:
        return ['general-help', 'navigation-assistance'];
    }
  }, [tutorMode, pathname]);

  // Determine position based on context
  const position = useMemo((): 'floating' | 'sidebar' | 'header' | 'tab' => {
    if (screenSize === 'mobile') return 'floating';
    if (pathname?.includes('/learn')) return 'floating';
    if (pathname?.includes('/teacher')) return 'floating';
    return 'floating';
  }, [screenSize, pathname]);

  // Determine theme based on context
  const theme = useMemo((): 'teacher' | 'student' | 'learning' | 'dashboard' | 'default' => {
    if (pathname?.includes('/teacher')) return 'teacher';
    if (pathname?.includes('/learn')) return 'learning';
    if (pathname?.includes('/dashboard')) return 'dashboard';
    if (session?.user?.role === 'teacher') return 'teacher';
    return 'student';
  }, [pathname, session]);

  // Determine if SAM should be shown
  const shouldShow = useMemo((): boolean => {
    if (!session) return false;
    
    // Hide on specific routes
    const hideRoutes = [
      '/auth',
      '/login',
      '/register',
      '/api',
      '/_next',
      '/favicon',
      '/robots.txt',
      '/sitemap.xml'
    ];
    
    const shouldHide = hideRoutes.some(route => 
      pathname?.startsWith(route)
    );
    
    return !shouldHide;
  }, [pathname, session]);

  // Toggle SAM
  const toggleSAM = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Update context
  const updateContext = useCallback((context: Partial<LearningContext>) => {
    setCustomContext(prev => ({ ...prev, ...context }));
  }, []);

  const value: SAMGlobalContextType = {
    isOpen,
    setIsOpen,
    learningContext,
    tutorMode,
    features,
    position,
    theme,
    screenSize,
    shouldShow,
    toggleSAM,
    updateContext
  };

  return (
    <SAMGlobalContext.Provider value={value}>
      {children}
    </SAMGlobalContext.Provider>
  );
}