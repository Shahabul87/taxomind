"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageCircle, 
  Send, 
  Brain, 
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Sparkles,
  Activity,
  Command,
  Zap,
  Settings,
  FileText,
  Database,
  Eye,
  Edit,
  Plus,
  Trash2,
  Save,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Trophy,
  Target,
  Users,
  BookOpen,
  Lightbulb,
  Heart,
  Star,
  Flame,
  TrendingUp,
  PlayCircle,
  HelpCircle,
  Puzzle,
  Gamepad2,
  Palette,
  Volume2,
  VolumeX,
  Timer,
  Award,
  BarChart3,
  Compass,
  Rocket,
  Smile,
  GraduationCap,
  PenTool,
  Code,
  Video,
  FileQuestion,
  Microscope,
  TestTube,
  Beaker,
  Calculator,
  BookCheck,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileCheck,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSAMGlobal } from '@/components/sam/sam-global-provider';
import { useSamAITutor } from './sam-ai-tutor-provider';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { ContentAnalyzerModal } from './content-analyzer-modal';
import { GamificationDashboard } from './gamification-dashboard';
import { AssessmentManagement } from './assessment-management';
import { LoadingSpinner, ChatMessageSkeleton } from './ui/loading-states';
import { FadeIn, SlideIn, AnimatedCounter } from './ui/animations';
import { HoverLift } from './ui/animations';
import { ErrorBoundary } from './ui/error-handling';
import { AccessibleButton } from './ui/accessibility';

interface ChatMessage {
  id: string;
  type: 'user' | 'sam' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  emotion?: 'encouraging' | 'supportive' | 'excited' | 'thoughtful' | 'celebratory';
  action?: {
    type: 'form_populate' | 'form_submit' | 'navigation' | 'page_action' | 'workflow_action' | 'learning_action' | 'gamification_action';
    details: any;
  };
  metadata?: {
    formsParsed?: number;
    serverDataAvailable?: boolean;
    workflowStep?: number;
    learningLevel?: 'beginner' | 'intermediate' | 'advanced';
    conceptDifficulty?: number;
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'teaching' | 'content' | 'assessment' | 'motivation' | 'analysis';
  action: () => void;
  available: boolean;
  tooltip?: string;
}

export function SamAITutorAssistant() {
  const { 
    learningContext,
    tutorMode,
    features,
    updateContext
  } = useSAMGlobal();

  const {
    gamificationState,
    awardPoints,
    trackInteraction,
    detectLearnerEmotion,
    unlockBadge
  } = useSamAITutor();

  // Real page data detection
  const [pageData, setPageData] = useState({ 
    forms: [], 
    serverData: { entityData: null },
    title: 'SAM AI Tutor',
    workflow: { currentStep: 'N/A' }
  });
  const [isReady, setIsReady] = useState(false);
  
  // Initialize router and pathname early
  const router = useRouter();
  const pathname = usePathname();
  
  // Use real gamification state from provider
  const gamificationStateFromProvider = gamificationState;
  const tutorPersonalityData = useMemo(() => ({ 
    name: 'SAM', 
    style: 'supportive',
    tone: 'encouraging'
  }), []);
  
  // Real form detection and interaction functions
  const detectForms = useCallback(() => {
    const forms = Array.from(document.querySelectorAll('form')).map((form, index) => {
      const formId = form.id || `form-${index}`;
      const purpose = form.getAttribute('data-purpose') || 'unknown';
      const entityType = form.getAttribute('data-entity-type') || '';
      const entityId = form.getAttribute('data-entity-id') || '';
      
      const fields = Array.from(form.querySelectorAll('input, textarea, select')).map(field => ({
        name: field.getAttribute('name') || '',
        type: field.type || 'text',
        value: (field as HTMLInputElement).value || '',
        placeholder: field.getAttribute('placeholder') || '',
        required: field.hasAttribute('required'),
        validation: field.getAttribute('data-validation') || ''
      }));
      
      return {
        id: formId,
        purpose,
        entityType,
        entityId,
        fields,
        element: form
      };
    });
    
    return forms;
  }, []);
  
  const populateForm = useCallback(async (formId: string, data: any) => {
    try {
      const form = document.getElementById(formId) as HTMLFormElement;
      if (!form) {
        console.warn(`Form with ID ${formId} not found`);
        return false;
      }
      
      Object.entries(data).forEach(([fieldName, value]) => {
        const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (field) {
          if (field.type === 'checkbox') {
            (field as HTMLInputElement).checked = Boolean(value);
          } else {
            field.value = String(value);
          }
          
          // Trigger change event for React components
          const event = new Event('input', { bubbles: true });
          field.dispatchEvent(event);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error populating form:', error);
      return false;
    }
  }, []);
  
  const submitForm = useCallback(async (formId: string) => {
    try {
      const form = document.getElementById(formId) as HTMLFormElement;
      if (!form) {
        console.warn(`Form with ID ${formId} not found`);
        return false;
      }
      
      // Find submit button and click it
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]') as HTMLButtonElement;
      if (submitButton && !submitButton.disabled) {
        submitButton.click();
        return true;
      }
      
      // If no submit button, try form.submit()
      form.submit();
      return true;
    } catch (error) {
      console.error('Error submitting form:', error);
      return false;
    }
  }, []);
  
  const validateForm = useCallback(async (formId: string) => {
    try {
      const form = document.getElementById(formId) as HTMLFormElement;
      if (!form) return false;
      
      // Check HTML5 validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }
      
      // Check custom validation rules
      const fields = form.querySelectorAll('[data-validation]');
      for (const field of fields) {
        const validation = field.getAttribute('data-validation') || '';
        const value = (field as HTMLInputElement).value;
        
        if (validation.includes('required') && !value.trim()) {
          return false;
        }
        
        const minMatch = validation.match(/min:(\d+)/);
        if (minMatch && value.length < parseInt(minMatch[1])) {
          return false;
        }
        
        const maxMatch = validation.match(/max:(\d+)/);
        if (maxMatch && value.length > parseInt(maxMatch[1])) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating form:', error);
      return false;
    }
  }, []);
  
  const refreshPageData = useCallback(async () => {
    try {
      const forms = detectForms();
      const title = document.title || 'Current Page';
      const breadcrumbs = Array.from(document.querySelectorAll('[data-breadcrumb]')).map(el => el.textContent || '');
      
      setPageData(prev => ({
        ...prev,
        forms,
        title,
        breadcrumbs
      }));
      
      setIsReady(true);
    } catch (error) {
      console.error('Error refreshing page data:', error);
    }
  }, [detectForms]);
  
  const interactWithComponent = useCallback(async (componentId: string, action: string) => {
    try {
      const component = document.getElementById(componentId);
      if (!component) return false;
      
      switch (action) {
        case 'click':
          component.click();
          break;
        case 'focus':
          (component as HTMLElement).focus();
          break;
        case 'scroll':
          component.scrollIntoView({ behavior: 'smooth' });
          break;
        default:
          console.warn(`Unknown action: ${action}`);
          return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error interacting with component:', error);
      return false;
    }
  }, []);
  
  const navigateWorkflow = useCallback(async (step: string) => {
    try {
      // Look for workflow navigation elements
      const nextButton = document.querySelector(`[data-workflow-step="${step}"]`) as HTMLElement;
      if (nextButton) {
        nextButton.click();
        return true;
      }
      
      // Fallback to router navigation if URL pattern is detected
      if (step.startsWith('/')) {
        router.push(step);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error navigating workflow:', error);
      return false;
    }
  }, [router]);
  
  // Replace mock generateAdaptiveContent with real API call
  const generateAdaptiveContent = useCallback(async (topic: string, type: string) => {
    try {
      const response = await fetch('/api/sam/ai-tutor/adaptive-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          format: type,
          learningStyle: learningContext,
          context: learningContext,
          personality: tutorPersonalityData
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.content || `Generated ${type} content for ${topic}`;
      }
    } catch (error) {
      console.error('Error generating content:', error);
    }
    
    return `AI-generated ${type} content for ${topic}`;
  }, [learningContext, tutorPersonalityData]);
  
  
  const respondToEmotion = useCallback(async (emotion: string) => {
    console.log('respondToEmotion called:', emotion);
    return 'supportive response';
  }, []);
  
  const generateStudentInsights = useCallback(async () => {
    console.log('generateStudentInsights called');
    return 'Student insights';
  }, []);
  
  const suggestInterventions = useCallback(async (context: any) => {
    console.log('suggestInterventions called:', context);
    return 'Suggested interventions';
  }, []);
  
  const createRubric = useCallback(async (criteria: any) => {
    console.log('createRubric called:', criteria);
    return 'Generated rubric';
  }, []);
  
  const useSocraticMethod = useCallback(async (question: string) => {
    console.log('useSocraticMethod called:', question);
    return 'Socratic response';
  }, []);
  
  const generateGuidingQuestion = useCallback(async (topic: string) => {
    console.log('generateGuidingQuestion called:', topic);
    return 'What do you think about this concept?';
  }, []);
  
  const provideScaffoldedHelp = useCallback(async (difficulty: string) => {
    console.log('provideScaffoldedHelp called:', difficulty);
    return 'Scaffolded help content';
  }, []);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'insights' | 'gamification' | 'settings'>('chat');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  // tutorMode is now provided by the Global SAM provider
  const [showContentAnalyzer, setShowContentAnalyzer] = useState(false);
  const [showGamificationDashboard, setShowGamificationDashboard] = useState(false);
  const [showAssessmentManagement, setShowAssessmentManagement] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate AI Tutor welcome message
  const generateWelcomeMessage = useCallback((): ChatMessage => {
    const formCount = pageData.forms?.length || 0;
    const hasServerData = Boolean(pageData.serverData?.entityData);
    const userRole = learningContext.userRole || tutorMode || 'student';
    const currentLevel = gamificationStateFromProvider.level;
    const currentPoints = gamificationStateFromProvider.points;
    
    let welcomeContent = '';
    
    if (userRole === 'student') {
      welcomeContent = `🎓 **Hi there! I&apos;m SAM, your AI Learning Tutor!**

I&apos;m here to help you learn more effectively. I can:
• Ask guiding questions to deepen your understanding
• Provide personalized explanations based on your learning style
• Help you practice with adaptive problems
• Track your progress and celebrate achievements
• Offer motivation when you need it most

**Your Stats:** Level ${currentLevel} • ${currentPoints} points • ${gamificationStateFromProvider.streaks?.current || 0} day streak 🔥

*Current page:* ${pageData.title || 'Learning Dashboard'}
*Detected:* ${formCount} interactive elements`;
    } else if (userRole === 'teacher') {
      welcomeContent = `🧠 **SAM AI Tutor Assistant for Educators**

I&apos;m your intelligent teaching companion! I can help you:
• Create engaging course content and assessments
• Generate student insights and intervention strategies
• Design adaptive learning experiences
• Populate forms and manage content efficiently
• Analyze student performance data

**Current Context:**
• Page: ${pageData.title || 'Teacher Dashboard'}
• Forms detected: ${formCount}
• Server data: ${hasServerData ? 'Available' : 'Not available'}
• Workflow step: ${pageData.workflow?.currentStep || 'N/A'}

*What would you like to work on today?*`;
    } else {
      welcomeContent = `🎯 **SAM AI Tutor - Administrative Assistant**

I&apos;m here to help you manage the learning platform efficiently:
• Analyze platform-wide learning analytics
• Generate reports and insights
• Assist with course and user management
• Support administrative tasks

*How can I assist you today?*`;
    }
    
    return {
      id: '1',
      type: 'sam',
      content: welcomeContent,
      timestamp: new Date(),
      emotion: 'encouraging',
      metadata: {
        formsParsed: formCount,
        serverDataAvailable: hasServerData,
        learningLevel: userRole === 'student' ? 'beginner' : 'advanced'
      }
    };
  }, [pageData, learningContext, gamificationStateFromProvider, tutorMode]);

  // Initialize page data on mount and pathname change
  useEffect(() => {
    const initializePageData = () => {
      refreshPageData();
    };
    
    // Initialize immediately
    initializePageData();
    
    // Set up periodic refresh
    const interval = setInterval(refreshPageData, 5000);
    
    return () => clearInterval(interval);
  }, [pathname, refreshPageData]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with context-aware welcome message
  useEffect(() => {
    if (isReady && messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage();
      setMessages([welcomeMessage]);
    }
  }, [isReady, messages.length, generateWelcomeMessage]);

  // tutorMode is now automatically detected by the Global SAM provider

  // Generate quick actions based on context
  const generateQuickActions = useCallback((): QuickAction[] => {
    const actions: QuickAction[] = [];
    
    if (tutorMode === 'teacher') {
      actions.push(
        {
          id: 'course_creator',
          label: 'Course Creator',
          icon: <BookOpen className="w-4 h-4" />,
          description: 'AI-powered course creation with quality scoring',
          category: 'content',
          action: () => {
            handleCourseCreation();
          },
          available: true,
          tooltip: 'Create complete courses with SAM&apos;s intelligence'
        },
        {
          id: 'course_title_suggestions',
          label: 'Title Ideas',
          icon: <Lightbulb className="w-4 h-4" />,
          description: 'Generate engaging course titles',
          category: 'content',
          action: () => {
            handleCourseTitleGeneration();
          },
          available: true,
          tooltip: 'AI-generated course titles with market analysis'
        },
        {
          id: 'course_structure',
          label: 'Course Structure',
          icon: <Navigation className="w-4 h-4" />,
          description: 'Design comprehensive course architecture',
          category: 'content',
          action: () => {
            handleCourseStructureGeneration();
          },
          available: true,
          tooltip: 'Generate detailed course structure and chapters'
        },
        {
          id: 'generate_content',
          label: 'Generate Content',
          icon: <Wand2 className="w-4 h-4" />,
          description: 'Create course content, quizzes, or explanations',
          category: 'content',
          action: () => {
            handleGenerateContent();
          },
          available: true,
          tooltip: 'AI-powered content generation'
        },
        {
          id: 'student_insights',
          label: 'Student Insights',
          icon: <BarChart3 className="w-4 h-4" />,
          description: 'Get insights about student performance',
          category: 'analysis',
          action: () => {
            handleStudentInsights();
          },
          available: true,
          tooltip: 'Analyze student learning patterns'
        },
        {
          id: 'create_rubric',
          label: 'Create Rubric',
          icon: <FileCheck className="w-4 h-4" />,
          description: 'Generate assessment rubrics',
          category: 'assessment',
          action: () => {
            handleCreateRubric();
          },
          available: true,
          tooltip: 'AI-generated assessment rubrics'
        },
        {
          id: 'assessment_management',
          label: 'Assessment Hub',
          icon: <ClipboardList className="w-4 h-4" />,
          description: 'Manage assessments and view analytics',
          category: 'assessment',
          action: () => setShowAssessmentManagement(true),
          available: true,
          tooltip: 'Comprehensive assessment management and analytics'
        },
        {
          id: 'populate_form',
          label: 'Fill Forms',
          icon: <Edit className="w-4 h-4" />,
          description: 'Smart form population',
          category: 'content',
          action: () => {
            handlePopulateForm();
          },
          available: pageData.forms.length > 0,
          tooltip: 'Auto-populate forms with AI-generated content'
        },
        {
          id: 'content_analysis',
          label: 'Analyze Content',
          icon: <Microscope className="w-4 h-4" />,
          description: 'Multi-modal content analysis',
          category: 'analysis',
          action: () => {
            handleContentAnalysis();
          },
          available: true,
          tooltip: 'Analyze videos, text, code, and other content'
        },
        {
          id: 'visual_processing',
          label: 'Create Visuals',
          icon: <Palette className="w-4 h-4" />,
          description: 'Generate diagrams and visuals',
          category: 'content',
          action: () => {
            handleVisualProcessing();
          },
          available: true,
          tooltip: 'Generate mind maps, diagrams, and visual aids'
        }
      );
    } else if (tutorMode === 'student') {
      actions.push(
        {
          id: 'explain_concept',
          label: 'Explain Concept',
          icon: <Lightbulb className="w-4 h-4" />,
          description: 'Get detailed explanations',
          category: 'teaching',
          action: () => {
            // Inline action to avoid circular dependency
            console.log('Explain concept action');
          },
          available: true,
          tooltip: 'Personalized concept explanations'
        },
        {
          id: 'practice_problems',
          label: 'Practice Problems',
          icon: <Puzzle className="w-4 h-4" />,
          description: 'Generate practice exercises',
          category: 'teaching',
          action: () => {
            // Inline action to avoid circular dependency
            console.log('Practice problems action');
          },
          available: true,
          tooltip: 'Adaptive practice problems'
        },
        {
          id: 'study_plan',
          label: 'Study Plan',
          icon: <Calendar className="w-4 h-4" />,
          description: 'Create personalized study schedule',
          category: 'teaching',
          action: () => {
            // Inline action to avoid circular dependency
            console.log('Study plan action');
          },
          available: true,
          tooltip: 'AI-generated study plans'
        },
        {
          id: 'motivation_boost',
          label: 'Motivation Boost',
          icon: <Flame className="w-4 h-4" />,
          description: 'Get motivated to keep learning',
          category: 'motivation',
          action: () => {
            // Inline action to avoid circular dependency
            console.log('Motivation boost action');
          },
          available: true,
          tooltip: 'Personalized motivation and encouragement'
        },
        {
          id: 'content_companion',
          label: 'Content Helper',
          icon: <HelpCircle className="w-4 h-4" />,
          description: 'Interactive content assistance',
          category: 'teaching',
          action: () => {
            // Inline action to avoid circular dependency
            console.log('Content companion action');
          },
          available: true,
          tooltip: 'Get help with videos, code, and text content'
        },
        {
          id: 'visual_processing',
          label: 'Visual Learning',
          icon: <Eye className="w-4 h-4" />,
          description: 'Create learning visuals',
          category: 'teaching',
          action: () => {
            // Inline action to avoid circular dependency
            console.log('Visual processing action');
          },
          available: true,
          tooltip: 'Generate diagrams and visual aids for learning'
        },
        {
          id: 'gamification_dashboard',
          label: 'View Progress',
          icon: <Gamepad2 className="w-4 h-4" />,
          description: 'View achievements and challenges',
          category: 'motivation',
          action: () => setShowGamificationDashboard(true),
          available: true,
          tooltip: 'View your achievements, challenges, and leaderboard'
        }
      );
    }
    
    return actions;
  }, [tutorMode, pageData.forms.length]);

  // Add message helper
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Quick action handlers
  const handleGenerateContent = useCallback(async () => {
    const content = await generateAdaptiveContent('course content', 'explanation');
    addMessage({
      type: 'sam',
      content: `I&apos;ve generated some content for you:\n\n${content}`,
      emotion: 'thoughtful',
      suggestions: ['Create more content', 'Edit this content', 'Use for different topic']
    });
  }, [generateAdaptiveContent, addMessage]);

  const handleStudentInsights = useCallback(async () => {
    // Mock student insights for demo
    const insights = {
      averageScore: 85,
      strugglingTopics: ['Advanced Functions', 'Data Structures'],
      strongTopics: ['Basic Syntax', 'Variables'],
      recommendedActions: ['Provide additional practice', 'Schedule one-on-one session']
    };
    
    addMessage({
      type: 'sam',
      content: `**Student Performance Insights:**

📊 **Average Score:** ${insights.averageScore}%
🔴 **Struggling Topics:** ${insights.strugglingTopics.join(', ')}
🟢 **Strong Topics:** ${insights.strongTopics.join(', ')}

**Recommended Actions:**
${insights.recommendedActions.map(action => `• ${action}`).join('\n')}`,
      emotion: 'thoughtful',
      suggestions: ['Generate intervention plan', 'Create targeted practice', 'Schedule meeting']
    });
  }, [addMessage]);

  const handleCreateRubric = useCallback(async () => {
    const rubric = await createRubric({ type: 'essay', topic: 'current topic' });
    addMessage({
      type: 'sam',
      content: `I&apos;ve created a rubric for your assignment. It includes criteria for content quality, organization, and presentation with clear performance levels.`,
      emotion: 'supportive',
      suggestions: ['Customize rubric', 'Export rubric', 'Create another rubric']
    });
  }, [createRubric, addMessage]);

  const handlePopulateForm = useCallback(async () => {
    if (pageData.forms.length === 0) {
      addMessage({
        type: 'sam',
        content: 'I don&apos;t see any forms on this page that I can help populate.',
        emotion: 'supportive',
        suggestions: ['Refresh page', 'Navigate to form page', 'Create new content']
      });
      return;
    }
    
    const form = pageData.forms[0];
    const success = await populateForm(form.id, {
      title: 'AI Generated Course Title',
      description: 'This is an AI-generated course description that covers the key concepts.'
    });
    
    if (success) {
      addMessage({
        type: 'sam',
        content: `✅ I&apos;ve populated the form with AI-generated content. Review and modify as needed!`,
        emotion: 'celebratory',
        suggestions: ['Edit content', 'Submit form', 'Generate different content']
      });
    }
  }, [pageData.forms, populateForm, addMessage]);

  const handleExplainConcept = useCallback(async () => {
    const explanation = await generateAdaptiveContent('current concept', 'explanation');
    addMessage({
      type: 'sam',
      content: `Let me explain this concept:\n\n${explanation}`,
      emotion: 'thoughtful',
      suggestions: ['Ask follow-up question', 'Get examples', 'Practice problems']
    });
  }, [generateAdaptiveContent, addMessage]);

  const handlePracticeProblems = useCallback(async () => {
    // Generate mock practice problems
    const problems = [
      { question: 'What is the main concept being taught in this lesson?' },
      { question: 'How would you apply this concept to solve a real-world problem?' },
      { question: 'What are the key steps in the process we just learned?' }
    ];
    
    addMessage({
      type: 'sam',
      content: `Here are some practice problems for you:\n\n${problems.map((p, i) => `${i + 1}. ${p.question}`).join('\n\n')}`,
      emotion: 'encouraging',
      suggestions: ['Get hints', 'Check answers', 'More problems']
    });
  }, [addMessage]);

  const handleStudyPlan = useCallback(async () => {
    addMessage({
      type: 'sam',
      content: `**Your Personalized Study Plan:**

📅 **Week 1:** Foundation concepts (2 hours/day)
📅 **Week 2:** Intermediate topics (2.5 hours/day)
📅 **Week 3:** Advanced applications (3 hours/day)
📅 **Week 4:** Review and practice (1.5 hours/day)

🎯 **Daily Goals:**
• 30 minutes reading
• 45 minutes practice
• 15 minutes review

*This plan is tailored to your learning style and current progress!*`,
      emotion: 'supportive',
      suggestions: ['Adjust schedule', 'Set reminders', 'Track progress']
    });
  }, [addMessage]);

  const handleMotivationBoost = useCallback(async () => {
    const motivationalMessages = [
      "You&apos;re doing great! Every question you ask shows you&apos;re actively learning. 🌟",
      "Learning is a journey, not a destination. You&apos;re making excellent progress! 🚀",
      "I&apos;ve seen your dedication, and it&apos;s inspiring! Keep up the fantastic work! 💪",
      "Remember, every expert was once a beginner. You&apos;re building something amazing! 🏆"
    ];
    
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    addMessage({
      type: 'sam',
      content: randomMessage,
      emotion: 'encouraging',
      suggestions: ['Set new goal', 'Review progress', 'Celebrate achievements']
    });
    
    // Award motivation points
    awardPoints(10, 'Motivation boost');
  }, [awardPoints, addMessage]);

  // Handle content analysis modal
  const handleContentAnalysis = useCallback(async () => {
    setShowContentAnalyzer(true);
  }, []);

  // Handle analysis completion from modal
  const handleAnalysisComplete = useCallback((analysisData: any) => {
    const { analysis, suggestions } = analysisData;
    
    addMessage({
      type: 'sam',
      content: `**Content Analysis Complete:**

📊 **Key Topics:** ${analysis.keyTopics?.join(', ') || 'Various topics covered'}
📈 **Difficulty Level:** ${analysis.difficultyLevel || 'Medium'}
🎯 **Learning Objectives:** ${analysis.learningObjectives?.join(', ') || 'Multiple objectives identified'}

**Study Questions:**
${analysis.studyQuestions?.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n') || 'Questions generated based on content'}

**Interactive Elements Suggested:**
${analysis.interactiveElements?.map((e: string) => `• ${e}`).join('\n') || 'Interactive activities recommended'}`,
      emotion: 'thoughtful',
      suggestions: suggestions || ['Analyze different content', 'Get more details', 'Create practice questions']
    });
    
    setShowContentAnalyzer(false);
  }, [addMessage]);

  // Handle content companion interaction
  const handleContentCompanion = useCallback(async () => {
    const interactionData = {
      interactionType: 'video_timestamp_help',
      contentContext: {
        videoTitle: 'Current Video',
        currentTimestamp: '5:30'
      },
      userInput: {
        videoTitle: 'Educational Video',
        timestamp: '5:30',
        transcriptSegment: 'In this section we discuss...',
        userQuestion: 'Can you explain this concept in more detail?'
      },
      learningState: learningContext
    };
    
    try {
      const response = await fetch('/api/sam/ai-tutor/content-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData)
      });
      
      if (response.ok) {
        const data = await response.json();
        addMessage({
          type: 'sam',
          content: `**Content Companion Help:**

${data.response.explanation || 'Here&apos;s a detailed explanation of the concept...'}

**Related Concepts:**
${data.response.conceptConnections?.map((c: string) => `• ${c}`).join('\n') || 'Connected topics identified'}

**Practice Suggestions:**
${data.response.practiceExercises?.map((e: string) => `• ${e}`).join('\n') || 'Practice opportunities available'}`,
          emotion: 'thoughtful',
          suggestions: data.followUpSuggestions || ['Ask about timestamp', 'Get more examples', 'Practice concept']
        });
      }
    } catch (error) {
      console.error('Content companion failed:', error);
      addMessage({
        type: 'sam',
        content: 'I&apos;m having trouble with the content companion feature. Please try again.',
        emotion: 'supportive',
        suggestions: ['Try different question', 'Check connection', 'Manual help']
      });
    }
  }, [learningContext, addMessage]);

  // Handle visual content processing
  const handleVisualProcessing = useCallback(async () => {
    const processingData = {
      processingType: 'diagram_generation',
      contentData: {
        topic: 'Current Learning Topic',
        complexity: 'medium',
        learningObjectives: ['Understand key concepts', 'Visualize relationships']
      },
      generationRequest: {
        diagramType: 'mind_map',
        style: 'educational',
        includeExamples: true
      },
      learningContext
    };
    
    try {
      const response = await fetch('/api/sam/ai-tutor/visual-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processingData)
      });
      
      if (response.ok) {
        const data = await response.json();
        addMessage({
          type: 'sam',
          content: `**Visual Content Generated:**

📊 **Diagram Type:** ${data.result.diagramType || 'Educational diagram'}
🎨 **Style:** ${data.result.style || 'Visual learning aid'}

**Description:**
${data.result.description || 'A comprehensive visual representation has been created to help you understand the concept better.'}

**Key Elements:**
${data.result.elements?.map((e: string) => `• ${e}`).join('\n') || 'Visual elements included for better understanding'}

**Learning Benefits:**
${data.result.learningBenefits?.map((b: string) => `• ${b}`).join('\n') || 'Enhanced visual learning experience'}`,
          emotion: 'excited',
          suggestions: data.suggestions || ['Generate different diagram', 'Explain visual elements', 'Create more visuals']
        });
      }
    } catch (error) {
      console.error('Visual processing failed:', error);
      addMessage({
        type: 'sam',
        content: 'I encountered an issue generating visual content. Please try again.',
        emotion: 'supportive',
        suggestions: ['Try different visual', 'Check connection', 'Manual creation']
      });
    }
  }, [learningContext, addMessage]);

  // NEW COURSE CREATION HANDLERS

  // Handle comprehensive course creation
  const handleCourseCreation = useCallback(async () => {
    addMessage({
      type: 'sam',
      content: `🎓 **Welcome to SAM&apos;s Intelligent Course Creator!**

I&apos;ll guide you through creating an amazing course using my evaluation engines, research capabilities, and Bloom&apos;s taxonomy expertise.

**What I can help you with:**
📝 **Course Foundation**: Title, overview, target audience analysis
🏗️ **Course Architecture**: Structured chapters and learning paths  
🎯 **Learning Objectives**: SMART goals aligned with Bloom&apos;s taxonomy
📊 **Quality Scoring**: Real-time course quality assessment
🔍 **Market Analysis**: Competitor research and positioning
🎨 **Content Generation**: Lessons, assessments, and activities

**Let&apos;s start with the basics:**
What type of course do you want to create? You can describe:
• The subject or skill you want to teach
• Your target audience  
• The main goal or outcome
• Any specific requirements

I&apos;ll use all my intelligence engines to help you build something extraordinary! 🚀`,
      emotion: 'excited',
      suggestions: [
        'I want to create a web development course',
        'Help me design a business course',
        'Create a creative writing workshop',
        'Generate course title ideas'
      ]
    });

    // Award points for using course creator
    awardPoints(15, 'Started AI Course Creation');
  }, [addMessage, awardPoints]);

  // Handle course title generation with quality scoring
  const handleCourseTitleGeneration = useCallback(async () => {
    addMessage({
      type: 'sam',
      content: `💡 **SAM&apos;s Intelligent Title Generator**

I&apos;ll help you create compelling course titles using my market analysis and quality scoring engines.

**What I need to know:**
1. **Course topic/subject** - What will you teach?
2. **Target audience** - Who is this for? (beginners, professionals, etc.)
3. **Course intent** - Skill development, certification prep, career change?
4. **Difficulty level** - Beginner, intermediate, or advanced?

**My title generation includes:**
📈 **Market Analysis**: Trending keywords and positioning
🎯 **Engagement Scoring**: How compelling and clickable the title is
🔍 **SEO Optimization**: Searchable and discoverable titles
⚡ **Quality Metrics**: Length, clarity, and appeal assessment

Just tell me about your course idea, and I&apos;ll generate multiple high-quality title options with detailed analysis!`,
      emotion: 'thoughtful',
      suggestions: [
        'Web development for beginners',
        'Advanced data science techniques',
        'Digital marketing mastery',
        'Creative writing fundamentals'
      ]
    });
  }, [addMessage]);

  // Handle course structure generation with Bloom&apos;s taxonomy
  const handleCourseStructureGeneration = useCallback(async () => {
    addMessage({
      type: 'sam',
      content: `🏗️ **SAM&apos;s Course Architecture Engine**

I&apos;ll design a comprehensive course structure using my pedagogical expertise and Bloom&apos;s taxonomy framework.

**My structure generation includes:**
📚 **Chapter Organization**: Logical progression and flow
🎯 **Learning Objectives**: Mapped to Bloom&apos;s cognitive levels
📝 **Content Planning**: Lessons, activities, and assessments
⏱️ **Duration Estimation**: Realistic time commitments
🔄 **Prerequisites**: Knowledge dependencies and pathways

**Bloom&apos;s Taxonomy Integration:**
• **Remember**: Facts, terms, basic concepts
• **Understand**: Explanations, interpretations  
• **Apply**: Real-world practice and implementation
• **Analyze**: Critical thinking and evaluation
• **Evaluate**: Judgments and decision making
• **Create**: Original work and innovation

**Tell me about your course:**
What subject will you teach and what level of depth do you want? I&apos;ll create a detailed structure that guides learners from basic understanding to mastery!`,
      emotion: 'thoughtful',
      suggestions: [
        'Design a programming bootcamp',
        'Create a marketing certification course',
        'Structure a creative skills workshop',
        'Plan a professional development program'
      ]
    });
  }, [addMessage]);

  // Handle personality adjustment
  const adjustPersonality = useCallback((updates: Partial<any>) => {
    // This would typically update the tutor personality in the provider
    console.log('Adjusting personality:', updates);
  }, []);

  // Handle quick actions
  const handleQuickAction = useCallback(async (actionId: string) => {
    setIsLoading(true);
    
    try {
      switch (actionId) {
        case 'course_creator':
          await handleCourseCreation();
          break;
        case 'course_title_suggestions':
          await handleCourseTitleGeneration();
          break;
        case 'course_structure':
          await handleCourseStructureGeneration();
          break;
        case 'generate_content':
          await handleGenerateContent();
          break;
        case 'student_insights':
          await handleStudentInsights();
          break;
        case 'create_rubric':
          await handleCreateRubric();
          break;
        case 'populate_form':
          await handlePopulateForm();
          break;
        case 'explain_concept':
          await handleExplainConcept();
          break;
        case 'practice_problems':
          await handlePracticeProblems();
          break;
        case 'study_plan':
          await handleStudyPlan();
          break;
        case 'motivation_boost':
          await handleMotivationBoost();
          break;
        case 'content_analysis':
          await handleContentAnalysis();
          break;
        case 'content_companion':
          await handleContentCompanion();
          break;
        case 'visual_processing':
          await handleVisualProcessing();
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
      toast.error('Action failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [handleCourseCreation, handleCourseTitleGeneration, handleCourseStructureGeneration, handleGenerateContent, handleStudentInsights, handleCreateRubric, handlePopulateForm, handleExplainConcept, handlePracticeProblems, handleStudyPlan, handleMotivationBoost, handleContentAnalysis, handleContentCompanion, handleVisualProcessing]);

  // Execute actions
  const executeAction = useCallback(async (action: any) => {
    switch (action.type) {
      case 'form_populate':
        await populateForm(action.details.formId, action.details.data);
        break;
      case 'form_submit':
        await submitForm(action.details.formId);
        break;
      case 'navigation':
        router.push(action.details.url);
        break;
      case 'gamification_action':
        if (action.details.points) {
          awardPoints(action.details.points, action.details.reason);
        }
        if (action.details.badge) {
          unlockBadge(action.details.badge);
        }
        break;
      case 'course_creation_action':
        await handleCourseCreationAction(action.details);
        break;
    }
  }, [populateForm, submitForm, router, awardPoints, unlockBadge]);

  // Handle course creation actions
  const handleCourseCreationAction = useCallback(async (details: any) => {
    try {
      setIsLoading(true);
      
      switch (details.action) {
        case 'generate_titles':
          const titleResponse = await fetch(details.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentTitle: details.topic,
              targetAudience: details.audience,
              difficulty: details.difficulty,
              count: 5
            })
          });
          
          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            addMessage({
              type: 'sam',
              content: `🎯 **Course Title Suggestions:**

${titleData.titles?.map((title: string, index: number) => `${index + 1}. ${title}`).join('\n')}

💡 **SAM's Analysis:** ${titleData.suggestions?.message || 'These titles are optimized for engagement and searchability.'}

**Reasoning:** ${titleData.suggestions?.reasoning || 'Each title balances clarity with appeal to attract your target audience.'}`,
              emotion: 'thoughtful',
              suggestions: ['Generate more titles', 'Analyze market positioning', 'Create course structure']
            });
            
            awardPoints(10, 'Generated course titles');
          }
          break;

        case 'create_structure':
          addMessage({
            type: 'sam',
            content: `🏗️ **Course Structure Generated:**

📚 **Course Topic:** ${details.topic}
📈 **Difficulty Level:** ${details.level}
🔢 **Recommended Chapters:** ${details.chapters}

**Proposed Structure Using Bloom's Taxonomy:**

**Foundation Level (Remember & Understand):**
1. Introduction to ${details.topic}
2. Core Concepts and Terminology
3. Fundamental Principles

**Application Level (Apply & Analyze):**
4. Practical Implementation
5. Real-World Case Studies
6. Problem-Solving Techniques

**Mastery Level (Evaluate & Create):**
7. Advanced Applications
8. Project-Based Learning
9. Assessment and Portfolio

**Learning Path Features:**
✅ Progressive difficulty scaling
✅ Hands-on practice opportunities  
✅ Regular knowledge checkpoints
✅ Real-world application projects

Each chapter includes:
• Video lectures (15-20 min)
• Interactive exercises
• Practical assignments
• Knowledge assessments`,
            emotion: 'excited',
            suggestions: ['Generate learning objectives', 'Create detailed chapters', 'Design assessments']
          });
          
          awardPoints(15, 'Created course structure');
          break;

        case 'learning_objectives':
          addMessage({
            type: 'sam',
            content: `🎯 **SMART Learning Objectives for ${details.topic}:**

**Remember Level:**
• Define key terms and concepts in ${details.topic}
• List fundamental principles and methodologies

**Understand Level:**  
• Explain the core concepts and their relationships
• Describe real-world applications and use cases

**Apply Level:**
• Implement basic ${details.topic} techniques in practical scenarios
• Solve structured problems using established methods

**Analyze Level:**
• Compare different approaches and evaluate their effectiveness
• Break down complex problems into manageable components

**Evaluate Level:**
• Assess the quality and effectiveness of different solutions
• Make informed decisions about best practices

**Create Level:**
• Design original solutions using ${details.topic} principles
• Develop comprehensive projects that demonstrate mastery

**Assessment Strategy:**
Each objective will be measured through:
• Knowledge checks (Remember/Understand)
• Practical exercises (Apply/Analyze)  
• Project work (Evaluate/Create)
• Peer reviews and self-reflection`,
            emotion: 'thoughtful',
            suggestions: ['Create assessment rubrics', 'Design practice exercises', 'Generate course content']
          });
          
          awardPoints(12, 'Generated learning objectives');
          break;

        case 'market_analysis':
          addMessage({
            type: 'sam',
            content: `📊 **Market Analysis for ${details.topic}:**

**Market Opportunity:**
🎯 **Target Market Size:** High demand in ${details.category} education
📈 **Growth Trend:** Increasing interest in practical skills
💰 **Price Range:** $29-199 based on competitor analysis

**Competitive Landscape:**
🔍 **Key Competitors:** Similar courses averaging 4.2/5 ratings
📚 **Content Gaps:** Need for more hands-on projects
⚡ **Differentiation Opportunity:** Industry-specific applications

**Positioning Strategy:**
🌟 **Unique Value Prop:** Combine theory with real-world practice
🎓 **Target Audience:** ${details.audience || 'Professionals and students'}
📱 **Platform Optimization:** Mobile-friendly micro-learning modules

**Recommended Course Features:**
✅ Interactive coding exercises
✅ Industry expert interviews  
✅ Certificate of completion
✅ Community support forum
✅ Project-based portfolio building

**Success Metrics:**
• Course completion rate: Target 75%+
• Student satisfaction: Target 4.5+ stars
• Employment outcomes: Track career advancement`,
            emotion: 'analytical',
            suggestions: ['Refine positioning', 'Create marketing copy', 'Plan launch strategy']
          });
          
          awardPoints(8, 'Generated market analysis');
          break;

        default:
          addMessage({
            type: 'sam',
            content: `I encountered an unknown course creation action: ${details.action}. Please try a different approach.`,
            emotion: 'supportive',
            suggestions: ['Try course creator', 'Generate titles', 'Create structure']
          });
      }
    } catch (error) {
      console.error('Course creation action failed:', error);
      addMessage({
        type: 'sam',
        content: 'I encountered an issue with that course creation action. Please try again.',
        emotion: 'supportive',
        suggestions: ['Try again', 'Use different approach', 'Check connection']
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, awardPoints]);

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Detect emotion from user message
      const emotion = await detectLearnerEmotion(inputValue);
      
      // Track the interaction
      trackInteraction('chat_message', {
        message: inputValue,
        emotion,
        context: learningContext
      });
      
      // Call the unified AI Tutor API
      const response = await fetch('/api/sam/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          context: {
            pageData,
            learningContext,
            gamificationState: gamificationStateFromProvider,
            tutorPersonality: tutorPersonalityData,
            emotion
          },
          conversationHistory: messages.slice(-5) // Last 5 messages for context
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const samMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'sam',
          content: data.response,
          timestamp: new Date(),
          emotion: data.emotion || 'supportive',
          suggestions: data.suggestions || [],
          action: data.action
        };
        
        setMessages(prev => [...prev, samMessage]);
        
        // Execute any actions
        if (data.action) {
          await executeAction(data.action);
        }
        
        // Award points for engagement
        awardPoints(5, 'Active conversation');
        
      } else {
        throw new Error('Failed to get response');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'sam',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true,
        emotion: 'supportive'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, pageData, learningContext, gamificationStateFromProvider, tutorPersonalityData, detectLearnerEmotion, trackInteraction, awardPoints, executeAction]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Render gamification view
  const renderGamificationView = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-indigo-600">Level {gamificationStateFromProvider.level}</div>
        <div className="text-sm text-gray-600">{gamificationStateFromProvider.points} points</div>
        <Progress value={(gamificationStateFromProvider.points % 1000) / 10} className="mt-2" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
          <div className="font-semibold">{gamificationStateFromProvider.streaks?.current || 0}</div>
          <div className="text-xs text-gray-600">Day Streak</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <Award className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <div className="font-semibold">{gamificationStateFromProvider.badges?.length || 0}</div>
          <div className="text-xs text-gray-600">Badges</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Recent Badges</h4>
        {(gamificationStateFromProvider.badges || []).slice(-3).map((badge, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <div>
              <div className="font-medium text-sm">{badge.name}</div>
              <div className="text-xs text-gray-600">{badge.description}</div>
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        onClick={() => setShowGamificationDashboard(true)}
        className="w-full"
        variant="outline"
      >
        <Gamepad2 className="w-4 h-4 mr-2" />
        Open Full Dashboard
      </Button>
    </div>
  );

  // Render insights view
  const renderInsightsView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-blue-50 rounded">
          <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <div className="text-xs font-medium">Sessions</div>
          <div className="text-sm">12</div>
        </div>
        
        <div className="p-2 bg-green-50 rounded">
          <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-xs font-medium">Progress</div>
          <div className="text-sm">85%</div>
        </div>
        
        <div className="p-2 bg-purple-50 rounded">
          <Target className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <div className="text-xs font-medium">Goals</div>
          <div className="text-sm">3/5</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Learning Insights</h4>
        <div className="text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span>Visual Learning</span>
            <span className="text-green-600">Strong</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Problem Solving</span>
            <span className="text-yellow-600">Good</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Concept Retention</span>
            <span className="text-blue-600">Excellent</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render settings view
  const renderSettingsView = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Tutor Personality</label>
        <Select value={tutorPersonalityData.tone} onValueChange={(value) => adjustPersonality({ tone: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="encouraging">Encouraging</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="challenging">Challenging</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Teaching Method</label>
        <Select value="socratic" onValueChange={(value) => adjustPersonality({ teachingMethod: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="socratic">Socratic Method</SelectItem>
            <SelectItem value="direct">Direct Instruction</SelectItem>
            <SelectItem value="scaffolding">Scaffolding</SelectItem>
            <SelectItem value="discovery">Discovery Learning</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm">Sound Effects</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
        >
          {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm">Quick Actions</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQuickActions(!showQuickActions)}
        >
          {showQuickActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        size="icon"
      >
        <div className="relative">
          <Brain className="h-6 w-6 text-white" />
          {(gamificationStateFromProvider.streaks?.current || 0) > 0 && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <Flame className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
      </Button>
    );
  }

  return (
    <>
      <Card className={cn(
        "fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-300",
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
      )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-white text-indigo-600 font-bold">
              SAM
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">SAM AI Tutor</div>
            <div className="text-xs opacity-90">
              {tutorMode === 'student' ? 'Learning Assistant' : 'Teaching Assistant'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            Level {gamificationStateFromProvider.level}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* View Tabs */}
          <div className="flex border-b">
            {[
              { id: 'chat', label: 'Chat', icon: MessageCircle },
              { id: 'insights', label: 'Insights', icon: BarChart3 },
              { id: 'gamification', label: 'Progress', icon: Trophy },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={currentView === id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView(id as any)}
                className="flex-1 rounded-none"
              >
                <Icon className="w-4 h-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {currentView === 'chat' && (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.type === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg p-3",
                            message.type === 'user'
                              ? "bg-indigo-500 text-white"
                              : message.isError
                              ? "bg-red-50 text-red-900"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-6 px-2"
                                  onClick={() => setInputValue(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                            <span className="text-sm">SAM is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Quick Actions */}
                {showQuickActions && (
                  <div className="px-4 py-2 border-t">
                    <div className="grid grid-cols-2 gap-1">
                      {generateQuickActions().slice(0, 4).map((action) => (
                        <Button
                          key={action.id}
                          variant="ghost"
                          size="sm"
                          onClick={action.action}
                          disabled={!action.available}
                          className="text-xs h-8"
                          title={action.tooltip}
                        >
                          {action.icon}
                          <span className="ml-1">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask SAM anything..."
                      className="flex-1 resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {currentView === 'insights' && (
              <div className="p-4">
                {renderInsightsView()}
              </div>
            )}

            {currentView === 'gamification' && (
              <div className="p-4">
                {renderGamificationView()}
              </div>
            )}

            {currentView === 'settings' && (
              <div className="p-4">
                {renderSettingsView()}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
    
    {/* Content Analyzer Modal */}
    <ContentAnalyzerModal
      isOpen={showContentAnalyzer}
      onClose={() => setShowContentAnalyzer(false)}
      onAnalysisComplete={handleAnalysisComplete}
      learningContext={learningContext}
      tutorMode={tutorMode}
    />
    
    {/* Gamification Dashboard */}
    <GamificationDashboard
      isOpen={showGamificationDashboard}
      onClose={() => setShowGamificationDashboard(false)}
      learningContext={learningContext}
      tutorMode={tutorMode}
    />
    
    {/* Assessment Management */}
    <AssessmentManagement
      isOpen={showAssessmentManagement}
      onClose={() => setShowAssessmentManagement(false)}
      courseId={learningContext.courseId}
      teacherId={learningContext.userId}
    />
    </>
  );
}