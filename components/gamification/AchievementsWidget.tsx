"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Lock,
  Flame,
  CheckCircle2,
  Crown,
  MessageCircle,
  Zap,
  Clock,
  Users,
  Star,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAchievements } from "@/hooks/use-gamification";
import {
  AchievementCategory,
  AchievementRarity,
  RARITY_CONFIG,
  CATEGORY_ICONS,
} from "@/types/gamification";
import { cn } from "@/lib/utils";

interface AchievementsWidgetProps {
  maxDisplay?: number;
  showCategories?: boolean;
}

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame,
  CheckCircle2,
  Crown,
  MessageCircle,
  Zap,
  Clock,
  Users,
  Star,
};

export function AchievementsWidget({
  maxDisplay = 6,
  showCategories = true,
}: AchievementsWidgetProps) {
  const { achievements, stats, isLoading } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredAchievements =
    selectedCategory === "all"
      ? achievements
      : achievements.filter(
          (a) => a.achievement?.category === selectedCategory
        );

  const displayAchievements = filteredAchievements.slice(0, maxDisplay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-sm relative overflow-hidden"
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                Achievements
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stats?.totalUnlocked || 0} of {stats?.totalAvailable || 0} unlocked
              </p>
            </div>
          </div>

          <Link href="/dashboard/user/achievements">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>

        {/* Category Filter */}
        {showCategories && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
            <CategoryPill
              label="All"
              active={selectedCategory === "all"}
              onClick={() => setSelectedCategory("all")}
            />
            {Object.values(AchievementCategory).map((category) => (
              <CategoryPill
                key={category}
                label={category.charAt(0) + category.slice(1).toLowerCase()}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                icon={CATEGORY_ICONS[category]}
              />
            ))}
          </div>
        )}

        {/* Achievement Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {displayAchievements.map((userAchievement, index) => (
              <AchievementCard
                key={userAchievement.id}
                achievement={userAchievement}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Rarity Legend */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
              <div key={rarity} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {rarity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
}) {
  const IconComponent = icon ? categoryIconMap[icon] : null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
        active
          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
          : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
      )}
    >
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {label}
    </motion.button>
  );
}

function AchievementCard({
  achievement,
  index,
}: {
  achievement: {
    id: string;
    isUnlocked: boolean;
    currentProgress: number;
    targetProgress: number;
    achievement?: {
      name: string;
      description: string;
      icon: string;
      rarity: string;
      xpReward: number;
    } | null;
  };
  index: number;
}) {
  const rarityConfig =
    RARITY_CONFIG[(achievement.achievement?.rarity as AchievementRarity) || "COMMON"];
  const progress = (achievement.currentProgress / achievement.targetProgress) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all cursor-pointer group",
        achievement.isUnlocked
          ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50"
          : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30"
      )}
      style={{
        boxShadow: achievement.isUnlocked
          ? `0 0 20px ${rarityConfig.glowColor}`
          : "none",
      }}
    >
      {/* Rarity indicator */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ backgroundColor: rarityConfig.color }}
      />

      {/* Icon */}
      <div className="flex items-center justify-center mb-3">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform",
            achievement.isUnlocked
              ? "bg-gradient-to-br from-amber-100 dark:from-amber-500/20 to-orange-100 dark:to-orange-500/20"
              : "bg-slate-100 dark:bg-slate-800/50 grayscale"
          )}
        >
          {achievement.isUnlocked ? (
            <span>{achievement.achievement?.icon || "🏆"}</span>
          ) : (
            <Lock className="w-5 h-5 text-slate-400 dark:text-slate-600" />
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="text-center">
        <h4
          className={cn(
            "font-semibold text-sm mb-1 line-clamp-1",
            achievement.isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-500"
          )}
        >
          {achievement.achievement?.name || "Achievement"}
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {achievement.achievement?.description || "Complete to unlock"}
        </p>
      </div>

      {/* Progress Bar (for locked achievements) */}
      {!achievement.isUnlocked && (
        <div className="mt-3">
          <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-slate-400 dark:from-slate-600 to-slate-300 dark:to-slate-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-500 dark:text-slate-600 text-center mt-1">
            {achievement.currentProgress}/{achievement.targetProgress}
          </p>
        </div>
      )}

      {/* XP Reward Badge */}
      {achievement.isUnlocked && achievement.achievement?.xpReward && (
        <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-lg">
          +{achievement.achievement.xpReward} XP
        </div>
      )}
    </motion.div>
  );
}
