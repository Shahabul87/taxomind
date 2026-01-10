"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Brain,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  BookOpen,
  Scale,
  Eye,
  Accessibility,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types matching the SAM validation result structure
interface ValidationSummary {
  passed: boolean;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  issues: ValidationIssue[];
  recommendations: string[];
}

interface ValidationIssue {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  questionId?: string;
  suggestion?: string;
}

interface QualityValidationResult {
  passed: boolean;
  score: number;
  gates: QualityGateResult[];
  suggestions: string[];
}

interface QualityGateResult {
  gateName: string;
  passed: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

interface SafetyValidationResult {
  passed: boolean;
  score: number;
  biasDetected: boolean;
  discouragingLanguageDetected: boolean;
  accessibilityScore: number;
  issues: SafetyIssue[];
}

interface SafetyIssue {
  type: "bias" | "discouraging_language" | "accessibility" | "constructive_framing";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location?: string;
  suggestion?: string;
}

interface PedagogicalValidationResult {
  passed: boolean;
  score: number;
  bloomsAlignment: {
    passed: boolean;
    score: number;
    suggestions: string[];
  };
  scaffolding: {
    passed: boolean;
    score: number;
    complexityProgression: number;
    prerequisiteCoverage: number;
    supportStructures: number;
  };
}

interface ExamValidationResult {
  overall: ValidationSummary;
  quality: QualityValidationResult;
  safety: SafetyValidationResult;
  pedagogical: PedagogicalValidationResult;
}

interface SAMQualityIndicatorProps {
  validation?: ExamValidationResult | Record<string, unknown> | null;
  isLoading?: boolean;
  compact?: boolean;
  variant?: "compact" | "full";
  className?: string;
}

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "A":
      return "text-emerald-600 dark:text-emerald-400";
    case "B":
      return "text-blue-600 dark:text-blue-400";
    case "C":
      return "text-amber-600 dark:text-amber-400";
    case "D":
      return "text-orange-600 dark:text-orange-400";
    case "F":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 80) return "text-blue-600 dark:text-blue-400";
  if (score >= 70) return "text-amber-600 dark:text-amber-400";
  if (score >= 60) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
};

const getProgressColor = (score: number) => {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 80) return "bg-blue-500";
  if (score >= 70) return "bg-amber-500";
  if (score >= 60) return "bg-orange-500";
  return "bg-red-500";
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "low":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "high":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
};

export function SAMQualityIndicator({
  validation,
  isLoading = false,
  compact = false,
  variant,
  className,
}: SAMQualityIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  // Handle variant prop (takes precedence over compact)
  const isCompact = variant === "compact" || (variant === undefined && compact);

  // Type guard to check if validation is ExamValidationResult
  const isValidExamResult = (val: unknown): val is ExamValidationResult => {
    if (!val || typeof val !== "object") return false;
    const v = val as Record<string, unknown>;
    return "overall" in v && "quality" in v && "safety" in v && "pedagogical" in v;
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-slate-200 dark:border-slate-700 p-4",
          "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!validation || !isValidExamResult(validation)) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4",
          "bg-slate-50/50 dark:bg-slate-800/30",
          className
        )}
      >
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Gauge className="h-5 w-5" />
          <span className="text-sm">SAM validation not available</span>
        </div>
      </div>
    );
  }

  const { overall, quality, safety, pedagogical } = validation;

  // Compact view for inline display
  if (isCompact) {
    return (
      <TooltipProvider>
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-gradient-to-r",
            overall.passed
              ? "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800"
              : "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800",
            className
          )}
        >
          {overall.passed ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          )}
          <span className={cn("font-semibold text-sm", getGradeColor(overall.grade))}>
            {overall.grade}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {overall.score}/100
          </span>

          {/* Metric pills */}
          <div className="flex items-center gap-1 ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    quality.passed ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>Quality: {quality.score}/100</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    safety.passed ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>Safety: {safety.score}/100</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    pedagogical.passed ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>Pedagogy: {pedagogical.score}/100</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Full view
  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border overflow-hidden",
        overall.passed
          ? "border-emerald-200 dark:border-emerald-800/50"
          : "border-amber-200 dark:border-amber-800/50",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "px-4 py-3",
          "bg-gradient-to-r",
          overall.passed
            ? "from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40"
            : "from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-yellow-950/40"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                overall.passed
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : "bg-amber-100 dark:bg-amber-900/50"
              )}
            >
              {overall.passed ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  SAM Quality Score
                </h4>
                <Badge
                  className={cn(
                    "font-bold text-sm px-2",
                    overall.passed
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-amber-500 hover:bg-amber-600"
                  )}
                >
                  {overall.grade}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {overall.passed ? "All validations passed" : "Some issues need attention"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={cn("text-2xl font-bold", getScoreColor(overall.score))}>
                {overall.score}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">/ 100</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Score bars */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <ScoreBar
            label="Quality"
            score={quality.score}
            passed={quality.passed}
            icon={<Gauge className="h-4 w-4" />}
          />
          <ScoreBar
            label="Safety"
            score={safety.score}
            passed={safety.passed}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <ScoreBar
            label="Pedagogy"
            score={pedagogical.score}
            passed={pedagogical.passed}
            icon={<Brain className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white dark:bg-slate-900 space-y-4">
              {/* Quality Gates */}
              <DetailSection
                title="Quality Gates"
                icon={<Target className="h-4 w-4 text-blue-500" />}
                passed={quality.passed}
              >
                <div className="space-y-2">
                  {quality.gates.map((gate, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {gate.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {gate.gateName}
                        </span>
                      </div>
                      <span className={cn("text-sm font-medium", getScoreColor(gate.score))}>
                        {gate.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </DetailSection>

              {/* Safety Analysis */}
              <DetailSection
                title="Safety Analysis"
                icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
                passed={safety.passed}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Bias Detection
                      </span>
                    </div>
                    <Badge
                      variant={safety.biasDetected ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {safety.biasDetected ? "Detected" : "None"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Discouraging Language
                      </span>
                    </div>
                    <Badge
                      variant={safety.discouragingLanguageDetected ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {safety.discouragingLanguageDetected ? "Detected" : "None"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Accessibility className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Accessibility Score
                      </span>
                    </div>
                    <span className={cn("text-sm font-medium", getScoreColor(safety.accessibilityScore))}>
                      {safety.accessibilityScore}%
                    </span>
                  </div>
                </div>
              </DetailSection>

              {/* Pedagogical Analysis */}
              <DetailSection
                title="Pedagogical Analysis"
                icon={<BookOpen className="h-4 w-4 text-purple-500" />}
                passed={pedagogical.passed}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Bloom&apos;s Alignment
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        getScoreColor(pedagogical.bloomsAlignment.score)
                      )}
                    >
                      {pedagogical.bloomsAlignment.score}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Complexity Progression
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        getScoreColor(pedagogical.scaffolding.complexityProgression * 100)
                      )}
                    >
                      {Math.round(pedagogical.scaffolding.complexityProgression * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Prerequisite Coverage
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        getScoreColor(pedagogical.scaffolding.prerequisiteCoverage * 100)
                      )}
                    >
                      {Math.round(pedagogical.scaffolding.prerequisiteCoverage * 100)}%
                    </span>
                  </div>
                </div>
              </DetailSection>

              {/* Issues */}
              {overall.issues.length > 0 && (
                <DetailSection
                  title={`Issues (${overall.issues.length})`}
                  icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                  passed={false}
                >
                  <div className="space-y-2">
                    {overall.issues.slice(0, 5).map((issue, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                      >
                        <Badge className={cn("text-[10px] shrink-0", getSeverityColor(issue.severity))}>
                          {issue.severity}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {issue.message}
                          </p>
                          {issue.suggestion && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {issue.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {overall.issues.length > 5 && (
                      <p className="text-xs text-slate-500 text-center">
                        +{overall.issues.length - 5} more issues
                      </p>
                    )}
                  </div>
                </DetailSection>
              )}

              {/* Recommendations */}
              {overall.recommendations.length > 0 && (
                <DetailSection
                  title="Recommendations"
                  icon={<Sparkles className="h-4 w-4 text-blue-500" />}
                  passed={true}
                >
                  <ul className="space-y-1">
                    {overall.recommendations.slice(0, 3).map((rec, index) => (
                      <li
                        key={index}
                        className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                      >
                        <span className="text-blue-500">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Score bar component
function ScoreBar({
  label,
  score,
  passed,
  icon,
}: {
  label: string;
  score: number;
  passed: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn("text-xs font-bold", getScoreColor(score))}>{score}</span>
          {passed ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          ) : (
            <XCircle className="h-3 w-3 text-amber-500" />
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", getProgressColor(score))}
        />
      </div>
    </div>
  );
}

// Detail section component
function DetailSection({
  title,
  icon,
  passed,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  passed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</span>
        </div>
        {passed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
