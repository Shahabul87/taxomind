/**
 * Monitoring System Type Definitions
 * Shared types across monitoring components
 */

// Re-export types from individual modules
export type { 
  HealthCheckResult,
  SystemHealth,
  ResourceHealth,
  DependencyHealth,
  HealthMetrics,
  HealthStatus,
} from './health';

export type {
  BusinessMetrics,
  TechnicalMetrics,
} from './metrics';

export type {
  Alert,
  AlertRule,
  AlertCondition,
  AlertAction,
  AlertSeverity,
  AlertCategory,
} from './alerting';

export type {
  DashboardConfig,
  DashboardWidget,
  TimeSeriesData,
  DataPoint,
  DashboardType,
  WidgetType,
} from './dashboard';

export type {
  Incident,
  IncidentEvent,
  RemediationResult,
  RemediationRule,
  RemediationCondition,
  IncidentSeverity,
  IncidentStatus,
  RemediationAction,
} from './incident-response';