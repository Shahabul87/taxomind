import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import {
  createRouteHandlerFactory,
  createErrorResponse,
} from '@sam-ai/api';
import { getSAMConfig } from '@/lib/adapters/sam-config-factory';
import { createNextSAMHandler } from '@/lib/sam-api/next-handler';
import { checkAIAccess, recordAIUsage } from "@/lib/ai/subscription-enforcement";
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function normalizeRole(role?: string): 'teacher' | 'student' {
  if (!role) return 'student';
  const upperRole = role.toUpperCase();
  return ['ADMIN', 'TEACHER', 'INSTRUCTOR'].includes(upperRole) ? 'teacher' : 'student';
}

const factory = createRouteHandlerFactory({
  config: getSAMConfig(),
  authenticate: async () => {
    const session = await auth();
    if (!session?.user?.id) return null;

    return {
      id: session.user.id,
      role: normalizeRole(session.user.role),
      name: session.user.name ?? undefined,
    };
  },
  onError: (error) => {
    logger.error('[SAM-CHAT] Error:', error);
    return createErrorResponse(
      500,
      'INTERNAL_ERROR',
      'Failed to generate SAM response'
    );
  },
});

const chatHandler = factory.createHandler(factory.handlers.chat, { requireAuth: true });
const baseHandler = createNextSAMHandler(chatHandler);

// Wrapper to add subscription enforcement
export async function POST(request: NextRequest) {
  // First, check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check subscription tier and usage limits for chat
  const accessCheck = await checkAIAccess(session.user.id, "chat");
  if (!accessCheck.allowed) {
    return NextResponse.json(
      {
        error: accessCheck.reason || "AI access denied",
        upgradeRequired: accessCheck.upgradeRequired,
        suggestedTier: accessCheck.suggestedTier,
        remainingDaily: accessCheck.remainingDaily,
        remainingMonthly: accessCheck.remainingMonthly,
        maintenanceMode: accessCheck.maintenanceMode,
      },
      { status: accessCheck.maintenanceMode ? 503 : 403 }
    );
  }

  // Call the original handler
  const response = await baseHandler(request);

  // Record chat usage on successful response
  if (response.ok) {
    await recordAIUsage(session.user.id, "chat", 1);
  }

  return response;
}
