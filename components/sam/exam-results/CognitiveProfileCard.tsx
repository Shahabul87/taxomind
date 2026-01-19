"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BloomsLevel } from "@prisma/client";

interface CognitiveProfile {
  overallMastery: number;
  strengths: BloomsLevel[];
  weaknesses: BloomsLevel[];
  recommendedFocus: BloomsLevel[];
}

interface CognitiveProfileCardProps {
  profile: CognitiveProfile;
  previousMastery?: number;
  attemptNumber?: number;
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

const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  REMEMBER: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  UNDERSTAND: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  APPLY: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  ANALYZE: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  EVALUATE: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  CREATE: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
};

export function CognitiveProfileCard({
  profile,
  previousMastery,
  attemptNumber = 1,
  compact = false,
}: CognitiveProfileCardProps) {
  const masteryChange = useMemo(() => {
    if (previousMastery === undefined) return null;
    return profile.overallMastery - previousMastery;
  }, [profile.overallMastery, previousMastery]);

  const getMasteryLevel = (mastery: number): { label: string; color: string } => {
    if (mastery >= 90) return { label: "Expert", color: "text-purple-600" };
    if (mastery >= 80) return { label: "Advanced", color: "text-blue-600" };
    if (mastery >= 70) return { label: "Proficient", color: "text-green-600" };
    if (mastery >= 60) return { label: "Developing", color: "text-yellow-600" };
    if (mastery >= 50) return { label: "Emerging", color: "text-orange-600" };
    return { label: "Beginning", color: "text-red-600" };
  };

  const masteryLevel = getMasteryLevel(profile.overallMastery);

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-4 h-4 text-amber-500" />
            Cognitive Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-bold">{profile.overallMastery}%</div>
              <div className={cn("text-sm font-medium", masteryLevel.color)}>
                {masteryLevel.label}
              </div>
            </div>
            {masteryChange !== null && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  masteryChange > 0
                    ? "text-green-600"
                    : masteryChange < 0
                    ? "text-red-600"
                    : "text-slate-500"
                )}
              >
                {masteryChange > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : masteryChange < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : null}
                {masteryChange > 0 ? "+" : ""}
                {masteryChange}%
              </div>
            )}
          </div>

          <div className="space-y-2">
            {profile.strengths.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                {profile.strengths.slice(0, 2).map((level) => (
                  <Badge
                    key={level}
                    variant="outline"
                    className={cn("text-xs", BLOOMS_COLORS[level])}
                  >
                    {BLOOMS_LABELS[level]}
                  </Badge>
                ))}
              </div>
            )}
            {profile.weaknesses.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5" />
                {profile.weaknesses.slice(0, 2).map((level) => (
                  <Badge
                    key={level}
                    variant="outline"
                    className={cn("text-xs", BLOOMS_COLORS[level])}
                  >
                    {BLOOMS_LABELS[level]}
                  </Badge>
                ))}
              </div>
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
          <Award className="w-5 h-5 text-amber-500" />
          Cognitive Profile
          {attemptNumber > 1 && (
            <Badge variant="secondary" className="ml-auto">
              Attempt {attemptNumber}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Mastery */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200 dark:text-slate-700"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={cn(
                  profile.overallMastery >= 70
                    ? "text-green-500"
                    : profile.overallMastery >= 50
                    ? "text-yellow-500"
                    : "text-red-500"
                )}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: profile.overallMastery / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                }}
                strokeDasharray="283"
                strokeDashoffset="0"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">
                {profile.overallMastery}%
              </span>
              <span className={cn("text-sm font-medium", masteryLevel.color)}>
                {masteryLevel.label}
              </span>
            </div>
          </div>

          {masteryChange !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={cn(
                "flex items-center justify-center gap-1 mt-2 text-sm font-medium",
                masteryChange > 0
                  ? "text-green-600"
                  : masteryChange < 0
                  ? "text-red-600"
                  : "text-slate-500"
              )}
            >
              {masteryChange > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4" />
                  +{masteryChange}% from previous attempt
                </>
              ) : masteryChange < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4" />
                  {masteryChange}% from previous attempt
                </>
              ) : (
                <>No change from previous attempt</>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Strengths */}
        {profile.strengths.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                Strengths
              </h4>
              <span className="text-xs text-slate-500">70%+ mastery</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.strengths.map((level, index) => (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1.5 text-sm",
                      BLOOMS_COLORS[level]
                    )}
                  >
                    {BLOOMS_LABELS[level]}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Weaknesses */}
        {profile.weaknesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                Areas for Improvement
              </h4>
              <span className="text-xs text-slate-500">&lt;50% mastery</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.weaknesses.map((level, index) => (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1.5 text-sm border-orange-300 dark:border-orange-700",
                      BLOOMS_COLORS[level]
                    )}
                  >
                    {BLOOMS_LABELS[level]}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommended Focus */}
        {profile.recommendedFocus.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                Recommended Focus
              </h4>
              <span className="text-xs text-slate-500">50-70% mastery</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.recommendedFocus.map((level, index) => (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1.5 text-sm",
                      BLOOMS_COLORS[level]
                    )}
                  >
                    {BLOOMS_LABELS[level]}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {profile.strengths.length === 0 &&
          profile.weaknesses.length === 0 &&
          profile.recommendedFocus.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              <p>Complete more questions to see your cognitive profile</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

export default CognitiveProfileCard;
