"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Users,
  Flame,
  Target,
  BookOpen,
  Clock,
  Search,
  RefreshCw,
  Globe,
  GraduationCap,
  UserPlus,
  Swords,
  Zap,
  Star,
  Award,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLeaderboard } from "@/hooks/use-gamification";
import { LeaderboardPeriod } from "@/types/gamification";
import { cn } from "@/lib/utils";

// ==========================================
// Types
// ==========================================

type LeaderboardType = "global" | "class" | "friends";

interface MockLeaderboardEntry {
  id: string;
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  xpEarned: number;
  level: number;
  streak: number;
  achievementsUnlocked: number;
  lessonsCompleted: number;
  studyMinutes: number;
  rankChange: number;
  badges: string[];
  isOnline?: boolean;
}

// ==========================================
// Mock Data for Empty State
// ==========================================

const MOCK_LEADERBOARD_DATA: MockLeaderboardEntry[] = [
  {
    id: "1",
    rank: 1,
    userId: "user1",
    name: "Sarah Chen",
    image: null,
    xpEarned: 12450,
    level: 15,
    streak: 45,
    achievementsUnlocked: 28,
    lessonsCompleted: 156,
    studyMinutes: 4320,
    rankChange: 2,
    badges: ["legendary", "streak-master", "top-performer"],
    isOnline: true,
  },
  {
    id: "2",
    rank: 2,
    userId: "user2",
    name: "Alex Rivera",
    image: null,
    xpEarned: 11200,
    level: 14,
    streak: 32,
    achievementsUnlocked: 24,
    lessonsCompleted: 142,
    studyMinutes: 3890,
    rankChange: -1,
    badges: ["epic", "night-owl"],
    isOnline: true,
  },
  {
    id: "3",
    rank: 3,
    userId: "user3",
    name: "Emma Thompson",
    image: null,
    xpEarned: 10850,
    level: 13,
    streak: 28,
    achievementsUnlocked: 22,
    lessonsCompleted: 134,
    studyMinutes: 3650,
    rankChange: 1,
    badges: ["rare", "early-bird"],
    isOnline: false,
  },
  {
    id: "4",
    rank: 4,
    userId: "user4",
    name: "Marcus Johnson",
    image: null,
    xpEarned: 9800,
    level: 12,
    streak: 21,
    achievementsUnlocked: 19,
    lessonsCompleted: 118,
    studyMinutes: 3200,
    rankChange: 0,
    badges: ["uncommon"],
  },
  {
    id: "5",
    rank: 5,
    userId: "user5",
    name: "Priya Sharma",
    image: null,
    xpEarned: 9200,
    level: 11,
    streak: 18,
    achievementsUnlocked: 17,
    lessonsCompleted: 105,
    studyMinutes: 2980,
    rankChange: 3,
    badges: ["uncommon", "quick-learner"],
  },
  {
    id: "6",
    rank: 6,
    userId: "user6",
    name: "David Kim",
    image: null,
    xpEarned: 8700,
    level: 10,
    streak: 15,
    achievementsUnlocked: 15,
    lessonsCompleted: 98,
    studyMinutes: 2750,
    rankChange: -2,
    badges: ["common"],
  },
  {
    id: "7",
    rank: 7,
    userId: "user7",
    name: "Olivia Brown",
    image: null,
    xpEarned: 8100,
    level: 10,
    streak: 12,
    achievementsUnlocked: 14,
    lessonsCompleted: 92,
    studyMinutes: 2560,
    rankChange: 1,
    badges: ["common"],
  },
  {
    id: "8",
    rank: 8,
    userId: "user8",
    name: "James Wilson",
    image: null,
    xpEarned: 7500,
    level: 9,
    streak: 10,
    achievementsUnlocked: 12,
    lessonsCompleted: 85,
    studyMinutes: 2340,
    rankChange: 0,
    badges: ["common"],
  },
  {
    id: "9",
    rank: 9,
    userId: "user9",
    name: "Sofia Martinez",
    image: null,
    xpEarned: 6900,
    level: 8,
    streak: 8,
    achievementsUnlocked: 11,
    lessonsCompleted: 78,
    studyMinutes: 2120,
    rankChange: 2,
    badges: ["common"],
  },
  {
    id: "10",
    rank: 10,
    userId: "user10",
    name: "Liam Anderson",
    image: null,
    xpEarned: 6300,
    level: 8,
    streak: 6,
    achievementsUnlocked: 10,
    lessonsCompleted: 72,
    studyMinutes: 1950,
    rankChange: -1,
    badges: ["common"],
  },
];

const MOCK_CURRENT_USER: MockLeaderboardEntry = {
  id: "current",
  rank: 24,
  userId: "currentUser",
  name: "You",
  image: null,
  xpEarned: 3200,
  level: 6,
  streak: 5,
  achievementsUnlocked: 8,
  lessonsCompleted: 42,
  studyMinutes: 1120,
  rankChange: 4,
  badges: ["common"],
};

const periodLabels: Record<LeaderboardPeriod, string> = {
  [LeaderboardPeriod.WEEKLY]: "This Week",
  [LeaderboardPeriod.MONTHLY]: "This Month",
  [LeaderboardPeriod.ALL_TIME]: "All Time",
};

const periodDescriptions: Record<LeaderboardPeriod, string> = {
  [LeaderboardPeriod.WEEKLY]: "Rankings reset every Monday",
  [LeaderboardPeriod.MONTHLY]: "Rankings reset on the 1st",
  [LeaderboardPeriod.ALL_TIME]: "All-time rankings",
};

const typeConfig: Record<LeaderboardType, { label: string; icon: React.ReactNode; description: string }> = {
  global: {
    label: "Global",
    icon: <Globe className="w-4 h-4" />,
    description: "Compete with all learners worldwide",
  },
  class: {
    label: "My Courses",
    icon: <GraduationCap className="w-4 h-4" />,
    description: "Rankings within your enrolled courses",
  },
  friends: {
    label: "Friends",
    icon: <Users className="w-4 h-4" />,
    description: "Challenge your study buddies",
  },
};

const LEVEL_TITLES: Record<number, { title: string; color: string }> = {
  1: { title: "Novice", color: "text-slate-500" },
  2: { title: "Beginner", color: "text-slate-600" },
  3: { title: "Apprentice", color: "text-emerald-500" },
  4: { title: "Student", color: "text-emerald-600" },
  5: { title: "Scholar", color: "text-blue-500" },
  6: { title: "Graduate", color: "text-blue-600" },
  7: { title: "Expert", color: "text-violet-500" },
  8: { title: "Specialist", color: "text-violet-600" },
  9: { title: "Master", color: "text-purple-500" },
  10: { title: "Grandmaster", color: "text-purple-600" },
  11: { title: "Sage", color: "text-amber-500" },
  12: { title: "Guru", color: "text-amber-600" },
  13: { title: "Virtuoso", color: "text-orange-500" },
  14: { title: "Legend", color: "text-orange-600" },
  15: { title: "Titan", color: "text-rose-500" },
  16: { title: "Champion", color: "text-rose-600" },
  17: { title: "Immortal", color: "text-red-500" },
  18: { title: "Enlightened", color: "text-red-600" },
  19: { title: "Transcendent", color: "text-pink-500" },
  20: { title: "Ascendant", color: "text-pink-600" },
};

function getLevelInfo(level: number): { title: string; color: string } {
  return LEVEL_TITLES[Math.min(level, 20)] || LEVEL_TITLES[1];
}

// ==========================================
// Main Component
// ==========================================

export default function FullLeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.WEEKLY);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMockData, setShowMockData] = useState(true);

  const { entries, currentUserEntry, totalParticipants, isLoading, error, refetch } =
    useLeaderboard({ period, limit: 100 });

  // Use mock data if no real entries
  const displayEntries = useMemo(() => {
    if (entries.length > 0) {
      setShowMockData(false);
      return entries.map((e, idx) => ({
        id: e.id,
        rank: idx + 1,
        userId: e.userId,
        name: e.user?.name || "Anonymous",
        image: e.user?.image || null,
        xpEarned: e.xpEarned,
        level: 1,
        streak: 0,
        achievementsUnlocked: e.achievementsUnlocked,
        lessonsCompleted: e.lessonsCompleted,
        studyMinutes: e.studyMinutes,
        rankChange: e.rankChange || 0,
        badges: [],
      }));
    }
    return MOCK_LEADERBOARD_DATA;
  }, [entries]);

  const displayCurrentUser = useMemo(() => {
    if (currentUserEntry) {
      return {
        id: currentUserEntry.id,
        rank: currentUserEntry.rank || 0,
        userId: currentUserEntry.userId,
        name: currentUserEntry.user?.name || "You",
        image: currentUserEntry.user?.image || null,
        xpEarned: currentUserEntry.xpEarned,
        level: 1,
        streak: 0,
        achievementsUnlocked: currentUserEntry.achievementsUnlocked,
        lessonsCompleted: currentUserEntry.lessonsCompleted,
        studyMinutes: currentUserEntry.studyMinutes,
        rankChange: currentUserEntry.rankChange || 0,
        badges: [],
      };
    }
    return showMockData ? MOCK_CURRENT_USER : null;
  }, [currentUserEntry, showMockData]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return displayEntries;
    const query = searchQuery.toLowerCase();
    return displayEntries.filter((entry) =>
      entry.name?.toLowerCase().includes(query)
    );
  }, [displayEntries, searchQuery]);

  const displayParticipants = totalParticipants > 0 ? totalParticipants : 1247;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-32 h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 p-6 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Failed to load leaderboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Something went wrong. Please try again.</p>
          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
            >
              Try Again
            </motion.button>
            <Link
              href="/dashboard/user"
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const top3 = filteredEntries.slice(0, 3);
  const rest = filteredEntries.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/dashboard/user"
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-3">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-lg shadow-amber-500/30"
                  >
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                  Leaderboard
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {displayParticipants.toLocaleString()} learners competing
                  </span>
                  {showMockData && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                      Demo
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => refetch()}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Type & Period Selectors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Leaderboard Type */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-1.5 shadow-sm">
            <div className="flex gap-1">
              {(Object.keys(typeConfig) as LeaderboardType[]).map((type) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setLeaderboardType(type)}
                  className={cn(
                    "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                    leaderboardType === type
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  )}
                >
                  {typeConfig[type].icon}
                  <span className="hidden sm:inline">{typeConfig[type].label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Period Filter */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-1.5 shadow-sm">
            <div className="flex gap-1">
              {Object.values(LeaderboardPeriod).map((p) => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                    period === p
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <span>{periodLabels[p]}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Current User Position Card */}
        {displayCurrentUser && displayCurrentUser.rank > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20 border border-emerald-200/50 dark:border-emerald-500/30 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30">
                    #{displayCurrentUser.rank}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-emerald-500" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Your Position</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Top {Math.round((displayCurrentUser.rank / displayParticipants) * 100)}% of all learners
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{displayCurrentUser.xpEarned.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">XP Earned</p>
                </div>
                {displayCurrentUser.rankChange !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
                    displayCurrentUser.rankChange > 0
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  )}>
                    {displayCurrentUser.rankChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(displayCurrentUser.rankChange)} places
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {top3.length >= 3 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-sm overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-radial from-amber-400/20 to-transparent blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Performers</h2>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>

              <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8">
                {/* 2nd Place */}
                <PodiumSpotEnhanced entry={top3[1]} position={2} currentUserId={displayCurrentUser?.userId} />
                {/* 1st Place */}
                <PodiumSpotEnhanced entry={top3[0]} position={1} currentUserId={displayCurrentUser?.userId} />
                {/* 3rd Place */}
                <PodiumSpotEnhanced entry={top3[2]} position={3} currentUserId={displayCurrentUser?.userId} />
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search learners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filter</span>
          </motion.button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredEntries.length} of {displayParticipants.toLocaleString()} learners
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {periodDescriptions[period]}
          </p>
        </div>

        {/* Leaderboard Table */}
        {rest.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5 sm:col-span-4">Learner</div>
              <div className="col-span-3 sm:col-span-2 text-center">XP</div>
              <div className="col-span-2 text-center hidden sm:block">Level</div>
              <div className="col-span-2 text-center hidden md:block">Streak</div>
              <div className="col-span-3 sm:col-span-1 text-center">Trend</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {rest.map((entry, index) => (
                  <LeaderboardTableRowEnhanced
                    key={entry.id}
                    entry={entry}
                    rank={entry.rank}
                    index={index}
                    isCurrentUser={entry.userId === displayCurrentUser?.userId}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No learners found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search query
            </p>
          </div>
        )}

        {/* User Stats Section */}
        {displayCurrentUser && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <EnhancedStatCard
              icon={<Zap className="w-5 h-5" />}
              label="XP Earned"
              value={displayCurrentUser.xpEarned.toLocaleString()}
              subValue="this period"
              color="amber"
              trend={displayCurrentUser.rankChange > 0 ? "up" : displayCurrentUser.rankChange < 0 ? "down" : "neutral"}
            />
            <EnhancedStatCard
              icon={<Trophy className="w-5 h-5" />}
              label="Achievements"
              value={displayCurrentUser.achievementsUnlocked.toString()}
              subValue="unlocked"
              color="emerald"
            />
            <EnhancedStatCard
              icon={<Flame className="w-5 h-5" />}
              label="Current Streak"
              value={`${displayCurrentUser.streak} days`}
              subValue="keep it up!"
              color="orange"
            />
            <EnhancedStatCard
              icon={<Clock className="w-5 h-5" />}
              label="Study Time"
              value={`${Math.floor(displayCurrentUser.studyMinutes / 60)}h ${displayCurrentUser.studyMinutes % 60}m`}
              subValue="total learning"
              color="blue"
            />
          </div>
        )}

        {/* Challenge CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('/patterns/circuit.svg')] opacity-10" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Swords className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">Challenge Your Friends!</h3>
                <p className="text-white/80 text-sm sm:text-base">Compete in weekly XP races and unlock exclusive rewards</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl bg-white text-purple-600 font-semibold hover:bg-white/90 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <UserPlus className="w-5 h-5" />
              Start a Challenge
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// Enhanced Podium Component
// ==========================================

function PodiumSpotEnhanced({
  entry,
  position,
  currentUserId,
}: {
  entry: MockLeaderboardEntry;
  position: 1 | 2 | 3;
  currentUserId?: string;
}) {
  const isCurrentUser = entry.userId === currentUserId;
  const levelInfo = getLevelInfo(entry.level);

  const config = {
    1: {
      height: "h-28 sm:h-36 md:h-44",
      width: "w-24 sm:w-28 md:w-36",
      avatarSize: "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24",
      gradient: "from-amber-300 via-yellow-400 to-amber-500",
      shadow: "shadow-amber-400/50",
      glow: "shadow-[0_0_40px_rgba(251,191,36,0.4)]",
      badge: <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 drop-shadow-lg" />,
      ring: "ring-4 ring-amber-400/50",
    },
    2: {
      height: "h-20 sm:h-24 md:h-32",
      width: "w-20 sm:w-24 md:w-28",
      avatarSize: "w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18",
      gradient: "from-slate-300 via-slate-400 to-slate-500",
      shadow: "shadow-slate-400/50",
      glow: "shadow-[0_0_30px_rgba(148,163,184,0.3)]",
      badge: <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />,
      ring: "ring-4 ring-slate-400/50",
    },
    3: {
      height: "h-16 sm:h-20 md:h-24",
      width: "w-20 sm:w-24 md:w-28",
      avatarSize: "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16",
      gradient: "from-amber-600 via-orange-500 to-amber-700",
      shadow: "shadow-amber-600/50",
      glow: "shadow-[0_0_25px_rgba(217,119,6,0.3)]",
      badge: <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />,
      ring: "ring-4 ring-amber-600/50",
    },
  };

  const c = config[position];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: position === 1 ? 0.2 : position === 2 ? 0.1 : 0.3, type: "spring", stiffness: 200 }}
      className="flex flex-col items-center"
    >
      {/* Badge */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: position === 1 ? 0.5 : position === 2 ? 0.4 : 0.6, type: "spring" }}
        className="mb-2"
      >
        {c.badge}
      </motion.div>

      {/* Avatar with level badge */}
      <div className="relative mb-2">
        <motion.div
          className={cn(
            "relative rounded-2xl p-0.5 sm:p-1",
            c.avatarSize,
            isCurrentUser && c.ring
          )}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br", c.gradient, c.glow)} />
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {entry.image ? (
              <Image src={entry.image} alt={entry.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                <span className="text-slate-700 dark:text-white font-bold text-lg sm:text-xl md:text-2xl">
                  {entry.name[0]}
                </span>
              </div>
            )}
          </div>

          {/* Level Badge */}
          <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-lg border-2 border-white dark:border-slate-900">
            {entry.level}
          </div>

          {/* Online indicator */}
          {entry.isOnline && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>
          )}
        </motion.div>

        {/* Streak badge */}
        {entry.streak >= 7 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute -left-1 -bottom-1 sm:-left-2 sm:-bottom-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] sm:text-[10px] font-bold flex items-center gap-0.5 shadow-lg"
          >
            <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {entry.streak}
          </motion.div>
        )}
      </div>

      {/* Name */}
      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[80px] sm:max-w-[100px] text-center">
        {entry.name}
        {isCurrentUser && <span className="text-emerald-500 text-[10px] ml-0.5">(You)</span>}
      </p>

      {/* Level Title */}
      <p className={cn("text-[10px] sm:text-xs font-medium", levelInfo.color)}>{levelInfo.title}</p>

      {/* XP */}
      <div className="flex items-center gap-1 mt-1 mb-2">
        <Zap className="w-3 h-3 text-amber-500" />
        <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {entry.xpEarned.toLocaleString()}
        </span>
      </div>

      {/* Podium */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ delay: position === 1 ? 0.3 : position === 2 ? 0.2 : 0.4, duration: 0.5, ease: "easeOut" }}
        className={cn(
          "rounded-t-2xl bg-gradient-to-b flex flex-col items-center justify-start pt-3 sm:pt-4 relative overflow-hidden",
          c.height,
          c.width,
          c.gradient
        )}
      >
        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white/90 drop-shadow-lg">{position}</span>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine" />
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// Enhanced Table Row Component
// ==========================================

function LeaderboardTableRowEnhanced({
  entry,
  rank,
  index,
  isCurrentUser,
}: {
  entry: MockLeaderboardEntry;
  rank: number;
  index: number;
  isCurrentUser: boolean;
}) {
  const levelInfo = getLevelInfo(entry.level);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ backgroundColor: isCurrentUser ? undefined : "rgba(0,0,0,0.02)" }}
      className={cn(
        "grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 items-center transition-all",
        isCurrentUser && "bg-emerald-50/80 dark:bg-emerald-500/10 border-l-4 border-l-emerald-500"
      )}
    >
      {/* Rank */}
      <div className="col-span-1 flex justify-center">
        <div
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm",
            isCurrentUser
              ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          )}
        >
          {rank}
        </div>
      </div>

      {/* User */}
      <div className="col-span-5 sm:col-span-4 flex items-center gap-2 sm:gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
            {entry.image ? (
              <Image src={entry.image} alt={entry.name} width={40} height={40} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700 dark:text-white font-semibold text-sm">
                {entry.name[0]}
              </div>
            )}
          </div>
          {/* Mini level badge */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[8px] sm:text-[9px] font-bold border border-white dark:border-slate-900">
            {entry.level}
          </div>
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "font-medium text-xs sm:text-sm truncate",
              isCurrentUser ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"
            )}
          >
            {entry.name}
            {isCurrentUser && <span className="text-emerald-500 text-[10px] ml-1">(You)</span>}
          </p>
          <p className={cn("text-[10px] sm:text-xs", levelInfo.color)}>{levelInfo.title}</p>
        </div>
      </div>

      {/* XP */}
      <div className="col-span-3 sm:col-span-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
          <span
            className={cn(
              "font-bold text-xs sm:text-sm",
              isCurrentUser ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
            )}
          >
            {entry.xpEarned.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Level */}
      <div className="col-span-2 text-center hidden sm:flex items-center justify-center">
        <div className="px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium">
          Lv. {entry.level}
        </div>
      </div>

      {/* Streak */}
      <div className="col-span-2 text-center hidden md:flex items-center justify-center gap-1">
        {entry.streak > 0 ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{entry.streak}d</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )}
      </div>

      {/* Trend */}
      <div className="col-span-3 sm:col-span-1 flex justify-center">
        {entry.rankChange !== 0 ? (
          <div
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
              entry.rankChange > 0
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            )}
          >
            {entry.rankChange > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(entry.rankChange)}
          </div>
        ) : (
          <Minus className="w-4 h-4 text-slate-300 dark:text-slate-600" />
        )}
      </div>
    </motion.div>
  );
}

// ==========================================
// Enhanced Stat Card Component
// ==========================================

function EnhancedStatCard({
  icon,
  label,
  value,
  subValue,
  color,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: "amber" | "emerald" | "blue" | "orange";
  trend?: "up" | "down" | "neutral";
}) {
  const colorConfig = {
    amber: {
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-600 dark:text-amber-400",
      shadow: "shadow-amber-500/20",
    },
    emerald: {
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-600 dark:text-emerald-400",
      shadow: "shadow-emerald-500/20",
    },
    blue: {
      gradient: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
      shadow: "shadow-blue-500/20",
    },
    orange: {
      gradient: "from-orange-500 to-red-500",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-600 dark:text-orange-400",
      shadow: "shadow-orange-500/20",
    },
  };

  const c = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("p-2 sm:p-2.5 rounded-xl bg-gradient-to-br shadow-lg", c.gradient, c.shadow)}>
          <div className="text-white">{icon}</div>
        </div>
        {trend && trend !== "neutral" && (
          <div
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
              trend === "up"
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            )}
          >
            {trend === "up" ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          </div>
        )}
      </div>
      <div className="mt-2 sm:mt-3">
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className={cn("text-lg sm:text-xl font-bold", c.text)}>{value}</p>
        {subValue && <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">{subValue}</p>}
      </div>
    </motion.div>
  );
}
