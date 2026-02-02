/**
 * Stage Health Tracker
 *
 * In-memory singleton that tracks per-stage metrics for the SAM pipeline.
 * Uses circular buffers to cap memory at 1000 entries per stage.
 *
 * Provides:
 * - Success/failure/timeout counters
 * - Rolling average duration
 * - Success rate computation
 * - Overall pipeline health status
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface StageHealth {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  avgDurationMs: number;
  lastFailureAt: Date | null;
  lastError: string | null;
  successRate: number;
}

export type PipelineHealthStatus = 'healthy' | 'degraded' | 'critical';

export interface PipelineHealth {
  stages: Record<string, StageHealth>;
  overallHealth: PipelineHealthStatus;
  totalRequests: number;
  lastUpdatedAt: Date;
}

interface StageRecord {
  success: boolean;
  durationMs: number;
  timestamp: number;
  error?: string;
  timedOut?: boolean;
}

// ============================================================================
// CIRCULAR BUFFER
// ============================================================================

const MAX_RECORDS_PER_STAGE = 1000;

class CircularBuffer {
  private buffer: StageRecord[];
  private head = 0;
  private count = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(record: StageRecord): void {
    this.buffer[this.head] = record;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  getAll(): StageRecord[] {
    if (this.count < this.capacity) {
      return this.buffer.slice(0, this.count);
    }
    // Wrap around: oldest entries start at head
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ];
  }

  getCount(): number {
    return this.count;
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.count = 0;
  }
}

// ============================================================================
// STAGE HEALTH TRACKER SINGLETON
// ============================================================================

class StageHealthTracker {
  private stages = new Map<string, CircularBuffer>();
  private totalRequests = 0;

  /**
   * Record a successful stage execution.
   */
  recordSuccess(stageName: string, durationMs: number): void {
    this.getOrCreateBuffer(stageName).push({
      success: true,
      durationMs,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a failed stage execution.
   */
  recordFailure(stageName: string, error: string, durationMs = 0): void {
    this.getOrCreateBuffer(stageName).push({
      success: false,
      durationMs,
      timestamp: Date.now(),
      error,
    });
  }

  /**
   * Record a timed-out stage execution.
   */
  recordTimeout(stageName: string, timeoutMs: number): void {
    this.getOrCreateBuffer(stageName).push({
      success: false,
      durationMs: timeoutMs,
      timestamp: Date.now(),
      timedOut: true,
      error: `Stage timed out after ${timeoutMs}ms`,
    });
  }

  /**
   * Increment the total request counter (called once per pipeline invocation).
   */
  recordRequest(): void {
    this.totalRequests++;
  }

  /**
   * Get health metrics for a specific stage.
   */
  getStageHealth(stageName: string): StageHealth | null {
    const buffer = this.stages.get(stageName);
    if (!buffer) return null;

    const records = buffer.getAll();
    if (records.length === 0) {
      return {
        totalRuns: 0,
        successCount: 0,
        failureCount: 0,
        timeoutCount: 0,
        avgDurationMs: 0,
        lastFailureAt: null,
        lastError: null,
        successRate: 1,
      };
    }

    let successCount = 0;
    let failureCount = 0;
    let timeoutCount = 0;
    let totalDuration = 0;
    let lastFailureAt: Date | null = null;
    let lastError: string | null = null;

    for (const record of records) {
      totalDuration += record.durationMs;
      if (record.success) {
        successCount++;
      } else {
        failureCount++;
        if (record.timedOut) timeoutCount++;
        if (!lastFailureAt || record.timestamp > lastFailureAt.getTime()) {
          lastFailureAt = new Date(record.timestamp);
          lastError = record.error ?? null;
        }
      }
    }

    const totalRuns = records.length;
    return {
      totalRuns,
      successCount,
      failureCount,
      timeoutCount,
      avgDurationMs: Math.round(totalDuration / totalRuns),
      lastFailureAt,
      lastError,
      successRate: totalRuns > 0 ? successCount / totalRuns : 1,
    };
  }

  /**
   * Get overall pipeline health including all stages.
   */
  getHealth(): PipelineHealth {
    const stages: Record<string, StageHealth> = {};
    let minSuccessRate = 1;

    for (const [name] of this.stages) {
      const health = this.getStageHealth(name);
      if (health) {
        stages[name] = health;
        if (health.totalRuns > 0 && health.successRate < minSuccessRate) {
          minSuccessRate = health.successRate;
        }
      }
    }

    let overallHealth: PipelineHealthStatus = 'healthy';
    if (minSuccessRate < 0.8) {
      overallHealth = 'critical';
    } else if (minSuccessRate < 0.95) {
      overallHealth = 'degraded';
    }

    return {
      stages,
      overallHealth,
      totalRequests: this.totalRequests,
      lastUpdatedAt: new Date(),
    };
  }

  /**
   * Reset all tracked data (useful for testing).
   */
  reset(): void {
    this.stages.clear();
    this.totalRequests = 0;
    logger.info('[StageHealthTracker] All metrics reset');
  }

  private getOrCreateBuffer(stageName: string): CircularBuffer {
    let buffer = this.stages.get(stageName);
    if (!buffer) {
      buffer = new CircularBuffer(MAX_RECORDS_PER_STAGE);
      this.stages.set(stageName, buffer);
    }
    return buffer;
  }
}

// Singleton instance
export const stageHealthTracker = new StageHealthTracker();
