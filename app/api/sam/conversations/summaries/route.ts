import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createMemoryEngine } from '@sam-ai/educational';
import type { MemoryDatabaseAdapter, MemorySAMConversation, MemorySAMLearningProfile } from '@sam-ai/educational';
import { getSAMConfig } from '@/lib/adapters';
import { applyRateLimit, samSummariesLimiter } from '@/lib/sam/config/sam-rate-limiter';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for query parameters
const querySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, {
    message: 'Limit must be between 1 and 100',
  }).optional(),
});

// Create memory-specific database adapter
function createMemoryDatabaseAdapter(): MemoryDatabaseAdapter {
  return {
    async getConversation(conversationId: string) {
      const conversation = await db.sAMConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!conversation) return null;

      return {
        id: conversation.id,
        messages: conversation.messages.map(msg => ({
          id: msg.id,
          messageType: msg.messageType,
          content: msg.content,
          createdAt: msg.createdAt,
          metadata: msg.metadata,
        })),
      };
    },

    async getConversations(
      userId: string,
      options?: { courseId?: string; chapterId?: string; limit?: number }
    ): Promise<MemorySAMConversation[]> {
      const conversations = await db.sAMConversation.findMany({
        where: {
          userId,
          ...(options?.courseId && { courseId: options.courseId }),
          ...(options?.chapterId && { chapterId: options.chapterId }),
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { startedAt: 'desc' },
        take: options?.limit || 20,
      });

      return conversations.map(conv => ({
        id: conv.id,
        userId: conv.userId,
        title: undefined, // SAMConversation doesn't have title field
        courseId: conv.courseId ?? undefined,
        chapterId: conv.chapterId ?? undefined,
        sectionId: conv.sectionId ?? undefined,
        createdAt: conv.startedAt, // Use startedAt as createdAt
        updatedAt: conv.startedAt, // Use startedAt as updatedAt (no updatedAt field)
        startedAt: conv.startedAt,
        messages: conv.messages.map(msg => ({
          id: msg.id,
          conversationId: msg.conversationId,
          content: msg.content,
          createdAt: msg.createdAt,
          role: msg.messageType,
        })),
      }));
    },

    async createConversation(
      userId: string,
      data?: {
        title?: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
      }
    ): Promise<string> {
      // Note: SAMConversation requires sessionId, not title
      const { v4: uuidv4 } = await import('uuid');
      const conversation = await db.sAMConversation.create({
        data: {
          userId,
          sessionId: uuidv4(),
          courseId: data?.courseId,
          chapterId: data?.chapterId,
          sectionId: data?.sectionId,
          startedAt: new Date(),
        },
      });
      return conversation.id;
    },

    async addMessage(
      conversationId: string,
      data: {
        role: string;
        content: string;
        metadata?: Record<string, unknown>;
      }
    ): Promise<void> {
      await db.sAMMessage.create({
        data: {
          conversationId,
          messageType: data.role as 'USER' | 'SAM' | 'SYSTEM',
          content: data.content,
          metadata: data.metadata ?? {},
        },
      });
    },

    async getLearningProfile(
      userId: string,
      _courseId?: string
    ): Promise<MemorySAMLearningProfile | null> {
      // SAMLearningProfile: id, userId, learningStyle, preferredTone, teachingMethod, responseStyle, adaptationHistory, preferences, lastUpdated
      const profile = await db.sAMLearningProfile.findUnique({
        where: { userId },
      });

      if (!profile) return null;

      const preferences = profile.preferences as Record<string, unknown> | null;

      return {
        userId: profile.userId,
        courseId: undefined, // SAMLearningProfile doesn't have courseId
        learningStyle: profile.learningStyle.toLowerCase() as MemorySAMLearningProfile['learningStyle'],
        preferredDifficulty: (preferences?.difficulty as MemorySAMLearningProfile['preferredDifficulty']) ?? undefined,
        strengths: (preferences?.strengths as string[]) ?? undefined,
        weaknesses: (preferences?.weaknesses as string[]) ?? undefined,
        interests: (preferences?.interests as string[]) ?? undefined,
        goals: (preferences?.goals as string[]) ?? undefined,
        progress: (preferences?.progress as Record<string, number>) ?? undefined,
        interactionPreferences: preferences?.interactionPreferences as MemorySAMLearningProfile['interactionPreferences'],
        adaptiveSettings: preferences?.adaptiveSettings as Record<string, unknown> ?? undefined,
        preferredTone: profile.preferredTone.toLowerCase(),
        preferences: {
          formats: (preferences?.formats as string[]) ?? undefined,
          difficulty: (preferences?.difficulty as string) ?? undefined,
        },
      };
    },

    async updateLearningProfile(
      userId: string,
      data: Partial<MemorySAMLearningProfile>
    ): Promise<void> {
      // SAMLearningProfile: learningStyle is SAMLearningStyle enum, no adaptiveSettings field
      const existing = await db.sAMLearningProfile.findUnique({
        where: { userId },
      });

      if (existing) {
        await db.sAMLearningProfile.update({
          where: { userId },
          data: {
            preferences: {
              ...(existing.preferences as Record<string, unknown> ?? {}),
              ...data.preferences,
              adaptiveSettings: data.adaptiveSettings,
            },
            lastUpdated: new Date(),
          },
        });
      } else {
        await db.sAMLearningProfile.create({
          data: {
            userId,
            learningStyle: 'MIXED', // Default enum value
            preferredTone: 'ENCOURAGING',
            teachingMethod: 'SOCRATIC',
            responseStyle: 'DETAILED',
            preferences: {
              ...data.preferences,
              adaptiveSettings: data.adaptiveSettings,
            },
          },
        });
      }
    },

    async getInteractions(
      userId: string,
      options?: { limit?: number }
    ): Promise<Array<{ id: string; createdAt: Date; context?: unknown }>> {
      const interactions = await db.sAMInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        select: {
          id: true,
          createdAt: true,
          context: true,
        },
      });

      return interactions.map(i => ({
        id: i.id,
        createdAt: i.createdAt,
        context: i.context,
      }));
    },

    async getCourses(userId: string) {
      const courses = await db.course.findMany({
        where: {
          userId,
          isPublished: false,
        },
        select: {
          id: true,
          title: true,
          isPublished: true,
          chapters: {
            select: { id: true, isPublished: true },
          },
        },
        take: 5,
      });

      return courses;
    },

    async createInteraction(data: {
      userId: string;
      interactionType: string;
      context?: Record<string, unknown>;
      courseId?: string;
      chapterId?: string;
      sectionId?: string;
    }): Promise<void> {
      // Map string to valid SAMInteractionType enum value
      type SAMInteractionType = 'NAVIGATION' | 'FORM_POPULATE' | 'FORM_SUBMIT' | 'FORM_VALIDATE' | 'CONTENT_GENERATE' | 'CHAT_MESSAGE' | 'QUICK_ACTION' | 'ANALYTICS_VIEW' | 'GAMIFICATION_ACTION' | 'LEARNING_ASSISTANCE';
      const validType: SAMInteractionType = data.interactionType === 'LEARNING_ASSISTANCE'
        ? 'LEARNING_ASSISTANCE'
        : 'CHAT_MESSAGE';

      await db.sAMInteraction.create({
        data: {
          userId: data.userId,
          interactionType: validType,
          context: data.context ?? {},
          courseId: data.courseId,
          chapterId: data.chapterId,
          sectionId: data.sectionId,
        },
      });
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, samSummariesLimiter, session.user.id);

    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const rawParams = {
      courseId: searchParams.get('courseId') || undefined,
      chapterId: searchParams.get('chapterId') || undefined,
      limit: searchParams.get('limit') || '20',
    };

    const validationResult = querySchema.safeParse(rawParams);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      }, { status: 400 });
    }

    const { courseId, chapterId, limit = 20 } = validationResult.data;

    // Additional authorization check for course access
    if (courseId) {
      // Verify user has access to the course
      const course = await db.course.findFirst({
        where: {
          id: courseId,
          OR: [
            { userId: session.user.id }, // Course creator
            {
              Enrollment: {
                some: { userId: session.user.id }
              }
            }, // Enrolled student
            {
              Purchase: {
                some: { userId: session.user.id }
              }
            }, // Course purchaser
          ],
        },
        select: { id: true },
      });

      if (!course) {
        return NextResponse.json({
          error: 'Access denied to course',
          code: 'FORBIDDEN',
        }, { status: 403 });
      }
    }

    // Initialize memory engine with validated parameters using portable engine
    const memoryEngine = createMemoryEngine(
      {
        userId: session.user.id,
        courseId,
        chapterId,
        sessionId: uuidv4(),
      },
      {
        samConfig: getSAMConfig(),
        database: createMemoryDatabaseAdapter() as unknown as undefined,
      }
    );

    // Fetch conversation summaries with error handling
    const summaries = await memoryEngine.getConversationSummaries(limit);

    // Add metadata to response
    const response = NextResponse.json({
      success: true,
      data: summaries,
      metadata: {
        total: summaries.length,
        limit,
        hasMore: summaries.length === limit,
        timestamp: new Date().toISOString(),
      },
    });

    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;

  } catch (error) {
    logger.error('Error fetching conversation summaries:', error);

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json({
        error: 'Database connection failed',
        code: 'DATABASE_ERROR',
      }, { status: 503 });
    }

    // Generic error response
    return NextResponse.json({
      error: 'Failed to fetch conversation summaries',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
