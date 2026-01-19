"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  BookOpen,
  Lightbulb,
  Search,
  Scale,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BloomsLevel } from "@prisma/client";

interface LevelPerformance {
  questionsCount: number;
  correctCount: number;
  scorePercentage: number;
  averageTime?: number;
}

interface BloomsBreakdown {
  REMEMBER: LevelPerformance;
  UNDERSTAND: LevelPerformance;
  APPLY: LevelPerformance;
  ANALYZE: LevelPerformance;
  EVALUATE: LevelPerformance;
  CREATE: LevelPerformance;
}

interface BloomsTaxonomyBreakdownProps {
  breakdown: BloomsBreakdown;
  onLevelClick?: (level: BloomsLevel) => void;
  compact?: boolean;
}

const BLOOMS_CONFIG: Record<
  BloomsLevel,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  REMEMBER: {
    label: "Remember",
    description: "Recall facts and basic concepts",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  UNDERSTAND: {
    label: "Understand",
    description: "Explain ideas or concepts",
    icon: Lightbulb,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  APPLY: {
    label: "Apply",
    description: "Use knowledge in new situations",
    icon: Brain,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  ANALYZE: {
    label: "Analyze",
    description: "Draw connections among ideas",
    icon: Search,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  EVALUATE: {
    label: "Evaluate",
    description: "Justify decisions or judgments",
    icon: Scale,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
  CREATE: {
    label: "Create",
    description: "Produce new or original work",
    icon: Sparkles,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
};

const BLOOMS_ORDER: BloomsLevel[] = [
  "REMEMBER",
  "UNDERSTAND",
  "APPLY",
  "ANALYZE",
  "EVALUATE",
  "CREATE",
];

export function BloomsTaxonomyBreakdown({
  breakdown,
  onLevelClick,
  compact = false,
}: BloomsTaxonomyBreakdownProps) {
  const radarData = useMemo(() => {
    return BLOOMS_ORDER.map((level) => ({
      level,
      config: BLOOMS_CONFIG[level],
      performance: breakdown[level],
    }));
  }, [breakdown]);

  const getScoreColorClass = (score: number): string => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreBadgeVariant = (
    score: number
  ): "default" | "secondary" | "destructive" => {
    if (score >= 70) return "default";
    if (score >= 50) return "secondary";
    return "destructive";
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-purple-600" />
            Bloom&apos;s Taxonomy Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {radarData.map(({ level, config, performance }) => {
              const hasQuestions = performance.questionsCount > 0;
              const Icon = config.icon;

              return (
                <motion.button
                  key={level}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={hasQuestions ? { scale: 1.02 } : undefined}
                  onClick={() => hasQuestions && onLevelClick?.(level)}
                  disabled={!hasQuestions}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-colors text-left",
                    hasQuestions
                      ? `${config.bgColor} ${config.borderColor} cursor-pointer hover:shadow-sm`
                      : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className={cn("w-4 h-4", config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {config.label}
                    </div>
                    {hasQuestions ? (
                      <div className="flex items-center gap-1">
                        <div
                          className={cn(
                            "h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700"
                          )}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              getScoreColorClass(performance.scorePercentage)
                            )}
                            style={{
                              width: `${performance.scorePercentage}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {performance.scorePercentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        No questions
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Bloom&apos;s Taxonomy Breakdown
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Performance across cognitive levels from lower-order to higher-order
          thinking
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {radarData.map(({ level, config, performance }, index) => {
            const hasQuestions = performance.questionsCount > 0;
            const Icon = config.icon;

            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => hasQuestions && onLevelClick?.(level)}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  hasQuestions
                    ? `${config.bgColor} ${config.borderColor} cursor-pointer hover:shadow-md`
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        {config.label}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  {hasQuestions && (
                    <Badge variant={getScoreBadgeVariant(performance.scorePercentage)}>
                      {performance.scorePercentage}%
                    </Badge>
                  )}
                </div>

                {hasQuestions ? (
                  <div className="space-y-2">
                    <Progress
                      value={performance.scorePercentage}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {performance.correctCount} / {performance.questionsCount}{" "}
                        correct
                      </span>
                      {performance.averageTime !== undefined &&
                        performance.averageTime > 0 && (
                          <span>Avg: {performance.averageTime}s per question</span>
                        )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                    No questions at this cognitive level
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Strong (70%+)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Developing (50-70%)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Needs Work (&lt;50%)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BloomsTaxonomyBreakdown;
