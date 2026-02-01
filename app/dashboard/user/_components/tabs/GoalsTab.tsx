'use client';

import type { User as NextAuthUser } from 'next-auth';
import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { GoalsProgress } from '../learning-command-center/analytics/GoalsProgress';
import { StudyPlansList } from '@/components/sam/study-plan';
import { CoursePlansList } from '@/components/sam/course-plan';
import { BlogPlansList } from '@/components/sam/blog-plan';
import { StudySessionScheduler } from '@/components/sam/study-session';
import { StudyPlanningHub } from '@/components/sam/study-planning-hub';

interface GoalsTabProps {
  user: NextAuthUser;
  onCreateStudyPlan?: () => void;
  studyPlanRefreshKey?: number;
  onCreateCoursePlan?: () => void;
  coursePlanRefreshKey?: number;
  onCreateBlogPlan?: () => void;
  blogPlanRefreshKey?: number;
}

export function GoalsTab({
  user,
  onCreateStudyPlan,
  studyPlanRefreshKey,
  onCreateCoursePlan,
  coursePlanRefreshKey,
  onCreateBlogPlan,
  blogPlanRefreshKey,
}: GoalsTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-slate-50 dark:bg-slate-900">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 shadow-lg flex-shrink-0">
              <span className="text-2xl sm:text-3xl">&#x1F3AF;</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Goals &amp; Milestones
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                Set, track, and achieve your learning objectives with AI-powered guidance
              </p>
            </div>
          </div>
        </div>

        {/* AI Study Plans - Personalized daily task tracking */}
        <div className="mb-6 sm:mb-8">
          <StudyPlansList
            key={studyPlanRefreshKey}
            onCreatePlan={onCreateStudyPlan}
            onTaskComplete={(taskId) => {
              // Dispatch custom event to notify GoalsProgress to refresh
              window.dispatchEvent(new CustomEvent('study-plan-task-updated', { detail: { taskId } }));
            }}
          />
        </div>

        {/* Goals Progress Overview */}
        <div className="mb-4 sm:mb-6">
          <GoalsProgress compact={false} />
        </div>

        {/* Study Planning Hub - Additional planning tools */}
        <div className="mt-4 sm:mt-6 mb-6 sm:mb-8">
          <StudyPlanningHub
            defaultTab="overview"
            onReviewComplete={(conceptId, score) => console.log('Review completed:', conceptId, score)}
            onInsightSelect={(insight) => console.log('Insight selected:', insight)}
          />
        </div>

        {/* Course Creation Plans - For instructors planning to build courses */}
        <div className="mt-6 sm:mt-8">
          <CoursePlansList
            refreshKey={coursePlanRefreshKey}
            onCreatePlan={onCreateCoursePlan}
          />
        </div>

        {/* Blog Content Plans - For content creators planning their blog journey */}
        <div className="mt-6 sm:mt-8">
          <BlogPlansList
            refreshKey={blogPlanRefreshKey}
            onCreatePlan={onCreateBlogPlan}
          />
        </div>

        {/* Study Session Scheduler - Schedule focused sessions from study plan tasks */}
        <div className="mt-6 sm:mt-8">
          <StudySessionScheduler />
        </div>
      </div>
    </div>
  );
}
