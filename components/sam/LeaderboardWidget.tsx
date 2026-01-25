'use client';

/**
 * LeaderboardWidget
 *
 * Displays user rankings and achievements in a leaderboard format.
 * Part of the SAM gamification system.
 *
 * Features:
 * - Top learners ranking
 * - Period filtering (weekly, monthly, all-time)
 * - Scope filtering (global, course-specific)
 * - Compact mode for dashboard widgets
 * - Current user highlighting
 * - XP, streak, and badge display
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Star,
  RefreshCw,
  Loader2,
  Users,
  Award,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface LeaderboardEntry {
  id: string;
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  badgeCount: number;
  isCurrentUser: boolean;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';
export type LeaderboardScope = 'global' | 'course';

export interface LeaderboardWidgetProps {
  className?: string;
  /** Scope of the leaderboard */
  scope?: LeaderboardScope;
  /** Course ID for course-specific leaderboard */
  courseId?: string;
  /** Time period filter */
  period?: LeaderboardPeriod;
  /** Maximum entries to display */
  limit?: number;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show current user position even if not in top list */
  showCurrentUserPosition?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PERIOD_CONFIG: Record<LeaderboardPeriod, { label: string; short: string }> = {
  weekly: { label: 'This Week', short: 'Week' },
  monthly: { label: 'This Month', short: 'Month' },
  'all-time': { label: 'All Time', short: 'All' },
};

const RANK_CONFIG: Record<
  number,
  { icon: typeof Trophy; color: string; bgColor: string; label: string }
> = {
  1: {
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
    label: 'Gold',
  },
  2: {
    icon: Medal,
    color: 'text-gray-400',
    bgColor: 'bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50',
    label: 'Silver',
  },
  3: {
    icon: Medal,
    color: 'text-amber-700',
    bgColor: 'bg-gradient-to-br from-amber-100/70 to-orange-100/70 dark:from-amber-900/20 dark:to-orange-900/20',
    label: 'Bronze',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toLocaleString();
}

// ============================================================================
// COMPONENTS
// ============================================================================

function LeaderboardSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', compact ? 'py-2' : 'py-3')}>
      <Skeleton className="h-6 w-6 rounded" />
      <Skeleton className={cn('rounded-full', compact ? 'h-8 w-8' : 'h-10 w-10')} />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-24" />
        {!compact && <Skeleton className="h-3 w-16" />}
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

function TopThreeEntry({
  entry,
  compact,
}: {
  entry: LeaderboardEntry;
  compact: boolean;
}) {
  const config = RANK_CONFIG[entry.rank];
  const Icon = config?.icon || Trophy;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative flex flex-col items-center p-3 rounded-lg',
        config?.bgColor,
        entry.isCurrentUser && 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900'
      )}
    >
      {/* Rank icon */}
      <div
        className={cn(
          'absolute -top-2 -right-2 flex items-center justify-center',
          'h-6 w-6 rounded-full bg-white dark:bg-gray-800 shadow-sm'
        )}
      >
        <Icon className={cn('h-4 w-4', config?.color)} />
      </div>

      {/* Avatar */}
      <Avatar className={cn(compact ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-10 w-10 sm:h-12 sm:w-12', 'mb-1 sm:mb-2')}>
        <AvatarImage src={entry.avatar} alt={entry.name} />
        <AvatarFallback className="text-xs sm:text-sm font-medium">
          {getInitials(entry.name)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span
        className={cn(
          'font-medium text-center line-clamp-1',
          compact ? 'text-xs' : 'text-xs sm:text-sm'
        )}
      >
        {entry.name}
      </span>

      {/* XP */}
      <span className={cn('text-amber-600 font-semibold', compact ? 'text-xs' : 'text-xs sm:text-sm')}>
        {formatXP(entry.xp)} XP
      </span>

      {/* Streak */}
      {entry.streak > 0 && (
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground mt-1">
          <Flame className="h-3 w-3 text-orange-500" />
          {entry.streak}
        </div>
      )}
    </motion.div>
  );
}

function LeaderboardRow({
  entry,
  compact,
}: {
  entry: LeaderboardEntry;
  compact: boolean;
}) {
  const isTopThree = entry.rank <= 3;
  const config = isTopThree ? RANK_CONFIG[entry.rank] : null;
  const Icon = config?.icon || null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'flex items-center gap-2 sm:gap-3 rounded-lg transition-colors',
        compact ? 'py-1.5 sm:py-2 px-2' : 'py-2 sm:py-3 px-2 sm:px-3',
        entry.isCurrentUser
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          'flex items-center justify-center font-bold shrink-0',
          compact ? 'w-5 text-xs' : 'w-5 sm:w-6 text-xs sm:text-sm',
          isTopThree ? config?.color : 'text-muted-foreground'
        )}
      >
        {Icon ? (
          <Icon className={cn(compact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4 sm:h-5 sm:w-5', config?.color)} />
        ) : (
          <span>#{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className={compact ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-8 w-8 sm:h-10 sm:w-10'}>
          <AvatarImage src={entry.avatar} alt={entry.name} />
          <AvatarFallback className="text-xs">
            {getInitials(entry.name)}
          </AvatarFallback>
        </Avatar>
        {entry.isCurrentUser && (
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-indigo-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </div>

      {/* Name and stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-medium truncate',
              compact ? 'text-xs' : 'text-sm',
              entry.isCurrentUser && 'text-indigo-600 dark:text-indigo-400'
            )}
          >
            {entry.name}
          </span>
          {entry.isCurrentUser && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              You
            </Badge>
          )}
        </div>
        {!compact && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {entry.streak > 0 && (
              <span className="flex items-center gap-0.5">
                <Flame className="h-3 w-3 text-orange-500" />
                {entry.streak} day streak
              </span>
            )}
            {entry.badgeCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Award className="h-3 w-3 text-purple-500" />
                {entry.badgeCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* XP */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className={cn(
                'font-semibold shrink-0',
                compact ? 'text-xs px-1.5 sm:px-2' : 'text-xs sm:text-sm px-2 sm:px-2.5',
                'text-amber-600 border-amber-200 dark:border-amber-800'
              )}
            >
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              {formatXP(entry.xp)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{entry.xp.toLocaleString()} XP total</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LeaderboardWidget({
  className,
  scope = 'global',
  courseId,
  period: initialPeriod = 'weekly',
  limit = 10,
  compact = false,
  showCurrentUserPosition = true,
}: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        scope,
        period,
        limit: limit.toString(),
      });
      if (scope === 'course' && courseId) {
        params.append('courseId', courseId);
      }
      if (showCurrentUserPosition) {
        params.append('includeCurrentUser', 'true');
      }

      const response = await fetch(`/api/sam/gamification/leaderboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      if (data.success && data.data) {
        setEntries(data.data.entries || []);
        setCurrentUserEntry(data.data.currentUserEntry || null);
      } else {
        setEntries([]);
        setCurrentUserEntry(null);
      }
    } catch (err) {
      console.error('[LeaderboardWidget] Fetch error:', err);
      setError('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [scope, courseId, period, limit, showCurrentUserPosition]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Separate top 3 from the rest for special display
  const { topThree, restOfList, showCurrentUserSeparately } = useMemo(() => {
    const top = entries.filter((e) => e.rank <= 3);
    const rest = entries.filter((e) => e.rank > 3);

    // Check if current user is not in the main list
    const currentUserInList = entries.some((e) => e.isCurrentUser);
    const showSeparately =
      showCurrentUserPosition && currentUserEntry && !currentUserInList;

    return {
      topThree: top,
      restOfList: rest,
      showCurrentUserSeparately: showSeparately,
    };
  }, [entries, currentUserEntry, showCurrentUserPosition]);

  const stats = useMemo(() => {
    const total = entries.length;
    const currentRank = entries.find((e) => e.isCurrentUser)?.rank || currentUserEntry?.rank;
    return { total, currentRank };
  }, [entries, currentUserEntry]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={cn(compact ? 'pb-2' : 'pb-3', 'p-4 sm:p-6')}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            <CardTitle className="text-sm sm:text-base">Leaderboard</CardTitle>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!compact && (
              <Select value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
                <SelectTrigger className="w-full sm:w-[120px] h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PERIOD_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchLeaderboard}
              disabled={isLoading}
              className="h-8 w-8 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs sm:text-sm mt-1">
          {scope === 'course' ? 'Course Rankings' : 'Global Rankings'} - {PERIOD_CONFIG[period].label}
          {stats.currentRank && (
            <span className="ml-1 sm:ml-2 text-indigo-600 dark:text-indigo-400">
              (You: #{stats.currentRank})
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className={compact ? 'pt-0' : ''}>
        {error ? (
          <div className="text-center py-6">
            <Trophy className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchLeaderboard} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[...Array(compact ? 5 : 7)].map((_, i) => (
              <LeaderboardSkeleton key={i} compact={compact} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground">
              No rankings yet. Start learning to climb the leaderboard!
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 special display - only in non-compact mode */}
            {!compact && topThree.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {/* Reorder to show 2nd, 1st, 3rd */}
                {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((entry) => (
                  <TopThreeEntry
                    key={entry.id}
                    entry={entry}
                    compact={compact}
                  />
                ))}
              </div>
            )}

            {/* Rest of the list */}
            <ScrollArea className={compact ? 'h-[250px]' : 'h-[300px]'}>
              <div className="space-y-1 pr-2">
                <AnimatePresence mode="popLayout">
                  {/* In compact mode, show all including top 3 in list format */}
                  {(compact ? entries : restOfList).map((entry) => (
                    <LeaderboardRow key={entry.id} entry={entry} compact={compact} />
                  ))}
                </AnimatePresence>

                {/* Current user position if not in list */}
                {showCurrentUserSeparately && currentUserEntry && (
                  <>
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
                      <span className="text-xs text-muted-foreground">Your Position</span>
                      <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
                    </div>
                    <LeaderboardRow entry={currentUserEntry} compact={compact} />
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Footer stats */}
            {!isLoading && entries.length > 0 && !compact && (
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <Users className="h-3 w-3 inline mr-1" />
                  {stats.total} learners ranked
                </span>
                {stats.currentRank && (
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    <Trophy className="h-3 w-3 inline mr-1" />
                    Your rank: #{stats.currentRank}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default LeaderboardWidget;
