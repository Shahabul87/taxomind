"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import {
  SAMProvider,
  useSAM,
  useSAMChat,
  useSAMAnalysis,
  useSAMFormAutoDetect,
  useSAMFormDataEvents,
  useSAMPageLinks,
  usePresence,
  useSAMAutoContext,
  useSAMContext,
  useContextMemorySync,
} from '@sam-ai/react';
import type { SAMContext, SAMFormContext, SAMFormField, SAMMessage, SAMPageType } from '@sam-ai/core';
import { cn } from '@/lib/utils';

// Chat components
import { ChatHeader } from './ChatHeader';

import { MessageArea } from './MessageArea';
import { SuggestionChips } from './SuggestionChips';
import { ModeSuggestionChip } from './ModeSuggestionChip';
import { ChatInput } from './ChatInput';
import { FloatingButton } from './FloatingButton';
import { ToolExecutionPanel } from './panels/ToolExecutionPanel';
import { PlanProgressPanel } from './panels/PlanProgressPanel';

// Hooks
import { useDragResize } from './hooks/use-drag-resize';
import { useChatWindow } from './hooks/use-chat-window';
import { useGamification } from './hooks/use-gamification';
import { useBehaviorTracking } from './hooks/use-behavior-tracking';
import { useProactiveFeatures } from './hooks/use-proactive-features';
import { useChatTools } from './hooks/use-tools';
import { useFormDetection } from './hooks/use-form-detection';
import { useDegradedMode } from './hooks/use-degraded-mode';
import { useMessageActions } from './hooks/use-message-actions';
import { useOrchestration, updateOrchestrationState, clearOrchestrationState, getOrchestrationContext } from './hooks/use-orchestration';
import { useSendMessage } from './hooks/use-send-message';

// Mode system
import { getModeById } from '@/lib/sam/modes';
import type { SAMModeId } from '@/lib/sam/modes';

// External components
import { ModeFeedbackPanel } from '@/components/sam/ModeFeedbackPanel';
import { ToolApprovalDialog } from '@/components/sam/ToolApprovalDialog';
import { CelebrationOverlay } from '@/components/sam/CelebrationOverlay';
import { CheckInModal } from '@/components/sam/CheckInModal';
import type { CheckInAction } from '@/components/sam/CheckInModal';

// Types
import type { ChatMessage, SAMSuggestion, SAMAction, SAMInsights, SAMAssistantProps, ResizeHandle, ToolResultData, PageContext, EntityContextState, WindowCourseContext, EngineInsightsData } from './types';
import { MOBILE_BREAKPOINT } from './types';

// Page context utilities (pure functions, no hooks)
import { detectPageName, getPageCapabilities, buildBreadcrumbs } from './utils/page-utils';

// CSS tokens
import './tokens.css';

// Quick actions builder
import {
  FileText,
  Wand2,
  Target,
  Brain,
  ChevronRight,
  Microscope,
} from 'lucide-react';

// =============================================================================
// RESIZE HANDLES
// =============================================================================

const RESIZE_HANDLES: ResizeHandle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

function ResizeHandles({
  resizeHandlers,
}: {
  resizeHandlers: (handle: ResizeHandle) => {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
}) {
  return (
    <>
      {RESIZE_HANDLES.map((handle) => {
        const handlers = resizeHandlers(handle);
        const isCorner = handle.length === 2;
        const size = isCorner ? 12 : 6;

        const style: React.CSSProperties = {
          position: 'absolute',
          zIndex: 10,
        };

        // Position
        if (handle.includes('n')) { style.top = 0; style.height = size; }
        if (handle.includes('s')) { style.bottom = 0; style.height = size; }
        if (handle.includes('e')) { style.right = 0; style.width = size; }
        if (handle.includes('w')) { style.left = 0; style.width = size; }

        // Full-width/height for edges
        if (handle === 'n' || handle === 's') { style.left = size; style.right = size; }
        if (handle === 'e' || handle === 'w') { style.top = size; style.bottom = size; }

        return (
          <div
            key={handle}
            className={`sam-resize-${handle}`}
            style={style}
            {...handlers}
          />
        );
      })}
    </>
  );
}

// =============================================================================
// TOOL RESULT SUMMARY (human-readable one-liner for SAM context)
// =============================================================================

function getToolSummary(toolId: string, result: unknown): string {
  const rec = (val: unknown): Record<string, unknown> =>
    val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : {};
  const str = (val: unknown) => (typeof val === 'string' ? val : '');
  const num = (val: unknown) => (typeof val === 'number' ? val : 0);

  const raw = rec(result);
  const output = raw.output ?? raw.result ?? raw.data ?? result;
  const d = rec(output);

  switch (toolId) {
    case 'external-calculator': {
      const expr = str(d.expression ?? d.input);
      const val = d.result ?? d.value ?? d.answer ?? output;
      return expr ? `Result: ${expr} = ${val}` : `Result: ${val}`;
    }
    case 'external-dictionary': {
      const word = str(d.word);
      const meanings = Array.isArray(d.meanings) ? d.meanings : [];
      const firstDef = meanings.length > 0 ? rec(meanings[0]) : {};
      const pos = str(firstDef.partOfSpeech);
      const defs = Array.isArray(firstDef.definitions) ? firstDef.definitions : [];
      const defText = defs.length > 0 ? str(rec(defs[0]).definition) : '';
      if (!word) return 'Dictionary lookup completed.';
      const parts = [`Definition of "${word}"`];
      if (defText) parts.push(defText);
      if (pos) parts.push(`(${pos})`);
      return parts.join(defText ? ': ' : ' — ');
    }
    case 'external-wikipedia': {
      const title = str(d.title ?? d.name);
      const extract = str(d.extract ?? d.summary ?? d.description);
      const short = extract.length > 100 ? extract.slice(0, 100) + '...' : extract;
      return title ? `Found article: ${title} - ${short}` : 'Wikipedia search completed.';
    }
    case 'external-web-search': {
      const q = str(d.query);
      const results = Array.isArray(d.results ?? d.items) ? (d.results ?? d.items) as unknown[] : [];
      return `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`;
    }
    case 'external-url-fetch': {
      const title = str(d.title);
      const url = str(d.url);
      return title ? `Fetched "${title}" from ${url}` : `Fetched content from ${url || 'URL'}`;
    }
    case 'content-generate': {
      const content = str(d.content ?? d.text ?? d.generated ?? output);
      const type = str(d.type ?? 'content');
      const words = content ? content.split(/\s+/).length : 0;
      return `Generated a ${words}-word ${type} about the requested topic.`;
    }
    case 'content-summarize': {
      const summary = str(d.summary ?? d.content ?? output);
      const words = summary ? summary.split(/\s+/).length : 0;
      return `Created a ${words}-word summary of the provided text.`;
    }
    case 'content-recommend': {
      const recs = Array.isArray(d.recommendations ?? d.items) ? (d.recommendations ?? d.items) as unknown[] : [];
      return `Found ${recs.length} content recommendation${recs.length !== 1 ? 's' : ''} based on current topic.`;
    }
    case 'schedule-session': {
      const session = rec(d.session ?? d);
      const dur = num(session.duration ?? d.duration);
      const blocks = Array.isArray(session.blocks) ? session.blocks.length : 0;
      return `Created a ${dur}-minute study session${blocks ? ` with ${blocks} blocks` : ''}.`;
    }
    case 'schedule-reminder': {
      const reminder = rec(d.reminder ?? d);
      const msg = str(reminder.message ?? d.message);
      return msg ? `Reminder set: "${msg}"` : 'Reminder has been set.';
    }
    case 'schedule-optimize': {
      const schedule = rec(d.schedule ?? d.optimizedSchedule ?? d);
      const sessions = Array.isArray(schedule.sessions ?? d.sessions) ? (schedule.sessions ?? d.sessions) as unknown[] : [];
      return `Optimized schedule created with ${sessions.length} session${sessions.length !== 1 ? 's' : ''}.`;
    }
    case 'schedule-get': {
      const sessions = Array.isArray(d.sessions ?? d.schedule ?? d.events) ? (d.sessions ?? d.schedule ?? d.events) as unknown[] : [];
      return `Retrieved ${sessions.length} scheduled session${sessions.length !== 1 ? 's' : ''}.`;
    }
    case 'notification-send': {
      const notif = rec(d.notification ?? d);
      const title = str(notif.title ?? d.title);
      return title ? `Notification sent: "${title}"` : 'Notification sent successfully.';
    }
    case 'notification-get': {
      const notifs = Array.isArray(d.notifications ?? d.items) ? (d.notifications ?? d.items) as unknown[] : [];
      return `Retrieved ${notifs.length} notification${notifs.length !== 1 ? 's' : ''}.`;
    }
    case 'notification-mark-read': {
      const count = num(d.marked ?? d.count ?? 1);
      return `Marked ${count} notification${count !== 1 ? 's' : ''} as read.`;
    }
    case 'notification-progress-report': {
      const period = str(d.period ?? 'weekly');
      return `Generated ${period} progress report with study metrics.`;
    }
    case 'notification-achievement': {
      const ach = rec(d.achievement ?? d);
      const name = str(ach.name ?? ach.title);
      return name ? `Achievement unlocked: "${name}"` : 'Achievement notification sent.';
    }
    default:
      return 'Tool executed successfully.';
  }
}

// =============================================================================
// INNER COMPONENT (inside SAMProvider)
// =============================================================================

function ChatWindowInner({
  className,
  enableGamification = true,
}: SAMAssistantProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // --- SAM SDK hooks ---
  const { context: samContext, actions, lastResult, updateContext } = useSAM();
  const {
    messages: samMessages,
    isProcessing,
    isStreaming,
    sendMessage: samSendMessage,
    clearMessages: clearSamMessages,
    suggestions,
  } = useSAMChat();
  const { bloomsAnalysis } = useSAMAnalysis();

  const messages = samMessages as ChatMessage[];

  // --- Mode state ---
  const [activeMode, setActiveMode] = useState<SAMModeId>('general-assistant');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const localMsgIdRef = useRef(0);

  // Keep ref-based mode in sync for the request builder
  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // Mode feedback state
  const [showModeFeedback, setShowModeFeedback] = useState(false);
  const [feedbackModeId, setFeedbackModeId] = useState<string>('');
  const [feedbackModeLabel, setFeedbackModeLabel] = useState<string>('');

  const handleModeChange = useCallback(
    (newMode: SAMModeId) => {
      if (newMode === activeMode) return;

      // Show feedback panel if 3+ messages were exchanged in current mode
      if (messages.length >= 3) {
        const oldMode = getModeById(activeMode);
        setFeedbackModeId(activeMode);
        setFeedbackModeLabel(oldMode?.label ?? activeMode);
        setShowModeFeedback(true);
      }

      setActiveMode(newMode);
      const mode = getModeById(newMode);
      if (mode) {
        // Add greeting as a local assistant message (not sent to API)
        localMsgIdRef.current += 1;
        const greetingMsg: ChatMessage = {
          id: `mode-greeting-${localMsgIdRef.current}`,
          role: 'assistant' as const,
          content: mode.greeting,
          timestamp: new Date(),
        };
        setLocalMessages((prev) => [...prev, greetingMsg]);
      }
    },
    [activeMode, messages.length]
  );

  const handleModeFeedbackSubmit = useCallback(
    (feedback: { modeId: string; rating: string; suggestion?: string; comment?: string }) => {
      // Fire and forget — non-blocking
      fetch('/api/sam/feedback/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modeId: feedback.modeId,
          rating: feedback.rating,
          suggestion: feedback.suggestion,
          comment: feedback.comment,
          sessionId: samContext?.metadata?.sessionId,
          messageCount: messages.length,
        }),
      }).catch(() => { /* ignore network errors for feedback */ });
    },
    [samContext?.metadata?.sessionId, messages.length]
  );

  // Auto-detect hooks
  useSAMPageLinks({ enabled: true, maxLinks: 120, throttleMs: 1000 });
  useSAMFormDataEvents({ enabled: true });

  // --- SAM SDK context (single source of truth for page detection) ---
  const { context: samCtx } = useSAMContext();

  // Derive routing state from pathname directly (replaces usePageContext for these flags)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isHiddenRoute = ['/auth', '/login', '/register', '/admin/auth'].some(r => pathname.startsWith(r));
  const isAdminPage = pathname.startsWith('/dashboard/admin');

  // Build PageContext from SDK-detected data for hooks that still need the shape
  const pageContext = useMemo((): PageContext => ({
    pageName: detectPageName(samCtx.page.type),
    pageType: samCtx.page.type,
    path: samCtx.page.path,
    breadcrumbs: samCtx.page.breadcrumb ?? buildBreadcrumbs(samCtx.page.path),
    capabilities: samCtx.page.capabilities ?? getPageCapabilities(samCtx.page.type),
    entityId: samCtx.page.entityId,
    parentEntityId: samCtx.page.parentEntityId,
    grandParentEntityId: samCtx.page.grandParentEntityId,
  }), [
    samCtx.page.type,
    samCtx.page.path,
    samCtx.page.breadcrumb,
    samCtx.page.capabilities,
    samCtx.page.entityId,
    samCtx.page.parentEntityId,
    samCtx.page.grandParentEntityId,
  ]);

  // Read entity data from window context (replaces useEntityContext)
  const getWindowEntityContext = useCallback((): EntityContextState => {
    if (typeof window === 'undefined') return {};
    if ((window as Window & { sectionContext?: WindowCourseContext }).sectionContext?.entityData) {
      return {
        entityType: 'section',
        entityData: (window as Window & { sectionContext?: WindowCourseContext }).sectionContext!.entityData,
      };
    }
    if ((window as Window & { chapterContext?: WindowCourseContext }).chapterContext?.entityData) {
      return {
        entityType: 'chapter',
        entityData: (window as Window & { chapterContext?: WindowCourseContext }).chapterContext!.entityData,
      };
    }
    if ((window as Window & { courseContext?: WindowCourseContext }).courseContext?.entityData) {
      return {
        entityType: 'course',
        entityData: (window as Window & { courseContext?: WindowCourseContext }).courseContext!.entityData,
      };
    }
    return {};
  }, []);

  // --- Custom hooks ---
  const { windowState, theme, resolvedTheme, isOpen, isMinimized, isMaximized, open, close, minimize, maximize, restore, toggleTheme } = useChatWindow();
  const { position, size, isDragging, isResizing, isMobile, dragHandlers, resizeHandlers, resetPosition } = useDragResize({ enabled: isOpen && !isMaximized });
  const gamification = useGamification({ enabled: enableGamification, userId });

  const formAutoDetectOptions = useMemo(() => ({
    enabled: isOpen,
    overrideExisting: false,
    maxFields: 120,
    debounceMs: 250,
    preferFocused: true,
  }), [isOpen]);
  useSAMFormAutoDetect(formAutoDetectOptions);

  const { recordActivity } = usePresence({
    userId: userId ?? 'anonymous',
    sessionId: `sam-assistant-${Date.now()}`,
    idleTimeout: 60000,
    awayTimeout: 300000,
    trackVisibility: true,
    trackActivity: isOpen,
  });

  const degradedMode = useDegradedMode();

  // Engine details toggle (user opt-in, persisted in localStorage)
  const [showEngineDetails, setShowEngineDetails] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sam-show-engine-details') === 'true';
  });
  const toggleEngineDetails = useCallback(() => {
    setShowEngineDetails((prev) => {
      const next = !prev;
      localStorage.setItem('sam-show-engine-details', String(next));
      return next;
    });
  }, []);

  const formDetection = useFormDetection({
    isOpen,
    pathname: pageContext.path,
    pageContext,
  });

  // Build context update function (reads window context on demand)
  const buildContextUpdate = useCallback(() => {
    const effectiveEntityContext = getWindowEntityContext();
    return { effectiveEntityContext };
  }, [getWindowEntityContext]);

  // Insights from last result
  const insights = useMemo(() => {
    const responseInsights = lastResult?.response.insights as SAMInsights | undefined;
    return responseInsights ?? null;
  }, [lastResult]);

  const orchestration = useOrchestration({ insights });

  // Plan panel state
  const [showPlanPanel, setShowPlanPanel] = useState(false);
  const togglePlanPanel = useCallback(() => setShowPlanPanel((p) => !p), []);

  const planData = useMemo(() => {
    const orch = orchestration.orchestration;
    if (!orch?.hasActivePlan || !orch.allSteps?.length) return null;
    return {
      planTitle: orch.planTitle ?? 'Learning Plan',
      steps: orch.allSteps.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status === 'completed' ? 'completed' as const
          : s.status === 'in_progress' ? 'in_progress' as const
          : 'pending' as const,
      })),
      currentStepId: orch.currentStep?.id,
      progressPercent: orch.planProgress ?? 0,
    };
  }, [orchestration.orchestration]);

  // Mode suggestion from API insights
  const modeSuggestion = useMemo(() => {
    const suggestion = insights?.modeSuggestion as
      | { suggestedMode: string; suggestedModeLabel?: string; reason?: string }
      | undefined;
    return suggestion ?? null;
  }, [insights]);

  const tools = useChatTools({
    userId,
    isOpen,
    sessionId: samContext?.metadata?.sessionId,
    pageContext,
    entityContext: getWindowEntityContext(),
    buildContextUpdate,
  });

  const proactive = useProactiveFeatures({ userId, isOpen });

  const { trackEvent } = useBehaviorTracking({
    userId,
    isOpen,
    pathname: pageContext.path,
    pageContext,
    entityContext: getWindowEntityContext(),
    messageCount: messages.length,
  });

  const messageActions = useMessageActions({
    fillField: formDetection.fillField,
  });

  // Send message hook
  const { input, setInput, error, setError, sendMessage, handleKeyPress, clearError } = useSendMessage({
    samSendMessage,
    buildContextUpdate,
    mode: activeMode,
    pageType: pageContext.pageType,
    onDegradedFailure: degradedMode.recordFailure,
    onDegradedSuccess: degradedMode.recordSuccess,
    onError: () => {
      trackEvent('frustration_signal', { reason: 'message_failed' });
    },
    onSuccess: (content, entityCtx) => {
      trackEvent('content_interaction', {
        messageType: 'user_question',
        messageLength: content.length,
        hasEntityContext: !!entityCtx.entityData,
        entityType: entityCtx.entityType,
      });

      if (gamification.isFirstInteraction) {
        gamification.awardXP('first_interaction');
        gamification.setFirstInteractionDone();
      }
      gamification.awardXP('question_asked');
      gamification.checkStreak();

      const msg = content.trim().toLowerCase();
      if (msg.includes('generate') || msg.includes('create') || msg.includes('write')) {
        gamification.awardXP('content_generated');
      }
    },
    recordActivity,
  });

  // Context enrichment effect — adds entity metadata and form context.
  // Does NOT overwrite page.type/path/entityId (SDK handles those via useSAMAutoContext).
  const lastContextKeyRef = useRef<string>('');
  useEffect(() => {
    const contextKey = `${samCtx.page.type}:${samCtx.page.path}:${samCtx.page.entityId}:${samCtx.page.parentEntityId}`;
    if (lastContextKeyRef.current === contextKey) return;
    lastContextKeyRef.current = contextKey;

    const windowEntity = getWindowEntityContext();
    const nextMetadata = {
      entityData: windowEntity.entityData,
      entityType: windowEntity.entityType,
    };

    const samFormFields: Record<string, SAMFormField> = {};
    const detectedForms = formDetection.detectedForms;
    if (Object.keys(detectedForms).length > 0 || windowEntity.entityData) {
      const fields = {
        ...detectedForms,
        ...(windowEntity.entityData?.title && {
          _courseTitle: { name: '_courseTitle', type: 'text', value: windowEntity.entityData.title, label: 'Course Title' },
        }),
        ...(windowEntity.entityData?.description && {
          _courseDescription: { name: '_courseDescription', type: 'textarea', value: windowEntity.entityData.description, label: 'Course Description' },
        }),
      };

      for (const [name, field] of Object.entries(fields)) {
        samFormFields[name] = {
          name: field.name ?? name,
          type: field.type ?? 'text',
          value: field.value,
          label: field.label,
          placeholder: 'placeholder' in field ? String(field.placeholder) : undefined,
          required: 'required' in field ? Boolean(field.required) : undefined,
        };
      }
    }

    const hasSamForm = Object.keys(samFormFields).length > 0;
    const samFormContext: SAMFormContext | null = hasSamForm
      ? {
          formId: 'detected-form',
          formName: 'Page Form',
          fields: samFormFields,
          isDirty: false,
          isSubmitting: false,
          isValid: true,
          errors: {},
          touchedFields: new Set<string>(),
          lastUpdated: new Date(),
        }
      : null;

    // Only update enrichment — preserve SDK's page.type/path/entityId
    const contextUpdate: Partial<SAMContext> = {
      page: {
        ...samCtx.page, // Keep SDK-detected type, path, entityId, etc.
        capabilities: samCtx.page.capabilities ?? getPageCapabilities(samCtx.page.type),
        breadcrumb: samCtx.page.breadcrumb ?? buildBreadcrumbs(samCtx.page.path),
        metadata: nextMetadata,
      },
    };

    if (samFormContext) {
      contextUpdate.form = samFormContext;
    } else {
      contextUpdate.form = null;
    }

    updateContext(contextUpdate);
  }, [
    samCtx.page,
    getWindowEntityContext,
    updateContext,
    formDetection.detectedForms,
  ]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    clearSamMessages();
    setLocalMessages([]);
    setError(null);
  }, [clearSamMessages, setError]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: SAMSuggestion) => {
      sendMessage(suggestion.text);
    },
    [sendMessage]
  );

  // Handle action click
  const handleActionClick = useCallback(
    (action: SAMAction) => {
      if (action.type === 'navigation' && action.payload?.url) {
        window.location.href = action.payload.url as string;
      } else if (action.type === 'page_action' && action.payload?.action === 'refresh') {
        window.location.reload();
      } else if (action.type === 'form_fill' && action.payload?.field) {
        formDetection.fillField(action.payload.field as string, action.payload.value);
      } else if (action.payload?.action) {
        formDetection.executeFormAction(action.payload.action as string, action.payload);
      }
    },
    [formDetection]
  );

  // Quick actions
  const getQuickActions = useCallback((): Array<{ label: string; icon: React.ReactNode; action: string; isAnalysis?: boolean }> => {
    switch (pageContext.pageType) {
      case 'course-detail':
        return [
          { label: 'Generate Chapters', icon: <FileText className="h-3.5 w-3.5" />, action: 'Generate chapter structure for this course' },
          { label: 'Improve Description', icon: <Wand2 className="h-3.5 w-3.5" />, action: 'Improve the course description' },
          { label: 'Learning Objectives', icon: <Target className="h-3.5 w-3.5" />, action: 'Generate learning objectives for this course' },
          { label: 'Analyze Content', icon: <Microscope className="h-3.5 w-3.5" />, action: 'Analyze course content', isAnalysis: true },
        ];
      case 'chapter-detail':
        return [
          { label: 'Generate Sections', icon: <FileText className="h-3.5 w-3.5" />, action: 'Generate sections for this chapter' },
          { label: 'Generate Content', icon: <Wand2 className="h-3.5 w-3.5" />, action: 'Generate content for this chapter' },
          { label: 'Learning Outcomes', icon: <Target className="h-3.5 w-3.5" />, action: 'Generate learning outcomes' },
        ];
      case 'course-learning':
      case 'chapter-learning':
      case 'section-learning':
        return [
          { label: 'Explain This', icon: <Brain className="h-3.5 w-3.5" />, action: 'Explain the key concepts in simple terms' },
          { label: 'Quiz Me', icon: <Target className="h-3.5 w-3.5" />, action: 'Create a quick quiz to test my understanding' },
          { label: 'Summarize', icon: <FileText className="h-3.5 w-3.5" />, action: 'Give me a brief summary' },
          { label: 'Study Plan', icon: <Wand2 className="h-3.5 w-3.5" />, action: 'Create a personalized study plan' },
        ];
      case 'dashboard':
      case 'user-dashboard':
        return [
          { label: 'My Progress', icon: <Target className="h-3.5 w-3.5" />, action: 'Show me a summary of my learning progress' },
          { label: 'What to Learn', icon: <Brain className="h-3.5 w-3.5" />, action: 'Recommend what I should learn next' },
          { label: 'Study Tips', icon: <Wand2 className="h-3.5 w-3.5" />, action: 'Give me personalized study tips' },
        ];
      default:
        return [
          { label: 'Help Me', icon: <Brain className="h-3.5 w-3.5" />, action: 'What can you help me with on this page?' },
          { label: 'Navigate', icon: <ChevronRight className="h-3.5 w-3.5" />, action: 'Show me available pages' },
        ];
    }
  }, [pageContext.pageType]);

  // Handle mode suggestion accept
  const handleModeSuggestionAccept = useCallback(
    (modeId: SAMModeId) => {
      handleModeChange(modeId);
    },
    [handleModeChange]
  );

  const handleModeSuggestionDismiss = useCallback(() => {
    // No-op — ModeSuggestionChip tracks dismissed modes internally
  }, []);

  // Handle CheckInModal action
  const handleCheckInActionClick = useCallback(
    (action: CheckInAction) => {
      if (action.url) {
        window.location.href = action.url;
      } else if (action.type === 'start_activity') {
        sendMessage('Help me continue learning');
      } else if (action.type === 'view_progress') {
        sendMessage('Show me my learning progress');
      } else if (action.type === 'contact_mentor') {
        sendMessage('I need help from a mentor');
      }
    },
    [sendMessage]
  );

  // Tool result → send as chat message & auto-close panel
  const toolResultHandledRef = useRef<string | null>(null);
  const selectedToolRef = useRef(tools.selectedTool);
  selectedToolRef.current = tools.selectedTool;
  const setSelectedToolRef = useRef(tools.setSelectedTool);
  setSelectedToolRef.current = tools.setSelectedTool;

  const toolResult = tools.toolResult;
  const toolStatus = tools.toolStatus;

  // Map to associate tool result data with user messages (keyed by message content)
  const [toolResultMap, setToolResultMap] = useState(() => new Map<string, ToolResultData>());

  useEffect(() => {
    if (!toolResult || !selectedToolRef.current) return;
    if (toolStatus !== 'completed' && toolStatus !== 'failed') return;

    // Avoid double-handling the same invocation
    const invocationKey = toolResult.invocationId ?? `${toolResult.toolId}-${toolResult.updatedAt}`;
    if (toolResultHandledRef.current === invocationKey) return;
    toolResultHandledRef.current = invocationKey;

    // Capture tool info before closing panel
    const toolId = selectedToolRef.current.id;
    const toolName = selectedToolRef.current.name;

    // Close panel immediately so chat is visible for the result message
    setSelectedToolRef.current(null);

    // Send readable summary to SAM (not raw JSON) and store structured data for rich cards
    if (toolStatus === 'completed' && toolResult.result != null) {
      const summary = getToolSummary(toolId, toolResult.result);
      // Trim to match sendMessage's internal trim — prevents map key mismatch
      const content = `I used the **${toolName}** tool. ${summary}`.trim();

      // Store structured tool result for the rich card renderer
      setToolResultMap((prev) => {
        const next = new Map(prev);
        next.set(content, { toolId, toolName, status: toolStatus, result: toolResult.result });
        return next;
      });

      sendMessage(content);
    }
  }, [toolResult, toolStatus, sendMessage]);

  // Build engine insights from last API response (for transparency panel)
  const engineInsightsData = useMemo((): EngineInsightsData | null => {
    if (!showEngineDetails || !lastResult) return null;
    const response = lastResult.response;
    const metadata = response.metadata as Record<string, unknown> | undefined;
    const responseInsights = response.insights as SAMInsights | undefined;
    if (!metadata) return null;

    return {
      enginesRun: (metadata.enginesRun as string[]) ?? [],
      enginesFailed: (metadata.enginesFailed as string[]) ?? [],
      enginesCached: (metadata.enginesCached as string[]) ?? [],
      totalTime: (metadata.totalTime as number) ?? 0,
      engineSelection: responseInsights?.engineSelection,
      bloomsDistribution: responseInsights?.blooms?.distribution,
      qualityScore: responseInsights?.content?.overallScore,
    };
  }, [showEngineDetails, lastResult]);

  // Enrich messages with tool result data, engine insights, and merge local mode greeting messages
  const enrichedMessages = useMemo((): ChatMessage[] => {
    // Find last SDK assistant message index for engine insights attachment
    let lastAssistantIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        lastAssistantIdx = i;
        break;
      }
    }

    const sdkEnriched = messages.map((msg, idx): ChatMessage => {
      if (msg.role === 'user') {
        const tr = toolResultMap.get(msg.content);
        if (!tr) return msg;
        return { ...msg, toolResult: tr };
      }
      // Attach engine insights to the last assistant message
      if (idx === lastAssistantIdx && engineInsightsData) {
        return { ...msg, engineInsights: engineInsightsData };
      }
      return msg;
    });

    // Merge local greeting messages into the timeline
    if (localMessages.length === 0) return sdkEnriched;

    const combined = [...sdkEnriched, ...localMessages];
    combined.sort((a, b) => {
      const ta = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
      const tb = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
      return ta - tb;
    });
    return combined;
  }, [messages, toolResultMap, localMessages, engineInsightsData]);

  // Don't render on auth pages
  if (isHiddenRoute) return null;
  if (!session && !isAdminPage) return null;

  // Closed state - floating button
  if (!isOpen && windowState === 'closed') {
    return (
      <FloatingButton
        onClick={open}
        className={className}
        showXpAnimation={gamification.showXpAnimation}
        xpNotifications={gamification.xpNotifications}
      />
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <FloatingButton
        onClick={restore}
        className={className}
      />
    );
  }

  // Window styles — backdrop-filter applied inline because Turbopack
  // may strip it from the sam-glass utility class.
  const windowStyle: React.CSSProperties = isMobile || isMaximized
    ? {
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: 0,
        backdropFilter: 'blur(28px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
        isolation: 'isolate',
      }
    : {
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        borderRadius: 'var(--sam-radius)',
        backdropFilter: 'blur(28px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
        isolation: 'isolate',
      };

  return createPortal(
    <div
      className={cn(
        'z-[9999] flex flex-col overflow-hidden sam-glass',
        'shadow-[var(--sam-shadow)]',
        (isDragging || isResizing) && 'select-none',
        className
      )}
      style={windowStyle}
      data-sam-theme={resolvedTheme}
    >
      {/* Resize handles (hidden on mobile/maximized) */}
      {!isMobile && !isMaximized && (
        <ResizeHandles resizeHandlers={resizeHandlers} />
      )}

      {/* Header */}
      <ChatHeader
        breadcrumbs={pageContext.breadcrumbs}
        pageName={pageContext.pageName}
        onMinimize={minimize}
        onMaximize={maximize}
        onClose={close}
        onClear={clearMessages}
        isMaximized={isMaximized}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeMode={activeMode}
        onModeChange={handleModeChange}
        userProgress={gamification.userProgress}
        enableGamification={enableGamification}
        confidenceScore={insights?.agentic?.confidence?.score}
        hasPlan={!!planData}
        showPlanPanel={showPlanPanel}
        onTogglePlanPanel={togglePlanPanel}
        showEngineDetails={showEngineDetails}
        onToggleEngineDetails={toggleEngineDetails}
        dragHandlers={isMobile || isMaximized ? undefined : dragHandlers}
      />

      {/* Plan Progress Panel */}
      {showPlanPanel && planData && (
        <PlanProgressPanel
          planTitle={planData.planTitle}
          steps={planData.steps}
          currentStepId={planData.currentStepId}
          progressPercent={planData.progressPercent}
        />
      )}

      {/* Degraded Mode Banner */}
      {degradedMode.isDegraded && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="flex-1">Limited connectivity — cached responses may be used</span>
          {degradedMode.queuedMessageCount > 0 && (
            <span className="text-[10px] opacity-70">
              {degradedMode.queuedMessageCount} queued
            </span>
          )}
        </div>
      )}

      {/* Tool Execution Panel OR Message Area */}
      {tools.selectedTool ? (
        <ToolExecutionPanel
          tool={tools.selectedTool}
          toolInput={tools.toolInput}
          toolStatus={tools.toolStatus}
          toolResult={tools.toolResult}
          toolError={tools.toolError}
          onInputChange={tools.setToolInput}
          onExecute={() => tools.invokeTool(tools.selectedTool!)}
          onClose={() => tools.setSelectedTool(null)}
          pageContext={pageContext}
        />
      ) : (
        <>
          <MessageArea
            messages={enrichedMessages}
            isProcessing={isProcessing}
            isStreaming={isStreaming}
            error={error}
            onDismissError={clearError}
            sessionId={samContext?.metadata?.sessionId}
            copiedMessageId={messageActions.copiedMessageId}
            insertedMessageId={messageActions.insertedMessageId}
            onCopy={messageActions.handleCopyContent}
            onInsert={messageActions.handleInsertContent}
            isInsertableContent={messageActions.isInsertableContent}
            detectTargetField={messageActions.detectTargetField}
            detectedForms={formDetection.detectedForms}
            quickActions={getQuickActions()}
            onQuickAction={sendMessage}
          />

          {/* Suggestion Chips */}
          {suggestions.length > 0 && !isProcessing && (
            <SuggestionChips
              suggestions={suggestions}
              onSuggestionClick={handleSuggestionClick}
              className="border-t border-[var(--sam-border)]"
            />
          )}

          {/* Mode Suggestion */}
          {modeSuggestion && !isProcessing && (
            <ModeSuggestionChip
              suggestedMode={modeSuggestion.suggestedMode}
              suggestedModeLabel={modeSuggestion.suggestedModeLabel}
              reason={modeSuggestion.reason}
              onAccept={handleModeSuggestionAccept}
              onDismiss={handleModeSuggestionDismiss}
            />
          )}
        </>
      )}

      {/* Mode Feedback Panel */}
      {showModeFeedback && feedbackModeId && (
        <ModeFeedbackPanel
          modeId={feedbackModeId}
          modeLabel={feedbackModeLabel}
          sessionId={samContext?.metadata?.sessionId}
          onSubmit={handleModeFeedbackSubmit}
          onDismiss={() => setShowModeFeedback(false)}
        />
      )}

      {/* Chat Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => sendMessage(input)}
        onKeyPress={handleKeyPress}
        isProcessing={isProcessing}
      />

      {/* Tool Approval Dialog */}
      <ToolApprovalDialog
        request={tools.activeApprovalRequest}
        open={tools.isApprovalDialogOpen}
        onOpenChange={tools.setIsApprovalDialogOpen}
        onApprove={tools.handleApprove}
        onDeny={tools.handleDeny}
        isProcessing={tools.isApprovalProcessing}
      />

      {/* Celebration Overlay */}
      <CelebrationOverlay
        celebration={orchestration.celebration}
        onDismiss={orchestration.dismissCelebration}
        autoDismissMs={5000}
      />

      {/* CheckIn Modal */}
      <CheckInModal
        checkIn={
          proactive.activeCheckIn
            ? proactive.convertToCheckInData(proactive.activeCheckIn)
            : null
        }
        isOpen={proactive.showCheckInModal}
        onClose={proactive.closeCheckInModal}
        onSubmit={proactive.handleCheckInSubmit}
        onActionClick={handleCheckInActionClick}
      />
    </div>,
    document.body
  );
}

// =============================================================================
// CONTEXT TRACKER (invisible)
// =============================================================================

function SAMContextTracker() {
  useSAMAutoContext(true);
  // Auto-sync page context snapshots to server memory
  useContextMemorySync({ enabled: true });
  return null;
}

// =============================================================================
// MODE STATE (ref-based, accessed via activeModeRef)
// =============================================================================

/** Ref to the active mode, shared across request builder and component */
const activeModeRef = { current: 'general-assistant' as string };

/** Update the active mode ref */
export function setCurrentMode(mode: string) {
  activeModeRef.current = mode;
}

/** Get the current active mode */
export function getCurrentMode(): string {
  return activeModeRef.current;
}

// =============================================================================
// BUILD REQUEST (with orchestration context and mode)
// =============================================================================

function buildUnifiedRequest(
  input: {
    message: string;
    context: SAMContext;
    history: SAMMessage[];
  },
  orchestrationContext?: { planId?: string; goalId?: string; autoDetectPlan?: boolean },
  modeId?: string,
) {
  const { message, context, history } = input;
  const metadata = context.page.metadata ?? {} as Record<string, unknown>;
  const formFields = context.form
    ? Object.fromEntries(
        Object.entries(context.form.fields).map(([name, field]) => [name, field.value])
      )
    : undefined;

  return {
    message,
    mode: modeId ?? activeModeRef.current,
    pageContext: {
      type: context.page.type,
      path: context.page.path,
      entityId: context.page.entityId,
      parentEntityId: context.page.parentEntityId,
      grandParentEntityId: context.page.grandParentEntityId,
      capabilities: context.page.capabilities,
      breadcrumb: context.page.breadcrumb,
      entityData: metadata.entityData,
      entityType: metadata.entityType,
      links: Array.isArray(metadata.links) ? metadata.links.slice(0, 20) : undefined,
      linkCount: typeof metadata.linkCount === 'number' ? metadata.linkCount : undefined,
    },
    formContext: context.form
      ? {
          formId: context.form.formId,
          formName: context.form.formName,
          fields: formFields,
          isDirty: context.form.isDirty,
        }
      : undefined,
    conversationHistory: history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    orchestrationContext: orchestrationContext ?? { autoDetectPlan: true },
  };
}

function buildUnifiedRequestWithOrchestration(input: {
  message: string;
  context: SAMContext;
  history: SAMMessage[];
}) {
  return buildUnifiedRequest(input, getOrchestrationContext(), activeModeRef.current);
}

// =============================================================================
// PUBLIC COMPONENT
// =============================================================================

export function ChatWindow(props: SAMAssistantProps) {
  const { enableStreaming = true } = props;
  const apiOptions = useMemo(
    () => ({
      endpoint: '/api/sam/unified',
      streamEndpoint: enableStreaming ? '/api/sam/unified/stream' : undefined,
      buildRequest: buildUnifiedRequestWithOrchestration,
    }),
    [enableStreaming]
  );

  return (
    <SAMProvider transport="api" api={apiOptions}>
      <SAMContextTracker />
      <ChatWindowInner {...props} />
    </SAMProvider>
  );
}

// Re-export orchestration state functions for backward compatibility
export { updateOrchestrationState, clearOrchestrationState };
