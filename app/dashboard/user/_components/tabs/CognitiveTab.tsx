'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { FeatureGate } from '@/lib/dashboard/FeatureGate';
import { CognitiveProfileDashboard } from '@/components/learner/cognitive-profile-dashboard';
import { CognitiveAnalysisHub } from '@/components/sam/cognitive-analysis-hub/CognitiveAnalysisHub';
import { MetacognitionPanel } from '@/components/sam/MetacognitionPanel';
import { CognitiveLoadMonitor } from '@/components/sam/CognitiveLoadMonitor';

interface CognitiveTabProps {
  userId: string;
}

export function CognitiveTab({ userId }: CognitiveTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-pink-900/10">
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Cognitive Profile Dashboard — always visible */}
        <CognitiveProfileDashboard userId={userId} />

        {/* Cognitive Analysis Hub — full cognitive intelligence suite */}
        <FeatureGate feature="COGNITIVE_ANALYSIS_HUB">
          <div className="mt-6 sm:mt-8">
            <CognitiveAnalysisHub userId={userId} />
          </div>
        </FeatureGate>

        {/* Metacognition Panel — self-reflection & study habit analysis */}
        <FeatureGate feature="METACOGNITION_PANEL">
          <div className="mt-6 sm:mt-8">
            <MetacognitionPanel />
          </div>
        </FeatureGate>

        {/* Cognitive Load Monitor — real-time load tracking */}
        <FeatureGate feature="COGNITIVE_ANALYSIS_HUB">
          <div className="mt-6 sm:mt-8">
            <CognitiveLoadMonitor sessionId="" />
          </div>
        </FeatureGate>
      </div>
    </div>
  );
}
