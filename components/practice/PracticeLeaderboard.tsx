'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Clock, Flame, TrendingUp, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface LeaderboardEntry {
  id: string;
  userId: string;
  rank?: number;
  previousRank?: number;
  rankChange?: number;
  totalHours: number;
  qualityHours: number;
  sessionsCount: number;
  streakDays: number;
  avgQualityMultiplier: number;
  userName?: string;
  userAvatar?: string;
  isCurrentUser?: boolean;
  friendRank?: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  podium: LeaderboardEntry[];
  period: {
    timeframe: string;
    start: string;
    label: string;
  };
  friendsCount?: number;
}

type LeaderboardType = 'global' | 'friends' | 'skill';
type Timeframe = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

interface PracticeLeaderboardProps {
  type?: LeaderboardType;
  skillId?: string;
  timeframe?: Timeframe;
  limit?: number;
  showPodium?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PracticeLeaderboard({
  type = 'global',
  skillId,
  timeframe: initialTimeframe = 'WEEKLY',
  limit = 10,
  showPodium = true,
  className,
}: PracticeLeaderboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        let url = '/api/sam/practice/leaderboard';

        if (type === 'friends') {
          url += '/friends';
        } else if (type === 'skill' && skillId) {
          url += `/skill/${skillId}`;
        }

        url += `?timeframe=${timeframe}&limit=${limit}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [type, skillId, timeframe, limit]);

  if (isLoading) {
    return (
      <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-600 dark:text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
        <CardContent className="py-8 text-center text-slate-600 dark:text-slate-300">
          Unable to load leaderboard
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
      <CardHeader className="pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-base sm:text-xl">{type === 'friends' ? 'Friends' : type === 'skill' ? 'Skill' : 'Global'} Leaderboard</span>
          </CardTitle>
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
            <SelectTrigger className="w-full sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="ALL_TIME">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">{data.period.label}</p>
      </CardHeader>
      <CardContent>
        {/* Podium for top 3 */}
        {showPodium && data.podium.length >= 3 && (
          <div className="flex justify-center items-end gap-1.5 sm:gap-2 mb-4 sm:mb-6 py-3 sm:py-4">
            {/* 2nd Place */}
            <PodiumSpot entry={data.podium[1]} position={2} />
            {/* 1st Place */}
            <PodiumSpot entry={data.podium[0]} position={1} />
            {/* 3rd Place */}
            <PodiumSpot entry={data.podium[2]} position={3} />
          </div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-2">
          {data.leaderboard.map((entry, index) => (
            <LeaderboardRow
              key={entry.id}
              entry={entry}
              rank={entry.rank ?? entry.friendRank ?? index + 1}
              isCurrentUser={entry.isCurrentUser ?? entry.userId === data.currentUser?.userId}
            />
          ))}
        </div>

        {/* Current User (if not in top results) */}
        {data.currentUser && !data.leaderboard.some((e) => e.userId === data.currentUser?.userId) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Your position</p>
            <LeaderboardRow
              entry={data.currentUser}
              rank={data.currentUser.rank ?? data.currentUser.friendRank ?? 0}
              isCurrentUser
            />
          </div>
        )}

        {/* Empty state */}
        {data.leaderboard.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <p>No practice activity yet this period.</p>
            <p className="text-sm">Start practicing to climb the leaderboard!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface PodiumSpotProps {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}

function PodiumSpot({ entry, position }: PodiumSpotProps) {
  const heights = { 1: 'h-16 sm:h-24', 2: 'h-12 sm:h-16', 3: 'h-10 sm:h-12' };
  const colors = {
    1: 'bg-yellow-500/20 border-yellow-500',
    2: 'bg-gray-400/20 border-gray-400',
    3: 'bg-amber-700/20 border-amber-700',
  };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="flex flex-col items-center">
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mb-1 sm:mb-2">
        <AvatarImage src={entry.userAvatar} alt={entry.userName ?? 'User'} />
        <AvatarFallback className="text-xs">
          {(entry.userName ?? 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium truncate max-w-[50px] sm:max-w-[60px]">
        {entry.userName ?? 'Anonymous'}
      </span>
      <span className="text-xs text-muted-foreground">
        {entry.qualityHours.toFixed(1)}h
      </span>
      <div
        className={cn(
          'w-12 sm:w-16 rounded-t-md border-t-2 flex items-start justify-center pt-1',
          heights[position],
          colors[position]
        )}
      >
        <span className="text-base sm:text-xl">{medals[position]}</span>
      </div>
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser?: boolean;
}

function LeaderboardRow({ entry, rank, isCurrentUser }: LeaderboardRowProps) {
  const getRankIcon = (r: number) => {
    if (r === 1) return <span className="text-lg">🥇</span>;
    if (r === 2) return <span className="text-lg">🥈</span>;
    if (r === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-sm font-medium text-muted-foreground">#{r}</span>;
  };

  const rankChange = entry.rankChange ?? 0;

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors',
        isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
      )}
    >
      <div className="w-6 sm:w-8 flex justify-center shrink-0">
        {rank <= 3 ? (
          <span className="text-base sm:text-lg">{getRankIcon(rank)}</span>
        ) : (
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">#{rank}</span>
        )}
      </div>
      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
        <AvatarImage src={entry.userAvatar} alt={entry.userName ?? 'User'} />
        <AvatarFallback className="text-xs">
          {(entry.userName ?? 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-xs sm:text-sm">
          {entry.userName ?? 'Anonymous'}
          {isCurrentUser && <Badge variant="outline" className="ml-1.5 sm:ml-2 text-xs">You</Badge>}
        </p>
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {entry.qualityHours.toFixed(1)}h
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {entry.streakDays}d
          </span>
        </div>
      </div>
      {rankChange !== 0 && (
        <div
          className={cn(
            'flex items-center gap-0.5 sm:gap-1 text-xs shrink-0',
            rankChange > 0 ? 'text-green-500' : 'text-red-500'
          )}
        >
          <TrendingUp
            className={cn('h-2.5 w-2.5 sm:h-3 sm:w-3', rankChange < 0 && 'rotate-180')}
          />
          {Math.abs(rankChange)}
        </div>
      )}
    </div>
  );
}
