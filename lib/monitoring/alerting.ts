/**
 * Alerting Rules and Notification System
 * Comprehensive alerting with multiple notification channels
 */

import { EventEmitter } from 'events';

import axios from 'axios';
// import nodemailer from 'nodemailer'; // DISABLED: Using Resend instead
import twilio from 'twilio';

import { redis } from '@/lib/redis';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Alert categories
 */
export enum AlertCategory {
  PERFORMANCE = 'performance',
  AVAILABILITY = 'availability',
  ERROR = 'error',
  SECURITY = 'security',
  BUSINESS = 'business',
  CAPACITY = 'capacity',
}

/**
 * Alert rule definition
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  condition: AlertCondition;
  actions: AlertAction[];
  cooldown: number; // Minutes before re-alerting
  enabled: boolean;
}

/**
 * Alert condition
 */
export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  threshold: number;
  duration?: number; // Seconds the condition must be true
  aggregation?: 'avg' | 'min' | 'max' | 'sum' | 'count';
  window?: number; // Time window in seconds
}

/**
 * Alert action
 */
export interface AlertAction {
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'pagerduty';
  config: Record<string, unknown>;
}

/**
 * Alert instance
 */
export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

// Type definitions for notification channels
interface NotificationChannel {
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'pagerduty';
  enabled: boolean;
}

interface EmailChannel extends NotificationChannel {
  type: 'email';
  transporter?: any; // Disabled: Using Resend instead of nodemailer
}

interface SmsChannel extends NotificationChannel {
  type: 'sms';
  client?: twilio.Twilio;
}

// Type extensions for Redis methods
interface RedisWithZAdd {
  zadd: (key: string, score: number, member: string) => Promise<unknown>;
}

interface RedisWithZRangeByScore {
  zrangebyscore: (key: string, min: number, max: number) => Promise<string[]>;
}

/**
 * Alert manager
 */
export class AlertManager {
  private static instance: AlertManager;
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private cooldowns: Map<string, Date> = new Map();
  private alertEmitter = new EventEmitter();
  
  // Notification channels
  private emailChannel?: EmailChannel;
  private smsChannel?: SmsChannel;
  
  private constructor() {
    this.initializeNotificationChannels().catch((error) => {
      console.error('Failed to initialize notification channels:', error);
    });
    this.loadAlertRules();
  }
  
  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }
  
  /**
   * Initialize notification channels
   */
  private async initializeNotificationChannels(): Promise<void> {
    // Email configuration - DISABLED (Using Resend instead)
    // if (process.env.SMTP_HOST) {
    //   const transporter = nodemailer.createTransporter({
    //     host: process.env.SMTP_HOST,
    //     port: parseInt(process.env.SMTP_PORT ?? '587'),
    //     secure: process.env.SMTP_SECURE === 'true',
    //     auth: {
    //       user: process.env.SMTP_USER,
    //       pass: process.env.SMTP_PASS,
    //     },
    //   });
    //
    //   this.emailChannel = {
    //     type: 'email',
    //     enabled: true,
    //     transporter,
    //   };
    // }
    
    // Twilio configuration
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      this.smsChannel = {
        type: 'sms',
        enabled: true,
        client,
      };
    }
  }
  
  /**
   * Load alert rules
   */
  private loadAlertRules(): void {
    // Define common email for ops
    const OPS_EMAIL_CONSTANT = 'ops@taxomind.com';
    
    // Default alert rules
    const defaultRules: AlertRule[] = [
      // Performance alerts
      {
        id: 'high-response-time',
        name: 'High Response Time',
        description: 'API response time exceeds threshold',
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'response_time_p95',
          operator: 'gt',
          threshold: 1000,
          duration: 300,
          aggregation: 'avg',
          window: 600,
        },
        actions: [
          {
            type: 'email',
            config: { to: OPS_EMAIL_CONSTANT },
          },
          {
            type: 'slack',
            config: { channel: '#alerts' },
          },
        ],
        cooldown: 30,
        enabled: true,
      },
      {
        id: 'critical-response-time',
        name: 'Critical Response Time',
        description: 'API response time critically high',
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.CRITICAL,
        condition: {
          metric: 'response_time_p99',
          operator: 'gt',
          threshold: 3000,
          duration: 60,
          aggregation: 'avg',
          window: 300,
        },
        actions: [
          {
            type: 'email',
            config: { to: OPS_EMAIL_CONSTANT },
          },
          {
            type: 'sms',
            config: { to: '+1234567890' },
          },
          {
            type: 'pagerduty',
            config: { serviceKey: 'SERVICE_KEY' },
          },
        ],
        cooldown: 15,
        enabled: true,
      },
      
      // Error rate alerts
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds threshold',
        category: AlertCategory.ERROR,
        severity: AlertSeverity.ERROR,
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 5,
          duration: 300,
          aggregation: 'avg',
          window: 600,
        },
        actions: [
          {
            type: 'email',
            config: { to: 'dev@taxomind.com' },
          },
          {
            type: 'slack',
            config: { channel: '#errors' },
          },
        ],
        cooldown: 30,
        enabled: true,
      },
      
      // Database alerts
      {
        id: 'db-connection-pool-exhausted',
        name: 'Database Connection Pool Exhausted',
        description: 'Database connection pool is at capacity',
        category: AlertCategory.CAPACITY,
        severity: AlertSeverity.CRITICAL,
        condition: {
          metric: 'db_connection_pool_usage',
          operator: 'gte',
          threshold: 90,
          duration: 60,
        },
        actions: [
          {
            type: 'email',
            config: { to: 'dba@taxomind.com' },
          },
          {
            type: 'pagerduty',
            config: { serviceKey: 'DB_SERVICE_KEY' },
          },
        ],
        cooldown: 10,
        enabled: true,
      },
      {
        id: 'slow-db-queries',
        name: 'Slow Database Queries',
        description: 'Database queries are running slowly',
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'db_query_time_p95',
          operator: 'gt',
          threshold: 500,
          duration: 300,
          aggregation: 'avg',
          window: 600,
        },
        actions: [
          {
            type: 'email',
            config: { to: 'dba@taxomind.com' },
          },
        ],
        cooldown: 60,
        enabled: true,
      },
      
      // Cache alerts
      {
        id: 'low-cache-hit-rate',
        name: 'Low Cache Hit Rate',
        description: 'Cache hit rate is below threshold',
        category: AlertCategory.PERFORMANCE,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'cache_hit_rate',
          operator: 'lt',
          threshold: 70,
          duration: 600,
          aggregation: 'avg',
          window: 900,
        },
        actions: [
          {
            type: 'email',
            config: { to: OPS_EMAIL_CONSTANT },
          },
        ],
        cooldown: 60,
        enabled: true,
      },
      
      // Memory alerts
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Memory usage is high',
        category: AlertCategory.CAPACITY,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'memory_usage_percent',
          operator: 'gt',
          threshold: 80,
          duration: 300,
        },
        actions: [
          {
            type: 'email',
            config: { to: OPS_EMAIL_CONSTANT },
          },
        ],
        cooldown: 30,
        enabled: true,
      },
      {
        id: 'critical-memory-usage',
        name: 'Critical Memory Usage',
        description: 'Memory usage is critical',
        category: AlertCategory.CAPACITY,
        severity: AlertSeverity.CRITICAL,
        condition: {
          metric: 'memory_usage_percent',
          operator: 'gt',
          threshold: 95,
          duration: 60,
        },
        actions: [
          {
            type: 'email',
            config: { to: OPS_EMAIL_CONSTANT },
          },
          {
            type: 'pagerduty',
            config: { serviceKey: 'MEMORY_SERVICE_KEY' },
          },
        ],
        cooldown: 15,
        enabled: true,
      },
      
      // Business metric alerts
      {
        id: 'low-conversion-rate',
        name: 'Low Conversion Rate',
        description: 'Conversion rate dropped below threshold',
        category: AlertCategory.BUSINESS,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'conversion_rate',
          operator: 'lt',
          threshold: 2,
          duration: 3600,
          aggregation: 'avg',
          window: 7200,
        },
        actions: [
          {
            type: 'email',
            config: { to: 'product@taxomind.com' },
          },
        ],
        cooldown: 240,
        enabled: true,
      },
      {
        id: 'high-churn-rate',
        name: 'High Churn Rate',
        description: 'User churn rate is high',
        category: AlertCategory.BUSINESS,
        severity: AlertSeverity.WARNING,
        condition: {
          metric: 'churn_rate',
          operator: 'gt',
          threshold: 10,
          duration: 86400,
          aggregation: 'avg',
          window: 604800,
        },
        actions: [
          {
            type: 'email',
            config: { to: 'product@taxomind.com' },
          },
        ],
        cooldown: 1440,
        enabled: true,
      },
      
      // Security alerts
      {
        id: 'suspicious-activity',
        name: 'Suspicious Activity Detected',
        description: 'Potential security threat detected',
        category: AlertCategory.SECURITY,
        severity: AlertSeverity.CRITICAL,
        condition: {
          metric: 'security_threat_score',
          operator: 'gt',
          threshold: 80,
          duration: 60,
        },
        actions: [
          {
            type: 'email',
            config: { to: 'security@taxomind.com' },
          },
          {
            type: 'sms',
            config: { to: '+1234567890' },
          },
          {
            type: 'pagerduty',
            config: { serviceKey: 'SECURITY_SERVICE_KEY' },
          },
        ],
        cooldown: 5,
        enabled: true,
      },
    ];
    
    // Load rules
    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }
  
  /**
   * Evaluate metric against alert rules
   */
  public async evaluateMetric(
    metricName: string,
    value: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;
      if (rule.condition.metric !== metricName) continue;
      
      // Check if in cooldown
      if (this.isInCooldown(ruleId)) continue;
      
      // Evaluate condition
      const triggered = this.evaluateCondition(rule.condition, value);
      
      if (triggered) {
        await this.triggerAlert(rule, value, metadata);
      }
    }
  }
  
  /**
   * Evaluate alert condition
   */
  private evaluateCondition(condition: AlertCondition, value: number): boolean {
    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'eq':
        return value === condition.threshold;
      case 'gte':
        return value >= condition.threshold;
      case 'lte':
        return value <= condition.threshold;
      case 'ne':
        return value !== condition.threshold;
      default:
        return false;
    }
  }
  
  /**
   * Check if rule is in cooldown
   */
  private isInCooldown(ruleId: string): boolean {
    const lastAlert = this.cooldowns.get(ruleId);
    if (!lastAlert) return false;
    
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    
    const cooldownEnd = new Date(lastAlert.getTime() + rule.cooldown * 60 * 1000);
    return new Date() < cooldownEnd;
  }
  
  /**
   * Trigger alert
   */
  private async triggerAlert(
    rule: AlertRule,
    value: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      severity: rule.severity,
      category: rule.category,
      title: rule.name,
      message: `${rule.description}. Current value: ${value}, Threshold: ${rule.condition.threshold}`,
      value,
      threshold: rule.condition.threshold,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      metadata,
    };
    
    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    
    // Set cooldown
    this.cooldowns.set(rule.id, new Date());
    
    // Execute actions
    for (const action of rule.actions) {
      await this.executeAction(action, alert);
    }
    
    // Emit alert event
    this.alertEmitter.emit('alert', alert);
    
    // Store in database
    await this.storeAlert(alert);
  }
  
  /**
   * Execute alert action
   */
  private async executeAction(action: AlertAction, alert: Alert): Promise<void> {
    try {
      switch (action.type) {
        case 'email':
          await this.sendEmailAlert(action.config, alert);
          break;
        case 'sms':
          await this.sendSMSAlert(action.config, alert);
          break;
        case 'slack':
          await this.sendSlackAlert(action.config, alert);
          break;
        case 'webhook':
          await this.sendWebhookAlert(action.config, alert);
          break;
        case 'pagerduty':
          await this.sendPagerDutyAlert(action.config, alert);
          break;
      }
    } catch {
      // Log error silently - could send to monitoring service instead
      // Error is intentionally ignored here
    }
  }
  
  /**
   * Send email alert
   */
  private async sendEmailAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    // DISABLED: Email alerts via nodemailer are disabled. Use Resend for email alerts.
    console.warn('[AlertManager] Email alerts are disabled. Configure Resend for email notifications.');
    return;

    // if (!this.emailChannel?.transporter || !this.emailChannel.enabled) return;
    //
    // const severityColors = {
    //   [AlertSeverity.INFO]: '#17a2b8',
    //   [AlertSeverity.WARNING]: '#ffc107',
    //   [AlertSeverity.ERROR]: '#dc3545',
    //   [AlertSeverity.CRITICAL]: '#721c24',
    // };
    //
    // await this.emailChannel.transporter.sendMail({
    //   from: process.env.SMTP_FROM ?? 'alerts@taxomind.com',
    //   to: config.to as string,
    //   subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    //   html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //       <div style="background: ${severityColors[alert.severity]}; color: white; padding: 20px;">
    //         <h2 style="margin: 0;">${alert.title}</h2>
    //       </div>
    //       <div style="padding: 20px; background: #f8f9fa;">
    //         <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
    //         <p><strong>Category:</strong> ${alert.category}</p>
    //         <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
    //         <p><strong>Message:</strong> ${alert.message}</p>
    //         <p><strong>Current Value:</strong> ${alert.value}</p>
    //         <p><strong>Threshold:</strong> ${alert.threshold}</p>
    //         ${alert.metadata ? `<p><strong>Additional Info:</strong> ${JSON.stringify(alert.metadata, null, 2)}</p>` : ''}
    //       </div>
    //       <div style="padding: 10px; background: #dee2e6; text-align: center;">
    //         <a href="${process.env.NEXT_PUBLIC_APP_URL}/monitoring/alerts/${alert.id}"
    //            style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
    //           View Alert
    //         </a>
    //       </div>
    //     </div>
    //   `,
    // });
  }
  
  /**
   * Send SMS alert
   */
  private async sendSMSAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    if (!this.smsChannel?.client || !this.smsChannel.enabled) return;
    
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      console.error('TWILIO_PHONE_NUMBER not configured');
      return;
    }
    
    await this.smsChannel.client.messages.create({
      body: `[${alert.severity.toUpperCase()}] ${alert.title}\n${alert.message}`,
      from: fromNumber,
      to: config.to as string,
    });
  }
  
  /**
   * Send Slack alert
   */
  private async sendSlackAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? (config.webhookUrl as string | undefined);
    if (!webhookUrl) return;
    
    const severityEmojis = {
      [AlertSeverity.INFO]: ':information_source:',
      [AlertSeverity.WARNING]: ':warning:',
      [AlertSeverity.ERROR]: ':x:',
      [AlertSeverity.CRITICAL]: ':rotating_light:',
    };
    
    await axios.post(webhookUrl, {
      channel: config.channel as string,
      username: 'Taxomind Alerts',
      icon_emoji: severityEmojis[alert.severity],
      attachments: [
        {
          color: this.getAlertColor(alert.severity),
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Category',
              value: alert.category,
              short: true,
            },
            {
              title: 'Current Value',
              value: alert.value.toString(),
              short: true,
            },
            {
              title: 'Threshold',
              value: alert.threshold.toString(),
              short: true,
            },
          ],
          footer: 'Taxomind Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    });
  }
  
  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    await axios.post(config.url as string, {
      alert,
      timestamp: alert.timestamp.toISOString(),
    }, {
      headers: (config.headers as Record<string, string>) ?? {},
    });
  }
  
  /**
   * Send PagerDuty alert
   */
  private async sendPagerDutyAlert(config: Record<string, unknown>, alert: Alert): Promise<void> {
    const eventAction = alert.resolved ? 'resolve' : 'trigger';
    
    await axios.post('https://events.pagerduty.com/v2/enqueue', {
      routing_key: config.serviceKey as string,
      event_action: eventAction,
      dedup_key: alert.id,
      payload: {
        summary: alert.message,
        severity: this.getSeverityString(alert.severity),
        source: 'Taxomind Monitoring',
        component: alert.category,
        group: alert.category,
        class: alert.category,
        custom_details: {
          value: alert.value,
          threshold: alert.threshold,
          metadata: alert.metadata,
        },
      },
    });
  }
  
  /**
   * Store alert in database
   */
  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await redis.set(
        `alert:${alert.id}`,
        JSON.stringify(alert)
      );
      await redis.expire(`alert:${alert.id}`, 30 * 24 * 60 * 60); // 30 days retention
      
      // Store in sorted set for querying (if Redis supports it)
      if ('zadd' in redis) {
        await (redis as RedisWithZAdd).zadd(
          'alerts:timeline',
          alert.timestamp.getTime(),
          alert.id
        );
      }
    } catch {
      // Log error silently - could send to monitoring service instead
      // Error is intentionally ignored here
    }
  }
  
  /**
   * Acknowledge alert
   */
  public async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;
    
    alert.acknowledged = true;
    alert.metadata = {
      ...alert.metadata,
      acknowledgedBy: userId,
      acknowledgedAt: new Date().toISOString(),
    };
    
    await this.storeAlert(alert);
    this.alertEmitter.emit('alert:acknowledged', alert);
  }
  
  /**
   * Resolve alert
   */
  public async resolveAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;
    
    alert.resolved = true;
    alert.metadata = {
      ...alert.metadata,
      resolvedBy: userId,
      resolvedAt: new Date().toISOString(),
    };
    
    this.activeAlerts.delete(alertId);
    await this.storeAlert(alert);
    this.alertEmitter.emit('alert:resolved', alert);
  }
  
  /**
   * Get active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
  
  /**
   * Check if alert matches filters
   */
  private alertMatchesFilters(
    alert: Alert,
    filters?: {
      severity?: AlertSeverity;
      category?: AlertCategory;
      resolved?: boolean;
    }
  ): boolean {
    if (!filters) return true;
    
    return !(
      (filters.severity && alert.severity !== filters.severity) ||
      (filters.category && alert.category !== filters.category) ||
      (filters.resolved !== undefined && alert.resolved !== filters.resolved)
    );
  }

  /**
   * Get alert IDs from timeline
   */
  private async getAlertIdsFromTimeline(
    startTime: Date,
    endTime: Date
  ): Promise<string[]> {
    if ('zrangebyscore' in redis) {
      return await (redis as RedisWithZRangeByScore).zrangebyscore(
        'alerts:timeline',
        startTime.getTime(),
        endTime.getTime()
      );
    }
    return [];
  }

  /**
   * Get alert history
   */
  public async getAlertHistory(
    startTime: Date,
    endTime: Date,
    filters?: {
      severity?: AlertSeverity;
      category?: AlertCategory;
      resolved?: boolean;
    }
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const alertIds = await this.getAlertIdsFromTimeline(startTime, endTime);
    
    // Fetch and filter alerts
    for (const alertId of alertIds) {
      const alertData = await redis.get(`alert:${alertId}`);
      if (!alertData) continue;
      
      const alert = JSON.parse(alertData) as Alert;
      if (this.alertMatchesFilters(alert, filters)) {
        alerts.push(alert);
      }
    }
    
    return alerts;
  }
  
  /**
   * Get alert statistics
   */
  public async getAlertStatistics(): Promise<{
    active: number;
    last24h: number;
    last7d: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    meanTimeToAcknowledge: number;
    meanTimeToResolve: number;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const alerts24h = await this.getAlertHistory(last24h, now);
    const alerts7d = await this.getAlertHistory(last7d, now);
    
    return {
      active: this.activeAlerts.size,
      last24h: alerts24h.length,
      last7d: alerts7d.length,
      bySeverity: {
        critical: alerts24h.filter(a => a.severity === AlertSeverity.CRITICAL).length,
        error: alerts24h.filter(a => a.severity === AlertSeverity.ERROR).length,
        warning: alerts24h.filter(a => a.severity === AlertSeverity.WARNING).length,
        info: alerts24h.filter(a => a.severity === AlertSeverity.INFO).length,
      },
      byCategory: {
        performance: alerts24h.filter(a => a.category === AlertCategory.PERFORMANCE).length,
        availability: alerts24h.filter(a => a.category === AlertCategory.AVAILABILITY).length,
        error: alerts24h.filter(a => a.category === AlertCategory.ERROR).length,
        security: alerts24h.filter(a => a.category === AlertCategory.SECURITY).length,
        business: alerts24h.filter(a => a.category === AlertCategory.BUSINESS).length,
        capacity: alerts24h.filter(a => a.category === AlertCategory.CAPACITY).length,
      },
      meanTimeToAcknowledge: this.calculateMTTA(alerts24h),
      meanTimeToResolve: this.calculateMTTR(alerts24h),
    };
  }
  
  /**
   * Calculate Mean Time To Acknowledge
   */
  private calculateMTTA(alerts: Alert[]): number {
    const acknowledged = alerts.filter(a => a.acknowledged && a.metadata?.acknowledgedAt);
    if (acknowledged.length === 0) return 0;
    
    const times = acknowledged.map(a => {
      if (!a.metadata?.acknowledgedAt) return 0;
      const ackTime = new Date(a.metadata.acknowledgedAt as string).getTime();
      return ackTime - a.timestamp.getTime();
    }).filter(time => time > 0);
    
    return times.reduce((a, b) => a + b, 0) / times.length / 1000 / 60; // Minutes
  }
  
  /**
   * Calculate Mean Time To Resolve
   */
  private calculateMTTR(alerts: Alert[]): number {
    const resolved = alerts.filter(a => a.resolved && a.metadata?.resolvedAt);
    if (resolved.length === 0) return 0;
    
    const times = resolved.map(a => {
      if (!a.metadata?.resolvedAt) return 0;
      const resolveTime = new Date(a.metadata.resolvedAt as string).getTime();
      return resolveTime - a.timestamp.getTime();
    }).filter(time => time > 0);
    
    return times.reduce((a, b) => a + b, 0) / times.length / 1000 / 60; // Minutes
  }
  
  /**
   * Get alert color for Slack
   */
  private getAlertColor(severity: AlertSeverity): string {
    if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.ERROR) {
      return 'danger';
    }
    if (severity === AlertSeverity.WARNING) {
      return 'warning';
    }
    return 'good';
  }

  /**
   * Get severity string for PagerDuty
   */
  private getSeverityString(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'critical';
      case AlertSeverity.ERROR:
        return 'error';
      case AlertSeverity.WARNING:
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * Get alert emitter for external listeners
   */
  public getEmitter(): EventEmitter {
    return this.alertEmitter;
  }
}