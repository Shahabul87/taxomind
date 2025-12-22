"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertCircle,
  Trophy,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAIAnalyticsInsights, type AIInsight, type InsightsView } from "@/hooks/use-ai-analytics-insights";

interface AIInsightsPanelProps {
  view?: InsightsView;
  className?: string;
  compact?: boolean;
  maxInsights?: number;
}

/**
 * AI Insights Panel Component
 * Displays AI-powered personalized learning insights
 */
export function AIInsightsPanel({
  view = "all",
  className,
  compact = false,
  maxInsights = 6,
}: AIInsightsPanelProps) {
  const { insights, loading, error, refetch, metadata } = useAIAnalyticsInsights({ view });

  if (loading) {
    return <AIInsightsSkeleton compact={compact} />;
  }

  if (error) {
    return (
      <Card className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm", className)}>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm", className)}>
        <CardContent className="py-8 text-center">
          <Lightbulb className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            Complete more activities to get personalized insights
          </p>
          <Link href="/courses">
            <Button variant="outline" size="sm" className="mt-4 gap-2">
              Browse Courses
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const displayInsights = insights.slice(0, maxInsights);

  if (compact) {
    return <CompactView insights={displayInsights} className={className} />;
  }

  return (
    <Card className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            AI-Powered Insights
          </CardTitle>
          <Button onClick={refetch} variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {metadata && (
          <CardDescription className="text-xs mt-2">
            Updated {new Date(metadata.generatedAt).toLocaleTimeString()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {displayInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <InsightCard insight={insight} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function CompactView({ insights, className }: { insights: AIInsight[]; className?: string }) {
  const highPriority = insights.filter((i) => i.priority === "high").slice(0, 2);
  const displayInsights = highPriority.length > 0 ? highPriority : insights.slice(0, 2);

  return (
    <Card className={cn("bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-purple-500" />
          Quick Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayInsights.map((insight) => (
            <div
              key={insight.id}
              className={cn(
                "p-3 rounded-lg border-l-4",
                getInsightStyles(insight.type).border,
                getInsightStyles(insight.type).bg
              )}
            >
              <div className="flex items-start gap-2">
                <InsightIcon type={insight.type} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {insight.title}
                  </p>
                  {insight.actionable && insight.action && (
                    <Link
                      href={insight.action.href}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-flex items-center gap-1"
                    >
                      {insight.action.label}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const styles = getInsightStyles(insight.type);

  return (
    <div
      className={cn(
        "p-4 rounded-xl border-l-4 transition-all duration-300 hover:shadow-md",
        styles.border,
        styles.bg
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg flex-shrink-0", styles.iconBg)}>
          <InsightIcon type={insight.type} className={cn("w-5 h-5", styles.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{insight.title}</h4>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                insight.priority === "high" && "border-red-200 text-red-700 bg-red-50",
                insight.priority === "medium" && "border-amber-200 text-amber-700 bg-amber-50",
                insight.priority === "low" && "border-green-200 text-green-700 bg-green-50"
              )}
            >
              {insight.priority}
            </Badge>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {insight.description}
          </p>

          <div className="flex items-center justify-between flex-wrap gap-2">
            {insight.metric && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">{insight.metric.label}:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {insight.metric.value}
                </span>
                {insight.metric.trend && (
                  <TrendIndicator trend={insight.metric.trend} />
                )}
              </div>
            )}

            {insight.actionable && insight.action && (
              <Link href={insight.action.href}>
                <Button size="sm" variant="outline" className="gap-1.5 h-8">
                  {insight.action.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightIcon({ type, className }: { type: AIInsight["type"]; className?: string }) {
  const icons = {
    strength: <TrendingUp className={className} />,
    improvement: <Target className={className} />,
    recommendation: <Lightbulb className={className} />,
    warning: <AlertCircle className={className} />,
    achievement: <Trophy className={className} />,
  };

  return icons[type] || <Zap className={className} />;
}

function TrendIndicator({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  }
  if (trend === "down") {
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  }
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function getInsightStyles(type: AIInsight["type"]) {
  const styles = {
    strength: {
      border: "border-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
      iconBg: "bg-green-100 dark:bg-green-900/50",
      iconColor: "text-green-600 dark:text-green-400",
    },
    improvement: {
      border: "border-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    recommendation: {
      border: "border-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    warning: {
      border: "border-red-500",
      bg: "bg-red-50 dark:bg-red-950/30",
      iconBg: "bg-red-100 dark:bg-red-900/50",
      iconColor: "text-red-600 dark:text-red-400",
    },
    achievement: {
      border: "border-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  };

  return styles[type] || styles.recommendation;
}

function AIInsightsSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border-l-4 border-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border-l-4 border-slate-200 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
