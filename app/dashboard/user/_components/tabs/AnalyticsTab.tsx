'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { LearningAnalyticsDashboard } from '../learning-command-center/analytics';
import { SelfAssessmentHub } from '@/components/sam/self-assessment-hub';
import { QualityScoreDashboard } from '@/components/sam/QualityScoreDashboard';
import { ConfidenceCalibrationWidget } from '@/components/sam/ConfidenceCalibrationWidget';

interface AnalyticsTabProps {
  userId: string;
}

export function AnalyticsTab({ userId }: AnalyticsTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-indigo-900/10 dark:to-purple-900/10">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Learning Analytics Dashboard - Full analytics experience */}
        <LearningAnalyticsDashboard
          defaultTab="overview"
          onExport={() => console.log('Export analytics')}
          onRefresh={() => console.log('Refresh analytics')}
        />

        {/* Self-Assessment Hub - Merged from assess tab */}
        <div className="mt-6 sm:mt-8">
          <SelfAssessmentHub userId={userId} />
        </div>

        {/* Quality & Calibration Metrics - Consolidated from Skills and Gamification tabs */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Quality Score Dashboard - Content quality metrics */}
          <QualityScoreDashboard />

          {/* Confidence Calibration - AI Quality Metrics */}
          <ConfidenceCalibrationWidget />
        </div>
      </div>
    </div>
  );
}
