'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Sparkles, Trophy } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PracticeStreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate?: Date | string | null;
  variant?: 'default' | 'compact' | 'large';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PracticeStreakDisplay({
  currentStreak,
  longestStreak,
  lastPracticeDate,
  variant = 'default',
  className,
}: PracticeStreakDisplayProps) {
  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak;
  const isAtRisk = isStreakAtRisk(lastPracticeDate);

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="relative">
          <Flame
            className={cn(
              'h-5 w-5 transition-colors',
              currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
            )}
          />
          {currentStreak >= 7 && (
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
          )}
        </div>
        <span className="font-bold tabular-nums">{currentStreak}</span>
        <span className="text-muted-foreground text-sm">day streak</span>
        {isAtRisk && currentStreak > 0 && (
          <Badge variant="destructive" className="text-xs animate-pulse">
            At Risk!
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Practice Streak</h3>
            {isNewRecord && (
              <Badge className="bg-yellow-500 text-black">
                <Trophy className="h-3 w-3 mr-1" />
                New Record!
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Current Streak */}
            <div className="flex-1 text-center">
              <div className="relative inline-flex items-center justify-center">
                <div
                  className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center',
                    currentStreak > 0
                      ? 'bg-gradient-to-br from-orange-400 to-red-500'
                      : 'bg-muted'
                  )}
                >
                  <Flame
                    className={cn(
                      'h-12 w-12',
                      currentStreak > 0 ? 'text-white' : 'text-muted-foreground'
                    )}
                  />
                </div>
                {currentStreak >= 7 && (
                  <Sparkles className="absolute top-0 right-0 h-6 w-6 text-yellow-400 animate-pulse" />
                )}
              </div>
              <div className="mt-3">
                <span className="text-4xl font-bold tabular-nums">{currentStreak}</span>
                <span className="text-muted-foreground ml-2">days</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Current Streak</p>
            </div>

            {/* Streak Stats */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
                <p className="text-2xl font-bold tabular-nums">
                  {longestStreak}
                  <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={isAtRisk ? 'destructive' : currentStreak > 0 ? 'default' : 'secondary'}
                  className={cn(isAtRisk && 'animate-pulse')}
                >
                  {isAtRisk ? 'Practice today!' : currentStreak > 0 ? 'Active' : 'Not started'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Streak Milestones */}
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">Milestones</p>
            <div className="flex gap-2 flex-wrap">
              {[7, 14, 30, 60, 90, 180, 365].map((days) => (
                <Badge
                  key={days}
                  variant={currentStreak >= days ? 'default' : 'outline'}
                  className={cn(
                    currentStreak >= days && 'bg-orange-500',
                    currentStreak < days && 'opacity-50'
                  )}
                >
                  {days === 7 ? '1 week' : days === 14 ? '2 weeks' : days === 30 ? '1 month' :
                   days === 60 ? '2 months' : days === 90 ? '3 months' :
                   days === 180 ? '6 months' : '1 year'}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center shrink-0',
              currentStreak > 0
                ? 'bg-gradient-to-br from-orange-400 to-red-500'
                : 'bg-muted'
            )}
          >
            <Flame
              className={cn(
                'h-8 w-8',
                currentStreak > 0 ? 'text-white' : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold tabular-nums">{currentStreak}</span>
              <span className="text-muted-foreground">day streak</span>
              {isNewRecord && currentStreak > 0 && (
                <Badge className="bg-yellow-500 text-black text-xs">Record!</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span>Best: {longestStreak} days</span>
              {isAtRisk && currentStreak > 0 && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  Practice today!
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isStreakAtRisk(lastPracticeDate?: Date | string | null): boolean {
  if (!lastPracticeDate) return false;

  const last = new Date(lastPracticeDate);
  const now = new Date();

  // Reset to start of day
  last.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  // At risk if last practice was yesterday (need to practice today to maintain)
  return diffDays >= 1;
}
