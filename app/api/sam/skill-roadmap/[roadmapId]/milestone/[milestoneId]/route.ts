/**
 * Milestone Status Update API
 *
 * PATCH /api/sam/skill-roadmap/[roadmapId]/milestone/[milestoneId]
 * Updates milestone status with validation of state transitions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import type { SkillBuildMilestoneStatus } from '@prisma/client';

const UpdateMilestoneSchema = z.object({
  status: z.enum(['AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
  actualHours: z.number().min(0).optional(),
});

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  LOCKED: ['AVAILABLE'],
  AVAILABLE: ['IN_PROGRESS', 'SKIPPED'],
  IN_PROGRESS: ['COMPLETED', 'SKIPPED'],
  COMPLETED: [],
  SKIPPED: ['AVAILABLE'],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roadmapId: string; milestoneId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roadmapId, milestoneId } = await params;
    const body = await request.json();
    const validated = UpdateMilestoneSchema.parse(body);

    // Verify ownership
    const roadmap = await db.skillBuildRoadmap.findFirst({
      where: { id: roadmapId, userId: session.user.id },
      include: {
        milestones: { orderBy: { order: 'asc' } },
      },
    });

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    const milestone = roadmap.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[milestone.status] ?? [];
    if (!allowedTransitions.includes(validated.status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${milestone.status} to ${validated.status}`,
          allowedTransitions,
        },
        { status: 400 }
      );
    }

    // Use transaction for milestone update + cascading changes
    const result = await db.$transaction(async (tx) => {
      // Update the milestone
      const updated = await tx.skillBuildRoadmapMilestone.update({
        where: { id: milestoneId },
        data: {
          status: validated.status as SkillBuildMilestoneStatus,
          actualHours: validated.actualHours ?? milestone.actualHours,
          completedAt: validated.status === 'COMPLETED' ? new Date() : milestone.completedAt,
        },
      });

      // If completed, unlock the next milestone
      if (validated.status === 'COMPLETED') {
        const nextMilestone = roadmap.milestones.find(
          m => m.order === milestone.order + 1 && m.status === 'LOCKED'
        );

        if (nextMilestone) {
          await tx.skillBuildRoadmapMilestone.update({
            where: { id: nextMilestone.id },
            data: { status: 'AVAILABLE' },
          });
        }

        // Update roadmap completion percentage
        const completedCount = roadmap.milestones.filter(
          m => m.status === 'COMPLETED' || m.id === milestoneId
        ).length;
        const completionPercentage = Math.round(
          (completedCount / roadmap.milestones.length) * 100
        );

        const isFullyComplete = completedCount === roadmap.milestones.length;

        await tx.skillBuildRoadmap.update({
          where: { id: roadmapId },
          data: {
            completionPercentage,
            status: isFullyComplete ? 'COMPLETED' : roadmap.status,
            completedAt: isFullyComplete ? new Date() : null,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[SkillRoadmap] Milestone update error:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}
