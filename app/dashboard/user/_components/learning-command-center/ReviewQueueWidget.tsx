'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Brain, AlertTriangle, ChevronRight, Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewQueueStats {
  totalItems: number;
  dueNowCount: number;
  upcomingCount: number;
  averageMastery: number;
}

/**
 * ReviewQueueWidget Component
 *
 * A compact widget for the Learning Command Center that shows
 * review queue status and provides quick access to the full review page.
 */
export function ReviewQueueWidget({ className }: { className?: string }) {
  const [stats, setStats] = useState<ReviewQueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/sam/mentor/review-queue?limit=1');
      const data = await response.json();

      if (data.success) {
        setStats({
          totalItems: data.data.stats?.totalItems ?? 0,
          dueNowCount: data.data.dueNow?.length ?? 0,
          upcomingCount: data.data.upcomingCount ?? 0,
          averageMastery: data.data.stats?.averageMastery ?? 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch review queue stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasDueItems = (stats?.dueNowCount ?? 0) > 0;
  const totalPending = (stats?.dueNowCount ?? 0) + (stats?.upcomingCount ?? 0);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                hasDueItems
                  ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20'
                  : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
              )}
            >
              {hasDueItems ? (
                <Brain className="w-6 h-6 text-orange-400" />
              ) : (
                <Trophy className="w-6 h-6 text-green-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Review Queue</h3>
              <p className="text-sm text-muted-foreground">
                {hasDueItems
                  ? `${stats?.dueNowCount} item${stats?.dueNowCount !== 1 ? 's' : ''} due now`
                  : 'All caught up!'}
              </p>
            </div>
          </div>

          {hasDueItems && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {stats?.dueNowCount}
            </Badge>
          )}
        </div>

        {/* Stats Row */}
        {stats && stats.totalItems > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{stats.totalItems} total items</span>
              <span>{Math.round(stats.averageMastery * 100)}% avg mastery</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link href="/dashboard/user/review" className="block mt-4">
          <Button
            className={cn(
              'w-full',
              hasDueItems
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            )}
          >
            {hasDueItems ? 'Start Review Session' : 'View Review Queue'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
