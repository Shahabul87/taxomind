/**
 * Automated Incident Response System
 * Automated remediation and incident management
 */

import { AlertManager, Alert, AlertSeverity, AlertCategory } from './alerting';
import { HealthMonitor, HealthStatus } from './health';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Incident severity levels
 */
export enum IncidentSeverity {
  SEV1 = 'sev1', // Critical - Service down
  SEV2 = 'sev2', // Major - Service degraded
  SEV3 = 'sev3', // Minor - Non-critical issue
  SEV4 = 'sev4', // Low - Informational
}

/**
 * Incident status
 */
export enum IncidentStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  IDENTIFIED = 'identified',
  RESOLVING = 'resolving',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Remediation action types
 */
export enum RemediationAction {
  RESTART_SERVICE = 'restart_service',
  SCALE_UP = 'scale_up',
  SCALE_DOWN = 'scale_down',
  CLEAR_CACHE = 'clear_cache',
  RESET_CONNECTION_POOL = 'reset_connection_pool',
  ROTATE_LOGS = 'rotate_logs',
  ENABLE_RATE_LIMITING = 'enable_rate_limiting',
  DISABLE_FEATURE = 'disable_feature',
  FAILOVER = 'failover',
  ROLLBACK = 'rollback',
  CUSTOM_SCRIPT = 'custom_script',
}

/**
 * Incident definition
 */
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: AlertCategory;
  alerts: Alert[];
  startTime: Date;
  endTime?: Date;
  detectionMethod: string;
  impactedServices: string[];
  remediationActions: RemediationResult[];
  timeline: IncidentEvent[];
  assignee?: string;
  rootCause?: string;
  postmortem?: string;
}

/**
 * Incident event
 */
export interface IncidentEvent {
  timestamp: Date;
  type: string;
  description: string;
  actor: string;
  metadata?: Record<string, any>;
}

/**
 * Remediation result
 */
export interface RemediationResult {
  action: RemediationAction;
  timestamp: Date;
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Remediation rule
 */
export interface RemediationRule {
  id: string;
  name: string;
  description: string;
  condition: RemediationCondition;
  actions: RemediationAction[];
  cooldown: number; // Minutes
  maxRetries: number;
  enabled: boolean;
}

/**
 * Remediation condition
 */
export interface RemediationCondition {
  alertPattern?: {
    severity?: AlertSeverity;
    category?: AlertCategory;
    messagePattern?: string;
  };
  healthCheck?: {
    service: string;
    status: HealthStatus;
  };
  metric?: {
    name: string;
    operator: 'gt' | 'lt' | 'eq';
    threshold: number;
  };
}

/**
 * Incident response manager
 */
export class IncidentResponseManager {
  private static instance: IncidentResponseManager;
  private incidents: Map<string, Incident> = new Map();
  private remediationRules: Map<string, RemediationRule> = new Map();
  private cooldowns: Map<string, Date> = new Map();
  private incidentEmitter = new EventEmitter();
  
  private alertManager: AlertManager;
  private healthMonitor: HealthMonitor;
  
  private constructor() {
    this.alertManager = AlertManager.getInstance();
    this.healthMonitor = HealthMonitor.getInstance();
    
    this.initializeRemediationRules();
    this.startIncidentDetection();
  }
  
  public static getInstance(): IncidentResponseManager {
    if (!IncidentResponseManager.instance) {
      IncidentResponseManager.instance = new IncidentResponseManager();
    }
    return IncidentResponseManager.instance;
  }
  
  /**
   * Initialize remediation rules
   */
  private initializeRemediationRules(): void {
    // High memory usage remediation
    this.registerRemediationRule({
      id: 'high-memory-remediation',
      name: 'High Memory Usage Remediation',
      description: 'Automatically handle high memory usage',
      condition: {
        alertPattern: {
          category: AlertCategory.CAPACITY,
          messagePattern: 'memory usage',
        },
      },
      actions: [
        RemediationAction.CLEAR_CACHE,
        RemediationAction.ROTATE_LOGS,
        RemediationAction.RESTART_SERVICE,
      ],
      cooldown: 30,
      maxRetries: 3,
      enabled: true,
    });
    
    // Database connection pool exhaustion
    this.registerRemediationRule({
      id: 'db-pool-remediation',
      name: 'Database Pool Remediation',
      description: 'Handle database connection pool issues',
      condition: {
        alertPattern: {
          messagePattern: 'connection pool',
        },
      },
      actions: [
        RemediationAction.RESET_CONNECTION_POOL,
        RemediationAction.SCALE_UP,
      ],
      cooldown: 15,
      maxRetries: 2,
      enabled: true,
    });
    
    // High error rate remediation
    this.registerRemediationRule({
      id: 'error-rate-remediation',
      name: 'Error Rate Remediation',
      description: 'Handle high error rates',
      condition: {
        metric: {
          name: 'error_rate',
          operator: 'gt',
          threshold: 10,
        },
      },
      actions: [
        RemediationAction.ENABLE_RATE_LIMITING,
        RemediationAction.SCALE_UP,
        RemediationAction.ROLLBACK,
      ],
      cooldown: 20,
      maxRetries: 2,
      enabled: true,
    });
    
    // Service health degradation
    this.registerRemediationRule({
      id: 'health-degradation-remediation',
      name: 'Health Degradation Remediation',
      description: 'Handle service health degradation',
      condition: {
        healthCheck: {
          service: 'application',
          status: HealthStatus.UNHEALTHY,
        },
      },
      actions: [
        RemediationAction.RESTART_SERVICE,
        RemediationAction.FAILOVER,
      ],
      cooldown: 10,
      maxRetries: 1,
      enabled: true,
    });
    
    // Cache performance issues
    this.registerRemediationRule({
      id: 'cache-performance-remediation',
      name: 'Cache Performance Remediation',
      description: 'Handle cache performance issues',
      condition: {
        alertPattern: {
          messagePattern: 'cache hit rate',
        },
      },
      actions: [
        RemediationAction.CLEAR_CACHE,
      ],
      cooldown: 60,
      maxRetries: 1,
      enabled: true,
    });
  }
  
  /**
   * Register remediation rule
   */
  public registerRemediationRule(rule: RemediationRule): void {
    this.remediationRules.set(rule.id, rule);
  }
  
  /**
   * Start incident detection
   */
  private startIncidentDetection(): void {
    // Listen for critical alerts
    this.alertManager.getEmitter().on('alert', async (alert: Alert) => {
      if (alert.severity === AlertSeverity.CRITICAL || 
          alert.severity === AlertSeverity.ERROR) {
        await this.handleAlert(alert);
      }
    });
    
    // Listen for health status changes
    this.healthMonitor.getEmitter().on('critical_failure', async (event: any) => {
      await this.handleHealthFailure(event);
    });
    
    // Periodic incident correlation
    setInterval(() => {
      this.correlateIncidents();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Handle alert
   */
  private async handleAlert(alert: Alert): Promise<void> {
    // Check if alert belongs to existing incident
    let incident = this.findRelatedIncident(alert);
    
    if (!incident) {
      // Create new incident
      incident = await this.createIncident(alert);
    } else {
      // Add alert to existing incident
      incident.alerts.push(alert);
      this.addIncidentEvent(incident, {
        type: 'alert_added',
        description: `Alert added: ${alert.title}`,
        actor: 'system',
      });
    }
    
    // Check remediation rules
    await this.checkRemediationRules(incident);
  }
  
  /**
   * Handle health failure
   */
  private async handleHealthFailure(event: any): Promise<void> {
    const incident = await this.createIncident(null, {
      title: `Health Check Failure: ${event.check}`,
      description: `Critical health check failure detected for ${event.check}`,
      severity: IncidentSeverity.SEV1,
      category: AlertCategory.AVAILABILITY,
      impactedServices: [event.check],
    });
    
    await this.checkRemediationRules(incident);
  }
  
  /**
   * Create incident
   */
  private async createIncident(
    alert: Alert | null,
    overrides?: Partial<Incident>
  ): Promise<Incident> {
    const incident: Incident = {
      id: `INC-${Date.now()}`,
      title: overrides?.title || alert?.title || 'Unknown Incident',
      description: overrides?.description || alert?.message || 'No description',
      severity: this.mapAlertSeverityToIncident(alert?.severity || AlertSeverity.ERROR),
      status: IncidentStatus.DETECTED,
      category: overrides?.category || alert?.category || AlertCategory.ERROR,
      alerts: alert ? [alert] : [],
      startTime: new Date(),
      detectionMethod: alert ? 'alert' : 'health_check',
      impactedServices: overrides?.impactedServices || [],
      remediationActions: [],
      timeline: [
        {
          timestamp: new Date(),
          type: 'incident_created',
          description: 'Incident detected and created',
          actor: 'system',
        },
      ],
      ...overrides,
    };
    
    this.incidents.set(incident.id, incident);
    
    // Emit incident created event
    this.incidentEmitter.emit('incident_created', incident);
    
    // Store incident
    await this.storeIncident(incident);
    
    return incident;
  }
  
  /**
   * Find related incident
   */
  private findRelatedIncident(alert: Alert): Incident | undefined {
    for (const incident of this.incidents.values()) {
      if (incident.status === IncidentStatus.RESOLVED || 
          incident.status === IncidentStatus.CLOSED) {
        continue;
      }
      
      // Check if alert matches incident pattern
      if (incident.category === alert.category &&
          incident.severity === this.mapAlertSeverityToIncident(alert.severity)) {
        // Check time proximity (within 5 minutes)
        const timeDiff = new Date().getTime() - incident.startTime.getTime();
        if (timeDiff < 5 * 60 * 1000) {
          return incident;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Check remediation rules
   */
  private async checkRemediationRules(incident: Incident): Promise<void> {
    for (const [ruleId, rule] of this.remediationRules) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      if (this.isInCooldown(ruleId)) continue;
      
      // Check if rule matches incident
      if (this.ruleMatchesIncident(rule, incident)) {
        await this.executeRemediation(incident, rule);
      }
    }
  }
  
  /**
   * Check if rule matches incident
   */
  private ruleMatchesIncident(rule: RemediationRule, incident: Incident): boolean {
    const condition = rule.condition;
    
    // Check alert pattern
    if (condition.alertPattern) {
      const pattern = condition.alertPattern;
      
      for (const alert of incident.alerts) {
        if (pattern.severity && alert.severity !== pattern.severity) continue;
        if (pattern.category && alert.category !== pattern.category) continue;
        if (pattern.messagePattern && !alert.message.includes(pattern.messagePattern)) continue;
        
        return true;
      }
    }
    
    // Check health check condition
    if (condition.healthCheck) {
      const health = this.healthMonitor.getCheckResult(condition.healthCheck.service);
      if (health && health.status === condition.healthCheck.status) {
        return true;
      }
    }
    
    // Check metric condition
    if (condition.metric) {
      // This would check actual metric values
      // For now, return false
      return false;
    }
    
    return false;
  }
  
  /**
   * Execute remediation
   */
  private async executeRemediation(
    incident: Incident,
    rule: RemediationRule
  ): Promise<void> {
    this.updateIncidentStatus(incident, IncidentStatus.RESOLVING);
    
    this.addIncidentEvent(incident, {
      type: 'remediation_started',
      description: `Starting remediation: ${rule.name}`,
      actor: 'system',
      metadata: { ruleId: rule.id },
    });
    
    let retries = 0;
    let success = false;
    
    while (retries < rule.maxRetries && !success) {
      for (const action of rule.actions) {
        const result = await this.executeRemediationAction(action, incident);
        incident.remediationActions.push(result);
        
        if (result.success) {
          success = true;
          break;
        }
      }
      
      if (!success) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }
    
    // Set cooldown
    this.cooldowns.set(rule.id, new Date());
    
    if (success) {
      this.addIncidentEvent(incident, {
        type: 'remediation_completed',
        description: 'Remediation completed successfully',
        actor: 'system',
      });
      
      // Wait and verify resolution
      setTimeout(() => {
        this.verifyResolution(incident);
      }, 60000); // Check after 1 minute
    } else {
      this.addIncidentEvent(incident, {
        type: 'remediation_failed',
        description: 'Remediation failed after all retries',
        actor: 'system',
      });
      
      // Escalate incident
      await this.escalateIncident(incident);
    }
  }
  
  /**
   * Execute remediation action
   */
  private async executeRemediationAction(
    action: RemediationAction,
    incident: Incident
  ): Promise<RemediationResult> {
    const startTime = new Date();
    
    try {
      let output: string = '';
      
      switch (action) {
        case RemediationAction.RESTART_SERVICE:
          output = await this.restartService();
          break;
          
        case RemediationAction.SCALE_UP:
          output = await this.scaleUp();
          break;
          
        case RemediationAction.SCALE_DOWN:
          output = await this.scaleDown();
          break;
          
        case RemediationAction.CLEAR_CACHE:
          output = await this.clearCache();
          break;
          
        case RemediationAction.RESET_CONNECTION_POOL:
          output = await this.resetConnectionPool();
          break;
          
        case RemediationAction.ROTATE_LOGS:
          output = await this.rotateLogs();
          break;
          
        case RemediationAction.ENABLE_RATE_LIMITING:
          output = await this.enableRateLimiting();
          break;
          
        case RemediationAction.DISABLE_FEATURE:
          output = await this.disableFeature(incident);
          break;
          
        case RemediationAction.FAILOVER:
          output = await this.performFailover();
          break;
          
        case RemediationAction.ROLLBACK:
          output = await this.performRollback();
          break;
          
        default:
          throw new Error(`Unknown remediation action: ${action}`);
      }
      
      return {
        action,
        timestamp: startTime,
        success: true,
        output,
      };
    } catch (error) {
      return {
        action,
        timestamp: startTime,
        success: false,
        error: (error as Error).message,
      };
    }
  }
  
  // Remediation action implementations
  
  private async restartService(): Promise<string> {
    // In production, this would restart the actual service
    // For now, simulate with process restart
    if (process.env.NODE_ENV === 'production') {
      await execAsync('pm2 restart taxomind');
      return 'Service restarted successfully';
    }
    return 'Service restart simulated';
  }
  
  private async scaleUp(): Promise<string> {
    // In production, this would scale up instances
    // For example, with Kubernetes or cloud provider API
    if (process.env.NODE_ENV === 'production') {
      await execAsync('kubectl scale deployment taxomind --replicas=+1');
      return 'Scaled up by 1 instance';
    }
    return 'Scale up simulated';
  }
  
  private async scaleDown(): Promise<string> {
    // In production, this would scale down instances
    if (process.env.NODE_ENV === 'production') {
      await execAsync('kubectl scale deployment taxomind --replicas=-1');
      return 'Scaled down by 1 instance';
    }
    return 'Scale down simulated';
  }
  
  private async clearCache(): Promise<string> {
    await redis.flushdb();
    return 'Cache cleared successfully';
  }
  
  private async resetConnectionPool(): Promise<string> {
    // Reset database connection pool
    await db.$disconnect();
    await db.$connect();
    return 'Database connection pool reset';
  }
  
  private async rotateLogs(): Promise<string> {
    // Rotate application logs
    if (process.env.NODE_ENV === 'production') {
      await execAsync('logrotate -f /etc/logrotate.d/taxomind');
      return 'Logs rotated successfully';
    }
    return 'Log rotation simulated';
  }
  
  private async enableRateLimiting(): Promise<string> {
    // Enable stricter rate limiting
    await redis.set('rate_limit:enabled', 'true');
    await redis.set('rate_limit:max_requests', '100');
    return 'Rate limiting enabled';
  }
  
  private async disableFeature(incident: Incident): Promise<string> {
    // Disable problematic feature based on incident
    const feature = incident.impactedServices[0] || 'unknown';
    await redis.set(`feature:${feature}:enabled`, 'false');
    return `Feature ${feature} disabled`;
  }
  
  private async performFailover(): Promise<string> {
    // Perform failover to backup system
    if (process.env.NODE_ENV === 'production') {
      await execAsync('kubectl patch service taxomind -p \'{"spec":{"selector":{"version":"backup"}}}\'');
      return 'Failover to backup completed';
    }
    return 'Failover simulated';
  }
  
  private async performRollback(): Promise<string> {
    // Rollback to previous deployment
    if (process.env.NODE_ENV === 'production') {
      await execAsync('kubectl rollout undo deployment/taxomind');
      return 'Rollback completed';
    }
    return 'Rollback simulated';
  }
  
  /**
   * Verify resolution
   */
  private async verifyResolution(incident: Incident): Promise<void> {
    // Check if issue is resolved
    const health = this.healthMonitor.getSystemHealth();
    const activeAlerts = this.alertManager.getActiveAlerts();
    
    const resolved = 
      health?.status === HealthStatus.HEALTHY &&
      activeAlerts.filter(a => a.category === incident.category).length === 0;
    
    if (resolved) {
      this.resolveIncident(incident);
    } else {
      this.addIncidentEvent(incident, {
        type: 'resolution_verification_failed',
        description: 'Issue not fully resolved after remediation',
        actor: 'system',
      });
      
      await this.escalateIncident(incident);
    }
  }
  
  /**
   * Escalate incident
   */
  private async escalateIncident(incident: Incident): Promise<void> {
    // Upgrade severity
    if (incident.severity === IncidentSeverity.SEV3) {
      incident.severity = IncidentSeverity.SEV2;
    } else if (incident.severity === IncidentSeverity.SEV2) {
      incident.severity = IncidentSeverity.SEV1;
    }
    
    this.addIncidentEvent(incident, {
      type: 'escalated',
      description: `Incident escalated to ${incident.severity}`,
      actor: 'system',
    });
    
    // Notify on-call
    await this.notifyOnCall(incident);
    
    this.incidentEmitter.emit('incident_escalated', incident);
  }
  
  /**
   * Notify on-call
   */
  private async notifyOnCall(incident: Incident): Promise<void> {
    // In production, this would page the on-call engineer
    // Using PagerDuty, Opsgenie, or similar service
    console.log(`Paging on-call for incident: ${incident.id}`);
  }
  
  /**
   * Correlate incidents
   */
  private correlateIncidents(): void {
    const activeIncidents = Array.from(this.incidents.values())
      .filter(i => i.status !== IncidentStatus.RESOLVED && i.status !== IncidentStatus.CLOSED);
    
    // Group similar incidents
    const groups: Map<string, Incident[]> = new Map();
    
    for (const incident of activeIncidents) {
      const key = `${incident.category}_${incident.severity}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(incident);
    }
    
    // Merge correlated incidents
    for (const [key, incidents] of groups) {
      if (incidents.length > 1) {
        this.mergeIncidents(incidents);
      }
    }
  }
  
  /**
   * Merge incidents
   */
  private mergeIncidents(incidents: Incident[]): void {
    // Sort by start time
    incidents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    const primary = incidents[0];
    const secondary = incidents.slice(1);
    
    for (const incident of secondary) {
      // Merge alerts
      primary.alerts.push(...incident.alerts);
      
      // Merge timeline
      primary.timeline.push(...incident.timeline);
      
      // Merge impacted services
      primary.impactedServices = Array.from(new Set([
        ...primary.impactedServices,
        ...incident.impactedServices,
      ]));
      
      // Remove secondary incident
      this.incidents.delete(incident.id);
    }
    
    this.addIncidentEvent(primary, {
      type: 'incidents_merged',
      description: `Merged ${secondary.length} related incidents`,
      actor: 'system',
      metadata: { mergedIds: secondary.map(i => i.id) },
    });
  }
  
  /**
   * Update incident status
   */
  private updateIncidentStatus(incident: Incident, status: IncidentStatus): void {
    incident.status = status;
    
    this.addIncidentEvent(incident, {
      type: 'status_changed',
      description: `Status changed to ${status}`,
      actor: 'system',
    });
    
    this.incidentEmitter.emit('incident_status_changed', {
      incident,
      status,
    });
  }
  
  /**
   * Add incident event
   */
  private addIncidentEvent(incident: Incident, event: Omit<IncidentEvent, 'timestamp'>): void {
    incident.timeline.push({
      ...event,
      timestamp: new Date(),
    });
  }
  
  /**
   * Resolve incident
   */
  private resolveIncident(incident: Incident): void {
    incident.endTime = new Date();
    this.updateIncidentStatus(incident, IncidentStatus.RESOLVED);
    
    this.incidentEmitter.emit('incident_resolved', incident);
    
    // Generate postmortem after 24 hours
    setTimeout(() => {
      this.generatePostmortem(incident);
    }, 24 * 60 * 60 * 1000);
  }
  
  /**
   * Generate postmortem
   */
  private async generatePostmortem(incident: Incident): Promise<void> {
    const postmortem = {
      incident: incident.id,
      title: incident.title,
      severity: incident.severity,
      duration: incident.endTime ? 
        (incident.endTime.getTime() - incident.startTime.getTime()) / 1000 / 60 : 0,
      timeline: incident.timeline,
      rootCause: incident.rootCause || 'To be determined',
      remediationActions: incident.remediationActions,
      lessonsLearned: [],
      actionItems: [],
    };
    
    incident.postmortem = JSON.stringify(postmortem, null, 2);
    this.updateIncidentStatus(incident, IncidentStatus.CLOSED);
    
    await this.storeIncident(incident);
  }
  
  /**
   * Store incident
   */
  private async storeIncident(incident: Incident): Promise<void> {
    try {
      await redis.set(
        `incident:${incident.id}`,
        JSON.stringify(incident),
        'EX',
        90 * 24 * 60 * 60 // 90 days retention
      );
    } catch (error) {
      console.error('Failed to store incident:', error);
    }
  }
  
  /**
   * Check if rule is in cooldown
   */
  private isInCooldown(ruleId: string): boolean {
    const lastExecution = this.cooldowns.get(ruleId);
    if (!lastExecution) return false;
    
    const rule = this.remediationRules.get(ruleId);
    if (!rule) return false;
    
    const cooldownEnd = new Date(lastExecution.getTime() + rule.cooldown * 60 * 1000);
    return new Date() < cooldownEnd;
  }
  
  /**
   * Map alert severity to incident severity
   */
  private mapAlertSeverityToIncident(alertSeverity: AlertSeverity): IncidentSeverity {
    switch (alertSeverity) {
      case AlertSeverity.CRITICAL:
        return IncidentSeverity.SEV1;
      case AlertSeverity.ERROR:
        return IncidentSeverity.SEV2;
      case AlertSeverity.WARNING:
        return IncidentSeverity.SEV3;
      case AlertSeverity.INFO:
      default:
        return IncidentSeverity.SEV4;
    }
  }
  
  /**
   * Get active incidents
   */
  public getActiveIncidents(): Incident[] {
    return Array.from(this.incidents.values())
      .filter(i => i.status !== IncidentStatus.RESOLVED && i.status !== IncidentStatus.CLOSED);
  }
  
  /**
   * Get incident by ID
   */
  public getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }
  
  /**
   * Get incident statistics
   */
  public getIncidentStatistics(): any {
    const incidents = Array.from(this.incidents.values());
    const activeIncidents = this.getActiveIncidents();
    
    return {
      total: incidents.length,
      active: activeIncidents.length,
      resolved: incidents.filter(i => i.status === IncidentStatus.RESOLVED).length,
      bySeverity: {
        sev1: activeIncidents.filter(i => i.severity === IncidentSeverity.SEV1).length,
        sev2: activeIncidents.filter(i => i.severity === IncidentSeverity.SEV2).length,
        sev3: activeIncidents.filter(i => i.severity === IncidentSeverity.SEV3).length,
        sev4: activeIncidents.filter(i => i.severity === IncidentSeverity.SEV4).length,
      },
      meanTimeToResolve: this.calculateMTTR(incidents),
      remediationSuccess: this.calculateRemediationSuccess(incidents),
    };
  }
  
  /**
   * Calculate Mean Time To Resolve
   */
  private calculateMTTR(incidents: Incident[]): number {
    const resolved = incidents.filter(i => i.endTime);
    if (resolved.length === 0) return 0;
    
    const times = resolved.map(i => {
      return i.endTime!.getTime() - i.startTime.getTime();
    });
    
    return times.reduce((a, b) => a + b, 0) / times.length / 1000 / 60; // Minutes
  }
  
  /**
   * Calculate remediation success rate
   */
  private calculateRemediationSuccess(incidents: Incident[]): number {
    let totalActions = 0;
    let successfulActions = 0;
    
    for (const incident of incidents) {
      for (const action of incident.remediationActions) {
        totalActions++;
        if (action.success) successfulActions++;
      }
    }
    
    return totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;
  }
  
  /**
   * Get incident emitter for external listeners
   */
  public getEmitter(): EventEmitter {
    return this.incidentEmitter;
  }
}