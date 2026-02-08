/**
 * AI Route Helper
 *
 * Factory function that wraps API route handlers with authentication
 * and AI client injection. Ensures every AI call has userId + capability
 * baked in — impossible to forget.
 *
 * Usage:
 *   export const POST = createAIRoute({ capability: 'chat' }, async (ctx, ai) => {
 *     const body = await ctx.request.json();
 *     const result = await ai.chat({
 *       systemPrompt: '...',
 *       messages: [{ role: 'user', content: body.message }],
 *     });
 *     return NextResponse.json({ content: result.content });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getCombinedSession } from '@/lib/auth/combined-session';
import {
  aiClient,
  type AIChatOptions,
  type AIChatResponse,
  AIAccessDeniedError,
} from './enterprise-client';
import type { AIChatStreamChunk } from '@sam-ai/core';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface AIRouteContext {
  /** Authenticated user ID (always present) */
  userId: string;
  /** User display name */
  userName: string | null;
  /** User email */
  userEmail: string | null;
  /** Whether the current session is an admin */
  isAdmin: boolean;
  /** The original NextRequest */
  request: NextRequest;
}

export interface AIRouteAI {
  /** Send a chat request with userId + capability pre-filled */
  chat(options: Omit<AIChatOptions, 'userId' | 'capability'>): Promise<AIChatResponse>;
  /** Stream a chat response with userId + capability pre-filled */
  stream(options: Omit<AIChatOptions, 'userId' | 'capability'>): AsyncGenerator<AIChatStreamChunk>;
}

export interface AIRouteConfig {
  /** AI capability for this route (determines provider resolution + rate limiting) */
  capability: 'chat' | 'course' | 'analysis' | 'code' | 'skill-roadmap';
  /** Use getCombinedSession() instead of currentUser() for admin+user auth */
  combinedAuth?: boolean;
}

type AIRouteHandler = (ctx: AIRouteContext, ai: AIRouteAI) => Promise<NextResponse>;

// ============================================================================
// STANDALONE ERROR HANDLER
// ============================================================================

/**
 * Check if an error is an AIAccessDeniedError and return a proper NextResponse.
 * Returns null if the error is NOT an AIAccessDeniedError (caller should handle it).
 *
 * Usage in catch blocks:
 *   catch (error) {
 *     const accessResponse = handleAIAccessError(error);
 *     if (accessResponse) return accessResponse;
 *     // ... handle other errors
 *   }
 */
export function handleAIAccessError(error: unknown): NextResponse | null {
  if (error instanceof AIAccessDeniedError) {
    const enforcement = error.enforcement;
    return NextResponse.json(
      {
        success: false,
        error: {
          message: enforcement.reason ?? 'AI access denied',
          code: 'AI_ACCESS_DENIED',
        },
        upgradeRequired: enforcement.upgradeRequired,
        suggestedTier: enforcement.suggestedTier,
        remainingDaily: enforcement.remainingDaily,
        remainingMonthly: enforcement.remainingMonthly,
      },
      { status: enforcement.maintenanceMode ? 503 : 429 },
    );
  }
  return null;
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create an AI route handler with authentication and AI client injection.
 *
 * The returned handler:
 * 1. Authenticates the user (via currentUser or getCombinedSession)
 * 2. Provides an `ai` object with `chat()` and `stream()` pre-filled with userId + capability
 * 3. Handles AIAccessDeniedError with proper HTTP status codes
 */
export function createAIRoute(
  config: AIRouteConfig,
  handler: AIRouteHandler,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Authenticate
      let userId: string | null = null;
      let userName: string | null = null;
      let userEmail: string | null = null;
      let isAdmin = false;

      if (config.combinedAuth) {
        const session = await getCombinedSession();
        userId = session.userId;
        userName = session.name;
        userEmail = session.email;
        isAdmin = session.isAdmin;
      } else {
        const user = await currentUser();
        if (user) {
          userId = user.id;
          userName = user.name ?? null;
          userEmail = user.email ?? null;
        }
      }

      if (!userId) {
        return NextResponse.json(
          { success: false, error: { message: 'Unauthorized' } },
          { status: 401 },
        );
      }

      // Build AI helper with userId + capability baked in
      const ai: AIRouteAI = {
        chat(options) {
          return aiClient.chat({
            ...options,
            userId: userId as string,
            capability: config.capability,
          });
        },
        stream(options) {
          return aiClient.stream({
            ...options,
            userId: userId as string,
            capability: config.capability,
          });
        },
      };

      const ctx: AIRouteContext = {
        userId,
        userName,
        userEmail,
        isAdmin,
        request,
      };

      return await handler(ctx, ai);
    } catch (error) {
      // Handle AIAccessDeniedError with proper HTTP status
      if (error instanceof AIAccessDeniedError) {
        const enforcement = error.enforcement;
        return NextResponse.json(
          {
            success: false,
            error: {
              message: enforcement.reason ?? 'AI access denied',
              code: 'AI_ACCESS_DENIED',
            },
            upgradeRequired: enforcement.upgradeRequired,
            suggestedTier: enforcement.suggestedTier,
            remainingDaily: enforcement.remainingDaily,
            remainingMonthly: enforcement.remainingMonthly,
          },
          { status: enforcement.maintenanceMode ? 503 : 429 },
        );
      }

      logger.error('[AIRoute] Unhandled error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        { success: false, error: { message: 'Internal server error' } },
        { status: 500 },
      );
    }
  };
}
