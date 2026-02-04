'use client';

import { useState, useCallback } from 'react';
import { RoadmapCreationWizard } from './RoadmapCreationWizard';
import { JourneyDashboard } from './JourneyDashboard';
import { useRoadmapList } from '@/hooks/use-skill-roadmap-journey';

interface SkillRoadmapJourneyProps {
  userId: string;
}

/**
 * Main orchestrator for the Skill Roadmap Journey feature.
 * Shows wizard when no roadmaps exist, otherwise shows the journey dashboard.
 * userId is accepted for future use (e.g., fetching user preferences).
 */
export function SkillRoadmapJourney({ userId }: SkillRoadmapJourneyProps) {
  const { roadmaps, isLoading, refetch } = useRoadmapList();
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Auto-select first roadmap once loaded
  const effectiveId = activeRoadmapId ?? roadmaps[0]?.id ?? null;
  const hasRoadmaps = roadmaps.length > 0 && !showWizard;

  const handleRoadmapCreated = useCallback((roadmapId: string) => {
    setActiveRoadmapId(roadmapId);
    setShowWizard(false);
    refetch();
  }, [refetch]);

  const handleCreateNew = useCallback(() => {
    setShowWizard(true);
  }, []);

  const handleSwitchRoadmap = useCallback((id: string) => {
    setActiveRoadmapId(id);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  // No roadmaps → show wizard
  if (!hasRoadmaps || !effectiveId) {
    return (
      <div className="pt-4">
        <RoadmapCreationWizard onRoadmapCreated={handleRoadmapCreated} />
      </div>
    );
  }

  // Has roadmaps → show journey dashboard
  // Log userId for future analytics integration
  if (typeof window !== 'undefined' && userId) {
    // userId available for future preference loading
  }

  return (
    <div className="pt-4">
      <JourneyDashboard
        roadmaps={roadmaps}
        activeRoadmapId={effectiveId}
        onSwitchRoadmap={handleSwitchRoadmap}
        onCreateNew={handleCreateNew}
        onRoadmapUpdated={refetch}
      />
    </div>
  );
}
