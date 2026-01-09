"use client";

/**
 * CheckInPanel Component
 * Displays pending check-ins from SAM AI proactive intervention system.
 * Allows users to respond to check-ins and tracks responses for feedback loop.
 */

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Target,
  Trophy,
  Flame,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { SAM_FEATURES } from "@/lib/sam/feature-flags";

// Types for check-ins and interventions
interface CheckIn {
  id: string;
  type: string;
  scheduledTime: Date;
  message: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed" | "dismissed";
  createdAt: Date;
  respondedAt?: Date;
  response?: "helpful" | "not_helpful" | "dismissed";
}

interface Intervention {
  id: string;
  type: string;
  priority: "low" | "medium" | "high";
  message: string;
  suggestedActions: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  createdAt: Date;
  status: "pending" | "executed" | "dismissed";
}

interface CheckInPanelProps {
  className?: string;
  maxItems?: number;
  showHistory?: boolean;
  onRefresh?: () => void;
}

// Map check-in types to icons
const checkInIcons: Record<string, React.ElementType> = {
  streak_reminder: Flame,
  progress_check: Target,
  struggle_detection: AlertTriangle,
  milestone_celebration: Trophy,
  inactivity_reengagement: Bell,
  break_suggestion: Clock,
  encouragement: Sparkles,
  content_recommendation: MessageSquare,
  default: Bell,
};

// Map priority to colors
const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Map check-in type to gradient colors
const typeGradients: Record<string, string> = {
  streak_reminder: "from-orange-500 to-red-500",
  progress_check: "from-blue-500 to-indigo-500",
  struggle_detection: "from-yellow-500 to-orange-500",
  milestone_celebration: "from-green-500 to-emerald-500",
  inactivity_reengagement: "from-purple-500 to-pink-500",
  break_suggestion: "from-cyan-500 to-blue-500",
  encouragement: "from-pink-500 to-rose-500",
  content_recommendation: "from-indigo-500 to-purple-500",
  default: "from-gray-500 to-slate-500",
};

export function CheckInPanel({
  className,
  maxItems = 5,
  showHistory = true,
  onRefresh,
}: CheckInPanelProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch check-ins and interventions
  const fetchData = useCallback(async () => {
    if (!SAM_FEATURES.INTERVENTIONS_ENABLED) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch pending interventions from behavior/interventions endpoint
      const interventionsRes = await fetch("/api/sam/agentic/behavior/interventions?pending=true");
      if (interventionsRes.ok) {
        const interventionsData = await interventionsRes.json();
        if (interventionsData.success && interventionsData.data?.interventions) {
          setInterventions(
            interventionsData.data.interventions.map((i: Record<string, unknown>) => ({
              ...i,
              createdAt: new Date(i.createdAt as string),
            }))
          );
        }
      }

      // Fetch pending check-ins
      const checkInsRes = await fetch("/api/sam/agentic/checkins?status=pending");
      if (checkInsRes.ok) {
        const checkInsData = await checkInsRes.json();
        if (checkInsData.success && checkInsData.data?.checkIns) {
          setCheckIns(
            checkInsData.data.checkIns.map((c: Record<string, unknown>) => ({
              ...c,
              scheduledTime: new Date(c.scheduledTime as string),
              createdAt: new Date(c.createdAt as string),
              respondedAt: c.respondedAt ? new Date(c.respondedAt as string) : undefined,
            }))
          );
        }
      }
    } catch (err) {
      console.error("[CheckInPanel] Failed to fetch data:", err);
      setError("Failed to load check-ins");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle check-in response
  // Uses POST /api/sam/agentic/checkins/[checkInId] with response body
  const handleCheckInResponse = useCallback(
    async (checkInId: string, response: "helpful" | "not_helpful" | "dismissed") => {
      try {
        // Map UI response to API schema
        const responseBody = {
          answers: [],
          selectedActions: [],
          feedback: response === "helpful" ? "User found this helpful" :
                   response === "not_helpful" ? "User did not find this helpful" :
                   "User dismissed this check-in",
          emotionalState: response === "helpful" ? "positive" :
                         response === "not_helpful" ? "neutral" : undefined,
        };

        const res = await fetch(`/api/sam/agentic/checkins/${checkInId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(responseBody),
        });

        if (res.ok) {
          setCheckIns((prev) =>
            prev.map((c) =>
              c.id === checkInId
                ? { ...c, status: "completed", response, respondedAt: new Date() }
                : c
            )
          );
        }
      } catch (err) {
        console.error("[CheckInPanel] Failed to respond to check-in:", err);
      }
    },
    []
  );

  // Handle intervention action (execute)
  // Uses PATCH /api/sam/agentic/behavior/interventions?id={id}&action=execute
  const handleInterventionAction = useCallback(
    async (interventionId: string, _actionId: string) => {
      try {
        // First execute the intervention
        const executeRes = await fetch(
          `/api/sam/agentic/behavior/interventions?id=${interventionId}&action=execute`,
          { method: "PATCH" }
        );

        if (executeRes.ok) {
          // Then record the result as successful with accepted response
          await fetch(
            `/api/sam/agentic/behavior/interventions?id=${interventionId}&action=result`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                success: true,
                userResponse: "accepted",
              }),
            }
          );

          setInterventions((prev) =>
            prev.map((i) =>
              i.id === interventionId ? { ...i, status: "executed" } : i
            )
          );
        }
      } catch (err) {
        console.error("[CheckInPanel] Failed to execute intervention:", err);
      }
    },
    []
  );

  // Dismiss intervention
  // Uses PATCH /api/sam/agentic/behavior/interventions?id={id}&action=result
  const handleDismissIntervention = useCallback(async (interventionId: string) => {
    try {
      const res = await fetch(
        `/api/sam/agentic/behavior/interventions?id=${interventionId}&action=result`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            success: false,
            userResponse: "dismissed",
          }),
        }
      );

      if (res.ok) {
        setInterventions((prev) =>
          prev.map((i) =>
            i.id === interventionId ? { ...i, status: "dismissed" } : i
          )
        );
      }
    } catch (err) {
      console.error("[CheckInPanel] Failed to dismiss intervention:", err);
    }
  }, []);

  // If feature is disabled, show nothing
  if (!SAM_FEATURES.INTERVENTIONS_ENABLED) {
    return null;
  }

  // Filter pending items
  const pendingCheckIns = checkIns.filter((c) => c.status === "pending").slice(0, maxItems);
  const pendingInterventions = interventions.filter((i) => i.status === "pending").slice(0, maxItems);
  const historyItems = [...checkIns, ...interventions]
    .filter((item) => "status" in item && item.status !== "pending")
    .slice(0, 10);

  const hasItems = pendingCheckIns.length > 0 || pendingInterventions.length > 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">SAM Check-Ins</CardTitle>
                <CardDescription>
                  {hasItems
                    ? `${pendingCheckIns.length + pendingInterventions.length} pending items`
                    : "All caught up!"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  fetchData();
                  onRefresh?.();
                }}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="mb-2 h-8 w-8 text-yellow-500" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
                  Try Again
                </Button>
              </div>
            ) : !hasItems ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-muted-foreground">
                  No pending check-ins or interventions
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {/* Pending Interventions */}
                {pendingInterventions.map((intervention) => {
                  const Icon = checkInIcons[intervention.type] || checkInIcons.default;
                  const gradient = typeGradients[intervention.type] || typeGradients.default;

                  return (
                    <motion.div
                      key={`intervention-${intervention.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="relative overflow-hidden rounded-lg border bg-card p-4"
                    >
                      {/* Gradient accent */}
                      <div
                        className={cn(
                          "absolute left-0 top-0 h-full w-1 bg-gradient-to-b",
                          gradient
                        )}
                      />

                      <div className="ml-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "rounded-full p-1.5 bg-gradient-to-br text-white",
                                gradient
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium capitalize">
                                {intervention.type.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(intervention.createdAt, { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className={cn("text-xs", priorityColors[intervention.priority])}
                            >
                              {intervention.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDismissIntervention(intervention.id)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm">{intervention.message}</p>

                        {intervention.suggestedActions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {intervention.suggestedActions.map((action) => (
                              <Button
                                key={action.id}
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  handleInterventionAction(intervention.id, action.id)
                                }
                              >
                                {action.title}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Pending Check-Ins */}
                {pendingCheckIns.map((checkIn) => {
                  const Icon = checkInIcons[checkIn.type] || checkInIcons.default;
                  const gradient = typeGradients[checkIn.type] || typeGradients.default;

                  return (
                    <motion.div
                      key={`checkin-${checkIn.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="relative overflow-hidden rounded-lg border bg-card p-4"
                    >
                      {/* Gradient accent */}
                      <div
                        className={cn(
                          "absolute left-0 top-0 h-full w-1 bg-gradient-to-b",
                          gradient
                        )}
                      />

                      <div className="ml-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "rounded-full p-1.5 bg-gradient-to-br text-white",
                                gradient
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium capitalize">
                                {checkIn.type.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Scheduled{" "}
                                {format(checkIn.scheduledTime, "MMM d 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", priorityColors[checkIn.priority])}
                          >
                            {checkIn.priority}
                          </Badge>
                        </div>

                        <p className="text-sm">{checkIn.message}</p>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => handleCheckInResponse(checkIn.id, "helpful")}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            Helpful
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => handleCheckInResponse(checkIn.id, "not_helpful")}
                          >
                            <ThumbsDown className="h-3 w-3" />
                            Not helpful
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => handleCheckInResponse(checkIn.id, "dismissed")}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {/* History Section */}
            {showHistory && historyItems.length > 0 && (
              <Collapsible open={showHistorySection} onOpenChange={setShowHistorySection}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-xs text-muted-foreground">
                      Recent history ({historyItems.length})
                    </span>
                    {showHistorySection ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {historyItems.map((item) => (
                    <div
                      key={`history-${item.id}`}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="flex-1 capitalize text-muted-foreground">
                        {"type" in item ? item.type.replace(/_/g, " ") : "Check-in"}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default CheckInPanel;
