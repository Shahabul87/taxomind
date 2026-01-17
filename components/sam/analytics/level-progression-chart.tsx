'use client';

/**
 * LevelProgressionChart Component
 *
 * Visualizes XP and level progression over time for gamification features.
 * Shows the learner's journey through levels with achievements and milestones.
 *
 * Features:
 * - XP accumulation timeline
 * - Level progression visualization
 * - Achievement milestones
 * - Projected progression
 */

import React, { useMemo } from 'react';
import {
  Line,
  LineChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Star,
  Zap,
  TrendingUp,
  Award,
  Target,
  Flame,
  Crown,
  Medal,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface XPDataPoint {
  date: string;
  totalXP: number;
  level: number;
  dailyXP: number;
  source?: string;
}

export interface LevelMilestone {
  level: number;
  title: string;
  xpRequired: number;
  rewards?: string[];
  achievedAt?: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpBonus: number;
  icon: 'trophy' | 'star' | 'medal' | 'crown' | 'flame';
  earnedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LevelProgressionChartProps {
  xpHistory?: XPDataPoint[];
  currentLevel?: number;
  currentXP?: number;
  xpToNextLevel?: number;
  totalXP?: number;
  milestones?: LevelMilestone[];
  achievements?: Achievement[];
  dailyXPGoal?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MILESTONES: LevelMilestone[] = [
  { level: 1, title: 'Novice Learner', xpRequired: 0, rewards: ['Beginner Badge'] },
  { level: 5, title: 'Active Student', xpRequired: 500, rewards: ['Custom Avatar Frame'] },
  { level: 10, title: 'Dedicated Scholar', xpRequired: 1500, rewards: ['Profile Theme'] },
  { level: 15, title: 'Knowledge Seeker', xpRequired: 3000, rewards: ['Special Emoji Pack'] },
  { level: 20, title: 'Expert Learner', xpRequired: 5000, rewards: ['Exclusive Badge'] },
  { level: 25, title: 'Master Scholar', xpRequired: 8000, rewards: ['Golden Crown'] },
  { level: 30, title: 'Learning Legend', xpRequired: 12000, rewards: ['Legend Title'] },
];

const RARITY_COLORS = {
  common: { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-300' },
  rare: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-300' },
  epic: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-300' },
  legendary: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-300' },
};

const ACHIEVEMENT_ICONS = {
  trophy: Trophy,
  star: Star,
  medal: Medal,
  crown: Crown,
  flame: Flame,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSampleXPHistory(days: number = 30): XPDataPoint[] {
  const data: XPDataPoint[] = [];
  const today = new Date();
  let totalXP = 0;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Random daily XP with some variance
    const dailyXP = Math.floor(50 + Math.random() * 100);
    totalXP += dailyXP;

    // Calculate level from XP
    const level = calculateLevel(totalXP);

    data.push({
      date: date.toISOString().split('T')[0],
      totalXP,
      level,
      dailyXP,
      source: ['quiz', 'lesson', 'practice', 'streak'][Math.floor(Math.random() * 4)],
    });
  }

  return data;
}

function calculateLevel(xp: number): number {
  // Level formula: each level requires progressively more XP
  // Level n requires: 100 * n * (n + 1) / 2 total XP
  let level = 1;
  let xpRequired = 100;

  while (xp >= xpRequired) {
    level++;
    xpRequired += 100 * level;
  }

  return level;
}

function getXPForLevel(level: number): number {
  // Sum of 100 * i for i = 1 to level
  return 100 * level * (level + 1) / 2;
}

function getLevelProgress(currentXP: number, currentLevel: number): number {
  const xpForCurrentLevel = getXPForLevel(currentLevel - 1);
  const xpForNextLevel = getXPForLevel(currentLevel);
  const xpIntoLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;

  return (xpIntoLevel / xpNeededForLevel) * 100;
}

function formatXP(xp: number): string {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

function getDaysToNextLevel(currentXP: number, currentLevel: number, avgDailyXP: number): number {
  const xpForNextLevel = getXPForLevel(currentLevel);
  const xpNeeded = xpForNextLevel - currentXP;

  if (avgDailyXP <= 0) return Infinity;
  return Math.ceil(xpNeeded / avgDailyXP);
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload?: XPDataPoint;
  }>;
  label?: string;
}

function XPTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-sm mb-2">{label}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Total XP
          </span>
          <span className="font-bold text-amber-600">{formatXP(data.totalXP)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-purple-500" />
            Level
          </span>
          <span className="font-bold text-purple-600">{data.level}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            Daily XP
          </span>
          <span className="font-bold text-green-600">+{data.dailyXP}</span>
        </div>
        {data.source && (
          <div className="pt-1 border-t mt-1">
            <span className="text-xs text-muted-foreground">
              Source: <span className="capitalize">{data.source}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const IconComponent = ACHIEVEMENT_ICONS[achievement.icon];
  const colors = RARITY_COLORS[achievement.rarity];

  return (
    <div
      className={cn(
        'relative p-3 rounded-lg border-2 transition-all hover:scale-105',
        colors.bg,
        colors.border,
        !achievement.earnedAt && 'opacity-50 grayscale'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-full', colors.bg)}>
          <IconComponent className={cn('w-5 h-5', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{achievement.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{achievement.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn('text-xs', colors.text)}>
              +{achievement.xpBonus} XP
            </Badge>
            <Badge variant="outline" className={cn('text-xs capitalize', colors.text)}>
              {achievement.rarity}
            </Badge>
          </div>
        </div>
      </div>
      {achievement.earnedAt && (
        <div className="absolute top-2 right-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
      )}
    </div>
  );
}

function MilestoneTimeline({ milestones, currentLevel }: { milestones: LevelMilestone[]; currentLevel: number }) {
  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const isAchieved = currentLevel >= milestone.level;
          const isCurrent = currentLevel === milestone.level;

          return (
            <div key={milestone.level} className="relative flex items-start gap-4 pl-0">
              {/* Milestone dot */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                  isAchieved
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-muted',
                  isCurrent && 'ring-4 ring-primary/20'
                )}
              >
                {isAchieved ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{milestone.level}</span>
                )}
              </div>

              {/* Milestone content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <h4 className={cn('font-medium', isAchieved ? 'text-primary' : 'text-muted-foreground')}>
                    {milestone.title}
                  </h4>
                  {isCurrent && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Level {milestone.level} - {formatXP(milestone.xpRequired)} XP
                </p>
                {milestone.rewards && milestone.rewards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {milestone.rewards.map((reward) => (
                      <Badge key={reward} variant="outline" className="text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        {reward}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LevelProgressionChart({
  xpHistory,
  currentLevel = 12,
  currentXP = 2150,
  xpToNextLevel = 350,
  totalXP,
  milestones = DEFAULT_MILESTONES,
  achievements = [],
  dailyXPGoal = 100,
  className,
}: LevelProgressionChartProps) {
  // Generate sample data if not provided
  const chartData = useMemo(() => xpHistory ?? generateSampleXPHistory(), [xpHistory]);

  // Calculate insights
  const insights = useMemo(() => {
    const finalData = chartData[chartData.length - 1];
    const effectiveCurrentXP = totalXP ?? finalData?.totalXP ?? currentXP;
    const effectiveLevel = finalData?.level ?? currentLevel;

    // Calculate average daily XP from last 7 days
    const last7Days = chartData.slice(-7);
    const avgDailyXP = last7Days.reduce((sum, d) => sum + d.dailyXP, 0) / Math.max(last7Days.length, 1);

    // Level progress
    const levelProgress = getLevelProgress(effectiveCurrentXP, effectiveLevel);
    const daysToNextLevel = getDaysToNextLevel(effectiveCurrentXP, effectiveLevel, avgDailyXP);

    // XP breakdown by source (mock data)
    const xpBySource = {
      quiz: Math.floor(effectiveCurrentXP * 0.35),
      lesson: Math.floor(effectiveCurrentXP * 0.30),
      practice: Math.floor(effectiveCurrentXP * 0.20),
      streak: Math.floor(effectiveCurrentXP * 0.15),
    };

    // Today's XP
    const todayXP = chartData[chartData.length - 1]?.dailyXP ?? 0;
    const xpGoalProgress = (todayXP / dailyXPGoal) * 100;

    return {
      effectiveCurrentXP,
      effectiveLevel,
      avgDailyXP,
      levelProgress,
      daysToNextLevel,
      xpBySource,
      todayXP,
      xpGoalProgress,
    };
  }, [chartData, currentXP, currentLevel, totalXP, dailyXPGoal]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Level Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Level Card */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {/* Level Badge */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <div className="text-center text-white">
                    <span className="text-3xl font-bold">{insights.effectiveLevel}</span>
                    <p className="text-xs opacity-80">Level</p>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1.5 shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Progress Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Progress to Level {insights.effectiveLevel + 1}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatXP(insights.effectiveCurrentXP)} / {formatXP(getXPForLevel(insights.effectiveLevel))} XP
                    </span>
                  </div>
                  <Progress value={insights.levelProgress} className="h-3" />
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Avg:</span>
                    <span className="font-medium">{Math.round(insights.avgDailyXP)} XP/day</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-muted-foreground">Next level in:</span>
                    <span className="font-medium">
                      {insights.daysToNextLevel === Infinity ? 'N/A' : `~${insights.daysToNextLevel} days`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Goal Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className={cn('w-5 h-5', insights.xpGoalProgress >= 100 ? 'text-orange-500' : 'text-muted-foreground')} />
                <span className="font-medium">Daily XP Goal</span>
              </div>
              <p className="text-3xl font-bold">
                <span className={insights.xpGoalProgress >= 100 ? 'text-green-500' : ''}>
                  {insights.todayXP}
                </span>
                <span className="text-muted-foreground text-lg"> / {dailyXPGoal}</span>
              </p>
              <Progress
                value={Math.min(100, insights.xpGoalProgress)}
                className={cn('h-2 mt-2', insights.xpGoalProgress >= 100 && '[&>div]:bg-green-500')}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {insights.xpGoalProgress >= 100
                  ? 'Goal achieved! Keep going!'
                  : `${dailyXPGoal - insights.todayXP} XP more to reach your goal`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* XP Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            XP Progression Timeline
          </CardTitle>
          <CardDescription>Your experience points growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={formatXP} />
                <Tooltip content={<XPTooltip />} />
                <Legend />

                {/* Level milestone lines */}
                {milestones.map((milestone) => (
                  <ReferenceLine
                    key={milestone.level}
                    y={milestone.xpRequired}
                    stroke="#8b5cf6"
                    strokeDasharray="3 3"
                    label={{ value: `Lv${milestone.level}`, position: 'right', fontSize: 10 }}
                  />
                ))}

                <Area
                  type="monotone"
                  dataKey="totalXP"
                  name="Total XP"
                  stroke="#f59e0b"
                  fill="url(#xpGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Milestones and Achievements */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Level Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Level Milestones
            </CardTitle>
            <CardDescription>Unlock rewards as you progress</CardDescription>
          </CardHeader>
          <CardContent>
            <MilestoneTimeline milestones={milestones} currentLevel={insights.effectiveLevel} />
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              Achievements
            </CardTitle>
            <CardDescription>Special accomplishments and bonus XP</CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length > 0 ? (
              <div className="grid gap-3">
                {achievements.slice(0, 4).map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
                {achievements.length > 4 && (
                  <p className="text-sm text-center text-muted-foreground">
                    +{achievements.length - 4} more achievements
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Complete challenges to earn achievements!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LevelProgressionChart;
