/**
 * Calibration Module
 *
 * Priority 6: Add Calibration Loop
 * Exports for continuous improvement through human feedback
 */

// Types
export type {
  // Sample types
  CalibrationSample,
  EvaluationContext,
  VersionInfo,
  // Human review types
  HumanReview,
  AdjustmentReason,
  // Drift analysis types
  DriftAnalysis,
  ContentTypeDrift,
  AdjustmentReasonCount,
  DriftRecommendation,
  // Calibration result types
  CalibrationResult,
  CalibrationAdjustment,
  CalibrationAlert,
  // Configuration types
  CalibrationConfig,
  AlertSettings,
  // Interface types
  CalibrationLoop,
  EvaluationSampleInput,
  DriftAnalysisOptions,
  CalibrationStatus,
  // Store types
  CalibrationSampleStore,
  SampleStatistics,
} from './types';

// Constants
export { DEFAULT_CALIBRATION_CONFIG } from './types';

// Sample Store
export {
  InMemorySampleStore,
  PrismaSampleStore,
  createInMemorySampleStore,
  createPrismaSampleStore,
  getDefaultSampleStore,
  resetDefaultSampleStore,
  type PrismaSampleStoreConfig,
} from './sample-store';

// Drift Analyzer
export {
  DriftAnalyzer,
  createDriftAnalyzer,
  createDriftAnalyzerFromCalibrationConfig,
  analyzeDrift,
  DEFAULT_DRIFT_ANALYZER_CONFIG,
  type DriftAnalyzerConfig,
} from './drift-analyzer';

// Calibrator
export {
  EvaluationCalibrator,
  createEvaluationCalibrator,
  createStrictCalibrator,
  createLenientCalibrator,
  getDefaultCalibrator,
  resetDefaultCalibrator,
  type CalibratorConfig,
  type CalibrationLogger,
} from './calibrator';
