'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { JourneyHeader } from './JourneyHeader';
import { RoadmapSwitcher } from './RoadmapSwitcher';
import { VisualRoadmapTimeline } from './VisualRoadmapTimeline';
import { ActiveMilestonePanel } from './ActiveMilestonePanel';
import {
  useRoadmapDetail,
  useMilestoneUpdate,
  type RoadmapSummary,
} from '@/hooks/use-skill-roadmap-journey';

interface JourneyDashboardProps {
  roadmaps: RoadmapSummary[];
  activeRoadmapId: string;
  onSwitchRoadmap: (id: string) => void;
  onCreateNew: () => void;
  onRoadmapUpdated: () => void;
}

export function JourneyDashboard({
  roadmaps,
  activeRoadmapId,
  onSwitchRoadmap,
  onCreateNew,
  onRoadmapUpdated,
}: JourneyDashboardProps) {
  const { roadmap, isLoading, error, refetch } = useRoadmapDetail(activeRoadmapId);
  const { updateMilestone, isUpdating } = useMilestoneUpdate();

  const handleStartMilestone = useCallback(async (milestoneId: string) => {
    try {
      await updateMilestone(activeRoadmapId, milestoneId, 'IN_PROGRESS');
      toast.success('Phase started!');
      refetch();
      onRoadmapUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start phase');
    }
  }, [activeRoadmapId, updateMilestone, refetch, onRoadmapUpdated]);

  const handleCompleteMilestone = useCallback(async (milestoneId: string) => {
    try {
      await updateMilestone(activeRoadmapId, milestoneId, 'COMPLETED');
      toast.success('Phase completed! Great work!');
      refetch();
      onRoadmapUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete phase');
    }
  }, [activeRoadmapId, updateMilestone, refetch, onRoadmapUpdated]);

  const handleSkipMilestone = useCallback(async (milestoneId: string) => {
    try {
      await updateMilestone(activeRoadmapId, milestoneId, 'SKIPPED');
      toast.info('Phase skipped');
      refetch();
      onRoadmapUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to skip phase');
    }
  }, [activeRoadmapId, updateMilestone, refetch, onRoadmapUpdated]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-64 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Failed to load roadmap
        </h3>
        <p className="text-sm text-slate-500 mb-4">Something went wrong. Please try again.</p>
        <Button variant="outline" onClick={refetch} className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const currentLevel = roadmap.targetOutcome?.currentLevel ?? 'NOVICE';
  const targetLevelStr = roadmap.targetOutcome?.targetLevel ?? 'PROFICIENT';
  const hasPhases = roadmap.milestones.length > 0;

  return (
    <div className="space-y-5">
      {/* Top Bar: Roadmap Switcher */}
      <div className="flex items-center justify-between gap-4">
        <RoadmapSwitcher
          roadmaps={roadmaps}
          activeId={activeRoadmapId}
          onSelect={onSwitchRoadmap}
          onCreateNew={onCreateNew}
        />

        {/* Only show separate New button if switcher doesn't handle it (single roadmap) */}
        {roadmaps.length <= 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNew}
            className="h-10 px-4 rounded-xl text-xs font-semibold border-2 border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-400 flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Roadmap
          </Button>
        )}
      </div>

      {/* Journey Header */}
      <JourneyHeader roadmap={roadmap} />

      {/* Main Content */}
      {hasPhases ? (
        <>
          {/* Visual Roadmap Timeline */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
            {isUpdating && (
              <div className="mb-4 p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-center border border-violet-200/50 dark:border-violet-800/50">
                <span className="text-xs text-violet-600 dark:text-violet-400 font-medium animate-pulse">
                  Updating roadmap...
                </span>
              </div>
            )}

            <VisualRoadmapTimeline
              milestones={roadmap.milestones}
              matchedCourses={roadmap.matchedCourses}
              currentLevel={currentLevel}
              targetLevel={targetLevelStr}
              onStartMilestone={handleStartMilestone}
              onCompleteMilestone={handleCompleteMilestone}
              onSkipMilestone={handleSkipMilestone}
            />
          </div>

          {/* Active Milestone Detail Panel */}
          {(() => {
            const activeMilestone = roadmap.milestones.find(m => m.status === 'IN_PROGRESS');
            if (!activeMilestone) return null;
            return (
              <ActiveMilestonePanel
                milestone={activeMilestone}
                matchedCourses={roadmap.matchedCourses}
                onComplete={() => handleCompleteMilestone(activeMilestone.id)}
                isUpdating={isUpdating}
              />
            );
          })()}
        </>
      ) : (
        /* Empty Roadmap State */
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/10" />
          <div className="relative px-6 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-violet-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
              This roadmap needs learning phases
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              This roadmap was created without AI-generated content. Create a new roadmap using the
              AI wizard to get a personalized learning path with courses, projects, and milestones.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={onCreateNew}
                className="h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-purple-500/20"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create AI Roadmap
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
