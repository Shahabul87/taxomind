"use client";

/**
 * LearningRecommendationsWidget
 *
 * Dashboard widget for displaying personalized learning recommendations.
 * Uses the useRecommendations hook from @sam-ai/react package.
 *
 * Shows content, practice, review, assessment, break, and goal recommendations.
 */

import { useState, useCallback } from "react";
import { useRecommendations } from "@sam-ai/react";
import type { LearningRecommendation, RecommendationType } from "@sam-ai/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Brain,
  RotateCcw,
  Target,
  Coffee,
  Lightbulb,
  Sparkles,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  Filter,
  Zap,
  TrendingUp,
  AlertCircle,
  Settings,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface LearningRecommendationsWidgetProps {
  compact?: boolean;
  maxRecommendations?: number;
  defaultAvailableTime?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

const RECOMMENDATION_ICONS: Record<RecommendationType, React.ElementType> = {
  content: BookOpen,
  practice: Brain,
  review: RotateCcw,
  assessment: Target,
  break: Coffee,
  goal: Lightbulb,
};

const RECOMMENDATION_COLORS: Record<RecommendationType, string> = {
  content: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
  practice: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20",
  review: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
  assessment: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
  break: "border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-900/20",
  goal: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20",
};

const RECOMMENDATION_ICON_COLORS: Record<RecommendationType, string> = {
  content: "text-blue-500",
  practice: "text-purple-500",
  review: "text-amber-500",
  assessment: "text-green-500",
  break: "text-teal-500",
  goal: "text-rose-500",
};

const PRIORITY_BADGES: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
  high: { variant: "destructive", label: "High Priority" },
  medium: { variant: "default", label: "Medium" },
  low: { variant: "secondary", label: "Low" },
};

function RecommendationCard({
  recommendation,
  compact,
  onAction,
}: {
  recommendation: LearningRecommendation;
  compact?: boolean;
  onAction: (rec: LearningRecommendation) => void;
}) {
  const Icon = RECOMMENDATION_ICONS[recommendation.type] || Sparkles;
  const colorClass = RECOMMENDATION_COLORS[recommendation.type] || "border-gray-200 bg-gray-50";
  const iconColorClass = RECOMMENDATION_ICON_COLORS[recommendation.type] || "text-gray-500";
  const priorityBadge = PRIORITY_BADGES[recommendation.priority] || PRIORITY_BADGES.low;

  return (
    <div
      className={cn(
        "relative p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer group",
        colorClass,
        recommendation.priority === "high" && "ring-1 ring-red-300 dark:ring-red-700"
      )}
      onClick={() => onAction(recommendation)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm shrink-0", iconColorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm truncate">{recommendation.title}</h4>
            <Badge variant={priorityBadge.variant} className="shrink-0 text-xs">
              {priorityBadge.label}
            </Badge>
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {recommendation.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{recommendation.estimatedMinutes} min</span>
            </div>
            {recommendation.metadata?.difficulty && (
              <Badge variant="outline" className="text-xs h-5">
                {recommendation.metadata.difficulty}
              </Badge>
            )}
            {recommendation.metadata?.confidence && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{Math.round(recommendation.metadata.confidence * 100)}% match</span>
              </div>
            )}
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground/70 mt-2 italic">
              {recommendation.reason}
            </p>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Play className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LearningRecommendationsWidget({
  compact = false,
  maxRecommendations = 5,
  defaultAvailableTime = 60,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
  className = "",
}: LearningRecommendationsWidgetProps) {
  const router = useRouter();
  const [availableTime, setAvailableTime] = useState(defaultAvailableTime);
  const [selectedType, setSelectedType] = useState<RecommendationType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const {
    recommendations,
    totalEstimatedTime,
    generatedAt,
    context,
    isLoading,
    error,
    refresh,
    fetchRecommendations,
  } = useRecommendations({
    availableTime,
    limit: maxRecommendations,
    types: selectedType === "all" ? undefined : [selectedType],
    autoFetch: autoRefresh,
    refreshInterval: autoRefresh ? refreshInterval : undefined,
  });

  const handleAction = useCallback(
    (rec: LearningRecommendation) => {
      if (rec.targetUrl) {
        router.push(rec.targetUrl);
      } else if (rec.metadata?.resourceId) {
        // Navigate based on type
        switch (rec.type) {
          case "content":
            router.push(`/courses/${rec.metadata.resourceId}`);
            break;
          case "practice":
            router.push(`/practice?skill=${rec.metadata.resourceId}`);
            break;
          case "assessment":
            router.push(`/assessment/${rec.metadata.resourceId}`);
            break;
          case "review":
            router.push(`/review?topic=${rec.metadata.resourceId}`);
            break;
          default:
            console.log("Action for recommendation:", rec);
        }
      }
    },
    [router]
  );

  const handleTimeChange = useCallback(
    (value: number[]) => {
      setAvailableTime(value[0]);
    },
    []
  );

  const handleApplyFilters = useCallback(() => {
    fetchRecommendations({
      time: availableTime,
      limit: maxRecommendations,
      types: selectedType === "all" ? undefined : [selectedType],
    });
    setShowFilters(false);
  }, [availableTime, maxRecommendations, selectedType, fetchRecommendations]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Learning Recommendations</CardTitle>
              <p className="text-xs text-muted-foreground">
                {recommendations.length > 0
                  ? `${recommendations.length} recommendations - ${totalEstimatedTime} min total`
                  : "Personalized for you"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-8 w-8 p-0", showFilters && "bg-muted")}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filter options</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => refresh()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh recommendations</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Available Time</label>
                <span className="text-sm text-muted-foreground">{availableTime} minutes</span>
              </div>
              <Slider
                value={[availableTime]}
                onValueChange={handleTimeChange}
                min={5}
                max={480}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span>
                <span>8 hours</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type Filter</label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as RecommendationType | "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="goal">Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleApplyFilters} className="w-full" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading && recommendations.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load recommendations</p>
            <Button variant="ghost" size="sm" onClick={() => refresh()} className="mt-2">
              Try again
            </Button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="h-8 w-8 text-purple-500 mb-2" />
            <p className="text-sm font-medium">No recommendations yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start learning to get personalized recommendations
            </p>
            <Button variant="outline" size="sm" onClick={() => refresh()} className="mt-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Recommendations
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="pr-4 max-h-96">
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    compact={compact}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Context info */}
            {context && !compact && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {context.currentGoals.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{context.currentGoals.length} active goals</span>
                    </div>
                  )}
                  {context.recentTopics.length > 0 && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{context.recentTopics.length} recent topics</span>
                    </div>
                  )}
                  {generatedAt && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Clock className="h-3 w-3" />
                      <span>
                        Updated {new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default LearningRecommendationsWidget;
