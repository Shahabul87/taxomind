'use client';

import React, { useState, useEffect } from 'react';
import type { User as NextAuthUser } from 'next-auth';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';

// Dynamic imports to prevent hydration mismatch with Framer Motion components
const SmartHeader = dynamic(
  () => import('@/components/dashboard/smart-header').then((mod) => mod.SmartHeader),
  {
    ssr: false,
    loading: () => (
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <div className="h-full pl-4 lg:pl-[88px] pr-4 sm:pr-6 lg:pr-8" />
      </header>
    ),
  }
);

const SmartSidebar = dynamic(
  () => import('@/components/dashboard/smart-sidebar').then((mod) => mod.SmartSidebar),
  {
    ssr: false,
    loading: () => (
      <aside
        className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 z-30"
        style={{ width: 72 }}
      />
    ),
  }
);
import { MobileGestureController } from '@/components/mobile/MobileGestureController';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { NewDashboard } from './NewDashboard';
import { CreateStudyPlanModal, type StudyPlanData } from './modals/CreateStudyPlanModal';
import { CreateCoursePlanModal, type CoursePlanData } from './modals/CreateCoursePlanModal';
import { CreateBlogPlanModal, type BlogPlanData } from './modals/CreateBlogPlanModal';
import { ScheduleSessionModal, type SessionData } from './modals/ScheduleSessionModal';
import { AddTodoModal, type TodoData } from './modals/AddTodoModal';
import { SetGoalModal, type GoalData } from './modals/SetGoalModal';

interface DashboardClientProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileHeaderOpen, setIsMobileHeaderOpen] = useState(true);
  const { isMobile } = useViewportHeight();

  // Modal states
  const [isStudyPlanModalOpen, setIsStudyPlanModalOpen] = useState(false);
  const [isCoursePlanModalOpen, setIsCoursePlanModalOpen] = useState(false);
  const [isBlogPlanModalOpen, setIsBlogPlanModalOpen] = useState(false);
  const [isScheduleSessionModalOpen, setIsScheduleSessionModalOpen] = useState(false);
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [isSetGoalModalOpen, setIsSetGoalModalOpen] = useState(false);

  // Quick action handlers
  const quickActionHandlers = {
    onCreateStudyPlan: () => setIsStudyPlanModalOpen(true),
    onCreateCoursePlan: () => setIsCoursePlanModalOpen(true),
    onCreateBlogPlan: () => setIsBlogPlanModalOpen(true),
    onScheduleSession: () => setIsScheduleSessionModalOpen(true),
    onAddTodo: () => setIsAddTodoModalOpen(true),
    onSetGoal: () => setIsSetGoalModalOpen(true),
  };

  // Handle mobile quick actions from bottom bar
  const handleMobileQuickAction = (action: string) => {
    switch (action) {
      case 'course-plan':
        setIsCoursePlanModalOpen(true);
        break;
      case 'blog-plan':
        setIsBlogPlanModalOpen(true);
        break;
      case 'session':
        setIsScheduleSessionModalOpen(true);
        break;
      case 'todo':
        setIsAddTodoModalOpen(true);
        break;
      case 'goal':
        setIsSetGoalModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Form submission handlers
  const handleStudyPlanSubmit = async (data: StudyPlanData) => {
    console.log('Study Plan:', data);
    // TODO: API call to create study plan
  };

  const handleCoursePlanSubmit = async (data: CoursePlanData) => {
    try {
      const response = await fetch('/api/dashboard/course-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startDate: data.startDate.toISOString(),
          targetCompletionDate: data.targetCompletionDate?.toISOString(),
          daysPerWeek: data.daysPerWeek,
          timePerSession: data.timePerSession,
          difficultyLevel: data.difficultyLevel,
          courseType: data.courseType,
          learningGoals: data.learningGoals,
          studyReminders: data.notifications.studyReminders,
          progressCheckins: data.notifications.progressCheckins,
          milestoneAlerts: data.notifications.milestoneAlerts,
          syncToGoogleCalendar: data.syncToGoogleCalendar,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Course plan created:', result.data);
        // TODO: Show success toast
        // TODO: Refresh dashboard data
      } else {
        console.error('Failed to create course plan:', result.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error creating course plan:', error);
      // TODO: Show error toast
    }
  };

  const handleBlogPlanSubmit = async (data: BlogPlanData) => {
    try {
      const response = await fetch('/api/dashboard/blog-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          topics: data.topics,
          startPublishingDate: data.startPublishingDate.toISOString(),
          postFrequency: data.postFrequency,
          specificDays: data.specificDays,
          platform: data.platform,
          targetAudience: data.targetAudience,
          contentGoal: data.contentGoal,
          writingReminders: data.notifications.writingReminders,
          publishingReminders: data.notifications.publishingReminders,
          deadlineAlerts: data.notifications.deadlineAlerts,
          syncToGoogleCalendar: data.syncToGoogleCalendar,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Blog plan created:', result.data);
        // TODO: Show success toast
      } else {
        console.error('Failed to create blog plan:', result.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error creating blog plan:', error);
      // TODO: Show error toast
    }
  };

  const handleSessionSubmit = async (data: SessionData) => {
    try {
      const response = await fetch('/api/dashboard/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          notes: data.notes,
          startTime: data.startTime.toISOString(),
          duration: data.duration,
          syncToGoogleCalendar: data.syncToGoogleCalendar,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Session created:', result.data);
      } else {
        console.error('Failed to create session:', result.error);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleTodoSubmit = async (data: TodoData) => {
    try {
      const response = await fetch('/api/dashboard/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          dueDate: data.dueDate?.toISOString(),
          priority: data.priority,
          tags: data.tags || [],
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Todo created:', result.data);
      } else {
        console.error('Failed to create todo:', result.error);
      }
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleGoalSubmit = async (data: GoalData) => {
    try {
      const response = await fetch('/api/dashboard/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          type: data.type,
          targetDate: data.targetDate.toISOString(),
          milestones: data.milestones.map((m) => ({
            title: m.title,
            targetDate: m.targetDate.toISOString(),
          })),
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Goal created:', result.data);
      } else {
        console.error('Failed to create goal:', result.error);
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  return (
    <MobileGestureController
      onSidebarOpen={() => setIsMobileSidebarOpen(true)}
      onQuickAction={handleMobileQuickAction}
      enableEdgeSwipe={isMobile}
      enableBottomBar={isMobile}
      enablePullToRefresh={false}
    >
      <div className="min-h-screen">
        {/* Sidebar */}
        <SmartSidebar
          user={user}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Header with auto-hide on mobile */}
        <SmartHeader
          user={user}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          quickActionHandlers={quickActionHandlers}
          isMobileVisible={true}
        />

        {/* Main Content */}
        <main className="pt-16 pb-20 lg:pb-0 lg:pl-[72px]">
          <NewDashboard user={user} viewMode={viewMode} />
        </main>

        {/* Modals */}
        <CreateStudyPlanModal
          isOpen={isStudyPlanModalOpen}
          onClose={() => setIsStudyPlanModalOpen(false)}
          onSubmit={handleStudyPlanSubmit}
        />
        <CreateCoursePlanModal
          isOpen={isCoursePlanModalOpen}
          onClose={() => setIsCoursePlanModalOpen(false)}
          onSubmit={handleCoursePlanSubmit}
        />
        <CreateBlogPlanModal
          isOpen={isBlogPlanModalOpen}
          onClose={() => setIsBlogPlanModalOpen(false)}
          onSubmit={handleBlogPlanSubmit}
        />
        <ScheduleSessionModal
          isOpen={isScheduleSessionModalOpen}
          onClose={() => setIsScheduleSessionModalOpen(false)}
          onSubmit={handleSessionSubmit}
        />
        <AddTodoModal
          isOpen={isAddTodoModalOpen}
          onClose={() => setIsAddTodoModalOpen(false)}
          onSubmit={handleTodoSubmit}
        />
        <SetGoalModal
          isOpen={isSetGoalModalOpen}
          onClose={() => setIsSetGoalModalOpen(false)}
          onSubmit={handleGoalSubmit}
        />
      </div>
    </MobileGestureController>
  );
}
