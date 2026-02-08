'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DepthAnalysisV2Result, ChapterAnalysis } from '../types';

interface ConsistencyMatrixProps {
  analysis: DepthAnalysisV2Result;
}

const DIMENSIONS = [
  { key: 'depth', label: 'Depth', description: 'Cognitive depth score' },
  { key: 'consistency', label: 'Consistency', description: 'Internal consistency' },
  { key: 'flow', label: 'Flow', description: 'Knowledge flow quality' },
  { key: 'quality', label: 'Quality', description: 'Content quality' },
] as const;

function getHeatmapColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500 dark:bg-emerald-600';
  if (score >= 75) return 'bg-emerald-400 dark:bg-emerald-500';
  if (score >= 65) return 'bg-lime-400 dark:bg-lime-500';
  if (score >= 55) return 'bg-amber-400 dark:bg-amber-500';
  if (score >= 45) return 'bg-orange-400 dark:bg-orange-500';
  return 'bg-red-500 dark:bg-red-600';
}

function getHeatmapTextColor(score: number): string {
  if (score >= 65) return 'text-white';
  return 'text-white';
}

function getConsistencyLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Work';
}

export function ConsistencyMatrix({ analysis }: ConsistencyMatrixProps) {
  const chapters = analysis.chapterAnalysis;

  // Calculate standard deviations per dimension to show consistency
  const dimensionStats = useMemo(() => {
    return DIMENSIONS.map((dim) => {
      const values = chapters.map((ch) => ch.scores[dim.key]);
      if (values.length === 0) return { ...dim, mean: 0, stdDev: 0, min: 0, max: 0 };

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      const stdDev = Math.sqrt(variance);

      return {
        ...dim,
        mean: Math.round(mean),
        stdDev: Math.round(stdDev * 10) / 10,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
  }, [chapters]);

  // Cross-chapter consistency: how similar each chapter is to the average
  const chapterDeviations = useMemo(() => {
    return chapters.map((ch) => {
      const avgScore = (ch.scores.depth + ch.scores.consistency + ch.scores.flow + ch.scores.quality) / 4;
      const globalAvg = (analysis.depthScore + analysis.consistencyScore + analysis.flowScore + analysis.qualityScore) / 4;
      return {
        ...ch,
        avgScore: Math.round(avgScore),
        deviation: Math.round(avgScore - globalAvg),
      };
    });
  }, [chapters, analysis]);

  if (chapters.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">No chapter data available for consistency analysis.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heatmap Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Consistency Heatmap
          </h3>
          <Badge variant="outline" className="text-xs">
            Consistency Score: {analysis.consistencyScore}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <TooltipProvider>
            <table className="w-full min-w-[500px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 pb-2 pr-4 w-32">
                    Chapter
                  </th>
                  {DIMENSIONS.map((dim) => (
                    <th key={dim.key} className="text-center text-xs font-medium text-slate-500 pb-2 px-1">
                      {dim.label}
                    </th>
                  ))}
                  <th className="text-center text-xs font-medium text-slate-500 pb-2 px-1">
                    Avg
                  </th>
                </tr>
              </thead>
              <tbody>
                {chapterDeviations.map((chapter, rowIndex) => (
                  <motion.tr
                    key={chapter.chapterId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rowIndex * 0.04 }}
                  >
                    <td className="pr-4 py-1">
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate block max-w-[120px]">
                        {chapter.position}. {chapter.chapterTitle}
                      </span>
                    </td>
                    {DIMENSIONS.map((dim) => {
                      const score = chapter.scores[dim.key];
                      return (
                        <td key={dim.key} className="px-1 py-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'w-full h-9 rounded-md flex items-center justify-center cursor-default transition-all hover:ring-2 hover:ring-violet-400',
                                  getHeatmapColor(score),
                                  getHeatmapTextColor(score)
                                )}
                              >
                                <span className="text-xs font-bold">{score}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                <strong>{chapter.chapterTitle}</strong><br />
                                {dim.label}: {score}/100 - {getConsistencyLabel(score)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                    <td className="px-1 py-1">
                      <div
                        className={cn(
                          'w-full h-9 rounded-md flex items-center justify-center border-2',
                          chapter.deviation >= 0
                            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                        )}
                      >
                        <span
                          className={cn(
                            'text-xs font-bold',
                            chapter.deviation >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-red-700 dark:text-red-400'
                          )}
                        >
                          {chapter.avgScore}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <span className="text-xs text-slate-500">Score:</span>
          <div className="flex items-center gap-1">
            {[
              { label: '85+', color: 'bg-emerald-500' },
              { label: '75+', color: 'bg-emerald-400' },
              { label: '65+', color: 'bg-lime-400' },
              { label: '55+', color: 'bg-amber-400' },
              { label: '45+', color: 'bg-orange-400' },
              { label: '<45', color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className={cn('w-3 h-3 rounded-sm', item.color)} />
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Dimension Statistics */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Cross-Chapter Variance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {dimensionStats.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stat.mean}</div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                <span>Range: {stat.min}-{stat.max}</span>
                <span className={cn(
                  'font-medium',
                  stat.stdDev <= 10 ? 'text-emerald-600' : stat.stdDev <= 20 ? 'text-amber-600' : 'text-red-600'
                )}>
                  &sigma; {stat.stdDev}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Insight */}
      <Card className="p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The heatmap shows how consistent each chapter&apos;s quality is across four dimensions.
            Lower variance (&sigma;) indicates more consistent content. Green cells mean strong
            performance, while red cells highlight chapters needing improvement.
          </p>
        </div>
      </Card>
    </div>
  );
}
