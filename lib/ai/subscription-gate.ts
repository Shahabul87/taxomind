/**
 * Unified Subscription Gate Middleware
 *
 * Single entry point for route-level subscription enforcement.
 * Replaces the old `lib/premium/sam-access.ts` binary premium check
 * with the 5-tier system from `subscription-enforcement.ts`.
 *
 * Categories:
 *   - generation:       STARTER+ (AI content creation)
 *   - analysis:         STARTER+ (enrolled users bypass tier for their courses)
 *   - chat:             FREE with tier-based limits
 *   - premium-feature:  PROFESSIONAL+ (learning paths, advanced analytics)
 *   - tool-execution:   STARTER for AI tools, FREE for standalone
 *   - read-only:        no gate (conversation history, tool listings)
 *
 * Does NOT record usage — that happens inside enterprise-client after the
 * actual AI call succeeds.
 */

import { NextResponse } from 'next/server';
import { SubscriptionTier } from '@prisma/client';
import { db } from '@/lib/db';
import { getCurrentAdminSession } from '@/lib/admin/check-admin';
import { checkAIAccess, type AIFeatureType } from './subscription-enforcement';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubscriptionCategory =
  | 'generation'        // AI content creation (courses, exams, content)
  | 'analysis'          // AI analysis (Bloom's, multimedia, depth)
  | 'chat'              // SAM chat, tutoring, Q&A
  | 'premium-feature'   // Learning paths, advanced analytics, market analysis
  | 'tool-execution'    // Tool system access
  | 'read-only';        // Conversation history, tool listings

export interface SubscriptionGateOptions {
  category: SubscriptionCategory;
  /** For enrollment bypass on analysis routes */
  courseId?: string;
  /** For tool execution distinction (AI-powered vs standalone) */
  isAIPowered?: boolean;
}

export interface SubscriptionGateResult {
  allowed: boolean;
  response?: NextResponse;
  tier?: SubscriptionTier;
}

// ---------------------------------------------------------------------------
// Tier requirements per category
// ---------------------------------------------------------------------------

const MINIMUM_TIER: Record<SubscriptionCategory, SubscriptionTier | null> = {
  'read-only':        null,         // No gate at all
  'chat':             'FREE',       // Everyone can chat (with limits)
  'generation':       'STARTER',    // Content creation needs STARTER+
  'analysis':         'STARTER',    // Analysis needs STARTER+ (enrollment bypass possible)
  'tool-execution':   'STARTER',    // AI tools need STARTER+ (standalone tools bypass)
  'premium-feature':  'PROFESSIONAL', // Premium features need PRO+
};

/** Ordered list for tier comparison */
const TIER_ORDER: SubscriptionTier[] = [
  'FREE',
  'STARTER',
  'PROFESSIONAL',
  'ENTERPRISE',
  'CUSTOM',
];

function tierIndex(tier: SubscriptionTier): number {
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? 0 : idx;
}

function meetsMinimumTier(userTier: SubscriptionTier, required: SubscriptionTier): boolean {
  return tierIndex(userTier) >= tierIndex(required);
}

// ---------------------------------------------------------------------------
// Map SubscriptionCategory to AIFeatureType for usage-limit delegation
// ---------------------------------------------------------------------------

function categoryToFeatureType(category: SubscriptionCategory): AIFeatureType {
  switch (category) {
    case 'generation':       return 'course';
    case 'analysis':         return 'analysis';
    case 'chat':             return 'chat';
    case 'premium-feature':  return 'analysis';
    case 'tool-execution':   return 'other';
    case 'read-only':        return 'other';
  }
}

// ---------------------------------------------------------------------------
// Enrollment check
// ---------------------------------------------------------------------------

async function isEnrolledInCourse(userId: string, courseId: string): Promise<boolean> {
  const enrollment = await db.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
    select: { id: true },
  });
  return !!enrollment;
}

// ---------------------------------------------------------------------------
// Error response builders
// ---------------------------------------------------------------------------

function buildForbiddenResponse(
  reason: string,
  suggestedTier?: SubscriptionTier,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: reason,
      code: 'SUBSCRIPTION_REQUIRED',
      upgradeRequired: true,
      suggestedTier,
    },
    { status: 403 },
  );
}

function buildUsageLimitResponse(
  reason: string,
  remainingDaily?: number,
  remainingMonthly?: number,
  suggestedTier?: SubscriptionTier,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: reason,
      code: 'USAGE_LIMIT_EXCEEDED',
      upgradeRequired: !!suggestedTier,
      suggestedTier,
      remainingDaily,
      remainingMonthly,
    },
    { status: 429 },
  );
}

// ---------------------------------------------------------------------------
// Main gate function
// ---------------------------------------------------------------------------

/**
 * Check subscription access before processing an AI route.
 *
 * Call this early in the route handler, after auth but before heavy processing.
 * Returns `{ allowed: true }` if the user may proceed, or
 * `{ allowed: false, response }` with a ready-to-return NextResponse.
 */
export async function withSubscriptionGate(
  userId: string,
  options: SubscriptionGateOptions,
): Promise<SubscriptionGateResult> {
  const { category, courseId, isAIPowered } = options;

  try {
    // 1. Read-only — always allowed
    if (category === 'read-only') {
      return { allowed: true };
    }

    // 2. Standalone (non-AI) tools — always allowed for authenticated users
    if (category === 'tool-execution' && isAIPowered === false) {
      return { allowed: true };
    }

    // 3. Admin bypass (separate auth system)
    const adminStatus = await getCurrentAdminSession();
    if (adminStatus.isAdmin) {
      logger.debug('[SubscriptionGate] Admin bypass', {
        adminId: adminStatus.adminId,
        category,
      });
      return { allowed: true };
    }

    // 4. Fetch user subscription data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        hasAIAccess: true,
        subscriptionTier: true,
        isPremium: true,
        premiumExpiresAt: true,
      },
    });

    if (!user) {
      return {
        allowed: false,
        response: NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 },
        ),
      };
    }

    // 5. Admin-granted AI access bypass
    if (user.hasAIAccess) {
      logger.debug('[SubscriptionGate] hasAIAccess bypass', { userId, category });
      return { allowed: true, tier: user.subscriptionTier };
    }

    // 6. Handle expired premium — treat as FREE
    let effectiveTier = user.subscriptionTier;
    if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      effectiveTier = 'FREE';
      // Background update (non-blocking)
      db.user.update({
        where: { id: userId },
        data: { subscriptionTier: 'FREE', isPremium: false },
      }).catch(err => logger.error('[SubscriptionGate] Failed to update expired subscription', err));
    }

    // 7. Analysis + courseId → enrollment bypass (skip tier check, still check usage)
    if (category === 'analysis' && courseId) {
      const enrolled = await isEnrolledInCourse(userId, courseId);
      if (enrolled) {
        logger.debug('[SubscriptionGate] Enrollment bypass for analysis', {
          userId,
          courseId,
        });
        // Still delegate to checkAIAccess for usage limits
        const usageCheck = await checkAIAccess(userId, categoryToFeatureType(category));
        if (!usageCheck.allowed) {
          return {
            allowed: false,
            tier: effectiveTier,
            response: buildUsageLimitResponse(
              usageCheck.reason ?? 'Usage limit exceeded',
              usageCheck.remainingDaily,
              usageCheck.remainingMonthly,
              usageCheck.suggestedTier,
            ),
          };
        }
        return { allowed: true, tier: effectiveTier };
      }
    }

    // 8. Check minimum tier requirement
    const minTier = MINIMUM_TIER[category];
    if (minTier && !meetsMinimumTier(effectiveTier, minTier)) {
      const categoryLabel = getCategoryLabel(category);
      return {
        allowed: false,
        tier: effectiveTier,
        response: buildForbiddenResponse(
          `${categoryLabel} requires a ${minTier} subscription or higher. Current tier: ${effectiveTier}.`,
          minTier,
        ),
      };
    }

    // 9. Delegate to checkAIAccess for usage limits (daily/monthly)
    const featureType = categoryToFeatureType(category);
    const usageCheck = await checkAIAccess(userId, featureType);

    if (!usageCheck.allowed) {
      return {
        allowed: false,
        tier: effectiveTier,
        response: buildUsageLimitResponse(
          usageCheck.reason ?? 'Usage limit exceeded',
          usageCheck.remainingDaily,
          usageCheck.remainingMonthly,
          usageCheck.suggestedTier,
        ),
      };
    }

    return { allowed: true, tier: effectiveTier };

  } catch (error) {
    logger.error('[SubscriptionGate] Error during check', {
      userId,
      category,
      error: error instanceof Error ? error.message : String(error),
    });
    // On error, allow the request (fail-open) — enterprise-client will also check
    return { allowed: true };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCategoryLabel(category: SubscriptionCategory): string {
  switch (category) {
    case 'generation':       return 'AI content generation';
    case 'analysis':         return 'AI analysis';
    case 'chat':             return 'AI chat';
    case 'premium-feature':  return 'This premium feature';
    case 'tool-execution':   return 'AI-powered tool execution';
    case 'read-only':        return 'Read access';
  }
}
