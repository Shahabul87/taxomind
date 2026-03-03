import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { successResponse, apiErrors } from "@/lib/utils/api-response";

const CollaborationMessageSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  message: z.object({
    content: z.string().min(1, "Message content is required").max(10000),
    type: z.string().optional().default("text"),
    isPrivate: z.boolean().optional().default(false),
    replyTo: z.string().optional().nullable(),
  }),
});

interface CollaborationParticipant {
  userId?: string;
  id?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiErrors.unauthorized();
    }

    const body = await req.json();
    const result = CollaborationMessageSchema.safeParse(body);

    if (!result.success) {
      return apiErrors.validationError({ errors: result.error.flatten().fieldErrors });
    }

    const { sessionId, message } = result.data;

    // Verify user is participant in the session
    const collaborationSession = await db.collaborationSession.findUnique({
      where: { sessionId },
    });

    if (!collaborationSession) {
      return apiErrors.notFound("Session");
    }

    // Check if user is in participants JSON array
    const participants = collaborationSession.participants as CollaborationParticipant[];
    const isParticipant = participants?.some(
      (p: CollaborationParticipant) => p.userId === session.user.id || p.id === session.user.id
    );

    if (!isParticipant) {
      return apiErrors.forbidden("Not a participant in this session");
    }

    // Create chat message (mock implementation - table doesn't exist)
    const chatMessage = {
      id: `msg_${Date.now()}`,
      sessionId,
      userId: session.user.id,
      content: message.content,
      type: message.type || "text",
      isPrivate: message.isPrivate || false,
      replyToId: message.replyTo || null,
      createdAt: new Date(),
      user: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
      },
      replyTo: null,
    };

    // TODO: Store in collaboration session metadata or create message table

    // TODO: Update participant activity in collaboration session
    // Need to update the participants JSON in collaborationSession

    return successResponse({
      id: chatMessage.id,
      userId: chatMessage.user.id,
      userName: chatMessage.user.name,
      userAvatar: chatMessage.user.image,
      content: chatMessage.content,
      type: chatMessage.type,
      timestamp: chatMessage.createdAt,
      isPrivate: chatMessage.isPrivate,
      replyTo: null, // Mock implementation - no reply support yet
    });
  } catch (error) {
    logger.error("Error sending collaboration message:", error);
    return apiErrors.internal("Failed to send message");
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiErrors.unauthorized();
    }

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!sessionId) {
      return apiErrors.badRequest("Missing session ID");
    }

    // Verify user is participant in the session
    const collaborationSession = await db.collaborationSession.findUnique({
      where: { sessionId },
    });

    if (!collaborationSession) {
      return apiErrors.notFound("Session");
    }

    // Check if user is in participants JSON array
    const participants = collaborationSession.participants as CollaborationParticipant[];
    const isParticipant = participants?.some(
      (p: CollaborationParticipant) => p.userId === session.user.id || p.id === session.user.id
    );

    if (!isParticipant) {
      return apiErrors.forbidden("Not a participant in this session");
    }

    // Get chat messages (mock implementation - table doesn't exist)
    const messages: Record<string, unknown>[] = [];

    // TODO: Implement message retrieval
    /* await db.collaborationMessage.findMany({
      where: {
        sessionId,
        OR: [
          { isPrivate: false },
          { userId: session.user.id },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      skip: offset,
      take: limit,
    }); */

    const formattedMessages = messages; // Return empty array for now

    return successResponse(formattedMessages);
  } catch (error) {
    logger.error("Error fetching collaboration messages:", error);
    return apiErrors.internal("Failed to fetch messages");
  }
}