"use client";

import { useMemo } from 'react';
import { useSAMGlobal } from './sam-global-provider';
import { useSession } from 'next-auth/react';

export interface SAMFeatureConfig {
  id: string;
  name: string;
  description: string;
  category: 'teaching' | 'learning' | 'assessment' | 'analytics' | 'management' | 'general';
  permissions: {
    roles: ('student' | 'teacher' | 'admin')[];
    contexts: string[];
    conditions?: (context: any) => boolean;
  };
  icon: string;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
  defaultPrompts: string[];
  quickActions: Array<{
    id: string;
    label: string;
    action: string;
    icon: string;
  }>;
}

export const SAM_FEATURE_CONFIGS: SAMFeatureConfig[] = [
  // Teaching Features
  {
    id: 'lesson-planning',
    name: 'Lesson Planning',
    description: 'AI-powered lesson plan generation and curriculum design',
    category: 'teaching',
    permissions: {
      roles: ['teacher', 'admin'],
      contexts: ['teacher', 'dashboard', 'course-management'],
      conditions: (context) => context.userRole === 'teacher'
    },
    icon: 'BookOpen',
    priority: 'high',
    enabled: true,
    defaultPrompts: [
      'Create a lesson plan for my next class',
      'Generate learning objectives for this topic',
      'Design activities for student engagement',
      'Create assessment rubrics'
    ],
    quickActions: [
      { id: 'create-lesson', label: 'New Lesson Plan', action: 'open-lesson-planner', icon: 'Plus' },
      { id: 'lesson-templates', label: 'Templates', action: 'show-templates', icon: 'Template' },
      { id: 'lesson-library', label: 'My Lessons', action: 'open-library', icon: 'FolderOpen' }
    ]
  },
  {
    id: 'student-analytics',
    name: 'Student Analytics',
    description: 'Track student progress, identify at-risk learners, and generate insights',
    category: 'analytics',
    permissions: {
      roles: ['teacher', 'admin'],
      contexts: ['teacher', 'dashboard', 'analytics'],
      conditions: (context) => context.userRole === 'teacher'
    },
    icon: 'BarChart3',
    priority: 'high',
    enabled: true,
    defaultPrompts: [
      'Show me student progress analytics',
      'Identify students who need help',
      'Generate performance reports',
      'Analyze engagement patterns'
    ],
    quickActions: [
      { id: 'view-analytics', label: 'View Analytics', action: 'open-analytics', icon: 'TrendingUp' },
      { id: 'at-risk-students', label: 'At-Risk Students', action: 'show-at-risk', icon: 'AlertTriangle' },
      { id: 'progress-reports', label: 'Progress Reports', action: 'generate-reports', icon: 'FileText' }
    ]
  },
  {
    id: 'assessment-generation',
    name: 'Assessment Generation',
    description: 'Create quizzes, tests, and assignments with AI assistance',
    category: 'assessment',
    permissions: {
      roles: ['teacher', 'admin'],
      contexts: ['teacher', 'assessment', 'course-management'],
      conditions: (context) => context.userRole === 'teacher'
    },
    icon: 'ClipboardCheck',
    priority: 'high',
    enabled: true,
    defaultPrompts: [
      'Create quiz questions for this topic',
      'Generate multiple choice questions',
      'Design rubrics for assignments',
      'Create formative assessments'
    ],
    quickActions: [
      { id: 'create-quiz', label: 'New Quiz', action: 'open-quiz-creator', icon: 'Plus' },
      { id: 'question-bank', label: 'Question Bank', action: 'open-question-bank', icon: 'Database' },
      { id: 'auto-grade', label: 'Auto-Grade', action: 'enable-auto-grading', icon: 'CheckCircle' }
    ]
  },
  {
    id: 'teaching-insights',
    name: 'Teaching Insights',
    description: 'Get personalized recommendations for improving teaching effectiveness',
    category: 'teaching',
    permissions: {
      roles: ['teacher', 'admin'],
      contexts: ['teacher', 'dashboard', 'course-management'],
      conditions: (context) => context.userRole === 'teacher'
    },
    icon: 'Lightbulb',
    priority: 'medium',
    enabled: true,
    defaultPrompts: [
      'How can I improve my teaching?',
      'What teaching strategies work best?',
      'How to increase student engagement?',
      'Best practices for online learning'
    ],
    quickActions: [
      { id: 'teaching-tips', label: 'Teaching Tips', action: 'show-tips', icon: 'Target' },
      { id: 'engagement-strategies', label: 'Engagement', action: 'show-strategies', icon: 'Zap' },
      { id: 'best-practices', label: 'Best Practices', action: 'show-practices', icon: 'Star' }
    ]
  },

  // Learning Features
  {
    id: 'concept-explanation',
    name: 'Concept Explanation',
    description: 'Get clear explanations of complex concepts and topics',
    category: 'learning',
    permissions: {
      roles: ['student', 'teacher', 'admin'],
      contexts: ['student', 'learning', 'course-content'],
      conditions: (context) => true
    },
    icon: 'Brain',
    priority: 'high',
    enabled: true,
    defaultPrompts: [
      'Explain this concept to me',
      'What does this mean?',
      'Give me an example',
      'Break this down into simpler terms'
    ],
    quickActions: [
      { id: 'explain-concept', label: 'Explain', action: 'explain-current-topic', icon: 'MessageCircle' },
      { id: 'show-examples', label: 'Examples', action: 'show-examples', icon: 'List' },
      { id: 'visual-aids', label: 'Visual Aids', action: 'show-diagrams', icon: 'Image' }
    ]
  },
  {
    id: 'study-guidance',
    name: 'Study Guidance',
    description: 'Personalized study recommendations and learning strategies',
    category: 'learning',
    permissions: {
      roles: ['student', 'teacher'],
      contexts: ['student', 'learning', 'dashboard'],
      conditions: (context) => context.userRole === 'student' || context.userRole === 'teacher'
    },
    icon: 'Target',
    priority: 'high',
    enabled: true,
    defaultPrompts: [
      'How should I study this topic?',
      'Create a study plan for me',
      'What are the key points to remember?',
      'Help me prepare for the exam'
    ],
    quickActions: [
      { id: 'study-plan', label: 'Study Plan', action: 'create-study-plan', icon: 'Calendar' },
      { id: 'key-points', label: 'Key Points', action: 'highlight-key-points', icon: 'Star' },
      { id: 'practice-questions', label: 'Practice', action: 'generate-practice', icon: 'Edit' }
    ]
  },
  {
    id: 'homework-assistance',
    name: 'Homework Help',
    description: 'Get help with assignments and homework problems',
    category: 'learning',
    permissions: {
      roles: ['student'],
      contexts: ['student', 'learning', 'homework'],
      conditions: (context) => context.userRole === 'student'
    },
    icon: 'PenTool',
    priority: 'high',
    enabled: true,
    defaultPrompts: [
      'Help me with this homework problem',
      'Check my work',
      'Guide me through this step by step',
      'What am I doing wrong?'
    ],
    quickActions: [
      { id: 'step-by-step', label: 'Step-by-Step', action: 'show-steps', icon: 'ArrowRight' },
      { id: 'check-work', label: 'Check Work', action: 'check-solution', icon: 'CheckCircle' },
      { id: 'hints', label: 'Hints', action: 'provide-hints', icon: 'HelpCircle' }
    ]
  },
  {
    id: 'quiz-help',
    name: 'Quiz Assistance',
    description: 'Practice with quizzes and get feedback on performance',
    category: 'assessment',
    permissions: {
      roles: ['student', 'teacher'],
      contexts: ['student', 'learning', 'assessment'],
      conditions: (context) => true
    },
    icon: 'HelpCircle',
    priority: 'medium',
    enabled: true,
    defaultPrompts: [
      'Create practice questions for me',
      'Help me understand this quiz question',
      'Generate a practice test',
      'Explain the correct answer'
    ],
    quickActions: [
      { id: 'practice-quiz', label: 'Practice Quiz', action: 'create-practice-quiz', icon: 'Play' },
      { id: 'review-answers', label: 'Review', action: 'review-answers', icon: 'Eye' },
      { id: 'quiz-tips', label: 'Quiz Tips', action: 'show-quiz-tips', icon: 'Lightbulb' }
    ]
  },
  {
    id: 'progress-tracking',
    name: 'Progress Tracking',
    description: 'Monitor your learning progress and achievements',
    category: 'analytics',
    permissions: {
      roles: ['student', 'teacher', 'admin'],
      contexts: ['student', 'teacher', 'dashboard', 'analytics'],
      conditions: (context) => true
    },
    icon: 'TrendingUp',
    priority: 'medium',
    enabled: true,
    defaultPrompts: [
      'Show me my progress',
      'How am I doing in this course?',
      'What are my strengths and weaknesses?',
      'Set learning goals for me'
    ],
    quickActions: [
      { id: 'view-progress', label: 'View Progress', action: 'show-progress', icon: 'BarChart' },
      { id: 'set-goals', label: 'Set Goals', action: 'set-learning-goals', icon: 'Target' },
      { id: 'achievements', label: 'Achievements', action: 'show-achievements', icon: 'Award' }
    ]
  },

  // Management Features
  {
    id: 'platform-management',
    name: 'Platform Management',
    description: 'Manage users, courses, and platform settings',
    category: 'management',
    permissions: {
      roles: ['admin'],
      contexts: ['admin', 'management'],
      conditions: (context) => context.userRole === 'admin'
    },
    icon: 'Settings',
    priority: 'high',
    enabled: true,
    defaultPrompts: [
      'Help me manage the platform',
      'Show user statistics',
      'Generate platform reports',
      'Optimize platform performance'
    ],
    quickActions: [
      { id: 'user-management', label: 'Users', action: 'manage-users', icon: 'Users' },
      { id: 'course-management', label: 'Courses', action: 'manage-courses', icon: 'BookOpen' },
      { id: 'system-health', label: 'System Health', action: 'check-health', icon: 'Activity' }
    ]
  },
  {
    id: 'content-moderation',
    name: 'Content Moderation',
    description: 'Review and moderate user-generated content',
    category: 'management',
    permissions: {
      roles: ['admin', 'teacher'],
      contexts: ['admin', 'management', 'moderation'],
      conditions: (context) => context.userRole === 'admin' || context.userRole === 'teacher'
    },
    icon: 'Shield',
    priority: 'medium',
    enabled: true,
    defaultPrompts: [
      'Review flagged content',
      'Check for inappropriate material',
      'Moderate user discussions',
      'Generate moderation reports'
    ],
    quickActions: [
      { id: 'review-content', label: 'Review', action: 'review-content', icon: 'Eye' },
      { id: 'flagged-items', label: 'Flagged', action: 'show-flagged', icon: 'Flag' },
      { id: 'moderation-log', label: 'Mod Log', action: 'show-mod-log', icon: 'FileText' }
    ]
  },

  // General Features
  {
    id: 'general-help',
    name: 'General Help',
    description: 'Get help with platform navigation and general questions',
    category: 'general',
    permissions: {
      roles: ['student', 'teacher', 'admin'],
      contexts: ['*'],
      conditions: (context) => true
    },
    icon: 'HelpCircle',
    priority: 'low',
    enabled: true,
    defaultPrompts: [
      'How do I use this platform?',
      'Where can I find my courses?',
      'Help me navigate',
      'What can you help me with?'
    ],
    quickActions: [
      { id: 'platform-tour', label: 'Platform Tour', action: 'start-tour', icon: 'MapPin' },
      { id: 'help-docs', label: 'Help Docs', action: 'open-docs', icon: 'Book' },
      { id: 'contact-support', label: 'Support', action: 'contact-support', icon: 'MessageSquare' }
    ]
  },
  {
    id: 'navigation-assistance',
    name: 'Navigation Help',
    description: 'Help with finding features and navigating the platform',
    category: 'general',
    permissions: {
      roles: ['student', 'teacher', 'admin'],
      contexts: ['*'],
      conditions: (context) => true
    },
    icon: 'Navigation',
    priority: 'low',
    enabled: true,
    defaultPrompts: [
      'Where can I find...?',
      'How do I get to...?',
      'Show me the way to...',
      'Navigate me to...'
    ],
    quickActions: [
      { id: 'find-feature', label: 'Find Feature', action: 'find-feature', icon: 'Search' },
      { id: 'quick-nav', label: 'Quick Nav', action: 'show-quick-nav', icon: 'Compass' },
      { id: 'shortcuts', label: 'Shortcuts', action: 'show-shortcuts', icon: 'Zap' }
    ]
  }
];

export function useSAMRoleConfig() {
  const { data: session } = useSession();
  const { learningContext, tutorMode } = useSAMGlobal();

  const availableFeatures = useMemo(() => {
    const userRole = session?.user?.role || 'student';
    const currentContext = {
      userRole,
      ...learningContext,
      tutorMode
    };

    return SAM_FEATURE_CONFIGS.filter(feature => {
      // Check if feature is enabled
      if (!feature.enabled) return false;

      // Check role permissions
      if (!feature.permissions.roles.includes(userRole as any)) return false;

      // Check context permissions
      if (feature.permissions.contexts.includes('*')) return true;
      if (feature.permissions.contexts.includes(tutorMode)) return true;
      if (feature.permissions.contexts.some(ctx => learningContext.currentPage?.includes(ctx))) return true;

      // Check custom conditions
      if (feature.permissions.conditions) {
        return feature.permissions.conditions(currentContext);
      }

      return false;
    });
  }, [session, learningContext, tutorMode]);

  const getFeaturesByCategory = useMemo(() => {
    const categories: Record<string, SAMFeatureConfig[]> = {};
    
    availableFeatures.forEach(feature => {
      if (!categories[feature.category]) {
        categories[feature.category] = [];
      }
      categories[feature.category].push(feature);
    });

    // Sort features by priority within each category
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    });

    return categories;
  }, [availableFeatures]);

  const getHighPriorityFeatures = useMemo(() => {
    return availableFeatures.filter(feature => feature.priority === 'high');
  }, [availableFeatures]);

  const getDefaultPrompts = useMemo(() => {
    return availableFeatures.reduce((prompts, feature) => {
      return [...prompts, ...feature.defaultPrompts];
    }, [] as string[]);
  }, [availableFeatures]);

  const getQuickActions = useMemo(() => {
    return availableFeatures.reduce((actions, feature) => {
      return [...actions, ...feature.quickActions];
    }, [] as Array<{ id: string; label: string; action: string; icon: string; }>);
  }, [availableFeatures]);

  const hasFeature = (featureId: string) => {
    return availableFeatures.some(feature => feature.id === featureId);
  };

  const getFeature = (featureId: string) => {
    return availableFeatures.find(feature => feature.id === featureId);
  };

  return {
    availableFeatures,
    getFeaturesByCategory,
    getHighPriorityFeatures,
    getDefaultPrompts,
    getQuickActions,
    hasFeature,
    getFeature
  };
}

// Feature Permission Checker Component
export function SAMFeatureGuard({ 
  featureId, 
  children, 
  fallback = null 
}: {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasFeature } = useSAMRoleConfig();

  if (!hasFeature(featureId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Quick Actions Component
export function SAMQuickActions({ 
  onActionClick 
}: {
  onActionClick: (action: string) => void;
}) {
  const { getQuickActions } = useSAMRoleConfig();
  const quickActions = getQuickActions.slice(0, 6); // Limit to 6 actions

  return (
    <div className="grid grid-cols-2 gap-2">
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onActionClick(action.action)}
          className="flex items-center space-x-2 p-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-xs">{action.icon}</span>
          <span className="truncate">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// Feature Categories Component
export function SAMFeatureCategories() {
  const { getFeaturesByCategory } = useSAMRoleConfig();

  return (
    <div className="space-y-4">
      {Object.entries(getFeaturesByCategory).map(([category, features]) => (
        <div key={category} className="space-y-2">
          <h3 className="font-semibold text-sm capitalize">{category}</h3>
          <div className="space-y-1">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2 text-sm">
                <span>{feature.icon}</span>
                <span>{feature.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}