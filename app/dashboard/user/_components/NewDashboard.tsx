"use client";

import React, { useState } from "react";
import type { User as NextAuthUser } from "next-auth";
import { ActivityStream } from "./ActivityStream";
import { EmptyState } from "./EmptyState";
import { useActivities } from "@/hooks/use-activities";
import { Loader2, LayoutDashboard, Trophy, Target, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Enhanced Gamification Components
import {
  LevelProgressBar,
  AchievementsWidget,
  LeaderboardWidget,
  StreakWidget,
} from "@/components/gamification";

// Learning Command Center
import { LearningCommandCenter } from "./learning-command-center";

// SkillBuildTracker Dashboard - Connected to real API
import SkillBuildTrackerConnected from "@/components/dashboard/smart/skill-build-tracker-connected";

// SAM AI Achievement Badges
import { AchievementBadges } from "@/components/sam/AchievementBadges";

// SAM AI Leaderboard Widget
import { LeaderboardWidget as SAMLeaderboardWidget } from "@/components/sam/LeaderboardWidget";

// SAM AI Assistant - Conversational AI Mentor (dynamically loaded to prevent SSR issues)
import { SAMAssistantWrapper } from "@/components/sam/SAMAssistantWrapper";

// SAM Context Tracker - Automatically syncs page context with SAM
import { SAMContextTracker } from "@/components/sam/SAMContextTracker";

// SAM AI Learning Widgets - Integrated from SAM Agentic System
import { SpacedRepetitionCalendar } from "@/components/sam/SpacedRepetitionCalendar";
import { MicrolearningWidget } from "@/components/sam/MicrolearningWidget";
import { PredictiveInsights } from "@/components/sam/PredictiveInsights";
import { MetaLearningInsightsWidget } from "@/components/sam/MetaLearningInsightsWidget";
import { LearningPathWidget } from "@/components/sam/LearningPathWidget";
import { RecommendationWidget } from "@/components/sam/recommendation-widget";
import { CheckInHistory } from "@/components/sam/CheckInHistory";
import { SAMQuickActionsSafe } from "@/components/sam/SAMQuickActionsSafe";
import { StudyBuddyFinder } from "@/components/sam/StudyBuddyFinder";
import { CompetencyDashboard } from "@/components/sam/CompetencyDashboard";
import { ConfidenceCalibrationWidget } from "@/components/sam/ConfidenceCalibrationWidget";

// Cognitive Load Monitoring - Real-time mental workload tracking
import { CognitiveLoadMonitor } from "@/components/sam/CognitiveLoadMonitor";

// Additional SAM AI Widgets - Underutilized Engines Integration
import { QualityScoreDashboard } from "@/components/sam/QualityScoreDashboard";
import { KnowledgeGraphBrowser } from "@/components/sam/KnowledgeGraphBrowser";
import { PeerLearningHub } from "@/components/sam/PeerLearningHub";

// 10,000 Hour Practice Tracking Components
import {
  PracticeTimer,
  PomodoroTimer,
  SkillMasteryCard,
  PracticeCalendarHeatmap,
  PracticeLeaderboard,
  PracticeStreakDisplay,
  MilestoneTimeline,
  PracticeRecommendations,
} from "@/components/practice";

interface NewDashboardProps {
  user: NextAuthUser;
  viewMode: "grid" | "list";
}

type DashboardView = "learning" | "gamification" | "skills" | "practice";

export function NewDashboard({ user, viewMode }: NewDashboardProps) {
  const [dashboardView, setDashboardView] = useState<DashboardView>("learning");

  const {
    activities,
    isLoading,
    error,
    hasMore,
    loadMore,
    updateActivity,
    deleteActivity,
  } = useActivities();

  // Event handlers
  const handleViewDetails = (id: string) => {
    console.log("View details for activity:", id);
    // TODO: Navigate to activity detail page or open modal
  };

  const handleEdit = (id: string) => {
    console.log("Edit activity:", id);
    // TODO: Open edit modal with activity data
  };

  const handleDelete = async (id: string) => {
    const success = await deleteActivity(id);
    if (!success) {
      console.error("Failed to delete activity");
      // TODO: Show error toast
    }
  };

  const handleToggleComplete = async (id: string) => {
    const activity = activities.find((a) => a.id === id);
    if (!activity) return;

    const isCompleted =
      activity.status === "SUBMITTED" || activity.status === "GRADED";

    const success = await updateActivity(id, {
      status: isCompleted ? "NOT_STARTED" : "SUBMITTED",
      completedAt: isCompleted ? undefined : new Date(),
    });

    if (!success) {
      console.error("Failed to toggle activity completion");
      // TODO: Show error toast
    }
  };

  const handleToggleFavorite = async (id: string) => {
    console.log("Toggle favorite for activity:", id);
    // TODO: Implement favorite functionality (add to schema if needed)
  };

  // View Toggle Component (shared across views)
  const ViewToggle = () => (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-slate-200/50 bg-white/80 p-1 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80">
      <Button
        variant={dashboardView === "learning" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("learning")}
        className="gap-2"
      >
        <LayoutDashboard className="h-4 w-4" />
        <span className="hidden sm:inline">Learning</span>
      </Button>
      <Button
        variant={dashboardView === "skills" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("skills")}
        className="gap-2"
      >
        <Target className="h-4 w-4" />
        <span className="hidden sm:inline">Skills</span>
      </Button>
      <Button
        variant={dashboardView === "practice" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("practice")}
        className="gap-2"
      >
        <Timer className="h-4 w-4" />
        <span className="hidden sm:inline">Practice</span>
      </Button>
      <Button
        variant={dashboardView === "gamification" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("gamification")}
        className="gap-2"
      >
        <Trophy className="h-4 w-4" />
        <span className="hidden sm:inline">Achievements</span>
      </Button>
    </div>
  );

  // Show Learning Command Center as the default view
  if (dashboardView === "learning") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/10 dark:to-indigo-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />
        <ViewToggle />

        {/* Learning Command Center - Main Learning Hub */}
        <LearningCommandCenter user={user} />

        {/* SAM AI Learning Widgets Section */}
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          {/* Quick Actions Bar */}
          <div className="mb-6">
            <SAMQuickActionsSafe />
          </div>

          {/* Primary SAM Widgets Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Spaced Repetition Calendar - Review Scheduling */}
            <div className="lg:col-span-2">
              <SpacedRepetitionCalendar />
            </div>

            {/* AI Recommendations - Personalized Learning */}
            <div className="lg:col-span-1">
              <RecommendationWidget />
            </div>
          </div>

          {/* Secondary Widgets Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Microlearning Widget - Bite-sized Lessons */}
            <MicrolearningWidget />

            {/* Predictive Insights - Learning Predictions */}
            <PredictiveInsights />

            {/* Meta-Learning Insights - Pattern Recognition */}
            <MetaLearningInsightsWidget />
          </div>

          {/* Learning Path Widget - Full Width */}
          <div className="mt-6">
            <LearningPathWidget />
          </div>

          {/* Cognitive Load & Check-in History Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Cognitive Load Monitor - Real-time mental workload tracking */}
            <CognitiveLoadMonitor
              sessionId={`dashboard-${user.id}`}
              autoRefresh={true}
              refreshInterval={60000}
              compact={false}
            />

            {/* Recent Check-ins - Proactive System History */}
            <CheckInHistory limit={5} />

            {/* Study Buddy Finder - Peer Learning */}
            <StudyBuddyFinder />
          </div>

          {/* Peer Learning Hub - Collaborative Learning (Full Width) */}
          <div className="mt-6">
            <PeerLearningHub />
          </div>
        </div>

        {/* SAM AI Assistant - Always available conversational mentor */}
        <SAMAssistantWrapper />
      </div>
    );
  }

  // Practice view with 10,000 Hour Practice Tracking System
  if (dashboardView === "practice") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/30 dark:from-slate-900 dark:via-orange-900/10 dark:to-red-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />
        <ViewToggle />

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              🎯 10,000 Hour Practice Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your deliberate practice journey to mastery with quality-adjusted hours
            </p>
          </div>

          {/* Streak Display */}
          <div className="mb-6">
            <PracticeStreakDisplay variant="large" />
          </div>

          {/* Timer Section - Two Timers Side by Side */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Main Practice Timer */}
            <PracticeTimer />

            {/* Pomodoro Timer */}
            <PomodoroTimer />
          </div>

          {/* SAM Recommendations */}
          <div className="mb-6">
            <PracticeRecommendations limit={3} />
          </div>

          {/* Calendar Heatmap - Full Width */}
          <div className="mb-6">
            <PracticeCalendarHeatmap />
          </div>

          {/* Leaderboard and Milestones Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Practice Leaderboard */}
            <PracticeLeaderboard type="global" limit={5} showPodium />

            {/* Milestone Timeline */}
            <MilestoneTimeline limit={5} />
          </div>
        </div>

        {/* SAM AI Assistant - Always available conversational mentor */}
        <SAMAssistantWrapper />
      </div>
    );
  }

  // Skills view with SkillBuildTracker (connected to real API)
  if (dashboardView === "skills") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-900 dark:via-emerald-900/10 dark:to-teal-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />
        <ViewToggle />

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
          {/* Main Skill Tracker */}
          <SkillBuildTrackerConnected />

          {/* SAM AI Engine Widgets Section */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Knowledge Graph Browser - Visual skill relationships */}
            <KnowledgeGraphBrowser />

            {/* Quality Score Dashboard - Content quality metrics */}
            <QualityScoreDashboard />
          </div>
        </div>

        {/* SAM AI Assistant - Always available conversational mentor */}
        <SAMAssistantWrapper />
      </div>
    );
  }

  // Gamification view
  return (
    <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />
      <ViewToggle />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Gamification Section */}
        <section className="mb-8 pt-12">
          {/* Level Progress Header */}
          <div className="mb-6">
            <LevelProgressBar />
          </div>

          {/* Gamification Widgets Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Streak Widget */}
            <div className="lg:col-span-1">
              <StreakWidget />
            </div>

            {/* Achievements Widget */}
            <div className="lg:col-span-2">
              <AchievementsWidget maxDisplay={6} />
            </div>
          </div>

          {/* SAM AI Achievements */}
          <div className="mt-6">
            <AchievementBadges limit={8} showLocked compact={false} />
          </div>

          {/* Leaderboard (Full Width) */}
          <div className="mt-6">
            <LeaderboardWidget maxDisplay={5} />
          </div>

          {/* SAM AI Learning Leaderboard */}
          <div className="mt-6">
            <SAMLeaderboardWidget
              limit={5}
              compact={false}
              showCurrentUserPosition={true}
            />
          </div>

          {/* SAM AI Advanced Analytics Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Competency Dashboard - Skill Mastery Tracking */}
            <CompetencyDashboard />

            {/* Confidence Calibration - AI Quality Metrics */}
            <ConfidenceCalibrationWidget />
          </div>
        </section>

        {/* Activity Stream Section */}
        {isLoading && activities.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                Loading activities...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <EmptyState type="activities" />
        ) : (
          <ActivityStream
            activities={activities}
            viewMode={viewMode}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleComplete={handleToggleComplete}
            onToggleFavorite={handleToggleFavorite}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isLoading}
          />
        )}
      </div>
      {/* SAM AI Assistant - Always available conversational mentor */}
      <SAMAssistantWrapper />
    </div>
  );
}
