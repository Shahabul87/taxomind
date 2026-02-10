"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BloomsLevel {
  level: string;
  avgScore: number;
  totalQuestions: number;
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: string;
}

interface AnalyticsData {
  summary: {
    totalAttempts: number;
    totalExams: number;
    passRate: number;
    averageScore: number;
    bestScore: number;
  };
  trends: {
    improvementRate: number;
  };
  bloomsAnalysis: BloomsLevel[];
  recommendations: Recommendation[];
}

interface ExamFeedbackPanelProps {
  sectionId: string;
  courseId: string;
}

const BLOOMS_LABELS: Record<string, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
};

const BLOOMS_COLORS: Record<string, string> = {
  REMEMBER: "bg-blue-500",
  UNDERSTAND: "bg-cyan-500",
  APPLY: "bg-green-500",
  ANALYZE: "bg-yellow-500",
  EVALUATE: "bg-orange-500",
  CREATE: "bg-red-500",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500",
};

export function ExamFeedbackPanel({
  sectionId,
  courseId,
}: ExamFeedbackPanelProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/user/exam-analytics?courseId=${courseId}&sectionId=${sectionId}`
      );
      if (!res.ok) return;
      const analytics: AnalyticsData = await res.json();

      // Only show panel if user has completed attempts
      if (analytics.summary.totalAttempts > 0) {
        setData(analytics);
      }
    } catch {
      // Silently fail — panel is optional
    } finally {
      setIsLoading(false);
    }
  }, [courseId, sectionId]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, trends, bloomsAnalysis, recommendations } = data;
  const topRecommendations = recommendations.slice(0, 2);
  const activeBloomsLevels = bloomsAnalysis.filter(
    (b) => b.totalQuestions > 0
  );

  return (
    <Card className="border-indigo-200 dark:border-indigo-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Brain className="h-4 w-4 text-indigo-500" />
          SAM AI Exam Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {summary.averageScore}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Avg Score
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {summary.passRate}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pass Rate
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {summary.bestScore}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Best Score
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp
                className={cn(
                  "h-4 w-4",
                  trends.improvementRate >= 0
                    ? "text-green-500"
                    : "text-red-500"
                )}
              />
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {trends.improvementRate > 0 ? "+" : ""}
                {trends.improvementRate}%
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trend
            </p>
          </div>
        </div>

        {/* Bloom's Taxonomy Bars */}
        {activeBloomsLevels.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Cognitive Levels
            </h4>
            <div className="space-y-1">
              {bloomsAnalysis.map((level) => (
                <div key={level.level} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 w-16 text-right truncate">
                    {BLOOMS_LABELS[level.level] || level.level}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        level.totalQuestions > 0
                          ? BLOOMS_COLORS[level.level] || "bg-indigo-500"
                          : "bg-transparent"
                      )}
                      style={{
                        width: `${level.totalQuestions > 0 ? level.avgScore : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 w-8">
                    {level.totalQuestions > 0 ? `${level.avgScore}%` : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Recommendations */}
        {topRecommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Recommendations
            </h4>
            {topRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-2.5 rounded-md border-l-2 bg-slate-50 dark:bg-slate-800/50",
                  PRIORITY_STYLES[rec.priority] || "border-l-slate-300"
                )}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Target className="h-3 w-3 text-indigo-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {rec.title}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-4"
                  >
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* View Full Analytics Link */}
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
            asChild
          >
            <Link href="/dashboard/analytics">
              <BarChart3 className="h-3 w-3 mr-1" />
              View Full Analytics
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
