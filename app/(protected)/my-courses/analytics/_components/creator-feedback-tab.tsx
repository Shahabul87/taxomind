"use client";

import { useMemo } from "react";
import { MessageCircle, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientBarChart } from "@/components/charts/client-charts";
import { EmptyState } from "@/components/analytics/enterprise/EmptyState";
import { cn } from "@/lib/utils";
import type { CreatorFeedbackTabProps } from "./creator-types";

export function CreatorFeedbackTab({ feedback }: CreatorFeedbackTabProps) {
  // Compute rating distribution from feedback array
  const ratingDistribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // 1-star through 5-star
    feedback.forEach(f => {
      const bucket = Math.min(4, Math.max(0, Math.floor(f.rating) - 1));
      buckets[bucket]++;
    });
    return [
      { name: "1 star", value: buckets[0] },
      { name: "2 stars", value: buckets[1] },
      { name: "3 stars", value: buckets[2] },
      { name: "4 stars", value: buckets[3] },
      { name: "5 stars", value: buckets[4] },
    ];
  }, [feedback]);

  // Sentiment analysis
  const sentimentCounts = useMemo(() => {
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    feedback.forEach(f => {
      if (f.rating >= 4) positive++;
      else if (f.rating >= 3) neutral++;
      else negative++;
    });
    return { positive, neutral, negative };
  }, [feedback]);

  if (feedback.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="w-full h-full" />}
        title="No feedback yet"
        description="Community feedback will appear here once learners start reviewing your courses."
        size="lg"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Rating Distribution + Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {/* Rating Distribution Chart */}
        <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Rating Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Breakdown of ratings across all your courses
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="h-48 sm:h-56 md:h-64">
              <ClientBarChart
                data={ratingDistribution}
                xDataKey="name"
                barDataKey="value"
                color="#f59e0b"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Summary */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Sentiment</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Overall feedback sentiment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Positive</span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">{sentimentCounts.positive}</span>
              </div>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">4+ stars</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Neutral</span>
                <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{sentimentCounts.neutral}</span>
              </div>
              <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-0.5">3 stars</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Negative</span>
                <span className="text-lg font-bold text-red-700 dark:text-red-400">{sentimentCounts.negative}</span>
              </div>
              <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">1-2 stars</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review List */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Recent Community Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {feedback.slice(0, 10).map((item, index) => (
              <div key={index} className="border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {item.learnerName}
                    </span>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3 sm:w-3.5 sm:h-3.5",
                            i < Math.round(item.rating) ? "text-yellow-500 fill-current" : "text-slate-300 dark:text-slate-600"
                          )}
                        />
                      ))}
                    </div>
                    {item.helpful && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[9px] sm:text-xs px-1.5 sm:px-2">
                        Helpful
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2 leading-relaxed">
                  {item.review}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                  Course: {item.courseTitle}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
