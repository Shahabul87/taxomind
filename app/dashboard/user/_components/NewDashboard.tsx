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
}

export function NewDashboard({ user, viewMode, activeTab, onCreateStudyPlan, studyPlanRefreshKey, onCreateCoursePlan, coursePlanRefreshKey }: NewDashboardProps) {
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

  // Show Learning Command Center as the default view
  if (activeTab === "learning") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/10 dark:to-indigo-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        {/* Learning Command Center - Main Learning Hub */}
        <LearningCommandCenter user={user} onCreateStudyPlan={onCreateStudyPlan} />

        {/* SAM AI Learning Widgets Section */}
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-8 pt-20 sm:pt-4">
          {/* Quick Actions Bar */}
          <div className="mb-4 sm:mb-6">
            <SAMQuickActionsSafe />
          </div>

          {/* ============================================================= */}
          {/* PHASE 1: Assessment Studio - ExamEngine + EvaluationEngine */}
          {/* ============================================================= */}

          {/* Assessment Studio - Create exams, generate study guides */}
          <div className="mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Assessment Studio Card - Full exam building capabilities */}
            <AssessmentStudio
              courseId=""
              courseTitle="My Learning"
              userId={user.id ?? ""}
              compact={false}
              onExamCreated={(examId) => console.log("Exam created:", examId)}
            />

            {/* Study Guide Quick Access Card */}
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
                  userId={user.id ?? ""}
                  variant="button"
                />
                <StudyGuideGenerator
                  courseId=""
                  courseTitle="Quick Review"
                  userId={user.id ?? ""}
                  variant="compact"
                />
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* PHASE 2: Cognitive Analysis Hub - Unified Cognitive Intelligence */}
          {/* ============================================================= */}

          {/* Cognitive Analysis Hub - Combines load monitoring, metacognition, and knowledge graph */}
          <div className="mb-6">
            <CognitiveAnalysisHub
              userId={user.id ?? ""}
              sessionId={`dashboard-${user.id}`}
              defaultTab="overview"
            />
          </div>

          {/* ============================================================= */}
          {/* PHASE 3: Social Learning Hub - Unified Social Learning */}
          {/* ============================================================= */}

          {/* Social Learning Hub - Combines community feed, collaboration, and peer learning */}
          <div className="mb-6">
            <SocialLearningHub
              userId={user.id ?? ""}
              defaultTab="overview"
              onPostClick={(post) => console.log("Post clicked:", post)}
              onChallengeJoin={(challengeId) => console.log("Joining challenge:", challengeId)}
              onJoinSession={(sessionId) => console.log("Joining session:", sessionId)}
              onCreateResource={(type) => console.log("Creating resource:", type)}
            />
          </div>

          {/* ============================================================= */}
          {/* PHASE 4: Content & Adaptive Learning Hub - Personalized Learning */}
          {/* ============================================================= */}

          {/* Content Adaptive Hub - Combines content generation, adaptive learning, Socratic dialogue, and microlearning */}
          <div className="mb-6">
            <ContentAdaptiveHub
              userId={user.id ?? ""}
              defaultTab="overview"
              onContentGenerated={(content) => console.log("Content generated:", content)}
              onModuleStart={(moduleId) => console.log("Starting module:", moduleId)}
              onStyleDetected={(style) => console.log("Learning style detected:", style)}
            />
          </div>

          <div className="mb-6">
            <PersonalizationControlPanel />
          </div>

          {/* Primary SAM Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Spaced Repetition Calendar - Review Scheduling */}
            <div className="md:col-span-2 lg:col-span-2">
              <SpacedRepetitionCalendar />
            </div>

            {/* AI Recommendations - Personalized Learning */}
            <div className="md:col-span-1 lg:col-span-1">
              <RecommendationWidget />
            </div>
          </div>

          {/* ============================================================= */}
          {/* PHASE 2: Contextual Help - Smart Help System */}
          {/* ============================================================= */}

          {/* Help & Recommendations Row */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Contextual Help Widget - Smart contextual assistance */}
            <ContextualHelpWidget
              context="learning"
              showSearch={true}
              showShortcuts={true}
              maxItems={5}
              compact={false}
              className="md:col-span-1 lg:col-span-1"
            />

            {/* Placeholder for balance */}
            <div className="hidden md:col-span-1 lg:col-span-2 md:block" />
          </div>

          {/* Secondary Widgets Row */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          {/* PHASE 5: Career & Professional Growth Hub - Unified Career Development */}
          {/* ============================================================= */}

          {/* Career Growth Hub - Combines career tracking, certifications, portfolio, and skill mapping */}
          <div className="mt-6">
            <CareerGrowthHub
              userId={user.id ?? ""}
              defaultTab="overview"
              onCertificationSelect={(certId) => console.log("Certification selected:", certId)}
              onViewCertifications={() => setDashboardView("skills")}
              onViewPortfolio={() => console.log("View portfolio")}
              onAddProject={() => console.log("Add project")}
            />
          </div>

          {/* NOTE: PortfolioExport is now integrated into CareerGrowthHub above */}

          {/* ============================================================= */}
          {/* PHASE 6: Quality & Safety Hub - Unified Quality Assurance */}
          {/* ============================================================= */}

          {/* Quality & Safety Hub - Combines quality gates, bias detection, accessibility, and integrity */}
          <div className="mt-6">
            <QualitySafetyHub
              defaultTab="overview"
              onQualityValidated={(result) => console.log("Quality validated:", result)}
              onBiasDetected={(result) => console.log("Bias audit:", result)}
              onIntegrityChecked={(result) => console.log("Integrity checked:", result)}
            />
          </div>

          {/* ============================================================= */}
          {/* PHASE 7: Analytics & Observability Hub - Monitoring & Insights */}
          {/* ============================================================= */}

          {/* Analytics & Observability Hub - System health, behavior analysis, predictions, trends */}
          <div className="mt-6">
            <AnalyticsObservabilityHub
              defaultTab="overview"
              onPatternClick={(pattern) => console.log("Pattern clicked:", pattern)}
              onTrendClick={(trend) => console.log("Trend clicked:", trend)}
              onInterventionClick={(intervention) => console.log("Intervention clicked:", intervention)}
            />
          </div>

          {/* NOTE: StudyPlanningHub moved to Goals tab for unified goal management */}

          {/* ============================================================= */}
          {/* MISSING ENGINES NOW SURFACED - Previously Unwired Capabilities */}
          {/* ============================================================= */}

          {/* Predictive Analytics & SAM Comprehensive Analytics Row */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* PredictiveEngine - SAM Predictive Learning Analytics */}
            <div className="rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800/50">
              <PredictiveAnalyticsEnhanced user={user} />
            </div>

            {/* AnalyticsEngine - SAM Comprehensive Analytics Dashboard */}
            <div className="rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800/50">
              <SAMAnalyticsDashboard />
            </div>
          </div>

          {/* Financial Simulator Row */}
          <div className="mt-6">
            {/* FinancialEngine - Financial Literacy Simulations */}
            <FinancialSimulator
              userId={user.id ?? ""}
              className="w-full"
            />
          </div>

          {/* Multimodal Input Panel - Voice, Image, Handwriting, PDF */}
          <div className="mt-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-violet-500" />
                  Multimodal Input
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Upload images, record voice, draw handwriting, or submit PDFs for AI analysis
                </p>
              </div>
              <MultimodalInputPanel
                onInputProcessed={(result) => console.log("Multimodal input processed:", result)}
                onError={(error) => console.error("Multimodal input error:", error)}
                enabledModes={["voice", "image", "handwriting", "pdf"]}
                defaultMode="image"
                showSettings={true}
                compact={false}
              />
            </div>
          </div>

          {/* ============================================================= */}
          {/* GAP 3: Previously Orphaned Components Now Integrated */}
          {/* ============================================================= */}

          {/* Social Learning & Collaboration Section */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* PracticeProblemsWidget - AI-generated practice problems */}
            <PracticeProblemsWidget
              defaultTopic=""
              className="min-h-[400px]"
            />

            {/* TutoringOrchestrationWidget - Learning plan progress */}
            <TutoringOrchestrationWidget className="min-h-[400px]" />
          </div>

          {/* Realtime & Interventions Row */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

          {/* Learning Recommendations - AI-powered personalized suggestions */}
          <div className="mt-6">
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

  // ============================================================================
  // ANALYTICS TAB - Unified Learning Analytics (Merged from /dashboard/user/analytics)
  // ============================================================================
  if (activeTab === "analytics") {
    return (
      <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-indigo-900/10 dark:to-purple-900/10">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-8 pt-20 sm:pt-16">
          {/* Learning Analytics Dashboard - Full analytics experience */}
          <LearningAnalyticsDashboard
            defaultTab="overview"
            onExport={() => console.log("Export analytics")}
            onRefresh={() => console.log("Refresh analytics")}
          />

          {/* Self-Assessment Hub - Merged from assess tab */}
          <div className="mt-8">
            <SelfAssessmentHub userId={user.id ?? ""} />
          </div>

          {/* Quality & Calibration Metrics - Consolidated from Skills and Gamification tabs */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-8 pt-20 sm:pt-16">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 shadow-lg">
                <span className="text-3xl">🎯</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Goals & Milestones
                </h1>
                <p className="mt-2 text-base text-slate-600 dark:text-slate-300 font-medium">
                  Set, track, and achieve your learning objectives with AI-powered guidance
                </p>
              </div>
            </div>
          </div>

          {/* AI Study Plans - Personalized daily task tracking */}
          <div className="mb-8">
            <StudyPlansList
              key={studyPlanRefreshKey}
              onCreatePlan={onCreateStudyPlan}
              onTaskComplete={(taskId) => {
                // Dispatch custom event to notify GoalsProgress to refresh
                window.dispatchEvent(new CustomEvent('study-plan-task-updated', { detail: { taskId } }));
              }}
            />
          </div>

          {/* Course Creation Plans - For instructors planning to build courses */}
          <div className="mb-8">
            <CoursePlansList
              refreshKey={coursePlanRefreshKey}
              onCreatePlan={onCreateCoursePlan}
            />
          </div>

          {/* Goals Progress Overview */}
          <div className="mb-6">
            <GoalsProgress compact={false} />
          </div>

          {/* Study Planning Hub - Additional planning tools */}
          <div className="mt-6">
            <StudyPlanningHub
              defaultTab="overview"
              onReviewComplete={(conceptId, score) => console.log("Review completed:", conceptId, score)}
              onInsightSelect={(insight) => console.log("Insight selected:", insight)}
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
  if (activeTab === "practice") {
    return (
      <div className="relative min-h-full bg-slate-50 dark:bg-slate-900">
        {/* SAM Context Tracker - Invisible, syncs page context */}
        <SAMContextTracker />

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-8 pt-20 sm:pt-16">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
                <span className="text-3xl">🎯</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  10,000 Hour Practice Tracker
                </h1>
                <p className="mt-2 text-base text-slate-600 dark:text-slate-300 font-medium">
                  Track your deliberate practice journey to mastery with quality-adjusted hours
                </p>
              </div>
            </div>
          </div>

          {/* Streak Display */}
          <div className="mb-6">
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

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-8 pt-20 sm:pt-16">
          {/* Main Skill Tracker */}
          <SkillBuildTrackerConnected />

          {/* ============================================================= */}
          {/* GAP-10: Enhanced Knowledge Graph - Full Width Feature */}
          {/* ============================================================= */}

          {/* Enhanced Knowledge Graph Explorer - Full interactive experience */}
          <div className="mt-6 sm:mt-8">
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
          <div className="mt-6 sm:mt-8">
            {/* Knowledge Graph Browser - Basic view for quick reference */}
            <KnowledgeGraphBrowser />
            {/* NOTE: QualityScoreDashboard moved to Analytics tab */}
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
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-8 pt-20 sm:pt-16">
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

        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-8 pt-20 sm:pt-16">
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

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Wand2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Creator Studio
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  AI-powered tools to create courses, assessments, and learning content
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Content Generation Studio - Full AI Content Creation */}
          {/* ============================================================= */}

          <div className="mb-8">
            <ContentGenerationStudio />
          </div>

          {/* ============================================================= */}
          {/* Course Guide & Depth Analysis - Side by Side */}
          {/* ============================================================= */}

          <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Course Guide Builder */}
            <CourseGuideBuilder />

            {/* Content Depth Analyzer */}
            <DepthAnalyzer />
          </div>

          <div className="mb-8">
            <CreatorBusinessSuite />
          </div>

          {/* ============================================================= */}
          {/* Resource Intelligence - Discover External Learning Resources */}
          {/* ============================================================= */}

          <div className="mb-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
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

          <div className="mb-8">
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

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Gamification Section */}
        <section className="mb-6 sm:mb-8">
          {/* Level Progress Header */}
          <div className="mb-6">
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
