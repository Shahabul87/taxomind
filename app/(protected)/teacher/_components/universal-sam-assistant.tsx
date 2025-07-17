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
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUniversalSam } from './universal-sam-provider';
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
    type: 'form_populate' | 'form_submit' | 'navigation' | 'page_action' | 'data_analysis';
    details: any;
  };
}

export function UniversalSamAssistant() {
  const { pageData, refreshPageData, populateForm, submitForm, executeAction, getFormData, isReady } = useUniversalSam();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Generate contextual welcome message
  const generateWelcomeMessage = useCallback((): ChatMessage => {
    const formCount = pageData.forms.length;
    const linkCount = pageData.links.length;
    const buttonCount = pageData.buttons.length;
    const dataCount = pageData.dataElements.length;

    return {
      id: '1',
      type: 'sam',
      content: `🧠 **Universal SAM Assistant**

I'm now fully aware of "${pageData.title}" page and can help you with everything here!

**📊 Page Analysis:**
• **${formCount} forms** detected ${formCount > 0 ? '✅' : '❌'}
• **${linkCount} links** found
• **${buttonCount} interactive buttons**
• **${dataCount} data elements** (tables, lists, cards)

**🎯 Current Location:** ${pageData.breadcrumbs.join(' → ')}

**✨ What I Can Do:**
• **Form Intelligence:** Detect, populate, and submit any form
• **Content Generation:** Create relevant content for any field
• **Page Navigation:** Navigate to any link or section
• **Data Analysis:** Understand and work with page data
• **Action Execution:** Click buttons, trigger actions

**📝 Detected Forms:**
${pageData.forms.map(form => `• ${form.dataForm || form.id} (${form.fields.length} fields)`).join('\n')}

What would you like me to help you with?`,
      timestamp: new Date(),
      suggestions: [
        'Analyze this page',
        'Show me available forms', 
        'Generate content for forms',
        'Help with navigation',
        'Explain page features'
      ]
    };
  }, [pageData]);

  // Initialize welcome message when page data is ready
  useEffect(() => {
    if (isReady && messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage();
      setMessages([welcomeMessage]);
    }
  }, [isReady, generateWelcomeMessage, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle different types of actions
  const handleAction = useCallback(async (action: any) => {
    try {
      switch (action.type) {
        case 'form_populate':
          if (action.details.formId && action.details.data) {
            const success = await populateForm(action.details.formId, action.details.data);
            if (success) {
              toast.success(`Form "${action.details.formId}" populated successfully`);
            } else {
              toast.error(`Failed to populate form "${action.details.formId}"`);
            }
          }
          break;
          
        case 'form_submit':
          if (action.details.formId) {
            const success = await submitForm(action.details.formId);
            if (success) {
              toast.success(`Form "${action.details.formId}" submitted successfully`);
            } else {
              toast.error(`Failed to submit form "${action.details.formId}"`);
            }
          }
          break;
          
        case 'navigation':
          if (action.details.url) {
            await executeAction('navigate', { url: action.details.url });
            toast.success(`Navigating to ${action.details.description || 'page'}`);
          }
          break;
          
        case 'page_action':
          if (action.details.action) {
            const success = await executeAction(action.details.action, action.details.params);
            if (success) {
              toast.success(`Action "${action.details.action}" executed successfully`);
            } else {
              toast.error(`Failed to execute action "${action.details.action}"`);
            }
          }
          break;
          
        case 'data_analysis':
          // Refresh page data to get latest information
          refreshPageData();
          toast.info('Page data refreshed');
          break;
          
        default:
          console.log('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('Action execution error:', error);
      toast.error('Failed to perform action');
    }
  }, [populateForm, submitForm, executeAction, refreshPageData]);

  // Handle universal message processing
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
      // Prepare comprehensive context
      const context = {
        pageTitle: pageData.title,
        pageDescription: pageData.description,
        breadcrumbs: pageData.breadcrumbs,
        currentUrl: pathname,
        forms: pageData.forms.map(form => ({
          id: form.id,
          dataForm: form.dataForm,
          fields: form.fields.map(field => ({
            name: field.name,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            currentValue: field.value
          }))
        })),
        links: pageData.links,
        buttons: pageData.buttons.map(btn => ({
          text: btn.text,
          action: btn.action
        })),
        dataElements: pageData.dataElements.map(el => ({
          type: el.type,
          content: el.content.substring(0, 200) // Truncate for token limit
        }))
      };

      const response = await fetch('/api/sam/universal-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          context: context,
          conversationHistory: messages.slice(-3) // Last 3 messages for context
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      
      // Execute actions if provided
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
      console.error('Universal SAM Error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam',
        content: `I encountered an error processing your request. Let me analyze the page again and try to help with something else.`,
        timestamp: new Date(),
        isError: true,
        suggestions: ["Refresh page analysis", "Show available forms", "Help with navigation"]
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process request');
    } finally {
      setIsLoading(false);
    }
  }, [pageData, pathname, messages, handleAction]);

  // Generate quick actions based on current page
  const getQuickActions = useCallback(() => {
    const actions = [];
    
    if (pageData.forms.length > 0) {
      actions.push({ label: 'Populate Forms', value: 'populate_forms' });
      actions.push({ label: 'Generate Form Content', value: 'generate_content' });
    }
    
    if (pageData.buttons.length > 0) {
      actions.push({ label: 'Analyze Buttons', value: 'analyze_buttons' });
    }
    
    if (pageData.dataElements.length > 0) {
      actions.push({ label: 'Analyze Data', value: 'analyze_data' });
    }
    
    actions.push({ label: 'Page Summary', value: 'page_summary' });
    actions.push({ label: 'Navigation Help', value: 'navigation_help' });
    
    return actions;
  }, [pageData]);

  // Handle quick actions
  const handleQuickAction = useCallback((actionValue: string) => {
    const prompts: Record<string, string> = {
      populate_forms: 'Help me populate all the forms on this page with relevant content',
      generate_content: 'Generate appropriate content for all form fields on this page',
      analyze_buttons: 'Analyze all the buttons on this page and explain what they do',
      analyze_data: 'Analyze all the data elements on this page and provide insights',
      page_summary: 'Give me a comprehensive summary of this page and its capabilities',
      navigation_help: 'Show me where I can navigate from this page'
    };
    
    const prompt = prompts[actionValue] || `Help me with ${actionValue}`;
    sendMessage(prompt);
  }, [sendMessage]);

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
            className="relative h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0"
            aria-label="Open Universal SAM Assistant"
          >
            <Brain className="h-8 w-8 text-white" />
            <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </span>
            </span>
          </Button>
          
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              Universal SAM • {pageData.title}
              <div className="text-xs opacity-75">
                {pageData.forms.length} forms • {pageData.buttons.length} buttons
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main interface
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-[450px] h-[680px] flex flex-col overflow-hidden shadow-2xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Universal SAM
                  <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-blue-600 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {pageData.title}
                  </span>
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {pageData.forms.length} Forms
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
                        <span className="text-sm text-gray-600">Processing...</span>
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
                    {getQuickActions().map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
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
                  placeholder="Ask me anything about this page..."
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