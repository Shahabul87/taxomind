"use client";

/**
 * SAMQuickActions - Quick Action Buttons for SAM AI
 *
 * Provides a floating action menu or inline action buttons that use
 * the useSAMActions hook for executing SAM orchestration actions.
 *
 * Integration Points:
 * - LearningCommandCenter dashboard
 * - Course learning pages
 * - SAMAssistant action panel
 *
 * @example
 * ```tsx
 * // Floating action menu
 * <SAMQuickActions variant="floating" position="bottom-right" />
 *
 * // Inline action buttons
 * <SAMQuickActions variant="inline" compact />
 *
 * // With course context
 * <SAMQuickActions
 *   variant="inline"
 *   context={{ courseId: 'xyz', chapterId: 'abc' }}
 * />
 * ```
 */

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Target,
  Zap,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  PenTool,
  MessageSquare,
  Repeat,
  TrendingUp,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSAMActions, useSAMChat, useSAM } from "@sam-ai/react";
import type { SAMAction } from "@sam-ai/core";

// ============================================================================
// TYPES
// ============================================================================

interface QuickActionDefinition {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: "learning" | "practice" | "help" | "analysis" | "planning";
  color: string;
  prompt?: string;
  action?: SAMAction;
}

interface SAMQuickActionsProps {
  /** Display variant */
  variant?: "floating" | "inline" | "compact";
  /** Position for floating variant */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Additional context for actions */
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    conceptId?: string;
    topicName?: string;
  };
  /** Filter actions by category */
  categories?: QuickActionDefinition["category"][];
  /** Maximum actions to show (for compact variant) */
  maxActions?: number;
  /** Custom actions to add */
  customActions?: QuickActionDefinition[];
  /** Callback when action completes */
  onActionComplete?: (actionId: string, result: unknown) => void;
  /** Callback when action fails */
  onActionError?: (actionId: string, error: Error) => void;
  /** Show category labels */
  showCategories?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// DEFAULT QUICK ACTIONS
// ============================================================================

const DEFAULT_QUICK_ACTIONS: QuickActionDefinition[] = [
  // Learning Actions
  {
    id: "explain_concept",
    label: "Explain This",
    description: "Get a detailed explanation of the current concept",
    icon: Brain,
    category: "learning",
    color: "from-purple-500 to-indigo-500",
    prompt: "Please explain the current concept in detail. Break it down into simple terms and provide examples.",
  },
  {
    id: "summarize",
    label: "Summarize",
    description: "Get a quick summary of the content",
    icon: FileText,
    category: "learning",
    color: "from-blue-500 to-cyan-500",
    prompt: "Provide a concise summary of the current content, highlighting the key points.",
  },
  {
    id: "key_points",
    label: "Key Points",
    description: "Extract the main takeaways",
    icon: List,
    category: "learning",
    color: "from-teal-500 to-emerald-500",
    prompt: "List the key points and main takeaways from this content in a bullet-point format.",
  },
  // Practice Actions
  {
    id: "generate_practice",
    label: "Practice Problems",
    description: "Generate practice problems based on the topic",
    icon: PenTool,
    category: "practice",
    color: "from-orange-500 to-amber-500",
    prompt: "Generate 3-5 practice problems based on this content. Include a mix of difficulty levels.",
  },
  {
    id: "quiz_me",
    label: "Quiz Me",
    description: "Test your understanding with a quick quiz",
    icon: Target,
    category: "practice",
    color: "from-pink-500 to-rose-500",
    prompt: "Create a quick quiz (5 questions) to test my understanding of this topic.",
  },
  {
    id: "review_session",
    label: "Review Session",
    description: "Start a spaced repetition review",
    icon: Repeat,
    category: "practice",
    color: "from-violet-500 to-purple-500",
    prompt: "Start a review session for the concepts I&apos;ve recently learned. Use spaced repetition principles.",
  },
  // Help Actions
  {
    id: "help_stuck",
    label: "I&apos;m Stuck",
    description: "Get help when you&apos;re struggling",
    icon: HelpCircle,
    category: "help",
    color: "from-red-500 to-orange-500",
    prompt: "I&apos;m having trouble understanding this. Can you help me by breaking it down step by step?",
  },
  {
    id: "hint",
    label: "Give Me a Hint",
    description: "Get a gentle nudge in the right direction",
    icon: Lightbulb,
    category: "help",
    color: "from-yellow-500 to-amber-500",
    prompt: "Give me a hint about this concept without revealing the full answer.",
  },
  {
    id: "ask_question",
    label: "Ask SAM",
    description: "Ask SAM anything about this topic",
    icon: MessageSquare,
    category: "help",
    color: "from-green-500 to-emerald-500",
    prompt: "",
  },
  // Analysis Actions
  {
    id: "analyze_progress",
    label: "My Progress",
    description: "Analyze your learning progress",
    icon: TrendingUp,
    category: "analysis",
    color: "from-indigo-500 to-blue-500",
    prompt: "Analyze my learning progress and provide insights on areas where I&apos;m doing well and where I need improvement.",
  },
  {
    id: "knowledge_gaps",
    label: "Find Gaps",
    description: "Identify knowledge gaps",
    icon: AlertCircle,
    category: "analysis",
    color: "from-amber-500 to-yellow-500",
    prompt: "Identify any knowledge gaps I might have based on my learning history and suggest how to address them.",
  },
  // Planning Actions
  {
    id: "create_plan",
    label: "Learning Plan",
    description: "Create a personalized learning plan",
    icon: Target,
    category: "planning",
    color: "from-emerald-500 to-teal-500",
    prompt: "Help me create a personalized learning plan for mastering this topic. Include milestones and estimated timeframes.",
  },
  {
    id: "next_steps",
    label: "What&apos;s Next",
    description: "Get recommendations for next steps",
    icon: Zap,
    category: "planning",
    color: "from-cyan-500 to-blue-500",
    prompt: "Based on my current progress, what should I focus on next? Provide specific recommendations.",
  },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface ActionButtonProps {
  action: QuickActionDefinition;
  isExecuting: boolean;
  isSuccess: boolean | null;
  compact?: boolean;
  onClick: () => void;
}

function ActionButton({
  action,
  isExecuting,
  isSuccess,
  compact = false,
  onClick,
}: ActionButtonProps) {
  const Icon = action.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={compact ? "sm" : "default"}
            className={cn(
              "relative group transition-all duration-200",
              compact
                ? "h-9 px-3"
                : "h-11 px-4 hover:bg-gradient-to-r hover:text-white",
              isExecuting && "opacity-70 cursor-wait",
              !compact && `hover:${action.color}`
            )}
            onClick={onClick}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSuccess === true ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : isSuccess === false ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {!compact && <span className="ml-2">{action.label}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{action.label}</p>
          <p className="text-xs text-muted-foreground">{action.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SAMQuickActions({
  variant = "inline",
  position = "bottom-right",
  context,
  categories,
  maxActions,
  customActions = [],
  onActionComplete,
  onActionError,
  showCategories = false,
  className,
}: SAMQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [actionResults, setActionResults] = useState<Record<string, boolean | null>>({});

  // SAM hooks
  const { actions: samActions, executeAction, isExecuting } = useSAMActions();
  const { sendMessage, isProcessing } = useSAMChat();
  const { isOpen: isSAMOpen, open: openSAM, context: samContext } = useSAM();

  // Combine default and custom actions
  const allActions = useMemo(() => {
    const combined = [...DEFAULT_QUICK_ACTIONS, ...customActions];

    // Filter by categories if specified
    if (categories && categories.length > 0) {
      return combined.filter((action) => categories.includes(action.category));
    }

    return combined;
  }, [customActions, categories]);

  // Limit actions if maxActions is specified
  const visibleActions = useMemo(() => {
    if (maxActions && maxActions > 0) {
      return allActions.slice(0, maxActions);
    }
    return allActions;
  }, [allActions, maxActions]);

  // Group actions by category
  const groupedActions = useMemo(() => {
    if (!showCategories) return null;

    const groups: Record<string, QuickActionDefinition[]> = {};
    for (const action of visibleActions) {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }
      groups[action.category].push(action);
    }
    return groups;
  }, [visibleActions, showCategories]);

  // Build context-enriched prompt
  const buildPrompt = useCallback(
    (basePrompt: string): string => {
      let enrichedPrompt = basePrompt;

      if (context?.topicName) {
        enrichedPrompt = `[Topic: ${context.topicName}] ${enrichedPrompt}`;
      }

      if (context?.conceptId) {
        enrichedPrompt = `[Concept ID: ${context.conceptId}] ${enrichedPrompt}`;
      }

      return enrichedPrompt;
    },
    [context]
  );

  // Handle action execution
  const handleActionClick = useCallback(
    async (action: QuickActionDefinition) => {
      if (executingActions.has(action.id) || isProcessing) return;

      setExecutingActions((prev) => new Set(prev).add(action.id));
      setActionResults((prev) => ({ ...prev, [action.id]: null }));

      try {
        // Open SAM if not already open
        if (!isSAMOpen) {
          openSAM();
        }

        // If action has a predefined SAM action, execute it
        if (action.action) {
          await executeAction(action.action);
        }
        // Otherwise, send the prompt as a message
        else if (action.prompt) {
          const enrichedPrompt = buildPrompt(action.prompt);
          await sendMessage(enrichedPrompt);
        }
        // For "Ask SAM" action, just open SAM without a preset message
        else if (action.id === "ask_question") {
          // SAM is already opened, user can type their question
        }

        setActionResults((prev) => ({ ...prev, [action.id]: true }));
        onActionComplete?.(action.id, { success: true });

        // Reset success state after 2 seconds
        setTimeout(() => {
          setActionResults((prev) => ({ ...prev, [action.id]: null }));
        }, 2000);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[SAMQuickActions] Action ${action.id} failed:`, err);
        setActionResults((prev) => ({ ...prev, [action.id]: false }));
        onActionError?.(action.id, err);

        // Reset error state after 3 seconds
        setTimeout(() => {
          setActionResults((prev) => ({ ...prev, [action.id]: null }));
        }, 3000);
      } finally {
        setExecutingActions((prev) => {
          const next = new Set(prev);
          next.delete(action.id);
          return next;
        });
      }
    },
    [
      executingActions,
      isProcessing,
      isSAMOpen,
      openSAM,
      executeAction,
      sendMessage,
      buildPrompt,
      onActionComplete,
      onActionError,
    ]
  );

  // Floating variant position classes
  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  // ============================================================================
  // RENDER: Floating Variant
  // ============================================================================

  if (variant === "floating") {
    return (
      <div className={cn("fixed z-50", positionClasses[position], className)}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute bottom-16 right-0 mb-2 w-72 rounded-xl border bg-card p-4 shadow-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">SAM Quick Actions</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto">
                {showCategories && groupedActions
                  ? Object.entries(groupedActions).map(([category, actions]) => (
                      <div key={category} className="mb-3">
                        <Badge variant="outline" className="mb-2 capitalize">
                          {category}
                        </Badge>
                        <div className="space-y-1">
                          {actions.map((action) => (
                            <ActionButton
                              key={action.id}
                              action={action}
                              isExecuting={executingActions.has(action.id)}
                              isSuccess={actionResults[action.id] ?? null}
                              onClick={() => handleActionClick(action)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  : visibleActions.map((action) => (
                      <ActionButton
                        key={action.id}
                        action={action}
                        isExecuting={executingActions.has(action.id)}
                        isSuccess={actionResults[action.id] ?? null}
                        onClick={() => handleActionClick(action)}
                      />
                    ))}
              </div>

              {samActions.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    From SAM Context
                  </p>
                  <div className="space-y-1">
                    {samActions.slice(0, 3).map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() =>
                          handleActionClick({
                            id: action.id,
                            label: action.label,
                            description: action.label,
                            icon: Zap,
                            category: "help",
                            color: "from-blue-500 to-indigo-500",
                            action,
                          })
                        }
                        disabled={isExecuting}
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
            "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
            "hover:from-purple-700 hover:to-indigo-700",
            "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <Sparkles className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    );
  }

  // ============================================================================
  // RENDER: Compact Variant
  // ============================================================================

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {visibleActions.slice(0, 5).map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            isExecuting={executingActions.has(action.id)}
            isSuccess={actionResults[action.id] ?? null}
            compact
            onClick={() => handleActionClick(action)}
          />
        ))}
        {visibleActions.length > 5 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More actions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: Inline Variant (Default)
  // ============================================================================

  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">SAM Quick Actions</h3>
          <p className="text-xs text-muted-foreground">
            Get instant help with your learning
          </p>
        </div>
      </div>

      {showCategories && groupedActions ? (
        <div className="space-y-4">
          {Object.entries(groupedActions).map(([category, actions]) => (
            <div key={category}>
              <Badge variant="secondary" className="mb-2 capitalize">
                {category}
              </Badge>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {actions.map((action) => {
                  const Icon = action.icon;
                  const isActionExecuting = executingActions.has(action.id);
                  const actionResult = actionResults[action.id];

                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-auto flex-col gap-1 py-3 transition-all",
                        "hover:border-primary hover:bg-primary/5",
                        isActionExecuting && "opacity-70"
                      )}
                      onClick={() => handleActionClick(action)}
                      disabled={isActionExecuting}
                    >
                      {isActionExecuting ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : actionResult === true ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : actionResult === false ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Icon className="h-5 w-5 text-primary" />
                      )}
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            const isActionExecuting = executingActions.has(action.id);
            const actionResult = actionResults[action.id];

            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto flex-col gap-1 py-3 transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  isActionExecuting && "opacity-70"
                )}
                onClick={() => handleActionClick(action)}
                disabled={isActionExecuting}
              >
                {isActionExecuting ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : actionResult === true ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : actionResult === false ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Icon className="h-5 w-5 text-primary" />
                )}
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Show SAM context actions if available */}
      {samActions.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-sm font-medium">Suggested by SAM</p>
          <div className="flex flex-wrap gap-2">
            {samActions.map((action) => (
              <Button
                key={action.id}
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleActionClick({
                    id: action.id,
                    label: action.label,
                    description: action.label,
                    icon: Zap,
                    category: "help",
                    color: "from-blue-500 to-indigo-500",
                    action,
                  })
                }
                disabled={isExecuting || executingActions.has(action.id)}
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { SAMQuickActionsProps, QuickActionDefinition };
export { DEFAULT_QUICK_ACTIONS };
