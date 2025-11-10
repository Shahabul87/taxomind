import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for creating notifications
const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  content: z.string().optional(),
  type: z.string().optional(),
  notificationType: z.enum([
    "NEW_MESSAGE",
    "MESSAGE_REPLY",
    "URGENT_MESSAGE",
    "ASSIGNMENT_REMINDER",
    "COURSE_UPDATE",
  ]).optional(),
  messageId: z.string().optional(),
  link: z.string().optional(),
  eventId: z.string().optional(), // For event notifications
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Handle event notifications (legacy support)
    if (body.eventId) {
      const event = await db.groupEvent.findUnique({
        where: { id: body.eventId },
        include: {
          User_GroupEvent_creatorIdToUser: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              image: true,
              role: true,
              isTwoFactorEnabled: true,
              phone: true,
            }
          },
          User_GroupEvent_organizerIdToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
      });

      if (!event) {
        return new NextResponse("Event not found", { status: 404 });
      }

      // Send email notification to both creator and organizer if they exist
      const recipients = [
        event.User_GroupEvent_creatorIdToUser?.email,
        event.User_GroupEvent_organizerIdToUser?.email
      ].filter(Boolean) as string[];

      if (recipients.length > 0) {
        await resend.emails.send({
          from: 'notifications@yourdomain.com',
          to: recipients,
          subject: `Reminder: ${event.title}`,
          html: `
            <h2>Event Reminder</h2>
            <p>Your event "${event.title}" is starting soon.</p>
            <p>Time: ${event.startTime}</p>
            ${event.location ? `<p>Location: ${event.location}</p>` : ''}
            ${event.isOnline && event.meetingUrl ? `<p>Meeting URL: ${event.meetingUrl}</p>` : ''}
          `,
        });
      }

      return NextResponse.json({ success: true });
    }

    // Handle message notifications (new)
    const validatedData = CreateNotificationSchema.parse(body);

    // If messageId is provided, verify the message exists and user has access
    if (validatedData.messageId) {
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
        return NextResponse.json(
          { error: "Message not found or access denied" },
          { status: 404 }
        );
      }
    }

    const notification = await db.notification.create({
      data: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type || "info",
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("[NOTIFICATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get unread count
    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    logger.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { notificationId, notificationIds, markAllAsRead } = body;

    // Mark all notifications as read
    if (markAllAsRead) {
      await db.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      });
    }

    // Mark multiple specific notifications as read
    if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json({
        success: true,
        marked: notificationIds.length
      });
    }

    // Mark single notification as read (legacy support)
    if (notificationId) {
      const notification = await db.notification.update({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
        data: {
          read: true,
        },
      });

      return NextResponse.json(notification);
    }

    return NextResponse.json(
      { error: "Missing notificationId, notificationIds, or markAllAsRead" },
      { status: 400 }
    );
  } catch (error) {
    logger.error("[NOTIFICATION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[NOTIFICATIONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 