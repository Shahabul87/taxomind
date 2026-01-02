import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createPrismaPlanStore } from '@/lib/sam/stores';
import { type PlanStatus, type PlanSchedule } from '@sam-ai/agentic';

// Initialize the Plan Store
const planStore = createPrismaPlanStore();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Use lowercase enum values to match the agentic package
const UpdatePlanSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'failed', 'cancelled']).optional(),
  targetDate: z.string().datetime().optional().nullable(),
  schedule: z.record(z.unknown()).optional(),
});

interface RouteContext {
  params: Promise<{ planId: string }>;
}

// ============================================================================
// GET - Get a specific plan
// ============================================================================

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await context.params;

    // Use the PlanStore from @sam-ai/agentic package
    const plan = await planStore.get(planId);

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Note: SAMLearningGoal model doesn't exist in the schema yet
    // Goal data would come from the goal store instead
    const goal = null;

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        goal,
        // Empty steps array since we don't persist steps separately yet
        steps: plan.steps ?? [],
      },
    });
  } catch (error) {
    logger.error('Error fetching execution plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution plan' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update a plan
// ============================================================================

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await context.params;
    const body = await req.json();
    const validated = UpdatePlanSchema.parse(body);

    // Verify ownership using PlanStore
    const existing = await planStore.get(planId);

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Build update data
    const updateData: {
      status?: PlanStatus;
      targetDate?: Date;
      schedule?: PlanSchedule;
      completedAt?: Date;
      overallProgress?: number;
    } = {};

    if (validated.status !== undefined) {
      updateData.status = validated.status as PlanStatus;
      if (validated.status === 'completed') {
        updateData.completedAt = new Date();
        updateData.overallProgress = 100;
      }
    }

    if (validated.targetDate !== undefined) {
      updateData.targetDate = validated.targetDate ? new Date(validated.targetDate) : undefined;
    }

    if (validated.schedule !== undefined) {
      updateData.schedule = validated.schedule as unknown as PlanSchedule;
    }

    // Use PlanStore to update
    const plan = await planStore.update(planId, updateData);

    logger.info(`Updated execution plan: ${planId}`);

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        // Empty steps array since we don't persist steps separately yet
        steps: plan.steps ?? [],
      },
    });
  } catch (error) {
    logger.error('Error updating execution plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update execution plan' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete a plan
// ============================================================================

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await context.params;

    // Verify ownership using PlanStore
    const existing = await planStore.get(planId);

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Use PlanStore to delete
    await planStore.delete(planId);

    logger.info(`Deleted execution plan: ${planId}`);

    return NextResponse.json({
      success: true,
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting execution plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete execution plan' },
      { status: 500 }
    );
  }
}
