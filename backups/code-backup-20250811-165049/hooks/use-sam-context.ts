"use client";

import { useEffect, useState, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SAMContextHook {
  pageContext: PageContext;
  learningContext: LearningContext;
  userContext: UserContext;
  recommendedActions: RecommendedAction[];
  isLearningPage: boolean;
  isTeachingPage: boolean;
  isAssessmentPage: boolean;
  contextualHelp: ContextualHelp;
}

interface PageContext {
  pageType: 'home' | 'course' | 'lesson' | 'assessment' | 'dashboard' | 'profile' | 'admin' | 'unknown';
  currentSection: string;
  breadcrumbs: BreadcrumbItem[];
  pageTitle: string;
  userIntent: 'learning' | 'teaching' | 'managing' | 'browsing';
}

interface LearningContext {
  courseId?: string;
  courseName?: string;
  chapterId?: string;
  chapterName?: string;
  sectionId?: string;
  sectionName?: string;
  subject?: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  progress?: number;
  timeSpent?: number;
  lastActivity?: string;
  learningObjectives?: string[];
  prerequisites?: string[];
  nextSteps?: string[];
}

interface UserContext {
  userId?: string;
  role: 'student' | 'teacher' | 'admin';
  experience: 'beginner' | 'intermediate' | 'advanced';
  preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  currentGoals: string[];
  recentActivity: string[];
  knowledgeAreas: string[];
  strugglingTopics: string[];
  achievements: string[];
}

interface RecommendedAction {
  id: string;
  type: 'suggestion' | 'reminder' | 'opportunity' | 'warning';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  category: 'learning' | 'teaching' | 'assessment' | 'progress' | 'engagement';
}

interface ContextualHelp {
  quickTips: string[];
  relevantFeatures: string[];
  commonQuestions: string[];
  suggestedPrompts: string[];
}

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

export function useSAMContext(): SAMContextHook {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [timeSpent, setTimeSpent] = useState(0);
  const [lastActivity, setLastActivity] = useState<string>('');

  // Track time spent on current page
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [pathname]);

  // Track last activity
  useEffect(() => {
    setLastActivity(new Date().toISOString());
  }, [pathname]);

  // Extract page context
  const pageContext = useMemo((): PageContext => {
    if (!pathname) return {
      pageType: 'unknown',
      currentSection: '',
      breadcrumbs: [],
      pageTitle: '',
      userIntent: 'browsing'
    };

    let pageType: PageContext['pageType'] = 'unknown';
    let currentSection = '';
    let userIntent: PageContext['userIntent'] = 'browsing';
    let pageTitle = '';

    // Determine page type and section
    if (pathname === '/') {
      pageType = 'home';
      currentSection = 'Homepage';
      pageTitle = 'Welcome to Taxomind';
    } else if (pathname.includes('/courses/') && pathname.includes('/learn')) {
      pageType = 'lesson';
      currentSection = 'Course Learning';
      userIntent = 'learning';
      pageTitle = 'Course Content';
    } else if (pathname.includes('/courses/')) {
      pageType = 'course';
      currentSection = 'Course Overview';
      userIntent = 'browsing';
      pageTitle = 'Course Details';
    } else if (pathname.includes('/teacher')) {
      pageType = 'dashboard';
      currentSection = 'Teacher Dashboard';
      userIntent = 'teaching';
      pageTitle = 'Teacher Dashboard';
    } else if (pathname.includes('/dashboard')) {
      pageType = 'dashboard';
      currentSection = 'Student Dashboard';
      userIntent = 'managing';
      pageTitle = 'Dashboard';
    } else if (pathname.includes('/assessment') || pathname.includes('/quiz')) {
      pageType = 'assessment';
      currentSection = 'Assessment';
      userIntent = 'learning';
      pageTitle = 'Assessment';
    } else if (pathname.includes('/profile')) {
      pageType = 'profile';
      currentSection = 'Profile';
      userIntent = 'managing';
      pageTitle = 'Profile';
    } else if (pathname.includes('/admin')) {
      pageType = 'admin';
      currentSection = 'Administration';
      userIntent = 'managing';
      pageTitle = 'Admin Panel';
    }

    // Generate breadcrumbs
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/', isActive: false }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isActive = index === pathSegments.length - 1;
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
        isActive
      });
    });

    return {
      pageType,
      currentSection,
      breadcrumbs,
      pageTitle,
      userIntent
    };
  }, [pathname]);

  // Extract learning context
  const learningContext = useMemo((): LearningContext => {
    if (!pathname) return {};

    const context: LearningContext = {
      timeSpent,
      lastActivity
    };

    // Extract IDs from URL
    const courseMatch = pathname.match(/\/courses\/([^\/]+)/);
    const chapterMatch = pathname.match(/\/chapters\/([^\/]+)/);
    const sectionMatch = pathname.match(/\/sections\/([^\/]+)/);

    if (courseMatch) {
      context.courseId = courseMatch[1];
      context.courseName = `Course ${courseMatch[1]}`;
    }

    if (chapterMatch) {
      context.chapterId = chapterMatch[1];
      context.chapterName = `Chapter ${chapterMatch[1]}`;
    }

    if (sectionMatch) {
      context.sectionId = sectionMatch[1];
      context.sectionName = `Section ${sectionMatch[1]}`;
    }

    // Set subject and topic based on context
    if (pathname.includes('/biology')) {
      context.subject = 'Biology';
      context.topic = 'Life Sciences';
      context.difficulty = 'intermediate';
      context.learningObjectives = ['Understand biological processes', 'Analyze living systems'];
    } else if (pathname.includes('/mathematics')) {
      context.subject = 'Mathematics';
      context.topic = 'Mathematical Concepts';
      context.difficulty = 'intermediate';
      context.learningObjectives = ['Solve mathematical problems', 'Apply mathematical principles'];
    } else if (pathname.includes('/teacher')) {
      context.subject = 'Education';
      context.topic = 'Teaching and Learning';
      context.difficulty = 'advanced';
      context.learningObjectives = ['Create effective lessons', 'Assess student progress'];
    }

    // Set progress based on time spent (mock calculation)
    if (timeSpent > 0) {
      context.progress = Math.min(Math.floor(timeSpent / 60000) * 10, 100); // 10% per minute, max 100%
    }

    return context;
  }, [pathname, timeSpent, lastActivity]);

  // Extract user context
  const userContext = useMemo((): UserContext => {
    const baseContext: UserContext = {
      userId: session?.user?.id,
      role: (session?.user?.role as 'student' | 'teacher' | 'admin') || 'student',
      experience: 'intermediate',
      preferredLearningStyle: 'visual',
      currentGoals: [],
      recentActivity: [],
      knowledgeAreas: [],
      strugglingTopics: [],
      achievements: []
    };

    // Set role-specific context
    if (baseContext.role === 'teacher') {
      baseContext.currentGoals = ['Create engaging lessons', 'Improve student outcomes', 'Track progress'];
      baseContext.knowledgeAreas = ['Pedagogy', 'Assessment', 'Curriculum Design'];
      baseContext.recentActivity = ['Created lesson plan', 'Reviewed student work', 'Updated course content'];
    } else if (baseContext.role === 'student') {
      baseContext.currentGoals = ['Complete coursework', 'Improve grades', 'Master key concepts'];
      baseContext.knowledgeAreas = ['Basic concepts', 'Problem solving'];
      baseContext.recentActivity = ['Completed assignment', 'Watched lecture', 'Took quiz'];
    }

    return baseContext;
  }, [session]);

  // Generate recommended actions
  const recommendedActions = useMemo((): RecommendedAction[] => {
    const actions: RecommendedAction[] = [];

    // Learning page actions
    if (pageContext.pageType === 'lesson') {
      actions.push({
        id: 'take-notes',
        type: 'suggestion',
        title: 'Take Notes',
        description: 'Consider taking notes on key concepts as you learn',
        action: 'Open note-taking tool',
        priority: 'medium',
        category: 'learning'
      });

      actions.push({
        id: 'practice-quiz',
        type: 'opportunity',
        title: 'Practice Quiz',
        description: 'Test your understanding with a practice quiz',
        action: 'Generate practice questions',
        priority: 'high',
        category: 'assessment'
      });
    }

    // Teaching page actions
    if (pageContext.pageType === 'dashboard' && userContext.role === 'teacher') {
      actions.push({
        id: 'check-student-progress',
        type: 'reminder',
        title: 'Check Student Progress',
        description: 'Review how your students are performing',
        action: 'View analytics dashboard',
        priority: 'high',
        category: 'teaching'
      });

      actions.push({
        id: 'create-assessment',
        type: 'suggestion',
        title: 'Create Assessment',
        description: 'Generate a new assessment for your course',
        action: 'Open assessment creator',
        priority: 'medium',
        category: 'assessment'
      });
    }

    // Time-based actions
    if (timeSpent > 300000) { // 5 minutes
      actions.push({
        id: 'take-break',
        type: 'reminder',
        title: 'Take a Break',
        description: 'You&apos;ve been studying for a while. Consider taking a short break',
        action: 'Set break reminder',
        priority: 'low',
        category: 'engagement'
      });
    }

    return actions;
  }, [pageContext, userContext, timeSpent]);

  // Generate contextual help
  const contextualHelp = useMemo((): ContextualHelp => {
    const help: ContextualHelp = {
      quickTips: [],
      relevantFeatures: [],
      commonQuestions: [],
      suggestedPrompts: []
    };

    // Page-specific help
    switch (pageContext.pageType) {
      case 'lesson':
        help.quickTips = [
          'Use the progress bar to track your learning',
          'Take notes on key concepts',
          'Ask questions if you don&apos;t understand'
        ];
        help.relevantFeatures = ['Note-taking', 'Progress tracking', 'Quiz generation'];
        help.commonQuestions = [
          'How do I take notes?',
          'Can I get a summary of this lesson?',
          'What should I study next?'
        ];
        help.suggestedPrompts = [
          'Explain this concept in simple terms',
          'Give me practice questions',
          'What are the key takeaways?'
        ];
        break;
      
      case 'dashboard':
        if (userContext.role === 'teacher') {
          help.quickTips = [
            'Check student progress regularly',
            'Use analytics to identify struggling students',
            'Create engaging assessments'
          ];
          help.relevantFeatures = ['Student analytics', 'Lesson planner', 'Assessment creator'];
          help.commonQuestions = [
            'How do I create a lesson plan?',
            'How can I track student progress?',
            'How do I generate assessments?'
          ];
          help.suggestedPrompts = [
            'Create a lesson plan for my next class',
            'Show me struggling students',
            'Generate quiz questions for this topic'
          ];
        } else {
          help.quickTips = [
            'Track your learning progress',
            'Review your achievements',
            'Set learning goals'
          ];
          help.relevantFeatures = ['Progress tracking', 'Goal setting', 'Achievement system'];
          help.commonQuestions = [
            'How am I doing in my courses?',
            'What should I study next?',
            'How do I set learning goals?'
          ];
          help.suggestedPrompts = [
            'Show me my progress',
            'What should I focus on?',
            'Help me plan my studies'
          ];
        }
        break;
      
      default:
        help.quickTips = [
          'Use the navigation menu to find what you need',
          'Ask me any questions about the platform',
          'I can help you with learning and teaching'
        ];
        help.relevantFeatures = ['Navigation help', 'General assistance', 'Platform guidance'];
        help.commonQuestions = [
          'How do I navigate the platform?',
          'What can you help me with?',
          'Where can I find my courses?'
        ];
        help.suggestedPrompts = [
          'Help me get started',
          'What features are available?',
          'How do I use this platform?'
        ];
    }

    return help;
  }, [pageContext, userContext]);

  // Page type checks
  const isLearningPage = pageContext.pageType === 'lesson' || pageContext.pageType === 'course';
  const isTeachingPage = pageContext.userIntent === 'teaching';
  const isAssessmentPage = pageContext.pageType === 'assessment';

  return {
    pageContext,
    learningContext,
    userContext,
    recommendedActions,
    isLearningPage,
    isTeachingPage,
    isAssessmentPage,
    contextualHelp
  };
}