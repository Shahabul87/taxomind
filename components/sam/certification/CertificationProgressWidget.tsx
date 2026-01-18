'use client';

/**
 * CertificationProgressWidget Component
 *
 * Compact widget for displaying certification progress overview.
 * Ideal for dashboards and sidebars.
 *
 * Features:
 * - Active certification progress tracking
 * - Quick stats summary
 * - Upcoming milestones
 * - Easy navigation to full tracker
 *
 * @module components/sam/certification
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Award,
  Clock,
  Target,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  RefreshCw,
  Loader2,
  AlertCircle,
  Calendar,
  TrendingUp,
  Sparkles,
  Plus,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface CertificationProgress {
  certificationId: string;
  certificationName: string;
  provider: string;
  status: string;
  studyProgress: number;
  studyHoursLogged: number;
  practiceExamScores: number[];
  targetDate?: string | Date;
  nextMilestone?: { title: string; dueDate: string | Date };
}

interface CertificationSummary {
  totalCompleted: number;
  inProgressCount: number;
  recommendationCount: number;
  avgReadinessScore: number;
  suggestedCategory: string;
}

interface CertificationProgressWidgetProps {
  className?: string;
  onViewAll?: () => void;
  onStartNew?: () => void;
  compact?: boolean;
  maxItems?: number;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Mini certification progress card
 */
function MiniProgressCard({ cert }: { cert: CertificationProgress }) {
  const avgScore =
    cert.practiceExamScores.length > 0
      ? Math.round(
          cert.practiceExamScores.reduce((a, b) => a + b, 0) / cert.practiceExamScores.length
        )
      : null;

  const daysUntilTarget = cert.targetDate
    ? Math.ceil((new Date(cert.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-3 rounded-xl border bg-card hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <Award className="w-4 h-4 text-yellow-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{cert.certificationName}</h4>
            <Badge variant="outline" className="text-xs shrink-0">
              {cert.studyProgress}%
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mb-2">{cert.provider}</p>

          {/* Progress bar */}
          <Progress value={cert.studyProgress} className="h-1.5 mb-2" />

          {/* Quick stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{cert.studyHoursLogged}h</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Study hours logged</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {avgScore !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      <span>{avgScore}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Average practice exam score</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {daysUntilTarget !== null && daysUntilTarget > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        daysUntilTarget <= 7 ? 'text-yellow-600' : ''
                      )}
                    >
                      <Target className="w-3 h-3" />
                      <span>{daysUntilTarget}d</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Days until target date</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stats summary row
 */
function StatsSummary({ summary }: { summary: CertificationSummary }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg bg-green-500/10 text-center">
              <CheckCircle2 className="w-4 h-4 mx-auto mb-0.5 text-green-600" />
              <div className="text-lg font-bold text-green-600">{summary.totalCompleted}</div>
              <div className="text-[10px] text-muted-foreground">Done</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Completed certifications</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg bg-blue-500/10 text-center">
              <CircleDot className="w-4 h-4 mx-auto mb-0.5 text-blue-600" />
              <div className="text-lg font-bold text-blue-600">{summary.inProgressCount}</div>
              <div className="text-[10px] text-muted-foreground">Active</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Certifications in progress</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg bg-purple-500/10 text-center">
              <Sparkles className="w-4 h-4 mx-auto mb-0.5 text-purple-600" />
              <div className="text-lg font-bold text-purple-600">{summary.recommendationCount}</div>
              <div className="text-[10px] text-muted-foreground">Reco</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Recommended certifications</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-0.5 text-yellow-600" />
              <div className="text-lg font-bold text-yellow-600">{summary.avgReadinessScore}%</div>
              <div className="text-[10px] text-muted-foreground">Ready</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Average readiness score</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CertificationProgressWidget({
  className,
  onViewAll,
  onStartNew,
  compact = false,
  maxItems = 3,
}: CertificationProgressWidgetProps) {
  const [summary, setSummary] = useState<CertificationSummary | null>(null);
  const [inProgress, setInProgress] = useState<CertificationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sam/certification-pathways?includeInProgress=true&limit=${maxItems}`);

      if (!res.ok) {
        throw new Error('Failed to fetch certification data');
      }

      const data = await res.json();

      if (data.success) {
        setSummary(data.data.summary);
        setInProgress(data.data.inProgress || []);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch certifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certifications');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [maxItems]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={cn('pb-2', compact && 'pt-3 px-3')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-500/10">
              <Award className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-sm">Certifications</CardTitle>
              {!compact && (
                <CardDescription className="text-xs">Track your progress</CardDescription>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchData}>
              <RefreshCw className="w-3 h-3" />
            </Button>
            {onViewAll && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onViewAll}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('space-y-3', compact && 'pb-3 px-3')}>
        {/* Stats summary */}
        {summary && <StatsSummary summary={summary} />}

        {/* In progress certifications */}
        {inProgress.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-muted-foreground">Active</h4>
              {inProgress.length > maxItems && (
                <Badge variant="secondary" className="text-[10px]">
                  +{inProgress.length - maxItems} more
                </Badge>
              )}
            </div>
            {inProgress.slice(0, maxItems).map((cert) => (
              <MiniProgressCard key={cert.certificationId} cert={cert} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 px-3 rounded-lg bg-muted/30">
            <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-2">No active certifications</p>
            {onStartNew && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onStartNew}>
                <Plus className="w-3 h-3 mr-1" />
                Start One
              </Button>
            )}
          </div>
        )}

        {/* View all link */}
        {onViewAll && inProgress.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={onViewAll}
          >
            View All Certifications
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default CertificationProgressWidget;
