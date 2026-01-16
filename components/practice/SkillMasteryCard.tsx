'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { SkillMasteryRing } from './SkillMasteryRing';
import { cn } from '@/lib/utils';
import {
  Clock,
  Target,
  Flame,
  TrendingUp,
  Play,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SkillMasteryData {
  id: string;
  skillId: string;
  totalQualityHours: number;
  totalRawHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
  proficiencyLevel: string;
  currentStreak: number;
  longestStreak: number;
  lastPracticeAt?: string | Date;
  skill?: {
    id: string;
    name: string;
    category?: string;
    icon?: string;
    color?: string;
  };
  progressTo10K?: number;
  nextMilestone?: number;
}

interface SkillMasteryCardProps {
  mastery: SkillMasteryData;
  variant?: 'default' | 'compact' | 'detailed';
  onStartPractice?: (skillId: string) => void;
  onViewDetails?: (skillId: string) => void;
  className?: string;
}

// Proficiency level info
const PROFICIENCY_INFO: Record<string, { label: string; color: string; emoji: string }> = {
  BEGINNER: { label: 'Beginner', color: 'bg-gray-500', emoji: '🌱' },
  NOVICE: { label: 'Novice', color: 'bg-blue-500', emoji: '📘' },
  INTERMEDIATE: { label: 'Intermediate', color: 'bg-green-500', emoji: '📗' },
  COMPETENT: { label: 'Competent', color: 'bg-yellow-500', emoji: '⭐' },
  PROFICIENT: { label: 'Proficient', color: 'bg-orange-500', emoji: '🔥' },
  ADVANCED: { label: 'Advanced', color: 'bg-red-500', emoji: '💎' },
  EXPERT: { label: 'Expert', color: 'bg-purple-500', emoji: '👑' },
  MASTER: { label: 'Master', color: 'bg-amber-500', emoji: '🏆' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SkillMasteryCard({
  mastery,
  variant = 'default',
  onStartPractice,
  onViewDetails,
  className,
}: SkillMasteryCardProps) {
  const proficiency = PROFICIENCY_INFO[mastery.proficiencyLevel] ?? PROFICIENCY_INFO.BEGINNER;
  const progressTo10K = mastery.progressTo10K ?? (mastery.totalQualityHours / 10000) * 100;
  const nextMilestone = mastery.nextMilestone ?? getNextMilestone(mastery.totalQualityHours);
  const hoursToNextMilestone = nextMilestone - mastery.totalQualityHours;
  const progressToNextMilestone = getProgressToNextMilestone(mastery.totalQualityHours, nextMilestone);

  // Format last practice date
  const lastPracticeText = mastery.lastPracticeAt
    ? formatLastPractice(new Date(mastery.lastPracticeAt))
    : 'Never';

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer',
          className
        )}
        onClick={() => onViewDetails?.(mastery.skillId)}
      >
        <SkillMasteryRing
          qualityHours={mastery.totalQualityHours}
          size={48}
          strokeWidth={5}
          showText={false}
          proficiencyLevel={mastery.proficiencyLevel}
          colorScheme="proficiency"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {mastery.skill?.icon && <span className="mr-1">{mastery.skill.icon}</span>}
            {mastery.skill?.name ?? 'Unknown Skill'}
          </p>
          <p className="text-sm text-muted-foreground">
            {mastery.totalQualityHours.toFixed(1)}h | {proficiency.emoji} {proficiency.label}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {mastery.skill?.icon && <span className="text-2xl">{mastery.skill.icon}</span>}
                {mastery.skill?.name ?? 'Unknown Skill'}
              </CardTitle>
              {mastery.skill?.category && (
                <p className="text-sm text-muted-foreground mt-1">{mastery.skill.category}</p>
              )}
            </div>
            <Badge className={cn(proficiency.color, 'text-white')}>
              {proficiency.emoji} {proficiency.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ring and Stats */}
          <div className="flex items-center gap-6">
            <SkillMasteryRing
              qualityHours={mastery.totalQualityHours}
              size={120}
              strokeWidth={10}
              proficiencyLevel={mastery.proficiencyLevel}
              colorScheme="proficiency"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{mastery.totalRawHours.toFixed(1)}</span>
                <span className="text-muted-foreground">raw hours</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{mastery.sessionsCount}</span>
                <span className="text-muted-foreground">sessions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{mastery.currentStreak}</span>
                <span className="text-muted-foreground">day streak</span>
                {mastery.longestStreak > mastery.currentStreak && (
                  <span className="text-xs text-muted-foreground">
                    (best: {mastery.longestStreak})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{mastery.avgQualityMultiplier.toFixed(2)}x</span>
                <span className="text-muted-foreground">avg multiplier</span>
              </div>
            </div>
          </div>

          {/* Progress to 10K */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to 10,000 hours</span>
              <span className="font-medium">{progressTo10K.toFixed(1)}%</span>
            </div>
            <Progress value={progressTo10K} className="h-2" />
          </div>

          {/* Next Milestone */}
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm font-medium">Next Milestone: {nextMilestone.toLocaleString()} hours</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={progressToNextMilestone} className="flex-1 h-1.5" />
              <span className="text-xs text-muted-foreground">
                {hoursToNextMilestone.toFixed(1)}h to go
              </span>
            </div>
          </div>

          {/* Last Practice */}
          <p className="text-xs text-muted-foreground">
            Last practice: {lastPracticeText}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => onStartPractice?.(mastery.skillId)}
            >
              <Play className="h-4 w-4 mr-2" />
              Practice Now
            </Button>
            <Button
              variant="outline"
              onClick={() => onViewDetails?.(mastery.skillId)}
            >
              Details
            </Button>
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
          <SkillMasteryRing
            qualityHours={mastery.totalQualityHours}
            size={80}
            strokeWidth={8}
            proficiencyLevel={mastery.proficiencyLevel}
            colorScheme="proficiency"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">
                {mastery.skill?.icon && <span className="mr-1">{mastery.skill.icon}</span>}
                {mastery.skill?.name ?? 'Unknown Skill'}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {proficiency.emoji} {proficiency.label}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {mastery.totalQualityHours.toFixed(1)}h
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {mastery.currentStreak}d
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {mastery.avgQualityMultiplier.toFixed(1)}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progressTo10K} className="flex-1 h-1.5" />
                <span className="text-xs text-muted-foreground">
                  {progressTo10K.toFixed(0)}%
                </span>
              </div>
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

function getNextMilestone(currentHours: number): number {
  const milestones = [100, 500, 1000, 2500, 5000, 7500, 10000];
  return milestones.find((m) => m > currentHours) ?? 10000;
}

function getProgressToNextMilestone(currentHours: number, nextMilestone: number): number {
  const milestones = [0, 100, 500, 1000, 2500, 5000, 7500, 10000];
  const prevMilestone = [...milestones].reverse().find((m) => m <= currentHours) ?? 0;
  const range = nextMilestone - prevMilestone;
  const progress = currentHours - prevMilestone;
  return range > 0 ? (progress / range) * 100 : 100;
}

function formatLastPractice(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}
