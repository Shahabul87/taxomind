import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { CollaborativeSessionManager } from './session-manager';
import { YjsDocumentManager } from './yjs-document-manager';
import { OperationalTransformEngine } from './operational-transform';
import { CollaborativeAnalytics } from './analytics';
import { ConflictResolver } from './conflict-resolver';
import { PermissionManager } from './permission-manager';
import { CursorManager } from './cursor-manager';
import { CommentManager } from './comment-manager';
import { nanoid } from 'nanoid';

export interface CollaborativeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'MODERATOR' | 'ADMIN';
  cursorColor: string;
}

export interface CollaborativeSession {
  id: string;
  contentType: string;
  contentId: string;
  roomId: string;
  title?: string;
  isActive: boolean;
  lockType: 'NONE' | 'SOFT' | 'HARD' | 'SECTION';
  lockedBy?: string;
  participants: Map<string, CollaborativeUser>;
  yjsDoc: any; // YJS document
  createdBy: string;
  createdAt: Date;
  lastActivity: Date;
}

export class CollaborativeEditingServer {
  private io: SocketIOServer;
  private sessionManager: CollaborativeSessionManager;
  private documentManager: YjsDocumentManager;
  private transformEngine: OperationalTransformEngine;
  private analytics: CollaborativeAnalytics;
  private conflictResolver: ConflictResolver;
  private permissionManager: PermissionManager;
  private cursorManager: CursorManager;
  private commentManager: CommentManager;

  constructor(httpServer: any) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.sessionManager = new CollaborativeSessionManager(this.io);
    this.documentManager = new YjsDocumentManager();
    this.transformEngine = new OperationalTransformEngine();
    this.analytics = new CollaborativeAnalytics();
    this.conflictResolver = new ConflictResolver();
    this.permissionManager = new PermissionManager();
    this.cursorManager = new CursorManager(this.io);
    this.commentManager = new CommentManager(this.io);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log('User connected:', socket.id);
      
      // Authenticate user
      const user = await this.authenticateUser(socket);
      if (!user) {
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
        return;
      }

      socket.data.user = user;
      
      // Handle joining a collaborative session
      socket.on('join-session', async (data) => {
        try {
          await this.handleJoinSession(socket, data);
        } catch (error) {
          console.error('Error joining session:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Handle leaving a session
      socket.on('leave-session', async (data) => {
        try {
          await this.handleLeaveSession(socket, data);
        } catch (error) {
          console.error('Error leaving session:', error);
        }
      });

      // Handle document operations
      socket.on('document-operation', async (data) => {
        try {
          await this.handleDocumentOperation(socket, data);
        } catch (error) {
          console.error('Error handling document operation:', error);
          socket.emit('error', { message: 'Failed to process document operation' });
        }
      });

      // Handle cursor updates
      socket.on('cursor-update', async (data) => {
        try {
          await this.cursorManager.handleCursorUpdate(socket, data);
        } catch (error) {
          console.error('Error handling cursor update:', error);
        }
      });

      // Handle comments
      socket.on('add-comment', async (data) => {
        try {
          await this.commentManager.handleAddComment(socket, data);
        } catch (error) {
          console.error('Error adding comment:', error);
          socket.emit('error', { message: 'Failed to add comment' });
        }
      });

      socket.on('resolve-comment', async (data) => {
        try {
          await this.commentManager.handleResolveComment(socket, data);
        } catch (error) {
          console.error('Error resolving comment:', error);
          socket.emit('error', { message: 'Failed to resolve comment' });
        }
      });

      // Handle locking
      socket.on('request-lock', async (data) => {
        try {
          await this.handleRequestLock(socket, data);
        } catch (error) {
          console.error('Error requesting lock:', error);
          socket.emit('error', { message: 'Failed to request lock' });
        }
      });

      socket.on('release-lock', async (data) => {
        try {
          await this.handleReleaseLock(socket, data);
        } catch (error) {
          console.error('Error releasing lock:', error);
          socket.emit('error', { message: 'Failed to release lock' });
        }
      });

      // Handle conflict resolution
      socket.on('resolve-conflict', async (data) => {
        try {
          await this.conflictResolver.handleConflictResolution(socket, data);
        } catch (error) {
          console.error('Error resolving conflict:', error);
          socket.emit('error', { message: 'Failed to resolve conflict' });
        }
      });

      // Handle presence updates
      socket.on('presence-update', async (data) => {
        try {
          await this.handlePresenceUpdate(socket, data);
        } catch (error) {
          console.error('Error updating presence:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        await this.handleDisconnect(socket);
      });
    });
  }

  private async authenticateUser(socket: any): Promise<CollaborativeUser | null> {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return null;
      }

      // Verify JWT token and get user
      const session = await auth();
      if (!session?.user) {
        return null;
      }

      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name || 'Anonymous',
        email: user.email || '',
        avatar: user.image || undefined,
        role: user.role === 'ADMIN' ? 'ADMIN' : 'EDITOR',
        cursorColor: this.generateCursorColor(user.id),
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  private async handleJoinSession(socket: any, data: {
    sessionId: string;
    contentType: string;
    contentId: string;
  }) {
    const { sessionId, contentType, contentId } = data;
    const user = socket.data.user;

    // Check permissions
    const hasPermission = await this.permissionManager.checkPermission(
      user.id,
      contentType,
      contentId,
      'READ'
    );

    if (!hasPermission) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    // Get or create session
    let session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      session = await this.sessionManager.createSession({
        id: sessionId,
        contentType,
        contentId,
        roomId: nanoid(),
        title: `${contentType} collaboration`,
        isActive: true,
        lockType: 'NONE',
        createdBy: user.id,
        createdAt: new Date(),
        lastActivity: new Date(),
      });
    }

    // Join socket room
    socket.join(session.roomId);
    socket.data.sessionId = sessionId;
    socket.data.roomId = session.roomId;

    // Add user to session
    await this.sessionManager.addParticipant(sessionId, user);

    // Get document state
    const documentState = await this.documentManager.getDocumentState(sessionId);

    // Send initial state to client
    socket.emit('session-joined', {
      sessionId,
      roomId: session.roomId,
      user,
      participants: Array.from(session.participants.values()),
      documentState,
      lockType: session.lockType,
      lockedBy: session.lockedBy,
    });

    // Notify other participants
    socket.to(session.roomId).emit('user-joined', {
      user,
      participants: Array.from(session.participants.values()),
    });

    // Track analytics
    await this.analytics.trackUserJoin(sessionId, user.id);
  }

  private async handleLeaveSession(socket: any, data: { sessionId: string }) {
    const { sessionId } = data;
    const user = socket.data.user;

    if (!sessionId) return;

    const session = await this.sessionManager.getSession(sessionId);
    if (!session) return;

    // Leave socket room
    socket.leave(session.roomId);

    // Remove user from session
    await this.sessionManager.removeParticipant(sessionId, user.id);

    // Notify other participants
    socket.to(session.roomId).emit('user-left', {
      userId: user.id,
      participants: Array.from(session.participants.values()),
    });

    // Track analytics
    await this.analytics.trackUserLeave(sessionId, user.id);
  }

  private async handleDocumentOperation(socket: any, data: {
    sessionId: string;
    operation: any;
    cursor?: any;
  }) {
    const { sessionId, operation, cursor } = data;
    const user = socket.data.user;

    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    // Check edit permissions
    const hasPermission = await this.permissionManager.checkEditPermission(
      user.id,
      sessionId
    );

    if (!hasPermission) {
      socket.emit('error', { message: 'Edit permission denied' });
      return;
    }

    // Apply operational transform
    const transformedOperation = await this.transformEngine.transform(
      operation,
      sessionId,
      user.id
    );

    // Apply to document
    await this.documentManager.applyOperation(sessionId, transformedOperation);

    // Broadcast to other participants
    socket.to(session.roomId).emit('document-operation', {
      operation: transformedOperation,
      userId: user.id,
      timestamp: new Date(),
    });

    // Update cursor position if provided
    if (cursor) {
      await this.cursorManager.updateCursor(sessionId, user.id, cursor);
    }

    // Track analytics
    await this.analytics.trackDocumentEdit(sessionId, user.id, transformedOperation);

    // Update session activity
    await this.sessionManager.updateActivity(sessionId);
  }

  private async handleRequestLock(socket: any, data: {
    sessionId: string;
    lockType: 'SOFT' | 'HARD' | 'SECTION';
    section?: string;
  }) {
    const { sessionId, lockType, section } = data;
    const user = socket.data.user;

    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    // Check lock permissions
    const hasPermission = await this.permissionManager.checkLockPermission(
      user.id,
      sessionId
    );

    if (!hasPermission) {
      socket.emit('error', { message: 'Lock permission denied' });
      return;
    }

    // Attempt to acquire lock
    const lockResult = await this.sessionManager.requestLock(
      sessionId,
      user.id,
      lockType,
      section
    );

    if (lockResult.success) {
      // Notify all participants about lock
      this.io.to(session.roomId).emit('lock-acquired', {
        userId: user.id,
        lockType,
        section,
        timestamp: new Date(),
      });

      socket.emit('lock-granted', { lockType, section });
    } else {
      socket.emit('lock-denied', { reason: lockResult.reason });
    }
  }

  private async handleReleaseLock(socket: any, data: {
    sessionId: string;
    section?: string;
  }) {
    const { sessionId, section } = data;
    const user = socket.data.user;

    const session = await this.sessionManager.getSession(sessionId);
    if (!session) return;

    // Release lock
    await this.sessionManager.releaseLock(sessionId, user.id, section);

    // Notify all participants
    this.io.to(session.roomId).emit('lock-released', {
      userId: user.id,
      section,
      timestamp: new Date(),
    });
  }

  private async handlePresenceUpdate(socket: any, data: {
    sessionId: string;
    presence: any;
  }) {
    const { sessionId, presence } = data;
    const user = socket.data.user;

    const session = await this.sessionManager.getSession(sessionId);
    if (!session) return;

    // Update presence
    await this.sessionManager.updatePresence(sessionId, user.id, presence);

    // Broadcast to other participants
    socket.to(session.roomId).emit('presence-update', {
      userId: user.id,
      presence,
      timestamp: new Date(),
    });
  }

  private async handleDisconnect(socket: any) {
    const sessionId = socket.data.sessionId;
    const user = socket.data.user;

    if (sessionId && user) {
      // Mark user as offline
      await this.sessionManager.setUserOffline(sessionId, user.id);

      // Release any locks held by user
      await this.sessionManager.releaseLock(sessionId, user.id);

      // Remove cursor
      await this.cursorManager.removeCursor(sessionId, user.id);

      // Get session to notify other participants
      const session = await this.sessionManager.getSession(sessionId);
      if (session) {
        socket.to(session.roomId).emit('user-disconnected', {
          userId: user.id,
          timestamp: new Date(),
        });
      }

      // Track analytics
      await this.analytics.trackUserDisconnect(sessionId, user.id);
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
}

// Global instance
let collaborativeServer: CollaborativeEditingServer | null = null;

export function initializeCollaborativeServer(httpServer: any) {
  if (!collaborativeServer) {
    collaborativeServer = new CollaborativeEditingServer(httpServer);
  }
  return collaborativeServer;
}

export function getCollaborativeServer(): CollaborativeEditingServer | null {
  return collaborativeServer;
}