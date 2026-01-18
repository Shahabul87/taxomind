"use client";

import React, { useState } from "react";
import type { User as NextAuthUser } from "next-auth";
import { ActivityStream } from "./ActivityStream";
import { EmptyState } from "./EmptyState";
import { useActivities } from "@/hooks/use-activities";
import { Loader2, LayoutDashboard, Trophy, Target, Timer, AlertTriangle, Lightbulb, Compass } from "lucide-react";
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

// GAP-10: Enhanced Knowledge Graph Components
import {
  EnhancedKnowledgeGraphExplorer,
  LearningPathBuilder,
  PrerequisiteAnalyzer,
} from "@/components/sam/knowledge-graph";

// Gap 1 Hidden Capabilities - Now Exposed
import { BiasDetectionReport } from "@/components/sam/BiasDetectionReport";
import { LearningPathOptimizer } from "@/components/sam/LearningPathOptimizer";
import { MetacognitionPanel } from "@/components/sam/MetacognitionPanel";
import { BehaviorPatternsWidget } from "@/components/sam/behavior/BehaviorPatternsWidget";
import { MemorySearchPanel } from "@/components/sam/memory/MemorySearchPanel";
import { TrendsExplorer } from "@/components/sam/TrendsExplorer";

// Phase 2: High-Value Components - Learning Path & Prerequisites
import { PrerequisiteTreeView } from "@/components/sam/PrerequisiteTreeView";
import { LearningPathTimeline } from "@/components/sam/LearningPathTimeline";

// Phase 2: Safety & Accessibility Components
import { AccessibilityMetricsWidget } from "@/components/sam/AccessibilityMetricsWidget";
import { DiscouragingLanguageAlert } from "@/components/sam/DiscouragingLanguageAlert";

// Phase 2: Social Learning - Active Learners
import { ActiveLearnersWidget } from "@/components/sam/presence/ActiveLearnersWidget";

// Phase 2: Contextual Help Widget
import { ContextualHelpWidget } from "@/components/sam/ContextualHelpWidget";

// Gap 3 Orphaned Components - Now Integrated
import { SocialLearningFeed } from "@/components/sam/SocialLearningFeed";
import { CollaborationSpace } from "@/components/sam/CollaborationSpace";
import { ResearchAssistant } from "@/components/sam/ResearchAssistant";
import { IntegrityChecker } from "@/components/sam/IntegrityChecker";
import {
  CelebrationOverlay,
  useCelebration,
} from "@/components/sam/CelebrationOverlay";
import {
  ToolApprovalDialog,
  useToolApproval,
} from "@/components/sam/ToolApprovalDialog";

// Gap 2: Underutilized React Hooks - Now Connected to Dashboard
// These widgets expose powerful @sam-ai/react hooks that were built but not used
import { PracticeProblemsWidget } from "@/components/sam/PracticeProblemsWidget";
import { AdaptiveContentWidget } from "@/components/sam/AdaptiveContentWidget";
import { SocraticDialogueWidget } from "@/components/sam/SocraticDialogueWidget";
import { TutoringOrchestrationWidget } from "@/components/sam/TutoringOrchestrationWidget";
import { RealtimeCollaborationWidget } from "@/components/sam/RealtimeCollaborationWidget";
import { UserInterventionsWidget } from "@/components/sam/UserInterventionsWidget";

// Gap 2 Final: Last 2 hooks now connected (22/22 complete)
import { NotificationsWidget } from "@/components/sam/NotificationsWidget";
import { LearningRecommendationsWidget } from "@/components/sam/LearningRecommendationsWidget";

// GAP-9: Comprehensive Notification Center with Preferences Panel
import { NotificationCenterTrigger } from "@/components/sam/notification-center";

// Phase 4: Study Buddy Chat - Real-time collaborative study sessions
import { StudyBuddyChat } from "@/components/sam/study-buddy-chat";

// Phase 4: Course Insights - AI-powered per-course analytics
import { CourseInsights } from "@/components/sam/course-insights";

// Phase 4: Portfolio Export - Export and share learning portfolios
import { PortfolioExport } from "@/components/sam/portfolio-export";

// Phase 4: Course Marketplace - Browse and discover courses
import { CourseMarketplace } from "@/components/sam/course-marketplace";

// Learning Gap Analysis Dashboard
import { LearningGapDashboard } from "@/components/sam/learning-gap";

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

// Practice Goal Setting
import { PracticeGoalSetter } from "@/components/practice/PracticeGoalSetter";

// Phase 5: Market Integration - Career Progress Widget
import { CareerProgressWidget } from "@/components/sam/CareerProgressWidget";

// GAP-6: Certification Tracking Components
import {
  CertificationTracker,
  SkillToCertificationMap,
  CertificationProgressWidget,
} from "@/components/sam/certification";

// Innovation Dashboard - Hidden InnovationEngine Features Now Exposed
import { InnovationDashboard } from "@/components/sam/innovation";

interface NewDashboardProps {
  user: NextAuthUser;
  viewMode: "grid" | "list";
}

type DashboardView = "learning" | "gamification" | "skills" | "practice" | "gaps" | "innovation" | "discover";

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

  // Gap 3 Integration: Celebration system for achievements
  const { celebration, showCelebration, dismissCelebration } = useCelebration();

  // Gap 3 Integration: Tool approval system for SAM
  const {
    pendingRequest,
    isOpen: isToolApprovalOpen,
    isProcessing: isToolApprovalProcessing,
    handleApprove: handleToolApprove,
    handleDeny: handleToolDeny,
    setIsOpen: setToolApprovalOpen,
  } = useToolApproval({
    onApproved: (requestId, toolId) => {
      console.log("Tool approved:", toolId);
    },
    onDenied: (requestId, toolId) => {
      console.log("Tool denied:", toolId);
    },
  });

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
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
      {/* GAP-9: Notification Center Trigger */}
      <NotificationCenterTrigger
        variant="outline"
        className="h-9 w-9 rounded-lg border-slate-200/50 bg-white/80 backdrop-blur-sm hover:bg-slate-100/80 dark:border-slate-700/50 dark:bg-slate-800/80 dark:hover:bg-slate-700/80"
      />
      <div className="flex items-center gap-1 rounded-lg border border-slate-200/50 bg-white/80 p-1 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80">
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
      <Button
        variant={dashboardView === "gaps" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("gaps")}
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="hidden sm:inline">Gaps</span>
      </Button>
      <Button
        variant={dashboardView === "innovation" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("innovation")}
        className="gap-2"
      >
        <Lightbulb className="h-4 w-4" />
        <span className="hidden sm:inline">Innovation</span>
      </Button>
      <Button
        variant={dashboardView === "discover" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("discover")}
        className="gap-2"
      >
        <Compass className="h-4 w-4" />
        <span className="hidden sm:inline">Discover</span>
      </Button>
      </div>
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

          {/* ============================================================= */}
          {/* PHASE 2: Contextual Help - Smart Help System */}
          {/* ============================================================= */}

          {/* Help & Recommendations Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Contextual Help Widget - Smart contextual assistance */}
            <ContextualHelpWidget
              context="learning"
              showSearch={true}
              showShortcuts={true}
              maxItems={5}
              compact={false}
              className="lg:col-span-1"
            />

            {/* Placeholder for balance */}
            <div className="hidden lg:col-span-2 lg:block" />
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

          {/* ============================================================= */}
          {/* PHASE 2: Prerequisite Tree & Learning Timeline */}
          {/* ============================================================= */}

          {/* Prerequisites & Timeline Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* PrerequisiteTreeView - Shows what needs to be learned first */}
            <PrerequisiteTreeView
              userId={user.id ?? ""}
              courseId=""
              conceptId=""
              className="min-h-[400px]"
            />

            {/* LearningPathTimeline - Chronological milestone timeline */}
            <LearningPathTimeline
              userId={user.id ?? ""}
              courseId=""
              className="min-h-[400px]"
            />
          </div>

          {/* Cognitive Load & Check-in History Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Cognitive Load Monitor - Real-time mental workload tracking */}
            <CognitiveLoadMonitor
              sessionId={`dashboard-${user.id}`}
              autoRefresh={true}
              refreshInterval={60000}
              compact={false}
            />

            {/* Recent Check-ins - Proactive System History */}
            <CheckInHistory limit={5} />
          </div>

          {/* ============================================================= */}
          {/* PHASE 2: Social Learning & Active Learners */}
          {/* ============================================================= */}

          {/* Social Learning Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Study Buddy Finder - Peer Learning */}
            <StudyBuddyFinder />

            {/* ActiveLearnersWidget - Real-time active learner awareness */}
            <ActiveLearnersWidget
              maxVisible={8}
              showBreakdown={true}
              refreshInterval={30000}
              compact={false}
            />

            {/* Placeholder for balance - will be filled by other social features */}
            <div className="hidden lg:block" />
          </div>

          {/* Peer Learning Hub - Collaborative Learning (Full Width) */}
          <div className="mt-6">
            <PeerLearningHub />
          </div>

          {/* ============================================================= */}
          {/* GAP 1: Hidden Capabilities Now Exposed */}
          {/* ============================================================= */}

          {/* Learning Path Optimizer - Personalized pathway recommendations */}
          <div className="mt-6">
            <LearningPathOptimizer
              userId={user.id ?? ""}
              courseId=""
              className="w-full"
            />
          </div>

          {/* Metacognition & Behavior Analysis Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* MetacognitionPanel - Self-reflection and study habit analysis */}
            <MetacognitionPanel className="w-full" />

            {/* BehaviorPatternsWidget - Detected learning behavior patterns */}
            <BehaviorPatternsWidget
              maxPatterns={5}
              showDetect={true}
              compact={false}
            />
          </div>

          {/* Memory Search & Trends Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* MemorySearchPanel - Search past learning memories */}
            <MemorySearchPanel
              showFilters={true}
              maxResults={10}
              compact={false}
            />

            {/* TrendsExplorer - Industry trends and skill demand insights */}
            <TrendsExplorer compact={false} />
          </div>

          {/* ============================================================= */}
          {/* PHASE 5: Market Integration - Career Progress */}
          {/* ============================================================= */}

          {/* Career Progress & Portfolio Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* CareerProgressWidget - Certifications, portfolio & career readiness */}
            <CareerProgressWidget
              compact={false}
              onViewCertifications={() => console.log("View certifications")}
              onViewPortfolio={() => console.log("View portfolio")}
              onAddProject={() => console.log("Add project")}
            />

            {/* CertificationProgressWidget - Quick certification tracking overview */}
            <CertificationProgressWidget
              compact={false}
              maxItems={3}
              onViewAll={() => setDashboardView("skills")}
              onStartNew={() => setDashboardView("skills")}
            />
          </div>

          {/* ============================================================= */}
          {/* PHASE 4: Portfolio Export - Export & Share Learning Portfolio */}
          {/* ============================================================= */}

          {/* Portfolio Export - Export portfolios in multiple formats */}
          <div className="mt-6">
            <PortfolioExport
              compact={false}
              defaultTab="preview"
            />
          </div>

          {/* ============================================================= */}
          {/* PHASE 2: Safety & Accessibility Monitoring */}
          {/* ============================================================= */}

          {/* Safety & Accessibility Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* AccessibilityMetricsWidget - Readability and accessibility insights */}
            <AccessibilityMetricsWidget
              className="min-h-[300px]"
            />

            {/* DiscouragingLanguageAlert - Content sentiment monitoring */}
            <DiscouragingLanguageAlert
              className="min-h-[300px]"
            />
          </div>

          {/* ============================================================= */}
          {/* GAP 3: Previously Orphaned Components Now Integrated */}
          {/* ============================================================= */}

          {/* Social Learning & Collaboration Section */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* SocialLearningFeed - Community engagement and achievement sharing */}
            <SocialLearningFeed
              compact={false}
              onPostClick={(post) => console.log("Post clicked:", post)}
              onChallengeJoin={(challengeId) =>
                console.log("Joining challenge:", challengeId)
              }
            />

            {/* CollaborationSpace - Real-time collaborative workspace */}
            <CollaborationSpace
              compact={false}
              onJoinSession={(sessionId) =>
                console.log("Joining session:", sessionId)
              }
              onCreateResource={(type) =>
                console.log("Creating resource:", type)
              }
            />
          </div>

          {/* ============================================================= */}
          {/* PHASE 4: Study Buddy Chat - Real-time Collaborative Sessions */}
          {/* ============================================================= */}

          {/* Study Buddy Chat - Full Width Real-time Chat & Sessions */}
          <div className="mt-8">
            <StudyBuddyChat
              className="h-[600px] w-full"
              showBuddyFinder={true}
            />
          </div>

          {/* ============================================================= */}
          {/* PHASE 4: Course Insights - AI-Powered Per-Course Analytics */}
          {/* ============================================================= */}

          {/* Course Insights - Detailed per-course learning analytics */}
          <div className="mt-8">
            <CourseInsights
              showHeader={true}
              showFilters={true}
              showOverview={true}
              maxCourses={6}
            />
          </div>

          {/* ============================================================= */}
          {/* GAP 2: Underutilized React Hooks - Now Connected */}
          {/* These widgets expose the powerful @sam-ai/react hooks */}
          {/* ============================================================= */}

          {/* Socratic Dialogue & Adaptive Learning Row */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* SocraticDialogueWidget - Learn through guided questioning */}
            <SocraticDialogueWidget
              courseId=""
              className="min-h-[400px]"
            />

            {/* AdaptiveContentWidget - Personalized learning style profile */}
            <AdaptiveContentWidget
              showTips={true}
              className="min-h-[400px]"
            />
          </div>

          {/* Practice Problems & Tutoring Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* PracticeProblemsWidget - AI-generated practice problems */}
            <PracticeProblemsWidget
              defaultTopic=""
              className="min-h-[400px]"
            />

            {/* TutoringOrchestrationWidget - Learning plan progress */}
            <TutoringOrchestrationWidget className="min-h-[400px]" />
          </div>

          {/* Realtime & Interventions Row */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* RealtimeCollaborationWidget - WebSocket connection status */}
            <RealtimeCollaborationWidget
              showEvents={true}
              maxEvents={10}
            />

            {/* UserInterventionsWidget - Proactive SAM interventions */}
            <UserInterventionsWidget
              maxVisible={3}
              enableSound={false}
            />
          </div>

          {/* Gap 2 Final: Notifications and Learning Recommendations (22/22 hooks complete) */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* NotificationsWidget - useNotifications hook */}
            <NotificationsWidget
              maxVisible={5}
              refreshInterval={60000}
            />

            {/* LearningRecommendationsWidget - useRecommendations hook */}
            <LearningRecommendationsWidget
              maxRecommendations={5}
              defaultAvailableTime={60}
              autoRefresh={true}
            />
          </div>
        </div>

        {/* SAM AI Assistant - Always available conversational mentor */}
        <SAMAssistantWrapper />

        {/* Gap 3: Tool Approval Dialog for SAM tool executions */}
        <ToolApprovalDialog
          request={pendingRequest}
          open={isToolApprovalOpen}
          onOpenChange={setToolApprovalOpen}
          onApprove={handleToolApprove}
          onDeny={handleToolDeny}
          isProcessing={isToolApprovalProcessing}
        />

        {/* Gap 3: Celebration Overlay for achievements */}
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={dismissCelebration}
        />
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

          {/* Practice Goals */}
          <div className="mb-6">
            <PracticeGoalSetter />
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

        {/* Gap 3: Tool Approval Dialog for SAM tool executions */}
        <ToolApprovalDialog
          request={pendingRequest}
          open={isToolApprovalOpen}
          onOpenChange={setToolApprovalOpen}
          onApprove={handleToolApprove}
          onDeny={handleToolDeny}
          isProcessing={isToolApprovalProcessing}
        />

        {/* Gap 3: Celebration Overlay for achievements */}
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={dismissCelebration}
        />
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

          {/* ============================================================= */}
          {/* GAP-10: Enhanced Knowledge Graph - Full Width Feature */}
          {/* ============================================================= */}

          {/* Enhanced Knowledge Graph Explorer - Full interactive experience */}
          <div className="mt-8">
            <EnhancedKnowledgeGraphExplorer
              height="700px"
              onConceptSelect={(conceptId) => console.log("Selected concept:", conceptId)}
              onStartLearning={(conceptIds) => console.log("Start learning:", conceptIds)}
            />
          </div>

          {/* Learning Path Builder & Prerequisite Analyzer - Side by Side */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Learning Path Builder - Interactive path generation */}
            <LearningPathBuilder
              courseId=""
              onConceptClick={(conceptId) => console.log("Concept clicked:", conceptId)}
              onStartLearning={(path) => console.log("Start path:", path)}
            />

            {/* Prerequisite Analyzer - Gap analysis visualization */}
            <PrerequisiteAnalyzer
              courseId=""
              onConceptClick={(conceptId) => console.log("Prerequisite clicked:", conceptId)}
            />
          </div>

          {/* SAM AI Engine Widgets Section */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Knowledge Graph Browser - Basic view for quick reference */}
            <KnowledgeGraphBrowser />

            {/* Quality Score Dashboard - Content quality metrics */}
            <QualityScoreDashboard />
          </div>

          {/* Gap 1: Bias Detection Report - Fairness Analysis (Full Width) */}
          <div className="mt-8">
            <BiasDetectionReport className="w-full" />
          </div>

          {/* ============================================================= */}
          {/* GAP-6: Certification Tracking & Skill Mapping */}
          {/* ============================================================= */}

          {/* Certification Tracker - Full certification pathway management */}
          <div className="mt-8">
            <CertificationTracker
              onCertificationStart={(certId) => console.log("Started tracking:", certId)}
              onCertificationComplete={(certId) => console.log("Completed:", certId)}
            />
          </div>

          {/* Skill to Certification Map - Visual skill-to-cert relationships */}
          <div className="mt-8">
            <SkillToCertificationMap
              userId={user.id ?? ""}
              onCertificationSelect={(certId) => console.log("Selected cert:", certId)}
              compact={false}
            />
          </div>

          {/* ============================================================= */}
          {/* GAP 3: Previously Orphaned Components Now Integrated */}
          {/* ============================================================= */}

          {/* Research & Academic Integrity Section */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ResearchAssistant - Academic research and citation management */}
            <ResearchAssistant userId={user.id ?? ""} className="w-full" />

            {/* IntegrityChecker - Academic integrity verification */}
            <IntegrityChecker className="w-full" />
          </div>
        </div>

        {/* SAM AI Assistant - Always available conversational mentor */}
        <SAMAssistantWrapper />

        {/* Gap 3: Tool Approval Dialog for SAM tool executions */}
        <ToolApprovalDialog
          request={pendingRequest}
          open={isToolApprovalOpen}
          onOpenChange={setToolApprovalOpen}
          onApprove={handleToolApprove}
          onDeny={handleToolDeny}
          isProcessing={isToolApprovalProcessing}
        />

        {/* Gap 3: Celebration Overlay for achievements */}
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={dismissCelebration}
        />
      </div>
    );
  }

  // Gaps view with Learning Gap Analysis Dashboard
  if (dashboardView === "gaps") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/30 dark:from-slate-900 dark:via-red-900/10 dark:to-orange-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />
        <ViewToggle />

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
          {/* Learning Gap Dashboard */}
          <LearningGapDashboard />
        </div>

        {/* SAM AI Assistant - Always available conversational mentor */}
        <SAMAssistantWrapper />

        {/* Gap 3: Tool Approval Dialog for SAM tool executions */}
        <ToolApprovalDialog
          request={pendingRequest}
          open={isToolApprovalOpen}
          onOpenChange={setToolApprovalOpen}
          onApprove={handleToolApprove}
          onDeny={handleToolDeny}
          isProcessing={isToolApprovalProcessing}
        />

        {/* Gap 3: Celebration Overlay for achievements */}
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={dismissCelebration}
        />
      </div>
    );
  }

  // Innovation view with InnovationEngine features (Cognitive Fitness, Learning DNA, Study Buddy AI, Quantum Paths)
  if (dashboardView === "innovation") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-yellow-50/30 to-orange-50/30 dark:from-slate-900 dark:via-yellow-900/10 dark:to-orange-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />
        <ViewToggle />

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
          {/* Innovation Dashboard - All 4 InnovationEngine features */}
          <InnovationDashboard userId={user.id} />
        </div>

        {/* SAM AI Assistant - Always available conversational mentor */}
        <SAMAssistantWrapper />

        {/* Gap 3: Tool Approval Dialog for SAM tool executions */}
        <ToolApprovalDialog
          request={pendingRequest}
          open={isToolApprovalOpen}
          onOpenChange={setToolApprovalOpen}
          onApprove={handleToolApprove}
          onDeny={handleToolDeny}
          isProcessing={isToolApprovalProcessing}
        />

        {/* Gap 3: Celebration Overlay for achievements */}
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={dismissCelebration}
        />
      </div>
    );
  }

  // Discover view with Course Marketplace
  if (dashboardView === "discover") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/30 dark:from-slate-900 dark:via-cyan-900/10 dark:to-blue-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />
        <ViewToggle />

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
          {/* Course Marketplace - Browse and discover courses */}
          <CourseMarketplace
            showHeader={true}
            showFilters={true}
            onEnroll={(courseId) => {
              window.location.href = `/courses/${courseId}`;
            }}
          />
        </div>

        {/* SAM AI Assistant - Always available conversational mentor */}
        <SAMAssistantWrapper />

        {/* Gap 3: Tool Approval Dialog for SAM tool executions */}
        <ToolApprovalDialog
          request={pendingRequest}
          open={isToolApprovalOpen}
          onOpenChange={setToolApprovalOpen}
          onApprove={handleToolApprove}
          onDeny={handleToolDeny}
          isProcessing={isToolApprovalProcessing}
        />

        {/* Gap 3: Celebration Overlay for achievements */}
        <CelebrationOverlay
          celebration={celebration}
          onDismiss={dismissCelebration}
        />
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

      {/* Gap 3: Tool Approval Dialog for SAM tool executions */}
      <ToolApprovalDialog
        request={pendingRequest}
        open={isToolApprovalOpen}
        onOpenChange={setToolApprovalOpen}
        onApprove={handleToolApprove}
        onDeny={handleToolDeny}
        isProcessing={isToolApprovalProcessing}
      />

      {/* Gap 3: Celebration Overlay for achievements */}
      <CelebrationOverlay
        celebration={celebration}
        onDismiss={dismissCelebration}
      />
    </div>
  );
}
