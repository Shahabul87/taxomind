/**
 * SAM AI - Peer Matching API
 *
 * Provides study buddy recommendations based on learning compatibility,
 * skill overlap, schedule alignment, and collaborative history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetPeerMatchesSchema = z.object({
  courseId: z.string().uuid().optional(),
  skillId: z.string().uuid().optional(),
  activityType: z.enum(['STUDY_GROUP', 'PEER_TUTORING', 'PROJECT_COLLABORATION', 'DISCUSSION', 'REVIEW_PARTNER']).optional(),
  limit: z.coerce.number().min(1).max(20).optional().default(10),
});

// ============================================================================
// TYPES
// ============================================================================

interface PeerCompatibility {
  overallScore: number;
  skillOverlap: number;
  levelCompatibility: number;
  activityAlignment: number;
  availabilityMatch: number;
}

interface PeerMatch {
  peerId: string;
  peerName: string;
  peerImage?: string;
  compatibility: PeerCompatibility;
  sharedSkills: Array<{ skillId: string; skillName: string; peerLevel: string; yourLevel: string }>;
  sharedCourses: Array<{ courseId: string; courseName: string }>;
  complementarySkills: Array<{ skillId: string; skillName: string; whoHas: 'peer' | 'you'; level: string }>;
  suggestedActivities: Array<{ type: string; reason: string }>;
  lastActive?: Date;
  totalCollaborations: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateSkillOverlap(
  yourSkills: Map<string, string>,
  peerSkills: Map<string, string>
): { overlap: number; shared: string[]; complementary: Array<{ skillId: string; whoHas: 'peer' | 'you' }> } {
  const shared: string[] = [];
  const complementary: Array<{ skillId: string; whoHas: 'peer' | 'you' }> = [];

  // Find shared skills
  const yourSkillIds = Array.from(yourSkills.keys());
  for (const skillId of yourSkillIds) {
    if (peerSkills.has(skillId)) {
      shared.push(skillId);
    } else {
      complementary.push({ skillId, whoHas: 'you' });
    }
  }

  // Find skills peer has that you don&apos;t
  const peerSkillIds = Array.from(peerSkills.keys());
  for (const skillId of peerSkillIds) {
    if (!yourSkills.has(skillId)) {
      complementary.push({ skillId, whoHas: 'peer' });
    }
  }

  const allSkillIds = [...yourSkillIds, ...peerSkillIds];
  const totalUnique = new Set(allSkillIds).size;
  const overlap = totalUnique > 0 ? (shared.length / totalUnique) * 100 : 0;

  return { overlap, shared, complementary };
}

const PROFICIENCY_LEVELS = ['NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'];

function calculateLevelCompatibility(yourLevel: string, peerLevel: string): number {
  const yourIdx = PROFICIENCY_LEVELS.indexOf(yourLevel);
  const peerIdx = PROFICIENCY_LEVELS.indexOf(peerLevel);

  if (yourIdx < 0 || peerIdx < 0) return 50;

  const diff = Math.abs(yourIdx - peerIdx);
  // Same level = 100%, 1 level diff = 90%, 2 levels = 70%, etc.
  return Math.max(0, 100 - diff * 15);
}

function suggestActivities(
  compatibility: PeerCompatibility,
  sharedSkillCount: number,
  complementaryCount: number
): Array<{ type: string; reason: string }> {
  const suggestions: Array<{ type: string; reason: string }> = [];

  if (sharedSkillCount >= 2 && compatibility.levelCompatibility >= 80) {
    suggestions.push({
      type: 'STUDY_GROUP',
      reason: 'You share multiple skills at similar levels - perfect for group study!',
    });
  }

  if (compatibility.levelCompatibility < 70 && complementaryCount > 0) {
    suggestions.push({
      type: 'PEER_TUTORING',
      reason: 'Different skill levels create a great tutoring opportunity.',
    });
  }

  if (complementaryCount >= 3) {
    suggestions.push({
      type: 'PROJECT_COLLABORATION',
      reason: 'Your complementary skills would make a strong project team.',
    });
  }

  if (sharedSkillCount >= 1) {
    suggestions.push({
      type: 'REVIEW_PARTNER',
      reason: 'Share knowledge and quiz each other on common skills.',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'DISCUSSION',
      reason: 'Start with a discussion to discover learning synergies.',
    });
  }

  return suggestions.slice(0, 3);
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET - Get peer matching recommendations for user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = GetPeerMatchesSchema.parse({
      courseId: searchParams.get('courseId') || undefined,
      skillId: searchParams.get('skillId') || undefined,
      activityType: searchParams.get('activityType') || undefined,
      limit: searchParams.get('limit') || '10',
    });

    const skillBuildTrackStore = getStore('skillBuildTrack');
    const peerLearningStore = getStore('peerLearning');

    // Get current user&apos;s skill profiles
    const yourProfiles = await skillBuildTrackStore.getUserSkillProfiles(user.id);
    const yourSkills = new Map<string, string>(yourProfiles.map((p) => [p.skillId, p.proficiencyLevel]));

    // Get your active peer activities to find collaboration history
    const yourActivities = await peerLearningStore.getByUserId(user.id, 100);
    const collaboratedPeerIds = new Set<string>(yourActivities.flatMap((a) => a.peerIds));

    // Find potential peers based on course enrollment or skill overlap
    let potentialPeers: Array<{ id: string; name: string | null; image: string | null }> = [];

    if (validatedParams.courseId) {
      // Find peers in the same course
      const enrollments = await db.enrollment.findMany({
        where: {
          courseId: validatedParams.courseId,
          userId: { not: user.id },
        },
        include: {
          User: {
            select: { id: true, name: true, image: true },
          },
        },
        take: 50,
      });
      potentialPeers = enrollments.map((e) => ({
        id: e.User.id,
        name: e.User.name,
        image: e.User.image,
      }));
    } else {
      // Find peers with similar skills - check skill build profiles
      const skillProfiles = await db.skillBuildProfile.findMany({
        where: {
          userId: { not: user.id },
          skillId: { in: Array.from(yourSkills.keys()) },
        },
        select: {
          userId: true,
        },
        take: 100,
      });

      const uniquePeerIds = [...new Set(skillProfiles.map((p) => p.userId))];

      // Get user info for these peers
      const users = await db.user.findMany({
        where: { id: { in: uniquePeerIds } },
        select: { id: true, name: true, image: true },
        take: 50,
      });

      potentialPeers = users;
    }

    // Calculate compatibility for each potential peer
    const peerMatches: PeerMatch[] = await Promise.all(
      potentialPeers.slice(0, 30).map(async (peer) => {
        // Get peer&apos;s skill profiles
        const peerProfiles = await skillBuildTrackStore.getUserSkillProfiles(peer.id);
        const peerSkills = new Map<string, string>(peerProfiles.map((p) => [p.skillId, p.proficiencyLevel]));

        // Calculate skill overlap and complementary skills
        const { overlap, shared, complementary } = calculateSkillOverlap(yourSkills, peerSkills);

        // Calculate level compatibility for shared skills
        let totalLevelCompat = 0;
        const sharedSkillDetails: Array<{
          skillId: string;
          skillName: string;
          peerLevel: string;
          yourLevel: string;
        }> = [];

        for (const skillId of shared) {
          const yourLevel = yourSkills.get(skillId)!;
          const peerLevel = peerSkills.get(skillId)!;
          totalLevelCompat += calculateLevelCompatibility(yourLevel, peerLevel);

          const skillProfile = yourProfiles.find((p) => p.skillId === skillId);
          sharedSkillDetails.push({
            skillId,
            skillName: skillProfile?.skill?.name ?? skillId,
            peerLevel,
            yourLevel,
          });
        }

        const levelCompatibility = shared.length > 0 ? totalLevelCompat / shared.length : 50;

        // Build complementary skill details
        const complementarySkillDetails: Array<{
          skillId: string;
          skillName: string;
          whoHas: 'peer' | 'you';
          level: string;
        }> = complementary.slice(0, 5).map((c) => {
          const profile =
            c.whoHas === 'you'
              ? yourProfiles.find((p) => p.skillId === c.skillId)
              : peerProfiles.find((p) => p.skillId === c.skillId);
          return {
            skillId: c.skillId,
            skillName: profile?.skill?.name ?? c.skillId,
            whoHas: c.whoHas,
            level: profile?.proficiencyLevel ?? 'NOVICE',
          };
        });

        // Get shared courses
        const yourEnrollments = await db.enrollment.findMany({
          where: { userId: user.id },
          select: { courseId: true, Course: { select: { title: true } } },
        });
        const peerEnrollments = await db.enrollment.findMany({
          where: { userId: peer.id },
          select: { courseId: true },
        });

        const peerCourseIds = new Set(peerEnrollments.map((e) => e.courseId));
        const sharedCourses = yourEnrollments
          .filter((e) => peerCourseIds.has(e.courseId))
          .map((e) => ({ courseId: e.courseId, courseName: e.Course.title }));

        // Calculate activity alignment (prefer peers with history)
        const hasCollaborated = collaboratedPeerIds.has(peer.id);
        const activityAlignment = hasCollaborated ? 100 : 50;

        // Calculate total collaborations
        const totalCollaborations = yourActivities.filter((a) => a.peerIds.includes(peer.id)).length;

        // Build compatibility scores
        const compatibility: PeerCompatibility = {
          overallScore: Math.round((overlap + levelCompatibility + activityAlignment) / 3),
          skillOverlap: Math.round(overlap),
          levelCompatibility: Math.round(levelCompatibility),
          activityAlignment,
          availabilityMatch: 50, // Default - would need schedule data
        };

        // Suggest activities
        const suggestedActivities = suggestActivities(
          compatibility,
          shared.length,
          complementary.length
        );

        return {
          peerId: peer.id,
          peerName: peer.name ?? 'Anonymous Learner',
          peerImage: peer.image ?? undefined,
          compatibility,
          sharedSkills: sharedSkillDetails,
          sharedCourses,
          complementarySkills: complementarySkillDetails,
          suggestedActivities,
          totalCollaborations,
        };
      })
    );

    // Sort by overall compatibility and limit
    const sortedMatches = peerMatches
      .sort((a, b) => b.compatibility.overallScore - a.compatibility.overallScore)
      .slice(0, validatedParams.limit);

    // Filter by activity type if specified
    const filteredMatches = validatedParams.activityType
      ? sortedMatches.filter((m) =>
          m.suggestedActivities.some((a) => a.type === validatedParams.activityType)
        )
      : sortedMatches;

    // Calculate aggregate stats
    const avgCompatibility =
      filteredMatches.length > 0
        ? filteredMatches.reduce((sum, m) => sum + m.compatibility.overallScore, 0) /
          filteredMatches.length
        : 0;

    const topMatchTypes = filteredMatches.reduce(
      (acc, m) => {
        for (const activity of m.suggestedActivities) {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalMatches: filteredMatches.length,
          avgCompatibility: Math.round(avgCompatibility),
          yourSkillCount: yourSkills.size,
          topMatchTypes,
        },
        matches: filteredMatches,
        activeActivities: yourActivities.filter((a) => ['DRAFT', 'SCHEDULED', 'ACTIVE'].includes(a.status)).length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[PEER MATCHING] Get error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get peer matches' } },
      { status: 500 }
    );
  }
}
