"use client";

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  Archive,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Improved TypeScript interfaces
interface ChatMessage {
  id: string;
  type: 'user' | 'sam';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  searchable?: string; // Combined content for search
}

interface SamAssistantProps {
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
  variant?: 'floating' | 'inline';
  className?: string;
}

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: string;
  ariaLabel: string;
  shortcut?: string;
}

// Contextual quick actions based on course state
const getContextualActions = (courseData: SamAssistantProps['courseData'], completionStatus: SamAssistantProps['completionStatus']): QuickAction[] => {
  const actions: QuickAction[] = [];
  
  // Show structure action if chapters are incomplete
  if (!completionStatus.chapters || courseData.chapters.length < 3) {
    actions.push({
      icon: BookOpen,
      label: "Course Structure",
      action: "structure",
      ariaLabel: "Analyze and improve course structure",
      shortcut: "Alt+S"
    });
  }
  
  // Show objectives action if learning objectives are incomplete
  if (!completionStatus.learningObj || courseData.whatYouWillLearn.length < 3) {
    actions.push({
      icon: Target,
      label: "Learning Goals",
      action: "objectives", 
      ariaLabel: "Review and enhance learning objectives",
      shortcut: "Alt+G"
    });
  }
  
  // Show analytics if course has content
  if (courseData.chapters.length > 0) {
    actions.push({
      icon: BarChart3,
      label: "Course Health", 
      action: "analytics",
      ariaLabel: "View course performance analytics",
      shortcut: "Alt+A"
    });
  }
  
  // Always show help
  actions.push({
    icon: HelpCircle,
    label: "Help",
    action: "help",
    ariaLabel: "Get help using SAM assistant",
    shortcut: "Alt+H"
  });
  
  return actions.slice(0, 4); // Maximum 4 actions
};

// Memoized message component for performance
const ChatMessageComponent = memo(({ message, onSuggestionClick, isLoading }: {
  message: ChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}) => (
  <div className={cn(
    "flex gap-3 mb-4",
    message.type === 'user' ? "justify-end" : "justify-start"
  )}>
    {message.type === 'sam' && (
      <Avatar className="h-8 w-8 border-2 border-white/20 flex-shrink-0 shadow-md backdrop-blur-sm">
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs font-bold">
          SAM
        </AvatarFallback>
      </Avatar>
    )}
    
    <div className={cn(
      "max-w-[85%] rounded-xl px-4 py-3 text-sm backdrop-blur-sm",
      message.type === 'user' 
        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg border border-white/20" 
        : message.isError
        ? "bg-red-50/80 border border-red-300/50 text-red-800 shadow-md backdrop-blur-sm"
        : "bg-white/70 dark:bg-slate-800/70 border border-white/20 text-gray-800 dark:text-gray-200 shadow-md backdrop-blur-md"
    )}>
      <div className="whitespace-pre-wrap break-words">{message.content}</div>
      
      {message.suggestions && message.suggestions.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-slate-600 mb-2">
            Quick actions:
          </div>
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
                disabled={isLoading}
                className="h-7 text-xs bg-white/50 dark:bg-slate-800/50 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-indigo-500/20 border-white/20 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-all duration-200 backdrop-blur-sm hover:shadow-sm"
                aria-label={`Suggestion: ${suggestion}`}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
    
    {message.type === 'user' && (
      <Avatar className="h-8 w-8 border-2 border-white/20 flex-shrink-0 shadow-md backdrop-blur-sm">
        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xs font-bold">
          YOU
        </AvatarFallback>
      </Avatar>
    )}
  </div>
));

ChatMessageComponent.displayName = 'ChatMessageComponent';

export function ImprovedSamAssistant({ 
  courseId, 
  courseData, 
  completionStatus,
  variant = 'floating',
  className 
}: SamAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationKey = `sam-conversation-${courseId}`;

  // Conversation persistence functions
  const saveConversation = useCallback((msgs: ChatMessage[]) => {
    try {
      localStorage.setItem(conversationKey, JSON.stringify(msgs));
    } catch (error: any) {
      logger.warn('Failed to save conversation:', error);
    }
  }, [conversationKey]);

  const loadConversation = useCallback((): ChatMessage[] => {
    try {
      const saved = localStorage.getItem(conversationKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error: any) {
      logger.warn('Failed to load conversation:', error);
    }
    return [];
  }, [conversationKey]);

  const clearConversation = useCallback(() => {
    localStorage.removeItem(conversationKey);
    setMessages([]);
    setFilteredMessages([]);
    toast.success('Conversation cleared');
  }, [conversationKey]);

  // Export conversation function
  const exportConversation = useCallback(() => {
    const conversationText = messages.map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.type.toUpperCase()}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sam-conversation-${courseData.title}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Conversation exported!');
  }, [messages, courseData.title]);

  // Search functionality
  const searchMessages = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredMessages(messages);
      return;
    }
    
    const filtered = messages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase()) ||
      msg.suggestions?.some(s => s.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredMessages(filtered);
  }, [messages]);

  // Remove character counting - no limits

  // Calculate health score
  const healthScore = useCallback(() => {
    const completionCount = Object.values(completionStatus).filter(Boolean).length;
    const baseScore = (completionCount / Object.keys(completionStatus).length) * 60;
    const contentScore = Math.min(courseData.chapters.length * 10, 40);
    return Math.round(baseScore + contentScore);
  }, [completionStatus, courseData.chapters.length]);

  // Get contextual actions
  const quickActions = getContextualActions(courseData, completionStatus);

  // Initialize with welcome message and load saved conversation
  useEffect(() => {
    // Always ensure we have initial state
    const initializeMessages = () => {
      const savedMessages = loadConversation();
      
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
        setFilteredMessages(savedMessages);
      } else {
        const score = healthScore();
        const welcomeMessage = `Hello! I'm SAM, your AI course assistant. I've analyzed "${courseData.title}" and here's what I found:

📊 Course Health: ${score}%
📚 Chapters: ${courseData.chapters.length}
🎯 Learning Objectives: ${courseData.whatYouWillLearn.length}
📝 Status: ${courseData.isPublished ? 'Published' : 'Draft'}

How can I help you improve your course today?`;

        const initialMessages = [{
          id: '1',
          type: 'sam' as const,
          content: welcomeMessage,
          timestamp: new Date(),
          searchable: welcomeMessage.toLowerCase(),
          suggestions: score < 80 ? [
            "Analyze what's missing",
            "Suggest improvements",
            "Help with structure"
          ] : [
            "Optimize performance",
            "Review analytics", 
            "Enhance engagement"
          ]
        }];
        
        setMessages(initialMessages);
        setFilteredMessages(initialMessages);
        saveConversation(initialMessages);
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(initializeMessages, 100);
    return () => clearTimeout(timer);
  }, [courseData.title, courseData.chapters.length, courseData.isPublished, courseData.whatYouWillLearn.length, healthScore, loadConversation, saveConversation]);

  // Update filtered messages when messages change
  useEffect(() => {
    if (!showSearch) {
      setFilteredMessages(messages);
    } else {
      searchMessages(searchQuery);
    }
  }, [messages, showSearch, searchQuery, searchMessages]);

  // Save conversation when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveConversation(messages);
    }
  }, [messages, saveConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  // Typing simulation
  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    if (inputValue.length > 0) {
      setIsTyping(true);
      typingTimer = setTimeout(() => setIsTyping(false), 1000);
    } else {
      setIsTyping(false);
    }
    return () => clearTimeout(typingTimer);
  }, [inputValue]);

  const sendMessage = useCallback(async (content: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      searchable: messageContent.toLowerCase()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simplified context
      const context = {
        courseId: courseData.id,
        title: courseData.title,
        chaptersCount: courseData.chapters.length,
        objectivesCount: courseData.whatYouWillLearn.length,
        isPublished: courseData.isPublished,
        healthScore: healthScore(),
        completionStatus
      };
      
      const response = await fetch('/api/sam/unified-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          context,
          conversationHistory: messages.slice(-5) // Increased to last 5 messages
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      
      const samMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: result.response,
        timestamp: new Date(),
        searchable: result.response.toLowerCase(),
        suggestions: result.suggestions || []
      };
      
      setMessages(prev => [...prev, samMessage]);
      
    } catch (error: any) {
      logger.error('SAM Error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: "I'm having trouble connecting right now. Please check your internet connection and try again. If the problem persists, try refreshing the page.",
        timestamp: new Date(),
        searchable: "error connection trouble",
        isError: true,
        suggestions: ["Try again", "Refresh page", "Contact support"]
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to connect to SAM assistant');
    } finally {
      setIsLoading(false);
    }
  }, [courseData.id, courseData.title, courseData.chapters.length, courseData.whatYouWillLearn.length, courseData.isPublished, healthScore, inputValue, messages, completionStatus]);

  const handleQuickAction = useCallback(async (action: string) => {
    const actionPrompts = {
      structure: `Analyze my course structure with ${courseData.chapters.length} chapters. Suggest improvements for better learning flow.`,
      objectives: `Review my ${courseData.whatYouWillLearn.length} learning objectives. How can I make them more effective?`,
      analytics: `Provide insights on my course health score of ${healthScore()}%. What should I focus on?`,
      help: `Show me how to use SAM effectively. What are the most useful features for course creation?`
    };
    
    const prompt = actionPrompts[action as keyof typeof actionPrompts] || `Help me with ${action}`;
    await sendMessage(prompt);
  }, [courseData.chapters.length, courseData.whatYouWillLearn.length, healthScore, sendMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        if (variant === 'floating') {
          setIsOpen(false);
        } else {
          setIsMinimized(true);
        }
      }
      
      if (e.altKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleQuickAction('structure');
            break;
          case 'g':
            e.preventDefault();
            handleQuickAction('objectives');
            break;
          case 'a':
            e.preventDefault();
            handleQuickAction('analytics');
            break;
          case 'h':
            e.preventDefault();
            handleQuickAction('help');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, variant, handleQuickAction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Floating variant toggle button
  if (variant === 'floating' && !isOpen) {
    const score = healthScore();
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Glass Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-indigo-400/30 rounded-full blur-xl animate-pulse" />
          
          <Button
            onClick={() => setIsOpen(true)}
            className={cn(
              "relative h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110",
              "backdrop-blur-md bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600",
              "border border-white/20 hover:border-white/30"
            )}
            aria-label="Open SAM AI Assistant"
          >
            <Brain className="h-7 w-7 text-white drop-shadow-sm" />
            {score < 80 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-400/80 to-pink-400/80 rounded-full animate-pulse border-2 border-white/50 shadow-md backdrop-blur-sm" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Main component JSX
  const content = (
    <Card className={cn(
      "relative overflow-hidden",
      "backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl",
      variant === 'floating' && "w-full max-w-xl h-[75vh] max-h-[75vh]",
      variant === 'inline' && "w-full",
      className
    )}>
      {/* Glass Background Orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl transform translate-x-16 -translate-y-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-xl" />
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <div className="p-1.5 md:p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg flex-shrink-0">
              <Brain className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent text-sm md:text-base leading-tight">
                SAM Assistant
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium leading-tight whitespace-nowrap">Course Health: {healthScore()}%</p>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0 ml-1">
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchQuery('');
                  setFilteredMessages(messages);
                }
              }}
              className="h-7 w-7 md:h-8 md:w-8 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border-white/20 text-purple-600 hover:text-purple-700 transition-all duration-200 backdrop-blur-sm"
              aria-label="Toggle search"
            >
              <Search className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            {/* Export Conversation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={exportConversation}
              disabled={messages.length <= 1}
              className="h-7 w-7 md:h-8 md:w-8 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border-white/20 text-indigo-600 hover:text-indigo-700 transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
              aria-label="Export conversation"
            >
              <Download className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            {/* Clear Conversation */}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              disabled={messages.length <= 1}
              className="h-7 w-7 md:h-8 md:w-8 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-red-50/70 dark:hover:bg-red-900/30 border-white/20 text-red-500 hover:text-red-600 transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
              aria-label="Clear conversation"
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            {variant === 'floating' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 md:h-8 md:w-8 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border-white/20 text-gray-600 hover:text-gray-700 transition-all duration-200 backdrop-blur-sm"
                  aria-label={isMinimized ? "Expand assistant" : "Minimize assistant"}
                >
                  {isMinimized ? <Maximize2 className="h-3 w-3 md:h-4 md:w-4" /> : <Minimize2 className="h-3 w-3 md:h-4 md:w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 md:h-8 md:w-8 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-red-50/70 dark:hover:bg-red-900/30 border-white/20 text-gray-600 hover:text-red-600 transition-all duration-200 backdrop-blur-sm"
                  aria-label="Close assistant"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </>
            )}
            {variant === 'inline' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 md:h-8 md:w-8 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border-white/20 text-gray-600 hover:text-gray-700 transition-all duration-200 backdrop-blur-sm"
                aria-label={isMinimized ? "Expand assistant" : "Minimize assistant"}
              >
                {isMinimized ? <ChevronDown className="h-3 w-3 md:h-4 md:w-4" /> : <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />}
              </Button>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        {showSearch && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchMessages(e.target.value);
                }}
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-white/50 dark:bg-slate-900/50 border-white/20 rounded-lg focus:border-purple-300 focus:ring-1 focus:ring-purple-200/50 transition-all backdrop-blur-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    searchMessages('');
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 bg-white/50 hover:bg-white/70 text-gray-400 hover:text-gray-600 backdrop-blur-sm"
                >
                  <X className="h-2 w-2" />
                </Button>
              )}
            </div>
            {filteredMessages.length !== messages.length && (
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                {filteredMessages.length} of {messages.length}
              </p>
            )}
          </div>
        )}
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-full">
          {/* Quick Actions */}
          <div className="relative z-20 p-2 border-b border-white/20 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.action}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.action)}
                    disabled={isLoading}
                    className="h-6 text-xs bg-white/50 dark:bg-slate-800/50 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-indigo-500/20 border-white/20 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
                    aria-label={action.ariaLabel}
                    title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    <span className="truncate text-xs">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea 
            className={cn(
              variant === 'floating' ? "h-[calc(75vh-200px)]" : "h-96",
              "relative z-10 p-3 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm flex-1"
            )}
            role="log"
            aria-label="Chat conversation with SAM assistant"
            aria-live="polite"
          >
            {filteredMessages.length === 0 && showSearch ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No messages found</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    searchMessages('');
                  }}
                  className="mt-2 text-xs"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                  isLoading={isLoading}
                />
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start gap-3 mb-4">
                <Avatar className="h-8 w-8 border-2 border-white/20 shadow-md backdrop-blur-sm">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-xs font-bold">
                    SAM
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white/70 dark:bg-slate-800/70 border border-white/20 px-4 py-3 rounded-xl shadow-md backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">SAM is analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area - Always Visible */}
          <div className="relative z-20 p-4 border-t-2 border-gray-200 bg-white shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Textarea
                  ref={inputRef}
                  value={inputValue || ''}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="w-full min-h-[80px] max-h-[150px] resize-none bg-white border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 text-sm p-3 rounded-md shadow-sm transition-colors"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  aria-label="Type your message to SAM"
                  placeholder="Ask SAM about your course..."
                  style={{ display: 'block' }}
                />
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-purple-600/70 dark:text-purple-400/70">
                    <Keyboard className="h-3 w-3" />
                    <span className="text-xs">Cmd+Enter</span>
                  </div>
                  {messages.length > 1 && (
                    <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                      {messages.length - 1} messages
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white hover:shadow-lg border border-white/20 transition-all duration-200 backdrop-blur-sm"
                  aria-label="Send message"
                >
                  <Send className="h-3 w-3 mr-1.5" />
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
            
            {/* Only show typing indicator */}
            {isTyping && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-600/60 dark:text-purple-400/60">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full animate-pulse" />
                <span className="text-xs">Preparing...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );

  // Wrap floating variant in fixed positioning
  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {content}
      </div>
    );
  }

  return content;
}