'use client';

/**
 * SkillDecayTracker Component
 *
 * Displays skills at risk of decay with predictions and review actions.
 */

import React from 'react';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  RefreshCw,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { SkillDecayTrackerProps, SkillDecayData, DecayRiskLevel } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const RISK_CONFIG: Record<
  DecayRiskLevel,
  { color: string; bgColor: string; textColor: string; label: string }
> = {
  critical: {
    color: 'bg-red-500',
    bgColor: 'bg-red-500/10 border-red-500/30',
    textColor: 'text-red-600',
    label: 'Critical',
  },
  high: {
    color: 'bg-orange-500',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    textColor: 'text-orange-600',
    label: 'High',
  },
  medium: {
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    textColor: 'text-yellow-600',
    label: 'Medium',
  },
  low: {
    color: 'bg-green-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
    textColor: 'text-green-600',
    label: 'Low',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DecayCard({
  data,
  onReviewClick,
}: {
  data: SkillDecayData;
  onReviewClick?: () => void;
}) {
  const config = RISK_CONFIG[data.riskLevel];
  const showUrgent = data.riskLevel === 'critical' || data.riskLevel === 'high';

  // Format decay date
  const decayDate = new Date(data.predictedDecayDate);
  const daysUntilDecay = Math.max(
    0,
    Math.ceil((decayDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  );

  return (
    <div className={cn('rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-800', 
      data.riskLevel === 'critical' && 'border-red-300 dark:border-red-700',
      data.riskLevel === 'high' && 'border-orange-300 dark:border-orange-700',
      data.riskLevel === 'medium' && 'border-yellow-300 dark:border-yellow-700',
      data.riskLevel === 'low' && 'border-green-300 dark:border-green-700'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-semibold text-sm truncate text-slate-900 dark:text-white">{data.skillName}</span>
            <Badge
              variant="outline"
              className={cn('shrink-0 text-xs font-semibold border-2', config.textColor)}
            >
              {config.label} Risk
            </Badge>
          </div>

          {/* Mastery Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">Current Mastery</span>
              <span className={cn('font-bold', config.textColor)}>
                {Math.round(data.currentMastery)}%
              </span>
            </div>
            <Progress
              value={data.currentMastery}
              className="h-2 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5" />
              <span>{data.daysSinceLastPractice} days since practice</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>{data.decayRate.toFixed(1)}%/day decay</span>
            </div>
          </div>

          {/* Prediction Warning */}
          {daysUntilDecay > 0 && daysUntilDecay <= 14 && (
            <div
              className={cn(
                'mt-3 flex items-center gap-2 rounded-md p-2 text-xs',
                showUrgent ? 'bg-red-500/20' : 'bg-yellow-500/20'
              )}
            >
              {showUrgent ? (
                <AlertTriangle className="h-3 w-3 text-red-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-yellow-600" />
              )}
              <span>
                Mastery will drop below 60% in{' '}
                <strong>{daysUntilDecay} days</strong>
              </span>
            </div>
          )}

          {/* Review Deadline */}
          {data.reviewDeadline && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Review by{' '}
                {new Date(data.reviewDeadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          variant={showUrgent ? 'default' : 'outline'}
          className={cn('shrink-0', showUrgent && 'bg-red-600 hover:bg-red-700')}
          onClick={onReviewClick}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Review
        </Button>
      </div>

      {/* Prediction Timeline (collapsed) */}
      {data.predictions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Predicted Mastery</span>
            <span>Next 4 weeks</span>
          </div>
          <div className="flex items-center gap-1">
            {data.predictions.map((pred, i) => (
              <div key={i} className="flex-1 text-center">
                <div
                  className={cn(
                    'mb-1 h-2 rounded-full',
                    pred.predictedMastery >= 70
                      ? 'bg-green-500'
                      : pred.predictedMastery >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  )}
                  style={{ opacity: 0.3 + pred.confidence / 150 }}
                />
                <span className="text-xs font-medium">
                  {Math.round(pred.predictedMastery)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SkillDecayTracker({
  decayData,
  onReviewClick,
  className,
}: SkillDecayTrackerProps) {
  // Filter to show only medium risk and above
  const atRiskSkills = decayData.filter(
    (d) => d.riskLevel !== 'low'
  );

  // Summary counts
  const criticalCount = decayData.filter((d) => d.riskLevel === 'critical').length;
  const highCount = decayData.filter((d) => d.riskLevel === 'high').length;

  return (
    <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 dark:bg-orange-900/30 p-2.5">
              <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Skill Decay Tracker</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 font-medium">Skills at risk of knowledge decay</CardDescription>
            </div>
          </div>
          {(criticalCount > 0 || highCount > 0) && (
            <Badge variant="destructive" className="shrink-0 font-semibold border-2">
              {criticalCount + highCount} at risk
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Risk Summary */}
        {decayData.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {(['critical', 'high', 'medium', 'low'] as DecayRiskLevel[]).map((level) => {
              const count = decayData.filter((d) => d.riskLevel === level).length;
              const config = RISK_CONFIG[level];
              return (
                <div
                  key={level}
                  className="rounded-lg bg-muted/50 p-2 text-center"
                >
                  <div className={cn('mx-auto mb-1 h-2 w-2 rounded-full', config.color)} />
                  <span className="text-lg font-bold">{count}</span>
                  <p className="text-xs text-muted-foreground capitalize">{level}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Decay Cards */}
        {atRiskSkills.length > 0 ? (
          <div className="space-y-3">
            {atRiskSkills.slice(0, 5).map((data) => (
              <DecayCard
                key={data.skillId}
                data={data}
                onReviewClick={() => onReviewClick?.(data.skillId)}
              />
            ))}
            {atRiskSkills.length > 5 && (
              <Button variant="ghost" className="w-full" size="sm">
                View all {atRiskSkills.length} at-risk skills
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-green-500/10 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <RefreshCw className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-green-700">All Skills Healthy!</h4>
            <p className="text-sm text-muted-foreground">
              No skills are at risk of significant decay.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SkillDecayTracker;
