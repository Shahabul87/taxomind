"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Brain, Layers, Target, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { MultiFrameworkResult, FrameworkAnalysis, FrameworkType } from "../types";

interface MultiFrameworkRadarProps {
  data: MultiFrameworkResult | null;
  isLoading: boolean;
  onAnalyze: (frameworks?: FrameworkType[]) => void;
}

// Framework display configuration
const FRAMEWORK_CONFIG: Record<FrameworkType, { name: string; color: string; description: string }> = {
  blooms: {
    name: "Bloom&apos;s Taxonomy",
    color: "#3b82f6",
    description: "Cognitive complexity hierarchy (Remember → Create)",
  },
  dok: {
    name: "Webb&apos;s DOK",
    color: "#10b981",
    description: "Depth of Knowledge (Recall → Extended Thinking)",
  },
  solo: {
    name: "SOLO Taxonomy",
    color: "#8b5cf6",
    description: "Structure of Observed Learning Outcome",
  },
  fink: {
    name: "Fink&apos;s Significant Learning",
    color: "#f59e0b",
    description: "Interactive learning dimensions",
  },
  marzano: {
    name: "Marzano&apos;s New Taxonomy",
    color: "#ef4444",
    description: "Knowledge domains and cognitive processes",
  },
};

export function MultiFrameworkRadar({ data, isLoading, onAnalyze }: MultiFrameworkRadarProps) {
  const [expandedFramework, setExpandedFramework] = useState<FrameworkType | null>(null);
  const [selectedTab, setSelectedTab] = useState<"radar" | "details">("radar");

  // Prepare radar chart data
  const radarData = data
    ? [
        {
          framework: "Bloom&apos;s",
          score: data.primary.balanceScore * 100,
          fullMark: 100,
        },
        ...data.secondary.map((s) => ({
          framework: FRAMEWORK_CONFIG[s.framework]?.name.replace("&apos;", "'") ?? s.framework,
          score: s.balanceScore * 100,
          fullMark: 100,
        })),
      ]
    : [];

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  if (!data && !isLoading) {
    return (
      <Card className="p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <div className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Multi-Framework Analysis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Analyze your course content against 5 cognitive taxonomies: Bloom&apos;s, Webb&apos;s DOK, SOLO, Fink&apos;s, and Marzano&apos;s.
          </p>
          <Button
            onClick={() => onAnalyze()}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
          >
            <Layers className="h-4 w-4 mr-2" />
            Run Multi-Framework Analysis
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Analyzing with multiple frameworks...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Multi-Framework Analysis</h3>
          <Badge variant="outline" className="text-xs">
            {data?.metadata.frameworksUsed.length} Frameworks
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-sm font-medium", getScoreColor(data?.compositeScore ?? 0))}>
            Composite Score: {Math.round(data?.compositeScore ?? 0)}%
          </Badge>
          <Button variant="outline" size="sm" onClick={() => onAnalyze()}>
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "radar" | "details")}>
        <TabsList className="mb-4">
          <TabsTrigger value="radar">Radar View</TabsTrigger>
          <TabsTrigger value="details">Framework Details</TabsTrigger>
        </TabsList>

        {/* Radar Chart Tab */}
        <TabsContent value="radar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="h-[300px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="framework" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Radar
                    name="Balance Score"
                    dataKey="score"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${Math.round(value)}%`, "Balance Score"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(data?.crossFrameworkAlignment ?? 0)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Cross-Framework Alignment</p>
                </div>
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {data?.metadata.totalContentAnalyzed ?? 0}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Content Items Analyzed</p>
                </div>
              </div>

              {/* Framework Summary Cards */}
              <div className="space-y-2">
                {data?.primary && (
                  <FrameworkSummaryCard
                    analysis={data.primary}
                    isPrimary
                    isExpanded={expandedFramework === data.primary.framework}
                    onToggle={() =>
                      setExpandedFramework(
                        expandedFramework === data.primary.framework ? null : data.primary.framework
                      )
                    }
                  />
                )}
                {data?.secondary.slice(0, 2).map((analysis) => (
                  <FrameworkSummaryCard
                    key={analysis.framework}
                    analysis={analysis}
                    isExpanded={expandedFramework === analysis.framework}
                    onToggle={() =>
                      setExpandedFramework(
                        expandedFramework === analysis.framework ? null : analysis.framework
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Framework Details Tab */}
        <TabsContent value="details">
          <div className="space-y-4">
            {data?.primary && (
              <FrameworkDetailCard
                analysis={data.primary}
                isPrimary
                isExpanded={expandedFramework === data.primary.framework}
                onToggle={() =>
                  setExpandedFramework(
                    expandedFramework === data.primary.framework ? null : data.primary.framework
                  )
                }
              />
            )}
            {data?.secondary.map((analysis) => (
              <FrameworkDetailCard
                key={analysis.framework}
                analysis={analysis}
                isExpanded={expandedFramework === analysis.framework}
                onToggle={() =>
                  setExpandedFramework(
                    expandedFramework === analysis.framework ? null : analysis.framework
                  )
                }
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recommendations Section */}
      {data?.recommendations && data.recommendations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h4 className="font-semibold">Cross-Framework Recommendations</h4>
          </div>
          <div className="space-y-3">
            {data.recommendations.slice(0, 4).map((rec, idx) => (
              <div
                key={idx}
                className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg border-l-4"
                style={{ borderLeftColor: FRAMEWORK_CONFIG[rec.framework]?.color ?? "#6b7280" }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-medium">{rec.description}</span>
                  <Badge className={cn("text-xs", getPriorityColor(rec.priority))}>{rec.priority}</Badge>
                </div>
                {rec.actionItems && rec.actionItems.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {rec.actionItems.slice(0, 2).map((item, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// Framework Summary Card (compact)
function FrameworkSummaryCard({
  analysis,
  isPrimary,
  isExpanded,
  onToggle,
}: {
  analysis: FrameworkAnalysis;
  isPrimary?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = FRAMEWORK_CONFIG[analysis.framework];
  const scoreColor =
    analysis.balanceScore >= 0.8
      ? "text-green-600"
      : analysis.balanceScore >= 0.6
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-all",
        isPrimary
          ? "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
          : "bg-white/50 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-900/80"
      )}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config?.color }} />
          <span className="font-medium text-sm">{config?.name ?? analysis.framework}</span>
          {isPrimary && (
            <Badge variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900/30">
              Primary
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("font-semibold", scoreColor)}>
            {Math.round(analysis.balanceScore * 100)}%
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{config?.description}</p>
          <div className="flex items-center gap-2 text-xs">
            <span>Dominant Level:</span>
            <Badge variant="outline">{analysis.dominantLevel}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// Framework Detail Card (expanded)
function FrameworkDetailCard({
  analysis,
  isPrimary,
  isExpanded,
  onToggle,
}: {
  analysis: FrameworkAnalysis;
  isPrimary?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = FRAMEWORK_CONFIG[analysis.framework];

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        isPrimary
          ? "border-purple-300 dark:border-purple-700"
          : "border-gray-200 dark:border-gray-700"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 cursor-pointer",
          isPrimary
            ? "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
            : "bg-white/50 dark:bg-slate-900/50"
        )}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${config?.color}20` }}
            >
              <Brain className="h-5 w-5" style={{ color: config?.color }} />
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                {config?.name ?? analysis.framework}
                {isPrimary && (
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    Primary
                  </Badge>
                )}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">{config?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p
                className={cn(
                  "text-lg font-bold",
                  analysis.balanceScore >= 0.8
                    ? "text-green-600"
                    : analysis.balanceScore >= 0.6
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              >
                {Math.round(analysis.balanceScore * 100)}%
              </p>
              <p className="text-xs text-gray-500">Balance</p>
            </div>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-slate-900/30">
          {/* Distribution */}
          <div className="mb-4">
            <h5 className="text-sm font-medium mb-2">Level Distribution</h5>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(analysis.distribution).map(([level, value]) => (
                <div
                  key={level}
                  className="p-2 bg-white/50 dark:bg-slate-900/50 rounded text-center"
                >
                  <p className="text-xs font-medium truncate" title={level}>
                    {level.replace(/_/g, " ")}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      value >= 20 ? "text-green-600" : value >= 10 ? "text-yellow-600" : "text-red-600"
                    )}
                  >
                    {Math.round(value)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Level Analysis */}
          {analysis.levelAnalysis && analysis.levelAnalysis.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Level Analysis</h5>
              <div className="space-y-2">
                {analysis.levelAnalysis.map((level) => (
                  <div
                    key={level.level}
                    className={cn(
                      "p-2 rounded flex items-center justify-between",
                      level.status === "under"
                        ? "bg-red-50/50 dark:bg-red-900/20"
                        : level.status === "over"
                        ? "bg-yellow-50/50 dark:bg-yellow-900/20"
                        : "bg-green-50/50 dark:bg-green-900/20"
                    )}
                  >
                    <span className="text-sm font-medium">{level.level.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{Math.round(level.percentage)}%</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          level.status === "under"
                            ? "border-red-300 text-red-600"
                            : level.status === "over"
                            ? "border-yellow-300 text-yellow-600"
                            : "border-green-300 text-green-600"
                        )}
                      >
                        {level.deviation > 0 ? "+" : ""}
                        {Math.round(level.deviation)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
