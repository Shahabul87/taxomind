import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

// Collaborative Operation Types
export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  authorId: string;
  timestamp: number;
  documentId: string;
}

export interface Cursor {
  id: string;
  authorId: string;
  position: number;
  selection?: { start: number; end: number };
  color: string;
  name: string;
}

export interface DocumentState {
  id: string;
  content: string;
  version: number;
  operations: Operation[];
  cursors: Map<string, Cursor>;
  collaborators: Map<string, CollaboratorInfo>;
  lastModified: Date;
  checkpoints: DocumentCheckpoint[];
}

export interface CollaboratorInfo {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: Date;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
  };
}

export interface DocumentCheckpoint {
  id: string;
  version: number;
  content: string;
  timestamp: Date;
  authorId: string;
  message?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  position: number;
  timestamp: Date;
  replies: CommentReply[];
  isResolved: boolean;
  highlightRange?: { start: number; end: number };
}

export interface CommentReply {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
}

// Operational Transform Functions
export class OperationalTransform {
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // Transform two concurrent operations
    // This is a simplified version - production would need more sophisticated OT
    
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return [op1, { ...op2, position: op2.position + (op1.content?.length || 0) }];
      } else {
        return [{ ...op1, position: op1.position + (op2.content?.length || 0) }, op2];
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position + (op1.length || 0) <= op2.position) {
        return [op1, { ...op2, position: op2.position - (op1.length || 0) }];
      } else if (op2.position + (op2.length || 0) <= op1.position) {
        return [{ ...op1, position: op1.position - (op2.length || 0) }, op2];
      } else {
        // Overlapping deletes - merge them
        const start = Math.min(op1.position, op2.position);
        const end = Math.max(
          op1.position + (op1.length || 0),
          op2.position + (op2.length || 0)
        );
        const merged: Operation = {
          ...op1,
          position: start,
          length: end - start
        };
        return [merged, { ...op2, type: 'retain', length: 0 }];
      }
    }
    
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [op1, { ...op2, position: op2.position + (op1.content?.length || 0) }];
      } else if (op1.position >= op2.position + (op2.length || 0)) {
        return [{ ...op1, position: op1.position - (op2.length || 0) }, op2];
      } else {
        // Insert inside delete range
        return [{ ...op1, position: op2.position }, op2];
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return [{ ...op1, position: op1.position + (op2.content?.length || 0) }, op2];
      } else if (op2.position >= op1.position + (op1.length || 0)) {
        return [op1, { ...op2, position: op2.position - (op1.length || 0) }];
      } else {
        // Insert inside delete range
        return [op1, { ...op2, position: op1.position }];
      }
    }
    
    return [op1, op2];
  }
  
  static applyOperation(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position);
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0));
      
      case 'retain':
        return content;
      
      default:
        return content;
    }
  }
}

// Real-time Collaboration Engine
export class RealtimeCollaborationEngine extends EventEmitter {
  private documents: Map<string, DocumentState> = new Map();
  private connections: Map<string, WebSocket> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  private colorIndex = 0;

  constructor() {
    super();
    this.setupCleanupInterval();
  }

  // Document Management
  async createDocument(documentId: string, initialContent: string = '', authorId: string): Promise<DocumentState> {
    const document: DocumentState = {
      id: documentId,
      content: initialContent,
      version: 0,
      operations: [],
      cursors: new Map(),
      collaborators: new Map(),
      lastModified: new Date(),
      checkpoints: [{
        id: `checkpoint_${Date.now()}`,
        version: 0,
        content: initialContent,
        timestamp: new Date(),
        authorId,
        message: 'Initial version'
      }]
    };

    this.documents.set(documentId, document);
    this.emit('documentCreated', document);
    
    return document;
  }

  async getDocument(documentId: string): Promise<DocumentState | null> {
    return this.documents.get(documentId) || null;
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    const document = this.documents.get(documentId);
    if (!document) return false;

    // Notify all collaborators
    document.collaborators.forEach((collaborator, userId) => {
      this.notifyUser(userId, 'documentDeleted', { documentId });
    });

    this.documents.delete(documentId);
    this.emit('documentDeleted', { documentId });
    
    return true;
  }

  // Collaboration Management
  async joinDocument(documentId: string, userId: string, userInfo: Omit<CollaboratorInfo, 'id' | 'isActive' | 'lastSeen' | 'color'>): Promise<CollaboratorInfo | null> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    const collaborator: CollaboratorInfo = {
      ...userInfo,
      id: userId,
      isActive: true,
      lastSeen: new Date(),
      color: this.assignColor(userId)
    };

    document.collaborators.set(userId, collaborator);
    
    // Add user to session tracking
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(documentId);

    // Notify other collaborators
    this.broadcastToDocument(documentId, 'userJoined', collaborator, userId);
    
    this.emit('userJoinedDocument', { documentId, user: collaborator });
    
    return collaborator;
  }

  async leaveDocument(documentId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;

    // Remove cursor
    document.cursors.delete(userId);
    
    // Update collaborator status
    const collaborator = document.collaborators.get(userId);
    if (collaborator) {
      collaborator.isActive = false;
      collaborator.lastSeen = new Date();
    }

    // Remove from session tracking
    this.userSessions.get(userId)?.delete(documentId);

    // Notify other collaborators
    this.broadcastToDocument(documentId, 'userLeft', { userId }, userId);
    
    this.emit('userLeftDocument', { documentId, userId });
  }

  // Operation Processing
  async applyOperation(documentId: string, operation: Operation): Promise<DocumentState | null> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    // Transform operation against all operations since the client's version
    let transformedOp = operation;
    const opsToTransform = document.operations.slice(operation.timestamp);
    
    for (const existingOp of opsToTransform) {
      if (existingOp.authorId !== operation.authorId) {
        [transformedOp] = OperationalTransform.transform(transformedOp, existingOp);
      }
    }

    // Apply the transformed operation
    document.content = OperationalTransform.applyOperation(document.content, transformedOp);
    document.version++;
    document.lastModified = new Date();
    document.operations.push(transformedOp);

    // Limit operation history
    if (document.operations.length > 1000) {
      document.operations = document.operations.slice(-500);
    }

    // Broadcast to all collaborators except the author
    this.broadcastToDocument(documentId, 'operationApplied', {
      operation: transformedOp,
      version: document.version
    }, operation.authorId);

    this.emit('operationApplied', { documentId, operation: transformedOp });
    
    return document;
  }

  // Cursor Management
  async updateCursor(documentId: string, cursor: Cursor): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;

    document.cursors.set(cursor.authorId, cursor);
    
    // Broadcast cursor update
    this.broadcastToDocument(documentId, 'cursorUpdated', cursor, cursor.authorId);
  }

  async removeCursor(documentId: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) return;

    document.cursors.delete(userId);
    
    // Broadcast cursor removal
    this.broadcastToDocument(documentId, 'cursorRemoved', { userId }, userId);
  }

  // Commenting System
  async addComment(documentId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'replies' | 'isResolved'>): Promise<Comment | null> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      replies: [],
      isResolved: false
    };

    // Store comment (in real implementation, this would be in a database)
    // For now, we'll emit an event
    this.broadcastToDocument(documentId, 'commentAdded', newComment);
    
    this.emit('commentAdded', { documentId, comment: newComment });
    
    return newComment;
  }

  async replyToComment(documentId: string, commentId: string, reply: Omit<CommentReply, 'id' | 'timestamp'>): Promise<CommentReply | null> {
    const newReply: CommentReply = {
      ...reply,
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.broadcastToDocument(documentId, 'commentReply', { commentId, reply: newReply });
    
    this.emit('commentReply', { documentId, commentId, reply: newReply });
    
    return newReply;
  }

  async resolveComment(documentId: string, commentId: string, userId: string): Promise<void> {
    this.broadcastToDocument(documentId, 'commentResolved', { commentId, resolvedBy: userId });
    
    this.emit('commentResolved', { documentId, commentId, userId });
  }

  // Checkpoints and Version History
  async createCheckpoint(documentId: string, authorId: string, message?: string): Promise<DocumentCheckpoint | null> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    const checkpoint: DocumentCheckpoint = {
      id: `checkpoint_${Date.now()}`,
      version: document.version,
      content: document.content,
      timestamp: new Date(),
      authorId,
      message
    };

    document.checkpoints.push(checkpoint);
    
    // Limit checkpoint history
    if (document.checkpoints.length > 50) {
      document.checkpoints = document.checkpoints.slice(-25);
    }

    this.emit('checkpointCreated', { documentId, checkpoint });
    
    return checkpoint;
  }

  async revertToCheckpoint(documentId: string, checkpointId: string, authorId: string): Promise<DocumentState | null> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    const checkpoint = document.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return null;

    // Create revert operation
    const revertOperation: Operation = {
      id: `revert_${Date.now()}`,
      type: 'delete',
      position: 0,
      length: document.content.length,
      authorId,
      timestamp: Date.now(),
      documentId
    };

    const insertOperation: Operation = {
      id: `insert_${Date.now()}`,
      type: 'insert',
      position: 0,
      content: checkpoint.content,
      authorId,
      timestamp: Date.now(),
      documentId
    };

    // Apply operations
    await this.applyOperation(documentId, revertOperation);
    await this.applyOperation(documentId, insertOperation);

    this.emit('documentReverted', { documentId, checkpoint, authorId });
    
    return document;
  }

  // Broadcasting and Notifications
  private broadcastToDocument(documentId: string, event: string, data: any, excludeUserId?: string): void {
    const document = this.documents.get(documentId);
    if (!document) return;

    document.collaborators.forEach((collaborator, userId) => {
      if (userId !== excludeUserId && collaborator.isActive) {
        this.notifyUser(userId, event, data);
      }
    });
  }

  private notifyUser(userId: string, event: string, data: any): void {
    const connection = this.connections.get(userId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(JSON.stringify({ event, data }));
    }
  }

  // WebSocket Connection Management
  addConnection(userId: string, ws: WebSocket): void {
    this.connections.set(userId, ws);
    
    ws.on('close', () => {
      this.connections.delete(userId);
      // Leave all documents this user was in
      const userSessions = this.userSessions.get(userId);
      if (userSessions) {
        userSessions.forEach(documentId => {
          this.leaveDocument(documentId, userId);
        });
        this.userSessions.delete(userId);
      }
    });
  }

  removeConnection(userId: string): void {
    this.connections.delete(userId);
  }

  // Utilities
  private assignColor(userId: string): string {
    // Deterministic color assignment based on user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    return this.colors[Math.abs(hash) % this.colors.length];
  }

  private setupCleanupInterval(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      const now = new Date();
      this.documents.forEach((document, documentId) => {
        document.collaborators.forEach((collaborator, userId) => {
          const inactiveTime = now.getTime() - collaborator.lastSeen.getTime();
          if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
            this.leaveDocument(documentId, userId);
          }
        });
      });
    }, 5 * 60 * 1000);
  }

  // Document Synchronization
  async synchronizeDocument(documentId: string, clientVersion: number): Promise<{
    operations: Operation[];
    currentVersion: number;
    content: string;
  } | null> {
    const document = this.documents.get(documentId);
    if (!document) return null;

    const missedOperations = document.operations.slice(clientVersion);
    
    return {
      operations: missedOperations,
      currentVersion: document.version,
      content: document.content
    };
  }

  // Conflict Resolution
  async resolveConflict(documentId: string, conflictingOperations: Operation[]): Promise<Operation[]> {
    // Simplified conflict resolution - in production, this would be more sophisticated
    const document = this.documents.get(documentId);
    if (!document) return [];

    const resolvedOperations: Operation[] = [];
    
    for (const operation of conflictingOperations) {
      let resolvedOp = operation;
      
      // Transform against existing operations
      for (const existingOp of document.operations) {
        if (existingOp.timestamp > operation.timestamp) {
          [resolvedOp] = OperationalTransform.transform(resolvedOp, existingOp);
        }
      }
      
      resolvedOperations.push(resolvedOp);
    }
    
    return resolvedOperations;
  }
}

// Singleton instance
export const realtimeEngine = new RealtimeCollaborationEngine();