"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  Calendar,
  TrendingUp,
  Award,
  Star,
  Zap,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StreakTrackerProps {
  courseId: string;
  userId: string;
}

export const StreakTracker = ({ courseId, userId }: StreakTrackerProps) => {
  const [streak, setStreak] = useState({
    current: 0,
    longest: 0,
    lastActivity: new Date(),
    thisWeek: [false, true, true, false, true, false, false], // Mon-Sun
  });

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Load streak data from localStorage
    const savedStreak = localStorage.getItem(`streak_${courseId}_${userId}`);
    if (savedStreak) {
      setStreak(JSON.parse(savedStreak));
    }

    // Check if user studied today
    const today = new Date().toDateString();
    const lastActivity = new Date(streak.lastActivity).toDateString();

    if (today !== lastActivity) {
      // New day - could update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (yesterday.toDateString() === lastActivity) {
        // Consecutive day - increment streak
        const newStreak = {
          ...streak,
          current: streak.current + 1,
          longest: Math.max(streak.longest, streak.current + 1),
          lastActivity: new Date(),
        };
        setStreak(newStreak);
        localStorage.setItem(`streak_${courseId}_${userId}`, JSON.stringify(newStreak));
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    }
  }, [courseId, userId, streak]);

  const getStreakLevel = (days: number) => {
    if (days >= 30) return { level: 'Legendary', color: 'from-purple-500 to-pink-500', icon: Trophy };
    if (days >= 14) return { level: 'Epic', color: 'from-orange-500 to-red-500', icon: Award };
    if (days >= 7) return { level: 'Great', color: 'from-yellow-500 to-orange-500', icon: Star };
    if (days >= 3) return { level: 'Good', color: 'from-green-500 to-emerald-500', icon: Zap };
    return { level: 'Building', color: 'from-blue-500 to-indigo-500', icon: Flame };
  };

  const streakInfo = getStreakLevel(streak.current);
  const StreakIcon = streakInfo.icon;

  // Calculate progress to next milestone
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find(m => m > streak.current) || 365;
  const progressToNext = (streak.current / nextMilestone) * 100;

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
      {/* Animated background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-10",
        streakInfo.color
      )}></div>

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br",
              streakInfo.color
            )}>
              <StreakIcon className="w-5 h-5 text-white" />
            </div>
            <span>Learning Streak</span>
          </div>
          <Badge variant="secondary" className={cn(
            "bg-gradient-to-r text-white border-0",
            streakInfo.color
          )}>
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
        >
          <div className="relative">
            <motion.div
              animate={isAnimating ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Flame className={cn(
                "w-16 h-16 mx-auto mb-3",
                streak.current > 0 ? "text-orange-500" : "text-slate-400"
              )} />
            </motion.div>

            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 0 }}
                  animate={{ opacity: 1, scale: 1.5, y: -30 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 text-orange-500 font-bold text-2xl"
                >
                  +1
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            {streak.current}
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            {streak.current === 1 ? 'day streak' : 'days streak'}
          </p>
        </motion.div>

        {/* Weekly Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              This Week
            </h4>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {streak.thisWeek.filter(Boolean).length}/7 days
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="text-center"
              >
                <div className={cn(
                  "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200",
                  streak.thisWeek[index]
                    ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                )}>
                  {streak.thisWeek[index] ? '✓' : day[0]}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {day}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress to Next Milestone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Next Milestone
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {nextMilestone} days
            </span>
          </div>
          <Progress value={progressToNext} className="h-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {nextMilestone - streak.current} more days to unlock reward!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {streak.longest}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Longest Streak
            </p>
          </div>

          <div className="text-center p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-lg">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {Math.ceil(progressToNext)}%
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              To Next Level
            </p>
          </div>
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "p-4 rounded-lg text-center bg-gradient-to-r text-white",
            streakInfo.color
          )}
        >
          <p className="text-sm font-medium">
            {streak.current === 0 ? "Start your streak today! 🚀" :
             streak.current < 3 ? "Great start! Keep going! 💪" :
             streak.current < 7 ? "You're building momentum! 🔥" :
             streak.current < 14 ? "Unstoppable! Keep it up! ⚡" :
             streak.current < 30 ? "You're on fire! Amazing! 🌟" :
             "Legendary dedication! 🏆"}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
};
