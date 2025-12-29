"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Zap,
  Flame,
  Target,
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
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAchievements,
  AchievementData,
} from "../../_hooks/use-achievements";

// Icon mapping for achievements
const ACHIEVEMENT_ICONS: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  first_step: {
    icon: Rocket,
    color: "text-blue-500",
    bgColor: "from-blue-400 to-blue-600",
  },
  getting_started: {
    icon: Star,
    color: "text-yellow-500",
    bgColor: "from-yellow-400 to-yellow-600",
  },
  making_progress: {
    icon: Target,
    color: "text-emerald-500",
    bgColor: "from-emerald-400 to-emerald-600",
  },
  halfway_hero: {
    icon: Medal,
    color: "text-purple-500",
    bgColor: "from-purple-400 to-purple-600",
  },
  almost_there: {
    icon: Shield,
    color: "text-indigo-500",
    bgColor: "from-indigo-400 to-indigo-600",
  },
  course_master: {
    icon: Crown,
    color: "text-amber-500",
    bgColor: "from-amber-400 to-amber-600",
  },
  streak_starter: {
    icon: Flame,
    color: "text-orange-500",
    bgColor: "from-orange-400 to-orange-600",
  },
  week_warrior: {
    icon: Zap,
    color: "text-red-500",
    bgColor: "from-red-400 to-red-600",
  },
  dedicated_learner: {
    icon: Heart,
    color: "text-pink-500",
    bgColor: "from-pink-400 to-pink-600",
  },
  unstoppable: {
    icon: Gem,
    color: "text-cyan-500",
    bgColor: "from-cyan-400 to-cyan-600",
  },
  study_session: {
    icon: Clock,
    color: "text-slate-500",
    bgColor: "from-slate-400 to-slate-600",
  },
  dedicated_time: {
    icon: Brain,
    color: "text-violet-500",
    bgColor: "from-violet-400 to-violet-600",
  },
};

interface AchievementsPanelProps {
  courseId: string;
}

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

export function AchievementsPanel({ courseId }: AchievementsPanelProps) {
  const [selectedAchievement, setSelectedAchievement] =
    useState<AchievementData | null>(null);
  const [showUnlocked, setShowUnlocked] = useState(true);

  // Fetch achievements from API
  const { data, isLoading, error, refetch } = useAchievements(courseId);

  // Loading state
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading achievements...
            </p>
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
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
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
  if (!data) {
    return null;
  }

  const { achievements, totalPoints, level, unlockedCount, totalCount } = data;

  // Split achievements into unlocked and locked
  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = achievements.filter((a) => !a.isUnlocked);

  // Calculate level progress
  const pointsToNextLevel = 50 - (totalPoints % 50);
  const levelProgress = ((totalPoints % 50) / 50) * 100;

  // Count legendary achievements
  const legendaryCount = unlockedAchievements.filter(
    (a) => a.rarity === "legendary"
  ).length;

  return (
    <section className="space-y-6" aria-labelledby="achievements-title">
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
                  aria-hidden="true"
                >
                  <Trophy className="h-8 w-8 text-white" aria-hidden="true" />
                </motion.div>
                <div>
                  <h2 id="achievements-title" className="text-2xl font-bold text-white">
                    Achievements
                  </h2>
                  <p className="text-amber-100" role="status">
                    {unlockedCount} of {totalCount} unlocked
                  </p>
                </div>
              </div>

              {/* Level Badge */}
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-300" aria-hidden="true" />
                  <span className="text-white font-bold text-lg" role="status">
                    Level {level}
                  </span>
                </div>
                <div className="w-32">
                  <Progress
                    value={levelProgress}
                    className="h-2 bg-white/20"
                    aria-label={`Level progress: ${Math.round(levelProgress)}%`}
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
            <dl className="flex items-center justify-center gap-8 py-4 mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="text-center">
                <dd className="text-3xl font-bold text-amber-500">
                  {totalPoints}
                </dd>
                <dt className="text-sm text-slate-500">Total Points</dt>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
              <div className="text-center">
                <dd className="text-3xl font-bold text-emerald-500">
                  {unlockedCount}
                </dd>
                <dt className="text-sm text-slate-500">Achievements</dt>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
              <div className="text-center">
                <dd className="text-3xl font-bold text-purple-500">
                  {legendaryCount}
                </dd>
                <dt className="text-sm text-slate-500">Legendary</dt>
              </div>
            </dl>

            {/* Toggle Buttons */}
            <div className="flex gap-2 mb-6" role="tablist" aria-label="Achievement filter">
              <Button
                role="tab"
                aria-selected={showUnlocked}
                aria-controls="achievements-grid"
                variant={showUnlocked ? "default" : "outline"}
                onClick={() => setShowUnlocked(true)}
                className="flex-1 focus:ring-2 focus:ring-offset-2"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Unlocked ({unlockedAchievements.length})
              </Button>
              <Button
                role="tab"
                aria-selected={!showUnlocked}
                aria-controls="achievements-grid"
                variant={!showUnlocked ? "default" : "outline"}
                onClick={() => setShowUnlocked(false)}
                className="flex-1 focus:ring-2 focus:ring-offset-2"
              >
                <Lock className="h-4 w-4 mr-2" aria-hidden="true" />
                Locked ({lockedAchievements.length})
              </Button>
            </div>

            {/* Achievements Grid */}
            <div
              id="achievements-grid"
              role="tabpanel"
              aria-label={showUnlocked ? "Unlocked achievements" : "Locked achievements"}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {(showUnlocked ? unlockedAchievements : lockedAchievements).map(
                  (achievement, index) => {
                    const rarityStyle = RARITY_STYLES[achievement.rarity];
                    const isUnlocked = achievement.isUnlocked;
                    const iconConfig = ACHIEVEMENT_ICONS[achievement.id] || {
                      icon: Trophy,
                      color: "text-amber-500",
                      bgColor: "from-amber-400 to-amber-600",
                    };
                    const Icon = iconConfig.icon;
                    const isSelected = selectedAchievement?.id === achievement.id;

                    return (
                      <motion.article
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: 0.05 * index }}
                        whileHover={{ scale: 1.05 }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`${achievement.title}: ${achievement.description}. ${isUnlocked ? "Unlocked" : "Locked"}. Rarity: ${rarityStyle.label}`}
                        onClick={() =>
                          setSelectedAchievement(
                            isSelected ? null : achievement
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedAchievement(
                              isSelected ? null : achievement
                            );
                          }
                        }}
                        className={cn(
                          "relative cursor-pointer rounded-xl border-2 p-4 transition-all",
                          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500",
                          rarityStyle.border,
                          isUnlocked
                            ? `shadow-lg ${rarityStyle.glow}`
                            : "opacity-60",
                          isSelected && "ring-2 ring-offset-2 ring-amber-500"
                        )}
                      >
                        {/* Rarity Label */}
                        <Badge
                          className={cn(
                            "absolute -top-2 -right-2 text-xs",
                            rarityStyle.labelColor
                          )}
                          aria-hidden="true"
                        >
                          {rarityStyle.label}
                        </Badge>

                        {/* Icon */}
                        <div
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3",
                            isUnlocked
                              ? `bg-gradient-to-br ${iconConfig.bgColor} text-white shadow-lg`
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          )}
                          aria-hidden="true"
                        >
                          {isUnlocked ? (
                            <Icon className="h-7 w-7" aria-hidden="true" />
                          ) : (
                            <Lock className="h-6 w-6" aria-hidden="true" />
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
                        {!isUnlocked && achievement.currentValue !== undefined && (
                          <div className="mt-3">
                            <Progress
                              value={
                                (achievement.currentValue /
                                  achievement.requirement) *
                                100
                              }
                              className="h-1"
                              aria-label={`Progress: ${achievement.currentValue} of ${achievement.requirement}`}
                            />
                            <p className="text-xs text-center text-slate-400 mt-1" aria-hidden="true">
                              {achievement.currentValue}/
                              {achievement.requirement}
                            </p>
                          </div>
                        )}

                        {/* Unlocked sparkle effect - decorative */}
                        {isUnlocked && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 pointer-events-none"
                            aria-hidden="true"
                          >
                            <Sparkles className="absolute top-2 left-2 h-3 w-3 text-amber-400" />
                            <Sparkles className="absolute bottom-2 right-2 h-3 w-3 text-amber-400" />
                          </motion.div>
                        )}
                      </motion.article>
                    );
                  }
                )}
              </AnimatePresence>
            </div>

            {/* Selected Achievement Detail */}
            <AnimatePresence>
              {selectedAchievement && (() => {
                const selectedIconConfig = ACHIEVEMENT_ICONS[selectedAchievement.id] || {
                  icon: Trophy,
                  color: "text-amber-500",
                  bgColor: "from-amber-400 to-amber-600",
                };
                const SelectedIcon = selectedIconConfig.icon;

                return (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 overflow-hidden"
                    role="region"
                    aria-label="Selected achievement details"
                    aria-live="polite"
                  >
                    <div
                      className={cn(
                        "p-6 rounded-xl bg-gradient-to-r text-white",
                        selectedIconConfig.bgColor
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center" aria-hidden="true">
                          <SelectedIcon className="h-8 w-8" aria-hidden="true" />
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
                );
              })()}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
