"use client";

import { useState, useMemo } from "react";
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
  Search,
  Filter,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Grid3X3,
  List,
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

type ViewMode = "grid" | "list";
type SortBy = "name" | "rarity" | "progress" | "xp";

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

const categoryLabels: Record<AchievementCategory, string> = {
  [AchievementCategory.STREAK]: "Streak",
  [AchievementCategory.COMPLETION]: "Completion",
  [AchievementCategory.MASTERY]: "Mastery",
  [AchievementCategory.ENGAGEMENT]: "Engagement",
  [AchievementCategory.SPEED]: "Speed",
  [AchievementCategory.DEDICATION]: "Dedication",
  [AchievementCategory.SOCIAL]: "Social",
  [AchievementCategory.SPECIAL]: "Special",
};

const rarityOrder: Record<AchievementRarity, number> = {
  [AchievementRarity.COMMON]: 1,
  [AchievementRarity.UNCOMMON]: 2,
  [AchievementRarity.RARE]: 3,
  [AchievementRarity.EPIC]: 4,
  [AchievementRarity.LEGENDARY]: 5,
};

export default function AllAchievementsPage() {
  const { achievements, stats, isLoading, error } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("rarity");
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = achievements;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((a) => a.achievement?.category === selectedCategory);
    }

    // Filter by rarity
    if (selectedRarity !== "all") {
      filtered = filtered.filter((a) => a.achievement?.rarity === selectedRarity);
    }

    // Filter by unlock status
    if (showUnlockedOnly) {
      filtered = filtered.filter((a) => a.isUnlocked);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.achievement?.name.toLowerCase().includes(query) ||
          a.achievement?.description.toLowerCase().includes(query)
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.achievement?.name || "").localeCompare(b.achievement?.name || "");
        case "rarity":
          const rarityA = rarityOrder[(a.achievement?.rarity as AchievementRarity) || "COMMON"];
          const rarityB = rarityOrder[(b.achievement?.rarity as AchievementRarity) || "COMMON"];
          return rarityB - rarityA;
        case "progress":
          const progressA = a.targetProgress > 0 ? a.currentProgress / a.targetProgress : 0;
          const progressB = b.targetProgress > 0 ? b.currentProgress / b.targetProgress : 0;
          return progressB - progressA;
        case "xp":
          return (b.achievement?.xpReward || 0) - (a.achievement?.xpReward || 0);
        default:
          return 0;
      }
    });
  }, [achievements, selectedCategory, selectedRarity, searchQuery, sortBy, showUnlockedOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">Failed to load achievements</p>
          <Link
            href="/dashboard/user"
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/user"
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  All Achievements
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Track your progress and unlock rewards
                </p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={<Trophy className="w-5 h-5" />}
            label="Unlocked"
            value={`${stats?.totalUnlocked || 0}/${stats?.totalAvailable || 0}`}
            color="amber"
          />
          <StatsCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Progress"
            value={`${stats?.totalAvailable ? Math.round(((stats?.totalUnlocked || 0) / stats.totalAvailable) * 100) : 0}%`}
            color="emerald"
          />
          <StatsCard
            icon={<Sparkles className="w-5 h-5" />}
            label="Legendary"
            value={`${stats?.byRarity?.LEGENDARY || 0}`}
            color="violet"
          />
          <StatsCard
            icon={<Zap className="w-5 h-5" />}
            label="Epic"
            value={`${stats?.byRarity?.EPIC || 0}`}
            color="purple"
          />
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as AchievementCategory | "all")}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              >
                <option value="all">All Categories</option>
                {Object.values(AchievementCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Rarity Filter */}
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as AchievementRarity | "all")}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
            >
              <option value="all">All Rarities</option>
              {Object.values(AchievementRarity).map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity.charAt(0) + rarity.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
            >
              <option value="rarity">Sort by Rarity</option>
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
              <option value="xp">Sort by XP</option>
            </select>

            {/* Unlocked Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={showUnlockedOnly}
                onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Unlocked Only
              </span>
            </label>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <CategoryPill
            label="All"
            active={selectedCategory === "all"}
            onClick={() => setSelectedCategory("all")}
            count={achievements.length}
          />
          {Object.values(AchievementCategory).map((category) => {
            const count = achievements.filter((a) => a.achievement?.category === category).length;
            return (
              <CategoryPill
                key={category}
                label={categoryLabels[category]}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                icon={CATEGORY_ICONS[category]}
                count={count}
              />
            );
          })}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredAndSortedAchievements.length} of {achievements.length} achievements
          </p>
        </div>

        {/* Achievements Grid/List */}
        {filteredAndSortedAchievements.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-12 text-center">
            <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No achievements found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedAchievements.map((achievement, index) => (
                <AchievementCard key={achievement.id} achievement={achievement} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedAchievements.map((achievement, index) => (
                <AchievementListItem key={achievement.id} achievement={achievement} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "amber" | "emerald" | "violet" | "purple";
}) {
  const colorClasses = {
    amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    violet: "from-violet-500 to-purple-600 shadow-violet-500/20",
    purple: "from-purple-500 to-indigo-600 shadow-purple-500/20",
  };

  const textColorClasses = {
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    violet: "text-violet-600 dark:text-violet-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
            colorClasses[color]
          )}
        >
          <div className="text-white">{icon}</div>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className={cn("text-xl font-bold", textColorClasses[color])}>{value}</p>
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
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
  count?: number;
}) {
  const IconComponent = icon ? categoryIconMap[icon] : null;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
        active
          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-400"
      )}
    >
      {IconComponent && <IconComponent className="w-4 h-4" />}
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-md text-xs font-semibold",
            active
              ? "bg-white/20 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          )}
        >
          {count}
        </span>
      )}
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
    unlockedAt?: Date | null;
    achievement?: {
      name: string;
      description: string;
      icon: string;
      rarity: string;
      xpReward: number;
      category: string;
    } | null;
  };
  index: number;
}) {
  const rarityConfig =
    RARITY_CONFIG[(achievement.achievement?.rarity as AchievementRarity) || "COMMON"];
  const progress =
    achievement.targetProgress > 0
      ? (achievement.currentProgress / achievement.targetProgress) * 100
      : 0;
  const IconComponent = achievement.achievement?.category
    ? categoryIconMap[CATEGORY_ICONS[achievement.achievement.category as AchievementCategory]]
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn(
        "relative p-5 rounded-2xl border transition-all cursor-pointer group",
        achievement.isUnlocked
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/50"
          : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30"
      )}
      style={{
        boxShadow: achievement.isUnlocked ? `0 8px 32px ${rarityConfig.glowColor}` : "none",
      }}
    >
      {/* Rarity indicator */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: rarityConfig.color }}
      />

      {/* Category badge */}
      {achievement.achievement?.category && (
        <div className="absolute top-3 right-3">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50">
            {IconComponent && (
              <IconComponent className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="flex items-center justify-center mb-4 mt-2">
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110",
            achievement.isUnlocked
              ? "bg-gradient-to-br from-amber-100 dark:from-amber-500/20 to-orange-100 dark:to-orange-500/20"
              : "bg-slate-100 dark:bg-slate-800/50 grayscale"
          )}
        >
          {achievement.isUnlocked ? (
            <span>{achievement.achievement?.icon || "🏆"}</span>
          ) : (
            <Lock className="w-6 h-6 text-slate-400 dark:text-slate-600" />
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="text-center">
        <h4
          className={cn(
            "font-bold text-base mb-1.5 line-clamp-1",
            achievement.isUnlocked
              ? "text-slate-900 dark:text-white"
              : "text-slate-500 dark:text-slate-500"
          )}
        >
          {achievement.achievement?.name || "Achievement"}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {achievement.achievement?.description || "Complete to unlock"}
        </p>
      </div>

      {/* Rarity Badge */}
      <div className="flex justify-center mt-3">
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: rarityConfig.bgColor,
            color: rarityConfig.color,
          }}
        >
          {achievement.achievement?.rarity || "Common"}
        </span>
      </div>

      {/* Progress Bar (for locked achievements) */}
      {!achievement.isUnlocked && (
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: rarityConfig.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-600 text-center mt-1.5">
            {achievement.currentProgress}/{achievement.targetProgress}
          </p>
        </div>
      )}

      {/* XP Reward Badge */}
      {achievement.achievement?.xpReward && (
        <div
          className={cn(
            "absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg",
            achievement.isUnlocked
              ? "bg-amber-500 text-white"
              : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
          )}
        >
          +{achievement.achievement.xpReward} XP
        </div>
      )}

      {/* Unlocked checkmark */}
      {achievement.isUnlocked && (
        <div className="absolute bottom-3 right-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function AchievementListItem({
  achievement,
  index,
}: {
  achievement: {
    id: string;
    isUnlocked: boolean;
    currentProgress: number;
    targetProgress: number;
    unlockedAt?: Date | null;
    achievement?: {
      name: string;
      description: string;
      icon: string;
      rarity: string;
      xpReward: number;
      category: string;
    } | null;
  };
  index: number;
}) {
  const rarityConfig =
    RARITY_CONFIG[(achievement.achievement?.rarity as AchievementRarity) || "COMMON"];
  const progress =
    achievement.targetProgress > 0
      ? (achievement.currentProgress / achievement.targetProgress) * 100
      : 0;
  const IconComponent = achievement.achievement?.category
    ? categoryIconMap[CATEGORY_ICONS[achievement.achievement.category as AchievementCategory]]
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg",
        achievement.isUnlocked
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/50"
          : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30"
      )}
    >
      {/* Rarity indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: rarityConfig.color }}
      />

      {/* Icon */}
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110",
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={cn(
              "font-bold text-base truncate",
              achievement.isUnlocked
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-500"
            )}
          >
            {achievement.achievement?.name || "Achievement"}
          </h4>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
            style={{
              backgroundColor: rarityConfig.bgColor,
              color: rarityConfig.color,
            }}
          >
            {achievement.achievement?.rarity || "Common"}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {achievement.achievement?.description || "Complete to unlock"}
        </p>

        {/* Progress Bar (for locked achievements) */}
        {!achievement.isUnlocked && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: rarityConfig.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-600 flex-shrink-0">
              {achievement.currentProgress}/{achievement.targetProgress}
            </span>
          </div>
        )}
      </div>

      {/* Category & XP */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {IconComponent && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
            <IconComponent className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
        )}
        <div
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-bold",
            achievement.isUnlocked
              ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500"
          )}
        >
          +{achievement.achievement?.xpReward || 0} XP
        </div>
        {achievement.isUnlocked && (
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
