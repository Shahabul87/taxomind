"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap, Target, BarChart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PerformanceTabProps {
  analytics: any;
  performance: any;
}

export function PerformanceTab({ analytics, performance }: PerformanceTabProps) {
  const getMetricIcon = (index: number) => {
    const icons = [Zap, Activity, Target, BarChart];
    const IconComponent = icons[index];
    return IconComponent;
  };

  const getMetricColor = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-emerald-500 to-emerald-600", 
      "from-purple-500 to-purple-600",
      "from-orange-500 to-red-500"
    ];
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {performance && (
          <>
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 sm:mb-8"
            >
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm mb-3 sm:mb-4">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Performance Analytics</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
                Your Learning Performance
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Track your progress and identify areas for improvement
              </p>
            </motion.div>

            {/* Performance Metrics Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
            >
              {[
                {
                  title: "Learning Velocity",
                  value: performance.summary.totalLearningTime > 0 
                    ? Math.round(performance.summary.totalLearningTime / Math.max(performance.summary.totalSessions, 1))
                    : 0,
                  unit: "min",
                  subtitle: "Per session",
                  trend: performance.trends.learningVelocity
                },
                {
                  title: "Engagement",
                  value: performance.summary.averageEngagementScore,
                  unit: "%",
                  subtitle: "Average score",
                  trend: performance.trends.engagement
                },
                {
                  title: "Quiz Performance", 
                  value: performance.summary.averageQuizPerformance,
                  unit: "%",
                  subtitle: "Average score",
                  trend: performance.trends.performance
                },
                {
                  title: "Improvement Rate",
                  value: Math.round(performance.trends.improvementRate),
                  unit: "%",
                  subtitle: "This period",
                  trend: performance.trends.improvementRate > 0 ? 'IMPROVING' : 
                         performance.trends.improvementRate < 0 ? 'DECLINING' : 'STABLE'
                }
              ].map((metric, index) => {
                const IconComponent = getMetricIcon(index);
                const colorClass = getMetricColor(index);
                
                return (
                  <motion.div
                    key={metric.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                  >
                    <Card className={`group relative overflow-hidden bg-gradient-to-br ${colorClass} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="relative p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <Badge
                            variant={metric.trend === 'IMPROVING' ? 'default' :
                                   metric.trend === 'DECLINING' ? 'destructive' : 'secondary'}
                            className="bg-white/20 backdrop-blur-sm border-white/30 text-xs"
                          >
                            {metric.trend}
                          </Badge>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          <h3 className="text-xs sm:text-sm font-medium text-white/90">{metric.title}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl sm:text-2xl font-bold text-white">
                              {metric.value > 0 && metric.title === "Improvement Rate" ? '+' : ''}{metric.value}
                            </span>
                            <span className="text-xs sm:text-sm text-white/80">{metric.unit}</span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-white/70">{metric.subtitle}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* AI Insights Section */}
            {performance.insights && performance.insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white text-base sm:text-lg">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      AI Performance Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid gap-3 sm:gap-4">
                      {performance.insights.map((insight: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                          className={cn(
                            "p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 transition-all duration-200 hover:shadow-md",
                            insight.type === 'success' ? "bg-emerald-50 border-l-emerald-500 dark:bg-emerald-950/20" :
                            insight.type === 'warning' ? "bg-amber-50 border-l-amber-500 dark:bg-amber-950/20" :
                            insight.type === 'info' ? "bg-blue-50 border-l-blue-500 dark:bg-blue-950/20" :
                            "bg-slate-50 border-l-slate-500 dark:bg-slate-900/50"
                          )}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={cn(
                              "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1 flex-shrink-0",
                              insight.priority === 'high' ? "bg-red-500" :
                              insight.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                            )} />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white mb-0.5 sm:mb-1">
                                {insight.title}
                              </h5>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                {insight.message}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}