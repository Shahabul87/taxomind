"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  X,
  Send,
  Minimize2,
  Maximize2,
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronRight,
  FileText,
  Wand2,
  Target,
  Brain,
  AlertCircle,
  Zap,
  Trophy,
  Flame,
  Star,
  Edit3,
  Check,
  Copy,
  ClipboardCheck,
  ArrowDownToLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import SAM utilities
import {
  detectFormFields,
  generateFormSuggestions,
  executeFormFill,
  type FormFieldInfo,
  type FormFillSuggestion,
} from '@/lib/sam/form-actions';

// ============================================================================
// WINDOW CONTEXT TYPES
// ============================================================================

interface WindowCourseContext {
  entityType: 'course' | 'chapter' | 'section';
  entityId: string;
  entityData: {
    title?: string;
    description?: string | null;
    whatYouWillLearn?: string[];
    learningObjectives?: string[];
    isPublished?: boolean;
    categoryId?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    chapterCount?: number;
    publishedChapters?: number;
    chapters?: Array<{
      id: string;
      title: string;
      description?: string | null;
      isPublished?: boolean;
      isFree?: boolean;
      position?: number;
      sectionCount?: number;
      sections?: Array<{
        id: string;
        title: string;
        isPublished?: boolean;
      }>;
    }>;
    fullCourseData?: Record<string, unknown>;
    // Chapter-specific
    courseId?: string;
    courseTitle?: string;
    sectionCount?: number;
    sections?: Array<{
      id: string;
      title: string;
      isPublished?: boolean;
    }>;
    // Section-specific
    chapterId?: string;
    chapterTitle?: string;
    content?: string | null;
    contentType?: string | null;
    videoUrl?: string | null;
  };
  completionStatus?: Record<string, boolean>;
  workflow?: {
    currentStep?: number;
    nextAction?: string;
    progress?: number;
  };
}

declare global {
  interface Window {
    courseContext?: WindowCourseContext;
    chapterContext?: WindowCourseContext;
    sectionContext?: WindowCourseContext;
    samFormInteractions?: Record<string, (value: unknown) => void>;
    chapterFormInteractions?: Record<string, (value: unknown) => void>;
  }
}

import {
  GamificationEngine,
  createGamificationEngine,
  type UserProgress,
  type XPEvent,
  type GamificationEvent,
} from '@/lib/sam/gamification';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  targetField?: string; // Field this content was generated for
  userQuery?: string; // Original user query that generated this response
}

interface SAMSuggestion {
  id: string;
  text: string;
  label?: string;
  type?: 'quick-reply' | 'action' | 'resource';
}

interface SAMAction {
  id: string;
  type: string;
  label: string;
  payload?: Record<string, unknown>;
}

interface PageContext {
  pageName: string;
  pageType: string;
  path: string;
  breadcrumbs: string[];
  capabilities: string[];
  entityId?: string;
  parentEntityId?: string;
  grandParentEntityId?: string;
}

interface BloomsInsight {
  distribution?: Record<string, number>;
  dominantLevel?: string;
  recommendations?: string[];
  gaps?: string[];
}

interface SAMInsights {
  blooms?: BloomsInsight;
  content?: {
    metrics?: Record<string, unknown>;
    suggestions?: unknown[];
    overallScore?: number;
  };
  personalization?: {
    learningStyle?: unknown;
    cognitiveLoad?: unknown;
    motivation?: unknown;
  };
  context?: {
    intent?: string;
    keywords?: string[];
    complexity?: string;
  };
}

interface SAMAssistantProps {
  className?: string;
  enableStreaming?: boolean;
  enableGamification?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SAMAssistant - Full-featured AI assistant with streaming, form actions & gamification
 *
 * Features:
 * - Automatic page context detection from URL
 * - Form detection and AI-powered field population
 * - Real-time streaming responses
 * - Gamification with XP, levels, and achievements
 * - Bloom's taxonomy visualization
 * - Intelligent suggestions and actions
 */
export function SAMAssistant({
  className,
  enableStreaming = true,
  enableGamification = true,
}: SAMAssistantProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<SAMSuggestion[]>([]);
  const [actions, setActions] = useState<SAMAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<SAMInsights | null>(null);
  const [enginesInfo, setEnginesInfo] = useState<{ run: string[]; time: number } | null>(null);

  // Form actions state
  const [detectedForms, setDetectedForms] = useState<Record<string, FormFieldInfo>>({});
  const [formSuggestions, setFormSuggestions] = useState<FormFillSuggestion[]>([]);
  const [showFormPanel, setShowFormPanel] = useState(false);

  // Entity context state - tracks data from SimpleCourseContext
  const [windowEntityContext, setWindowEntityContext] = useState<{
    entityData?: WindowCourseContext['entityData'];
    entityType?: string;
  }>({});

  // Gamification state
  const [gamificationEngine, setGamificationEngine] = useState<GamificationEngine | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [xpNotifications, setXpNotifications] = useState<XPEvent[]>([]);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);

  // Copy/Insert state
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [insertedMessageId, setInsertedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize gamification engine
  useEffect(() => {
    if (enableGamification && session?.user?.id) {
      const engine = createGamificationEngine(session.user.id);
      setGamificationEngine(engine);
      setUserProgress(engine.getProgress());

      // Subscribe to gamification events
      const unsubscribe = engine.subscribe((event: GamificationEvent) => {
        if (event.type === 'xp_gained') {
          setXpNotifications(prev => [...prev, event.data]);
          setShowXpAnimation(true);
          setTimeout(() => setShowXpAnimation(false), 2000);
        }
        setUserProgress(engine.getProgress());
      });

      return () => unsubscribe();
    }
  }, [enableGamification, session?.user?.id]);

  // Listen for entity context from SimpleCourseContext and similar components
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for existing context on mount
    const checkExistingContext = () => {
      if (window.courseContext?.entityData) {
        console.log('[SAMAssistant] Found existing course context:', window.courseContext.entityData.title);
        setWindowEntityContext({
          entityType: 'course',
          entityData: window.courseContext.entityData,
        });
      } else if (window.chapterContext?.entityData) {
        console.log('[SAMAssistant] Found existing chapter context:', window.chapterContext.entityData.title);
        setWindowEntityContext({
          entityType: 'chapter',
          entityData: window.chapterContext.entityData,
        });
      } else if (window.sectionContext?.entityData) {
        console.log('[SAMAssistant] Found existing section context:', window.sectionContext.entityData.title);
        setWindowEntityContext({
          entityType: 'section',
          entityData: window.sectionContext.entityData,
        });
      }
    };

    // Check immediately
    checkExistingContext();

    // Also check after a short delay (SimpleCourseContext has a 1s setTimeout)
    const delayedCheck = setTimeout(checkExistingContext, 1500);

    // Listen for context update events from SimpleCourseContext
    const handleContextUpdate = (event: CustomEvent) => {
      console.log('[SAMAssistant] Received sam-context-update event:', event.detail);
      const { serverData } = event.detail || {};
      if (serverData?.entityData) {
        setWindowEntityContext({
          entityType: serverData.entityType || 'course',
          entityData: serverData.entityData,
        });
      }
    };

    window.addEventListener('sam-context-update', handleContextUpdate as EventListener);

    return () => {
      clearTimeout(delayedCheck);
      window.removeEventListener('sam-context-update', handleContextUpdate as EventListener);
    };
  }, [pathname]); // Re-run when pathname changes

  // Detect page context from URL
  const pageContext = useMemo((): PageContext => {
    const path = pathname || '/';
    const pageType = detectPageType(path);
    const pageName = detectPageName(pageType);
    const breadcrumbs = buildBreadcrumbs(path);
    const capabilities = getPageCapabilities(pageType);

    const courseMatch = path.match(/\/courses\/([^/]+)/);
    const chapterMatch = path.match(/\/chapters\/([^/]+)/);
    const sectionMatch = path.match(/\/section\/([^/]+)/);

    return {
      pageName,
      pageType,
      path,
      breadcrumbs,
      capabilities,
      entityId: sectionMatch?.[1] || chapterMatch?.[1] || courseMatch?.[1],
      parentEntityId: chapterMatch?.[1] || courseMatch?.[1],
      grandParentEntityId: courseMatch?.[1],
    };
  }, [pathname]);

  /**
   * Get entity context from window object (injected by SimpleCourseContext, etc.)
   * This provides real course/chapter/section data for SAM to use
   */
  const getWindowEntityContext = useCallback((): {
    entityData?: WindowCourseContext['entityData'];
    entityType?: string;
  } => {
    if (typeof window === 'undefined') return {};

    // Check for section context first (most specific)
    if (window.sectionContext?.entityData) {
      return {
        entityType: 'section',
        entityData: window.sectionContext.entityData,
      };
    }

    // Check for chapter context
    if (window.chapterContext?.entityData) {
      return {
        entityType: 'chapter',
        entityData: window.chapterContext.entityData,
      };
    }

    // Check for course context
    if (window.courseContext?.entityData) {
      return {
        entityType: 'course',
        entityData: window.courseContext.entityData,
      };
    }

    return {};
  }, []);

  // Detect forms on the page when SAM opens
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const fields = detectFormFields();
      setDetectedForms(fields);

      // Generate form fill suggestions
      if (Object.keys(fields).length > 0) {
        const suggestions = generateFormSuggestions(fields, {
          pageType: pageContext.pageType,
          entityId: pageContext.entityId,
        });
        setFormSuggestions(suggestions);
      }
    }
  }, [isOpen, pathname, pageContext.pageType, pageContext.entityId]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup event source on unmount
  useEffect(() => {
    const eventSource = eventSourceRef.current;
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Send message with streaming support
  const sendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setError(null);
    setInsights(null);

    // Award XP for asking question
    if (gamificationEngine) {
      if (isFirstInteraction) {
        gamificationEngine.awardXP('first_interaction');
        setIsFirstInteraction(false);
      }
      gamificationEngine.awardXP('question_asked');
      gamificationEngine.checkStreak();
    }

    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Use state-tracked entity context (populated by SimpleCourseContext event listener)
    // Also check window directly as a fallback
    const effectiveEntityContext = windowEntityContext.entityData
      ? windowEntityContext
      : getWindowEntityContext();

    console.log('[SAMAssistant] Sending message with entity context:', {
      hasEntityData: !!effectiveEntityContext.entityData,
      entityType: effectiveEntityContext.entityType,
      title: effectiveEntityContext.entityData?.title,
      fromState: !!windowEntityContext.entityData,
    });

    // Merge form fields with entity context data for better awareness
    const enrichedFormContext = Object.keys(detectedForms).length > 0 || effectiveEntityContext.entityData ? {
      formId: 'detected-form',
      formName: 'Page Form',
      fields: {
        ...detectedForms,
        // Add entity data as pseudo-form fields for context
        ...(effectiveEntityContext.entityData?.title && {
          _courseTitle: {
            name: '_courseTitle',
            type: 'text',
            value: effectiveEntityContext.entityData.title,
            label: 'Course Title',
          },
        }),
        ...(effectiveEntityContext.entityData?.description && {
          _courseDescription: {
            name: '_courseDescription',
            type: 'textarea',
            value: effectiveEntityContext.entityData.description,
            label: 'Course Description',
          },
        }),
      },
      isDirty: false,
    } : undefined;

    const requestBody = {
      message: content.trim(),
      pageContext: {
        type: pageContext.pageType,
        path: pageContext.path,
        entityId: pageContext.entityId,
        parentEntityId: pageContext.parentEntityId,
        grandParentEntityId: pageContext.grandParentEntityId,
        capabilities: pageContext.capabilities,
        breadcrumb: pageContext.breadcrumbs,
        // Include entity data for full context awareness
        entityData: effectiveEntityContext.entityData,
        entityType: effectiveEntityContext.entityType,
      },
      formContext: enrichedFormContext,
      conversationHistory,
    };

    if (enableStreaming) {
      await sendStreamingMessage(requestBody);
    } else {
      await sendRegularMessage(requestBody);
    }
  };

  // Streaming message handler
  const sendStreamingMessage = async (requestBody: Record<string, unknown>) => {
    try {
      // Create assistant message placeholder
      const assistantMessageId = `msg-${Date.now() + 1}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages(prev => [...prev, assistantMessage]);

      const response = await fetch('/api/sam/unified/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to streaming API');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            continue;
          }

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              handleStreamEvent(assistantMessageId, parsed, line);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Mark message as complete
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMessageId ? { ...m, isStreaming: false } : m
        )
      );

      // Award XP for content generation if applicable
      if (gamificationEngine && requestBody.message) {
        const msg = String(requestBody.message).toLowerCase();
        if (msg.includes('generate') || msg.includes('create') || msg.includes('write')) {
          gamificationEngine.awardXP('content_generated');
        }
      }

    } catch (err) {
      handleError(err as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle stream events
  const handleStreamEvent = (messageId: string, data: Record<string, unknown>, rawLine: string) => {
    // Check event type from the line before data
    if (rawLine.includes('"text"')) {
      // Content chunk
      const text = data.text as string;
      if (text) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId ? { ...m, content: m.content + text } : m
          )
        );
      }
    } else if ('blooms' in data || 'content' in data || 'personalization' in data) {
      // Insights
      setInsights(data as SAMInsights);
    } else if (Array.isArray(data) && data[0]?.id && data[0]?.text) {
      // Suggestions
      setSuggestions(data as SAMSuggestion[]);
    } else if (Array.isArray(data) && data[0]?.id && data[0]?.type) {
      // Actions
      setActions(data as SAMAction[]);
    } else if ('enginesRun' in data || 'metadata' in data) {
      // Completion metadata
      const metadata = (data.metadata || data) as { enginesRun?: string[]; totalTime?: number };
      if (metadata.enginesRun) {
        setEnginesInfo({
          run: metadata.enginesRun,
          time: metadata.totalTime || 0,
        });
      }
    }
  };

  // Regular (non-streaming) message handler
  const sendRegularMessage = async (requestBody: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/sam/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.response || 'I apologize, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.suggestions?.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }

      if (data.actions?.length > 0) {
        setActions(data.actions);
      } else {
        setActions([]);
      }

      if (data.insights) {
        setInsights(data.insights);
      }

      if (data.metadata) {
        setEnginesInfo({
          run: data.metadata.enginesRun,
          time: data.metadata.totalTime,
        });
      }

    } catch (err) {
      handleError(err as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Error handler
  const handleError = (err: Error) => {
    const errorMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: 'I apologize, something went wrong. Please try again.',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, errorMessage]);
    setError(err.message);
  };

  // Handle keyboard input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SAMSuggestion) => {
    sendMessage(suggestion.text);
  };

  // Handle action click
  const handleActionClick = (action: SAMAction) => {
    if (action.type === 'navigation' && action.payload?.url) {
      window.location.href = action.payload.url as string;
    } else if (action.type === 'page_action' && action.payload?.action === 'refresh') {
      window.location.reload();
    } else if (action.type === 'form_fill' && action.payload?.field) {
      executeFormFill(action.payload.field as string, action.payload.value);
    } else if (action.payload?.action) {
      executeFormAction(action.payload.action as string, action.payload);
    }
  };

  // Execute form action
  const executeFormAction = (action: string, payload: Record<string, unknown>) => {
    const formInteractions = (window as unknown as { chapterFormInteractions?: Record<string, (value: unknown) => void> }).chapterFormInteractions;
    const samFormInteractions = (window as unknown as { samFormInteractions?: Record<string, (value: unknown) => void> }).samFormInteractions;

    const interactions = samFormInteractions || formInteractions;

    if (interactions) {
      switch (action) {
        case 'update_chapter_title':
        case 'update_title':
          interactions.updateTitle?.(payload.title || payload.value);
          break;
        case 'update_chapter_description':
        case 'update_description':
          interactions.updateDescription?.(payload.value);
          break;
        case 'update_learning_outcomes':
          interactions.updateLearningOutcomes?.(payload.outcomes);
          break;
        case 'create_sections':
          interactions.createSections?.(payload.sections);
          break;
        case 'publish_chapter':
        case 'publish':
          interactions.publish?.(undefined);
          break;
        case 'unpublish_chapter':
        case 'unpublish':
          interactions.unpublish?.(undefined);
          break;
        case 'update_chapter_access':
          interactions.updateAccess?.(payload.isFree);
          break;
        case 'submit':
          interactions.submit?.(undefined);
          break;
      }
    }
  };

  // Handle form fill suggestion
  const handleFormFillClick = (suggestion: FormFillSuggestion) => {
    sendMessage(`Generate content for the ${suggestion.field} field`);
  };

  // Handle copy content to clipboard
  const handleCopyContent = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      // Reset after 2 seconds
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('[SAMAssistant] Failed to copy:', err);
      setError('Failed to copy to clipboard');
    }
  };

  // Handle insert content into form field
  const handleInsertContent = (messageId: string, content: string, targetField?: string) => {
    // Try using form interactions first (React-controlled forms)
    const formInteractions = window.samFormInteractions || window.chapterFormInteractions;

    if (formInteractions && targetField) {
      // Map target field to the appropriate update function
      const fieldActions: Record<string, string> = {
        title: 'updateTitle',
        description: 'updateDescription',
        content: 'updateContent',
        whatYouWillLearn: 'updateLearningOutcomes',
        courseGoals: 'updateCourseGoals',
        prerequisites: 'updatePrerequisites',
        subtitle: 'updateSubtitle',
      };

      const actionName = fieldActions[targetField];
      if (actionName && formInteractions[actionName]) {
        formInteractions[actionName](content);
        setInsertedMessageId(messageId);
        setTimeout(() => setInsertedMessageId(null), 2000);
        return;
      }
    }

    // Fallback: try direct DOM insertion
    if (targetField) {
      const success = executeFormFill(targetField, content);
      if (success) {
        setInsertedMessageId(messageId);
        setTimeout(() => setInsertedMessageId(null), 2000);
        return;
      }
    }

    // If no target field, try to find a suitable textarea/input
    const focusedElement = document.activeElement;
    if (focusedElement && (focusedElement.tagName === 'TEXTAREA' || focusedElement.tagName === 'INPUT')) {
      (focusedElement as HTMLInputElement | HTMLTextAreaElement).value = content;
      focusedElement.dispatchEvent(new Event('input', { bubbles: true }));
      focusedElement.dispatchEvent(new Event('change', { bubbles: true }));
      setInsertedMessageId(messageId);
      setTimeout(() => setInsertedMessageId(null), 2000);
      return;
    }

    // Last resort: copy to clipboard
    handleCopyContent(messageId, content);
    setError('No target field found. Content copied to clipboard instead.');
  };

  // Get the user query that preceded an assistant message
  const getUserQueryForMessage = (messageIndex: number): string | undefined => {
    if (messageIndex > 0) {
      const prevMessage = messages[messageIndex - 1];
      if (prevMessage?.role === 'user') {
        return prevMessage.content;
      }
    }
    return undefined;
  };

  // Clear conversation
  const clearMessages = () => {
    setMessages([]);
    setSuggestions([]);
    setActions([]);
    setError(null);
    setInsights(null);
    setEnginesInfo(null);
    setXpNotifications([]);
  };

  // Get quick actions based on page type
  const getQuickActions = (): { label: string; icon: React.ReactNode; action: string }[] => {
    switch (pageContext.pageType) {
      case 'course-detail':
        return [
          { label: 'Generate Chapters', icon: <FileText className="h-4 w-4" />, action: 'Generate chapter structure for this course' },
          { label: 'Improve Description', icon: <Wand2 className="h-4 w-4" />, action: 'Improve the course description' },
          { label: 'Learning Objectives', icon: <Target className="h-4 w-4" />, action: 'Generate learning objectives for this course' },
        ];
      case 'chapter-detail':
        return [
          { label: 'Generate Sections', icon: <FileText className="h-4 w-4" />, action: 'Generate sections for this chapter' },
          { label: 'Generate Content', icon: <Wand2 className="h-4 w-4" />, action: 'Generate content for this chapter' },
          { label: 'Learning Outcomes', icon: <Target className="h-4 w-4" />, action: 'Generate learning outcomes' },
        ];
      case 'section-detail':
        return [
          { label: 'Generate Content', icon: <FileText className="h-4 w-4" />, action: 'Generate section content' },
          { label: 'Create Quiz', icon: <Brain className="h-4 w-4" />, action: 'Create a quiz for this section' },
          { label: 'Improve Description', icon: <Wand2 className="h-4 w-4" />, action: 'Improve the section description' },
        ];
      case 'course-create':
        return [
          { label: 'Course Ideas', icon: <Brain className="h-4 w-4" />, action: 'Suggest course ideas based on current trends' },
          { label: 'Structure Help', icon: <FileText className="h-4 w-4" />, action: 'Help me structure this course' },
          { label: 'Title Suggestions', icon: <Wand2 className="h-4 w-4" />, action: 'Suggest engaging course titles' },
        ];
      default:
        return [
          { label: 'Help Me', icon: <Brain className="h-4 w-4" />, action: 'What can you help me with on this page?' },
          { label: 'Navigate', icon: <ChevronRight className="h-4 w-4" />, action: 'Show me available pages' },
        ];
    }
  };

  // Don't render on auth pages or if no session
  const hideRoutes = ['/auth', '/login', '/register'];
  if (!session || hideRoutes.some(route => pathname?.startsWith(route))) {
    return null;
  }

  const hasDetectedForms = Object.keys(detectedForms).length > 0;
  const xpProgress = userProgress ? getXPProgress(userProgress) : null;

  // Closed state - floating button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* XP Notification */}
        {showXpAnimation && xpNotifications.length > 0 && (
          <div className="animate-bounce bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            +{xpNotifications[xpNotifications.length - 1]?.amount} XP
          </div>
        )}

        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg',
            'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
            'transition-all duration-300 hover:scale-110',
            className
          )}
          aria-label="Open SAM AI Assistant"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 shadow-2xl rounded-2xl overflow-hidden',
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
        'transition-all duration-300 flex flex-col',
        isMinimized
          ? 'bottom-6 right-6 w-72 h-14'
          : 'bottom-6 right-6 w-[28rem] h-[40rem]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <div>
            <span className="font-semibold">SAM AI Assistant</span>
            {!isMinimized && (
              <p className="text-xs text-white/70 truncate max-w-[180px]">
                {pageContext.breadcrumbs.join(' → ') || pageContext.pageName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Gamification indicator */}
          {enableGamification && userProgress && !isMinimized && (
            <div className="flex items-center gap-1 mr-2 bg-white/20 px-2 py-1 rounded-full">
              <Star className="h-3 w-3 text-yellow-300" />
              <span className="text-xs font-medium">Lv.{userProgress.level}</span>
              {userProgress.streak > 0 && (
                <>
                  <Flame className="h-3 w-3 text-orange-300 ml-1" />
                  <span className="text-xs">{userProgress.streak}</span>
                </>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={clearMessages}
            title="Clear conversation"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* XP Progress Bar */}
          {enableGamification && xpProgress && (
            <div className="px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-yellow-100 dark:border-yellow-800 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                    {xpProgress.levelName}
                  </span>
                </div>
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  {userProgress?.xp} XP
                </span>
              </div>
              <div className="h-1.5 bg-yellow-200 dark:bg-yellow-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {xpProgress.current} / {xpProgress.needed} to Level {(userProgress?.level || 1) + 1}
              </p>
            </div>
          )}

          {/* Form Detection Panel */}
          {hasDetectedForms && (
            <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800 shrink-0">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowFormPanel(!showFormPanel)}
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {Object.keys(detectedForms).length} form fields detected
                  </span>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 text-purple-500 transition-transform",
                  showFormPanel && "rotate-90"
                )} />
              </div>
              {showFormPanel && formSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formSuggestions.slice(0, 3).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFormFillClick(suggestion)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 text-left hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {suggestion.field}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.reasoning}
                        </p>
                      </div>
                      <Wand2 className="h-4 w-4 text-purple-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bloom's Insights Panel */}
          {insights?.blooms && insights.blooms.distribution && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Bloom&apos;s Analysis
                </span>
                {insights.blooms.dominantLevel && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
                    {insights.blooms.dominantLevel}
                  </span>
                )}
              </div>
              <div className="flex gap-0.5 mb-1">
                {['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'].map((level, i) => {
                  const score = insights.blooms?.distribution?.[level] || 0;
                  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400'];
                  return (
                    <div
                      key={level}
                      className={cn('h-1.5 flex-1 rounded-full', colors[i])}
                      style={{ opacity: 0.3 + (score * 0.7) }}
                      title={`${level}: ${Math.round(score * 100)}%`}
                    />
                  );
                })}
              </div>
              {insights.blooms.recommendations && insights.blooms.recommendations.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  💡 {insights.blooms.recommendations[0]}
                </p>
              )}
            </div>
          )}

          {/* Engine Info */}
          {enginesInfo && enginesInfo.run.length > 0 && (
            <div className="px-4 py-1 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {enginesInfo.run.join(', ')}
              </span>
              <span>{enginesInfo.time}ms</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <Sparkles className="h-10 w-10 mx-auto mb-3 text-purple-500" />
                <p className="text-lg font-medium">Hello! I&apos;m SAM</p>
                <p className="text-sm mb-4">Your AI-powered learning assistant</p>

                {/* Quick Actions */}
                <div className="space-y-2 text-left">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Quick Actions</p>
                  {getQuickActions().map((qa, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(qa.action)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-400">
                        {qa.icon}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, messageIndex) => {
              const userQuery = message.role === 'assistant'
                ? getUserQueryForMessage(messageIndex)
                : undefined;
              const targetField = userQuery
                ? detectTargetField(userQuery, detectedForms)
                : undefined;
              const showActions = message.role === 'assistant' &&
                !message.isStreaming &&
                isInsertableContent(message.content, userQuery);

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2',
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-purple-500 animate-pulse" />
                      )}
                    </p>
                  </div>

                  {/* Copy/Insert Actions for generated content */}
                  {showActions && (
                    <div className="flex items-center gap-1 mt-1.5 ml-1">
                      <button
                        onClick={() => handleCopyContent(message.id, message.content)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                          copiedMessageId === message.id
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                        title="Copy to clipboard"
                      >
                        {copiedMessageId === message.id ? (
                          <>
                            <ClipboardCheck className="h-3 w-3" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleInsertContent(message.id, message.content, targetField ?? undefined)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                          insertedMessageId === message.id
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/30'
                        )}
                        title={targetField ? `Insert into ${targetField} field` : 'Insert into form field'}
                      >
                        {insertedMessageId === message.id ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Inserted!</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownToLine className="h-3 w-3" />
                            <span>{targetField ? `Insert to ${targetField}` : 'Insert'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isProcessing && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs text-red-500 hover:underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !isProcessing && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    {suggestion.label || suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && !isProcessing && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex flex-wrap gap-2">
                {actions.slice(0, 3).map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    className="text-xs px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                  >
                    {action.type === 'form_fill' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isProcessing}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isProcessing}
                className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectPageType(path: string): string {
  if (path.match(/\/teacher\/courses\/[^/]+\/chapters\/[^/]+\/section\/[^/]+/)) return 'section-detail';
  if (path.match(/\/teacher\/courses\/[^/]+\/chapters\/[^/]+/)) return 'chapter-detail';
  if (path.match(/\/teacher\/courses\/[^/]+/)) return 'course-detail';
  if (path.match(/\/teacher\/courses$/)) return 'courses-list';
  if (path.match(/\/teacher\/create/)) return 'course-create';
  if (path.match(/\/courses\/[^/]+/)) return 'course-detail';
  if (path.match(/\/dashboard/)) return 'dashboard';
  if (path.match(/\/teacher\/analytics/)) return 'analytics';
  if (path.match(/\/teacher\/posts/) || path.match(/\/teacher\/allposts/)) return 'posts';
  if (path.match(/\/teacher\/templates/)) return 'templates';
  if (path.match(/\/learn/)) return 'learning';
  if (path.match(/\/teacher/)) return 'teacher-dashboard';
  return 'other';
}

function detectPageName(pageType: string): string {
  const nameMap: Record<string, string> = {
    'section-detail': 'Section Editor',
    'chapter-detail': 'Chapter Editor',
    'course-detail': 'Course Editor',
    'courses-list': 'My Courses',
    'course-create': 'Create Course',
    'dashboard': 'Dashboard',
    'analytics': 'Analytics',
    'posts': 'Posts',
    'templates': 'Templates',
    'learning': 'Learning',
    'teacher-dashboard': 'Teacher Dashboard',
    'other': 'Page',
  };
  return nameMap[pageType] || 'Page';
}

function buildBreadcrumbs(path: string): string[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: string[] = [];

  for (const segment of segments) {
    if (segment.match(/^[a-f0-9-]{8,}$/i)) continue;
    const formatted = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    breadcrumbs.push(formatted);
  }

  return breadcrumbs;
}

function getPageCapabilities(pageType: string): string[] {
  const capabilities: Record<string, string[]> = {
    'courses-list': ['view-courses', 'create-course', 'search-courses'],
    'course-detail': ['edit-course', 'add-chapters', 'generate-content', 'publish-course'],
    'chapter-detail': ['edit-chapter', 'add-sections', 'generate-content', 'publish-chapter'],
    'section-detail': ['edit-section', 'add-content', 'add-video', 'add-quiz', 'generate-content'],
    'course-create': ['create-course', 'use-template', 'ai-suggestions'],
    'dashboard': ['view-overview', 'quick-actions'],
    'analytics': ['view-metrics', 'export-data'],
    'posts': ['create-post', 'edit-post'],
    'templates': ['use-template', 'create-template'],
    'learning': ['view-content', 'ask-questions', 'take-quiz'],
    'other': ['general-help', 'navigation'],
  };
  return capabilities[pageType] || capabilities.other;
}

function getXPProgress(progress: UserProgress): {
  current: number;
  needed: number;
  percentage: number;
  levelName: string;
} {
  const LEVELS = [
    { level: 1, name: 'Novice Learner', minXP: 0, maxXP: 100 },
    { level: 2, name: 'Curious Mind', minXP: 100, maxXP: 250 },
    { level: 3, name: 'Active Student', minXP: 250, maxXP: 500 },
    { level: 4, name: 'Knowledge Seeker', minXP: 500, maxXP: 1000 },
    { level: 5, name: 'Dedicated Scholar', minXP: 1000, maxXP: 2000 },
    { level: 6, name: 'Expert Learner', minXP: 2000, maxXP: 4000 },
    { level: 7, name: 'Master Student', minXP: 4000, maxXP: 7500 },
    { level: 8, name: 'Learning Champion', minXP: 7500, maxXP: 12500 },
    { level: 9, name: 'Wisdom Keeper', minXP: 12500, maxXP: 20000 },
    { level: 10, name: 'Grand Master', minXP: 20000, maxXP: Infinity },
  ];

  const currentLevel = LEVELS[Math.min(progress.level - 1, LEVELS.length - 1)];
  const current = progress.xp - currentLevel.minXP;
  const needed = currentLevel.maxXP - currentLevel.minXP;
  const percentage = Math.min((current / needed) * 100, 100);

  return {
    current,
    needed: needed === Infinity ? current : needed,
    percentage: needed === Infinity ? 100 : percentage,
    levelName: currentLevel.name,
  };
}

// ============================================================================
// COPY/INSERT HELPERS
// ============================================================================

/**
 * Detect if a message contains insertable generated content
 */
function isInsertableContent(content: string, userQuery?: string): boolean {
  if (!content || content.length < 20) return false;

  // Check if the content is just conversational (not generated content)
  const conversationalPhrases = [
    'I can help',
    'I\'ll help',
    'Would you like',
    'Let me know',
    'I apologize',
    'something went wrong',
    'I understand you',
    'Hello! I\'m SAM',
    'Hi! I\'m SAM',
    'How can I assist',
    'What would you like',
  ];

  const lowerContent = content.toLowerCase();
  const startsWithConversational = conversationalPhrases.some(
    phrase => lowerContent.startsWith(phrase.toLowerCase())
  );

  // If it starts with conversational phrase and is short, it's not insertable
  if (startsWithConversational && content.length < 200) return false;

  // Check if user query was a generation request
  if (userQuery) {
    const lowerQuery = userQuery.toLowerCase();
    const generationKeywords = [
      'generate', 'create', 'write', 'make', 'produce',
      'suggest', 'give me', 'provide', 'draft', 'compose',
      'improve', 'enhance', 'rewrite', 'expand', 'develop',
    ];
    if (generationKeywords.some(kw => lowerQuery.includes(kw))) {
      return true;
    }
  }

  // If content is substantial and well-formatted, consider it insertable
  return content.length > 100;
}

/**
 * Detect target field from user query
 */
function detectTargetField(userQuery: string, detectedForms: Record<string, FormFieldInfo>): string | null {
  if (!userQuery) return null;

  const lowerQuery = userQuery.toLowerCase();

  // Field mapping patterns
  const fieldPatterns: Record<string, string[]> = {
    title: ['title', 'heading', 'name'],
    description: ['description', 'desc', 'summary', 'about', 'overview'],
    content: ['content', 'body', 'text', 'material'],
    whatYouWillLearn: ['learn', 'outcomes', 'objectives', 'goals', 'what you will learn'],
    courseGoals: ['goals', 'course goals'],
    prerequisites: ['prerequisites', 'requirements', 'before you start'],
    subtitle: ['subtitle', 'tagline'],
  };

  // Check each pattern against the query
  for (const [fieldName, patterns] of Object.entries(fieldPatterns)) {
    if (patterns.some(pattern => lowerQuery.includes(pattern))) {
      // Verify field exists in detected forms or use as-is
      if (detectedForms[fieldName]) {
        return fieldName;
      }
      // Also check for variations like 'courseTitle', 'chapterDescription'
      const matchedField = Object.keys(detectedForms).find(
        key => key.toLowerCase().includes(fieldName.toLowerCase())
      );
      if (matchedField) return matchedField;

      // Return the inferred field name even if not in detected forms
      // (form interactions might still handle it)
      return fieldName;
    }
  }

  return null;
}
