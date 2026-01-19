/**
 * Analytics & Observability Hub Components
 *
 * Phase 7 of the engine merge plan - integrating analytics, observability,
 * and prediction engines into a cohesive monitoring and insights hub.
 *
 * @module components/sam/analytics-observability-hub
 */

export { AnalyticsObservabilityHub } from "./AnalyticsObservabilityHub";
export type { AnalyticsObservabilityHubProps } from "./AnalyticsObservabilityHub";

// Re-export related components for convenience
export { SAMHealthDashboard } from "../observability/SAMHealthDashboard";
export { ToolExecutionLog } from "../observability/ToolExecutionLog";
export { BehaviorPatternsWidget } from "../behavior/BehaviorPatternsWidget";
export { PredictiveInsights } from "../PredictiveInsights";
export { TrendsExplorer } from "../TrendsExplorer";
