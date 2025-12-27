/**
 * Enhanced Orchestrator Module
 *
 * Priority 4: Wire Engines into Orchestrator
 * Integrates quality gates and Bloom's alignment into the content pipeline
 */

// Types
export type {
  BloomsLevel,
  BloomsDistribution,
  BloomsAnalysis,
  ValidatableContentType,
  OrchestratedRequest,
  OrchestratedResponse,
  OrchestratedMetadata,
  OrchestratedError,
  BloomsAlignmentResult,
  BloomsAdjustment,
  PreGenerationHook,
  PostGenerationHook,
  PostValidationHook,
  ValidationFailureHook,
  BloomsAlignmentFailureHook,
  ContentEnhancer,
  BloomsAnalyzer,
  EnhancedOrchestratorConfig,
} from './types';

// Constants and utilities
export {
  DEFAULT_ORCHESTRATOR_CONFIG,
  BLOOMS_LEVEL_ORDER,
  getBloomsLevelIndex,
  calculateBloomsDistance,
  isBloomsAligned,
} from './types';

// Enhanced Orchestrator
export {
  EnhancedOrchestrator,
  createEnhancedOrchestrator,
  createSimpleOrchestrator,
  createStrictOrchestrator,
} from './enhanced-orchestrator';
