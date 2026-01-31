"use client";

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger';
import { 
  MessageCircle, 
  Send, 
  Brain, 
  X,
  Minimize2,
  Maximize2,
  BookOpen,
  Target,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Keyboard,
  HelpCircle,
  Search,
  Download,
  Trash2,
  Copy,
  Sparkles,
  Zap,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Enterprise-grade TypeScript interfaces
interface ChatMessage {
  id: string;
  type: 'user' | 'sam';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    confidence?: number;
  };
}

interface EnterpriseSamAssistantProps {
  courseId: string;
  courseData: {
    id: string;
    title: string;
    description: string | null;
    isPublished: boolean;
    categoryId: string | null;
    whatYouWillLearn: string[];
    chapters: Array<{
      id: string;
      title: string;
      isPublished: boolean;
      sections: Array<{
        id: string;
        title: string;
        isPublished: boolean;
      }>;
    }>;
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
  variant?: 'floating' | 'embedded';
  className?: string;
}

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: string;
  description: string;
  color: string;
  shortcut?: string;
}

// Enterprise-grade quick actions
const ENTERPRISE_ACTIONS: QuickAction[] = [
  {
    icon: BookOpen,
    label: "Course Analysis",
    action: "structure",
    description: "Deep dive into course structure",
    color: "from-blue-500 to-indigo-500",
    shortcut: "⌘+S"
  },
  {
    icon: Target,
    label: "Learning Objectives",
    action: "objectives",
    description: "Optimize learning goals",
    color: "from-emerald-500 to-teal-500",
    shortcut: "⌘+O"
  },
  {
    icon: BarChart3,
    label: "Analytics & Insights",
    action: "analytics",
    description: "Performance metrics & trends",
    color: "from-purple-500 to-pink-500",
    shortcut: "⌘+A"
  },
  {
    icon: Shield,
    label: "Quality Check",
    action: "quality",
    description: "Ensure enterprise standards",
    color: "from-amber-500 to-orange-500",
    shortcut: "⌘+Q"
  }
];

// Memoized message component for performance
const MessageBubble = memo(({ 
  message, 
  onSuggestionClick, 
  isLoading 
}: {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}) => (
  <div className={cn(
    "flex gap-3 mb-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
    message.type === 'user' ? "justify-end" : "justify-start"
  )}>
    {message.type === 'sam' && (
      <Avatar className="h-10 w-10 border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
          SAM
        </AvatarFallback>
      </Avatar>
    )}
    
    <div className={cn(
      "max-w-[85%] rounded-2xl px-5 py-4 shadow-lg",
      message.type === 'user' 
        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" 
        : message.isError
        ? "bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100"
        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    )}>
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {message.content}
      </div>
      
      {message.suggestions && message.suggestions.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Suggested Actions
          </div>
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
                disabled={isLoading}
                className="h-8 text-xs bg-white/20 hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 border border-white/20 dark:border-gray-600 backdrop-blur-sm transition-all duration-200"
              >
                <Sparkles className="h-3 w-3 mr-1.5" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {message.metadata && (
        <div className="mt-3 flex items-center gap-3 text-xs opacity-70">
          <span>{message.timestamp.toLocaleTimeString()}</span>
          {message.metadata.processingTime && (
            <span>• {message.metadata.processingTime}ms</span>
          )}
          {message.metadata.confidence && (
            <span>• {Math.round(message.metadata.confidence * 100)}% confidence</span>
          )}
        </div>
      )}
    </div>
    
    {message.type === 'user' && (
      <Avatar className="h-10 w-10 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold">
          YOU
        </AvatarFallback>
      </Avatar>
    )}
  </div>
));

MessageBubble.displayName = 'MessageBubble';

export function EnterpriseSamAssistant({ 
  courseId, 
  courseData, 
  completionStatus,
  variant = 'floating',
  className 
}: EnterpriseSamAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate course health metrics
  const calculateHealthMetrics = useCallback(() => {
    const completionCount = Object.values(completionStatus).filter(Boolean).length;
    const completionRate = (completionCount / Object.keys(completionStatus).length) * 100;
    const contentDepth = Math.min(courseData.chapters.length * 10, 40);
    const objectiveQuality = Math.min(courseData.whatYouWillLearn.length * 10, 30);
    const healthScore = Math.round(completionRate * 0.4 + contentDepth + objectiveQuality);
    
    return {
      healthScore,
      completionRate: Math.round(completionRate),
      status: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'needs-improvement',
      color: healthScore >= 80 ? 'text-emerald-600' : healthScore >= 60 ? 'text-amber-600' : 'text-red-600'
    };
  }, [completionStatus, courseData.chapters.length, courseData.whatYouWillLearn.length]);

  const metrics = calculateHealthMetrics();

  // Initialize with enterprise welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'sam',
        content: `Welcome to SAM Enterprise Assistant! I'm here to help you optimize "${courseData.title}" to meet enterprise standards.

📊 **Course Health Score: ${metrics.healthScore}%** (${metrics.status})
📚 **Chapters:** ${courseData.chapters.length}
🎯 **Learning Objectives:** ${courseData.whatYouWillLearn.length}
📈 **Completion:** ${metrics.completionRate}%

I can help you with:
• Deep course analysis and optimization
• Learning objective enhancement
• Performance analytics and insights
• Quality assurance checks

How can I assist you today?`,
        timestamp: new Date(),
        suggestions: [
          "Analyze course gaps",
          "Optimize for engagement",
          "Review learning objectives",
          "Generate improvement plan"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [courseData.title, courseData.chapters.length, courseData.whatYouWillLearn.length, metrics, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

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
      const startTime = Date.now();
      
      const response = await fetch('/api/sam/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          pageContext: {
            type: 'course-detail',
            path: `/teacher/courses/${courseData.id}`,
            entityId: courseData.id,
            entityType: 'course',
            entityData: {
              title: courseData.title,
              description: courseData.description,
              isPublished: courseData.isPublished,
              chapterCount: courseData.chapters.length,
              publishedChapters: courseData.chapters.filter(ch => ch.isPublished).length,
              sectionCount: courseData.chapters.reduce((sum, ch) => sum + ch.sections.length, 0),
              objectiveCount: courseData.whatYouWillLearn.length,
              healthScore: metrics.healthScore,
              completionPercentage: metrics.completionRate,
            },
          },
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      // Suggestions may be string[] or SAMSuggestion[] objects
      const rawSuggestions: unknown[] = result.suggestions || [];
      const suggestions = rawSuggestions.map((s: unknown) =>
        typeof s === 'string' ? s : (s as { label?: string }).label ?? ''
      ).filter(Boolean);

      const samMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: result.response,
        timestamp: new Date(),
        suggestions,
        metadata: {
          processingTime,
          confidence: result.confidence || 0.95
        }
      };
      
      setMessages(prev => [...prev, samMessage]);
      
    } catch (error: any) {
      logger.error('SAM Error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: "I apologize for the inconvenience. There was an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
        isError: true,
        suggestions: ["Retry", "Check connection", "Contact support"]
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to connect to SAM assistant');
    } finally {
      setIsLoading(false);
    }
  }, [courseData.id, courseData.title, courseData.description, courseData.isPublished, courseData.chapters, courseData.whatYouWillLearn.length, metrics, messages]);

  const handleQuickAction = useCallback(async (action: string) => {
    const actionPrompts = {
      structure: `Perform a comprehensive analysis of my course structure with ${courseData.chapters.length} chapters. Identify gaps, suggest improvements, and recommend best practices for enterprise-level courses.`,
      objectives: `Review and enhance my ${courseData.whatYouWillLearn.length} learning objectives. Ensure they meet SMART criteria and align with enterprise training standards.`,
      analytics: `Provide detailed analytics and insights for my course with a health score of ${metrics.healthScore}%. Include actionable recommendations for improvement.`,
      quality: `Conduct a thorough quality check of my course against enterprise standards. Identify areas of excellence and opportunities for enhancement.`
    };
    
    const prompt = actionPrompts[action as keyof typeof actionPrompts] || `Help me with ${action}`;
    await sendMessage(prompt);
  }, [courseData.chapters.length, courseData.whatYouWillLearn.length, metrics.healthScore, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen && variant === 'floating') return;
      
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleQuickAction('structure');
            break;
          case 'o':
            e.preventDefault();
            handleQuickAction('objectives');
            break;
          case 'a':
            e.preventDefault();
            handleQuickAction('analytics');
            break;
          case 'q':
            e.preventDefault();
            handleQuickAction('quality');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, variant, handleQuickAction]);

  // Floating toggle button
  if (variant === 'floating' && !isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
          
          <Button
            onClick={() => setIsOpen(true)}
            className="relative h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 transition-all duration-300 hover:scale-110"
            aria-label="Open SAM Enterprise Assistant"
          >
            <Brain className="h-8 w-8 text-white" />
            {metrics.healthScore < 80 && (
              <div className="absolute -top-1 -right-1 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-500 items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-white" />
                </span>
              </div>
            )}
          </Button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              SAM Assistant • Health: {metrics.healthScore}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main assistant interface
  const content = (
    <Card className={cn(
      "relative overflow-hidden shadow-2xl",
      "bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800",
      "border-gray-200 dark:border-gray-700",
      variant === 'floating' && "w-[480px] h-[720px]",
      variant === 'embedded' && "w-full h-full min-h-[600px]",
      className
    )}>
      {/* Premium glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      
      {/* Header */}
      <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                SAM Enterprise Assistant
                <Badge variant="secondary" className="text-xs">v2.0</Badge>
              </h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <Activity className={cn("h-3 w-3", metrics.color)} />
                  <span className={cn("text-xs font-medium", metrics.color)}>
                    Health: {metrics.healthScore}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-indigo-600" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    AI-Powered
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="h-8 w-8"
              aria-label="Toggle search"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {variant === 'floating' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8"
                  aria-label={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Search bar */}
        {showSearch && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversation..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {!isMinimized && (
        <>
          {/* Quick Actions */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              {ENTERPRISE_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.action}
                    variant="outline"
                    onClick={() => handleQuickAction(action.action)}
                    disabled={isLoading}
                    className="relative overflow-hidden group h-auto flex flex-col items-start p-3 text-left hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn(
                        "p-1.5 rounded-lg bg-gradient-to-r text-white",
                        action.color
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">{action.label}</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{action.description}</span>
                    {action.shortcut && (
                      <span className="absolute top-2 right-2 text-xs text-gray-400 dark:text-gray-500">
                        {action.shortcut}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-5">
            <div className="space-y-4">
              {messages.filter(msg => 
                !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSuggestionClick={sendMessage}
                  isLoading={isLoading}
                />
              ))}
              
              {isLoading && (
                <div className="flex justify-start gap-3">
                  <Avatar className="h-10 w-10 border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                      SAM
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        SAM is analyzing your request...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area - Enterprise Grade */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask SAM anything about your course..."
                  className="w-full min-h-[100px] resize-none rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                
                {/* Character indicator */}
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {inputValue.length > 0 && `${inputValue.length} characters`}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Keyboard className="h-3 w-3" />
                    <span>Press ⌘+Enter to send</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Info className="h-3 w-3" />
                    <span>Enterprise AI Mode</span>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </Card>
  );

  // Render based on variant
  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {content}
      </div>
    );
  }

  return content;
}