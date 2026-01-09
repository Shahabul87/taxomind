'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { User as NextAuthUser } from 'next-auth';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { GoalsHeader } from '@/components/goals/GoalsHeader';
import { GoalsStats } from '@/components/goals/GoalsStats';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalCreationDialog } from '@/components/goals/GoalCreationDialog';
import { GoalDetailSheet } from '@/components/goals/GoalDetailSheet2';
import { GoalsEmptyState } from '@/components/goals/GoalsEmptyState';
import { GoalsLoadingSkeleton } from '@/components/goals/GoalsLoadingSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Quick Create modal components
import { CreateStudyPlanModal, type StudyPlanData } from '@/app/dashboard/user/_components/modals/CreateStudyPlanModal';
import { CreateCoursePlanModal, type CoursePlanData } from '@/app/dashboard/user/_components/modals/CreateCoursePlanModal';
import { CreateBlogPlanModal, type BlogPlanData } from '@/app/dashboard/user/_components/modals/CreateBlogPlanModal';
import { ScheduleSessionModal, type SessionData } from '@/app/dashboard/user/_components/modals/ScheduleSessionModal';
import { AddTodoModal, type TodoData } from '@/app/dashboard/user/_components/modals/AddTodoModal';

interface GoalsClientProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  topicIds: string[];
  skillIds: string[];
  currentMastery?: string;
  targetMastery?: string;
  tags: string[];
  course?: { id: string; title: string } | null;
  subGoals: Array<{
    id: string;
    title: string;
    status: string;
    order: number;
    type?: string;
    estimatedMinutes?: number;
    difficulty?: string;
  }>;
  plans: Array<{
    id: string;
    status: string;
    overallProgress: number;
    currentStepId?: string;
    startDate?: string;
    targetDate?: string;
  }>;
}

type FilterStatus = 'all' | 'active' | 'completed' | 'paused' | 'draft';
type SortOption = 'newest' | 'oldest' | 'priority' | 'progress' | 'deadline';

export function GoalsClient({ user }: GoalsClientProps) {
  const searchParams = useSearchParams();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Create modal states
  const [isStudyPlanModalOpen, setIsStudyPlanModalOpen] = useState(false);
  const [isCoursePlanModalOpen, setIsCoursePlanModalOpen] = useState(false);
  const [isBlogPlanModalOpen, setIsBlogPlanModalOpen] = useState(false);
  const [isScheduleSessionModalOpen, setIsScheduleSessionModalOpen] = useState(false);
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);

  // Handle ?action=create query param to auto-open creation dialog
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setIsCreating(true);
    }
  }, [searchParams]);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }

      const response = await fetch(`/api/sam/agentic/goals?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      const data = await response.json();
      if (data.success) {
        setGoals(data.data.goals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleGoalCreated = (newGoal: Goal) => {
    setGoals((prev) => [newGoal, ...prev]);
    setIsCreating(false);
    toast.success('Goal created successfully!');
  };

  const handleGoalUpdated = (updatedGoal: Goal) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );
    setSelectedGoal(updatedGoal);
  };

  const handleGoalDeleted = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setSelectedGoal(null);
    toast.success('Goal deleted');
  };

  // Filter and sort goals
  const filteredGoals = goals
    .filter((goal) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          goal.title.toLowerCase().includes(query) ||
          goal.description?.toLowerCase().includes(query) ||
          goal.tags.some((t) => t.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority': {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'progress':
          return b.progress - a.progress;
        case 'deadline':
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Calculate stats
  const stats = {
    total: goals.length,
    active: goals.filter((g) => g.status === 'active').length,
    completed: goals.filter((g) => g.status === 'completed').length,
    avgProgress: goals.length
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0,
  };

  // Quick action handlers for the dropdown
  const quickActionHandlers = {
    onCreateStudyPlan: () => setIsStudyPlanModalOpen(true),
    onCreateCoursePlan: () => setIsCoursePlanModalOpen(true),
    onCreateBlogPlan: () => setIsBlogPlanModalOpen(true),
    onScheduleSession: () => setIsScheduleSessionModalOpen(true),
    onAddTodo: () => setIsAddTodoModalOpen(true),
    // For "Set Goal" we use the existing GoalCreationDialog (better UX with SAM integration)
    onSetGoal: () => setIsCreating(true),
  };

  // Form submission handlers for Quick Create modals
  const handleStudyPlanSubmit = async (data: StudyPlanData) => {
    try {
      const response = await fetch('/api/dashboard/study-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: data.planType,
          enrolledCourseId: data.enrolledCourseId,
          newCourseTitle: data.newCourseTitle,
          newCourseDescription: data.newCourseDescription,
          newCourseUrl: data.newCourseUrl || undefined,
          newCoursePlatform: data.newCoursePlatform,
          title: data.title,
          description: data.description,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          weeklyHoursGoal: data.weeklyHoursGoal,
          dailyStudyTime: data.dailyStudyTime,
          studyDaysPerWeek: data.studyDaysPerWeek,
          aiGenerated: false,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Study plan created successfully!');
        setIsStudyPlanModalOpen(false);
      } else {
        toast.error(result.error?.message || 'Failed to create study plan');
      }
    } catch (error) {
      console.error('Error creating study plan:', error);
      toast.error('Failed to create study plan');
    }
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

  return (
    <MobileLayout
      user={user}
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20"
      quickActionHandlers={quickActionHandlers}
    >
      <div className="min-h-screen w-full">
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <GoalsHeader
              onCreateClick={() => setIsCreating(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
              quickActionHandlers={quickActionHandlers}
            />

            {/* Stats Section */}
            <GoalsStats stats={stats} />
          </div>
        </div>

        {/* Goals Content */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <Tabs defaultValue="grid" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {filterStatus === 'all' ? 'All Goals' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Goals`}
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                  ({filteredGoals.length})
                </span>
              </h2>
              <TabsList className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                <TabsTrigger value="grid" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </TabsTrigger>
              </TabsList>
            </div>

            {isLoading ? (
              <GoalsLoadingSkeleton />
            ) : filteredGoals.length === 0 ? (
              <GoalsEmptyState
                hasGoals={goals.length > 0}
                onCreateClick={() => setIsCreating(true)}
              />
            ) : (
              <>
                <TabsContent value="grid" className="mt-0">
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 },
                      },
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredGoals.map((goal) => (
                        <motion.div
                          key={goal.id}
                          layout
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <GoalCard
                            goal={goal}
                            onClick={() => setSelectedGoal(goal)}
                            variant="grid"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </TabsContent>

                <TabsContent value="list" className="mt-0">
                  <motion.div
                    className="space-y-3"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.03 },
                      },
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredGoals.map((goal) => (
                        <motion.div
                          key={goal.id}
                          layout
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0 },
                          }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <GoalCard
                            goal={goal}
                            onClick={() => setSelectedGoal(goal)}
                            variant="list"
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {/* Goal Creation Dialog */}
        <GoalCreationDialog
          open={isCreating}
          onOpenChange={setIsCreating}
          onGoalCreated={handleGoalCreated}
        />

        {/* Goal Detail Sheet */}
        <GoalDetailSheet
          goal={selectedGoal}
          open={!!selectedGoal}
          onOpenChange={(open) => !open && setSelectedGoal(null)}
          onGoalUpdated={handleGoalUpdated}
          onGoalDeleted={handleGoalDeleted}
        />

        {/* Quick Create Modals */}
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
      </div>
    </MobileLayout>
  );
}
