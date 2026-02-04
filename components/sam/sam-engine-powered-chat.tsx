'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';
import {
  Send,
  Sparkles,
  Brain,
  TrendingUp,
  BookOpen,
  BarChart3,
  FileText,
  Loader2,
  ChevronRight,
  GitBranch,
  WifiOff,
  AlertCircle,
  Square,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { AgenticChatData, RecommendationItem } from '@/lib/sam/agentic-chat/types';
import {
  ToolResultCard,
  GoalProgressBadge,
  InterventionBanner,
  ConfidenceBadge,
  OrchestrationProgress,
  RecommendationCards,
  SkillUpdateBadge,
} from '@/components/sam/agentic';
import { useRealtimeInterventions } from '@/hooks/sam/useRealtimeInterventions';
import { OfflineIndicator } from '@/components/sam/offline-indicator';

// =============================================================================
// TYPES
// =============================================================================

interface ChatAction {
  label: string;
  route?: string | null;
  action?: () => Promise<unknown>;
}

interface ChatSuggestion {
  title?: string;
  description?: string;
}

interface EngineInsight {
  type: string;
  data?: Record<string, unknown>;
}

interface EngineData {
  marketAnalysis?: unknown;
  bloomsAnalysis?: unknown;
  courseGuide?: unknown;
  learningProfile?: unknown;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: (string | ChatSuggestion)[];
  actions?: ChatAction[];
  insights?: EngineInsight[];
  engineData?: EngineData | null;
  agenticData?: AgenticChatData | null;
  timestamp: Date;
}

interface ChatApiResponse {
  success: boolean;
  data: {
    message: string;
    suggestions: (string | ChatSuggestion)[];
    actions: ChatAction[];
    insights: Record<string, unknown>;
    engineData?: EngineData | null;
    agenticData?: AgenticChatData | null;
    conversationId: string;
    memoryContext: { hasMemory: boolean };
  };
}

interface ConversationThread {
  id: string;
  topic: string | null;
  threadType: string;
  createdAt: string;
}

// =============================================================================
// SSE PARSER (for streaming endpoint)
// =============================================================================

interface SSEEvent {
  event: string;
  data: string;
}

/** Parse raw SSE text buffer into discrete events */
function parseSSEChunk(buffer: string): { events: SSEEvent[]; remainder: string } {
  const events: SSEEvent[] = [];
  const lines = buffer.split('\n');
  let currentEvent = '';
  let currentData = '';
  let remainder = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7);
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6);
    } else if (line === '') {
      // Empty line = end of SSE message
      if (currentEvent && currentData) {
        events.push({ event: currentEvent, data: currentData });
      }
      currentEvent = '';
      currentData = '';
    } else if (i === lines.length - 1 && line !== '') {
      // Incomplete line at end — carry over to next chunk
      remainder = line;
      if (currentEvent && !currentData) {
        remainder = `event: ${currentEvent}\n${remainder}`;
        currentEvent = '';
      }
    }
  }

  // If we have a partial event at the end, carry it over
  if (currentEvent || currentData) {
    remainder =
      (currentEvent ? `event: ${currentEvent}\n` : '') +
      (currentData ? `data: ${currentData}\n` : '') +
      remainder;
  }

  return { events, remainder };
}

// =============================================================================
// COMPONENT
// =============================================================================

interface SAMEnginePoweredChatProps {
  courseId?: string;
  initialMessage?: string;
  conversationId?: string;
  enableRealtime?: boolean;
  enableStreaming?: boolean;
}

export function SAMEnginePoweredChat({
  courseId,
  initialMessage,
  conversationId: initialConversationId,
  enableRealtime = false,
  enableStreaming = true,
}: SAMEnginePoweredChatProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [showEngineInsights, setShowEngineInsights] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [showThreads, setShowThreads] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // AbortController for stopping streaming generation
  const streamAbortRef = useRef<AbortController | null>(null);

  // Real-time interventions (Gap 3)
  const {
    interventions: realtimeInterventions,
    connectionStatus,
    dismiss: dismissIntervention,
  } = useRealtimeInterventions({
    enabled: enableRealtime,
  });

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch threads when conversation exists
  useEffect(() => {
    if (!currentConversationId) return;
    fetch(`/api/sam/conversations/threads?conversationId=${currentConversationId}`)
      .then((res) => res.json())
      .then((data: { success: boolean; data?: { threads: ConversationThread[] } }) => {
        if (data.success && data.data?.threads) {
          setThreads(data.data.threads);
        }
      })
      .catch(() => {
        // Thread loading is non-critical
      });
  }, [currentConversationId]);

  // Refs for stable callbacks (per CLAUDE.md useRef pattern)
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  // Ref to track streaming preference (stable in callbacks)
  const enableStreamingRef = useRef(enableStreaming);
  enableStreamingRef.current = enableStreaming;

  // Ref for currentConversationId (stable in streaming callback)
  const conversationIdRef = useRef(currentConversationId);
  conversationIdRef.current = currentConversationId;

  /** Send message via SSE streaming endpoint */
  const sendStreamingMessage = useCallback(
    async (_message: string, requestBody: string) => {
      const abortController = new AbortController();
      streamAbortRef.current = abortController;

      const response = await fetch('/api/sam/unified/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to establish streaming connection');
      }

      const samMessageId = `${Date.now()}-sam`;
      let streamedContent = '';
      let streamMetadata: Record<string, unknown> = {};

      // Add placeholder assistant message that we'll update progressively
      const placeholderMessage: ChatMessage = {
        id: samMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, placeholderMessage]);
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const { events, remainder } = parseSSEChunk(sseBuffer);
          sseBuffer = remainder;

          for (const sseEvent of events) {
            try {
              const parsed = JSON.parse(sseEvent.data);

              switch (sseEvent.event) {
                case 'content': {
                  // Accumulate streaming tokens
                  streamedContent += parsed.text ?? '';
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === samMessageId ? { ...m, content: streamedContent } : m
                    )
                  );
                  break;
                }
                case 'content-replace': {
                  // Safety/verification gating — replace entire content
                  streamedContent = parsed.text ?? '';
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === samMessageId ? { ...m, content: streamedContent } : m
                    )
                  );
                  break;
                }
                case 'insights': {
                  // Build engine data and agentic data from insights
                  const agentic = (parsed.agentic ?? {}) as Record<string, unknown>;
                  const engineData: EngineData = {
                    marketAnalysis: parsed.content ?? null,
                    bloomsAnalysis: parsed.blooms ?? null,
                    courseGuide: parsed.context ?? null,
                    learningProfile: parsed.personalization ?? null,
                  };
                  const agenticData: AgenticChatData | null =
                    agentic.confidence || agentic.goalContext
                      ? ({
                          intent: (agentic.intent as Record<string, unknown>) ?? {
                            intent: 'question',
                            confidence: 0,
                          },
                          confidence: agentic.confidence ?? null,
                          toolResults: agentic.toolExecution
                            ? [agentic.toolExecution]
                            : [],
                          goalContext: agentic.goalContext ?? null,
                          interventionContext: agentic.interventions
                            ? { interventions: agentic.interventions }
                            : null,
                          recommendations: agentic.recommendations ?? null,
                          skillUpdate: agentic.skillUpdate ?? null,
                          orchestration: parsed.orchestration
                            ? {
                                hasActivePlan:
                                  (parsed.orchestration as Record<string, unknown>)
                                    .hasActivePlan,
                                currentStep:
                                  (parsed.orchestration as Record<string, unknown>)
                                    .currentStep,
                                stepProgress:
                                  (parsed.orchestration as Record<string, unknown>)
                                    .stepProgress,
                                transition:
                                  (parsed.orchestration as Record<string, unknown>)
                                    .transition,
                              }
                            : null,
                          processingTimeMs: 0,
                        } as AgenticChatData)
                      : null;

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === samMessageId
                        ? { ...m, engineData, agenticData }
                        : m
                    )
                  );

                  // Update active engines
                  const engines: string[] = [];
                  if (engineData.marketAnalysis) engines.push('market');
                  if (engineData.bloomsAnalysis) engines.push('blooms');
                  if (engineData.courseGuide) engines.push('guide');
                  if (engineData.learningProfile) engines.push('profile');
                  setActiveEngines(engines);
                  break;
                }
                case 'suggestions': {
                  const suggestions = parsed as (string | ChatSuggestion)[];
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === samMessageId
                        ? { ...m, suggestions }
                        : m
                    )
                  );
                  break;
                }
                case 'actions': {
                  const actions = parsed as ChatAction[];
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === samMessageId ? { ...m, actions } : m
                    )
                  );
                  break;
                }
                case 'done': {
                  streamMetadata = parsed.metadata ?? {};
                  const sessionId =
                    (streamMetadata.sessionId as string) ??
                    conversationIdRef.current ??
                    `chat-${Date.now()}`;
                  if (sessionId && !conversationIdRef.current) {
                    setCurrentConversationId(sessionId);
                  }
                  break;
                }
                case 'error': {
                  logger.warn('SSE error event:', parsed);
                  break;
                }
              }
            } catch (parseError) {
              // Skip malformed SSE events
              logger.warn('Failed to parse SSE event:', parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
        setIsStreaming(false);
        streamAbortRef.current = null;
      }
    },
    [] // Stable: uses refs for mutable values
  );

  /** Send message via non-streaming POST endpoint (original behavior) */
  const sendNonStreamingMessage = useCallback(
    async (_message: string, requestBody: string) => {
      const response = await fetch('/api/sam/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (!response.ok) throw new Error('Failed to get response');

      const raw = await response.json();

      // Map unified response to ChatApiResponse shape
      const insights = raw.insights ?? {};
      const metadata = raw.metadata ?? {};
      const agentic = insights.agentic ?? {};

      const data: ChatApiResponse = {
        success: raw.success ?? true,
        data: {
          message: raw.response ?? '',
          suggestions: raw.suggestions ?? [],
          actions: raw.actions ?? [],
          insights: insights,
          engineData: {
            marketAnalysis: insights.content ?? null,
            bloomsAnalysis: insights.blooms ?? null,
            courseGuide: insights.context ?? null,
            learningProfile: insights.personalization ?? null,
          },
          agenticData: (agentic.confidence || agentic.goalContext || agentic.intent) ? {
            intent: agentic.intent ?? { intent: 'question', confidence: 0 },
            confidence: agentic.confidence ?? null,
            toolResults: metadata.toolExecution ? [metadata.toolExecution] : [],
            goalContext: agentic.goalContext ?? null,
            interventionContext: agentic.interventions
              ? { interventions: agentic.interventions }
              : null,
            recommendations: agentic.recommendations ?? null,
            skillUpdate: agentic.skillUpdate ?? null,
            orchestration: insights.orchestration
              ? {
                  hasActivePlan: insights.orchestration.hasActivePlan,
                  currentStep: insights.orchestration.currentStep,
                  stepProgress: insights.orchestration.stepProgress,
                  transition: insights.orchestration.transition,
                }
              : null,
            processingTimeMs: metadata.requestTime ?? 0,
          } as AgenticChatData : null,
          conversationId: metadata.sessionId ?? conversationIdRef.current ?? `chat-${Date.now()}`,
          memoryContext: { hasMemory: !!insights.memoryContext },
        },
      };

      // Track the conversation ID from the server
      if (data.data.conversationId && !conversationIdRef.current) {
        setCurrentConversationId(data.data.conversationId);
      }

      const samMessage: ChatMessage = {
        id: `${Date.now()}-sam`,
        role: 'assistant',
        content: data.data.message,
        suggestions: data.data.suggestions ?? [],
        actions: data.data.actions ?? [],
        insights: Array.isArray(data.data.insights)
          ? (data.data.insights as EngineInsight[])
          : [],
        engineData: data.data.engineData ?? null,
        agenticData: data.data.agenticData ?? null,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, samMessage]);

      // Update active engines
      if (data.data.engineData) {
        const engines: string[] = [];
        if (data.data.engineData.marketAnalysis) engines.push('market');
        if (data.data.engineData.bloomsAnalysis) engines.push('blooms');
        if (data.data.engineData.courseGuide) engines.push('guide');
        if (data.data.engineData.learningProfile) engines.push('profile');
        setActiveEngines(engines);
      }
    },
    [] // Stable: uses conversationIdRef
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || !session?.user) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      const requestBody = JSON.stringify({
        message,
        pageContext: {
          type: 'course-detail',
          path: `/courses/${courseId}`,
          entityId: courseId,
          entityType: 'course',
        },
        conversationId: conversationIdRef.current,
      });

      try {
        if (enableStreamingRef.current) {
          await sendStreamingMessage(message, requestBody);
        } else {
          await sendNonStreamingMessage(message, requestBody);
        }
      } catch (error: unknown) {
        // Don't show error toast when user deliberately stops generation
        if (error instanceof DOMException && error.name === 'AbortError') {
          logger.info('Streaming generation stopped by user');
          setIsStreaming(false);
          return;
        }

        logger.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: isOnline
            ? 'Failed to get response from SAM'
            : 'You are offline. Message will be sent when you reconnect.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user, courseId, isOnline, toast, sendStreamingMessage, sendNonStreamingMessage]
  );

  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
    }
  }, [initialMessage, sendMessage]);

  const handleAction = useCallback(
    (action: ChatAction) => {
      if (action.route) {
        router.push(action.route);
      } else if (action.action) {
        action.action().then(() => {
          toast({
            title: 'Action Completed',
            description: action.label,
          });
        });
      } else {
        toast({
          title: 'Feature Coming Soon',
          description: `${action.label} - This feature will be implemented soon.`,
        });
      }
    },
    [router, toast]
  );

  const renderInsight = (insight: EngineInsight) => {
    if (insight.type === 'progress' && insight.data) {
      return (
        <div className="space-y-1">
          <p>Bloom&apos;s Progress:</p>
          <div className="grid grid-cols-3 gap-1 text-xs">
            {Object.entries(insight.data)
              .slice(0, 3)
              .map(([level, score]) => (
                <div key={level}>
                  <span className="font-medium">{level}:</span> {String(score)}%
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (insight.type === 'metrics' && insight.data) {
      const depth = insight.data.depth as Record<string, unknown> | undefined;
      const engagement = insight.data.engagement as Record<string, unknown> | undefined;
      return (
        <div className="space-y-1">
          <p>Course Metrics:</p>
          <div className="text-xs">
            Depth: {(depth?.overallDepth as number) ?? 0}% | Engagement:{' '}
            {(engagement?.overallEngagement as number) ?? 0}%
          </div>
        </div>
      );
    }

    return null;
  };

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          {/* Intervention banner above message */}
          {!isUser && msg.agenticData?.interventionContext && (
            <InterventionBanner
              interventionContext={msg.agenticData.interventionContext}
            />
          )}

          <div
            className={`rounded-lg px-4 py-2 ${
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            <p className="text-sm">
              {msg.content}
              {/* Pulsing cursor during streaming */}
              {!isUser && isStreaming && msg.id.endsWith('-sam') && msg.content.length > 0 && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-current animate-pulse rounded-sm opacity-70" />
              )}
            </p>
          </div>

          {/* Tool results */}
          {!isUser && msg.agenticData?.toolResults && msg.agenticData.toolResults.length > 0 && (
            <ToolResultCard results={msg.agenticData.toolResults} />
          )}

          {/* Goal progress badge */}
          {!isUser && msg.agenticData?.goalContext && (
            <GoalProgressBadge goalContext={msg.agenticData.goalContext} />
          )}

          {/* Orchestration progress */}
          {!isUser && msg.agenticData?.orchestration && (
            <OrchestrationProgress orchestration={msg.agenticData.orchestration} />
          )}

          {/* Skill update badge */}
          {!isUser && msg.agenticData?.skillUpdate && (
            <SkillUpdateBadge skillUpdate={msg.agenticData.skillUpdate} />
          )}

          {/* Recommendations */}
          {!isUser && msg.agenticData?.recommendations && msg.agenticData.recommendations.length > 0 && (
            <RecommendationCards
              recommendations={msg.agenticData.recommendations}
              onSelect={(rec: RecommendationItem) => {
                sendMessage(`Tell me more about: ${rec.title}`);
              }}
            />
          )}

          {/* Engine Insights */}
          {!isUser && msg.engineData && showEngineInsights && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                {msg.engineData.marketAnalysis && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Market
                  </Badge>
                )}
                {msg.engineData.bloomsAnalysis && (
                  <Badge variant="outline" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" />
                    Bloom&apos;s
                  </Badge>
                )}
                {msg.engineData.courseGuide && (
                  <Badge variant="outline" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Guide
                  </Badge>
                )}
              </div>

              {msg.insights && msg.insights.length > 0 && (
                <Card className="mt-2">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3">
                    {msg.insights.map((insight, index) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        {renderInsight(insight)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Suggestions */}
          {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {msg.suggestions.map((suggestion, index) => {
                const isString = typeof suggestion === 'string';
                return (
                  <Card key={index} className="p-2">
                    <p className="text-xs font-medium">
                      {isString ? suggestion : suggestion.title}
                    </p>
                    {!isString && suggestion.description && (
                      <p className="text-xs text-muted-foreground">
                        {suggestion.description}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Actions */}
          {!isUser && msg.actions && msg.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {msg.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(action)}
                  className="text-xs"
                >
                  {action.label}
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              ))}
            </div>
          )}

          {/* Timestamp + Confidence badge */}
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-xs text-muted-foreground">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </p>
            {!isUser && showEngineInsights && msg.agenticData?.confidence && (
              <ConfidenceBadge confidence={msg.agenticData.confidence} />
            )}
          </div>
        </div>
      </div>
    );
  };

  const suggestedQuestions = [
    { text: 'How am I doing in this course?', icon: BarChart3 },
    { text: 'What should I focus on next?', icon: Brain },
    { text: 'How can I improve my course?', icon: TrendingUp },
    { text: 'Generate a practice exam', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">SAM AI Assistant</h3>
          <Badge variant="secondary" className="text-xs">
            Engine Powered
          </Badge>
          {/* SSE connection status dot (Gap 3) */}
          {enableRealtime && (
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'reconnecting'
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-400'
              }`}
              title={`Realtime: ${connectionStatus}`}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Thread toggle button (Gap 1) */}
          {currentConversationId && threads.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThreads(!showThreads)}
            >
              <GitBranch className="w-4 h-4 mr-1" />
              {threads.length}
            </Button>
          )}
          <OfflineIndicator />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEngineInsights(!showEngineInsights)}
          >
            {showEngineInsights ? 'Hide' : 'Show'} Insights
          </Button>
        </div>
      </div>

      {/* Thread selector panel (Gap 1) */}
      {showThreads && threads.length > 0 && (
        <div className="px-4 py-2 bg-muted/30 border-b space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Conversation Threads</p>
          <div className="flex flex-wrap gap-1">
            {threads.map((thread) => (
              <Badge
                key={thread.id}
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={() => {
                  setCurrentConversationId(thread.id);
                  setShowThreads(false);
                }}
              >
                <GitBranch className="w-3 h-3 mr-1" />
                {thread.topic ?? thread.threadType}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Real-time intervention banners (Gap 3) */}
      {realtimeInterventions.length > 0 && (
        <div className="px-4 py-2 space-y-1">
          {realtimeInterventions.map((intervention) => (
            <div
              key={intervention.id}
              className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  {intervention.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-amber-600 hover:text-amber-800"
                onClick={() => dismissIntervention(intervention.id)}
              >
                &times;
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Active Engines Indicator */}
      {activeEngines.length > 0 && (
        <div className="px-4 py-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Active Engines:</span>
            <div className="flex gap-1">
              {activeEngines.includes('market') && (
                <Badge variant="outline" className="text-xs">
                  Market
                </Badge>
              )}
              {activeEngines.includes('blooms') && (
                <Badge variant="outline" className="text-xs">
                  Bloom&apos;s
                </Badge>
              )}
              {activeEngines.includes('guide') && (
                <Badge variant="outline" className="text-xs">
                  Guide
                </Badge>
              )}
              {activeEngines.includes('profile') && (
                <Badge variant="outline" className="text-xs">
                  Profile
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Ask me anything! I have access to comprehensive insights about your
              learning and courses.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {suggestedQuestions.map((question, index) => {
                const Icon = question.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(question.text)}
                    className="text-xs justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {question.text}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        {isLoading && !messages.some((m) => m.role === 'assistant' && m.content === '' && m.id.endsWith('-sam')) && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        {!isOnline && (
          <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-600">
            <WifiOff className="w-3 h-3" />
            <span>You are offline. Messages will be queued.</span>
          </div>
        )}
        {isStreaming && (
          <div className="flex justify-center mb-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (streamAbortRef.current) {
                  streamAbortRef.current.abort();
                }
              }}
            >
              <Square className="w-3 h-3 mr-1.5" />
              Stop generating
            </Button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isOnline ? 'Ask SAM anything...' : 'Type a message (will send when online)...'}
            disabled={isLoading || isStreaming}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || isStreaming || !input.trim()}>
            {isOnline ? <Send className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
