"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, Star, Zap, Target, Award, 
  Crown, Medal, Flame, TrendingUp,
  Calendar, ChevronRight, Lock, 
  BookOpen, Users, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "next-auth";

interface GamificationEngineProps {
  user: User;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  reward: string;
  category: "learning" | "social" | "creation" | "milestone";
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any;
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

export function GamificationEngine({ user }: GamificationEngineProps) {
  const [levelInfo] = useState<LevelInfo>({
    currentLevel: 12,
    currentXP: 2450,
    nextLevelXP: 2800,
    totalXP: 15890,
    levelName: "Knowledge Seeker"
  });

  const [achievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "First Steps",
      description: "Complete your first course",
      icon: BookOpen,
      color: "from-green-500 to-emerald-600",
      unlocked: true,
      reward: "100 XP + Learning Badge",
      category: "learning"
    },
    {
      id: "2",
      title: "Streak Master",
      description: "Maintain a 7-day learning streak",
      icon: Flame,
      color: "from-orange-500 to-red-600",
      unlocked: true,
      reward: "200 XP + Consistency Badge",
      category: "learning"
    },
    {
      id: "3",
      title: "Community Helper",
      description: "Help 10 fellow learners",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      unlocked: false,
      progress: 6,
      maxProgress: 10,
      reward: "300 XP + Helper Badge",
      category: "social"
    },
    {
      id: "4",
      title: "Course Creator",
      description: "Create and publish your first course",
      icon: Star,
      color: "from-purple-500 to-pink-600",
      unlocked: true,
      reward: "500 XP + Creator Badge",
      category: "creation"
    },
    {
      id: "5",
      title: "Speed Learner",
      description: "Complete 5 courses in a month",
      icon: Zap,
      color: "from-yellow-500 to-orange-600",
      unlocked: false,
      progress: 3,
      maxProgress: 5,
      reward: "400 XP + Speed Badge",
      category: "learning"
    },
    {
      id: "6",
      title: "Mentor",
      description: "Guide 50 students to course completion",
      icon: Crown,
      color: "from-violet-500 to-purple-600",
      unlocked: false,
      progress: 23,
      maxProgress: 50,
      reward: "1000 XP + Mentor Crown",
      category: "social"
    }
  ]);

  const [badges] = useState<Badge[]>([
    {
      id: "1",
      name: "Early Bird",
      description: "Complete lessons before 9 AM",
      icon: Star,
      color: "from-yellow-500 to-orange-600",
      earnedAt: "2023-12-15",
      rarity: "common"
    },
    {
      id: "2",
      name: "Night Owl",
      description: "Study late into the night",
      icon: Medal,
      color: "from-blue-500 to-indigo-600",
      earnedAt: "2023-12-10",
      rarity: "rare"
    },
    {
      id: "3",
      name: "React Master",
      description: "Complete all React courses",
      icon: Crown,
      color: "from-purple-500 to-pink-600",
      earnedAt: "2023-12-05",
      rarity: "epic"
    },
    {
      id: "4",
      name: "Community Champion",
      description: "Top contributor in discussions",
      icon: Trophy,
      color: "from-green-500 to-emerald-600",
      earnedAt: "2023-12-01",
      rarity: "legendary"
    }
  ]);

  const [currentStreak] = useState(12);
  const [longestStreak] = useState(28);

  const progressToNextLevel = ((levelInfo.currentXP - (levelInfo.nextLevelXP - 350)) / 350) * 100;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "border-gray-300 bg-gray-50";
      case "rare": return "border-blue-300 bg-blue-50";
      case "epic": return "border-purple-300 bg-purple-50";
      case "legendary": return "border-yellow-300 bg-yellow-50";
      default: return "border-gray-300 bg-gray-50";
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const progressAchievements = achievements.filter(a => !a.unlocked && a.progress !== undefined);

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
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-white">Level Progress</span>
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
                    {levelInfo.currentXP} XP
                  </div>
                  <div className="text-sm text-slate-500">
                    {levelInfo.nextLevelXP - levelInfo.currentXP} XP to next level
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Flame className="w-6 h-6 text-orange-600" />
                  <span className="text-3xl font-bold text-orange-600">{currentStreak}</span>
                </div>
                <p className="text-sm text-slate-400">Current Streak</p>
                <p className="text-xs text-slate-500">Days in a row</p>
              </div>
              
              <div className="text-center p-4 bg-slate-800/60 border border-slate-600/30 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <span className="text-3xl font-bold text-yellow-600">{longestStreak}</span>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {badges.slice(0, 4).map((badge, index) => {
                const BadgeIcon = badge.icon;
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
            <div className="space-y-3">
              {progressAchievements.map((achievement, index) => {
                const AchievementIcon = achievement.icon;
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