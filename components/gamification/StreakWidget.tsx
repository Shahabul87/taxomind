"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Snowflake, Calendar, TrendingUp, Shield } from "lucide-react";
import { useXP } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";

// Deterministic pseudo-random function to avoid hydration mismatch
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

interface StreakWidgetProps {
  compact?: boolean;
}

export function StreakWidget({ compact = false }: StreakWidgetProps) {
  const { streak, isLoading } = useXP();
  const [isMounted, setIsMounted] = useState(false);

  // Generate deterministic particle positions using memoization
  const particleData = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      left: 20 + seededRandom(i * 7) * 60,
      yOffset: seededRandom(i * 13) * 50,
      duration: 1.5 + seededRandom(i * 17),
      delay: seededRandom(i * 23) * 2,
    }));
  }, []);

  // Only render particles after mounting to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div
          className={cn(
            "bg-slate-100 dark:bg-slate-800/50 rounded-2xl",
            compact ? "h-24" : "h-40"
          )}
        />
      </div>
    );
  }

  if (!streak) return null;

  const streakIntensity = Math.min(streak.current / 30, 1); // Max intensity at 30 days
  const flameColors = getFlameColors(streak.current);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/50 shadow-sm",
        compact ? "p-4" : "p-6"
      )}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />

      {/* Animated fire particles - only render after mount to avoid hydration mismatch */}
      {isMounted && streak.current > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particleData.slice(0, Math.min(streak.current, 10)).map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-orange-400"
              style={{
                left: `${particle.left}%`,
                bottom: 0,
              }}
              animate={{
                y: [-20, -100 - particle.yOffset],
                opacity: [1, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        {compact ? (
          // Compact Layout
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <motion.div
                animate={{
                  scale: streak.current > 0 ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: streak.current > 0 ? Infinity : 0,
                  ease: "easeInOut",
                }}
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center",
                  streak.current > 0
                    ? `bg-gradient-to-br ${flameColors.gradient}`
                    : "bg-slate-100 dark:bg-slate-800/50"
                )}
              >
                <Flame
                  className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7",
                    streak.current > 0 ? "text-white" : "text-slate-400 dark:text-slate-600"
                  )}
                />
              </motion.div>
              {streak.maintained && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                >
                  <span className="text-[8px] text-white">✓</span>
                </motion.div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                <span
                  className={cn(
                    "text-2xl sm:text-3xl font-black tracking-tight",
                    streak.current > 0 ? flameColors.text : "text-slate-400 dark:text-slate-600"
                  )}
                >
                  {streak.current}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">day streak</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Best: {streak.longest} days
              </p>
            </div>

            {/* Freeze count */}
            {streak.freezeUsed !== undefined && (
              <div className="flex items-center gap-1 text-cyan-500 dark:text-cyan-400 shrink-0">
                <Snowflake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium hidden xs:inline">
                  {streak.freezeUsed ? "Used" : "Ready"}
                </span>
              </div>
            )}
          </div>
        ) : (
          // Full Layout
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2">
                <Flame className={cn("w-4 h-4 sm:w-5 sm:h-5", flameColors.text)} />
                <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                  Learning Streak
                </span>
              </div>
              {streak.maintained && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
                >
                  Active Today
                </motion.div>
              )}
            </div>

            {/* Main Streak Display */}
            <div className="flex items-center justify-center py-4 sm:py-6">
              <motion.div
                animate={{
                  scale: streak.current > 0 ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: streak.current > 0 ? Infinity : 0,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                {/* Glow effect - only in dark mode */}
                {streak.current > 0 && (
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full blur-xl opacity-0 dark:opacity-50",
                      flameColors.glow
                    )}
                    style={{
                      transform: "scale(1.5)",
                    }}
                  />
                )}

                {/* Main circle */}
                <div
                  className={cn(
                    "relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center border-4",
                    streak.current > 0
                      ? `bg-gradient-to-br ${flameColors.gradient} ${flameColors.border}`
                      : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  )}
                >
                  <Flame
                    className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mb-0.5 sm:mb-1",
                      streak.current > 0 ? "text-white/90" : "text-slate-400 dark:text-slate-600"
                    )}
                  />
                  <span
                    className={cn(
                      "text-2xl sm:text-2xl md:text-3xl font-black",
                      streak.current > 0 ? "text-white" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {streak.current}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatItem
                icon={<TrendingUp className="w-4 h-4" />}
                label="Best"
                value={`${streak.longest} days`}
                color="text-violet-600 dark:text-violet-400"
              />
              <StatItem
                icon={<Calendar className="w-4 h-4" />}
                label="Status"
                value={streak.maintained ? "Active" : "Inactive"}
                color={streak.maintained ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}
              />
              <StatItem
                icon={<Shield className="w-4 h-4" />}
                label="Freezes"
                value={streak.freezeUsed ? "0 left" : "Available"}
                color="text-cyan-600 dark:text-cyan-400"
              />
            </div>

            {/* Motivation message */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                {getMotivationMessage(streak.current, streak.maintained)}
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "flex items-center justify-center gap-1 mb-1",
          color
        )}
      >
        {icon}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={cn("text-sm font-semibold", color)}>{value}</p>
    </div>
  );
}

function getFlameColors(streak: number): {
  gradient: string;
  text: string;
  glow: string;
  border: string;
} {
  if (streak >= 30) {
    return {
      gradient: "from-violet-500 via-purple-500 to-indigo-500",
      text: "text-violet-600 dark:text-violet-400",
      glow: "bg-violet-500",
      border: "border-violet-400",
    };
  }
  if (streak >= 14) {
    return {
      gradient: "from-amber-400 via-orange-500 to-red-500",
      text: "text-amber-600 dark:text-amber-400",
      glow: "bg-amber-500",
      border: "border-amber-400",
    };
  }
  if (streak >= 7) {
    return {
      gradient: "from-orange-400 via-orange-500 to-red-500",
      text: "text-orange-600 dark:text-orange-400",
      glow: "bg-orange-500",
      border: "border-orange-400",
    };
  }
  if (streak >= 3) {
    return {
      gradient: "from-yellow-400 via-orange-400 to-orange-500",
      text: "text-yellow-600 dark:text-yellow-500",
      glow: "bg-yellow-500",
      border: "border-yellow-400",
    };
  }
  return {
    gradient: "from-slate-400 to-slate-500",
    text: "text-slate-500 dark:text-slate-400",
    glow: "bg-slate-500",
    border: "border-slate-400",
  };
}

function getMotivationMessage(streak: number, maintained: boolean): string {
  if (!maintained && streak === 0) {
    return "Start your learning journey today! Every expert was once a beginner.";
  }
  if (!maintained) {
    return "Come back tomorrow to keep your streak alive!";
  }
  if (streak >= 100) {
    return "Legendary! You&apos;re an inspiration to learners everywhere!";
  }
  if (streak >= 30) {
    return "Incredible! A full month of consistent learning!";
  }
  if (streak >= 14) {
    return "Two weeks strong! You&apos;re building an unstoppable habit!";
  }
  if (streak >= 7) {
    return "One week down! Your dedication is paying off!";
  }
  if (streak >= 3) {
    return "Great start! Keep the momentum going!";
  }
  return "You&apos;re on fire! Come back tomorrow to grow your streak!";
}
