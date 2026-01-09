/**
 * @sam-ai/agentic - Observability Module
 * Telemetry, metrics, and quality tracking for agentic behavior
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Tool Telemetry Types
  ToolExecutionEvent,
  ToolExecutionError,
  ToolMetrics,
  ToolExecutionStore,
  ToolExecutionQuery,

  // Memory Quality Types
  MemoryRetrievalEvent,
  MemoryFeedback,
  MemoryQualityMetrics,
  SourceMetrics,
  MemoryRetrievalStore,

  // Confidence Calibration Types
  ConfidencePrediction,
  ConfidenceOutcome,
  ConfidenceFactor,
  CalibrationMetrics,
  CalibrationBucket,
  TypeCalibration,
  ConfidencePredictionStore,

  // Plan Lifecycle Types
  PlanLifecycleEvent,
  PlanMetrics,
  PlanLifecycleStore,

  // Proactive Event Types
  ProactiveEvent,
  ProactiveResponse,
  ProactiveMetrics,
  ChannelMetrics,
  ProactiveEventStore,

  // Unified Metrics Types
  AgenticMetrics,
  SystemHealthMetrics,
  ComponentHealth,

  // Alert Types
  AlertRule,
  Alert,

  // Logger
  ObservabilityLogger,
} from './types';

export {
  // Tool Execution Status (renamed to avoid conflict with tool-registry)
  ToolExecutionStatus as TelemetryToolExecutionStatus,

  // Memory Sources (renamed to avoid conflict with memory module)
  MemorySource as TelemetryMemorySource,

  // Response Types (renamed to avoid conflict with other modules)
  ResponseType as TelemetryResponseType,

  // Verification Methods
  VerificationMethod,

  // Plan Event Types
  PlanEventType,

  // Proactive Event Types
  ProactiveEventType,

  // Health Status
  HealthStatus,

  // Alert Severity
  AlertSeverity,
} from './types';

// ============================================================================
// TOOL TELEMETRY
// ============================================================================

export {
  ToolTelemetry,
  createToolTelemetry,
  InMemoryToolExecutionStore,
  createInMemoryToolExecutionStore,
  DEFAULT_TOOL_TELEMETRY_CONFIG,
  type ToolTelemetryConfig,
} from './tool-telemetry';

// ============================================================================
// MEMORY QUALITY TRACKER
// ============================================================================

export {
  MemoryQualityTracker,
  createMemoryQualityTracker,
  InMemoryMemoryRetrievalStore,
  createInMemoryMemoryRetrievalStore,
  DEFAULT_MEMORY_QUALITY_CONFIG,
  type MemoryQualityConfig,
  type MemoryQualityAlert,
} from './memory-quality-tracker';

// ============================================================================
// CONFIDENCE CALIBRATION
// ============================================================================

export {
  ConfidenceCalibrationTracker,
  createConfidenceCalibrationTracker,
  InMemoryConfidencePredictionStore,
  createInMemoryConfidencePredictionStore,
  DEFAULT_CALIBRATION_CONFIG,
  type CalibrationConfig,
  type CalibrationSummary,
  type CalibrationAlert,
} from './confidence-calibration';

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

export {
  AgenticMetricsCollector,
  createAgenticMetricsCollector,
  InMemoryPlanLifecycleStore,
  createInMemoryPlanLifecycleStore,
  InMemoryProactiveEventStore,
  createInMemoryProactiveEventStore,
  DEFAULT_METRICS_COLLECTOR_CONFIG,
  type MetricsCollectorConfig,
  type QuickMetricsSummary,
} from './metrics-collector';

// ============================================================================
// EXPORTERS
// ============================================================================

export {
  RailwayMetricsExporter,
  getRailwayExporter,
  createRailwayExporter,
  logMetric,
  logToolExecution,
  logMemoryRetrieval,
  logConfidencePrediction,
  logPlanLifecycleEvent,
  type RailwayExporterConfig,
  type RailwayMetricLog,
  type RailwayEventLog,
} from './exporters';
