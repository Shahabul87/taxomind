import { db } from '@/lib/db';
import { SAMRecommendationType } from '@prisma/client';
import {
  type LearningSessionStore,
  type LearningSession,
  type TopicProgressStore,
  type TopicProgress,
  type LearningGapStore,
  type LearningGap,
  type SkillAssessmentStore,
  type SkillAssessment,
  type RecommendationStore,
  type Recommendation,
  type ContentStore,
  type ContentItem,
  type ContentFilters,
  MasteryLevel,
  TrendDirection,
  AssessmentSource,
  RecommendationPriority,
  RecommendationReason,
  ContentType,
} from '@sam-ai/agentic';

const mapMasteryToPrisma = (level: MasteryLevel): 'NOVICE' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' => {
  switch (level) {
    case MasteryLevel.BEGINNER:
      return 'BEGINNER';
    case MasteryLevel.INTERMEDIATE:
      return 'INTERMEDIATE';
    case MasteryLevel.PROFICIENT:
      return 'ADVANCED';
    case MasteryLevel.EXPERT:
      return 'EXPERT';
    default:
      return 'NOVICE';
  }
};

const mapMasteryFromPrisma = (level: string): MasteryLevel => {
  switch (level) {
    case 'BEGINNER':
      return MasteryLevel.BEGINNER;
    case 'INTERMEDIATE':
      return MasteryLevel.INTERMEDIATE;
    case 'ADVANCED':
      return MasteryLevel.PROFICIENT;
    case 'EXPERT':
      return MasteryLevel.EXPERT;
    default:
      return MasteryLevel.NOVICE;
  }
};

const mapTrendToPrisma = (trend: TrendDirection): 'IMPROVING' | 'STABLE' | 'DECLINING' | 'FLUCTUATING' => {
  switch (trend) {
    case TrendDirection.IMPROVING:
      return 'IMPROVING';
    case TrendDirection.DECLINING:
      return 'DECLINING';
    case TrendDirection.FLUCTUATING:
      return 'FLUCTUATING';
    default:
      return 'STABLE';
  }
};

const mapTrendFromPrisma = (trend: string): TrendDirection => {
  switch (trend) {
    case 'IMPROVING':
      return TrendDirection.IMPROVING;
    case 'DECLINING':
      return TrendDirection.DECLINING;
    case 'FLUCTUATING':
      return TrendDirection.FLUCTUATING;
    default:
      return TrendDirection.STABLE;
  }
};

const mapGapSeverityToPrisma = (severity: LearningGap['severity']): 'MINOR' | 'MODERATE' | 'CRITICAL' => {
  switch (severity) {
    case 'critical':
      return 'CRITICAL';
    case 'moderate':
      return 'MODERATE';
    default:
      return 'MINOR';
  }
};

const mapGapSeverityFromPrisma = (severity: string): LearningGap['severity'] => {
  switch (severity) {
    case 'CRITICAL':
      return 'critical';
    case 'MODERATE':
      return 'moderate';
    default:
      return 'minor';
  }
};

const mapAssessmentSourceToPrisma = (source: AssessmentSource): 'QUIZ' | 'EXERCISE' | 'PROJECT' | 'PEER_REVIEW' | 'SELF_ASSESSMENT' | 'AI_EVALUATION' => {
  switch (source) {
    case AssessmentSource.EXERCISE:
      return 'EXERCISE';
    case AssessmentSource.PROJECT:
      return 'PROJECT';
    case AssessmentSource.PEER_REVIEW:
      return 'PEER_REVIEW';
    case AssessmentSource.SELF_ASSESSMENT:
      return 'SELF_ASSESSMENT';
    case AssessmentSource.AI_EVALUATION:
      return 'AI_EVALUATION';
    default:
      return 'QUIZ';
  }
};

const mapAssessmentSourceFromPrisma = (source: string): AssessmentSource => {
  switch (source) {
    case 'EXERCISE':
      return AssessmentSource.EXERCISE;
    case 'PROJECT':
      return AssessmentSource.PROJECT;
    case 'PEER_REVIEW':
      return AssessmentSource.PEER_REVIEW;
    case 'SELF_ASSESSMENT':
      return AssessmentSource.SELF_ASSESSMENT;
    case 'AI_EVALUATION':
      return AssessmentSource.AI_EVALUATION;
    default:
      return AssessmentSource.QUIZ;
  }
};

const mapRecommendationPriorityToPrisma = (priority: RecommendationPriority): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  switch (priority) {
    case RecommendationPriority.CRITICAL:
      return 'CRITICAL';
    case RecommendationPriority.HIGH:
      return 'HIGH';
    case RecommendationPriority.LOW:
      return 'LOW';
    default:
      return 'MEDIUM';
  }
};

const mapRecommendationPriorityFromPrisma = (priority: string): RecommendationPriority => {
  switch (priority) {
    case 'CRITICAL':
      return RecommendationPriority.CRITICAL;
    case 'HIGH':
      return RecommendationPriority.HIGH;
    case 'LOW':
      return RecommendationPriority.LOW;
    default:
      return RecommendationPriority.MEDIUM;
  }
};

const mapRecommendationReasonToPrisma = (reason: RecommendationReason): 'KNOWLEDGE_GAP' | 'SKILL_DECAY' | 'PREREQUISITE' | 'REINFORCEMENT' | 'EXPLORATION' | 'CHALLENGE' | 'REVIEW' => {
  switch (reason) {
    case RecommendationReason.SKILL_DECAY:
      return 'SKILL_DECAY';
    case RecommendationReason.PREREQUISITE:
      return 'PREREQUISITE';
    case RecommendationReason.REINFORCEMENT:
      return 'REINFORCEMENT';
    case RecommendationReason.EXPLORATION:
      return 'EXPLORATION';
    case RecommendationReason.CHALLENGE:
      return 'CHALLENGE';
    case RecommendationReason.REVIEW:
      return 'REVIEW';
    default:
      return 'KNOWLEDGE_GAP';
  }
};

const mapRecommendationReasonFromPrisma = (reason: string): RecommendationReason => {
  switch (reason) {
    case 'SKILL_DECAY':
      return RecommendationReason.SKILL_DECAY;
    case 'PREREQUISITE':
      return RecommendationReason.PREREQUISITE;
    case 'REINFORCEMENT':
      return RecommendationReason.REINFORCEMENT;
    case 'EXPLORATION':
      return RecommendationReason.EXPLORATION;
    case 'CHALLENGE':
      return RecommendationReason.CHALLENGE;
    case 'REVIEW':
      return RecommendationReason.REVIEW;
    default:
      return RecommendationReason.KNOWLEDGE_GAP;
  }
};

const mapContentTypeToPrisma = (type: ContentType): 'VIDEO' | 'ARTICLE' | 'EXERCISE' | 'QUIZ' | 'PROJECT' | 'TUTORIAL' | 'DOCUMENTATION' => {
  switch (type) {
    case ContentType.VIDEO:
      return 'VIDEO';
    case ContentType.EXERCISE:
      return 'EXERCISE';
    case ContentType.QUIZ:
      return 'QUIZ';
    case ContentType.PROJECT:
      return 'PROJECT';
    case ContentType.TUTORIAL:
      return 'TUTORIAL';
    case ContentType.DOCUMENTATION:
      return 'DOCUMENTATION';
    default:
      return 'ARTICLE';
  }
};

const mapContentTypeFromPrisma = (type: string): ContentType => {
  switch (type) {
    case 'VIDEO':
      return ContentType.VIDEO;
    case 'EXERCISE':
      return ContentType.EXERCISE;
    case 'QUIZ':
      return ContentType.QUIZ;
    case 'PROJECT':
      return ContentType.PROJECT;
    case 'TUTORIAL':
      return ContentType.TUTORIAL;
    case 'DOCUMENTATION':
      return ContentType.DOCUMENTATION;
    default:
      return ContentType.ARTICLE;
  }
};

const mapDifficultyToPrisma = (difficulty: Recommendation['difficulty']): 'EASY' | 'MEDIUM' | 'HARD' => {
  switch (difficulty) {
    case 'easy':
      return 'EASY';
    case 'hard':
      return 'HARD';
    default:
      return 'MEDIUM';
  }
};

const mapDifficultyFromPrisma = (difficulty: string): Recommendation['difficulty'] => {
  switch (difficulty) {
    case 'EASY':
      return 'easy';
    case 'HARD':
      return 'hard';
    default:
      return 'medium';
  }
};

const mapLearningSession = (record: {
  id: string;
  userId: string;
  topicId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  activitiesCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
  conceptsCovered: string[];
  focusScore: number | null;
}): LearningSession => ({
  id: record.id,
  userId: record.userId,
  topicId: record.topicId,
  startTime: record.startTime,
  endTime: record.endTime ?? undefined,
  duration: record.duration,
  activitiesCompleted: record.activitiesCompleted,
  questionsAnswered: record.questionsAnswered,
  correctAnswers: record.correctAnswers,
  conceptsCovered: record.conceptsCovered,
  focusScore: record.focusScore ?? undefined,
});

const mapTopicProgress = (record: {
  topicId: string;
  topicName: string;
  userId: string;
  masteryLevel: string;
  masteryScore: number;
  completionPercentage: number;
  timeSpent: number;
  sessionsCount: number;
  lastAccessedAt: Date;
  startedAt: Date;
  conceptsLearned: string[];
  conceptsInProgress: string[];
  conceptsNotStarted: string[];
  trend: string;
  trendScore: number;
}): TopicProgress => ({
  topicId: record.topicId,
  topicName: record.topicName,
  userId: record.userId,
  masteryLevel: mapMasteryFromPrisma(record.masteryLevel),
  masteryScore: record.masteryScore,
  completionPercentage: record.completionPercentage,
  timeSpent: record.timeSpent,
  sessionsCount: record.sessionsCount,
  lastAccessedAt: record.lastAccessedAt,
  startedAt: record.startedAt,
  conceptsLearned: record.conceptsLearned,
  conceptsInProgress: record.conceptsInProgress,
  conceptsNotStarted: record.conceptsNotStarted,
  trend: mapTrendFromPrisma(record.trend),
  trendScore: record.trendScore,
});

const mapLearningGap = (record: {
  id: string;
  userId: string;
  conceptId: string;
  conceptName: string;
  topicId: string;
  severity: string;
  detectedAt: Date;
  evidence: unknown;
  suggestedActions: string[];
  isResolved: boolean;
  resolvedAt: Date | null;
}): LearningGap => ({
  id: record.id,
  userId: record.userId,
  conceptId: record.conceptId,
  conceptName: record.conceptName,
  topicId: record.topicId,
  severity: mapGapSeverityFromPrisma(record.severity),
  detectedAt: record.detectedAt,
  evidence: (record.evidence as LearningGap['evidence']) ?? [],
  suggestedActions: record.suggestedActions,
  isResolved: record.isResolved,
  resolvedAt: record.resolvedAt ?? undefined,
});

const mapSkillAssessment = (record: {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  level: string;
  score: number;
  confidence: number;
  source: string;
  evidence: unknown;
  assessedAt: Date;
  validUntil: Date | null;
  previousLevel: string | null;
  previousScore: number | null;
}): SkillAssessment => ({
  id: record.id,
  userId: record.userId,
  skillId: record.skillId,
  skillName: record.skillName,
  level: mapMasteryFromPrisma(record.level),
  score: record.score,
  confidence: record.confidence,
  source: mapAssessmentSourceFromPrisma(record.source),
  evidence: record.evidence as SkillAssessment['evidence'],
  assessedAt: record.assessedAt,
  validUntil: record.validUntil ?? undefined,
  previousLevel: record.previousLevel ? mapMasteryFromPrisma(record.previousLevel) : undefined,
  previousScore: record.previousScore ?? undefined,
});

const mapRecommendation = (record: {
  id: string;
  userId: string;
  type: string;
  priority: string;
  reason: string;
  title: string;
  description: string | null;
  targetSkillId: string | null;
  targetConceptId: string | null;
  estimatedDuration: number;
  difficulty: string;
  confidence: number;
  resourceUrl: string | null;
  resourceId: string | null;
  prerequisites: string[];
  createdAt: Date;
  expiresAt: Date | null;
  isViewed: boolean;
  isCompleted: boolean;
  userRating: number | null;
}): Recommendation => ({
  id: record.id,
  userId: record.userId,
  type: mapContentTypeFromPrisma(record.type),
  priority: mapRecommendationPriorityFromPrisma(record.priority),
  reason: mapRecommendationReasonFromPrisma(record.reason),
  title: record.title,
  description: record.description ?? '',
  targetSkillId: record.targetSkillId ?? undefined,
  targetConceptId: record.targetConceptId ?? undefined,
  estimatedDuration: record.estimatedDuration,
  difficulty: mapDifficultyFromPrisma(record.difficulty),
  confidence: record.confidence,
  resourceUrl: record.resourceUrl ?? undefined,
  resourceId: record.resourceId ?? undefined,
  prerequisites: record.prerequisites,
  createdAt: record.createdAt,
  expiresAt: record.expiresAt ?? undefined,
  isViewed: record.isViewed,
  isCompleted: record.isCompleted,
  userRating: record.userRating ?? undefined,
});

export class PrismaLearningSessionStore implements LearningSessionStore {
  async create(session: Omit<LearningSession, 'id'>): Promise<LearningSession> {
    const record = await db.sAMLearningSession.create({
      data: {
        userId: session.userId,
        topicId: session.topicId,
        startTime: session.startTime,
        endTime: session.endTime ?? null,
        duration: session.duration,
        activitiesCompleted: session.activitiesCompleted,
        questionsAnswered: session.questionsAnswered,
        correctAnswers: session.correctAnswers,
        conceptsCovered: session.conceptsCovered,
        focusScore: session.focusScore ?? null,
      },
    });

    return mapLearningSession(record);
  }

  async get(id: string): Promise<LearningSession | null> {
    const record = await db.sAMLearningSession.findUnique({ where: { id } });
    return record ? mapLearningSession(record) : null;
  }

  async getByUser(userId: string, limit?: number): Promise<LearningSession[]> {
    const records = await db.sAMLearningSession.findMany({
      where: { userId },
      take: limit,
      orderBy: { startTime: 'desc' },
    });
    return records.map(mapLearningSession);
  }

  async getByUserAndTopic(userId: string, topicId: string): Promise<LearningSession[]> {
    const records = await db.sAMLearningSession.findMany({
      where: { userId, topicId },
      orderBy: { startTime: 'desc' },
    });
    return records.map(mapLearningSession);
  }

  async getByPeriod(userId: string, start: Date, end: Date): Promise<LearningSession[]> {
    const records = await db.sAMLearningSession.findMany({
      where: {
        userId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { startTime: 'asc' },
    });
    return records.map(mapLearningSession);
  }

  async update(id: string, updates: Partial<LearningSession>): Promise<LearningSession> {
    const record = await db.sAMLearningSession.update({
      where: { id },
      data: {
        startTime: updates.startTime,
        endTime: updates.endTime ?? undefined,
        duration: updates.duration,
        activitiesCompleted: updates.activitiesCompleted,
        questionsAnswered: updates.questionsAnswered,
        correctAnswers: updates.correctAnswers,
        conceptsCovered: updates.conceptsCovered,
        focusScore: updates.focusScore ?? undefined,
      },
    });

    return mapLearningSession(record);
  }
}

export class PrismaTopicProgressStore implements TopicProgressStore {
  async get(userId: string, topicId: string): Promise<TopicProgress | null> {
    const record = await db.sAMTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });
    return record ? mapTopicProgress(record) : null;
  }

  async getByUser(userId: string): Promise<TopicProgress[]> {
    const records = await db.sAMTopicProgress.findMany({
      where: { userId },
      orderBy: { lastAccessedAt: 'desc' },
    });
    return records.map(mapTopicProgress);
  }

  async upsert(progress: TopicProgress): Promise<TopicProgress> {
    const record = await db.sAMTopicProgress.upsert({
      where: { userId_topicId: { userId: progress.userId, topicId: progress.topicId } },
      update: {
        topicName: progress.topicName,
        masteryLevel: mapMasteryToPrisma(progress.masteryLevel),
        masteryScore: progress.masteryScore,
        completionPercentage: progress.completionPercentage,
        timeSpent: progress.timeSpent,
        sessionsCount: progress.sessionsCount,
        lastAccessedAt: progress.lastAccessedAt,
        conceptsLearned: progress.conceptsLearned,
        conceptsInProgress: progress.conceptsInProgress,
        conceptsNotStarted: progress.conceptsNotStarted,
        trend: mapTrendToPrisma(progress.trend),
        trendScore: progress.trendScore,
      },
      create: {
        userId: progress.userId,
        topicId: progress.topicId,
        topicName: progress.topicName,
        masteryLevel: mapMasteryToPrisma(progress.masteryLevel),
        masteryScore: progress.masteryScore,
        completionPercentage: progress.completionPercentage,
        timeSpent: progress.timeSpent,
        sessionsCount: progress.sessionsCount,
        lastAccessedAt: progress.lastAccessedAt,
        startedAt: progress.startedAt,
        conceptsLearned: progress.conceptsLearned,
        conceptsInProgress: progress.conceptsInProgress,
        conceptsNotStarted: progress.conceptsNotStarted,
        trend: mapTrendToPrisma(progress.trend),
        trendScore: progress.trendScore,
      },
    });

    return mapTopicProgress(record);
  }

  async getByMasteryLevel(userId: string, level: MasteryLevel): Promise<TopicProgress[]> {
    const records = await db.sAMTopicProgress.findMany({
      where: {
        userId,
        masteryLevel: mapMasteryToPrisma(level),
      },
    });
    return records.map(mapTopicProgress);
  }
}

export class PrismaLearningGapStore implements LearningGapStore {
  async create(gap: Omit<LearningGap, 'id'>): Promise<LearningGap> {
    const record = await db.sAMLearningGap.create({
      data: {
        userId: gap.userId,
        conceptId: gap.conceptId,
        conceptName: gap.conceptName,
        topicId: gap.topicId,
        severity: mapGapSeverityToPrisma(gap.severity),
        detectedAt: gap.detectedAt,
        evidence: gap.evidence ?? [],
        suggestedActions: gap.suggestedActions,
        isResolved: gap.isResolved,
        resolvedAt: gap.resolvedAt ?? null,
      },
    });

    return mapLearningGap(record);
  }

  async get(id: string): Promise<LearningGap | null> {
    const record = await db.sAMLearningGap.findUnique({ where: { id } });
    return record ? mapLearningGap(record) : null;
  }

  async getByUser(userId: string, includeResolved = false): Promise<LearningGap[]> {
    const records = await db.sAMLearningGap.findMany({
      where: {
        userId,
        isResolved: includeResolved ? undefined : false,
      },
      orderBy: { detectedAt: 'desc' },
    });

    return records.map(mapLearningGap);
  }

  async resolve(id: string): Promise<LearningGap> {
    const record = await db.sAMLearningGap.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });

    return mapLearningGap(record);
  }

  async getBySeverity(userId: string, severity: LearningGap['severity']): Promise<LearningGap[]> {
    const records = await db.sAMLearningGap.findMany({
      where: {
        userId,
        severity: mapGapSeverityToPrisma(severity),
        isResolved: false,
      },
    });

    return records.map(mapLearningGap);
  }
}

export class PrismaSkillAssessmentStore implements SkillAssessmentStore {
  async create(assessment: Omit<SkillAssessment, 'id'>): Promise<SkillAssessment> {
    const record = await db.sAMSkillAssessment.create({
      data: {
        userId: assessment.userId,
        skillId: assessment.skillId,
        skillName: assessment.skillName,
        level: mapMasteryToPrisma(assessment.level),
        score: assessment.score,
        confidence: assessment.confidence,
        source: mapAssessmentSourceToPrisma(assessment.source),
        evidence: assessment.evidence,
        assessedAt: assessment.assessedAt,
        validUntil: assessment.validUntil ?? null,
        previousLevel: assessment.previousLevel ? mapMasteryToPrisma(assessment.previousLevel) : null,
        previousScore: assessment.previousScore ?? null,
      },
    });

    return mapSkillAssessment(record);
  }

  async get(id: string): Promise<SkillAssessment | null> {
    const record = await db.sAMSkillAssessment.findUnique({ where: { id } });
    return record ? mapSkillAssessment(record) : null;
  }

  async getByUserAndSkill(userId: string, skillId: string): Promise<SkillAssessment | null> {
    const record = await db.sAMSkillAssessment.findFirst({
      where: { userId, skillId },
      orderBy: { assessedAt: 'desc' },
    });
    return record ? mapSkillAssessment(record) : null;
  }

  async getByUser(userId: string): Promise<SkillAssessment[]> {
    const records = await db.sAMSkillAssessment.findMany({
      where: { userId },
      orderBy: { assessedAt: 'desc' },
    });
    return records.map(mapSkillAssessment);
  }

  async getHistory(userId: string, skillId: string, limit?: number): Promise<SkillAssessment[]> {
    const records = await db.sAMSkillAssessment.findMany({
      where: { userId, skillId },
      orderBy: { assessedAt: 'desc' },
      take: limit,
    });
    return records.map(mapSkillAssessment);
  }
}

export class PrismaRecommendationStore implements RecommendationStore {
  async create(recommendation: Omit<Recommendation, 'id'>): Promise<Recommendation> {
    const record = await db.sAMRecommendation.create({
      data: {
        userId: recommendation.userId,
        type: mapContentTypeToPrisma(recommendation.type),
        priority: mapRecommendationPriorityToPrisma(recommendation.priority),
        reason: mapRecommendationReasonToPrisma(recommendation.reason),
        title: recommendation.title,
        description: recommendation.description ?? null,
        targetSkillId: recommendation.targetSkillId ?? null,
        targetConceptId: recommendation.targetConceptId ?? null,
        estimatedDuration: recommendation.estimatedDuration,
        difficulty: mapDifficultyToPrisma(recommendation.difficulty),
        confidence: recommendation.confidence,
        resourceUrl: recommendation.resourceUrl ?? null,
        resourceId: recommendation.resourceId ?? null,
        prerequisites: recommendation.prerequisites ?? [],
        createdAt: recommendation.createdAt,
        expiresAt: recommendation.expiresAt ?? null,
        isViewed: recommendation.isViewed,
        isCompleted: recommendation.isCompleted,
        userRating: recommendation.userRating ?? null,
      },
    });

    return mapRecommendation(record);
  }

  async get(id: string): Promise<Recommendation | null> {
    const record = await db.sAMRecommendation.findUnique({ where: { id } });
    return record ? mapRecommendation(record) : null;
  }

  async getByUser(userId: string, limit?: number): Promise<Recommendation[]> {
    const records = await db.sAMRecommendation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return records.map(mapRecommendation);
  }

  async getActive(userId: string): Promise<Recommendation[]> {
    const now = new Date();
    const records = await db.sAMRecommendation.findMany({
      where: {
        userId,
        isCompleted: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
    return records.map(mapRecommendation);
  }

  async markViewed(id: string): Promise<Recommendation> {
    const record = await db.sAMRecommendation.update({
      where: { id },
      data: { isViewed: true },
    });
    return mapRecommendation(record);
  }

  async markCompleted(id: string, rating?: number): Promise<Recommendation> {
    const record = await db.sAMRecommendation.update({
      where: { id },
      data: { isCompleted: true, userRating: rating ?? null },
    });
    return mapRecommendation(record);
  }

  async expire(id: string): Promise<void> {
    await db.sAMRecommendation.update({
      where: { id },
      data: { expiresAt: new Date() },
    });
  }

  /**
   * Find recommendations with complex filtering for history timeline
   */
  async findHistory(options: {
    userId: string;
    types?: string[];
    status?: 'completed' | 'pending' | 'dismissed' | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    reason: string;
    isCompleted: boolean;
    isViewed: boolean;
    createdAt: Date;
    expiresAt: Date | null;
  }[]> {
    const { userId, types, status = 'all', limit = 50, offset = 0 } = options;

    const where: {
      userId: string;
      type?: { in: SAMRecommendationType[] };
      isCompleted?: boolean;
      OR?: Array<{ expiresAt: null } | { expiresAt: { gt: Date } } | { expiresAt: { lt: Date } }>;
    } = { userId };

    if (types && types.length > 0) {
      where.type = { in: types as SAMRecommendationType[] };
    }

    if (status !== 'all') {
      if (status === 'completed') {
        where.isCompleted = true;
      } else if (status === 'pending') {
        where.isCompleted = false;
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ];
      } else if (status === 'dismissed') {
        where.isCompleted = false;
        where.OR = [
          { expiresAt: { lt: new Date() } },
        ];
      }
    }

    const records = await db.sAMRecommendation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        reason: true,
        isCompleted: true,
        isViewed: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return records;
  }

  /**
   * Count recommendations with complex filtering for history timeline
   */
  async countHistory(options: {
    userId: string;
    types?: string[];
    status?: 'completed' | 'pending' | 'dismissed' | 'all';
  }): Promise<number> {
    const { userId, types, status = 'all' } = options;

    const where: {
      userId: string;
      type?: { in: SAMRecommendationType[] };
      isCompleted?: boolean;
      OR?: Array<{ expiresAt: null } | { expiresAt: { gt: Date } } | { expiresAt: { lt: Date } }>;
    } = { userId };

    if (types && types.length > 0) {
      where.type = { in: types as SAMRecommendationType[] };
    }

    if (status !== 'all') {
      if (status === 'completed') {
        where.isCompleted = true;
      } else if (status === 'pending') {
        where.isCompleted = false;
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ];
      } else if (status === 'dismissed') {
        where.isCompleted = false;
        where.OR = [
          { expiresAt: { lt: new Date() } },
        ];
      }
    }

    return db.sAMRecommendation.count({ where });
  }
}

const buildContentItemFromCourse = (course: { id: string; title: string; description: string | null; categoryId: string | null; }): ContentItem => ({
  id: course.id,
  title: course.title,
  description: course.description ?? '',
  type: ContentType.TUTORIAL,
  topicId: course.id,
  skillIds: [],
  conceptIds: [],
  difficulty: 'medium',
  duration: 45,
  url: `/courses/${course.id}`,
  tags: course.categoryId ? [course.categoryId] : [],
});

const buildContentItemFromChapter = (chapter: { id: string; title: string; description: string | null; courseId: string; }): ContentItem => ({
  id: chapter.id,
  title: chapter.title,
  description: chapter.description ?? '',
  type: ContentType.ARTICLE,
  topicId: chapter.courseId,
  skillIds: [],
  conceptIds: [],
  difficulty: 'medium',
  duration: 25,
  url: `/courses/${chapter.courseId}/chapters/${chapter.id}`,
  tags: [],
});

const buildContentItemFromSection = (section: { id: string; title: string; type: string | null; chapterId: string; }): ContentItem => {
  const contentType = section.type?.toLowerCase().includes('video')
    ? ContentType.VIDEO
    : section.type?.toLowerCase().includes('quiz')
      ? ContentType.QUIZ
      : ContentType.TUTORIAL;
  return {
    id: section.id,
    title: section.title,
    description: '',
    type: contentType,
    topicId: section.chapterId,
    skillIds: [],
    conceptIds: [],
    difficulty: 'medium',
    duration: 15,
    url: `/chapters/${section.chapterId}/sections/${section.id}`,
    tags: [],
  };
};

export class PrismaContentStore implements ContentStore {
  async get(id: string): Promise<ContentItem | null> {
    const course = await db.course.findUnique({
      where: { id },
      select: { id: true, title: true, description: true, categoryId: true },
    });
    if (course) return buildContentItemFromCourse(course);

    const chapter = await db.chapter.findUnique({
      where: { id },
      select: { id: true, title: true, description: true, courseId: true },
    });
    if (chapter) return buildContentItemFromChapter(chapter);

    const section = await db.section.findUnique({
      where: { id },
      select: { id: true, title: true, type: true, chapterId: true },
    });
    if (section) return buildContentItemFromSection(section);

    return null;
  }

  async getByTopic(topicId: string): Promise<ContentItem[]> {
    const chapters = await db.chapter.findMany({
      where: { courseId: topicId },
      select: { id: true, title: true, description: true, courseId: true },
      take: 20,
    });
    return chapters.map(buildContentItemFromChapter);
  }

  async getBySkill(_skillId: string): Promise<ContentItem[]> {
    return [];
  }

  async getByType(type: ContentType): Promise<ContentItem[]> {
    if (type === ContentType.TUTORIAL || type === ContentType.ARTICLE) {
      const courses = await db.course.findMany({
        select: { id: true, title: true, description: true, categoryId: true },
        take: 20,
      });
      return courses.map(buildContentItemFromCourse);
    }

    if (type === ContentType.VIDEO || type === ContentType.QUIZ) {
      const sections = await db.section.findMany({
        select: { id: true, title: true, type: true, chapterId: true },
        take: 20,
      });
      return sections.map(buildContentItemFromSection).filter((item) => item.type === type);
    }

    return [];
  }

  async search(query: string, filters?: ContentFilters): Promise<ContentItem[]> {
    const whereFilter = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const courses = await db.course.findMany({
      where: whereFilter,
      select: { id: true, title: true, description: true, categoryId: true },
      take: 10,
    });

    const chapters = await db.chapter.findMany({
      where: whereFilter,
      select: { id: true, title: true, description: true, courseId: true },
      take: 10,
    });

    const items = [
      ...courses.map(buildContentItemFromCourse),
      ...chapters.map(buildContentItemFromChapter),
    ];

    return items.filter((item) => {
      if (!filters) return true;
      if (filters.types && !filters.types.includes(item.type)) return false;
      if (filters.difficulty && !filters.difficulty.includes(item.difficulty)) return false;
      if (filters.minDuration && item.duration < filters.minDuration) return false;
      if (filters.maxDuration && item.duration > filters.maxDuration) return false;
      if (filters.topicIds && !filters.topicIds.includes(item.topicId)) return false;
      if (filters.skillIds && !filters.skillIds.some((skillId) => item.skillIds.includes(skillId))) return false;
      return true;
    });
  }
}

export function createPrismaLearningSessionStore(): PrismaLearningSessionStore {
  return new PrismaLearningSessionStore();
}

export function createPrismaTopicProgressStore(): PrismaTopicProgressStore {
  return new PrismaTopicProgressStore();
}

export function createPrismaLearningGapStore(): PrismaLearningGapStore {
  return new PrismaLearningGapStore();
}

export function createPrismaSkillAssessmentStore(): PrismaSkillAssessmentStore {
  return new PrismaSkillAssessmentStore();
}

export function createPrismaRecommendationStore(): PrismaRecommendationStore {
  return new PrismaRecommendationStore();
}

export function createPrismaContentStore(): PrismaContentStore {
  return new PrismaContentStore();
}
