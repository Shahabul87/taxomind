'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  Lock,
  CheckCircle2,
  Trophy,
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Rocket
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CognitiveJourneyTrackerProps {
  levels: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  xp: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  currentLevelNumber: number;
  className?: string;
}

const JOURNEY_LEVELS = [
  {
    key: 'remember',
    name: 'Remember',
    title: 'Rememberer',
    description: 'You recall facts with ease',
    icon: Brain,
    color: 'purple',
    xpPerLevel: 1000,
  },
  {
    key: 'understand',
    name: 'Understand',
    title: 'Understander',
    description: 'You explain concepts clearly',
    icon: Lightbulb,
    color: 'cyan',
    xpPerLevel: 1000,
  },
  {
    key: 'apply',
    name: 'Apply',
    title: 'Applier',
    description: 'You use knowledge in new situations',
    icon: Wrench,
    color: 'emerald',
    xpPerLevel: 1000,
  },
  {
    key: 'analyze',
    name: 'Analyze',
    title: 'Analyzer',
    description: 'You break down complex problems',
    icon: Search,
    color: 'amber',
    xpPerLevel: 1000,
  },
  {
    key: 'evaluate',
    name: 'Evaluate',
    title: 'Evaluator',
    description: 'You make sound judgments',
    icon: Scale,
    color: 'red',
    xpPerLevel: 1000,
  },
  {
    key: 'create',
    name: 'Create',
    title: 'Creator',
    description: 'You generate original solutions',
    icon: Rocket,
    color: 'pink',
    xpPerLevel: 1000,
  },
] as const;

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; fill: string; glow: string }> = {
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-300 dark:border-purple-700',
    fill: 'bg-purple-500',
    glow: 'shadow-purple-500/30',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-300 dark:border-cyan-700',
    fill: 'bg-cyan-500',
    glow: 'shadow-cyan-500/30',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-700',
    fill: 'bg-emerald-500',
    glow: 'shadow-emerald-500/30',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-700',
    fill: 'bg-amber-500',
    glow: 'shadow-amber-500/30',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-300 dark:border-red-700',
    fill: 'bg-red-500',
    glow: 'shadow-red-500/30',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-300 dark:border-pink-700',
    fill: 'bg-pink-500',
    glow: 'shadow-pink-500/30',
  },
};

export function CognitiveJourneyTracker({
  levels,
  xp,
  currentLevelNumber,
  className,
}: CognitiveJourneyTrackerProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <CardTitle className="text-lg font-semibold">
              Your Cognitive Journey
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
            <Sparkles className="h-4 w-4" />
            <span>Level {currentLevelNumber}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Reversed order - Creator at top, Rememberer at bottom */}
          {[...JOURNEY_LEVELS].reverse().map((level, index) => {
            const levelIndex = JOURNEY_LEVELS.length - 1 - index;
            const levelValue = levels[level.key as keyof typeof levels];
            const xpValue = xp[level.key as keyof typeof xp];
            const isUnlocked = levelValue > 0;
            const isComplete = levelValue >= 10;
            const isCurrent = levelIndex + 1 === currentLevelNumber;
            const colors = COLOR_CLASSES[level.color];
            const Icon = level.icon;

            // Calculate progress to next level within this tier
            const progressPercent = isComplete ? 100 : Math.min(100, (xpValue % level.xpPerLevel) / level.xpPerLevel * 100);

            return (
              <motion.div
                key={level.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                  isUnlocked ? colors.border : 'border-slate-200 dark:border-slate-700',
                  isUnlocked ? colors.bg : 'bg-slate-50 dark:bg-slate-800/30',
                  isCurrent && 'ring-2 ring-offset-2 ring-purple-500 shadow-lg',
                  !isUnlocked && 'opacity-60'
                )}
              >
                {/* Level Icon */}
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    isUnlocked ? `${colors.fill} shadow-lg ${colors.glow}` : 'bg-slate-300 dark:bg-slate-600'
                  )}
                >
                  {!isUnlocked ? (
                    <Lock className="h-5 w-5 text-white" />
                  ) : isComplete ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : (
                    <Icon className="h-6 w-6 text-white" />
                  )}
                </div>

                {/* Level Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className={cn(
                        'font-semibold',
                        isUnlocked ? colors.text : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {level.title}
                    </h4>
                    {isCurrent && (
                      <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                    {isComplete && (
                      <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                        Mastered
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {level.description}
                  </p>

                  {/* Progress bar for unlocked levels */}
                  {isUnlocked && !isComplete && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">
                          Level {levelValue} → {levelValue + 1}
                        </span>
                        <span className={colors.text}>
                          {xpValue.toLocaleString()} XP
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  )}
                </div>

                {/* Level Badge */}
                <div
                  className={cn(
                    'text-center min-w-[60px]',
                    isUnlocked ? colors.text : 'text-slate-400'
                  )}
                >
                  <div className="text-2xl font-bold">
                    {isUnlocked ? levelValue : '-'}
                  </div>
                  <div className="text-xs text-slate-500">Level</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Next Milestone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Trophy className="h-4 w-4" />
            <span className="font-medium text-sm">Next Milestone</span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {currentLevelNumber < 6
              ? `Reach Level ${currentLevelNumber + 1} to unlock ${JOURNEY_LEVELS[currentLevelNumber]?.title || 'new abilities'}`
              : 'You have reached the highest cognitive level! Keep creating!'}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
