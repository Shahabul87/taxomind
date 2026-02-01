'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import SkillBuildTrackerConnected from '@/components/dashboard/smart/skill-build-tracker-connected';
import { LearningPathOptimizer } from '@/components/sam/LearningPathOptimizer';
import { LearningPathTimeline } from '@/components/sam/LearningPathTimeline';
import { PrerequisiteTreeView } from '@/components/sam/PrerequisiteTreeView';
import { KnowledgeGraphBrowser } from '@/components/sam/KnowledgeGraphBrowser';
import { BiasDetectionReport } from '@/components/sam/BiasDetectionReport';
import {
  EnhancedKnowledgeGraphExplorer,
  LearningPathBuilder,
  PrerequisiteAnalyzer,
} from '@/components/sam/knowledge-graph';
import { ResearchAssistant } from '@/components/sam/ResearchAssistant';
import { IntegrityChecker } from '@/components/sam/IntegrityChecker';

interface SkillsTabProps {
  userId: string;
}

export function SkillsTab({ userId }: SkillsTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-slate-50 dark:bg-slate-900">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Main Skill Tracker */}
        <SkillBuildTrackerConnected />

        {/* ============================================================= */}
        {/* GAP-10: Enhanced Knowledge Graph - Full Width Feature */}
        {/* ============================================================= */}

        {/* Enhanced Knowledge Graph Explorer - Full interactive experience */}
        <div className="mt-4 sm:mt-6 md:mt-8">
          <EnhancedKnowledgeGraphExplorer
            height="700px"
            onConceptSelect={(conceptId) => console.log('Selected concept:', conceptId)}
            onStartLearning={(conceptIds) => console.log('Start learning:', conceptIds)}
          />
        </div>

        {/* Learning Path Builder & Prerequisite Analyzer - Side by Side */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Learning Path Builder - Interactive path generation */}
          <LearningPathBuilder
            courseId=""
            onConceptClick={(conceptId) => console.log('Concept clicked:', conceptId)}
            onStartLearning={(path) => console.log('Start path:', path)}
          />

          {/* Prerequisite Analyzer - Gap analysis visualization */}
          <PrerequisiteAnalyzer
            courseId=""
            onConceptClick={(conceptId) => console.log('Prerequisite clicked:', conceptId)}
          />
        </div>

        {/* SAM AI Engine Widgets Section */}
        <div className="mt-4 sm:mt-6 md:mt-8">
          {/* Knowledge Graph Browser - Basic view for quick reference */}
          <KnowledgeGraphBrowser />
          {/* NOTE: QualityScoreDashboard moved to Analytics tab */}
        </div>

        {/* Gap 1: Bias Detection Report - Fairness Analysis (Full Width) */}
        <div className="mt-6 sm:mt-8">
          <BiasDetectionReport className="w-full" />
        </div>

        {/* ============================================================= */}
        {/* GAP 3: Previously Orphaned Components Now Integrated */}
        {/* ============================================================= */}

        {/* Research & Academic Integrity Section */}
        <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* ResearchAssistant - Academic research and citation management */}
          <ResearchAssistant userId={userId} className="w-full" />

          {/* IntegrityChecker - Academic integrity verification */}
          <IntegrityChecker className="w-full" />
        </div>
      </div>
    </div>
  );
}
