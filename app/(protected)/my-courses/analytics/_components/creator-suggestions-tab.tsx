"use client";

import { useMemo } from "react";
import { Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientPieChart, ELEGANT_PALETTE } from "@/components/charts/client-charts";
import { ProgressSparkline } from "@/components/analytics/enterprise/Sparkline";
import { EmptyState } from "@/components/analytics/enterprise/EmptyState";
import { cn } from "@/lib/utils";
import type { CreatorSuggestionsTabProps, SuggestionPriority } from "./creator-types";

const priorityStyles: Record<SuggestionPriority, { card: string; badge: string }> = {
  high: {
    card: "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  medium: {
    card: "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/30 dark:bg-yellow-900/10",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  low: {
    card: "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
};

const typeLabels: Record<string, string> = {
  content_improvement: "Content",
  new_course: "New Course",
  engagement: "Engagement",
  difficulty_adjustment: "Difficulty",
};

export function CreatorSuggestionsTab({ suggestions }: CreatorSuggestionsTabProps) {
  // Type distribution for pie chart
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    suggestions.forEach(s => {
      const label = typeLabels[s.type] ?? s.type;
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [suggestions]);

  // Priority counts
  const priorityCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    suggestions.forEach(s => {
      if (s.priority === "high") high++;
      else if (s.priority === "medium") medium++;
      else low++;
    });
    return { high, medium, low };
  }, [suggestions]);

  // Estimate impact as a numeric score for sparkline (simple heuristic from the impact string)
  function impactScore(impact: string): number {
    const match = impact.match(/\+?(\d+)/);
    return match ? parseInt(match[1], 10) : 50;
  }

  if (suggestions.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="w-full h-full" />}
        title="No suggestions yet"
        description="AI-powered suggestions will appear here as your courses collect more data. Keep creating and engaging learners!"
        size="lg"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Type Distribution + Priority Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Type Pie Chart */}
        {typeDistribution.length > 0 && (
          <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Suggestion Categories</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Distribution of suggestion types
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-48 sm:h-56 md:h-64">
                <ClientPieChart
                  data={typeDistribution}
                  dataKey="value"
                  nameKey="name"
                  colors={[ELEGANT_PALETTE.primary, ELEGANT_PALETTE.secondary, ELEGANT_PALETTE.tertiary, ELEGANT_PALETTE.accent2]}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority Summary */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Priority</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Suggestions by priority level
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700 dark:text-red-400">High</span>
                <span className="text-lg font-bold text-red-700 dark:text-red-400">{priorityCounts.high}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Medium</span>
                <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{priorityCounts.medium}</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Low</span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">{priorityCounts.low}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestion Cards */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">AI-Powered Improvement Suggestions</CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Data-driven recommendations to enhance your courses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.title}
                className={cn(
                  "border rounded-lg p-3 sm:p-4",
                  priorityStyles[suggestion.priority].card
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <h4 className="font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100 flex-1 min-w-0">
                    {suggestion.title}
                  </h4>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-shrink-0">
                    <Badge className={cn("text-[9px] sm:text-xs px-1.5 sm:px-2", priorityStyles[suggestion.priority].badge)}>
                      {suggestion.priority} priority
                    </Badge>
                    <Badge variant="outline" className="capitalize text-[9px] sm:text-xs px-1.5 sm:px-2">
                      {typeLabels[suggestion.type] ?? suggestion.type}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2 leading-relaxed">
                  {suggestion.description}
                </p>
                {suggestion.relatedCourse && (
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2 truncate">
                    Related to: {suggestion.relatedCourse}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
                      Impact: {suggestion.estimatedImpact}
                    </span>
                  </div>
                  <div className="w-20 sm:w-24">
                    <ProgressSparkline
                      value={impactScore(suggestion.estimatedImpact)}
                      variant="accent"
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
