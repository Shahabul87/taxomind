import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  length?: number;
  content?: string;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: Date;
  clientId: string;
  revision: number;
}

export interface TransformResult {
  operation: Operation;
  priority: number;
}

export class OperationalTransformEngine {
  private operationQueue: Map<string, Operation[]> = new Map();
  private revisionCounters: Map<string, number> = new Map();

  async transform(
    operation: Operation,
    sessionId: string,
    userId: string
  ): Promise<Operation> {
    try {
      // Get current revision for session
      const currentRevision = this.revisionCounters.get(sessionId) || 0;
      
      // Set operation revision
      operation.revision = currentRevision + 1;
      this.revisionCounters.set(sessionId, operation.revision);

      // Get concurrent operations
      const concurrentOps = await this.getConcurrentOperations(sessionId, operation);
      
      // Transform against concurrent operations
      let transformedOp = operation;
      for (const concurrentOp of concurrentOps) {
        transformedOp = this.transformAgainstOperation(transformedOp, concurrentOp);
      }

      // Store operation for future transforms
      await this.storeOperation(sessionId, transformedOp);
      
      // Add to queue for processing
      if (!this.operationQueue.has(sessionId)) {
        this.operationQueue.set(sessionId, []);
      }
      this.operationQueue.get(sessionId)!.push(transformedOp);

      return transformedOp;
    } catch (error: any) {
      logger.error('Error in operational transform:', error);
      throw new Error('Failed to transform operation');
    }
  }

  private transformAgainstOperation(op1: Operation, op2: Operation): Operation {
    // Handle different operation type combinations
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    }
    
    if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      return this.transformDeleteInsert(op1, op2);
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }
    
    if (op1.type === 'format' || op2.type === 'format') {
      return this.transformFormatOperation(op1, op2);
    }
    
    return op1;
  }

  private transformInsertInsert(op1: Operation, op2: Operation): Operation {
    const transformedOp = { ...op1 };
    
    if (op2.position <= op1.position) {
      // Op2 was inserted before op1, adjust op1 position
      transformedOp.position += op2.content?.length || 0;
    } else if (op2.position === op1.position) {
      // Same position - use user ID for tie-breaking
      if (op2.userId < op1.userId) {
        transformedOp.position += op2.content?.length || 0;
      }
    }
    
    return transformedOp;
  }

  private transformInsertDelete(op1: Operation, op2: Operation): Operation {
    const transformedOp = { ...op1 };
    
    if (op2.position <= op1.position) {
      if (op2.position + (op2.length || 0) <= op1.position) {
        // Delete is completely before insert
        transformedOp.position -= op2.length || 0;
      } else {
        // Delete overlaps with or contains insert position
        transformedOp.position = op2.position;
      }
    }
    
    return transformedOp;
  }

  private transformDeleteInsert(op1: Operation, op2: Operation): Operation {
    const transformedOp = { ...op1 };
    
    if (op2.position <= op1.position) {
      // Insert is before delete start
      transformedOp.position += op2.content?.length || 0;
    } else if (op2.position < op1.position + (op1.length || 0)) {
      // Insert is within delete range - extend delete length
      transformedOp.length = (transformedOp.length || 0) + (op2.content?.length || 0);
    }
    
    return transformedOp;
  }

  private transformDeleteDelete(op1: Operation, op2: Operation): Operation {
    const transformedOp = { ...op1 };
    const op1End = op1.position + (op1.length || 0);
    const op2End = op2.position + (op2.length || 0);
    
    if (op2End <= op1.position) {
      // Op2 is completely before op1
      transformedOp.position -= op2.length || 0;
    } else if (op2.position >= op1End) {
      // Op2 is completely after op1 - no change needed
    } else {
      // Overlapping deletes
      const overlapStart = Math.max(op1.position, op2.position);
      const overlapEnd = Math.min(op1End, op2End);
      const overlapLength = Math.max(0, overlapEnd - overlapStart);
      
      if (op2.position <= op1.position) {
        transformedOp.position = op2.position;
        transformedOp.length = (transformedOp.length || 0) - overlapLength;
      } else {
        transformedOp.length = (transformedOp.length || 0) - overlapLength;
      }
      
      // Ensure non-negative length
      transformedOp.length = Math.max(0, transformedOp.length || 0);
    }
    
    return transformedOp;
  }

  private transformFormatOperation(op1: Operation, op2: Operation): Operation {
    const transformedOp = { ...op1 };
    
    if (op1.type === 'format' && op2.type !== 'format') {
      // Adjust format operation based on text changes
      if (op2.type === 'insert' && op2.position <= op1.position) {
        transformedOp.position += op2.content?.length || 0;
      } else if (op2.type === 'delete' && op2.position <= op1.position) {
        transformedOp.position = Math.max(op2.position, transformedOp.position - (op2.length || 0));
      }
    }
    
    return transformedOp;
  }

  private async getConcurrentOperations(sessionId: string, operation: Operation): Promise<Operation[]> {
    try {
      // Get operations from database that happened concurrently
      const concurrentOps = await db.collaborativeOperation.findMany({
        where: {
          sessionId,
          timestamp: {
            gte: new Date(operation.timestamp.getTime() - 5000), // 5 second window
            lt: operation.timestamp,
          },
          userId: {
            not: operation.userId, // Exclude operations from same user
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
        take: 100,
      });

      return concurrentOps.map(op => ({
        id: op.id,
        type: op.operationType as 'insert' | 'delete' | 'retain' | 'format',
        position: op.position,
        length: op.length || undefined,
        content: op.content || undefined,
        attributes: (op.attributes as Record<string, any>) || undefined,
        userId: op.userId,
        timestamp: op.timestamp,
        clientId: op.clientId,
        revision: op.revision,
      }));
    } catch (error: any) {
      logger.error('Error getting concurrent operations:', error);
      return [];
    }
  }

  private async storeOperation(sessionId: string, operation: Operation): Promise<void> {
    try {
      await db.collaborativeOperation.create({
        data: {
          id: operation.id,
          sessionId,
          userId: operation.userId,
          clientId: operation.clientId,
          operationType: operation.type,
          position: operation.position,
          length: operation.length,
          content: operation.content,
          attributes: operation.attributes || {},
          revision: operation.revision,
          timestamp: operation.timestamp,
        },
      });
    } catch (error: any) {
      logger.error('Error storing operation:', error);
      throw error;
    }
  }

  async getOperationHistory(sessionId: string, fromRevision?: number, toRevision?: number): Promise<Operation[]> {
    try {
      const whereClause: any = { sessionId };
      
      if (fromRevision !== undefined) {
        whereClause.revision = { gte: fromRevision };
      }
      
      if (toRevision !== undefined) {
        if (whereClause.revision) {
          whereClause.revision.lte = toRevision;
        } else {
          whereClause.revision = { lte: toRevision };
        }
      }

      const operations = await db.collaborativeOperation.findMany({
        where: whereClause,
        orderBy: {
          revision: 'asc',
        },
        take: 100,
      });

      return operations.map(op => ({
        id: op.id,
        type: op.operationType as 'insert' | 'delete' | 'retain' | 'format',
        position: op.position,
        length: op.length || undefined,
        content: op.content || undefined,
        attributes: (op.attributes as Record<string, any>) || undefined,
        userId: op.userId,
        timestamp: op.timestamp,
        clientId: op.clientId,
        revision: op.revision,
      }));
    } catch (error: any) {
      logger.error('Error getting operation history:', error);
      return [];
    }
  }

  async composeOperations(ops: Operation[]): Promise<Operation | null> {
    if (ops.length === 0) return null;
    if (ops.length === 1) return ops[0];

    // Simple composition - in a real implementation, this would be more sophisticated
    let composedOp = ops[0];
    
    for (let i = 1; i < ops.length; i++) {
      composedOp = this.compose(composedOp, ops[i]);
    }
    
    return composedOp;
  }

  private compose(op1: Operation, op2: Operation): Operation {
    // Simplified composition logic
    if (op1.type === 'insert' && op2.type === 'insert') {
      // Adjacent inserts can be combined
      if (op1.position + (op1.content?.length || 0) === op2.position) {
        return {
          ...op1,
          content: (op1.content || '') + (op2.content || ''),
          timestamp: op2.timestamp,
        };
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'delete') {
      // Adjacent deletes can be combined
      if (op1.position === op2.position) {
        return {
          ...op1,
          length: (op1.length || 0) + (op2.length || 0),
          timestamp: op2.timestamp,
        };
      }
    }
    
    // Cannot compose - return second operation
    return op2;
  }

  async invertOperation(operation: Operation): Promise<Operation> {
    const inverted = {
      ...operation,
      id: `inv_${operation.id}`,
      timestamp: new Date(),
    };

    switch (operation.type) {
      case 'insert':
        inverted.type = 'delete';
        inverted.length = operation.content?.length || 0;
        delete inverted.content;
        break;
        
      case 'delete':
        inverted.type = 'insert';
        inverted.content = operation.content || '';
        delete inverted.length;
        break;
        
      case 'format':
        // Invert formatting attributes
        if (operation.attributes) {
          inverted.attributes = {};
          for (const [key, value] of Object.entries(operation.attributes)) {
            if (value === true) {
              inverted.attributes[key] = false;
            } else if (value === false) {
              inverted.attributes[key] = true;
            } else {
              inverted.attributes[key] = null; // Remove attribute
            }
          }
        }
        break;
        
      default:
        break;
    }

    return inverted;
  }

  async undoOperation(sessionId: string, operationId: string): Promise<Operation | null> {
    try {
      // Get the operation to undo
      const operation = await db.collaborativeOperation.findUnique({
        where: { id: operationId },
      });

      if (!operation) {
        return null;
      }

      const op: Operation = {
        id: operation.id,
        type: operation.operationType as 'insert' | 'delete' | 'retain' | 'format',
        position: operation.position,
        length: operation.length || undefined,
        content: operation.content || undefined,
        attributes: (operation.attributes as Record<string, any>) || undefined,
        userId: operation.userId,
        timestamp: operation.timestamp,
        clientId: operation.clientId,
        revision: operation.revision,
      };

      // Create inverse operation
      const inverseOp = await this.invertOperation(op);
      
      // Transform inverse operation against subsequent operations
      const subsequentOps = await this.getOperationHistory(sessionId, operation.revision + 1);
      
      let transformedInverse = inverseOp;
      for (const subsequentOp of subsequentOps) {
        transformedInverse = this.transformAgainstOperation(transformedInverse, subsequentOp);
      }

      return transformedInverse;
    } catch (error: any) {
      logger.error('Error undoing operation:', error);
      return null;
    }
  }

  async applyOperationBatch(sessionId: string, operations: Operation[]): Promise<Operation[]> {
    const transformedOps: Operation[] = [];
    
    try {
      // Sort operations by timestamp
      const sortedOps = operations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      for (const operation of sortedOps) {
        const transformedOp = await this.transform(operation, sessionId, operation.userId);
        transformedOps.push(transformedOp);
      }
      
      return transformedOps;
    } catch (error: any) {
      logger.error('Error applying operation batch:', error);
      throw error;
    }
  }

  async validateOperation(operation: Operation): Promise<boolean> {
    try {
      // Basic validation
      if (!operation.id || !operation.type || !operation.userId || !operation.clientId) {
        return false;
      }
      
      if (operation.position < 0) {
        return false;
      }
      
      if (operation.type === 'insert' && !operation.content) {
        return false;
      }
      
      if (operation.type === 'delete' && (!operation.length || operation.length <= 0)) {
        return false;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Error validating operation:', error);
      return false;
    }
  }

  async cleanupOldOperations(sessionId: string, keepDays: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);
      
      await db.collaborativeOperation.deleteMany({
        where: {
          sessionId,
          timestamp: {
            lt: cutoffDate,
          },
        },
      });
      
      logger.info(`Cleaned up old operations for session ${sessionId}`);
    } catch (error: any) {
      logger.error('Error cleaning up old operations:', error);
    }
  }

  getCurrentRevision(sessionId: string): number {
    return this.revisionCounters.get(sessionId) || 0;
  }

  clearQueue(sessionId: string): void {
    this.operationQueue.delete(sessionId);
    this.revisionCounters.delete(sessionId);
  }
}