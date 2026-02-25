import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { sendEmail } from "@/lib/email"; // You would need to implement this function
import { withCronAuth } from '@/lib/api/cron-auth';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    // Verify authorization (fail-closed, uses header-based auth)
    const authResponse = withCronAuth(req);
    if (authResponse) return authResponse;
    
    // Find all tasks that have reminders set, haven't been sent yet, and are due soon
    const now = new Date();
    const tasksWithDueReminders = await db.task.findMany({
      where: {
        dueDate: {
          lte: now // Due date is now or has passed
        },
        status: {
          not: 'COMPLETED'
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      take: 500,
    });
    
    const results = [];
    const successfulTaskIds: string[] = [];

    // Process each reminder
    for (const task of tasksWithDueReminders) {
      try {
        // Based on the reminder type, send the appropriate notification
        if (task.User.email) {
          // Send email reminder
          await sendEmail({
            to: task.User.email,
            subject: `Reminder: ${task.title}`,
            text: `You have a task due on ${task.dueDate?.toLocaleDateString() || 'soon'}: ${task.title}${task.description ? `\n\n${task.description}` : ''}`,
            html: `
              <h2>Task Reminder</h2>
              <p>You have a task due on <strong>${task.dueDate?.toLocaleDateString() || 'soon'}</strong>:</p>
              <h3>${task.title}</h3>
              ${task.description ? `<p>${task.description}</p>` : ''}
              <p>Priority: ${task.priority}</p>
              <p>Status: ${task.status}</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/profile">View in your dashboard</a></p>
            `
          });
        }

        // Collect successfully sent task IDs for batch update
        successfulTaskIds.push(task.id);

        // Record successful processing
        results.push({
          taskId: task.id,
          userId: task.userId,
          reminderType: "email",
          status: "sent"
        });
      } catch (error) {
        logger.error(`Error processing reminder for task ${task.id}:`, error);
        results.push({
          taskId: task.id,
          userId: task.userId,
          reminderType: "email",
          status: "error",
          error: (error as Error).message
        });
      }
    }

    // Batch update all successfully sent tasks in a single query (eliminates N+1)
    if (successfulTaskIds.length > 0) {
      await db.task.updateMany({
        where: { id: { in: successfulTaskIds } },
        data: { updatedAt: new Date() }
      });
    }

    return NextResponse.json({
      processed: tasksWithDueReminders.length,
      results
    });
  } catch (error) {
    logger.error("[TASK_REMINDERS_CRON]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 