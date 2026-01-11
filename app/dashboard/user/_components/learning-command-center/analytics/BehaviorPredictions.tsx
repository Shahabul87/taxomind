'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Sparkles,
  Target,
  Clock,
  Brain,
  Loader2,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  useSAMLearningHealth,
  useSAMInterventions,
  type SAMIntervention,
} from '@/hooks/use-sam-agentic-analytics';

export interface BehaviorPredictionsProps {
  compact?: boolean;
  onViewDetails?: () => void;
  onIntervention?: (intervention: SAMIntervention) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function RiskGauge({
  probability,
  label,
  inverted = false,
}: {
  probability: number;
  label: string;
  inverted?: boolean;
}) {
  // For inverted, high probability is good (e.g., success probability)
  const displayValue = Math.round(probability * 100);
  const normalizedValue = inverted ? 100 - displayValue : displayValue;

  const getColor = () => {
    if (normalizedValue <= 20) return 'text-emerald-500';
    if (normalizedValue <= 40) return 'text-blue-500';
    if (normalizedValue <= 60) return 'text-amber-500';
    if (normalizedValue <= 80) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (normalizedValue <= 20) return 'Low';
    if (normalizedValue <= 40) return 'Moderate';
    if (normalizedValue <= 60) return 'Elevated';
    if (normalizedValue <= 80) return 'High';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90 transform">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 28 * (1 - probability),
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeDasharray={`${2 * Math.PI * 28}`}
            className={getColor()}
            strokeLinecap="round"
          />
        </svg>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center text-lg font-bold',
            getColor()
          )}
        >
          {displayValue}%
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <Badge
        variant="outline"
        className={cn(
          'mt-1 text-xs',
          normalizedValue <= 20 && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          normalizedValue > 20 && normalizedValue <= 40 && 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          normalizedValue > 40 && normalizedValue <= 60 && 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          normalizedValue > 60 && normalizedValue <= 80 && 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
          normalizedValue > 80 && 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        )}
      >
        {getStatusText()}
      </Badge>
    </div>
  );
}

function HealthIndicator({
  status,
  score,
}: {
  status: 'excellent' | 'good' | 'needs_attention' | 'at_risk';
  score: number;
}) {
  const config = {
    excellent: {
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: CheckCircle,
      label: 'Excellent',
    },
    good: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: TrendingUp,
      label: 'Good',
    },
    needs_attention: {
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      icon: AlertTriangle,
      label: 'Needs Attention',
    },
    at_risk: {
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      icon: XCircle,
      label: 'At Risk',
    },
  };

  const { color, bgColor, icon: Icon, label } = config[status];

  return (
    <div className={cn('flex items-center gap-3 rounded-xl p-4', bgColor)}>
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', bgColor)}>
        <Icon className={cn('h-6 w-6', color)} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">Learning Health</p>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-bold', color)}>{score}</span>
          <span className={cn('text-sm font-medium', color)}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function RiskFactorItem({
  factor,
  impact,
}: {
  factor: string;
  impact: 'high' | 'medium' | 'low';
}) {
  const impactColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
      <span className="text-sm text-slate-700 dark:text-slate-300">{factor}</span>
      <Badge variant="secondary" className={cn('text-xs', impactColors[impact])}>
        {impact}
      </Badge>
    </div>
  );
}

function InterventionCard({
  intervention,
  onAction,
}: {
  intervention: SAMIntervention;
  onAction?: (intervention: SAMIntervention) => void;
}) {
  const priorityColors = {
    critical: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20',
    high: 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/20',
    medium: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20',
    low: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20',
  };

  const typeIcons: Record<string, typeof Activity> = {
    encouragement: Sparkles,
    strategy_change: Brain,
    break_suggestion: Clock,
    resource_recommendation: Target,
    goal_adjustment: TrendingUp,
  };

  const Icon = typeIcons[intervention.type] ?? Activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-3',
        priorityColors[intervention.priority]
      )}
    >
      <div className="flex gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-800/80">
          <Icon className="h-4 w-4 text-purple-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {intervention.message}
          </p>
          {intervention.suggestedActions.length > 0 && (
            <div className="mt-2 space-y-1">
              {intervention.suggestedActions.slice(0, 2).map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  <ChevronRight className="h-3 w-3" />
                  <span>{action.title}</span>
                </div>
              ))}
            </div>
          )}
          {onAction && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 px-2 text-xs text-purple-600 hover:text-purple-700"
              onClick={() => onAction(intervention)}
            >
              Take Action
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex items-center justify-center', compact ? 'p-6' : 'p-12')}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Analyzing learning behavior...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex flex-col items-center justify-center text-center', compact ? 'p-6' : 'p-12')}>
        <Activity className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-semibold text-slate-900 dark:text-white">No Predictions Yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Continue learning to get personalized behavior predictions from SAM.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BehaviorPredictions({
  compact = false,
  onViewDetails,
  onIntervention,
}: BehaviorPredictionsProps) {
  const { healthStatus, learningScore, churnRisk, struggleRisk, loading: healthLoading } = useSAMLearningHealth();
  const { interventions, loading: interventionsLoading } = useSAMInterventions();

  const isLoading = healthLoading || interventionsLoading;

  if (isLoading) {
    return <LoadingState compact={compact} />;
  }

  // Show empty state if no meaningful data
  if (learningScore === 0 && churnRisk === 0 && struggleRisk === 0) {
    return <EmptyState compact={compact} />;
  }

  // Calculate risk factors based on the data
  const riskFactors: Array<{ factor: string; impact: 'high' | 'medium' | 'low' }> = [];

  if (struggleRisk > 0.6) {
    riskFactors.push({ factor: 'High struggle probability detected', impact: 'high' });
  }
  if (churnRisk > 0.5) {
    riskFactors.push({ factor: 'Decreased engagement trend', impact: 'high' });
  }
  if (learningScore < 50) {
    riskFactors.push({ factor: 'Learning score below target', impact: 'medium' });
  }
  if (struggleRisk > 0.3 && struggleRisk <= 0.6) {
    riskFactors.push({ factor: 'Moderate difficulty with content', impact: 'medium' });
  }
  if (churnRisk > 0.2 && churnRisk <= 0.5) {
    riskFactors.push({ factor: 'Engagement could improve', impact: 'low' });
  }

  // Get pending interventions
  const pendingInterventions = interventions.filter(i => i.status === 'pending');

  // Compact view for overview grid
  if (compact) {
    return (
      <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-indigo-500" />
              Learning Health Monitor
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                healthStatus === 'excellent' && 'bg-emerald-50 text-emerald-700',
                healthStatus === 'good' && 'bg-blue-50 text-blue-700',
                healthStatus === 'needs_attention' && 'bg-amber-50 text-amber-700',
                healthStatus === 'at_risk' && 'bg-red-50 text-red-700'
              )}
            >
              {healthStatus === 'excellent' ? 'Excellent' :
               healthStatus === 'good' ? 'Good' :
               healthStatus === 'needs_attention' ? 'Needs attention' : 'At risk'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Risk Overview */}
          <div className="flex items-center justify-around rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/30 dark:to-purple-950/30">
            <RiskGauge probability={churnRisk} label="Churn Risk" />
            <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
            <RiskGauge probability={struggleRisk} label="Struggle Risk" />
          </div>

          {/* Top Risk Factor or Intervention */}
          {riskFactors.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Top Concern</p>
              <RiskFactorItem factor={riskFactors[0].factor} impact={riskFactors[0].impact} />
            </div>
          ) : pendingInterventions.length > 0 ? (
            <InterventionCard
              intervention={pendingInterventions[0]}
              onAction={onIntervention}
            />
          ) : (
            <div className="text-center py-2">
              <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">All systems healthy</p>
            </div>
          )}

          {/* View Details Button */}
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onViewDetails}
            >
              View Full Analysis
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-indigo-500" />
            Learning Health Monitor
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              healthStatus === 'excellent' && 'bg-emerald-50 text-emerald-700',
              healthStatus === 'good' && 'bg-blue-50 text-blue-700',
              healthStatus === 'needs_attention' && 'bg-amber-50 text-amber-700',
              healthStatus === 'at_risk' && 'bg-red-50 text-red-700'
            )}
          >
            {healthStatus === 'excellent' ? 'Excellent' :
             healthStatus === 'good' ? 'Good' :
             healthStatus === 'needs_attention' ? 'Needs attention' : 'At risk'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Health Indicator */}
        <HealthIndicator status={healthStatus} score={learningScore} />

        {/* Risk Predictions */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <TrendingDown className="h-4 w-4 text-amber-500" />
            Risk Predictions
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Churn Risk */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <RiskGauge probability={churnRisk} label="Churn Risk" />
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Engagement level</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {churnRisk < 0.3 ? 'High' : churnRisk < 0.6 ? 'Medium' : 'Low'}
                  </span>
                </div>
                <Progress value={(1 - churnRisk) * 100} className="h-1.5" />
              </div>
            </div>

            {/* Struggle Risk */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <RiskGauge probability={struggleRisk} label="Struggle Risk" />
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Content difficulty</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {struggleRisk < 0.3 ? 'Manageable' : struggleRisk < 0.6 ? 'Challenging' : 'Difficult'}
                  </span>
                </div>
                <Progress value={(1 - struggleRisk) * 100} className="h-1.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {riskFactors.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Risk Factors ({riskFactors.length})
            </h4>
            <div className="space-y-2">
              {riskFactors.map((factor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <RiskFactorItem factor={factor.factor} impact={factor.impact} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Interventions */}
        {pendingInterventions.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Recommended Actions ({pendingInterventions.length})
            </h4>
            <div className="space-y-2">
              {pendingInterventions.slice(0, 3).map((intervention, idx) => (
                <motion.div
                  key={intervention.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <InterventionCard
                    intervention={intervention}
                    onAction={onIntervention}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Clear State */}
        {riskFactors.length === 0 && pendingInterventions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/30 dark:to-teal-950/30"
          >
            <Shield className="h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">
              All Systems Healthy
            </h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-500 text-center mt-1">
              Your learning journey is on track. Keep up the great work!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
