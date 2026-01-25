"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { User as NextAuthUser } from "next-auth";
import { ActivityStream } from "./ActivityStream";
import { EmptyState } from "./EmptyState";
import { useActivities } from "@/hooks/use-activities";
import { Loader2, Wand2 } from "lucide-react";

// Enhanced Gamification Components
import {
  LevelProgressBar,
  AchievementsWidget,
  LeaderboardWidget,
  StreakWidget,
} from "@/components/gamification";

// Learning Command Center
import { LearningCommandCenter } from "./learning-command-center";

// Learning Tabs Container - Sub-tab navigation for Learning view
import { LearningTabsContainer } from "./learning-tabs";

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

// Phase 6: Quality & Safety Hub - Unified Quality Assurance Experience
import { QualitySafetyHub } from "@/components/sam/quality-safety-hub";

// Phase 7: Analytics & Observability Hub - System Monitoring & Predictive Insights
import { AnalyticsObservabilityHub } from "@/components/sam/analytics-observability-hub";

// Phase 8: Study Planning & Memory Hub - Goals, Plans, Reviews, Memory
import { StudyPlanningHub } from "@/components/sam/study-planning-hub";

// Missing Engine Surfacing - Now Integrated
// PredictiveEngine - SAM predictive analytics
import { PredictiveAnalyticsEnhanced } from "./smart-dashboard/PredictiveAnalyticsEnhanced";

// AnalyticsEngine - Comprehensive SAM analytics dashboard
import { SAMAnalyticsDashboard } from "@/components/sam/sam-analytics-dashboard";

// FinancialEngine - Financial literacy simulations
import { FinancialSimulator } from "@/components/sam/FinancialSimulator";

// MultimodalInputEngine - Voice, image, handwriting, PDF inputs
// Using dynamic import with ssr: false to prevent hydration issues
const MultimodalInputPanel = dynamic(
  () => import("@/components/sam/multimodal/MultimodalInputPanel").then((mod) => mod.MultimodalInputPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        <span className="ml-2 text-sm text-slate-500">Loading Multimodal Input...</span>
      </div>
    ),
  }
);

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

// Gap 2 Final: Learning recommendations hook now connected
// NOTE: NotificationsWidget removed - notifications unified in header bell
import { LearningRecommendationsWidget } from "@/components/sam/LearningRecommendationsWidget";

// NOTE: NotificationCenterTrigger removed - now unified in header

// Phase 4: Study Buddy Chat - Real-time collaborative study sessions
import { StudyBuddyChat } from "@/components/sam/study-buddy-chat";

// Phase 4: Course Insights - AI-powered per-course analytics
import { CourseInsights } from "@/components/sam/course-insights";

// Phase 4: Portfolio Export - Export and share learning portfolios
import { PortfolioExport } from "@/components/sam/portfolio-export";

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

// Phase 5: Career & Professional Growth Hub - Unified Career Development Experience
import { CareerGrowthHub } from "@/components/sam/career-growth-hub";
import { CareerProgressWidget } from "@/components/sam/CareerProgressWidget";

// GAP-6: Certification Tracking Components
import {
  CertificationTracker,
  SkillToCertificationMap,
  CertificationProgressWidget,
} from "@/components/sam/certification";

// Innovation Dashboard - Hidden InnovationEngine Features Now Exposed
import { InnovationDashboard } from "@/components/sam/innovation";

// Phase 1: Assessment Studio - ExamEngine + EvaluationEngine Integration
import { AssessmentStudio } from "@/components/sam/assessment-studio";
import { StudyGuideGenerator } from "@/components/sam/study-guide/StudyGuideGenerator";

// Phase 0: Creator Studio - Content Generation, Course Guide, Depth Analysis
import {
  ContentGenerationStudio,
  CourseGuideBuilder,
  DepthAnalyzer,
  CreatorBusinessSuite,
} from "@/components/sam/creator-studio";

// Resource Intelligence (already exists)
import { ResourceIntelligenceContent } from "@/components/sam/resource-intelligence-content";

// Multimedia Library (already exists)
import { MultimediaLibrary } from "@/components/sam/MultimediaLibrary";

// Phase 2: Cognitive Analysis Hub - CognitiveLoadEngine + KnowledgeGraphEngine + MetacognitionEngine
import { CognitiveAnalysisHub } from "@/components/sam/cognitive-analysis-hub";

// Phase 3: Social Learning Hub - SocialEngine + CollaborationEngine + PeerLearningEngine
import { SocialLearningHub } from "@/components/sam/social-learning-hub";

// Phase 4: Content & Adaptive Learning Hub - ContentGenerationEngine + AdaptiveContentEngine + SocraticTeachingEngine + MicrolearningEngine
import { ContentAdaptiveHub } from "@/components/sam/content-adaptive-hub";
import { PersonalizationControlPanel } from "@/components/sam/personalization/PersonalizationControlPanel";

// Phase 9: Self-Assessment Hub - Standalone exam creation, taking, and results analysis
import { SelfAssessmentHub } from "@/components/sam/self-assessment-hub";

// Phase 10: Unified Analytics Dashboard - Merged from /analytics page
import { LearningAnalyticsDashboard } from "./learning-command-center/analytics";

// Phase 10: Unified Goals Tab - Merged from /goals page
import { GoalsProgress } from "./learning-command-center/analytics/GoalsProgress";

// AI Study Plans - Display saved study plans with daily task tracking
import { StudyPlansList } from "@/components/sam/study-plan";

// Course Creation Plans - Display course building plans
import { CoursePlansList } from "@/components/sam/course-plan";

// Blog Content Plans - Display blog publishing plans
import { BlogPlansList } from "@/components/sam/blog-plan";

// Study Session Scheduler - Smart session scheduling from study plans
import { StudySessionScheduler } from "@/components/sam/study-session";

// DashboardView type - now controlled by parent via UnifiedDashboardHeader
type DashboardView = "learning" | "analytics" | "skills" | "practice" | "gamification" | "goals" | "gaps" | "innovation" | "create";

interface NewDashboardProps {
  user: NextAuthUser;
  viewMode: "grid" | "list";
  activeTab: DashboardView;
  /** Callback to open the study plan modal */
  onCreateStudyPlan?: () => void;
  /** Key to trigger StudyPlansList refresh after creating a new plan */
  studyPlanRefreshKey?: number;
  /** Callback to open the course plan modal */
  onCreateCoursePlan?: () => void;
  /** Key to trigger CoursePlansList refresh after creating a new plan */
  coursePlanRefreshKey?: number;
  /** Callback to open the blog plan modal */
  onCreateBlogPlan?: () => void;
  /** Key to trigger BlogPlansList refresh after creating a new plan */
  blogPlanRefreshKey?: number;
}

export function NewDashboard({ user, viewMode, activeTab, onCreateStudyPlan, studyPlanRefreshKey, onCreateCoursePlan, coursePlanRefreshKey, onCreateBlogPlan, blogPlanRefreshKey }: NewDashboardProps) {
  // activeTab is now controlled by parent - no local state needed

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

  // NOTE: ViewToggle removed - navigation now handled by UnifiedDashboardHeader in parent

  // Show Learning Command Center as the default view with sub-tab navigation
  if (activeTab === "learning") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/10 dark:to-indigo-900/10">
        {/* Learning Tabs Container - Sub-tab navigation for better organization */}
        <LearningTabsContainer user={user} onCreateStudyPlan={onCreateStudyPlan} />

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

  // ============================================================================
  // ANALYTICS TAB - Unified Learning Analytics (Merged from /dashboard/user/analytics)
  // ============================================================================
  if (activeTab === "analytics") {
    return (
      <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-indigo-900/10 dark:to-purple-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
          {/* Learning Analytics Dashboard - Full analytics experience */}
          <LearningAnalyticsDashboard
            defaultTab="overview"
            onExport={() => console.log("Export analytics")}
            onRefresh={() => console.log("Refresh analytics")}
          />

          {/* Self-Assessment Hub - Merged from assess tab */}
          <div className="mt-6 sm:mt-8">
            <SelfAssessmentHub userId={user.id ?? ""} />
          </div>

          {/* Quality & Calibration Metrics - Consolidated from Skills and Gamification tabs */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Quality Score Dashboard - Content quality metrics */}
            <QualityScoreDashboard />

            {/* Confidence Calibration - AI Quality Metrics */}
            <ConfidenceCalibrationWidget />
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

  // ============================================================================
  // GOALS TAB - Unified Goals Management (Merged from /dashboard/user/goals)
  // ============================================================================
  if (activeTab === "goals") {
    return (
      <div className="relative min-h-full bg-slate-50 dark:bg-slate-900">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 shadow-lg flex-shrink-0">
                <span className="text-2xl sm:text-3xl">🎯</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Goals & Milestones
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
              onReviewComplete={(conceptId, score) => console.log("Review completed:", conceptId, score)}
              onInsightSelect={(insight) => console.log("Insight selected:", insight)}
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
  if (activeTab === "practice") {
    return (
      <div className="relative min-h-full bg-slate-50 dark:bg-slate-900">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex-shrink-0">
                <span className="text-2xl sm:text-3xl">🎯</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  10,000 Hour Practice Tracker
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                  Track your deliberate practice journey to mastery with quality-adjusted hours
                </p>
              </div>
            </div>
          </div>

          {/* Streak Display */}
          <div className="mb-4 sm:mb-6">
            <PracticeStreakDisplay variant="large" />
          </div>

          {/* Timer Section - Two Timers Side by Side */}
          <div className="mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Main Practice Timer */}
            <PracticeTimer />

            {/* Pomodoro Timer */}
            <PomodoroTimer />
          </div>

          {/* SAM Recommendations */}
          <div className="mb-4 sm:mb-6">
            <PracticeRecommendations limit={3} />
          </div>

          {/* Practice Goals */}
          <div className="mb-4 sm:mb-6">
            <PracticeGoalSetter />
          </div>

          {/* Calendar Heatmap - Full Width */}
          <div className="mb-4 sm:mb-6">
            <PracticeCalendarHeatmap />
          </div>

          {/* Leaderboard and Milestones Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
  if (activeTab === "skills") {
    return (
      <div className="relative min-h-full bg-slate-50 dark:bg-slate-900">
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
              onConceptSelect={(conceptId) => console.log("Selected concept:", conceptId)}
              onStartLearning={(conceptIds) => console.log("Start learning:", conceptIds)}
            />
          </div>

          {/* Learning Path Builder & Prerequisite Analyzer - Side by Side */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          {/* GAP-6: Certification Tracking & Skill Mapping */}
          {/* ============================================================= */}

          {/* Certification Tracker - Full certification pathway management */}
          <div className="mt-6 sm:mt-8">
            <CertificationTracker
              onCertificationStart={(certId) => console.log("Started tracking:", certId)}
              onCertificationComplete={(certId) => console.log("Completed:", certId)}
            />
          </div>

          {/* Skill to Certification Map - Visual skill-to-cert relationships */}
          <div className="mt-6 sm:mt-8">
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
          <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
  if (activeTab === "gaps") {
    return (
      <div className="relative min-h-full bg-slate-50 dark:bg-slate-900">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
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
  if (activeTab === "innovation") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-yellow-50/30 to-orange-50/30 dark:from-slate-900 dark:via-yellow-900/10 dark:to-orange-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
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

  // ============================================================================
  // PHASE 0: Create View - Creator Studio with Content Generation, Course Guide, Depth Analysis
  // Exposes creator tools to all Users (not just teachers)
  // ============================================================================
  if (activeTab === "create") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/30 dark:from-slate-900 dark:via-violet-900/10 dark:to-purple-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Wand2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Creator Studio
                </h1>
                <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  AI-powered tools to create courses, assessments, and learning content
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Content Generation Studio - Full AI Content Creation */}
          {/* ============================================================= */}

          <div className="mb-6 sm:mb-8">
            <ContentGenerationStudio />
          </div>

          {/* ============================================================= */}
          {/* Course Guide & Depth Analysis - Side by Side */}
          {/* ============================================================= */}

          <div className="mb-4 sm:mb-6 md:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Course Guide Builder */}
            <CourseGuideBuilder />

            {/* Content Depth Analyzer */}
            <DepthAnalyzer />
          </div>

          <div className="mb-6 sm:mb-8">
            <CreatorBusinessSuite />
          </div>

          {/* ============================================================= */}
          {/* Resource Intelligence - Discover External Learning Resources */}
          {/* ============================================================= */}

          <div className="mb-6 sm:mb-8">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800/50">
              <ResourceIntelligenceContent
                courseId=""
                chapterId=""
                sectionId=""
                sectionTitle="Learning Resources"
                courseTitle="My Learning Journey"
              />
            </div>
          </div>

          {/* ============================================================= */}
          {/* Multimedia Library - AI-Generated Media Assets */}
          {/* ============================================================= */}

          <div className="mb-6 sm:mb-8">
            <MultimediaLibrary
              userId={user.id ?? ""}
              className="w-full"
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

  // Gamification view (default for 'gamification' tab)
  return (
    <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pt-16 sm:pt-20">
        {/* Gamification Section */}
        <section className="mb-4 sm:mb-6 md:mb-8">
          {/* Level Progress Header */}
          <div className="mb-4 sm:mb-6">
            <LevelProgressBar />
          </div>

          {/* Gamification Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Streak Widget */}
            <div className="md:col-span-1 lg:col-span-1">
              <StreakWidget />
            </div>

            {/* Achievements Widget */}
            <div className="md:col-span-1 lg:col-span-2">
              <AchievementsWidget maxDisplay={6} />
            </div>
          </div>

          {/* SAM AI Achievements */}
          <div className="mt-4 sm:mt-6">
            <AchievementBadges limit={8} showLocked compact={false} />
          </div>

          {/* Leaderboard (Full Width) */}
          <div className="mt-4 sm:mt-6">
            <LeaderboardWidget maxDisplay={5} />
          </div>

          {/* SAM AI Learning Leaderboard */}
          <div className="mt-4 sm:mt-6">
            <SAMLeaderboardWidget
              limit={5}
              compact={false}
              showCurrentUserPosition={true}
            />
          </div>

          {/* SAM AI Advanced Analytics Row */}
          <div className="mt-4 sm:mt-6">
            {/* Competency Dashboard - Skill Mastery Tracking */}
            <CompetencyDashboard />
            {/* NOTE: ConfidenceCalibrationWidget moved to Analytics tab */}
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
