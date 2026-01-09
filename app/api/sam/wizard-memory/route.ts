/**
 * SAM Wizard Memory API Route
 * Provides persistent memory for course creation wizard and floating chatbot
 *
 * Uses existing SAMSessionContext model via PrismaSessionContextStore
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface WizardState {
  currentPage?: string;
  wizardData?: Record<string, unknown>;
  generatedStructure?: Record<string, unknown>;
  courseData?: Record<string, unknown>;
  completionStatus?: Record<string, unknown>;
  pageContexts?: Record<string, Record<string, unknown>>;
  conversations?: Array<{
    type: string;
    content: string;
    context?: string;
    page?: string;
    timestamp: string;
    suggestions?: string[];
    actionsTaken?: Record<string, unknown>;
  }>;
  wizardInteractions?: Array<{
    type?: unknown;
    step?: unknown;
    timestamp: string;
    [key: string]: unknown;
  }>;
  successfulGenerations?: number;
  sessionInfo?: {
    id: string;
    startTime: string;
    endTime?: string;
    active: boolean;
  };
}

// ============================================================================
// SCHEMAS
// ============================================================================

const PostRequestSchema = z.object({
  operation: z.enum([
    'updateCurrentPage',
    'saveWizardData',
    'saveGeneratedStructure',
    'addConversation',
    'updateCourseData',
    'updateCompletionStatus',
    'setContextForPage',
    'startSession',
    'endSession',
    'incrementSuccessfulGenerations',
    'addWizardInteraction',
  ]),
  data: z.record(z.unknown()),
  courseId: z.string().optional(),
});

const GetRequestSchema = z.object({
  key: z.enum([
    'currentPage',
    'wizardData',
    'generatedStructure',
    'courseData',
    'completionStatus',
    'contextForPage',
    'conversations',
    'relevantInteractions',
    'successfulGenerations',
    'currentSession',
    'wizardInteractions',
    'all',
  ]),
  page: z.string().optional(),
  context: z.string().optional(),
  limit: z.coerce.number().optional(),
  courseId: z.string().optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

async function getOrCreateWizardContext(
  userId: string,
  courseId?: string
): Promise<{ id: string; state: WizardState }> {
  // Try to find existing context
  const existing = await db.sAMSessionContext.findFirst({
    where: {
      userId,
      courseId: courseId ?? null,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (existing) {
    return {
      id: existing.id,
      state: (existing.currentState as WizardState) ?? {},
    };
  }

  // Create new context
  const created = await db.sAMSessionContext.create({
    data: {
      userId,
      courseId: courseId ?? null,
      currentState: {},
      preferences: {},
      insights: {},
    },
  });

  return {
    id: created.id,
    state: {},
  };
}

async function updateWizardState(
  contextId: string,
  updater: (state: WizardState) => WizardState
): Promise<WizardState> {
  const context = await db.sAMSessionContext.findUnique({
    where: { id: contextId },
  });

  if (!context) {
    throw new Error('Context not found');
  }

  const currentState = (context.currentState as WizardState) ?? {};
  const newState = updater(currentState);

  await db.sAMSessionContext.update({
    where: { id: contextId },
    data: {
      currentState: newState,
      lastActiveAt: new Date(),
    },
  });

  return newState;
}

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validation = GetRequestSchema.safeParse({
      key: searchParams.get('key'),
      page: searchParams.get('page'),
      context: searchParams.get('context'),
      limit: searchParams.get('limit'),
      courseId: searchParams.get('courseId'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { key, page, context, limit, courseId } = validation.data;
    const { state } = await getOrCreateWizardContext(session.user.id, courseId);

    let data: unknown = null;

    switch (key) {
      case 'currentPage':
        data = state.currentPage ?? null;
        break;

      case 'wizardData':
        data = state.wizardData ?? null;
        break;

      case 'generatedStructure':
        data = state.generatedStructure ?? null;
        break;

      case 'courseData':
        data = state.courseData ?? null;
        break;

      case 'completionStatus':
        data = state.completionStatus ?? null;
        break;

      case 'contextForPage':
        if (!page) {
          return NextResponse.json(
            { error: 'Page parameter required for contextForPage' },
            { status: 400 }
          );
        }
        data = state.pageContexts?.[page] ?? null;
        break;

      case 'conversations': {
        const conversations = state.conversations ?? [];
        data = limit ? conversations.slice(-limit) : conversations;
        break;
      }

      case 'relevantInteractions': {
        const conversations = state.conversations ?? [];
        const filtered = conversations.filter(
          (conv) => conv.context === context || conv.page === context
        );
        data = limit ? filtered.slice(-limit) : filtered;
        break;
      }

      case 'successfulGenerations':
        data = state.successfulGenerations ?? 0;
        break;

      case 'currentSession':
        data = state.sessionInfo ?? null;
        break;

      case 'wizardInteractions': {
        const interactions = state.wizardInteractions ?? [];
        data = limit ? interactions.slice(-limit) : interactions;
        break;
      }

      case 'all':
        data = state;
        break;

      default:
        return NextResponse.json({ error: 'Unknown key' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('[wizard-memory] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve memory' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = PostRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { operation, data, courseId } = validation.data;
    const { id: contextId } = await getOrCreateWizardContext(
      session.user.id,
      courseId
    );

    let result: unknown = null;

    switch (operation) {
      case 'updateCurrentPage': {
        const page = data.page as string;
        await updateWizardState(contextId, (state) => ({
          ...state,
          currentPage: page,
        }));
        result = { page };
        break;
      }

      case 'saveWizardData': {
        const wizardData = data.wizardData as Record<string, unknown>;
        await updateWizardState(contextId, (state) => ({
          ...state,
          wizardData: {
            ...(state.wizardData ?? {}),
            ...wizardData,
          },
        }));
        result = { saved: true };
        break;
      }

      case 'saveGeneratedStructure': {
        const structure = data.structure as Record<string, unknown>;
        await updateWizardState(contextId, (state) => ({
          ...state,
          generatedStructure: structure,
        }));
        result = { saved: true };
        break;
      }

      case 'addConversation': {
        const conversation = data.conversation as {
          type: string;
          content: string;
          context?: string;
          page?: string;
          suggestions?: string[];
          actionsTaken?: Record<string, unknown>;
        };
        await updateWizardState(contextId, (state) => {
          const conversations = state.conversations ?? [];
          conversations.push({
            ...conversation,
            timestamp: new Date().toISOString(),
          });
          return { ...state, conversations };
        });
        result = { added: true };
        break;
      }

      case 'updateCourseData': {
        const courseData = data.courseData as Record<string, unknown>;
        await updateWizardState(contextId, (state) => ({
          ...state,
          courseData,
        }));
        result = { updated: true };
        break;
      }

      case 'updateCompletionStatus': {
        const completionStatus = data.completionStatus as Record<string, unknown>;
        await updateWizardState(contextId, (state) => ({
          ...state,
          completionStatus,
        }));
        result = { updated: true };
        break;
      }

      case 'setContextForPage': {
        const page = data.page as string;
        const context = data.context as Record<string, unknown>;
        await updateWizardState(contextId, (state) => ({
          ...state,
          pageContexts: {
            ...(state.pageContexts ?? {}),
            [page]: context,
          },
        }));
        result = { set: true };
        break;
      }

      case 'startSession': {
        const sessionId = data.sessionId as string;
        await updateWizardState(contextId, (state) => ({
          ...state,
          sessionInfo: {
            id: sessionId,
            startTime: new Date().toISOString(),
            active: true,
          },
        }));
        result = { started: true, sessionId };
        break;
      }

      case 'endSession': {
        await updateWizardState(contextId, (state) => ({
          ...state,
          sessionInfo: state.sessionInfo
            ? {
                ...state.sessionInfo,
                endTime: new Date().toISOString(),
                active: false,
              }
            : undefined,
        }));
        result = { ended: true };
        break;
      }

      case 'incrementSuccessfulGenerations': {
        const newState = await updateWizardState(contextId, (state) => ({
          ...state,
          successfulGenerations: (state.successfulGenerations ?? 0) + 1,
        }));
        result = { count: newState.successfulGenerations };
        break;
      }

      case 'addWizardInteraction': {
        const interaction = data.interaction as Record<string, unknown>;
        await updateWizardState(contextId, (state) => {
          const interactions = state.wizardInteractions ?? [];
          interactions.push({
            ...interaction,
            timestamp: new Date().toISOString(),
          });
          return { ...state, wizardInteractions: interactions };
        });
        result = { added: true };
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Unknown operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('[wizard-memory] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update memory' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE HANDLER
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId') ?? undefined;

    const { id: contextId } = await getOrCreateWizardContext(
      session.user.id,
      courseId
    );

    // Reset to empty state
    await db.sAMSessionContext.update({
      where: { id: contextId },
      data: {
        currentState: {},
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: { cleared: true } });
  } catch (error) {
    logger.error('[wizard-memory] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to clear memory' },
      { status: 500 }
    );
  }
}
