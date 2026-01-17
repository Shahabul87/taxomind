"use client";

/**
 * SAM Course Learning Integration
 *
 * Comprehensive SAM AI integration for course learning pages.
 * Provides:
 * - Conversational AI assistant
 * - Real-time behavior tracking
 * - Struggle detection alerts
 * - Cognitive load monitoring
 * - Contextual recommendations
 * - Quick actions panel
 *
 * @module components/sam/course-learning/SAMCourseLearningIntegration
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  Zap,
  X,
  ChevronUp,
  ChevronDown,
  BookOpen,
  HelpCircle,
  Target,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// SAM AI Components
import { SAMAssistantWrapper } from "@/components/sam/SAMAssistantWrapper";
import { SAMContextTracker } from "@/components/sam/SAMContextTracker";
import { StruggleDetectionAlert } from "@/components/sam/behavior/StruggleDetectionAlert";
import { CognitiveLoadMonitor } from "@/components/sam/CognitiveLoadMonitor";
import { FeedbackButtons } from "@/components/sam/FeedbackButtons";

// Types
interface LearningContext {
  courseId: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  sectionType?: string;
  userId?: string;
  isEnrolled: boolean;
  progress: number;
}

interface BehaviorEvent {
  type: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface SAMCourseLearningIntegrationProps {
  context: LearningContext;
  onAskSAM?: (question: string) => void;
  onRecommendationClick?: (recommendationId: string) => void;
  className?: string;
}

/**
 * Quick Action for SAM AI assistance during learning
 */
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "explain",
    label: "Explain This",
    icon: <Brain className="h-4 w-4" />,
    prompt: "Can you explain the current topic in simpler terms?",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
  },
  {
    id: "example",
    label: "Give Example",
    icon: <Lightbulb className="h-4 w-4" />,
    prompt: "Can you give me a real-world example of this concept?",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
  },
  {
    id: "quiz",
    label: "Quiz Me",
    icon: <Target className="h-4 w-4" />,
    prompt: "Can you quiz me on what I just learned?",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
  },
  {
    id: "stuck",
    label: "I'm Stuck",
    icon: <HelpCircle className="h-4 w-4" />,
    prompt: "I'm stuck on this topic. Can you help me understand it differently?",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
  },
];

/**
 * Contextual Recommendation from SAM
 */
interface ContextualRecommendation {
  id: string;
  type: "review" | "practice" | "next" | "related";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * SAM Course Learning Integration Component
 */
export function SAMCourseLearningIntegration({
  context,
  onAskSAM,
  onRecommendationClick,
  className,
}: SAMCourseLearningIntegrationProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [cognitiveLoad, setCognitiveLoad] = useState<"low" | "medium" | "high">("low");
  const [struggleDetected, setStruggleDetected] = useState(false);
  const [recommendations, setRecommendations] = useState<ContextualRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [behaviorEvents, setBehaviorEvents] = useState<BehaviorEvent[]>([]);

  // Refs
  const lastActivityRef = useRef<Date>(new Date());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const behaviorFlushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const behaviorEventsRef = useRef<BehaviorEvent[]>([]);

  // Keep ref in sync with state for stable callbacks
  behaviorEventsRef.current = behaviorEvents;

  // Track behavior event
  const trackBehavior = useCallback(
    async (eventType: string, metadata?: Record<string, unknown>) => {
      const event: BehaviorEvent = {
        type: eventType,
        timestamp: new Date(),
        metadata: {
          ...metadata,
          courseId: context.courseId,
          chapterId: context.chapterId,
          sectionId: context.sectionId,
        },
      };

      setBehaviorEvents((prev) => [...prev, event]);
      lastActivityRef.current = new Date();

      // Reset inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Set new inactivity timer (3 minutes)
      inactivityTimerRef.current = setTimeout(() => {
        trackBehavior("INACTIVITY_DETECTED", { duration: 180 });
      }, 180000);
    },
    [context.courseId, context.chapterId, context.sectionId]
  );

  // Flush behavior events to API - uses ref for stable callback
  const flushBehaviorEvents = useCallback(async () => {
    const currentEvents = behaviorEventsRef.current;
    if (currentEvents.length === 0 || !context.userId) return;

    try {
      const eventsToFlush = [...currentEvents];
      setBehaviorEvents([]);

      await fetch("/api/sam/agentic/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: context.userId,
          events: eventsToFlush,
        }),
      });
    } catch (error) {
      console.error("Failed to flush behavior events:", error);
      // Re-add events on failure
      setBehaviorEvents((prev) => [...eventsToFlush, ...prev]);
    }
  }, [context.userId]);

  // Fetch contextual recommendations
  const fetchRecommendations = useCallback(async () => {
    // Validate all required params before fetching - must be non-empty strings
    if (!context.userId?.trim() || !context.courseId?.trim() || !context.sectionId?.trim()) {
      return;
    }

    // Skip if not valid UUIDs (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(context.courseId) || !uuidRegex.test(context.sectionId)) {
      return;
    }

    setIsLoadingRecommendations(true);

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(
        `/api/sam/agentic/recommendations/contextual?` +
          new URLSearchParams({
            userId: context.userId,
            courseId: context.courseId,
            sectionId: context.sectionId,
            limit: "3",
          }),
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch {
      // Silently handle fetch failures - recommendations are not critical
      // Don't log errors to console as this is a non-critical feature
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingRecommendations(false);
    }
  }, [context.userId, context.courseId, context.sectionId]);

  // Handle quick action click
  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      trackBehavior("QUICK_ACTION_CLICKED", { actionId: action.id });
      onAskSAM?.(action.prompt);
      toast.info(`SAM is thinking about: ${action.label}`);
    },
    [trackBehavior, onAskSAM]
  );

  // Handle recommendation click
  const handleRecommendationClick = useCallback(
    (rec: ContextualRecommendation) => {
      trackBehavior("RECOMMENDATION_CLICKED", {
        recommendationId: rec.id,
        type: rec.type,
      });
      onRecommendationClick?.(rec.id);
      if (rec.action?.onClick) {
        rec.action.onClick();
      }
    },
    [trackBehavior, onRecommendationClick]
  );

  // Handle struggle detection
  const handleStruggleDetected = useCallback(
    (data: { severity: string; pattern: string }) => {
      setStruggleDetected(true);
      trackBehavior("STRUGGLE_DETECTED", data);

      // Auto-show SAM help after struggle
      setTimeout(() => {
        toast.info("SAM noticed you might need help. Click the assistant to ask a question!");
      }, 2000);
    },
    [trackBehavior]
  );

  // Handle cognitive load change
  const handleCognitiveLoadChange = useCallback(
    (load: { level: "low" | "medium" | "high"; score: number }) => {
      setCognitiveLoad(load.level);
      if (load.level === "high") {
        trackBehavior("HIGH_COGNITIVE_LOAD", { score: load.score });
      }
    },
    [trackBehavior]
  );

  // Initialize behavior tracking
  useEffect(() => {
    // Track page view
    trackBehavior("SECTION_VIEW", {
      sectionTitle: context.sectionTitle,
      chapterTitle: context.chapterTitle,
    });

    // Fetch initial recommendations
    fetchRecommendations();

    // Set up behavior flush interval (every 30 seconds)
    behaviorFlushTimerRef.current = setInterval(flushBehaviorEvents, 30000);

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackBehavior("TAB_HIDDEN");
        flushBehaviorEvents();
      } else {
        trackBehavior("TAB_VISIBLE");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Track scroll depth
    let maxScrollDepth = 0;
    const handleScroll = () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercentage > maxScrollDepth) {
        maxScrollDepth = scrollPercentage;
        if (maxScrollDepth % 25 === 0 && maxScrollDepth > 0) {
          trackBehavior("SCROLL_DEPTH", { depth: maxScrollDepth });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      // Cleanup
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (behaviorFlushTimerRef.current) {
        clearInterval(behaviorFlushTimerRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("scroll", handleScroll);

      // Final flush on unmount
      flushBehaviorEvents();
    };
  }, [context, trackBehavior, flushBehaviorEvents, fetchRecommendations]);

  // Track time spent on page
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      // This will be part of the final flush
      trackBehavior("TIME_SPENT", { seconds: timeSpent });
    };
  }, [trackBehavior]);

  return (
    <>
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      {/* Floating Quick Actions Panel */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
              "fixed left-4 top-1/2 -translate-y-1/2 z-40",
              "hidden lg:block",
              className
            )}
          >
            <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-amber-500" />
                    Quick Help
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => setShowQuickActions(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 text-xs h-8",
                      action.color
                    )}
                    onClick={() => handleQuickAction(action)}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Quick Actions Button (when panel is hidden) */}
      {!showQuickActions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
        >
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md"
            onClick={() => setShowQuickActions(true)}
            title="Show quick actions"
          >
            <Zap className="h-4 w-4 text-amber-500" />
          </Button>
        </motion.div>
      )}

      {/* Cognitive Load & Struggle Detection Panel */}
      <div className="fixed right-4 top-24 z-40 hidden xl:block w-64 space-y-3">
        {/* Cognitive Load Monitor */}
        <CognitiveLoadMonitor
          sessionId={context.sectionId}
          autoRefresh={true}
          refreshInterval={60000}
          compact={true}
          onLoadChange={handleCognitiveLoadChange}
        />

        {/* Struggle Detection Alert */}
        {struggleDetected && (
          <StruggleDetectionAlert
            onDismiss={() => setStruggleDetected(false)}
            onAskForHelp={() => {
              trackBehavior("HELP_REQUESTED_FROM_STRUGGLE");
              onAskSAM?.("I'm struggling with this topic. Can you help me?");
            }}
          />
        )}

        {/* Contextual Recommendations */}
        {recommendations.length > 0 && (
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                SAM Recommends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {recommendations.slice(0, 3).map((rec) => (
                <button
                  key={rec.id}
                  className="w-full text-left p-2 rounded-md bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => handleRecommendationClick(rec)}
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        rec.priority === "high" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        rec.priority === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                        rec.priority === "low" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {rec.type}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white mt-1 line-clamp-2">
                    {rec.title}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Quick Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-2 safe-area-bottom">
          <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
            {QUICK_ACTIONS.slice(0, 4).map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className={cn("flex-1 h-12 flex-col gap-1 text-[10px]", action.color)}
                onClick={() => handleQuickAction(action)}
              >
                {action.icon}
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* SAM AI Assistant - Always available */}
      <SAMAssistantWrapper />

      {/* Feedback Collection (appears after section completion) */}
      {context.progress >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:bottom-4"
        >
          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-800 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">
                How was this section?
              </p>
              <FeedbackButtons
                entityType="section"
                entityId={context.sectionId}
                onFeedback={(rating) => {
                  trackBehavior("SECTION_FEEDBACK", { rating });
                  toast.success("Thanks for your feedback!");
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  );
}

export default SAMCourseLearningIntegration;
