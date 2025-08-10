"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logger } from '@/lib/logger';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  MessageCircle, 
  Sparkles, 
  BookOpen,
  Send,
  RotateCcw,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContextAwareSAM } from './sam-context-manager';
import { SAMContextualIntelligence, type ContextualResponse } from '@/lib/sam-contextual-intelligence';

interface Message {
  id: string;
  type: 'user' | 'sam';
  content: string;
  timestamp: Date;
  contextData?: any;
  suggestions?: string[];
}

interface SAMContextualChatProps {
  className?: string;
  position?: 'floating' | 'sidebar' | 'embedded';
  theme?: 'teacher' | 'student' | 'default';
  autoGreet?: boolean;
}

export function SAMContextualChat({ 
  className, 
  position = 'embedded', 
  theme = 'teacher',
  autoGreet = true 
}: SAMContextualChatProps) {
  const { 
    currentContext, 
    isLoading, 
    getContextualGreeting, 
    getContextualCapabilities,
    updateContextWithFormData
  } = useContextAwareSAM();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextualResponse, setContextualResponse] = useState<ContextualResponse | null>(null);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Generate contextual response when context changes
  useEffect(() => {
    if (currentContext) {
      const response = SAMContextualIntelligence.generateContextualResponse(currentContext);
      setContextualResponse(response);

      // Auto-greet when context is loaded
      if (autoGreet && messages.length === 0) {
        const greetingMessage: Message = {
          id: Date.now().toString(),
          type: 'sam',
          content: response.greeting,
          timestamp: new Date(),
          contextData: currentContext,
          suggestions: response.suggestedActions.slice(0, 3)
        };
        setMessages([greetingMessage]);
      }
    }
  }, [currentContext, autoGreet, messages.length]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Update context with current form data
    updateContextWithFormData();

    // Simulate SAM thinking
    setTimeout(async () => {
      try {
        // Generate contextual response
        const contextualResponse = currentContext 
          ? SAMContextualIntelligence.generateContextualResponse(currentContext)
          : null;

        // Create contextually aware prompt
        const contextualPrompt = buildContextualPrompt(content, currentContext, contextualResponse);

        // Call SAM API
        const response = await fetch('/api/sam/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            context: currentContext,
            contextualPrompt,
            conversationHistory: messages.slice(-5)
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          const samMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'sam',
            content: result.response || result.message || "I understand! Let me help you with that.",
            timestamp: new Date(),
            contextData: currentContext,
            suggestions: result.suggestions || contextualResponse?.suggestedActions.slice(0, 3)
          };

          setMessages(prev => [...prev, samMessage]);
        } else {
          throw new Error('Failed to get SAM response');
        }
      } catch (error) {
        logger.error('Error sending message to SAM:', error);
        
        // Fallback contextual response
        const fallbackResponse = contextualResponse 
          ? `I understand you're asking about "${content}". ${contextualResponse.dataAwareness} How can I help you with this specifically?`
          : `I understand! Let me help you with that. Can you tell me more about what you're trying to accomplish?`;

        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'sam',
          content: fallbackResponse,
          timestamp: new Date(),
          contextData: currentContext
        };

        setMessages(prev => [...prev, fallbackMessage]);
      } finally {
        setIsTyping(false);
      }
    }, 1000);
  }, [currentContext, updateContextWithFormData, messages, contextualResponse]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const resetConversation = useCallback(() => {
    setMessages([]);
    if (autoGreet && contextualResponse) {
      const greetingMessage: Message = {
        id: Date.now().toString(),
        type: 'sam',
        content: contextualResponse.greeting,
        timestamp: new Date(),
        contextData: currentContext,
        suggestions: contextualResponse.suggestedActions.slice(0, 3)
      };
      setMessages([greetingMessage]);
    }
  }, [autoGreet, contextualResponse, currentContext]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }, [inputValue, sendMessage]);

  return (
    <Card className={cn(
      "flex flex-col h-full",
      position === 'floating' && "fixed bottom-4 right-4 w-96 h-[500px] shadow-xl z-50",
      position === 'sidebar' && "h-full",
      className
    )}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              theme === 'teacher' && "bg-purple-100 dark:bg-purple-900/30",
              theme === 'student' && "bg-blue-100 dark:bg-blue-900/30",
              theme === 'default' && "bg-gray-100 dark:bg-gray-900/30"
            )}>
              <Brain className={cn(
                "h-5 w-5",
                theme === 'teacher' && "text-purple-600 dark:text-purple-400",
                theme === 'student' && "text-blue-600 dark:text-blue-400",
                theme === 'default' && "text-gray-600 dark:text-gray-400"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">SAM AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">
                {currentContext ? `Context: ${currentContext.pageType}` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContext(!showContext)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Context Info Panel */}
        {showContext && currentContext && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              <span className="font-medium">Current Context</span>
            </div>
            <div className="space-y-1 text-xs">
              <div><strong>Page:</strong> {currentContext.pageType}</div>
              <div><strong>Entity:</strong> {currentContext.entityType || 'N/A'}</div>
              {currentContext.entityData && (
                <div><strong>Data:</strong> {currentContext.entityData.title || 'Available'}</div>
              )}
              <div><strong>Forms:</strong> {currentContext.formData ? Object.keys(currentContext.formData).length : 0} detected</div>
            </div>
          </div>
        )}

        {/* Contextual Capabilities */}
        {contextualResponse && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {contextualResponse.capabilities.slice(0, 3).map((capability, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.type === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Message suggestions */}
                  {message.type === 'sam' && message.suggestions && (
                    <div className="mt-2 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="mr-2 mb-1 h-6 text-xs"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">SAM is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {contextualResponse && contextualResponse.suggestedActions.length > 0 && (
          <div className="mt-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Quick Actions</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {contextualResponse.suggestedActions.slice(0, 4).map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleSuggestionClick(`Help me ${action.toLowerCase()}`)}
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask SAM anything..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Build contextual prompt for SAM API
 */
function buildContextualPrompt(
  userMessage: string, 
  context: any, 
  contextualResponse: ContextualResponse | null
): string {
  if (!context || !contextualResponse) {
    return `User question: "${userMessage}"`;
  }

  return `
Context: I'm currently on a ${context.pageType} page${context.entityType ? ` working with ${context.entityType}` : ''}.
${contextualResponse.dataAwareness}

Available capabilities: ${contextualResponse.capabilities.join(', ')}

User question: "${userMessage}"

Please provide a helpful, contextual response that:
1. Directly addresses their question
2. Uses the current context to provide specific guidance
3. Suggests practical next steps
4. Maintains an encouraging, expert tone
5. Offers specific examples when relevant

Keep the response conversational and actionable.`;
}