'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { User as NextAuthUser } from 'next-auth';

// Assessment Studio - Exam building, study guides
import { AssessmentStudio } from '@/components/sam/assessment-studio';
import { StudyGuideGenerator } from '@/components/sam/study-guide/StudyGuideGenerator';

// Practice & Learning Tools
import { PracticeProblemsWidget } from '@/components/sam/PracticeProblemsWidget';
import { TutoringOrchestrationWidget } from '@/components/sam/TutoringOrchestrationWidget';
import { SocraticDialogueWidget } from '@/components/sam/SocraticDialogueWidget';
import { AdaptiveContentWidget } from '@/components/sam/AdaptiveContentWidget';

// Learning Path & Prerequisites
import { LearningPathWidget } from '@/components/sam/LearningPathWidget';
import { PrerequisiteTreeView } from '@/components/sam/PrerequisiteTreeView';
import { LearningPathTimeline } from '@/components/sam/LearningPathTimeline';

// Financial Simulator (for specific courses)
import { FinancialSimulator } from '@/components/sam/FinancialSimulator';

// Course Insights
const CourseInsights = dynamic(
  () => import('@/components/sam/course-insights').then((mod) => mod.CourseInsights),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-slate-500">Loading Course Insights...</span>
      </div>
    ),
  }
);

interface StudySubTabProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
  };
}

export function StudySubTab({ user }: StudySubTabProps) {
  return (
    <div className="space-y-6">
      {/* Assessment Studio Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📝</span> Assessment & Study Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Assessment Studio - Exam building */}
          <AssessmentStudio
            courseId=""
            courseTitle="My Learning"
            userId={user.id ?? ''}
            compact={false}
            onExamCreated={(examId) => console.log('Exam created:', examId)}
          />

          {/* Study Guide Quick Access */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-lg">📚</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Study Guides
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  AI-personalized study plans
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Generate personalized study guides based on your learning progress,
              Bloom&apos;s Taxonomy levels, and identified knowledge gaps.
            </p>
            <div className="flex items-center gap-2">
              <StudyGuideGenerator
                courseId=""
                courseTitle="My Learning"
                userId={user.id ?? ''}
                variant="button"
              />
              <StudyGuideGenerator
                courseId=""
                courseTitle="Quick Review"
                userId={user.id ?? ''}
                variant="compact"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Practice & Tutoring Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span> Practice & Tutoring
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Practice Problems */}
          <PracticeProblemsWidget defaultTopic="" className="min-h-[400px]" />

          {/* Tutoring Orchestration */}
          <TutoringOrchestrationWidget className="min-h-[400px]" />
        </div>
      </section>

      {/* Interactive Learning Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span> Interactive Learning
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Socratic Dialogue */}
          <SocraticDialogueWidget courseId="" className="min-h-[400px]" />

          {/* Adaptive Content */}
          <AdaptiveContentWidget showTips={true} className="min-h-[400px]" />
        </div>
      </section>

      {/* Learning Path Section */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🛤️</span> Learning Path
        </h2>
        <LearningPathWidget />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Prerequisites Tree */}
          <PrerequisiteTreeView
            userId={user.id ?? ''}
            courseId=""
            conceptId=""
            className="min-h-[400px]"
          />

          {/* Learning Timeline */}
          <LearningPathTimeline
            userId={user.id ?? ''}
            courseId=""
            className="min-h-[400px]"
          />
        </div>
      </section>

      {/* Course Insights */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span> Course Insights
        </h2>
        <CourseInsights
          showHeader={false}
          showFilters={true}
          showOverview={true}
          maxCourses={6}
        />
      </section>

      {/* Financial Simulator (conditionally shown) */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-xl">💰</span> Financial Simulator
        </h2>
        <FinancialSimulator userId={user.id ?? ''} className="w-full" />
      </section>
    </div>
  );
}

export default StudySubTab;
