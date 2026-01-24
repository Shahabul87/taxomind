'use client';

import React from 'react';
import type { User as NextAuthUser } from 'next-auth';

// Learning Command Center - Main hub with quick stats
import { LearningCommandCenter } from '../../learning-command-center';

// Quick Actions
import { SAMQuickActionsSafe } from '@/components/sam/SAMQuickActionsSafe';

// Key Widgets for Dashboard Overview
import { SpacedRepetitionCalendar } from '@/components/sam/SpacedRepetitionCalendar';
import { RecommendationWidget } from '@/components/sam/recommendation-widget';
import { CheckInHistory } from '@/components/sam/CheckInHistory';
import { MicrolearningWidget } from '@/components/sam/MicrolearningWidget';
import { ContextualHelpWidget } from '@/components/sam/ContextualHelpWidget';

// SAM Context Tracker
import { SAMContextTracker } from '@/components/sam/SAMContextTracker';

interface DashboardSubTabProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
  };
  onCreateStudyPlan?: () => void;
}

export function DashboardSubTab({ user, onCreateStudyPlan }: DashboardSubTabProps) {
  return (
    <div className="space-y-6">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      {/* Learning Command Center - Main Learning Hub with stats */}
      <div className="-mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 -mt-6">
        <LearningCommandCenter user={user} onCreateStudyPlan={onCreateStudyPlan} />
      </div>

      {/* Quick Actions Bar */}
      <div className="pt-4">
        <SAMQuickActionsSafe />
      </div>

      {/* Primary Widgets Grid - Key daily items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Spaced Repetition Calendar - What to review today */}
        <div className="md:col-span-2 lg:col-span-2">
          <SpacedRepetitionCalendar />
        </div>

        {/* AI Recommendations - Personalized suggestions */}
        <div className="md:col-span-1 lg:col-span-1">
          <RecommendationWidget />
        </div>
      </div>

      {/* Secondary Widgets Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Microlearning Widget - Quick bite-sized lessons */}
        <MicrolearningWidget />

        {/* Recent Check-ins - Proactive System History */}
        <CheckInHistory limit={5} />

        {/* Contextual Help - Smart assistance */}
        <ContextualHelpWidget
          context="learning"
          showSearch={true}
          showShortcuts={true}
          maxItems={5}
          compact={true}
        />
      </div>
    </div>
  );
}

export default DashboardSubTab;
