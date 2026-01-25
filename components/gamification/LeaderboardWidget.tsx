"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLeaderboard } from "@/hooks/use-gamification";
import { LeaderboardPeriod } from "@/types/gamification";
import { cn } from "@/lib/utils";

interface LeaderboardWidgetProps {
  maxDisplay?: number;
  defaultPeriod?: LeaderboardPeriod;
}

const periodLabels: Record<LeaderboardPeriod, string> = {
  [LeaderboardPeriod.WEEKLY]: "This Week",
  [LeaderboardPeriod.MONTHLY]: "This Month",
  [LeaderboardPeriod.ALL_TIME]: "All Time",
};

export function LeaderboardWidget({
  maxDisplay = 10,
  defaultPeriod = LeaderboardPeriod.WEEKLY,
}: LeaderboardWidgetProps) {
  const [period, setPeriod] = useState(defaultPeriod);
  const { entries, currentUserEntry, totalParticipants, isLoading } =
    useLeaderboard({ period, limit: maxDisplay });

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 shadow-sm relative overflow-hidden"
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                Leaderboard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {(totalParticipants ?? 0).toLocaleString()} participants
              </p>
            </div>
          </div>

          <Link href="/dashboard/user/leaderboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              <span className="hidden xs:inline">View Full</span>
              <span className="xs:hidden">Full</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.button>
          </Link>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800/30 rounded-xl">
          {Object.values(LeaderboardPeriod).map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPeriod(p)}
              className={cn(
                "flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all",
                period === p
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/50"
              )}
            >
              {periodLabels[p]}
            </motion.button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <div className="flex items-end justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
            {/* 2nd Place */}
            <PodiumSpot entry={entries[1]} position={2} />
            {/* 1st Place */}
            <PodiumSpot entry={entries[0]} position={1} />
            {/* 3rd Place */}
            <PodiumSpot entry={entries[2]} position={3} />
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {entries.slice(3).map((entry, index) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                rank={index + 4}
                isCurrentUser={entry.userId === currentUserEntry?.userId}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Current User Position (if not in top display) */}
        {currentUserEntry &&
          !entries.find((e) => e.userId === currentUserEntry.userId) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Your Position</p>
              <LeaderboardRow
                entry={currentUserEntry}
                rank={currentUserEntry.rank || 0}
                isCurrentUser
              />
            </motion.div>
          )}
      </div>
    </motion.div>
  );
}

function PodiumSpot({
  entry,
  position,
}: {
  entry: {
    id: string;
    userId: string;
    xpEarned: number;
    user?: { id: string; name?: string; image?: string };
  };
  position: 1 | 2 | 3;
}) {
  const heights = { 1: "h-20 sm:h-24 md:h-28", 2: "h-16 sm:h-18 md:h-20", 3: "h-12 sm:h-14 md:h-16" };
  const colors = {
    1: "from-amber-400 to-yellow-500",
    2: "from-slate-300 to-slate-400",
    3: "from-amber-600 to-amber-700",
  };
  const badges = {
    1: <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />,
    2: <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />,
    3: <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />,
  };
  const sizes = { 1: "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16", 2: "w-10 h-10 sm:w-12 sm:h-12", 3: "w-10 h-10 sm:w-12 sm:h-12" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
      className="flex flex-col items-center"
    >
      {/* Badge */}
      <div className="mb-1 sm:mb-2">{badges[position]}</div>

      {/* Avatar */}
      <div className={cn("relative rounded-full p-0.5 mb-1 sm:mb-2", sizes[position])}>
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-br",
            colors[position]
          )}
        />
        <div className="relative w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900">
          {entry.user?.image ? (
            <Image
              src={entry.user.image}
              alt={entry.user.name || "User"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm text-slate-700 dark:text-white font-bold">
              {entry.user?.name?.[0] || "?"}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <p className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[60px] sm:max-w-[80px] text-center">
        {entry.user?.name || "Anonymous"}
      </p>

      {/* XP */}
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 sm:mb-2">
        {(entry.xpEarned ?? 0).toLocaleString()} XP
      </p>

      {/* Podium */}
      <div
        className={cn(
          "w-16 sm:w-18 md:w-20 rounded-t-lg bg-gradient-to-b",
          heights[position],
          colors[position]
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-white/80">{position}</span>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
}: {
  entry: {
    id: string;
    userId: string;
    xpEarned: number;
    rankChange?: number | null;
    user?: { id: string; name?: string; image?: string };
  };
  rank: number;
  isCurrentUser: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all",
        isCurrentUser
          ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30"
          : "bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50"
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0",
          isCurrentUser
            ? "bg-emerald-500 text-white"
            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        )}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
        {entry.user?.image ? (
          <Image
            src={entry.user.image}
            alt={entry.user.name || "User"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs sm:text-sm text-slate-700 dark:text-white font-semibold">
            {entry.user?.name?.[0] || "?"}
          </div>
        )}
      </div>

      {/* Name & XP */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium text-xs sm:text-sm truncate",
            isCurrentUser ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"
          )}
        >
          {entry.user?.name || "Anonymous"}
          {isCurrentUser && (
            <span className="text-xs text-emerald-600 dark:text-emerald-500 ml-1">(You)</span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(entry.xpEarned ?? 0).toLocaleString()} XP
        </p>
      </div>

      {/* Rank Change */}
      {entry.rankChange !== undefined && entry.rankChange !== null && (
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {entry.rankChange > 0 ? (
            <>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                +{entry.rankChange}
              </span>
            </>
          ) : entry.rankChange < 0 ? (
            <>
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {entry.rankChange}
              </span>
            </>
          ) : (
            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" />
          )}
        </div>
      )}
    </motion.div>
  );
}
