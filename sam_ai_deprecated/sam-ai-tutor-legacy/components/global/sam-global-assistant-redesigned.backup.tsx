"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/providers/theme-provider';
import { useSAMGlobal } from '@/sam/components/global/sam-global-provider';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  MessageCircle,
  X,
  Sparkles,
  Send,
  Loader2,
  Zap,
  Lightbulb,
  Command,
  ArrowUp,
  MoreHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface SAMGlobalAssistantProps {
  className?: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

export function SAMGlobalAssistantRedesigned({ className }: SAMGlobalAssistantProps) {
  const { data: session } = useSession();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  const {
    isOpen,
    setIsOpen,
    tutorMode,
    shouldShow,
  } = useSAMGlobal();

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [contextChips, setContextChips] = useState<Array<{label: string, icon: any}>>([]);

  const dragRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mark component as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize window position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultX = window.innerWidth - 470;
      const defaultY = window.innerHeight - 680;
      setWindowPosition({
        x: Math.max(20, defaultX),
        y: Math.max(20, defaultY),
      });
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Smart context detection
  useEffect(() => {
    if (!isOpen) return;

    const detectContext = () => {
      const chips = [];
      const pathname = window.location.pathname;

      if (pathname.includes('/courses/')) {
        chips.push({ label: 'Course Editor', icon: '📚' });
      }
      if (pathname.includes('/teacher/')) {
        chips.push({ label: 'Teacher Mode', icon: '👨‍🏫' });
      }
      if (document.querySelectorAll('form').length > 0) {
        chips.push({ label: `${document.querySelectorAll('form').length} Forms`, icon: '📝' });
      }

      setContextChips(chips);
    };

    detectContext();
    const interval = setInterval(detectContext, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Generate smart suggestions based on context
  useEffect(() => {
    if (!isOpen || messages.length > 0) return;

    const suggestions = [];
    if (tutorMode === 'teacher') {
      suggestions.push(
        'Generate course outline',
        'Create quiz questions',
        'Analyze student engagement'
      );
    } else {
      suggestions.push(
        'Explain this concept',
        'Practice questions',
        'Study tips'
      );
    }

    setSmartSuggestions(suggestions);
  }, [isOpen, tutorMode, messages.length]);

  // Handle drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sam-drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - windowPosition.x,
        y: e.clientY - windowPosition.y,
      });
    }
  }, [windowPosition]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - 450;
      const maxY = window.innerHeight - 650;

      setWindowPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);
    setSmartSuggestions([]);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1500));

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you&apos;re asking about "${currentInput}". Let me help you with that...`,
        isUser: false,
        timestamp: new Date(),
        suggestions: ['Tell me more', 'Show example', 'Next step']
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      logger.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Don't render checks
  if (!session || !shouldShow || !mounted) return null;

  return (
    <div className={cn("sam-global-assistant-redesigned", className)}>
      {/* Modern Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Button
            onClick={() => setIsOpen(true)}
            className={cn(
              "h-14 w-14 rounded-full shadow-xl",
              "transition-all duration-300 hover:scale-110 active:scale-95",
              "border-0",
              isDark
                ? "bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                : "bg-gradient-to-tr from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400"
            )}
            aria-label="Open SAM AI Assistant"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {/* Modern Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          <div
            ref={dragRef}
            onMouseDown={handleMouseDown}
            style={{
              position: 'fixed',
              left: `${windowPosition.x}px`,
              top: `${windowPosition.y}px`,
              pointerEvents: 'auto',
            }}
            className={cn(
              "rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl",
              "w-[450px] h-[650px]",
              "border transition-all duration-300",
              isDark
                ? "bg-gray-900/95 border-gray-700/50"
                : "bg-white/95 border-gray-200/50"
            )}
          >
            {/* Minimal Header */}
            <div
              className={cn(
                "sam-drag-handle flex items-center justify-between px-4 py-3 cursor-move",
                "border-b backdrop-blur-sm",
                isDark ? "border-gray-800/50" : "border-gray-200/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  isDark
                    ? "bg-gradient-to-tr from-violet-600 to-indigo-600"
                    : "bg-gradient-to-tr from-violet-500 to-indigo-500"
                )}>
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className={cn(
                    "font-semibold text-sm",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    SAM
                  </h3>
                  <p className={cn(
                    "text-xs",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    AI Assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className={cn(
                    "h-8 w-8 p-0 rounded-lg",
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  )}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "h-8 w-8 p-0 rounded-lg",
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  )}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Context Chips - Smart and Minimal */}
                {contextChips.length > 0 && (
                  <div className="px-4 py-2 flex items-center gap-2 flex-wrap border-b border-gray-200/50 dark:border-gray-800/50">
                    {contextChips.map((chip, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className={cn(
                          "text-xs font-normal px-2 py-1 rounded-full",
                          isDark
                            ? "bg-gray-800 text-gray-300 border-gray-700"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        )}
                      >
                        <span className="mr-1">{chip.icon}</span>
                        {chip.label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Messages Area - Chat First */}
                <ScrollArea className="h-[calc(100%-200px)] px-4 py-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-12">
                        <div className={cn(
                          "h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
                          isDark
                            ? "bg-gradient-to-tr from-violet-600/20 to-indigo-600/20"
                            : "bg-gradient-to-tr from-violet-100 to-indigo-100"
                        )}>
                          <Sparkles className={cn(
                            "h-8 w-8",
                            isDark ? "text-violet-400" : "text-violet-600"
                          )} />
                        </div>
                        <h3 className={cn(
                          "text-lg font-semibold mb-2",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          Hi! I&apos;m SAM
                        </h3>
                        <p className={cn(
                          "text-sm mb-6",
                          isDark ? "text-gray-400" : "text-gray-600"
                        )}>
                          Your AI learning assistant. How can I help?
                        </p>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.isUser ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <Avatar className={cn(
                          "h-8 w-8 shrink-0",
                          message.isUser && (isDark
                            ? "bg-gradient-to-tr from-blue-600 to-cyan-600"
                            : "bg-gradient-to-tr from-blue-500 to-cyan-500")
                        )}>
                          <AvatarFallback className={cn(
                            message.isUser ? "text-white" : "",
                            !message.isUser && (isDark ? "bg-gray-800" : "bg-gray-100")
                          )}>
                            {message.isUser ? (
                              session?.user?.name?.[0] || 'U'
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div className={cn(
                          "flex-1 max-w-[80%]",
                          message.isUser && "flex justify-end"
                        )}>
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 text-sm",
                              message.isUser
                                ? isDark
                                  ? "bg-gradient-to-tr from-blue-600 to-cyan-600 text-white"
                                  : "bg-gradient-to-tr from-blue-500 to-cyan-500 text-white"
                                : isDark
                                  ? "bg-gray-800 text-gray-100"
                                  : "bg-gray-100 text-gray-900"
                            )}
                          >
                            {message.content}
                          </div>

                          {/* Inline Suggestions */}
                          {message.suggestions && !message.isUser && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {message.suggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className={cn(
                                    "text-xs px-3 py-1.5 rounded-full transition-colors",
                                    "border",
                                    isDark
                                      ? "border-gray-700 hover:bg-gray-800 text-gray-300"
                                      : "border-gray-200 hover:bg-gray-100 text-gray-700"
                                  )}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3">
                        <Avatar className={cn(
                          "h-8 w-8 shrink-0",
                          isDark ? "bg-gray-800" : "bg-gray-100"
                        )}>
                          <AvatarFallback>
                            <Sparkles className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "rounded-2xl px-4 py-3",
                          isDark ? "bg-gray-800" : "bg-gray-100"
                        )}>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Smart Suggestions - Only when no messages */}
                {smartSuggestions.length > 0 && messages.length === 0 && (
                  <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
                    {smartSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          "text-xs px-4 py-2 rounded-full whitespace-nowrap",
                          "border transition-all hover:scale-105",
                          isDark
                            ? "border-violet-600/50 bg-violet-600/10 text-violet-300 hover:bg-violet-600/20"
                            : "border-violet-500/50 bg-violet-50 text-violet-700 hover:bg-violet-100"
                        )}
                      >
                        <Lightbulb className="h-3 w-3 inline mr-1" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Large Input Area - Modern Design */}
                <div className={cn(
                  "px-4 py-3 border-t",
                  isDark ? "border-gray-800/50" : "border-gray-200/50"
                )}>
                  <div className={cn(
                    "relative rounded-2xl border transition-all",
                    "focus-within:ring-2 focus-within:ring-offset-0",
                    isDark
                      ? "border-gray-700 bg-gray-800 focus-within:border-violet-600 focus-within:ring-violet-600/20"
                      : "border-gray-200 bg-white focus-within:border-violet-500 focus-within:ring-violet-500/20"
                  )}>
                    <Textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me anything..."
                      className={cn(
                        "min-h-[80px] resize-none border-0 bg-transparent px-4 py-3",
                        "text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                        isDark ? "text-white" : "text-gray-900"
                      )}
                    />

                    <div className="flex items-center justify-between px-3 pb-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Command className="h-3 w-3" />
                        <span>Enter to send</span>
                      </div>

                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        size="sm"
                        className={cn(
                          "h-8 w-8 rounded-full p-0",
                          "transition-all duration-200",
                          isDark
                            ? "bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                            : "bg-gradient-to-tr from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400",
                          !inputValue.trim() && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <ArrowUp className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Minimized State */}
            {isMinimized && (
              <div className="h-[calc(100%-64px)] flex items-center justify-center">
                <div className="text-center">
                  <div className={cn(
                    "h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center",
                    isDark
                      ? "bg-gradient-to-tr from-violet-600 to-indigo-600"
                      : "bg-gradient-to-tr from-violet-500 to-indigo-500"
                  )}>
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <p className={cn(
                    "text-sm",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    Ready to assist
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
