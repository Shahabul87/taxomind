'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { User as NextAuthUser } from 'next-auth';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

// Import unified header type
import type { DashboardView } from '@/components/dashboard/unified-header';

// Unified Dashboard Hooks
import { useUnifiedDashboard } from '@/hooks/dashboard';

// Dynamic imports to prevent hydration mismatch with Framer Motion components
const UnifiedDashboardHeader = dynamic(
  () => import('@/components/dashboard/unified-header').then((mod) => mod.UnifiedDashboardHeader),
  {
    ssr: false,
    loading: () => (
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <div className="lg:pl-[88px] px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-10 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center h-8 py-1">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
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
import { CreateStudyPlanWizard } from './modals/CreateStudyPlanWizard';
import { CreateCoursePlanModal, type CoursePlanData } from './modals/CreateCoursePlanModal';
import { CreateBlogPlanModal, type BlogPlanData } from './modals/CreateBlogPlanModal';
import { ScheduleSessionModal, type SessionData } from './modals/ScheduleSessionModal';
import { AddTodoModal, type TodoData } from './modals/AddTodoModal';
import { SetGoalModal, type GoalData } from './modals/SetGoalModal';
import { toast } from 'sonner';

interface DashboardClientProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

// Valid tab values for URL param validation
const validTabs: DashboardView[] = ['learning', 'analytics', 'skills', 'practice', 'gamification', 'goals', 'gaps', 'innovation', 'create'];

export function DashboardClient({ user }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlTab = searchParams.get('tab') as DashboardView | null;

  // Use unified dashboard hook for centralized state management
  const { activeTab, setActiveTab: setContextTab } = useUnifiedDashboard();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isMobile } = useViewportHeight();
  const [studyPlanRefreshKey, setStudyPlanRefreshKey] = useState(0);

  // Track initialization to avoid re-running on mount
  const initializedRef = useRef(false);

  // Initialize tab from URL on mount
  useEffect(() => {
    if (!initializedRef.current && urlTab && validTabs.includes(urlTab)) {
      initializedRef.current = true;
      setContextTab(urlTab);
    }
  }, [urlTab, setContextTab]);

  // Sync URL params when tab changes (for header tab clicks)
  const handleTabChange = (tab: DashboardView) => {
    setContextTab(tab);
    // Update URL without full page reload
    const url = new URL(window.location.href);
    if (tab === 'learning') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Sync context state when URL param changes (for sidebar link clicks)
  useEffect(() => {
    if (initializedRef.current && urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
      setContextTab(urlTab);
    } else if (initializedRef.current && !urlTab && activeTab !== 'learning') {
      setContextTab('learning');
    }
  }, [urlTab, activeTab, setContextTab]);

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

  // Study plan wizard success handler
  const handleStudyPlanSuccess = () => {
    // Increment refresh key to trigger StudyPlansList refetch
    setStudyPlanRefreshKey((prev) => prev + 1);
    // Navigate to goals tab to show the new study plan
    handleTabChange('goals');
  };

  // Form submission handlers
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
        toast.success('Course plan created successfully!');
        setIsCoursePlanModalOpen(false);
      } else {
        toast.error(result.error?.message || 'Failed to create course plan');
      }
    } catch (error) {
      console.error('Error creating course plan:', error);
      toast.error('Failed to create course plan');
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
        toast.success('Blog plan created successfully!');
        setIsBlogPlanModalOpen(false);
      } else {
        toast.error(result.error?.message || 'Failed to create blog plan');
      }
    } catch (error) {
      console.error('Error creating blog plan:', error);
      toast.error('Failed to create blog plan');
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
        toast.success('Session scheduled successfully!');
        setIsScheduleSessionModalOpen(false);
      } else {
        toast.error(result.error?.message || 'Failed to schedule session');
      }
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast.error('Failed to schedule session');
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
        toast.success('Todo created successfully!');
        setIsAddTodoModalOpen(false);
      } else {
        toast.error(result.error?.message || 'Failed to create todo');
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      toast.error('Failed to create todo');
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
        toast.success('Goal created successfully!');
        setIsSetGoalModalOpen(false);
      } else {
        toast.error(result.error?.message || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
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

        {/* Unified Header with integrated tabs */}
        <UnifiedDashboardHeader
          user={user}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          quickActionHandlers={quickActionHandlers}
          onMobileSidebarOpen={() => setIsMobileSidebarOpen(true)}
        />

        {/* Main Content - pt-14 for unified header height (56px) */}
        <main className="pt-14 pb-20 md:pb-20 lg:pb-0 md:pl-0 lg:pl-[72px]">
          <NewDashboard
            user={user}
            viewMode={viewMode}
            activeTab={activeTab}
            onCreateStudyPlan={() => setIsStudyPlanModalOpen(true)}
            studyPlanRefreshKey={studyPlanRefreshKey}
          />
        </main>

        {/* Modals */}
        <CreateStudyPlanWizard
          isOpen={isStudyPlanModalOpen}
          onClose={() => setIsStudyPlanModalOpen(false)}
          onSuccess={handleStudyPlanSuccess}
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
