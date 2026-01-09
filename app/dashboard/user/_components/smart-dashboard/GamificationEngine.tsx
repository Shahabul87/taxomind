"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Star, Zap, Target, Award,
  Crown, Medal, Flame, TrendingUp,
  BookOpen, Users, Loader2, AlertCircle,
  RefreshCw, Sparkles, Lock, CheckCircle2,
  ChevronRight, Shield, Gem
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "next-auth";
import { cn } from "@/lib/utils";

interface GamificationEngineProps {
  user: User;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  reward: string;
  category: "learning" | "social" | "creation" | "milestone";
}

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  levelName: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakFreezeAvailable: boolean;
}

interface StatsData {
  coursesCompleted: number;
  totalLearningTime: number;
  averageScore: number;
  rank: number;
}

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Flame,
  Users,
  Star,
  Zap,
  Crown,
  Medal,
  Trophy,
  Target,
  Award,
  Sparkles,
  Shield,
  Gem,
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Star;
};

// Rarity configuration with colors and labels
const rarityConfig = {
  common: {
    label: "Common",
    bgLight: "bg-slate-100",
    bgDark: "dark:bg-slate-800",
    borderLight: "border-slate-200",
    borderDark: "dark:border-slate-700",
    textLight: "text-slate-600",
    textDark: "dark:text-slate-400",
    badgeBg: "bg-slate-100 dark:bg-slate-700",
    badgeText: "text-slate-700 dark:text-slate-300",
  },
  uncommon: {
    label: "Uncommon",
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-900/20",
    borderLight: "border-emerald-200",
    borderDark: "dark:border-emerald-800",
    textLight: "text-emerald-600",
    textDark: "dark:text-emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  rare: {
    label: "Rare",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-900/20",
    borderLight: "border-blue-200",
    borderDark: "dark:border-blue-800",
    textLight: "text-blue-600",
    textDark: "dark:text-blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-900/40",
    badgeText: "text-blue-700 dark:text-blue-300",
  },
  epic: {
    label: "Epic",
    bgLight: "bg-purple-50",
    bgDark: "dark:bg-purple-900/20",
    borderLight: "border-purple-200",
    borderDark: "dark:border-purple-800",
    textLight: "text-purple-600",
    textDark: "dark:text-purple-400",
    badgeBg: "bg-purple-100 dark:bg-purple-900/40",
    badgeText: "text-purple-700 dark:text-purple-300",
  },
  legendary: {
    label: "Legendary",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-900/20",
    borderLight: "border-amber-300",
    borderDark: "dark:border-amber-700",
    textLight: "text-amber-600",
    textDark: "dark:text-amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-900/40",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
};

export function GamificationEngine({ user }: GamificationEngineProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo>({
    currentLevel: 1,
    currentXP: 0,
    nextLevelXP: 100,
    totalXP: 0,
    levelName: "Beginner"
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: "",
    streakFreezeAvailable: false
  });
  const [stats, setStats] = useState<StatsData | null>(null);

  // Fetch gamification data from SAM APIs
  const fetchGamificationData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all gamification data in parallel
      const [pointsRes, badgesRes, streaksRes, statsRes, achievementsRes] = await Promise.all([
        fetch("/api/sam/points").catch(() => null),
        fetch("/api/sam/badges").catch(() => null),
        fetch("/api/sam/streaks").catch(() => null),
        fetch("/api/sam/stats").catch(() => null),
        fetch("/api/sam/gamification/achievements").catch(() => null)
      ]);

      // Process points/level data
      if (pointsRes?.ok) {
        const pointsData = await pointsRes.json();
        if (pointsData.success && pointsData.data) {
          setLevelInfo({
            currentLevel: pointsData.data.level ?? 1,
            currentXP: pointsData.data.currentXP ?? 0,
            nextLevelXP: pointsData.data.nextLevelXP ?? 100,
            totalXP: pointsData.data.totalPoints ?? 0,
            levelName: pointsData.data.levelName ?? getLevelName(pointsData.data.level ?? 1)
          });
        }
      }

      // Process badges data
      if (badgesRes?.ok) {
        const badgesData = await badgesRes.json();
        if (badgesData.success && Array.isArray(badgesData.data)) {
          setBadges(badgesData.data.map((badge: Record<string, unknown>) => ({
            id: badge.id as string,
            name: badge.name as string ?? badge.type as string ?? "Badge",
            description: badge.description as string ?? "",
            icon: badge.icon as string ?? "Star",
            color: badge.color as string ?? "from-purple-500 to-pink-600",
            earnedAt: badge.earnedAt as string ?? badge.createdAt as string ?? new Date().toISOString(),
            rarity: badge.rarity as BadgeData["rarity"] ?? "common"
          })));
        }
      }

      // Process streaks data
      if (streaksRes?.ok) {
        const streaksData = await streaksRes.json();
        if (streaksData.success && streaksData.data) {
          setStreakData({
            currentStreak: streaksData.data.currentStreak ?? 0,
            longestStreak: streaksData.data.longestStreak ?? 0,
            lastActivityDate: streaksData.data.lastActivityDate ?? "",
            streakFreezeAvailable: streaksData.data.streakFreezeAvailable ?? false
          });
        }
      }

      // Process stats data
      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      }

      // Process achievements data
      if (achievementsRes?.ok) {
        const achievementsData = await achievementsRes.json();
        if (achievementsData.success && Array.isArray(achievementsData.data)) {
          setAchievements(achievementsData.data.map((achievement: Record<string, unknown>) => ({
            id: achievement.id as string,
            title: achievement.title as string ?? achievement.name as string ?? "Achievement",
            description: achievement.description as string ?? "",
            icon: achievement.icon as string ?? "Trophy",
            color: achievement.color as string ?? "from-green-500 to-emerald-600",
            unlocked: achievement.unlocked as boolean ?? achievement.isUnlocked as boolean ?? false,
            progress: achievement.progress as number,
            maxProgress: achievement.maxProgress as number ?? achievement.target as number,
            reward: achievement.reward as string ?? `${achievement.xpReward ?? 100} XP`,
            category: achievement.category as Achievement["category"] ?? "learning"
          })));
        }
      }

    } catch (err) {
      console.error("Error fetching gamification data:", err);
      setError("Failed to load gamification data");
      // Use fallback data on error
      setLevelInfo({
        currentLevel: 1,
        currentXP: 0,
        nextLevelXP: 100,
        totalXP: 0,
        levelName: "Beginner"
      });
      setAchievements([
        {
          id: "1",
          title: "First Steps",
          description: "Complete your first course",
          icon: "BookOpen",
          color: "from-green-500 to-emerald-600",
          unlocked: false,
          progress: 0,
          maxProgress: 1,
          reward: "100 XP + Learning Badge",
          category: "learning"
        },
        {
          id: "2",
          title: "Streak Master",
          description: "Maintain a 7-day learning streak",
          icon: "Flame",
          color: "from-orange-500 to-red-600",
          unlocked: false,
          progress: 0,
          maxProgress: 7,
          reward: "200 XP + Consistency Badge",
          category: "learning"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Get level name based on level number
  const getLevelName = (level: number): string => {
    if (level < 5) return "Beginner";
    if (level < 10) return "Learner";
    if (level < 15) return "Explorer";
    if (level < 20) return "Knowledge Seeker";
    if (level < 30) return "Scholar";
    if (level < 50) return "Expert";
    return "Master";
  };

  // Fetch data on mount
  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  const progressToNextLevel = levelInfo.nextLevelXP > 0
    ? ((levelInfo.currentXP) / (levelInfo.nextLevelXP)) * 100
    : 0;

  const getRarityStyles = (rarity: string) => {
    const config = rarityConfig[rarity as keyof typeof rarityConfig] || rarityConfig.common;
    return config;
  };

  const progressAchievements = achievements.filter(a => !a.unlocked && a.progress !== undefined);
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Level Progress Skeleton */}
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </CardContent>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Badges Skeleton */}
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Failed to Load Achievements
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            {error}
          </p>
          <Button
            onClick={fetchGamificationData}
            variant="outline"
            className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level Progress - Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Gradient accent line */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40">
                  <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-slate-900 dark:text-white font-semibold">Level Progress</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchGamificationData}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      Level {levelInfo.currentLevel}
                    </span>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2.5 py-0.5 rounded-full">
                      {levelInfo.levelName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {levelInfo.totalXP.toLocaleString()}
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">XP</span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {(levelInfo.nextLevelXP - levelInfo.currentXP).toLocaleString()} to next level
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Progress to Level {levelInfo.currentLevel + 1}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {Math.round(progressToNextLevel)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNextLevel}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streaks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-slate-900 dark:text-white font-semibold">Learning Streaks</span>
              {streakData.streakFreezeAvailable && (
                <Badge className="ml-auto bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Freeze Available
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-100 dark:border-orange-800/50">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="w-7 h-7 text-orange-500" />
                  <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                    {streakData.currentStreak}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                  Current Streak
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5">
                  Days in a row
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-100 dark:border-amber-800/50">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-7 h-7 text-amber-500" />
                  <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                    {streakData.longestStreak}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                  Longest Streak
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5">
                  Personal best
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40">
                <Award className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-slate-900 dark:text-white font-semibold">Recent Badges</span>
              {badges.length > 0 && (
                <Badge className="ml-auto bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800">
                  {badges.length} earned
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {badges.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Award className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
                  No badges earned yet
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Complete courses and activities to earn your first badge!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badges.slice(0, 4).map((badge, index) => {
                  const BadgeIcon = getIconComponent(badge.icon);
                  const rarityStyles = getRarityStyles(badge.rarity);
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                        rarityStyles.bgLight,
                        rarityStyles.bgDark,
                        rarityStyles.borderLight,
                        rarityStyles.borderDark
                      )}
                    >
                      <div className="text-center">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${badge.color} text-white mx-auto mb-3 w-fit shadow-lg shadow-purple-500/20`}>
                          <BadgeIcon className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1 line-clamp-1">
                          {badge.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2 min-h-[2rem]">
                          {badge.description}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs capitalize",
                            rarityStyles.badgeBg,
                            rarityStyles.badgeText,
                            "border-0"
                          )}
                        >
                          {badge.rarity}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements in Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-slate-900 dark:text-white font-semibold">Achievements in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {progressAchievements.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
                  {unlockedAchievements.length > 0 ? "All caught up!" : "No achievements started"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Keep learning to discover and complete more achievements!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {progressAchievements.map((achievement, index) => {
                  const AchievementIcon = getIconComponent(achievement.icon);
                  const progressPercent = achievement.progress && achievement.maxProgress
                    ? (achievement.progress / achievement.maxProgress) * 100
                    : 0;

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${achievement.color} text-white shadow-lg flex-shrink-0`}>
                        <AchievementIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white truncate pr-2">
                            {achievement.title}
                          </h4>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
                          {achievement.description}
                        </p>
                        <div className="space-y-2">
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r ${achievement.color}`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Reward: {achievement.reward}
                            </span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {Math.round(progressPercent)}% complete
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
              >
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60 transition-colors">
                  <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  All Achievements
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
              >
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 transition-colors">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Leaderboard
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
