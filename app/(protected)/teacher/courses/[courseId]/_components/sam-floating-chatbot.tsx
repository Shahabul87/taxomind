"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { logger } from '@/lib/logger';
import { 
  MessageCircle, 
  Send, 
  Brain, 
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  RefreshCw,
  BarChart3,
  BookOpen,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { samMemory } from '@/lib/sam/utils/sam-memory-system';

interface ChatMessage {
  id: string;
  type: 'user' | 'sam';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface SamFloatingChatbotProps {
  courseId: string;
  courseData: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    price: number | null;
    isPublished: boolean;
    categoryId: string | null;
    whatYouWillLearn: string[];
    chapters: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
      isPublished: boolean;
      sections: Array<{
        id: string;
        title: string;
        description: string | null;
        position: number;
        isPublished: boolean;
      }>;
    }>;
    attachments: Array<{
      id: string;
      name: string;
      url: string;
      createdAt: Date;
    }>;
    category?: {
      id: string;
      name: string;
    };
  };
  completionStatus: {
    titleDesc: boolean;
    learningObj: boolean;
    chapters: boolean;
    price: boolean;
    category: boolean;
    image: boolean;
    attachments: boolean;
  };
}

const QUICK_ACTIONS = [
  { icon: Sparkles, label: "Generate Blueprint", action: "blueprint" },
  { icon: BookOpen, label: "Course Structure", action: "structure" },
  { icon: Target, label: "Learning Objectives", action: "objectives" },
  { icon: BarChart3, label: "Analytics", action: "analytics" },
  { icon: Users, label: "Engagement", action: "engagement" },
  { icon: TrendingUp, label: "Optimization", action: "optimization" }
];

export function SamFloatingChatbot({ 
  courseId, 
  courseData, 
  completionStatus 
}: SamFloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingContextMessage, setPendingContextMessage] = useState<{ message: string; context?: Record<string, unknown> } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(content: string, context?: Record<string, unknown>) => Promise<void>>(null);
  const buildCourseContextRef = useRef<() => Record<string, unknown>>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Initialize SAM memory with course data
  useEffect(() => {
    samMemory.updateCurrentPage('course-management');
    samMemory.updateCourseData(courseData);
    samMemory.updateCompletionStatus(completionStatus);
  }, [courseData, completionStatus]);

  // Listen for context messages from other components (e.g., "Fix Now" buttons)
  useEffect(() => {
    const handleContextMessage = (event: CustomEvent<{ message: string; context?: Record<string, unknown> }>) => {
      const { message, context } = event.detail;

      // Open the chat and store the pending message
      setIsOpen(true);
      setIsMinimized(false);
      setPendingContextMessage({ message, context });
    };

    window.addEventListener('sam-context-message', handleContextMessage as EventListener);

    return () => {
      window.removeEventListener('sam-context-message', handleContextMessage as EventListener);
    };
  }, []);

  // Initialize with contextual welcome message based on SAM memory
  useEffect(() => {
    const context = samMemory.getContextForPage('course-management') as Record<string, unknown> | null;
    let welcomeMessage = `👋 Hi! I'm SAM, your AI course assistant with complete contextual memory and form synchronization.`;

    if (context && typeof context === 'object' && 'wizardContext' in context) {
      const wizardContext = context.wizardContext as Record<string, unknown>;
      const targetAudience = typeof wizardContext.targetAudience === 'string' ? wizardContext.targetAudience : 'General';
      const difficulty = typeof wizardContext.difficulty === 'string' ? wizardContext.difficulty : 'Intermediate';
      const bloomsFocus = Array.isArray(wizardContext.bloomsFocus) ? (wizardContext.bloomsFocus as string[]).join(', ') : 'All levels';
      const generationPreferences = wizardContext.generationPreferences as Record<string, unknown> | undefined;
      const chapterCount = typeof generationPreferences?.chapterCount === 'number' ? generationPreferences.chapterCount : 0;
      const sectionsPerChapter = typeof generationPreferences?.sectionsPerChapter === 'number' ? generationPreferences.sectionsPerChapter : 0;

      welcomeMessage += `\n\n🧠 **I remember everything about our course creation journey:**\n`;
      welcomeMessage += `• Course: "${courseData.title}"\n`;
      welcomeMessage += `• Target: ${targetAudience}\n`;
      welcomeMessage += `• Level: ${difficulty}\n`;
      welcomeMessage += `• Focus: ${bloomsFocus}\n`;
      welcomeMessage += `• Original Goals: ${chapterCount} chapters, ${sectionsPerChapter} sections each\n\n`;
      welcomeMessage += `🔄 **Form Synchronization Enabled:** I can generate content and automatically update your course forms in real-time!\n\n`;
      welcomeMessage += `💡 Try commands like "Generate 5 chapters" or ask "How do you know about my course structure?"`;
    } else {
      welcomeMessage += `\n\n📋 I have complete access to your course structure:\n`;
      welcomeMessage += `• ${courseData.chapters.length} chapters, ${courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} sections\n`;
      welcomeMessage += `• ${courseData.whatYouWillLearn.length} learning objectives\n`;
      welcomeMessage += `• Status: ${courseData.isPublished ? 'Published' : 'Draft'}\n\n`;
      welcomeMessage += `🔄 **Form Synchronization Ready:** I can generate and update content directly!\n\n`;
      welcomeMessage += `💬 Ask me "How do you know about my course?" or "Generate chapters for this course"`;
    }
    
    setMessages([{
      id: '1',
      type: 'sam',
      content: welcomeMessage,
      timestamp: new Date(),
      suggestions: (context && typeof context === 'object' && 'wizardContext' in context) ? [
        "How do you know about my course structure?",
        "Generate 5 chapters for this course",
        "Update my learning objectives",
        "Analyze course completion status"
      ] : [
        "How do you know about my course structure?",
        "Generate chapters for this course",
        "Optimize my course structure",
        "Help with publishing readiness"
      ]
    }]);
  }, [courseData.title, courseData.chapters, courseData.isPublished, courseData.whatYouWillLearn.length]);

  const calculateCourseHealthScore = useCallback(() => {
    let score = 0;
    const completionCount = Object.values(completionStatus).filter(Boolean).length;
    score += (completionCount / Object.keys(completionStatus).length) * 40;
    
    if (courseData.chapters.length >= 5) score += 15;
    else if (courseData.chapters.length >= 3) score += 10;
    else if (courseData.chapters.length >= 1) score += 5;
    
    if (courseData.whatYouWillLearn.length >= 5) score += 15;
    else if (courseData.whatYouWillLearn.length >= 3) score += 10;
    else if (courseData.whatYouWillLearn.length >= 1) score += 5;
    
    if (courseData.isPublished) score += 20;
    if (courseData.attachments.length > 0) score += 10;
    
    return Math.round(score);
  }, [courseData, completionStatus]);

  const buildCourseContext = useCallback(() => {
    const completionPercentage = Object.values(completionStatus).filter(Boolean).length / Object.keys(completionStatus).length * 100;
    
    return {
      courseId: courseData.id,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category?.name,
      isPublished: courseData.isPublished,
      price: courseData.price,
      hasImage: !!courseData.imageUrl,
      totalChapters: courseData.chapters.length,
      publishedChapters: courseData.chapters.filter(ch => ch.isPublished).length,
      totalSections: courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
      publishedSections: courseData.chapters.reduce((sum, ch) => sum + ch.sections.filter(s => s.isPublished).length, 0),
      learningObjectives: courseData.whatYouWillLearn,
      objectiveCount: courseData.whatYouWillLearn.length,
      attachmentCount: courseData.attachments.length,
      completionPercentage,
      completedSections: Object.entries(completionStatus).filter(([_, completed]) => completed).map(([section]) => section),
      pendingSections: Object.entries(completionStatus).filter(([_, completed]) => !completed).map(([section]) => section),
      healthScore: calculateCourseHealthScore(),
      pageContext: 'course-management'
    };
  }, [courseData, completionStatus, calculateCourseHealthScore]);

  const handleQuickAction = async (action: string) => {
    const context = buildCourseContext();
    const samContextRaw = samMemory.getContextForPage('course-management') as Record<string, unknown> | null;
    const samContext = samContextRaw && typeof samContextRaw === 'object' && 'wizardContext' in samContextRaw ? samContextRaw : null;
    const wizardContext = samContext?.wizardContext as Record<string, unknown> | undefined;
    const hasWizardContext = Boolean(wizardContext);
    const targetAudience = typeof wizardContext?.targetAudience === 'string' ? wizardContext.targetAudience : '';
    const difficulty = typeof wizardContext?.difficulty === 'string' ? wizardContext.difficulty : '';

    const actionPrompts = {
      blueprint: `Generate a comprehensive course blueprint based on ${hasWizardContext ? 'our previous wizard session and' : ''} the current course structure. Help me create/enhance the course content systematically.`,
      structure: `Analyze my course structure with ${context.totalChapters} chapters and ${context.totalSections} sections. ${hasWizardContext ? 'Consider our original planning from the course wizard.' : ''}`,
      objectives: `Review my ${context.objectiveCount} learning objectives and suggest improvements. ${hasWizardContext ? 'Reference our original goals from the course creation process.' : ''}`,
      analytics: `Provide insights on my course performance and analytics based on current completion status.`,
      engagement: `Suggest strategies to improve student engagement. ${hasWizardContext && targetAudience ? 'Keep in mind our target audience: ' + targetAudience : ''}`,
      optimization: `Give me optimization tips to improve my course quality. ${hasWizardContext && difficulty ? 'Consider our original difficulty level: ' + difficulty : ''}`
    };
    
    const prompt = actionPrompts[action as keyof typeof actionPrompts] || `Help me with ${action}`;
    await sendMessage(prompt, { ...context, samContext });
  };

  const handleSuggestionClick = async (suggestion: string) => {
    const context = buildCourseContext();
    await sendMessage(suggestion, context);
  };

  const sendMessage = async (content: string, context?: Record<string, unknown>) => {
    const messageContent = content || inputValue.trim();
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

    // Save conversation to SAM memory
    samMemory.addConversation({
      type: 'user',
      content: messageContent,
      context: 'course-management',
      page: 'course-management'
    });

    try {
      const baseContext = context || buildCourseContext();
      const samContextRaw = samMemory.getContextForPage('course-management') as Record<string, unknown> | null;
      const samContext = samContextRaw && typeof samContextRaw === 'object' ? samContextRaw : {};

      // Enhanced context with SAM memory
      const enhancedContext = {
        ...baseContext,
        samMemoryContext: samContext,
        conversationHistory: samMemory.getRelevantInteractions('course-management', 10),
        userPreferences: 'userProfile' in samContext ? samContext.userProfile : null,
        wizardContext: 'wizardContext' in samContext ? samContext.wizardContext : null,
        generatedContent: 'generatedContent' in samContext ? samContext.generatedContent : null
      };
      
      const response = await fetch('/api/sam/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          pageContext: {
            type: 'course-detail',
            path: `/teacher/courses/${baseContext.courseId}`,
            entityId: baseContext.courseId,
            entityType: 'course',
            entityData: {
              title: baseContext.title,
              description: baseContext.description,
              isPublished: baseContext.isPublished,
              chapterCount: baseContext.totalChapters,
              publishedChapters: baseContext.publishedChapters,
              sectionCount: baseContext.totalSections,
              objectiveCount: baseContext.objectiveCount,
              healthScore: baseContext.healthScore,
              completionPercentage: baseContext.completionPercentage,
              samMemoryContext: enhancedContext.samMemoryContext,
            },
          },
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get SAM response');
      }

      const result = await response.json();

      // Map unified response: suggestions may be SAMSuggestion objects
      const rawSuggestions: unknown[] = result.suggestions ?? [];
      const mappedSuggestions = rawSuggestions.map((s: unknown) =>
        typeof s === 'string' ? s : (s as { label?: string }).label ?? ''
      ).filter(Boolean);

      const responseText: string = result.response ?? '';

      const samMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: responseText,
        timestamp: new Date(),
        suggestions: mappedSuggestions
      };

      setMessages(prev => [...prev, samMessage]);

      // Save SAM response to memory
      samMemory.addConversation({
        type: 'sam',
        content: responseText,
        context: 'course-management',
        page: 'course-management',
        suggestions: mappedSuggestions,
        actionsTaken: result.actions ?? []
      });

      // Handle form synchronization if insights data is provided
      if (result.insights && Object.keys(result.insights).length > 0) {

        toast.success('Content generated with synchronization data!');
      }
      
    } catch (error) {
      logger.error('Error sending message to SAM:', error);

      // Fallback error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: "I'm having trouble processing your request. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response from SAM');
    } finally {
      setIsLoading(false);
    }
  };

  // Keep refs in sync with the latest function references
  sendMessageRef.current = sendMessage;
  buildCourseContextRef.current = buildCourseContext;

  // Process pending context messages (from "Fix Now" buttons, etc.)
  useEffect(() => {
    if (pendingContextMessage && isOpen && !isLoading) {
      const { message, context } = pendingContextMessage;
      setPendingContextMessage(null); // Clear pending message

      // Build enhanced context and send the message
      const currentBuildCourseContext = buildCourseContextRef.current;
      if (currentBuildCourseContext) {
        const enhancedContext = context ? { ...currentBuildCourseContext(), ...context } : currentBuildCourseContext();

        // Use setTimeout to ensure the chat is fully rendered
        setTimeout(() => {
          sendMessageRef.current?.(message, enhancedContext);
        }, 150);
      }
    }
  }, [pendingContextMessage, isOpen, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const healthScore = calculateCourseHealthScore();

  // Floating toggle button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border-2 border-white/20"
        >
          <div className="relative">
            <Brain className="h-7 w-7 text-white" />
            {healthScore < 80 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
            )}
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="w-[480px] h-[650px] max-h-[calc(100vh-100px)] max-w-[calc(100vw-50px)]">
        <Card className="h-full w-full backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-purple-50/80 via-indigo-50/80 to-blue-50/80 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur opacity-50 animate-pulse"></div>
                <div className="relative p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                  SAM AI Assistant
                </h3>
                {!isMinimized && (
                  <div className="flex items-center gap-4 mt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        healthScore >= 80 ? "bg-green-500" :
                        healthScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                      )}></div>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Health: {healthScore}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        Context Aware
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Actions */}
              <div className="p-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_ACTIONS.slice(0, 6).map((action) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={action.action}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.action)}
                        disabled={isLoading}
                        className="h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title={action.label}
                      >
                        <Icon className="h-3 w-3" />
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-[calc(650px-160px)] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={cn(
                        "flex gap-3",
                        message.type === 'user' ? "justify-end" : "justify-start"
                      )}>
                        {message.type === 'sam' && (
                          <Avatar className="h-8 w-8 border-2 border-purple-200 dark:border-purple-700 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold">
                              S
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                          message.type === 'user' 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-md"
                        )}>
                          <div className="whitespace-pre-wrap break-words">{message.content}</div>
                          
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Quick actions:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {message.suggestions.slice(0, 3).map((suggestion, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    disabled={isLoading}
                                    className="h-6 text-xs bg-white/80 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700"
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {message.type === 'user' && (
                          <Avatar className="h-8 w-8 border-2 border-blue-200 dark:border-blue-700 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold">
                              U
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start gap-3">
                        <Avatar className="h-8 w-8 border-2 border-purple-200 dark:border-purple-700">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold">
                            S
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">SAM is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask SAM anything..."
                    disabled={isLoading}
                    className="flex-1 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400"
                  />
                  <Button 
                    type="submit" 
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="h-10 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}