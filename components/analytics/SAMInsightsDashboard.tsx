"use client";

/**
 * SAM Insights Dashboard
 *
 * Comprehensive analytics dashboard that displays data from all SAM AI engines:
 * - Practice Problems Analytics
 * - Learning Style Insights
 * - Socratic Dialogue Progress
 * - Predictive Analytics & Risk Assessment
 * - Retention & Spaced Repetition
 * - Achievement & Gamification Tracking
 * - Cognitive Progress (Bloom's Taxonomy)
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Target,
  Lightbulb,
  TrendingUp,
  BookOpen,
  Award,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  BarChart3,
  RefreshCw,
  ArrowRight,
  Trophy,
  Flame,
  Eye,
  Headphones,
  BookOpenText,
  Hand,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSAMUnifiedAnalytics,
  type SAMUnifiedAnalytics,
  type PracticeAnalytics,
  type LearningStyleAnalytics,
  type SocraticAnalytics,
  type PredictiveAnalytics,
  type RetentionAnalytics,
  type AchievementAnalytics,
  type CognitiveAnalytics,
  type OverallHealthScore,
} from "@/hooks/use-sam-unified-analytics";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { BloomsLevel } from "@sam-ai/core";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Health grade colors
const gradeColors: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30",
  B: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30",
  C: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30",
  D: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30",
  F: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30",
};

// Learning style icons
const styleIcons: Record<string, React.ReactNode> = {
  visual: <Eye className="w-5 h-5" />,
  auditory: <Headphones className="w-5 h-5" />,
  reading: <BookOpenText className="w-5 h-5" />,
  kinesthetic: <Hand className="w-5 h-5" />,
  multimodal: <Sparkles className="w-5 h-5" />,
  adaptive: <Brain className="w-5 h-5" />,
};

// Bloom's level colors
const bloomsColors: Record<BloomsLevel, string> = {
  REMEMBER: "bg-slate-500",
  UNDERSTAND: "bg-blue-500",
  APPLY: "bg-green-500",
  ANALYZE: "bg-yellow-500",
  EVALUATE: "bg-orange-500",
  CREATE: "bg-purple-500",
};

interface SAMInsightsDashboardProps {
  className?: string;
}

/**
 * Loading skeleton for the dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="py-12 text-center">
        <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Start Your Learning Journey
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Complete lessons, practice problems, and interact with SAM AI to see your
          personalized insights and analytics here.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/search">
              Browse Courses
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Overall Health Score Card
 */
function HealthScoreCard({ health }: { health: OverallHealthScore }) {
  const trendIcon =
    health.trend === "improving" ? (
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    ) : health.trend === "declining" ? (
      <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
    ) : (
      <TrendingUp className="w-4 h-4 text-slate-400" />
    );

  return (
    <motion.div {...fadeInUp}>
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Learning Health Score
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {health.score}
                </span>
                <span
                  className={cn(
                    "text-2xl font-bold px-3 py-1 rounded-lg",
                    gradeColors[health.grade]
                  )}
                >
                  {health.grade}
                </span>
                {trendIcon}
              </div>
            </div>
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Brain className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Component Breakdown */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Object.entries(health.components).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize mb-1">
                  {key}
                </div>
                <Progress value={value} className="h-2" />
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                  {value}%
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div className="space-y-2">
            {health.insights.slice(0, 2).map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                {insight}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Practice Analytics Card
 */
function PracticeCard({ practice }: { practice: PracticeAnalytics }) {
  return (
    <motion.div {...fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-5 h-5 text-blue-600" />
            Practice Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {practice.averageScore}%
              </div>
              <div className="text-xs text-slate-500">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {practice.totalAttempts}
              </div>
              <div className="text-xs text-slate-500">Problems Solved</div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {practice.currentStreak}
                </span>
              </div>
              <div className="text-xs text-slate-500">Day Streak</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {practice.totalPoints}
              </div>
              <div className="text-xs text-slate-500">Points Earned</div>
            </div>
          </div>

          {practice.recentProblems.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-slate-500 mb-2">Recent Activity</div>
              <div className="flex gap-1">
                {practice.recentProblems.slice(0, 10).map((p, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center",
                      p.isCorrect
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30"
                    )}
                    title={p.title}
                  >
                    {p.isCorrect ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <span className="text-xs">✗</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Learning Style Card
 */
function LearningStyleCard({ style }: { style: LearningStyleAnalytics }) {
  const maxScore = Math.max(...Object.values(style.styleScores));

  return (
    <motion.div {...fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Learning Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              {styleIcons[style.primaryStyle] || <Brain className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-lg font-semibold capitalize text-slate-900 dark:text-white">
                {style.primaryStyle}
              </div>
              <div className="text-xs text-slate-500">
                {Math.round(style.confidence * 100)}% confidence
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {Object.entries(style.styleScores).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-20 text-xs capitalize text-slate-600 dark:text-slate-400">
                  {key}
                </div>
                <Progress value={value} className="flex-1 h-2" />
                <div className="w-8 text-xs text-right text-slate-500">{value}%</div>
              </div>
            ))}
          </div>

          {style.recommendations.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-slate-500 mb-2">Recommendations</div>
              <ul className="space-y-1">
                {style.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                    <span className="text-purple-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Predictive Analytics Card
 */
function PredictiveCard({ predictions }: { predictions: PredictiveAnalytics }) {
  const riskColor =
    predictions.riskLevel === "low"
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30"
      : predictions.riskLevel === "medium"
      ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30"
      : "text-red-600 bg-red-50 dark:bg-red-900/30";

  return (
    <motion.div {...fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Success Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {Math.round(predictions.successProbability * 100)}%
              </div>
              <div className="text-xs text-slate-500">Success Probability</div>
            </div>
            <Badge className={riskColor}>
              {predictions.riskLevel === "low" && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {predictions.riskLevel === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
              {predictions.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>

          {/* Learning Velocity */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Learning Velocity</span>
              <span className="text-slate-700 dark:text-slate-300">
                {predictions.learningVelocity.current}% / {predictions.learningVelocity.optimal}%
              </span>
            </div>
            <Progress
              value={(predictions.learningVelocity.current / predictions.learningVelocity.optimal) * 100}
              className="h-2"
            />
          </div>

          {/* Recommended Actions */}
          {predictions.recommendedActions.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-slate-500 mb-2">Next Steps</div>
              <ul className="space-y-1">
                {predictions.recommendedActions.slice(0, 2).map((action, i) => (
                  <li
                    key={i}
                    className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1"
                  >
                    <ArrowRight className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {action.action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Achievements Card
 */
function AchievementsCard({ achievements }: { achievements: AchievementAnalytics }) {
  const levelProgress = achievements.progressToNextLevel;

  return (
    <motion.div {...fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-5 h-5 text-amber-600" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {achievements.level}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Level Progress</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {achievements.totalPoints} pts
                </span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              <div className="text-xs text-slate-500 mt-1">
                {achievements.pointsToNextLevel} pts to Level {achievements.level + 1}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {achievements.totalAchievements}
              </div>
              <div className="text-xs text-slate-500">Achievements</div>
            </div>
            <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {achievements.currentStreak}
                </span>
              </div>
              <div className="text-xs text-slate-500">Streak</div>
            </div>
            <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {achievements.badges.length}
              </div>
              <div className="text-xs text-slate-500">Badges</div>
            </div>
          </div>

          {achievements.activeChallenges.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-slate-500 mb-2">Active Challenges</div>
              {achievements.activeChallenges.slice(0, 2).map((challenge, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{challenge.name}</span>
                    <span className="text-slate-500">
                      {challenge.progress}/{challenge.target}
                    </span>
                  </div>
                  <Progress value={(challenge.progress / challenge.target) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Socratic Dialogue Card
 */
function SocraticCard({ socratic }: { socratic: SocraticAnalytics }) {
  return (
    <motion.div {...fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Socratic Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {socratic.totalDialogues}
              </div>
              <div className="text-xs text-slate-500">Dialogues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {socratic.insightsDiscovered}
              </div>
              <div className="text-xs text-slate-500">Insights</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {socratic.averageQuality}%
              </div>
              <div className="text-xs text-slate-500">Avg Quality</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {socratic.averageThinkingDepth}%
              </div>
              <div className="text-xs text-slate-500">Thinking Depth</div>
            </div>
          </div>

          {socratic.growthAreas.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-slate-500 mb-2">Growth Areas</div>
              <div className="flex flex-wrap gap-1">
                {socratic.growthAreas.map((area, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Cognitive Progress Card (Bloom's Taxonomy)
 */
function CognitiveCard({ cognitive }: { cognitive: CognitiveAnalytics }) {
  const bloomsOrder: BloomsLevel[] = [
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE",
  ];

  return (
    <motion.div {...fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-5 h-5 text-violet-600" />
            Cognitive Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="text-sm text-slate-500 mb-1">Current Level</div>
              <Badge className={cn("text-white", bloomsColors[cognitive.currentLevel])}>
                {cognitive.currentLevel}
              </Badge>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="flex-1 text-right">
              <div className="text-sm text-slate-500 mb-1">Target Level</div>
              <Badge variant="outline" className="border-violet-500 text-violet-600">
                {cognitive.targetLevel}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            {bloomsOrder.map((level) => {
              const progress = cognitive.progressByLevel.find((p) => p.level === level);
              return (
                <div key={level} className="flex items-center gap-2">
                  <div className="w-20 text-xs text-slate-600 dark:text-slate-400">
                    {level.charAt(0) + level.slice(1).toLowerCase()}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", bloomsColors[level])} />
                    <Progress value={progress?.score || 0} className="flex-1 h-2" />
                  </div>
                  <div className="w-12 text-xs text-right text-slate-500">
                    {progress?.score || 0}%
                  </div>
                </div>
              );
            })}
          </div>

          {cognitive.strengthAreas.length > 0 && (
            <div className="border-t pt-3 mt-4">
              <div className="text-xs font-medium text-slate-500 mb-2">Strengths</div>
              <div className="flex flex-wrap gap-1">
                {cognitive.strengthAreas.map((level, i) => (
                  <Badge
                    key={i}
                    className={cn("text-white text-xs", bloomsColors[level])}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Retention Analytics Card
 */
function RetentionCard({ retention }: { retention: RetentionAnalytics }) {
  return (
    <motion.div {...fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            Retention & Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {retention.overallRetention}%
              </div>
              <div className="text-xs text-slate-500">Overall Retention</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {retention.studyPatterns.consistencyScore}%
              </div>
              <div className="text-xs text-slate-500">Consistency</div>
            </div>
          </div>

          {/* Study Patterns */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{retention.studyPatterns.preferredTime}</span>
              </div>
              <div className="text-xs text-slate-500">Best Time</div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {retention.studyPatterns.averageSessionLength}m
              </div>
              <div className="text-xs text-slate-500">Avg Session</div>
            </div>
          </div>

          {/* Topics Needing Review */}
          {retention.topicsNeedingReview.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-slate-500 mb-2">Needs Review</div>
              <div className="flex flex-wrap gap-1">
                {retention.topicsNeedingReview.map((topic, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Main SAM Insights Dashboard Component
 */
export function SAMInsightsDashboard({ className }: SAMInsightsDashboardProps) {
  const { data, loading, error, refresh, isStale } = useSAMUnifiedAnalytics({
    refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const hasData = useMemo(() => {
    if (!data) return false;
    return (
      data.practiceProblems.totalAttempts > 0 ||
      data.achievements.totalPoints > 0 ||
      data.socraticDialogue.totalDialogues > 0
    );
  }, [data]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Unable to Load Analytics
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || !hasData) {
    return <EmptyState onRefresh={refresh} />;
  }

  return (
    <motion.div
      className={cn("space-y-6", className)}
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Stale Data Indicator */}
      {isStale && (
        <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Data may be outdated
          </span>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      )}

      {/* Health Score */}
      <HealthScoreCard health={data.overallHealth} />

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PracticeCard practice={data.practiceProblems} />
        <LearningStyleCard style={data.learningStyle} />
        <PredictiveCard predictions={data.predictions} />
        <AchievementsCard achievements={data.achievements} />
      </div>

      {/* Secondary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CognitiveCard cognitive={data.cognitiveProgress} />
        <SocraticCard socratic={data.socraticDialogue} />
        <RetentionCard retention={data.retention} />
      </div>

      {/* Next Steps Section */}
      {data.overallHealth.nextSteps.length > 0 && (
        <motion.div {...fadeInUp}>
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-5 h-5 text-indigo-600" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.overallHealth.nextSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg"
                  >
                    <ArrowRight className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

export default SAMInsightsDashboard;
