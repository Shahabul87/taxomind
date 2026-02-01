/**
 * Auth Stage
 *
 * Handles authentication, subscription access check, and rate limiting.
 * Returns early with an error Response when any check fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUserOrAdmin } from '@/lib/auth';
import { checkAIAccess } from '@/lib/ai/subscription-enforcement';
import { applyRateLimit, samMessagesLimiter } from '@/lib/sam/config/sam-rate-limiter';
import type { StageResult } from './types';

export interface AuthStageResult {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    isTeacher?: boolean;
    role?: string;
  };
  rateLimitHeaders: Record<string, string>;
}

export async function runAuthStage(
  request: NextRequest,
): Promise<StageResult<AuthStageResult>> {
  // 1. Authentication check - supports both regular users AND admin users
  const user = await currentUserOrAdmin();
  if (!user?.id) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to use SAM' },
        { status: 401 },
      ),
    };
  }

  // 2. Check subscription tier and usage limits for chat
  const accessCheck = await checkAIAccess(user.id, 'chat');
  if (!accessCheck.allowed) {
    return {
      response: NextResponse.json(
        {
          error: accessCheck.reason || 'AI access denied',
          upgradeRequired: accessCheck.upgradeRequired,
          suggestedTier: accessCheck.suggestedTier,
          remainingDaily: accessCheck.remainingDaily,
          remainingMonthly: accessCheck.remainingMonthly,
          maintenanceMode: accessCheck.maintenanceMode,
        },
        { status: accessCheck.maintenanceMode ? 503 : 403 },
      ),
    };
  }

  // 3. Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, samMessagesLimiter, user.id);
  if (!rateLimitResult.success) {
    return { response: rateLimitResult.response! };
  }

  return {
    ctx: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isTeacher: (user as { isTeacher?: boolean }).isTeacher,
        role: (user as { role?: string }).role,
      },
      rateLimitHeaders: rateLimitResult.headers ?? {},
    },
  };
}
