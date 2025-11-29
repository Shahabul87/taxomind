"use client";

import { Card } from "@/components/ui/card";
import { Brain, BarChart3, Layers, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getScoreColor, getProgressColor, getMetricColorClasses } from "../utils";
import type { Scores } from "../types";

interface ScoreDashboardProps {
  scores: Scores;
  overallScore: number;
}

export function ScoreDashboard({ scores, overallScore }: ScoreDashboardProps) {
  const scoreMetrics = [
    { label: "Cognitive Depth", score: scores.depth, icon: Brain, color: "cyan" as const, delay: 0.2 },
    { label: "Content Balance", score: scores.balance, icon: BarChart3, color: "emerald" as const, delay: 0.3 },
    { label: "Complexity", score: scores.complexity, icon: Layers, color: "amber" as const, delay: 0.4 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Overall Score - Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="col-span-2 lg:col-span-1"
      >
        <Card className="relative overflow-hidden h-full p-4 sm:p-5 backdrop-blur-xl bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-purple-500/10 dark:from-violet-500/20 dark:via-indigo-500/10 dark:to-purple-500/20 border-violet-200/50 dark:border-violet-700/50 shadow-xl shadow-violet-500/5 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-500 group">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-bl-full" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-violet-500/20 rounded-lg">
                <Award className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                Overall Score
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <motion.span
                className={cn("text-4xl sm:text-5xl font-bold", getScoreColor(overallScore))}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {overallScore}
              </motion.span>
              <span className="text-lg text-slate-400 dark:text-slate-500 font-medium">
                /100
              </span>
            </div>

            {/* Custom progress bar */}
            <div className="mt-3 h-2 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", getProgressColor(overallScore))}
                initial={{ width: 0 }}
                animate={{ width: `${overallScore}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {overallScore >= 80
                ? "Excellent quality"
                : overallScore >= 60
                ? "Good progress"
                : "Needs improvement"}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Individual Score Cards */}
      {scoreMetrics.map((metric) => {
        const colorClasses = getMetricColorClasses(metric.color);

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: metric.delay }}
          >
            <Card
              className={cn(
                "relative overflow-hidden h-full p-3 sm:p-4 backdrop-blur-xl border shadow-lg hover:shadow-xl transition-all duration-300 group",
                colorClasses.card
              )}
            >
              {/* Mini decorative element */}
              <div
                className={cn(
                  "absolute top-0 right-0 w-12 h-12 rounded-bl-2xl opacity-50",
                  colorClasses.accent
                )}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-1.5 rounded-lg", colorClasses.iconBg)}>
                    <metric.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", colorClasses.icon)} />
                  </div>
                  <span className={cn("text-2xl sm:text-3xl font-bold", getScoreColor(metric.score))}>
                    {metric.score}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                  {metric.label}
                </p>

                {/* Slim progress bar */}
                <div className="h-1.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", getProgressColor(metric.score))}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.score}%` }}
                    transition={{ duration: 0.8, delay: metric.delay + 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
