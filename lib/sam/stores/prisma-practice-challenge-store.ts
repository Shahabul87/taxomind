/**
 * Prisma Store for Practice Challenge Management
 * Handles challenge creation, participation, leaderboards, and rewards
 */

import { getDb } from './db-provider';
import type { Prisma } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type ChallengeType = 'INDIVIDUAL' | 'GROUP' | 'COMPETITION' | 'COMMUNITY';

export type ChallengeStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PracticeChallenge {
  id: string;
  title: string;
  description?: string;
  challengeType: ChallengeType;
  status: ChallengeStatus;
  startsAt: Date;
  endsAt: Date;
  targetHours?: number;
  targetSessions?: number;
  targetStreak?: number;
  targetQualityHours?: number;
  skillId?: string;
  skillName?: string;
  courseId?: string;
  xpReward: number;
  badgeReward?: string;
  rewardDescription?: string;
  maxParticipants?: number;
  isPublic: boolean;
  requiresApproval: boolean;
  createdById: string;
  organizationId?: string;
  participantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  linkedGoalId?: string;
  hoursCompleted: number;
  qualityHoursCompleted: number;
  sessionsCompleted: number;
  currentStreak: number;
  joinedAt: Date;
  completedAt?: Date;
  rank?: number;
  rewardClaimed: boolean;
  rewardClaimedAt?: Date;
  userName?: string;
  userAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChallengeInput {
  title: string;
  description?: string;
  challengeType?: ChallengeType;
  startsAt: Date;
  endsAt: Date;
  targetHours?: number;
  targetSessions?: number;
  targetStreak?: number;
  targetQualityHours?: number;
  skillId?: string;
  skillName?: string;
  courseId?: string;
  xpReward?: number;
  badgeReward?: string;
  rewardDescription?: string;
  maxParticipants?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
  createdById: string;
  organizationId?: string;
}

export interface UpdateChallengeInput {
  title?: string;
  description?: string;
  challengeType?: ChallengeType;
  status?: ChallengeStatus;
  startsAt?: Date;
  endsAt?: Date;
  targetHours?: number;
  targetSessions?: number;
  targetStreak?: number;
  targetQualityHours?: number;
  xpReward?: number;
  badgeReward?: string;
  rewardDescription?: string;
  maxParticipants?: number;
  isPublic?: boolean;
  requiresApproval?: boolean;
}

export interface ChallengeFilters {
  status?: ChallengeStatus | ChallengeStatus[];
  challengeType?: ChallengeType;
  skillId?: string;
  courseId?: string;
  isPublic?: boolean;
  createdById?: string;
  organizationId?: string;
  includeExpired?: boolean;
}

export interface PracticeChallengeStore {
  // CRUD
  create(input: CreateChallengeInput): Promise<PracticeChallenge>;
  getById(id: string): Promise<PracticeChallenge | null>;
  update(id: string, input: UpdateChallengeInput): Promise<PracticeChallenge>;
  delete(id: string): Promise<void>;

  // Queries
  getActiveChallenges(filters?: ChallengeFilters): Promise<PracticeChallenge[]>;
  getUserChallenges(userId: string): Promise<PracticeChallenge[]>;
  getCreatedChallenges(userId: string): Promise<PracticeChallenge[]>;
  getChallengeLeaderboard(challengeId: string, limit?: number): Promise<ChallengeParticipant[]>;

  // Participation
  joinChallenge(challengeId: string, userId: string, autoCreateGoal?: boolean): Promise<ChallengeParticipant>;
  leaveChallenge(challengeId: string, userId: string): Promise<void>;
  getParticipant(challengeId: string, userId: string): Promise<ChallengeParticipant | null>;
  updateParticipantProgress(
    challengeId: string,
    userId: string,
    data: UpdateParticipantProgressInput
  ): Promise<ChallengeParticipant>;

  // Goal Integration
  syncProgressToLinkedGoal(challengeId: string, userId: string): Promise<void>;
  getLinkedGoal(challengeId: string, userId: string): Promise<{ goalId: string; progress: number } | null>;

  // Rewards
  claimReward(challengeId: string, userId: string): Promise<ChallengeParticipant>;
  checkCompletion(challengeId: string, userId: string): Promise<boolean>;

  // Lifecycle
  updateChallengeStatuses(): Promise<number>;
  updateParticipantRanks(challengeId: string): Promise<void>;
}

export interface UpdateParticipantProgressInput {
  hoursCompleted?: number;
  qualityHoursCompleted?: number;
  sessionsCompleted?: number;
  currentStreak?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPrismaChallenge(
  challenge: Prisma.PracticeChallengeGetPayload<{
    include: { _count: { select: { participants: true } } };
  }>
): PracticeChallenge {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description ?? undefined,
    challengeType: challenge.challengeType as ChallengeType,
    status: challenge.status as ChallengeStatus,
    startsAt: challenge.startsAt,
    endsAt: challenge.endsAt,
    targetHours: challenge.targetHours ?? undefined,
    targetSessions: challenge.targetSessions ?? undefined,
    targetStreak: challenge.targetStreak ?? undefined,
    targetQualityHours: challenge.targetQualityHours ?? undefined,
    skillId: challenge.skillId ?? undefined,
    skillName: challenge.skillName ?? undefined,
    courseId: challenge.courseId ?? undefined,
    xpReward: challenge.xpReward,
    badgeReward: challenge.badgeReward ?? undefined,
    rewardDescription: challenge.rewardDescription ?? undefined,
    maxParticipants: challenge.maxParticipants ?? undefined,
    isPublic: challenge.isPublic,
    requiresApproval: challenge.requiresApproval,
    createdById: challenge.createdById,
    organizationId: challenge.organizationId ?? undefined,
    participantCount: challenge._count.participants,
    createdAt: challenge.createdAt,
    updatedAt: challenge.updatedAt,
  };
}

function mapPrismaParticipant(
  participant: Prisma.PracticeChallengeParticipantGetPayload<{
    include: { user: { select: { name: true; image: true } } };
  }>
): ChallengeParticipant {
  return {
    id: participant.id,
    challengeId: participant.challengeId,
    userId: participant.userId,
    linkedGoalId: participant.linkedGoalId ?? undefined,
    hoursCompleted: participant.hoursCompleted,
    qualityHoursCompleted: participant.qualityHoursCompleted,
    sessionsCompleted: participant.sessionsCompleted,
    currentStreak: participant.currentStreak,
    joinedAt: participant.joinedAt,
    completedAt: participant.completedAt ?? undefined,
    rank: participant.rank ?? undefined,
    rewardClaimed: participant.rewardClaimed,
    rewardClaimedAt: participant.rewardClaimedAt ?? undefined,
    userName: participant.user?.name ?? undefined,
    userAvatar: participant.user?.image ?? undefined,
    createdAt: participant.createdAt,
    updatedAt: participant.updatedAt,
  };
}

// ============================================================================
// PRISMA PRACTICE CHALLENGE STORE
// ============================================================================

export class PrismaPracticeChallengeStore implements PracticeChallengeStore {
  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  async create(input: CreateChallengeInput): Promise<PracticeChallenge> {
    const challenge = await getDb().practiceChallenge.create({
      data: {
        title: input.title,
        description: input.description,
        challengeType: input.challengeType ?? 'INDIVIDUAL',
        status: 'DRAFT',
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        targetHours: input.targetHours,
        targetSessions: input.targetSessions,
        targetStreak: input.targetStreak,
        targetQualityHours: input.targetQualityHours,
        skillId: input.skillId,
        skillName: input.skillName,
        courseId: input.courseId,
        xpReward: input.xpReward ?? 0,
        badgeReward: input.badgeReward,
        rewardDescription: input.rewardDescription,
        maxParticipants: input.maxParticipants,
        isPublic: input.isPublic ?? true,
        requiresApproval: input.requiresApproval ?? false,
        createdById: input.createdById,
        organizationId: input.organizationId,
      },
      include: {
        _count: { select: { participants: true } },
      },
    });

    return mapPrismaChallenge(challenge);
  }

  async getById(id: string): Promise<PracticeChallenge | null> {
    const challenge = await getDb().practiceChallenge.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!challenge) return null;
    return mapPrismaChallenge(challenge);
  }

  async update(id: string, input: UpdateChallengeInput): Promise<PracticeChallenge> {
    const challenge = await getDb().practiceChallenge.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        challengeType: input.challengeType,
        status: input.status,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        targetHours: input.targetHours,
        targetSessions: input.targetSessions,
        targetStreak: input.targetStreak,
        targetQualityHours: input.targetQualityHours,
        xpReward: input.xpReward,
        badgeReward: input.badgeReward,
        rewardDescription: input.rewardDescription,
        maxParticipants: input.maxParticipants,
        isPublic: input.isPublic,
        requiresApproval: input.requiresApproval,
      },
      include: {
        _count: { select: { participants: true } },
      },
    });

    return mapPrismaChallenge(challenge);
  }

  async delete(id: string): Promise<void> {
    await getDb().practiceChallenge.delete({
      where: { id },
    });
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  async getActiveChallenges(filters?: ChallengeFilters): Promise<PracticeChallenge[]> {
    const now = new Date();

    const whereClause: Prisma.PracticeChallengeWhereInput = {};

    // Status filter
    if (filters?.status) {
      whereClause.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    } else {
      whereClause.status = { in: ['ACTIVE', 'SCHEDULED'] };
    }

    // Include expired filter
    if (!filters?.includeExpired) {
      whereClause.endsAt = { gte: now };
    }

    // Other filters
    if (filters?.challengeType) {
      whereClause.challengeType = filters.challengeType;
    }
    if (filters?.skillId) {
      whereClause.skillId = filters.skillId;
    }
    if (filters?.courseId) {
      whereClause.courseId = filters.courseId;
    }
    if (filters?.isPublic !== undefined) {
      whereClause.isPublic = filters.isPublic;
    }
    if (filters?.createdById) {
      whereClause.createdById = filters.createdById;
    }
    if (filters?.organizationId) {
      whereClause.organizationId = filters.organizationId;
    }

    const challenges = await getDb().practiceChallenge.findMany({
      where: whereClause,
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: [{ startsAt: 'asc' }],
    });

    return challenges.map(mapPrismaChallenge);
  }

  async getUserChallenges(userId: string): Promise<PracticeChallenge[]> {
    const participants = await getDb().practiceChallengeParticipant.findMany({
      where: { userId },
      include: {
        challenge: {
          include: {
            _count: { select: { participants: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return participants.map((p) => mapPrismaChallenge(p.challenge));
  }

  async getCreatedChallenges(userId: string): Promise<PracticeChallenge[]> {
    const challenges = await getDb().practiceChallenge.findMany({
      where: { createdById: userId },
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return challenges.map(mapPrismaChallenge);
  }

  async getChallengeLeaderboard(challengeId: string, limit = 50): Promise<ChallengeParticipant[]> {
    const participants = await getDb().practiceChallengeParticipant.findMany({
      where: { challengeId },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: [
        { qualityHoursCompleted: 'desc' },
        { sessionsCompleted: 'desc' },
        { currentStreak: 'desc' },
      ],
      take: limit,
    });

    return participants.map((p, index) => ({
      ...mapPrismaParticipant(p),
      rank: index + 1,
    }));
  }

  // ---------------------------------------------------------------------------
  // Participation
  // ---------------------------------------------------------------------------

  async joinChallenge(
    challengeId: string,
    userId: string,
    autoCreateGoal = true
  ): Promise<ChallengeParticipant> {
    // Check if challenge exists and is joinable
    const challenge = await getDb().practiceChallenge.findUnique({
      where: { id: challengeId },
      include: { _count: { select: { participants: true } } },
    });

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.status !== 'ACTIVE' && challenge.status !== 'SCHEDULED') {
      throw new Error('Challenge is not accepting participants');
    }

    if (challenge.maxParticipants && challenge._count.participants >= challenge.maxParticipants) {
      throw new Error('Challenge is full');
    }

    // Check if already joined
    const existing = await getDb().practiceChallengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (existing) {
      throw new Error('Already joined this challenge');
    }

    // Auto-create linked goal if enabled
    let linkedGoalId: string | undefined;

    if (autoCreateGoal) {
      // Determine goal type and target based on challenge targets
      let goalType: 'HOURS' | 'QUALITY_HOURS' | 'SESSIONS' | 'STREAK' = 'HOURS';
      let targetValue = 0;

      if (challenge.targetQualityHours !== null) {
        goalType = 'QUALITY_HOURS';
        targetValue = challenge.targetQualityHours;
      } else if (challenge.targetHours !== null) {
        goalType = 'HOURS';
        targetValue = challenge.targetHours;
      } else if (challenge.targetSessions !== null) {
        goalType = 'SESSIONS';
        targetValue = challenge.targetSessions;
      } else if (challenge.targetStreak !== null) {
        goalType = 'STREAK';
        targetValue = challenge.targetStreak;
      }

      // Only create goal if there's a valid target
      if (targetValue > 0) {
        const goal = await getDb().practiceGoal.create({
          data: {
            userId,
            title: `Challenge: ${challenge.title}`,
            description: `Auto-created goal for challenge: ${challenge.description ?? challenge.title}`,
            goalType,
            targetValue,
            currentValue: 0,
            skillId: challenge.skillId,
            skillName: challenge.skillName,
            deadline: challenge.endsAt,
            reminderEnabled: true,
            reminderFrequency: 'DAILY',
          },
        });
        linkedGoalId = goal.id;
      }
    }

    const participant = await getDb().practiceChallengeParticipant.create({
      data: {
        challengeId,
        userId,
        linkedGoalId,
      },
      include: {
        user: { select: { name: true, image: true } },
      },
    });

    return mapPrismaParticipant(participant);
  }

  async leaveChallenge(challengeId: string, userId: string): Promise<void> {
    await getDb().practiceChallengeParticipant.delete({
      where: { challengeId_userId: { challengeId, userId } },
    });
  }

  async getParticipant(challengeId: string, userId: string): Promise<ChallengeParticipant | null> {
    const participant = await getDb().practiceChallengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      include: {
        user: { select: { name: true, image: true } },
      },
    });

    if (!participant) return null;
    return mapPrismaParticipant(participant);
  }

  async updateParticipantProgress(
    challengeId: string,
    userId: string,
    data: UpdateParticipantProgressInput
  ): Promise<ChallengeParticipant> {
    const participant = await getDb().practiceChallengeParticipant.update({
      where: { challengeId_userId: { challengeId, userId } },
      data: {
        hoursCompleted: data.hoursCompleted,
        qualityHoursCompleted: data.qualityHoursCompleted,
        sessionsCompleted: data.sessionsCompleted,
        currentStreak: data.currentStreak,
      },
      include: {
        user: { select: { name: true, image: true } },
      },
    });

    // Sync progress to linked goal
    await this.syncProgressToLinkedGoal(challengeId, userId);

    // Check if goal is completed
    await this.checkAndMarkCompletion(challengeId, userId);

    return mapPrismaParticipant(participant);
  }

  // ---------------------------------------------------------------------------
  // Goal Integration
  // ---------------------------------------------------------------------------

  async syncProgressToLinkedGoal(challengeId: string, userId: string): Promise<void> {
    // Get participant with linked goal
    const participant = await getDb().practiceChallengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      include: {
        challenge: true,
        linkedGoal: true,
      },
    });

    if (!participant?.linkedGoalId || !participant.linkedGoal) {
      return; // No linked goal to sync
    }

    const goal = participant.linkedGoal;

    // Determine current value based on goal type
    let currentValue = 0;

    switch (goal.goalType) {
      case 'HOURS':
        currentValue = participant.hoursCompleted;
        break;
      case 'QUALITY_HOURS':
        currentValue = participant.qualityHoursCompleted;
        break;
      case 'SESSIONS':
        currentValue = participant.sessionsCompleted;
        break;
      case 'STREAK':
        currentValue = participant.currentStreak;
        break;
      default:
        currentValue = participant.qualityHoursCompleted;
    }

    // Check if goal is completed
    const isCompleted = currentValue >= goal.targetValue;

    // Update the linked goal
    await getDb().practiceGoal.update({
      where: { id: goal.id },
      data: {
        currentValue,
        isCompleted,
        completedAt: isCompleted && !goal.completedAt ? new Date() : goal.completedAt,
      },
    });
  }

  async getLinkedGoal(
    challengeId: string,
    userId: string
  ): Promise<{ goalId: string; progress: number; isCompleted: boolean } | null> {
    const participant = await getDb().practiceChallengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
      include: {
        linkedGoal: true,
      },
    });

    if (!participant?.linkedGoalId || !participant.linkedGoal) {
      return null;
    }

    const goal = participant.linkedGoal;
    const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;

    return {
      goalId: goal.id,
      progress: Math.min(100, progress),
      isCompleted: goal.isCompleted,
    };
  }

  // ---------------------------------------------------------------------------
  // Rewards
  // ---------------------------------------------------------------------------

  async claimReward(challengeId: string, userId: string): Promise<ChallengeParticipant> {
    const participant = await getDb().practiceChallengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (!participant) {
      throw new Error('Not a participant of this challenge');
    }

    if (!participant.completedAt) {
      throw new Error('Challenge not completed yet');
    }

    if (participant.rewardClaimed) {
      throw new Error('Reward already claimed');
    }

    const updated = await getDb().practiceChallengeParticipant.update({
      where: { id: participant.id },
      data: {
        rewardClaimed: true,
        rewardClaimedAt: new Date(),
      },
      include: {
        user: { select: { name: true, image: true } },
      },
    });

    return mapPrismaParticipant(updated);
  }

  async checkCompletion(challengeId: string, userId: string): Promise<boolean> {
    const [challenge, participant] = await Promise.all([
      getDb().practiceChallenge.findUnique({ where: { id: challengeId } }),
      getDb().practiceChallengeParticipant.findUnique({
        where: { challengeId_userId: { challengeId, userId } },
      }),
    ]);

    if (!challenge || !participant) return false;
    if (participant.completedAt) return true;

    // Check each target
    let completed = false;

    if (challenge.targetHours !== null && participant.hoursCompleted >= challenge.targetHours) {
      completed = true;
    }

    if (challenge.targetQualityHours !== null && participant.qualityHoursCompleted >= challenge.targetQualityHours) {
      completed = true;
    }

    if (challenge.targetSessions !== null && participant.sessionsCompleted >= challenge.targetSessions) {
      completed = true;
    }

    if (challenge.targetStreak !== null && participant.currentStreak >= challenge.targetStreak) {
      completed = true;
    }

    return completed;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async updateChallengeStatuses(): Promise<number> {
    const now = new Date();
    let updatedCount = 0;

    // Activate scheduled challenges that have started
    const activated = await getDb().practiceChallenge.updateMany({
      where: {
        status: 'SCHEDULED',
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      data: { status: 'ACTIVE' },
    });
    updatedCount += activated.count;

    // Complete active challenges that have ended
    const completed = await getDb().practiceChallenge.updateMany({
      where: {
        status: 'ACTIVE',
        endsAt: { lte: now },
      },
      data: { status: 'COMPLETED' },
    });
    updatedCount += completed.count;

    return updatedCount;
  }

  async updateParticipantRanks(challengeId: string): Promise<void> {
    const participants = await getDb().practiceChallengeParticipant.findMany({
      where: { challengeId },
      orderBy: [
        { qualityHoursCompleted: 'desc' },
        { sessionsCompleted: 'desc' },
        { currentStreak: 'desc' },
      ],
    });

    // Update ranks
    await Promise.all(
      participants.map((p, index) =>
        getDb().practiceChallengeParticipant.update({
          where: { id: p.id },
          data: { rank: index + 1 },
        })
      )
    );
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private async checkAndMarkCompletion(challengeId: string, userId: string): Promise<void> {
    const isComplete = await this.checkCompletion(challengeId, userId);

    if (isComplete) {
      const participant = await getDb().practiceChallengeParticipant.findUnique({
        where: { challengeId_userId: { challengeId, userId } },
      });

      if (participant && !participant.completedAt) {
        await getDb().practiceChallengeParticipant.update({
          where: { id: participant.id },
          data: { completedAt: new Date() },
        });
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaPracticeChallengeStore(): PrismaPracticeChallengeStore {
  return new PrismaPracticeChallengeStore();
}
