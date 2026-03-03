import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';
import { db } from "@/lib/db";
import { z } from 'zod';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const UploadAttachmentSchema = z.object({
  messageId: z.string(),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number().max(MAX_FILE_SIZE),
});

// TODO: MessageAttachment model needs to be added to Prisma schema
// Currently disabled until the model is implemented

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = UploadAttachmentSchema.parse(body);

    // TODO: Implement once MessageAttachment model is added to schema
    return NextResponse.json(
      { error: "Message attachments feature not yet implemented" },
      { status: 501 }
    );

    /* Original implementation - commented out until MessageAttachment model exists
    // Verify the message belongs to the user
    const message = await db.message.findFirst({
      where: {
        id: validatedData.messageId,
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id },
        ],
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
    }

    const attachment = await db.messageAttachment.create({
      data: {
        messageId: validatedData.messageId,
        fileName: validatedData.fileName,
        fileUrl: validatedData.fileUrl,
        fileType: validatedData.fileType,
        fileSize: validatedData.fileSize,
      },
    });

    return NextResponse.json(attachment);
    */
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("[MESSAGE_UPLOAD]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get attachments for a message
export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: "messageId is required" },
        { status: 400 }
      );
    }

    // TODO: Implement once MessageAttachment model is added to schema
    return NextResponse.json(
      { error: "Message attachments feature not yet implemented" },
      { status: 501 }
    );

    /* Original implementation - commented out until MessageAttachment model exists
    // Verify the message belongs to the user
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id },
        ],
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
    }

    const attachments = await db.messageAttachment.findMany({
      where: {
        messageId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(attachments);
    */
  } catch (error) {
    logger.error("[MESSAGE_ATTACHMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
