import { Server as SocketIOServer } from 'socket.io';
import { db } from '@/lib/db';
import { CollaborativeUser, CollaborativeSession } from './websocket-server';
import { YjsDocumentManager } from './yjs-document-manager';
import { nanoid } from 'nanoid';

export interface SessionCreationData {
  id: string;
  contentType: string;
  contentId: string;
  roomId: string;
  title?: string;
  isActive: boolean;
  lockType: 'NONE' | 'SOFT' | 'HARD' | 'SECTION';
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface LockResult {
  success: boolean;
  reason?: string;
}

export class CollaborativeSessionManager {
  private sessions: Map<string, CollaborativeSession> = new Map();
  private documentManager: YjsDocumentManager;
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.documentManager = new YjsDocumentManager();
    this.loadActiveSessions();
  }

  private async loadActiveSessions() {
    try {
      const activeSessions = await db.collaborativeSession.findMany({
        where: { isActive: true },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      for (const session of activeSessions) {
        const collaborativeSession: CollaborativeSession = {
          id: session.id,
          contentType: session.contentType,
          contentId: session.contentId,
          roomId: session.roomId,
          title: session.title || undefined,
          isActive: session.isActive,
          lockType: session.lockType as 'NONE' | 'SOFT' | 'HARD' | 'SECTION',
          lockedBy: session.lockedBy || undefined,
          participants: new Map(),
          yjsDoc: await this.documentManager.getOrCreateDocument(session.id),
          createdBy: session.createdById,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
        };

        // Load participants
        for (const participant of session.participants) {
          const user: CollaborativeUser = {
            id: participant.user.id,
            name: participant.user.name || 'Anonymous',
            email: participant.user.email || '',
            avatar: participant.user.image || undefined,
            role: participant.role as 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'MODERATOR' | 'ADMIN',
            cursorColor: participant.cursorColor,
          };
          collaborativeSession.participants.set(user.id, user);
        }

        this.sessions.set(session.id, collaborativeSession);
      }

      console.log(`Loaded ${activeSessions.length} active collaborative sessions`);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  }

  async createSession(data: SessionCreationData): Promise<CollaborativeSession> {
    try {
      // Create database record
      const dbSession = await db.collaborativeSession.create({
        data: {
          id: data.id,
          contentType: data.contentType,
          contentId: data.contentId,
          roomId: data.roomId,
          title: data.title,
          isActive: data.isActive,
          lockType: data.lockType,
          createdById: data.createdBy,
          lastActivity: data.lastActivity,
        },
      });

      // Create YJS document
      const yjsDoc = await this.documentManager.createDocument(data.id);

      // Create session object
      const session: CollaborativeSession = {
        id: data.id,
        contentType: data.contentType,
        contentId: data.contentId,
        roomId: data.roomId,
        title: data.title,
        isActive: data.isActive,
        lockType: data.lockType,
        participants: new Map(),
        yjsDoc,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        lastActivity: data.lastActivity,
      };

      this.sessions.set(data.id, session);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create collaborative session');
    }
  }

  async getSession(sessionId: string): Promise<CollaborativeSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async addParticipant(sessionId: string, user: CollaborativeUser): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add to in-memory session
    session.participants.set(user.id, user);

    try {
      // Update database
      await db.sessionParticipant.upsert({
        where: {
          sessionId_userId: {
            sessionId,
            userId: user.id,
          },
        },
        update: {
          isOnline: true,
          lastSeen: new Date(),
          role: user.role,
          cursorColor: user.cursorColor,
          displayName: user.name,
        },
        create: {
          sessionId,
          userId: user.id,
          role: user.role,
          cursorColor: user.cursorColor,
          displayName: user.name,
          isOnline: true,
          lastSeen: new Date(),
        },
      });

      // Track activity
      await this.trackActivity(sessionId, user.id, 'USER_JOINED', 'User joined the session');
    } catch (error) {
      console.error('Error adding participant:', error);
      throw new Error('Failed to add participant to session');
    }
  }

  async removeParticipant(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Remove from in-memory session
    session.participants.delete(userId);

    try {
      // Update database
      await db.sessionParticipant.update({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
        data: {
          isOnline: false,
          leftAt: new Date(),
        },
      });

      // Track activity
      await this.trackActivity(sessionId, userId, 'USER_LEFT', 'User left the session');
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  }

  async requestLock(
    sessionId: string,
    userId: string,
    lockType: 'SOFT' | 'HARD' | 'SECTION',
    section?: string
  ): Promise<LockResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    // Check if session is already locked
    if (session.lockType !== 'NONE' && session.lockedBy !== userId) {
      return { success: false, reason: 'Session is already locked by another user' };
    }

    try {
      // Update database
      await db.collaborativeSession.update({
        where: { id: sessionId },
        data: {
          lockType,
          lockedBy: userId,
          lockedAt: new Date(),
        },
      });

      // Update in-memory session
      session.lockType = lockType;
      session.lockedBy = userId;

      // Track activity
      await this.trackActivity(
        sessionId,
        userId,
        'LOCK_ACQUIRED',
        `Acquired ${lockType} lock${section ? ` on section ${section}` : ''}`
      );

      return { success: true };
    } catch (error) {
      console.error('Error requesting lock:', error);
      return { success: false, reason: 'Failed to acquire lock' };
    }
  }

  async releaseLock(sessionId: string, userId: string, section?: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Only the lock owner can release the lock
    if (session.lockedBy !== userId) return;

    try {
      // Update database
      await db.collaborativeSession.update({
        where: { id: sessionId },
        data: {
          lockType: 'NONE',
          lockedBy: null,
          lockedAt: null,
        },
      });

      // Update in-memory session
      session.lockType = 'NONE';
      session.lockedBy = undefined;

      // Track activity
      await this.trackActivity(
        sessionId,
        userId,
        'LOCK_RELEASED',
        `Released lock${section ? ` on section ${section}` : ''}`
      );
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }

  async updateActivity(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.lastActivity = new Date();

    try {
      await db.collaborativeSession.update({
        where: { id: sessionId },
        data: { lastActivity: new Date() },
      });
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }

  async setUserOffline(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      await db.sessionParticipant.update({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
        data: {
          isOnline: false,
          leftAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error setting user offline:', error);
    }
  }

  async updatePresence(sessionId: string, userId: string, presence: any): Promise<void> {
    try {
      await db.sessionParticipant.update({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
        data: {
          lastSeen: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Update database
      await db.collaborativeSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          lockType: 'NONE',
          lockedBy: null,
          lockedAt: null,
        },
      });

      // Mark all participants as offline
      await db.sessionParticipant.updateMany({
        where: { sessionId },
        data: {
          isOnline: false,
          leftAt: new Date(),
        },
      });

      // Remove from memory
      this.sessions.delete(sessionId);

      // Cleanup YJS document
      await this.documentManager.cleanupDocument(sessionId);

      // Notify all participants
      this.io.to(session.roomId).emit('session-ended', {
        sessionId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  async createSnapshot(sessionId: string, name?: string, description?: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const documentState = await this.documentManager.getDocumentState(sessionId);
      const yjsState = await this.documentManager.serializeDocument(sessionId);

      await db.sessionSnapshot.create({
        data: {
          sessionId,
          name: name || `Snapshot ${new Date().toISOString()}`,
          description,
          snapshotType: 'MANUAL',
          content: documentState,
          yjsState,
          createdById: session.createdBy,
        },
      });
    } catch (error) {
      console.error('Error creating snapshot:', error);
    }
  }

  async getSessionAnalytics(sessionId: string) {
    try {
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
          activities: {
            orderBy: { timestamp: 'desc' },
            take: 100,
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          conflicts: {
            include: {
              user1: {
                select: {
                  id: true,
                  name: true,
                },
              },
              user2: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          snapshots: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      return session;
    } catch (error) {
      console.error('Error getting session analytics:', error);
      return null;
    }
  }

  private async trackActivity(
    sessionId: string,
    userId: string,
    activityType: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    try {
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId,
          activityType: activityType as any,
          description,
          metadata: metadata || {},
        },
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  // Cleanup inactive sessions
  async cleanupInactiveSessions(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    try {
      const inactiveSessions = await db.collaborativeSession.findMany({
        where: {
          isActive: true,
          lastActivity: {
            lt: cutoffTime,
          },
        },
      });

      for (const session of inactiveSessions) {
        await this.endSession(session.id);
      }

      console.log(`Cleaned up ${inactiveSessions.length} inactive sessions`);
    } catch (error) {
      console.error('Error cleaning up inactive sessions:', error);
    }
  }
}