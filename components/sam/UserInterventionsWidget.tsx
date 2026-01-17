"use client";

/**
 * UserInterventionsWidget
 *
 * Dashboard widget for managing proactive SAM AI interventions.
 * Uses the useInterventions hook from @sam-ai/react package.
 *
 * Displays nudges, celebrations, recommendations, and other proactive interventions.
 */

import { useCallback, useEffect, useState } from "react";
import { useInterventions } from "@sam-ai/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Trophy,
  Sparkles,
  Target,
  X,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Clock,
  ChevronRight,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterventionUIState, SAMWebSocketEvent } from "@sam-ai/agentic";

interface UserInterventionsWidgetProps {
  compact?: boolean;
  maxVisible?: number;
  enableSound?: boolean;
  className?: string;
}

const INTERVENTION_ICONS = {
  nudge: Bell,
  celebration: Trophy,
  recommendation: Sparkles,
  goal_progress: Target,
  step_completed: CheckCircle2,
  checkin: AlertCircle,
  intervention: Lightbulb,
};

const INTERVENTION_COLORS = {
  nudge: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20",
  celebration: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20",
  recommendation: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
  goal_progress: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
  step_completed: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20",
  checkin: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20",
  intervention: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20",
};

const INTERVENTION_ICON_COLORS = {
  nudge: "text-yellow-500",
  celebration: "text-purple-500",
  recommendation: "text-blue-500",
  goal_progress: "text-green-500",
  step_completed: "text-emerald-500",
  checkin: "text-orange-500",
  intervention: "text-indigo-500",
};

// Demo interventions for testing when no real-time connection
// Using type assertions since demo data is for display purposes only
const DEMO_INTERVENTIONS = [
  {
    type: "nudge",
    eventId: "demo-nudge-1",
    timestamp: new Date(),
    payload: {
      title: "Time for a Break",
      message: "You have been studying for 45 minutes. Consider taking a short break.",
      priority: "medium",
    },
  },
  {
    type: "recommendation",
    eventId: "demo-rec-1",
    timestamp: new Date(),
    payload: {
      title: "Recommended: Practice Problems",
      message: "Based on your recent learning, try these practice problems to reinforce concepts.",
      action: { label: "View Practice", url: "/practice" },
    },
  },
  {
    type: "goal_progress",
    eventId: "demo-goal-1",
    timestamp: new Date(),
    payload: {
      title: "Goal Progress Update",
      message: "You are 75% of the way to completing your weekly learning goal!",
      progress: 75,
    },
  },
] as unknown as SAMWebSocketEvent[];

export function UserInterventionsWidget({
  compact = false,
  maxVisible = 3,
  enableSound = false,
  className = "",
}: UserInterventionsWidgetProps) {
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [showDemo, setShowDemo] = useState(false);

  const {
    queue,
    visible,
    pending,
    add,
    dismiss,
    dismissAll,
    markViewed,
    triggerAction,
    latestNudge,
    latestCelebration,
    latestRecommendation,
    latestGoalProgress,
  } = useInterventions({
    maxVisible,
    autoDismissMs: 10000,
    enableSound: soundEnabled,
    onIntervention: (intervention) => {
      console.log("New intervention:", intervention.event.type);
    },
    onDismiss: (id, reason) => {
      console.log("Intervention dismissed:", id, reason);
    },
    onAction: (id, action) => {
      console.log("Intervention action:", id, action);
    },
  });

  // Add demo interventions for testing
  const handleShowDemo = useCallback(() => {
    DEMO_INTERVENTIONS.forEach((event, index) => {
      setTimeout(() => {
        add(event);
      }, index * 500);
    });
    setShowDemo(true);
  }, [add]);

  // Mark interventions as viewed when they appear
  useEffect(() => {
    visible.forEach((intervention) => {
      if (!intervention.interactedAt) {
        markViewed(intervention.id);
      }
    });
  }, [visible, markViewed]);

  const handleDismiss = useCallback(
    (id: string) => {
      dismiss(id, "user_action");
    },
    [dismiss]
  );

  const handleAction = useCallback(
    (intervention: InterventionUIState, action: string) => {
      triggerAction(intervention.id, action);
      // Handle the action (e.g., navigation)
      const payload = intervention.event.payload as { action?: { type: string; target: string } };
      if (payload?.action?.type === "navigate") {
        window.location.href = payload.action.target;
      }
    },
    [triggerAction]
  );

  const getInterventionContent = (intervention: InterventionUIState) => {
    const payload = intervention.event.payload as {
      title?: string;
      message?: string;
      progress?: number;
      xpEarned?: number;
    };
    return {
      title: payload?.title || intervention.event.type,
      message: payload?.message || "",
      progress: payload?.progress,
      xpEarned: payload?.xpEarned,
    };
  };

  if (compact) {
    const totalCount = visible.length + pending.length;
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-amber-500" />
            Interventions
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visible.length > 0 ? (
            <div className="space-y-2">
              {visible.slice(0, 2).map((intervention) => {
                const content = getInterventionContent(intervention);
                const Icon =
                  INTERVENTION_ICONS[
                    intervention.event.type as keyof typeof INTERVENTION_ICONS
                  ] || Bell;
                return (
                  <div
                    key={intervention.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Icon className="h-3 w-3 text-amber-500" />
                    <span className="truncate">{content.title}</span>
                  </div>
                );
              })}
              {visible.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{visible.length - 2} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active interventions
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          Proactive Interventions
          <div className="ml-auto flex items-center gap-2">
            {queue.items.length > 0 && (
              <Badge variant="outline">
                {visible.length}/{queue.items.length}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Latest Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg border bg-yellow-50 p-2 dark:bg-yellow-900/20">
            <Bell className="mx-auto h-4 w-4 text-yellow-500" />
            <p className="mt-1 text-xs text-muted-foreground">Nudges</p>
            <p className="font-semibold">{latestNudge ? 1 : 0}</p>
          </div>
          <div className="rounded-lg border bg-purple-50 p-2 dark:bg-purple-900/20">
            <Trophy className="mx-auto h-4 w-4 text-purple-500" />
            <p className="mt-1 text-xs text-muted-foreground">Celebrations</p>
            <p className="font-semibold">{latestCelebration ? 1 : 0}</p>
          </div>
          <div className="rounded-lg border bg-blue-50 p-2 dark:bg-blue-900/20">
            <Sparkles className="mx-auto h-4 w-4 text-blue-500" />
            <p className="mt-1 text-xs text-muted-foreground">Recs</p>
            <p className="font-semibold">{latestRecommendation ? 1 : 0}</p>
          </div>
          <div className="rounded-lg border bg-green-50 p-2 dark:bg-green-900/20">
            <TrendingUp className="mx-auto h-4 w-4 text-green-500" />
            <p className="mt-1 text-xs text-muted-foreground">Goals</p>
            <p className="font-semibold">{latestGoalProgress ? 1 : 0}</p>
          </div>
        </div>

        {/* Active Interventions */}
        {visible.length > 0 ? (
          <ScrollArea className="h-[250px]">
            <div className="space-y-3 pr-2">
              {visible.map((intervention) => {
                const content = getInterventionContent(intervention);
                const eventType = intervention.event.type as keyof typeof INTERVENTION_ICONS;
                const Icon = INTERVENTION_ICONS[eventType] || Bell;
                const colorClass = INTERVENTION_COLORS[eventType] || INTERVENTION_COLORS.nudge;
                const iconColor = INTERVENTION_ICON_COLORS[eventType] || INTERVENTION_ICON_COLORS.nudge;

                return (
                  <div
                    key={intervention.id}
                    className={cn(
                      "rounded-lg border p-3 transition-all animate-in fade-in slide-in-from-top-2",
                      colorClass
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-white p-1.5 shadow-sm dark:bg-slate-800">
                        <Icon className={cn("h-4 w-4", iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">
                            {content.title}
                          </h4>
                          {intervention.displayConfig.priority > 5 && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        {content.message && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {content.message}
                          </p>
                        )}

                        {/* Progress Bar for Goal Progress */}
                        {content.progress !== undefined && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full dark:bg-slate-700">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${content.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {content.progress}%
                            </span>
                          </div>
                        )}

                        {/* XP Earned for Celebrations */}
                        {content.xpEarned && (
                          <Badge className="mt-2 bg-purple-500">
                            +{content.xpEarned} XP
                          </Badge>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-2 flex items-center gap-2">
                          {intervention.displayConfig.dismissible && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleDismiss(intervention.id)}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Dismiss
                            </Button>
                          )}
                          {!!(intervention.event.payload as { action?: unknown })?.action && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleAction(intervention, "primary")}
                            >
                              Take Action
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {intervention.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
              <Bell className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="mt-4 font-medium">No Active Interventions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              SAM AI will notify you with helpful nudges, celebrations, and recommendations.
            </p>
            {!showDemo && (
              <Button variant="outline" className="mt-4" onClick={handleShowDemo}>
                <Settings className="mr-2 h-4 w-4" />
                Show Demo Interventions
              </Button>
            )}
          </div>
        )}

        {/* Pending Count */}
        {pending.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <span>{pending.length} interventions queued</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={dismissAll}
            >
              Dismiss All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UserInterventionsWidget;
