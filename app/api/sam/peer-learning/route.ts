/**
 * Peer Learning API Route
 * Handles peer matching, study groups, mentorship, peer reviews,
 * collaborative projects, and reputation management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSAMConfig } from '@sam-ai/core';
import { getSAMAdapter, handleAIAccessError, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import {
  createPeerLearningEngine,
  type PeerLearningEngineConfig,
  type MatchType,
  type GroupType,
  type GroupVisibility,
  type MentorshipType,
  type PeerReviewType,
  type ProjectType,
} from '@sam-ai/educational';
import { enrichFeatureResponse } from '@/lib/sam/pipeline/feature-enrichment';

// ============================================================================
// PER-REQUEST ENGINE FACTORY
// ============================================================================

async function createPeerLearningEngineForUser(userId: string) {
  const aiAdapter = await getSAMAdapter({ userId, capability: 'chat' });

  const samConfig = createSAMConfig({
    ai: aiAdapter,
    logger: {
      debug: (msg: string, data?: unknown) => logger.debug(msg, data),
      info: (msg: string, data?: unknown) => logger.info(msg, data),
      warn: (msg: string, data?: unknown) => logger.warn(msg, data),
      error: (msg: string, data?: unknown) => logger.error(msg, data),
    },
    features: {
      gamification: true,
      formSync: false,
      autoContext: true,
      emotionDetection: false,
      learningStyleDetection: true,
      streaming: false,
      analytics: true,
    },
  });

  const config: PeerLearningEngineConfig = {
    matchingAlgorithm: 'ML_ENHANCED',
    gamificationEnabled: true,
    mentoringEnabled: true,
    reviewCalibrationEnabled: true,
    projectsEnabled: true,
  };

  return createPeerLearningEngine(samConfig, config);
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const MatchTypeEnum = z.enum([
  'STUDY_BUDDY', 'MENTOR', 'MENTEE', 'PROJECT_PARTNER',
  'ACCOUNTABILITY_PARTNER', 'DISCUSSION_PARTNER'
]);

const GroupTypeEnum = z.enum([
  'STUDY_GROUP', 'PROJECT_TEAM', 'DISCUSSION_FORUM',
  'ACCOUNTABILITY_GROUP', 'PEER_REVIEW_CIRCLE'
]);

const GroupVisibilityEnum = z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']);

const MentorshipTypeEnum = z.enum([
  'FORMAL', 'INFORMAL', 'PEER', 'REVERSE', 'GROUP'
]);

const PeerReviewTypeEnum = z.enum([
  'SINGLE_BLIND', 'DOUBLE_BLIND', 'OPEN', 'COLLABORATIVE'
]);

const ProjectTypeEnum = z.enum([
  'RESEARCH', 'DEVELOPMENT', 'CREATIVE', 'CASE_STUDY', 'HACKATHON'
]);

const CreatePeerProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  expertise: z.array(z.object({
    subject: z.string(),
    topic: z.string().optional(),
    proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']),
    yearsOfExperience: z.number().min(0).optional(),
    credentials: z.array(z.string()).optional(),
  })).optional(),
  learningGoals: z.array(z.object({
    subject: z.string(),
    topic: z.string().optional(),
    targetLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']),
    currentLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']).optional(),
    deadline: z.string().datetime().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  })).optional(),
  timezone: z.string().optional(),
  languages: z.array(z.string()).optional(),
});

const FindPeerMatchesSchema = z.object({
  matchType: MatchTypeEnum,
  topicIds: z.array(z.string()).optional(),
  skillIds: z.array(z.string()).optional(),
  maxResults: z.number().int().min(1).max(50).optional().default(10),
  filters: z.object({
    experienceLevel: z.enum(['ANY', 'SIMILAR', 'MORE_EXPERIENCED', 'LESS_EXPERIENCED']).optional(),
    availabilityOverlap: z.number().min(0).max(1).optional(),
    languagePreference: z.array(z.string()).optional(),
  }).optional(),
});

const CreateStudyGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  type: GroupTypeEnum,
  visibility: GroupVisibilityEnum.optional().default('PUBLIC'),
  maxMembers: z.number().int().min(2).max(100).optional().default(10),
  topics: z.array(z.string()).optional(),
  schedule: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
    time: z.string().optional(),
    duration: z.number().int().min(15).max(240).optional(),
  }).optional(),
  goals: z.array(z.object({
    title: z.string(),
    description: z.string(),
    targetDate: z.string().datetime().optional(),
  })).optional(),
  subject: z.string(),
  ownerId: z.string().optional(),
});

const JoinGroupSchema = z.object({
  groupId: z.string().min(1),
  message: z.string().max(500).optional(),
});

const CreateGroupSessionSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  scheduledTime: z.string().datetime(),
  duration: z.number().int().min(15).max(480),
  type: z.enum(['STUDY_SESSION', 'DISCUSSION', 'PRESENTATION', 'WORKSHOP', 'Q_AND_A', 'REVIEW', 'BRAINSTORM', 'PRACTICE']).optional(),
  agenda: z.array(z.object({
    topic: z.string(),
    duration: z.number().int().min(5),
    presenter: z.string().optional(),
  })).optional(),
});

const CreateDiscussionSchema = z.object({
  groupId: z.string().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(10000),
  type: z.enum(['QUESTION', 'DISCUSSION', 'RESOURCE_SHARE', 'ANNOUNCEMENT', 'POLL']).optional(),
  tags: z.array(z.string()).optional(),
  topicId: z.string().optional(),
});

const CreateReplySchema = z.object({
  threadId: z.string().min(1),
  content: z.string().min(1).max(5000),
  parentReplyId: z.string().optional(),
});

const RequestMentorshipSchema = z.object({
  mentorId: z.string().min(1),
  type: MentorshipTypeEnum.optional(),
  subjects: z.array(z.string()).min(1),
  message: z.string().max(1000).optional(),
  goals: z.array(z.object({
    title: z.string(),
    description: z.string(),
    targetDate: z.string().datetime().optional(),
  })).optional(),
});

const CreatePeerReviewAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: PeerReviewTypeEnum,
  rubric: z.array(z.object({
    criterion: z.string(),
    description: z.string(),
    maxPoints: z.number().min(1).max(100),
    levels: z.array(z.object({
      label: z.string(),
      points: z.number(),
      description: z.string(),
    })).optional(),
  })),
  deadline: z.string().datetime(),
  reviewsRequired: z.number().int().min(1).max(10).optional().default(2),
  groupId: z.string().optional(),
});

const SubmitPeerReviewSchema = z.object({
  assignmentId: z.string().min(1),
  submissionId: z.string().min(1),
  scores: z.array(z.object({
    criterionId: z.string(),
    score: z.number(),
    feedback: z.string().optional(),
  })),
  overallFeedback: z.string().max(2000).optional(),
  confidenceLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  type: ProjectTypeEnum,
  skills: z.array(z.string()).optional(),
  timeline: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  teamSize: z.object({
    min: z.number().int().min(1),
    max: z.number().int().max(20),
  }).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    dueDate: z.string().datetime(),
  })).optional(),
});

// ============================================================================
// GET - Retrieve peer data
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'readonly');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const engine = await createPeerLearningEngineForUser(session.user.id);

    // Support both 'action' (frontend) and 'endpoint' param names
    const endpoint = searchParams.get('endpoint') ?? searchParams.get('action') ?? 'profile';
    const limit = parseInt(searchParams.get('limit') ?? '10');

    switch (endpoint) {
      case 'profile': {
        const profile = engine.getPeerProfile(session.user.id);
        return NextResponse.json({
          success: true,
          data: profile ?? null,
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'get-stats': {
        // Aggregate stats from profile and analytics
        const profile = engine.getPeerProfile(session.user.id);
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const analytics = engine.getAnalytics(startDate, now);

        const profileData = (profile ?? {}) as Record<string, unknown>;
        const analyticsData = (analytics ?? {}) as unknown as Record<string, unknown>;

        const stats = {
          totalPeers: analyticsData?.totalPeers ?? profileData?.connectionsCount ?? 0,
          groupsJoined: analyticsData?.groupsJoined ?? profileData?.groupsJoined ?? 0,
          reviewsGiven: analyticsData?.reviewsGiven ?? profileData?.reviewsGiven ?? 0,
          reviewsReceived: analyticsData?.reviewsReceived ?? profileData?.reviewsReceived ?? 0,
          collaborationHours: analyticsData?.collaborationHours ?? 0,
          helpfulnessScore: profileData?.helpfulnessScore ?? profileData?.reputation ?? 0,
          reputation: profileData?.reputation ?? 0,
        };

        return NextResponse.json({
          success: true,
          data: { stats },
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'get-matches': {
        const matches = engine.findPeerMatches({
          userId: session.user.id,
          criteria: {
            matchType: 'STUDY_BUDDY' as MatchType,
            limit,
          },
        });

        return NextResponse.json({
          success: true,
          data: { matches: matches ?? [] },
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'get-groups': {
        // Return groups the user belongs to, or public groups
        const groupId = searchParams.get('groupId');
        if (groupId) {
          const group = engine.getStudyGroup(groupId);
          return NextResponse.json({
            success: true,
            data: { groups: group ? [group] : [] },
            metadata: { timestamp: new Date().toISOString() },
          });
        }
        // Return empty array — engine doesn't have a "list my groups" method
        return NextResponse.json({
          success: true,
          data: { groups: [] },
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'get-activities': {
        // Use analytics to derive recent activities
        const now = new Date();
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const analytics = engine.getAnalytics(startDate, now);
        const analyticsData = (analytics ?? {}) as unknown as Record<string, unknown>;

        return NextResponse.json({
          success: true,
          data: { activities: analyticsData?.recentActivities ?? [] },
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'groups': {
        // Legacy endpoint: get group by ID if provided, otherwise return empty list
        const groupId = searchParams.get('groupId');
        if (groupId) {
          const group = engine.getStudyGroup(groupId);
          return NextResponse.json({
            success: true,
            data: group ?? null,
            metadata: { timestamp: new Date().toISOString() },
          });
        }
        return NextResponse.json({
          success: true,
          data: [],
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'mentorships': {
        // Get mentorship by ID if provided
        const mentorshipId = searchParams.get('mentorshipId');
        if (mentorshipId) {
          const mentorship = engine.getMentorship(mentorshipId);
          return NextResponse.json({
            success: true,
            data: mentorship ?? null,
            metadata: { timestamp: new Date().toISOString() },
          });
        }
        return NextResponse.json({
          success: true,
          data: [],
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'leaderboard': {
        const category = searchParams.get('category') as 'overall' | 'helpfulness' | 'sessions' | 'reviews' | undefined;
        const leaderboard = engine.getLeaderboard({
          category,
          limit,
        });
        return NextResponse.json({
          success: true,
          data: leaderboard,
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      case 'analytics': {
        const timeRange = searchParams.get('timeRange') ?? 'MONTH';
        const now = new Date();
        let startDate: Date;
        switch (timeRange) {
          case 'WEEK':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'QUARTER':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'YEAR':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          case 'MONTH':
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const analytics = engine.getAnalytics(startDate, now);
        return NextResponse.json({
          success: true,
          data: analytics,
          metadata: { timestamp: new Date().toISOString() },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown endpoint: ${endpoint}` } },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('[PeerLearning] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve peer learning data' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Action-based handler for various operations
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const gateResult = await withSubscriptionGate(session.user.id, { category: 'chat' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing action parameter' } },
        { status: 400 }
      );
    }

    const engine = await createPeerLearningEngineForUser(session.user.id);
    let result: unknown;

    switch (action) {
      case 'create-profile': {
        const validated = CreatePeerProfileSchema.parse(data);
        result = engine.createPeerProfile({
          userId: session.user.id,
          displayName: validated.displayName,
          avatarUrl: validated.avatarUrl,
          bio: validated.bio,
          expertise: validated.expertise,
          learningGoals: validated.learningGoals?.map(g => ({
            ...g,
            deadline: g.deadline ? new Date(g.deadline) : undefined,
          })),
          timezone: validated.timezone,
          languages: validated.languages,
        });
        logger.info('[PeerLearning] Profile created', {
          userId: session.user.id,
          displayName: validated.displayName,
        });
        break;
      }

      case 'update-profile': {
        const validated = CreatePeerProfileSchema.partial().parse(data);
        result = await engine.updatePeerProfile({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'find-matches': {
        const validated = FindPeerMatchesSchema.parse(data);
        result = engine.findPeerMatches({
          userId: session.user.id,
          criteria: {
            matchType: validated.matchType as MatchType,
            subjects: validated.topicIds,
            limit: validated.maxResults,
          },
        });
        logger.info('[PeerLearning] Matches found', {
          userId: session.user.id,
          matchType: validated.matchType,
        });
        break;
      }

      case 'create-study-group': {
        const validated = CreateStudyGroupSchema.parse(data);
        result = engine.createStudyGroup({
          name: validated.name,
          description: validated.description ?? '',
          subject: validated.subject,
          topics: validated.topics,
          type: validated.type as GroupType,
          visibility: validated.visibility as GroupVisibility,
          maxMembers: validated.maxMembers,
          ownerId: session.user.id,
          goals: validated.goals?.map(g => ({
            title: g.title,
            description: g.description,
            targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
          })),
        });
        logger.info('[PeerLearning] Study group created', {
          userId: session.user.id,
          groupName: validated.name,
          type: validated.type,
        });
        break;
      }

      case 'join-group': {
        const validated = JoinGroupSchema.parse(data);
        result = await engine.joinGroup({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'leave-group': {
        const groupId = z.string().min(1).parse(data?.groupId);
        engine.leaveGroup(groupId, session.user.id);
        result = { success: true, message: 'Left group successfully' };
        break;
      }

      case 'create-group-session': {
        const validated = CreateGroupSessionSchema.parse(data);
        result = engine.createGroupSession({
          groupId: validated.groupId,
          title: validated.title,
          description: validated.description,
          scheduledAt: new Date(validated.scheduledTime),
          duration: validated.duration,
          type: validated.type,
          createdBy: session.user.id,
        });
        break;
      }

      case 'create-discussion': {
        const validated = CreateDiscussionSchema.parse(data);
        result = await engine.createDiscussion({
          authorId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'create-reply': {
        const validated = CreateReplySchema.parse(data);
        result = await engine.createReply({
          authorId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'request-mentorship': {
        const validated = RequestMentorshipSchema.parse(data);
        result = engine.requestMentorship({
          menteeId: session.user.id,
          mentorId: validated.mentorId,
          type: validated.type as MentorshipType,
          subjects: validated.subjects,
          message: validated.message,
          goals: validated.goals?.map(g => ({
            title: g.title,
            description: g.description,
            targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
          })),
        });
        logger.info('[PeerLearning] Mentorship requested', {
          menteeId: session.user.id,
          mentorId: validated.mentorId,
          type: validated.type,
        });
        break;
      }

      case 'respond-mentorship': {
        const { mentorshipId, accept } = z.object({
          mentorshipId: z.string().min(1),
          accept: z.boolean(),
        }).parse(data);
        const status = accept ? 'ACTIVE' : 'TERMINATED';
        result = engine.updateMentorshipStatus(mentorshipId, status, session.user.id);
        break;
      }

      case 'create-peer-review-assignment':
      case 'submit-peer-review':
      case 'create-project':
      case 'add-reaction':
        // These actions require complex setup - return placeholder for now
        return NextResponse.json({
          success: false,
          error: { code: 'NOT_IMPLEMENTED', message: `Action '${action}' is not yet fully implemented` },
        }, { status: 501 });

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown action: ${action}` } },
          { status: 400 }
        );
    }

    // Fire-and-forget enrichment
    void enrichFeatureResponse({
      userId: session.user.id,
      featureName: 'peer-learning',
      action,
      requestData: (data as Record<string, unknown>) ?? {},
      responseData: (result as Record<string, unknown>) ?? {},
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[PeerLearning] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { code: 'TIMEOUT', message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[PeerLearning] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process peer learning request' } },
      { status: 500 }
    );
  }
}
