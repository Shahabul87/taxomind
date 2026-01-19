'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Trophy,
  Calendar,
  Timer,
  Award,
  Flag,
  Plus,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Practice Dashboard Components
import {
  PracticeJourneyOverview,
  SkillMasteryGrid,
  PracticeHeatmap,
  SessionStartDialog,
  ActiveSessionTracker,
  MilestoneTimeline,
  PracticeGoalForm,
  PracticeGoalsList,
  type CreateSessionData,
  type CreateGoalData,
  type PracticeGoal,
  type SkillMastery,
} from '@/components/sam/practice-dashboard';

// Hooks
import { usePracticeDashboard } from '@/hooks/use-practice-dashboard';
import { usePracticeSession } from '@/hooks/use-practice-session';

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

interface PracticeClientProps {
  userId: string;
}

export function PracticeClient({ userId }: PracticeClientProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showStartSessionDialog, setShowStartSessionDialog] = useState(false);
  const [showGoalFormDialog, setShowGoalFormDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PracticeGoal | null>(null);

  // Dashboard data hook
  const {
    overview,
    heatmap,
    milestones,
    goals,
    masteries,
    isLoading,
    isLoadingOverview,
    isLoadingHeatmap,
    isLoadingMilestones,
    isLoadingGoals,
    refresh,
    refreshOverview,
    refreshMilestones,
    refreshGoals,
    claimMilestone,
  } = usePracticeDashboard({ enabled: true });

  // Session management hook
  const {
    activeSession,
    isLoading: isLoadingSession,
    isStarting,
    isPausing,
    isResuming,
    isEnding,
    sessionTypeInfo,
    bloomsLevelInfo,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    refreshActiveSession,
  } = usePracticeSession({ enabled: true });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartSession = useCallback(
    async (data: CreateSessionData) => {
      const session = await startSession(data);
      if (session) {
        setShowStartSessionDialog(false);
        setActiveTab('session');
      }
    },
    [startSession]
  );

  const handleEndSession = useCallback(
    async (rating?: number, notes?: string) => {
      const success = await endSession(rating, notes);
      if (success) {
        // Refresh data after session ends
        refreshOverview();
        refreshMilestones();
      }
    },
    [endSession, refreshOverview, refreshMilestones]
  );

  const handleCreateGoal = useCallback(
    async (data: CreateGoalData) => {
      try {
        const response = await fetch('/api/sam/practice/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create goal');
        }

        toast({
          title: 'Goal Created',
          description: `Goal "${data.title}" has been created.`,
        });

        setShowGoalFormDialog(false);
        setEditingGoal(null);
        refreshGoals();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create goal';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    },
    [toast, refreshGoals]
  );

  const handleEditGoal = useCallback((goal: PracticeGoal) => {
    setEditingGoal(goal);
    setShowGoalFormDialog(true);
  }, []);

  const handleDeleteGoal = useCallback(
    async (goalId: string) => {
      try {
        const response = await fetch(`/api/sam/practice/goals/${goalId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete goal');
        }

        toast({
          title: 'Goal Deleted',
          description: 'The goal has been deleted.',
        });

        refreshGoals();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete goal';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    },
    [toast, refreshGoals]
  );

  const handleSkillClick = useCallback((skillId: string) => {
    // Could navigate to skill detail page or show modal
    console.log('Skill clicked:', skillId);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            10,000 Hour Practice
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track your journey to mastery with deliberate practice
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSession ? (
            <Button
              onClick={() => setActiveTab('session')}
              variant="outline"
              className="gap-2"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="h-2 w-2 rounded-full bg-emerald-500"
              />
              Active Session
            </Button>
          ) : (
            <Button onClick={() => setShowStartSessionDialog(true)} className="gap-2">
              <Timer className="h-4 w-4" />
              Start Session
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-6 bg-slate-100/80 dark:bg-slate-800/80">
          <TabsTrigger value="overview" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="mastery" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Mastery</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="session" className="gap-2 relative">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Session</span>
            {activeSession && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500"
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2 relative">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Milestones</span>
            {milestones && milestones.stats.unclaimed > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {milestones.stats.unclaimed}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <PracticeJourneyOverview
            data={overview}
            isLoading={isLoadingOverview}
            onRefresh={refreshOverview}
          />
        </TabsContent>

        {/* Mastery Tab */}
        <TabsContent value="mastery">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Skill Mastery Progress
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Track your 10,000-hour journey for each skill
                </p>
              </div>
            </div>
            <SkillMasteryGrid
              masteries={masteries}
              isLoading={isLoadingOverview}
              onSkillClick={handleSkillClick}
            />
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <PracticeHeatmap
            showStats={true}
            compact={false}
          />
        </TabsContent>

        {/* Session Tab */}
        <TabsContent value="session">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Practice Session
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Track your current practice session in real-time
                </p>
              </div>
              {!activeSession && (
                <Button onClick={() => setShowStartSessionDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Session
                </Button>
              )}
            </div>

            <ActiveSessionTracker
              session={activeSession}
              onPause={pauseSession}
              onResume={resumeSession}
              onEnd={handleEndSession}
              isLoading={isPausing || isResuming || isEnding}
            />
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Milestones &amp; Achievements
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Celebrate your progress with milestone rewards
                </p>
              </div>
              {milestones && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {milestones.stats.totalAchieved} achieved
                </div>
              )}
            </div>
            <MilestoneTimeline
              milestones={milestones?.milestones || []}
              onClaim={claimMilestone}
              isLoading={isLoadingMilestones}
            />
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Practice Goals
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Set goals to stay motivated and track your progress
                </p>
              </div>
              <Button onClick={() => setShowGoalFormDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Goal
              </Button>
            </div>

            {/* Goal Stats Summary */}
            {goals && goals.stats.totalGoals > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {goals.stats.activeGoals}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {goals.stats.completedGoals}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {goals.stats.totalGoals}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {goals.stats.completionRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Completion Rate
                  </p>
                </div>
              </div>
            )}

            <PracticeGoalsList
              goals={goals?.goals || []}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              isLoading={isLoadingGoals}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SessionStartDialog
        open={showStartSessionDialog}
        onOpenChange={setShowStartSessionDialog}
        onStart={handleStartSession}
        sessionTypeInfo={sessionTypeInfo}
        bloomsLevelInfo={bloomsLevelInfo}
        isLoading={isStarting}
      />

      <PracticeGoalForm
        open={showGoalFormDialog}
        onOpenChange={(open) => {
          setShowGoalFormDialog(open);
          if (!open) setEditingGoal(null);
        }}
        onSubmit={handleCreateGoal}
        initialData={editingGoal || undefined}
        isLoading={false}
      />
    </div>
  );
}

export default PracticeClient;
