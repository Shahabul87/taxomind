"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Star, Zap, Target, Award,
  Crown, Medal, Flame, TrendingUp,
  BookOpen, Users, Loader2, AlertCircle,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "next-auth";
import { toast } from "sonner";

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
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Star;
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "border-gray-300 bg-gray-50";
      case "rare": return "border-blue-300 bg-blue-50";
      case "epic": return "border-purple-300 bg-purple-50";
      case "legendary": return "border-yellow-300 bg-yellow-50";
      default: return "border-gray-300 bg-gray-50";
    }
  };

  const progressAchievements = achievements.filter(a => !a.unlocked && a.progress !== undefined);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-purple-50/50">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-red-50/50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Gamification</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={fetchGamificationData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-purple-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-white">Level Progress</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchGamificationData}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Level {levelInfo.currentLevel}</h3>
                  <p className="text-sm text-slate-400">{levelInfo.levelName}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-purple-600">
                    {levelInfo.totalXP.toLocaleString()} XP
                  </div>
                  <div className="text-sm text-slate-500">
                    {(levelInfo.nextLevelXP - levelInfo.currentXP).toLocaleString()} XP to next level
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Progress to Level {levelInfo.currentLevel + 1}</span>
                  <span className="font-medium">{Math.round(progressToNextLevel)}%</span>
                </div>
                <Progress value={progressToNextLevel} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streaks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-orange-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-white">Learning Streaks</span>
              {streakData.streakFreezeAvailable && (
                <Badge variant="outline" className="ml-auto text-blue-400 border-blue-400">
                  Freeze Available
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Flame className="w-6 h-6 text-orange-600" />
                  <span className="text-3xl font-bold text-orange-600">{streakData.currentStreak}</span>
                </div>
                <p className="text-sm text-slate-400">Current Streak</p>
                <p className="text-xs text-slate-500">Days in a row</p>
              </div>

              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <span className="text-3xl font-bold text-yellow-600">{streakData.longestStreak}</span>
                </div>
                <p className="text-sm text-slate-400">Longest Streak</p>
                <p className="text-xs text-slate-500">Personal best</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-purple-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-white">Recent Badges</span>
              {badges.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {badges.length} earned
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No badges earned yet</p>
                <p className="text-sm text-slate-500 mt-1">Complete courses and activities to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badges.slice(0, 4).map((badge, index) => {
                  const BadgeIcon = getIconComponent(badge.icon);
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-3 rounded-lg border-2 ${getRarityColor(badge.rarity)} transition-all duration-200 hover:scale-105`}
                    >
                      <div className="text-center">
                        <div className={`p-2 rounded-full bg-gradient-to-r ${badge.color} text-white mx-auto mb-2 w-fit`}>
                          <BadgeIcon className="w-4 h-4" />
                        </div>
                        <h4 className="font-medium text-sm text-white mb-1">{badge.name}</h4>
                        <p className="text-xs text-slate-400 mb-1">{badge.description}</p>
                        <Badge variant="outline" className="text-xs">
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
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-green-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-white">Achievements in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressAchievements.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>All achievements unlocked or none started</p>
                <p className="text-sm text-slate-500 mt-1">Keep learning to discover more achievements!</p>
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
                      className="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-600/30 rounded-lg"
                    >
                      <div className={`p-2 rounded-full bg-gradient-to-r ${achievement.color} text-white`}>
                        <AchievementIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-white">{achievement.title}</h4>
                          <span className="text-sm text-slate-400">
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{achievement.description}</p>
                        <div className="space-y-1">
                          <Progress value={progressPercent} className="h-2" />
                          <p className="text-xs text-slate-500">Reward: {achievement.reward}</p>
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
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-purple-50/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                className="h-auto p-3 bg-slate-800/60 border border-slate-600/30 hover:bg-slate-700/80 border border-white/20 rounded-lg transition-all duration-200"
              >
                <div className="text-center">
                  <Trophy className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                  <span className="text-sm font-medium">All Achievements</span>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="h-auto p-3 bg-slate-800/60 border border-slate-600/30 hover:bg-slate-700/80 border border-white/20 rounded-lg transition-all duration-200"
              >
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <span className="text-sm font-medium">Leaderboard</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
