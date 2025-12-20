"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/providers/theme-provider';
import { useSAMGlobal } from '@/sam/components/global/sam-global-provider';
import { useFormRegistry } from '@/lib/stores/form-registry-store';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { FIELD_SYNONYMS } from '@/sam-ai-tutor/config/field-synonyms';
import { buildFieldIndex, resolveFieldByPhrase, FieldMeta } from '@/sam-ai-tutor/utils/dom/field-indexer';
import { classifyIntent } from '@/sam-ai-tutor/utils/nlp/intent-classifier';
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
  Minimize2,
  HelpCircle,
  Edit,
  Microscope,
  Target,
  Brain,
  BookOpen,
  GraduationCap
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

interface FieldData {
  name: string;
  type: string;
  value: string;
  placeholder: string;
  label: string;
  id: string;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
}

interface FormData {
  id: string;
  element?: HTMLFormElement;
  action: string;
  method: string;
  fields: FieldData[];
  purpose: string;
  isReactControlled?: boolean;
  isDirty?: boolean;
}

interface ButtonData {
  text: string;
  disabled: boolean;
  className: string;
}

interface PageContext {
  pageTitle: string;
  pageUrl: string;
  breadcrumbs: string[];
  forms: FormData[];
  buttons: ButtonData[];
  detectedAt: string;
  hasReactForms?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  description: string;
  available: boolean;
}

// Helper functions
const determinePageType = (pathname: string): string => {
  if (pathname.includes('/teacher/courses') && pathname.match(/\/[a-zA-Z0-9-]+$/)) {
    return 'course-detail';
  }
  if (pathname.includes('/chapters/')) {
    return 'chapter-detail';
  }
  if (pathname.includes('/section/')) {
    return 'section-detail';
  }
  if (pathname.includes('/teacher/courses')) {
    return 'courses';
  }
  if (pathname.includes('/teacher/create')) {
    return 'create';
  }
  if (pathname.includes('/teacher/analytics')) {
    return 'analytics';
  }
  if (pathname.includes('/teacher/posts')) {
    return 'posts';
  }
  return 'other';
};

const extractIdFromPath = (path: string | undefined, segment: string): string | null => {
  if (!path) return null;
  if (!path.includes(`/${segment}/`)) return null;
  const parts = path.split(`/${segment}/`)[1]?.split('/');
  return parts?.[0] || null;
};

export function SAMGlobalAssistantRedesigned({ className }: SAMGlobalAssistantProps) {
  const { data: session } = useSession();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  const {
    isOpen,
    setIsOpen,
    tutorMode,
    shouldShow,
    screenSize,
  } = useSAMGlobal();

  // Form Registry Integration - Real-time React form state access
  const { getAllFormsData } = useFormRegistry();

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [windowPosition, setWindowPosition] = useState<{ x: number; y: number } | null>(null);
  const [samSize, setSamSize] = useState<{ width: number; height: number }>({ width: 450, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [contextChips, setContextChips] = useState<Array<{label: string, icon: string}>>([]);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [pendingFieldEdit, setPendingFieldEdit] = useState<null | { key: string; label: string; id?: string; name?: string }>(null);
  const [pendingFieldRead, setPendingFieldRead] = useState<null | { label: string; id?: string; name?: string }>(null);
  const [fieldIndex, setFieldIndex] = useState<FieldMeta[]>([]);

  const dragRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mark component as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute assistant size to fit viewport with margin
  const computeSamSize = useCallback(() => {
    if (typeof window === 'undefined') return { width: 450, height: 650 };
    const DEFAULT_WIDTH = 450;
    const DEFAULT_HEIGHT = 650;
    const MARGIN = 20;

    const maxWidth = Math.max(0, window.innerWidth - MARGIN * 2);
    const maxHeight = Math.max(0, window.innerHeight - MARGIN * 2);

    // Fit strictly within viewport while respecting defaults (never overflow)
    const width = Math.min(DEFAULT_WIDTH, maxWidth);
    const height = Math.min(DEFAULT_HEIGHT, maxHeight);
    return { width, height };
  }, []);

  // Calculate initial position for SAM window
  const calculateInitialPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 20, y: 20 };

    const margin = 20;
    const size = computeSamSize();

    // Bottom-right within viewport using computed size
    const maxX = window.innerWidth - size.width - margin;
    const maxY = window.innerHeight - size.height - margin;
    const minX = margin;
    const minY = margin;

    const x = Math.max(minX, maxX);
    const y = Math.max(minY, maxY);

    return { x, y };
  }, [computeSamSize]);

  // Handle opening SAM with proper initial position
  const handleOpenSAM = useCallback(() => {
    // Calculate size and position before opening
    const size = computeSamSize();
    setSamSize(size);
    const initialPos = calculateInitialPosition();
    setWindowPosition(initialPos);
    setIsOpen(true);
  }, [computeSamSize, calculateInitialPosition, setIsOpen]);

  // Ensure position stays within bounds (for existing positions after drag/resize)
  useEffect(() => {
    if (isOpen && windowPosition && typeof window !== 'undefined') {
      const margin = 20;

      // Calculate safe bounds for the window
      const maxX = window.innerWidth - samSize.width - margin;
      const maxY = window.innerHeight - samSize.height - margin;
      const minX = margin;
      const minY = margin;

      // Ensure the window stays within viewport bounds
      // This prevents the window from being partially off-screen
      const clampedX = Math.max(minX, Math.min(windowPosition.x, maxX));
      const clampedY = Math.max(minY, Math.min(windowPosition.y, maxY));

      // Only update if position needs adjustment
      if (windowPosition.x !== clampedX || windowPosition.y !== clampedY) {
        setWindowPosition({ x: clampedX, y: clampedY });
      }
    }
  }, [isOpen, windowPosition, samSize]);

  // Handle window resize to keep SAM within bounds
  useEffect(() => {
    if (!isOpen || !windowPosition) return;

    const handleResize = () => {
      const margin = 20;

      // Recompute size to fit viewport on resize
      const size = computeSamSize();
      setSamSize(size);

      const maxX = window.innerWidth - size.width - margin;
      const maxY = window.innerHeight - size.height - margin;
      const minX = margin;
      const minY = margin;

      // Adjust position if SAM is now off-screen due to resize
      const clampedX = Math.max(minX, Math.min(windowPosition.x, maxX));
      const clampedY = Math.max(minY, Math.min(windowPosition.y, maxY));

      if (windowPosition.x !== clampedX || windowPosition.y !== clampedY) {
        setWindowPosition({ x: clampedX, y: clampedY });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, windowPosition, computeSamSize]);

  // Build a generic Field Index periodically while open
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      try { setFieldIndex(buildFieldIndex()); } catch (e) { /* ignore */ }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate context-aware quick actions
  const generateQuickActions = useCallback((context: PageContext | null) => {
    const actions: QuickAction[] = [];

    // Universal actions
    actions.push({
      id: 'explain_page',
      label: 'Explain Page',
      icon: HelpCircle,
      description: 'Get help understanding this page',
      available: true
    });

    // Form-related actions
    if (context?.forms && context.forms.length > 0) {
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

  // Comprehensive page context detection with Form Registry Integration
  useEffect(() => {
    if (!isOpen) return;

    const detectPageContext = async () => {
      try {
        // Get React form state from registry (100% accurate values!)
        const registryForms = getAllFormsData();

        // Enhanced form detection with registry-first approach
        const forms = Array.from(document.querySelectorAll('form')).map((form, index) => {
          const formId = form.getAttribute('data-sam-form-id') ||
                        form.id ||
                        form.getAttribute('data-form') ||
                        `form_${index}`;

          // Try to get data from registry first (React state)
          const registryData = registryForms[formId];

          if (registryData) {
            // Use ACTUAL React state values from form registry
            logger.info(`[SAM] Using React state for form: ${formId}`);

            return {
              id: formId,
              element: form,
              action: form.action || '',
              method: form.method || 'GET',
              fields: Object.values(registryData.fields).map(field => ({
                name: field.name,
                type: field.type,
                value: field.value, // REAL React state value!
                placeholder: field.placeholder || '',
                label: field.label || field.name,
                id: `${formId}_${field.name}`,
                required: field.required || false,
                disabled: field.disabled || false,
                readOnly: field.readOnly || false
              })),
              purpose: registryData.metadata?.purpose || registryData.formName || form.getAttribute('data-purpose') || 'form',
              isReactControlled: true,
              isDirty: registryData.isDirty
            };
          }

          // Fallback to DOM detection for non-integrated forms
          logger.debug(`[SAM] Using DOM fallback for form: ${formId}`);

          const fields = Array.from(form.querySelectorAll('input, textarea, select')).map((field: any, fieldIndex) => {
            // Get label text from various sources
            let label = '';
            if (field.labels && field.labels.length > 0) {
              label = field.labels[0].textContent?.trim();
            } else {
              const labelFor = document.querySelector(`label[for="${field.id}"]`);
              if (labelFor) label = labelFor.textContent?.trim() || '';

              const parentLabel = field.closest('label');
              if (parentLabel) label = parentLabel.textContent?.trim();

              if (!label) label = field.getAttribute('aria-label');
              if (!label) label = field.placeholder || field.name || `Field ${fieldIndex}`;
            }

            return {
              name: field.name || `field_${fieldIndex}`,
              type: field.type || field.tagName.toLowerCase(),
              value: field.value || '', // DOM value (may be stale!)
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
            purpose: form.getAttribute('data-purpose') || 'unknown',
            isReactControlled: false
          };
        });

        // Detect page metadata
        const pageTitle = document.title;
        const pageUrl = window.location.pathname;
        const breadcrumbs = Array.from(
          document.querySelectorAll('[data-breadcrumb], .breadcrumb, nav ol li a')
        ).map((el: any) => el.textContent?.trim() || '');

        // Detect available buttons
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map((btn: any) => ({
          text: btn.textContent?.trim() || '',
          disabled: btn.disabled || false,
          className: btn.className || ''
        }));

        // Count React-controlled forms
        const reactControlledCount = forms.filter(f => f.isReactControlled).length;

        const context: PageContext = {
          pageTitle,
          pageUrl,
          breadcrumbs,
          forms,
          buttons,
          detectedAt: new Date().toISOString(),
          hasReactForms: Object.keys(registryForms).length > 0
        };

        setPageContext(context);

        // Update context chips
        const chips = [];
        if (pageUrl.includes('/courses/')) {
          chips.push({ label: 'Course Editor', icon: '📚' });
        }
        if (pageUrl.includes('/teacher/')) {
          chips.push({ label: 'Teacher Mode', icon: '👨‍🏫' });
        }
        if (forms.length > 0) {
          const formsLabel = reactControlledCount > 0
            ? `${reactControlledCount}/${forms.length} Live Forms`
            : `${forms.length} Forms`;
          chips.push({ label: formsLabel, icon: '📝' });
        }
        setContextChips(chips);

        // Generate quick actions based on context
        generateQuickActions(context);
      } catch (error: any) {
        logger.error('Error detecting page context:', error);
      }
    };

    detectPageContext();
    // Reduced interval to 1s for better real-time responsiveness with form registry
    const interval = setInterval(detectPageContext, 1000);
    return () => clearInterval(interval);
  }, [isOpen, getAllFormsData, generateQuickActions]);

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
    if ((e.target as HTMLElement).closest('.sam-drag-handle') && windowPosition) {
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
      const margin = 20;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Calculate boundaries to keep SAM fully within viewport
      const minX = margin;
      const minY = margin;
      const maxX = window.innerWidth - samSize.width - margin;
      const maxY = window.innerHeight - samSize.height - margin;

      // Clamp position to ensure SAM stays fully visible
      setWindowPosition({
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY)),
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
  }, [isDragging, dragOffset, samSize]);

  // Handle form update actions (defined before handleAction to avoid circular dependency)
  const handleFormUpdate = useCallback((details: any) => {
    logger.info('Form update requested:', details);

    if (details.action === 'update_chapter_title' && details.title) {
      const titleInput = document.querySelector('[name="title"]') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = details.title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    if (details.action === 'update_chapter_description' && details.value) {
      const descInput = document.querySelector('[name="description"]') as HTMLTextAreaElement;
      if (descInput) {
        descInput.value = details.value;
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
        descInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Generic field setter: set value by id/name/label without echoing current values
    if (details.action === 'set_field_value' && details.value) {
      const escapeForAttr = (s: string) => {
        try { return (window as any).CSS && (window as any).CSS.escape ? (window as any).CSS.escape(s) : s.replace(/["\\\]]/g, '\\$&'); } catch { return s; }
      };
      const trySetValue = (el: HTMLElement | null, value: string) => {
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      };

      let target: HTMLElement | null = null;
      if (details.id) {
        target = document.getElementById(details.id) as HTMLElement | null;
      }
      if (!target && details.name) {
        const esc = escapeForAttr(details.name);
        target = document.querySelector(`[name="${esc}"]`) as HTMLElement | null;
      }
      if (!target && details.label) {
        // Match label text to input via for= or aria-label/placeholder
        const labels = Array.from(document.querySelectorAll('label')) as HTMLLabelElement[];
        const foundLabel = labels.find(l => (l.textContent || '').trim().toLowerCase().includes(String(details.label).toLowerCase()));
        if (foundLabel) {
          const forId = foundLabel.getAttribute('for');
          if (forId) {
            target = document.getElementById(forId) as HTMLElement | null;
          } else {
            // label wrapping input
            const inputInside = foundLabel.querySelector('input, textarea, select') as HTMLElement | null;
            if (inputInside) target = inputInside;
          }
        }
        if (!target) {
          const esc = escapeForAttr(details.label);
          target = document.querySelector(`[aria-label="${esc}"]`) as HTMLElement | null;
        }
        if (!target) {
          const esc = escapeForAttr(details.label);
          target = document.querySelector(`[placeholder*="${esc}" i]`) as HTMLElement | null;
        }
      }

      const ok = trySetValue(target, details.value);
      logger.info('Generic field set', { ok, via: target?.tagName, id: details.id, name: details.name, label: details.label });
    }
  }, []);

  // Handle actions from API responses
  const handleAction = useCallback((action: any) => {
    switch (action.type) {
      case 'form_update':
        handleFormUpdate(action.details);
        break;
      case 'navigation':
        if (action.details.url) {
          window.location.href = action.details.url;
        }
        break;
      case 'page_action':
        if (action.details.action === 'refresh') {
          window.location.reload();
        }
        break;
      default:
        logger.warn('Unknown action type:', action.type);
    }
  }, [handleFormUpdate]);

  // Handle quick action clicks
  const handleQuickAction = useCallback(async (action: QuickAction) => {
    const actionMessage: Message = {
      id: Date.now().toString(),
      content: `🎯 ${action.label}: ${action.description}`,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, actionMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/sam/context-aware-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: action.label,
          pathname: pageContext?.pageUrl || '',
          pageContext: {
            pageName: pageContext?.pageTitle || 'Unknown Page',
            pageType: determinePageType(pageContext?.pageUrl || ''),
            breadcrumbs: pageContext?.breadcrumbs || [],
            capabilities: ['form-detection', 'content-generation', 'page-analysis'],
            dataContext: {
              forms: pageContext?.forms?.map((form) => ({
                id: form.id,
                purpose: form.purpose,
                fields: form.fields.map((field) => ({
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
              courseId: extractIdFromPath(pageContext?.pageUrl, 'courses'),
              chapterId: extractIdFromPath(pageContext?.pageUrl, 'chapters'),
              sectionId: extractIdFromPath(pageContext?.pageUrl, 'section')
            }
          },
          conversationHistory: messages.slice(-5).map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'I can help with that!',
          isUser: false,
          timestamp: new Date(),
          suggestions: data.suggestions || []
        };

        setMessages(prev => [...prev, aiMessage]);

        if (data.action) {
          handleAction(data.action);
        }
      }
    } catch (error: any) {
      logger.error('Quick action error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I&apos;m ready to help with ${action.label}! What specifically would you like assistance with?`,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [pageContext, messages, handleAction]);

  // Handle send message
  // Handle sending messages with full API integration
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
      // 1) Generic capability intent via parser + field index (no API call)
      const text = currentInput.toLowerCase();
      const parsed = classifyIntent(currentInput);

      const resolveTarget = (target?: string) => {
        if (!target && pendingFieldEdit) {
          // Fallback to the pending target
          return { label: pendingFieldEdit.label, id: pendingFieldEdit.id, name: pendingFieldEdit.name };
        }
        if (!target) return null;
        const match = resolveFieldByPhrase(fieldIndex, target, FIELD_SYNONYMS);
        if (match) {
          return { label: match.label || match.name || match.ariaLabel || target, id: match.id, name: match.name };
        }
        return null;
      };

      if (parsed.intent) {
        if (parsed.intent === 'presence') {
          const field = resolveTarget(parsed.target);
          if (field) {
            setPendingFieldEdit({ key: field.label || parsed.target || 'field', label: field.label, id: field.id, name: field.name });
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `Yes — I can see the ${parsed.target || field.label} field. Would you like me to modify it or read its current value?`,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          } else {
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `I couldn't find a field matching "${parsed.target || 'that'}" on this page. Want me to search alternatives or guide you?`,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          }
        }

        if (parsed.intent === 'retrieve') {
          const field = resolveTarget(parsed.target);
          if (field) {
            setPendingFieldRead({ label: field.label, id: field.id, name: field.name });
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `I can read the current value of ${field.label}. Should I read it now?`,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          } else if (pendingFieldEdit && !parsed.target) {
            // Follow-up like "what is it" while a field is pending
            setPendingFieldRead({ label: pendingFieldEdit.label, id: pendingFieldEdit.id, name: pendingFieldEdit.name });
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `I can read the current value of ${pendingFieldEdit.label}. Should I read it now?`,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          }
        }

        if (parsed.intent === 'modify') {
          const field = resolveTarget(parsed.target);
          if (field && parsed.value) {
            handleFormUpdate({ action: 'set_field_value', id: field.id, name: field.name, label: field.label, value: parsed.value });
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `Updated the ${field.label}.`,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          }
          if (field && !parsed.value) {
            setPendingFieldEdit({ key: field.label || 'field', label: field.label, id: field.id, name: field.name });
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `Sure — what would you like the new ${field.label} to be?`,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          }
        }
      }

      const detectFieldIntent = (t: string): null | { key: 'title' | 'description' } => {
        const titleKeys = ['title', 'course title', 'name'];
        const descKeys = ['description', 'overview', 'course overview', 'details', 'summary'];
        const askKeys = [
          'can you see', 'do you see', 'can you access', 'can you find',
          'tell me', 'what is', "what's", 'show me', 'read', 'get', 'fetch',
          'do you know', 'is there', 'is the', 'do we have'
        ];
        const mentionsAsk = askKeys.some(k => t.includes(k));
        const mentionsTitle = titleKeys.some(k => t.includes(k));
        const mentionsDesc = descKeys.some(k => t.includes(k));
        if (!mentionsTitle && !mentionsDesc) return null;
        if (!mentionsAsk) return null;
        if (mentionsTitle) return { key: 'title' };
        if (mentionsDesc) return { key: 'description' };
        return null;
      };

      const parseDirectModifyIntent = (t: string): null | { key: 'title' | 'description'; value: string } => {
        const patterns: Array<{ key: 'title' | 'description'; re: RegExp }> = [
          { key: 'title', re: /(set|change|update)\s+(the\s+)?(course\s+)?(title|name)\s+(to|as)\s+(.+)/i },
          { key: 'description', re: /(set|change|update)\s+(the\s+)?(course\s+)?(description|overview)\s+(to|as)\s+(.+)/i },
        ];
        for (const p of patterns) {
          const m = t.match(p.re);
          if (m && m[6]) {
            const raw = m[6].trim();
            // strip wrapping quotes if any
            const value = raw.replace(/^"|^'|"$|'$/g, '').trim();
            return { key: p.key, value };
          }
        }
        return null;
      };

      const findFieldInContext = (key: 'title' | 'description'): null | { label: string; id?: string; name?: string } => {
        const matches = (s: string, need: 'title' | 'description') => {
          const L = (s || '').toLowerCase();
          if (need === 'title') return L.includes('title') || L.includes('name');
          return L.includes('description') || L.includes('overview') || L.includes('summary');
        };
        // Try from detected forms first
        if (pageContext?.forms) {
          for (const form of pageContext.forms) {
            for (const f of form.fields) {
              const label = f.label || f.name || '';
              const name = f.name || '';
              if ((label && matches(label, key)) || (name && matches(name, key))) {
                return { label: label || name, id: f.id, name: f.name };
              }
            }
          }
        }
        // Fallback: direct DOM scan (not limited to <form>)
        const labelEls = Array.from(document.querySelectorAll('label')) as HTMLLabelElement[];
        const foundLabel = labelEls.find(l => matches(l.textContent || '', key));
        if (foundLabel) {
          const forId = foundLabel.getAttribute('for');
          if (forId) return { label: foundLabel.textContent?.trim() || '', id: forId };
          const inputInside = foundLabel.querySelector('input, textarea, select') as HTMLElement | null;
          if (inputInside) return { label: foundLabel.textContent?.trim() || '' };
        }
        const selParts = key === 'title'
          ? [
              'input[name*="title" i]',
              'input[id*="title" i]',
              'input[aria-label*="title" i]',
              'textarea[name*="title" i]'
            ]
          : [
              'textarea[name*="description" i]',
              'textarea[id*="description" i]',
              'textarea[aria-label*="description" i]',
              'textarea[name*="overview" i]',
              'textarea[id*="overview" i]'
            ];
        const target = document.querySelector(selParts.join(',')) as HTMLElement | null;
        if (target) {
          const label = key === 'title' ? 'Course Title' : 'Description';
          return { label };
        }
        return null;
      };

      // If a direct modify intent with value is provided, try to apply locally
      const direct = parseDirectModifyIntent(currentInput);
      if (direct) {
        const field = findFieldInContext(direct.key);
        if (field) {
          handleFormUpdate({ action: 'set_field_value', id: field.id, name: field.name, label: field.label, value: direct.value });
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Updated the ${direct.key}.`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        } else {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `I couldn't find a ${direct.key} field on this page. Would you like me to search alternatives or guide you to the correct step?`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
      }

      // If waiting on a field read confirmation (privacy: ask before reading values)
      if (pendingFieldRead) {
        const affirm = /(yes|yep|yeah|please|read|show|display)/i.test(currentInput);
        const cancel = /(no|cancel|stop|never mind|nevermind)/i.test(currentInput);
        if (cancel) {
          setPendingFieldRead(null);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: 'Okay, I will not read it.',
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        if (affirm) {
          const tryRead = (): string | null => {
            let el: HTMLElement | null = null;
            if (pendingFieldRead.id) el = document.getElementById(pendingFieldRead.id) as HTMLElement | null;
            if (!el && pendingFieldRead.name) el = document.querySelector(`[name="${pendingFieldRead.name}"]`) as HTMLElement | null;
            if (!el) {
              // Try approximate query by label
              const q = pendingFieldRead.label.toLowerCase();
              el = document.querySelector(`input[aria-label*="${q}" i], textarea[aria-label*="${q}" i], input[placeholder*="${q}" i], textarea[placeholder*="${q}" i]`) as HTMLElement | null;
            }
            if (el) {
              const tag = el.tagName.toLowerCase();
              if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                const v = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
                return (v ?? '').toString();
              }
            }
            return null;
          };
          const v = tryRead();
          setPendingFieldRead(null);
          const content = v && v.trim().length > 0
            ? `The ${pendingFieldRead.label} is: "${v}"`
            : `I don't see a value entered for ${pendingFieldRead.label} yet.`;
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
      }

      // If waiting on a field edit confirmation
      if (pendingFieldEdit) {
        const affirm = /(yes|yep|yeah|please|modify|update|change)/i.test(currentInput);
        const cancel = /(no|cancel|stop|never mind|nevermind)/i.test(currentInput);
        const withValue = currentInput.match(/\b(to|as)\b\s+(.+)/i);
        if (cancel) {
          setPendingFieldEdit(null);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: 'Okay, not modifying it.',
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        if (affirm && !withValue) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `What would you like the new ${pendingFieldEdit.key} to be?`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        if (withValue && withValue[2]) {
          const newVal = withValue[2].replace(/^"|^'|"$|'$/g, '').trim();
          handleFormUpdate({ action: 'set_field_value', id: pendingFieldEdit.id, name: pendingFieldEdit.name, label: pendingFieldEdit.label, value: newVal });
          setPendingFieldEdit(null);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Updated the ${pendingFieldEdit.label}.`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        // If user provided a free-text value (no "to/as"), treat entire input as value
        const freeVal = currentInput.trim();
        if (!affirm && !cancel && freeVal.length > 0) {
          handleFormUpdate({ action: 'set_field_value', id: pendingFieldEdit.id, name: pendingFieldEdit.name, label: pendingFieldEdit.label, value: freeVal });
          setPendingFieldEdit(null);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Updated the ${pendingFieldEdit.label}.`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        // Otherwise fall through to API for generic assistance
      }

      // If waiting on a field read confirmation (privacy: ask before reading values)
      if (pendingFieldRead) {
        const affirm = /(yes|yep|yeah|please|read|show|display)/i.test(currentInput);
        const cancel = /(no|cancel|stop|never mind|nevermind)/i.test(currentInput);
        if (cancel) {
          setPendingFieldRead(null);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: 'Okay, I will not read it.',
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
        if (affirm) {
          const tryRead = (): string | null => {
            let el: HTMLElement | null = null;
            if (pendingFieldRead.id) el = document.getElementById(pendingFieldRead.id) as HTMLElement | null;
            if (!el && pendingFieldRead.name) el = document.querySelector(`[name="${pendingFieldRead.name}"]`) as HTMLElement | null;
            if (!el) {
              // Try approximate query by label
              const q = pendingFieldRead.label.toLowerCase();
              el = document.querySelector(`input[aria-label*="${q}" i], textarea[aria-label*="${q}" i], input[placeholder*="${q}" i], textarea[placeholder*="${q}" i]`) as HTMLElement | null;
            }
            if (el) {
              const tag = el.tagName.toLowerCase();
              if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                const v = (el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
                return (v ?? '').toString();
              }
            }
            return null;
          };
          const v = tryRead();
          setPendingFieldRead(null);
          const content = v && v.trim().length > 0
            ? `The ${pendingFieldRead.label} is: "${v}"`
            : `I don't see a value entered for ${pendingFieldRead.label} yet.`;
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
      }

      // Check for a capability/retrieval question about title/description
      const intent = detectFieldIntent(text);
      if (intent) {
        const field = findFieldInContext(intent.key);
        if (field) {
          setPendingFieldEdit({ key: intent.key, label: field.label, id: field.id, name: field.name });
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Yes — I can see the ${intent.key} field. Would you like me to modify it?`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        } else {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `I don't see a ${intent.key} field on this page. Want me to search alternatives or guide you to that step?`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          return;
        }
      }

      // Modify intent without value ("change the title", "update description")
      const mentionsModify = /(modify|change|update|edit|set)\b/.test(text);
      if (mentionsModify) {
        const mentionsTitle = /(course\s+)?(title|name)\b/.test(text);
        const mentionsDesc = /(course\s+)?(description|overview|summary)\b/.test(text);
        const key = mentionsTitle ? 'title' : (mentionsDesc ? 'description' : null);
        if (key) {
          const field = findFieldInContext(key as 'title' | 'description');
          if (field) {
            setPendingFieldEdit({ key: key as 'title' | 'description', label: field.label, id: field.id, name: field.name });
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `Sure — what would you like the new ${key} to be?`,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            return;
          }
        }
      }

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
            pageType: determinePageType(pageContext?.pageUrl || ''),
            breadcrumbs: pageContext?.breadcrumbs || [],
            capabilities: ['form-detection', 'content-generation', 'page-analysis'],
            dataContext: {
              forms: pageContext?.forms?.map((form) => ({
                id: form.id,
                purpose: form.purpose,
                fields: form.fields.map((field) => ({
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
              courseId: extractIdFromPath(pageContext?.pageUrl, 'courses'),
              chapterId: extractIdFromPath(pageContext?.pageUrl, 'chapters'),
              sectionId: extractIdFromPath(pageContext?.pageUrl, 'section')
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

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Sorry, I encountered an error processing your request.',
        isUser: false,
        timestamp: new Date(),
        suggestions: data.suggestions || []
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle action if any
      if (data.action) {
        handleAction(data.action);
      }
    } catch (error: any) {
      logger.error('Error sending message:', error);

      // Fallback response with smart context awareness
      let fallbackResponse = '';

      if (currentInput.toLowerCase().includes('page') || currentInput.toLowerCase().includes('where')) {
        fallbackResponse = `I can see you&apos;re on "${pageContext?.pageTitle || 'this page'}" (${pageContext?.pageUrl || 'unknown URL'}). This page has ${pageContext?.forms?.length || 0} form(s) and ${pageContext?.buttons?.length || 0} button(s). How can I help you with this page?`;
      } else if (currentInput.toLowerCase().includes('form') || currentInput.toLowerCase().includes('field')) {
        const formsInfo = pageContext?.forms?.map((form) =>
          `${form.purpose !== 'unknown' ? form.purpose : form.id}: ${form.fields.length} fields`
        ).join(', ') || 'no forms detected';
        fallbackResponse = `I can see these forms on this page: ${formsInfo}. Which form would you like help with?`;
      } else {
        fallbackResponse = `I understand you&apos;re asking about "${currentInput}". I can see you&apos;re working on "${pageContext?.pageTitle || 'this page'}" with ${pageContext?.forms?.length || 0} form(s). How can I specifically help you?`;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, pageContext, messages, handleAction, pendingFieldEdit, pendingFieldRead, handleFormUpdate, fieldIndex]);

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

  // Don't render on non-desktop; mobile/tablet use SAMMobileResponsive
  if (!session || !shouldShow || !mounted || screenSize !== 'desktop') return null;

  return (
    <div className={cn("sam-global-assistant-redesigned", className)}>
      {/* Modern Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <Button
            onClick={handleOpenSAM}
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
      {isOpen && windowPosition && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          <div
            ref={dragRef}
            onMouseDown={handleMouseDown}
            style={{
              position: 'fixed',
              left: `${windowPosition.x}px`,
              top: `${windowPosition.y}px`,
              width: `${samSize.width}px`,
              height: `${samSize.height}px`,
              pointerEvents: 'auto',
            }}
            className={cn(
              "rounded-2xl shadow-2xl backdrop-blur-xl",
              "flex flex-col", // Flex column for proper layout
              "border transition-shadow duration-300",
              isDark
                ? "bg-gray-900/95 border-gray-700/50"
                : "bg-white/95 border-gray-200/50"
            )}
          >
            {/* Minimal Header - Drag Handle - FIXED */}
            <div
              className={cn(
                "sam-drag-handle flex items-center justify-between px-4 py-3",
                "cursor-move select-none hover:bg-opacity-80 transition-all",
                "border-b backdrop-blur-sm shrink-0", // shrink-0 prevents header collapse
                "min-h-[60px]", // Ensure minimum height
                isDark ? "border-gray-800/50 hover:bg-gray-800/30" : "border-gray-200/50 hover:bg-gray-100/50",
                isDragging && "cursor-grabbing"
              )}
              title="Drag to move SAM Assistant"
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
                    "font-semibold text-sm flex items-center gap-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    SAM
                    {/* Drag indicator dots */}
                    <span className={cn(
                      "flex gap-0.5 opacity-40",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}>
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                      <span className="w-1 h-1 rounded-full bg-current"></span>
                    </span>
                  </h3>
                  <p className={cn(
                    "text-xs",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}>
                    AI Assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
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

                {/* Messages Area - Chat First - FIXED SCROLL */}
                <ScrollArea className="flex-1 overflow-y-auto px-4 py-4">
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

                {/* Quick Actions - Context-aware smart actions */}
                {quickActions.length > 0 && messages.length === 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          disabled={!action.available || isLoading}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap",
                            "border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
                            "text-xs font-medium shadow-sm",
                            isDark
                              ? "border-violet-600/50 bg-violet-600/10 text-violet-300 hover:bg-violet-600/20 hover:border-violet-500"
                              : "border-violet-500/50 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-500"
                          )}
                          title={action.description}
                        >
                          <action.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart Suggestions - After messages */}
                {smartSuggestions.length > 0 && messages.length > 0 && (
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

                {/* Large Input Area - Modern Design - FIXED */}
                <div className={cn(
                  "px-4 py-3 border-t shrink-0", // shrink-0 keeps input area fixed
                  "mt-auto", // Push to bottom
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
