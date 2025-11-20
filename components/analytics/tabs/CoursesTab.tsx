"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

interface CoursesTabProps {
  analytics: any;
}

export function CoursesTab({ analytics }: CoursesTabProps) {
  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {analytics && analytics.learningMetrics.length > 0 && (
        <Card className="bg-card border-border rounded-xl sm:rounded-2xl">
          <CardHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="text-foreground text-base sm:text-lg md:text-xl break-words">Course Progress & Performance</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              {analytics.learningMetrics.map((metric: any) => (
                <div key={metric.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-muted/50 border border-border">
                  {metric.course?.imageUrl && (
                    <Image 
                      src={metric.course.imageUrl} 
                      alt={metric.course.title}
                      width={64}
                      height={64}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <h4 className="font-semibold sm:font-medium text-foreground text-sm sm:text-base md:text-lg break-words">
                        {metric.course?.title || 'Unknown Course'}
                      </h4>
                      <Badge 
                        variant={metric.riskScore > 70 ? 'destructive' : 
                                       metric.riskScore > 40 ? 'secondary' : 'default'}
                        className="text-xs sm:text-sm w-fit"
                      >
                        {metric.riskScore > 70 ? 'At Risk' : 
                         metric.riskScore > 40 ? 'Moderate Risk' : 'On Track'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Progress:</span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Progress value={metric.overallProgress} className="flex-1 sm:w-20 md:w-24 h-1.5 sm:h-2" />
                          <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{Math.round(metric.overallProgress)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Engagement:</span>
                        <span className="text-xs sm:text-sm font-medium text-foreground">{Math.round(metric.averageEngagementScore)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Study Time:</span>
                        <span className="text-xs sm:text-sm font-medium text-foreground">{Math.round(metric.totalStudyTime / 60)}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}