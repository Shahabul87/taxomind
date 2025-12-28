import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import {
  createRouteHandlerFactory,
  createErrorResponse,
} from '@sam-ai/api';
import { getSAMConfig } from '@/lib/adapters/sam-config-factory';
import { createNextSAMHandler } from '@/lib/sam-api/next-handler';

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

export const POST = createNextSAMHandler(chatHandler);
