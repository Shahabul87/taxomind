"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Shield,
  ShieldCheck,
  ShieldAlert,
  Bell,
  MessageSquare,
  HandHeart,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Wrench,
  Play,
  ListChecks,
  PartyPopper,
  Rocket,
  CircleDot,
  CheckCircle2,
  Circle,
  BarChart3,
  Milestone,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  SAMProvider,
  useSAM,
  useSAMFormAutoDetect,
  useSAMFormAutoFill,
  useSAMFormDataEvents,
  useSAMPageLinks,
} from '@sam-ai/react';
import type {
  SAMContext,
  SAMFormContext,
  SAMFormField,
  SAMMessage,
  SAMPageType,
} from '@sam-ai/core';

// Import SAM utilities
import {
  detectFormFields,
  generateFormSuggestions,
  executeFormFill,
  type FormFieldInfo,
  type FormFillSuggestion,
} from '@/lib/sam/form-actions';

// Import Tool Approval Dialog for user confirmations
import {
  ToolApprovalDialog,
  type ToolApprovalRequest,
  type RiskLevel,
  type ToolCategory,
} from '@/components/sam/ToolApprovalDialog';

// Import Celebration Overlay for orchestration milestones
import {
  CelebrationOverlay,
  useCelebration,
  type CelebrationData,
  type CelebrationType,
} from '@/components/sam/CelebrationOverlay';

// Import Feedback Buttons for quality tracking
import { FeedbackButtons } from '@/components/sam/FeedbackButtons';

// Import Confidence Indicator and SelfCritiquePanel for AI response transparency
import { ConfidenceIndicator, SelfCritiquePanel } from '@/components/sam/confidence';

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
    position?: number;
    courseId?: string;
    courseTitle?: string;
    sectionCount?: number;
    fullChapterData?: Record<string, unknown>;
    sections?: Array<{
      id: string;
      title: string;
      isPublished?: boolean;
      position?: number;
      contentType?: string | null;
    }>;
    // Section-specific
    isFree?: boolean;
    chapterId?: string;
    chapterTitle?: string;
    content?: string | null;
    contentType?: string | null;
    videoUrl?: string | null;
    fullSectionData?: Record<string, unknown>;
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

// Import SAM Realtime Client for WebSocket-based proactive features
// NOTE: Import from /client to avoid Prisma bundling in browser
import {
  getSAMRealtimeClient,
  isWebSocketEnabled,
  type SAMWebSocketEvent,
  SAMEventType,
} from '@/lib/sam/realtime/client';

// ============================================================================
// TYPES
// ============================================================================

type Message = SAMMessage & {
  targetField?: string; // Field this content was generated for
  userQuery?: string; // Original user query that generated this response
};

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

interface AgenticInsight {
  confidence?: {
    level: string;
    score: number;
    factors?: Array<{ name: string; score: number; weight: number }>;
  };
  sessionRecorded?: boolean;
  interventions?: Array<{ type: string; reason: string; priority: string }>;
}

// Proactive check-in and intervention types
interface ProactiveCheckIn {
  id: string;
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  questions?: Array<{
    id: string;
    question: string;
    type: 'text' | 'single_choice' | 'multiple_choice' | 'scale' | 'yes_no' | 'emoji';
    options?: string[];
    required?: boolean;
  }>;
  suggestedActions?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
  }>;
  scheduledTime?: string;
  status: 'pending' | 'scheduled' | 'sent' | 'responded' | 'expired';
}

interface ProactiveIntervention {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedActions?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    targetUrl?: string;
  }>;
  timing: {
    type: 'immediate' | 'scheduled' | 'on_next_session';
  };
}

interface ToolSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  requiredPermissions: string[];
  confirmationType: string;
  timeoutMs?: number | null;
  maxRetries?: number | null;
  tags: string[];
  enabled: boolean;
  deprecated?: boolean;
  deprecationMessage?: string | null;
}

interface ToolExecutionResult {
  toolId: string;
  invocationId?: string;
  status: string;
  awaitingConfirmation?: boolean;
  confirmationId?: string;
  result?: unknown;
  updatedAt: string;
}

interface ToolConfirmationDetail {
  label: string;
  value: string;
  type: 'text' | 'code' | 'json' | 'warning';
}

interface ToolConfirmation {
  id: string;
  invocationId: string;
  toolId: string;
  toolName: string;
  title: string;
  message: string;
  details?: ToolConfirmationDetail[];
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confirmText?: string;
  cancelText?: string;
  timeout?: number;
  status: 'pending' | 'confirmed' | 'denied' | 'expired';
  createdAt: string;
}

// Orchestration types for plan-driven tutoring
interface OrchestrationStepProgress {
  progressPercent: number;
  stepComplete: boolean;
  pendingCriteria: string[];
  completedCriteria: string[];
  recommendations: Array<{ type: string; reason: string; data?: Record<string, unknown> }>;
}

interface OrchestrationTransition {
  type: 'STEP_COMPLETE' | 'PLAN_COMPLETE' | 'STEP_STARTED' | 'NO_CHANGE';
  message: string;
  planComplete?: boolean;
  celebration?: {
    title: string;
    message: string;
    xpEarned?: number;
    achievementsUnlocked?: string[];
  };
  nextStep?: {
    id: string;
    title: string;
    type: string;
    objectives: string[];
  };
}

interface OrchestrationInsight {
  hasActivePlan: boolean;
  planId?: string;
  goalId?: string;
  planTitle?: string;
  planProgress?: number;
  currentStepIndex?: number;
  totalSteps?: number;
  allSteps?: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    estimatedMinutes?: number;
  }>;
  currentStep?: {
    id: string;
    title: string;
    type: string;
    objectives: string[];
    estimatedMinutes?: number;
  };
  stepProgress?: OrchestrationStepProgress;
  transition?: OrchestrationTransition;
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
  agentic?: AgenticInsight;
  orchestration?: OrchestrationInsight;
}

interface SAMAssistantProps {
  className?: string;
  enableStreaming?: boolean;
  enableGamification?: boolean;
}

/**
 * Orchestration context for plan-driven learning sessions.
 * Pass planId/goalId explicitly to maintain continuity across requests.
 */
interface OrchestrationContextInput {
  planId?: string;
  goalId?: string;
  autoDetectPlan?: boolean;
}

function buildUnifiedRequest(
  input: {
    message: string;
    context: SAMContext;
    history: SAMMessage[];
  },
  orchestrationContext?: OrchestrationContextInput
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
      // Include page links for navigation context (limit to 20)
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
    // Include orchestration context for plan-driven learning
    orchestrationContext: orchestrationContext ?? { autoDetectPlan: true },
  };
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
// ============================================================================
// TOOL APPROVAL PERSISTENCE
// ============================================================================

const TOOL_APPROVAL_PREFS_KEY = 'sam-tool-approval-preferences';

interface ToolApprovalPreference {
  toolId: string;
  autoApprove: boolean;
  approvedAt: number;
}

function getToolApprovalPreferences(): Record<string, ToolApprovalPreference> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(TOOL_APPROVAL_PREFS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setToolApprovalPreference(toolId: string, autoApprove: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const prefs = getToolApprovalPreferences();
    prefs[toolId] = {
      toolId,
      autoApprove,
      approvedAt: Date.now(),
    };
    localStorage.setItem(TOOL_APPROVAL_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    console.warn('[SAMAssistant] Failed to save tool approval preference');
  }
}

function isToolPreApproved(toolId: string): boolean {
  const prefs = getToolApprovalPreferences();
  return prefs[toolId]?.autoApprove ?? false;
}

function SAMAssistantInner({
  className,
  enableGamification = true,
}: SAMAssistantProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const {
    context: samContext,
    messages: samMessages,
    sendMessage: samSendMessage,
    clearMessages: clearSamMessages,
    suggestions,
    actions,
    isProcessing,
    isStreaming,
    lastResult,
    updateContext,
  } = useSAM();
  const messages = samMessages as Message[];

  useSAMPageLinks({ enabled: true, maxLinks: 120, throttleMs: 1000 });
  useSAMFormDataEvents({ enabled: true });
  useSAMFormAutoDetect({
    enabled: isOpen,
    overrideExisting: false,
    maxFields: 120,
    debounceMs: 250,
    preferFocused: true,
  });
  const { fillField } = useSAMFormAutoFill({ triggerEvents: true });

  const insights = useMemo(() => {
    const responseInsights = lastResult?.response.insights as SAMInsights | undefined;
    return responseInsights ?? null;
  }, [lastResult]);

  // Update orchestration state for plan/goal continuity across requests
  useEffect(() => {
    if (insights?.orchestration) {
      updateOrchestrationState(insights.orchestration);

      // Clear orchestration state when plan is completed
      if (insights.orchestration.transition?.planComplete) {
        clearOrchestrationState();
      }
    }
  }, [insights?.orchestration]);

  const enginesInfo = useMemo(() => {
    if (!lastResult?.metadata) return null;
    return {
      run: lastResult.metadata.enginesExecuted ?? [],
      time: lastResult.metadata.totalExecutionTime ?? 0,
    };
  }, [lastResult]);

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

  // Proactive features state
  const [pendingCheckIns, setPendingCheckIns] = useState<ProactiveCheckIn[]>([]);
  const [pendingInterventions, setPendingInterventions] = useState<ProactiveIntervention[]>([]);
  const [showCheckInPanel, setShowCheckInPanel] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState<ProactiveCheckIn | null>(null);
  const [checkInResponses, setCheckInResponses] = useState<Record<string, unknown>>({});

  // Tooling state
  const [tools, setTools] = useState<ToolSummary[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolSummary | null>(null);
  const [toolInput, setToolInput] = useState('{\n  \n}');
  const [toolResult, setToolResult] = useState<ToolExecutionResult | null>(null);
  const [toolStatus, setToolStatus] = useState<'idle' | 'running' | 'awaiting_confirmation' | 'completed' | 'failed'>('idle');
  const [toolError, setToolError] = useState<string | null>(null);
  const [toolConfirmations, setToolConfirmations] = useState<ToolConfirmation[]>([]);
  const [toolConfirmationsError, setToolConfirmationsError] = useState<string | null>(null);

  // Steps Timeline state (for orchestration panel)
  const [showStepsTimeline, setShowStepsTimeline] = useState(false);

  // Tool Approval Dialog state
  const [activeApprovalRequest, setActiveApprovalRequest] = useState<ToolApprovalRequest | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isApprovalProcessing, setIsApprovalProcessing] = useState(false);

  // Celebration overlay state
  const { celebration, showCelebration, dismissCelebration } = useCelebration();
  const [lastCelebrationId, setLastCelebrationId] = useState<string | null>(null);

  // Self-Critique panel state
  const [showSelfCritique, setShowSelfCritique] = useState(false);
  const [selfCritiqueData, setSelfCritiqueData] = useState<{
    overallConfidence: number;
    dimensions: Array<{ name: string; score: number; description: string; category: 'knowledge' | 'reasoning' | 'relevance' | 'clarity' | 'accuracy' }>;
    strengths: string[];
    weaknesses: string[];
    uncertainties: string[];
    suggestions: string[];
    generatedAt: string;
  } | null>(null);
  const [isLoadingSelfCritique, setIsLoadingSelfCritique] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Initialize realtime WebSocket connection for proactive features
  useEffect(() => {
    if (!isOpen || !session?.user?.id) return;

    let realtimeClient: ReturnType<typeof getSAMRealtimeClient> | null = null;
    let unsubscribeCheckIn: (() => void) | null = null;
    let unsubscribeIntervention: (() => void) | null = null;
    let unsubscribeRecommendation: (() => void) | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    const initRealtime = async () => {
      // Check if WebSocket is configured before attempting connection
      if (!isWebSocketEnabled()) {
        console.log('[SAMAssistant] WebSocket not configured, using REST polling');
        await initRestPolling();
        return;
      }

      try {
        // Get or create the realtime client singleton
        realtimeClient = getSAMRealtimeClient();

        // Connect to WebSocket server
        await realtimeClient.connect(session.user.id);

        console.log('[SAMAssistant] Realtime WebSocket connected');

        // Subscribe to check-in events
        unsubscribeCheckIn = realtimeClient.on(SAMEventType.CHECKIN, (event: SAMWebSocketEvent) => {
          const checkIn = event.payload as ProactiveCheckIn;
          setPendingCheckIns((prev) => {
            // Avoid duplicates
            if (prev.some((c) => c.id === checkIn.id)) return prev;
            return [...prev, checkIn];
          });
        });

        // Subscribe to intervention events
        unsubscribeIntervention = realtimeClient.on(SAMEventType.INTERVENTION, (event: SAMWebSocketEvent) => {
          const intervention = event.payload as ProactiveIntervention;
          setPendingInterventions((prev) => {
            // Avoid duplicates
            if (prev.some((i) => i.id === intervention.id)) return prev;
            return [...prev, intervention];
          });
        });

        // Subscribe to recommendation events (optional enhancement)
        unsubscribeRecommendation = realtimeClient.on(SAMEventType.RECOMMENDATION, (event: SAMWebSocketEvent) => {
          console.log('[SAMAssistant] Received recommendation:', event.payload);
          // Could be used to show personalized suggestions in the UI
        });

        // Initial fetch of existing pending items (one-time on connect)
        const [checkInsRes, interventionsRes] = await Promise.all([
          fetch('/api/sam/agentic/checkins?status=pending'),
          fetch('/api/sam/agentic/behavior/interventions?pending=true'),
        ]);

        if (checkInsRes.ok) {
          const checkInsData = await checkInsRes.json();
          if (checkInsData.success && checkInsData.data?.checkIns) {
            setPendingCheckIns(checkInsData.data.checkIns);
          }
        }

        if (interventionsRes.ok) {
          const interventionsData = await interventionsRes.json();
          if (interventionsData.success && interventionsData.data?.interventions) {
            setPendingInterventions(interventionsData.data.interventions);
          }
        }

        // Evaluate triggers once on connect
        await fetch('/api/sam/agentic/checkins/evaluate', { method: 'POST' });

      } catch (error) {
        // Only log as error if it's not expected WebSocket not configured case
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('WebSocket not configured')) {
          console.log('[SAMAssistant] WebSocket not configured, using REST polling fallback');
        } else {
          console.warn('[SAMAssistant] Failed to initialize realtime:', errorMessage);
        }
        // Fallback to REST polling if WebSocket fails
        await initRestPolling();
      }
    };

    // REST polling fallback function
    const initRestPolling = async () => {
      const fetchProactiveData = async () => {
        try {
          const [checkInsRes, interventionsRes] = await Promise.all([
            fetch('/api/sam/agentic/checkins?status=pending'),
            fetch('/api/sam/agentic/behavior/interventions?pending=true'),
          ]);

          if (checkInsRes.ok) {
            const checkInsData = await checkInsRes.json();
            if (checkInsData.success && checkInsData.data?.checkIns) {
              setPendingCheckIns(checkInsData.data.checkIns);
            }
          }

          if (interventionsRes.ok) {
            const interventionsData = await interventionsRes.json();
            if (interventionsData.success && interventionsData.data?.interventions) {
              setPendingInterventions(interventionsData.data.interventions);
            }
          }

          await fetch('/api/sam/agentic/checkins/evaluate', { method: 'POST' });
        } catch (fetchError) {
          console.error('[SAMAssistant] REST polling fetch failed:', fetchError);
        }
      };

      // Initial fetch
      await fetchProactiveData();

      // Set up polling interval (every 30 seconds)
      pollingInterval = setInterval(fetchProactiveData, 30000);
    };

    void initRealtime().catch((error) => {
      console.warn('[SAMAssistant] Realtime init failed unexpectedly:', error);
      void initRestPolling();
    });

    return () => {
      // Cleanup subscriptions
      unsubscribeCheckIn?.();
      unsubscribeIntervention?.();
      unsubscribeRecommendation?.();
      // Clear polling interval if active
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      // Note: We don't disconnect the client here since it's a singleton
      // and may be used by other components. The client handles reconnection automatically.
    };
  }, [isOpen, session?.user?.id]);

  const fetchTools = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsLoadingTools(true);
    setToolsError(null);

    try {
      const response = await fetch('/api/sam/agentic/tools');
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Failed to load tools';
        throw new Error(errorMsg);
      }

      if (data.success && data.data?.tools) {
        setTools(data.data.tools as ToolSummary[]);
      } else {
        setTools([]);
      }
    } catch (fetchError) {
      console.error('[SAM] Failed to fetch tools:', fetchError);
      setToolsError((fetchError as Error).message);
    } finally {
      setIsLoadingTools(false);
    }
  }, [session?.user?.id]);

  const fetchToolConfirmations = useCallback(async () => {
    if (!session?.user?.id) return;
    setToolConfirmationsError(null);

    try {
      const response = await fetch('/api/sam/agentic/tools/confirmations');
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Failed to load confirmations';
        throw new Error(errorMsg);
      }

      if (data.success && data.data?.confirmations) {
        setToolConfirmations(data.data.confirmations as ToolConfirmation[]);
      } else {
        setToolConfirmations([]);
      }
    } catch (fetchError) {
      console.error('[SAM] Failed to fetch confirmations:', fetchError);
      setToolConfirmationsError((fetchError as Error).message);
    }
  }, [session?.user?.id]);

  // Fetch self-critique data for AI response transparency
  const fetchSelfCritique = useCallback(async (messageContent: string) => {
    if (!session?.user?.id) return;

    setIsLoadingSelfCritique(true);
    try {
      const lastMessage = messages[messages.length - 1];
      const response = await fetch('/api/sam/agentic/self-critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: lastMessage?.id || 'current',
          responseText: messageContent,
          responseType: 'explanation',
          critiqueMode: 'standard',
          runLoop: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.critique) {
          setSelfCritiqueData({
            overallConfidence: data.data.critique.overallScore / 100,
            dimensions: data.data.critique.dimensionScores?.map((d: { dimension: string; score: number; feedback: string }) => ({
              name: d.dimension,
              score: d.score / 100,
              description: d.feedback,
              category: d.dimension.toLowerCase() as 'knowledge' | 'reasoning' | 'relevance' | 'clarity' | 'accuracy',
            })) || [],
            strengths: data.data.critique.strengths || [],
            weaknesses: data.data.critique.improvements || [],
            uncertainties: data.data.critique.uncertainties || [],
            suggestions: data.data.critique.suggestions || [],
            generatedAt: new Date().toISOString(),
          });
          setShowSelfCritique(true);
        }
      }
    } catch (err) {
      console.error('[SAMAssistant] Failed to fetch self-critique:', err);
    } finally {
      setIsLoadingSelfCritique(false);
    }
  }, [session?.user?.id, messages]);

  useEffect(() => {
    if (!isOpen || !session?.user?.id) return;
    fetchTools();
    fetchToolConfirmations();
  }, [isOpen, session?.user?.id, fetchTools, fetchToolConfirmations]);

  // ============================================================================
  // PAGE CONTEXT DETECTION (moved before behavior tracking for dependency order)
  // ============================================================================

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

  // ============================================================================
  // BEHAVIOR EVENT TRACKING - Phase 4 Proactive Features
  // ============================================================================

  const sessionStartTimeRef = useRef<number | null>(null);

  // Track behavior events to the agentic events API
  const trackBehaviorEvent = useCallback(async (
    type: 'session_start' | 'session_end' | 'page_view' | 'content_interaction' | 'help_requested' | 'frustration_signal',
    data?: Record<string, unknown>
  ) => {
    if (!session?.user?.id) return;

    try {
      await fetch('/api/sam/agentic/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data: {
            ...data,
            sessionDuration: sessionStartTimeRef.current
              ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
              : undefined,
          },
          timestamp: new Date().toISOString(),
          pageContext: {
            type: pageContext.pageType,
            path: pageContext.path,
            entityId: pageContext.entityId,
            entityType: windowEntityContext.entityType,
          },
        }),
      });
    } catch (error) {
      console.error('[SAMAssistant] Failed to track behavior event:', error);
    }
  }, [session?.user?.id, pageContext, windowEntityContext.entityType]);

  // Track session start/end when SAM panel opens/closes
  useEffect(() => {
    if (!session?.user?.id) return;

    if (isOpen) {
      // Session started
      sessionStartTimeRef.current = Date.now();
      trackBehaviorEvent('session_start', {
        source: 'sam_panel_open',
        pageName: pageContext.pageName,
      });
    } else if (sessionStartTimeRef.current) {
      // Session ended
      trackBehaviorEvent('session_end', {
        source: 'sam_panel_close',
        pageName: pageContext.pageName,
        messageCount: messages.length,
      });
      sessionStartTimeRef.current = null;
    }
  }, [isOpen, session?.user?.id, pageContext.pageName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track page navigation while SAM is open
  useEffect(() => {
    if (!isOpen || !session?.user?.id) return;

    trackBehaviorEvent('page_view', {
      pageName: pageContext.pageName,
      pageType: pageContext.pageType,
      entityId: pageContext.entityId,
    });
  }, [pathname, isOpen, session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for entity context from SimpleCourseContext and similar components
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reset window entity context on navigation to avoid stale data
    setWindowEntityContext({});

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

  const buildContextUpdate = useCallback(() => {
    const effectiveEntityContext = windowEntityContext.entityData
      ? windowEntityContext
      : getWindowEntityContext();

    const enrichedFormContext =
      Object.keys(detectedForms).length > 0 || effectiveEntityContext.entityData
        ? {
            formId: 'detected-form',
            formName: 'Page Form',
            fields: {
              ...detectedForms,
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
          }
        : undefined;

    const samFormFields: Record<string, SAMFormField> = {};
    if (enrichedFormContext?.fields) {
      for (const [name, field] of Object.entries(enrichedFormContext.fields)) {
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

    const samFormContext: SAMFormContext | null = enrichedFormContext
      ? {
          formId: enrichedFormContext.formId,
          formName: enrichedFormContext.formName,
          fields: samFormFields,
          isDirty: Boolean(enrichedFormContext.isDirty),
          isSubmitting: false,
          isValid: true,
          errors: {},
          touchedFields: new Set<string>(),
          lastUpdated: new Date(),
        }
      : null;

    return { effectiveEntityContext, samFormContext };
  }, [detectedForms, getWindowEntityContext, windowEntityContext]);

  // Use ref to track last context key to prevent infinite loops
  const lastContextKeyRef = useRef<string>('');

  useEffect(() => {
    // Create a stable key from primitive values to detect actual changes
    const contextKey = `${pageContext.pageType}:${pageContext.path}:${pageContext.entityId}:${pageContext.parentEntityId}`;

    // Skip if we've already updated for this context
    if (lastContextKeyRef.current === contextKey) {
      return;
    }
    lastContextKeyRef.current = contextKey;

    const { effectiveEntityContext, samFormContext } = buildContextUpdate();
    const nextMetadata = {
      entityData: effectiveEntityContext.entityData,
      entityType: effectiveEntityContext.entityType,
    };
    const contextUpdate: Partial<SAMContext> = {
      page: {
        type: pageContext.pageType as SAMPageType,
        path: pageContext.path,
        entityId: pageContext.entityId,
        parentEntityId: pageContext.parentEntityId,
        grandParentEntityId: pageContext.grandParentEntityId,
        capabilities: pageContext.capabilities,
        breadcrumb: pageContext.breadcrumbs,
        metadata: nextMetadata,
      },
    };

    // Always update form context to avoid staleness on navigation
    // Previously only set when form was null, causing stale data
    if (samFormContext) {
      contextUpdate.form = samFormContext;
    } else {
      // Explicitly clear form when no form context available
      contextUpdate.form = null;
    }

    updateContext(contextUpdate);
  }, [
    buildContextUpdate,
    pageContext.pageType,
    pageContext.path,
    pageContext.entityId,
    pageContext.parentEntityId,
    pageContext.grandParentEntityId,
    pageContext.capabilities,
    pageContext.breadcrumbs,
    samContext.form,
    updateContext,
  ]);

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

  // Trigger celebration from orchestration transitions
  useEffect(() => {
    const orchestration = insights?.orchestration;
    if (!orchestration?.transition?.celebration) return;

    const celebrationData = orchestration.transition.celebration;
    const celebrationId = `${celebrationData.title}-${Date.now()}`;

    // Prevent duplicate celebrations
    if (lastCelebrationId === celebrationId) return;
    setLastCelebrationId(celebrationId);

    // Map orchestration transition type to celebration type
    let celebrationType: CelebrationType = 'step_complete';
    if (orchestration.transition.planComplete) {
      celebrationType = 'plan_complete';
    } else if (orchestration.transition.type === 'PLAN_COMPLETE') {
      // When a plan is complete, check if there's associated goal achievement
      celebrationType = 'goal_achieved';
    }

    showCelebration({
      type: celebrationType,
      title: celebrationData.title,
      message: celebrationData.message,
      xpEarned: celebrationData.xpEarned,
    });
  }, [insights?.orchestration, lastCelebrationId, showCelebration]);

  // Send message (API transport via @sam-ai/react)
  const sendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;
    setInput('');
    setError(null);

    // Award XP for asking question
    if (gamificationEngine) {
      if (isFirstInteraction) {
        gamificationEngine.awardXP('first_interaction');
        setIsFirstInteraction(false);
      }
      gamificationEngine.awardXP('question_asked');
      gamificationEngine.checkStreak();
    }

    const { effectiveEntityContext } = buildContextUpdate();

    console.log('[SAMAssistant] Sending message with entity context:', {
      hasEntityData: !!effectiveEntityContext.entityData,
      entityType: effectiveEntityContext.entityType,
      title: effectiveEntityContext.entityData?.title,
      fromState: !!windowEntityContext.entityData,
    });

    const result = await samSendMessage(content.trim());

    if (!result) {
      handleError(new Error('Failed to get response'));
      // Track frustration signal on error
      trackBehaviorEvent('frustration_signal', {
        reason: 'message_failed',
        messageLength: content.length,
      });
      return;
    }

    // Track successful content interaction
    trackBehaviorEvent('content_interaction', {
      messageType: 'user_question',
      messageLength: content.length,
      hasEntityContext: !!effectiveEntityContext.entityData,
      entityType: effectiveEntityContext.entityType,
    });

    // Award XP for content generation if applicable
    if (gamificationEngine) {
      const msg = content.trim().toLowerCase();
      if (msg.includes('generate') || msg.includes('create') || msg.includes('write')) {
        gamificationEngine.awardXP('content_generated');
      }
    }
  };

  // Error handler
  const handleError = (err: Error) => {
    console.error('[SAMAssistant] Error:', err);
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
      const field = action.payload.field as string;
      const value = action.payload.value;
      const filled = fillField(field, value);
      if (!filled) {
        executeFormFill(field, value);
      }
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

  const deriveToolStatus = (status: string, awaitingConfirmation?: boolean) => {
    if (awaitingConfirmation || status === 'awaiting_confirmation') return 'awaiting_confirmation';
    if (status === 'success') return 'completed';
    if (['failed', 'denied', 'cancelled', 'timeout'].includes(status)) return 'failed';
    if (['pending', 'executing'].includes(status)) return 'running';
    return 'completed';
  };

  const handleSelectTool = (tool: ToolSummary) => {
    setSelectedTool(tool);
    setToolInput('{\n  \n}');
    setToolError(null);
    setToolStatus('idle');
    setToolResult(null);
  };

  const handleInvokeTool = useCallback(async (tool: ToolSummary) => {
    if (!session?.user?.id) return;

    if (!tool.enabled) {
      setToolError('Tool is disabled.');
      setToolStatus('failed');
      return;
    }

    const sessionId = samContext?.metadata?.sessionId;
    if (!sessionId) {
      setToolError('SAM session not initialized yet.');
      setToolStatus('failed');
      return;
    }

    const trimmedInput = toolInput.trim();
    let inputPayload: unknown = {};

    if (trimmedInput) {
      try {
        inputPayload = JSON.parse(trimmedInput);
      } catch {
        setToolError('Tool input must be valid JSON.');
        setToolStatus('failed');
        return;
      }
    }

    setToolStatus('running');
    setToolError(null);
    setToolResult(null);

    try {
      const { effectiveEntityContext } = buildContextUpdate();
      const response = await fetch('/api/sam/agentic/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          input: inputPayload,
          sessionId,
          metadata: {
            pageContext: {
              type: pageContext.pageType,
              path: pageContext.path,
              entityId: pageContext.entityId,
              parentEntityId: pageContext.parentEntityId,
              grandParentEntityId: pageContext.grandParentEntityId,
            },
            entityContext: effectiveEntityContext,
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error ?? 'Failed to invoke tool.');
      }

      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.error ?? 'Failed to invoke tool.');
      }

      const execution = payload.data ?? {};
      const status = typeof execution.status === 'string' ? execution.status : 'success';
      const awaitingConfirmation = Boolean(execution.awaitingConfirmation);

      setToolResult({
        toolId: tool.id,
        invocationId: execution.invocation?.id ?? execution.invocationId,
        status,
        awaitingConfirmation,
        confirmationId: execution.confirmationId,
        result: execution.result,
        updatedAt: new Date().toISOString(),
      });
      setToolStatus(deriveToolStatus(status, awaitingConfirmation));

      if (awaitingConfirmation) {
        await fetchToolConfirmations();
      }
    } catch (invokeError) {
      setToolError((invokeError as Error).message);
      setToolStatus('failed');
    }
  }, [
    buildContextUpdate,
    fetchToolConfirmations,
    pageContext.entityId,
    pageContext.grandParentEntityId,
    pageContext.pageType,
    pageContext.parentEntityId,
    pageContext.path,
    samContext?.metadata?.sessionId,
    session?.user?.id,
    toolInput,
  ]);

  const handleToolConfirmation = useCallback(async (confirmationId: string, confirmed: boolean) => {
    if (!session?.user?.id) return;
    setToolConfirmationsError(null);

    try {
      const response = await fetch('/api/sam/agentic/tools/confirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationId, confirmed }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error ?? 'Failed to respond to confirmation.');
      }

      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.error ?? 'Failed to respond to confirmation.');
      }

      const execution = payload.data ?? {};
      const status = typeof execution.status === 'string' ? execution.status : (confirmed ? 'success' : 'denied');

      setToolResult({
        toolId: execution.invocation?.toolId ?? selectedTool?.id ?? 'tool',
        invocationId: execution.invocation?.id ?? execution.invocationId,
        status,
        awaitingConfirmation: false,
        result: execution.result,
        updatedAt: new Date().toISOString(),
      });
      setToolStatus(deriveToolStatus(status, false));

      await fetchToolConfirmations();
    } catch (confirmError) {
      setToolConfirmationsError((confirmError as Error).message);
    }
  }, [fetchToolConfirmations, selectedTool?.id, session?.user?.id]);

  // Convert ToolConfirmation to ToolApprovalRequest for the dialog
  const convertToApprovalRequest = useCallback((confirmation: ToolConfirmation): ToolApprovalRequest => {
    // Map severity to risk level
    const riskLevelMap: Record<string, RiskLevel> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'high',
    };

    // Try to determine category from tool name or default to 'content'
    const categoryMap: Record<string, ToolCategory> = {
      generate: 'content',
      create: 'content',
      assess: 'assessment',
      evaluate: 'assessment',
      quiz: 'assessment',
      memory: 'memory',
      recall: 'memory',
      context: 'memory',
      send: 'communication',
      notify: 'communication',
      email: 'communication',
      analyze: 'analysis',
      review: 'analysis',
      course: 'course',
      chapter: 'course',
      section: 'course',
      external: 'external',
      fetch: 'external',
      api: 'external',
      admin: 'admin',
      modify: 'admin',
      delete: 'admin',
    };

    const toolNameLower = confirmation.toolName.toLowerCase();
    let category: ToolCategory = 'content';
    for (const [key, value] of Object.entries(categoryMap)) {
      if (toolNameLower.includes(key)) {
        category = value;
        break;
      }
    }

    // Extract permissions from details
    const reads: string[] = [];
    const writes: string[] = [];
    const external: string[] = [];

    if (confirmation.details) {
      for (const detail of confirmation.details) {
        if (detail.type === 'warning' || detail.label.toLowerCase().includes('access')) {
          if (detail.label.toLowerCase().includes('read')) {
            reads.push(detail.value);
          } else if (detail.label.toLowerCase().includes('write') || detail.label.toLowerCase().includes('modify')) {
            writes.push(detail.value);
          } else if (detail.label.toLowerCase().includes('external')) {
            external.push(detail.value);
          }
        }
      }
    }

    // Build parameters from details
    const parameters: Record<string, unknown> = {};
    if (confirmation.details) {
      for (const detail of confirmation.details) {
        if (detail.type === 'json' || detail.type === 'code') {
          try {
            parameters[detail.label] = JSON.parse(detail.value);
          } catch {
            parameters[detail.label] = detail.value;
          }
        } else if (detail.type === 'text') {
          parameters[detail.label] = detail.value;
        }
      }
    }

    return {
      id: confirmation.id,
      toolId: confirmation.toolId,
      toolName: confirmation.toolName,
      description: confirmation.title,
      category,
      riskLevel: riskLevelMap[confirmation.severity] || 'medium',
      reason: confirmation.message,
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
      estimatedDuration: confirmation.timeout,
      permissions: {
        reads: reads.length > 0 ? reads : undefined,
        writes: writes.length > 0 ? writes : undefined,
        external: external.length > 0 ? external : undefined,
      },
      context: {
        conversationId: samContext?.metadata?.sessionId,
      },
    };
  }, [samContext?.metadata?.sessionId]);

  // Open the approval dialog for a confirmation
  const openApprovalDialog = useCallback((confirmation: ToolConfirmation) => {
    const request = convertToApprovalRequest(confirmation);
    setActiveApprovalRequest(request);
    setIsApprovalDialogOpen(true);
  }, [convertToApprovalRequest]);

  // Handle approval from the dialog
  const handleApprovalDialogApprove = useCallback(async (requestId: string, rememberChoice: boolean) => {
    setIsApprovalProcessing(true);
    try {
      await handleToolConfirmation(requestId, true);
      // Save preference for auto-approval if user wants to remember
      if (rememberChoice && activeApprovalRequest?.toolId) {
        setToolApprovalPreference(activeApprovalRequest.toolId, true);
      }
    } finally {
      setIsApprovalProcessing(false);
      setIsApprovalDialogOpen(false);
      setActiveApprovalRequest(null);
    }
  }, [handleToolConfirmation, activeApprovalRequest?.toolId]);

  // Handle denial from the dialog
  const handleApprovalDialogDeny = useCallback(async (requestId: string) => {
    setIsApprovalProcessing(true);
    try {
      await handleToolConfirmation(requestId, false);
    } finally {
      setIsApprovalProcessing(false);
      setIsApprovalDialogOpen(false);
      setActiveApprovalRequest(null);
    }
  }, [handleToolConfirmation]);

  // Auto-open dialog when new confirmations arrive (or auto-approve if pre-approved)
  useEffect(() => {
    if (toolConfirmations.length > 0 && !isApprovalDialogOpen && !activeApprovalRequest) {
      // Find the first pending confirmation
      const firstPending = toolConfirmations.find(c => c.status === 'pending');
      if (firstPending) {
        // Check if this tool is pre-approved
        if (isToolPreApproved(firstPending.toolId)) {
          // Auto-approve without showing dialog
          handleToolConfirmation(firstPending.id, true);
        } else {
          // Open dialog for user approval
          openApprovalDialog(firstPending);
        }
      }
    }
  }, [toolConfirmations, isApprovalDialogOpen, activeApprovalRequest, openApprovalDialog, handleToolConfirmation]);

  // Handle form fill suggestion
  const handleFormFillClick = (suggestion: FormFillSuggestion) => {
    sendMessage(`Generate content for the ${suggestion.field} field`);
  };

  // Handle opening a check-in
  const handleOpenCheckIn = (checkIn: ProactiveCheckIn) => {
    setActiveCheckIn(checkIn);
    setCheckInResponses({});
    setShowCheckInPanel(true);
  };

  // Handle responding to a check-in
  const handleRespondToCheckIn = async (checkInId: string) => {
    if (!activeCheckIn) return;

    try {
      const response = await fetch(`/api/sam/agentic/checkins/${checkInId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(checkInResponses).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
          selectedActions: [],
          feedback: '',
        }),
      });

      if (response.ok) {
        // Remove from pending list
        setPendingCheckIns(prev => prev.filter(c => c.id !== checkInId));
        setActiveCheckIn(null);
        setShowCheckInPanel(false);

        // Award XP for responding to check-in
        if (gamificationEngine) {
          gamificationEngine.awardXP('question_asked');
        }
      }
    } catch (error) {
      console.error('[SAMAssistant] Failed to respond to check-in:', error);
      setError('Failed to submit check-in response');
    }
  };

  // Handle dismissing a check-in
  const handleDismissCheckIn = async (checkInId: string) => {
    try {
      await fetch(`/api/sam/agentic/checkins/${checkInId}`, { method: 'DELETE' });
      setPendingCheckIns(prev => prev.filter(c => c.id !== checkInId));
      setActiveCheckIn(null);
      setShowCheckInPanel(false);
    } catch (error) {
      console.error('[SAMAssistant] Failed to dismiss check-in:', error);
    }
  };

  // Handle intervention action
  const handleInterventionAction = async (intervention: ProactiveIntervention, actionId: string) => {
    const action = intervention.suggestedActions?.find(a => a.id === actionId);
    if (!action) return;

    try {
      // Record the intervention result
      await fetch(`/api/sam/agentic/behavior/interventions?id=${intervention.id}&action=result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          userResponse: 'accepted',
        }),
      });

      // Execute the action
      if (action.targetUrl) {
        window.location.href = action.targetUrl;
      } else if (action.type === 'start_activity') {
        sendMessage('Help me continue learning');
      } else if (action.type === 'take_break') {
        setPendingInterventions(prev => prev.filter(i => i.id !== intervention.id));
      } else if (action.type === 'view_progress') {
        sendMessage('Show me my learning progress');
      }

      // Remove from pending
      setPendingInterventions(prev => prev.filter(i => i.id !== intervention.id));
    } catch (error) {
      console.error('[SAMAssistant] Failed to handle intervention:', error);
    }
  };

  // Handle dismissing an intervention
  const handleDismissIntervention = async (interventionId: string) => {
    try {
      await fetch(`/api/sam/agentic/behavior/interventions?id=${interventionId}&action=result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          userResponse: 'dismissed',
        }),
      });
      setPendingInterventions(prev => prev.filter(i => i.id !== interventionId));
    } catch (error) {
      console.error('[SAMAssistant] Failed to dismiss intervention:', error);
    }
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
      const success = fillField(targetField, content) || executeFormFill(targetField, content);
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
    clearSamMessages();
    setError(null);
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

  // Don't render on auth pages
  const hideRoutes = ['/auth', '/login', '/register', '/admin/auth'];
  if (hideRoutes.some(route => pathname?.startsWith(route))) {
    return null;
  }

  // For admin pages (/dashboard/admin/*), allow rendering even without regular session
  // Admin users have a separate auth system (adminAuth) that doesn't use useSession()
  const isAdminPage = pathname?.startsWith('/dashboard/admin');

  // Require session for non-admin pages
  if (!session && !isAdminPage) {
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

          {/* Agentic Confidence Panel */}
          {insights?.agentic?.confidence && (
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  {insights.agentic.confidence.level === 'HIGH' ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : insights.agentic.confidence.level === 'LOW' ? (
                    <ShieldAlert className="h-3 w-3" />
                  ) : (
                    <Shield className="h-3 w-3" />
                  )}
                  AI Confidence
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    insights.agentic.confidence.level === 'HIGH' && "bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300",
                    insights.agentic.confidence.level === 'MEDIUM' && "bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300",
                    insights.agentic.confidence.level === 'LOW' && "bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300"
                  )}>
                    {insights.agentic.confidence.level}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {Math.round(insights.agentic.confidence.score * 100)}%
                  </span>
                </div>
              </div>
              {/* Confidence Score Bar */}
              <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    insights.agentic.confidence.level === 'HIGH' && "bg-emerald-500",
                    insights.agentic.confidence.level === 'MEDIUM' && "bg-yellow-500",
                    insights.agentic.confidence.level === 'LOW' && "bg-red-500"
                  )}
                  style={{ width: `${insights.agentic.confidence.score * 100}%` }}
                />
              </div>
              {/* Intervention Alerts */}
              {insights.agentic.interventions && insights.agentic.interventions.length > 0 && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {insights.agentic.interventions[0].reason}
                </div>
              )}
            </div>
          )}

          {/* Orchestration Status Panel - Plan-Driven Learning (Enhanced) */}
          <AnimatePresence>
            {insights?.orchestration?.hasActivePlan && insights.orchestration.currentStep && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative px-4 py-3 bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 dark:from-violet-900/30 dark:via-indigo-900/20 dark:to-purple-900/20 border-b border-violet-200/80 dark:border-violet-800/60 shrink-0 overflow-hidden"
              >
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-30 dark:opacity-20">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="orchestration-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="1" fill="currentColor" className="text-violet-400" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#orchestration-grid)" />
                  </svg>
                </div>

                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                />

                <div className="relative z-10">
                  {/* Plan Header */}
                  <div className="flex items-center justify-between mb-2">
                    <motion.span
                      className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5"
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Rocket className="h-3.5 w-3.5" />
                      </motion.div>
                      Active Learning Plan
                    </motion.span>
                    <div className="flex items-center gap-2">
                      {/* Step Sequence Indicator (Step X of Y) */}
                      {(insights.orchestration?.totalSteps ?? 0) > 0 && (
                        <motion.div
                          className="flex items-center gap-1 bg-indigo-100/80 dark:bg-indigo-800/40 px-2 py-0.5 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.15 }}
                        >
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                            Step {insights.orchestration?.currentStepIndex ?? 0} of {insights.orchestration?.totalSteps ?? 0}
                          </span>
                        </motion.div>
                      )}
                      {/* Plan Progress Indicator */}
                      {insights.orchestration.planProgress !== undefined && (
                        <motion.div
                          className="flex items-center gap-1.5 bg-violet-100/80 dark:bg-violet-800/40 px-2 py-0.5 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.2 }}
                        >
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-violet-500"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <span className="text-xs font-medium text-violet-600 dark:text-violet-300">
                            {insights.orchestration.planProgress}%
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Current Step - Card */}
                  <motion.div
                    className="p-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-violet-200/60 dark:border-violet-700/50 mb-2 shadow-sm"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <motion.div
                        className="p-1.5 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-800/60 dark:to-indigo-800/60 rounded-lg"
                        whileHover={{ rotate: 5 }}
                      >
                        <ListChecks className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      </motion.div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {insights.orchestration.currentStep.title}
                      </span>
                    </div>
                    {insights.orchestration.currentStep.objectives?.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {insights.orchestration.currentStep.objectives.slice(0, 2).map((obj, idx) => (
                          <motion.p
                            key={idx}
                            className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5"
                            initial={{ x: -5, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                          >
                            <CircleDot className="h-3 w-3 text-violet-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{obj}</span>
                          </motion.p>
                        ))}
                        {insights.orchestration.currentStep.objectives.length > 2 && (
                          <p className="text-xs text-violet-500 dark:text-violet-400 pl-4">
                            +{insights.orchestration.currentStep.objectives.length - 2} more objectives
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>

                  {/* Step Progress */}
                  {insights.orchestration.stepProgress && (
                    <motion.div
                      className="mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-violet-600 dark:text-violet-400">Step Progress</span>
                        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                          {insights.orchestration.stepProgress.progressPercent}%
                        </span>
                      </div>
                      <div className="relative h-2 bg-violet-200/60 dark:bg-violet-900/40 rounded-full overflow-hidden">
                        {/* Progress bar */}
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${insights.orchestration.stepProgress.progressPercent}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                        {/* Shimmer on progress */}
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          style={{ width: `${insights.orchestration.stepProgress.progressPercent}%` }}
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                        />
                      </div>

                      {/* Pending Criteria - Next Goal */}
                      {insights.orchestration.stepProgress.pendingCriteria?.length > 0 && (
                        <motion.div
                          className="mt-2 flex items-start gap-1.5 p-1.5 bg-amber-50/80 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/30"
                          initial={{ y: 5, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.35 }}
                        >
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Target className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          </motion.div>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            <span className="font-medium">Next:</span> {insights.orchestration.stepProgress.pendingCriteria[0]}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Inline Celebration Banner (full celebration triggers overlay) */}
                  {insights.orchestration.transition?.celebration && (
                    <motion.div
                      className="p-3 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-900/40 dark:via-teal-900/30 dark:to-cyan-900/30 rounded-xl border border-emerald-300/60 dark:border-emerald-700/50 shadow-sm"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: 3 }}
                        >
                          <PartyPopper className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </motion.div>
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          {insights.orchestration.transition.celebration.title}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1.5">
                        {insights.orchestration.transition.celebration.message}
                      </p>
                      {insights.orchestration.transition.celebration.xpEarned && (
                        <motion.div
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-200/60 dark:bg-emerald-800/40 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.2 }}
                        >
                          <Trophy className="h-3 w-3" />
                          +{insights.orchestration.transition.celebration.xpEarned} XP
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Next Step Preview */}
                  {insights.orchestration.transition?.nextStep && (
                    <motion.div
                      className="mt-2 p-2 bg-violet-100/60 dark:bg-violet-900/30 rounded-lg border border-violet-200/50 dark:border-violet-700/40"
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-300">
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Milestone className="h-3 w-3" />
                        </motion.div>
                        <span className="font-medium">Up Next:</span>
                        <span className="truncate">{insights.orchestration.transition.nextStep.title}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Steps Timeline/Checklist (Collapsible) */}
                  {insights.orchestration?.allSteps && insights.orchestration.allSteps.length > 0 && (
                    <motion.div
                      className="mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                    >
                      <button
                        onClick={() => setShowStepsTimeline(!showStepsTimeline)}
                        className="w-full flex items-center justify-between p-2 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 rounded-lg border border-slate-200/50 dark:border-slate-700/40 transition-colors"
                      >
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <ListChecks className="h-3 w-3 text-violet-500" />
                          View All Steps ({(insights.orchestration?.allSteps ?? []).filter(s => s.status === 'completed').length}/{insights.orchestration?.totalSteps ?? 0} complete)
                        </span>
                        <motion.div
                          animate={{ rotate: showStepsTimeline ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {showStepsTimeline && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 p-2 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-200/50 dark:border-slate-700/40 max-h-40 overflow-y-auto">
                              <div className="space-y-1.5">
                                {(insights.orchestration?.allSteps ?? []).map((step, idx) => {
                                  const isCurrentStep = step.id === insights.orchestration?.currentStep?.id;
                                  const isCompleted = step.status === 'completed';
                                  const isSkipped = step.status === 'skipped';

                                  return (
                                    <motion.div
                                      key={step.id}
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ delay: idx * 0.03 }}
                                      className={cn(
                                        'flex items-center gap-2 p-1.5 rounded-md transition-colors',
                                        isCurrentStep && 'bg-violet-100/80 dark:bg-violet-900/40 border border-violet-300/50 dark:border-violet-700/50',
                                        isCompleted && !isCurrentStep && 'bg-emerald-50/60 dark:bg-emerald-900/20',
                                        isSkipped && 'opacity-50'
                                      )}
                                    >
                                      {/* Step Status Icon */}
                                      <div className="flex-shrink-0">
                                        {isCompleted ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        ) : isCurrentStep ? (
                                          <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                          >
                                            <CircleDot className="h-3.5 w-3.5 text-violet-500" />
                                          </motion.div>
                                        ) : (
                                          <Circle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                                        )}
                                      </div>

                                      {/* Step Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className={cn(
                                          'text-xs truncate',
                                          isCurrentStep ? 'font-medium text-violet-700 dark:text-violet-300' :
                                          isCompleted ? 'text-emerald-700 dark:text-emerald-400 line-through' :
                                          'text-slate-600 dark:text-slate-400'
                                        )}>
                                          {idx + 1}. {step.title}
                                        </p>
                                      </div>

                                      {/* Step Type Badge */}
                                      <div className={cn(
                                        'flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full',
                                        step.type === 'learning' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                                        step.type === 'practice' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
                                        step.type === 'assessment' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                                        step.type === 'review' && 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
                                        !['learning', 'practice', 'assessment', 'review'].includes(step.type) && 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                      )}>
                                        {step.type}
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proactive Check-Ins Panel */}
          {pendingCheckIns.length > 0 && !activeCheckIn && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  SAM Check-In ({pendingCheckIns.length})
                </span>
              </div>
              <div className="space-y-2">
                {pendingCheckIns.slice(0, 2).map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-700"
                  >
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{checkIn.message}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenCheckIn(checkIn)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Respond
                      </button>
                      <button
                        onClick={() => handleDismissCheckIn(checkIn.id)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Later
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Check-In Modal */}
          {activeCheckIn && showCheckInPanel && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <HandHeart className="h-4 w-4" />
                  {activeCheckIn.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <button
                  onClick={() => setShowCheckInPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{activeCheckIn.message}</p>

              {/* Questions */}
              {activeCheckIn.questions && activeCheckIn.questions.length > 0 && (
                <div className="space-y-3 mb-3">
                  {activeCheckIn.questions.map((q) => (
                    <div key={q.id}>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                        {q.question}
                      </label>
                      {q.type === 'scale' && (
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => setCheckInResponses(prev => ({ ...prev, [q.id]: n }))}
                              className={cn(
                                'flex-1 py-1 text-xs rounded',
                                checkInResponses[q.id] === n
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      )}
                      {q.type === 'yes_no' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCheckInResponses(prev => ({ ...prev, [q.id]: true }))}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded',
                              checkInResponses[q.id] === true
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                            )}
                          >
                            <ThumbsUp className="h-3 w-3" /> Yes
                          </button>
                          <button
                            onClick={() => setCheckInResponses(prev => ({ ...prev, [q.id]: false }))}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded',
                              checkInResponses[q.id] === false
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                            )}
                          >
                            <ThumbsDown className="h-3 w-3" /> No
                          </button>
                        </div>
                      )}
                      {q.type === 'emoji' && (
                        <div className="flex gap-1">
                          {['😞', '😕', '😐', '🙂', '😊'].map((emoji, i) => (
                            <button
                              key={emoji}
                              onClick={() => setCheckInResponses(prev => ({ ...prev, [q.id]: i + 1 }))}
                              className={cn(
                                'flex-1 py-1 text-lg rounded',
                                checkInResponses[q.id] === i + 1
                                  ? 'bg-amber-100 dark:bg-amber-900'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              )}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                      {(q.type === 'text' || q.type === 'single_choice') && q.options && (
                        <div className="flex flex-wrap gap-1">
                          {q.options.map((option) => (
                            <button
                              key={option}
                              onClick={() => setCheckInResponses(prev => ({ ...prev, [q.id]: option }))}
                              className={cn(
                                'px-2 py-1 text-xs rounded',
                                checkInResponses[q.id] === option
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested Actions */}
              {activeCheckIn.suggestedActions && activeCheckIn.suggestedActions.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Suggested Actions:</p>
                  {activeCheckIn.suggestedActions.slice(0, 3).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        setCheckInResponses(prev => ({ ...prev, selectedAction: action.id }));
                      }}
                      className={cn(
                        'w-full p-2 text-left text-xs rounded border transition-colors',
                        checkInResponses.selectedAction === action.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                      )}
                    >
                      <span className="font-medium">{action.title}</span>
                      <p className="text-gray-500 dark:text-gray-400">{action.description}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleRespondToCheckIn(activeCheckIn.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                >
                  <Check className="h-3 w-3" />
                  Submit
                </button>
                <button
                  onClick={() => handleDismissCheckIn(activeCheckIn.id)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded border border-gray-200"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Pending Interventions Panel */}
          {pendingInterventions.length > 0 && (
            <div className="px-4 py-2 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-800 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <HandHeart className="h-3 w-3" />
                  SAM Suggestion
                </span>
              </div>
              {pendingInterventions.slice(0, 1).map((intervention) => (
                <div key={intervention.id} className="space-y-2">
                  <p className="text-xs text-gray-700 dark:text-gray-300">{intervention.message}</p>
                  <div className="flex flex-wrap gap-2">
                    {intervention.suggestedActions?.slice(0, 2).map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleInterventionAction(intervention, action.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded hover:bg-rose-200 dark:hover:bg-rose-800"
                      >
                        {action.title}
                      </button>
                    ))}
                    <button
                      onClick={() => handleDismissIntervention(intervention.id)}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agentic Tools Panel */}
          {(tools.length > 0 || isLoadingTools || toolsError || toolConfirmations.length > 0 || toolConfirmationsError) && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  const next = !showToolsPanel;
                  setShowToolsPanel(next);
                  if (next && tools.length === 0 && !isLoadingTools) {
                    fetchTools();
                    fetchToolConfirmations();
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mentor Tools {tools.length > 0 ? `(${tools.length})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {toolConfirmations.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                      {toolConfirmations.length} pending
                    </span>
                  )}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      fetchTools();
                      fetchToolConfirmations();
                    }}
                    className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    title="Refresh tools"
                  >
                    <RefreshCw className={cn('h-3 w-3', isLoadingTools && 'animate-spin')} />
                  </button>
                  <ChevronRight className={cn(
                    "h-4 w-4 text-slate-500 transition-transform",
                    showToolsPanel && "rotate-90"
                  )} />
                </div>
              </div>

              {showToolsPanel && (
                <div className="mt-2 space-y-3">
                  {toolsError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{toolsError}</p>
                  )}
                  {toolConfirmationsError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{toolConfirmationsError}</p>
                  )}

                  {toolConfirmations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Pending confirmations
                      </p>
                      {toolConfirmations.slice(0, 2).map((confirmation) => (
                        <div
                          key={confirmation.id}
                          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {confirmation.toolName}
                            </span>
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full uppercase',
                              confirmation.severity === 'critical' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                              confirmation.severity === 'high' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                              confirmation.severity === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                              confirmation.severity === 'low' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            )}>
                              {confirmation.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {confirmation.message}
                          </p>
                          {confirmation.details && confirmation.details.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {confirmation.details.map((detail) => (
                                <div key={detail.label}>
                                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    {detail.label}
                                  </p>
                                  {(detail.type === 'json' || detail.type === 'code') ? (
                                    <pre className="text-[11px] bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 rounded p-1 overflow-auto">
                                      {detail.value}
                                    </pre>
                                  ) : (
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                      {detail.value}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => openApprovalDialog(confirmation)}
                              className="flex-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-1"
                            >
                              <Shield className="h-3 w-3" />
                              Review &amp; Approve
                            </button>
                            <button
                              onClick={() => handleToolConfirmation(confirmation.id, false)}
                              className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isLoadingTools && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Loading tools...</p>
                  )}

                  {!isLoadingTools && tools.length === 0 && !toolsError && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No tools available yet.</p>
                  )}

                  {tools.length > 0 && (
                    <div className="space-y-2">
                      {tools.slice(0, 4).map((tool) => (
                        <div
                          key={tool.id}
                          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {tool.name}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {tool.description}
                              </p>
                            </div>
                            <button
                              onClick={() => handleSelectTool(tool)}
                              className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200"
                            >
                              Use
                            </button>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/40">
                              {tool.category}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/40">
                              {tool.confirmationType}
                            </span>
                            {tool.requiredPermissions.slice(0, 2).map((permission) => (
                              <span
                                key={`${tool.id}-${permission}`}
                                className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/40"
                              >
                                {permission}
                              </span>
                            ))}
                            {tool.deprecated && (
                              <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                                deprecated
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTool && (
                    <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Run {selectedTool.name}
                        </p>
                        <button
                          onClick={() => setSelectedTool(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <textarea
                        value={toolInput}
                        onChange={(event) => setToolInput(event.target.value)}
                        className="w-full h-24 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        placeholder='{"key": "value"}'
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleInvokeTool(selectedTool)}
                          disabled={toolStatus === 'running'}
                          className={cn(
                            'flex items-center gap-1 px-3 py-1 text-xs rounded',
                            toolStatus === 'running'
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-slate-800 text-white hover:bg-slate-900'
                          )}
                        >
                          {toolStatus === 'running' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          Run Tool
                        </button>
                        <button
                          onClick={() => setToolInput('{\n  \n}')}
                          className="px-2 py-1 text-xs text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        >
                          Reset
                        </button>
                      </div>
                      {toolError && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{toolError}</p>
                      )}
                      {toolResult && (
                        <div className="mt-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Status: {toolResult.status}</span>
                            <span>{new Date(toolResult.updatedAt).toLocaleTimeString()}</span>
                          </div>
                          <pre className="mt-1 text-[11px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                            {toolResult.result !== undefined
                              ? formatToolPayload(toolResult.result)
                              : 'No result returned.'}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
              const isMessageStreaming = isStreaming &&
                message.role === 'assistant' &&
                messageIndex === messages.length - 1;
              const showActions = message.role === 'assistant' &&
                !isMessageStreaming &&
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
                      {isMessageStreaming && (
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

                  {/* Feedback Buttons for AI responses */}
                  {message.role === 'assistant' && !isMessageStreaming && samContext?.metadata?.sessionId && (
                    <FeedbackButtons
                      messageId={message.id}
                      sessionId={samContext.metadata.sessionId}
                      className="mt-1.5 ml-1"
                      size="sm"
                    />
                  )}

                  {/* Confidence Indicator for AI responses */}
                  {message.role === 'assistant' && !isMessageStreaming && insights?.agentic?.confidence && (
                    <ConfidenceIndicator
                      confidence={insights.agentic.confidence.score}
                      mode="badge"
                      showPercentage={true}
                      size="sm"
                      className="mt-1 ml-1"
                    />
                  )}

                  {/* Self-Critique Panel - AI transparency for assistant messages */}
                  {message.role === 'assistant' && !isMessageStreaming && messageIndex === messages.length - 1 && (
                    <div className="mt-2 ml-1">
                      {!showSelfCritique && !selfCritiqueData && (
                        <button
                          onClick={() => fetchSelfCritique(message.content)}
                          disabled={isLoadingSelfCritique}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded transition-colors"
                        >
                          {isLoadingSelfCritique ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Brain className="h-3 w-3" />
                              <span>View AI Self-Assessment</span>
                            </>
                          )}
                        </button>
                      )}
                      {showSelfCritique && selfCritiqueData && (
                        <div className="mt-2">
                          <SelfCritiquePanel
                            critique={selfCritiqueData}
                            mode="compact"
                            defaultExpanded={false}
                            showActions={false}
                            className="max-w-full"
                          />
                          <button
                            onClick={() => {
                              setShowSelfCritique(false);
                              setSelfCritiqueData(null);
                            }}
                            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                          >
                            Hide assessment
                          </button>
                        </div>
                      )}
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

      {/* Tool Approval Dialog */}
      <ToolApprovalDialog
        request={activeApprovalRequest}
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
        onApprove={handleApprovalDialogApprove}
        onDeny={handleApprovalDialogDeny}
        isProcessing={isApprovalProcessing}
      />

      {/* Celebration Overlay for orchestration milestones */}
      <CelebrationOverlay
        celebration={celebration}
        onDismiss={dismissCelebration}
        autoDismissMs={5000}
      />
    </div>
  );
}

// Track orchestration state across requests (module-level for closure access)
const orchestrationStateRef = { current: { planId: undefined as string | undefined, goalId: undefined as string | undefined } };

/**
 * Update orchestration state from API response.
 * Call this after receiving response with insights.orchestration.
 */
export function updateOrchestrationState(orchestration?: OrchestrationInsight) {
  if (orchestration?.planId) {
    orchestrationStateRef.current.planId = orchestration.planId;
  }
  if (orchestration?.goalId) {
    orchestrationStateRef.current.goalId = orchestration.goalId;
  }
}

/**
 * Clear orchestration state (e.g., when plan is completed or user switches context).
 */
export function clearOrchestrationState() {
  orchestrationStateRef.current = { planId: undefined, goalId: undefined };
}

/**
 * Build request with current orchestration context.
 * Reads from module-level state to maintain plan/goal continuity.
 */
function buildUnifiedRequestWithOrchestration(input: {
  message: string;
  context: SAMContext;
  history: SAMMessage[];
}) {
  const { planId, goalId } = orchestrationStateRef.current;
  const orchestrationContext: OrchestrationContextInput = {
    autoDetectPlan: !planId, // Only auto-detect if no explicit plan
    ...(planId && { planId }),
    ...(goalId && { goalId }),
  };
  return buildUnifiedRequest(input, orchestrationContext);
}

export function SAMAssistant(props: SAMAssistantProps) {
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
      <SAMAssistantInner {...props} />
    </SAMProvider>
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

function formatToolPayload(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
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
