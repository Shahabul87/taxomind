'use client';

import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Sparkles, Trophy, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CognitiveGrowthCardProps {
  courseTitle: string;
  startingLevel: number;
  currentLevel: number;
  levelGrowth: number;
  topImprovements: Array<{
    level: string;
    growth: number;
    description: string;
  }>;
  activitiesCompleted: number;
  assessmentsTaken: number;
  isCompleted: boolean;
  className?: string;
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Rememberer',
  2: 'Understander',
  3: 'Applier',
  4: 'Analyzer',
  5: 'Evaluator',
  6: 'Creator',
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'from-purple-500 to-purple-600',
  2: 'from-cyan-500 to-cyan-600',
  3: 'from-emerald-500 to-emerald-600',
  4: 'from-amber-500 to-amber-600',
  5: 'from-red-500 to-red-600',
  6: 'from-pink-500 to-pink-600',
};

function getLevelInfo(level: number): { name: string; number: number; color: string } {
  const levelNumber = Math.floor(Math.min(6, Math.max(1, level)));
  return {
    name: LEVEL_NAMES[levelNumber],
    number: levelNumber,
    color: LEVEL_COLORS[levelNumber],
  };
}

export function CognitiveGrowthCard({
  courseTitle,
  startingLevel,
  currentLevel,
  levelGrowth,
  topImprovements,
  activitiesCompleted,
  assessmentsTaken,
  isCompleted,
  className,
}: CognitiveGrowthCardProps) {
  const startInfo = getLevelInfo(startingLevel);
  const currentInfo = getLevelInfo(currentLevel);
  const growthLevels = currentLevel - startingLevel;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle className="text-lg font-semibold">
                Your Growth
              </CardTitle>
            </div>
            <p className="text-sm text-white/80 line-clamp-1">
              {courseTitle}
            </p>
          </div>
          {isCompleted && (
            <Badge className="bg-white/20 text-white hover:bg-white/30">
              <Trophy className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Before/After Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          {/* Starting Level */}
          <div className="flex-1 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              When you started
            </div>
            <div
              className={cn(
                'inline-flex flex-col items-center px-4 py-3 rounded-xl bg-gradient-to-br text-white',
                startInfo.color
              )}
            >
              <span className="text-2xl font-bold">{startingLevel.toFixed(1)}</span>
              <span className="text-xs opacity-90">{startInfo.name}</span>
            </div>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="flex flex-col items-center"
          >
            <ArrowRight className="h-6 w-6 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              +{growthLevels.toFixed(1)}
            </span>
          </motion.div>

          {/* Current Level */}
          <div className="flex-1 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Now
            </div>
            <div
              className={cn(
                'inline-flex flex-col items-center px-4 py-3 rounded-xl bg-gradient-to-br text-white shadow-lg',
                currentInfo.color
              )}
            >
              <span className="text-2xl font-bold">{currentLevel.toFixed(1)}</span>
              <span className="text-xs opacity-90">{currentInfo.name}</span>
            </div>
          </div>
        </motion.div>

        {/* Growth Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
        >
          <Sparkles className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            You&apos;ve grown {growthLevels.toFixed(1)} cognitive levels!
          </span>
        </motion.div>

        {/* Top Improvements */}
        {topImprovements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Target className="h-4 w-4 text-purple-500" />
              <span>Key Improvements</span>
            </div>
            <div className="space-y-2">
              {topImprovements.map((improvement, i) => (
                <motion.div
                  key={improvement.level}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold">
                    +{improvement.growth}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white capitalize">
                      {improvement.level}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {improvement.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center"
          >
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {activitiesCompleted}
            </div>
            <div className="text-xs text-slate-500">Activities Completed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center"
          >
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {assessmentsTaken}
            </div>
            <div className="text-xs text-slate-500">Assessments Taken</div>
          </motion.div>
        </div>

        {/* Progress Bar to Full Growth */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Course Cognitive Impact</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {Math.min(100, Math.round(levelGrowth * 10))}%
            </span>
          </div>
          <Progress
            value={Math.min(100, levelGrowth * 10)}
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
