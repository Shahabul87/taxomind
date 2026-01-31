"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { logger } from '@/lib/logger';
import { 
  Sparkles, 
  Send, 
  Brain, 
  MessageCircle, 
  BarChart3, 
  Users, 
  BookOpen, 
  Settings, 
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  type: 'user' | 'sam';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  data?: any;
}

interface SamCourseAssistantProps {
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
  className?: string;
}

const QUICK_ACTIONS = [
  { icon: BookOpen, label: "Course Structure", action: "structure" },
  { icon: Target, label: "Learning Objectives", action: "objectives" },
  { icon: BarChart3, label: "Analytics Insights", action: "analytics" },
  { icon: Users, label: "Student Engagement", action: "engagement" },
  { icon: TrendingUp, label: "Optimization Tips", action: "optimization" },
  { icon: Settings, label: "Course Settings", action: "settings" }
];

const SAM_CONTEXTS = [
  "Course Performance Analysis",
  "Content Optimization", 
  "Student Engagement",
  "Learning Path Design",
  "Assessment Strategy",
  "Market Analysis"
];

export function SamCourseAssistant({ 
  courseId, 
  courseData, 
  completionStatus, 
  className 
}: SamCourseAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'sam',
      content: `Hello! I'm SAM, your intelligent course assistant. I've analyzed your course "${courseData.title}" and I'm ready to help you optimize it based on your current progress and data.`,
      timestamp: new Date(),
      suggestions: [
        "Analyze my course performance",
        "Suggest content improvements", 
        "Help with student engagement",
        "Review course structure"
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const calculateCourseHealthScore = useCallback(() => {
    let score = 0;
    const maxScore = 100;
    
    // Basic completion (40 points)
    const completionCount = Object.values(completionStatus).filter(Boolean).length;
    score += (completionCount / Object.keys(completionStatus).length) * 40;
    
    // Content depth (30 points)
    if (courseData.chapters.length >= 5) score += 15;
    if (courseData.chapters.some(ch => ch.sections.length >= 3)) score += 15;
    
    // Learning objectives (20 points)
    if (courseData.whatYouWillLearn.length >= 3) score += 10;
    if (courseData.whatYouWillLearn.some(obj => obj.length >= 50)) score += 10;
    
    // Course metadata (10 points)
    if (courseData.description && courseData.description.length >= 100) score += 5;
    if (courseData.imageUrl) score += 5;
    
    return Math.round(score);
  }, [courseData, completionStatus]);

  const buildCourseContext = useCallback(() => {
    const completionPercentage = Object.values(completionStatus).filter(Boolean).length / Object.keys(completionStatus).length * 100;
    
    return {
      // Course Basic Info
      courseId: courseData.id,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category?.name,
      isPublished: courseData.isPublished,
      price: courseData.price,
      hasImage: !!courseData.imageUrl,
      
      // Course Structure
      totalChapters: courseData.chapters.length,
      publishedChapters: courseData.chapters.filter(ch => ch.isPublished).length,
      totalSections: courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
      publishedSections: courseData.chapters.reduce((sum, ch) => sum + ch.sections.filter(s => s.isPublished).length, 0),
      
      // Learning Objectives
      learningObjectives: courseData.whatYouWillLearn,
      objectiveCount: courseData.whatYouWillLearn.length,
      
      // Resources
      attachmentCount: courseData.attachments.length,
      
      // Completion Status
      completionPercentage,
      completedSections: Object.entries(completionStatus).filter(([_, completed]) => completed).map(([section]) => section),
      pendingSections: Object.entries(completionStatus).filter(([_, completed]) => !completed).map(([section]) => section),
      
      // Course Health Score
      healthScore: calculateCourseHealthScore(),
      
      // Context for AI
      lastModified: new Date().toISOString(),
      userRole: 'teacher',
      pageContext: 'course-management'
    };
  }, [courseData, completionStatus, calculateCourseHealthScore]);


  const handleQuickAction = async (action: string) => {
    const context = buildCourseContext();
    setIsLoading(true);
    
    const actionPrompts = {
      structure: `Analyze my course structure and suggest improvements based on my ${context.totalChapters} chapters and ${context.totalSections} sections.`,
      objectives: `Review my ${context.objectiveCount} learning objectives and suggest improvements for better learning outcomes.`,
      analytics: `Provide insights on my course performance and analytics based on current data.`,
      engagement: `Suggest strategies to improve student engagement for my course.`,
      optimization: `Give me optimization tips to improve my course quality and effectiveness.`,
      settings: `Help me review and optimize my course settings and configuration.`
    };
    
    const prompt = actionPrompts[action as keyof typeof actionPrompts] || `Help me with ${action}`;
    await sendMessage(prompt, context);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    const context = buildCourseContext();
    await sendMessage(suggestion, context);
  };

  const sendMessage = async (content: string, context?: any) => {
    if (!content.trim() && !context) return;
    
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    // Add user message
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
      const contextData = context || buildCourseContext();
      
      const response = await fetch('/api/sam/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          pageContext: {
            type: 'course-detail',
            path: `/teacher/courses/${contextData.courseId}`,
            entityId: contextData.courseId,
            entityType: 'course',
            entityData: {
              title: contextData.title,
              description: contextData.description,
              isPublished: contextData.isPublished,
              chapterCount: contextData.totalChapters,
              publishedChapters: contextData.publishedChapters,
              sectionCount: contextData.totalSections,
              objectiveCount: contextData.objectiveCount,
              healthScore: contextData.healthScore,
              completionPercentage: contextData.completionPercentage,
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
      const mappedSuggestions = rawSuggestions.map((s) =>
        typeof s === 'string' ? s : (s as { label?: string }).label ?? ''
      ).filter(Boolean);

      // Add SAM response
      const samMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: result.response ?? '',
        timestamp: new Date(),
        suggestions: mappedSuggestions,
        data: result.insights ?? null
      };
      
      setMessages(prev => [...prev, samMessage]);
      
    } catch (error: any) {
      logger.error('Error sending message to SAM:', error);
      toast.error('Failed to get response from SAM');
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const healthScore = calculateCourseHealthScore();
  const context = buildCourseContext();

  return (
    <Card className={cn(
      "backdrop-blur-md bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10",
      "border border-white/20 shadow-xl relative overflow-hidden",
      className
    )}>
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl transform translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl transform -translate-x-12 translate-y-12"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  SAM Course Assistant
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Context-aware AI assistant for your course
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Course Health Score */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/30 dark:bg-slate-800/30 border border-white/20">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  healthScore >= 80 ? "bg-green-500" :
                  healthScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                )}></div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Health: {healthScore}%
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Course Context Summary */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white/20 dark:bg-slate-800/20 border border-white/20">
              <div className="font-medium text-slate-700 dark:text-slate-300">Chapters</div>
              <div className="text-slate-600 dark:text-slate-400">{context.totalChapters} total</div>
            </div>
            <div className="p-2 rounded-lg bg-white/20 dark:bg-slate-800/20 border border-white/20">
              <div className="font-medium text-slate-700 dark:text-slate-300">Sections</div>
              <div className="text-slate-600 dark:text-slate-400">{context.totalSections} total</div>
            </div>
            <div className="p-2 rounded-lg bg-white/20 dark:bg-slate-800/20 border border-white/20">
              <div className="font-medium text-slate-700 dark:text-slate-300">Completion</div>
              <div className="text-slate-600 dark:text-slate-400">{Math.round(context.completionPercentage)}%</div>
            </div>
            <div className="p-2 rounded-lg bg-white/20 dark:bg-slate-800/20 border border-white/20">
              <div className="font-medium text-slate-700 dark:text-slate-300">Status</div>
              <div className="text-slate-600 dark:text-slate-400">
                {courseData.isPublished ? "Published" : "Draft"}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Quick Actions */}
            <div className="p-4 border-b border-white/20">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Quick Actions</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.action}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.action)}
                      disabled={isLoading}
                      className="justify-start bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-800/70 text-xs"
                    >
                      <Icon className="h-3 w-3 mr-2" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="h-96" ref={scrollAreaRef}>
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={cn(
                    "flex gap-3",
                    message.type === 'user' ? "justify-end" : "justify-start"
                  )}>
                    {message.type === 'sam' && (
                      <Avatar className="h-8 w-8 border-2 border-purple-500/50">
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                          SAM
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-lg",
                      message.type === 'user' 
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-white/70 dark:bg-slate-800/70 border border-white/20 backdrop-blur-sm"
                    )}>
                      <div className="text-sm">{message.content}</div>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Suggested actions:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestionClick(suggestion)}
                                disabled={isLoading}
                                className="h-6 text-xs bg-white/50 dark:bg-slate-700/50 border-white/30 hover:bg-white/70"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {message.type === 'user' && (
                      <Avatar className="h-8 w-8 border-2 border-blue-500/50">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                          YOU
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start gap-3">
                    <Avatar className="h-8 w-8 border-2 border-purple-500/50">
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                        SAM
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white/70 dark:bg-slate-800/70 border border-white/20 backdrop-blur-sm p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 animate-spin text-purple-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">SAM is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-white/20">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask SAM anything about your course..."
                  disabled={isLoading}
                  className="flex-1 bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm"
                />
                <Button 
                  type="submit" 
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}