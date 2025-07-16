"use client";

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
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
  ChevronDown,
  Sparkles,
  Zap,
  Activity,
  AlertCircle,
  Search,
  Trash2,
  Download,
  Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  type: 'user' | 'sam';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  metadata?: {
    processingTime?: number;
    confidence?: number;
  };
}

interface EnterpriseSamAssistantV2Props {
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

// Quick action options for dropdown
const QUICK_ACTIONS = [
  { value: "analyze", label: "Analyze Course Structure", icon: "📊" },
  { value: "objectives", label: "Review Learning Objectives", icon: "🎯" },
  { value: "improve", label: "Suggest Improvements", icon: "💡" },
  { value: "quality", label: "Quality Check", icon: "✅" },
  { value: "engagement", label: "Boost Engagement", icon: "🚀" },
  { value: "help", label: "How to Use SAM", icon: "❓" }
];

// Memoized message component
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
      <Avatar className="h-9 w-9 border-2 border-indigo-200 dark:border-indigo-700 shadow-md flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
          SAM
        </AvatarFallback>
      </Avatar>
    )}
    
    <div className={cn(
      "max-w-[80%] rounded-2xl px-4 py-3 shadow-md",
      message.type === 'user' 
        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" 
        : message.isError
        ? "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100"
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
                onClick={() => onSuggestionClick(suggestion)}
                disabled={isLoading}
                className="h-7 text-xs bg-white/20 hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 backdrop-blur-sm"
              >
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
));

MessageBubble.displayName = 'MessageBubble';

export function EnterpriseSamAssistantV2({ 
  courseId, 
  courseData, 
  completionStatus,
  variant = 'floating',
  className 
}: EnterpriseSamAssistantV2Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate health metrics
  const calculateHealthMetrics = useCallback(() => {
    const completionCount = Object.values(completionStatus).filter(Boolean).length;
    const completionRate = (completionCount / Object.keys(completionStatus).length) * 100;
    const healthScore = Math.round(completionRate);
    
    return {
      healthScore,
      completionRate: Math.round(completionRate),
      status: healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Work',
      color: healthScore >= 80 ? 'text-emerald-600' : healthScore >= 60 ? 'text-amber-600' : 'text-red-600'
    };
  }, [completionStatus]);

  const metrics = calculateHealthMetrics();

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'sam',
        content: `Hi! I'm SAM, your AI course assistant for "${courseData.title}".

📊 Course Health: ${metrics.healthScore}% (${metrics.status})
📚 ${courseData.chapters.length} chapters created
🎯 ${courseData.whatYouWillLearn.length} learning objectives

How can I help you improve your course today?`,
        timestamp: new Date(),
        suggestions: [
          "What's missing in my course?",
          "How can I improve engagement?",
          "Review my course structure"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [courseData.title, courseData.chapters.length, courseData.whatYouWillLearn.length, metrics, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

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
      const response = await fetch('/api/sam/unified-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          context: {
            courseId: courseData.id,
            title: courseData.title,
            healthScore: metrics.healthScore,
            completionStatus,
            chaptersCount: courseData.chapters.length,
            objectivesCount: courseData.whatYouWillLearn.length,
            isPublished: courseData.isPublished
          },
          conversationHistory: messages.slice(-5)
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      
      const samMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: result.response,
        timestamp: new Date(),
        suggestions: result.suggestions || []
      };
      
      setMessages(prev => [...prev, samMessage]);
      
    } catch (error) {
      console.error('SAM Error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: "I'm having trouble connecting. Please check your internet and try again.",
        timestamp: new Date(),
        isError: true,
        suggestions: ["Try again", "Refresh page"]
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to connect to SAM');
    } finally {
      setIsLoading(false);
    }
  }, [courseData, metrics.healthScore, messages, completionStatus]);

  const handleQuickAction = useCallback((action: string) => {
    const actionPrompts = {
      analyze: `Analyze my course structure with ${courseData.chapters.length} chapters and suggest improvements.`,
      objectives: `Review my ${courseData.whatYouWillLearn.length} learning objectives and suggest enhancements.`,
      improve: `What are the top 3 improvements I should make to my course?`,
      quality: `Perform a quality check on my course and identify any gaps.`,
      engagement: `Suggest strategies to boost student engagement in my course.`,
      help: `Show me the most effective ways to use SAM for course creation.`
    };
    
    const prompt = actionPrompts[action as keyof typeof actionPrompts];
    if (prompt) {
      sendMessage(prompt);
      setSelectedAction(""); // Reset dropdown
    }
  }, [courseData.chapters.length, courseData.whatYouWillLearn.length, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const clearConversation = () => {
    setMessages([]);
    toast.success('Conversation cleared');
  };

  // Floating toggle button
  if (variant === 'floating' && !isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
          
          <Button
            onClick={() => setIsOpen(true)}
            className="relative h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0"
            aria-label="Open SAM Assistant"
          >
            <Brain className="h-7 w-7 text-white" />
            {metrics.healthScore < 80 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500" />
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Main interface
  const content = (
    <Card className={cn(
      "flex flex-col overflow-hidden shadow-2xl",
      "bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800",
      "border-gray-200 dark:border-gray-700",
      variant === 'floating' && "w-[400px] h-[600px]",
      variant === 'embedded' && "w-full h-full min-h-[500px]",
      className
    )}>
      {/* Header - Compact */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                SAM Assistant
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <Activity className={cn("h-3 w-3", metrics.color)} />
                <span className={metrics.color}>Health: {metrics.healthScore}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {variant === 'floating' && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area - Takes up available space */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSuggestionClick={sendMessage}
                  isLoading={isLoading}
                />
              ))}
              
              {isLoading && (
                <div className="flex justify-start gap-3">
                  <Avatar className="h-9 w-9 border-2 border-indigo-200 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                      SAM
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area - Fixed at bottom, always visible */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            {/* Quick Actions Dropdown */}
            <div className="mb-3">
              <Select value={selectedAction} onValueChange={handleQuickAction}>
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Quick actions..." />
                </SelectTrigger>
                <SelectContent>
                  {QUICK_ACTIONS.map((action) => (
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

            {/* Message Input Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your course..."
                className="w-full min-h-[80px] max-h-[120px] resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Command className="h-3 w-3" />
                    <span>⌘+Enter</span>
                  </span>
                  {messages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearConversation}
                      className="h-6 px-2 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
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
  );

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {content}
      </div>
    );
  }

  return content;
}