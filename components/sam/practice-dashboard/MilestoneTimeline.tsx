'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Award,
  Gift,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MILESTONE_CONFIG, type MilestoneTimelineProps, type MilestoneType } from './types';

export function MilestoneTimeline({
  milestones,
  onClaim,
  isLoading,
  className,
}: MilestoneTimelineProps) {
  const [claimingId, setClaimingId] = React.useState<string | null>(null);

  const handleClaim = async (milestoneId: string) => {
    setClaimingId(milestoneId);
    await onClaim(milestoneId);
    setClaimingId(null);
  };

  if (isLoading) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-slate-500 dark:text-slate-400">Loading milestones...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="py-12 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Milestones Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Keep practicing to unlock your first milestone!
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            First milestone unlocks at 1 quality hour
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort milestones by achievement date (newest first)
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );

  // Count unclaimed
  const unclaimedCount = milestones.filter((m) => !m.rewardClaimed).length;

  return (
    <Card className={cn('border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span>Milestones</span>
          </div>
          {unclaimedCount > 0 && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full flex items-center gap-1">
              <Gift className="h-3 w-3" />
              {unclaimedCount} unclaimed
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-emerald-500 to-slate-300 dark:from-amber-400 dark:via-emerald-400 dark:to-slate-600" />

          {/* Milestones */}
          <div className="space-y-4">
            <AnimatePresence>
              {sortedMilestones.map((milestone, index) => {
                const config = MILESTONE_CONFIG[milestone.milestoneType as MilestoneType] || {
                  hours: 0,
                  badgeName: milestone.badgeName,
                  xpReward: milestone.xpReward,
                  emoji: '🏆',
                };
                const isClaiming = claimingId === milestone.id;

                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'relative pl-10',
                      !milestone.rewardClaimed && 'pr-24'
                    )}
                  >
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-2 top-2 h-4 w-4 rounded-full border-2 flex items-center justify-center',
                        milestone.rewardClaimed
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-amber-500 bg-white dark:bg-slate-800'
                      )}
                    >
                      {milestone.rewardClaimed ? (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      ) : (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="h-2 w-2 rounded-full bg-amber-500"
                        />
                      )}
                    </div>

                    {/* Milestone Card */}
                    <div
                      className={cn(
                        'rounded-lg border p-3 transition-all',
                        milestone.rewardClaimed
                          ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
                          : 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-800 dark:from-amber-950/30 dark:to-yellow-950/30'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{config.emoji}</span>
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {milestone.badgeName}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {milestone.skill?.name || 'Unknown Skill'} • {config.hours.toLocaleString()} hours
                            </p>
                          </div>
                        </div>

                        {/* XP Reward Badge */}
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Sparkles className="h-3 w-3" />
                          <span className="text-xs font-medium">+{milestone.xpReward} XP</span>
                        </div>
                      </div>

                      {/* Achievement info */}
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(milestone.achievedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <span>
                          at {milestone.qualityHoursAtAchievement.toFixed(1)} hours
                        </span>
                      </div>
                    </div>

                    {/* Claim Button */}
                    {!milestone.rewardClaimed && (
                      <div className="absolute right-0 top-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1"
                          onClick={() => handleClaim(milestone.id)}
                          disabled={isClaiming}
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <Gift className="h-3 w-3" />
                              Claim
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MilestoneTimeline;
