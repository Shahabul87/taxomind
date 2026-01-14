/**
 * SAM Components Index
 * Exports all SAM AI Tutor components
 */

// ============================================================================
// CORE SAM COMPONENTS
// ============================================================================

export { SAMAssistant } from './SAMAssistant';

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
