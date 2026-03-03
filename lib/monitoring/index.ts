/**
 * Monitoring System Main Entry Point
 * Centralized monitoring and observability system
 */

import { initTelemetry, shutdownTelemetry } from './telemetry';
import { APMCollector, apmMiddleware, monitorDatabaseQuery, monitorCacheOperation } from './apm';
import { 
  TransactionTracer, 
  DatabaseTracer, 
  CacheTracer, 
  HttpTracer, 
  AITracer,
  TracePropagation,
  Trace 
} from './tracing';
import { MetricsCollector, MetricsAggregator } from './metrics';
import { AlertManager, AlertSeverity, AlertCategory } from './alerting';
import { HealthMonitor, handleHealthCheck, handleLivenessProbe, handleReadinessProbe } from './health';
import { DashboardManager } from './dashboard';
import { IncidentResponseManager } from './incident-response';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { logger } from '@/lib/logger';

/**
 * Monitoring system instance
 */
class MonitoringSystem {
  private static instance: MonitoringSystem;
  private sdk: NodeSDK | null = null;
  private initialized = false;
  
  private apmCollector: APMCollector;
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;
  private healthMonitor: HealthMonitor;
  private dashboardManager: DashboardManager;
  private incidentManager: IncidentResponseManager;
  
  private constructor() {
    this.apmCollector = APMCollector.getInstance();
    this.metricsCollector = MetricsCollector.getInstance();
    this.alertManager = AlertManager.getInstance();
    this.healthMonitor = HealthMonitor.getInstance();
    this.dashboardManager = DashboardManager.getInstance();
    this.incidentManager = IncidentResponseManager.getInstance();
  }
  
  public static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }
  
  /**
   * Initialize monitoring system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Initialize OpenTelemetry
      this.sdk = initTelemetry();
      
      // Set up alert listeners
      this.setupAlertListeners();
      
      // Set up health check listeners
      this.setupHealthListeners();
      
      // Set up incident response listeners
      this.setupIncidentListeners();
      
      // Start metric collection
      await this.startMetricCollection();
      
      this.initialized = true;
      logger.info('Monitoring system initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize monitoring system', error);
      throw error;
    }
  }
  
  /**
   * Shutdown monitoring system
   */
  public async shutdown(): Promise<void> {
    if (!this.initialized) return;
    
    try {
      // Stop dashboard manager
      this.dashboardManager.stop();
      
      // Stop health monitor
      this.healthMonitor.stop();
      
      // Shutdown OpenTelemetry
      if (this.sdk) {
        await shutdownTelemetry(this.sdk);
      }
      
      this.initialized = false;
      logger.info('Monitoring system shut down successfully');
    } catch (error) {
      logger.error('Error shutting down monitoring system', error);
    }
  }
  
  /**
   * Set up alert listeners
   */
  private setupAlertListeners(): void {
    // Listen for APM alerts (alertEmitter not implemented yet)
    // this.apmCollector.alertEmitter.on('alert', async (alert: any) => {
    //   await this.alertManager.evaluateMetric(
    //     alert.type.toLowerCase(),
    //     alert.value,
    //     { threshold: alert.threshold }
    //   );
    // });
    
    // Listen for metric alerts
    this.metricsCollector.getEmitter().on('metric', async (metric) => {
      await this.alertManager.evaluateMetric(
        metric.name,
        metric.value,
        metric.labels
      );
    });
  }
  
  /**
   * Set up health listeners
   */
  private setupHealthListeners(): void {
    this.healthMonitor.getEmitter().on('status_changed', (event) => {
      logger.info(`Health status changed: ${event.check} from ${event.previousStatus} to ${event.currentStatus}`);
      
      // Record health status change as metric
      this.metricsCollector.recordCustomMetric(
        `health_status_${event.check}`,
        event.currentStatus === 'healthy' ? 1 : 0,
        'gauge',
        { service: event.check }
      );
    });
    
    this.healthMonitor.getEmitter().on('critical_failure', async (event) => {
      logger.error(`Critical health failure: ${event.check}`, event.error);
      
      // Trigger critical alert
      await this.alertManager.evaluateMetric('health_critical',
        1,
        { service: event.check, error: event.error }
      );
    });
  }
  
  /**
   * Set up incident listeners
   */
  private setupIncidentListeners(): void {
    this.incidentManager.getEmitter().on('incident_created', (incident) => {
      logger.info(`Incident created: ${incident.id} - ${incident.title}`);
    });
    
    this.incidentManager.getEmitter().on('incident_resolved', (incident) => {
      logger.info(`Incident resolved: ${incident.id}`);
    });
    
    this.incidentManager.getEmitter().on('incident_escalated', (incident) => {
      logger.error(`Incident escalated: ${incident.id} to ${incident.severity}`);
    });
  }
  
  /**
   * Start metric collection
   */
  private async startMetricCollection(): Promise<void> {
    // Collect initial metrics
    await this.metricsCollector.collectBusinessMetrics();
    await this.metricsCollector.collectTechnicalMetrics();
    
    logger.info('Metric collection started');
  }
  
  /**
   * Get monitoring components
   */
  public getComponents() {
    return {
      apm: this.apmCollector,
      metrics: this.metricsCollector,
      alerts: this.alertManager,
      health: this.healthMonitor,
      dashboards: this.dashboardManager,
      incidents: this.incidentManager,
    };
  }
}

// Export singleton instance
export const monitoring = MonitoringSystem.getInstance();

// Export components
export {
  // APM
  APMCollector,
  apmMiddleware,
  monitorDatabaseQuery,
  monitorCacheOperation,
  
  // Tracing
  TransactionTracer,
  DatabaseTracer,
  CacheTracer,
  HttpTracer,
  AITracer,
  TracePropagation,
  Trace,
  
  // Metrics
  MetricsCollector,
  MetricsAggregator,
  
  // Alerting
  AlertManager,
  AlertSeverity,
  AlertCategory,
  
  // Health
  HealthMonitor,
  handleHealthCheck,
  handleLivenessProbe,
  handleReadinessProbe,
  
  // Dashboard
  DashboardManager,
  
  // Incident Response
  IncidentResponseManager,
};

// Export types
export type {
  // APM types
  HealthCheckResult,
  SystemHealth,
  ResourceHealth,
  DependencyHealth,
  HealthMetrics,
  
  // Metric types
  BusinessMetrics,
  TechnicalMetrics,
  
  // Alert types
  Alert,
  AlertRule,
  AlertCondition,
  AlertAction,
  
  // Dashboard types
  DashboardConfig,
  DashboardWidget,
  TimeSeriesData,
  DataPoint,
  
  // Incident types
  Incident,
  IncidentEvent,
  RemediationResult,
  RemediationRule,
} from './types';

/**
 * Initialize monitoring on application startup
 */
export async function initializeMonitoring(): Promise<void> {
  await monitoring.initialize();
}

/**
 * Shutdown monitoring on application shutdown
 */
export async function shutdownMonitoring(): Promise<void> {
  await monitoring.shutdown();
}