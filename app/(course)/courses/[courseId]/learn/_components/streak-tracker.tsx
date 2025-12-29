"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  Award,
  Star,
  Zap,
  Target,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  streakStart: string;
  weeklyActivity: boolean[];
  weeklyGoalMinutes: number;
  weeklyActualMinutes: number;
  todayStudied: boolean;
}

interface StreakTrackerProps {
  courseId: string;
  userId: string;
}

export const StreakTracker = ({ courseId, userId }: StreakTrackerProps) => {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchStreakData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/courses/${courseId}/streak`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to fetch streak data");
      }

      setStreak(data.data);
    } catch (err) {
      console.error("Error fetching streak data:", err);
      setError(err instanceof Error ? err.message : "Failed to load streak data");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  // Trigger animation when streak increases
  useEffect(() => {
    if (streak?.todayStudied && streak.currentStreak > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [streak?.currentStreak, streak?.todayStudied]);

  const getStreakLevel = (days: number) => {
    if (days >= 30) return { level: "Legendary", color: "from-purple-500 to-pink-500", icon: Trophy };
    if (days >= 14) return { level: "Epic", color: "from-orange-500 to-red-500", icon: Award };
    if (days >= 7) return { level: "Great", color: "from-yellow-500 to-orange-500", icon: Star };
    if (days >= 3) return { level: "Good", color: "from-green-500 to-emerald-500", icon: Zap };
    return { level: "Building", color: "from-blue-500 to-indigo-500", icon: Flame };
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading streak data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                fetchStreakData();
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data fallback
  if (!streak) {
    return null;
  }

  const streakInfo = getStreakLevel(streak.currentStreak);
  const StreakIcon = streakInfo.icon;

  // Calculate progress to next milestone
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find((m) => m > streak.currentStreak) || 365;
  const progressToNext = (streak.currentStreak / nextMilestone) * 100;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Weekly goal progress
  const weeklyGoalProgress = streak.weeklyGoalMinutes > 0
    ? Math.min((streak.weeklyActualMinutes / streak.weeklyGoalMinutes) * 100, 100)
    : 0;

  return (
    <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
      {/* Animated background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-10",
          streakInfo.color
        )}
        aria-hidden="true"
      />

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br",
                streakInfo.color
              )}
              aria-hidden="true"
            >
              <StreakIcon className="w-5 h-5 text-white" />
            </div>
            <span>Learning Streak</span>
          </div>
          <Badge
            variant="secondary"
            className={cn("bg-gradient-to-r text-white border-0", streakInfo.color)}
          >
            {streakInfo.level}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Current Streak Display */}
        <motion.div
          className="text-center p-6 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl"
          animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5 }}
          role="status"
          aria-label={`Current streak: ${streak.currentStreak} days`}
        >
          <div className="relative">
            <motion.div
              animate={isAnimating ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Flame
                className={cn(
                  "w-16 h-16 mx-auto mb-3",
                  streak.currentStreak > 0 ? "text-orange-500" : "text-slate-400"
                )}
                aria-hidden="true"
              />
            </motion.div>

            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 0 }}
                  animate={{ opacity: 1, scale: 1.5, y: -30 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 text-orange-500 font-bold text-2xl"
                  aria-hidden="true"
                >
                  +1
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            {streak.currentStreak}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            {streak.currentStreak === 1 ? "day streak" : "days streak"}
          </p>
          {streak.todayStudied && (
            <Badge className="mt-2 bg-emerald-500 text-white border-0">
              ✓ Studied Today
            </Badge>
          )}
        </motion.div>

        {/* Weekly Activity */}
        <section className="space-y-3" aria-labelledby="weekly-activity-heading">
          <div className="flex items-center justify-between">
            <h4 id="weekly-activity-heading" className="text-sm font-medium text-slate-900 dark:text-slate-100">
              This Week
            </h4>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {streak.weeklyActivity.filter(Boolean).length}/7 days
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2" role="list" aria-label="Weekly activity">
            {weekDays.map((day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="text-center"
                role="listitem"
                aria-label={`${day}: ${streak.weeklyActivity[index] ? "Studied" : "Not studied"}`}
              >
                <div
                  className={cn(
                    "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200",
                    streak.weeklyActivity[index]
                      ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  )}
                >
                  {streak.weeklyActivity[index] ? "✓" : day[0]}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{day}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Weekly Goal Progress */}
        {streak.weeklyGoalMinutes > 0 && (
          <section className="space-y-2" aria-labelledby="weekly-goal-heading">
            <div className="flex items-center justify-between text-sm">
              <span id="weekly-goal-heading" className="text-slate-600 dark:text-slate-400">
                Weekly Goal
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {streak.weeklyActualMinutes} / {streak.weeklyGoalMinutes} min
              </span>
            </div>
            <Progress
              value={weeklyGoalProgress}
              className="h-2"
              aria-label={`Weekly goal progress: ${Math.round(weeklyGoalProgress)}%`}
            />
          </section>
        )}

        {/* Progress to Next Milestone */}
        <section className="space-y-2" aria-labelledby="milestone-heading">
          <div className="flex items-center justify-between text-sm">
            <span id="milestone-heading" className="text-slate-600 dark:text-slate-400">
              Next Milestone
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {nextMilestone} days
            </span>
          </div>
          <Progress
            value={progressToNext}
            className="h-2"
            aria-label={`Milestone progress: ${Math.round(progressToNext)}%`}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {nextMilestone - streak.currentStreak} more days to unlock reward!
          </p>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {streak.longestStreak}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Longest Streak</p>
          </div>

          <div className="text-center p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {Math.ceil(progressToNext)}%
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">To Next Level</p>
          </div>
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn("p-4 rounded-lg text-center bg-gradient-to-r text-white", streakInfo.color)}
          role="status"
        >
          <p className="text-sm font-medium">
            {streak.currentStreak === 0
              ? "Start your streak today! 🚀"
              : streak.currentStreak < 3
                ? "Great start! Keep going! 💪"
                : streak.currentStreak < 7
                  ? "You&apos;re building momentum! 🔥"
                  : streak.currentStreak < 14
                    ? "Unstoppable! Keep it up! ⚡"
                    : streak.currentStreak < 30
                      ? "You&apos;re on fire! Amazing! 🌟"
                      : "Legendary dedication! 🏆"}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
};
