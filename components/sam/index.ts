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
