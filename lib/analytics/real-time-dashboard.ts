// Real-time Dashboard - WebSocket-based real-time analytics

import { EventEmitter } from 'events';
import { redis } from '@/lib/redis';
import { AnalyticsEngine } from './analytics-engine';
import { logger } from '@/lib/logger';

export interface DashboardUpdate {
  type: 'metrics' | 'events' | 'users' | 'alerts';
  data: any;
  timestamp: Date;
}

export interface RealTimeDashboardConfig {
  updateInterval: number;
  maxConnections: number;
  enableAlerts: boolean;
}

export class RealTimeDashboard extends EventEmitter {
  private analyticsEngine?: AnalyticsEngine;
  private updateInterval?: NodeJS.Timeout;
  private connections: Set<any> = new Set();
  private config: RealTimeDashboardConfig;
  private isRunning: boolean = false;
  private lastMetrics: any = null;

  constructor(config?: Partial<RealTimeDashboardConfig>) {
    super();
    
    this.config = {
      updateInterval: 5000, // 5 seconds
      maxConnections: 100,
      enableAlerts: true,
      ...config
    };

    this.setupEventHandlers();
  }

  // Initialize and connect to analytics engine
  async connect(analyticsEngine: AnalyticsEngine): Promise<void> {
    this.analyticsEngine = analyticsEngine;

    // Start real-time updates
    await this.startRealTimeUpdates();
    
    this.isRunning = true;

  }

  // Start real-time data updates
  private async startRealTimeUpdates(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.broadcastUpdates();
      } catch (error: any) {
        logger.error('Error broadcasting dashboard updates:', error);
      }
    }, this.config.updateInterval);

    console.log(`Real-time updates started (interval: ${this.config.updateInterval}ms)`);
  }

  // Broadcast updates to all connected clients
  private async broadcastUpdates(): Promise<void> {
    if (!this.analyticsEngine) return;

    try {
      // Get latest metrics
      const [realTimeMetrics, recentEvents, systemHealth] = await Promise.all([
        this.analyticsEngine.getRealTimeMetrics(),
        this.getRecentEvents(),
        this.getSystemHealth()
      ]);

      // Prepare dashboard updates
      const updates: DashboardUpdate[] = [
        {
          type: 'metrics',
          data: realTimeMetrics,
          timestamp: new Date()
        },
        {
          type: 'events',
          data: recentEvents,
          timestamp: new Date()
        }
      ];

      // Check for alerts
      if (this.config.enableAlerts) {
        const alerts = await this.checkAlerts(realTimeMetrics, systemHealth);
        if (alerts.length > 0) {
          updates.push({
            type: 'alerts',
            data: alerts,
            timestamp: new Date()
          });
        }
      }

      // Emit updates
      updates.forEach(update => {
        this.emit('dashboard:update', update);
      });

      // Store latest metrics
      this.lastMetrics = realTimeMetrics;

    } catch (error: any) {
      logger.error('Failed to broadcast dashboard updates:', error);
    }
  }

  // Get recent events for dashboard
  private async getRecentEvents(): Promise<any[]> {
    try {
      if (!redis || typeof (redis as any).lrange !== 'function') {
        return [];
      }
      const events = await (redis as any).lrange('analytics:recent_events', 0, 19); // Last 20 events
      return events.map((eventJson: any) => {
        try {
          return JSON.parse(eventJson as string);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error: any) {
      logger.error('Failed to get recent events:', error);
      return [];
    }
  }

  // Get system health
  private async getSystemHealth(): Promise<any> {
    try {
      const healthData = await redis.get('system:health:latest');
      return healthData ? JSON.parse(healthData) : null;
    } catch (error: any) {
      logger.error('Failed to get system health:', error);
      return null;
    }
  }

  // Check for alerts
  private async checkAlerts(metrics: any, health: any): Promise<any[]> {
    const alerts = [];

    // High error rate alert
    if (metrics.errorRate > 5) {
      alerts.push({
        type: 'error',
        severity: 'high',
        message: `High error rate detected: ${metrics.errorRate}%`,
        timestamp: new Date()
      });
    }

    // High system load alert
    if (metrics.systemLoad > 80) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `High system load: ${metrics.systemLoad}%`,
        timestamp: new Date()
      });
    }

    // Low active users alert (during business hours)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17 && metrics.activeUsers < 10) {
      alerts.push({
        type: 'engagement',
        severity: 'info',
        message: `Low user activity: ${metrics.activeUsers} active users`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  // Add connection
  addConnection(connection: any): boolean {
    if (this.connections.size >= this.config.maxConnections) {
      return false;
    }

    this.connections.add(connection);
    
    // Send initial data to new connection
    this.sendInitialData(connection);
    
    return true;
  }

  // Remove connection
  removeConnection(connection: any): void {
    this.connections.delete(connection);
  }

  // Send initial data to new connection
  private async sendInitialData(connection: any): Promise<void> {
    try {
      if (!this.analyticsEngine) return;

      const [metrics, events] = await Promise.all([
        this.analyticsEngine.getRealTimeMetrics(),
        this.getRecentEvents()
      ]);

      const initialData = {
        type: 'initial',
        data: {
          metrics,
          events,
          timestamp: new Date()
        }
      };

      // Send to specific connection (implementation depends on your WebSocket setup)
      this.emit('connection:initial', { connection, data: initialData });

    } catch (error: any) {
      logger.error('Failed to send initial data:', error);
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<any> {
    return {
      connections: this.connections.size,
      isRunning: this.isRunning,
      updateInterval: this.config.updateInterval,
      lastUpdate: this.lastMetrics ? new Date() : null,
      config: this.config
    };
  }

  // Setup event handlers
  private setupEventHandlers(): void {
    this.setMaxListeners(200); // Increase for multiple connections

    // Handle Redis pub/sub events for real-time notifications
    this.setupRedisSubscriptions();
  }

  // Setup Redis subscriptions for real-time events
  private async setupRedisSubscriptions(): Promise<void> {
    try {
      // Subscribe to analytics events
      await redis.subscribe('analytics:events');
      await redis.subscribe('system:alerts');
      
      redis.on('message', (channel, message) => {
        this.handleRedisMessage(channel, message);
      });

    } catch (error: any) {
      logger.error('Failed to setup Redis subscriptions:', error);
    }
  }

  // Handle Redis pub/sub messages
  private handleRedisMessage(channel: string, message: string): void {
    try {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'analytics:events':
          this.emit('dashboard:update', {
            type: 'events',
            data: [data],
            timestamp: new Date()
          });
          break;
          
        case 'system:alerts':
          this.emit('dashboard:update', {
            type: 'alerts',
            data: [data],
            timestamp: new Date()
          });
          break;
      }
    } catch (error: any) {
      logger.error('Error handling Redis message:', error);
    }
  }

  // Trigger manual update
  async triggerUpdate(): Promise<void> {
    await this.broadcastUpdates();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      return {
        status: 'healthy',
        details: {
          isRunning: this.isRunning,
          connections: this.connections.size,
          analyticsConnected: !!this.analyticsEngine,
          updateInterval: this.config.updateInterval
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        details: { error: error.message }
      };
    }
  }

  // Shutdown dashboard
  async shutdown(): Promise<void> {

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Close all connections
    this.connections.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.isRunning = false;

  }

  // Get current metrics (sync)
  getCurrentMetrics(): any {
    return this.lastMetrics;
  }

  // Force metrics refresh
  async refreshMetrics(): Promise<any> {
    if (!this.analyticsEngine) {
      throw new Error('Analytics engine not connected');
    }

    const metrics = await this.analyticsEngine.getRealTimeMetrics();
    this.lastMetrics = metrics;
    
    // Broadcast update
    this.emit('dashboard:update', {
      type: 'metrics',
      data: metrics,
      timestamp: new Date()
    });

    return metrics;
  }

  // Update configuration
  updateConfig(newConfig: Partial<RealTimeDashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart updates if interval changed
    if (newConfig.updateInterval && this.isRunning) {
      this.startRealTimeUpdates();
    }
  }
}