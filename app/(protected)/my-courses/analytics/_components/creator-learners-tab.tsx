"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ClientPieChart, ClientBarChart, ELEGANT_PALETTE } from "@/components/charts/client-charts";
import { CognitiveRadarChart } from "@/components/learner/cognitive-radar-chart";
import { EmptyState } from "@/components/analytics/enterprise/EmptyState";
import type { CreatorLearnersTabProps } from "./creator-types";

export function CreatorLearnersTab({ learnerInsights, totalLearners }: CreatorLearnersTabProps) {
  const experiencePieData = useMemo(() => {
    return Object.entries(learnerInsights.demographics.experienceLevels)
      .filter(([, count]) => count > 0)
      .map(([level, count]) => ({
        name: level.charAt(0).toUpperCase() + level.slice(1),
        value: count,
      }));
  }, [learnerInsights.demographics.experienceLevels]);

  const countryBarData = useMemo(() => {
    return learnerInsights.demographics.mostActiveCountries
      .filter(c => c.count > 0)
      .slice(0, 5)
      .map(c => ({ name: c.country, value: c.count }));
  }, [learnerInsights.demographics.mostActiveCountries]);

  if (totalLearners === 0) {
    return (
      <EmptyState
        icon={<Users className="w-full h-full" />}
        title="No learner data yet"
        description="Once learners enroll in your courses, you&apos;ll see insights about their demographics, skills, and performance."
        size="lg"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Experience Level Pie */}
        {experiencePieData.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Experience Levels</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Distribution of learner experience
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-48 sm:h-56 md:h-64">
                <ClientPieChart
                  data={experiencePieData}
                  dataKey="value"
                  nameKey="name"
                  colors={[ELEGANT_PALETTE.tertiary, ELEGANT_PALETTE.secondary, ELEGANT_PALETTE.accent1]}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Countries Bar */}
        {countryBarData.length > 0 && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Top Countries</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Where your learners are from
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="h-48 sm:h-56 md:h-64">
                <ClientBarChart
                  data={countryBarData}
                  xDataKey="name"
                  barDataKey="value"
                  color={ELEGANT_PALETTE.secondary}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cognitive Radar + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Bloom&apos;s Cognitive Skills */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Cognitive Skills Development</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Bloom&apos;s Taxonomy progress across your learners
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 flex justify-center">
            <CognitiveRadarChart
              distribution={learnerInsights.performanceData.cognitiveSkillsProgress}
              size={280}
            />
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Performance Overview</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Exam scores and study metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Average Exam Score</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {learnerInsights.performanceData.averageExamScores.toFixed(1)}%
                </span>
              </div>
              <Progress value={learnerInsights.performanceData.averageExamScores} className="h-2" />
            </div>

            <div>
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Avg Time per Section</span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {Math.round(learnerInsights.engagementMetrics.averageTimePerSection)} min
              </p>
            </div>

            {learnerInsights.performanceData.commonStrugglingAreas.length > 0 && (
              <div>
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Common Struggling Areas
                </span>
                <div className="space-y-2">
                  {learnerInsights.performanceData.commonStrugglingAreas.map((area, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{area.area}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 truncate">{area.courseTitle}</p>
                      </div>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 ml-2">
                        {area.strugglingPercentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
