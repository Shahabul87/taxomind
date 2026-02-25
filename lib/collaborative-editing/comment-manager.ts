import { Server as SocketIOServer } from 'socket.io';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { nanoid } from 'nanoid';

export interface CollaborativeComment {
  id: string;
  sessionId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  position: number;
  line?: number;
  column?: number;
  selection?: {
    start: number;
    end: number;
    text?: string;
  };
  parentId?: string; // For threaded comments
  status: 'ACTIVE' | 'RESOLVED' | 'DELETED';
  type: 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ISSUE';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface CommentThread {
  rootComment: CollaborativeComment;
  replies: CollaborativeComment[];
  totalReplies: number;
  participants: string[];
  lastActivity: Date;
}

export class CommentManager {
  private io: SocketIOServer;
  private comments: Map<string, Map<string, CollaborativeComment>> = new Map(); // sessionId -> commentId -> comment
  private threads: Map<string, Map<string, CommentThread>> = new Map(); // sessionId -> threadId -> thread

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async handleAddComment(socket: any, data: {
    sessionId: string;
    content: string;
    position: number;
    line?: number;
    column?: number;
    selection?: {
      start: number;
      end: number;
      text?: string;
    };
    parentId?: string;
    type?: 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ISSUE';
  }): Promise<void> {
    try {
      const user = socket.data.user;
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const {
        sessionId,
        content,
        position,
        line,
        column,
        selection,
        parentId,
        type = 'COMMENT'
      } = data;

      // Validate session exists
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        select: { roomId: true },
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Create comment
      const comment = await this.createComment({
        sessionId,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        content,
        position,
        line,
        column,
        selection,
        parentId,
        type,
      });

      // Emit to all participants
      this.io.to(session.roomId).emit('comment-added', {
        comment,
        timestamp: new Date(),
      });

      socket.emit('comment-created', {
        commentId: comment.id,
        comment,
      });

      // Track activity
      await this.trackCommentActivity(sessionId, user.id, 'COMMENT_ADDED', comment.id);
    } catch (error: any) {
      logger.error('Error handling add comment:', error);
      socket.emit('error', { message: 'Failed to add comment' });
    }
  }

  async handleResolveComment(socket: any, data: {
    sessionId: string;
    commentId: string;
  }): Promise<void> {
    try {
      const user = socket.data.user;
      if (!user) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      const { sessionId, commentId } = data;

      // Validate session exists
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        select: { roomId: true },
      });

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Resolve comment
      const resolvedComment = await this.resolveComment(commentId, user.id);

      if (resolvedComment) {
        // Emit to all participants
        this.io.to(session.roomId).emit('comment-resolved', {
          commentId,
          resolvedBy: user.id,
          resolvedByName: user.name,
          timestamp: new Date(),
        });

        socket.emit('comment-resolve-success', {
          commentId,
          comment: resolvedComment,
        });

        // Track activity
        await this.trackCommentActivity(sessionId, user.id, 'COMMENT_RESOLVED', commentId);
      } else {
        socket.emit('error', { message: 'Comment not found or already resolved' });
      }
    } catch (error: any) {
      logger.error('Error handling resolve comment:', error);
      socket.emit('error', { message: 'Failed to resolve comment' });
    }
  }

  async createComment(data: {
    sessionId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    position: number;
    line?: number;
    column?: number;
    selection?: {
      start: number;
      end: number;
      text?: string;
    };
    parentId?: string;
    type: 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ISSUE';
  }): Promise<CollaborativeComment> {
    try {
      const commentId = nanoid();
      const now = new Date();

      const comment: CollaborativeComment = {
        id: commentId,
        sessionId: data.sessionId,
        authorId: data.authorId,
        authorName: data.authorName,
        authorAvatar: data.authorAvatar,
        content: data.content,
        position: data.position,
        line: data.line,
        column: data.column,
        selection: data.selection,
        parentId: data.parentId,
        status: 'ACTIVE',
        type: data.type,
        metadata: {},
        createdAt: now,
        updatedAt: now,
      };

      // Store in database (using enhanced SessionComment model)
      await db.sessionComment.create({
        data: {
          id: commentId,
          sessionId: data.sessionId,
          authorId: data.authorId,
          content: data.content,
          position: data.position,
          line: data.line,
          column: data.column,
          selectionStart: data.selection?.start,
          selectionEnd: data.selection?.end,
          selectionText: data.selection?.text,
          parentId: data.parentId,
          status: 'ACTIVE',
          type: data.type,
          metadata: {},
        },
      });

      // Update memory cache
      if (!this.comments.has(data.sessionId)) {
        this.comments.set(data.sessionId, new Map());
      }
      this.comments.get(data.sessionId)!.set(commentId, comment);

      // Update thread cache
      await this.updateThreadCache(data.sessionId, comment);

      return comment;
    } catch (error: any) {
      logger.error('Error creating comment:', error);
      throw error;
    }
  }

  async resolveComment(commentId: string, resolvedBy: string): Promise<CollaborativeComment | null> {
    try {
      const now = new Date();

      // Update database (using enhanced SessionComment model)
      const updatedComment = await db.sessionComment.update({
        where: { id: commentId },
        data: {
          status: 'RESOLVED',
          resolvedAt: now,
          resolvedBy,
          updatedAt: now,
        },
      });

      // Update memory cache
      for (const [sessionId, sessionComments] of this.comments.entries()) {
        if (sessionComments.has(commentId)) {
          const comment = sessionComments.get(commentId)!;
          comment.status = 'RESOLVED';
          comment.resolvedAt = now;
          comment.resolvedBy = resolvedBy;
          comment.updatedAt = now;

          // Update thread cache
          await this.updateThreadCache(sessionId, comment);
          return comment;
        }
      }

      // If not in cache, create from database result
      const comment: CollaborativeComment = {
        id: updatedComment.id,
        sessionId: updatedComment.sessionId,
        authorId: updatedComment.authorId,
        authorName: 'Unknown', // Would need to fetch from user table
        content: updatedComment.content,
        position: updatedComment.position || 0,
        line: updatedComment.line || undefined,
        column: updatedComment.column || undefined,
        selection: updatedComment.selectionStart !== null ? {
          start: updatedComment.selectionStart,
          end: updatedComment.selectionEnd || updatedComment.selectionStart,
          text: updatedComment.selectionText || undefined,
        } : undefined,
        parentId: updatedComment.parentId || undefined,
        status: updatedComment.status as 'ACTIVE' | 'RESOLVED' | 'DELETED',
        type: updatedComment.type as 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ISSUE',
        metadata: (updatedComment.metadata as Record<string, any>) || {},
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
        resolvedAt: updatedComment.resolvedAt || undefined,
        resolvedBy: updatedComment.resolvedBy || undefined,
      };

      return comment;
    } catch (error: any) {
      logger.error('Error resolving comment:', error);
      return null;
    }
  }

  async getComments(sessionId: string, includeResolved: boolean = false): Promise<CollaborativeComment[]> {
    try {
      // Try cache first
      const sessionComments = this.comments.get(sessionId);
      if (sessionComments && sessionComments.size > 0) {
        const comments = Array.from(sessionComments.values());
        return includeResolved ? comments : comments.filter(c => c.status !== 'RESOLVED');
      }

      // Fallback to database (using SessionComment model)
      const whereClause: any = { sessionId };

      const dbComments = await db.sessionComment.findMany({
        where: whereClause,
        take: 100,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          resolvedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: [
          { position: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      const comments: CollaborativeComment[] = dbComments.map(comment => ({
        id: comment.id,
        sessionId: comment.sessionId,
        authorId: comment.authorId,
        authorName: comment.author.name || 'Anonymous',
        authorAvatar: comment.author.image || undefined,
        content: comment.content,
        position: comment.position || 0,
        line: comment.line || undefined,
        column: comment.column || undefined,
        selection: comment.selectionStart !== null && comment.selectionEnd !== null ? {
          start: comment.selectionStart,
          end: comment.selectionEnd,
          text: comment.selectionText || undefined,
        } : undefined,
        parentId: comment.parentId || undefined,
        status: comment.status as 'ACTIVE' | 'RESOLVED' | 'DELETED',
        type: comment.type as 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ISSUE',
        metadata: (comment.metadata as Record<string, any>) || {},
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        resolvedAt: comment.resolvedAt || undefined,
        resolvedBy: comment.resolvedBy || undefined,
      }));

      // Update cache
      if (!this.comments.has(sessionId)) {
        this.comments.set(sessionId, new Map());
      }
      const sessionCommentsMap = this.comments.get(sessionId)!;
      comments.forEach(comment => {
        sessionCommentsMap.set(comment.id, comment);
      });

      return comments;
    } catch (error: any) {
      logger.error('Error getting comments:', error);
      return [];
    }
  }

  async getCommentThreads(sessionId: string): Promise<CommentThread[]> {
    try {
      // Try cache first
      const sessionThreads = this.threads.get(sessionId);
      if (sessionThreads && sessionThreads.size > 0) {
        return Array.from(sessionThreads.values());
      }

      // Build threads from comments
      const comments = await this.getComments(sessionId, true);
      const threads: CommentThread[] = [];
      const threadMap = new Map<string, CommentThread>();

      // First pass: create root threads
      comments.forEach(comment => {
        if (!comment.parentId) {
          const thread: CommentThread = {
            rootComment: comment,
            replies: [],
            totalReplies: 0,
            participants: [comment.authorId],
            lastActivity: comment.updatedAt,
          };
          threadMap.set(comment.id, thread);
          threads.push(thread);
        }
      });

      // Second pass: add replies to threads
      comments.forEach(comment => {
        if (comment.parentId) {
          const thread = threadMap.get(comment.parentId);
          if (thread) {
            thread.replies.push(comment);
            thread.totalReplies++;
            
            // Update participants
            if (!thread.participants.includes(comment.authorId)) {
              thread.participants.push(comment.authorId);
            }
            
            // Update last activity
            if (comment.updatedAt > thread.lastActivity) {
              thread.lastActivity = comment.updatedAt;
            }
          }
        }
      });

      // Sort replies by creation date
      threads.forEach(thread => {
        thread.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      });

      // Update cache
      if (!this.threads.has(sessionId)) {
        this.threads.set(sessionId, new Map());
      }
      const sessionThreadsMap = this.threads.get(sessionId)!;
      threads.forEach(thread => {
        sessionThreadsMap.set(thread.rootComment.id, thread);
      });

      return threads;
    } catch (error: any) {
      logger.error('Error getting comment threads:', error);
      return [];
    }
  }

  async updateComment(commentId: string, content: string, updatedBy: string): Promise<CollaborativeComment | null> {
    try {
      const now = new Date();

      // Update database
      const updatedComment = await db.sessionComment.update({
        where: { id: commentId },
        data: {
          content,
          updatedAt: now,
        },
      });

      // Update memory cache
      for (const [sessionId, sessionComments] of this.comments.entries()) {
        if (sessionComments.has(commentId)) {
          const comment = sessionComments.get(commentId)!;
          comment.content = content;
          comment.updatedAt = now;

          // Update thread cache
          await this.updateThreadCache(sessionId, comment);
          return comment;
        }
      }

      return null;
    } catch (error: any) {
      logger.error('Error updating comment:', error);
      return null;
    }
  }

  async deleteComment(commentId: string, deletedBy: string): Promise<boolean> {
    try {
      const now = new Date();

      // Soft delete in database (using status field)
      await db.sessionComment.update({
        where: { id: commentId },
        data: {
          status: 'DELETED',
          updatedAt: now,
        },
      });

      // Update memory cache
      for (const [sessionId, sessionComments] of this.comments.entries()) {
        if (sessionComments.has(commentId)) {
          const comment = sessionComments.get(commentId)!;
          comment.status = 'DELETED';
          comment.updatedAt = now;

          // Update thread cache
          await this.updateThreadCache(sessionId, comment);
          return true;
        }
      }

      return true;
    } catch (error: any) {
      logger.error('Error deleting comment:', error);
      return false;
    }
  }

  async transformComments(
    sessionId: string,
    operation: any,
    excludeUserId?: string
  ): Promise<void> {
    try {
      const sessionComments = this.comments.get(sessionId);
      if (!sessionComments) {
        return;
      }

      const transformedComments: CollaborativeComment[] = [];

      for (const comment of sessionComments.values()) {
        const transformedPosition = this.transformPosition(comment.position, operation);
        
        if (transformedPosition !== comment.position) {
          comment.position = transformedPosition;
          comment.updatedAt = new Date();

          // Transform selection if exists
          if (comment.selection) {
            comment.selection.start = this.transformPosition(comment.selection.start, operation);
            comment.selection.end = this.transformPosition(comment.selection.end, operation);
          }

          transformedComments.push(comment);

          // Update database (only position available in SessionComment)
          await db.sessionComment.update({
            where: { id: comment.id },
            data: {
              position: comment.position,
              updatedAt: comment.updatedAt,
            },
          });
        }
      }

      // Notify participants about comment transformations
      if (transformedComments.length > 0) {
        const session = await db.collaborativeSession.findUnique({
          where: { id: sessionId },
          select: { roomId: true },
        });

        if (session) {
          this.io.to(session.roomId).emit('comments-transformed', {
            operationType: operation.type,
            operationPosition: operation.position,
            transformedComments: transformedComments.map(c => ({
              id: c.id,
              position: c.position,
              selection: c.selection,
            })),
            timestamp: new Date(),
          });
        }
      }
    } catch (error: any) {
      logger.error('Error transforming comments:', error);
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
            return position - (operation.length || 0);
          } else {
            return operation.position;
          }
        }
        break;
        
      default:
        break;
    }
    
    return position;
  }

  private async updateThreadCache(sessionId: string, comment: CollaborativeComment): Promise<void> {
    // This would rebuild the thread cache for the affected thread
    // For now, we'll just clear the cache to force a rebuild
    const sessionThreads = this.threads.get(sessionId);
    if (sessionThreads) {
      const threadId = comment.parentId || comment.id;
      sessionThreads.delete(threadId);
    }
  }

  private async trackCommentActivity(
    sessionId: string,
    userId: string,
    activityType: string,
    commentId: string
  ): Promise<void> {
    try {
      await db.collaborativeActivity.create({
        data: {
          sessionId,
          userId,
          activityType,
          description: `User performed ${activityType.toLowerCase()} action`,
          metadata: {
            commentId,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error: any) {
      logger.error('Error tracking comment activity:', error);
    }
  }

  async getCommentAnalytics(sessionId: string): Promise<any> {
    try {
      const comments = await this.getComments(sessionId, true);
      
      const analytics = {
        totalComments: comments.length,
        activeComments: comments.filter(c => c.status === 'ACTIVE').length,
        resolvedComments: comments.filter(c => c.status === 'RESOLVED').length,
        commentsByType: {
          COMMENT: comments.filter(c => c.type === 'COMMENT').length,
          SUGGESTION: comments.filter(c => c.type === 'SUGGESTION').length,
          QUESTION: comments.filter(c => c.type === 'QUESTION').length,
          ISSUE: comments.filter(c => c.type === 'ISSUE').length,
        },
        commentsByAuthor: {} as Record<string, number>,
        averageResolutionTime: 0,
        threadsCount: 0,
      };

      // Calculate comments by author
      comments.forEach(comment => {
        analytics.commentsByAuthor[comment.authorName] = 
          (analytics.commentsByAuthor[comment.authorName] || 0) + 1;
      });

      // Calculate average resolution time
      const resolvedComments = comments.filter(c => c.resolvedAt);
      if (resolvedComments.length > 0) {
        const totalResolutionTime = resolvedComments.reduce((sum, comment) => {
          return sum + (comment.resolvedAt!.getTime() - comment.createdAt.getTime());
        }, 0);
        analytics.averageResolutionTime = totalResolutionTime / resolvedComments.length;
      }

      // Count threads
      const threads = await this.getCommentThreads(sessionId);
      analytics.threadsCount = threads.length;

      return analytics;
    } catch (error: any) {
      logger.error('Error getting comment analytics:', error);
      return null;
    }
  }

  async cleanupSessionComments(sessionId: string): Promise<void> {
    try {
      // Remove from memory
      this.comments.delete(sessionId);
      this.threads.delete(sessionId);

      logger.info(`Cleaned up comments for session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error cleaning up session comments:', error);
    }
  }
}