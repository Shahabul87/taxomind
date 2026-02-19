import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { ContentType } from '@prisma/client';

type CollaboratorRole = 'owner' | 'editor' | 'viewer';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  role: CollaboratorRole;
  isOnline: boolean;
  isActive: boolean;
  lastSeen?: string;
}

interface SharedResource {
  id: string;
  name: string;
  type: 'document' | 'whiteboard' | 'presentation' | 'code';
  lastModified: string;
  modifiedBy: string;
  version: number;
  collaborators: number;
}

interface CollaborativeTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  target: string;
  timestamp: string;
}

interface CollaborationSessionResponse {
  id: string;
  name: string;
  description: string;
  collaborators: Collaborator[];
  resources: SharedResource[];
  tasks: CollaborativeTask[];
  activities: ActivityItem[];
  createdAt: string;
  isLive: boolean;
}

const CollaborationQuerySchema = z.object({
  action: z.enum(['get-session']),
  sessionId: z.string().optional(),
});

function toRole(value?: string | null): CollaboratorRole {
  if (value === 'owner' || value === 'editor' || value === 'viewer') {
    return value;
  }
  return 'viewer';
}

function normalizeResources(payload: unknown): SharedResource[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const resource = item as Partial<SharedResource>;
      return {
        id: resource.id ?? `resource-${crypto.randomUUID()}`,
        name: resource.name ?? 'Shared Resource',
        type: resource.type ?? 'document',
        lastModified: resource.lastModified ?? new Date().toISOString(),
        modifiedBy: resource.modifiedBy ?? 'system',
        version: resource.version ?? 1,
        collaborators: resource.collaborators ?? 0,
      };
    });
}

function normalizeTasks(payload: unknown): CollaborativeTask[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const task = item as Partial<CollaborativeTask>;
      return {
        id: task.id ?? `task-${crypto.randomUUID()}`,
        title: task.title ?? 'Task',
        description: task.description,
        status: task.status ?? 'todo',
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        dueDate: task.dueDate,
        priority: task.priority ?? 'medium',
      };
    });
}

function normalizeActivities(payload: unknown): ActivityItem[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const activity = item as Partial<ActivityItem>;
      return {
        id: activity.id ?? `activity-${crypto.randomUUID()}`,
        userId: activity.userId ?? 'system',
        userName: activity.userName ?? 'System',
        userAvatar: activity.userAvatar,
        action: activity.action ?? 'updated',
        target: activity.target ?? 'session',
        timestamp: activity.timestamp ?? new Date().toISOString(),
      };
    });
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = CollaborationQuerySchema.parse({
      action: searchParams.get('action'),
      sessionId: searchParams.get('sessionId') ?? undefined,
    });

    if (query.action !== 'get-session') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    if (!query.sessionId) {
      return NextResponse.json({
        success: true,
        data: { session: null },
      });
    }

    const sessionRecord = await db.collaborationSession.findUnique({
      where: { sessionId: query.sessionId },
      include: {
        CollaborationParticipant: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!sessionRecord) {
      return NextResponse.json({
        success: true,
        data: { session: null },
      });
    }

    const collaborators: Collaborator[] = (sessionRecord.CollaborationParticipant ?? []).map((participant) => ({
      id: participant.userId,
      name: participant.user?.name ?? 'Collaborator',
      avatar: participant.user?.image ?? undefined,
      role: toRole(participant.role),
      isOnline: participant.isActive,
      isActive: participant.isActive,
      lastSeen: participant.lastActivity?.toISOString(),
    }));

    const sessionData = sessionRecord.sessionData as Record<string, unknown> | null;
    const resources = normalizeResources(sessionData?.resources);
    const tasks = normalizeTasks(sessionData?.tasks);
    const activities = normalizeActivities(sessionRecord.activities);

    const response: CollaborationSessionResponse = {
      id: sessionRecord.sessionId,
      name: (sessionData?.name as string) ?? (sessionRecord.sessionType ?? 'Collaboration Session'),
      description:
        (sessionData?.description as string) ??
        `Live collaboration on ${sessionRecord.contentType.toLowerCase()}`,
      collaborators,
      resources,
      tasks,
      activities,
      createdAt: sessionRecord.startedAt.toISOString(),
      isLive: sessionRecord.isActive,
    };

    return NextResponse.json({
      success: true,
      data: { session: response },
    });
  } catch (error) {
    logger.error('[SAM Collaboration] Failed to load session', { error });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to load collaboration session' }, { status: 500 });
  }
}

// POST action schemas
const CreateSessionSchema = z.object({
  action: z.literal('create'),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  contentType: z.enum(['COURSE', 'CHAPTER', 'SECTION', 'DOCUMENT', 'OTHER']),
  contentId: z.string(),
  sessionType: z.string().optional(),
});

const JoinSessionSchema = z.object({
  action: z.literal('join'),
  sessionId: z.string(),
});

const LeaveSessionSchema = z.object({
  action: z.literal('leave'),
  sessionId: z.string(),
});

const RecordActivitySchema = z.object({
  action: z.literal('record'),
  sessionId: z.string(),
  activityType: z.string(),
  target: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const CollaborationActionSchema = z.discriminatedUnion('action', [
  CreateSessionSchema,
  JoinSessionSchema,
  LeaveSessionSchema,
  RecordActivitySchema,
]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const action = CollaborationActionSchema.parse(body);

    switch (action.action) {
      case 'create': {
        const sessionId = crypto.randomUUID();
        const collaborationSession = await db.collaborationSession.create({
          data: {
            sessionId,
            contentType: action.contentType as ContentType,
            contentId: action.contentId,
            sessionType: action.sessionType ?? 'general',
            isActive: true,
            startedAt: new Date(),
            participants: {},
            activeParticipants: {},
            sessionData: {
              name: action.name,
              description: action.description ?? '',
              resources: [],
              tasks: [],
            },
            activities: [],
            CollaborationParticipant: {
              create: {
                id: crypto.randomUUID(),
                userId: session.user.id,
                role: 'owner',
                isActive: true,
                joinedAt: new Date(),
                lastActivity: new Date(),
              },
            },
          },
          include: {
            CollaborationParticipant: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        });

        const participants = (collaborationSession as { CollaborationParticipant: Array<{ userId: string; user?: { name: string | null; image: string | null } | null; role: string; isActive: boolean; lastActivity: Date | null }> }).CollaborationParticipant ?? [];
        const collaborators: Collaborator[] = participants.map((p) => ({
          id: p.userId,
          name: p.user?.name ?? 'Collaborator',
          avatar: p.user?.image ?? undefined,
          role: toRole(p.role),
          isOnline: p.isActive,
          isActive: p.isActive,
          lastSeen: p.lastActivity?.toISOString(),
        }));

        return NextResponse.json({
          success: true,
          data: {
            session: {
              id: collaborationSession.sessionId,
              name: action.name,
              description: action.description ?? '',
              collaborators,
              resources: [],
              tasks: [],
              activities: [],
              createdAt: collaborationSession.startedAt.toISOString(),
              isLive: true,
            },
          },
        });
      }

      case 'join': {
        // Check if session exists
        const existingSession = await db.collaborationSession.findUnique({
          where: { sessionId: action.sessionId },
        });

        if (!existingSession) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (!existingSession.isActive) {
          return NextResponse.json({ error: 'Session is no longer active' }, { status: 400 });
        }

        // Check if already a participant
        const existingParticipant = await db.collaborationParticipant.findFirst({
          where: {
            sessionId: action.sessionId,
            userId: session.user.id,
          },
        });

        if (existingParticipant) {
          // Update activity
          await db.collaborationParticipant.update({
            where: { id: existingParticipant.id },
            data: {
              isActive: true,
              lastActivity: new Date(),
            },
          });
          return NextResponse.json({
            success: true,
            data: { joined: true, message: 'Rejoined session' },
          });
        }

        // Create new participant
        await db.collaborationParticipant.create({
          data: {
            id: crypto.randomUUID(),
            sessionId: action.sessionId,
            userId: session.user.id,
            role: 'viewer',
            isActive: true,
            joinedAt: new Date(),
            lastActivity: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          data: { joined: true, message: 'Joined session' },
        });
      }

      case 'leave': {
        const participant = await db.collaborationParticipant.findFirst({
          where: {
            sessionId: action.sessionId,
            userId: session.user.id,
          },
        });

        if (!participant) {
          return NextResponse.json({ error: 'Not a participant' }, { status: 400 });
        }

        await db.collaborationParticipant.update({
          where: { id: participant.id },
          data: {
            isActive: false,
            lastActivity: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          data: { left: true },
        });
      }

      case 'record': {
        // Verify user is a participant
        const participant = await db.collaborationParticipant.findFirst({
          where: {
            sessionId: action.sessionId,
            userId: session.user.id,
          },
        });

        if (!participant) {
          return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }

        // Get current session
        const currentSession = await db.collaborationSession.findUnique({
          where: { sessionId: action.sessionId },
        });

        if (!currentSession) {
          return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Get user info for activity
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, image: true },
        });

        const currentActivities = Array.isArray(currentSession.activities)
          ? currentSession.activities
          : [];

        const newActivity: ActivityItem = {
          id: crypto.randomUUID(),
          userId: session.user.id,
          userName: user?.name ?? 'User',
          userAvatar: user?.image ?? undefined,
          action: action.activityType,
          target: action.target,
          timestamp: new Date().toISOString(),
        };

        // Add activity to session
        await db.collaborationSession.update({
          where: { sessionId: action.sessionId },
          data: {
            activities: [...currentActivities, newActivity],
          },
        });

        // Update participant last activity
        await db.collaborationParticipant.update({
          where: { id: participant.id },
          data: { lastActivity: new Date() },
        });

        return NextResponse.json({
          success: true,
          data: { recorded: true, activity: newActivity },
        });
      }
    }
  } catch (error) {
    logger.error('[SAM Collaboration] Failed to process action', { error });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
