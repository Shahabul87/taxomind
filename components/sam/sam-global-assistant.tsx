"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSAMGlobal } from './sam-global-provider';
import { SAMContextualChat } from './sam-contextual-chat';
import { useContextAwareSAM } from './sam-context-manager';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2, 
  Settings, 
  Sparkles,
  GraduationCap,
  BookOpen,
  Target,
  Zap,
  Brain,
  Users,
  BarChart3,
  HelpCircle,
  Send,
  Loader2,
  Edit,
  Eye,
  Plus,
  FileText,
  Lightbulb,
  Palette,
  Microscope,
  Database,
  Activity,
  CheckCircle2,
  AlertCircle,
  Command,
  Navigation,
  Wand2,
  Trophy,
  Flame,
  TrendingUp,
  Star,
  Heart
} from 'lucide-react';

interface SAMGlobalAssistantProps {
  className?: string;
}

export function SAMGlobalAssistant({ className }: SAMGlobalAssistantProps) {
  const { data: session } = useSession();
  const {
    isOpen,
    setIsOpen,
    learningContext,
    tutorMode,
    features,
    position,
    theme,
    screenSize,
    shouldShow,
    toggleSAM
  } = useSAMGlobal();

  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewFeatures, setHasNewFeatures] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 20, y: 20 });
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date}>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'actions' | 'context'>('chat');
  const [quickActions, setQuickActions] = useState<Array<{id: string, label: string, icon: any, description: string, available: boolean}>>([]);
  const [pageContext, setPageContext] = useState<any>(null);

  // Check for new features based on context
  useEffect(() => {
    const checkForNewFeatures = () => {
      // Simulate new features detection
      const hasNewAssessmentFeature = tutorMode === 'teacher' && learningContext.courseId;
      const hasNewStudyTips = tutorMode === 'student' && learningContext.subject;
      setHasNewFeatures(hasNewAssessmentFeature || hasNewStudyTips);
    };

    checkForNewFeatures();
  }, [tutorMode, learningContext]);

  // Generate context-aware quick actions - moved before useEffect
  const generateQuickActions = useCallback((context: any) => {

    const actions = [];
    
    // Universal actions
    actions.push({
      id: 'explain_page',
      label: 'Explain Page',
      icon: HelpCircle,
      description: 'Get help understanding this page',
      available: true
    });

    // Form-related actions
    if (context?.forms?.length > 0) {
      actions.push({
        id: 'fill_forms',
        label: 'Fill Forms',
        icon: Edit,
        description: 'Auto-populate forms with AI',
        available: true
      });
    }

    // Role-specific actions
    if (tutorMode === 'teacher') {
      actions.push(
        {
          id: 'generate_content',
          label: 'Generate Content',
          icon: Sparkles,
          description: 'AI-powered content creation',
          available: true
        },
        {
          id: 'analyze_content',
          label: 'Analyze Content',
          icon: Microscope,
          description: 'Deep content analysis',
          available: true
        },
        {
          id: 'create_assessment',
          label: 'Create Assessment',
          icon: Target,
          description: 'Generate quizzes and tests',
          available: true
        }
      );
    } else if (tutorMode === 'student') {
      actions.push(
        {
          id: 'explain_concept',
          label: 'Explain Concept',
          icon: Lightbulb,
          description: 'Get detailed explanations',
          available: true
        },
        {
          id: 'study_tips',
          label: 'Study Tips',
          icon: Target,
          description: 'Personalized study guidance',
          available: true
        },
        {
          id: 'practice_quiz',
          label: 'Practice Quiz',
          icon: Brain,
          description: 'Test your knowledge',
          available: true
        }
      );
    }

    setQuickActions(actions);
  }, [tutorMode]);

  // Handle quick action clicks
  const handleQuickAction = useCallback(async (actionId: string) => {

    const action = quickActions.find(a => a.id === actionId);
    if (!action) {

      return;
    }

    const actionMessage = {
      id: Date.now().toString(),
      content: `🎯 ${action.label}: ${action.description}`,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, actionMessage]);
    setIsLoading(true);
    
    // Switch to chat tab to show the interaction
    setActiveTab('chat');
    
    try {
      // Simulate enhanced AI response based on action
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let responseContent = '';
      switch (actionId) {
        case 'explain_page':
          const formsDetails = pageContext?.forms?.map(form => {
            const fieldsWithValues = form.fields.filter(f => f.value).length;
            const totalFields = form.fields.length;
            return `${form.purpose !== 'unknown' ? form.purpose : form.id} (${fieldsWithValues}/${totalFields} fields filled)`;
          }).join(', ') || 'no forms';
          
          responseContent = `I can see you're on "${pageContext?.pageTitle || 'this page'}" (${pageContext?.pageUrl || ''}). This page appears to be designed for ${tutorMode === 'teacher' ? 'course management and content creation' : 'learning and studying'}. 

Current page status:
• Forms detected: ${formsDetails}
• Available buttons: ${pageContext?.buttons?.length || 0}
• Page breadcrumbs: ${pageContext?.breadcrumbs?.join(' > ') || 'none'}

I can help you fill forms, generate content, or explain how to use any specific feature. What would you like to focus on?`;
          break;
        case 'fill_forms':
          const formsInfo = pageContext?.forms?.map(form => {
            const emptyFields = form.fields.filter(f => !f.value && !f.readOnly).length;
            return `• ${form.purpose !== 'unknown' ? form.purpose : form.id}: ${emptyFields} empty field(s) that could be filled`;
          }).join('\n') || '• No forms available to fill';
          
          responseContent = `I've detected ${pageContext?.forms?.length || 0} form(s) on this page:

${formsInfo}

Which form would you like me to help you with? I can generate content based on the form's purpose and existing data.`;
          break;
        case 'generate_content':
          responseContent = `I can help you create engaging educational content! I can generate course descriptions, learning objectives, chapter outlines, quiz questions, and more. What type of content would you like me to create for you?`;
          break;
        case 'analyze_content':
          responseContent = `I can analyze various types of content including text, course materials, student responses, and more. What would you like me to analyze? I can provide insights on clarity, engagement, difficulty level, and learning effectiveness.`;
          break;
        case 'create_assessment':
          responseContent = `I can create comprehensive assessments including multiple choice questions, essay prompts, practical exercises, and rubrics. What subject or topic would you like me to create an assessment for?`;
          break;
        default:
          responseContent = `I'm ready to help you with ${action.label}! This feature provides ${action.description}. What specific assistance do you need?`;
      }
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      logger.error('Error handling quick action:', error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        content: `I encountered an error while processing your request. Please try again or ask me directly what you need help with.`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [quickActions, pageContext, tutorMode]);

  // Detect page context and generate quick actions
  useEffect(() => {
    const detectPageContext = async () => {
      try {
        // Enhanced form detection with better value extraction
        const forms = Array.from(document.querySelectorAll('form')).map((form, index) => {
          const formData = new FormData(form);
          const formId = form.id || form.getAttribute('data-form') || `form_${index}`;
          
          const fields = Array.from(form.querySelectorAll('input, textarea, select')).map((field: any, fieldIndex) => {
            // Get label text from various sources
            let label = '';
            if (field.labels && field.labels.length > 0) {
              label = field.labels[0].textContent?.trim();
            } else {
              // Look for label by for attribute
              const labelFor = document.querySelector(`label[for="${field.id}"]`);
              if (labelFor) label = labelFor.textContent?.trim();
              
              // Look for parent label
              const parentLabel = field.closest('label');
              if (parentLabel) label = parentLabel.textContent?.trim();
              
              // Look for aria-label
              if (!label) label = field.getAttribute('aria-label');
              
              // Look for preceding text or placeholder
              if (!label) label = field.placeholder || field.name || `Field ${fieldIndex}`;
            }

            return {
              name: field.name || `field_${fieldIndex}`,
              type: field.type || field.tagName.toLowerCase(),
              value: field.value || '',
              placeholder: field.placeholder || '',
              label: label || '',
              id: field.id || '',
              required: field.required || false,
              disabled: field.disabled || false,
              readOnly: field.readOnly || false
            };
          });

          return {
            id: formId,
            element: form,
            action: form.action || '',
            method: form.method || 'GET',
            fields: fields,
            purpose: form.getAttribute('data-purpose') || 'unknown'
          };
        });

        // Detect page metadata
        const pageTitle = document.title;
        const pageUrl = window.location.pathname;
        const breadcrumbs = Array.from(document.querySelectorAll('[data-breadcrumb], .breadcrumb, nav ol li a')).map((el: any) => el.textContent?.trim() || '');
        
        // Detect available actions based on page content
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map((btn: any) => ({
          text: btn.textContent?.trim() || '',
          disabled: btn.disabled || false,
          className: btn.className || ''
        }));

        const context = {
          pageTitle,
          pageUrl,
          breadcrumbs,
          forms,
          buttons,
          detectedAt: new Date().toISOString()
        };

        setPageContext(context);
        generateQuickActions(context);
      } catch (error: any) {
        logger.error('Error detecting page context:', error);
      }
    };

    if (isOpen) {
      detectPageContext();
      // Refresh context every 5 seconds
      const interval = setInterval(detectPageContext, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, generateQuickActions]);

  // Initialize welcome message and ensure actions are generated
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        content: `Hello! I'm SAM, your AI learning assistant. I'm here to help you with your ${tutorMode === 'teacher' ? 'teaching' : 'learning'} journey. How can I assist you today?`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
    
    // Ensure actions are generated even if context detection hasn't run yet
    if (isOpen && quickActions.length === 0) {

      generateQuickActions(pageContext);
    }
  }, [isOpen, messages.length, tutorMode, quickActions.length, generateQuickActions, pageContext]);

  // Handle sending messages with enhanced context awareness
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Send to SAM API with full context
      const response = await fetch('/api/sam/context-aware-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          pathname: pageContext?.pageUrl || '',
          pageContext: {
            pageName: pageContext?.pageTitle || 'Unknown Page',
            pageType: tutorMode === 'teacher' ? 'teacher-management' : 'student-learning',
            breadcrumbs: pageContext?.breadcrumbs || [],
            capabilities: ['form-detection', 'content-generation', 'page-analysis'],
            dataContext: {
              forms: pageContext?.forms?.map(form => ({
                id: form.id,
                purpose: form.purpose,
                fields: form.fields.map(field => ({
                  name: field.name,
                  type: field.type,
                  value: field.value,
                  label: field.label,
                  placeholder: field.placeholder,
                  required: field.required
                }))
              })) || [],
              buttons: pageContext?.buttons || [],
              detectedAt: pageContext?.detectedAt || new Date().toISOString()
            },
            parentContext: {
              courseId: pageContext?.pageUrl?.includes('/courses/') ? 
                pageContext.pageUrl.split('/courses/')[1]?.split('/')[0] : null,
              chapterId: pageContext?.pageUrl?.includes('/chapters/') ? 
                pageContext.pageUrl.split('/chapters/')[1]?.split('/')[0] : null,
              sectionId: pageContext?.pageUrl?.includes('/section/') ? 
                pageContext.pageUrl.split('/section/')[1]?.split('/')[0] : null
            }
          },
          conversationHistory: messages.slice(-5).map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Sorry, I encountered an error processing your request.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      logger.error('Error sending message:', error);
      
      // Fallback to enhanced local response
      let fallbackResponse = '';
      
      if (currentInput.toLowerCase().includes('page') || currentInput.toLowerCase().includes('where')) {
        fallbackResponse = `I can see you're on "${pageContext?.pageTitle || 'this page'}" (${pageContext?.pageUrl || 'unknown URL'}). This page has ${pageContext?.forms?.length || 0} form(s) and ${pageContext?.buttons?.length || 0} button(s). How can I help you with this page?`;
      } else if (currentInput.toLowerCase().includes('form') || currentInput.toLowerCase().includes('field')) {
        const formsInfo = pageContext?.forms?.map(form => 
          `${form.purpose !== 'unknown' ? form.purpose : form.id}: ${form.fields.length} fields`
        ).join(', ') || 'no forms detected';
        fallbackResponse = `I can see these forms on this page: ${formsInfo}. Which form would you like help with?`;
      } else if (currentInput.toLowerCase().includes('description') && pageContext?.forms?.length > 0) {
        const descriptionField = pageContext.forms
          .flatMap(form => form.fields)
          .find(field => field.name.toLowerCase().includes('description') || field.label.toLowerCase().includes('description'));
        
        if (descriptionField) {
          fallbackResponse = descriptionField.value 
            ? `The current description is: "${descriptionField.value}". Would you like me to help improve or generate a new description?`
            : `I found a description field that's currently empty. Would you like me to generate a description for you?`;
        } else {
          fallbackResponse = `I don't see a description field on this page. Could you point me to the specific field you'd like help with?`;
        }
      } else {
        fallbackResponse = `I understand you're asking about "${currentInput}". I can see you're working on "${pageContext?.pageTitle || 'this page'}" with ${pageContext?.forms?.length || 0} form(s). How can I specifically help you?`;
      }
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, pageContext, tutorMode, messages]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Get theme-specific styling
  const getThemeStyles = useMemo(() => {
    switch (theme) {
      case 'teacher':
        return {
          gradient: 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
          icon: GraduationCap,
          color: 'text-white',
          badge: 'bg-purple-500'
        };
      case 'student':
        return {
          gradient: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
          icon: BookOpen,
          color: 'text-white',
          badge: 'bg-blue-500'
        };
      case 'learning':
        return {
          gradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
          icon: Brain,
          color: 'text-white',
          badge: 'bg-emerald-500'
        };
      case 'dashboard':
        return {
          gradient: 'from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
          icon: BarChart3,
          color: 'text-white',
          badge: 'bg-orange-500'
        };
      default:
        return {
          gradient: 'from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800',
          icon: HelpCircle,
          color: 'text-white',
          badge: 'bg-slate-500'
        };
    }
  }, [theme]);

  // Get role-specific welcome message
  const getWelcomeMessage = useMemo(() => {
    switch (tutorMode) {
      case 'teacher':
        return "Hello! I'm SAM, your AI teaching assistant. I'm here to help with lesson planning, student analytics, and assessment creation.";
      case 'student':
        if (learningContext.courseId) {
          return `Hi! I'm SAM, your AI study buddy. I'm here to help you with ${learningContext.subject || 'your current course'}.`;
        }
        return "Hi! I'm SAM, your AI learning companion. I'm here to help with your studies, answer questions, and guide your learning journey.";
      case 'admin':
        return "Hello! I'm SAM, your AI platform assistant. I'm here to help with platform management and user analytics.";
      default:
        return "Hello! I'm SAM, your AI assistant. How can I help you today?";
    }
  }, [tutorMode, learningContext]);

  // Handle button click
  const handleButtonClick = useCallback(() => {
    setIsOpen(true);
    setHasNewFeatures(false);
  }, [setIsOpen]);

  // Handle close
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, [setIsOpen]);

  // Don't render if session is not available or should not show
  if (!session || !shouldShow) return null;

  const ThemeIcon = getThemeStyles.icon;

  return (
    <div className={cn("sam-global-assistant", className)}>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <div className="relative">
            <Button
              onClick={handleButtonClick}
              className={cn(
                "h-14 w-14 rounded-full shadow-lg border-2 border-white/20 backdrop-blur-sm",
                "transition-all duration-300 ease-in-out",
                "hover:scale-110 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-white/50",
                `bg-gradient-to-r ${getThemeStyles.gradient}`
              )}
              aria-label="Open SAM AI Tutor"
            >
              <ThemeIcon className={cn("h-6 w-6", getThemeStyles.color)} />
            </Button>

            {/* Notification Badge */}
            {hasNewFeatures && (
              <Badge className={cn(
                "absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center",
                "animate-pulse",
                getThemeStyles.badge
              )}>
                <Sparkles className="h-3 w-3 text-white" />
              </Badge>
            )}

            {/* Tooltip for mobile */}
            {screenSize === 'mobile' && (
              <div className="absolute bottom-16 right-0 mb-2 mr-2">
                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none transition-opacity duration-200 hover:opacity-100">
                  Tap for AI help
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAM AI Tutor Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn(
            "bg-white dark:bg-slate-900 rounded-lg shadow-2xl border",
            "w-full max-w-4xl h-[90vh] max-h-[800px]",
            "mx-4 overflow-hidden",
            "animate-in slide-in-from-bottom-4 duration-300"
          )}>
            {/* Enhanced Header */}
            <div className={cn(
              "flex items-center justify-between p-4 border-b",
              `bg-gradient-to-r ${getThemeStyles.gradient}`
            )}>
              <div className="flex items-center space-x-3">
                <ThemeIcon className="h-6 w-6 text-white" />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    SAM AI Tutor
                  </h2>
                  <p className="text-sm text-white/80 capitalize">
                    {tutorMode} Mode • {learningContext.subject || 'General Help'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Enhanced Tabbed Interface */}
            {!isMinimized && (
              <div className="h-[calc(100%-4rem)] flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="context">Context</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chat" className="flex-1 flex flex-col h-full">
                    <SAMContextualChat 
                      className="h-full border-0"
                      position="embedded"
                      theme="teacher"
                      autoGreet={true}
                    />
                  </TabsContent>
                  
                  <TabsContent value="actions" className="flex-1 m-4 mt-2">
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                        {quickActions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>Loading actions...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {quickActions.map((action) => (
                              <Button
                                key={action.id}
                                variant="outline"
                                className="justify-start h-auto p-4 text-left hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => {

                                  handleQuickAction(action.id);
                                }}
                                disabled={!action.available}
                              >
                                <div className="flex items-center space-x-3">
                                  <action.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{action.label}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{action.description}</div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="context" className="flex-1 m-4 mt-2">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Page Context</h3>
                        
                        {pageContext && (
                          <div className="space-y-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Page Information</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div>
                                  <span className="font-medium">Title:</span> {pageContext.pageTitle}
                                </div>
                                <div>
                                  <span className="font-medium">URL:</span> {pageContext.pageUrl}
                                </div>
                                {pageContext.breadcrumbs?.length > 0 && (
                                  <div>
                                    <span className="font-medium">Breadcrumbs:</span> {pageContext.breadcrumbs.join(' > ')}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                            
                            {pageContext.forms?.length > 0 && (
                              <Card>
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">Detected Forms</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {pageContext.forms.map((form: any, index: number) => (
                                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                        <div className="font-medium">Form {index + 1}</div>
                                        <div className="text-sm text-gray-600">
                                          {form.fields.length} field(s) detected
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Capabilities</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                  {features.map((feature) => (
                                    <Badge key={feature} variant="secondary" className="capitalize">
                                      {feature.replace('-', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Minimized State */}
            {isMinimized && (
              <div className="p-4 h-[calc(100%-4rem)] flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ThemeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      SAM AI Tutor
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Click maximize to continue your conversation
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {features.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="outline" className="capitalize">
                          {feature.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}