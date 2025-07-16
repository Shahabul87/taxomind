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
    <div className="space-y-6">
      {analytics && analytics.learningMetrics.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Course Progress & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.learningMetrics.map((metric: any) => (
                <div key={metric.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                  {metric.course?.imageUrl && (
                    <Image 
                      src={metric.course.imageUrl} 
                      alt={metric.course.title}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-lg">
                      {metric.course?.title || 'Unknown Course'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Progress:</span>
                        <Progress value={metric.overallProgress} className="w-24" />
                        <span className="text-sm font-medium text-foreground">{Math.round(metric.overallProgress)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Engagement:</span>
                        <span className="text-sm font-medium text-foreground">{Math.round(metric.averageEngagementScore)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Study Time:</span>
                        <span className="text-sm font-medium text-foreground">{Math.round(metric.totalStudyTime / 60)}h</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant={metric.riskScore > 70 ? 'destructive' : 
                                     metric.riskScore > 40 ? 'secondary' : 'default'}>
                        {metric.riskScore > 70 ? 'At Risk' : 
                         metric.riskScore > 40 ? 'Moderate Risk' : 'On Track'}
                      </Badge>
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