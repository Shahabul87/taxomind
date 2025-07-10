import { z } from 'zod';

// Audit Log Schema Definitions
export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  userId: z.string().optional(),
  sessionId: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  
  // Event details
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  
  // Context and metadata
  context: z.object({
    module: z.string(),
    component: z.string().optional(),
    page: z.string().optional(),
    environment: z.enum(['development', 'staging', 'production']),
    version: z.string().optional()
  }),
  
  // Event data
  before: z.record(z.any()).optional(),
  after: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  
  // Classification
  category: z.enum(['security', 'user', 'system', 'data', 'performance', 'business']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  risk_level: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  
  // Compliance and security
  sensitive: z.boolean().default(false),
  pii_involved: z.boolean().default(false),
  compliance_relevant: z.array(z.string()).optional(),
  
  // Technical details
  duration: z.number().optional(),
  success: z.boolean(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  stack_trace: z.string().optional(),
  
  // Tracking
  correlation_id: z.string().optional(),
  parent_event_id: z.string().optional(),
  trace_id: z.string().optional()
});

export const AuditQuerySchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
  success: z.boolean().optional(),
  page: z.number().default(1),
  limit: z.number().default(50),
  sortBy: z.string().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const ComplianceReportSchema = z.object({
  id: z.string(),
  type: z.enum(['GDPR', 'SOX', 'HIPAA', 'FERPA', 'PCI_DSS', 'custom']),
  startDate: z.date(),
  endDate: z.date(),
  generatedAt: z.date(),
  generatedBy: z.string(),
  events: z.array(AuditEventSchema),
  summary: z.object({
    totalEvents: z.number(),
    securityEvents: z.number(),
    dataAccess: z.number(),
    userActions: z.number(),
    systemEvents: z.number(),
    criticalEvents: z.number(),
    failedActions: z.number()
  }),
  violations: z.array(z.object({
    rule: z.string(),
    description: z.string(),
    severity: z.string(),
    events: z.array(z.string())
  })),
  recommendations: z.array(z.string())
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AuditQuery = z.infer<typeof AuditQuerySchema>;
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;

// Audit System Class
export class AuditSystem {
  private events: Map<string, AuditEvent> = new Map();
  private eventBuffer: AuditEvent[] = [];
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds
  private retentionPeriod = 365 * 24 * 60 * 60 * 1000; // 1 year
  private listeners: Set<(event: AuditEvent) => void> = new Set();
  
  // Compliance rules and patterns
  private complianceRules = new Map<string, {
    pattern: RegExp | string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    actions: string[];
  }>();

  constructor() {
    this.initializeComplianceRules();
    this.startBatchProcessor();
    this.startCleanupProcess();
  }

  // Core Logging Methods
  async log(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    const event: AuditEvent = {
      ...eventData,
      id: this.generateEventId(),
      timestamp: new Date()
    };

    // Validate event
    const validatedEvent = AuditEventSchema.parse(event);
    
    // Store in memory buffer
    this.eventBuffer.push(validatedEvent);
    
    // Immediate processing for critical events
    if (validatedEvent.severity === 'critical') {
      await this.processImmediately(validatedEvent);
    }
    
    // Check compliance rules
    await this.checkCompliance(validatedEvent);
    
    // Notify listeners
    this.notifyListeners(validatedEvent);
    
    // Flush buffer if needed
    if (this.eventBuffer.length >= this.batchSize) {
      await this.flushBuffer();
    }
    
    return validatedEvent.id;
  }

  // Convenience methods for common actions
  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    sessionId?: string
  ): Promise<string> {
    return this.log({
      userId,
      action,
      resource,
      resourceId,
      sessionId: sessionId || this.generateSessionId(),
      category: 'user',
      severity: 'low',
      risk_level: 'none',
      context: {
        module: 'user_actions',
        environment: this.getEnvironment()
      },
      success: true,
      metadata
    });
  }

  async logSecurityEvent(
    action: string,
    userId?: string,
    ipAddress?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.log({
      userId,
      ipAddress,
      action,
      resource: 'security',
      sessionId: this.generateSessionId(),
      category: 'security',
      severity,
      risk_level: severity,
      context: {
        module: 'security',
        environment: this.getEnvironment()
      },
      success: true,
      sensitive: true,
      metadata
    });
  }

  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'create' | 'update' | 'delete',
    before?: Record<string, any>,
    after?: Record<string, any>,
    sessionId?: string
  ): Promise<string> {
    const containsPII = this.detectPII(before) || this.detectPII(after);
    
    return this.log({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      sessionId: sessionId || this.generateSessionId(),
      before,
      after,
      category: 'data',
      severity: containsPII ? 'high' : 'medium',
      risk_level: containsPII ? 'high' : 'low',
      context: {
        module: 'data_access',
        environment: this.getEnvironment()
      },
      success: true,
      pii_involved: containsPII,
      sensitive: containsPII
    });
  }

  async logSystemEvent(
    action: string,
    resource: string,
    success: boolean,
    error?: string,
    duration?: number,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.log({
      action,
      resource,
      sessionId: this.generateSessionId(),
      category: 'system',
      severity: success ? 'low' : 'high',
      risk_level: success ? 'none' : 'medium',
      context: {
        module: 'system',
        environment: this.getEnvironment()
      },
      success,
      error_message: error,
      duration,
      metadata
    });
  }

  async logBusinessEvent(
    action: string,
    resource: string,
    resourceId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.log({
      userId,
      action,
      resource,
      resourceId,
      sessionId: this.generateSessionId(),
      category: 'business',
      severity: 'low',
      risk_level: 'none',
      context: {
        module: 'business',
        environment: this.getEnvironment()
      },
      success: true,
      metadata
    });
  }

  // Query and Retrieval
  async query(queryParams: Partial<AuditQuery>): Promise<{
    events: AuditEvent[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = AuditQuerySchema.parse(queryParams);
    
    let events = Array.from(this.events.values());
    
    // Apply filters
    if (query.startDate) {
      events = events.filter(e => e.timestamp >= query.startDate!);
    }
    
    if (query.endDate) {
      events = events.filter(e => e.timestamp <= query.endDate!);
    }
    
    if (query.userId) {
      events = events.filter(e => e.userId === query.userId);
    }
    
    if (query.action) {
      events = events.filter(e => e.action.includes(query.action!));
    }
    
    if (query.resource) {
      events = events.filter(e => e.resource === query.resource);
    }
    
    if (query.category) {
      events = events.filter(e => e.category === query.category);
    }
    
    if (query.severity) {
      events = events.filter(e => e.severity === query.severity);
    }
    
    if (query.success !== undefined) {
      events = events.filter(e => e.success === query.success);
    }
    
    // Sort events
    events.sort((a, b) => {
      const aValue = this.getFieldValue(a, query.sortBy);
      const bValue = this.getFieldValue(b, query.sortBy);
      
      if (query.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Pagination
    const total = events.length;
    const totalPages = Math.ceil(total / query.limit);
    const startIndex = (query.page - 1) * query.limit;
    const paginatedEvents = events.slice(startIndex, startIndex + query.limit);
    
    return {
      events: paginatedEvents,
      total,
      page: query.page,
      totalPages
    };
  }

  async getEvent(eventId: string): Promise<AuditEvent | null> {
    return this.events.get(eventId) || null;
  }

  async getUserActivity(
    userId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<AuditEvent[]> {
    const query = await this.query({
      userId,
      startDate,
      endDate,
      limit: 1000
    });
    
    return query.events;
  }

  async getSecurityEvents(
    severity?: 'low' | 'medium' | 'high' | 'critical',
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditEvent[]> {
    const query = await this.query({
      category: 'security',
      severity,
      startDate,
      endDate,
      limit: 1000
    });
    
    return query.events;
  }

  // Compliance and Reporting
  async generateComplianceReport(
    type: 'GDPR' | 'SOX' | 'HIPAA' | 'FERPA' | 'PCI_DSS' | 'custom',
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ): Promise<ComplianceReport> {
    const query = await this.query({
      startDate,
      endDate,
      limit: 10000
    });
    
    const events = query.events;
    const violations: Array<{
      rule: string;
      description: string;
      severity: string;
      events: string[];
    }> = [];
    
    // Check compliance rules
    for (const [ruleId, rule] of this.complianceRules.entries()) {
      const violatingEvents = events.filter(event => 
        this.matchesRule(event, rule)
      );
      
      if (violatingEvents.length > 0) {
        violations.push({
          rule: ruleId,
          description: rule.description,
          severity: rule.severity,
          events: violatingEvents.map(e => e.id)
        });
      }
    }
    
    const summary = {
      totalEvents: events.length,
      securityEvents: events.filter(e => e.category === 'security').length,
      dataAccess: events.filter(e => e.category === 'data').length,
      userActions: events.filter(e => e.category === 'user').length,
      systemEvents: events.filter(e => e.category === 'system').length,
      criticalEvents: events.filter(e => e.severity === 'critical').length,
      failedActions: events.filter(e => !e.success).length
    };
    
    const report: ComplianceReport = {
      id: this.generateReportId(),
      type,
      startDate,
      endDate,
      generatedAt: new Date(),
      generatedBy,
      events,
      summary,
      violations,
      recommendations: this.generateRecommendations(violations, summary)
    };
    
    return ComplianceReportSchema.parse(report);
  }

  // Analytics and Metrics
  async getAuditMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    errorRate: number;
    topUsers: Array<{ userId: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
    riskScore: number;
  }> {
    const query = await this.query({
      startDate,
      endDate,
      limit: 10000
    });
    
    const events = query.events;
    
    // Event counts by category
    const eventsByCategory: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    const hourlyDistribution: Record<number, number> = {};
    
    let failedEvents = 0;
    let riskScore = 0;
    
    events.forEach(event => {
      // Category counts
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
      
      // Severity counts
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // User counts
      if (event.userId) {
        userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      }
      
      // Action counts
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
      
      // Hourly distribution
      const hour = event.timestamp.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      
      // Failed events
      if (!event.success) {
        failedEvents++;
      }
      
      // Risk scoring
      const severityWeights = { low: 1, medium: 2, high: 3, critical: 5 };
      const riskWeights = { none: 0, low: 1, medium: 2, high: 3, critical: 5 };
      
      riskScore += severityWeights[event.severity] + riskWeights[event.risk_level];
    });
    
    // Convert to arrays and sort
    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const hourlyArray = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyDistribution[hour] || 0
    }));
    
    return {
      totalEvents: events.length,
      eventsByCategory,
      eventsBySeverity,
      errorRate: events.length > 0 ? failedEvents / events.length : 0,
      topUsers,
      topActions,
      hourlyDistribution: hourlyArray,
      riskScore: events.length > 0 ? riskScore / events.length : 0
    };
  }

  // Event Listeners
  addListener(callback: (event: AuditEvent) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (event: AuditEvent) => void): void {
    this.listeners.delete(callback);
  }

  // Private Methods
  private async processImmediately(event: AuditEvent): Promise<void> {
    // Store critical events immediately
    this.events.set(event.id, event);
    
    // Send immediate alerts for critical events
    if (event.severity === 'critical') {
      await this.sendCriticalAlert(event);
    }
  }

  private async checkCompliance(event: AuditEvent): Promise<void> {
    for (const [ruleId, rule] of this.complianceRules.entries()) {
      if (this.matchesRule(event, rule)) {
        // Log compliance violation
        await this.logComplianceViolation(ruleId, event, rule);
      }
    }
  }

  private matchesRule(event: AuditEvent, rule: any): boolean {
    if (typeof rule.pattern === 'string') {
      return event.action.includes(rule.pattern);
    } else if (rule.pattern instanceof RegExp) {
      return rule.pattern.test(event.action);
    }
    return false;
  }

  private async logComplianceViolation(
    ruleId: string, 
    event: AuditEvent, 
    rule: any
  ): Promise<void> {
    console.warn(`Compliance violation detected: ${ruleId}`, {
      eventId: event.id,
      rule: rule.description,
      severity: rule.severity
    });
  }

  private async sendCriticalAlert(event: AuditEvent): Promise<void> {
    // In a real implementation, this would send alerts via email, SMS, etc.
    console.error('CRITICAL AUDIT EVENT:', event);
  }

  private notifyListeners(event: AuditEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in audit listener:', error);
      }
    });
  }

  private startBatchProcessor(): void {
    setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.flushBuffer();
      }
    }, this.flushInterval);
  }

  private async flushBuffer(): Promise<void> {
    const eventsToProcess = [...this.eventBuffer];
    this.eventBuffer = [];
    
    for (const event of eventsToProcess) {
      this.events.set(event.id, event);
    }
  }

  private startCleanupProcess(): void {
    // Clean up old events every hour
    setInterval(() => {
      const cutoffDate = new Date(Date.now() - this.retentionPeriod);
      
      for (const [eventId, event] of this.events.entries()) {
        if (event.timestamp < cutoffDate) {
          this.events.delete(eventId);
        }
      }
    }, 60 * 60 * 1000);
  }

  private detectPII(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const piiFields = ['email', 'phone', 'ssn', 'address', 'name', 'dob'];
    const dataString = JSON.stringify(data).toLowerCase();
    
    return piiFields.some(field => dataString.includes(field));
  }

  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((o, key) => o?.[key], obj);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    return (process.env.NODE_ENV as any) || 'development';
  }

  private initializeComplianceRules(): void {
    // GDPR rules
    this.complianceRules.set('gdpr_data_access', {
      pattern: /data_(read|access)/,
      severity: 'medium',
      description: 'Personal data access must be logged',
      actions: ['notify_dpo']
    });
    
    this.complianceRules.set('gdpr_data_deletion', {
      pattern: /data_delete/,
      severity: 'high',
      description: 'Personal data deletion must be audited',
      actions: ['verify_consent', 'notify_dpo']
    });
    
    // Security rules
    this.complianceRules.set('failed_login_attempts', {
      pattern: /login_failed/,
      severity: 'medium',
      description: 'Multiple failed login attempts',
      actions: ['monitor_ip', 'consider_blocking']
    });
    
    this.complianceRules.set('privilege_escalation', {
      pattern: /privilege|admin|escalate/,
      severity: 'high',
      description: 'Privilege escalation detected',
      actions: ['immediate_review', 'notify_security']
    });
  }

  private generateRecommendations(
    violations: Array<any>, 
    summary: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (violations.length > 0) {
      recommendations.push('Review and address compliance violations');
    }
    
    if (summary.criticalEvents > 0) {
      recommendations.push('Investigate critical security events');
    }
    
    if (summary.failedActions / summary.totalEvents > 0.1) {
      recommendations.push('High error rate detected - review system stability');
    }
    
    return recommendations;
  }
}

// Singleton instance
export const auditSystem = new AuditSystem();