"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  ChevronRight,
  AlertTriangle,
  Zap,
  GraduationCap,
  Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BloomsLevel } from "@prisma/client";

interface LearningRecommendation {
  type: "remediate" | "practice" | "advance" | "review";
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  bloomsLevel: BloomsLevel;
  relatedConcepts?: string[];
  estimatedTime?: number;
  resourceUrl?: string;
}

interface LearningRecommendationsProps {
  recommendations: LearningRecommendation[];
  onStartRecommendation?: (recommendation: LearningRecommendation) => void;
  compact?: boolean;
}

const BLOOMS_LABELS: Record<BloomsLevel, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
};

const TYPE_CONFIG: Record<
  LearningRecommendation["type"],
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }
> = {
  remediate: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    label: "Remediation",
  },
  practice: {
    icon: Target,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    label: "Practice",
  },
  advance: {
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    label: "Advancement",
  },
  review: {
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    label: "Review",
  },
};

const PRIORITY_CONFIG: Record<
  LearningRecommendation["priority"],
  { color: string; label: string }
> = {
  HIGH: { color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", label: "High Priority" },
  MEDIUM: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300", label: "Medium Priority" },
  LOW: { color: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300", label: "Low Priority" },
};

export function LearningRecommendations({
  recommendations,
  onStartRecommendation,
  compact = false,
}: LearningRecommendationsProps) {
  // Sort by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Learning Path Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Zap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Great job!</p>
            <p className="text-sm">No specific recommendations at this time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="w-4 h-4 text-purple-600" />
            Learning Path ({recommendations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedRecommendations.slice(0, 3).map((rec, index) => {
              const typeConfig = TYPE_CONFIG[rec.type];
              const Icon = typeConfig.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                    typeConfig.bgColor,
                    typeConfig.borderColor
                  )}
                  onClick={() => onStartRecommendation?.(rec)}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", typeConfig.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rec.title}</p>
                    {rec.estimatedTime && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rec.estimatedTime} min
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </motion.div>
              );
            })}
            {recommendations.length > 3 && (
              <p className="text-xs text-center text-slate-500 pt-1">
                +{recommendations.length - 3} more recommendations
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-600" />
          Learning Path Recommendations
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalized suggestions based on your exam performance
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedRecommendations.map((rec, index) => {
            const typeConfig = TYPE_CONFIG[rec.type];
            const priorityConfig = PRIORITY_CONFIG[rec.priority];
            const Icon = typeConfig.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className={cn(
                  "p-4 rounded-lg border transition-all hover:shadow-md",
                  typeConfig.bgColor,
                  typeConfig.borderColor
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm shrink-0"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", typeConfig.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        {rec.title}
                      </h4>
                      <Badge variant="outline" className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {rec.description}
                    </p>

                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge variant="secondary" className="gap-1">
                        <Brain className="w-3 h-3" />
                        {BLOOMS_LABELS[rec.bloomsLevel]}
                      </Badge>

                      {rec.estimatedTime && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{rec.estimatedTime} minutes
                        </span>
                      )}

                      <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
                        {typeConfig.label}
                      </Badge>
                    </div>

                    {rec.relatedConcepts && rec.relatedConcepts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">Related Topics:</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.relatedConcepts.slice(0, 3).map((concept, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-white/50 dark:bg-slate-800/50"
                            >
                              {concept.length > 40 ? concept.substring(0, 40) + "..." : concept}
                            </Badge>
                          ))}
                          {rec.relatedConcepts.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{rec.relatedConcepts.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => onStartRecommendation?.(rec)}
                  >
                    Start
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Total estimated time:{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {recommendations.reduce((sum, r) => sum + (r.estimatedTime || 0), 0)} minutes
              </strong>
            </span>
            <div className="flex gap-2">
              {Object.entries(
                recommendations.reduce((acc, r) => {
                  acc[r.type] = (acc[r.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {count} {TYPE_CONFIG[type as LearningRecommendation["type"]].label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LearningRecommendations;
