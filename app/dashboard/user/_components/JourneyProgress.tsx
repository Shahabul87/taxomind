'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Flame,
  Target,
  Star,
  Sparkles,
  Crown,
  Gem,
  Shield,
  Swords,
  ScrollText,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface LearningSummary {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalEvents: number;
  goalsAchieved: number;
  inProgressMilestones: Array<{
    id: string;
    title: string;
    progress: number;
  }>;
}

interface JourneyAchievement {
  id: string;
  badgeId: string;
  title: string;
  description: string;
  achievedAt: Date;
  milestoneId: string;
}

interface JourneyData {
  summary?: LearningSummary;
  achievements?: JourneyAchievement[];
}

interface JourneyProgressProps {
  courseId?: string;
  className?: string;
}

// ============================================================================
// LEVEL TITLES - RPG Style
// ============================================================================

const levelTitles: Record<number, { title: string; color: string }> = {
  1: { title: 'Apprentice', color: 'from-slate-400 to-slate-500' },
  2: { title: 'Novice', color: 'from-emerald-400 to-emerald-600' },
  3: { title: 'Adept', color: 'from-blue-400 to-blue-600' },
  4: { title: 'Scholar', color: 'from-violet-400 to-violet-600' },
  5: { title: 'Expert', color: 'from-amber-400 to-amber-600' },
  6: { title: 'Master', color: 'from-rose-400 to-rose-600' },
  7: { title: 'Grandmaster', color: 'from-purple-500 to-pink-500' },
  8: { title: 'Legend', color: 'from-yellow-400 to-orange-500' },
  9: { title: 'Mythic', color: 'from-cyan-400 to-blue-500' },
  10: { title: 'Transcendent', color: 'from-fuchsia-500 to-purple-600' },
};

const getLevelInfo = (level: number) => {
  if (level >= 10) return levelTitles[10];
  return levelTitles[level] || levelTitles[1];
};

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

function FlameIcon({ intensity = 1 }: { intensity?: number }) {
  return (
    <div className="relative">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Flame
          className={cn(
            'h-5 w-5 drop-shadow-lg',
            intensity >= 7 ? 'text-orange-400' :
            intensity >= 3 ? 'text-orange-500' :
            'text-orange-600'
          )}
          style={{
            filter: `drop-shadow(0 0 ${4 + intensity}px rgba(251, 146, 60, 0.6))`,
          }}
        />
      </motion.div>
      {intensity >= 3 && (
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <Sparkles className="h-3 w-3 text-yellow-400" />
        </motion.div>
      )}
    </div>
  );
}

function XPOrb({ xp = 0 }: { xp?: number }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-yellow-500/30 blur-md"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="relative px-3 py-1.5 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/30">
        <span className="text-xs font-bold text-white tracking-wide">
          {(xp ?? 0).toLocaleString()} XP
        </span>
      </div>
    </motion.div>
  );
}

function LevelBadge({ level = 1 }: { level?: number }) {
  const { title, color } = getLevelInfo(level ?? 1);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative"
    >
      <div className={cn(
        'relative px-4 py-2 rounded-xl bg-gradient-to-br shadow-lg',
        color,
        'shadow-black/20'
      )}>
        <div className="absolute inset-0 rounded-xl bg-white/10" />
        <div className="relative flex items-center gap-2">
          <Crown className="h-4 w-4 text-white/90" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-white/70 font-medium">
              Level {level}
            </span>
            <span className="text-sm font-bold text-white leading-tight">
              {title}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProgressRing({ progress, size = 64 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-slate-200 dark:stroke-slate-700"
        />
      </svg>
      {/* Progress ring */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-amber-500"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))',
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className={cn(
        'relative overflow-hidden rounded-xl p-3',
        'bg-gradient-to-br from-white to-slate-50',
        'dark:from-slate-800 dark:to-slate-900',
        'border border-slate-200/50 dark:border-slate-700/50',
        'shadow-sm hover:shadow-md transition-shadow'
      )}
    >
      <div className={cn(
        'absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 rounded-full opacity-10',
        color
      )} />
      <div className="relative flex flex-col items-center text-center gap-1">
        <div className={cn('p-1.5 rounded-lg', color.replace('bg-', 'bg-opacity-15 '))}>{icon}</div>
        <span className="text-lg font-bold text-slate-800 dark:text-white">{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
          {label}
        </span>
        {subValue && (
          <span className="text-[9px] text-slate-400 dark:text-slate-500">{subValue}</span>
        )}
      </div>
    </motion.div>
  );
}

function AchievementBadge({ achievement }: { achievement: JourneyAchievement }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, rotate: [-1, 1, -1] }}
      className={cn(
        'relative group cursor-pointer',
        'px-3 py-1.5 rounded-full',
        'bg-gradient-to-r from-amber-100 to-yellow-100',
        'dark:from-amber-900/40 dark:to-yellow-900/40',
        'border border-amber-300/50 dark:border-amber-600/50',
        'shadow-sm hover:shadow-amber-200/50 dark:hover:shadow-amber-500/20'
      )}
    >
      <div className="flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
          {achievement.title}
        </span>
      </div>
      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-slate-900 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {achievement.description}
      </div>
    </motion.div>
  );
}

function QuestItem({ milestone }: { milestone: { id: string; title: string; progress: number } }) {
  const progressPercent = Math.round(milestone.progress * 100);

  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'relative p-3 rounded-lg',
        'bg-gradient-to-r from-slate-50 to-white',
        'dark:from-slate-800/50 dark:to-slate-800',
        'border border-slate-200/50 dark:border-slate-700/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <ScrollText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
            {milestone.title}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 tabular-nums">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JourneyProgress({ courseId, className }: JourneyProgressProps) {
  const [data, setData] = useState<JourneyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJourneyData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        include: 'summary,achievements',
        eventsLimit: '5',
      });
      if (courseId) {
        params.set('courseId', courseId);
      }

      const response = await fetch(`/api/sam/agentic/journey?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch journey data');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error ?? 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load journey data');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchJourneyData();
  }, [fetchJourneyData]);

  if (isLoading) {
    return <JourneyProgressSkeleton className={className} />;
  }

  if (error) {
    return (
      <div className={cn(
        'rounded-2xl p-6 border-2 border-dashed border-red-200 dark:border-red-800',
        'bg-red-50/50 dark:bg-red-900/10',
        className
      )}>
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  const summary = data?.summary;
  const achievements = data?.achievements ?? [];

  if (!summary) {
    return <EmptyJourneyState className={className} />;
  }

  const totalXp = summary.totalXp ?? 0;
  const xpToNextLevel = summary.xpToNextLevel ?? 1000;
  const currentLevel = summary.currentLevel ?? 1;
  const currentStreak = summary.currentStreak ?? 0;
  const goalsAchieved = summary.goalsAchieved ?? 0;

  const xpProgress = xpToNextLevel > 0
    ? ((totalXp % 1000) / xpToNextLevel) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-slate-50 via-white to-slate-50',
        'dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
        'border border-slate-200/80 dark:border-slate-700/80',
        'shadow-xl shadow-slate-200/50 dark:shadow-black/30',
        className
      )}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header with Level Badge */}
      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 opacity-20 blur-md"
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-400/30">
                <Swords className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Quest Journal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your learning adventure
              </p>
            </div>
          </div>
          <XPOrb xp={totalXp} />
        </div>
      </div>

      {/* Level Progress Section */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-4">
          <LevelBadge level={currentLevel} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Progress to Level {currentLevel + 1}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {xpToNextLevel} XP needed
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)',
                }}
              />
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<FlameIcon intensity={currentStreak} />}
            label="Streak"
            value={currentStreak}
            subValue={`Best: ${summary.longestStreak}`}
            color="bg-orange-500"
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-emerald-500" />}
            label="Goals"
            value={goalsAchieved}
            color="bg-emerald-500"
          />
          <StatCard
            icon={<Gem className="h-4 w-4 text-violet-500" />}
            label="Activities"
            value={summary.totalEvents}
            color="bg-violet-500"
          />
        </div>
      </div>

      {/* Active Quests */}
      {summary.inProgressMilestones.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-violet-500" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Active Quests
            </h4>
          </div>
          <div className="space-y-2">
            {summary.inProgressMilestones.slice(0, 2).map((milestone) => (
              <QuestItem key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <AnimatePresence>
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-5 pb-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Achievements
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 3).map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// SKELETON & EMPTY STATES
// ============================================================================

function JourneyProgressSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-2xl p-5 space-y-4',
      'bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800',
      'border border-slate-200/80 dark:border-slate-700/80',
      'animate-pulse',
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
      <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyJourneyState({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-8',
        'bg-gradient-to-br from-slate-50 via-white to-violet-50',
        'dark:from-slate-900 dark:via-slate-800 dark:to-violet-900/20',
        'border-2 border-dashed border-slate-200 dark:border-slate-700',
        'text-center',
        className
      )}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 mb-4"
      >
        <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
      </motion.div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
        Begin Your Quest
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
        Start learning to unlock achievements, earn XP, and track your progress on the path to mastery.
      </p>
    </motion.div>
  );
}
