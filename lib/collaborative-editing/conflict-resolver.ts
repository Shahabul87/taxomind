import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Operation } from './operational-transform';

/** Socket with user data attached during authentication */
interface AuthenticatedSocket extends Socket {
  data: {
    user: { id: string; name?: string };
    [key: string]: unknown;
  };
}

export interface ConflictData {
  id: string;
  sessionId: string;
  user1Id: string;
  user2Id: string;
  conflictType: 'EDIT_OVERLAP' | 'CONCURRENT_EDIT' | 'VERSION_MISMATCH' | 'LOCK_CONFLICT';
  operation1: Operation;
  operation2: Operation;
  status: 'PENDING' | 'RESOLVED' | 'IGNORED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: 'ACCEPT_FIRST' | 'ACCEPT_SECOND' | 'MERGE' | 'MANUAL';
  metadata: Record<string, unknown>;
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'ACCEPT_FIRST' | 'ACCEPT_SECOND' | 'MERGE' | 'MANUAL';
  mergedOperation?: Operation;
  reason?: string;
  resolvedBy: string;
}

export class ConflictResolver {
  private activeConflicts: Map<string, ConflictData> = new Map();
  private resolutionStrategies: Map<string, (conflict: ConflictData) => Promise<ConflictResolution>> = new Map();

  constructor() {
    this.setupDefaultStrategies();
  }

  async detectConflict(
    sessionId: string,
    operation1: Operation,
    operation2: Operation
  ): Promise<ConflictData | null> {
    try {
      // Check for different types of conflicts
      const conflictType = this.determineConflictType(operation1, operation2);

      if (!conflictType) {
        return null; // No conflict detected
      }

      const priority = this.calculatePriority(operation1, operation2, conflictType);

      const conflict: ConflictData = {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        user1Id: operation1.userId,
        user2Id: operation2.userId,
        conflictType,
        operation1,
        operation2,
        status: 'PENDING',
        priority,
        detectedAt: new Date(),
        metadata: {
          operation1Position: operation1.position,
          operation2Position: operation2.position,
          operation1Type: operation1.type,
          operation2Type: operation2.type,
        },
      };

      // Store conflict
      await this.storeConflict(conflict);
      this.activeConflicts.set(conflict.id, conflict);

      return conflict;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error detecting conflict:', message);
      return null;
    }
  }

  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    socket: AuthenticatedSocket
  ): Promise<boolean> {
    try {
      const conflict = this.activeConflicts.get(conflictId) || await this.loadConflict(conflictId);

      if (!conflict) {
        logger.warn(`Conflict ${conflictId} not found`);
        return false;
      }

      // Apply resolution strategy
      const result = await this.applyResolution(conflict, resolution);

      if (result) {
        // Update conflict status
        conflict.status = 'RESOLVED';
        conflict.resolvedAt = new Date();
        conflict.resolution = resolution.resolution;

        // Update database
        await this.updateConflictStatus(conflictId, 'RESOLVED', resolution);

        // Remove from active conflicts
        this.activeConflicts.delete(conflictId);

        // Notify session participants
        await this.notifyConflictResolution(conflict, resolution, socket);

        return true;
      }

      return false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error resolving conflict:', message);
      return false;
    }
  }

  async handleConflictResolution(socket: AuthenticatedSocket, data: {
    conflictId: string;
    resolution: 'ACCEPT_FIRST' | 'ACCEPT_SECOND' | 'MERGE' | 'MANUAL';
    mergedOperation?: Operation;
    reason?: string;
  }): Promise<void> {
    const { conflictId, resolution, mergedOperation, reason } = data;
    const user = socket.data.user;

    try {
      const conflictResolution: ConflictResolution = {
        conflictId,
        resolution,
        mergedOperation,
        reason,
        resolvedBy: user.id,
      };

      const success = await this.resolveConflict(conflictId, conflictResolution, socket);

      if (success) {
        socket.emit('conflict-resolved', {
          conflictId,
          resolution,
          timestamp: new Date(),
        });
      } else {
        socket.emit('conflict-resolution-failed', {
          conflictId,
          error: 'Failed to resolve conflict',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error handling conflict resolution:', message);
      socket.emit('error', { message: 'Failed to handle conflict resolution' });
    }
  }

  async getActiveConflicts(sessionId: string): Promise<ConflictData[]> {
    try {
      const conflicts = await db.sessionConflict.findMany({
        where: {
          sessionId,
          resolved: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return conflicts.map(conflict => this.mapDbConflictToConflictData(conflict));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error getting active conflicts:', message);
      return [];
    }
  }

  async suggestResolution(conflictId: string): Promise<ConflictResolution | null> {
    try {
      const conflict = this.activeConflicts.get(conflictId) || await this.loadConflict(conflictId);

      if (!conflict) {
        return null;
      }

      // Get appropriate strategy for conflict type
      const strategy = this.resolutionStrategies.get(conflict.conflictType);

      if (strategy) {
        return await strategy(conflict);
      }

      // Default fallback strategy
      return this.createDefaultResolution(conflict);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error suggesting resolution:', message);
      return null;
    }
  }

  private determineConflictType(
    operation1: Operation,
    operation2: Operation
  ): ConflictData['conflictType'] | null {
    // Check for edit overlap
    if (this.operationsOverlap(operation1, operation2)) {
      return 'EDIT_OVERLAP';
    }

    // Check for concurrent edits in close proximity
    if (this.operationsNearby(operation1, operation2) &&
        Math.abs(operation1.timestamp.getTime() - operation2.timestamp.getTime()) < 1000) {
      return 'CONCURRENT_EDIT';
    }

    // Check for version mismatch
    if (operation1.revision !== operation2.revision) {
      return 'VERSION_MISMATCH';
    }

    return null;
  }

  private operationsOverlap(operation1: Operation, operation2: Operation): boolean {
    if (operation1.type === 'insert' || operation2.type === 'insert') {
      return operation1.position === operation2.position;
    }

    if (operation1.type === 'delete' && operation2.type === 'delete') {
      const op1End = operation1.position + (operation1.length || 0);
      const op2End = operation2.position + (operation2.length || 0);

      return !(op1End <= operation2.position || op2End <= operation1.position);
    }

    return false;
  }

  private operationsNearby(operation1: Operation, operation2: Operation): boolean {
    const proximity = 10; // characters
    return Math.abs(operation1.position - operation2.position) <= proximity;
  }

  private calculatePriority(
    operation1: Operation,
    operation2: Operation,
    conflictType: ConflictData['conflictType']
  ): ConflictData['priority'] {
    // High priority for overlapping deletes
    if (conflictType === 'EDIT_OVERLAP' &&
        operation1.type === 'delete' &&
        operation2.type === 'delete') {
      return 'HIGH';
    }

    // Critical priority for format conflicts
    if (operation1.type === 'format' || operation2.type === 'format') {
      return 'CRITICAL';
    }

    // Medium priority for concurrent edits
    if (conflictType === 'CONCURRENT_EDIT') {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private async storeConflict(conflict: ConflictData): Promise<void> {
    try {
      await db.sessionConflict.create({
        data: {
          id: conflict.id,
          sessionId: conflict.sessionId,
          user1Id: conflict.user1Id,
          user2Id: conflict.user2Id,
          conflictType: conflict.conflictType,
          priority: conflict.priority,
          operation1Data: JSON.stringify(conflict.operation1),
          operation2Data: JSON.stringify(conflict.operation2),
          description: `${conflict.conflictType} conflict between users`,
          metadata: conflict.metadata,
          resolved: conflict.status === 'RESOLVED',
          resolutionType: conflict.resolution,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error storing conflict:', message);
      throw error;
    }
  }

  /**
   * Map a database conflict record to the ConflictData interface.
   * Uses validated string-literal casts for known enum-like fields.
   */
  private mapDbConflictToConflictData(conflict: {
    id: string;
    sessionId: string;
    user1Id: string;
    user2Id: string;
    conflictType: string;
    priority: string;
    operation1Data: string | null;
    operation2Data: string | null;
    resolved: boolean;
    createdAt: Date;
    resolvedAt: Date | null;
    resolutionType: string | null;
    description: string | null;
    metadata: unknown;
  }): ConflictData {
    const validConflictTypes = ['EDIT_OVERLAP', 'CONCURRENT_EDIT', 'VERSION_MISMATCH', 'LOCK_CONFLICT'] as const;
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
    const validResolutions = ['ACCEPT_FIRST', 'ACCEPT_SECOND', 'MERGE', 'MANUAL'] as const;

    const conflictType = validConflictTypes.includes(conflict.conflictType as typeof validConflictTypes[number])
      ? (conflict.conflictType as ConflictData['conflictType'])
      : 'CONCURRENT_EDIT';

    const priority = validPriorities.includes(conflict.priority as typeof validPriorities[number])
      ? (conflict.priority as ConflictData['priority'])
      : 'LOW';

    const resolution = conflict.resolutionType && validResolutions.includes(conflict.resolutionType as typeof validResolutions[number])
      ? (conflict.resolutionType as ConflictData['resolution'])
      : undefined;

    const status: ConflictData['status'] = conflict.resolved ? 'RESOLVED' : 'PENDING';

    const rawMetadata = conflict.metadata;
    const metadata: Record<string, unknown> = (
      rawMetadata !== null &&
      typeof rawMetadata === 'object' &&
      !Array.isArray(rawMetadata)
    )
      ? rawMetadata as Record<string, unknown>
      : { description: conflict.description };

    return {
      id: conflict.id,
      sessionId: conflict.sessionId,
      user1Id: conflict.user1Id,
      user2Id: conflict.user2Id,
      conflictType,
      operation1: JSON.parse(conflict.operation1Data || '{}') as Operation,
      operation2: JSON.parse(conflict.operation2Data || '{}') as Operation,
      status,
      priority,
      detectedAt: conflict.createdAt,
      resolvedAt: conflict.resolvedAt || undefined,
      resolution,
      metadata,
    };
  }

  private async loadConflict(conflictId: string): Promise<ConflictData | null> {
    try {
      const dbConflict = await db.sessionConflict.findUnique({
        where: { id: conflictId },
      });

      if (!dbConflict) return null;

      return this.mapDbConflictToConflictData(dbConflict);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error loading conflict:', message);
      return null;
    }
  }

  private async applyResolution(
    conflict: ConflictData,
    resolution: ConflictResolution
  ): Promise<boolean> {
    try {
      switch (resolution.resolution) {
        case 'ACCEPT_FIRST':
          // Operation1 takes precedence
          return true;

        case 'ACCEPT_SECOND':
          // Operation2 takes precedence
          return true;

        case 'MERGE':
          // Apply merged operation if provided
          if (resolution.mergedOperation) {
            // Would integrate with operation transform engine
            return true;
          }
          return false;

        case 'MANUAL':
          // Manual resolution by user
          return true;

        default:
          return false;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error applying resolution:', message);
      return false;
    }
  }

  private async updateConflictStatus(
    conflictId: string,
    status: 'RESOLVED' | 'IGNORED',
    resolution: ConflictResolution
  ): Promise<void> {
    try {
      await db.sessionConflict.update({
        where: { id: conflictId },
        data: {
          resolved: status === 'RESOLVED',
          resolvedAt: new Date(),
          resolutionType: resolution.resolution,
          resolvedBy: resolution.resolvedBy,
          description: `${resolution.resolution} - ${resolution.reason || 'No reason provided'}`,
          metadata: {
            resolution: resolution.resolution,
            reason: resolution.reason,
            resolvedBy: resolution.resolvedBy,
            mergedOperation: resolution.mergedOperation ? JSON.parse(JSON.stringify(resolution.mergedOperation)) : null,
          },
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error updating conflict status:', message);
      throw error;
    }
  }

  private async notifyConflictResolution(
    conflict: ConflictData,
    resolution: ConflictResolution,
    socket: AuthenticatedSocket
  ): Promise<void> {
    try {
      const session = await db.collaborativeSession.findUnique({
        where: { id: conflict.sessionId },
        select: { roomId: true },
      });

      if (session) {
        // Notify all participants in the session
        socket.to(session.roomId).emit('conflict-resolved', {
          conflictId: conflict.id,
          conflictType: conflict.conflictType,
          resolution: resolution.resolution,
          resolvedBy: resolution.resolvedBy,
          timestamp: new Date(),
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error notifying conflict resolution:', message);
    }
  }

  private setupDefaultStrategies(): void {
    // Strategy for edit overlaps
    this.resolutionStrategies.set('EDIT_OVERLAP', async (conflict) => {
      // Prefer the more recent operation
      const moreRecent = conflict.operation1.timestamp > conflict.operation2.timestamp ?
        'ACCEPT_FIRST' : 'ACCEPT_SECOND';

      return {
        conflictId: conflict.id,
        resolution: moreRecent,
        reason: 'Automatic resolution: preferring more recent operation',
        resolvedBy: 'system',
      };
    });

    // Strategy for concurrent edits
    this.resolutionStrategies.set('CONCURRENT_EDIT', async (conflict) => {
      // Try to merge if both are inserts
      if (conflict.operation1.type === 'insert' && conflict.operation2.type === 'insert') {
        const mergedContent = (conflict.operation1.content || '') + (conflict.operation2.content || '');

        const mergedOperation: Operation = {
          ...conflict.operation1,
          content: mergedContent,
          id: `merged_${conflict.operation1.id}_${conflict.operation2.id}`,
          timestamp: new Date(),
        };

        return {
          conflictId: conflict.id,
          resolution: 'MERGE' as const,
          mergedOperation,
          reason: 'Automatic merge of concurrent inserts',
          resolvedBy: 'system',
        };
      }

      // Default to first operation
      return {
        conflictId: conflict.id,
        resolution: 'ACCEPT_FIRST' as const,
        reason: 'Default resolution for concurrent edits',
        resolvedBy: 'system',
      };
    });

    // Strategy for version mismatches
    this.resolutionStrategies.set('VERSION_MISMATCH', async (conflict) => {
      return {
        conflictId: conflict.id,
        resolution: 'ACCEPT_SECOND' as const,
        reason: 'Accepting operation with higher version',
        resolvedBy: 'system',
      };
    });
  }

  private createDefaultResolution(conflict: ConflictData): ConflictResolution {
    return {
      conflictId: conflict.id,
      resolution: 'ACCEPT_FIRST',
      reason: 'Default fallback resolution',
      resolvedBy: 'system',
    };
  }

  async getConflictHistory(sessionId: string, limit: number = 50): Promise<ConflictData[]> {
    try {
      const conflicts = await db.sessionConflict.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return conflicts.map(conflict => this.mapDbConflictToConflictData(conflict));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error getting conflict history:', message);
      return [];
    }
  }

  async cleanupOldConflicts(sessionId: string, daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      await db.sessionConflict.deleteMany({
        where: {
          sessionId,
          createdAt: {
            lt: cutoffDate,
          },
          resolved: true,
        },
      });

      logger.info(`Cleaned up old conflicts for session ${sessionId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error cleaning up old conflicts:', message);
    }
  }
}
