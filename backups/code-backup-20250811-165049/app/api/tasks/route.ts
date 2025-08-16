import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';

// GET endpoint to retrieve all tasks for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const tasks = await db.task.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    logger.error("[TASKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST endpoint to create a new task
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { 
      title, 
      description, 
      startTime,
      dueDate, 
      priority, 
      category, 
      hasReminder, 
      reminderDate, 
      reminderType 
    } = body;
    
    // Validation
    if (!title || !dueDate || !priority || !category) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Additional validation for reminder
    if (hasReminder && (!reminderDate || !reminderType)) {
      return new NextResponse("Reminder date and type are required when setting a reminder", { status: 400 });
    }
    
    const task = await db.task.create({
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : null,
        dueDate: new Date(dueDate),
        priority,
        category,
        hasReminder: hasReminder || false,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        reminderType,
        userId: session.user.id
      }
    });
    
    return NextResponse.json(task);
  } catch (error) {
    logger.error("[TASKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Route handler for individual task operations
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    
    if (!taskId) {
      return new NextResponse("Task ID is required", { status: 400 });
    }
    
    // Check if the task belongs to the user
    const task = await db.task.findUnique({
      where: {
        id: taskId
      }
    });
    
    if (!task || task.userId !== session.user.id) {
      return new NextResponse("Unauthorized or task not found", { status: 404 });
    }
    
    await db.task.delete({
      where: {
        id: taskId
      }
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("[TASKS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH endpoint to update a task
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { 
      id,
      title, 
      description, 
      startTime,
      dueDate, 
      priority, 
      category, 
      completed,
      hasReminder, 
      reminderDate, 
      reminderType,
      reminderSent
    } = body;
    
    if (!id) {
      return new NextResponse("Task ID is required", { status: 400 });
    }
    
    // Check if the task belongs to the user
    const existingTask = await db.task.findUnique({
      where: {
        id
      }
    });
    
    if (!existingTask || existingTask.userId !== session.user.id) {
      return new NextResponse("Unauthorized or task not found", { status: 404 });
    }
    
    // Update the task
    const updatedTask = await db.task.update({
      where: {
        id
      },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        startTime: startTime !== undefined ? new Date(startTime) : undefined,
        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
        priority: priority !== undefined ? priority : undefined,
        category: category !== undefined ? category : undefined,
        completed: completed !== undefined ? completed : undefined,
        hasReminder: hasReminder !== undefined ? hasReminder : undefined,
        reminderDate: reminderDate !== undefined ? new Date(reminderDate) : undefined,
        reminderType: reminderType !== undefined ? reminderType : undefined,
        reminderSent: reminderSent !== undefined ? reminderSent : undefined
      }
    });
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    logger.error("[TASKS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 