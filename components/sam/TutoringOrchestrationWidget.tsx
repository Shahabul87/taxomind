"use client";

/**
 * TutoringOrchestrationWidget
 *
 * Dashboard widget displaying the current tutoring plan progress and step orchestration.
 * Uses the useTutoringOrchestration hook from @sam-ai/react package.
 *
 * Shows the active learning plan, current step, progress, and celebrations.
 */

import { useEffect, useCallback } from "react";
import {
  useTutoringOrchestration,
  TutoringOrchestrationProvider,
} from "@sam-ai/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Trophy,
  AlertCircle,
  Loader2,
  Target,
  Clock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TutoringOrchestrationWidgetProps {
  compact?: boolean;
  className?: string;
  onStepClick?: (stepId: string) => void;
}

function TutoringOrchestrationContent({
  compact = false,
  className = "",
  onStepClick,
}: TutoringOrchestrationWidgetProps) {
  const {
    state,
    hasStepTransition,
    isPlanComplete,
    hasPendingConfirmations,
    currentStepProgress,
    shouldShowCelebration,
    clearState,
  } = useTutoringOrchestration();

  const {
    hasActivePlan,
    currentStep,
    stepProgress,
    transition,
    pendingConfirmations,
    metadata,
  } = state;

  // Handle celebration dismiss
  const handleDismissCelebration = useCallback(() => {
    clearState();
  }, [clearState]);

  // Auto-dismiss celebration after 5 seconds
  useEffect(() => {
    if (shouldShowCelebration) {
      const timer = setTimeout(() => {
        handleDismissCelebration();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowCelebration, handleDismissCelebration]);

  if (compact) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-blue-500" />
            Learning Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActivePlan && currentStep ? (
            <div className="space-y-2">
              <p className="text-sm font-medium line-clamp-1">
                {currentStep.title}
              </p>
              <div className="flex items-center gap-2">
                <Progress value={currentStepProgress} className="flex-1 h-1.5" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(currentStepProgress)}%
                </span>
              </div>
              {stepProgress?.pendingCriteria && stepProgress.pendingCriteria.length > 0 && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Next: {stepProgress.pendingCriteria[0]}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                No active learning plan
              </p>
              <Button size="sm" variant="outline" className="mt-2">
                <Target className="mr-2 h-3 w-3" />
                Start a Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-500" />
          Tutoring Progress
          {hasActivePlan && (
            <Badge variant="outline" className="ml-auto">
              <Clock className="mr-1 h-3 w-3" />
              Active
            </Badge>
          )}
          {isPlanComplete && (
            <Badge className="ml-auto bg-green-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Complete
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Celebration Modal */}
        {shouldShowCelebration && transition?.celebration && (
          <div className="rounded-lg border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 dark:from-yellow-900/20 dark:to-orange-900/20">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/30">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">
                  {transition.celebration.title}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  {transition.celebration.message}
                </p>
                {transition.celebration.xpEarned && (
                  <Badge className="mt-1 bg-yellow-500">
                    <Star className="mr-1 h-3 w-3" />
                    +{transition.celebration.xpEarned} XP
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissCelebration}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Pending Confirmations */}
        {hasPendingConfirmations && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800 dark:text-amber-400">
                Pending Confirmations
              </span>
            </div>
            <ul className="space-y-1">
              {pendingConfirmations.map((conf) => (
                <li key={conf.id} className="flex items-center gap-2 text-sm">
                  <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                  <span>{conf.toolName}</span>
                  <Badge variant="outline" className="text-xs">
                    {conf.riskLevel}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No Active Plan State */}
        {!hasActivePlan && !isPlanComplete && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-900/30">
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="mt-4 font-medium">No Active Learning Plan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a tutoring session with SAM AI to create a personalized learning plan.
            </p>
            <Button className="mt-4">
              <Target className="mr-2 h-4 w-4" />
              Create Learning Plan
            </Button>
          </div>
        )}

        {/* Active Plan Display */}
        {hasActivePlan && currentStep && (
          <div className="space-y-4">
            {/* Current Step */}
            <div
              className={cn(
                "rounded-lg border p-4 transition-all",
                hasStepTransition
                  ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                  : "bg-slate-50 dark:bg-slate-900"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "rounded-full p-2",
                    hasStepTransition
                      ? "bg-blue-100 dark:bg-blue-900/50"
                      : "bg-slate-100 dark:bg-slate-800"
                  )}
                >
                  {hasStepTransition ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{currentStep.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {currentStep.type}
                    </Badge>
                  </div>

                  {/* Objectives */}
                  {currentStep.objectives.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Objectives:
                      </p>
                      <ul className="space-y-1">
                        {currentStep.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-3 w-3 text-green-500" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {onStepClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStepClick(currentStep.id)}
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>

            {/* Step Progress */}
            {stepProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Step Progress</span>
                  <span className="font-medium">{Math.round(currentStepProgress)}%</span>
                </div>
                <Progress value={currentStepProgress} className="h-2" />

                {/* Confidence */}
                {stepProgress.confidence > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Confidence: {Math.round(stepProgress.confidence * 100)}%</span>
                  </div>
                )}

                {/* Pending Criteria */}
                {stepProgress.pendingCriteria.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      To Complete:
                    </p>
                    <ul className="space-y-1">
                      {stepProgress.pendingCriteria.map((criteria, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Circle className="h-2 w-2 text-slate-400" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {stepProgress.recommendations && stepProgress.recommendations.length > 0 && (
                  <div className="mt-3 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs font-medium mb-1">SAM Recommendations:</p>
                    <ul className="space-y-1">
                      {stepProgress.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <Sparkles className="mt-0.5 h-3 w-3 text-blue-500" />
                          <span>
                            <span className="font-medium">{rec.type}:</span> {rec.reason}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Transition Message */}
            {transition && !isPlanComplete && (
              <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <ArrowRight className="h-4 w-4" />
                {transition.message}
              </div>
            )}

            {/* Metadata */}
            {metadata && (
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                <span>Processing time: {metadata.processingTime}ms</span>
                {metadata.interventionsTriggered > 0 && (
                  <span>{metadata.interventionsTriggered} interventions triggered</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Plan Complete State */}
        {isPlanComplete && !hasActivePlan && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mt-4 font-medium">Plan Completed!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Congratulations on completing your learning plan.
            </p>
            <Button className="mt-4" onClick={clearState}>
              <Target className="mr-2 h-4 w-4" />
              Start New Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export wrapped component with provider
export function TutoringOrchestrationWidget(props: TutoringOrchestrationWidgetProps) {
  return (
    <TutoringOrchestrationProvider>
      <TutoringOrchestrationContent {...props} />
    </TutoringOrchestrationProvider>
  );
}

export default TutoringOrchestrationWidget;
