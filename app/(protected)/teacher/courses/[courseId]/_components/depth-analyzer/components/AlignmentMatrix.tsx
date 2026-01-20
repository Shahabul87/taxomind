"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Grid3X3,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Link2,
  FileText,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlignmentMatrixData, ObjectiveAlignmentItem, AlignmentGapItem } from "../types";

interface AlignmentMatrixProps {
  data: AlignmentMatrixData | null;
  isLoading: boolean;
  onFetch: () => void;
}

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case "critical":
      return {
        color: "text-red-600",
        bg: "bg-red-50/50 dark:bg-red-900/20",
        border: "border-red-500",
        icon: XCircle,
      };
    case "high":
      return {
        color: "text-orange-600",
        bg: "bg-orange-50/50 dark:bg-orange-900/20",
        border: "border-orange-500",
        icon: AlertTriangle,
      };
    case "medium":
      return {
        color: "text-yellow-600",
        bg: "bg-yellow-50/50 dark:bg-yellow-900/20",
        border: "border-yellow-500",
        icon: AlertTriangle,
      };
    default:
      return {
        color: "text-blue-600",
        bg: "bg-blue-50/50 dark:bg-blue-900/20",
        border: "border-blue-500",
        icon: AlertTriangle,
      };
  }
};

const getAlignmentColor = (score: number): string => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
};

const getAlignmentTextColor = (score: number): string => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
};

export function AlignmentMatrix({ data, isLoading, onFetch }: AlignmentMatrixProps) {
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"matrix" | "gaps">("matrix");

  if (!data && !isLoading) {
    return (
      <Card className="p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <div className="text-center py-8">
          <Grid3X3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Objective-Content Alignment Matrix</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Visualize how your learning objectives align with course content and assessments. Identify gaps and ensure comprehensive coverage.
          </p>
          <Button
            onClick={onFetch}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Generate Alignment Matrix
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Analyzing objective-content alignment...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Alignment Matrix</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "matrix" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("matrix")}
          >
            Matrix
          </Button>
          <Button
            variant={viewMode === "gaps" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("gaps")}
          >
            Gaps ({data?.gaps.length ?? 0})
          </Button>
          <Button variant="outline" size="sm" onClick={onFetch}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <Target className="h-5 w-5 mx-auto text-blue-600 mb-1" />
          <p className="text-xl font-bold">{data?.summary.totalObjectives ?? 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Objectives</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-1" />
          <p className="text-xl font-bold text-green-600">{data?.summary.objectivesCovered ?? 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Covered</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <AlertTriangle className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
          <p className="text-xl font-bold text-yellow-600">{data?.summary.objectivesWithGaps ?? 0}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">With Gaps</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p
            className={cn(
              "text-xl font-bold",
              getAlignmentTextColor(data?.summary.overallAlignmentScore ?? 0)
            )}
          >
            {Math.round(data?.summary.overallAlignmentScore ?? 0)}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Overall Alignment</p>
        </div>
      </div>

      {/* Coverage Progress */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Content Coverage
            </span>
            <span className={cn("text-sm font-bold", getAlignmentTextColor(data?.summary.contentCoverage ?? 0))}>
              {Math.round(data?.summary.contentCoverage ?? 0)}%
            </span>
          </div>
          <Progress value={data?.summary.contentCoverage ?? 0} className="h-2" />
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              Assessment Coverage
            </span>
            <span className={cn("text-sm font-bold", getAlignmentTextColor(data?.summary.assessmentCoverage ?? 0))}>
              {Math.round(data?.summary.assessmentCoverage ?? 0)}%
            </span>
          </div>
          <Progress value={data?.summary.assessmentCoverage ?? 0} className="h-2" />
        </div>
      </div>

      {/* Matrix View */}
      {viewMode === "matrix" && (
        <div className="space-y-3">
          {data?.objectives.map((objective) => (
            <ObjectiveAlignmentCard
              key={objective.objectiveId}
              objective={objective}
              isExpanded={expandedObjective === objective.objectiveId}
              onToggle={() =>
                setExpandedObjective(
                  expandedObjective === objective.objectiveId ? null : objective.objectiveId
                )
              }
            />
          ))}
          {(!data?.objectives || data.objectives.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No learning objectives found. Add objectives to your course to see alignment.</p>
            </div>
          )}
        </div>
      )}

      {/* Gaps View */}
      {viewMode === "gaps" && (
        <div className="space-y-3">
          {data?.gaps.map((gap, idx) => (
            <GapCard key={idx} gap={gap} />
          ))}
          {(!data?.gaps || data.gaps.length === 0) && (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
              <p className="text-green-600 font-medium">No alignment gaps detected!</p>
              <p className="text-sm text-gray-500">Your objectives are well-covered by content and assessments.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Objective Alignment Card
function ObjectiveAlignmentCard({
  objective,
  isExpanded,
  onToggle,
}: {
  objective: ObjectiveAlignmentItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasGaps = objective.gaps.length > 0;
  const alignmentColor = getAlignmentColor(objective.overallAlignment);
  const textColor = getAlignmentTextColor(objective.overallAlignment);

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        hasGaps
          ? "border-yellow-300 dark:border-yellow-700"
          : "border-green-300 dark:border-green-700"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 cursor-pointer rounded-t-lg",
          hasGaps
            ? "bg-yellow-50/50 dark:bg-yellow-900/10"
            : "bg-green-50/50 dark:bg-green-900/10"
        )}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{objective.objectiveText}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {objective.linkedSections.length} Sections
              </Badge>
              <Badge variant="outline" className="text-xs">
                {objective.linkedAssessments.length} Assessments
              </Badge>
              {hasGaps && (
                <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {objective.gaps.length} Gaps
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Alignment Score */}
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", alignmentColor)} />
              <span className={cn("font-semibold", textColor)}>
                {Math.round(objective.overallAlignment)}%
              </span>
            </div>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-slate-900/30 rounded-b-lg">
          {/* Linked Sections */}
          {objective.linkedSections.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Linked Sections
              </h5>
              <div className="space-y-2">
                {objective.linkedSections.map((section) => (
                  <div
                    key={section.sectionId}
                    className="p-2 bg-white/50 dark:bg-slate-900/50 rounded flex items-center justify-between"
                  >
                    <span className="text-sm truncate flex-1">{section.sectionTitle}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2 h-2 rounded-full", getAlignmentColor(section.alignmentScore))}
                      />
                      <span className={cn("text-xs font-medium", getAlignmentTextColor(section.alignmentScore))}>
                        {Math.round(section.alignmentScore)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Assessments */}
          {objective.linkedAssessments.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                <ClipboardList className="h-4 w-4" />
                Linked Assessments
              </h5>
              <div className="space-y-2">
                {objective.linkedAssessments.map((assessment) => (
                  <div
                    key={assessment.assessmentId}
                    className="p-2 bg-white/50 dark:bg-slate-900/50 rounded flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <span className="text-sm truncate block">{assessment.assessmentTitle}</span>
                      <span className="text-xs text-gray-500">
                        {assessment.questionsAligned}/{assessment.totalQuestions} questions aligned
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2 h-2 rounded-full", getAlignmentColor(assessment.alignmentScore))}
                      />
                      <span className={cn("text-xs font-medium", getAlignmentTextColor(assessment.alignmentScore))}>
                        {Math.round(assessment.alignmentScore)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps for this Objective */}
          {objective.gaps.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                Alignment Gaps
              </h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {objective.gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Gap Card
function GapCard({ gap }: { gap: AlignmentGapItem }) {
  const config = getSeverityConfig(gap.severity);
  const Icon = config.icon;

  return (
    <div className={cn("p-4 rounded-lg border-l-4", config.bg, config.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.color)} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn("text-xs", {
                "border-red-300 text-red-600": gap.severity === "critical",
                "border-orange-300 text-orange-600": gap.severity === "high",
                "border-yellow-300 text-yellow-600": gap.severity === "medium",
                "border-blue-300 text-blue-600": gap.severity === "low",
              })}
            >
              {gap.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {gap.type.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-sm font-medium mb-1">{gap.description}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{gap.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
