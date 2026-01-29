'use client';

import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, Sparkles, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CognitiveRadarChart } from './cognitive-radar-chart';

interface CognitiveProfileCardProps {
  profile: {
    overallLevel: number;
    levelName: string;
    levelNumber: number;
    distribution: {
      remember: number;
      understand: number;
      apply: number;
      analyze: number;
      evaluate: number;
      create: number;
    };
    strengths: string[];
    growthArea: string | null;
    totalActivities: number;
    growth: {
      startingLevel: number | null;
      peakLevel: number | null;
      totalGrowth: number;
    };
  };
  className?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  Rememberer: 'from-purple-500 to-purple-600',
  Understander: 'from-cyan-500 to-cyan-600',
  Applier: 'from-emerald-500 to-emerald-600',
  Analyzer: 'from-amber-500 to-amber-600',
  Evaluator: 'from-red-500 to-red-600',
  Creator: 'from-pink-500 to-pink-600',
};

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  Rememberer: 'You recall facts with ease',
  Understander: 'You explain concepts clearly',
  Applier: 'You use knowledge in new situations',
  Analyzer: 'You break down complex problems',
  Evaluator: 'You make sound judgments',
  Creator: 'You generate original solutions',
};

const STRENGTH_LABELS: Record<string, string> = {
  remember: 'Memory',
  understand: 'Comprehension',
  apply: 'Application',
  analyze: 'Analysis',
  evaluate: 'Evaluation',
  create: 'Creation',
};

export function CognitiveProfileCard({ profile, className }: CognitiveProfileCardProps) {
  const progressToNext = ((profile.overallLevel % 1) * 100);
  const levelColor = LEVEL_COLORS[profile.levelName] || 'from-purple-500 to-purple-600';
  const levelDescription = LEVEL_DESCRIPTIONS[profile.levelName] || '';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={cn('bg-gradient-to-r text-white', levelColor)}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <CardTitle className="text-lg font-semibold">
                Your Cognitive Profile
              </CardTitle>
            </div>
            <p className="text-sm text-white/80">
              Track your thinking growth across Bloom&apos;s Taxonomy
            </p>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
            Level {profile.levelNumber}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Level and Stats */}
          <div className="space-y-6">
            {/* Overall Level Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className={cn(
                'flex h-20 w-20 items-center justify-center rounded-2xl',
                'bg-gradient-to-br shadow-lg',
                levelColor
              )}>
                <span className="text-3xl font-bold text-white">
                  {profile.overallLevel.toFixed(1)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile.levelName}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {levelDescription}
                </p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Progress to next level</span>
                    <span>{Math.round(progressToNext)}%</span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                </div>
              </div>
            </motion.div>

            {/* Strengths */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Your Thinking Strengths</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.strengths.map((strength, i) => (
                  <motion.div
                    key={strength}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                    >
                      ✓ {STRENGTH_LABELS[strength] || strength}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Growth Area */}
            {profile.growthArea && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Target className="h-4 w-4 text-orange-500" />
                  <span>Growth Area</span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
                >
                  {STRENGTH_LABELS[profile.growthArea] || profile.growthArea} - Focus Here!
                </Badge>
              </div>
            )}

            {/* Growth Stats */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center"
              >
                <div className="flex items-center justify-center text-emerald-500 mb-1">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  +{profile.growth.totalGrowth.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">Total Growth</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center"
              >
                <div className="flex items-center justify-center text-purple-500 mb-1">
                  <Award className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {profile.growth.peakLevel?.toFixed(1) || profile.overallLevel.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">Peak Level</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center"
              >
                <div className="flex items-center justify-center text-blue-500 mb-1">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {profile.totalActivities}
                </div>
                <div className="text-xs text-slate-500">Activities</div>
              </motion.div>
            </div>
          </div>

          {/* Right Column - Radar Chart */}
          <div className="flex items-center justify-center">
            <CognitiveRadarChart
              distribution={profile.distribution}
              size={280}
              showLabels={true}
              animated={true}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
