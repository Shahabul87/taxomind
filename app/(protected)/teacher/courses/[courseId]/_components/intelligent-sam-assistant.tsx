"use client";

import React, { useState, useCallback, useRef, useEffect, memo, useContext, createContext } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';
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
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Form interaction context
interface FormInteractionContext {
  updateLearningObjectives: (objectives: string[]) => void;
  updateChapters: (chapters: any[]) => void;
  updateCourseTitle: (title: string) => void;
  updateCourseDescription: (description: string) => void;
  currentFormData: any;
}

const FormContext = createContext<FormInteractionContext | null>(null);

interface ChatMessage {
  id: string;
  type: 'user' | 'sam' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  isError?: boolean;
  action?: {
    type: 'form_update' | 'content_generated';
    details: any;
  };
}

interface IntelligentSamAssistantProps {
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
      description: string | null;
      position: number;
      isPublished: boolean;
      isFree: boolean;
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
  // Form update callbacks
  onUpdateLearningObjectives?: (objectives: string[]) => void;
  onUpdateChapters?: (chapters: any[]) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateDescription?: (description: string) => void;
  onDeleteChapters?: (chapterIds: string[]) => void;
  variant?: 'floating' | 'embedded';
  className?: string;
}

// Bloom's Taxonomy levels with action verbs
const BLOOMS_LEVELS = {
  remember: {
    level: 1,
    name: "Remember",
    verbs: ["identify", "recognize", "recall", "list", "describe", "name", "find", "match"]
  },
  understand: {
    level: 2,
    name: "Understand",
    verbs: ["explain", "summarize", "classify", "discuss", "interpret", "paraphrase", "compare"]
  },
  apply: {
    level: 3,
    name: "Apply",
    verbs: ["implement", "use", "execute", "solve", "demonstrate", "operate", "carry out"]
  },
  analyze: {
    level: 4,
    name: "Analyze",
    verbs: ["differentiate", "organize", "attribute", "compare", "deconstruct", "examine", "test"]
  },
  evaluate: {
    level: 5,
    name: "Evaluate",
    verbs: ["judge", "critique", "justify", "defend", "appraise", "argue", "assess"]
  },
  create: {
    level: 6,
    name: "Create",
    verbs: ["design", "construct", "develop", "formulate", "build", "produce", "plan"]
  }
};

// Quick action options
const INTELLIGENT_ACTIONS = [
  { value: "objectives", label: "Generate Learning Objectives", icon: "🎯" },
  { value: "chapters", label: "Generate Course Chapters", icon: "📚" },
  { value: "delete", label: "Delete Chapters", icon: "🗑️" },
  { value: "improve", label: "Improve Course Content", icon: "✨" },
  { value: "analyze", label: "Analyze Course Structure", icon: "🔍" },
  { value: "blooms", label: "Apply Bloom's Taxonomy", icon: "🧠" },
  { value: "help", label: "How SAM Works", icon: "❓" }
];

// Message component
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
    {message.type !== 'user' && (
      <Avatar className="h-9 w-9 border-2 border-indigo-200 dark:border-indigo-700 shadow-md flex-shrink-0">
        <AvatarFallback className={cn(
          "text-white text-xs font-bold",
          message.type === 'sam' ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gray-500"
        )}>
          {message.type === 'sam' ? 'SAM' : 'SYS'}
        </AvatarFallback>
      </Avatar>
    )}
    
    <div className={cn(
      "max-w-[80%] rounded-2xl px-4 py-3 shadow-md",
      message.type === 'user' 
        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" 
        : message.type === 'system'
        ? "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
        : message.isError
        ? "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100"
        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    )}>
      <div className="text-sm whitespace-pre-wrap break-words">
        {message.content}
      </div>
      
      {message.action && (
        <div className="mt-3 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Action completed: {message.action.type}</span>
          </div>
        </div>
      )}
      
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
));

MessageBubble.displayName = 'MessageBubble';

export function IntelligentSamAssistant({ 
  courseId, 
  courseData, 
  completionStatus,
  onUpdateLearningObjectives,
  onUpdateChapters,
  onUpdateTitle,
  onUpdateDescription,
  onDeleteChapters,
  variant = 'floating',
  className 
}: IntelligentSamAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [courseContext, setCourseContext] = useState<any>({});
  const [chapterMemory, setChapterMemory] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build comprehensive context
  const buildCourseContext = useCallback(() => {
    const completionCount = Object.values(completionStatus).filter(Boolean).length;
    const completionRate = (completionCount / Object.keys(completionStatus).length) * 100;
    
    return {
      courseId: courseData.id,
      title: courseData.title || "Untitled Course",
      description: courseData.description || "",
      category: courseData.category?.name || "Uncategorized",
      isPublished: courseData.isPublished,
      
      // Learning objectives
      learningObjectives: courseData.whatYouWillLearn || [],
      objectiveCount: courseData.whatYouWillLearn?.length || 0,
      hasObjectives: (courseData.whatYouWillLearn?.length || 0) > 0,
      
      // Course structure
      chapters: courseData.chapters || [],
      chapterCount: courseData.chapters?.length || 0,
      totalSections: courseData.chapters?.reduce((sum, ch) => sum + (ch.sections?.length || 0), 0) || 0,
      
      // Completion metrics
      completionStatus,
      completionRate: Math.round(completionRate),
      healthScore: Math.round(completionRate),
      
      // Form capabilities
      canUpdateObjectives: !!onUpdateLearningObjectives,
      canUpdateChapters: !!onUpdateChapters,
      canUpdateTitle: !!onUpdateTitle,
      canUpdateDescription: !!onUpdateDescription,
      canDeleteChapters: !!onDeleteChapters,
      
      // Bloom's taxonomy distribution
      bloomsDistribution: analyzeBloomsDistribution(courseData.whatYouWillLearn || [])
    };
  }, [courseData, completionStatus, onUpdateLearningObjectives, onUpdateChapters, onUpdateTitle, onUpdateDescription, onDeleteChapters]);

  // Analyze Bloom's taxonomy in objectives
  const analyzeBloomsDistribution = (objectives: string[]) => {
    const distribution: Record<string, number> = {};
    
    objectives.forEach(objective => {
      const lowerObj = objective.toLowerCase();
      Object.entries(BLOOMS_LEVELS).forEach(([level, data]) => {
        if (data.verbs.some(verb => lowerObj.includes(verb))) {
          distribution[level] = (distribution[level] || 0) + 1;
        }
      });
    });
    
    return distribution;
  };

  // Initialize with intelligent welcome
  useEffect(() => {
    if (messages.length === 0) {
      const context = buildCourseContext();
      const welcomeMessage: ChatMessage = {
        id: '1',
        type: 'sam',
        content: `Hello! I'm SAM, your intelligent course assistant. I have full awareness of your course "${context.title}".

📊 **Course Overview:**
• Health Score: ${context.healthScore}%
• Chapters: ${context.chapterCount}
• Learning Objectives: ${context.objectiveCount}
• Total Sections: ${context.totalSections}

I can help you:
• Generate learning objectives based on Bloom's taxonomy
• Create course chapters with proper cognitive progression
• Analyze and improve your course structure
• Update forms directly with generated content

What would you like me to help you with today?`,
        timestamp: new Date(),
        suggestions: [
          "Generate 10 learning objectives",
          "Create 5 course chapters",
          "Analyze my course structure",
          "Improve my learning objectives"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [buildCourseContext, messages.length]);

  // Update course context when data changes
  useEffect(() => {
    setCourseContext(buildCourseContext());
  }, [buildCourseContext]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle form actions
  const handleFormAction = useCallback(async (action: any) => {
    try {
      switch (action.type) {
        case 'update_objectives':
          if (onUpdateLearningObjectives && action.data.objectives) {
            onUpdateLearningObjectives(action.data.objectives);
            toast.success('Learning objectives updated successfully!');
            
            // Add system message
            const systemMsg: ChatMessage = {
              id: Date.now().toString(),
              type: 'system',
              content: `✅ Updated ${action.data.objectives.length} learning objectives in the form.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, systemMsg]);
          }
          break;
          
        case 'update_chapters':
          if (onUpdateChapters && action.data.chapters) {

            onUpdateChapters(action.data.chapters);
            
            // Store chapter descriptions in memory
            const newMemory = { ...chapterMemory };
            action.data.chapters.forEach((chapter: any) => {
              if (chapter.description) {
                newMemory[chapter.title] = chapter.description;
              }
            });
            setChapterMemory(newMemory);
            
            toast.success('Chapters generation started!');
            
            const systemMsg: ChatMessage = {
              id: Date.now().toString(),
              type: 'system',
              content: `✅ Started creating ${action.data.chapters.length} new chapters. Chapter descriptions stored in memory for future reference.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, systemMsg]);
          } else {
}
          break;
          
        case 'update_title':
          if (onUpdateTitle && action.data.title) {
            onUpdateTitle(action.data.title);
            toast.success('Course title updated!');
          }
          break;
          
        case 'update_description':
          if (onUpdateDescription && action.data.description) {
            onUpdateDescription(action.data.description);
            toast.success('Course description updated!');
          }
          break;
          
        case 'delete_chapters':
          if (onDeleteChapters && action.data.chapterIds) {
            onDeleteChapters(action.data.chapterIds);
            toast.success(`${action.data.chapterIds.length} chapters deleted!`);
            
            const systemMsg: ChatMessage = {
              id: Date.now().toString(),
              type: 'system',
              content: `✅ Deleted ${action.data.chapterIds.length} chapters from the course.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, systemMsg]);
          }
          break;
      }
    } catch (error: any) {
      logger.error('Form action error:', error);
      toast.error('Failed to update form');
    }
  }, [onUpdateLearningObjectives, onUpdateChapters, onUpdateTitle, onUpdateDescription, onDeleteChapters, setChapterMemory, chapterMemory]);

  // Main message handler with intelligent processing
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
      // Detect intent and required action
      const intent = detectIntent(messageContent);
      
      const response = await fetch('/api/sam/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          pageContext: {
            type: 'course-detail',
            path: `/teacher/courses/${courseContext.courseId}`,
            entityId: courseContext.courseId,
            entityType: 'course',
            entityData: {
              title: courseContext.title,
              description: courseContext.description,
              isPublished: courseContext.isPublished,
              chapterCount: courseContext.chapterCount,
              publishedChapters: courseData.chapters?.filter(ch => ch.isPublished).length ?? 0,
              sectionCount: courseContext.totalSections,
              objectiveCount: courseContext.objectiveCount,
              healthScore: courseContext.healthScore,
              completionPercentage: courseContext.completionRate,
              bloomsDistribution: courseContext.bloomsDistribution,
            },
            capabilities: [
              ...(courseContext.canUpdateObjectives ? ['update_objectives'] : []),
              ...(courseContext.canUpdateChapters ? ['update_chapters'] : []),
              ...(courseContext.canUpdateTitle ? ['update_title'] : []),
              ...(courseContext.canUpdateDescription ? ['update_description'] : []),
              ...(courseContext.canDeleteChapters ? ['delete_chapters'] : []),
            ],
          },
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();

      // Map unified response: suggestions may be SAMSuggestion objects
      const rawSuggestions: unknown[] = result.suggestions ?? [];
      const mappedSuggestions = rawSuggestions.map((s: unknown) =>
        typeof s === 'string' ? s : (s as { label?: string }).label ?? ''
      ).filter(Boolean);

      const samMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: result.response ?? '',
        timestamp: new Date(),
        suggestions: mappedSuggestions,
      };
      
      setMessages(prev => [...prev, samMessage]);
      
    } catch (error: any) {
      logger.error('SAM Error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: "I apologize, but I encountered an error. Please try again or rephrase your request.",
        timestamp: new Date(),
        isError: true,
        suggestions: ["Try again", "Rephrase request"]
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process request');
    } finally {
      setIsLoading(false);
    }
  }, [courseContext, courseData.chapters, messages]);

  // Detect user intent
  const detectIntent = (message: string): string => {
    const lower = message.toLowerCase();
    
    if (lower.includes('objective') && (lower.includes('generate') || lower.includes('create'))) {
      return 'generate_objectives';
    }
    if (lower.includes('chapter') && (lower.includes('generate') || lower.includes('create'))) {
      return 'generate_chapters';
    }
    if (lower.includes('chapter') && (lower.includes('delete') || lower.includes('remove') || lower.includes('clear'))) {
      return 'delete_chapters';
    }
    if (lower.includes('analyze') || lower.includes('review')) {
      return 'analyze_course';
    }
    if (lower.includes('bloom') || lower.includes('taxonomy')) {
      return 'blooms_analysis';
    }
    if (lower.includes('improve') || lower.includes('enhance')) {
      return 'improve_content';
    }
    
    return 'general_help';
  };

  // Quick action handler
  const handleQuickAction = useCallback((action: string) => {
    const actionPrompts = {
      objectives: `Generate 10 learning objectives for my course "${courseContext.title}" using Bloom's taxonomy. Make sure to cover all cognitive levels from Remember to Create.`,
      chapters: `Generate 5 well-structured chapters for my course "${courseContext.title}" based on the learning objectives. Each chapter should build on the previous one and follow the format "Chapter X: Title".`,
      delete: `Delete chapters from my course. I have ${courseContext.chapterCount} chapters: ${courseContext.chapters.map((ch: any) => ch.title).join(', ')}. Which ones should I remove?`,
      improve: `Analyze my current course content and suggest specific improvements for better learning outcomes.`,
      analyze: `Provide a comprehensive analysis of my course structure, identifying strengths and areas for improvement.`,
      blooms: `Analyze the Bloom's taxonomy distribution in my course and suggest how to improve cognitive progression.`,
      help: `Explain how you can help me build a better course with your intelligent features.`
    };
    
    const prompt = actionPrompts[action as keyof typeof actionPrompts];
    if (prompt) {
      sendMessage(prompt);
    }
  }, [courseContext.title, courseContext.chapterCount, courseContext.chapters, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Calculate metrics
  const metrics = {
    healthScore: courseContext.healthScore || 0,
    status: courseContext.healthScore >= 80 ? 'Excellent' : courseContext.healthScore >= 60 ? 'Good' : 'Needs Work',
    color: courseContext.healthScore >= 80 ? 'text-emerald-600' : courseContext.healthScore >= 60 ? 'text-amber-600' : 'text-red-600'
  };

  // Floating toggle button
  if (variant === 'floating' && !isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
          
          <Button
            onClick={() => setIsOpen(true)}
            className="relative h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0"
            aria-label="Open Intelligent SAM Assistant"
          >
            <Brain className="h-7 w-7 text-white" />
            {metrics.healthScore < 80 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-white" />
                </span>
              </span>
            )}
          </Button>
          
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              Intelligent SAM • I can update your forms!
            </div>
          </div>
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
      variant === 'floating' && "w-[420px] h-[640px]",
      variant === 'embedded' && "w-full h-full min-h-[500px]",
      className
    )}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                Intelligent SAM
                <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className={cn("flex items-center gap-1", metrics.color)}>
                  <Activity className="h-3 w-3" />
                  Health: {metrics.healthScore}%
                </span>
                <span className="text-indigo-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Form-aware
                </span>
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
          {/* Messages Area */}
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
                      <span className="text-sm text-gray-600">Processing your request...</span>
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
                  <SelectValue placeholder="Quick actions..." />
                </SelectTrigger>
                <SelectContent>
                  {INTELLIGENT_ACTIONS.map((action) => (
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
                placeholder="Ask me to generate content, analyze your course, or update forms..."
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
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Command className="h-3 w-3" />
                  <span>⌘+Enter to send</span>
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
