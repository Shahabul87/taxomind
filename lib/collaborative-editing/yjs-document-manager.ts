import * as Y from 'yjs';
import { db } from '@/lib/db';
import { WebsocketProvider } from 'y-websocket';

export interface DocumentState {
  content: any;
  version: number;
  timestamp: Date;
}

export interface YjsOperation {
  type: 'update' | 'insert' | 'delete' | 'format';
  data: any;
  userId: string;
  timestamp: Date;
}

export class YjsDocumentManager {
  private documents: Map<string, Y.Doc> = new Map();
  private providers: Map<string, WebsocketProvider> = new Map();

  constructor() {
    this.setupCleanupInterval();
  }

  async getOrCreateDocument(sessionId: string): Promise<Y.Doc> {
    let doc = this.documents.get(sessionId);
    
    if (!doc) {
      doc = await this.createDocument(sessionId);
    }
    
    return doc;
  }

  async createDocument(sessionId: string): Promise<Y.Doc> {
    const doc = new Y.Doc();
    
    // Set up document structure
    const yText = doc.getText('content');
    const yMap = doc.getMap('metadata');
    
    // Initialize metadata
    yMap.set('sessionId', sessionId);
    yMap.set('createdAt', new Date().toISOString());
    yMap.set('version', 0);
    
    // Load existing state from database if available
    await this.loadDocumentState(sessionId, doc);
    
    // Set up auto-save
    this.setupAutoSave(sessionId, doc);
    
    // Store document
    this.documents.set(sessionId, doc);
    
    return doc;
  }

  async loadDocumentState(sessionId: string, doc: Y.Doc): Promise<void> {
    try {
      const session = await db.collaborativeSession.findUnique({
        where: { id: sessionId },
        select: {
          yjsState: true,
          yjsUpdates: true,
        },
      });

      if (session?.yjsState) {
        // Apply saved state
        const state = new Uint8Array(session.yjsState);
        Y.applyUpdate(doc, state);
      }

      if (session?.yjsUpdates) {
        // Apply saved updates
        const updates = new Uint8Array(session.yjsUpdates);
        Y.applyUpdate(doc, updates);
      }
    } catch (error) {
      console.error('Error loading document state:', error);
    }
  }

  async saveDocumentState(sessionId: string, doc: Y.Doc): Promise<void> {
    try {
      const state = Y.encodeStateAsUpdate(doc);
      
      await db.collaborativeSession.update({
        where: { id: sessionId },
        data: {
          yjsState: Buffer.from(state),
          lastActivity: new Date(),
        },
      });
    } catch (error) {
      console.error('Error saving document state:', error);
    }
  }

  async applyOperation(sessionId: string, operation: YjsOperation): Promise<void> {
    const doc = this.documents.get(sessionId);
    if (!doc) {
      throw new Error('Document not found');
    }

    doc.transact(() => {
      const yText = doc.getText('content');
      const yMap = doc.getMap('metadata');
      
      switch (operation.type) {
        case 'insert':
          yText.insert(operation.data.index, operation.data.text);
          break;
        case 'delete':
          yText.delete(operation.data.index, operation.data.length);
          break;
        case 'format':
          yText.format(operation.data.index, operation.data.length, operation.data.attributes);
          break;
        case 'update':
          // Generic update operation
          if (operation.data.updates) {
            Y.applyUpdate(doc, new Uint8Array(operation.data.updates));
          }
          break;
      }
      
      // Update version
      const currentVersion = yMap.get('version') || 0;
      yMap.set('version', currentVersion + 1);
      yMap.set('lastModified', new Date().toISOString());
      yMap.set('lastModifiedBy', operation.userId);
    });

    // Save to database
    await this.saveDocumentState(sessionId, doc);
  }

  async getDocumentState(sessionId: string): Promise<DocumentState | null> {
    const doc = this.documents.get(sessionId);
    if (!doc) {
      return null;
    }

    const yText = doc.getText('content');
    const yMap = doc.getMap('metadata');
    
    return {
      content: yText.toString(),
      version: yMap.get('version') || 0,
      timestamp: new Date(yMap.get('lastModified') || Date.now()),
    };
  }

  async serializeDocument(sessionId: string): Promise<Buffer | null> {
    const doc = this.documents.get(sessionId);
    if (!doc) {
      return null;
    }

    const state = Y.encodeStateAsUpdate(doc);
    return Buffer.from(state);
  }

  async deserializeDocument(sessionId: string, data: Buffer): Promise<Y.Doc> {
    const doc = new Y.Doc();
    const state = new Uint8Array(data);
    Y.applyUpdate(doc, state);
    
    this.documents.set(sessionId, doc);
    return doc;
  }

  async createSnapshot(sessionId: string, name?: string): Promise<void> {
    const doc = this.documents.get(sessionId);
    if (!doc) {
      throw new Error('Document not found');
    }

    try {
      const state = Y.encodeStateAsUpdate(doc);
      const documentState = await this.getDocumentState(sessionId);
      
      await db.sessionSnapshot.create({
        data: {
          sessionId,
          name: name || `Snapshot ${new Date().toISOString()}`,
          snapshotType: 'AUTO',
          content: documentState,
          yjsState: Buffer.from(state),
        },
      });
    } catch (error) {
      console.error('Error creating snapshot:', error);
    }
  }

  async restoreFromSnapshot(sessionId: string, snapshotId: string): Promise<void> {
    try {
      const snapshot = await db.sessionSnapshot.findUnique({
        where: { id: snapshotId },
        select: {
          yjsState: true,
          content: true,
        },
      });

      if (!snapshot?.yjsState) {
        throw new Error('Snapshot not found or invalid');
      }

      const doc = new Y.Doc();
      const state = new Uint8Array(snapshot.yjsState);
      Y.applyUpdate(doc, state);
      
      // Replace current document
      this.documents.set(sessionId, doc);
      
      // Save to database
      await this.saveDocumentState(sessionId, doc);
    } catch (error) {
      console.error('Error restoring from snapshot:', error);
      throw error;
    }
  }

  async getDiff(sessionId: string, fromVersion: number, toVersion: number): Promise<any> {
    const doc = this.documents.get(sessionId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // This is a simplified diff implementation
    // In a real implementation, you would track versions and compute diffs
    const currentState = await this.getDocumentState(sessionId);
    
    return {
      sessionId,
      fromVersion,
      toVersion,
      changes: [], // Placeholder for actual diff computation
      timestamp: new Date(),
    };
  }

  async getDocumentHistory(sessionId: string, limit: number = 50): Promise<any[]> {
    try {
      const activities = await db.collaborativeActivity.findMany({
        where: {
          sessionId,
          activityType: {
            in: ['DOCUMENT_EDIT', 'DOCUMENT_FORMAT', 'DOCUMENT_INSERT', 'DOCUMENT_DELETE'],
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return activities.map(activity => ({
        id: activity.id,
        type: activity.activityType,
        description: activity.description,
        user: activity.user,
        metadata: activity.metadata,
        timestamp: activity.timestamp,
      }));
    } catch (error) {
      console.error('Error getting document history:', error);
      return [];
    }
  }

  async cleanupDocument(sessionId: string): Promise<void> {
    const doc = this.documents.get(sessionId);
    if (doc) {
      doc.destroy();
      this.documents.delete(sessionId);
    }

    const provider = this.providers.get(sessionId);
    if (provider) {
      provider.destroy();
      this.providers.delete(sessionId);
    }
  }

  private setupAutoSave(sessionId: string, doc: Y.Doc): void {
    doc.on('update', (update: Uint8Array) => {
      // Debounce auto-save
      setTimeout(() => {
        this.saveDocumentState(sessionId, doc);
      }, 1000);
    });

    // Auto-snapshot every 5 minutes
    setInterval(() => {
      this.createSnapshot(sessionId);
    }, 5 * 60 * 1000);
  }

  private setupCleanupInterval(): void {
    // Clean up inactive documents every hour
    setInterval(() => {
      this.cleanupInactiveDocuments();
    }, 60 * 60 * 1000);
  }

  private async cleanupInactiveDocuments(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    try {
      const activeSessions = await db.collaborativeSession.findMany({
        where: {
          isActive: true,
          lastActivity: {
            gte: cutoffTime,
          },
        },
        select: { id: true },
      });

      const activeSessionIds = new Set(activeSessions.map(s => s.id));

      // Clean up documents not in active sessions
      for (const [sessionId, doc] of this.documents.entries()) {
        if (!activeSessionIds.has(sessionId)) {
          await this.cleanupDocument(sessionId);
        }
      }
    } catch (error) {
      console.error('Error cleaning up inactive documents:', error);
    }
  }

  // Merge conflict resolution
  async resolveConflict(sessionId: string, conflictId: string, resolution: 'accept' | 'reject'): Promise<void> {
    try {
      const conflict = await db.editConflict.findUnique({
        where: { id: conflictId },
      });

      if (!conflict) {
        throw new Error('Conflict not found');
      }

      const doc = this.documents.get(sessionId);
      if (!doc) {
        throw new Error('Document not found');
      }

      // Apply resolution based on conflict type
      if (resolution === 'accept') {
        // Apply the conflicting change
        const conflictData = conflict.conflictData as any;
        if (conflictData.operation) {
          await this.applyOperation(sessionId, conflictData.operation);
        }
      }

      // Mark conflict as resolved
      await db.editConflict.update({
        where: { id: conflictId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  // Export document in various formats
  async exportDocument(sessionId: string, format: 'json' | 'html' | 'markdown' = 'json'): Promise<any> {
    const doc = this.documents.get(sessionId);
    if (!doc) {
      throw new Error('Document not found');
    }

    const yText = doc.getText('content');
    const content = yText.toString();

    switch (format) {
      case 'json':
        return {
          content,
          metadata: Object.fromEntries(doc.getMap('metadata')),
          timestamp: new Date(),
        };
      case 'html':
        // Convert to HTML (simplified)
        return `<html><body>${content.replace(/\n/g, '<br>')}</body></html>`;
      case 'markdown':
        // Convert to Markdown (simplified)
        return content;
      default:
        throw new Error('Unsupported format');
    }
  }
}