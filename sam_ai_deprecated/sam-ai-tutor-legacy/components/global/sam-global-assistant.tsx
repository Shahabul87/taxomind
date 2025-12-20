"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/providers/theme-provider';
import { useSAMGlobal } from '@/sam/components/global/sam-global-provider';
import { SAMContextualChat } from '@/sam/components/contextual/sam-contextual-chat';
import { useContextAwareSAM } from '@/sam/components/contextual/sam-context-manager';
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
  Heart,
  Move
} from 'lucide-react';

interface SAMGlobalAssistantProps {
  className?: string;
}

export function SAMGlobalAssistant({ className }: SAMGlobalAssistantProps) {
  const { data: session } = useSession();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

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

  // Drag and position states
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewFeatures, setHasNewFeatures] = useState(false);
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date}>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'actions' | 'context'>('chat');
  const [quickActions, setQuickActions] = useState<Array<{id: string, label: string, icon: any, description: string, available: boolean}>>([]);
  const [pageContext, setPageContext] = useState<any>(null);
  const lastContextHashRef = useRef<string | null>(null);

  // Mark component as mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize window position to bottom-right
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultX = window.innerWidth - 450; // 400px width + 50px margin
      const defaultY = window.innerHeight - 650; // 600px height + 50px margin
      setWindowPosition({
        x: Math.max(20, defaultX),
        y: Math.max(20, defaultY),
      });
    }
  }, []);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sam-drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - windowPosition.x,
        y: e.clientY - windowPosition.y,
      });
    }
  }, [windowPosition]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 600;

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

  // Check for new features based on context
  useEffect(() => {
    const checkForNewFeatures = () => {
      // Simulate new features detection
      const hasNewAssessmentFeature = tutorMode === 'teacher' && learningContext.courseId;
      const hasNewStudyTips = tutorMode === 'student' && learningContext.subject;
      setHasNewFeatures(Boolean(hasNewAssessmentFeature || hasNewStudyTips));
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
      const response = await fetch('/api/sam/context-aware-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: action.label,
          pathname: pageContext?.pageUrl || '',
          pageContext: {
            pageName: pageContext?.pageTitle || 'Unknown Page',
            pageType: tutorMode === 'teacher' ? 'teacher-management' : 'student-learning',
            breadcrumbs: pageContext?.breadcrumbs || [],
            capabilities: ['form-detection', 'content-generation', 'page-analysis'],
            dataContext: {
              forms: pageContext?.forms?.map((form: any) => ({
                id: form.id,
                purpose: form.purpose,
                fields: form.fields.map((field: any) => ({
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
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'I can help with that!',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      if (data.action) {
        handleAction(data.action);
      }
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
  }, [quickActions, pageContext, tutorMode, messages, handleAction]);

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
              if (labelFor) label = labelFor.textContent?.trim() || '';
              
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

        // Avoid excessive updates by hashing important parts
        const signature = JSON.stringify({
          url: pageUrl,
          title: pageTitle,
          bc: breadcrumbs,
          forms: forms.map((f: any) => ({ id: f.id, fields: Array.isArray(f.fields) ? f.fields.length : 0 })),
          buttons: Array.isArray(buttons) ? buttons.length : 0,
        });

        if (lastContextHashRef.current !== signature) {
          lastContextHashRef.current = signature;
          setPageContext(context);
          generateQuickActions(context);
        }
      } catch (error: any) {
        logger.error('Error detecting page context:', error);
      }
    };

    if (isOpen) {
      detectPageContext();
      // Refresh context every 15 seconds to reduce overhead
      const interval = setInterval(detectPageContext, 15000);
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

  // Form and action execution helpers
  const applyFormUpdate = useCallback((details: any) => {
    const dispatchEvents = (el: HTMLElement) => {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const trySet = (selectors: string[], value: string) => {
      for (const sel of selectors) {
        const target = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (target) {
          (target as any).value = value;
          dispatchEvents(target);
          return true;
        }
      }
      return false;
    };

    switch (details.action) {
      case 'update_chapter_title':
        return trySet(
          ['input[name="title"]', 'input[id*="title"]', 'input[aria-label*="title" i]'],
          details.title
        );
      case 'update_chapter_description':
        return trySet(
          ['textarea[name="description"]', 'textarea[id*="description"]', 'textarea[aria-label*="description" i]'],
          details.value
        );
      case 'update_learning_outcomes':
        return trySet(
          [
            'textarea[name*="outcome" i]',
            'textarea[id*="outcome" i]',
            'textarea[aria-label*="outcome" i]'
          ],
          details.outcomes || details.value || ''
        );
      case 'create_sections': {
        const combined = Array.isArray(details.sections)
          ? details.sections.map((s: any, idx: number) => `${idx + 1}. ${s.title}${s.description ? ` — ${s.description}` : ''}`).join('\n')
          : '';
        return trySet(
          [
            'textarea[name*="section" i]',
            'textarea[id*="section" i]',
            'textarea[aria-label*="section" i]'
          ],
          combined
        );
      }
      default:
        return false;
    }
  }, []);

  const handleAction = useCallback((action: any) => {
    try {
      if (!action?.type) return;

      if (action.type === 'form_update') {
        const ok = applyFormUpdate(action.details || {});
        const content = ok
          ? `Applied: ${action.details?.description || action.details?.action}`
          : `I have the update ready: ${action.details?.description || action.details?.action}. Tell me where to apply it.`;
        setMessages(prev => [...prev, { id: `${Date.now()}-act`, content, isUser: false, timestamp: new Date() }]);
        return;
      }

      if (action.type === 'navigation' && action.details?.url) {
        setMessages(prev => [...prev, { id: `${Date.now()}-nav`, content: `Navigating to ${action.details.url}`, isUser: false, timestamp: new Date() }]);
        window.location.href = action.details.url;
        return;
      }

      if (action.type === 'page_action' && action.details?.action === 'refresh') {
        setMessages(prev => [...prev, { id: `${Date.now()}-refresh`, content: 'Refreshing the page…', isUser: false, timestamp: new Date() }]);
        window.location.reload();
        return;
      }
    } catch (error) {
      logger.error('Error handling action:', error);
    }
  }, [applyFormUpdate]);

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
              forms: pageContext?.forms?.map((form: any) => ({
                id: form.id,
                purpose: form.purpose,
                fields: form.fields.map((field: any) => ({
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
      if (data.action) {
        handleAction(data.action);
      }
    } catch (error: any) {
      logger.error('Error sending message:', error);
      
      // Fallback to enhanced local response
      let fallbackResponse = '';
      
      if (currentInput.toLowerCase().includes('page') || currentInput.toLowerCase().includes('where')) {
        fallbackResponse = `I can see you're on "${pageContext?.pageTitle || 'this page'}" (${pageContext?.pageUrl || 'unknown URL'}). This page has ${pageContext?.forms?.length || 0} form(s) and ${pageContext?.buttons?.length || 0} button(s). How can I help you with this page?`;
      } else if (currentInput.toLowerCase().includes('form') || currentInput.toLowerCase().includes('field')) {
        const formsInfo = pageContext?.forms?.map((form: any) => 
          `${form.purpose !== 'unknown' ? form.purpose : form.id}: ${form.fields.length} fields`
        ).join(', ') || 'no forms detected';
        fallbackResponse = `I can see these forms on this page: ${formsInfo}. Which form would you like help with?`;
      } else if (currentInput.toLowerCase().includes('description') && pageContext?.forms?.length > 0) {
        const descriptionField = pageContext.forms
          .flatMap((form: any) => form.fields)
          .find((field: any) => field.name.toLowerCase().includes('description') || field.label.toLowerCase().includes('description'));
        
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
  }, [inputValue, isLoading, pageContext, tutorMode, messages, handleAction]);

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

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) return null;

  const ThemeIcon = getThemeStyles.icon;

  return (
    <div className={cn("sam-global-assistant", className)}>
      {/* Floating Button - Bottom Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <div className="relative group">
            <Button
              onClick={handleButtonClick}
              className={cn(
                "h-16 w-16 rounded-full shadow-2xl border-2 backdrop-blur-sm",
                "transition-all duration-300 ease-in-out",
                "hover:scale-110 active:scale-95 hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isDark
                  ? "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 border-white/10 focus:ring-purple-500"
                  : "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 border-white/20 focus:ring-purple-400"
              )}
              aria-label="Open SAM AI Tutor"
            >
              <div className="relative">
                <Sparkles className="h-7 w-7 text-white animate-pulse" />
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md"></div>
              </div>
            </Button>

            {/* Notification Badge */}
            {hasNewFeatures && (
              <Badge className={cn(
                "absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center",
                "animate-bounce shadow-lg",
                isDark ? "bg-green-500" : "bg-green-400"
              )}>
                <Star className="h-3 w-3 text-white fill-current" />
              </Badge>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-20 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg",
                isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
              )}>
                SAM AI Assistant
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAM AI Tutor Modal - Draggable */}
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
              "rounded-xl shadow-2xl border overflow-hidden",
              "w-[400px] h-[600px]",
              "transition-shadow duration-300",
              isDragging ? "shadow-[0_0_50px_rgba(147,51,234,0.6)]" : "shadow-2xl",
              isDark
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            )}
          >
            {/* Enhanced Draggable Header */}
            <div
              className={cn(
                "sam-drag-handle flex items-center justify-between p-3 cursor-move",
                "bg-gradient-to-r transition-all duration-300",
                isDark
                  ? "from-blue-600 via-purple-600 to-pink-600"
                  : "from-blue-500 via-purple-500 to-pink-500"
              )}
            >
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">
                    SAM
                  </h2>
                  <p className="text-xs text-white/80 capitalize truncate">
                    {tutorMode} Mode
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="text-white hover:bg-white/20 h-7 w-7 p-0"
                  title="Minimize"
                >
                  {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="text-white hover:bg-white/20 h-7 w-7 p-0"
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Enhanced Tabbed Interface */}
            {!isMinimized && (
              <div className="h-[calc(100%-52px)] flex flex-col">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'actions' | 'context')} className="flex-1 flex flex-col">
                  <TabsList className={cn(
                    "grid w-full grid-cols-3 m-2 rounded-lg",
                    isDark ? "bg-gray-800" : "bg-gray-100"
                  )}>
                    <TabsTrigger
                      value="chat"
                      className={cn(
                        "text-xs font-medium transition-all",
                        activeTab === 'chat' && (isDark
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-gradient-to-r from-blue-500 to-purple-500 text-white")
                      )}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger
                      value="actions"
                      className={cn(
                        "text-xs font-medium transition-all",
                        activeTab === 'actions' && (isDark
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "bg-gradient-to-r from-purple-500 to-pink-500 text-white")
                      )}
                    >
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      Actions
                    </TabsTrigger>
                    <TabsTrigger
                      value="context"
                      className={cn(
                        "text-xs font-medium transition-all",
                        activeTab === 'context' && (isDark
                          ? "bg-gradient-to-r from-pink-600 to-blue-600 text-white"
                          : "bg-gradient-to-r from-pink-500 to-blue-500 text-white")
                      )}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Context
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chat" className="flex-1 flex flex-col h-full">
                    <SAMContextualChat 
                      className="h-full border-0"
                      position="embedded"
                      theme="teacher"
                      autoGreet={true}
                    />
                  </TabsContent>
                  
                  <TabsContent value="actions" className="flex-1 p-2 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="space-y-1.5 pr-2">
                        {quickActions.length === 0 ? (
                          <div className="text-center py-12">
                            <Loader2 className={cn(
                              "h-8 w-8 animate-spin mx-auto mb-2",
                              isDark ? "text-gray-400" : "text-gray-500"
                            )} />
                            <p className={cn(
                              "text-xs",
                              isDark ? "text-gray-400" : "text-gray-500"
                            )}>Loading...</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {quickActions.map((action) => (
                              <Button
                                key={action.id}
                                variant="outline"
                                className={cn(
                                  "justify-start h-auto p-3 text-left w-full transition-all",
                                  isDark
                                    ? "border-gray-700 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-pink-600/20 hover:border-purple-500"
                                    : "border-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-400"
                                )}
                                onClick={() => handleQuickAction(action.id)}
                                disabled={!action.available}
                              >
                                <div className="flex items-start space-x-2 w-full">
                                  <div className={cn(
                                    "p-1.5 rounded-lg shrink-0",
                                    isDark
                                      ? "bg-gradient-to-br from-purple-600 to-pink-600"
                                      : "bg-gradient-to-br from-purple-500 to-pink-500"
                                  )}>
                                    <action.icon className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={cn(
                                      "text-xs font-semibold truncate",
                                      isDark ? "text-gray-100" : "text-gray-900"
                                    )}>{action.label}</div>
                                    <div className={cn(
                                      "text-[10px] leading-tight mt-0.5",
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    )}>{action.description}</div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="context" className="flex-1 p-2 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="space-y-2 pr-2">
                        {pageContext ? (
                          <div className="space-y-2">
                            <Card className={cn(
                              "border",
                              isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            )}>
                              <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className={cn(
                                  "text-xs font-bold flex items-center",
                                  isDark ? "text-gray-100" : "text-gray-900"
                                )}>
                                  <Navigation className="h-3.5 w-3.5 mr-1.5" />
                                  Page Info
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-1.5 px-3 pb-3">
                                <div className="text-[10px]">
                                  <span className={cn("font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>Title:</span>{' '}
                                  <span className={cn(isDark ? "text-gray-400" : "text-gray-600")}>{pageContext.pageTitle}</span>
                                </div>
                                <div className="text-[10px] truncate">
                                  <span className={cn("font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>URL:</span>{' '}
                                  <span className={cn(isDark ? "text-gray-400" : "text-gray-600")}>{pageContext.pageUrl}</span>
                                </div>
                              </CardContent>
                            </Card>

                            {pageContext.forms?.length > 0 && (
                              <Card className={cn(
                                "border",
                                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                              )}>
                                <CardHeader className="pb-2 pt-3 px-3">
                                  <CardTitle className={cn(
                                    "text-xs font-bold flex items-center",
                                    isDark ? "text-gray-100" : "text-gray-900"
                                  )}>
                                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                                    Forms ({pageContext.forms.length})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 pb-3">
                                  <div className="space-y-1.5">
                                    {pageContext.forms.map((form: any, index: number) => (
                                      <div key={index} className={cn(
                                        "p-2 rounded-lg",
                                        isDark ? "bg-gray-700/50" : "bg-gray-50"
                                      )}>
                                        <div className={cn(
                                          "text-xs font-medium",
                                          isDark ? "text-gray-200" : "text-gray-800"
                                        )}>Form {index + 1}</div>
                                        <div className={cn(
                                          "text-[10px]",
                                          isDark ? "text-gray-400" : "text-gray-600"
                                        )}>
                                          {form.fields.length} fields
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            <Card className={cn(
                              "border",
                              isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            )}>
                              <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className={cn(
                                  "text-xs font-bold flex items-center",
                                  isDark ? "text-gray-100" : "text-gray-900"
                                )}>
                                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                                  Features
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="px-3 pb-3">
                                <div className="flex flex-wrap gap-1">
                                  {features.slice(0, 6).map((feature) => (
                                    <Badge key={feature} className={cn(
                                      "text-[9px] px-1.5 py-0.5 capitalize",
                                      isDark
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                        : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                    )}>
                                      {feature.replace('-', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Activity className={cn(
                              "h-8 w-8 mx-auto mb-2",
                              isDark ? "text-gray-600" : "text-gray-400"
                            )} />
                            <p className={cn(
                              "text-xs",
                              isDark ? "text-gray-500" : "text-gray-600"
                            )}>Analyzing page...</p>
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
              <div className="h-[calc(100%-52px)] flex items-center justify-center p-4">
                <div className="text-center">
                  <div className={cn(
                    "h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center",
                    "bg-gradient-to-br",
                    isDark
                      ? "from-blue-600 via-purple-600 to-pink-600"
                      : "from-blue-500 via-purple-500 to-pink-500"
                  )}>
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className={cn(
                    "text-sm font-bold mb-1",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    SAM
                  </h3>
                  <p className={cn(
                    "text-xs mb-3",
                    isDark ? "text-gray-400" : "text-gray-600"
                  )}>
                    Ready to assist
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {features.slice(0, 3).map((feature) => (
                      <Badge key={feature} className={cn(
                        "text-[9px] px-1.5 py-0.5 capitalize",
                        isDark
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      )}>
                        {feature.replace('-', ' ')}
                      </Badge>
                    ))}
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
