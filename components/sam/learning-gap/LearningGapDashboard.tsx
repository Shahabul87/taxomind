'use client';

/**
 * LearningGapDashboard Component
 *
 * Main container component for the Learning Gap Analysis dashboard.
 * Orchestrates all gap-related widgets and data fetching.
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  ExternalLink,
  BookOpen,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useLearningGaps } from './use-learning-gaps';
import { GapOverviewWidget } from './GapOverviewWidget';
import { SkillDecayTracker } from './SkillDecayTracker';
import { TrendAnalysisChart } from './TrendAnalysisChart';
import { PersonalizedRecommendations } from './PersonalizedRecommendations';
import { ComparisonView } from './ComparisonView';
import type { LearningGapDashboardProps, LearningGapData, GapRecommendation } from './types';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LearningGapDashboard({ className }: LearningGapDashboardProps) {
  const router = useRouter();
  const { data, isLoading, error, refresh } = useLearningGaps({
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // State for gap detail modal
  const [selectedGap, setSelectedGap] = useState<LearningGapData | null>(null);
  const [isGapModalOpen, setIsGapModalOpen] = useState(false);

  // Loading state
  if (isLoading && !data) {
    return (
      <div className={cn('flex min-h-[400px] items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Analyzing your learning gaps...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex min-h-[400px] items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className={cn('flex min-h-[400px] items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="rounded-full bg-primary/10 p-4">
            <AlertTriangle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold">No Learning Data Yet</h3>
          <p className="text-sm text-muted-foreground">
            Complete some learning activities to start tracking your progress
            and identifying knowledge gaps.
          </p>
        </div>
      </div>
    );
  }

  // Handle gap click - opens detail modal
  const handleGapClick = (gap: { id: string; skillName: string }) => {
    const fullGap = data.gaps.find((g) => g.id === gap.id);
    if (fullGap) {
      setSelectedGap(fullGap);
      setIsGapModalOpen(true);
    }
  };

  // Handle review click - navigate to practice page
  const handleReviewClick = (skillId: string) => {
    toast.info('Starting practice session...', {
      description: 'Redirecting to skill practice.',
    });
    // Navigate to the practice page with the skill pre-selected
    router.push(`/dashboard/user?view=practice&skillId=${skillId}`);
  };

  // Handle recommendation action - navigate to resource or start action
  const handleRecommendationClick = (recommendation: { id: string; title: string; resourceUrl?: string }) => {
    const fullRec = data.recommendations.find((r) => r.id === recommendation.id);

    if (fullRec?.resourceUrl) {
      // Open external resource in new tab
      window.open(fullRec.resourceUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opening resource', {
        description: recommendation.title,
      });
    } else if (fullRec?.type === 'practice') {
      // Navigate to practice
      router.push(`/dashboard/user?view=practice`);
      toast.info('Starting practice...', {
        description: recommendation.title,
      });
    } else if (fullRec?.type === 'review') {
      // Navigate to review
      toast.info('Starting review session...', {
        description: recommendation.title,
      });
      router.push(`/dashboard/user?view=learning`);
    } else {
      // Generic action
      toast.info('Recommendation selected', {
        description: recommendation.title,
      });
    }
  };

  // Handle starting a gap action from the modal
  const handleStartGapAction = (action: LearningGapData['suggestedActions'][0]) => {
    if (action.resourceUrl) {
      window.open(action.resourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.info('Starting action...', {
        description: action.title,
      });
      setIsGapModalOpen(false);
      router.push(`/dashboard/user?view=practice`);
    }
  };

  // Handle resolving a gap
  const handleResolveGap = async (gapId: string) => {
    try {
      const response = await fetch(`/api/sam/learning-gap/gaps/${gapId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: 'manual' }),
      });

      if (response.ok) {
        toast.success('Gap marked as resolved!');
        setIsGapModalOpen(false);
        refresh();
      } else {
        toast.error('Failed to resolve gap');
      }
    } catch {
      toast.error('Failed to resolve gap');
    }
  };

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Header - Responsive stacking on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Learning Gap Analysis
          </h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
            Identify and close knowledge gaps with AI-powered insights
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')}
          />
          Refresh
        </Button>
      </div>

      {/* Gap Overview - Full Width */}
      <GapOverviewWidget
        gaps={data.gaps}
        summary={data.summary}
        onGapClick={handleGapClick}
        className="w-full"
      />

      {/* Skill Decay & Recommendations Row - Stack on mobile/tablet */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <SkillDecayTracker
          decayData={data.decayData}
          onReviewClick={handleReviewClick}
        />
        <PersonalizedRecommendations
          recommendations={data.recommendations}
          onActionClick={handleRecommendationClick}
        />
      </div>

      {/* Trend Analysis - Full Width */}
      <TrendAnalysisChart trends={data.trends} className="w-full" />

      {/* Comparison View - Full Width */}
      <ComparisonView comparison={data.comparison} className="w-full" />

      {/* Last Updated */}
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>

      {/* Gap Detail Modal */}
      <Dialog open={isGapModalOpen} onOpenChange={setIsGapModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedGap && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className={cn(
                      'h-5 w-5',
                      selectedGap.severity === 'critical' && 'text-red-500',
                      selectedGap.severity === 'moderate' && 'text-yellow-500',
                      selectedGap.severity === 'minor' && 'text-blue-500'
                    )} />
                    {selectedGap.skillName}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      selectedGap.severity === 'critical' && 'border-red-500/30 text-red-600',
                      selectedGap.severity === 'moderate' && 'border-yellow-500/30 text-yellow-600',
                      selectedGap.severity === 'minor' && 'border-blue-500/30 text-blue-600'
                    )}
                  >
                    {selectedGap.severity}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedGap.topicName && `Topic: ${selectedGap.topicName}`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* Mastery Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Mastery</span>
                    <span className="font-medium">{selectedGap.masteryLevel}%</span>
                  </div>
                  <Progress value={selectedGap.masteryLevel} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>Target: {selectedGap.targetMasteryLevel}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Evidence */}
                {selectedGap.evidence.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Evidence</h4>
                    <div className="space-y-1">
                      {selectedGap.evidence.slice(0, 3).map((e, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
                          <span className="capitalize">{e.type}: {e.source}</span>
                          <span className="text-muted-foreground">
                            Score: {e.score}% (Expected: {e.expectedScore}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Actions */}
                {selectedGap.suggestedActions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Suggested Actions</h4>
                    <div className="space-y-2">
                      {selectedGap.suggestedActions.map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{action.title}</p>
                            {action.description && (
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{action.estimatedTime} min</span>
                              <span>•</span>
                              <span className="capitalize">{action.priority} priority</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartGapAction(action)}
                          >
                            {action.resourceUrl ? (
                              <>
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Open
                              </>
                            ) : (
                              <>
                                <Play className="mr-1 h-3 w-3" />
                                Start
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsGapModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => handleResolveGap(selectedGap.id)}
                  >
                    Mark as Resolved
                  </Button>
                </div>

                {/* Detected Date */}
                <p className="text-center text-xs text-muted-foreground">
                  Detected: {new Date(selectedGap.detectedAt).toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LearningGapDashboard;
