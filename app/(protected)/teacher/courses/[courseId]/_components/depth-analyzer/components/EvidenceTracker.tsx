"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  Shield,
  Eye,
  Filter,
  FileText,
  Video,
  Target,
  BookOpen,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { EvidenceData, EvidenceItem, FrameworkType } from "../types";

interface EvidenceTrackerProps {
  data: EvidenceData | null;
  isLoading: boolean;
  onFetch: (confidenceThreshold?: number) => void;
}

const CONFIDENCE_COLORS = {
  high: "#22c55e",
  medium: "#eab308",
  low: "#ef4444",
};

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  objective: Target,
  section: BookOpen,
  assessment: FileText,
  transcript: Video,
  attachment: FileText,
};

const FRAMEWORK_COLORS: Record<FrameworkType, string> = {
  blooms: "#3b82f6",
  dok: "#10b981",
  solo: "#8b5cf6",
  fink: "#f59e0b",
  marzano: "#ef4444",
};

export function EvidenceTracker({ data, isLoading, onFetch }: EvidenceTrackerProps) {
  const [confidenceFilter, setConfidenceFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [minConfidence, setMinConfidence] = useState(0.5);

  // Prepare pie chart data for confidence distribution
  const confidencePieData = data
    ? [
        { name: "High (80%+)", value: data.confidenceDistribution.high, color: CONFIDENCE_COLORS.high },
        { name: "Medium (50-79%)", value: data.confidenceDistribution.medium, color: CONFIDENCE_COLORS.medium },
        { name: "Low (<50%)", value: data.confidenceDistribution.low, color: CONFIDENCE_COLORS.low },
      ]
    : [];

  // Filter evidence based on confidence level
  const filteredEvidence = data?.topEvidence.filter((item) => {
    if (confidenceFilter === "all") return true;
    if (confidenceFilter === "high") return item.confidence >= 0.8;
    if (confidenceFilter === "medium") return item.confidence >= 0.5 && item.confidence < 0.8;
    return item.confidence < 0.5;
  });

  if (!data && !isLoading) {
    return (
      <Card className="p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Evidence &amp; Confidence Tracker</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Track analysis evidence with confidence scores. Understand how reliably each cognitive level was identified in your course content.
          </p>
          <Button
            onClick={() => onFetch(0.5)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Load Evidence Summary
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Loading evidence data...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Evidence Tracker</h3>
          <Badge variant="outline" className="text-xs">
            {data?.totalEvidence ?? 0} Evidence Items
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => onFetch(minConfidence)}>
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{data?.totalEvidence ?? 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Evidence</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p
            className={cn(
              "text-2xl font-bold",
              (data?.avgConfidence ?? 0) >= 0.8
                ? "text-green-600"
                : (data?.avgConfidence ?? 0) >= 0.5
                ? "text-yellow-600"
                : "text-red-600"
            )}
          >
            {Math.round((data?.avgConfidence ?? 0) * 100)}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Avg Confidence</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">{data?.confidenceDistribution.high ?? 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">High Confidence</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{data?.confidenceDistribution.low ?? 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Low Confidence</p>
        </div>
      </div>

      {/* Overall Confidence Meter */}
      <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Analysis Confidence</span>
          <span
            className={cn(
              "text-sm font-bold",
              (data?.avgConfidence ?? 0) >= 0.8
                ? "text-green-600"
                : (data?.avgConfidence ?? 0) >= 0.5
                ? "text-yellow-600"
                : "text-red-600"
            )}
          >
            {Math.round((data?.avgConfidence ?? 0) * 100)}%
          </span>
        </div>
        <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all",
              (data?.avgConfidence ?? 0) >= 0.8
                ? "bg-gradient-to-r from-green-400 to-green-600"
                : (data?.avgConfidence ?? 0) >= 0.5
                ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                : "bg-gradient-to-r from-red-400 to-red-600"
            )}
            style={{ width: `${(data?.avgConfidence ?? 0) * 100}%` }}
          />
          {/* Threshold markers */}
          <div className="absolute inset-y-0 left-[50%] w-0.5 bg-gray-400 dark:bg-gray-500" />
          <div className="absolute inset-y-0 left-[80%] w-0.5 bg-gray-400 dark:bg-gray-500" />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>80%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Distribution Pie Chart */}
        <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Confidence Distribution
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={confidencePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {confidencePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value, "Count"]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Filter & Threshold */}
        <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Evidence
          </h4>

          {/* Confidence Level Filter */}
          <div className="mb-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Confidence Level</p>
            <div className="flex flex-wrap gap-2">
              {["all", "high", "medium", "low"].map((level) => (
                <Button
                  key={level}
                  variant={confidenceFilter === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConfidenceFilter(level as typeof confidenceFilter)}
                  className={cn({
                    "bg-green-500 hover:bg-green-600": confidenceFilter === level && level === "high",
                    "bg-yellow-500 hover:bg-yellow-600": confidenceFilter === level && level === "medium",
                    "bg-red-500 hover:bg-red-600": confidenceFilter === level && level === "low",
                  })}
                >
                  {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Minimum Confidence Threshold */}
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Minimum Confidence Threshold: {Math.round(minConfidence * 100)}%
            </p>
            <Slider
              value={[minConfidence]}
              onValueChange={(value) => setMinConfidence(value[0])}
              min={0}
              max={1}
              step={0.05}
              className="mb-2"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFetch(minConfidence)}
              className="w-full"
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Evidence Cards */}
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Top Evidence ({filteredEvidence?.length ?? 0})
          </span>
          <Badge variant="outline" className="text-xs">
            Showing top {Math.min(filteredEvidence?.length ?? 0, 10)}
          </Badge>
        </h4>

        <div className="space-y-3">
          {filteredEvidence?.slice(0, 10).map((item, idx) => (
            <EvidenceCard key={idx} evidence={item} />
          ))}
          {(!filteredEvidence || filteredEvidence.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No evidence found matching the current filter.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Evidence Card Component
function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
  const Icon = SOURCE_ICONS[evidence.sourceType] ?? FileText;
  const confidenceColor =
    evidence.confidence >= 0.8
      ? "text-green-600"
      : evidence.confidence >= 0.5
      ? "text-yellow-600"
      : "text-red-600";
  const frameworkColor = FRAMEWORK_COLORS[evidence.framework] ?? "#6b7280";

  return (
    <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        {/* Source Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${frameworkColor}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: frameworkColor }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {evidence.framework}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs"
                style={{ borderColor: frameworkColor, color: frameworkColor }}
              >
                {evidence.level}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  evidence.confidence >= 0.8
                    ? "bg-green-500"
                    : evidence.confidence >= 0.5
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
              />
              <span className={cn("text-sm font-semibold", confidenceColor)}>
                {Math.round(evidence.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Evidence Text */}
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
            &ldquo;{evidence.text}&rdquo;
          </p>

          {/* Source Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {evidence.sourceType}
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{evidence.sourceTitle}</span>
          </div>

          {/* Keywords */}
          {evidence.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {evidence.keywords.slice(0, 5).map((keyword, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs py-0 px-1">
                  {keyword}
                </Badge>
              ))}
              {evidence.keywords.length > 5 && (
                <Badge variant="secondary" className="text-xs py-0 px-1">
                  +{evidence.keywords.length - 5}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mt-3">
        <Progress
          value={evidence.confidence * 100}
          className={cn(
            "h-1",
            evidence.confidence >= 0.8
              ? "[&>div]:bg-green-500"
              : evidence.confidence >= 0.5
              ? "[&>div]:bg-yellow-500"
              : "[&>div]:bg-red-500"
          )}
        />
      </div>
    </div>
  );
}
