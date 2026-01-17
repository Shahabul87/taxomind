'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Clock, Target, Flame, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Participant {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  hoursCompleted: number;
  qualityHoursCompleted: number;
  sessionsCompleted: number;
  currentStreak: number;
  rank?: number;
  completedAt?: string;
  rewardClaimed: boolean;
}

interface ChallengeInfo {
  id: string;
  title: string;
  targetHours?: number;
  targetQualityHours?: number;
  targetSessions?: number;
  targetStreak?: number;
}

interface ChallengeLeaderboardProps {
  challengeId: string;
  showPodium?: boolean;
  limit?: number;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ChallengeLeaderboard({
  challengeId,
  showPodium = true,
  limit = 10,
  className,
}: ChallengeLeaderboardProps) {
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [podium, setPodium] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [currentUser, setCurrentUser] = useState<(Participant & { rank: number }) | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isFetchingRef = useRef(false);

  const fetchLeaderboard = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/sam/practice/challenges/${challengeId}/leaderboard?limit=${limit}`
      );
      const result = await response.json();

      if (result.success) {
        setChallenge(result.data.challenge);
        setPodium(result.data.podium ?? []);
        setLeaderboard(result.data.leaderboard ?? []);
        setCurrentUser(result.data.currentUser);
        setTotalParticipants(result.data.totalParticipants ?? 0);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [challengeId, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load leaderboard
        </CardContent>
      </Card>
    );
  }

  // Calculate progress for a participant
  const getProgress = (participant: Participant): number => {
    const progressValues: number[] = [];

    if (challenge.targetHours) {
      progressValues.push(Math.min(100, (participant.hoursCompleted / challenge.targetHours) * 100));
    }
    if (challenge.targetQualityHours) {
      progressValues.push(
        Math.min(100, (participant.qualityHoursCompleted / challenge.targetQualityHours) * 100)
      );
    }
    if (challenge.targetSessions) {
      progressValues.push(
        Math.min(100, (participant.sessionsCompleted / challenge.targetSessions) * 100)
      );
    }
    if (challenge.targetStreak) {
      progressValues.push(
        Math.min(100, (participant.currentStreak / challenge.targetStreak) * 100)
      );
    }

    return progressValues.length > 0 ? Math.max(...progressValues) : 0;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Challenge Leaderboard
          </span>
          <Badge variant="outline">{totalParticipants} participants</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{challenge.title}</p>
      </CardHeader>
      <CardContent>
        {/* Podium for top 3 */}
        {showPodium && podium.length >= 3 && (
          <div className="flex justify-center items-end gap-2 mb-6 py-4">
            {/* 2nd Place */}
            <PodiumSpot participant={podium[1]} position={2} progress={getProgress(podium[1])} />
            {/* 1st Place */}
            <PodiumSpot participant={podium[0]} position={1} progress={getProgress(podium[0])} />
            {/* 3rd Place */}
            <PodiumSpot participant={podium[2]} position={3} progress={getProgress(podium[2])} />
          </div>
        )}

        {/* Leaderboard List */}
        <div className="space-y-2">
          {leaderboard.map((participant) => (
            <ParticipantRow
              key={participant.id}
              participant={participant}
              challenge={challenge}
              progress={getProgress(participant)}
              isCurrentUser={currentUser?.userId === participant.userId}
            />
          ))}
        </div>

        {/* Current User (if not in top results) */}
        {currentUser && !leaderboard.some((p) => p.userId === currentUser.userId) && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Your position</p>
            <ParticipantRow
              participant={currentUser}
              challenge={challenge}
              progress={getProgress(currentUser)}
              isCurrentUser
            />
          </div>
        )}

        {/* Empty state */}
        {leaderboard.length === 0 && podium.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No participants yet</p>
            <p className="text-sm">Be the first to join this challenge!</p>
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
  participant: Participant;
  position: 1 | 2 | 3;
  progress: number;
}

function PodiumSpot({ participant, position, progress }: PodiumSpotProps) {
  const heights = { 1: 'h-24', 2: 'h-16', 3: 'h-12' };
  const colors = {
    1: 'bg-yellow-500/20 border-yellow-500',
    2: 'bg-gray-400/20 border-gray-400',
    3: 'bg-amber-700/20 border-amber-700',
  };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="flex flex-col items-center">
      <Avatar className="h-10 w-10 mb-2">
        <AvatarImage src={participant.userAvatar} alt={participant.userName ?? 'User'} />
        <AvatarFallback>
          {(participant.userName ?? 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-medium truncate max-w-[60px]">
        {participant.userName ?? 'Anonymous'}
      </span>
      <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
      <div
        className={cn(
          'w-16 rounded-t-md border-t-2 flex items-start justify-center pt-1',
          heights[position],
          colors[position]
        )}
      >
        <span className="text-xl">{medals[position]}</span>
      </div>
    </div>
  );
}

interface ParticipantRowProps {
  participant: Participant;
  challenge: ChallengeInfo;
  progress: number;
  isCurrentUser?: boolean;
}

function ParticipantRow({
  participant,
  challenge,
  progress,
  isCurrentUser,
}: ParticipantRowProps) {
  const getRankIcon = (rank?: number) => {
    if (!rank) return <span className="text-sm font-medium text-muted-foreground">-</span>;
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  const isComplete = !!participant.completedAt;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-colors',
        isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
      )}
    >
      <div className="w-8 flex justify-center">{getRankIcon(participant.rank)}</div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={participant.userAvatar} alt={participant.userName ?? 'User'} />
        <AvatarFallback className="text-xs">
          {(participant.userName ?? 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate text-sm">
            {participant.userName ?? 'Anonymous'}
          </p>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
          {isComplete && (
            <Badge variant="default" className="text-xs bg-green-500">
              Complete
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {challenge.targetHours && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {participant.hoursCompleted.toFixed(1)}h
            </span>
          )}
          {challenge.targetQualityHours && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {participant.qualityHoursCompleted.toFixed(1)}h
            </span>
          )}
          {challenge.targetSessions && (
            <span className="flex items-center gap-1">
              <Medal className="h-3 w-3" />
              {participant.sessionsCompleted}
            </span>
          )}
          {challenge.targetStreak && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {participant.currentStreak}d
            </span>
          )}
        </div>
      </div>
      <div className="w-16">
        <Progress value={progress} className="h-2" />
        <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

export default ChallengeLeaderboard;
