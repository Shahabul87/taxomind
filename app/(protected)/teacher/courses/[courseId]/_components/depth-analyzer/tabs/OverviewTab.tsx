"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TabsContent } from "@/components/ui/tabs";
import {
  Brain,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Target,
  BookOpen,
  TrendingUp,
  Compass,
  Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BloomsPyramidVisualization } from "../../blooms-pyramid-visualization";
import { DepthInsightsPanel } from "../../depth-insights-panel";
import { getScoreColor, getMatchColor, getMetricColorClasses, DOK_LABELS } from "../utils";
import type { AnalysisData, CourseData } from "../types";

interface OverviewTabProps {
  analysisData: AnalysisData;
  courseData: CourseData;
  overallScore: number;
  onAskSam: (context: string) => void;
}

export function OverviewTab({
  analysisData,
  courseData,
  overallScore,
  onAskSam,
}: OverviewTabProps) {
  return (
    <TabsContent value="overview" className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-5 md:mt-6">
      {/* Premium Course Health Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {/* Cognitive Health Card - Premium Radial Chart */}
        <CognitiveHealthCard scores={analysisData.scores} overallScore={overallScore} />

        {/* Bloom's Insights Card */}
        <BloomsInsightsCard bloomsInsights={analysisData.bloomsInsights} />
      </div>

      {/* Bloom's Pyramid */}
      <BloomsPyramidVisualization
        distribution={analysisData.overallDistribution}
        onLevelClick={(level) => onAskSam(`How can I add more ${level} level activities to my course?`)}
      />

      {/* Enhanced Signals */}
      {(analysisData.dokDistribution || analysisData.courseType || analysisData.assessmentQuality) && (
        <EnhancedSignals analysisData={analysisData} />
      )}

      {/* Key Insights */}
      <DepthInsightsPanel
        insights={analysisData.insights || []}
        gaps={analysisData.gaps}
        onAskSam={onAskSam}
      />

      {/* Quick Stats */}
      <QuickStatsGrid analysisData={analysisData} courseData={courseData} />
    </TabsContent>
  );
}

// Sub-components

function CognitiveHealthCard({
  scores,
  overallScore,
}: {
  scores: AnalysisData["scores"];
  overallScore: number;
}) {
  return (
    <Card className="relative overflow-hidden p-4 sm:p-5 md:p-6 backdrop-blur-xl bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/50 dark:from-slate-800 dark:via-violet-900/20 dark:to-indigo-900/20 border-violet-200/50 dark:border-violet-800/50 shadow-xl shadow-violet-500/5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-tr-full" />

      <h3 className="relative text-sm sm:text-base md:text-lg font-bold mb-4 sm:mb-5 flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg shadow-lg shadow-violet-500/20">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-violet-700 to-indigo-700 dark:from-violet-300 dark:to-indigo-300 bg-clip-text text-transparent">
          Cognitive Health Score
        </span>
      </h3>

      <div className="relative flex flex-col items-center">
        {/* Premium Multi-ring Score Visualization */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48">
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-xl opacity-40",
              overallScore >= 80 ? "bg-emerald-500/30" : overallScore >= 60 ? "bg-amber-500/30" : "bg-rose-500/30"
            )}
          />

          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200/50 dark:text-slate-700/50" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200/40 dark:text-slate-700/40" />
            <circle cx="50" cy="50" r="31" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200/30 dark:text-slate-700/30" />

            <motion.circle
              cx="50" cy="50" r="45" fill="none" strokeWidth="4" strokeLinecap="round"
              stroke="url(#gradientDepth)"
              strokeDasharray={`${2 * Math.PI * 45}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - scores.depth / 100) }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            />

            <motion.circle
              cx="50" cy="50" r="38" fill="none" strokeWidth="4" strokeLinecap="round"
              stroke="url(#gradientBalance)"
              strokeDasharray={`${2 * Math.PI * 38}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - scores.balance / 100) }}
              transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
            />

            <motion.circle
              cx="50" cy="50" r="31" fill="none" strokeWidth="4" strokeLinecap="round"
              stroke="url(#gradientComplexity)"
              strokeDasharray={`${2 * Math.PI * 31}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 31 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 31 * (1 - scores.complexity / 100) }}
              transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
            />

            <defs>
              <linearGradient id="gradientDepth" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="gradientBalance" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="gradientComplexity" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={cn("text-3xl sm:text-4xl md:text-5xl font-bold", getScoreColor(overallScore))}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {overallScore}
            </motion.span>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              out of 100
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-4 sm:mt-5">
          {[
            { label: "Depth", score: scores.depth, color: "violet" },
            { label: "Balance", score: scores.balance, color: "cyan" },
            { label: "Complexity", score: scores.complexity, color: "emerald" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  item.color === "violet" && "bg-gradient-to-r from-violet-500 to-indigo-500",
                  item.color === "cyan" && "bg-gradient-to-r from-cyan-500 to-blue-500",
                  item.color === "emerald" && "bg-gradient-to-r from-emerald-500 to-green-500"
                )}
              />
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {item.label}: <span className={cn("font-semibold", getScoreColor(item.score))}>{item.score}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function BloomsInsightsCard({ bloomsInsights }: { bloomsInsights?: AnalysisData["bloomsInsights"] }) {
  return (
    <Card className="relative overflow-hidden p-4 sm:p-5 md:p-6 backdrop-blur-xl bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/50 dark:from-slate-800 dark:via-cyan-900/20 dark:to-blue-900/20 border-cyan-200/50 dark:border-cyan-800/50 shadow-xl shadow-cyan-500/5">
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-xl" />

      <h3 className="relative text-sm sm:text-base md:text-lg font-bold mb-4 sm:mb-5 flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-lg shadow-cyan-500/20">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-cyan-700 to-blue-700 dark:from-cyan-300 dark:to-blue-300 bg-clip-text text-transparent">
          Bloom&apos;s Taxonomy Insights
        </span>
      </h3>

      {bloomsInsights ? (
        <div className="relative space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl backdrop-blur-sm border border-cyan-200/30 dark:border-cyan-700/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">Dominant Level</p>
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 text-xs shadow-sm">
                {bloomsInsights.dominantLevel}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Your course primarily focuses on{" "}
              <span className="font-medium text-cyan-600 dark:text-cyan-400">
                {bloomsInsights.dominantLevel.toLowerCase()}
              </span>{" "}
              level activities
            </p>
          </div>

          {bloomsInsights.missingLevels.length > 0 && (
            <div className="p-3 sm:p-4 bg-amber-50/80 dark:bg-amber-900/30 rounded-xl backdrop-blur-sm border border-amber-200/50 dark:border-amber-700/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-200">Missing Levels</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {bloomsInsights.missingLevels.map((level, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30"
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 sm:p-4 bg-emerald-50/80 dark:bg-emerald-900/30 rounded-xl backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200">Balance Score</p>
              </div>
              <span className={cn("text-lg sm:text-xl font-bold", getScoreColor(bloomsInsights.balanceScore))}>
                {bloomsInsights.balanceScore}%
              </span>
            </div>
            <div className="h-2 bg-emerald-200/50 dark:bg-emerald-800/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${bloomsInsights.balanceScore}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl animate-pulse">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Analyzing Bloom&apos;s taxonomy distribution...
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function EnhancedSignals({ analysisData }: { analysisData: AnalysisData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      <Card className="p-3 sm:p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-purple-600" />
            <p className="text-xs sm:text-sm font-semibold">Course Type Fit</p>
          </div>
          <span className={cn("text-sm sm:text-base font-bold", getMatchColor(analysisData.courseTypeMatch))}>
            {analysisData.courseTypeMatch ? `${Math.round(analysisData.courseTypeMatch)}%` : "—"}
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mb-2">
          {analysisData.courseType
            ? analysisData.courseType.charAt(0).toUpperCase() + analysisData.courseType.slice(1)
            : "Unknown type"}
        </p>
        <Progress value={analysisData.courseTypeMatch || 0} className="h-1.5" />
      </Card>

      {analysisData.dokDistribution && (
        <Card className="p-3 sm:p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            <p className="text-xs sm:text-sm font-semibold">Webb&apos;s DOK Spread</p>
          </div>
          <div className="space-y-1">
            {["level1", "level2", "level3", "level4"].map((levelKey, idx) => {
              const value = (analysisData.dokDistribution as Record<string, number>)[levelKey] || 0;
              return (
                <div key={levelKey} className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span>
                    {idx + 1}. {DOK_LABELS[levelKey]}
                  </span>
                  <span className="font-semibold">{Math.round(value)}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {analysisData.assessmentQuality && (
        <Card className="p-3 sm:p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Brain className="h-4 w-4 text-green-600" />
            <span className={cn("text-sm sm:text-base font-bold", getMatchColor(analysisData.assessmentQuality.overallScore))}>
              {Math.round(analysisData.assessmentQuality.overallScore || 0)}%
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1">Assessment Quality</p>
          <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
            <span>Variety: {analysisData.assessmentQuality.questionVariety?.score ?? 0}%</span>
            <span>Difficulty: {analysisData.assessmentQuality.difficultyProgression?.score ?? 0}%</span>
            <span>Coverage: {analysisData.assessmentQuality.bloomsCoverage?.score ?? 0}%</span>
            <span>Feedback: {analysisData.assessmentQuality.feedbackQuality?.score ?? 0}%</span>
          </div>
        </Card>
      )}
    </div>
  );
}

function QuickStatsGrid({
  analysisData,
  courseData,
}: {
  analysisData: AnalysisData;
  courseData: CourseData;
}) {
  const stats = [
    {
      label: "Learning Objectives",
      value: courseData.whatYouWillLearn?.length || 0,
      icon: Target,
      color: "blue" as const,
      description: "Course goals defined",
    },
    {
      label: "Chapters",
      value: courseData.chapters.length,
      icon: BookOpen,
      color: "emerald" as const,
      description: "Content modules",
    },
    {
      label: "Dominant Level",
      value: `${Math.max(...Object.values(analysisData.overallDistribution))}%`,
      icon: TrendingUp,
      color: "violet" as const,
      description: "Peak cognitive focus",
    },
    {
      label: "Critical Gaps",
      value: analysisData.gaps.filter((g) => g.severity === "high").length,
      icon: AlertCircle,
      color: analysisData.gaps.filter((g) => g.severity === "high").length > 0 ? ("amber" as const) : ("emerald" as const),
      description: analysisData.gaps.filter((g) => g.severity === "high").length > 0 ? "Needs attention" : "All clear",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, idx) => {
        const colorClasses = getMetricColorClasses(stat.color);

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
          >
            <Card
              className={cn(
                "group relative overflow-hidden p-3 sm:p-4 backdrop-blur-xl border shadow-lg hover:shadow-xl transition-all duration-300 cursor-default",
                colorClasses.card
              )}
            >
              <div
                className={cn(
                  "absolute top-0 right-0 w-16 h-16 rounded-bl-3xl opacity-50 transition-opacity group-hover:opacity-70",
                  colorClasses.accent
                )}
              />

              <div className="relative flex items-start justify-between">
                <div className={cn("p-2 rounded-xl shadow-sm", colorClasses.iconBg)}>
                  <stat.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", colorClasses.icon)} />
                </div>
                <motion.span
                  className={cn("text-2xl sm:text-3xl font-bold", colorClasses.icon)}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 * idx + 0.3 }}
                >
                  {stat.value}
                </motion.span>
              </div>

              <div className="relative mt-2">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">{stat.label}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.description}</p>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
