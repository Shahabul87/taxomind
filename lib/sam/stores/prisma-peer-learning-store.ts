/**
 * Prisma Peer Learning Store Adapter
 * Provides database persistence for SAM Peer Learning Engine
 */

import { getDb, type PrismaClient } from './db-provider';
import type { SAMPeerActivityType, SAMPeerActivityStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface PeerLearningActivity {
  id: string;
  userId: string;
  courseId: string | null;
  activityType: SAMPeerActivityType;
  title: string;
  description: string | null;
  peerIds: string[];
  maxParticipants: number;
  status: SAMPeerActivityStatus;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  outcomes: ActivityOutcomes | null;
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityOutcomes {
  participantCount: number;
  completionRate: number;
  averageEngagement: number;
  topContributors?: string[];
  keyInsights?: string[];
  feedback?: PeerFeedback[];
}

export interface PeerFeedback {
  peerId: string;
  rating: number;
  comment?: string;
  helpful: boolean;
}

export interface CreatePeerActivityInput {
  userId: string;
  courseId?: string;
  activityType: SAMPeerActivityType;
  title: string;
  description?: string;
  peerIds?: string[];
  maxParticipants?: number;
  scheduledAt?: Date;
}

export interface PeerLearningStore {
  create(input: CreatePeerActivityInput): Promise<PeerLearningActivity>;
  getById(id: string): Promise<PeerLearningActivity | null>;
  getByUserId(userId: string, limit?: number): Promise<PeerLearningActivity[]>;
  getByCourse(courseId: string): Promise<PeerLearningActivity[]>;
  getByType(userId: string, type: SAMPeerActivityType): Promise<PeerLearningActivity[]>;
  getActive(userId: string): Promise<PeerLearningActivity[]>;
  addPeer(id: string, peerId: string): Promise<PeerLearningActivity>;
  removePeer(id: string, peerId: string): Promise<PeerLearningActivity>;
  start(id: string): Promise<PeerLearningActivity>;
  complete(id: string, outcomes: ActivityOutcomes): Promise<PeerLearningActivity>;
  cancel(id: string): Promise<PeerLearningActivity>;
  rate(id: string, rating: number): Promise<PeerLearningActivity>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// PRISMA PEER LEARNING STORE
// ============================================================================

export class PrismaPeerLearningStore implements PeerLearningStore {
  /**
   * Create a new peer learning activity
   */
  async create(input: CreatePeerActivityInput): Promise<PeerLearningActivity> {
    const activity = await getDb().sAMPeerLearningActivity.create({
      data: {
        userId: input.userId,
        courseId: input.courseId ?? null,
        activityType: input.activityType,
        title: input.title,
        description: input.description ?? null,
        peerIds: input.peerIds ?? [],
        maxParticipants: input.maxParticipants ?? 10,
        status: 'DRAFT',
        scheduledAt: input.scheduledAt ?? null,
      },
    });

    return this.mapToActivity(activity);
  }

  /**
   * Get a peer learning activity by ID
   */
  async getById(id: string): Promise<PeerLearningActivity | null> {
    const activity = await getDb().sAMPeerLearningActivity.findUnique({
      where: { id },
    });

    return activity ? this.mapToActivity(activity) : null;
  }

  /**
   * Get all peer learning activities for a user
   */
  async getByUserId(userId: string, limit: number = 20): Promise<PeerLearningActivity[]> {
    const activities = await getDb().sAMPeerLearningActivity.findMany({
      where: {
        OR: [{ userId }, { peerIds: { has: userId } }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities.map((a) => this.mapToActivity(a));
  }

  /**
   * Get peer learning activities for a course
   */
  async getByCourse(courseId: string): Promise<PeerLearningActivity[]> {
    const activities = await getDb().sAMPeerLearningActivity.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
    });

    return activities.map((a) => this.mapToActivity(a));
  }

  /**
   * Get activities by type
   */
  async getByType(userId: string, type: SAMPeerActivityType): Promise<PeerLearningActivity[]> {
    const activities = await getDb().sAMPeerLearningActivity.findMany({
      where: {
        activityType: type,
        OR: [{ userId }, { peerIds: { has: userId } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return activities.map((a) => this.mapToActivity(a));
  }

  /**
   * Get active activities for a user
   */
  async getActive(userId: string): Promise<PeerLearningActivity[]> {
    const activities = await getDb().sAMPeerLearningActivity.findMany({
      where: {
        status: { in: ['DRAFT', 'SCHEDULED', 'ACTIVE'] },
        OR: [{ userId }, { peerIds: { has: userId } }],
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return activities.map((a) => this.mapToActivity(a));
  }

  /**
   * Add a peer to the activity
   */
  async addPeer(id: string, peerId: string): Promise<PeerLearningActivity> {
    const current = await getDb().sAMPeerLearningActivity.findUnique({
      where: { id },
      select: { peerIds: true, maxParticipants: true },
    });

    if (!current) {
      throw new Error('Activity not found');
    }

    if (current.peerIds.length >= current.maxParticipants) {
      throw new Error('Activity is full');
    }

    if (current.peerIds.includes(peerId)) {
      throw new Error('Peer already in activity');
    }

    const activity = await getDb().sAMPeerLearningActivity.update({
      where: { id },
      data: {
        peerIds: [...current.peerIds, peerId],
      },
    });

    return this.mapToActivity(activity);
  }

  /**
   * Remove a peer from the activity
   */
  async removePeer(id: string, peerId: string): Promise<PeerLearningActivity> {
    const current = await getDb().sAMPeerLearningActivity.findUnique({
      where: { id },
      select: { peerIds: true },
    });

    if (!current) {
      throw new Error('Activity not found');
    }

    const activity = await getDb().sAMPeerLearningActivity.update({
      where: { id },
      data: {
        peerIds: current.peerIds.filter((p) => p !== peerId),
      },
    });

    return this.mapToActivity(activity);
  }

  /**
   * Start the activity
   */
  async start(id: string): Promise<PeerLearningActivity> {
    const activity = await getDb().sAMPeerLearningActivity.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });

    return this.mapToActivity(activity);
  }

  /**
   * Complete the activity
   */
  async complete(id: string, outcomes: ActivityOutcomes): Promise<PeerLearningActivity> {
    const activity = await getDb().sAMPeerLearningActivity.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        outcomes: outcomes as unknown as Record<string, unknown>,
      },
    });

    return this.mapToActivity(activity);
  }

  /**
   * Cancel the activity
   */
  async cancel(id: string): Promise<PeerLearningActivity> {
    const activity = await getDb().sAMPeerLearningActivity.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
      },
    });

    return this.mapToActivity(activity);
  }

  /**
   * Rate the activity
   */
  async rate(id: string, rating: number): Promise<PeerLearningActivity> {
    const clampedRating = Math.max(1, Math.min(5, rating));

    const activity = await getDb().sAMPeerLearningActivity.update({
      where: { id },
      data: { rating: clampedRating },
    });

    return this.mapToActivity(activity);
  }

  /**
   * Delete an activity
   */
  async delete(id: string): Promise<void> {
    await getDb().sAMPeerLearningActivity.delete({
      where: { id },
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapToActivity(
    record: Awaited<ReturnType<PrismaClient['sAMPeerLearningActivity']['findUnique']>>
  ): PeerLearningActivity {
    if (!record) {
      throw new Error('PeerLearningActivity record is null');
    }

    return {
      id: record.id,
      userId: record.userId,
      courseId: record.courseId,
      activityType: record.activityType,
      title: record.title,
      description: record.description,
      peerIds: record.peerIds,
      maxParticipants: record.maxParticipants,
      status: record.status,
      scheduledAt: record.scheduledAt,
      startedAt: record.startedAt,
      endedAt: record.endedAt,
      outcomes: record.outcomes as unknown as ActivityOutcomes | null,
      rating: record.rating,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaPeerLearningStore(): PrismaPeerLearningStore {
  return new PrismaPeerLearningStore();
}
