"use client";

/**
 * Cognitive Load Indicator Component
 *
 * Phase 3: Cognitive Load Integration
 * Visualizes intrinsic, extraneous, and germane cognitive load distribution
 */

import { cn } from "@/lib/utils";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  X,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ============================================================================
// TYPES
// ============================================================================

export type LoadCategory = "low" | "moderate" | "high" | "overload";
export type BalanceStatus = "optimal" | "suboptimal" | "problematic";

export interface CognitiveLoadData {
  totalLoad: number;
  loadCategory: LoadCategory;
  intrinsicLoad: number;
  extraneousLoad: number;
  germaneLoad: number;
  balance: {
    status: BalanceStatus;
    extraneousMinimized: boolean;
    germaneMaximized: boolean;
    intrinsicAppropriate: boolean;
  };
  recommendations?: Array<{
    type: string;
    priority: "low" | "medium" | "high";
    description: string;
  }>;
}

export interface CognitiveLoadIndicatorProps {
  /** Cognitive load data to display */
  data: CognitiveLoadData;
  /** Show detailed breakdown */
  showBreakdown?: boolean;
  /** Show recommendations */
  showRecommendations?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LOAD_CATEGORY_CONFIG: Record<
  LoadCategory,
  { label: string; color: string; bgColor: string; icon: typeof Brain }
> = {
  low: {
    label: "Low Load",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle,
  },
  moderate: {
    label: "Moderate Load",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: Brain,
  },
  high: {
    label: "High Load",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: AlertTriangle,
  },
  overload: {
    label: "Overload!",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: AlertTriangle,
  },
};

const BALANCE_STATUS_CONFIG: Record<
  BalanceStatus,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  optimal: {
    label: "Optimal Balance",
    color: "text-green-600 dark:text-green-400",
    icon: CheckCircle,
  },
  suboptimal: {
    label: "Suboptimal Balance",
    color: "text-yellow-600 dark:text-yellow-400",
    icon: AlertTriangle,
  },
  problematic: {
    label: "Problematic Balance",
    color: "text-red-600 dark:text-red-400",
    icon: X,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CognitiveLoadIndicator({
  data,
  showBreakdown = true,
  showRecommendations = false,
  size = "md",
  className,
}: CognitiveLoadIndicatorProps) {
  const loadConfig = LOAD_CATEGORY_CONFIG[data.loadCategory];
  const balanceConfig = BALANCE_STATUS_CONFIG[data.balance.status];
  const LoadIcon = loadConfig.icon;
  const BalanceIcon = balanceConfig.icon;

  const sizeClasses = {
    sm: "text-xs p-2",
    md: "text-sm p-3",
    lg: "text-base p-4",
  };

  const progressHeight = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "rounded-lg border bg-card",
          loadConfig.bgColor,
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LoadIcon className={cn("h-5 w-5", loadConfig.color)} />
            <span className={cn("font-semibold", loadConfig.color)}>
              {loadConfig.label}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs", balanceConfig.color)}
          >
            <BalanceIcon className="h-3 w-3 mr-1" />
            {balanceConfig.label}
          </Badge>
        </div>

        {/* Total Load Progress */}
        <div className="mb-4">
          <div className="flex justify-between mb-1 text-xs text-muted-foreground">
            <span>Total Cognitive Load</span>
            <span className="font-medium">{Math.round(data.totalLoad)}%</span>
          </div>
          <Progress
            value={data.totalLoad}
            className={progressHeight[size]}
          />
        </div>

        {/* Breakdown Section */}
        {showBreakdown && (
          <div className="space-y-2">
            {/* Intrinsic Load */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 min-w-[100px]">
                    <Brain className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs text-muted-foreground">
                      Intrinsic
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px] text-xs">
                    Inherent complexity of the material itself
                  </p>
                </TooltipContent>
              </Tooltip>
              <div className="flex-1">
                <Progress
                  value={data.intrinsicLoad}
                  className={cn(progressHeight[size], "[&>div]:bg-purple-500")}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">
                {Math.round(data.intrinsicLoad)}%
              </span>
            </div>

            {/* Extraneous Load */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 min-w-[100px]">
                    <Zap className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs text-muted-foreground">
                      Extraneous
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px] text-xs">
                    Unnecessary processing burden (should be minimized)
                  </p>
                </TooltipContent>
              </Tooltip>
              <div className="flex-1">
                <Progress
                  value={data.extraneousLoad}
                  className={cn(progressHeight[size], "[&>div]:bg-red-500")}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">
                {Math.round(data.extraneousLoad)}%
              </span>
              {!data.balance.extraneousMinimized && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>

            {/* Germane Load */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 min-w-[100px]">
                    <Lightbulb className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-muted-foreground">
                      Germane
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px] text-xs">
                    Learning-productive processing (schema building)
                  </p>
                </TooltipContent>
              </Tooltip>
              <div className="flex-1">
                <Progress
                  value={data.germaneLoad}
                  className={cn(progressHeight[size], "[&>div]:bg-green-500")}
                />
              </div>
              <span className="text-xs font-medium w-10 text-right">
                {Math.round(data.germaneLoad)}%
              </span>
              {data.balance.germaneMaximized && (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              )}
            </div>
          </div>
        )}

        {/* Balance Indicators */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  data.balance.intrinsicAppropriate
                    ? "border-green-500 text-green-600"
                    : "border-amber-500 text-amber-600"
                )}
              >
                {data.balance.intrinsicAppropriate ? (
                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                ) : (
                  <Info className="h-2.5 w-2.5 mr-1" />
                )}
                Intrinsic
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {data.balance.intrinsicAppropriate
                  ? "Complexity level is appropriate"
                  : "Complexity may need adjustment"}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  data.balance.extraneousMinimized
                    ? "border-green-500 text-green-600"
                    : "border-red-500 text-red-600"
                )}
              >
                {data.balance.extraneousMinimized ? (
                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                ) : (
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                )}
                Extraneous
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {data.balance.extraneousMinimized
                  ? "Unnecessary load is minimized"
                  : "Unnecessary load should be reduced"}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  data.balance.germaneMaximized
                    ? "border-green-500 text-green-600"
                    : "border-amber-500 text-amber-600"
                )}
              >
                {data.balance.germaneMaximized ? (
                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                ) : (
                  <Info className="h-2.5 w-2.5 mr-1" />
                )}
                Germane
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {data.balance.germaneMaximized
                  ? "Learning-productive processing is maximized"
                  : "Can improve schema-building activities"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Recommendations */}
        {showRecommendations &&
          data.recommendations &&
          data.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Recommendations:
              </p>
              <ul className="space-y-1">
                {data.recommendations.slice(0, 3).map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <span
                      className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                        rec.priority === "high"
                          ? "bg-red-500"
                          : rec.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      )}
                    />
                    <span>{rec.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </TooltipProvider>
  );
}

export default CognitiveLoadIndicator;
