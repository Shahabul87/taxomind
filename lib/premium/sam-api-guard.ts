/**
 * SAM API Guard
 *
 * @deprecated Use `withSubscriptionGate()` from `@/lib/ai/subscription-gate` instead.
 * This module wraps the deprecated `canAccessSamFeature` from `sam-access.ts`.
 * The new subscription gate provides 5-tier enforcement with admin-configurable limits.
 *
 * Middleware wrapper for SAM AI API routes to enforce premium access control.
 * Use this to wrap your SAM API handlers.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { canAccessSamFeature, incrementSamUsage, type SAMFeature } from "./sam-access";
import { logger } from "@/lib/logger";

export interface SAMGuardContext {
  userId: string;
  isPremium: boolean;
  remainingUsage: number | null;
}

type SAMApiHandler = (
  request: NextRequest,
  context: SAMGuardContext
) => Promise<NextResponse>;

/**
 * Create a guarded SAM API handler
 *
 * @param feature - The SAM feature being accessed
 * @param handler - The actual API handler function
 * @param options - Additional options
 *
 * @example
 * ```ts
 * // In your route.ts
 * export const POST = createSAMGuardedHandler(
 *   "course-creation",
 *   async (request, context) => {
 *     // Your handler logic here
 *     // context.userId, context.isPremium, context.remainingUsage available
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
export function createSAMGuardedHandler(
  feature: SAMFeature,
  handler: SAMApiHandler,
  options: {
    incrementUsage?: boolean; // Whether to increment usage after successful call
    allowUnauthenticated?: boolean; // Whether to allow unauthenticated access
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await currentUser();

      // Check authentication
      if (!user?.id) {
        if (options.allowUnauthenticated) {
          // Allow but with no premium features
          return handler(request, {
            userId: "anonymous",
            isPremium: false,
            remainingUsage: 0,
          });
        }

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Please log in to use SAM AI features",
            },
          },
          { status: 401 }
        );
      }

      // Check feature access
      const accessResult = await canAccessSamFeature(user.id, feature);

      if (!accessResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: accessResult.requiresUpgrade
                ? "PREMIUM_REQUIRED"
                : "LIMIT_REACHED",
              message: accessResult.reason,
              feature: accessResult.feature,
            },
            upgradeRequired: accessResult.requiresUpgrade,
            upgradeUrl: "/pricing",
          },
          { status: 403 }
        );
      }

      // Execute the handler
      const response = await handler(request, {
        userId: user.id,
        isPremium: accessResult.remainingFreeUsage === null,
        remainingUsage: accessResult.remainingFreeUsage,
      });

      // Increment usage counter for free tier users (after successful response)
      if (options.incrementUsage !== false && response.ok) {
        await incrementSamUsage(user.id);
      }

      return response;
    } catch (error) {
      logger.error("[SAM_API_GUARD]", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An error occurred processing your request",
          },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Simple function to check SAM access and return appropriate response
 * Use this for more control over the flow
 */
export async function checkSAMAccess(
  userId: string,
  feature: SAMFeature
): Promise<
  | { allowed: true; context: SAMGuardContext }
  | { allowed: false; response: NextResponse }
> {
  const accessResult = await canAccessSamFeature(userId, feature);

  if (!accessResult.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: accessResult.requiresUpgrade
              ? "PREMIUM_REQUIRED"
              : "LIMIT_REACHED",
            message: accessResult.reason,
            feature: accessResult.feature,
          },
          upgradeRequired: accessResult.requiresUpgrade,
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      ),
    };
  }

  return {
    allowed: true,
    context: {
      userId,
      isPremium: accessResult.remainingFreeUsage === null,
      remainingUsage: accessResult.remainingFreeUsage,
    },
  };
}

/**
 * Feature-specific guards for common use cases
 */
export const SAMGuards = {
  courseCreation: (handler: SAMApiHandler) =>
    createSAMGuardedHandler("course-creation", handler),

  contentGeneration: (handler: SAMApiHandler) =>
    createSAMGuardedHandler("content-generation", handler),

  quizGeneration: (handler: SAMApiHandler) =>
    createSAMGuardedHandler("quiz-generation", handler),

  examCreation: (handler: SAMApiHandler) =>
    createSAMGuardedHandler("exam-creation", handler),

  basicQA: (handler: SAMApiHandler) =>
    createSAMGuardedHandler("basic-qa", handler, { incrementUsage: true }),
};
