import { Server as SocketIOServer } from 'socket.io';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface CursorPosition {
  userId: string;
  userName: string;
  position: number;
  line?: number;
  column?: number;
  selection?: {
    start: number;
    end: number;
  };
  timestamp: Date;
  cursorColor: string;
  isTyping: boolean;
}

export interface CursorUpdate {
  sessionId: string;
  position: number;
  line?: number;
  column?: number;
  selection?: {
    start: number;
    end: number;
  };
  isTyping?: boolean;
}

export class CursorManager {
  private io: SocketIOServer;
  private cursors: Map<string, Map<string, CursorPosition>> = new Map(); // sessionId -> userId -> cursor
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupCleanupInterval();
  }

  async handleCursorUpdate(socket: any, data: CursorUpdate): Promise<void> {
    try {
      const user = socket.data.user;
      if (!user) {
        return;
      }

      const { sessionId, position, line, column, selection, isTyping } = data;

      // Get session room info
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        select: { roomId: true },
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Update cursor position
      await this.updateCursor(sessionId, user.id, {
        userId: user.id,
        userName: user.name,
        position,
        line,
        column,
        selection,
        timestamp: new Date(),
        cursorColor: user.cursorColor,
        isTyping: isTyping || false,
      });

      // Handle typing indicator
      if (isTyping) {
        await this.setTypingStatus(sessionId, user.id, true);
      } else {
        await this.setTypingStatus(sessionId, user.id, false);
      }

      // Broadcast cursor update to other participants
      socket.to(session.roomId).emit('cursor-update', {
        userId: user.id,
        userName: user.name,
        position,
        line,
        column,
        selection,
        cursorColor: user.cursorColor,
        isTyping: isTyping || false,
        timestamp: new Date(),
      });

      // Track cursor activity
      await this.trackCursorActivity(sessionId, user.id, position, line, column);
    } catch (error: any) {
      logger.error('Error handling cursor update:', error);
      socket.emit('error', { message: 'Failed to update cursor' });
    }
  }

  async updateCursor(sessionId: string, userId: string, cursor: CursorPosition): Promise<void> {
    try {
      // Initialize session cursors if not exists
      if (!this.cursors.has(sessionId)) {
        this.cursors.set(sessionId, new Map());
      }

      const sessionCursors = this.cursors.get(sessionId)!;
      sessionCursors.set(userId, cursor);

      // Store in database for persistence
      await db.collaborativeCursor.upsert({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
        create: {
          sessionId,
          userId,
          position: cursor.position,
          line: cursor.line,
          column: cursor.column,
          selectionStart: cursor.selection?.start,
          selectionEnd: cursor.selection?.end,
          isTyping: cursor.isTyping,
          lastUpdate: cursor.timestamp,
        },
        update: {
          position: cursor.position,
          line: cursor.line,
          column: cursor.column,
          selectionStart: cursor.selection?.start,
          selectionEnd: cursor.selection?.end,
          isTyping: cursor.isTyping,
          lastUpdate: cursor.timestamp,
        },
      });
    } catch (error: any) {
      logger.error('Error updating cursor:', error);
      throw error;
    }
  }

  async removeCursor(sessionId: string, userId: string): Promise<void> {
    try {
      // Remove from memory
      const sessionCursors = this.cursors.get(sessionId);
      if (sessionCursors) {
        sessionCursors.delete(userId);
        
        // Clean up empty session maps
        if (sessionCursors.size === 0) {
          this.cursors.delete(sessionId);
        }
      }

      // Remove from database
      await db.collaborativeCursor.deleteMany({
        where: {
          sessionId,
          userId,
        },
      });

      // Get session room info and notify other participants
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        select: { roomId: true },
      });

      if (session) {
        this.io.to(session.roomId).emit('cursor-removed', {
          userId,
          timestamp: new Date(),
        });
      }
    } catch (error: any) {
      logger.error('Error removing cursor:', error);
    }
  }

  async getCursors(sessionId: string): Promise<CursorPosition[]> {
    try {
      // Try memory first
      const sessionCursors = this.cursors.get(sessionId);
      if (sessionCursors && sessionCursors.size > 0) {
        return Array.from(sessionCursors.values());
      }

      // Fallback to database
      const dbCursors = await db.collaborativeCursor.findMany({
        where: { sessionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 100,
      });

      const cursors: CursorPosition[] = dbCursors.map(cursor => ({
        userId: cursor.userId,
        userName: cursor.user.name || 'Anonymous',
        position: cursor.position,
        line: cursor.line || undefined,
        column: cursor.column || undefined,
        selection: cursor.selectionStart !== null && cursor.selectionEnd !== null
          ? {
              start: cursor.selectionStart,
              end: cursor.selectionEnd,
            }
          : undefined,
        timestamp: cursor.lastUpdate,
        cursorColor: this.generateCursorColor(cursor.userId),
        isTyping: cursor.isTyping,
      }));

      // Update memory cache
      if (!this.cursors.has(sessionId)) {
        this.cursors.set(sessionId, new Map());
      }
      
      const sessionCursorsMap = this.cursors.get(sessionId)!;
      cursors.forEach(cursor => {
        sessionCursorsMap.set(cursor.userId, cursor);
      });

      return cursors;
    } catch (error: any) {
      logger.error('Error getting cursors:', error);
      return [];
    }
  }

  async getCursorPosition(sessionId: string, userId: string): Promise<CursorPosition | null> {
    try {
      // Try memory first
      const sessionCursors = this.cursors.get(sessionId);
      if (sessionCursors?.has(userId)) {
        return sessionCursors.get(userId)!;
      }

      // Fallback to database
      const dbCursor = await db.collaborativeCursor.findUnique({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!dbCursor) {
        return null;
      }

      const cursor: CursorPosition = {
        userId: dbCursor.userId,
        userName: dbCursor.user.name || 'Anonymous',
        position: dbCursor.position,
        line: dbCursor.line || undefined,
        column: dbCursor.column || undefined,
        selection: dbCursor.selectionStart !== null && dbCursor.selectionEnd !== null
          ? {
              start: dbCursor.selectionStart,
              end: dbCursor.selectionEnd,
            }
          : undefined,
        timestamp: dbCursor.lastUpdate,
        cursorColor: this.generateCursorColor(dbCursor.userId),
        isTyping: dbCursor.isTyping,
      };

      return cursor;
    } catch (error: any) {
      logger.error('Error getting cursor position:', error);
      return null;
    }
  }

  async setTypingStatus(sessionId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const timeoutKey = `${sessionId}:${userId}`;
      
      // Clear existing timeout
      const existingTimeout = this.typingTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.typingTimeouts.delete(timeoutKey);
      }

      if (isTyping) {
        // Set typing status
        const sessionCursors = this.cursors.get(sessionId);
        if (sessionCursors?.has(userId)) {
          const cursor = sessionCursors.get(userId)!;
          cursor.isTyping = true;
          cursor.timestamp = new Date();
        }

        // Auto-clear typing status after 2 seconds of inactivity
        const timeout = setTimeout(async () => {
          await this.setTypingStatus(sessionId, userId, false);
        }, 2000);
        
        this.typingTimeouts.set(timeoutKey, timeout);
      } else {
        // Clear typing status
        const sessionCursors = this.cursors.get(sessionId);
        if (sessionCursors?.has(userId)) {
          const cursor = sessionCursors.get(userId)!;
          cursor.isTyping = false;
          cursor.timestamp = new Date();
        }

        // Update database
        await db.collaborativeCursor.updateMany({
          where: {
            sessionId,
            userId,
          },
          data: {
            isTyping: false,
            lastUpdate: new Date(),
          },
        });

        // Notify other participants
        const session = await db.collaborativeSession.findUnique({
          where: { id: sessionId },
          select: { roomId: true },
        });

        if (session) {
          this.io.to(session.roomId).emit('typing-status-changed', {
            userId,
            isTyping: false,
            timestamp: new Date(),
          });
        }
      }
    } catch (error: any) {
      logger.error('Error setting typing status:', error);
    }
  }

  async getTypingUsers(sessionId: string): Promise<string[]> {
    try {
      const sessionCursors = this.cursors.get(sessionId);
      if (!sessionCursors) {
        return [];
      }

      const typingUsers: string[] = [];
      
      for (const [userId, cursor] of sessionCursors.entries()) {
        if (cursor.isTyping) {
          // Check if typing status is still valid (within last 3 seconds)
          const timeSinceUpdate = Date.now() - cursor.timestamp.getTime();
          if (timeSinceUpdate <= 3000) {
            typingUsers.push(userId);
          } else {
            // Auto-clear stale typing status
            await this.setTypingStatus(sessionId, userId, false);
          }
        }
      }

      return typingUsers;
    } catch (error: any) {
      logger.error('Error getting typing users:', error);
      return [];
    }
  }

  async transformCursors(
    sessionId: string,
    operation: any,
    excludeUserId?: string
  ): Promise<void> {
    try {
      const sessionCursors = this.cursors.get(sessionId);
      if (!sessionCursors) {
        return;
      }

      for (const [userId, cursor] of sessionCursors.entries()) {
        if (excludeUserId && userId === excludeUserId) {
          continue;
        }

        const transformedPosition = this.transformPosition(cursor.position, operation);
        
        if (transformedPosition !== cursor.position) {
          cursor.position = transformedPosition;
          cursor.timestamp = new Date();

          // Transform selection if exists
          if (cursor.selection) {
            cursor.selection.start = this.transformPosition(cursor.selection.start, operation);
            cursor.selection.end = this.transformPosition(cursor.selection.end, operation);
          }

          // Update database
          await this.updateCursor(sessionId, userId, cursor);
        }
      }

      // Notify participants about cursor transformations
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        select: { roomId: true },
      });

      if (session) {
        this.io.to(session.roomId).emit('cursors-transformed', {
          operationType: operation.type,
          operationPosition: operation.position,
          timestamp: new Date(),
        });
      }
    } catch (error: any) {
      logger.error('Error transforming cursors:', error);
    }
  }

  private transformPosition(position: number, operation: any): number {
    switch (operation.type) {
      case 'insert':
        if (operation.position <= position) {
          return position + (operation.content?.length || 0);
        }
        break;
        
      case 'delete':
        if (operation.position <= position) {
          const deleteEnd = operation.position + (operation.length || 0);
          if (position >= deleteEnd) {
            // Position is after the deleted range
            return position - (operation.length || 0);
          } else {
            // Position is within the deleted range - move to deletion start
            return operation.position;
          }
        }
        break;
        
      default:
        break;
    }
    
    return position;
  }

  private async trackCursorActivity(
    sessionId: string,
    userId: string,
    position: number,
    line?: number,
    column?: number
  ): Promise<void> {
    try {
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId,
          activityType: 'CURSOR_MOVED',
          description: 'User moved cursor',
          metadata: {
            position,
            line,
            column,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error: any) {
      // Don't throw error for tracking failures
      logger.error('Error tracking cursor activity:', error);
    }
  }

  private generateCursorColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE',
      '#85C1E9', '#F8C471', '#82E0AA', '#F1948A', '#85C1E9'
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }

  private setupCleanupInterval(): void {
    // Clean up stale cursors every minute
    setInterval(async () => {
      await this.cleanupStaleCursors();
    }, 60 * 1000);
  }

  private async cleanupStaleCursors(): Promise<void> {
    try {
      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes

      // Clean up from memory
      for (const [sessionId, sessionCursors] of this.cursors.entries()) {
        const staleCursors = Array.from(sessionCursors.entries())
          .filter(([_, cursor]) => cursor.timestamp < staleThreshold);

        for (const [userId, _] of staleCursors) {
          sessionCursors.delete(userId);
        }

        // Clean up empty session maps
        if (sessionCursors.size === 0) {
          this.cursors.delete(sessionId);
        }
      }

      // Clean up from database
      await db.collaborativeCursor.deleteMany({
        where: {
          lastUpdate: {
            lt: staleThreshold,
          },
        },
      });

      // Clean up typing timeouts
      for (const [key, timeout] of this.typingTimeouts.entries()) {
        const [sessionId, userId] = key.split(':');
        const cursor = this.cursors.get(sessionId)?.get(userId);
        
        if (!cursor || cursor.timestamp < staleThreshold) {
          clearTimeout(timeout);
          this.typingTimeouts.delete(key);
        }
      }
    } catch (error: any) {
      logger.error('Error cleaning up stale cursors:', error);
    }
  }

  async getCursorHistory(sessionId: string, userId: string, limit: number = 50): Promise<any[]> {
    try {
      const activities = await db.collaborativeActivity.findMany({
        where: {
          sessionId,
          userId,
          activityType: 'CURSOR_MOVED',
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return activities.map(activity => ({
        position: (activity.metadata as any)?.position,
        line: (activity.metadata as any)?.line,
        column: (activity.metadata as any)?.column,
        timestamp: activity.timestamp,
      }));
    } catch (error: any) {
      logger.error('Error getting cursor history:', error);
      return [];
    }
  }

  async cleanupSessionCursors(sessionId: string): Promise<void> {
    try {
      // Remove from memory
      this.cursors.delete(sessionId);

      // Clear typing timeouts for session
      for (const [key, timeout] of this.typingTimeouts.entries()) {
        if (key.startsWith(`${sessionId}:`)) {
          clearTimeout(timeout);
          this.typingTimeouts.delete(key);
        }
      }

      // Remove from database
      await db.collaborativeCursor.deleteMany({
        where: { sessionId },
      });

      logger.info(`Cleaned up cursors for session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error cleaning up session cursors:', error);
    }
  }

  destroy(): void {
    // Clear all timeouts
    for (const timeout of this.typingTimeouts.values()) {
      clearTimeout(timeout);
    }
    
    this.cursors.clear();
    this.typingTimeouts.clear();
  }
}