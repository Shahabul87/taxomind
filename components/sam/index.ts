/**
 * SAM Components Index
 * Exports all SAM AI Tutor components
 */

// ============================================================================
// CORE SAM COMPONENTS
// ============================================================================

export { SAMAssistant } from './SAMAssistant';
export { SAMContextTracker } from './SAMContextTracker';
export type { SAMContextTrackerProps } from './SAMContextTracker';

// SAM Quick Actions - useSAMActions hook integration
export { SAMQuickActions, DEFAULT_QUICK_ACTIONS } from './SAMQuickActions';
export type { SAMQuickActionsProps, QuickActionDefinition } from './SAMQuickActions';

export { SAMGlobalProvider } from './sam-global-provider';
export { SamErrorBoundary, SamErrorBoundary as SAMErrorBoundary, useSamErrorBoundary } from './sam-error-boundary';
export { SamLoadingState, SamLoadingState as SAMLoadingState, SamSuggestionLoading, SamValidationLoading, SamGenerationLoading, SamTitleGenerationLoading } from './sam-loading-state';
export { SamStandardsInfo, SamStandardsInfo as SAMStandardsInfo, SamStandardsBadge } from './sam-standards-info';

// ============================================================================
// CONTENT & ANALYSIS COMPONENTS
// ============================================================================

export { ContentAnalysisResults } from './content-analysis-results';
export { ResourceIntelligenceContent } from './resource-intelligence-content';
export { SAMEnginePoweredChat } from './sam-engine-powered-chat';

// ============================================================================
// COURSE CREATION COMPONENTS
// ============================================================================

export { CourseCreationProgress } from './course-creation-progress';
export { SequentialCreationModal } from './sequential-creation-modal';

// ============================================================================
// FORM & SYNC COMPONENTS
// ============================================================================

export { FormSyncWrapper } from './form-sync-wrapper';

// ============================================================================
// ANALYTICS COMPONENTS
// ============================================================================

export { SAMAnalyticsDashboard } from './sam-analytics-dashboard';

// ============================================================================
// PHASE 5: AGENTIC AI COMPONENTS
// ============================================================================

export { GoalPlanner } from './goal-planner';
export { default as GoalPlannerDefault } from './goal-planner';

export { RecommendationWidget } from './recommendation-widget';
export { default as RecommendationWidgetDefault } from './recommendation-widget';

export { NotificationBell } from './notification-bell';
export { default as NotificationBellDefault } from './notification-bell';

export { ProgressDashboard } from './progress-dashboard';
export { default as ProgressDashboardDefault } from './progress-dashboard';

// ============================================================================
// PHASE 3: ENHANCEMENT COMPONENTS
// ============================================================================

// Knowledge Graph
export { KnowledgeGraphBrowser } from './KnowledgeGraphBrowser';
export { default as KnowledgeGraphBrowserDefault } from './KnowledgeGraphBrowser';

// Prerequisite Tree View - Hierarchical view of concept prerequisites
export { PrerequisiteTreeView } from './PrerequisiteTreeView';
export { default as PrerequisiteTreeViewDefault } from './PrerequisiteTreeView';

// Learning Path Timeline - Chronological progress visualization
export { LearningPathTimeline } from './LearningPathTimeline';
export { default as LearningPathTimelineDefault } from './LearningPathTimeline';

// Quality & Calibration
export { QualityScoreDashboard } from './QualityScoreDashboard';
export { ConfidenceCalibrationWidget } from './ConfidenceCalibrationWidget';

// Spaced Repetition
export { SpacedRepetitionCalendar, SpacedRepetitionWidget } from './SpacedRepetitionCalendar';

// Conversation & Timeline
export { ConversationTimeline } from './ConversationTimeline';

// Pedagogy & Learning Path
export { ScaffoldingStrategyPanel } from './ScaffoldingStrategyPanel';
export { LearningPathOptimizer } from './LearningPathOptimizer';

// Safety & Fairness
export { BiasDetectionReport } from './BiasDetectionReport';
export { default as BiasDetectionReportDefault } from './BiasDetectionReport';

// Accessibility Metrics Widget - Readability and text complexity analysis
export { AccessibilityMetricsWidget } from './AccessibilityMetricsWidget';
export { default as AccessibilityMetricsWidgetDefault } from './AccessibilityMetricsWidget';

// Discouraging Language Alert - Detects harmful language in feedback
export { DiscouragingLanguageAlert } from './DiscouragingLanguageAlert';
export { default as DiscouragingLanguageAlertDefault } from './DiscouragingLanguageAlert';

// Cognitive Load Monitoring
export { CognitiveLoadMonitor } from './CognitiveLoadMonitor';
export { default as CognitiveLoadMonitorDefault } from './CognitiveLoadMonitor';

// ============================================================================
// MEMORY COMPONENTS
// ============================================================================

export {
  MemorySearchPanel,
  ConversationHistory,
  MemoryInsightsWidget,
} from './memory';

// ============================================================================
// BEHAVIOR COMPONENTS
// ============================================================================

export {
  BehaviorPatternsWidget,
  StruggleDetectionAlert,
  LearningStyleIndicator,
} from './behavior';

// ============================================================================
// PRESENCE COMPONENTS
// ============================================================================

export {
  PresenceIndicator,
  ActiveLearnersWidget,
  StudyStatusBadge,
  ConnectedStudyStatusBadge,
  PresenceTrackingProvider,
  usePresenceTracking,
  usePresenceTrackingOptional,
} from './presence';

// ============================================================================
// RECOMMENDATIONS COMPONENTS
// ============================================================================

export {
  RecommendationCard,
  RecommendationTimeline,
  RecommendationReasonDisplay,
} from './recommendations';

// ============================================================================
// PLAN COMPONENTS
// ============================================================================

export {
  PlanControlPanel,
  PlanProgressTracker,
  DailyPlanWidget,
} from './plans';

// ============================================================================
// CONFIDENCE COMPONENTS
// ============================================================================

export {
  ConfidenceIndicator,
  SelfCritiquePanel,
  CalibrationChart,
} from './confidence';

// ============================================================================
// OBSERVABILITY COMPONENTS (Admin)
// ============================================================================

export {
  SAMHealthDashboard,
  ToolExecutionLog,
  QualityMetricsPanel,
} from './observability';

// ============================================================================
// META-LEARNING & LEARNING PATH COMPONENTS
// ============================================================================

export { MetaLearningInsightsWidget } from './MetaLearningInsightsWidget';
export { default as MetaLearningInsightsWidgetDefault } from './MetaLearningInsightsWidget';

export { LearningPathWidget } from './LearningPathWidget';
export { default as LearningPathWidgetDefault } from './LearningPathWidget';

// ============================================================================
// PHASE 3: FULL POWER ENGINE COMPONENTS
// ============================================================================

// Microlearning
export { MicrolearningWidget } from './MicrolearningWidget';
export { default as MicrolearningWidgetDefault } from './MicrolearningWidget';

// Metacognition
export { MetacognitionPanel } from './MetacognitionPanel';
export { default as MetacognitionPanelDefault } from './MetacognitionPanel';

// Competency
export { CompetencyDashboard } from './CompetencyDashboard';
export { default as CompetencyDashboardDefault } from './CompetencyDashboard';

// Peer Learning
export { PeerLearningHub } from './PeerLearningHub';
export { default as PeerLearningHubDefault } from './PeerLearningHub';

// Integrity
export { IntegrityChecker } from './IntegrityChecker';
export { default as IntegrityCheckerDefault } from './IntegrityChecker';

// Predictive Insights
export { PredictiveInsights } from './PredictiveInsights';
export { default as PredictiveInsightsDefault } from './PredictiveInsights';

// Trends Explorer
export { TrendsExplorer } from './TrendsExplorer';
export { default as TrendsExplorerDefault } from './TrendsExplorer';

// Collaboration Space
export { CollaborationSpace } from './CollaborationSpace';
export { default as CollaborationSpaceDefault } from './CollaborationSpace';

// Social Learning Feed
export { SocialLearningFeed } from './SocialLearningFeed';
export { default as SocialLearningFeedDefault } from './SocialLearningFeed';

// Innovation Lab
export { InnovationLab } from './InnovationLab';
export { default as InnovationLabDefault } from './InnovationLab';

// Multimedia Library
export { MultimediaLibrary } from './MultimediaLibrary';
export { default as MultimediaLibraryDefault } from './MultimediaLibrary';

// Financial Simulator
export { FinancialSimulator } from './FinancialSimulator';
export { default as FinancialSimulatorDefault } from './FinancialSimulator';

// Research Assistant
export { ResearchAssistant } from './ResearchAssistant';
export { default as ResearchAssistantDefault } from './ResearchAssistant';

// ============================================================================
// ORCHESTRATION & CHECK-IN COMPONENTS
// ============================================================================

// Check-In Modal
export { CheckInModal } from './CheckInModal';
export type {
  CheckInData,
  CheckInResponse,
  CheckInType,
  CheckInQuestion,
  CheckInAction,
} from './CheckInModal';

// Check-In History
export { CheckInHistory } from './CheckInHistory';
export type { CheckInHistoryItem, CheckInHistoryProps } from './CheckInHistory';

// Orchestration Panel (integrates StepProgressBar and PlanStepCard)
export { OrchestrationPanel } from './OrchestrationPanel';
export type { OrchestrationPanelProps, OrchestrationResult, LearningPlanProgress } from './OrchestrationPanel';

// ============================================================================
// PROGRESS & ACHIEVEMENT COMPONENTS
// ============================================================================

// Step Progress Bar
export { StepProgressBar } from './StepProgressBar';
export type { Step, StepStatus, StepProgressBarProps } from './StepProgressBar';

// Plan Step Card
export { PlanStepCard } from './PlanStepCard';
export type {
  PlanStep,
  PlanStepCardProps,
  StepDifficulty,
  StepType,
  Resource,
} from './PlanStepCard';

// Achievement Badges
export { AchievementBadges } from './AchievementBadges';
export type {
  Achievement,
  AchievementBadgesProps,
  BadgeRarity,
  BadgeCategory,
} from './AchievementBadges';

// ============================================================================
// STUDY BUDDY & SOCIAL LEARNING COMPONENTS
// ============================================================================

// Study Buddy Finder
export { StudyBuddyFinder } from './StudyBuddyFinder';
export type {
  StudyBuddy,
  StudyBuddyFinderProps,
  BuddyStatus,
  MatchReason,
} from './StudyBuddyFinder';

// ============================================================================
// GAMIFICATION COMPONENTS
// ============================================================================

// Leaderboard Widget
export { LeaderboardWidget } from './LeaderboardWidget';
export type {
  LeaderboardEntry,
  LeaderboardWidgetProps,
  LeaderboardPeriod,
  LeaderboardScope,
} from './LeaderboardWidget';

// ============================================================================
// CELEBRATION & GAMIFICATION COMPONENTS
// ============================================================================

// Celebration Overlay - Animated celebration for achievements
export { CelebrationOverlay, useCelebration, MiniCelebration } from './CelebrationOverlay';
export type {
  CelebrationType,
  CelebrationData,
} from './CelebrationOverlay';

// ============================================================================
// TOOL APPROVAL & SAFETY COMPONENTS
// ============================================================================

// Tool Approval Dialog - Permission dialog for SAM tool executions
export { ToolApprovalDialog, useToolApproval } from './ToolApprovalDialog';
export type {
  ToolApprovalRequest,
  ToolApprovalDialogProps,
  RiskLevel,
  ToolCategory,
  UseToolApprovalOptions,
} from './ToolApprovalDialog';

// ============================================================================
// GAP 2: UNDERUTILIZED REACT HOOKS - NOW CONNECTED
// These widgets expose the powerful @sam-ai/react hooks
// ============================================================================

// Practice Problems Widget - useSAMPracticeProblems hook
export { PracticeProblemsWidget } from './PracticeProblemsWidget';
export { default as PracticeProblemsWidgetDefault } from './PracticeProblemsWidget';

// Adaptive Content Widget - useSAMAdaptiveContent hook
export { AdaptiveContentWidget } from './AdaptiveContentWidget';
export { default as AdaptiveContentWidgetDefault } from './AdaptiveContentWidget';

// Socratic Dialogue Widget - useSAMSocraticDialogue hook
export { SocraticDialogueWidget } from './SocraticDialogueWidget';
export { default as SocraticDialogueWidgetDefault } from './SocraticDialogueWidget';

// Tutoring Orchestration Widget - useTutoringOrchestration hook
export { TutoringOrchestrationWidget } from './TutoringOrchestrationWidget';
export { default as TutoringOrchestrationWidgetDefault } from './TutoringOrchestrationWidget';

// Realtime Collaboration Widget - useRealtime hook
export { RealtimeCollaborationWidget } from './RealtimeCollaborationWidget';
export { default as RealtimeCollaborationWidgetDefault } from './RealtimeCollaborationWidget';

// User Interventions Widget - useInterventions hook
export { UserInterventionsWidget } from './UserInterventionsWidget';
export { default as UserInterventionsWidgetDefault } from './UserInterventionsWidget';

// Notifications Widget - useNotifications hook
export { NotificationsWidget } from './NotificationsWidget';
export { default as NotificationsWidgetDefault } from './NotificationsWidget';

// Learning Recommendations Widget - useRecommendations hook
export { LearningRecommendationsWidget } from './LearningRecommendationsWidget';
export { default as LearningRecommendationsWidgetDefault } from './LearningRecommendationsWidget';

// ============================================================================
// LEARNING GAP ANALYSIS COMPONENTS
// ============================================================================

export {
  LearningGapDashboard,
  LearningGapDashboardDefault,
  GapOverviewWidget,
  GapOverviewWidgetDefault,
  SkillDecayTracker,
  SkillDecayTrackerDefault,
  TrendAnalysisChart,
  TrendAnalysisChartDefault,
  PersonalizedRecommendations,
  PersonalizedRecommendationsDefault,
  ComparisonView,
  ComparisonViewDefault,
  useLearningGaps,
  useLearningGapsDefault,
} from './learning-gap';

export type {
  // Learning Gap Types
  GapSeverity,
  GapStatus,
  DecayRiskLevel,
  TrendDirection,
  LearningGapEvidence,
  GapAction,
  LearningGapData,
  DecayPrediction,
  SkillDecayData,
  TrendMetricPoint,
  TrendMetric,
  TrendInsight,
  TrendAnalysisData,
  GapRecommendation,
  ComparisonMetric,
  ComparisonInsight,
  ComparisonData,
  GapSummary,
  LearningGapDashboardData,
  LearningGapDashboardProps,
  GapOverviewWidgetProps,
  SkillDecayTrackerProps,
  TrendAnalysisChartProps,
  PersonalizedRecommendationsProps,
  ComparisonViewProps,
} from './learning-gap';
