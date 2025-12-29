"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Award,
  Star,
  Zap,
  Flame,
  Target,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  Medal,
  Crown,
  Rocket,
  Brain,
  Heart,
  Shield,
  Gem,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  requirement: number;
  type: "progress" | "streak" | "time" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface AchievementsPanelProps {
  courseId: string;
  userId: string;
  progressPercentage: number;
  completedSections: number;
  totalSections: number;
  streakDays?: number;
  totalLearningMinutes?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Progress-based achievements
  {
    id: "first_step",
    title: "First Step",
    description: "Complete your first section",
    icon: Rocket,
    color: "text-blue-500",
    bgColor: "from-blue-400 to-blue-600",
    requirement: 1,
    type: "progress",
    rarity: "common",
  },
  {
    id: "getting_started",
    title: "Getting Started",
    description: "Complete 5 sections",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "from-yellow-400 to-yellow-600",
    requirement: 5,
    type: "progress",
    rarity: "common",
  },
  {
    id: "making_progress",
    title: "Making Progress",
    description: "Complete 10 sections",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "from-emerald-400 to-emerald-600",
    requirement: 10,
    type: "progress",
    rarity: "rare",
  },
  {
    id: "halfway_hero",
    title: "Halfway Hero",
    description: "Complete 50% of the course",
    icon: Medal,
    color: "text-purple-500",
    bgColor: "from-purple-400 to-purple-600",
    requirement: 50,
    type: "milestone",
    rarity: "rare",
  },
  {
    id: "almost_there",
    title: "Almost There",
    description: "Complete 75% of the course",
    icon: Shield,
    color: "text-indigo-500",
    bgColor: "from-indigo-400 to-indigo-600",
    requirement: 75,
    type: "milestone",
    rarity: "epic",
  },
  {
    id: "course_master",
    title: "Course Master",
    description: "Complete the entire course",
    icon: Crown,
    color: "text-amber-500",
    bgColor: "from-amber-400 to-amber-600",
    requirement: 100,
    type: "milestone",
    rarity: "legendary",
  },
  // Streak-based achievements
  {
    id: "streak_starter",
    title: "Streak Starter",
    description: "Maintain a 3-day learning streak",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "from-orange-400 to-orange-600",
    requirement: 3,
    type: "streak",
    rarity: "common",
  },
  {
    id: "week_warrior",
    title: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    icon: Zap,
    color: "text-red-500",
    bgColor: "from-red-400 to-red-600",
    requirement: 7,
    type: "streak",
    rarity: "rare",
  },
  {
    id: "dedicated_learner",
    title: "Dedicated Learner",
    description: "Maintain a 14-day learning streak",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "from-pink-400 to-pink-600",
    requirement: 14,
    type: "streak",
    rarity: "epic",
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    description: "Maintain a 30-day learning streak",
    icon: Gem,
    color: "text-cyan-500",
    bgColor: "from-cyan-400 to-cyan-600",
    requirement: 30,
    type: "streak",
    rarity: "legendary",
  },
  // Time-based achievements
  {
    id: "study_session",
    title: "Study Session",
    description: "Study for 30 minutes total",
    icon: Clock,
    color: "text-slate-500",
    bgColor: "from-slate-400 to-slate-600",
    requirement: 30,
    type: "time",
    rarity: "common",
  },
  {
    id: "dedicated_time",
    title: "Dedicated Time",
    description: "Study for 2 hours total",
    icon: Brain,
    color: "text-violet-500",
    bgColor: "from-violet-400 to-violet-600",
    requirement: 120,
    type: "time",
    rarity: "rare",
  },
];

const RARITY_STYLES = {
  common: {
    border: "border-slate-300 dark:border-slate-600",
    glow: "",
    label: "Common",
    labelColor: "bg-slate-200 text-slate-700",
  },
  rare: {
    border: "border-blue-400 dark:border-blue-500",
    glow: "shadow-blue-500/20",
    label: "Rare",
    labelColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  epic: {
    border: "border-purple-400 dark:border-purple-500",
    glow: "shadow-purple-500/20",
    label: "Epic",
    labelColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  legendary: {
    border: "border-amber-400 dark:border-amber-500",
    glow: "shadow-amber-500/30",
    label: "Legendary",
    labelColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

export function AchievementsPanel({
  courseId,
  userId,
  progressPercentage,
  completedSections,
  totalSections,
  streakDays = 0,
  totalLearningMinutes = 0,
}: AchievementsPanelProps) {
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showUnlocked, setShowUnlocked] = useState(true);

  // Calculate unlocked achievements
  const { unlockedAchievements, lockedAchievements, totalPoints } = useMemo(() => {
    const unlocked: Achievement[] = [];
    const locked: Achievement[] = [];
    let points = 0;

    ACHIEVEMENTS.forEach((achievement) => {
      let isUnlocked = false;
      let currentValue = 0;

      switch (achievement.type) {
        case "progress":
          currentValue = completedSections;
          isUnlocked = completedSections >= achievement.requirement;
          break;
        case "milestone":
          currentValue = progressPercentage;
          isUnlocked = progressPercentage >= achievement.requirement;
          break;
        case "streak":
          currentValue = streakDays;
          isUnlocked = streakDays >= achievement.requirement;
          break;
        case "time":
          currentValue = totalLearningMinutes;
          isUnlocked = totalLearningMinutes >= achievement.requirement;
          break;
      }

      if (isUnlocked) {
        unlocked.push(achievement);
        // Points based on rarity
        points +=
          achievement.rarity === "legendary"
            ? 100
            : achievement.rarity === "epic"
              ? 50
              : achievement.rarity === "rare"
                ? 25
                : 10;
      } else {
        locked.push({ ...achievement, currentValue } as any);
      }
    });

    return {
      unlockedAchievements: unlocked,
      lockedAchievements: locked,
      totalPoints: points,
    };
  }, [
    completedSections,
    progressPercentage,
    streakDays,
    totalLearningMinutes,
  ]);

  // Calculate level based on points
  const level = Math.floor(totalPoints / 50) + 1;
  const pointsToNextLevel = 50 - (totalPoints % 50);
  const levelProgress = ((totalPoints % 50) / 50) * 100;

  return (
    <div className="space-y-6">
      {/* Header Card with Level */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                >
                  <Trophy className="h-8 w-8 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Achievements
                  </h2>
                  <p className="text-amber-100">
                    {unlockedAchievements.length} of {ACHIEVEMENTS.length}{" "}
                    unlocked
                  </p>
                </div>
              </div>

              {/* Level Badge */}
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-300" />
                  <span className="text-white font-bold text-lg">
                    Level {level}
                  </span>
                </div>
                <div className="w-32">
                  <Progress
                    value={levelProgress}
                    className="h-2 bg-white/20"
                  />
                </div>
                <p className="text-amber-100 text-xs mt-1">
                  {pointsToNextLevel} pts to next level
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Points Display */}
            <div className="flex items-center justify-center gap-8 py-4 mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-500">
                  {totalPoints}
                </p>
                <p className="text-sm text-slate-500">Total Points</p>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-500">
                  {unlockedAchievements.length}
                </p>
                <p className="text-sm text-slate-500">Achievements</p>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-500">
                  {ACHIEVEMENTS.filter((a) => a.rarity === "legendary").filter(
                    (a) => unlockedAchievements.includes(a)
                  ).length}
                </p>
                <p className="text-sm text-slate-500">Legendary</p>
              </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={showUnlocked ? "default" : "outline"}
                onClick={() => setShowUnlocked(true)}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Unlocked ({unlockedAchievements.length})
              </Button>
              <Button
                variant={!showUnlocked ? "default" : "outline"}
                onClick={() => setShowUnlocked(false)}
                className="flex-1"
              >
                <Lock className="h-4 w-4 mr-2" />
                Locked ({lockedAchievements.length})
              </Button>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {(showUnlocked ? unlockedAchievements : lockedAchievements).map(
                  (achievement, index) => {
                    const rarityStyle = RARITY_STYLES[achievement.rarity];
                    const isUnlocked = showUnlocked;
                    const Icon = achievement.icon;

                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: 0.05 * index }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() =>
                          setSelectedAchievement(
                            selectedAchievement?.id === achievement.id
                              ? null
                              : achievement
                          )
                        }
                        className={cn(
                          "relative cursor-pointer rounded-xl border-2 p-4 transition-all",
                          rarityStyle.border,
                          isUnlocked
                            ? `shadow-lg ${rarityStyle.glow}`
                            : "opacity-60",
                          selectedAchievement?.id === achievement.id &&
                            "ring-2 ring-offset-2 ring-amber-500"
                        )}
                      >
                        {/* Rarity Label */}
                        <Badge
                          className={cn(
                            "absolute -top-2 -right-2 text-xs",
                            rarityStyle.labelColor
                          )}
                        >
                          {rarityStyle.label}
                        </Badge>

                        {/* Icon */}
                        <div
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3",
                            isUnlocked
                              ? `bg-gradient-to-br ${achievement.bgColor} text-white shadow-lg`
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          )}
                        >
                          {isUnlocked ? (
                            <Icon className="h-7 w-7" />
                          ) : (
                            <Lock className="h-6 w-6" />
                          )}
                        </div>

                        {/* Title */}
                        <h4
                          className={cn(
                            "font-semibold text-center text-sm mb-1",
                            isUnlocked
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-500"
                          )}
                        >
                          {achievement.title}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                          {achievement.description}
                        </p>

                        {/* Progress for locked */}
                        {!isUnlocked && (achievement as any).currentValue !== undefined && (
                          <div className="mt-3">
                            <Progress
                              value={
                                ((achievement as any).currentValue /
                                  achievement.requirement) *
                                100
                              }
                              className="h-1"
                            />
                            <p className="text-xs text-center text-slate-400 mt-1">
                              {(achievement as any).currentValue}/
                              {achievement.requirement}
                            </p>
                          </div>
                        )}

                        {/* Unlocked sparkle effect */}
                        {isUnlocked && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 pointer-events-none"
                          >
                            <Sparkles className="absolute top-2 left-2 h-3 w-3 text-amber-400" />
                            <Sparkles className="absolute bottom-2 right-2 h-3 w-3 text-amber-400" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  }
                )}
              </AnimatePresence>
            </div>

            {/* Selected Achievement Detail */}
            <AnimatePresence>
              {selectedAchievement && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 overflow-hidden"
                >
                  <div
                    className={cn(
                      "p-6 rounded-xl bg-gradient-to-r text-white",
                      `${selectedAchievement.bgColor}`
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                        <selectedAchievement.icon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {selectedAchievement.title}
                        </h3>
                        <p className="text-white/80">
                          {selectedAchievement.description}
                        </p>
                        <Badge className="mt-2 bg-white/20 text-white border-0">
                          {RARITY_STYLES[selectedAchievement.rarity].label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
