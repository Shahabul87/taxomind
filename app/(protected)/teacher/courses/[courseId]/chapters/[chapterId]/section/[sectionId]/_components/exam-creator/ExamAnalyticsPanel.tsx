"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Brain,
  Clock,
  Target,
  TrendingUp,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BloomsLevel, QuestionType } from "@prisma/client";

interface EnhancedQuestion {
  id: string;
  bloomsLevel: BloomsLevel;
  questionType: QuestionType;
  difficulty: "easy" | "medium" | "hard";
  cognitiveLoad: number;
  points: number;
  timeEstimate: number;
  bloomsAlignment?: number;
  safetyScore?: number;
  qualityScore?: number;
}

// Alternative prop interface when passing pre-computed analytics
interface ComputedAnalyticsProps {
  bloomsDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  questionCount: number;
  estimatedTime: number;
  avgCognitiveLoad: number;
  samValidation?: Record<string, unknown> | null;
  className?: string;
}

interface QuestionsBasedProps {
  questions: EnhancedQuestion[];
  className?: string;
}

type ExamAnalyticsPanelProps = ComputedAnalyticsProps | QuestionsBasedProps;

// Type guard to check if props are computed analytics
function isComputedAnalytics(props: ExamAnalyticsPanelProps): props is ComputedAnalyticsProps {
  return "bloomsDistribution" in props && "questionCount" in props;
}

const BLOOMS_COLORS: Record<BloomsLevel, { bg: string; border: string; text: string }> = {
  REMEMBER: {
    bg: "bg-red-100 dark:bg-red-950/40",
    border: "border-red-300 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
  },
  UNDERSTAND: {
    bg: "bg-orange-100 dark:bg-orange-950/40",
    border: "border-orange-300 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
  },
  APPLY: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
  },
  ANALYZE: {
    bg: "bg-green-100 dark:bg-green-950/40",
    border: "border-green-300 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
  },
  EVALUATE: {
    bg: "bg-blue-100 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
  },
  CREATE: {
    bg: "bg-purple-100 dark:bg-purple-950/40",
    border: "border-purple-300 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
  },
};

const BLOOMS_LEVELS: BloomsLevel[] = [
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE",
];

const DIFFICULTY_COLORS = {
  easy: {
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  medium: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  hard: {
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    bar: "bg-red-500",
  },
};

export function ExamAnalyticsPanel(props: ExamAnalyticsPanelProps) {
  const analytics = useMemo(() => {
    // Handle pre-computed analytics
    if (isComputedAnalytics(props)) {
      const { bloomsDistribution, difficultyDistribution, questionCount, estimatedTime, avgCognitiveLoad, samValidation } = props;

      if (questionCount === 0) {
        return null;
      }

      // Calculate cognitive balance from Bloom's distribution
      const lowerOrderCount = (bloomsDistribution.REMEMBER || 0) + (bloomsDistribution.UNDERSTAND || 0);
      const higherOrderCount =
        (bloomsDistribution.APPLY || 0) +
        (bloomsDistribution.ANALYZE || 0) +
        (bloomsDistribution.EVALUATE || 0) +
        (bloomsDistribution.CREATE || 0);
      const cognitiveBalance = questionCount > 0 ? higherOrderCount / questionCount : 0;

      // Extract quality scores from SAM validation if available
      let avgQualityScore = null;
      let avgBloomsAlignment = null;
      let avgSafetyScore = null;

      if (samValidation && typeof samValidation === "object") {
        const validation = samValidation as Record<string, unknown>;
        if ("quality" in validation && typeof validation.quality === "object") {
          const quality = validation.quality as Record<string, unknown>;
          avgQualityScore = typeof quality.score === "number" ? quality.score : null;
        }
        if ("pedagogical" in validation && typeof validation.pedagogical === "object") {
          const pedagogical = validation.pedagogical as Record<string, unknown>;
          avgBloomsAlignment = typeof pedagogical.score === "number" ? pedagogical.score : null;
        }
        if ("safety" in validation && typeof validation.safety === "object") {
          const safety = validation.safety as Record<string, unknown>;
          avgSafetyScore = typeof safety.score === "number" ? safety.score : null;
        }
      }

      return {
        bloomsDistribution: bloomsDistribution as Record<BloomsLevel, number>,
        difficultyDistribution,
        typeDistribution: {} as Record<string, number>,
        avgCognitiveLoad,
        totalTime: estimatedTime,
        totalPoints: questionCount * 2, // Estimate
        avgQualityScore,
        avgBloomsAlignment,
        avgSafetyScore,
        cognitiveBalance,
        lowerOrderCount,
        higherOrderCount,
        questionCount,
      };
    }

    // Handle questions-based analytics
    const { questions } = props;

    if (!questions.length) {
      return null;
    }

    // Bloom's distribution
    const bloomsDistribution: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };
    questions.forEach((q) => {
      bloomsDistribution[q.bloomsLevel]++;
    });

    // Difficulty distribution
    const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
    questions.forEach((q) => {
      difficultyDistribution[q.difficulty]++;
    });

    // Question type distribution
    const typeDistribution: Record<string, number> = {};
    questions.forEach((q) => {
      typeDistribution[q.questionType] = (typeDistribution[q.questionType] || 0) + 1;
    });

    // Calculate averages
    const avgCognitiveLoad =
      questions.reduce((sum, q) => sum + q.cognitiveLoad, 0) / questions.length;
    const totalTime = questions.reduce((sum, q) => sum + q.timeEstimate, 0);
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    // Quality scores (if available from SAM)
    const questionsWithQuality = questions.filter((q) => q.qualityScore !== undefined);
    const avgQualityScore =
      questionsWithQuality.length > 0
        ? questionsWithQuality.reduce((sum, q) => sum + (q.qualityScore || 0), 0) /
          questionsWithQuality.length
        : null;

    const avgBloomsAlignment =
      questionsWithQuality.length > 0
        ? questionsWithQuality.reduce((sum, q) => sum + (q.bloomsAlignment || 0), 0) /
          questionsWithQuality.length
        : null;

    const avgSafetyScore =
      questionsWithQuality.length > 0
        ? questionsWithQuality.reduce((sum, q) => sum + (q.safetyScore || 0), 0) /
          questionsWithQuality.length
        : null;

    // Check cognitive balance
    const lowerOrderCount = bloomsDistribution.REMEMBER + bloomsDistribution.UNDERSTAND;
    const higherOrderCount =
      bloomsDistribution.APPLY +
      bloomsDistribution.ANALYZE +
      bloomsDistribution.EVALUATE +
      bloomsDistribution.CREATE;
    const cognitiveBalance = questions.length > 0 ? higherOrderCount / questions.length : 0;

    return {
      bloomsDistribution,
      difficultyDistribution,
      typeDistribution,
      avgCognitiveLoad,
      totalTime,
      totalPoints,
      avgQualityScore,
      avgBloomsAlignment,
      avgSafetyScore,
      cognitiveBalance,
      lowerOrderCount,
      higherOrderCount,
      questionCount: questions.length,
    };
  }, [props]);

  const questionCount = isComputedAnalytics(props) ? props.questionCount : props.questions.length;
  const className = props.className;

  if (!analytics || questionCount === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-6",
          "bg-slate-50/50 dark:bg-slate-800/30",
          "flex flex-col items-center justify-center text-center",
          className
        )}
      >
        <BarChart3 className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No questions available for analysis
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
          Generate questions to see analytics
        </p>
      </div>
    );
  }

  const maxBloomsCount = Math.max(...Object.values(analytics.bloomsDistribution));

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Questions"
          value={analytics.questionCount.toString()}
          color="blue"
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Est. Time"
          value={`${analytics.totalTime} min`}
          color="amber"
        />
        <MetricCard
          icon={<Target className="h-4 w-4" />}
          label="Total Points"
          value={analytics.totalPoints.toString()}
          color="emerald"
        />
        <MetricCard
          icon={<Zap className="h-4 w-4" />}
          label="Avg. Load"
          value={analytics.avgCognitiveLoad.toFixed(1)}
          subValue="/5"
          color="purple"
        />
      </div>

      {/* Bloom's Distribution Chart */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            Bloom&apos;s Taxonomy Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {BLOOMS_LEVELS.map((level) => {
              const count = analytics.bloomsDistribution[level];
              const percentage = maxBloomsCount > 0 ? (count / maxBloomsCount) * 100 : 0;
              const colors = BLOOMS_COLORS[level];

              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <span className={cn("text-xs font-medium", colors.text)}>
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full flex items-center justify-end pr-2",
                        colors.bg
                      )}
                    >
                      {count > 0 && (
                        <span className={cn("text-xs font-bold", colors.text)}>{count}</span>
                      )}
                    </motion.div>
                  </div>
                  <div className="w-8 text-right">
                    <span className="text-xs text-slate-500">
                      {analytics.questionCount > 0
                        ? Math.round((count / analytics.questionCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cognitive Balance Indicator */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">Cognitive Balance</span>
              <Badge
                variant={analytics.cognitiveBalance >= 0.4 ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  analytics.cognitiveBalance >= 0.5
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : analytics.cognitiveBalance >= 0.3
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                )}
              >
                {analytics.cognitiveBalance >= 0.5
                  ? "Excellent"
                  : analytics.cognitiveBalance >= 0.3
                    ? "Good"
                    : "Needs Work"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-20">Lower Order</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-slate-400"
                  style={{
                    width: `${((1 - analytics.cognitiveBalance) * 100).toFixed(0)}%`,
                  }}
                />
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  style={{
                    width: `${(analytics.cognitiveBalance * 100).toFixed(0)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-slate-500 w-20 text-right">Higher Order</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400">{analytics.lowerOrderCount} questions</span>
              <span className="text-xs text-slate-400">{analytics.higherOrderCount} questions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Distribution */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Difficulty Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {(["easy", "medium", "hard"] as const).map((difficulty) => {
              const count = analytics.difficultyDistribution[difficulty];
              const percentage = analytics.questionCount > 0
                ? Math.round((count / analytics.questionCount) * 100)
                : 0;
              const colors = DIFFICULTY_COLORS[difficulty];

              return (
                <div
                  key={difficulty}
                  className={cn(
                    "p-3 rounded-lg border text-center",
                    colors.bg,
                    "border-slate-200 dark:border-slate-700"
                  )}
                >
                  <div className={cn("text-2xl font-bold", colors.text)}>{count}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 capitalize mt-1">
                    {difficulty}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SAM Quality Metrics (if available) */}
      {(analytics.avgQualityScore !== null ||
        analytics.avgBloomsAlignment !== null ||
        analytics.avgSafetyScore !== null) && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              SAM Quality Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {analytics.avgQualityScore !== null && (
                <QualityMetric
                  label="Quality"
                  value={Math.round(analytics.avgQualityScore)}
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                />
              )}
              {analytics.avgBloomsAlignment !== null && (
                <QualityMetric
                  label="Bloom&apos;s Alignment"
                  value={Math.round(analytics.avgBloomsAlignment)}
                  icon={<Brain className="h-4 w-4 text-purple-500" />}
                />
              )}
              {analytics.avgSafetyScore !== null && (
                <QualityMetric
                  label="Safety"
                  value={Math.round(analytics.avgSafetyScore)}
                  icon={<AlertCircle className="h-4 w-4 text-blue-500" />}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: "blue" | "amber" | "emerald" | "purple";
}) {
  const colorClasses = {
    blue: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800",
    amber: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800",
    emerald: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800",
    purple: "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800",
  };

  const iconColorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 bg-gradient-to-br",
        colorClasses[color]
      )}
    >
      <div className={cn("mb-1", iconColorClasses[color])}>{icon}</div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</span>
        {subValue && (
          <span className="text-xs text-slate-500 dark:text-slate-400">{subValue}</span>
        )}
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function QualityMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className={cn("text-xl font-bold", getScoreColor(value))}>{value}%</div>
      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}
