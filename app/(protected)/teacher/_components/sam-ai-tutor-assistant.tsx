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

  // Mock the missing functionality for now - wrapped in useMemo to prevent re-renders
  const pageData = useMemo(() => ({ 
    forms: [], 
    serverData: { entityData: null },
    title: 'SAM AI Tutor',
    workflow: { currentStep: 'N/A' }
  }), []);
  const isReady = true;
  const gamificationState = useMemo(() => ({ 
    level: 1, 
    points: 0, 
    streak: 0,
    streaks: {
      current: 0,
      longest: 0
    },
    badges: []
  }), []);
  const tutorPersonality = useMemo(() => ({ name: 'SAM', style: 'supportive' }), []);
  
  // Mock functions that are no longer available
  const populateForm = useCallback(async (formId: string, data: any) => {
    console.log('populateForm called:', formId, data);
    return true;
  }, []);
  
  const submitForm = useCallback(async (formId: string) => {
    console.log('submitForm called:', formId);
    return true;
  }, []);
  
  const validateForm = useCallback(async (formId: string) => {
    console.log('validateForm called:', formId);
    return true;
  }, []);
  
  const refreshPageData = useCallback(async () => {
    console.log('refreshPageData called');
  }, []);
  
  const interactWithComponent = useCallback(async (componentId: string, action: string) => {
    console.log('interactWithComponent called:', componentId, action);
    return true;
  }, []);
  
  const navigateWorkflow = useCallback(async (step: string) => {
    console.log('navigateWorkflow called:', step);
    return true;
  }, []);
  
  const generateAdaptiveContent = useCallback(async (topic: string, type: string) => {
    console.log('generateAdaptiveContent called:', topic, type);
    return `Generated content for ${topic}`;
  }, []);
  
  const awardPoints = useCallback(async (points: number, reason: string) => {
    console.log('awardPoints called:', points, reason);
    return true;
  }, []);
  
  const unlockBadge = useCallback(async (badgeId: string) => {
    console.log('unlockBadge called:', badgeId);
    return true;
  }, []);
  
  const updateStreak = useCallback(async (days: number) => {
    console.log('updateStreak called:', days);
    return true;
  }, []);
  
  const trackInteraction = useCallback(async (interaction: string) => {
    console.log('trackInteraction called:', interaction);
    return true;
  }, []);
  
  const detectLearnerEmotion = useCallback(async (text: string) => {
    console.log('detectLearnerEmotion called:', text);
    return 'neutral';
  }, []);
  
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
  const router = useRouter();
  const pathname = usePathname();

  // Generate AI Tutor welcome message
  const generateWelcomeMessage = useCallback((): ChatMessage => {
    const formCount = pageData.forms.length;
    const hasServerData = Boolean(pageData.serverData?.entityData);
    const userRole = learningContext.userRole || 'student';
    const currentLevel = gamificationState.level;
    const currentPoints = gamificationState.points;
    
    let welcomeContent = '';
    
    if (userRole === 'student') {
      welcomeContent = `🎓 **Hi there! I&apos;m SAM, your AI Learning Tutor!**

I&apos;m here to help you learn more effectively. I can:
• Ask guiding questions to deepen your understanding
• Provide personalized explanations based on your learning style
• Help you practice with adaptive problems
• Track your progress and celebrate achievements
• Offer motivation when you need it most

**Your Stats:** Level ${currentLevel} • ${currentPoints} points • ${gamificationState.streaks || 0} day streak 🔥

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
  }, [pageData, learningContext, gamificationState]);

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
          id: 'generate_content',
          label: 'Generate Content',
          icon: <Wand2 className="w-4 h-4" />,
          description: 'Create course content, quizzes, or explanations',
          category: 'content',
          action: () => {
            // Inline action to avoid circular dependency
            console.log('Generate content action');
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
            // Inline action to avoid circular dependency
            console.log('Student insights action');
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
            // Inline action to avoid circular dependency
            console.log('Create rubric action');
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
            // Inline action to avoid circular dependency
            console.log('Populate form action');
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
            // Inline action to avoid circular dependency
            console.log('Content analysis action');
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
            // Inline action to avoid circular dependency
            console.log('Visual processing action');
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
  }, [handleGenerateContent, handleStudentInsights, handleCreateRubric, handlePopulateForm, handleExplainConcept, handlePracticeProblems, handleStudyPlan, handleMotivationBoost, handleContentAnalysis, handleContentCompanion, handleVisualProcessing]);

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
    }
  }, [populateForm, submitForm, router, awardPoints, unlockBadge]);

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
            gamificationState,
            tutorPersonality,
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
  }, [inputValue, isLoading, messages, pageData, learningContext, gamificationState, tutorPersonality, detectLearnerEmotion, trackInteraction, awardPoints, executeAction]);

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
        <div className="text-3xl font-bold text-indigo-600">Level {gamificationState.level}</div>
        <div className="text-sm text-gray-600">{gamificationState.points} points</div>
        <Progress value={(gamificationState.points % 1000) / 10} className="mt-2" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
          <div className="font-semibold">{gamificationState.streaks.current}</div>
          <div className="text-xs text-gray-600">Day Streak</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <Award className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <div className="font-semibold">{gamificationState.badges.length}</div>
          <div className="text-xs text-gray-600">Badges</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Recent Badges</h4>
        {gamificationState.badges.slice(-3).map((badge, index) => (
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
        <Select value={tutorPersonality.tone} onValueChange={(value) => adjustPersonality({ tone: value as any })}>
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
        <Select value={tutorPersonality.teachingMethod} onValueChange={(value) => adjustPersonality({ teachingMethod: value as any })}>
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
          {gamificationState.streaks.current > 0 && (
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
            Level {gamificationState.level}
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