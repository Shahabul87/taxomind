'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DepthAnalysisV2Result, BloomsDistribution } from '../types';

interface BloomsTaxonomyChartProps {
  analysis: DepthAnalysisV2Result;
}

const BLOOMS_LEVELS = [
  { key: 'REMEMBER', label: 'Remember', color: '#94a3b8', description: 'Recall facts and basic concepts' },
  { key: 'UNDERSTAND', label: 'Understand', color: '#60a5fa', description: 'Explain ideas and concepts' },
  { key: 'APPLY', label: 'Apply', color: '#34d399', description: 'Use information in new situations' },
  { key: 'ANALYZE', label: 'Analyze', color: '#fbbf24', description: 'Draw connections among ideas' },
  { key: 'EVALUATE', label: 'Evaluate', color: '#f97316', description: 'Justify a decision or course of action' },
  { key: 'CREATE', label: 'Create', color: '#a78bfa', description: 'Produce new or original work' },
] as const;

const RECOMMENDED_DISTRIBUTION: BloomsDistribution = {
  REMEMBER: 10,
  UNDERSTAND: 20,
  APPLY: 25,
  ANALYZE: 20,
  EVALUATE: 15,
  CREATE: 10,
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; recommended: number; color: string; description: string } }> }) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-w-[220px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: data.color }} />
        <span className="font-semibold text-sm text-slate-900 dark:text-white">{data.name}</span>
      </div>
      <p className="text-xs text-slate-500 mb-2">{data.description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400">Current:</span>
        <span className="font-medium text-slate-900 dark:text-white">{data.value}%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400">Recommended:</span>
        <span className="font-medium text-slate-500">{data.recommended}%</span>
      </div>
    </div>
  );
}

export function BloomsTaxonomyChart({ analysis }: BloomsTaxonomyChartProps) {
  const distribution = analysis.bloomsDistribution;

  const chartData = useMemo(() => {
    return BLOOMS_LEVELS.map((level) => ({
      name: level.label,
      value: distribution[level.key],
      recommended: RECOMMENDED_DISTRIBUTION[level.key],
      color: level.color,
      description: level.description,
    }));
  }, [distribution]);

  const higherOrderRatio = useMemo(() => {
    const higher = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    return total > 0 ? Math.round((higher / total) * 100) : 0;
  }, [distribution]);

  // Per-chapter Bloom's mini bars
  const chapterBloomsData = useMemo(() => {
    return analysis.chapterAnalysis.map((ch) => ({
      name: `Ch ${ch.position}`,
      title: ch.chapterTitle,
      level: ch.primaryBloomsLevel,
      color: BLOOMS_LEVELS.find((l) => l.key === ch.primaryBloomsLevel)?.color || '#94a3b8',
    }));
  }, [analysis.chapterAnalysis]);

  return (
    <div className="space-y-6">
      {/* Main Distribution Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Bloom&apos;s Taxonomy Distribution
          </h3>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                analysis.bloomsBalance === 'well-balanced'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              )}
            >
              {analysis.bloomsBalance === 'well-balanced'
                ? 'Well Balanced'
                : analysis.bloomsBalance === 'bottom-heavy'
                  ? 'Bottom Heavy'
                  : 'Top Heavy'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {higherOrderRatio}% higher-order
            </Badge>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="recommended" radius={[4, 4, 0, 0]} maxBarSize={50} fillOpacity={0.15}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-violet-500" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-violet-500 opacity-15" />
            <span>Recommended</span>
          </div>
        </div>
      </Card>

      {/* Per-chapter Primary Bloom's Level */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          Primary Cognitive Level per Chapter
        </h3>
        <div className="space-y-2">
          {chapterBloomsData.map((ch, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-slate-500 w-10 flex-shrink-0">{ch.name}</span>
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-6 rounded-md flex items-center px-2"
                  style={{
                    backgroundColor: ch.color + '20',
                    borderLeft: `3px solid ${ch.color}`,
                    minWidth: '80px',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: ch.color }}>
                    {ch.level}
                  </span>
                </div>
                <span className="text-xs text-slate-500 truncate">{ch.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Insight Card */}
      <Card className="p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {analysis.bloomsBalance === 'well-balanced'
              ? 'Your course has a good balance between lower-order (Remember, Understand, Apply) and higher-order thinking (Analyze, Evaluate, Create). This supports effective learning progression.'
              : analysis.bloomsBalance === 'bottom-heavy'
                ? 'Your course focuses heavily on lower-order thinking skills. Consider adding more analytical, evaluative, and creative activities to challenge learners and deepen understanding.'
                : 'Your course has many higher-order activities. Ensure foundational concepts are well-established first before asking learners to analyze, evaluate, or create.'}
          </p>
        </div>
      </Card>
    </div>
  );
}
