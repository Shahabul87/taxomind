"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  BookOpen,
  Target,
  Lightbulb,
  Layers,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Navigation,
  BarChart3,
  FileText,
  Layout,
  Settings,
  Users,
  TrendingUp,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGlobalSam } from './global-sam-provider';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface ChatMessage {
  id: string;
  type: 'user' | 'sam' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  action?: {
    type: 'navigation' | 'content_generated' | 'form_update' | 'page_action';
    details: any;
  };
}

const PAGE_SPECIFIC_ACTIONS = {
  courses: [
    { value: "course_overview", label: "Analyze My Courses", icon: "📊" },
    { value: "create_course", label: "Guide Course Creation", icon: "🎓" },
    { value: "improve_courses", label: "Improve Course Performance", icon: "✨" },
    { value: "analytics_insights", label: "Show Analytics Insights", icon: "📈" },
    { value: "bulk_operations", label: "Bulk Course Operations", icon: "⚡" },
  ],
  'course-detail': [
    { value: "generate_objectives", label: "Generate Learning Objectives", icon: "🎯" },
    { value: "create_chapters", label: "Create Course Chapters", icon: "📚" },
    { value: "analyze_structure", label: "Analyze Course Structure", icon: "🔍" },
    { value: "improve_content", label: "Improve Course Content", icon: "✨" },
    { value: "course_analytics", label: "Course Analytics", icon: "📊" },
  ],
  'chapter-detail': [
    { value: "create_sections", label: "Create Chapter Sections", icon: "📑" },
    { value: "generate_content", label: "Generate Chapter Content", icon: "✍️" },
    { value: "create_assessments", label: "Create Assessments", icon: "📝" },
    { value: "chapter_analytics", label: "Chapter Performance", icon: "📊" },
  ],
  'section-detail': [
    { value: "create_video", label: "Add Video Content", icon: "🎥" },
    { value: "create_blog", label: "Create Blog Post", icon: "📰" },
    { value: "create_exam", label: "Create Exam/Quiz", icon: "📝" },
    { value: "add_resources", label: "Add Learning Resources", icon: "📚" },
  ],
  create: [
    { value: "course_planning", label: "Plan Course Structure", icon: "🗂️" },
    { value: "target_audience", label: "Define Target Audience", icon: "👥" },
    { value: "learning_path", label: "Design Learning Path", icon: "🛤️" },
    { value: "content_strategy", label: "Content Strategy", icon: "📋" },
  ],
  analytics: [
    { value: "performance_insights", label: "Performance Insights", icon: "📊" },
    { value: "student_analytics", label: "Student Analytics", icon: "👥" },
    { value: "course_comparison", label: "Compare Courses", icon: "⚖️" },
    { value: "recommendations", label: "Improvement Recommendations", icon: "💡" },
  ],
  posts: [
    { value: "content_strategy", label: "Content Strategy", icon: "📝" },
    { value: "post_optimization", label: "Optimize Posts", icon: "✨" },
    { value: "engagement_tips", label: "Engagement Tips", icon: "💬" },
    { value: "content_calendar", label: "Content Calendar", icon: "📅" },
  ],
  templates: [
    { value: "template_creation", label: "Create Template", icon: "🎨" },
    { value: "template_optimization", label: "Optimize Templates", icon: "⚡" },
    { value: "marketplace_tips", label: "Marketplace Tips", icon: "🏪" },
  ],
  other: [
    { value: "navigation_help", label: "Navigation Help", icon: "🧭" },
    { value: "feature_overview", label: "Feature Overview", icon: "🎯" },
    { value: "best_practices", label: "Best Practices", icon: "⭐" },
    { value: "getting_started", label: "Getting Started", icon: "🚀" },
  ],
};

export function ContextAwareSamAssistant() {
  const { pageContext } = useGlobalSam();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Get page-specific actions
  const pageActions = PAGE_SPECIFIC_ACTIONS[pageContext.pageType] || PAGE_SPECIFIC_ACTIONS.other;

  // Initialize with context-aware welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const contextualWelcome = generateContextualWelcome();
      setMessages([contextualWelcome]);
    }
  }, [pageContext.pageName, messages.length, generateContextualWelcome]);

  // Generate welcome message based on page context
  const generateContextualWelcome = useCallback((): ChatMessage => {
    const getPageIcon = () => {
      switch (pageContext.pageType) {
        case 'courses': return '📚';
        case 'course-detail': return '🎓';
        case 'chapter-detail': return '📖';
        case 'section-detail': return '📑';
        case 'create': return '✨';
        case 'analytics': return '📊';
        case 'posts': return '📝';
        case 'templates': return '🎨';
        default: return '🎯';
      }
    };

    const getContextualMessage = () => {
      switch (pageContext.pageType) {
        case 'courses':
          return `I can help you manage your courses, analyze performance, create new courses, and provide insights on student engagement.`;
        case 'course-detail':
          return `I'm here to help you build this course! I can generate learning objectives, create chapters, analyze structure, and ensure your content follows educational best practices.`;
        case 'chapter-detail':
          return `Let's enhance this chapter! I can help create sections, generate content, design assessments, and ensure proper learning progression.`;
        case 'section-detail':
          return `I can help you create engaging section content - videos, blogs, exams, and learning resources that align with your learning objectives.`;
        case 'create':
          return `Exciting! Let's create an amazing course together. I can help with planning, structure, target audience definition, and content strategy.`;
        case 'analytics':
          return `I can help you understand your analytics data, identify trends, provide performance insights, and suggest improvements.`;
        case 'posts':
          return `I'm here to help with your content strategy, post optimization, engagement tips, and content planning.`;
        case 'templates':
          return `I can assist with template creation, optimization, and marketplace strategies to help you create reusable course components.`;
        default:
          return `I'm here to help you navigate and make the most of your teaching tools and features.`;
      }
    };

    const getCapabilitiesText = () => {
      return pageContext.capabilities.map(cap => {
        const capMap: Record<string, string> = {
          'course_management': 'Course Management',
          'course_creation': 'Course Creation',
          'course_analytics': 'Course Analytics',
          'chapter_management': 'Chapter Management',
          'section_management': 'Section Management',
          'content_creation': 'Content Creation',
          'assessments': 'Assessment Creation',
          'learning_objectives': 'Learning Objectives',
          'analytics_insights': 'Analytics Insights',
          'performance_tracking': 'Performance Tracking',
          'ai_assistance': 'AI Assistance',
          'template_selection': 'Template Selection',
          'course_planning': 'Course Planning',
          'general_help': 'General Help',
          'navigation': 'Navigation',
          'bulk_operations': 'Bulk Operations',
        };
        return capMap[cap] || cap;
      }).join(', ');
    };

    return {
      id: '1',
      type: 'sam',
      content: `${getPageIcon()} **Welcome to ${pageContext.pageName}!**

I'm SAM, your intelligent teaching assistant. I have full context awareness of this page and can help you with:

${getContextualMessage()}

📍 **Current Location:** ${pageContext.breadcrumbs.join(' → ')}
🎯 **Available Capabilities:** ${getCapabilitiesText()}

What would you like to work on today?`,
      timestamp: new Date(),
      suggestions: pageActions.slice(0, 4).map(action => action.label),
    };
  }, [pageContext, pageActions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle messages with context awareness
  const sendMessage = useCallback(async (content: string) => {
    const messageContent = content.trim();
    if (!messageContent) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/sam/context-aware-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          pageContext: pageContext,
          pathname: pathname,
          conversationHistory: messages.slice(-5)
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      
      // Handle actions
      if (result.action) {
        await handleAction(result.action);
      }
      
      const samMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: result.response,
        timestamp: new Date(),
        suggestions: result.suggestions || [],
        action: result.action
      };
      
      setMessages(prev => [...prev, samMessage]);
      
    } catch (error) {
      console.error('SAM Error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: `I apologize, but I encountered an error processing your request. Let me help you with something else or try rephrasing your request.`,
        timestamp: new Date(),
        isError: true,
        suggestions: ["Try again", "Help with navigation", "Show page features"]
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process request');
    } finally {
      setIsLoading(false);
    }
  }, [pageContext, pathname, messages, handleAction]);

  // Handle actions (navigation, form updates, etc.)
  const handleAction = useCallback(async (action: any) => {
    try {
      switch (action.type) {
        case 'navigation':
          if (action.details.url) {
            router.push(action.details.url);
            toast.success(`Navigating to ${action.details.description || 'page'}`);
          }
          break;
        case 'page_action':
          // Handle page-specific actions
          if (action.details.action === 'refresh') {
            router.refresh();
            toast.success('Page refreshed');
          }
          break;
        case 'form_update':
          // Handle form updates through the chapter form interactions
          if ((window as any).chapterFormInteractions) {
            const formActions = (window as any).chapterFormInteractions;
            
            switch (action.details.action) {
              case 'update_chapter_title':
                await formActions.updateChapterTitle(action.details.title);
                break;
              case 'update_chapter_description':
                await formActions.updateChapterDescription(action.details.description);
                break;
              case 'update_learning_outcomes':
                await formActions.updateLearningOutcomes(action.details.outcomes);
                break;
              case 'create_sections':
                await formActions.createMultipleSections(action.details.sections);
                break;
              case 'publish_chapter':
                await formActions.publishChapter();
                break;
              case 'unpublish_chapter':
                await formActions.unpublishChapter();
                break;
              case 'update_chapter_access':
                await formActions.updateChapterAccess(action.details.isFree);
                break;
              default:
                console.log('Form action not handled:', action.details.action);
            }
          } else {
            console.log('Chapter form interactions not available');
          }
          break;
        default:
          console.log('Action not handled:', action);
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('Failed to perform action');
    }
  }, [router]);

  // Quick action handler
  const handleQuickAction = useCallback((actionValue: string) => {
    const action = pageActions.find(a => a.value === actionValue);
    if (action) {
      const contextualPrompts: Record<string, string> = {
        course_overview: "Analyze my courses and provide insights on performance, engagement, and areas for improvement",
        create_course: "Guide me through creating a new course with best practices and structure recommendations",
        generate_objectives: "Generate learning objectives for this course using Bloom's taxonomy",
        create_chapters: "Help me create well-structured chapters for this course",
        analyze_structure: "Analyze the current course structure and suggest improvements",
        performance_insights: "Show me performance insights and analytics for my teaching",
        navigation_help: "Help me navigate and understand the features available on this page",
        create_sections: "Help me create engaging sections for this chapter",
        create_video: "Guide me through adding video content to this section",
        create_blog: "Help me create a blog post for this section",
        create_exam: "Assist me in creating an exam or quiz for this section",
        course_planning: "Help me plan the structure and content strategy for a new course",
        content_strategy: "Provide content strategy recommendations for better engagement",
      };

      const prompt = contextualPrompts[actionValue] || `Help me with ${action.label}`;
      sendMessage(prompt);
    }
  }, [pageActions, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Floating toggle button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
          
          <Button
            onClick={() => setIsOpen(true)}
            className="relative h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0"
            aria-label="Open Context-Aware SAM Assistant"
          >
            <Brain className="h-7 w-7 text-white" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </span>
            </span>
          </Button>
          
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              Context-Aware SAM • {pageContext.pageName}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main interface
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-[420px] h-[640px] flex flex-col overflow-hidden shadow-2xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Context-Aware SAM
                  <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-blue-600 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {pageContext.pageName}
                  </span>
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Context-aware
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {messages.map((message) => (
                  <div key={message.id} className={cn(
                    "flex gap-3 mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                    message.type === 'user' ? "justify-end" : "justify-start"
                  )}>
                    {message.type !== 'user' && (
                      <Avatar className="h-9 w-9 border-2 border-blue-200 dark:border-blue-700 shadow-md flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                          SAM
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 shadow-md",
                      message.type === 'user' 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" 
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    )}>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="secondary"
                                size="sm"
                                onClick={() => sendMessage(suggestion)}
                                disabled={isLoading}
                                className="h-7 text-xs bg-white/20 hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 backdrop-blur-sm"
                              >
                                <Wand2 className="h-3 w-3 mr-1" />
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {message.type === 'user' && (
                      <Avatar className="h-9 w-9 border-2 border-purple-200 dark:border-purple-700 shadow-md flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs font-bold">
                          YOU
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start gap-3">
                    <Avatar className="h-9 w-9 border-2 border-blue-200 shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                        SAM
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3 shadow-md">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">Analyzing context...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
              {/* Quick Actions */}
              <div className="mb-3">
                <Select onValueChange={handleQuickAction}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder={`${pageContext.pageName} actions...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {pageActions.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        <span className="flex items-center gap-2">
                          <span>{action.icon}</span>
                          <span>{action.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Input */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Ask me anything about ${pageContext.pageName}...`}
                  className="w-full min-h-[80px] max-h-[120px] resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Command className="h-3 w-3" />
                    <span>⌘+Enter to send</span>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}