'use client';

/**
 * AchievementBadges
 *
 * Displays user achievements and badges earned through learning.
 * Part of the gamification system.
 *
 * Features:
 * - Badge grid display
 * - Progress toward locked badges
 * - Rarity indicators
 * - Animation on unlock
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Award,
  Trophy,
  Star,
  Flame,
  Zap,
  Target,
  BookOpen,
  Brain,
  Clock,
  Users,
  Lock,
  Sparkles,
  Crown,
  Medal,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'streak' | 'mastery' | 'social' | 'milestone' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name
  category: BadgeCategory;
  rarity: BadgeRarity;
  xpReward: number;
  progress: number; // 0-100
  isUnlocked: boolean;
  unlockedAt?: string;
  requirement: string;
}

export interface AchievementBadgesProps {
  className?: string;
  /** Maximum badges to show */
  limit?: number;
  /** Show locked badges */
  showLocked?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Category filter */
  categoryFilter?: BadgeCategory | 'all';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RARITY_CONFIG: Record<
  BadgeRarity,
  { label: string; color: string; bgColor: string; glow: string }
> = {
  common: {
    label: 'Common',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    glow: '',
  },
  uncommon: {
    label: 'Uncommon',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    glow: 'shadow-green-500/20',
  },
  rare: {
    label: 'Rare',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    glow: 'shadow-blue-500/30',
  },
  epic: {
    label: 'Epic',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    glow: 'shadow-purple-500/40',
  },
  legendary: {
    label: 'Legendary',
    color: 'text-amber-600',
    bgColor: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30',
    glow: 'shadow-amber-500/50 ring-2 ring-amber-300 dark:ring-amber-600',
  },
};

const CATEGORY_CONFIG: Record<
  BadgeCategory,
  { icon: typeof Award; label: string }
> = {
  streak: { icon: Flame, label: 'Streak' },
  mastery: { icon: Brain, label: 'Mastery' },
  social: { icon: Users, label: 'Social' },
  milestone: { icon: Trophy, label: 'Milestone' },
  special: { icon: Crown, label: 'Special' },
};

const ICON_MAP: Record<string, typeof Award> = {
  award: Award,
  trophy: Trophy,
  star: Star,
  flame: Flame,
  zap: Zap,
  target: Target,
  book: BookOpen,
  brain: Brain,
  clock: Clock,
  users: Users,
  sparkles: Sparkles,
  crown: Crown,
  medal: Medal,
};

// ============================================================================
// COMPONENTS
// ============================================================================

function BadgeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function AchievementBadge({
  achievement,
  onClick,
  compact,
}: {
  achievement: Achievement;
  onClick: () => void;
  compact: boolean;
}) {
  const rarityConfig = RARITY_CONFIG[achievement.rarity];
  const categoryConfig = CATEGORY_CONFIG[achievement.category];
  const IconComponent = ICON_MAP[achievement.icon] || Award;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
              'relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
              'hover:bg-gray-50 dark:hover:bg-gray-800/50',
              achievement.isUnlocked ? 'cursor-pointer' : 'cursor-default'
            )}
          >
            <div
              className={cn(
                'relative flex items-center justify-center rounded-full',
                compact ? 'h-12 w-12' : 'h-16 w-16',
                rarityConfig.bgColor,
                achievement.isUnlocked && rarityConfig.glow,
                achievement.isUnlocked && 'shadow-lg',
                !achievement.isUnlocked && 'grayscale opacity-50'
              )}
            >
              {achievement.isUnlocked ? (
                <IconComponent
                  className={cn(
                    rarityConfig.color,
                    compact ? 'h-6 w-6' : 'h-8 w-8'
                  )}
                />
              ) : (
                <Lock
                  className={cn(
                    'text-gray-400',
                    compact ? 'h-5 w-5' : 'h-6 w-6'
                  )}
                />
              )}

              {/* Progress ring for locked badges */}
              {!achievement.isUnlocked && achievement.progress > 0 && (
                <svg
                  className="absolute inset-0"
                  viewBox="0 0 64 64"
                >
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="32"
                    cy="32"
                  />
                  <circle
                    className={rarityConfig.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="32"
                    cy="32"
                    strokeDasharray={`${achievement.progress * 1.76} 176`}
                    style={{
                      transformOrigin: '50% 50%',
                      transform: 'rotate(-90deg)',
                    }}
                  />
                </svg>
              )}

              {/* Legendary sparkle effect */}
              {achievement.isUnlocked && achievement.rarity === 'legendary' && (
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(251, 191, 36, 0.3)',
                      '0 0 20px rgba(251, 191, 36, 0.5)',
                      '0 0 10px rgba(251, 191, 36, 0.3)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </div>

            {!compact && (
              <span
                className={cn(
                  'text-xs font-medium text-center line-clamp-2',
                  achievement.isUnlocked
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400'
                )}
              >
                {achievement.name}
              </span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">
              {achievement.description}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <UIBadge variant="outline" className={cn('text-xs', rarityConfig.color)}>
                {rarityConfig.label}
              </UIBadge>
              <span className="text-xs text-amber-500">+{achievement.xpReward} XP</span>
            </div>
            {!achievement.isUnlocked && (
              <p className="text-xs text-gray-500 pt-1">
                {achievement.progress}% complete
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AchievementDetailDialog({
  achievement,
  open,
  onOpenChange,
}: {
  achievement: Achievement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!achievement) return null;

  const rarityConfig = RARITY_CONFIG[achievement.rarity];
  const IconComponent = ICON_MAP[achievement.icon] || Award;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className={cn(
                'flex items-center justify-center h-24 w-24 rounded-full',
                rarityConfig.bgColor,
                achievement.isUnlocked && rarityConfig.glow,
                achievement.isUnlocked && 'shadow-xl'
              )}
            >
              {achievement.isUnlocked ? (
                <IconComponent className={cn('h-12 w-12', rarityConfig.color)} />
              ) : (
                <Lock className="h-10 w-10 text-gray-400" />
              )}
            </motion.div>
          </div>
          <DialogTitle className="text-xl">{achievement.name}</DialogTitle>
          <DialogDescription>{achievement.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex justify-center gap-2">
            <UIBadge variant="outline" className={rarityConfig.color}>
              {rarityConfig.label}
            </UIBadge>
            <UIBadge variant="outline" className="text-amber-600">
              +{achievement.xpReward} XP
            </UIBadge>
          </div>

          {!achievement.isUnlocked && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{achievement.progress}%</span>
              </div>
              <Progress value={achievement.progress} />
              <p className="text-xs text-center text-muted-foreground">
                {achievement.requirement}
              </p>
            </div>
          )}

          {achievement.isUnlocked && achievement.unlockedAt && (
            <p className="text-center text-sm text-muted-foreground">
              Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AchievementBadges({
  className,
  limit = 12,
  showLocked = true,
  compact = false,
  categoryFilter = 'all',
}: AchievementBadgesProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchAchievements() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/sam/gamification/achievements');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAchievements(data.data?.achievements || []);
          }
        }
      } catch (error) {
        console.error('[AchievementBadges] Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAchievements();
  }, []);

  const filteredAchievements = useMemo(() => {
    let result = achievements;

    if (categoryFilter !== 'all') {
      result = result.filter((a) => a.category === categoryFilter);
    }

    if (!showLocked) {
      result = result.filter((a) => a.isUnlocked);
    }

    // Sort: unlocked first, then by rarity
    const rarityOrder: BadgeRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    result.sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
    });

    return result.slice(0, limit);
  }, [achievements, categoryFilter, showLocked, limit]);

  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.isUnlocked).length;
    const totalXp = achievements
      .filter((a) => a.isUnlocked)
      .reduce((sum, a) => sum + a.xpReward, 0);
    return { total, unlocked, totalXp };
  }, [achievements]);

  const handleBadgeClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsDialogOpen(true);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Achievements</CardTitle>
          </div>
          <UIBadge variant="secondary">
            {stats.unlocked}/{stats.total}
          </UIBadge>
        </div>
        <CardDescription>
          {stats.totalXp.toLocaleString()} XP earned from badges
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className={cn('grid gap-4', compact ? 'grid-cols-6' : 'grid-cols-4')}>
            {[...Array(8)].map((_, i) => (
              <BadgeSkeleton key={i} />
            ))}
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground">
              No achievements yet. Keep learning to earn badges!
            </p>
          </div>
        ) : (
          <div className={cn('grid gap-2', compact ? 'grid-cols-6' : 'grid-cols-4')}>
            <AnimatePresence>
              {filteredAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  onClick={() => handleBadgeClick(achievement)}
                  compact={compact}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      <AchievementDetailDialog
        achievement={selectedAchievement}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </Card>
  );
}

export default AchievementBadges;
