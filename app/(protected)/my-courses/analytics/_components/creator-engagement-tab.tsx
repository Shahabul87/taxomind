"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientAreaChart, ClientBarChart, ELEGANT_PALETTE } from "@/components/charts/client-charts";
import { EmptyState } from "@/components/analytics/enterprise/EmptyState";
import type { CreatorEngagementTabProps } from "./creator-types";

export function CreatorEngagementTab({ engagementMetrics }: CreatorEngagementTabProps) {
  const engagementChartData = useMemo(() => {
    return engagementMetrics.mostPopularSections.map(s => ({
      name: s.sectionTitle.length > 20 ? s.sectionTitle.slice(0, 20) + "..." : s.sectionTitle,
      value: Math.round(s.engagementScore * 10) / 10,
    }));
  }, [engagementMetrics.mostPopularSections]);

  const dropoffChartData = useMemo(() => {
    return engagementMetrics.dropoffPoints.map(s => ({
      name: s.sectionTitle.length > 20 ? s.sectionTitle.slice(0, 20) + "..." : s.sectionTitle,
      value: Math.round(s.dropoffRate * 10) / 10,
    }));
  }, [engagementMetrics.dropoffPoints]);

  const hasData = engagementMetrics.mostPopularSections.length > 0 || engagementMetrics.dropoffPoints.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={<Activity className="w-full h-full" />}
        title="No engagement data yet"
        description="Engagement metrics will appear once learners start interacting with your course content."
        size="lg"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Engagement Scores */}
        {engagementChartData.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Engagement Scores</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Top sections by learner engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-48 sm:h-56 md:h-64">
                <ClientAreaChart
                  data={engagementChartData}
                  xDataKey="name"
                  areaDataKey="value"
                  color={ELEGANT_PALETTE.tertiary}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drop-off Rates */}
        {dropoffChartData.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Drop-off Rates</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Sections where learners stop progressing
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-48 sm:h-56 md:h-64">
                <ClientBarChart
                  data={dropoffChartData}
                  xDataKey="name"
                  barDataKey="value"
                  color="#ef4444"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Most Engaging */}
        {engagementMetrics.mostPopularSections.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Most Engaging Content</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2.5 sm:space-y-3">
                {engagementMetrics.mostPopularSections.map((section, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 border border-slate-200/50 dark:border-slate-700/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                        {section.sectionTitle}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {section.courseTitle}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] sm:text-xs px-2 sm:px-2.5 flex-shrink-0 self-start sm:self-auto">
                      {section.engagementScore.toFixed(1)} score
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drop-off Points */}
        {engagementMetrics.dropoffPoints.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Areas for Improvement</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Sections where learners commonly struggle or drop off
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-2.5 sm:space-y-3">
                {engagementMetrics.dropoffPoints.map((section, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 border border-slate-200/50 dark:border-slate-700/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                        {section.sectionTitle}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5">
                        {section.courseTitle}
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] sm:text-xs px-2 sm:px-2.5 flex-shrink-0 self-start sm:self-auto">
                      {section.dropoffRate.toFixed(1)}% drop-off
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
