"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  BarChart3,
  Layers,
  Target,
  TrendingUp,
  Award,
  Lightbulb,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BloomsPyramidVisualization } from "@/app/(protected)/teacher/courses/[courseId]/_components/blooms-pyramid-visualization";

// Types
interface Section {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  position: number;
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  position: number;
  sections: Section[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  updatedAt: Date;
  whatYouWillLearn: string[];
  chapters: Chapter[];
}

type AnalysisLevel = "course" | "chapter" | "section";

interface AnalysisResultsPanelProps {
  analysisLevel: AnalysisLevel;
  result: any;
  selectedCourse?: Course;
  selectedChapter?: Chapter;
  selectedSection?: Section;
}

export function AnalysisResultsPanel({
  analysisLevel,
  result,
  selectedCourse,
  selectedChapter,
  selectedSection,
}: AnalysisResultsPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Extract analysis data
  const analysis = result?.analysis;
  const isEnhanced = result?.enhanced;

  if (!analysis) {
    return (
      <Card className="p-8 text-center backdrop-blur-xl bg-white/80 dark:bg-slate-800/80">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No Analysis Data
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Unable to load analysis results. Please try again.
        </p>
      </Card>
    );
  }

  // Calculate overall score
  const scores = analysis.scores || {};
  const overallScore = Math.round(
    ((scores.depth || 0) +
      (scores.balance || 0) +
      (scores.complexity || 0) +
      (scores.completeness || 0)) /
      4
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-green-400";
    if (score >= 60) return "from-amber-500 to-yellow-400";
    return "from-red-500 to-rose-400";
  };

  // Get title based on analysis level
  const getTitle = () => {
    switch (analysisLevel) {
      case "course":
        return selectedCourse?.title || "Course";
      case "chapter":
        return selectedChapter?.title || "Chapter";
      case "section":
        return selectedSection?.title || "Section";
    }
  };

  const getLevelIcon = () => {
    switch (analysisLevel) {
      case "course":
        return BookOpen;
      case "chapter":
        return Layers;
      case "section":
        return FileText;
    }
  };

  const LevelIcon = getLevelIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Results Header */}
      <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-xl">
        <div className="p-6 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Left: Title and info */}
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg">
                <LevelIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className="text-xs uppercase tracking-wide"
                  >
                    {analysisLevel} Analysis
                  </Badge>
                  {isEnhanced && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Enhanced
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {getTitle()}
                </h2>
                {analysisLevel !== "course" && selectedCourse && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    From: {selectedCourse.title}
                    {analysisLevel === "section" &&
                      selectedChapter &&
                      ` > ${selectedChapter.title}`}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Overall Score */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 251.2" }}
                      animate={{
                        strokeDasharray: `${(overallScore / 100) * 251.2} 251.2`,
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient
                        id="scoreGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          stopColor={
                            overallScore >= 80
                              ? "#10b981"
                              : overallScore >= 60
                              ? "#f59e0b"
                              : "#ef4444"
                          }
                        />
                        <stop
                          offset="100%"
                          stopColor={
                            overallScore >= 80
                              ? "#22c55e"
                              : overallScore >= 60
                              ? "#eab308"
                              : "#f87171"
                          }
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={cn(
                        "text-3xl font-bold",
                        getScoreColor(overallScore)
                      )}
                    >
                      {overallScore}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
                  Overall Score
                </p>
              </div>

              {/* Export button */}
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Score Cards */}
        <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Cognitive Depth",
                score: scores.depth || 0,
                icon: Brain,
                color: "cyan",
              },
              {
                label: "Content Balance",
                score: scores.balance || 0,
                icon: BarChart3,
                color: "emerald",
              },
              {
                label: "Complexity",
                score: scores.complexity || 0,
                icon: Layers,
                color: "amber",
              },
              {
                label: "Completeness",
                score: scores.completeness || 0,
                icon: Target,
                color: "purple",
              },
            ].map((metric) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-300 hover:shadow-md",
                  metric.color === "cyan" &&
                    "bg-cyan-50/50 dark:bg-cyan-900/10 border-cyan-200/50 dark:border-cyan-800/50",
                  metric.color === "emerald" &&
                    "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/50",
                  metric.color === "amber" &&
                    "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/50",
                  metric.color === "purple" &&
                    "bg-purple-50/50 dark:bg-purple-900/10 border-purple-200/50 dark:border-purple-800/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <metric.icon
                    className={cn(
                      "h-5 w-5",
                      metric.color === "cyan" && "text-cyan-500",
                      metric.color === "emerald" && "text-emerald-500",
                      metric.color === "amber" && "text-amber-500",
                      metric.color === "purple" && "text-purple-500"
                    )}
                  />
                  <span
                    className={cn("text-2xl font-bold", getScoreColor(metric.score))}
                  >
                    {metric.score}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {metric.label}
                </p>
                <Progress
                  value={metric.score}
                  className="h-1.5 mt-2"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 shadow-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-slate-200/50 dark:border-slate-700/50">
            <TabsList className="w-full justify-start gap-2 px-4 py-2 bg-transparent">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="distribution"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
              >
                Distribution
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
              >
                Recommendations
              </TabsTrigger>
              {analysis.gaps && analysis.gaps.length > 0 && (
                <TabsTrigger
                  value="gaps"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
                >
                  Gaps
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {analysis.gaps.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bloom's Pyramid */}
              {analysis.overallDistribution && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Bloom&apos;s Taxonomy Distribution
                  </h3>
                  <BloomsPyramidVisualization
                    distribution={analysis.overallDistribution}
                  />
                </div>
              )}

              {/* Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Key Insights
                  </h3>
                  <div className="space-y-3">
                    {analysis.insights.slice(0, 5).map((insight: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <TrendingUp className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {insight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="p-6">
            {analysis.overallDistribution && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Cognitive Level Distribution
                </h3>
                {Object.entries(analysis.overallDistribution).map(
                  ([level, percentage]: [string, any]) => (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {level}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                )}
              </div>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="p-6">
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              <div className="space-y-4">
                {analysis.recommendations.map((rec: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-xl border",
                      rec.priority === "high" &&
                        "bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/50",
                      rec.priority === "medium" &&
                        "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/50",
                      rec.priority === "low" &&
                        "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          rec.priority === "high" && "bg-red-500/20",
                          rec.priority === "medium" && "bg-amber-500/20",
                          rec.priority === "low" && "bg-blue-500/20"
                        )}
                      >
                        <Lightbulb
                          className={cn(
                            "h-5 w-5",
                            rec.priority === "high" && "text-red-500",
                            rec.priority === "medium" && "text-amber-500",
                            rec.priority === "low" && "text-blue-500"
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {rec.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              rec.priority === "high" &&
                                "border-red-300 text-red-600",
                              rec.priority === "medium" &&
                                "border-amber-300 text-amber-600",
                              rec.priority === "low" &&
                                "border-blue-300 text-blue-600"
                            )}
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {rec.description}
                        </p>
                        {rec.examples && rec.examples.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Examples:
                            </p>
                            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                              {rec.examples.slice(0, 2).map((ex: string, i: number) => (
                                <li key={i}>{ex}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  No Recommendations
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Great job! Your content looks well-balanced.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Gaps Tab */}
          <TabsContent value="gaps" className="p-6">
            {analysis.gaps && analysis.gaps.length > 0 ? (
              <div className="space-y-4">
                {analysis.gaps.map((gap: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-xl border",
                      gap.severity === "high" &&
                        "bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/50",
                      gap.severity === "medium" &&
                        "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/50",
                      gap.severity === "low" &&
                        "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-800/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          gap.severity === "high" && "text-red-500",
                          gap.severity === "medium" && "text-amber-500",
                          gap.severity === "low" && "text-blue-500"
                        )}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 dark:text-white capitalize">
                            {gap.level} Level
                          </span>
                          <Badge
                            variant={
                              gap.severity === "high" ? "destructive" : "secondary"
                            }
                            className="text-xs"
                          >
                            {gap.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {gap.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  No Gaps Detected
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Your content covers all cognitive levels well.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
