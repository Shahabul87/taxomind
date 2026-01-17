'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Users,
  Clock,
  Target,
  Flame,
  Calendar,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description?: string;
    challengeType: string;
    status: string;
    startsAt: string;
    endsAt: string;
    targetHours?: number;
    targetSessions?: number;
    targetStreak?: number;
    targetQualityHours?: number;
    skillName?: string;
    xpReward: number;
    badgeReward?: string;
    participantCount: number;
    maxParticipants?: number;
    isJoined?: boolean;
    userProgress?: {
      hoursCompleted: number;
      qualityHoursCompleted: number;
      sessionsCompleted: number;
      currentStreak: number;
      rank?: number;
      completedAt?: string;
      rewardClaimed: boolean;
    };
  };
  onJoin?: (id: string) => Promise<void>;
  onLeave?: (id: string) => Promise<void>;
  onViewDetails?: (id: string) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ChallengeCard({
  challenge,
  onJoin,
  onLeave,
  onViewDetails,
  variant = 'default',
  className,
}: ChallengeCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Calculate time remaining
  const now = new Date();
  const endsAt = new Date(challenge.endsAt);
  const startsAt = new Date(challenge.startsAt);
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const hasStarted = startsAt <= now;
  const hasEnded = endsAt <= now;

  // Calculate progress
  let progressPercentage = 0;
  if (challenge.userProgress) {
    const progressValues: number[] = [];

    if (challenge.targetHours) {
      progressValues.push(
        Math.min(100, (challenge.userProgress.hoursCompleted / challenge.targetHours) * 100)
      );
    }
    if (challenge.targetQualityHours) {
      progressValues.push(
        Math.min(100, (challenge.userProgress.qualityHoursCompleted / challenge.targetQualityHours) * 100)
      );
    }
    if (challenge.targetSessions) {
      progressValues.push(
        Math.min(100, (challenge.userProgress.sessionsCompleted / challenge.targetSessions) * 100)
      );
    }
    if (challenge.targetStreak) {
      progressValues.push(
        Math.min(100, (challenge.userProgress.currentStreak / challenge.targetStreak) * 100)
      );
    }

    if (progressValues.length > 0) {
      progressPercentage = Math.max(...progressValues);
    }
  }

  const isComplete = challenge.userProgress?.completedAt !== undefined;

  // Handle join/leave
  const handleJoin = async () => {
    if (!onJoin) return;
    setIsLoading(true);
    try {
      await onJoin(challenge.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!onLeave) return;
    setIsLoading(true);
    try {
      await onLeave(challenge.id);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (hasEnded) {
      return <Badge variant="secondary">Ended</Badge>;
    }
    if (!hasStarted) {
      return <Badge variant="outline">Starting Soon</Badge>;
    }
    if (challenge.status === 'ACTIVE') {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="secondary">{challenge.status}</Badge>;
  };

  // Get challenge type icon
  const getChallengeTypeIcon = () => {
    switch (challenge.challengeType) {
      case 'COMPETITION':
        return <Trophy className="h-4 w-4" />;
      case 'GROUP':
        return <Users className="h-4 w-4" />;
      case 'COMMUNITY':
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          challenge.isJoined && 'border-primary/50',
          className
        )}
        onClick={() => onViewDetails?.(challenge.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getChallengeTypeIcon()}
                <h4 className="font-medium truncate">{challenge.title}</h4>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {challenge.participantCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {daysRemaining}d left
                </span>
              </div>
            </div>
            {getStatusBadge()}
          </div>
          {challenge.isJoined && (
            <Progress value={progressPercentage} className="mt-3 h-1.5" />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(challenge.isJoined && 'border-primary/50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {getChallengeTypeIcon()}
            {getStatusBadge()}
          </div>
          {challenge.skillName && (
            <Badge variant="outline">{challenge.skillName}</Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg mt-2">{challenge.title}</h3>
        {challenge.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {challenge.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Targets */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {challenge.targetHours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {challenge.userProgress
                  ? `${challenge.userProgress.hoursCompleted.toFixed(1)} / `
                  : ''}
                {challenge.targetHours}h
              </span>
            </div>
          )}
          {challenge.targetQualityHours && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>
                {challenge.userProgress
                  ? `${challenge.userProgress.qualityHoursCompleted.toFixed(1)} / `
                  : ''}
                {challenge.targetQualityHours} quality h
              </span>
            </div>
          )}
          {challenge.targetSessions && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {challenge.userProgress
                  ? `${challenge.userProgress.sessionsCompleted} / `
                  : ''}
                {challenge.targetSessions} sessions
              </span>
            </div>
          )}
          {challenge.targetStreak && (
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <span>
                {challenge.userProgress
                  ? `${challenge.userProgress.currentStreak} / `
                  : ''}
                {challenge.targetStreak} day streak
              </span>
            </div>
          )}
        </div>

        {/* Progress bar for joined challenges */}
        {challenge.isJoined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {challenge.participantCount}
              {challenge.maxParticipants && ` / ${challenge.maxParticipants}`} participants
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{daysRemaining} days left</span>
          </div>
        </div>

        {/* Rewards */}
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span>{challenge.xpReward} XP</span>
          {challenge.badgeReward && (
            <Badge variant="secondary" className="text-xs">
              {challenge.badgeReward}
            </Badge>
          )}
        </div>

        {/* User rank if joined */}
        {challenge.userProgress?.rank && (
          <div className="text-sm">
            <span className="text-muted-foreground">Your rank: </span>
            <span className="font-medium">#{challenge.userProgress.rank}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!challenge.isJoined ? (
          <Button
            className="flex-1"
            onClick={handleJoin}
            disabled={isLoading || hasEnded}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {hasEnded ? 'Challenge Ended' : 'Join Challenge'}
          </Button>
        ) : isComplete ? (
          <Button className="flex-1" variant="secondary" disabled>
            Completed!
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleLeave}
              disabled={isLoading}
            >
              Leave
            </Button>
            <Button
              className="flex-1"
              onClick={() => onViewDetails?.(challenge.id)}
            >
              View Progress
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export default ChallengeCard;
