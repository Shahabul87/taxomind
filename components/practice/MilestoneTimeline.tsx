'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trophy, Gift, Check, Loader2, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface Milestone {
  id: string;
  milestoneType: string;
  achievedAt: string;
  qualityHoursAtAchievement: number;
  rewardClaimed: boolean;
  rewardClaimedAt?: string;
  skillId: string;
  badgeName: string;
  xpReward: number;
  skill?: {
    id: string;
    name: string;
    icon?: string;
  };
}

interface MilestoneTimelineProps {
  skillId?: string;
  limit?: number;
  showUnclaimed?: boolean;
  className?: string;
}

// Milestone icons
const MILESTONE_ICONS: Record<string, string> = {
  HOURS_100: '🎯',
  HOURS_500: '⭐',
  HOURS_1000: '🔥',
  HOURS_2500: '💎',
  HOURS_5000: '🌟',
  HOURS_7500: '👑',
  HOURS_10000: '🏆',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function MilestoneTimeline({
  skillId,
  limit = 10,
  showUnclaimed = true,
  className,
}: MilestoneTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Fetch milestones
  useEffect(() => {
    const fetchMilestones = async () => {
      setIsLoading(true);
      try {
        let url = `/api/sam/practice/milestones?limit=${limit}`;
        if (skillId) {
          url += `&skillId=${skillId}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          setMilestones(result.data.milestones);
        }
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMilestones();
  }, [skillId, limit]);

  // Claim milestone reward
  const handleClaim = async (milestoneId: string) => {
    setClaimingId(milestoneId);
    try {
      const response = await fetch(`/api/sam/practice/milestones/${milestoneId}/claim`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestoneId
              ? { ...m, rewardClaimed: true, rewardClaimedAt: new Date().toISOString() }
              : m
          )
        );

        toast.success(result.message ?? 'Reward claimed!', {
          icon: '🎉',
          duration: 5000,
        });
      } else {
        toast.error(result.error ?? 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming milestone:', error);
      toast.error('Failed to claim reward');
    } finally {
      setClaimingId(null);
    }
  };

  // Filter unclaimed if needed
  const displayedMilestones = showUnclaimed
    ? milestones
    : milestones.filter((m) => m.rewardClaimed);

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Milestones
          {milestones.filter((m) => !m.rewardClaimed).length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {milestones.filter((m) => !m.rewardClaimed).length} unclaimed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedMilestones.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No milestones achieved yet.</p>
            <p className="text-sm">Keep practicing to earn your first milestone!</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Milestones */}
            <div className="space-y-4">
              {displayedMilestones.map((milestone, index) => (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  isFirst={index === 0}
                  isLast={index === displayedMilestones.length - 1}
                  isClaiming={claimingId === milestone.id}
                  onClaim={() => handleClaim(milestone.id)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface MilestoneItemProps {
  milestone: Milestone;
  isFirst: boolean;
  isLast: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}

function MilestoneItem({
  milestone,
  isFirst,
  isLast,
  isClaiming,
  onClaim,
}: MilestoneItemProps) {
  const icon = MILESTONE_ICONS[milestone.milestoneType] ?? '🏅';
  const hours = parseInt(milestone.milestoneType.replace('HOURS_', ''), 10);

  return (
    <div className="relative pl-10">
      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-2.5 w-3 h-3 rounded-full -translate-x-1/2',
          milestone.rewardClaimed
            ? 'bg-green-500'
            : 'bg-yellow-500 animate-pulse'
        )}
      />

      {/* Content */}
      <div
        className={cn(
          'p-3 rounded-lg border',
          !milestone.rewardClaimed && 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <span className="font-medium">{milestone.badgeName}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {hours.toLocaleString()} hours in{' '}
              {milestone.skill?.icon && <span className="mr-1">{milestone.skill.icon}</span>}
              {milestone.skill?.name ?? 'skill'}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(milestone.achievedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                +{milestone.xpReward} XP
              </span>
            </div>
          </div>

          {/* Claim button or claimed status */}
          {milestone.rewardClaimed ? (
            <Badge variant="secondary" className="shrink-0">
              <Check className="h-3 w-3 mr-1" />
              Claimed
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onClaim}
              disabled={isClaiming}
              className="shrink-0"
            >
              {isClaiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-1" />
                  Claim
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
