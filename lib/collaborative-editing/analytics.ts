import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface CollaborativeMetrics {
  sessionId: string;
  totalEdits: number;
  activeUsers: number;
  averageEditTime: number;
  conflictCount: number;
  lockCount: number;
  totalSessionTime: number;
  userContributions: Record<string, number>;
  peakConcurrency: number;
  documentLength: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  joinTime: Date;
  leaveTime?: Date;
  editCount: number;
  characterCount: number;
  lockRequests: number;
  conflictsResolved: number;
  commentsAdded: number;
  timeActive: number; // in milliseconds
}

export interface EditPattern {
  type: 'burst' | 'steady' | 'sporadic';
  frequency: number;
  averageSize: number;
  timeDistribution: number[];
}

export class CollaborativeAnalytics {
  private sessionMetrics: Map<string, CollaborativeMetrics> = new Map();
  private userSessions: Map<string, Map<string, UserActivity>> = new Map();
  private realTimeEvents: Map<string, any[]> = new Map();

  async trackUserJoin(sessionId: string, userId: string): Promise<void> {
    try {
      // Update database
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId,
          activityType: 'USER_JOINED',
          description: 'User joined collaborative session',
          metadata: {
            timestamp: new Date().toISOString(),
            eventType: 'join',
          },
        },
      });

      // Update in-memory tracking
      if (!this.userSessions.has(sessionId)) {
        this.userSessions.set(sessionId, new Map());
      }

      const sessionUsers = this.userSessions.get(sessionId)!;
      const user = await this.getUserInfo(userId);
      
      sessionUsers.set(userId, {
        userId,
        userName: user?.name || 'Anonymous',
        joinTime: new Date(),
        editCount: 0,
        characterCount: 0,
        lockRequests: 0,
        conflictsResolved: 0,
        commentsAdded: 0,
        timeActive: 0,
      });

      // Update session metrics
      await this.updateSessionMetrics(sessionId);
    } catch (error: any) {
      logger.error('Error tracking user join:', error);
    }
  }

  async trackUserLeave(sessionId: string, userId: string): Promise<void> {
    try {
      // Update database
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId,
          activityType: 'USER_LEFT',
          description: 'User left collaborative session',
          metadata: {
            timestamp: new Date().toISOString(),
            eventType: 'leave',
          },
        },
      });

      // Update in-memory tracking
      const sessionUsers = this.userSessions.get(sessionId);
      if (sessionUsers?.has(userId)) {
        const userActivity = sessionUsers.get(userId)!;
        userActivity.leaveTime = new Date();
        userActivity.timeActive = userActivity.leaveTime.getTime() - userActivity.joinTime.getTime();
      }

      // Update session metrics
      await this.updateSessionMetrics(sessionId);
    } catch (error: any) {
      logger.error('Error tracking user leave:', error);
    }
  }

  async trackDocumentEdit(sessionId: string, userId: string, operation: any): Promise<void> {
    try {
      const characterCount = this.calculateCharacterChange(operation);
      
      // Update database
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId,
          activityType: 'DOCUMENT_EDIT',
          description: `User made ${operation.type} edit`,
          metadata: {
            operationType: operation.type,
            position: operation.position,
            characterCount,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Update user activity
      const sessionUsers = this.userSessions.get(sessionId);
      if (sessionUsers?.has(userId)) {
        const userActivity = sessionUsers.get(userId)!;
        userActivity.editCount++;
        userActivity.characterCount += characterCount;
      }

      // Update real-time events
      this.addRealTimeEvent(sessionId, {
        type: 'edit',
        userId,
        operation,
        timestamp: new Date(),
        characterCount,
      });

      // Update session metrics
      await this.updateSessionMetrics(sessionId);
    } catch (error: any) {
      logger.error('Error tracking document edit:', error);
    }
  }

  async trackConflict(sessionId: string, userId1: string, userId2: string, conflictType: string): Promise<void> {
    try {
      // Create conflict record
      const conflict = await db.sessionConflict.create({
        data: {
          sessionId,
          user1Id: userId1,
          user2Id: userId2,
          conflictType,
          description: `Editing conflict between users`,
          resolved: false,
        },
      });

      // Track activity
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId: userId1,
          activityType: 'CONFLICT_DETECTED',
          description: `Editing conflict detected between users`,
          metadata: {
            conflictId: conflict.id,
            conflictType,
            otherUserId: userId2,
          },
        },
      });

      // Update session metrics
      await this.updateSessionMetrics(sessionId);
    } catch (error: any) {
      logger.error('Error tracking conflict:', error);
    }
  }

  async trackLockRequest(sessionId: string, userId: string, lockType: string): Promise<void> {
    try {
      // Update database
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId,
          activityType: 'LOCK_REQUESTED',
          description: `User requested ${lockType} lock`,
          metadata: {
            lockType,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Update user activity
      const sessionUsers = this.userSessions.get(sessionId);
      if (sessionUsers?.has(userId)) {
        const userActivity = sessionUsers.get(userId)!;
        userActivity.lockRequests++;
      }
    } catch (error: any) {
      logger.error('Error tracking lock request:', error);
    }
  }

  async trackUserDisconnect(sessionId: string, userId: string): Promise<void> {
    try {
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId,
          activityType: 'USER_DISCONNECTED',
          description: 'User disconnected unexpectedly',
          metadata: {
            timestamp: new Date().toISOString(),
            eventType: 'disconnect',
          },
        },
      });

      // Update user activity
      await this.trackUserLeave(sessionId, userId);
    } catch (error: any) {
      logger.error('Error tracking user disconnect:', error);
    }
  }

  async getSessionMetrics(sessionId: string): Promise<CollaborativeMetrics | null> {
    try {
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        include: {
          activities: {
            where: {
              activityType: {
                in: ['DOCUMENT_EDIT', 'USER_JOINED', 'USER_LEFT', 'CONFLICT_DETECTED', 'LOCK_REQUESTED'],
              },
            },
          },
          participants: true,
          conflicts: true,
        },
      });

      if (!session) return null;

      // Calculate metrics
      const editActivities = session.activities?.filter((a: any) => a.activityType === 'DOCUMENT_EDIT') || [];
      const totalEdits = editActivities.length;
      const activeUsers = session.participants?.length || 0;
      const conflictCount = session.conflicts?.length || 0;
      
      // Calculate user contributions
      const userContributions: Record<string, number> = {};
      editActivities.forEach((activity: any) => {
        userContributions[activity.userId] = (userContributions[activity.userId] || 0) + 1;
      });

      // Calculate average edit time
      const editTimes = editActivities
        .map((activity: any, index: number) => {
          if (index > 0) {
            const prevActivity = editActivities[index - 1];
            return activity.timestamp.getTime() - prevActivity.timestamp.getTime();
          }
          return 0;
        })
        .filter((time: number) => time > 0);

      const averageEditTime = editTimes.length > 0 
        ? editTimes.reduce((a: number, b: number) => a + b, 0) / editTimes.length 
        : 0;

      // Calculate session time
      const totalSessionTime = session.lastActivity.getTime() - session.createdAt.getTime();

      // Get peak concurrency
      const peakConcurrency = await this.calculatePeakConcurrency(sessionId);

      const metrics: CollaborativeMetrics = {
        sessionId,
        totalEdits,
        activeUsers,
        averageEditTime,
        conflictCount,
        lockCount: session.activities?.filter((a: any) => a.activityType === 'LOCK_REQUESTED').length || 0,
        totalSessionTime,
        userContributions,
        peakConcurrency,
        documentLength: 0, // Would need to calculate from document state
      };

      this.sessionMetrics.set(sessionId, metrics);
      return metrics;
    } catch (error: any) {
      logger.error('Error getting session metrics:', error);
      return null;
    }
  }

  async getUserActivityReport(sessionId: string, userId: string): Promise<UserActivity | null> {
    try {
      const activities = await db.collaborativeActivity.findMany({
        where: {
          sessionId,
          userId,
        },
        orderBy: { timestamp: 'asc' },
      });

      if (activities.length === 0) return null;

      const user = await this.getUserInfo(userId);
      const joinActivity = activities.find(a => a.activityType === 'USER_JOINED');
      const leaveActivity = activities.find(a => a.activityType === 'USER_LEFT');
      const editActivities = activities.filter(a => a.activityType === 'DOCUMENT_EDIT');
      
      // Calculate character count
      const characterCount = editActivities.reduce((total, activity) => {
        const metadata = activity.metadata as any;
        return total + (metadata.characterCount || 0);
      }, 0);

      const activity: UserActivity = {
        userId,
        userName: user?.name || 'Anonymous',
        joinTime: joinActivity?.timestamp || new Date(),
        leaveTime: leaveActivity?.timestamp || undefined,
        editCount: editActivities.length,
        characterCount,
        lockRequests: activities.filter(a => a.activityType === 'LOCK_REQUESTED').length,
        conflictsResolved: activities.filter(a => a.activityType === 'CONFLICT_RESOLVED').length,
        commentsAdded: activities.filter(a => a.activityType === 'COMMENT_ADDED').length,
        timeActive: leaveActivity 
          ? leaveActivity.timestamp.getTime() - (joinActivity?.timestamp.getTime() || 0)
          : Date.now() - (joinActivity?.timestamp.getTime() || 0),
      };

      return activity;
    } catch (error: any) {
      logger.error('Error getting user activity report:', error);
      return null;
    }
  }

  async getEditPatterns(sessionId: string, userId?: string): Promise<EditPattern> {
    try {
      const whereClause: any = {
        sessionId,
        activityType: 'DOCUMENT_EDIT',
      };

      if (userId) {
        whereClause.userId = userId;
      }

      const activities = await db.collaborativeActivity.findMany({
        where: whereClause,
        orderBy: { timestamp: 'asc' },
      });

      if (activities.length === 0) {
        return {
          type: 'sporadic',
          frequency: 0,
          averageSize: 0,
          timeDistribution: [],
        };
      }

      // Calculate time intervals between edits
      const intervals: number[] = [];
      for (let i = 1; i < activities.length; i++) {
        const interval = activities[i].timestamp.getTime() - activities[i - 1].timestamp.getTime();
        intervals.push(interval);
      }

      // Calculate average edit size
      const editSizes = activities.map(activity => {
        const metadata = activity.metadata as any;
        return Math.abs(metadata.characterCount || 1);
      });
      const averageSize = editSizes.reduce((a, b) => a + b, 0) / editSizes.length;

      // Determine pattern type based on intervals
      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance = this.calculateVariance(intervals);
      
      let type: 'burst' | 'steady' | 'sporadic';
      if (intervalVariance < averageInterval * 0.5) {
        type = 'steady';
      } else if (averageInterval < 5000) { // Less than 5 seconds average
        type = 'burst';
      } else {
        type = 'sporadic';
      }

      // Create time distribution (hourly buckets)
      const timeDistribution = new Array(24).fill(0);
      activities.forEach(activity => {
        const hour = activity.timestamp.getHours();
        timeDistribution[hour]++;
      });

      return {
        type,
        frequency: activities.length / (intervals.length > 0 ? Math.max(...intervals) / 60000 : 1), // edits per minute
        averageSize,
        timeDistribution,
      };
    } catch (error: any) {
      logger.error('Error getting edit patterns:', error);
      return {
        type: 'sporadic',
        frequency: 0,
        averageSize: 0,
        timeDistribution: [],
      };
    }
  }

  async getRealTimeEvents(sessionId: string, limit: number = 50): Promise<any[]> {
    const events = this.realTimeEvents.get(sessionId) || [];
    return events.slice(-limit);
  }

  async generateSessionReport(sessionId: string): Promise<any> {
    try {
      const metrics = await this.getSessionMetrics(sessionId);
      if (!metrics) return null;

      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Get user activity reports
      const userReports = await Promise.all(
        session?.participants.map(p => this.getUserActivityReport(sessionId, p.userId)) || []
      );

      // Get edit patterns
      const editPatterns = await this.getEditPatterns(sessionId);

      return {
        session: {
          id: sessionId,
          title: session?.title,
          duration: metrics.totalSessionTime,
          participants: session?.participants.length || 0,
        },
        metrics,
        userReports: userReports.filter(Boolean),
        editPatterns,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Error generating session report:', error);
      return null;
    }
  }

  private async updateSessionMetrics(sessionId: string): Promise<void> {
    // Update cached metrics
    await this.getSessionMetrics(sessionId);
  }

  private async getUserInfo(userId: string) {
    try {
      return await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    } catch (error: any) {
      logger.error('Error getting user info:', error);
      return null;
    }
  }

  private calculateCharacterChange(operation: any): number {
    switch (operation.type) {
      case 'insert':
        return operation.content?.length || 0;
      case 'delete':
        return -(operation.length || 0);
      case 'format':
        return 0;
      default:
        return 0;
    }
  }

  private addRealTimeEvent(sessionId: string, event: any): void {
    if (!this.realTimeEvents.has(sessionId)) {
      this.realTimeEvents.set(sessionId, []);
    }
    
    const events = this.realTimeEvents.get(sessionId)!;
    events.push(event);
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }
  }

  private async calculatePeakConcurrency(sessionId: string): Promise<number> {
    try {
      // This is a simplified calculation
      // In a real implementation, you'd track concurrent users over time
      const participants = await db.sessionParticipant.findMany({
        where: { sessionId },
      });

      return participants.length;
    } catch (error: any) {
      logger.error('Error calculating peak concurrency:', error);
      return 0;
    }
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    
    return variance;
  }

  async cleanupOldMetrics(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      // Cleanup old activities
      await db.collaborativeActivity.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up collaborative analytics older than ${daysToKeep} days`);
    } catch (error: any) {
      logger.error('Error cleaning up old metrics:', error);
    }
  }
}