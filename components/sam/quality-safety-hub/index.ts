/**
 * Quality & Safety Hub Components
 *
 * Phase 6 of the engine merge plan - integrating QualityGatesEngine,
 * FairnessAuditor, AccessibilityChecker, and IntegrityEngine into a
 * cohesive quality assurance hub.
 *
 * @module components/sam/quality-safety-hub
 */

export { QualitySafetyHub } from "./QualitySafetyHub";
export type { QualitySafetyHubProps } from "./QualitySafetyHub";

// Re-export related components for convenience
export { QualityScoreDashboard } from "../QualityScoreDashboard";
export { BiasDetectionReport } from "../BiasDetectionReport";
export { AccessibilityMetricsWidget } from "../AccessibilityMetricsWidget";
export { DiscouragingLanguageAlert } from "../DiscouragingLanguageAlert";
export { IntegrityChecker } from "../IntegrityChecker";
