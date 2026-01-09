"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, TrendingUp } from "lucide-react";
import { useXP } from "@/hooks/use-gamification";
import { LEVEL_THRESHOLDS } from "@/types/gamification";

interface LevelProgressBarProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function LevelProgressBar({
  compact = false,
  showDetails = true,
}: LevelProgressBarProps) {
  const { xp, levelProgress, isLoading } = useXP();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  if (!xp) return null;

  const currentThreshold = LEVEL_THRESHOLDS.find(
    (t) => t.level === xp.currentLevel
  );
  const nextThreshold = LEVEL_THRESHOLDS.find(
    (t) => t.level === xp.currentLevel + 1
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden ${
        compact ? "p-3" : "p-5"
      } rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-sm`}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

      <div className="relative z-10">
        {/* Level Badge & XP Counter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Animated Level Badge */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-0.5 shadow-lg shadow-violet-500/25">
                <div className="w-full h-full rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-500 to-indigo-600">
                    {xp.currentLevel}
                  </span>
                </div>
              </div>
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
              </motion.div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  Level {xp.currentLevel}
                </span>
                {currentThreshold && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-medium">
                    {currentThreshold.title}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 tracking-wide">
                {(xp.totalXP ?? 0).toLocaleString()} Total XP
              </p>
            </div>
          </div>

          {/* XP to next level */}
          {showDetails && nextThreshold && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-900 dark:text-white font-semibold">
                  {xp.xpToNextLevel - xp.xpInCurrentLevel}
                </span>
                <span className="text-slate-500 dark:text-slate-400">XP to</span>
              </div>
              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                Level {xp.currentLevel + 1}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative">
          {/* Background track */}
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            {/* Animated progress fill */}
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Gradient fill */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

              {/* Animated shimmer */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          </div>

          {/* Progress indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: "0%" }}
            animate={{ left: `${Math.min(levelProgress, 98)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="w-5 h-5 -ml-2.5 rounded-full bg-white shadow-lg shadow-violet-500/50 flex items-center justify-center border-2 border-violet-500">
              <Zap className="w-3 h-3 text-violet-600" />
            </div>
          </motion.div>
        </div>

        {/* XP breakdown */}
        {showDetails && (
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {(xp.xpInCurrentLevel ?? 0).toLocaleString()} XP
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-mono font-medium">
              {levelProgress.toFixed(1)}%
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {(xp.xpToNextLevel ?? 0).toLocaleString()} XP
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
