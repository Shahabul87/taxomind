// Real-time Analytics WebSocket Implementation

import { EventTrackingService } from './event-tracking-service';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export interface RealtimeAnalyticsData {
  activeUsers: number;
  currentEvents: number;
  systemLoad: number;
  engagementScore: number;
  topActivities: ActivityData[];
  alerts: AnalyticsAlert[];
  timestamp: number;
}

export interface ActivityData {
  type: string;
  count: number;
  trend: number;
  users: string[];
}

export interface AnalyticsAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  data?: any;
}

export interface ClientSubscription {
  id: string;
  userId?: string;
  courseId?: string;
  view: 'student' | 'teacher' | 'admin';
  filters: {
    events?: string[];
    courses?: string[];
    users?: string[];
  };
  lastPing: number;
}

export class RealtimeAnalyticsWebSocket {
  private clients: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, ClientSubscription> = new Map();
  private eventTracker: EventTrackingService;
  private updateInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.eventTracker = new EventTrackingService();
  }

  // Initialize WebSocket server
  initialize() {
    if (this.isRunning) return;

    this.startRealTimeUpdates();
    this.startPingInterval();
    this.setupEventListeners();
    
    this.isRunning = true;

  }

  // Add new client connection
  addClient(clientId: string, ws: WebSocket, subscription: Omit<ClientSubscription, 'id' | 'lastPing'>) {

    this.clients.set(clientId, ws);
    this.subscriptions.set(clientId, {
      id: clientId,
      ...subscription,
      lastPing: Date.now()
    });

    // Setup WebSocket event handlers
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.removeClient(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));
    ws.on('pong', () => this.handlePong(clientId));

    // Send initial data
    this.sendInitialData(clientId);
  }

  // Remove client connection
  removeClient(clientId: string) {

    const ws = this.clients.get(clientId);
    if (ws) {
      ws.close();
      this.clients.delete(clientId);
    }
    
    this.subscriptions.delete(clientId);
  }

  // Handle incoming WebSocket messages
  private handleMessage(clientId: string, data: any) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ping':
          this.handlePing(clientId);
          break;
        case 'subscribe':
          this.handleSubscribe(clientId, message.data);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message.data);
          break;
        case 'filter':
          this.handleFilter(clientId, message.data);
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  // Handle ping messages
  private handlePing(clientId: string) {
    const subscription = this.subscriptions.get(clientId);
    if (subscription) {
      subscription.lastPing = Date.now();
      this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
    }
  }

  // Handle pong responses
  private handlePong(clientId: string) {
    const subscription = this.subscriptions.get(clientId);
    if (subscription) {
      subscription.lastPing = Date.now();
    }
  }

  // Handle subscription updates
  private handleSubscribe(clientId: string, data: any) {
    const subscription = this.subscriptions.get(clientId);
    if (subscription) {
      // Update subscription filters
      subscription.filters = { ...subscription.filters, ...data.filters };
      
      // Send updated data
      this.sendAnalyticsData(clientId);
    }
  }

  // Handle unsubscribe requests
  private handleUnsubscribe(clientId: string, data: any) {
    const subscription = this.subscriptions.get(clientId);
    if (subscription) {
      // Remove specific filters
      if (data.events) {
        subscription.filters.events = subscription.filters.events?.filter(
          event => !data.events.includes(event)
        );
      }
      if (data.courses) {
        subscription.filters.courses = subscription.filters.courses?.filter(
          course => !data.courses.includes(course)
        );
      }
    }
  }

  // Handle filter updates
  private handleFilter(clientId: string, data: any) {
    const subscription = this.subscriptions.get(clientId);
    if (subscription) {
      subscription.filters = data;
      this.sendAnalyticsData(clientId);
    }
  }

  // Handle WebSocket errors
  private handleError(clientId: string, error: Error) {
    logger.error(`WebSocket error for client ${clientId}:`, error);
    this.removeClient(clientId);
  }

  // Send initial data to new client
  private async sendInitialData(clientId: string) {
    try {
      await this.sendAnalyticsData(clientId);
    } catch (error) {
      logger.error('Error sending initial data:', error);
    }
  }

  // Send analytics data to specific client
  private async sendAnalyticsData(clientId: string) {
    try {
      const subscription = this.subscriptions.get(clientId);
      if (!subscription) return;

      const data = await this.generateAnalyticsData(subscription);
      this.sendToClient(clientId, {
        type: 'analytics_update',
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Error sending analytics data:', error);
    }
  }

  // Generate real-time analytics data
  private async generateAnalyticsData(subscription: ClientSubscription): Promise<RealtimeAnalyticsData> {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    try {
      // Get active users count
      const activeUsers = await this.getActiveUsers(subscription);
      
      // Get current event rate
      const currentEvents = await this.getCurrentEventRate(subscription);
      
      // Get system load
      const systemLoad = await this.getSystemLoad();
      
      // Calculate engagement score
      const engagementScore = await this.calculateEngagementScore(subscription);
      
      // Get top activities
      const topActivities = await this.getTopActivities(subscription);
      
      // Get alerts
      const alerts = await this.getAnalyticsAlerts(subscription);
      
      return {
        activeUsers,
        currentEvents,
        systemLoad,
        engagementScore,
        topActivities,
        alerts,
        timestamp: now
      };
    } catch (error) {
      logger.error('Error generating analytics data:', error);
      return {
        activeUsers: 0,
        currentEvents: 0,
        systemLoad: 0,
        engagementScore: 0,
        topActivities: [],
        alerts: [],
        timestamp: now
      };
    }
  }

  // Get active users count
  private async getActiveUsers(subscription: ClientSubscription): Promise<number> {
    try {
      const key = subscription.courseId 
        ? `analytics:active_users:course:${subscription.courseId}` 
        : 'analytics:active_users:global';
      
      const count = await redis.scard(key);
      return count;
    } catch (error) {
      logger.error('Error getting active users:', error);
      return 0;
    }
  }

  // Get current event rate
  private async getCurrentEventRate(subscription: ClientSubscription): Promise<number> {
    try {
      const key = subscription.courseId 
        ? `analytics:events:rate:course:${subscription.courseId}` 
        : 'analytics:events:rate:global';
      
      const rate = await redis.get(key);
      return parseFloat(rate || '0');
    } catch (error) {
      logger.error('Error getting event rate:', error);
      return 0;
    }
  }

  // Get system load
  private async getSystemLoad(): Promise<number> {
    try {
      const load = await redis.get('analytics:system:load');
      return parseFloat(load || '0');
    } catch (error) {
      logger.error('Error getting system load:', error);
      return 0;
    }
  }

  // Calculate engagement score
  private async calculateEngagementScore(subscription: ClientSubscription): Promise<number> {
    try {
      const key = subscription.courseId 
        ? `analytics:engagement:course:${subscription.courseId}` 
        : 'analytics:engagement:global';
      
      const score = await redis.get(key);
      return parseFloat(score || '0');
    } catch (error) {
      logger.error('Error calculating engagement score:', error);
      return 0;
    }
  }

  // Get top activities
  private async getTopActivities(subscription: ClientSubscription): Promise<ActivityData[]> {
    try {
      const key = subscription.courseId 
        ? `analytics:activities:course:${subscription.courseId}` 
        : 'analytics:activities:global';
      
      const activities = await redis.hgetall(key);
      
      return Object.entries(activities).map(([type, data]) => {
        const parsedData = JSON.parse(data);
        return {
          type,
          count: parsedData.count || 0,
          trend: parsedData.trend || 0,
          users: parsedData.users || []
        };
      }).sort((a, b) => b.count - a.count).slice(0, 10);
    } catch (error) {
      logger.error('Error getting top activities:', error);
      return [];
    }
  }

  // Get analytics alerts
  private async getAnalyticsAlerts(subscription: ClientSubscription): Promise<AnalyticsAlert[]> {
    try {
      const key = subscription.courseId 
        ? `analytics:alerts:course:${subscription.courseId}` 
        : 'analytics:alerts:global';
      
      const alerts = await redis.lrange(key, 0, 19); // Get last 20 alerts
      
      return alerts.map(alert => JSON.parse(alert));
    } catch (error) {
      logger.error('Error getting analytics alerts:', error);
      return [];
    }
  }

  // Send message to specific client
  private sendToClient(clientId: string, message: any) {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Error sending message to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  // Broadcast message to all clients
  private broadcast(message: any, filter?: (subscription: ClientSubscription) => boolean) {
    this.subscriptions.forEach((subscription, clientId) => {
      if (!filter || filter(subscription)) {
        this.sendToClient(clientId, message);
      }
    });
  }

  // Start real-time updates
  private startRealTimeUpdates() {
    this.updateInterval = setInterval(async () => {
      // Send updates to all connected clients
      for (const [clientId, subscription] of this.subscriptions) {
        await this.sendAnalyticsData(clientId);
      }
    }, 5000); // Update every 5 seconds
  }

  // Start ping interval
  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds
      
      // Remove inactive clients
      this.subscriptions.forEach((subscription, clientId) => {
        if (now - subscription.lastPing > timeout) {

          this.removeClient(clientId);
        } else {
          // Send ping
          this.sendToClient(clientId, { type: 'ping', timestamp: now });
        }
      });
    }, 15000); // Ping every 15 seconds
  }

  // Setup event listeners for analytics events
  private setupEventListeners() {
    // Listen for new analytics events
    this.eventTracker.on('new_event', (event) => {
      this.handleNewEvent(event);
    });
    
    // Listen for system alerts
    this.eventTracker.on('system_alert', (alert) => {
      this.handleSystemAlert(alert);
    });
  }

  // Handle new analytics event
  private handleNewEvent(event: any) {
    // Update real-time metrics
    this.updateRealTimeMetrics(event);
    
    // Check for alerts
    this.checkForAlerts(event);
    
    // Broadcast to relevant clients
    this.broadcast({
      type: 'event_update',
      event,
      timestamp: Date.now()
    }, (subscription) => {
      // Filter based on subscription
      if (subscription.courseId && event.courseId !== subscription.courseId) {
        return false;
      }
      if (subscription.userId && event.userId !== subscription.userId) {
        return false;
      }
      return true;
    });
  }

  // Handle system alert
  private handleSystemAlert(alert: AnalyticsAlert) {
    // Broadcast alert to all clients
    this.broadcast({
      type: 'alert',
      alert,
      timestamp: Date.now()
    });
  }

  // Update real-time metrics
  private async updateRealTimeMetrics(event: any) {
    try {
      // Update active users
      await redis.sadd('analytics:active_users:global', event.userId);
      await redis.expire('analytics:active_users:global', 300); // 5 minutes
      
      if (event.courseId) {
        await redis.sadd(`analytics:active_users:course:${event.courseId}`, event.userId);
        await redis.expire(`analytics:active_users:course:${event.courseId}`, 300);
      }
      
      // Update event rate
      await redis.incr('analytics:events:count:global');
      await redis.expire('analytics:events:count:global', 60); // 1 minute
      
      if (event.courseId) {
        await redis.incr(`analytics:events:count:course:${event.courseId}`);
        await redis.expire(`analytics:events:count:course:${event.courseId}`, 60);
      }
      
      // Update activities
      const activityKey = event.courseId 
        ? `analytics:activities:course:${event.courseId}`
        : 'analytics:activities:global';
      
      const activityData = await redis.hget(activityKey, event.eventType) || '{"count": 0, "users": []}';
      const parsed = JSON.parse(activityData);
      parsed.count += 1;
      if (!parsed.users.includes(event.userId)) {
        parsed.users.push(event.userId);
      }
      
      await redis.hset(activityKey, event.eventType, JSON.stringify(parsed));
      await redis.expire(activityKey, 300);
    } catch (error) {
      logger.error('Error updating real-time metrics:', error);
    }
  }

  // Check for alerts based on events
  private async checkForAlerts(event: any) {
    try {
      // Check for high error rates
      if (event.eventType === 'error') {
        const errorCount = await redis.get('analytics:errors:count') || '0';
        const totalEvents = await redis.get('analytics:events:count:global') || '1';
        const errorRate = (parseInt(errorCount) / parseInt(totalEvents)) * 100;
        
        if (errorRate > 5) { // 5% error rate threshold
          const alert: AnalyticsAlert = {
            id: `error_rate_${Date.now()}`,
            type: 'error',
            message: `High error rate detected: ${errorRate.toFixed(2)}%`,
            severity: errorRate > 10 ? 'critical' : 'high',
            timestamp: Date.now(),
            data: { errorRate, errorCount, totalEvents }
          };
          
          await this.saveAlert(alert);
          this.handleSystemAlert(alert);
        }
      }
      
      // Check for low engagement
      if (event.eventType === 'session_end') {
        const sessionDuration = event.metadata?.duration;
        if (sessionDuration && sessionDuration < 300) { // Less than 5 minutes
          const shortSessionsKey = 'analytics:short_sessions:count';
          const shortSessions = await redis.incr(shortSessionsKey);
          await redis.expire(shortSessionsKey, 3600); // 1 hour
          
          if (shortSessions > 10) { // More than 10 short sessions in an hour
            const alert: AnalyticsAlert = {
              id: `low_engagement_${Date.now()}`,
              type: 'warning',
              message: `High number of short sessions detected: ${shortSessions}`,
              severity: 'medium',
              timestamp: Date.now(),
              data: { shortSessions, threshold: 10 }
            };
            
            await this.saveAlert(alert);
            this.handleSystemAlert(alert);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking for alerts:', error);
    }
  }

  // Save alert to Redis
  private async saveAlert(alert: AnalyticsAlert) {
    try {
      const key = alert.data?.courseId 
        ? `analytics:alerts:course:${alert.data.courseId}`
        : 'analytics:alerts:global';
      
      await redis.lpush(key, JSON.stringify(alert));
      await redis.ltrim(key, 0, 99); // Keep last 100 alerts
      await redis.expire(key, 86400); // 24 hours
    } catch (error) {
      logger.error('Error saving alert:', error);
    }
  }

  // Get connection statistics
  getStats() {
    return {
      connectedClients: this.clients.size,
      subscriptions: this.subscriptions.size,
      isRunning: this.isRunning
    };
  }

  // Shutdown WebSocket server
  shutdown() {

    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Close all client connections
    this.clients.forEach((ws, clientId) => {
      ws.close();
    });
    
    this.clients.clear();
    this.subscriptions.clear();
    this.isRunning = false;

  }
}

// Export singleton instance
export const realtimeAnalytics = new RealtimeAnalyticsWebSocket();