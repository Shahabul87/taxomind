"use client";

import { useMemo } from "react";
import { Star, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientBarChart, ELEGANT_PALETTE } from "@/components/charts/client-charts";
import { ProgressSparkline } from "@/components/analytics/enterprise/Sparkline";
import { EmptyState } from "@/components/analytics/enterprise/EmptyState";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CreatorCoursesTabProps } from "./creator-types";

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export function CreatorCoursesTab({ courses }: CreatorCoursesTabProps) {
  const chartData = useMemo(() => {
    return courses.slice(0, 8).map(c => ({
      name: c.courseTitle.length > 18 ? c.courseTitle.slice(0, 18) + "..." : c.courseTitle,
      value: Math.round(c.completionRate * 10) / 10,
    }));
  }, [courses]);

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-full h-full" />}
        title="No courses created yet"
        description="Share your knowledge with the community by creating your first course."
        action={{ label: "Create Course", href: "/create-course" }}
        size="lg"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Completion Rate Chart */}
      {chartData.length > 0 && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Completion Rate by Course</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Percentage of enrolled learners who completed each course
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="h-48 sm:h-56 md:h-64">
              <ClientBarChart
                data={chartData}
                xDataKey="name"
                barDataKey="value"
                color={ELEGANT_PALETTE.primary}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course List */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Course Performance</CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1">
            How your shared courses are performing in the community
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {courses.map((course) => (
              <div key={course.courseId} className="border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                      {course.courseTitle}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn(difficultyColors[course.difficulty] ?? "bg-gray-100 text-gray-700", "text-[10px] sm:text-xs")}>
                        {course.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-current flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">
                          {course.averageRating.toFixed(1)}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-500">
                          ({course.totalRatings})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {formatNumber(course.learners)} learners
                    </Badge>
                    <Link href={`/my-courses/${course.courseId}/edit`}>
                      <Button size="sm" variant="outline" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs">Completion Rate</span>
                    <div className="mt-1.5">
                      <ProgressSparkline value={course.completionRate} variant="primary" size="sm" />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs">Avg Study Time</span>
                    <p className="font-medium text-xs sm:text-sm mt-0.5">{Math.round(course.averageStudyTime / 60)}h</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs">Views</span>
                    <p className="font-medium text-xs sm:text-sm mt-0.5">{formatNumber(course.views)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs">Shares</span>
                    <p className="font-medium text-xs sm:text-sm mt-0.5">{formatNumber(course.shares)}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs">Last Activity</span>
                    <p className="font-medium text-xs sm:text-sm mt-0.5">
                      {new Date(course.lastActivity).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {course.tags.length > 0 && (
                  <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
                    {course.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
