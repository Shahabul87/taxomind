/**
 * Bloom's Classification Calibration Module
 *
 * Phase 5: Confidence Calibration Learning Loop
 * Provides feedback collection, metrics calculation, and confidence calibration
 * for improving Bloom's Taxonomy classification accuracy over time.
 */

export {
  // Main class
  BloomsCalibrator,
  createBloomsCalibrator,

  // Types
  type BloomsFeedbackType,
  type BloomsFeedbackInput,
  type CalibrationMetrics,
  type CalibratedResult,
  type BloomsCalibratorConfig,
  type BloomsCalibratorStore,

  // Utility functions
  bloomsLevelToNumber,
  numberToBloomsLevel,
  hashContent,
} from './blooms-calibrator';
