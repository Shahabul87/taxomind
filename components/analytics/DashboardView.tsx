"use client";

import { motion } from "framer-motion";
import { User } from "next-auth";
import { TrendingUp, BarChart3, Clock, Activity, Target, Zap, BookOpen, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardCard } from '@/components/ui/dashboard-card';
import { PredictiveAnalytics } from '@/app/dashboard/user/_components/smart-dashboard/PredictiveAnalytics';
import { RealtimePulse } from '@/app/dashboard/user/_components/smart-dashboard/RealtimePulse';
import { cn } from '@/lib/utils';
import Image from "next/image";

interface DashboardViewProps {
  user: User;
  analytics: any;
  performance: any;
  className?: string;
}

export function DashboardView({ user, analytics, performance, className }: DashboardViewProps) {
  return (
    <div className={cn("p-6 space-y-6 max-w-6xl mx-auto", className)}>
      {/* Summary Stats */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Total Time</span>
              </div>
              <div className="text-2xl font-bold text-card-foreground">
                {Math.round(analytics.summary.totalLearningTime / 60)}h
              </div>
              <div className="text-xs text-muted-foreground">
                {analytics.summary.totalLearningTime % 60}m
              </div>
            </Card>

            <Card className="p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Engagement</span>
              </div>
              <div className="text-2xl font-bold text-card-foreground">
                {analytics.summary.averageEngagementScore}%
              </div>
              <div className="text-xs text-muted-foreground">Average score</div>
            </Card>

            <Card className="p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Progress</span>
              </div>
              <div className="text-2xl font-bold text-card-foreground">
                {analytics.summary.overallProgress}%
              </div>
              <div className="text-xs text-muted-foreground">Overall completion</div>
            </Card>

            <Card className="p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Streak</span>
              </div>
              <div className="text-2xl font-bold text-card-foreground">
                {analytics.summary.currentStreak}
              </div>
              <div className="text-xs text-muted-foreground">Days</div>
            </Card>

            <Card className="p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Courses</span>
              </div>
              <div className="text-2xl font-bold text-card-foreground">
                {analytics.summary.activeCourses}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </Card>

            <Card className="p-4 bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-card-foreground">Achievements</span>
              </div>
              <div className="text-2xl font-bold text-card-foreground">
                {analytics.summary.totalAchievements}
              </div>
              <div className="text-xs text-muted-foreground">Unlocked</div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Performance Trends */}
      {performance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <TrendingUp className="w-5 h-5 text-primary" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">Learning Velocity</span>
                    <Badge variant={performance.trends.learningVelocity === 'IMPROVING' ? 'default' : 
                                   performance.trends.learningVelocity === 'DECLINING' ? 'destructive' : 'secondary'}>
                      {performance.trends.learningVelocity}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-card-foreground">
                    {performance.summary.totalLearningTime > 0 
                      ? Math.round(performance.summary.totalLearningTime / Math.max(performance.summary.totalSessions, 1))
                      : 0}min
                  </div>
                  <div className="text-xs text-muted-foreground">Per session</div>
                </div>

                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">Engagement</span>
                    <Badge variant={performance.trends.engagement === 'IMPROVING' ? 'default' : 
                                   performance.trends.engagement === 'DECLINING' ? 'destructive' : 'secondary'}>
                      {performance.trends.engagement}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-card-foreground">
                    {performance.summary.averageEngagementScore}%
                  </div>
                  <div className="text-xs text-muted-foreground">Average</div>
                </div>

                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">Quiz Performance</span>
                    <Badge variant={performance.trends.performance === 'IMPROVING' ? 'default' : 
                                   performance.trends.performance === 'DECLINING' ? 'destructive' : 'secondary'}>
                      {performance.trends.performance}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-card-foreground">
                    {performance.summary.averageQuizPerformance}%
                  </div>
                  <div className="text-xs text-muted-foreground">Average score</div>
                </div>

                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-card-foreground">Improvement Rate</span>
                  <div className={cn(
                    "text-2xl font-bold",
                    performance.trends.improvementRate > 0 ? "text-primary" : 
                    performance.trends.improvementRate < 0 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {performance.trends.improvementRate > 0 ? '+' : ''}
                    {Math.round(performance.trends.improvementRate)}%
                  </div>
                  <div className="text-xs text-muted-foreground">This period</div>
                </div>
              </div>

              {performance.insights && performance.insights.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-card-foreground">AI Insights</h4>
                  {performance.insights.map((insight: { type: string; title?: string; message?: string; priority?: string }, index: number) => (
                    <div
                      key={`insight-${index}`}
                      className={cn(
                        "p-4 rounded-lg border transition-colors",
                        insight.type === 'success' ? "bg-muted/50 border-border" :
                        insight.type === 'warning' ? "bg-muted/50 border-border" :
                        insight.type === 'info' ? "bg-muted/50 border-border" :
                        "bg-muted/30 border-border"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          insight.priority === 'high' ? "bg-destructive" :
                          insight.priority === 'medium' ? "bg-primary" : "bg-primary/60"
                        )} />
                        <div>
                          <h5 className="font-medium text-sm text-card-foreground">{insight.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Enhanced Predictive Analytics with Real Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <DashboardCard 
          title="Predictive Analytics" 
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
        >
          <PredictiveAnalytics user={user} />
        </DashboardCard>
      </motion.div>

      {/* Enhanced Real-time Pulse with Real Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <DashboardCard 
          title="Real-time Learning Pulse" 
          icon={<BarChart3 className="w-5 h-5 text-primary" />}
        >
          <RealtimePulse user={user} />
        </DashboardCard>
      </motion.div>

      {/* Current Learning Metrics */}
      {analytics && analytics.learningMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.learningMetrics.slice(0, 5).map((metric: any) => (
                  <div key={metric.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                    {metric.course?.imageUrl && (
                      <Image 
                        src={metric.course.imageUrl} 
                        alt={metric.course.title}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-card-foreground">
                        {metric.course?.title || 'Unknown Course'}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Progress:</span>
                          <Progress value={metric.overallProgress} className="w-20" />
                          <span className="text-sm font-medium text-card-foreground">{Math.round(metric.overallProgress)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Engagement:</span>
                          <span className="text-sm font-medium text-card-foreground">{Math.round(metric.averageEngagementScore)}%</span>
                        </div>
                        <Badge variant={metric.riskScore > 70 ? 'destructive' : 
                                       metric.riskScore > 40 ? 'secondary' : 'default'}>
                          {metric.riskScore > 70 ? 'At Risk' : 
                           metric.riskScore > 40 ? 'Moderate' : 'On Track'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}