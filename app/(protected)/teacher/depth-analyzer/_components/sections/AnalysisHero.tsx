'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  GitBranch,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  XCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  PolarAngleAxis,
} from 'recharts';
import type { DepthAnalysisV2Result } from '../types';

interface AnalysisHeroProps {
  analysis: DepthAnalysisV2Result;
}

function getGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

function getGradeColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

interface ScoreGaugeProps {
  label: string;
  score: number;
  icon: React.ElementType;
  color: string;
  fillColor: string;
}

function ScoreGauge({ label, score, icon: Icon, color, fillColor }: ScoreGaugeProps) {
  const data = [{ value: score, fill: fillColor }];

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            barSize={8}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              background={{ fill: 'hsl(var(--muted))' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={cn('h-4 w-4 mb-0.5', color)} />
          <span className={cn('text-xl font-bold', color)}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">{label}</span>
    </motion.div>
  );
}

function IssueCountSummary({ issueCount }: { issueCount: DepthAnalysisV2Result['issueCount'] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {issueCount.critical > 0 && (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          {issueCount.critical} Critical
        </Badge>
      )}
      {issueCount.high > 0 && (
        <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          <AlertTriangle className="h-3 w-3" />
          {issueCount.high} High
        </Badge>
      )}
      {issueCount.medium > 0 && (
        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {issueCount.medium} Medium
        </Badge>
      )}
      {issueCount.low > 0 && (
        <Badge variant="secondary" className="gap-1">
          {issueCount.low} Low
        </Badge>
      )}
      {issueCount.total === 0 && (
        <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          No issues found
        </Badge>
      )}
    </div>
  );
}

export function AnalysisHero({ analysis }: AnalysisHeroProps) {
  const grade = getGrade(analysis.overallScore);
  const gradeColor = getGradeColor(analysis.overallScore);

  const comparison = analysis.comparison;
  const hasComparison = comparison && (comparison.scoreImprovement !== 0 || comparison.issuesResolved > 0 || comparison.newIssues > 0);

  return (
    <Card className="p-6 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-violet-200/50 dark:border-violet-800/50">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Overall Score + Grade */}
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl blur-xl opacity-30" />
            <div className="relative w-20 h-20 flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl text-white">
              <div className="text-center">
                <div className="text-3xl font-bold">{analysis.overallScore}</div>
                <div className="text-[10px] opacity-80">SCORE</div>
              </div>
            </div>
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-3xl font-black', gradeColor)}>{grade}</span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
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
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Version {analysis.version} &bull; {analysis.analysisMethod === 'ai' ? 'AI Analysis' : 'Rule-based'}
            </p>
          </div>
        </div>

        {/* 4 Score Gauges */}
        <div className="flex-1 flex items-center justify-center lg:justify-end gap-4 sm:gap-6 flex-wrap">
          <ScoreGauge
            label="Quality"
            score={analysis.qualityScore}
            icon={Sparkles}
            color="text-blue-600 dark:text-blue-400"
            fillColor="hsl(217, 91%, 60%)"
          />
          <ScoreGauge
            label="Depth"
            score={analysis.depthScore}
            icon={Brain}
            color="text-violet-600 dark:text-violet-400"
            fillColor="hsl(263, 70%, 58%)"
          />
          <ScoreGauge
            label="Flow"
            score={analysis.flowScore}
            icon={GitBranch}
            color="text-emerald-600 dark:text-emerald-400"
            fillColor="hsl(160, 84%, 39%)"
          />
          <ScoreGauge
            label="Consistency"
            score={analysis.consistencyScore}
            icon={Layers}
            color="text-amber-600 dark:text-amber-400"
            fillColor="hsl(38, 92%, 50%)"
          />
        </div>
      </div>

      {/* Issue Count + Comparison */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <IssueCountSummary issueCount={analysis.issueCount} />

        {hasComparison && comparison && (
          <div className="flex items-center gap-2 text-sm">
            {comparison.scoreImprovement > 0 ? (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">+{comparison.scoreImprovement} pts</span>
              </div>
            ) : comparison.scoreImprovement < 0 ? (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
                <span className="font-medium">{comparison.scoreImprovement} pts</span>
              </div>
            ) : null}
            {comparison.issuesResolved > 0 && (
              <span className="text-xs text-slate-500">
                {comparison.issuesResolved} resolved, {comparison.newIssues} new
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
