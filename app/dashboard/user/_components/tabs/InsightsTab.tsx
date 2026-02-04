'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';

// Personalization & Behavior
import { PersonalizationControlPanel } from '@/components/sam/personalization/PersonalizationControlPanel';
import { BehaviorPatternsWidget } from '@/components/sam/behavior/BehaviorPatternsWidget';
import { MemorySearchPanel } from '@/components/sam/memory/MemorySearchPanel';

// Predictive & Learning Insights
import { MetaLearningInsightsWidget } from '@/components/sam/MetaLearningInsightsWidget';
import { PredictiveInsights } from '@/components/sam/PredictiveInsights';
import { PredictiveAnalyticsEnhanced } from '../smart-dashboard/PredictiveAnalyticsEnhanced';

// Safety & Accessibility
import { BiasDetectionReport } from '@/components/sam/BiasDetectionReport';
import { AccessibilityMetricsWidget } from '@/components/sam/AccessibilityMetricsWidget';
import { DiscouragingLanguageAlert } from '@/components/sam/DiscouragingLanguageAlert';

interface InsightsTabProps {
  userId?: string;
}

export function InsightsTab({ userId }: InsightsTabProps) {
  // Build a minimal user object for components that require it
  const user = userId ? { id: userId } as import('next-auth').User : undefined;

  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/30 dark:from-slate-900 dark:via-teal-900/10 dark:to-emerald-900/10">
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Personalization Control Panel */}
        <div className="mb-6 sm:mb-8">
          <PersonalizationControlPanel />
        </div>

        {/* Behavior Patterns & Memory Search */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <BehaviorPatternsWidget />
          <MemorySearchPanel />
        </div>

        {/* Learning Insights */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <MetaLearningInsightsWidget />
          <PredictiveInsights />
        </div>

        {/* Predictive Analytics Enhanced */}
        {user && (
          <div className="mb-6 sm:mb-8">
            <PredictiveAnalyticsEnhanced user={user} />
          </div>
        )}

        {/* Safety & Accessibility */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <BiasDetectionReport />
          <AccessibilityMetricsWidget />
          <DiscouragingLanguageAlert />
        </div>
      </div>
    </div>
  );
}
