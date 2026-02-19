'use client';

import React from 'react';
import type { User as NextAuthUser } from 'next-auth';

// Core SAM AI Components
import { SAMEnginePoweredChat } from '@/components/sam/sam-engine-powered-chat';

// Multimodal & Dialogue
import { MultimodalInputPanel } from '@/components/sam/multimodal';
import { SocraticDialogueWidget } from '@/components/sam/SocraticDialogueWidget';
import { AdaptiveContentWidget } from '@/components/sam/AdaptiveContentWidget';

// Research & Content
import { ResearchAssistant } from '@/components/sam/ResearchAssistant';
import { ContentAdaptiveHub } from '@/components/sam/content-adaptive-hub';

// Learning Tools
import { TutoringOrchestrationWidget } from '@/components/sam/TutoringOrchestrationWidget';
import { StudyGuideGenerator } from '@/components/sam/study-guide/StudyGuideGenerator';

// Innovation
import { InnovationLab } from '@/components/sam/InnovationLab';

interface AIToolsSubTabProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
  };
}

export function AIToolsSubTab({ user }: AIToolsSubTabProps) {
  return (
    <div className="space-y-6">
      {/* SAM AI Chat - Embedded AI interaction */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🤖</span> SAM AI Assistant
        </h2>
        <SAMEnginePoweredChat />
      </section>

      {/* Multimodal & Dialogue Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🎙️</span> Multimodal Learning
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Multimodal Input Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <MultimodalInputPanel
              onInputProcessed={(result) => console.log('Multimodal input:', result)}
            />
          </div>

          {/* Socratic Dialogue */}
          <SocraticDialogueWidget courseId="" className="min-h-[400px]" />
        </div>
      </section>

      {/* Content & Tutoring Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📚</span> Adaptive Learning
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Adaptive Content */}
          <AdaptiveContentWidget showTips={true} className="min-h-[400px]" />

          {/* Tutoring Orchestration */}
          <TutoringOrchestrationWidget className="min-h-[400px]" />
        </div>
      </section>

      {/* Content Adaptive Hub */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span> Content Adaptation Hub
        </h2>
        <ContentAdaptiveHub userId={user.id ?? ''} courseId="" />
      </section>

      {/* Research & Study Tools */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🔬</span> Research & Study Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Research Assistant */}
          <ResearchAssistant userId={user.id ?? ''} className="min-h-[400px]" />

          {/* Study Guide Generator */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-lg">📖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  AI Study Guides
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Generate personalized study materials
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Create AI-powered study guides tailored to your learning style,
              progress, and identified knowledge gaps.
            </p>
            <div className="flex items-center gap-2">
              <StudyGuideGenerator
                courseId=""
                courseTitle="General Studies"
                userId={user.id ?? ''}
                variant="button"
              />
              <StudyGuideGenerator
                courseId=""
                courseTitle="Quick Guide"
                userId={user.id ?? ''}
                variant="compact"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Lab */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🧪</span> Innovation Lab
        </h2>
        <InnovationLab userId={user.id ?? ''} className="w-full" />
      </section>
    </div>
  );
}

export default AIToolsSubTab;
