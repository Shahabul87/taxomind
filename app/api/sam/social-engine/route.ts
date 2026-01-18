/**
 * SAM Social Engine - Main Route
 * GET/POST /api/sam/social-engine
 *
 * Main endpoint for the SocialEngine from @sam-ai/educational
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createSocialEngine } from '@sam-ai/educational';
import type { SocialEngine } from '@sam-ai/educational';
import { getSocialEngineAdapter } from '@/lib/adapters';
import { logger } from '@/lib/logger';

// Engine singleton
let engineInstance: SocialEngine | null = null;

function getEngine(): SocialEngine {
  if (!engineInstance) {
    engineInstance = createSocialEngine({
      databaseAdapter: getSocialEngineAdapter(),
    });
  }
  return engineInstance;
}

/**
 * GET - Get engine status and available endpoints
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        engine: 'SocialEngine',
        version: '1.0.0',
        capabilities: [
          'measureCollaborationEffectiveness',
          'analyzeEngagement',
          'evaluateKnowledgeSharing',
          'matchMentorMentee',
          'assessGroupDynamics',
        ],
        endpoints: {
          effectiveness: '/api/sam/social-engine/effectiveness',
          engagement: '/api/sam/social-engine/engagement',
          knowledgeSharing: '/api/sam/social-engine/knowledge-sharing',
          mentorMatching: '/api/sam/social-engine/mentor-matching',
          dynamics: '/api/sam/social-engine/dynamics',
        },
      },
    });
  } catch (error) {
    logger.error('[SocialEngine] GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get engine status' } },
      { status: 500 }
    );
  }
}

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('measure-effectiveness'),
    groupId: z.string(),
  }),
  z.object({
    action: z.literal('analyze-engagement'),
    communityId: z.string(),
  }),
  z.object({
    action: z.literal('assess-dynamics'),
    groupId: z.string(),
  }),
]);

/**
 * POST - Execute engine actions
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const engine = getEngine();
    const { action } = parsed.data;

    switch (action) {
      case 'measure-effectiveness': {
        // We need to fetch the group data
        const { db } = await import('@/lib/db');
        const group = await db.group.findUnique({
          where: { id: parsed.data.groupId },
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        });

        if (!group) {
          return NextResponse.json(
            { success: false, error: { message: 'Group not found' } },
            { status: 404 }
          );
        }

        const socialGroup = {
          id: group.id,
          name: group.name,
          purpose: group.description || 'Learning group',
          createdAt: group.createdAt,
          activityLevel: group.members.length * 2,
          collaborationScore: 0.7,
          members: group.members.map(m => ({
            userId: m.userId,
            role: m.role === 'ADMIN' ? 'leader' as const : 'contributor' as const,
            joinedAt: m.joinedAt,
            contributionScore: 0.5,
            engagementLevel: 0.6,
            helpfulnessRating: 0.7,
          })),
        };

        const result = await engine.measureCollaborationEffectiveness(socialGroup);
        return NextResponse.json({ success: true, data: result });
      }

      case 'analyze-engagement': {
        const { db } = await import('@/lib/db');
        const group = await db.group.findUnique({
          where: { id: parsed.data.communityId },
          include: {
            members: true,
            discussions: { take: 100, orderBy: { createdAt: 'desc' } },
          },
        });

        if (!group) {
          return NextResponse.json(
            { success: false, error: { message: 'Community not found' } },
            { status: 404 }
          );
        }

        const activeMembers = group.members.filter(m => {
          const joinedDate = new Date(m.joinedAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return joinedDate > thirtyDaysAgo;
        }).length || Math.ceil(group.members.length * 0.6);

        const community = {
          id: group.id,
          name: group.name,
          memberCount: group.members.length,
          activeMembers: Math.max(1, activeMembers),
          topics: ['learning', 'collaboration'],
          activityMetrics: {
            postsPerDay: group.discussions.length / 30,
            commentsPerPost: 2.5,
            averageResponseTime: 120,
            engagementRate: 0.4,
            growthRate: 0.05,
          },
        };

        const result = await engine.analyzeEngagement(community);
        return NextResponse.json({ success: true, data: result });
      }

      case 'assess-dynamics': {
        const { db } = await import('@/lib/db');
        const group = await db.group.findUnique({
          where: { id: parsed.data.groupId },
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        });

        if (!group) {
          return NextResponse.json(
            { success: false, error: { message: 'Group not found' } },
            { status: 404 }
          );
        }

        const socialGroup = {
          id: group.id,
          name: group.name,
          purpose: group.description || 'Learning group',
          createdAt: group.createdAt,
          activityLevel: group.members.length * 2,
          collaborationScore: 0.7,
          members: group.members.map(m => ({
            userId: m.userId,
            role: m.role === 'ADMIN' ? 'leader' as const : 'contributor' as const,
            joinedAt: m.joinedAt,
            contributionScore: 0.5,
            engagementLevel: 0.6,
            helpfulnessRating: 0.7,
          })),
        };

        const result = await engine.assessGroupDynamics(socialGroup);
        return NextResponse.json({ success: true, data: result });
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('[SocialEngine] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to process action' } },
      { status: 500 }
    );
  }
}
