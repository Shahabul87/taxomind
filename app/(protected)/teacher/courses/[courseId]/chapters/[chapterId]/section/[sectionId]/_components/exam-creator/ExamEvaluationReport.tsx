"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Wand2,
  BarChart3,
  AlertCircle,
  Info,
  Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { BloomsLevel } from "@prisma/client";
import type {
  ExamEvaluationReport as ExamEvaluationReportType,
  UnifiedQuestion,
} from "./types";

// ============================================================================
// PROPS
// ============================================================================

interface ExamEvaluationReportProps {
  report: ExamEvaluationReportType;
  questions: UnifiedQuestion[];
  onApplySuggestion: (questionId: string, suggestedRewrite: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  REMEMBER: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800",
  UNDERSTAND: "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-800",
  APPLY: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800",
  ANALYZE: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800",
  EVALUATE: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800",
  CREATE: "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-800",
};

const GRADE_COLORS: Record<string, string> = {
  A: "from-green-500 to-emerald-500",
  B: "from-blue-500 to-cyan-500",
  C: "from-yellow-500 to-amber-500",
  D: "from-orange-500 to-red-500",
  F: "from-red-600 to-red-800",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ExamEvaluationReport({
  report,
  questions,
  onApplySuggestion,
}: ExamEvaluationReportProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview"])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-violet-500" />
          <CardTitle className="text-sm">AI Evaluation Report</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {/* Overall Score */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div
            className={cn(
              "w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg",
              GRADE_COLORS[report.grade] ?? GRADE_COLORS["C"]
            )}
          >
            {report.grade}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pedagogical Effectiveness
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {report.overallScore}%
              </span>
            </div>
            <Progress value={report.overallScore} className="h-2" />
          </div>
        </div>

        {/* Bloom's Alignment Section */}
        <CollapsibleSection
          title="Bloom&apos;s Alignment"
          icon={<Brain className="h-3.5 w-3.5 text-violet-500" />}
          badge={`${report.bloomsAnalysis.alignmentScore}%`}
          isOpen={expandedSections.has("blooms")}
          onToggle={() => toggleSection("blooms")}
        >
          <div className="space-y-2">
            {/* Distribution comparison */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="font-medium text-slate-500">Level</div>
              <div className="font-medium text-slate-500 text-right">Target / Actual</div>
              {(Object.keys(report.bloomsAnalysis.actualDistribution) as BloomsLevel[]).map(
                (level) => (
                  <div key={level} className="contents">
                    <div className={cn("font-medium", BLOOMS_COLORS[level].split(" ")[0])}>
                      {level}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">
                        {report.bloomsAnalysis.targetDistribution[level]}%
                      </span>
                      {" / "}
                      <span
                        className={cn(
                          "font-medium",
                          Math.abs(
                            report.bloomsAnalysis.actualDistribution[level] -
                              report.bloomsAnalysis.targetDistribution[level]
                          ) > 15
                            ? "text-red-500"
                            : "text-green-600"
                        )}
                      >
                        {report.bloomsAnalysis.actualDistribution[level]}%
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Missing levels */}
            {report.bloomsAnalysis.missingLevels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-slate-500">Missing:</span>
                {report.bloomsAnalysis.missingLevels.map((level) => (
                  <Badge
                    key={level}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Coverage Gaps */}
        {report.coverageGaps.length > 0 && (
          <CollapsibleSection
            title="Coverage Gaps"
            icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            badge={`${report.coverageGaps.length}`}
            isOpen={expandedSections.has("gaps")}
            onToggle={() => toggleSection("gaps")}
          >
            <div className="space-y-2">
              {report.coverageGaps.map((gap, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-2 rounded-lg text-xs border",
                    gap.severity === "high" &&
                      "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
                    gap.severity === "medium" &&
                      "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
                    gap.severity === "low" &&
                      "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                  )}
                >
                  <div className="font-medium mb-0.5">{gap.area}</div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {gap.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Per-Question Analysis */}
        <CollapsibleSection
          title="Question Analysis"
          icon={<BarChart3 className="h-3.5 w-3.5 text-blue-500" />}
          badge={`${questions.length} questions`}
          isOpen={expandedSections.has("questions")}
          onToggle={() => toggleSection("questions")}
        >
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {report.questionAnalyses.map((analysis, index) => {
              const question = questions[index];
              if (!question) return null;

              const hasIssues = analysis.issues.length > 0;
              const hasSuggestion = !!analysis.suggestedRewrite;

              return (
                <div
                  key={question.id}
                  className={cn(
                    "p-2 rounded-lg border text-xs",
                    analysis.qualityScore >= 80
                      ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                      : analysis.qualityScore >= 60
                      ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                      : "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        Q{index + 1}: {question.question.substring(0, 50)}
                        {question.question.length > 50 ? "..." : ""}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1 py-0",
                            BLOOMS_COLORS[analysis.detectedBloomsLevel]
                          )}
                        >
                          {analysis.detectedBloomsLevel}
                        </Badge>
                        <span className="text-slate-500">
                          Quality: {analysis.qualityScore}%
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold",
                        analysis.qualityScore >= 80
                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                          : analysis.qualityScore >= 60
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                      )}
                    >
                      {analysis.qualityScore}
                    </div>
                  </div>

                  {/* Issues */}
                  {hasIssues && (
                    <div className="mt-1.5 space-y-0.5">
                      {analysis.issues.slice(0, 2).map((issue, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1 text-[11px] text-slate-600 dark:text-slate-400"
                        >
                          {issue.type === "error" ? (
                            <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : issue.type === "warning" ? (
                            <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          )}
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Apply suggestion */}
                  {hasSuggestion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] mt-1 text-violet-600 hover:text-violet-700"
                      onClick={() =>
                        onApplySuggestion(
                          question.id,
                          analysis.suggestedRewrite!
                        )
                      }
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Apply AI Suggestion
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* Exam Suggestions */}
        {report.examSuggestions.length > 0 && (
          <CollapsibleSection
            title="Suggestions"
            icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
            badge={`${report.examSuggestions.length}`}
            isOpen={expandedSections.has("suggestions")}
            onToggle={() => toggleSection("suggestions")}
          >
            <ul className="space-y-1.5">
              {report.examSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                >
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Summary */}
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400">
          {report.summary}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COLLAPSIBLE SECTION HELPER
// ============================================================================

function CollapsibleSection({
  title,
  icon,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {title}
          </span>
          {badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2 pt-0 border-t border-slate-100 dark:border-slate-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
